/**
 * elevatorSocket.js
 * Registers all Socket.io event handlers and wires them to the ElevatorSystem.
 *
 * Events (Client → Server):
 *   floor:call            { floor, direction }              → passenger calls elevator
 *   elevator:setDestination { elevatorId, requestId, floor } → passenger picks destination
 *   door:open             { elevatorId }                    → hold door open
 *   door:close            { elevatorId }                    → close door immediately
 *
 * Events (Server → Client):
 *   system:state          { elevators, pendingQueue, timestamp } → broadcast every tick
 *   elevator:arrived      { type, elevatorId, floor, requestId } → pickup/dropoff event
 *   request:created       { request }                            → new request acknowledged
 */

/**
 * @param {import('socket.io').Server} io
 * @param {import('../models/ElevatorSystem')} system
 */
function registerElevatorSocket(io, system) {
  // ── Simulation Clock ────────────────────────────────────────────────────────
  // Tick every 1 second; each tick = elevator moves 1 floor
  const TICK_INTERVAL_MS = 1000;

  setInterval(() => {
    const events = system.tick();

    // Broadcast updated state to ALL connected clients
    io.emit('system:state', system.getSystemState());

    // Broadcast any arrival events (pickup / dropoff)
    for (const event of events) {
      io.emit('elevator:arrived', event);
    }
  }, TICK_INTERVAL_MS);

  // ── Per-client connection ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send current state immediately upon connection
    socket.emit('system:state', system.getSystemState());

    // ── floor:call ─────────────────────────────────────────────────────────────
    // Passenger at a floor presses the Up or Down button
    socket.on('floor:call', ({ floor, direction }) => {
      // Validate inputs
      if (
        typeof floor !== 'number' ||
        floor < 1 || floor > 10 ||
        !['up', 'down'].includes(direction)
      ) {
        socket.emit('error', { message: 'Invalid floor:call payload' });
        return;
      }

      const request = system.callElevator(floor, direction);
      console.log(`[System] Request created: floor=${floor} dir=${direction} id=${request.id}`);

      // Acknowledge to the calling client
      socket.emit('request:created', { request: request.toJSON() });

      // Update all clients with new system state
      io.emit('system:state', system.getSystemState());
    });

    // ── elevator:setDestination ────────────────────────────────────────────────
    // Passenger has boarded and selects their destination floor
    socket.on('elevator:setDestination', ({ elevatorId, requestId, floor }) => {
      if (
        typeof elevatorId !== 'number' ||
        typeof floor !== 'number' ||
        floor < 1 || floor > 10 ||
        typeof requestId !== 'string'
      ) {
        socket.emit('error', { message: 'Invalid elevator:setDestination payload' });
        return;
      }

      const success = system.setDestination(elevatorId, requestId, floor);
      if (!success) {
        socket.emit('error', { message: 'Could not set destination. Invalid elevator or request.' });
        return;
      }

      console.log(`[System] Destination set: elevator=${elevatorId} dest=${floor} req=${requestId}`);
      io.emit('system:state', system.getSystemState());
    });

    // ── elevator:directCall ───────────────────────────────────────────────────
    // Direct command to send a specific elevator to a floor (In-cabin control / test)
    socket.on('elevator:directCall', ({ elevatorId, floor }) => {
      if (
        typeof elevatorId !== 'number' ||
        typeof floor !== 'number' ||
        floor < 1 || floor > 10
      ) {
        socket.emit('error', { message: 'Invalid elevator:directCall payload' });
        return;
      }

      const success = system.sendElevatorToFloor(elevatorId, floor);
      if (!success) {
        socket.emit('error', { message: 'Could not dispatch elevator to floor.' });
        return;
      }

      console.log(`[System] Direct call: Elevator ${elevatorId} -> Floor ${floor}`);
      io.emit('system:state', system.getSystemState());
    });

    // ── door:open ──────────────────────────────────────────────────────────────
    // User holds the door open (resets auto-close timer)
    socket.on('door:open', ({ elevatorId }) => {
      if (typeof elevatorId !== 'number') return;
      system.openDoor(elevatorId);
      console.log(`[System] Door held open: elevator=${elevatorId}`);
      io.emit('system:state', system.getSystemState());
    });

    // ── door:close ─────────────────────────────────────────────────────────────
    // User closes the door immediately
    socket.on('door:close', ({ elevatorId }) => {
      if (typeof elevatorId !== 'number') return;
      system.closeDoor(elevatorId);
      console.log(`[System] Door closed: elevator=${elevatorId}`);
      io.emit('system:state', system.getSystemState());
    });

    // ── disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = registerElevatorSocket;
