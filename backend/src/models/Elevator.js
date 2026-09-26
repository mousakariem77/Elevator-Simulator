/**
 * Elevator — Core OOP class representing a single elevator unit.
 *
 * OOP Principles applied:
 *  - Encapsulation  : All internal state is private (_prefixed). Modified only via methods.
 *  - Abstraction    : Consumers call high-level methods (addStop, tick) without knowing internals.
 *  - Extensibility  : Designed to be subclassed (e.g. FreightElevator, PassengerElevator).
 */
class Elevator {
  static DIRECTION = {
    UP:   'up',
    DOWN: 'down',
    IDLE: 'idle',
  };

  static STATUS = {
    IDLE:      'idle',
    MOVING:    'moving',
    DOOR_OPEN: 'door_open',
  };

  static DOOR_STATE = {
    OPEN:   'open',
    CLOSED: 'closed',
  };

  static MIN_FLOOR = 1;
  static MAX_FLOOR = 10;

  /**
   * @param {number} id          - Unique elevator ID (1, 2, 3)
   * @param {number} startFloor  - Initial floor position (default: 1)
   */
  constructor(id, startFloor = 1) {
    this._id           = id;
    this._currentFloor = startFloor;
    this._direction    = Elevator.DIRECTION.IDLE;
    this._status       = Elevator.STATUS.IDLE;
    this._doorState    = Elevator.DOOR_STATE.CLOSED;

    // Sorted list of floors this elevator must stop at
    // Each entry: { floor: number, type: 'pickup' | 'dropoff', requestId: string }
    this._stopQueue    = [];

    // Door auto-close timer (ticks)
    this._doorOpenTicks = 0;
    this._doorHoldTicks = 3; // Door stays open for 3 ticks by default

    // Track request IDs currently being served (picked up, en route to destination)
    this._activeRequestIds = new Set();
  }

  // ─── Getters (Encapsulation) ─────────────────────────────────────────────────

  get id()           { return this._id; }
  get currentFloor() { return this._currentFloor; }
  get direction()    { return this._direction; }
  get status()       { return this._status; }
  get doorState()    { return this._doorState; }
  get stopQueue()    { return [...this._stopQueue]; }
  get isIdle()       { return this._status === Elevator.STATUS.IDLE && this._stopQueue.length === 0; }

  // ─── Public Interface ────────────────────────────────────────────────────────

  /**
   * Add a floor stop to this elevator's queue.
   * Floors are kept sorted:
   *   - If going up:   ascending order
   *   - If going down: descending order
   *   - If idle:       nearest first
   *
   * @param {number} floor
   * @param {string} type       - 'pickup' | 'dropoff'
   * @param {string} requestId
   */
  addStop(floor, type = 'dropoff', requestId = null) {
    // Prevent duplicate stops for same floor+type
    const exists = this._stopQueue.some(s => s.floor === floor && s.type === type);
    if (exists) return;

    this._stopQueue.push({ floor, type, requestId });
    this._sortQueue();

    // If elevator was idle, determine direction toward first stop
    if (this._status === Elevator.STATUS.IDLE) {
      this._setDirectionToward(this._stopQueue[0].floor);
      this._status = Elevator.STATUS.MOVING;
    }
  }

  /**
   * Called every clock tick (1 second).
   * Drives the elevator: moves one floor, handles door open/close,
   * and processes arrivals.
   *
   * @returns {object|null} arrivalInfo if elevator just arrived at a stop, else null
   */
  tick() {
    // ── Case 1: Door is open ──────────────────────────────────────────────────
    if (this._status === Elevator.STATUS.DOOR_OPEN) {
      this._doorOpenTicks++;
      if (this._doorOpenTicks >= this._doorHoldTicks) {
        this.closeDoor();
      }
      return null;
    }

    // ── Case 2: No stops — go idle ────────────────────────────────────────────
    if (this._stopQueue.length === 0) {
      this._direction = Elevator.DIRECTION.IDLE;
      this._status    = Elevator.STATUS.IDLE;
      return null;
    }

    // ── Case 3: Move one floor toward next stop ───────────────────────────────
    const nextStop = this._stopQueue[0];

    if (this._currentFloor < nextStop.floor) {
      this._currentFloor++;
      this._direction = Elevator.DIRECTION.UP;
      this._status    = Elevator.STATUS.MOVING;
    } else if (this._currentFloor > nextStop.floor) {
      this._currentFloor--;
      this._direction = Elevator.DIRECTION.DOWN;
      this._status    = Elevator.STATUS.MOVING;
    }

    // ── Case 4: Arrived at next stop ──────────────────────────────────────────
    if (this._currentFloor === nextStop.floor) {
      const arrived = this._stopQueue.shift(); // remove from queue
      this.openDoor();
      this._sortQueue(); // re-sort remaining stops
      return arrived;   // caller (ElevatorSystem) uses this to handle the event
    }

    return null;
  }

  /**
   * Open the elevator door.
   */
  openDoor() {
    this._doorState    = Elevator.DOOR_STATE.OPEN;
    this._status       = Elevator.STATUS.DOOR_OPEN;
    this._doorOpenTicks = 0;
  }

  /**
   * Close the elevator door immediately and resume movement if stops remain.
   */
  closeDoor() {
    this._doorState = Elevator.DOOR_STATE.CLOSED;
    if (this._stopQueue.length > 0) {
      this._status    = Elevator.STATUS.MOVING;
      this._setDirectionToward(this._stopQueue[0].floor);
    } else {
      this._status    = Elevator.STATUS.IDLE;
      this._direction = Elevator.DIRECTION.IDLE;
    }
    this._doorOpenTicks = 0;
  }

