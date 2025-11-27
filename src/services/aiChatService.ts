import { footballAnalysisService } from './footballAnalysisService';
import { userDataAnalysisService } from './userDataAnalysisService';
import { injuryAssessmentService, PlayerHealthData } from './injuryAssessmentService';
import { accountManagementService } from './accountManagementService';
import axios from 'axios';
import { api } from '../lib/api';

// Types
export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  context?: any;
}

export interface UserContext {
  userId: string;
  teamData?: any;
  currentContext?: any;
  preferences?: any;
}

export interface AIResponse {
  content: string;
  confidence: number;
  suggestions?: string[];
  followUpQuestions?: string[];
  intent?: string;
  entities?: any;
}

// AI Chat Service that connects to the backend proxy
class AIChatService {
  private userContextCache: Map<string, UserContext> = new Map();
  private conversationMemory: Map<string, ChatMessage[]> = new Map();
  private apiBaseUrl: string;

  constructor() {
    // Use the backend API URL - defaulting to localhost:3001
    this.apiBaseUrl = import.meta.env['VITE_API_URL'] || 'http://localhost:3001';
  }

  async processMessage(message: string, userContext: UserContext): Promise<AIResponse> {
    try {
      // Validate input
      if (!message || message.trim().length === 0) {
        return this.generateHelpfulResponse('empty_message', userContext);
      }

      // Check if this is a demo account
      const isDemoAccount = this.isDemoAccount();
      if (isDemoAccount) {
        return this.generateDemoResponse(message, userContext);
      }

      // Get auth token from secure storage
      const token = this.getAuthToken();
      if (!token) {
        return this.generateHelpfulResponse('no_auth', userContext);
      }

      // Add user message to conversation history
      this.addToConversationMemory(userContext.userId, {
        id: Date.now().toString(),
        type: 'user',
        content: message,
        timestamp: new Date()
      });

      // Try multiple approaches for better responses
      let response: AIResponse;
      
      // First, try the backend AI assistant
      try {
        response = await this.callBackendAIAssistant(message, userContext);
        if (this.isValidResponse(response)) {
          return this.enhanceResponse(response, message, userContext);
        }
      } catch (backendError) {
        console.warn('Backend AI unavailable, using fallback:', backendError);
      }

      // Fallback to football analysis if applicable
      if (this.isFootballAnalysisQuery(message)) {
        try {
          response = await this.handleFootballAnalysis(message, userContext);
          if (this.isValidResponse(response)) {
            return this.enhanceResponse(response, message, userContext);
          }
        } catch (analysisError) {
          console.warn('Football analysis failed, using template:', analysisError);
        }
      }

      // Final fallback to enhanced template responses
      return this.generateIntelligentResponse(message, userContext);
       
    } catch (error) {
      console.error('Critical error in processMessage:', error);
      return this.generateErrorRecoveryResponse(message, userContext);
    }
  }

