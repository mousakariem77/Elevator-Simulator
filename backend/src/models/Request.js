const { v4: uuidv4 } = require('uuid');

/**
 * Represents a single elevator call request made by a passenger.
 * Encapsulates all state and transitions of a request lifecycle.
 */
class Request {
  // Valid status values
  static STATUS = {
    PENDING:   'pending',   // Waiting to be assigned to an elevator
    ASSIGNED:  'assigned',  // Assigned to an elevator, elevator en route
    BOARDED:   'boarded',   // Passenger boarded, destination selected
    COMPLETED: 'completed', // Passenger reached destination
  };

  /**
   * @param {number} floor      - The floor the passenger is calling from (1–10)
   * @param {string} direction  - 'up' or 'down'
   */
  constructor(floor, direction) {
    this._id              = uuidv4();
    this._floor           = floor;
    this._direction       = direction;
    this._destinationFloor = null;
    this._status          = Request.STATUS.PENDING;
    this._assignedElevatorId = null;
    this._timestamp       = Date.now();
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get id()                { return this._id; }
  get floor()             { return this._floor; }
  get direction()         { return this._direction; }
  get destinationFloor()  { return this._destinationFloor; }
  get status()            { return this._status; }
  get assignedElevatorId(){ return this._assignedElevatorId; }
  get timestamp()         { return this._timestamp; }

  // ─── State Transitions ───────────────────────────────────────────────────────

  /**
   * Assign this request to a specific elevator.
   * @param {number} elevatorId
   */
  assign(elevatorId) {
    this._assignedElevatorId = elevatorId;
    this._status = Request.STATUS.ASSIGNED;
  }

  /**
   * Passenger has boarded; set their destination floor.
   * @param {number} floor - Target floor (1–10)
   */
  setDestination(floor) {
    if (floor === this._floor) {
      throw new Error('Destination cannot be the same as origin floor.');
    }
    this._destinationFloor = floor;
    this._status = Request.STATUS.BOARDED;
  }

  /**
   * Mark the request as completed (passenger reached destination).
   */
  complete() {
    this._status = Request.STATUS.COMPLETED;
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  isPending()   { return this._status === Request.STATUS.PENDING; }
  isAssigned()  { return this._status === Request.STATUS.ASSIGNED; }
  isBoarded()   { return this._status === Request.STATUS.BOARDED; }
  isCompleted() { return this._status === Request.STATUS.COMPLETED; }

  /**
   * Serialize to a plain object for Socket.io emission.
   */
  toJSON() {
    return {
      id:                this._id,
      floor:             this._floor,
      direction:         this._direction,
      destinationFloor:  this._destinationFloor,
      status:            this._status,
      assignedElevatorId: this._assignedElevatorId,
      timestamp:         this._timestamp,
    };
  }
}

module.exports = Request;
