// WebSocketManager.js
export default class WebSocketManager {
  constructor(host, port=3001, reconnectInterval = 5000, maxReconnectAttempts = 60) {
    if (WebSocketManager.instance) {
      return WebSocketManager.instance;
    }
    
    this.url = `wss://${host}:${port}/events`;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectAttempts = 0;
    this.ws = null;
    this.messageHandlers = new Set();

    WebSocketManager.instance = this;
  }

  connect() {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }

  handleError(error) {
    console.error('WebSocket error:', error);
  }

  handleClose() {
    console.log('WebSocket connection closed');
    this.reconnect();
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached. Stopping reconnection.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    setTimeout(() => this.connect(), this.reconnectInterval);
  }

  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // console.log('Sending message:', data);
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not open. Message not sent.');
    }
  }

  handleMessage(event) {
    if (!event || event === undefined || !event.data) return;
    try {
      const data = JSON.parse(event.data);
      
      this.messageHandlers.forEach(handler => {
        if (typeof handler === 'function') {
          try {
            if (!data) return;
            handler(data);
          } catch (handlerError) {
            console.error('Error in message handler:', handlerError);
          }
        } else {
          console.warn('Invalid handler found:', handler);
        }
      });
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  addMessageHandler(handler) {
    // console.log('Adding message handler:', handler);
    if (typeof handler === 'function') {
      this.messageHandlers.add(handler);
    } else {
      console.error('Attempted to add invalid handler:', handler);
    }
  }

  removeMessageHandler(handler) {
    this.messageHandlers.delete(handler);
  }
}