  private async callBackendAIAssistant(message: string, userContext: UserContext): Promise<AIResponse> {
    try {
      // Get auth token from secure storage
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
       
      // Prepare request data
      const requestData = {
        message: message,
        context: {
          userId: userContext.userId,
          teamData: userContext.teamData,
          currentContext: userContext.currentContext,
          preferences: userContext.preferences
        }
      };

      // Make API call to backend proxy
      const response = await axios.post(
        `${this.getApiUrl('/api/v1/ai-proxy/chat')}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract response data
      const aiData = response.data.data;
      
      // Check if we got a successful response from the AI
      if (response.data.success && aiData) {
        return {
          content: aiData.response || aiData.content || 'I understand your question. Here\'s my analysis based on your team data.',
          confidence: 95, // High confidence for AI responses
          suggestions: aiData.suggestions || this.generateSuggestions(message, aiData.intent),
          followUpQuestions: aiData.followUpQuestions || this.generateFollowUpQuestions(message, aiData.intent),
          intent: aiData.intent,
          entities: aiData.entities
        };
      } else {
        // If the backend returned an error, fallback to template responses
        console.warn('AI Assistant backend returned an error:', response.data.error);
        return this.generateTemplateResponse(message, userContext);
      }
    } catch (error: any) {
      console.error('Error calling AI Assistant:', error);
      
      // Fallback to template-based responses if backend is unavailable
      return this.generateTemplateResponse(message, userContext);
    }
  }

  private generateSuggestions(message: string, intent?: string): string[] {
    const suggestions: Record<string, string[]> = {
      "player_info": [
        "Tell me about our top scorer",
        "Who has the most assists?",
        "Show me player fitness levels"
      ],
      "team_info": [
        "What's our current formation?",
        "How are we doing in the league?",
        "Team's recent form"
      ],
      "match_info": [
        "Last match analysis",
        "Next match details",
        "Head-to-head record"
      ],
      "tactics": [
        "Suggest a formation",
        "How to counter 4-3-3?",
        "Pressing strategies"
      ],
      "training": [
        "Possession drills",
        "Fitness training",
        "Set piece practice"
      ],
      "analysis": [
        "Team strengths",
        "Areas for improvement",
        "Data insights"
      ],
      "prediction": [
        "Match prediction",
        "Win probability",
        "Key factors"
      ],
      "agent_action": [
        "Add a new player",
        "Schedule a match",
        "Transfer a player"
      ],
      "default": [
        "Analyze our formation",
        "Tactical advice",
        "Player performance"
      ]
    };

    return suggestions[intent || "default"] || suggestions["default"] || [];
  }

  private generateFollowUpQuestions(message: string, intent?: string): string[] {
    const questions: Record<string, string[]> = {
      "player_info": [
        "What are their strengths?",
        "How can they improve?",
        "Contract situation?"
      ],
      "team_info": [
        "Formation analysis?",
        "League position?",
        "Recent results?"
      ],
      "match_info": [
        "Tactical approach?",
        "Key players?",
        "Match prediction?"
      ],
      "tactics": [
        "Formation strengths?",
        "In-game adjustments?",
        "Opposition analysis?"
      ],
      "training": [
        "Specific drills?",
        "Training schedule?",
        "Skill development?"
      ],
      "analysis": [
        "Performance metrics?",
        "Comparative analysis?",
        "Recommendations?"
      ],
      "prediction": [
        "Factors affecting outcome?",
        "Player availability?",
        "Historical data?"
      ],
      "agent_action": [
        "What player position?",
        "What are the requirements?",
        "Budget considerations?"
      ],
      "default": [
        "Tell me more",
        "What else can you help with?",
        "Any specific advice?"
      ]
    };

    return questions[intent || "default"] || questions["default"] || [];
  }

  private isValidResponse(response: AIResponse): boolean {
    return !!(response && 
           response.content && 
           response.content.trim().length > 0 && 
           response.confidence > 0 &&
           !response.content.includes('Sorry, I encountered an error') &&
           !response.content.includes('technical difficulties'));
  }

  private enhanceResponse(response: AIResponse, originalMessage: string, userContext: UserContext): AIResponse {
    // Add conversational elements to make responses more human-like
    const conversationHistory = this.conversationMemory.get(userContext.userId) || [];
    const isFirstMessage = conversationHistory.length <= 1;
    
    let enhancedContent = response.content;
    
    // Add greeting for first interaction
    if (isFirstMessage && !enhancedContent.toLowerCase().includes('hello') && !enhancedContent.toLowerCase().includes('hi')) {
      enhancedContent = `Hello! ${enhancedContent}`;
    }
    
    // Add contextual acknowledgment
    if (originalMessage.toLowerCase().includes('help')) {
      enhancedContent = `I'm here to help! ${enhancedContent}`;
    }
    
    // Ensure response ends with engagement
    if (!enhancedContent.endsWith('?') && !enhancedContent.endsWith('.') && !enhancedContent.endsWith('!')) {
      enhancedContent += '. What would you like to know more about?';
    }
    
    return {
      ...response,
      content: enhancedContent,
      confidence: Math.min(response.confidence + 5, 95) // Boost confidence slightly
    };
  }

  private generateHelpfulResponse(type: string, userContext: UserContext): AIResponse {
    const responses = {
      empty_message: {
        content: "I'm here to help with your tactical questions! You can ask me about formations, player analysis, training strategies, or match preparation. What would you like to discuss?",
        confidence: 85,
        suggestions: ['Analyze team formation', 'Get training advice', 'Player performance tips'],
        followUpQuestions: ['What formation should I use?', 'How can I improve my team\'s fitness?', 'What are effective training drills?']
      }
    };
    
    return (responses as any)[type] || this.generateIntelligentResponse('help', userContext);
  }

  private generateErrorRecoveryResponse(originalMessage: string, userContext: UserContext): AIResponse {
    const errorResponses = [
      "I apologize for the technical difficulty. Let me try to help you with that question in a different way.",
      "I'm experiencing some connectivity issues, but I can still provide tactical advice based on my knowledge.",
      "There seems to be a temporary issue, but I'm still here to help with your football questions."
    ];
    
    const randomResponse = errorResponses[Math.floor(Math.random() * errorResponses.length)];
    
    return {
      content: `${randomResponse} You asked about: "${originalMessage}". ${this.generateContextualAdvice(originalMessage)}`,
      confidence: 60,
      suggestions: ['Try rephrasing your question', 'Ask about formations', 'Get training tips'],
      followUpQuestions: ['What specific area would you like help with?', 'Should I explain football tactics?']
    };
  }

  private generateIntelligentResponse(message: string, userContext: UserContext): AIResponse {
    const lowerMessage = message.toLowerCase();
    const conversationHistory = this.conversationMemory.get(userContext.userId) || [];
    
    // Analyze conversation context
    const recentTopics = conversationHistory.slice(-3).map(msg => msg.content.toLowerCase());
    const isFollowUp = recentTopics.some(topic => 
      topic.includes('formation') || topic.includes('tactics') || topic.includes('training')
    );
    
    // Agent actions (team management)
    if (lowerMessage.includes('add') || lowerMessage.includes('remove') || lowerMessage.includes('create') || 
        lowerMessage.includes('delete') || lowerMessage.includes('sign') || lowerMessage.includes('transfer') ||
        lowerMessage.includes('buy') || lowerMessage.includes('sell') || lowerMessage.includes('release') ||
        lowerMessage.includes('manage') || lowerMessage.includes('organize') || lowerMessage.includes('schedule')) {
      return {
        content: `I can help you with team management tasks! ${isFollowUp ? 'Building on our previous discussion, ' : ''}In a real system, I would be able to perform actions like adding players, scheduling matches, and managing your team roster. For example, if you wanted to add a new player, I would guide you through the process of scouting, contract negotiation, and integration into your team. What specific team management task would you like to explore?`,
        confidence: 90,
        suggestions: ['Add a new player', 'Schedule a match', 'Transfer a player'],
        followUpQuestions: ['What position are you looking to fill?', 'What is your budget for transfers?', 'When would you like to schedule the match?']
      };
    }
    
    // Formation and tactics
    if (lowerMessage.includes('formation') || lowerMessage.includes('lineup') || lowerMessage.includes('tactic')) {
      return {
        content: `Great question about formations! ${isFollowUp ? 'Building on our previous discussion, ' : ''}The key to a successful formation is balancing your team's strengths with the opponent's weaknesses. For example, if you're facing a team that struggles with wide play, a 4-3-3 formation with attacking wingers could be very effective. What's your current formation, and what challenges are you facing with it?`,
        confidence: 88,
        suggestions: ['Explain 4-3-3 formation', 'Counter-attacking strategies', 'Defensive formations'],
        followUpQuestions: ['What formation does your opponent typically use?', 'Do you prefer attacking or defensive play?', 'Which players are your key strengths?']
      };
    }
    
    // Training and improvement
    if (lowerMessage.includes('training') || lowerMessage.includes('drill') || lowerMessage.includes('practice')) {
      return {
        content: `Excellent focus on training! ${isFollowUp ? 'Continuing from what we discussed, ' : ''}Effective training should be specific, measurable, and game-realistic. I recommend the 80/20 rule: 80% of training should simulate real match conditions, while 20% focuses on isolated skill development. What specific skills or areas would you like your team to improve?`,
        confidence: 85,
        suggestions: ['Passing drills', 'Fitness training', 'Set piece practice'],
        followUpQuestions: ['What\'s your team\'s biggest weakness?', 'How often do you train per week?', 'Do you focus more on technical or physical training?']
      };
    }
    
    // Player analysis and development
    if (lowerMessage.includes('player') || lowerMessage.includes('performance') || lowerMessage.includes('skill')) {
      return {
        content: `Player development is crucial for team success! ${isFollowUp ? 'As we\'ve been discussing, ' : ''}Every player has unique attributes that can be maximized through targeted training. I always recommend focusing on a player's natural strengths while gradually improving their weaker areas. Individual development plans work best when they align with the team's tactical system. Which players or positions are you most concerned about?`,
        confidence: 82,
        suggestions: ['Individual training plans', 'Position-specific advice', 'Skill assessment'],
        followUpQuestions: ['What position needs the most improvement?', 'Are there specific technical skills to work on?', 'How do you currently assess player performance?']
      };
    }
    
    // Match analysis and strategy
    if (lowerMessage.includes('match') || lowerMessage.includes('game') || lowerMessage.includes('opponent')) {
      return {
        content: `Match preparation is where tactics come to life! ${isFollowUp ? 'Building on our tactical discussion, ' : ''}Successful teams analyze their opponents thoroughly and adapt their game plan accordingly. This includes studying the opponent's formation, key players, set piece tendencies, and recent form. The best coaches prepare multiple tactical scenarios for different match situations. What specific match situation would you like to prepare for?`,
        confidence: 87,
        suggestions: ['Pre-match analysis', 'In-game adjustments', 'Set piece strategies'],
        followUpQuestions: ['What\'s your next opponent\'s playing style?', 'Do you need help with substitution timing?', 'How do you handle pressure situations?']
      };
    }
    
    // Generic but contextual response
    return {
      content: `I understand you're asking about "${message}". ${isFollowUp ? 'Given our ongoing conversation, ' : ''}As your tactical assistant, I'm here to provide detailed, practical advice that you can implement immediately. Whether it's formations, training methods, player development, or match strategies, I can help you make informed decisions. What specific aspect of football management would you like to explore together?`,
      confidence: 75,
      suggestions: ['Formation advice', 'Training strategies', 'Player development', 'Match preparation', 'Team management'],
      followUpQuestions: ['What\'s your biggest tactical challenge right now?', 'Would you like help with a specific formation?', 'Are you preparing for an important match?']
    };
  }

  private generateContextualAdvice(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('formation')) {
      return "For formations, consider your players' strengths and the opponent's weaknesses. A balanced approach often works best.";
    }
    if (lowerMessage.includes('training')) {
      return "For training, focus on match-realistic scenarios and maintain a good balance between technical and physical work.";
    }
    if (lowerMessage.includes('player')) {
      return "For player development, individual assessment and targeted improvement plans yield the best results.";
    }
    
    return "I can help you with tactical analysis, formation advice, training strategies, and player development. What interests you most?";
  }

