/**
 * HallwayPanel — Central Hallway Call Station.
 * Represents the shared floor buttons located in the building corridor.
 *
 * Props:
 *   pendingCalls {object}   - { up: Set<number>, down: Set<number> }
 *   elevators    {Array}    - list of elevator states from backend
 *   onCallUp     {function} - (floor) => void
 *   onCallDown   {function} - (floor) => void
 */
export default function HallwayPanel({
  pendingCalls,
  elevators,
  onCallUp,
  onCallDown,
}) {
  const floors = Array.from({ length: 10 }, (_, i) => 10 - i); // 10 down to 1

  // Find which elevator is scheduled to stop at this floor
  const getAssignedElevator = (floor) => {
    for (const e of elevators) {
      if (e.stopQueue && e.stopQueue.some(s => s.floor === floor)) {
        return e.id;
      }
    }
    return null;
  };

  return (
    <div className="hallway-panel">
      <div className="hallway-header">
        <span className="hallway-title">🏢 Hallway Calls</span>
        <span className="hallway-subtitle">Building Floors 1–10</span>
      </div>

      <div className="hallway-instruction">
        Press ▲/▼ to call an elevator. The system dispatches the optimal car.
      </div>

      <div className="hallway-shaft">
        {floors.map((floor) => {
          const isPendingUp = pendingCalls?.up?.has(floor);
          const isPendingDown = pendingCalls?.down?.has(floor);
          const assignedId = getAssignedElevator(floor);

          return (
            <div key={floor} className="hallway-row">
              <span className="hallway-floor-num">{floor}F</span>

              <div className="hallway-btns">
                {floor < 10 ? (
                  <button
                    id={`hallway-${floor}-up`}
                    className={`call-btn call-btn--up ${isPendingUp ? 'call-btn--pending' : ''}`}
                    onClick={() => onCallUp(floor)}
                    title={`Call elevator up from floor ${floor}`}
                  >
                    ▲
                  </button>
                ) : (
                  <span className="call-btn-placeholder" />
                )}

                {floor > 1 ? (
                  <button
                    id={`hallway-${floor}-down`}
                    className={`call-btn call-btn--down ${isPendingDown ? 'call-btn--down-pending' : ''}`}
                    onClick={() => onCallDown(floor)}
                    title={`Call elevator down from floor ${floor}`}
                  >
                    ▼
                  </button>
                ) : (
                  <span className="call-btn-placeholder" />
                )}
              </div>

              <div className="hallway-status">
                {assignedId ? (
                  <span className={`assigned-badge assigned-badge--e${assignedId}`} title={`Elevator ${assignedId} assigned`}>
                    E{assignedId}
                  </span>
                ) : (
                  <span className="assigned-empty">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
