import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3001';

/**
 * useElevator — Custom hook that manages the Socket.io connection
 * and exposes all elevator system interactions to React components.
 */
export function useElevator() {
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [elevators, setElevators] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [arrivals, setArrivals] = useState([]); // recent arrival events
  // Map of requestId → elevatorId for active pickups awaiting destination
  const [awaitingDestination, setAwaitingDestination] = useState({});

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    // Full system state broadcast every tick
    socket.on('system:state', (state) => {
      setElevators(state.elevators || []);
      setPendingQueue(state.pendingQueue || []);
    });

    // Pickup or dropoff event
    socket.on('elevator:arrived', (event) => {
      console.log('[Socket] Arrived:', event);
      setArrivals(prev => [event, ...prev].slice(0, 20));

      if (event.type === 'pickup') {
        // Show destination selector for this elevator
        setAwaitingDestination(prev => ({
          ...prev,
          [event.elevatorId]: {
            requestId: event.requestId,
            pickupFloor: event.floor,
          },
        }));
      }

      if (event.type === 'dropoff') {
        // Clear destination selector
        setAwaitingDestination(prev => {
          const next = { ...prev };
          delete next[event.elevatorId];
          return next;
        });
      }
    });

    socket.on('error', (err) => {
      console.error('[Socket] Error:', err.message);
    });

    return () => socket.disconnect();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Call an elevator to a floor in a given direction */
  const callElevator = useCallback((floor, direction) => {
    socketRef.current?.emit('floor:call', { floor, direction });
  }, []);

  /** Set the destination floor after a passenger boards */
  const setDestination = useCallback((elevatorId, requestId, floor) => {
    socketRef.current?.emit('elevator:setDestination', { elevatorId, requestId, floor });
    // Optimistically clear the selector
    setAwaitingDestination(prev => {
      const next = { ...prev };
      delete next[elevatorId];
      return next;
    });
  }, []);

  /** Hold elevator door open */
  const openDoor = useCallback((elevatorId) => {
    socketRef.current?.emit('door:open', { elevatorId });
  }, []);

  /** Close elevator door immediately */
  const closeDoor = useCallback((elevatorId) => {
    socketRef.current?.emit('door:close', { elevatorId });
  }, []);

  /** Directly send a specific elevator to a floor (In-cabin control / manual test) */
  const directCall = useCallback((elevatorId, floor) => {
    socketRef.current?.emit('elevator:directCall', { elevatorId, floor });
  }, []);

  return {
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
  };
}
