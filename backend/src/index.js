require('dotenv').config();
const express                = require('express');
const http                   = require('http');
const { Server }             = require('socket.io');
const cors                   = require('cors');
const ElevatorSystem         = require('./models/ElevatorSystem');
const registerElevatorSocket = require('./socket/elevatorSocket');

// ── App setup ──────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

const PORT          = process.env.PORT || 3001;
const FRONTEND_URL  = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// ── Socket.io ──────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

// ── Elevator System ────────────────────────────────────────────────────────────
const system = new ElevatorSystem();

// Register all socket events
registerElevatorSocket(io, system);

// ── REST endpoints (optional — useful for health check / debugging) ────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/state', (req, res) => {
  res.json(system.getSystemState());
});

// ── Start server ───────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🛗  Elevator Simulator Backend`);
  console.log(`   Server  : http://localhost:${PORT}`);
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Elevators: ${ElevatorSystem.ELEVATOR_COUNT}`);
  console.log(`   Floors   : ${ElevatorSystem.MIN_FLOOR}–${ElevatorSystem.MAX_FLOOR}`);
  console.log(`\n✅  Ready. Simulation running...\n`);
});
