const Elevator          = require('./Elevator');
const PassengerElevator = require('./PassengerElevator');
const Request           = require('./Request');

/**
 * ElevatorSystem — Manager / Dispatcher class.
 *
 * Responsibilities:
 *  1. Own and orchestrate all Elevator instances.
 *  2. Dispatch incoming requests to the optimal elevator (dispatch algorithm).
 *  3. Drive the simulation clock via tick().
 *  4. Manage the full request lifecycle.
 *
 * OOP Principles applied:
 *  - Single Responsibility : Only manages elevator coordination, not movement details.
 *  - Encapsulation         : Elevators & requests are private; accessed via public API.
 *  - Inheritance & Poly    : Owns PassengerElevator instances extending Elevator base class.
 */
class ElevatorSystem {
  static ELEVATOR_COUNT = 3;
  static MIN_FLOOR      = 1;
  static MAX_FLOOR      = 10;

  constructor() {
    // Initialize 3 passenger elevators starting at floor 1
    this._elevators = Array.from(
      { length: ElevatorSystem.ELEVATOR_COUNT },
      (_, i) => new PassengerElevator(i + 1, 1)
    );

    // All requests ever made (map: id → Request)
    this._requests = new Map();

    // Pending requests waiting to be assigned (no elevator available yet)
    this._pendingQueue = [];

    // Round-robin index: when multiple idle elevators have equal cost,
    // rotate which one gets chosen first to distribute load evenly.
    this._lastDispatchedId = 0;
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Process a new call request from a passenger at a floor.
   * Dispatches to the best elevator or queues if all are busy.
   *
   * @param {number} floor     - Floor the passenger is calling from
   * @param {string} direction - 'up' | 'down'
   * @returns {Request}
   */
  callElevator(floor, direction) {
    const request = new Request(floor, direction);
    this._requests.set(request.id, request);

    const assigned = this._dispatch(request);
    if (!assigned) {
      // All elevators busy in opposite direction — add to pending queue
      this._pendingQueue.push(request);
    }

    return request;
  }

  /**
   * Process a call directly targeted at a specific elevator (e.g. external button beside that elevator).
   *
   * @param {number} elevatorId - Target elevator ID (1, 2, 3)
   * @param {number} floor      - Floor the passenger is calling from
   * @param {string} direction  - 'up' | 'down'
   * @returns {Request|null}
   */
  callElevatorCar(elevatorId, floor, direction) {
    const elevator = this._getElevator(elevatorId);
    if (!elevator) return null;

    const request = new Request(floor, direction);
    this._requests.set(request.id, request);
    request.assign(elevator.id);

    elevator.addStop(floor, 'pickup', request.id);
    elevator.trackRequest(request.id);

    return request;
  }

  /**
   * Set the destination floor for a passenger who has boarded an elevator.
   *
   * @param {number} elevatorId       - The elevator ID (1, 2, 3)
   * @param {string} requestId        - The request ID
   * @param {number} destinationFloor - Target floor
   * @returns {boolean} success
   */
  setDestination(elevatorId, requestId, destinationFloor) {
    const elevator = this._getElevator(elevatorId);
    const request  = this._requests.get(requestId);

    if (!elevator || !request) return false;
    if (!request.isBoarded() && !request.isAssigned()) return false;

    request.setDestination(destinationFloor);
    elevator.addStop(destinationFloor, 'dropoff', requestId);

    return true;
  }

  /**
   * Directly send an elevator to a target floor (In-cabin control or manual test).
   * @param {number} elevatorId
   * @param {number} targetFloor
   * @returns {boolean} success
   */
  sendElevatorToFloor(elevatorId, targetFloor) {
    const elevator = this._getElevator(elevatorId);
    if (!elevator) return false;
    elevator.addStop(targetFloor, 'dropoff');
    return true;
  }

  /**
   * Open a specific elevator's door (hold open).
   * @param {number} elevatorId
   */
  openDoor(elevatorId) {
    const elevator = this._getElevator(elevatorId);
    if (elevator) elevator.holdDoor();
  }

  /**
   * Close a specific elevator's door immediately.
   * @param {number} elevatorId
   */
  closeDoor(elevatorId) {
    const elevator = this._getElevator(elevatorId);
    if (elevator) elevator.closeDoor();
  }

  /**
   * Advance the simulation by one tick.
   * Moves all elevators, processes arrivals, retries pending queue.
   *
   * @returns {Array} list of events that occurred this tick
   */
  tick() {
    const events = [];

    for (const elevator of this._elevators) {
      const arrival = elevator.tick();

      if (arrival) {
        const event = this._handleArrival(elevator, arrival);
        if (event) events.push(event);
      }
    }

    // Retry pending queue — maybe an elevator is now available
    this._retryPendingQueue();

    return events;
  }

  /**
   * Get a snapshot of the full system state.
   * @returns {object}
   */
  getSystemState() {
    return {
      elevators: this._elevators.map(e => e.getState()),
      pendingQueue: this._pendingQueue.map(r => r.toJSON()),
      timestamp: Date.now(),
    };
  }

  /**
   * Get a specific request by ID.
   * @param {string} requestId
   * @returns {Request|undefined}
   */
  getRequest(requestId) {
    return this._requests.get(requestId);
  }

  // ─── Dispatch Algorithm ───────────────────────────────────────────────────────

  /**
   * Find the best elevator for a request using a 3-tier priority system:
   *
   * Priority 1 — Non-idle elevator already moving in SAME direction that
   *              will pass through the requested floor (SCAN algorithm).
   *              Only matches elevators currently MOVING — not idle ones.
   * Priority 2 — Nearest IDLE elevator.
   * Priority 3 — Any elevator with lowest detour cost (all busy edge case).
   *
   * KEY FIX: Idle elevators do NOT compete in Priority 1.
   * Previously isGoingToward() returned true for idle elevators,
   * causing Elevator 1 to always win (first in array, equal cost).
   *
   * @param {Request} request
   * @returns {Elevator|null} assigned elevator, or null if none suitable
   */
  _dispatch(request) {
    const { floor, direction } = request;

    // Rotate candidate order starting after _lastDispatchedId
    // This guarantees fair round-robin distribution when elevators have equal cost
    const startIdx = this._elevators.findIndex(e => e.id > this._lastDispatchedId);
    const ordered = startIdx === -1
      ? this._elevators
      : [...this._elevators.slice(startIdx), ...this._elevators.slice(0, startIdx)];

    let bestElevator = null;
    let bestCost     = Infinity;

    for (const elevator of ordered) {
      const cost = elevator.costToServe(floor, direction);
      if (cost < bestCost) {
        bestCost     = cost;
        bestElevator = elevator;
      }
    }

    if (bestElevator) {
      request.assign(bestElevator.id);
      bestElevator.addStop(floor, 'pickup', request.id);
      bestElevator.trackRequest(request.id);
      this._lastDispatchedId = bestElevator.id; // update round-robin pointer
    }

    return bestElevator;
  }

  // ─── Arrival Handler ─────────────────────────────────────────────────────────

  /**
   * Handle what happens when an elevator arrives at a stop.
   *
   * @param {Elevator} elevator
   * @param {object}   stop     - { floor, type, requestId }
   * @returns {object|null}     - event object for Socket.io
   */
  _handleArrival(elevator, stop) {
    if (stop.type === 'pickup') {
      const request = this._requests.get(stop.requestId);
      if (request && request.isAssigned()) {
        request.assign(elevator.id); // keep assigned status; destination TBD
        // Emit event so frontend shows destination selector
        return {
          type:      'pickup',
          elevatorId: elevator.id,
          floor:     stop.floor,
          requestId: stop.requestId,
        };
      }
    }

    if (stop.type === 'dropoff') {
      const request = this._requests.get(stop.requestId);
      if (request && request.isBoarded()) {
        request.complete();
        elevator.untrackRequest(stop.requestId);
        return {
          type:       'dropoff',
          elevatorId: elevator.id,
          floor:      stop.floor,
          requestId:  stop.requestId,
        };
      }
    }

    return null;
  }

  // ─── Pending Queue ────────────────────────────────────────────────────────────

  /**
   * Attempt to dispatch any requests sitting in the pending queue.
   * Called after every tick so we don't miss a newly-idle elevator.
   */
  _retryPendingQueue() {
    const stillPending = [];
    for (const request of this._pendingQueue) {
      if (request.isPending()) {
        const assigned = this._dispatch(request);
        if (!assigned) {
          stillPending.push(request);
        }
      }
    }
    this._pendingQueue = stillPending;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Get an elevator by ID (1-based).
   * @param {number} id
   * @returns {Elevator|null}
   */
  _getElevator(id) {
    return this._elevators.find(e => e.id === id) || null;
  }
}

module.exports = ElevatorSystem;
