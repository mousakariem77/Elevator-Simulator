/**
 * DestinationPanel — Shown when an elevator arrives at a pickup floor.
 * Allows the passenger to select their destination floor.
 *
 * Props:
 *   elevatorId   {number}   - ID of the elevator
 *   pickupFloor  {number}   - The floor the passenger boarded at
 *   requestId    {string}   - The request ID to send with the destination
 *   onSelect     {function} - (elevatorId, requestId, floor) => void
 */
export default function DestinationPanel({ elevatorId, pickupFloor, requestId, onSelect }) {
  const floors = Array.from({ length: 10 }, (_, i) => 10 - i); // 10 down to 1

  return (
    <div className="destination-panel">
      <p className="destination-title">Select destination floor</p>
      <div className="destination-grid">
        {floors.map(floor => (
          <button
            key={floor}
            className={`dest-btn ${floor === pickupFloor ? 'dest-btn--current' : ''}`}
            disabled={floor === pickupFloor}
            onClick={() => onSelect(elevatorId, requestId, floor)}
          >
            {floor}
          </button>
        ))}
      </div>
    </div>
  );
}
