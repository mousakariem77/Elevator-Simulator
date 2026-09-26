import FloorRow from './FloorRow';

const DIRECTION_ICON = { up: '↑ UP', down: '↓ DOWN', idle: '- IDLE' };
const STATUS_LABEL = { idle: 'IDLE', moving: 'MOVING', door_open: 'DOOR OPEN' };

/**
 * ElevatorPanel - Full visual representation of one elevator unit.
 *
 * Props:
 *   elevator            {object}   - Elevator state from backend
 *   awaitingDestination {object}   - { requestId, pickupFloor } if waiting for destination
 *   pendingCalls        {object}   - { up: Set, down: Set } active calls for this elevator
 *   onCallUp            {function} - (elevatorId, floor) => void
 *   onCallDown          {function} - (elevatorId, floor) => void
 *   onDirectCall        {function} - (elevatorId, floor) => void
 *   onSetDestination    {function} - (elevatorId, requestId, floor) => void
 *   onOpenDoor          {function} - (elevatorId) => void
 *   onCloseDoor         {function} - (elevatorId) => void
 */
export default function ElevatorPanel({
  elevator,
  awaitingDestination,
  pendingCalls,
  onCallUp,
  onCallDown,
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
  const isMoving = status === 'moving';
  const hasStops = stopQueue.length > 0;
  const isAwaiting = Boolean(awaitingDestination);

  // Keypad is active if doors are open OR if elevator is currently in transit with passengers inside
  const isKeypadUnlocked = isDoorOpen || isMoving || hasStops;

  const floors = Array.from({ length: 10 }, (_, i) => 10 - i); // 10 down to 1

  const handleSelectFloor = (floor) => {
    if (!isKeypadUnlocked || floor === currentFloor) return;
    if (awaitingDestination) {
      onSetDestination(id, awaitingDestination.requestId, floor);
    } else {
      onDirectCall(id, floor);
    }
  };

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

      {/* ── Unified In-Cabin Destination Keypad (Always Visible, Disabled When Closed) ─ */}
      <div className={`cabin-controls ${isKeypadUnlocked ? 'cabin-controls--active' : 'cabin-controls--locked'}`}>
        <div className="cabin-controls-header">
          <span className="cabin-controls-title">Select Destination Floor</span>
          <span className={`cabin-status-badge ${isKeypadUnlocked ? 'cabin-status-badge--active' : 'cabin-status-badge--locked'}`}>
            {isKeypadUnlocked
              ? (isDoorOpen
                ? (isAwaiting ? '● Boarded · Ready' : '● Door Open')
                : '● Riding · In-Cabin Active')
              : '🔒 Locked · Empty'}
          </span>
        </div>

        <div className="cabin-grid">
          {floors.map(floor => {
            const isCur = currentFloor === floor;
            const isQueued = stopQueue.some(s => s.floor === floor);
            const isDisabled = !isKeypadUnlocked || isCur;

            return (
              <button
                key={floor}
                id={`cabin-${id}-floor-${floor}`}
                className={`cabin-btn ${isCur ? 'cabin-btn--current' : ''} ${isQueued ? 'cabin-btn--queued' : ''}`}
                disabled={isDisabled}
                onClick={() => handleSelectFloor(floor)}
                title={
                  isCur
                    ? `Current Floor (${floor}F)`
                    : !isKeypadUnlocked
                      ? 'Cabin keypad is locked while empty. Call elevator outside to board.'
                      : `Select Floor ${floor} as destination`
                }
              >
                {floor}
              </button>
            );
          })}
        </div>
      </div>

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

      {/* ── Elevator Shaft with Hallway Call Buttons on Each Floor ───────────── */}
      <div className="floor-shaft">
        {floors.map(floor => (
          <FloorRow
            key={floor}
            elevatorId={id}
            floor={floor}
            isCurrentFloor={currentFloor === floor}
            isDoorOpen={isDoorOpen && currentFloor === floor}
            stopQueue={stopQueue}
            isPendingUp={pendingCalls?.up?.has(floor)}
            isPendingDown={pendingCalls?.down?.has(floor)}
            onCallUp={onCallUp}
            onCallDown={onCallDown}
            onDirectCall={() => onDirectCall(id, floor)}
          />
        ))}
      </div>
    </div>
  );
}
