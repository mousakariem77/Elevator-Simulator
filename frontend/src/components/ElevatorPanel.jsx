import FloorRow from './FloorRow';
import DestinationPanel from './DestinationPanel';

const DIRECTION_ICON = { up: '↑ UP', down: '↓ DOWN', idle: '— IDLE' };
const STATUS_LABEL   = { idle: 'IDLE', moving: 'MOVING', door_open: 'DOOR OPEN' };

/**
 * ElevatorPanel — Full visual representation of one elevator unit.
 *
 * Props:
 *   elevator           {object}   - Elevator state from backend
 *   awaitingDestination {object}  - { requestId, pickupFloor } if waiting for destination
 *   onDirectCall       {function} - (elevatorId, floor) => void
 *   onSetDestination   {function} - (elevatorId, requestId, floor) => void
 *   onOpenDoor         {function} - (elevatorId) => void
 *   onCloseDoor        {function} - (elevatorId) => void
 */
export default function ElevatorPanel({
  elevator,
  awaitingDestination,
  onDirectCall,
  onSetDestination,
  onOpenDoor,
  onCloseDoor,
}) {
  if (!elevator) return null;

  const {
    id,
    currentFloor,
    direction,
    status,
    stopQueue,
  } = elevator;

  const isDoorOpen = status === 'door_open';
  const floors = Array.from({ length: 10 }, (_, i) => 10 - i); // 10 down to 1

  return (
    <div className={`elevator-panel ${isDoorOpen ? 'elevator-panel--door-open' : ''}`}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="elevator-header">
        <span className="elevator-id">Elevator {id}</span>
        <span className={`status-badge status-badge--${status}`}>
          {DIRECTION_ICON[direction] || STATUS_LABEL[status]}
        </span>
      </div>

      {/* ── Current Floor Display ───────────────────────────────────────────── */}
      <div className="current-floor-display">
        <span className="current-floor-number">{currentFloor}</span>
        <span className="current-floor-label">Current Floor</span>
      </div>

      {/* ── Door Controls ──────────────────────────────────────────────────── */}
      <div className="door-controls">
        <button
          id={`elevator-${id}-door-open`}
          className="door-btn door-btn--open"
          onClick={() => onOpenDoor(id)}
          disabled={!isDoorOpen}
          title="Hold door open"
        >
          ◄ ► Open
        </button>
        <button
          id={`elevator-${id}-door-close`}
          className="door-btn door-btn--close"
          onClick={() => onCloseDoor(id)}
          disabled={!isDoorOpen}
          title="Close door"
        >
          ► ◄ Close
        </button>
      </div>

      {/* ── In-Cabin Keypad (Direct floor command for this elevator) ────────── */}
      <div className="cabin-controls">
        <div className="cabin-controls-title">🎮 Cabin Control (Elevator {id})</div>
        <div className="cabin-grid">
          {floors.map(floor => {
            const isCur = currentFloor === floor;
            const isQueued = stopQueue.some(s => s.floor === floor);
            return (
              <button
                key={floor}
                id={`cabin-${id}-floor-${floor}`}
                className={`cabin-btn ${isCur ? 'cabin-btn--current' : ''} ${isQueued ? 'cabin-btn--queued' : ''}`}
                onClick={() => onDirectCall(id, floor)}
                title={`Send Elevator ${id} to Floor ${floor}`}
              >
                {floor}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Destination Panel (shown when elevator waits for passenger input) */}
      {awaitingDestination && isDoorOpen && (
        <DestinationPanel
          elevatorId={id}
          pickupFloor={awaitingDestination.pickupFloor}
          requestId={awaitingDestination.requestId}
          onSelect={onSetDestination}
        />
      )}

      {/* ── Stop Queue Indicator ───────────────────────────────────────────── */}
      {stopQueue.length > 0 && (
        <div className="stop-queue">
          <span className="stop-queue-label">Stops:</span>
          {stopQueue.map((s, i) => (
            <span key={i} className={`stop-chip stop-chip--${s.type}`}>
              {s.floor}F
            </span>
          ))}
        </div>
      )}

      {/* ── Elevator Shaft ─────────────────────────────────────────────────── */}
      <div className="floor-shaft">
        {floors.map(floor => (
          <FloorRow
            key={floor}
            elevatorId={id}
            floor={floor}
            isCurrentFloor={currentFloor === floor}
            isDoorOpen={isDoorOpen && currentFloor === floor}
            stopQueue={stopQueue}
            onDirectCall={() => onDirectCall(id, floor)}
          />
        ))}
      </div>
    </div>
  );
}