  /**
   * Hold the door open (resets the auto-close timer).
   */
  holdDoor() {
    if (this._status === Elevator.STATUS.DOOR_OPEN) {
      this._doorOpenTicks = 0;
    }
  }

  /**
   * Check if this elevator is traveling toward a given floor in the given direction.
   * Used by the dispatcher to apply the DIRECTION RULE:
   *   A going-up elevator will only pick up 'up' requests it hasn't passed yet.
   *   A going-down elevator will only pick up 'down' requests it hasn't passed yet.
   *
   * @param {number} floor
   * @param {string} direction - 'up' | 'down'
   * @returns {boolean}
   */
  isGoingToward(floor, direction) {
    if (this._direction === Elevator.DIRECTION.IDLE) return true;

    if (this._direction === Elevator.DIRECTION.UP && direction === 'up') {
      return floor >= this._currentFloor;
    }
    if (this._direction === Elevator.DIRECTION.DOWN && direction === 'down') {
      return floor <= this._currentFloor;
    }
    return false;
  }

  /**
   * Calculate the effective "cost" (estimated steps) to serve a new pickup request.
   * Used by the dispatcher to rank elevators.
   *
   * @param {number} floor
   * @param {string} direction
   * @returns {number} estimated ticks to reach and open door
   */
  costToServe(floor, direction) {
    const DOOR_TIME = this._doorHoldTicks;

    // 1. Idle elevator: cost is direct travel distance
    if (this.isIdle) {
      return this.distanceTo(floor);
    }

    // 2. Moving in the SAME direction
    if (this._direction === direction) {
      const isAhead = direction === Elevator.DIRECTION.UP
        ? floor >= this._currentFloor
        : floor <= this._currentFloor;

      if (isAhead) {
        // Stops scheduled before the target floor
        const stopsBefore = this._stopQueue.filter(s =>
          direction === Elevator.DIRECTION.UP
            ? s.floor >= this._currentFloor && s.floor < floor
            : s.floor <= this._currentFloor && s.floor > floor
        ).length;

        // Furthest scheduled stop in current run
        const furthest = this._stopQueue.reduce(
          (acc, s) => direction === Elevator.DIRECTION.UP ? Math.max(acc, s.floor) : Math.min(acc, s.floor),
          this._currentFloor
        );
        const isOnWay = direction === Elevator.DIRECTION.UP ? floor <= furthest : floor >= furthest;

        // Bonus if strictly on the way to an existing stop and not heavily queued
        const bonus = (isOnWay && this._stopQueue.length <= 2) ? -2 : 0;

        return Math.abs(floor - this._currentFloor) + (stopsBefore * DOOR_TIME) + bonus;
      }
    }

    // 3. Moving opposite or floor is already behind elevator:
    // Must finish current trip to furthest stop, turn around, and travel to target floor
    const furthest = this._stopQueue.length > 0
      ? this._stopQueue[this._stopQueue.length - 1].floor
      : this._currentFloor;

    const remainingCurrentRun = Math.abs(furthest - this._currentFloor);
    const returnTrip          = Math.abs(furthest - floor);
    const totalStopsDelay     = this._stopQueue.length * DOOR_TIME;
    const OPPOSITE_PENALTY    = 20;

    return remainingCurrentRun + returnTrip + totalStopsDelay + OPPOSITE_PENALTY;
  }

  /**
   * Distance in floors from current position.
   * @param {number} floor
   * @returns {number}
   */
  distanceTo(floor) {
    return Math.abs(this._currentFloor - floor);
  }

  /**
   * Register a request ID as being actively served by this elevator.
   * @param {string} requestId
   */
  trackRequest(requestId) {
    this._activeRequestIds.add(requestId);
  }

  /**
   * Unregister a request ID when completed.
   * @param {string} requestId
   */
  untrackRequest(requestId) {
    this._activeRequestIds.delete(requestId);
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  /**
   * Serialize elevator state for Socket.io emission.
   * @returns {object}
   */
  getState() {
    return {
      id:           this._id,
      currentFloor: this._currentFloor,
      direction:    this._direction,
      status:       this._status,
      doorState:    this._doorState,
      stopQueue:    [...this._stopQueue],
      activeRequests: [...this._activeRequestIds],
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Set direction toward a target floor.
   * @param {number} targetFloor
   */
  _setDirectionToward(targetFloor) {
    if (targetFloor > this._currentFloor) {
      this._direction = Elevator.DIRECTION.UP;
    } else if (targetFloor < this._currentFloor) {
      this._direction = Elevator.DIRECTION.DOWN;
    } else {
      this._direction = Elevator.DIRECTION.IDLE;
    }
  }

  /**
   * Sort the stop queue based on current direction (SCAN algorithm).
   * Going UP  → sort ascending (lowest first)
   * Going DOWN → sort descending (highest first)
   * IDLE       → sort by distance to current floor
   */
  _sortQueue() {
    if (this._direction === Elevator.DIRECTION.UP) {
      this._stopQueue.sort((a, b) => a.floor - b.floor);
    } else if (this._direction === Elevator.DIRECTION.DOWN) {
      this._stopQueue.sort((a, b) => b.floor - a.floor);
    } else {
      // IDLE: nearest first
      this._stopQueue.sort(
        (a, b) =>
          Math.abs(a.floor - this._currentFloor) -
          Math.abs(b.floor - this._currentFloor)
      );
    }
  }
}

module.exports = Elevator;
