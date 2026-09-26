import { useState, useCallback, useEffect } from 'react';
import HallwayPanel from './components/HallwayPanel';
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
    callElevator,
    setDestination,
    openDoor,
    closeDoor,
    directCall,
  } = useElevator();

  // Track active hallway calls
  const [pendingCalls, setPendingCalls] = useState({ up: new Set(), down: new Set() });

  // Clear pending highlight when an elevator arrives at the floor
  useEffect(() => {
    if (arrivals.length > 0) {
      const latest = arrivals[0];
      setPendingCalls(prev => {
        const nextUp = new Set(prev.up);
        const nextDown = new Set(prev.down);
        nextUp.delete(latest.floor);
        nextDown.delete(latest.floor);
        return { up: nextUp, down: nextDown };
      });
    }
  }, [arrivals]);

  const handleCallUp = useCallback((floor) => {
    callElevator(floor, 'up');
    setPendingCalls(prev => ({
      ...prev,
      up: new Set([...prev.up, floor]),
    }));
  }, [callElevator]);

  const handleCallDown = useCallback((floor) => {
    callElevator(floor, 'down');
    setPendingCalls(prev => ({
      ...prev,
      down: new Set([...prev.down, floor]),
    }));
  }, [callElevator]);

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

      {/* ── Main Layout: Hallway Panel + 3 Elevators ───────────────────────── */}
      <main className="simulator-layout">
        {/* Central Hallway Calls */}
        <HallwayPanel
          pendingCalls={pendingCalls}
          elevators={elevators}
          onCallUp={handleCallUp}
          onCallDown={handleCallDown}
        />

        {/* 3 Elevators Side-by-Side */}
        <div className="elevator-grid">
          {elevators.map(elevator => (
            <ElevatorPanel
              key={elevator.id}
              elevator={elevator}
              awaitingDestination={awaitingDestination[elevator.id] || null}
              onDirectCall={handleDirectCall}
              onSetDestination={handleSetDestination}
              onOpenDoor={openDoor}
              onCloseDoor={closeDoor}
            />
          ))}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <span>3 Elevators · 10 Floors · SCAN Algorithm & Parallel Dispatch</span>
      </footer>
    </div>
  );
}
