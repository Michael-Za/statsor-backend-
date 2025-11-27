import { footballAnalysisService } from './footballAnalysisService';
import { userDataAnalysisService } from './userDataAnalysisService';
import OpenAI from 'openai';

// Types
export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
}

// Mock AI Chat Service
class AIChatService {
  private conversationMemory: Map<string, ChatMessage[]> = new Map();
  private apiKey: string | null = null;

  constructor() {
    // Initialize with environment variable if available
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async processMessage(message: string, userContext: UserContext): Promise<AIResponse> {
    try {
      // Add user message to conversation history
      this.addToConversationMemory(userContext.userId, {
        id: Date.now().toString(),
        type: 'user',
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      // Check if this is a football analysis query
      if (this.isFootballAnalysisQuery(message)) {
        return await this.handleFootballAnalysis(message, userContext);
      }

      // For non-football queries, use standard AI response
      return await this.generateIntelligentResponse(message, userContext);
    } catch (error) {
      console.error('Error processing AI chat message:', error);
      return {
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        confidence: 0,
        suggestions: [],
        followUpQuestions: []
      };
    }
  }

  private async generateIntelligentResponse(message: string, userContext: UserContext): Promise<AIResponse> {
    // Analyze the message to determine intent
    const analysis = this.analyzeMessage(message, userContext);

    // If we have a valid API key, use OpenAI
    if (this.apiKey) {
      try {
        return await this.callOpenAI(message, userContext, this.apiKey);
      } catch (error) {
        console.warn('OpenAI call failed, falling back to template responses');
      }
    }

    // Fallback to template-based responses
    return this.generateTemplateResponse(message, userContext, analysis);
  }

  private generateTemplateResponse(
    message: string,
    userContext: UserContext,
    analysis: ReturnType<AIChatService['analyzeMessage']>
  ): AIResponse {
    const lowerMessage = message.toLowerCase();

    // Formation-related queries
    if (lowerMessage.includes('formation') || lowerMessage.includes('lineup')) {
      return {
        content: this.formatFormationAnalysis({ insights: [], recommendations: [] }, message),
        confidence: 75,
        suggestions: ['Ask about player positions', 'Request tactical advice'],
        followUpQuestions: ['What formation works best against 4-3-3?', 'How can I improve my team shape?']
      };
    }

    // Training-related queries
    if (lowerMessage.includes('training') || lowerMessage.includes('drill')) {
      return {
        content: this.formatTrainingPlan({ sessions: [], focus: [] }, message),
        confidence: 70,
        suggestions: ['Ask about specific skills', 'Request personalized plans'],
        followUpQuestions: ['What drills improve passing?', 'How often should we train?']
      };
    }

    // Player analysis queries
    if (lowerMessage.includes('player') || lowerMessage.includes('performance')) {
      return {
        content: this.formatPlayerAnalysis({ insights: [], recommendations: [] }, message),
        confidence: 72,
        suggestions: ['Ask about development plans', 'Request skill assessments'],
        followUpQuestions: ['How can I improve my weak foot?', 'What positions suit me best?']
      };
    }

    // Generic response
    return {
      content: `I understand you're asking about "${message}". As your football assistant, I can help with formations, tactics, training plans, and player development. What specific aspect would you like to discuss?`,
      confidence: 60,
      suggestions: ['Ask about formations', 'Request training plans', 'Get player advice'],
      followUpQuestions: ['What formation should I use?', 'How can I improve my team?', 'What training drills help?']
    };
  }

  private formatFormationAnalysis(analysis: any, originalMessage: string): string {
    return `📋 Formation Analysis

Key Insights:
• ${analysis.insights?.[0] || 'Focus on team shape and positioning'}
• ${analysis.insights?.[1] || 'Maintain tactical discipline'}

Strategic Recommendations:
• ${analysis.recommendations?.[0] || 'Adapt formation to opponent'}
• ${analysis.recommendations?.[1] || 'Focus on transition moments'}

Based on your query: "${originalMessage}"`;
  }

  private formatPlayerAnalysis(analysis: any, originalMessage: string): string {
    return `👥 Player Analysis

Performance Insights:
• ${analysis.insights?.[0] || 'Individual development opportunities identified'}
• ${analysis.insights?.[1] || 'Team chemistry and positioning analysis'}

Development Focus:
• ${analysis.recommendations?.[0] || 'Technical skill enhancement'}
• ${analysis.recommendations?.[1] || 'Tactical awareness improvement'}

Analysis for: "${originalMessage}"`;
  }

  private formatTrainingPlan(plan: any, originalMessage: string): string {
    return `🏃 Training Plan

Recommended Sessions:
• ${plan.sessions?.[0] || 'Technical skills development'}
• ${plan.sessions?.[1] || 'Tactical understanding'}
• ${plan.sessions?.[2] || 'Physical conditioning'}

Focus Areas:
• ${plan.focus?.[0] || 'Ball control and passing'}
• ${plan.focus?.[1] || 'Team coordination'}

Customized for: "${originalMessage}"`;
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

  private analyzeMessage(message: string, userContext: UserContext): {
    intent: string;
    category: string;
    complexity: number;
    entities: string[];
    sentiment: number;
    urgency: number;
  } {
    const lowerMessage = message.toLowerCase();
    const words = lowerMessage.split(' ');

    // Intent detection
    let intent = 'general';
    if (words.some(w => ['analyze', 'analysis', 'review'].includes(w))) intent = 'analysis';
    else if (words.some(w => ['suggest', 'recommend', 'advice'].includes(w))) intent = 'suggestion';
    else if (words.some(w => ['formation', 'tactic', 'strategy'].includes(w))) intent = 'tactical';
    else if (words.some(w => ['training', 'drill', 'practice'].includes(w))) intent = 'training';
    else if (words.some(w => ['player', 'performance', 'stats'].includes(w))) intent = 'player_analysis';
    else if (words.some(w => ['help', 'how', 'what', 'why'].includes(w))) intent = 'question';

    // Category detection
    let category = 'general';
    if (words.some(w => ['formation', 'lineup', 'position'].includes(w))) category = 'formation';
    else if (words.some(w => ['attack', 'offense', 'goal', 'score'].includes(w))) category = 'attack';
    else if (words.some(w => ['defense', 'defend', 'block'].includes(w))) category = 'defense';
    else if (words.some(w => ['training', 'drill', 'exercise'].includes(w))) category = 'training';
    else if (words.some(w => ['match', 'game', 'opponent'].includes(w))) category = 'match';

    // Complexity scoring (0-1)
    let complexity = 0.3; // Base complexity
    if (words.length > 10) complexity += 0.2;
    if (words.some(w => ['analyze', 'compare', 'optimize', 'strategy'].includes(w))) complexity += 0.3;
    if (userContext.teamData && words.some(w => userContext.teamData!.players.some((p: any) => p.name.toLowerCase().includes(w)))) complexity += 0.2;

    // Entity extraction (players, formations, etc.)
    const entities: string[] = [];
    const formations = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2'];
    formations.forEach(formation => {
      if (message.includes(formation)) entities.push(formation);
    });

    if (userContext.teamData) {
      userContext.teamData.players.forEach((player: any) => {
        if (lowerMessage.includes(player.name.toLowerCase())) {
          entities.push(player.name);
        }
      });
    }

    return {
      intent,
      category,
      complexity,
      entities,
      sentiment: 0.5,
      urgency: 0.5
    };
  }

  private isFootballAnalysisQuery(message: string): boolean {
    const footballKeywords = [
      'formation', 'tactic', 'strategy', 'lineup', 'player',
      'match', 'game', 'opponent', 'training', 'drill',
      'attack', 'defense', 'goal', 'score', 'pass', 'shoot'
    ];
    return await this.generateIntelligentResponse(message, userContext);
  } catch(error) {
    console.error('Error processing AI chat message:', error);
    return {
      content: 'Sorry, I encountered an error processing your request. Please try again.',
      confidence: 0,
      suggestions: [],
      followUpQuestions: []
    };
  }
}

  private async generateIntelligentResponse(message: string, userContext: UserContext): Promise < AIResponse > {
  // Analyze the message to determine intent
  const analysis = this.analyzeMessage(message, userContext);

  // If we have a valid API key, use OpenAI
  if(this.apiKey) {
  try {
    return await this.callOpenAI(message, userContext, this.apiKey);
  } catch (error) {
    console.warn('OpenAI call failed, falling back to template responses');
  }
}

// Fallback to template-based responses
return this.generateTemplateResponse(message, userContext, analysis);
  }

  private generateTemplateResponse(
  message: string,
  userContext: UserContext,
  analysis: ReturnType<AIChatService['analyzeMessage']>
): AIResponse {
  const lowerMessage = message.toLowerCase();

  // Formation-related queries
  if (lowerMessage.includes('formation') || lowerMessage.includes('lineup')) {
    return {
      content: this.formatFormationAnalysis({ insights: [], recommendations: [] }, message),
      confidence: 75,
      suggestions: ['Ask about player positions', 'Request tactical advice'],
      followUpQuestions: ['What formation works best against 4-3-3?', 'How can I improve my team shape?']
    };
  }

  // Training-related queries
  if (lowerMessage.includes('training') || lowerMessage.includes('drill')) {
    return {
      content: this.formatTrainingPlan({ sessions: [], focus: [] }, message),
      confidence: 70,
      suggestions: ['Ask about specific skills', 'Request personalized plans'],
      followUpQuestions: ['What drills improve passing?', 'How often should we train?']
    };
  }

  // Player analysis queries
  if (lowerMessage.includes('player') || lowerMessage.includes('performance')) {
    return {
      content: this.formatPlayerAnalysis({ insights: [], recommendations: [] }, message),
      confidence: 72,
      suggestions: ['Ask about development plans', 'Request skill assessments'],
      followUpQuestions: ['How can I improve my weak foot?', 'What positions suit me best?']
    };
  }

  // Generic response
  return {
    content: `I understand you're asking about "${message}". As your football assistant, I can help with formations, tactics, training plans, and player development. What specific aspect would you like to discuss?`,
    confidence: 60,
    suggestions: ['Ask about formations', 'Request training plans', 'Get player advice'],
    followUpQuestions: ['What formation should I use?', 'How can I improve my team?', 'What training drills help?']
  };
}

  private formatFormationAnalysis(analysis: any, originalMessage: string): string {
  return `📋 Formation Analysis

Key Insights:
• ${analysis.insights?.[0] || 'Focus on team shape and positioning'}
• ${analysis.insights?.[1] || 'Maintain tactical discipline'}

Strategic Recommendations:
• ${analysis.recommendations?.[0] || 'Adapt formation to opponent'}
• ${analysis.recommendations?.[1] || 'Focus on transition moments'}

Based on your query: "${originalMessage}"`;
}

  private formatPlayerAnalysis(analysis: any, originalMessage: string): string {
  return `👥 Player Analysis

Performance Insights:
• ${analysis.insights?.[0] || 'Individual development opportunities identified'}
• ${analysis.insights?.[1] || 'Team chemistry and positioning analysis'}

Development Focus:
• ${analysis.recommendations?.[0] || 'Technical skill enhancement'}
• ${analysis.recommendations?.[1] || 'Tactical awareness improvement'}

Analysis for: "${originalMessage}"`;
}

  private formatTrainingPlan(plan: any, originalMessage: string): string {
  return `🏃 Training Plan

Recommended Sessions:
• ${plan.sessions?.[0] || 'Technical skills development'}
• ${plan.sessions?.[1] || 'Tactical understanding'}
• ${plan.sessions?.[2] || 'Physical conditioning'}

Focus Areas:
• ${plan.focus?.[0] || 'Ball control and passing'}
• ${plan.focus?.[1] || 'Team coordination'}

Customized for: "${originalMessage}"`;
}

  private addToConversationMemory(userId: string, message: ChatMessage): void {
  const history = this.conversationMemory.get(userId) || [];
  history.push(message);

  // Keep only last 50 messages to manage memory
  if(history.length > 50) {
  history.splice(0, history.length - 50);
}

this.conversationMemory.set(userId, history);
  }

  private analyzeMessage(message: string, userContext: UserContext): {
  intent: string;
  category: string;
  complexity: number;
  entities: string[];
  sentiment: number;
  urgency: number;
} {
  const lowerMessage = message.toLowerCase();
  const words = lowerMessage.split(' ');

  // Intent detection
  let intent = 'general';
  if (words.some(w => ['analyze', 'analysis', 'review'].includes(w))) intent = 'analysis';
  else if (words.some(w => ['suggest', 'recommend', 'advice'].includes(w))) intent = 'suggestion';
  else if (words.some(w => ['formation', 'tactic', 'strategy'].includes(w))) intent = 'tactical';
  else if (words.some(w => ['training', 'drill', 'practice'].includes(w))) intent = 'training';
  else if (words.some(w => ['player', 'performance', 'stats'].includes(w))) intent = 'player_analysis';
  else if (words.some(w => ['help', 'how', 'what', 'why'].includes(w))) intent = 'question';

  // Category detection
  let category = 'general';
  if (words.some(w => ['formation', 'lineup', 'position'].includes(w))) category = 'formation';
  else if (words.some(w => ['attack', 'offense', 'goal', 'score'].includes(w))) category = 'attack';
  else if (words.some(w => ['defense', 'defend', 'block'].includes(w))) category = 'defense';
  else if (words.some(w => ['training', 'drill', 'exercise'].includes(w))) category = 'training';
  else if (words.some(w => ['match', 'game', 'opponent'].includes(w))) category = 'match';

  // Complexity scoring (0-1)
  let complexity = 0.3; // Base complexity
  if (words.length > 10) complexity += 0.2;
  if (words.some(w => ['analyze', 'compare', 'optimize', 'strategy'].includes(w))) complexity += 0.3;
  if (userContext.teamData && words.some(w => userContext.teamData!.players.some((p: any) => p.name.toLowerCase().includes(w)))) complexity += 0.2;

  // Entity extraction (players, formations, etc.)
  const entities: string[] = [];
  const formations = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2'];
  formations.forEach(formation => {
    if (message.includes(formation)) entities.push(formation);
  });

  if (userContext.teamData) {
    userContext.teamData.players.forEach((player: any) => {
      if (lowerMessage.includes(player.name.toLowerCase())) {
        entities.push(player.name);
      }
    });
  }

  return {
    intent,
    category,
    complexity,
    entities,
    sentiment: 0.5,
    urgency: 0.5
  };
}

  private isFootballAnalysisQuery(message: string): boolean {
  const footballKeywords = [
    'formation', 'tactic', 'strategy', 'lineup', 'player',
    'match', 'game', 'opponent', 'training', 'drill',
    'attack', 'defense', 'goal', 'score', 'pass', 'shoot'
  ];
  return footballKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

  private async handleFootballAnalysis(message: string, userContext: UserContext): Promise < AIResponse > {
  try {
    // Use football analysis service
    const analysisResult = await footballAnalysisService.analyzeMatch({
      opponent_name: 'Opponent',
      match_date: new Date().toISOString(),
      match_type: 'Friendly',
      home_score: 0,
      away_score: 0,
      is_home: true,
      status: 'scheduled'
    });

    // If we have a valid API key, use OpenAI to enhance the analysis
    if(this.apiKey) {
  return await this.callOpenAI(message, userContext, this.apiKey);
}

// Fallback to template response
return this.formatFootballAnalysis(analysisResult, message);
    } catch (error) {
  console.error('Error in football analysis:', error);
  return this.generateTemplateResponse(message, userContext, this.analyzeMessage(message, userContext));
}
  }

  private formatFootballAnalysis(analysis: any, originalMessage: string): AIResponse {
  return {
    content: `Based on my analysis of "${originalMessage}":

${analysis.insights ? analysis.insights.join('\n• ') : 'I can provide tactical insights for your team.'}

Recommendations:
${analysis.recommendations ? analysis.recommendations.join('\n• ') : 'Focus on maintaining team shape.'}`,
    confidence: 85,
    suggestions: ['Detailed tactical breakdown', 'Opponent analysis'],
    followUpQuestions: ['How do we implement this?', 'What are the risks?']
  };
}

  private async callOpenAI(message: string, userContext: UserContext, apiKey: string): Promise < AIResponse > {
  try {
    // Initialize OpenAI client with Groq configuration
    const client = new OpenAI({
      apiKey: import.meta.env['VITE_GROQ_API_KEY'] || apiKey,
      baseURL: "https://api.groq.com/openai/v1",
      dangerouslyAllowBrowser: true // Required for client-side usage
    });

    const systemPrompt = this.buildSystemPrompt(userContext);

    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content || "I couldn't generate a response.";

    return {
      content,
      confidence: 0.9,
      suggestions: this.generateSuggestions(content),
      followUpQuestions: this.generateFollowUpQuestions(content, userContext)
    };
  } catch(error) {
    console.error('Error calling OpenAI/Groq:', error);
    throw error;
  }
}

  private buildSystemPrompt(userContext: UserContext): string {
  let prompt = `You are an expert football (soccer) assistant coach and analyst. 
Your goal is to help the user (a football manager/coach) improve their team's performance.
Provide specific, actionable advice based on modern football tactics and training methodologies.`;

  if (userContext.teamData) {
    prompt += `\n\nContext about the team:
- Team Name: ${userContext.teamData.name}
- Formation: ${userContext.teamData.formation || 'Not specified'}
- Number of Players: ${userContext.teamData.players?.length || 0}`;
  }

  return prompt;
}

  private generateSuggestions(content: string): string[] {
  // Simple logic to generate suggestions based on content keywords
  const suggestions = [];
  if (content.includes('formation')) suggestions.push('Analyze 4-3-3 formation');
  if (content.includes('training')) suggestions.push('Create a training session');
  if (content.includes('player')) suggestions.push('Player development plan');

  if (suggestions.length === 0) {
    suggestions.push('Tactical analysis', 'Training drills', 'Opponent scouting');
  }

  return suggestions.slice(0, 3);
}

  private generateFollowUpQuestions(content: string, userContext: UserContext): string[] {
  return [
    'How can we implement this in training?',
    'What are the risks of this approach?',
    'Can you give a specific example?'
  ];
}
}

export const aiChatService = new AIChatService();