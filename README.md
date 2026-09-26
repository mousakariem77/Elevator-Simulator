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
- **Centralized Hallway Call Station**:
  - Single building-wide panel on the left (Floors 1–10) with ▲ (Up) and ▼ (Down) buttons.
  - Real-time indicator badges (`E1`, `E2`, `E3`) display which elevator is dispatched to each floor.
- **Independent In-Cabin Controls**:
  - Each elevator includes a dedicated **Cabin Keypad (1–10)** to send that car directly to any floor.
  - Interactive floor shafts allow clicking any floor row to dispatch that specific elevator.
- **Door State Machine**:
  - Auto-open on arrival, 3-second auto-close timer.
  - Manual controls: **◄ ► Open** (holds door open) and **► ◄ Close** (closes door immediately).
  - Destination selection panel pops up upon passenger boarding.

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

### Scenario 1: Parallel Multi-Car Dispatch
1. In the **Hallway Calls** panel on the left, press **▲** on **Floor 5**.
   - Elevator 1 responds and starts traveling to Floor 5.
2. Immediately press **▲** on **Floor 7**.
   - Elevator 2 is dispatched in parallel to serve Floor 7.
3. Immediately press **▲** on **Floor 8**.
   - Elevator 3 is dispatched in parallel to serve Floor 8.
4. *Result*: All 3 elevators operate concurrently, eliminating passenger wait times.

### Scenario 2: SCAN Intermediate Pickup ("On the Way")
1. Elevator 1 is traveling UP from Floor 1 to Floor 8.
2. Press **▲** on **Floor 4**.
3. *Result*: Elevator 1 detects that Floor 4 lies directly along its active UP path and smoothly inserts a pickup stop at Floor 4 before proceeding to Floor 8.

### Scenario 3: Direction Rule Enforcement
1. Elevator 1 is traveling UP from Floor 1 to Floor 10.
2. In the Hallway Calls panel, press **▼** on **Floor 5**.
3. *Result*: Elevator 1 does NOT stop at Floor 5 on its upward run. The call is either delegated to an idle car moving down or serviced when Elevator 1 begins its downward run.

### Scenario 4: Direct Cabin Control
1. In Elevator 2's panel, click button **4** on its **Cabin Control keypad**.
2. *Result*: Elevator 2 immediately departs for Floor 4 independently.

### Scenario 5: Door Mechanics
1. When an elevator arrives, its door opens for 3 seconds.
2. Click **◄ ► Open** to hold the door open.
3. Click **► ◄ Close** to immediately close the door and resume movement.

---

## 📄 License
MIT License. Developed for technical assessment.
