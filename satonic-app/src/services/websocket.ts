import { api, Auction, Bid } from '@/lib/api';
import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface BidMessage {
  auction_id: string;
  wallet_id: string;
  amount: number;
}

class WebSocketService extends EventEmitter {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  connect() {
    if (this.socket) {
      this.close();
    }

    try {
      const url = api.ws.getUrl();
      this.socket = new WebSocket(url);
      this.socket.addEventListener('open', this.handleOpen);
      this.socket.addEventListener('message', this.handleMessage);
      this.socket.addEventListener('close', this.handleClose);
      this.socket.addEventListener('error', this.handleError);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  close() {
    if (this.socket) {
      this.socket.removeEventListener('open', this.handleOpen);
      this.socket.removeEventListener('message', this.handleMessage);
      this.socket.removeEventListener('close', this.handleClose);
      this.socket.removeEventListener('error', this.handleError);

      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
      this.socket = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  subscribe(auctionId: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'subscribe',
        payload: auctionId,
      };
      this.socket.send(JSON.stringify(message));
      console.log(`Subscribed to auction: ${auctionId}`);
    } else {
      console.warn('WebSocket not connected. Cannot subscribe to auction.');
      this.connect();
    }
  }

  unsubscribe(auctionId: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'unsubscribe',
        payload: auctionId,
      };
      this.socket.send(JSON.stringify(message));
      console.log(`Unsubscribed from auction: ${auctionId}`);
    } else {
      console.warn('WebSocket not connected. Cannot unsubscribe from auction.');
    }
  }

  placeBid(bidData: BidMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'bid',
        payload: bidData,
      };
      this.socket.send(JSON.stringify(message));
      console.log(`Placed bid on auction: ${bidData.auction_id}`);
    } else {
      console.error('WebSocket not connected. Cannot place bid.');
      this.emit('error', { message: 'WebSocket not connected. Cannot place bid.' });
    }
  }

  private handleOpen(event: Event) {
    console.log('WebSocket connection established');
    this.emit('connected');
    this.reconnectAttempts = 0;

    // Set up heartbeat to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', message.type);

      switch (message.type) {
        case 'welcome':
          this.emit('welcome', message.payload);
          break;

        case 'auction_update':
          const auction: Auction = message.payload;
          this.emit('auction_update', auction);
          break;

        case 'bid_placed':
          const bid: Bid = message.payload;
          this.emit('bid_placed', bid);
          break;

        case 'error':
          console.error('WebSocket error message:', message.payload);
          this.emit('error', message.payload);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent) {
    console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
    this.emit('disconnected', event);
    
    // Attempt to reconnect if not intentionally closed
    if (event.code !== 1000 && event.code !== 1001) {
      this.attemptReconnect();
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleError(event: Event) {
    console.error('WebSocket error:', event);
    this.emit('error', { message: 'WebSocket connection error' });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts})`);
      
      this.reconnectTimeoutId = setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts.`);
      this.emit('reconnect_failed');
    }
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService(); 