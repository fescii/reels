export default class WebSocketClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
    this.eventSocket = null;
    this.chatSockets = new Map(); // Store multiple chat connections
    this.listeners = new Map(); // Event listeners
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second delay
  }

  // Connect to the events WebSocket
  connectToEvents() {
    try {
      const url = `${this.baseUrl}/events`;
      this.eventSocket = new WebSocket(url, [], {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      this.eventSocket.onopen = () => {
        console.log('Connected to events WebSocket');
        this.reconnectAttempts = 0;
        this.emit('eventsConnected');
      };

      this.eventSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('event', data);
        } catch (error) {
          console.error('Error parsing event message:', error);
        }
      };

      this.eventSocket.onclose = (event) => {
        console.log('Events WebSocket closed:', event.code, event.reason);
        this.emit('eventsDisconnected');
        this.handleReconnect('events');
      };

      this.eventSocket.onerror = (error) => {
        console.error('Events WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Error connecting to events WebSocket:', error);
      this.handleReconnect('events');
    }
  }

  // Connect to a specific chat WebSocket
  connectToChat(conversationHex) {
    try {
      const url = `${this.baseUrl}/chat/${conversationHex}`;
      const chatSocket = new WebSocket(url, [], {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      chatSocket.onopen = () => {
        console.log(`Connected to chat WebSocket for conversation: ${conversationHex}`);
        this.emit('chatConnected', conversationHex);
      };

      chatSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('chatMessage', { conversationHex, data });
        } catch (error) {
          console.error('Error parsing chat message:', error);
        }
      };

      chatSocket.onclose = (event) => {
        console.log(`Chat WebSocket closed for ${conversationHex}:`, event.code, event.reason);
        this.chatSockets.delete(conversationHex);
        this.emit('chatDisconnected', conversationHex);
      };

      chatSocket.onerror = (error) => {
        console.error(`Chat WebSocket error for ${conversationHex}:`, error);
        this.emit('error', error);
      };

      this.chatSockets.set(conversationHex, chatSocket);
      return chatSocket;

    } catch (error) {
      console.error(`Error connecting to chat WebSocket for ${conversationHex}:`, error);
      throw error;
    }
  }

  // Send a message to a specific chat
  sendChatMessage(conversationHex, message) {
    const chatSocket = this.chatSockets.get(conversationHex);
    if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
      throw new Error(`No active connection for conversation: ${conversationHex}`);
    }

    try {
      const messageData = typeof message === 'string' ? message : JSON.stringify(message);
      chatSocket.send(messageData);
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  // Handle reconnection logic
  handleReconnect(type) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${type}`);
      return;
    }

    setTimeout(() => {
      console.log(`Attempting to reconnect to ${type}...`);
      this.reconnectAttempts++;
      if (type === 'events') {
        this.connectToEvents();
      }
      // Exponential backoff
      this.reconnectDelay *= 2;
    }, this.reconnectDelay);
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Clean up resources
  disconnect() {
    if (this.eventSocket) {
      this.eventSocket.close();
    }
    
    this.chatSockets.forEach((socket, hex) => {
      socket.close();
    });
    
    this.chatSockets.clear();
    this.listeners.clear();
  }
}