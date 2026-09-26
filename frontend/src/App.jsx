import { useState, useCallback, useEffect } from 'react';
import ElevatorPanel from './components/ElevatorPanel';
import { useElevator } from './hooks/useElevator';
import './App.css';

export default function App() {
  const {
    connected,
    elevators,
    pendingQueue,
    arrivals,
    awaitingDestination,
    callElevatorCar,
    setDestination,
    openDoor,
    closeDoor,
    directCall,
  } = useElevator();

  // Track active hallway calls per elevator: { [id]: { up: Set(), down: Set() } }
  const [pendingCalls, setPendingCalls] = useState({
    1: { up: new Set(), down: new Set() },
    2: { up: new Set(), down: new Set() },
    3: { up: new Set(), down: new Set() },
  });

  // Clear pending highlight when an elevator arrives at the floor
  useEffect(() => {
    if (arrivals.length > 0) {
      const latest = arrivals[0];
      setPendingCalls(prev => {
        const carCalls = prev[latest.elevatorId] || { up: new Set(), down: new Set() };
        const nextUp = new Set(carCalls.up);
        const nextDown = new Set(carCalls.down);
        nextUp.delete(latest.floor);
        nextDown.delete(latest.floor);
        return {
          ...prev,
          [latest.elevatorId]: { up: nextUp, down: nextDown },
        };
      });
    }
  }, [arrivals]);

  const handleCallUp = useCallback((elevatorId, floor) => {
    callElevatorCar(elevatorId, floor, 'up');
    setPendingCalls(prev => {
      const carCalls = prev[elevatorId] || { up: new Set(), down: new Set() };
      return {
        ...prev,
        [elevatorId]: {
          ...carCalls,
          up: new Set([...carCalls.up, floor]),
        },
      };
    });
  }, [callElevatorCar]);

  const handleCallDown = useCallback((elevatorId, floor) => {
    callElevatorCar(elevatorId, floor, 'down');
    setPendingCalls(prev => {
      const carCalls = prev[elevatorId] || { up: new Set(), down: new Set() };
      return {
        ...prev,
        [elevatorId]: {
          ...carCalls,
          down: new Set([...carCalls.down, floor]),
        },
      };
    });
  }, [callElevatorCar]);

  const handleSetDestination = useCallback((elevatorId, requestId, floor) => {
    setDestination(elevatorId, requestId, floor);
  }, [setDestination]);

  const handleDirectCall = useCallback((elevatorId, floor) => {
    directCall(elevatorId, floor);
  }, [directCall]);

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div>
          <h1 className="app-title">🛗 Elevator Simulator</h1>
          <p className="app-subtitle">Parallel 3-Elevator Dispatch System · 10 Floors</p>
        </div>
        <div className="app-meta">
          <span className={`connection-dot ${connected ? 'connection-dot--on' : 'connection-dot--off'}`} />
          <span className="connection-label">{connected ? 'Connected' : 'Disconnected'}</span>
          {pendingQueue.length > 0 && (
            <span className="pending-badge">{pendingQueue.length} waiting</span>
          )}
        </div>
      </header>

      {/* ── Main Layout: 3 Independent Elevators Side-by-Side ──────────────── */}
      <main className="simulator-layout">
        <div className="elevator-grid">
          {elevators.map(elevator => (
            <ElevatorPanel
              key={elevator.id}
              elevator={elevator}
              awaitingDestination={awaitingDestination[elevator.id] || null}
              pendingCalls={pendingCalls[elevator.id] || { up: new Set(), down: new Set() }}
              onCallUp={handleCallUp}
              onCallDown={handleCallDown}
              onDirectCall={handleDirectCall}
              onSetDestination={handleSetDestination}
              onOpenDoor={openDoor}
              onCloseDoor={closeDoor}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
