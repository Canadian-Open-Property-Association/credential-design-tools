/**
 * Orbit WebSocket Hook
 *
 * Manages socket.io connections to Orbit RegisterSocket for real-time credential exchange events.
 * Used by Test Issuer, Test Verifier, and other apps that need real-time updates.
 *
 * Features:
 * - Uses socket.io-client for proper Orbit compatibility
 * - Hybrid connection model: reuses existing session if available
 * - Event handling for ISSUANCE_RESPONSE and other Orbit events
 * - Automatic reconnection
 * - Cleanup on unmount
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { socketService, SocketConnectionStatus } from '../lib/socketService';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

/**
 * Credential exchange event types from Orbit
 */
export type OrbitEventType =
  | 'offer_received'
  | 'offer_accepted'
  | 'credential_issued'
  | 'proof_received'
  | 'proof_verified'
  | 'connection_established'
  | 'connection'
  | 'verification'
  | 'error'
  | 'done';

/**
 * Event data structure (varies by event type)
 */
export interface OrbitEventData {
  offerId?: string;
  connectionId?: string;
  credentialId?: string;
  proofId?: string;
  status?: string;
  error?: string;
  raw?: unknown;
  [key: string]: unknown;
}

/**
 * Options for the useOrbitSocket hook
 */
interface UseOrbitSocketOptions {
  /** App identifier for logging */
  appName: string;
  /** Callback for all events */
  onEvent?: (event: OrbitEventType, data: OrbitEventData) => void;
  /** Whether to enable the socket connection */
  enabled?: boolean;
}

/**
 * Socket connection state
 */
interface SocketState {
  /** Whether the socket.io is connected */
  connected: boolean;
  /** Session ID from Orbit */
  sessionId: string | null;
  /** Error message if registration/connection failed */
  error: string | null;
  /** Whether registration is in progress */
  isRegistering: boolean;
}

/**
 * Hook for managing Orbit socket.io connections
 *
 * @example
 * ```tsx
 * const { connected, sessionId, error } = useOrbitSocket({
 *   appName: 'testIssuer',
 *   onEvent: (event, data) => {
 *     if (event === 'offer_accepted') {
 *       console.log('Offer accepted:', data.offerId);
 *     }
 *   },
 * });
 * ```
 */
export function useOrbitSocket({
  appName,
  onEvent,
  enabled = true,
}: UseOrbitSocketOptions) {
  const [state, setState] = useState<SocketState>({
    connected: socketService.isConnected(),
    sessionId: socketService.getSessionId(),
    error: null,
    isRegistering: false,
  });

  const mountedRef = useRef(true);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  /**
   * Get socket configuration from server (backend does registration with API key)
   *
   * Returns:
   * - socketSessionId: Pre-registered session ID from Orbit
   * - websocketUrl: Full URL with ?session= param for frontend connection
   * - socketUrl: Base socket URL
   * - lobId: LOB ID for re-registration
   */
  const getSocketConfig = useCallback(async (): Promise<{
    socketSessionId: string;
    websocketUrl: string;
    socketUrl: string;
    lobId: string;
  } | null> => {
    try {
      console.log(`[${appName}] Requesting socket registration from backend...`);

      const response = await fetch(`${API_BASE}/api/socket/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to register socket: ${response.status}`);
      }

      const data = await response.json();

      // Backend now returns pre-registered session
      if (!data.socketSessionId || !data.websocketUrl) {
        throw new Error('Invalid response: missing socketSessionId or websocketUrl');
      }

      console.log(`[${appName}] Backend registration successful:`, {
        socketSessionId: data.socketSessionId,
        websocketUrl: data.websocketUrl,
      });

      return {
        socketSessionId: data.socketSessionId,
        websocketUrl: data.websocketUrl,
        socketUrl: data.socketUrl,
        lobId: data.lobId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get socket configuration';
      console.error(`[${appName}] Socket config error:`, message);
      if (mountedRef.current) {
        setState((s) => ({ ...s, error: message, isRegistering: false }));
      }
      return null;
    }
  }, [appName]);

  /**
   * Initialize socket connection using pre-registered session from backend
   */
  const initSocket = useCallback(async () => {
    // Check if already connected and reuse
    if (socketService.isConnected() && socketService.getSessionId()) {
      console.log(`[${appName}] Reusing existing socket connection:`, socketService.getSessionId());
      if (mountedRef.current) {
        setState({
          connected: true,
          sessionId: socketService.getSessionId(),
          error: null,
          isRegistering: false,
        });
      }
      return;
    }

    setState((s) => ({ ...s, isRegistering: true, error: null }));

    // Backend registers with Orbit and returns pre-registered session
    const config = await getSocketConfig();
    if (!config || !mountedRef.current) {
      return;
    }

    try {
      console.log(`[${appName}] Connecting to socket with pre-registered session...`);

      // Connect using websocketUrl (includes ?session=xxx) and pass pre-registered session ID
      const sessionId = await socketService.connect(
        config.websocketUrl,
        config.lobId,
        config.socketSessionId
      );

      if (mountedRef.current) {
        setState({
          connected: true,
          sessionId,
          error: null,
          isRegistering: false,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Socket connection failed';
      console.error(`[${appName}] Socket connection error:`, message);
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          connected: false,
          error: message,
          isRegistering: false,
        }));
      }
    }
  }, [appName, getSocketConfig]);

  /**
   * Disconnect socket
   */
  const disconnect = useCallback(() => {
    socketService.disconnect();
    if (mountedRef.current) {
      setState({
        connected: false,
        sessionId: null,
        error: null,
        isRegistering: false,
      });
    }
  }, []);

  /**
   * Reconnect socket
   */
  const reconnect = useCallback(async () => {
    try {
      setState((s) => ({ ...s, isRegistering: true, error: null }));
      const sessionId = await socketService.reconnect();
      if (mountedRef.current) {
        setState({
          connected: true,
          sessionId,
          error: null,
          isRegistering: false,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reconnection failed';
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          connected: false,
          error: message,
          isRegistering: false,
        }));
      }
    }
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    if (!enabled) return;

    const unsubscribeEvents = socketService.subscribe((eventType, data) => {
      console.log(`[${appName}] Socket event:`, eventType, data);
      if (onEventRef.current) {
        onEventRef.current(eventType as OrbitEventType, data as OrbitEventData);
      }
    });

    const unsubscribeStatus = socketService.onStatusChange((status: SocketConnectionStatus) => {
      if (!mountedRef.current) return;

      setState((s) => ({
        ...s,
        connected: status === 'connected',
        sessionId: socketService.getSessionId(),
        error: status === 'error' ? 'Socket connection error' : s.error,
      }));
    });

    return () => {
      unsubscribeEvents();
      unsubscribeStatus();
    };
  }, [enabled, appName]);

  // Initialize on mount if enabled
  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      initSocket();
    }

    return () => {
      mountedRef.current = false;
      // Don't disconnect on unmount - allow hybrid model where socket persists
    };
  }, [enabled, initSocket]);

  return {
    ...state,
    /** Manually reconnect */
    reconnect,
    /** Manually disconnect */
    disconnect,
    /** Get event log for debugging */
    getEventLog: socketService.getEventLog.bind(socketService),
  };
}
