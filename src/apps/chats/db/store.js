import IndexDBHandler from './db.js';

export default class ChatStorageManager extends IndexDBHandler {
  constructor() {
    super('chatDB', 1);
    this.PAGE_SIZE = 10;
    this.stores = [
      {
        name: 'conversations',
        keyPath: '_id',
        indices: [
          { 
            name: 'createdAt', 
            keyPath: 'createdAt',
            options: { unique: false }
          }
        ]
      },
      {
        name: 'chats',
        keyPath: '_id',
        indices: [
          { 
            name: 'conversationId', 
            keyPath: 'conversationId',
            options: { unique: false }
          },
          { 
            name: 'conversationCreatedAt', 
            keyPath: ['conversationId', 'createdAt'],
            options: { unique: false }
          }
        ]
      }
    ];
  }

  async initialize() {
    try {
      await this.init(this.stores);
    } catch (error) {
      throw new Error(`Chat storage initialization failed: ${error.message}`);
    }
  }

  // Validate conversation data
  validateConversation(conversation) {
    if (!conversation?._id) {
      throw new Error('Conversation must have an _id from the backend');
    }
    if (!conversation?.createdAt) {
      throw new Error('Conversation must have a createdAt timestamp');
    }
  }

  // Validate chat data
  validateChat(chat) {
    if (!chat?._id) {
      throw new Error('Chat must have an _id from the backend');
    }
    if (!chat?.conversationId) {
      throw new Error('Chat must have a conversationId');
    }
    if (!chat?.createdAt) {
      throw new Error('Chat must have a createdAt timestamp');
    }
  }

  async saveConversation(conversation) {
    try {
      this.validateConversation(conversation);
      await this.put('conversations', conversation);
      return conversation;
    } catch (error) {
      throw new Error(`Failed to save conversation: ${error.message}`);
    }
  }

  async saveChat(chat) {
    try {
      this.validateChat(chat);
      
      // Verify conversation exists
      const conversation = await this.getConversation(chat.conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${chat.conversationId} does not exist`);
      }

      await this.put('chats', chat);
      return chat;
    } catch (error) {
      throw new Error(`Failed to save chat: ${error.message}`);
    }
  }

  async saveChats(chats, conversationId) {
    try {
      // Verify conversation exists
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${conversationId} does not exist`);
      }

      // Validate all chats
      chats.forEach(chat => {
        this.validateChat({ ...chat, conversationId });
      });

      const transaction = await this.createTransaction('chats', 'readwrite');
      const store = transaction.objectStore('chats');
      
      return new Promise((resolve, reject) => {
        try {
          chats.forEach(chat => {
            store.put({ ...chat, conversationId });
          });
          resolve(chats);
        } catch (error) {
          reject(new Error(`Failed to save chats: ${error.message}`));
        }
      });
    } catch (error) {
      throw new Error(`Failed to save chats: ${error.message}`);
    }
  }

  async getConversation(conversationId) {
    try {
      return await this.get('conversations', conversationId);
    } catch (error) {
      throw new Error(`Failed to get conversation: ${error.message}`);
    }
  }

  async getChats(conversationId, page = 1, pageSize = this.PAGE_SIZE) {
    try {
      // Verify conversation exists
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${conversationId} does not exist`);
      }

      const transaction = await this.createTransaction('chats');
      const store = transaction.objectStore('chats');
      const index = store.index('conversationCreatedAt');
      
      const offset = (page - 1) * pageSize;
      const range = IDBKeyRange.bound(
        [conversationId, new Date(0).toISOString()],
        [conversationId, new Date('9999-12-31').toISOString()]
      );

      return new Promise((resolve, reject) => {
        const chats = [];
        let count = 0;
        let skipped = 0;
        
        const request = index.openCursor(range, 'prev');
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            if (skipped < offset) {
              skipped++;
              cursor.continue();
            } else if (count < pageSize) {
              chats.push(cursor.value);
              count++;
              cursor.continue();
            } else {
              resolve({
                chats,
                page,
                pageSize,
                hasMore: true
              });
            }
          } else {
            resolve({
              chats,
              page,
              pageSize,
              hasMore: false
            });
          }
        };
        
        request.onerror = () => reject(new Error('Failed to get chats'));
      });
    } catch (error) {
      throw new Error(`Failed to get chats: ${error.message}`);
    }
  }

  async getConversations(page = 1, pageSize = this.PAGE_SIZE) {
    try {
      const transaction = await this.createTransaction('conversations');
      const store = transaction.objectStore('conversations');
      const index = store.index('createdAt');
      
      const offset = (page - 1) * pageSize;

      return new Promise((resolve, reject) => {
        const conversations = [];
        let count = 0;
        let skipped = 0;
        
        const request = index.openCursor(null, 'prev');
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            if (skipped < offset) {
              skipped++;
              cursor.continue();
            } else if (count < pageSize) {
              conversations.push(cursor.value);
              count++;
              cursor.continue();
            } else {
              resolve({
                conversations,
                page,
                pageSize,
                hasMore: true
              });
            }
          } else {
            resolve({
              conversations,
              page,
              pageSize,
              hasMore: false
            });
          }
        };
        
        request.onerror = () => reject(new Error('Failed to get conversations'));
      });
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  async deleteConversation(conversationId) {
    try {
      const transaction = await this.createTransaction(['conversations', 'chats'], 'readwrite');
      const conversationStore = transaction.objectStore('conversations');
      const chatStore = transaction.objectStore('chats');
      const chatIndex = chatStore.index('conversationId');

      return new Promise((resolve, reject) => {
        try {
          // Delete the conversation
          conversationStore.delete(conversationId);

          // Delete all associated chats
          const request = chatIndex.openCursor(IDBKeyRange.only(conversationId));
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              chatStore.delete(cursor.primaryKey);
              cursor.continue();
            } else {
              resolve(true);
            }
          };
          request.onerror = () => reject(new Error('Failed to delete chats'));
        } catch (error) {
          reject(new Error(`Failed to delete conversation: ${error.message}`));
        }
      });
    } catch (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }
}