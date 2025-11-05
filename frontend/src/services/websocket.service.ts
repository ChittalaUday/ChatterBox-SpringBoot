import { Client, StompSubscription } from '@stomp/stompjs';
import AuthService from './auth.service';
import { ChatMessage, FriendRequest } from './chat.types';

class WebSocketService {
  private stompClient: Client | null = null;
  private connected = false;
  private messageListeners: Array<(message: ChatMessage) => void> = [];
  private friendRequestListeners: Array<(request: FriendRequest) => void> = [];
  private subscriptions: StompSubscription[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private useSockJS = false;

  connect() {
    // If already connected, don't reconnect
    if (this.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const token = AuthService.getToken();
    if (!token) {
      console.error('No auth token available');
      return;
    }

    console.log('Using auth token for WebSocket connection:', token);

    // Get user ID from the stored user object
    const currentUser = AuthService.getCurrentUser();
    const userId = currentUser?.id;
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    console.log('Current user ID:', userId);

    // Clear previous subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    // Try WebSocket first, fallback to SockJS if needed
    // Use the same port as the REST API (8083)
    const brokerURL = this.useSockJS 
      ? 'http://localhost:8083/api/ws' 
      : 'ws://localhost:8083/api/ws';

    this.stompClient = new Client({
      brokerURL: brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function (str) {
        console.log('[STOMP] ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // Use SockJS only if we're falling back
      webSocketFactory: this.useSockJS ? undefined : () => {
        // Create WebSocket with authorization header
        const ws = new WebSocket(brokerURL);
        ws.onopen = () => {
          // Headers are sent during the STOMP CONNECT frame, not during WebSocket handshake
        };
        return ws;
      },
      forceBinaryWSFrames: false,
      appendMissingNULLonIncoming: false,
      onConnect: (frame) => {
        console.log('Connected to WebSocket: ' + frame);
        this.connected = true;
        this.reconnectAttempts = 0;

        // Subscribe to public chat messages
        const publicSub = this.stompClient?.subscribe('/topic/messages', (message) => {
          try {
            console.log('Received public message:', message.body);
            const chatMessage: ChatMessage = JSON.parse(message.body);
            // Notify all message listeners
            this.messageListeners.forEach(listener => {
              try {
                listener(chatMessage);
              } catch (error) {
                console.error('Error in message listener:', error);
              }
            });
          } catch (error) {
            console.error('Error parsing public message:', error);
          }
        });
        
        if (publicSub) {
          this.subscriptions.push(publicSub);
        }

        // Subscribe to private messages
        // In Spring WebSocket, when using convertAndSendToUser(userId, "/queue/messages", ...),
        // the actual destination becomes "/user/{userId}/queue/messages"
        const privateSub = this.stompClient?.subscribe('/user/queue/messages', (message) => {
          try {
            console.log('Received private message:', message.body);
            const chatMessage: ChatMessage = JSON.parse(message.body);
            // Notify all message listeners
            this.messageListeners.forEach(listener => {
              try {
                listener(chatMessage);
              } catch (error) {
                console.error('Error in message listener:', error);
              }
            });
          } catch (error) {
            console.error('Error parsing private message:', error);
          }
        });
        
        if (privateSub) {
          this.subscriptions.push(privateSub);
        }
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        this.connected = false;
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        this.connected = false;
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket connection closed with code:', event.code, 'reason:', event.reason);
        this.connected = false;
        // Attempt to reconnect if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          // If we're using WebSocket and it failed, try SockJS next time
          if (!this.useSockJS && event.code !== 1000) {
            this.useSockJS = true;
            console.log('Switching to SockJS for next connection attempt');
          }
          
          setTimeout(() => {
            this.connect();
          }, 2000);
        } else {
          // Reset to WebSocket for next manual connection attempt
          this.useSockJS = false;
        }
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
      }
    });

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions = [];
      this.stompClient.deactivate();
      this.connected = false;
      // Reset to WebSocket for next connection
      this.useSockJS = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.stompClient !== null;
  }

  sendMessage(message: ChatMessage) {
    if (this.stompClient && this.connected) {
      console.log('Sending public message:', message);
      this.stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify(message)
      });
    } else {
      console.error('WebSocket not connected. Current connection status:', this.connected);
      // Try to reconnect
      this.connect();
    }
  }

  sendPrivateMessage(message: ChatMessage) {
    if (this.stompClient && this.connected) {
      console.log('Sending private message:', message);
      this.stompClient.publish({
        destination: '/app/private',
        body: JSON.stringify(message)
      });
    } else {
      console.error('WebSocket not connected. Current connection status:', this.connected);
      // Try to reconnect
      this.connect();
    }
  }

  addMessageListener(listener: (message: ChatMessage) => void) {
    console.log('Adding message listener');
    this.messageListeners.push(listener);
  }

  removeMessageListener(listener: (message: ChatMessage) => void) {
    console.log('Removing message listener');
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  addFriendRequestListener(listener: (request: FriendRequest) => void) {
    this.friendRequestListeners.push(listener);
  }

  removeFriendRequestListener(listener: (request: FriendRequest) => void) {
    this.friendRequestListeners = this.friendRequestListeners.filter(l => l !== listener);
  }
}

export default new WebSocketService();