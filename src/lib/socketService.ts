/**
 * Socket Service
 *
 * Singleton service for managing socket.io connection to Orbit RegisterSocket API.
 * Provides hybrid connection model: backend pre-registers, frontend connects with session.
 *
 * Connection Flow:
 * 1. Backend registers with Orbit (with API key) and returns socketSessionId
 * 2. Frontend connects with pre-registered session for event listening
 * 3. On connect, re-emit REGISTER_SOCKET to maintain registration
 *
 * Based on Orbit's RegisterSocket documentation:
 * - Emit REGISTER_SOCKET with lobId to register session
 * - Listen for REGISTER_SOCKET_RESPONSE to confirm
 * - Listen for ISSUANCE_RESPONSE events for credential status updates
 */

import { io, Socket } from 'socket.io-client';

export interface SocketEventLog {
  timestamp: string;
  event: string;
  data: unknown;
}

export type SocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SocketEventHandler {
  (eventType: string, data: unknown): void;
}

class SocketService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private lobId: string | null = null;
  private socketUrl: string | null = null;
  private preRegisteredSession: string | null = null;
  private eventLog: SocketEventLog[] = [];
  private maxLogSize = 100;
  private eventHandlers: Set<SocketEventHandler> = new Set();
  private connectionStatus: SocketConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: SocketConnectionStatus) => void> = new Set();

  /**
   * Connect to Orbit RegisterSocket service
   *
   * @param socketUrl - The base socket URL (or full URL with ?session= query param)
   * @param lobId - The LOB ID for registration
   * @param preRegisteredSessionId - Optional session ID from backend registration
   */
  async connect(socketUrl: string, lobId: string, preRegisteredSessionId?: string): Promise<string> {
    // Parse session from URL if provided (e.g., wss://host?session=xxx)
    let baseSocketUrl = socketUrl;
    let sessionFromUrl: string | null = null;

    try {
      // Check if URL has session query param
      if (socketUrl.includes('?session=')) {
        const url = new URL(socketUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://'));
        sessionFromUrl = url.searchParams.get('session');
        baseSocketUrl = socketUrl.split('?')[0];
      }
    } catch {
      // Use socketUrl as-is if parsing fails
    }

    // Use pre-registered session (from param or URL)
    this.preRegisteredSession = preRegisteredSessionId || sessionFromUrl;
    this.socketUrl = baseSocketUrl;
    this.lobId = lobId;

    console.log('[SocketService] 1. Initializing connection');
    console.log('[SocketService]    Socket URL:', baseSocketUrl);
    console.log('[SocketService]    LOB ID:', lobId);
    console.log('[SocketService]    Pre-registered session:', this.preRegisteredSession || 'none');

    // Reuse existing live connection if session matches
    if (this.socket?.connected && this.sessionId) {
      console.log('[SocketService] Reusing existing connection:', this.sessionId);
      return this.sessionId;
    }

    // Clean up existing socket if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        console.log('[SocketService] 2. Creating socket.io connection');

        // Build connection options
        const socketOptions: Parameters<typeof io>[1] = {
          transports: ['websocket', 'polling'], // Add polling fallback
          timeout: 30000, // Increase timeout
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
        };

        // Add session query param if we have a pre-registered session
        if (this.preRegisteredSession) {
          socketOptions.query = { session: this.preRegisteredSession };
        }

        this.socket = io(baseSocketUrl, socketOptions);

        this.socket.on('connect', () => {
          console.log('[SocketService] 3. Socket transport connected, socket.id:', this.socket?.id);
          this.logEvent('connect', { socketId: this.socket?.id, preRegisteredSession: this.preRegisteredSession });

          // If we have a pre-registered session, use it immediately
          if (this.preRegisteredSession) {
            this.sessionId = this.preRegisteredSession;
            console.log('[SocketService] 4. Using pre-registered session:', this.sessionId);
          }

          // Always emit REGISTER_SOCKET to maintain/refresh registration
          console.log('[SocketService] 5. Emitting REGISTER_SOCKET with lobId:', lobId);
          this.socket?.emit('REGISTER_SOCKET', lobId);

          // If we had a pre-registered session, resolve immediately
          // We don't need to wait for REGISTER_SOCKET_RESPONSE
          if (this.preRegisteredSession) {
            this.setStatus('connected');
            resolve(this.sessionId || '');
          }
        });

        this.socket.on('REGISTER_SOCKET_RESPONSE', (response: unknown) => {
          console.log('[SocketService] 6. REGISTER_SOCKET_RESPONSE:', JSON.stringify(response));
          this.logEvent('REGISTER_SOCKET_RESPONSE', response);

          const resp = response as { success?: boolean; socketId?: string };
          if (resp?.success) {
            // Update session ID if Orbit returned a new one
            const newSessionId = resp.socketId || this.socket?.id || null;
            if (!this.sessionId) {
              this.sessionId = newSessionId;
            }
            this.setStatus('connected');
            console.log('[SocketService] Registration confirmed, sessionId:', this.sessionId);

            // Only resolve here if we didn't have a pre-registered session
            if (!this.preRegisteredSession) {
              resolve(this.sessionId || '');
            }
          } else {
            // Only reject if we don't have a pre-registered session
            if (!this.preRegisteredSession) {
              this.setStatus('error');
              reject(new Error('Socket registration failed'));
            } else {
              // Log warning but keep connection - pre-registered session may still work
              console.warn('[SocketService] REGISTER_SOCKET_RESPONSE not successful, but using pre-registered session');
            }
          }
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('[SocketService] Disconnected:', reason);
          this.logEvent('disconnect', { reason });
          this.setStatus('disconnected');
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('[SocketService] Connection error:', error.message);
          this.logEvent('connect_error', { message: error.message });
          this.setStatus('error');
          reject(error);
        });

        this.socket.on('reconnect_attempt', (n: number) => {
          console.log('[SocketService] Reconnect attempt:', n);
          this.logEvent('reconnect_attempt', { attempt: n });
          this.setStatus('connecting');
        });

        this.socket.on('reconnect', (n: number) => {
          console.log('[SocketService] Reconnected after', n, 'attempts');
          this.logEvent('reconnect', { attempts: n });
          // Re-register after reconnect
          if (this.lobId) {
            this.socket?.emit('REGISTER_SOCKET', this.lobId);
          }
        });

        this.socket.on('reconnect_error', (err: Error) => {
          console.warn('[SocketService] Reconnect error:', err.message);
          this.logEvent('reconnect_error', { message: err.message });
        });

        this.socket.on('reconnect_failed', () => {
          console.error('[SocketService] Reconnect failed');
          this.logEvent('reconnect_failed', {});
          this.setStatus('error');
        });

        // Set up event listeners for credential and verification events
        this.setupEventListeners();

        // Timeout if registration doesn't complete (only for non-pre-registered)
        setTimeout(() => {
          if (this.connectionStatus === 'connecting' && !this.preRegisteredSession) {
            console.warn('[SocketService] Registration timeout');
            this.setStatus('error');
            reject(new Error('Socket registration timeout'));
          }
        }, 30000);
      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Catch-all for debugging
    this.socket.onAny((event: string, ...args: unknown[]) => {
      console.log('[SocketService] Event:', event, args[0]);
      this.logEvent(event, args[0]);
    });

    // ISSUANCE_RESPONSE - credential offer status updates
    this.socket.on('ISSUANCE_RESPONSE', (msg: unknown) => {
      console.log('[SocketService] ISSUANCE_RESPONSE:', JSON.stringify(msg, null, 2));

      const message = msg as {
        payload?: {
          credentialStatus?: string;
          credOfferId?: string;
        };
      };

      const payload = message?.payload || {};
      const status = payload.credentialStatus;
      const credOfferId = payload.credOfferId;

      if (!status || !credOfferId) {
        console.warn('[SocketService] Missing status or credOfferId in ISSUANCE_RESPONSE');
        return;
      }

      // Map Orbit status to internal event types
      let mappedEvent: string;
      switch (status) {
        case 'offer-received':
          mappedEvent = 'offer_received';
          break;
        case 'credential-accepted':
          mappedEvent = 'offer_accepted';
          break;
        case 'stored-in-wallet':
        case 'done':
          mappedEvent = 'credential_issued';
          break;
        default:
          mappedEvent = status;
      }

      this.notifyHandlers(mappedEvent, {
        offerId: credOfferId,
        status,
        raw: payload,
      });
    });

    // CONNECTION_RESPONSE - connection state updates
    this.socket.on('CONNECTION_RESPONSE', (msg: unknown) => {
      console.log('[SocketService] CONNECTION_RESPONSE:', msg);
      const message = msg as { payload?: { state?: string } };
      const state = message?.payload?.state;
      this.notifyHandlers('connection', { state, raw: msg });
    });

    // VERIFICATION_RESPONSE - proof request status updates
    this.socket.on('VERIFICATION_RESPONSE', (msg: unknown) => {
      console.log('[SocketService] VERIFICATION_RESPONSE:', msg);
      const message = msg as { payload?: { proofRequestStatus?: string } };
      const status = message?.payload?.proofRequestStatus;
      this.notifyHandlers('verification', { status, raw: msg });
    });
  }

  private logEvent(event: string, data: unknown) {
    const logEntry: SocketEventLog = {
      timestamp: new Date().toISOString(),
      event,
      data,
    };

    this.eventLog.unshift(logEntry);

    // Keep log size manageable
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(0, this.maxLogSize);
    }
  }

  private setStatus(status: SocketConnectionStatus) {
    this.connectionStatus = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private notifyHandlers(eventType: string, data: unknown) {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(eventType, data);
      } catch (e) {
        console.error('[SocketService] Handler error:', e);
      }
    });
  }

  /**
   * Subscribe to socket events
   * @returns Unsubscribe function
   */
  subscribe(handler: SocketEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to connection status changes
   * @returns Unsubscribe function
   */
  onStatusChange(listener: (status: SocketConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    // Immediately notify of current status
    listener(this.connectionStatus);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Disconnect from socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.sessionId = null;
    this.setStatus('disconnected');
  }

  /**
   * Reconnect to socket (uses stored socketUrl and lobId)
   */
  async reconnect(): Promise<string> {
    if (!this.socketUrl || !this.lobId) {
      throw new Error('Cannot reconnect: no previous connection info');
    }
    this.disconnect();
    return this.connect(this.socketUrl, this.lobId);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get event log for debugging
   */
  getEventLog(): SocketEventLog[] {
    return [...this.eventLog];
  }

  /**
   * Clear event log
   */
  clearEventLog() {
    this.eventLog = [];
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected === true && this.connectionStatus === 'connected';
  }

  /**
   * Get current connection status
   */
  getStatus(): SocketConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get socket URL (for debugging)
   */
  getSocketUrl(): string | null {
    return this.socketUrl;
  }

  /**
   * Get LOB ID (for debugging)
   */
  getLobId(): string | null {
    return this.lobId;
  }
}

// Export singleton instance
export const socketService = new SocketService();
