import { aiChatService } from './aiChatService';
import { api } from '../lib/api';

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot' | 'system';
  timestamp: Date;
  sessionId: string;
  userId?: string;
  confidence?: number;
  suggestions?: string[];
  followUpQuestions?: string[];
  rating?: number;
  feedback?: string;
  context?: any;
  messageType?: 'text' | 'analysis' | 'suggestion' | 'tactical' | 'insight' | 'recommendation';
  sources?: string[];
  actions?: ChatAction[];
}

export interface ChatAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'download' | 'navigate';
  action: () => void;
  icon?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  metadata?: {
    sport?: 'soccer' | 'futsal';
    teamId?: string;
    context?: any;
  };
}

class ChatService {
  private sessions: Map<string, ChatSession> = new Map();
  private currentSessionId: string | null = null;

  async createSession(userId: string, title?: string): Promise<ChatSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      title: title || `Chat Session ${new Date().toLocaleDateString()}`,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getSessions(userId: string): Promise<ChatSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async sendMessage(
    sessionId: string,
    content: string,
    type: 'user' | 'bot' | 'system' = 'user',
    userId?: string
  ): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: ChatMessage = {
      id: messageId,
      content,
      type,
      timestamp: new Date(),
      sessionId,
      userId
    };

    session.messages.push(message);
    session.updatedAt = new Date();

    // If it's a user message, generate AI response
    if (type === 'user' && userId) {
      try {
        const aiResponse = await aiChatService.processMessage(content, {
          userId,
          sport: session.metadata?.sport || 'soccer',
          teamData: session.metadata?.context?.teamData,
          userPreferences: session.metadata?.context?.userPreferences,
          sessionHistory: session.messages,
          isPremium: true
        });

        const botMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const botMessage: ChatMessage = {
          id: botMessageId,
          content: aiResponse.content,
          type: 'bot',
          timestamp: new Date(),
          sessionId,
          confidence: aiResponse.confidence,
          suggestions: aiResponse.suggestions,
          followUpQuestions: aiResponse.followUpQuestions
        };

        session.messages.push(botMessage);
        session.updatedAt = new Date();
        
        return botMessage;
      } catch (error) {
        console.error('Error generating AI response:', error);
        
        const errorMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const errorMessage: ChatMessage = {
          id: errorMessageId,
          content: 'I apologize, but I\'m having trouble processing your request right now. Please try again.',
          type: 'bot',
          timestamp: new Date(),
          sessionId
        };

        session.messages.push(errorMessage);
        return errorMessage;
      }
    }

    return message;
  }

  async rateMessage(messageId: string, rating: number, feedback?: string): Promise<void> {
    for (const session of this.sessions.values()) {
      const message = session.messages.find(m => m.id === messageId);
      if (message) {
        message.rating = rating;
        message.feedback = feedback;
        session.updatedAt = new Date();
        break;
      }
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
  }

  async exportSession(sessionId: string, format: 'json' | 'pdf' = 'json'): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (format === 'json') {
      return JSON.stringify(session, null, 2);
    }

    // For PDF export, return a formatted text version
    let content = `Chat Session: ${session.title}\n`;
    content += `Created: ${session.createdAt.toLocaleString()}\n\n`;
    
    session.messages.forEach(message => {
      content += `[${message.timestamp.toLocaleTimeString()}] ${message.type.toUpperCase()}: ${message.content}\n\n`;
    });

    return content;
  }

  async searchSessions(userId: string, query: string): Promise<ChatSession[]> {
    const userSessions = await this.getSessions(userId);
    const lowercaseQuery = query.toLowerCase();
    
    return userSessions.filter(session => {
      return session.title.toLowerCase().includes(lowercaseQuery) ||
             session.messages.some(message => 
               message.content.toLowerCase().includes(lowercaseQuery)
             );
    });
  }

  async updateSessionMetadata(sessionId: string, metadata: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.metadata = { ...session.metadata, ...metadata };
      session.updatedAt = new Date();
    }
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;