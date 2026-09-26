# 🛗 Elevator Simulator Web App

A real-time, parallel multi-elevator simulation web application built with **Node.js (Backend)** and **React.js (Frontend)** using **Socket.io**.

Simulates an office building with **3 elevators operating in parallel across 10 floors**, using the **SCAN elevator algorithm** with intelligent parallel dispatch and full **Object-Oriented Programming (OOP)** architecture.

---

## 🌟 Key Features

- **Parallel Multi-Car Dispatch**:
  - Dynamically calculates Estimated Time of Arrival (ETA) considering travel distance and door dwell times (3s/stop).
  - Round-robin load balancing distributes simultaneous calls across all available idle elevators.
- **SCAN Algorithm & Direction Rule**:
  - Elevators traveling UP only stop for UP requests ahead of their current floor.
  - Elevators traveling DOWN only stop for DOWN requests ahead of their current floor.
  - Opposite-direction requests are never picked up mid-run; they are allocated to a counter-moving car or queued for the return trip.
- **Per-Elevator Floor Call Stations (Real-World Architecture)**:
  - External call buttons integrated directly onto each floor row of each elevator shaft.
  - Floor 10 features only ▼ (Down); Floor 1 features only ▲ (Up); Floors 2–9 feature both ▲ and ▼.
  - Pixel-perfect vertical alignment across all floors.
- **Unified In-Cabin Keypad (Select Destination Floor)**:
  - Permanent in-cabin keypad with realistic auto-lock mechanism (`🔒 LOCKED · EMPTY` when doors are closed and idle).
  - Automatically unlocks (`● BOARDED · READY`) upon elevator arrival and passenger boarding.
  - Remains active while passengers are riding inside during transit (`● RIDING · IN-CABIN ACTIVE`), allowing passengers to queue additional stops mid-run.
- **Door State Machine**:
  - Auto-open on arrival, 3-second auto-close timer.
  - Manual controls: **◄ ► Open** (holds door open) and **► ◄ Close** (closes door immediately).

---

## 🏛️ Object-Oriented Architecture (OOP)

The application strictly implements **Encapsulation**, **Inheritance**, and **Polymorphism**:

```
+-------------------------------------------------------+
|                    ElevatorSystem                     |
|  - _elevators: PassengerElevator[]                    |
|  - _requests: Map<string, Request>                    |
|  - _lastDispatchedId: number                          |
|  + callElevator(floor, direction)                     |
|  + sendElevatorToFloor(id, floor)                     |
|  + tick()                                             |
+-------------------------------------------------------+
                           | owns 3
                           v
+-------------------------------------------------------+
|                       Elevator                        |
|  # _id, _currentFloor, _direction, _status            |
|  # _stopQueue, _doorState, _doorHoldTicks             |
|  + addStop(floor, type, requestId)                    |
|  + tick(): ArrivalInfo | null                         |
|  + costToServe(floor, direction): number              |
|  + isGoingToward(floor, direction): boolean           |
|  + getState(): object                                 |
+-------------------------------------------------------+
                           ^
                           | extends (Inheritance)
+-------------------------------------------------------+
|                   PassengerElevator                   |
|  - _maxCapacity: number                               |
|  + getType(): 'passenger'                             |
|  + getState(): object  (Polymorphic Override)         |
|  + describe(): string  (Polymorphic Override)         |
+-------------------------------------------------------+
```

### 1. Encapsulation
- All class internal states use private conventions (`_prefixed`) and can only be queried or mutated through well-defined public methods and ES6 getters (`id`, `currentFloor`, `direction`, `status`, `doorState`, `isIdle`).
- Direct property tampering from outside classes is prevented.

### 2. Inheritance
- `PassengerElevator extends Elevator`:
  Inherits complete SCAN pathing, tick simulation, and door mechanics from the `Elevator` base class while adding passenger-specific constraints such as capacity limits.

### 3. Polymorphism
- `PassengerElevator` overrides `getState()` to augment the broadcast payload with passenger elevator metadata.
- `ElevatorSystem` interacts with `PassengerElevator` instances through the polymorphic `Elevator` contract without coupling to subclass implementation details.

---

## 📂 Project Structure

```
elevator-simulator/
├── backend/
│   ├── src/
│   │   ├── index.js                     # Express + Socket.io server entry
│   │   ├── models/
│   │   │   ├── Elevator.js              # Base Elevator model (SCAN, state machine)
│   │   │   ├── PassengerElevator.js     # Elevator subclass (Inheritance & Polymorphism)
│   │   │   ├── Request.js               # Request lifecycle model
│   │   │   └── ElevatorSystem.js       # Central orchestrator & parallel dispatcher
│   │   └── socket/
│   │       └── elevatorSocket.js        # Real-time WebSocket handlers & clock tick
│   ├── .env                             # Port & frontend URL configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ElevatorPanel.jsx        # Elevator column with in-cabin destination keypad
│   │   │   └── FloorRow.jsx             # Shaft row with external call buttons & car position
│   │   ├── hooks/
│   │   │   └── useElevator.js           # Socket.io client state & actions
│   │   ├── App.jsx                      # Main 3-elevator dashboard
│   │   ├── App.css                      # Modern light design system
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── PLAN.md                              # Implementation milestones & verification log
└── README.md                            # Documentation & architecture guide
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
```
The backend server runs on `http://localhost:3001` with a 1-second simulation clock.

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Verification Scenarios

### Scenario 1: Parallel Multi-Car Operation
1. On **Elevator 1**, press **▲** on **Floor 5**.
   - Elevator 1 responds and starts traveling to Floor 5.
2. Immediately on **Elevator 2**, press **▲** on **Floor 7**.
   - Elevator 2 responds and travels in parallel to Floor 7.
3. Immediately on **Elevator 3**, press **▲** on **Floor 8**.
   - Elevator 3 responds and travels in parallel to Floor 8.
4. *Result*: All 3 elevators operate concurrently in parallel.

### Scenario 2: SCAN Intermediate Pickup ("On the Way")
1. Elevator 1 is traveling UP from Floor 1 to Floor 8.
2. On Elevator 1, press **▲** on **Floor 4**.
3. *Result*: Elevator 1 detects that Floor 4 lies directly along its active UP path and smoothly inserts a stop at Floor 4 before proceeding to Floor 8.

### Scenario 3: Direction Rule Enforcement
1. Elevator 1 is traveling UP from Floor 1 to Floor 10.
2. On Elevator 1, press **▼** on **Floor 5**.
3. *Result*: Elevator 1 does NOT stop at Floor 5 on its upward run. The call is queued for Elevator 1's return trip down.

### Scenario 4: In-Cabin Destination Keypad
1. Call Elevator 2 to Floor 1. When doors open, the **Select Destination Floor** keypad unlocks (`● Boarded · Ready`).
2. Click button **6**.
3. *Result*: Floor 6 is queued, doors close, and Elevator 2 proceeds to Floor 6.

### Scenario 5: Door Mechanics
1. When an elevator arrives, its door opens for 3 seconds.
2. Click **◄ ► Open** to hold the door open (resets auto-close timer).
3. Click **► ◄ Close** to immediately close the door and resume movement.

---

## 📄 License
MIT License. Developed for technical assessment.
