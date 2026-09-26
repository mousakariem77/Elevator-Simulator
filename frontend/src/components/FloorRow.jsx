/**
 * FloorRow - Represents one floor row in an elevator shaft.
 * Shows external Hallway call buttons (▲ / ▼) for this specific elevator at this floor,
 * the elevator car presence, door state, and scheduled stop markers.
 *
 * Props:
 *   elevatorId     {number}   - Elevator ID (1, 2, 3)
 *   floor          {number}   - Floor number (1–10)
 *   isCurrentFloor {boolean}  - Whether elevator car is currently at this floor
 *   isDoorOpen     {boolean}  - Whether door is open at this floor
 *   stopQueue      {Array}    - Scheduled stops for this elevator
 *   isPendingUp    {boolean}  - UP call button is illuminated / waiting
 *   isPendingDown  {boolean}  - DOWN call button is illuminated / waiting
 *   onCallUp       {function} - (elevatorId, floor) => void
 *   onCallDown     {function} - (elevatorId, floor) => void
 *   onDirectCall   {function} - () => void - send this elevator to this floor
 */
export default function FloorRow({
  elevatorId,
  floor,
  isCurrentFloor,
  isDoorOpen,
  stopQueue,
  isPendingUp,
  isPendingDown,
  onCallUp,
  onCallDown,
  onDirectCall,
}) {
  const isQueued = stopQueue.some(s => s.floor === floor);

  return (
    <div
      className={`floor-row ${isCurrentFloor ? 'floor-row--active' : ''} ${isQueued ? 'floor-row--queued' : ''}`}
      onClick={onDirectCall}
      title={`Click row to send Elevator ${elevatorId} directly to Floor ${floor}`}
    >
      {/* Floor Number */}
      <span className="floor-number">{floor}F</span>

      {/* External Hallway Call Buttons outside this specific elevator */}
      <div className="floor-call-btns" onClick={(e) => e.stopPropagation()}>
        {floor < 10 ? (
          <button
            id={`call-e${elevatorId}-f${floor}-up`}
            className={`floor-call-btn floor-call-btn--up ${isPendingUp ? 'floor-call-btn--pending' : ''}`}
            onClick={() => onCallUp && onCallUp(elevatorId, floor)}
            title={`Call Elevator ${elevatorId} UP at Floor ${floor}`}
          >
            ▲
          </button>
        ) : (
          <span className="floor-call-btn-placeholder" />
        )}

        {floor > 1 ? (
          <button
            id={`call-e${elevatorId}-f${floor}-down`}
            className={`floor-call-btn floor-call-btn--down ${isPendingDown ? 'floor-call-btn--down-pending' : ''}`}
            onClick={() => onCallDown && onCallDown(elevatorId, floor)}
            title={`Call Elevator ${elevatorId} DOWN at Floor ${floor}`}
          >
            ▼
          </button>
        ) : (
          <span className="floor-call-btn-placeholder" />
        )}
      </div>

      {/* Elevator Shaft / Car / Stop Indicator */}
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
