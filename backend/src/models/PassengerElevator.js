const Elevator = require('./Elevator');

/**
 * PassengerElevator - Subclass of Elevator demonstrating Inheritance and Polymorphism.
 *
 * OOP Principles applied:
 *  - Inheritance  : Inherits core elevator mechanics, movement logic, and door control from Elevator.
 *  - Polymorphism: Overrides getState() and describe() to provide passenger-specific metadata.
 *  - Encapsulation: Maintains private passenger capacity limits.
 */
class PassengerElevator extends Elevator {
  /**
   * @param {number} id          - Elevator ID
   * @param {number} startFloor  - Initial floor position (default: 1)
   * @param {number} maxCapacity - Maximum passenger capacity (default: 8)
   */
  constructor(id, startFloor = 1, maxCapacity = 8) {
    super(id, startFloor);
    this._maxCapacity = maxCapacity;
  }

  /**
   * Get maximum passenger capacity.
   * @returns {number}
   */
  get maxCapacity() {
    return this._maxCapacity;
  }

  /**
   * Returns elevator type identifier.
   * Demonstrates polymorphic behavior when queried across different elevator types.
   * @returns {string}
   */
  getType() {
    return 'passenger';
  }

  /**
   * Polymorphic override of getState() to include passenger elevator specific attributes.
   * @returns {object}
   */
  getState() {
    return {
      ...super.getState(),
      type: this.getType(),
      maxCapacity: this._maxCapacity,
    };
  }

  /**
   * Describe elevator configuration.
   * @returns {string}
   */
  describe() {
    return `Passenger Elevator #${this.id} (Capacity: ${this._maxCapacity}, Floor: ${this.currentFloor}, Status: ${this.status})`;
  }
}

module.exports = PassengerElevator;