  private generateTemplateResponse(message: string, userContext: UserContext): AIResponse {
    // This method is now deprecated in favor of generateIntelligentResponse
    return this.generateIntelligentResponse(message, userContext);
  }

  private addToConversationMemory(userId: string, message: ChatMessage): void {
    const history = this.conversationMemory.get(userId) || [];
    history.push(message);
    
    // Keep only last 50 messages to manage memory
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    this.conversationMemory.set(userId, history);
  }

  private isFootballAnalysisQuery(message: string): boolean {
    const footballKeywords = ['formation', 'tactic', 'strategy', 'analysis', 'player', 'match', 'team', 'training', 'injury', 'performance', 'goal', 'assist', 'clean sheet', 'add', 'remove', 'create', 'sign', 'transfer', 'manage'];
    return footballKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private async handleFootballAnalysis(message: string, userContext: UserContext): Promise<AIResponse> {
    try {
      // Use football analysis service for enhanced responses
      const analysisResult = await footballAnalysisService.analyzeMatch({
        homeTeam: 'User Team',
        awayTeam: 'Opponent',
        analysisType: 'detailed'
      });

      return {
        content: this.formatFootballAnalysis(analysisResult, message),
        confidence: 85,
        suggestions: ['Ask about formations', 'Request tactical advice'],
        followUpQuestions: ['What formation should I use?', 'How can I improve my defense?']
      };
    } catch (error) {
      return this.callBackendAIAssistant(message, userContext);
    }
  }

  private formatFootballAnalysis(analysis: any, originalMessage: string): string {
    return `Based on tactical analysis:

Key Insights:
• ${analysis.insights?.[0] || 'Strong tactical foundation recommended'}
• ${analysis.insights?.[1] || 'Focus on team coordination'}

Recommendations:
• ${analysis.recommendations?.[0] || 'Maintain current formation'}
• ${analysis.recommendations?.[1] || 'Improve passing accuracy'}

This analysis is based on current football tactics and your query: "${originalMessage}"`;
  }

  async loadHistory(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await axios.get(`${this.apiBaseUrl}/api/v1/ai-proxy/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data) {
        const history = response.data.data.map((item: any) => ([
          {
            id: `user_${item.id}`,
            type: 'user',
            content: item.message,
            timestamp: new Date(item.timestamp),
          },
          {
            id: `bot_${item.id}`,
            type: 'bot',
            content: item.response,
            timestamp: new Date(item.timestamp),
            context: item.context,
          },
        ])).flat();

        // Assuming we have a way to get the current user ID
        const userId = 'current_user'; // This should be replaced with actual user ID
        this.conversationMemory.set(userId, history);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }

  async sendMessage(message: string, context?: any): Promise<any> {
    try {
      const token = this.getAuthToken();
      
      // Check if we have a token
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Try to make the API call
      const response = await axios.post(`${this.getApiUrl('/api/v1/ai-proxy/chat')}`, {
        message,
        context
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to send messages.');
      } else if (error.response?.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.request) {
        // Network error (no response received)
        throw new Error('Unable to connect to the AI assistant service. Please ensure all services are running.');
      } else {
        // Other errors
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  async getTeamData(): Promise<any> {
    try {
      const token = this.getAuthToken();
      const response = await axios.get(`${this.getApiUrl('/api/v1/ai-proxy/team-data')}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting team data:', error);
      throw error;
    }
  }

  async updateTeamData(teamData: any): Promise<any> {
    try {
      const token = this.getAuthToken();
      const response = await axios.post(`${this.getApiUrl('/api/v1/ai-proxy/team-data')}`, teamData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating team data:', error);
      throw error;
    }
  }

  /**
   * Get auth token from secure storage - Production ready
   */
  private getAuthToken(): string | null {
    // Try multiple storage methods for production compatibility
    const token = localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('auth_token') ||
                  this.getCookie('auth_token');
    return token;
  }

  /**
   * Get API URL based on environment - Production ready
   */
  private getApiUrl(endpoint: string): string {
    const isProduction = import.meta.env.PROD;
    const baseUrl = isProduction 
      ? (import.meta.env.VITE_API_URL || 'https://api.statsor.com')
      : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Get cookie value - Production ready
   */
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  /**
   * Check if current user is using a demo account
   */
  private isDemoAccount(): boolean {
    try {
      const userStr = localStorage.getItem('statsor_user');
      if (!userStr) return false;
      
      const user = JSON.parse(userStr);
      return user.provider === 'demo' || 
             user.email?.includes('demo') || 
             user.id?.startsWith('demo-') ||
             user.isDemo === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate demo responses for demo accounts
   */
  private generateDemoResponse(message: string, _userContext: UserContext): AIResponse {
    const msg = message.toLowerCase();
    
    if (msg.includes('player') || msg.includes('team')) {
      return {
        content: "In demo mode, I can show you sample player data and team analytics. You have 3 demo players: John Smith (forward), Mike Johnson (defender), and Sarah Wilson (midfielder). Would you like to see their performance stats?",
        confidence: 0.9,
        suggestions: ['Show player stats', 'View team analysis', 'Compare players'],
        followUpQuestions: ['Which player interests you most?', 'Do you want to see performance trends?']
      };
    }
    
    if (msg.includes('hello') || msg.includes('hi')) {
      return {
        content: "Hello! I'm your demo AI assistant. I can help you explore player management, team analytics, and performance insights. What would you like to know about your demo team?",
        confidence: 0.95,
        suggestions: ['Show player roster', 'View team performance', 'Analyze recent matches'],
        followUpQuestions: ['What aspect of team management interests you?', 'Do you want to see player statistics?']
      };
    }
    
    return {
      content: "This is a demo response. In the full version, I would provide detailed analysis based on your actual team data. For now, you can explore the demo features and sample data.",
      confidence: 0.8,
      suggestions: ['Explore demo features', 'View sample data', 'Try player management'],
      followUpQuestions: ['What would you like to explore?', 'Need help with navigation?']
    };
  }
}

export const aiChatService = new AIChatService();
