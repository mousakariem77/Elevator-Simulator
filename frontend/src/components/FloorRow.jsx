/**
 * FloorRow — Represents one floor row in an elevator shaft.
 * Shows elevator car presence, doors open/closed, and scheduled stops.
 * Clicking a row directly dispatches this elevator to that floor.
 *
 * Props:
 *   elevatorId     {number}   - Elevator ID (1, 2, 3)
 *   floor          {number}   - Floor number (1–10)
 *   isCurrentFloor {boolean}  - Whether elevator car is currently at this floor
 *   isDoorOpen     {boolean}  - Whether door is open at this floor
 *   stopQueue      {Array}    - Scheduled stops for this elevator
 *   onDirectCall   {function} - () => void — send this elevator to this floor
 */
export default function FloorRow({
  elevatorId,
  floor,
  isCurrentFloor,
  isDoorOpen,
  stopQueue,
  onDirectCall,
}) {
  const isQueued = stopQueue.some(s => s.floor === floor);

  return (
    <div
      className={`floor-row ${isCurrentFloor ? 'floor-row--active' : ''} ${isQueued ? 'floor-row--queued' : ''}`}
      onClick={onDirectCall}
      title={`Click to send Elevator ${elevatorId} to Floor ${floor}`}
    >
      <span className="floor-number">{floor}F</span>

      <div className="shaft-cell">
        {isCurrentFloor ? (
          <div className={`elevator-car ${isDoorOpen ? 'elevator-car--open' : ''}`}>
            <span className="car-icon">{isDoorOpen ? '🚪 OPEN' : '🛗'}</span>
            <span className="car-doors">{isDoorOpen ? '[   ]' : '[ | ]'}</span>
          </div>
        ) : isQueued ? (
          <span className="floor-stop-chip">● Stop</span>
        ) : (
          <span className="shaft-empty-line">|</span>
        )}
      </div>
    </div>
  );
}
