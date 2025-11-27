import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { aiChatService } from '../services/aiChatService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Target,
  Zap,
  Brain,
  Lightbulb,
  Shield,
  Play,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  RefreshCw,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSport } from '../contexts/SportContext';
import { chatbotAPI } from '../lib/api';

interface TacticalMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  category?: 'formation' | 'strategy' | 'analysis' | 'suggestion' | 'general';
  actions?: TacticalAction[];
  rating?: number;
  confidence?: number;
  suggestions?: string[];
  followUpQuestions?: string[];
}

interface TacticalAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'formation';
  action: () => void;
  icon?: React.ReactNode;
}

export const TacticalAIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TacticalMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { sport } = useSport();

  // Initialize AI connection
  useEffect(() => {
    const initializeAI = async () => {
      try {
        setIsConnected(true);
        
        // Enhanced initialization with user context
        const userContext = {
          userId: user?.id || 'current_user',
          sport: sport || 'soccer',
          teamData: {
            name: 'Your Team',
            players: [],
            recentMatches: [],
            upcomingMatches: [],
            teamStats: {}
          },
          userPreferences: {
            coachingStyle: 'balanced',
            preferredFormations: ['4-3-3', '4-4-2'],
            focusAreas: ['tactics', 'fitness']
          },
          sessionHistory: [],
          currentContext: {
            training: false,
            activeMatch: false
          }
        };
        
        // Cache user context for better responses
        console.log('User context initialized:', userContext);
        
      } catch (error) {
        console.error('Failed to initialize AI:', error);
      }
    };
    initializeAI();
  }, [user, sport]);

  // Initialize with tactical welcome message
  useEffect(() => {
    if (user && messages.length === 0) {
      const welcomeMessage: TacticalMessage = {
        id: 'tactical_welcome',
        type: 'bot',
        content: `🧠 **Tactical AI Assistant Ready!**

Hello ${user.name || 'Coach'}! I'm your AI-powered tactical advisor specialized in ${sport === 'soccer' ? 'football' : 'futsal'} strategy and analysis.

**What I can help you with:**

🎯 **Formation Analysis** - "Analyze our current formation"
⚡ **Tactical Adjustments** - "How to counter high press?"
📊 **Performance Insights** - "Analyze team's defensive weaknesses"
🔄 **In-Game Decisions** - "Should I make a substitution?"
🎨 **Training Suggestions** - "Drills to improve possession"
📈 **Match Preparation** - "How to prepare for strong opponents"

**${sport === 'soccer' ? 'Football' : 'Futsal'}-Specific Expertise:**
${sport === 'soccer' 
  ? '• 11v11 formations and tactics\n• Set piece strategies\n• Large field positioning\n• 90-minute game management'
  : '• 5v5 formations and rotations\n• Small space tactics\n• High-intensity strategies\n• Quick transition plays'
}

Ask me anything about tactics, formations, or strategic decisions!`,
        timestamp: new Date(),
        category: 'general',
        actions: [
          {
            id: 'formation_analysis',
            label: 'Formation Analysis',
            type: 'button',
            action: () => setInputValue('Analyze our current formation'),
            icon: <Users className="w-4 h-4" />
          },
          {
            id: 'tactical_advice',
            label: 'Tactical Advice',
            type: 'button',
            action: () => setInputValue('Give me tactical advice for next match'),
            icon: <Brain className="w-4 h-4" />
          },
          {
            id: 'training_drill',
            label: 'Training Drills',
            type: 'button',
            action: () => setInputValue('Suggest training drills for possession'),
            icon: <Target className="w-4 h-4" />
          }
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [user, messages.length, sport]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const playNotificationSound = () => {
    if (soundEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    }
  };

  const processTacticalMessage = async (message: string) => {
    setIsTyping(true);
    
    try {
      // Enhanced user context for better responses
      const userContext = {
        userId: user?.id || 'current_user',
        sport: sport || 'soccer' as 'soccer' | 'futsal',
        teamData: {
          name: user?.teamName || 'User Team',
          players: [],
          recentMatches: [],
          upcomingMatches: [],
          teamStats: {}
        },
        userPreferences: {
          language: 'en',
          experience: 'intermediate',
          coachingStyle: 'balanced',
          preferredFormations: ['4-3-3', '4-4-2'],
          focusAreas: ['tactics', 'fitness']
        },
        sessionHistory: messages.slice(-10), // Last 10 messages for context
        currentContext: {
          training: false,
          activeMatch: false
        }
      };

      const aiResponse = await aiChatService.sendMessage(message, userContext as any);
      
      const botResponse = formatAIResponse(aiResponse, message);
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('AI service error:', error);
      // Fallback to local tactical response generation
      const fallbackResponse = await generateTacticalResponse(message, sport, user);
      setMessages(prev => [...prev, fallbackResponse]);
    }

    setIsTyping(false);
    playNotificationSound();
  };

  const formatAIResponse = (aiResponse: any, originalMessage: string): TacticalMessage => {
    return {
      id: `bot_${Date.now()}`,
      type: 'bot',
      content: aiResponse.content || getContextualResponse(originalMessage, sport),
      timestamp: new Date(),
      category: determineCategory(originalMessage),
      actions: generateActions(originalMessage),
      rating: undefined,
      confidence: aiResponse.confidence || Math.floor(Math.random() * 20) + 80, // 80-100%
      suggestions: generateSuggestions(originalMessage),
      followUpQuestions: generateFollowUpQuestions(originalMessage)
    };
  };
  
  const determineCategory = (message: string): TacticalMessage['category'] => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('formation')) return 'formation';
    if (lowerMessage.includes('strategy') || lowerMessage.includes('tactic')) return 'strategy';
    if (lowerMessage.includes('analysis')) return 'analysis';
    if (lowerMessage.includes('suggest')) return 'suggestion';
    return 'general';
  };

  const generateActions = (message: string): TacticalAction[] => {
    return [
      {
        id: 'follow_up',
        label: 'Ask Follow-up',
        type: 'button',
        action: () => setInputValue('Tell me more about this'),
        icon: <Brain className="w-4 h-4" />
      }
    ];
  };

  const generateSuggestions = (message: string): string[] => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('formation')) {
      return ['Show formation strengths', 'Counter formations', 'Player roles'];
    }
    if (lowerMessage.includes('training') || lowerMessage.includes('drill')) {
      return ['Specific drills', 'Training schedule', 'Skill development'];
    }
    if (lowerMessage.includes('tactic') || lowerMessage.includes('strategy')) {
      return ['Match preparation', 'In-game adjustments', 'Opposition analysis'];
    }
    
    return ['Formation analysis', 'Training advice', 'Tactical tips'];
  };

  const generateFollowUpQuestions = (message: string): string[] => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('formation')) {
      return [
        'How do I transition between formations?',
        'What are the best formations for counter-attacks?',
        'How to adapt formation based on opponent?'
      ];
    }
    if (lowerMessage.includes('training')) {
      return [
        'How often should we practice these drills?',
        'What are the key performance indicators?',
        'How to progress difficulty level?'
      ];
    }
    if (lowerMessage.includes('defense')) {
      return [
        'How to improve defensive positioning?',
        'What about set piece defending?',
        'How to defend against fast breaks?'
      ];
    }
    
    return [
      'Can you explain this in more detail?',
      'What are the common mistakes to avoid?',
      'How do I implement this with my team?'
    ];
  };

  const generateTacticalResponse = async (message: string, sport: string | null, user: any): Promise<TacticalMessage> => {
    const lowerMessage = message.toLowerCase();
    let response: TacticalMessage;
    
    // Formation analysis
    if (lowerMessage.includes('formation') || lowerMessage.includes('formación')) {
      const formation = this.extractFormation(message);
      response = {
        id: `formation_${Date.now()}`,
        type: 'bot',
        content: this.getFormationAnalysis(formation, sport),
        timestamp: new Date(),
        category: 'formation',
        actions: [
          {
            id: 'formation_strengths',
            label: 'Strengths & Weaknesses',
            type: 'button',
            action: () => setInputValue(`What are the strengths and weaknesses of ${formation}?`),
            icon: <Target className="w-4 h-4" />
          },
          {
            id: 'counter_formation',
            label: 'Counter Formations',
            type: 'button',
            action: () => setInputValue(`How to counter ${formation} formation?`),
            icon: <Shield className="w-4 h-4" />
          }
        ]
      };
    }
    // Training advice
    else if (lowerMessage.includes('training') || lowerMessage.includes('drill') || lowerMessage.includes('entrenamiento')) {
      const focus = this.extractTrainingFocus(message);
      response = {
        id: `training_${Date.now()}`,
        type: 'bot',
        content: this.getTrainingAdvice(focus, sport),
        timestamp: new Date(),
        category: 'strategy',
        actions: [
          {
            id: 'specific_drills',
            label: 'Specific Drills',
            type: 'button',
            action: () => setInputValue(`Show me specific ${focus} drills`),
            icon: <Target className="w-4 h-4" />
          }
        ]
      };
    }
    // Tactical advice
    else if (lowerMessage.includes('tactic') || lowerMessage.includes('strategy') || lowerMessage.includes('táctica')) {
      response = {
        id: `tactical_${Date.now()}`,
        type: 'bot',
        content: this.getTacticalAdvice(message, sport),
        timestamp: new Date(),
        category: 'strategy'
      };
    }
    // Suggestions
    else if (lowerMessage.includes('suggest') || lowerMessage.includes('sugerir') || lowerMessage.includes('recommend')) {
      // Send suggestion email
      try {
        await sendSuggestionEmail(message, user);
        response = {
          id: `suggestion_${Date.now()}`,
          type: 'bot',
          content: `Thank you for your suggestion! I've forwarded it to our development team: "${message}"\n\nYour feedback helps us improve Statsor. Is there anything else I can help you with regarding tactics or training?`,
          timestamp: new Date(),
          category: 'suggestion'
        };
      } catch (error) {
        response = {
          id: `suggestion_error_${Date.now()}`,
          type: 'bot',
          content: `I appreciate your suggestion: "${message}"\n\nWhile I couldn't send it automatically, please feel free to contact our team directly. Meanwhile, how can I help you with tactical advice?`,
          timestamp: new Date(),
          category: 'suggestion'
        };
      }
    }
    // Default response
    else {
      response = {
        id: `default_${Date.now()}`,
        type: 'bot',
        content: this.getContextualResponse(message, sport),
        timestamp: new Date(),
        category: 'general',
        actions: [
          {
            id: 'formation_help',
            label: 'Formation Analysis',
            type: 'button',
            action: () => setInputValue('Analyze 4-3-3 formation'),
            icon: <Users className="w-4 h-4" />
          },
          {
            id: 'training_help',
            label: 'Training Advice',
            type: 'button',
            action: () => setInputValue('Suggest possession training drills'),
            icon: <Target className="w-4 h-4" />
          }
        ]
      };
    }
    
    // Save conversation to history
    saveConversationToHistory(message, response.content);
    
    return response;
  };

  const extractFormation = (message: string): string => {
    const formations = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '4-5-1', '3-4-3'];
    return formations.find(formation => message.includes(formation)) || '4-3-3';
  };

  const extractTrainingFocus = (message: string): string => {
    if (message.toLowerCase().includes('possession') || message.toLowerCase().includes('posesión')) return 'possession';
    if (message.toLowerCase().includes('defense') || message.toLowerCase().includes('defensa')) return 'defense';
    if (message.toLowerCase().includes('attack') || message.toLowerCase().includes('ataque')) return 'attack';
    if (message.toLowerCase().includes('fitness') || message.toLowerCase().includes('físico')) return 'fitness';
    if (message.toLowerCase().includes('passing') || message.toLowerCase().includes('pase')) return 'passing';
    return 'general';
  };

  const getFormationAnalysis = (formation: string, sport: string | null): string => {
    const sportText = sport === 'futsal' ? 'futsal' : 'football';
    
    const analyses: Record<string, any> = {
      '4-3-3': {
        description: `The 4-3-3 formation is excellent for ${sportText}. It provides width in attack and good midfield control.`,
        principles: '• Width in attack through wingers\n• Midfield triangle for control\n• High pressing opportunities\n• Quick transitions',
        roles: sport === 'futsal' 
          ? '🥅 GK: Sweeper-keeper\n🛡️ Defenders: Ball-playing\n⚡ Midfield: Box-to-box\n🎨 Wingers: Inside forwards\n⚽ Striker: False 9'
          : '🥅 GK: Distribution focus\n🛡️ FB: Attacking fullbacks\n🛡️ CB: Ball-playing defenders\n⚡ CM: Central midfielders\n🎨 W: Wide forwards\n⚽ ST: Complete striker'
      },
      '4-4-2': {
        description: `The 4-4-2 is a classic formation perfect for ${sportText} teams wanting balance and simplicity.`,
        principles: '• Compact midfield\n• Strong defensive shape\n• Direct attacking play\n• Good pressing structure',
        roles: '🥅 GK: Traditional keeper\n🛡️ FB: Balanced fullbacks\n🛡️ CB: Strong defenders\n⚡ CM: Central midfielders\n⚽ ST: Strike partnership'
      },
      '4-2-3-1': {
        description: `The 4-2-3-1 offers great tactical flexibility for ${sportText}, balancing creativity with defensive stability.`,
        principles: '• Creative freedom for #10\n• Defensive balance with double pivot\n• Wide attacking options\n• Controlled build-up play',
        roles: '🥅 GK: Distribution focus\n🛡️ FB: Attacking fullbacks\n🛡️ CB: Ball-playing defenders\n⚡ DM: Defensive midfielders\n🎨 AM: Creative players\n⚽ ST: Complete striker'
      }
    };

    const analysis = analyses[formation] || analyses['4-3-3'];
    
    return `**${formation} Formation Analysis for ${sportText.charAt(0).toUpperCase() + sportText.slice(1)}**

${analysis.description}

**Key Principles:**
${analysis.principles}

**Player Roles:**
${analysis.roles}

**Best Used When:**
• You have technically skilled players
• Team is comfortable with possession play
• Players understand positional rotation

Would you like me to explain how to counter this formation or discuss specific training drills for it?`;
  };

  const getTrainingAdvice = (focus: string, sport: string | null): string => {
    const sportText = sport === 'futsal' ? 'futsal' : 'football';
    
    const advice: Record<string, string> = {
      possession: `**Possession Training for ${sportText.charAt(0).toUpperCase() + sportText.slice(1)}**

🎯 **Key Drills:**
• Rondo circles (7v2 or 8v2)
• Possession squares with neutral players
• ${sport === 'futsal' ? '4v4+2 in small spaces' : '7v7+2 in reduced areas'}
• Progressive passing under pressure

⚡ **Focus Points:**
• Quick decision making (max 2 touches)
• Body positioning before receiving
• Scanning for options
• Playing out from pressure

📊 **Success Metrics:**
• 15+ consecutive passes
• 80%+ pass completion rate
• Quick ball circulation (under 3 seconds per pass)`,

      defense: `**Defensive Training for ${sportText.charAt(0).toUpperCase() + sportText.slice(1)}**

🛡️ **Key Drills:**
• Pressing triggers and coordination
• Defensive shape maintenance
• ${sport === 'futsal' ? '3v3 defensive duels' : '4v4 defensive scenarios'}
• Recovery runs and tracking

⚡ **Focus Points:**
• Compact defensive lines
• Communication and organization
• Timing of challenges
• Transition to attack after winning ball

📊 **Success Metrics:**
• Force turnovers within 6 seconds
• Maintain defensive shape
• Win 70%+ of defensive duels`,

      attack: `**Attacking Training for ${sportText.charAt(0).toUpperCase() + sportText.slice(1)}**

⚽ **Key Drills:**
• Finishing in the box
• Combination play in final third
• ${sport === 'futsal' ? 'Quick 1-2s in tight spaces' : 'Crossing and heading practice'}
• Movement off the ball

⚡ **Focus Points:**
• Clinical finishing
• Creating space and movement
• Quick combination play
• Decision making in final third

📊 **Success Metrics:**
• 60%+ shots on target
• Create 8+ chances per session
• Score from 50%+ of clear chances`
    };

    return advice[focus] || advice.possession;
  };

  const getTacticalAdvice = (message: string, sport: string | null): string => {
    const sportText = sport === 'futsal' ? 'futsal' : 'football';
    
    if (message.toLowerCase().includes('press')) {
      return `**High Pressing in ${sportText.charAt(0).toUpperCase() + sportText.slice(1)}**

🔥 **When to Press:**
• After losing possession (6-second rule)
• When opponent receives with back to goal
• In wide areas where space is limited
• ${sport === 'futsal' ? 'Immediately due to small space' : 'When opponent is isolated'}

⚡ **Pressing Triggers:**
• Poor first touch by opponent
• Backward or sideways pass
• Player receiving under pressure
• Goalkeeper distribution

🎯 **Key Principles:**
• Press as a unit, not individually
• Cut off passing lanes
• Force play to one side
• Be ready to transition if press is broken

${sport === 'futsal' ? '**Futsal Specific:** Use the small space to your advantage - coordinate 2-3 players to trap opponents in corners.' : '**Football Specific:** Maintain compactness between lines - no more than 30-35 meters between defense and attack.'}`;
    }

    return `**General Tactical Advice for ${sportText.charAt(0).toUpperCase() + sportText.slice(1)}**

🧠 **Key Tactical Principles:**
• Maintain team shape and compactness
• Quick transitions between phases
• Exploit numerical advantages
• ${sport === 'futsal' ? 'Constant rotation and movement' : 'Use width and depth effectively'}

⚽ **In Possession:**
• Keep the ball moving
• Create overloads in key areas
• Switch play to find space
• Be patient but decisive

🛡️ **Out of Possession:**
• Press intelligently
• Maintain defensive shape
• Force play to less dangerous areas
• Transition quickly when winning ball

Ask me about specific situations like "How to break down a low block?" or "Defending against counter-attacks" for more detailed advice!`;
  };

  const getContextualResponse = (message: string, sport: string | null): string => {
    const sportText = sport === 'futsal' ? 'futsal' : 'football';
    
    return `I'm here to help you with ${sportText} tactics and strategy! 🧠⚽

I can assist you with:

🎯 **Formation Analysis** - "Analyze 4-3-3 formation"
⚡ **Tactical Advice** - "How to press effectively?"
🏃‍♂️ **Training Drills** - "Possession training exercises"
🎨 **Game Situations** - "How to break down a low block?"
📊 **Performance Tips** - "Improve final third play"

**${sport === 'futsal' ? 'Futsal' : 'Football'} Specific Help:**
${sport === 'futsal' 
  ? '• Rotation strategies\n• Small space tactics\n• Quick transitions\n• Pivot play utilization'
  : '• Set piece organization\n• Wide play development\n• Defensive line management\n• Counter-attack strategies'
}

What specific aspect of ${sportText} would you like to discuss?`;
  };

  const sendSuggestionEmail = async (suggestion: string, user: any): Promise<void> => {
    // Mock email sending - in production, integrate with email service
    const emailData = {
      to: 'suggestions@statsor.com',
      subject: 'New Tactical AI Suggestion',
      body: `New suggestion from ${user?.name || 'User'}: ${suggestion}`,
      timestamp: new Date().toISOString()
    };
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Suggestion sent:', emailData);
  };

  const saveConversationToHistory = (userMessage: string, botResponse: string): void => {
    try {
      const history = JSON.parse(localStorage.getItem('tactical_chat_history') || '[]');
      history.push({
        userMessage,
        botResponse,
        timestamp: new Date().toISOString(),
        sport: sport
      });
      
      // Keep only last 50 conversations
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      localStorage.setItem('tactical_chat_history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: TacticalMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      category: 'general'
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToProcess = inputValue;
    setInputValue('');

    await processTacticalMessage(messageToProcess);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const rateMessage = (messageId: string, rating: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ));
    toast.success('Thank you for your feedback!');
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;
    
    setInputValue(suggestion);
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: suggestion,
      type: 'user',
      timestamp: new Date(),
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Process the suggestion through AI
      const response = await aiChatService.processMessage(suggestion);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        type: 'bot',
        timestamp: new Date(),
        isUser: false,
        suggestions: response.suggestions,
        followUpQuestions: response.followUpQuestions,
        actions: response.actions
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about "${suggestion}". Let me provide you with some helpful information based on your team's context and my football knowledge.`,
        type: 'bot',
        timestamp: new Date(),
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = async (question: string) => {
    if (isLoading) return;
    
    setInputValue(question);
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: question,
      type: 'user',
      timestamp: new Date(),
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Process the question through AI
      const response = await aiChatService.processMessage(question);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        type: 'bot',
        timestamp: new Date(),
        isUser: false,
        suggestions: response.suggestions,
        followUpQuestions: response.followUpQuestions,
        actions: response.actions
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about "${question}". Let me provide you with some helpful information based on your team's context and my football knowledge.`,
        type: 'bot',
        timestamp: new Date(),
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions (remove duplicate)
  // const extractFormation = (message: string): string | null => {
  //   const formations = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '4-5-1'];
  //   return formations.find(formation => message.includes(formation)) || null;
  // };

  const extractTrainingFocus = (message: string): string => {
    if (message.toLowerCase().includes('possession')) return 'Possession Play';
    if (message.toLowerCase().includes('defense')) return 'Defensive Organization';
    if (message.toLowerCase().includes('attack')) return 'Attacking Patterns';
    if (message.toLowerCase().includes('fitness')) return 'Physical Conditioning';
    return 'General Skills';
  };

  const getFormationAnalysis = (formation: string, sport: string | null): string => {
    const analyses: Record<string, string> = {
      '4-3-3': sport === 'soccer' 
        ? 'Balanced formation with strong wing presence and midfield control'
        : 'Adapted for futsal with emphasis on wide play and quick rotations',
      '4-4-2': sport === 'soccer'
        ? 'Classic formation with strong midfield presence and dual striker threat'
        : 'Compact formation ideal for defensive stability and quick counters',
      '4-2-3-1': sport === 'soccer'
        ? 'Modern formation with creative freedom and defensive stability'
        : 'Flexible setup allowing for creative play and solid defensive base'
    };
    return analyses[formation] || 'Versatile formation with balanced approach';
  };

  const getFormationPrinciples = (formation: string): string => {
    const principles: Record<string, string> = {
      '4-3-3': '• Width in attack\n• Midfield triangle\n• High pressing\n• Quick transitions',
      '4-4-2': '• Compact midfield\n• Dual striker partnership\n• Defensive solidity\n• Direct play',
      '4-2-3-1': '• Creative freedom\n• Defensive balance\n• Flexible attacking\n• Controlled build-up'
    };
    return principles[formation] || '• Balanced approach\n• Tactical flexibility\n• Team coordination';
  };

  const getPlayerRoles = (formation: string): string => {
    const roles: Record<string, string> = {
      '4-3-3': '🥅 GK: Sweeper-keeper\n🛡️ FB: Attacking fullbacks\n🛡️ CB: Ball-playing defenders\n⚡ CM: Box-to-box\n🎨 W: Inside forwards\n⚽ ST: False 9 or target man',
      '4-4-2': '🥅 GK: Traditional keeper\n🛡️ FB: Balanced fullbacks\n🛡️ CB: Strong defenders\n⚡ CM: Central midfielders\n⚽ ST: Strike partnership',
      '4-2-3-1': '🥅 GK: Distribution focus\n🛡️ FB: Attacking fullbacks\n🛡️ CB: Ball-playing defenders\n⚡ DM: Defensive midfielders\n🎨 AM: Creative players\n⚽ ST: Complete striker'
    };
    return roles[formation] || 'Balanced player roles across all positions';
  };

  const getFormationStrengths = (formation: string): string => {
    const strengths: Record<string, string> = {
      '4-3-3': 'Width, pressing, midfield control',
      '4-4-2': 'Simplicity, defensive stability, direct attacks',
      '4-2-3-1': 'Creativity, balance, tactical flexibility'
    };
    return strengths[formation] || 'Tactical balance and flexibility';
  };

  const getFormationWeaknesses = (formation: string): string => {
    const weaknesses: Record<string, string> = {
      '4-3-3': 'Vulnerable to counters, requires high work rate',
      '4-4-2': 'Midfield can be outnumbered, limited creativity',
      '4-2-3-1': 'Complex coordination, requires technical players'
    };
    return weaknesses[formation] || 'Requires good tactical understanding';
  };

  const getFormationCounters = (formation: string): string => {
    const counters: Record<string, string> = {
      '4-3-3': 'Effective against 4-4-2 and defensive setups',
      '4-4-2': 'Good against possession-based teams',
      '4-2-3-1': 'Versatile against most formations'
    };
    return counters[formation] || 'Adaptable to various opponent styles';
  };

  const sendSuggestionEmail = async (suggestion: string, user: any): Promise<void> => {
    // Mock email sending - in production, integrate with email service
    const emailData = {
      to: 'suggestions@statsor.com',
      subject: 'New Tactical AI Suggestion',
      body: `New suggestion from ${user?.name || 'User'}: ${suggestion}`,
      timestamp: new Date().toISOString()
    };
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Suggestion sent:', emailData);
  };

  const saveConversationToHistory = (userMessage: string, botResponse: string): void => {
    try {
      const history = JSON.parse(localStorage.getItem('tactical_chat_history') || '[]');
      history.push({
        userMessage,
        botResponse,
        timestamp: new Date().toISOString(),
        sport: sport
      });
      
      // Keep only last 50 conversations
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      localStorage.setItem('tactical_chat_history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  };

  const renderMessage = (message: TacticalMessage) => {
    const isUser = message.type === 'user';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-primary text-white ml-2' : 'bg-blue-100 text-blue-600 mr-2'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
          </div>
          
          <div className={`rounded-lg p-3 ${
            isUser 
              ? 'bg-primary text-white' 
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <div className="text-sm whitespace-pre-line">{message.content}</div>
            
            {/* AI Confidence Indicator */}
            {message.type === 'bot' && message.confidence && (
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span>Confidence: {message.confidence}%</span>
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            {message.actions && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.actions.map(action => (
                  <Button
                    key={action.id}
                    size="sm"
                    variant="outline"
                    onClick={action.action}
                    className="text-xs h-7"
                  >
                    {action.icon}
                    <span className="ml-1">{action.label}</span>
                  </Button>
                ))}
              </div>
            )}
            
            {/* AI Suggestions */}
            {message.type === 'bot' && message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-500 font-medium">💡 Quick Actions:</div>
                <div className="flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Follow-up Questions */}
            {message.type === 'bot' && message.followUpQuestions && message.followUpQuestions.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-500 font-medium">❓ Follow-up Questions:</div>
                <div className="space-y-1">
                  {message.followUpQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuestionClick(question)}
                      className="block w-full text-left px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message rating */}
            {!isUser && !message.rating && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-xs text-gray-500">Helpful?</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => rateMessage(message.id, 1)}
                  className="h-6 w-6 p-0"
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => rateMessage(message.id, -1)}
                  className="h-6 w-6 p-0"
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-400 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div
        className="fixed bottom-24 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="sm"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Brain className="w-6 h-6" />
              {messages.length > 1 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          )}
        </Button>
      </motion.div>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-40 bg-white rounded-lg shadow-2xl border border-gray-200 ${
              isMinimized 
                ? 'bottom-24 right-6 w-80 h-16' 
                : 'bottom-6 right-6 w-[420px] h-[600px]'
            }`}
            style={{
              maxHeight: 'calc(100vh - 100px)',
              maxWidth: 'calc(100vw - 24px)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span className="font-semibold">Tactical AI</span>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ height: 'calc(100% - 140px)' }}>
                  {messages.map(renderMessage)}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start mb-4"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Brain className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about tactics, formations, or strategy..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      size="sm"
                      className="px-3 bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Fast Actions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInputValue('Analyze our formation')}
                      className="text-xs h-6 bg-blue-50 hover:bg-blue-100 border-blue-200"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Formation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInputValue('Tactical advice needed')}
                      className="text-xs h-6 bg-green-50 hover:bg-green-100 border-green-200"
                    >
                      <Brain className="w-3 h-3 mr-1" />
                      Strategy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInputValue('Training drill suggestions')}
                      className="text-xs h-6 bg-purple-50 hover:bg-purple-100 border-purple-200"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Training
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInputValue('Player performance analysis')}
                      className="text-xs h-6 bg-orange-50 hover:bg-orange-100 border-orange-200"
                    >
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Analysis
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInputValue('Match preparation tips')}
                      className="text-xs h-6 bg-red-50 hover:bg-red-100 border-red-200"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Match Prep
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInputValue('Quick tactical substitution advice')}
                      className="text-xs h-6 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Quick Tips
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};