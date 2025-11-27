import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { 
  Bot, 
  Send, 
  Database, 
  BarChart3, 
  Target, 
  Shield, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  FileText,
  Search,
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Clock,
  History,
  Eye,
  MessageSquare,
  Zap,
  Sparkles,
  Activity,
  Plus,
  Minus,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'analysis' | 'prediction' | 'success' | 'error' | 'data';
  confidence?: number;
  priority?: 'low' | 'medium' | 'high';
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

const AIAssistant: React.FC = () => {
  useTheme(); // Just call the hook without destructuring since we don't use the values
  const { user } = useAuth();
  const { currentPlan, getAIRequestsRemaining, incrementAIUsage, getUsageStats } = useSubscription();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI Assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Settings state
  const [responseDepth, setResponseDepth] = useState<number>(2);
  const [autoAnalysis, setAutoAnalysis] = useState<boolean>(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState<boolean>(true);
  const [enableSuggestions, setEnableSuggestions] = useState<boolean>(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history and current chat on mount
  useEffect(() => {
    if (!user) return;
    
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem(`ai_chat_history_${user.id}`);
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setChatHistory(history);
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }

    // Load current chat messages
    const savedChat = localStorage.getItem(`ai_current_chat_${user.id}`);
    if (savedChat) {
      try {
        const chat = JSON.parse(savedChat);
        setMessages(chat.messages || [
          {
            id: '1',
            content: 'Hello! I\'m your AI Assistant. How can I help you today?',
            sender: 'ai',
            timestamp: new Date(),
            type: 'text'
          }
        ]);
        setCurrentChatId(chat.id || 'default');
      } catch (e) {
        console.error('Failed to parse current chat', e);
      }
    }
  }, [user]);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiAssistantSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setResponseDepth(settings.responseDepth || 2);
        setAutoAnalysis(settings.autoAnalysis ?? true);
        setRealTimeUpdates(settings.realTimeUpdates ?? true);
        setEnableSuggestions(settings.enableSuggestions ?? true);
      } catch (e) {
        console.error('Failed to parse saved settings', e);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      responseDepth,
      autoAnalysis,
      realTimeUpdates,
      enableSuggestions
    };
    localStorage.setItem('aiAssistantSettings', JSON.stringify(settings));
  }, [responseDepth, autoAnalysis, realTimeUpdates, enableSuggestions]);

  // Save current chat whenever messages change
  useEffect(() => {
    if (!user || messages.length === 0) return;
    
    const currentChat = {
      id: currentChatId,
      messages,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`ai_current_chat_${user.id}`, JSON.stringify(currentChat));
  }, [messages, user, currentChatId]);

  // Save chat to history
  const saveChatToHistory = () => {
    if (!user || messages.length <= 1) return; // Don't save if only welcome message
    
    const firstUserMessage = messages.find(m => m.sender === 'user');
    if (!firstUserMessage) return;

    const chatTitle = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
    const chatPreview = firstUserMessage.content.substring(0, 100);

    const newHistoryItem: ChatHistory = {
      id: currentChatId,
      title: chatTitle,
      timestamp: new Date(),
      preview: chatPreview
    };

    const updatedHistory = [newHistoryItem, ...chatHistory.filter(h => h.id !== currentChatId)].slice(0, 20); // Keep last 20 chats
    setChatHistory(updatedHistory);
    localStorage.setItem(`ai_chat_history_${user.id}`, JSON.stringify(updatedHistory));

    // Save the actual chat messages
    const chatData = {
      id: currentChatId,
      messages,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`ai_chat_${user.id}_${currentChatId}`, JSON.stringify(chatData));
  };

  // Start a new chat - FIXED to clear old prompts
  const startNewChat = () => {
    // Save current chat to history first
    if (messages.length > 1) {
      saveChatToHistory();
    }

    // Create completely new chat with new ID
    const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentChatId(newChatId);
    
    // Clear all messages and start fresh
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: 'Hello! I\'m your AI Assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages([welcomeMessage]);
    setActiveChat(null);
    setInputMessage(''); // Clear input field
    
    // Clear the current chat from localStorage to prevent old data
    if (user) {
      localStorage.removeItem(`ai_current_chat_${user.id}`);
    }
    
    toast.success('Started new chat');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Check AI request limits
    const remaining = getAIRequestsRemaining();
    if (remaining === 0) {
      const upgradeMessage = currentPlan?.id === 'free' 
        ? 'Daily AI request limit reached. Upgrade to Pro for 50 requests per day!'
        : currentPlan?.id === 'pro'
          ? 'Daily AI request limit reached. Upgrade to Pro Plus for 200 requests per day!'
          : 'Daily AI request limit reached. Please try again tomorrow.';
      
      toast.error(upgradeMessage, {
        duration: 5000,
        action: currentPlan?.id !== 'pro_plus' ? {
          label: 'Upgrade',
          onClick: () => window.location.href = '/pricing'
        } : undefined
      });
      return;
    }

    // Try to increment usage
    if (!incrementAIUsage()) {
      toast.error('Unable to process request. Please try again later.');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('[AIAssistant] Sending message to backend:', currentInput);
      
      // Call backend AI assistant API
      const backendUrl = import.meta.env['VITE_BACKEND_URL'] || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/v1/ai-assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentInput,
          context: {}
        })
      });

      console.log('[AIAssistant] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIAssistant] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[AIAssistant] Response data:', data);
      
      if (data.success && data.data.response) {
        let responseType: 'text' | 'analysis' | 'prediction' | 'success' | 'error' | 'data' = 'text';
        let priority: 'low' | 'medium' | 'high' = 'medium';
        
        // Determine response type based on content
        if (currentInput.toLowerCase().includes('analyze') || currentInput.toLowerCase().includes('performance')) {
          responseType = 'analysis';
          priority = 'high';
        } else if (currentInput.toLowerCase().includes('predict') || currentInput.toLowerCase().includes('match')) {
          responseType = 'prediction';
          priority = 'high';
        } else if (currentInput.toLowerCase().includes('add') || currentInput.toLowerCase().includes('create')) {
          responseType = 'success';
          priority = 'high';
        }

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: data.data.response,
          sender: 'ai',
          timestamp: new Date(),
          type: responseType,
          priority
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('[AIAssistant] Error:', error);
      
      let errorContent = 'I apologize, but I\'m experiencing technical difficulties. ';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorContent += 'The AI backend server is not running. Please start the backend server with "npm run dev" in the backend folder.';
      } else if (error.message?.includes('HTTP error')) {
        errorContent += `Server error: ${error.message}`;
      } else {
        errorContent += 'Please try again in a moment.';
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        sender: 'ai',
        timestamp: new Date(),
        type: 'error',
        priority: 'high'
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('AI Assistant connection issue');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = (chatId: string) => {
    if (!user) {
      toast.error('Please sign in to load chat history');
      return;
    }

    try {
      // Save current chat before switching
      if (messages.length > 1 && currentChatId !== chatId) {
        saveChatToHistory();
      }

      // Load the selected chat
      const savedChat = localStorage.getItem(`ai_chat_${user.id}_${chatId}`);
      
      if (!savedChat) {
        console.error('[AIAssistant] Chat not found:', chatId);
        toast.error('Chat not found. It may have been deleted.');
        return;
      }

      const chat = JSON.parse(savedChat);
      
      if (!chat.messages || !Array.isArray(chat.messages)) {
        console.error('[AIAssistant] Invalid chat data:', chat);
        toast.error('Chat data is corrupted');
        return;
      }

      // Restore messages with proper timestamp conversion
      const restoredMessages = chat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      setMessages(restoredMessages);
      setCurrentChatId(chatId);
      setActiveChat(chatId);
      
      console.log('[AIAssistant] Chat loaded successfully:', chatId);
      toast.success('Chat loaded successfully');
    } catch (error) {
      console.error('[AIAssistant] Failed to load chat:', error);
      toast.error('Failed to load chat. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'analysis': return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'prediction': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'data': return <Database className="h-4 w-4 text-indigo-500" />;
      default: return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Quick actions for chat
  const quickActions = [
    { label: 'Analyze team performance', icon: BarChart3 },
    { label: 'Predict next match', icon: TrendingUp },
    { label: 'Show player stats', icon: Users },
    { label: 'Create training plan', icon: Target }
  ];

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    // Auto-send after a short delay to simulate selection
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  return (
    <div className={`min-h-screen bg-white`}>
      {/* Fullscreen header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-sm text-gray-500">Your intelligent football management companion</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {currentPlan && currentPlan.aiRequestsPerDay === -1 ? (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Unlimited
            </Badge>
          ) : currentPlan && (
            <Badge 
              variant="outline" 
              className={`${
                getAIRequestsRemaining() === 0 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : getAIRequestsRemaining() <= 2
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {getAIRequestsRemaining()} / {currentPlan.aiRequestsPerDay} requests today
            </Badge>
          )}
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Online
          </Badge>
        </div>
      </div>

      <div className={`px-4 ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'py-6'} flex flex-col`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-md">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-md">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col mt-0 h-full">
            <div className={`grid grid-cols-1 ${isFullscreen ? 'lg:grid-cols-1 xl:grid-cols-4' : 'lg:grid-cols-4'} gap-6 h-full`}>
              {/* Chat History Sidebar - Hidden in full screen on smaller screens */}
              {!isFullscreen || window.innerWidth >= 1280 ? (
                <div className="lg:col-span-1 h-full">
                  <Card className="bg-white border-gray-200 h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>Chat History</span>
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                          {chatHistory.length}
                        </Badge>
                      </CardTitle>
                      <Button
                        onClick={startNewChat}
                        className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Chat
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                      {chatHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No chat history yet</p>
                          <p className="text-xs mt-1">Your conversations will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chatHistory.map((chat) => (
                            <div 
                              key={chat.id} 
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                activeChat === chat.id 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => loadChatHistory(chat.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 truncate text-sm">{chat.title}</h3>
                                  <p className="text-xs text-gray-500 truncate mt-1">{chat.preview}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="p-1 ml-2 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadChatHistory(chat.id);
                                  }}
                                >
                                  <Eye className="h-3 w-3 text-gray-500" />
                                </Button>
                              </div>
                              <div className="flex items-center mt-2 text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(chat.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {/* Main Chat Interface */}
              <div className={`${!isFullscreen || window.innerWidth >= 1280 ? 'lg:col-span-3' : 'lg:col-span-4'} flex flex-col h-full`}>
                <Card className="bg-white border-gray-200 flex-1 flex flex-col h-full">
                  <CardContent className="flex-1 flex flex-col p-0 h-full">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md'
                                : 'bg-gray-50 border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
                            }`}
                          >
                            {message.sender !== 'user' && (
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1 rounded bg-white border">
                                  {getMessageIcon(message.type || 'text')}
                                </div>
                                <span className="text-xs font-medium text-gray-500">
                                  AI Assistant
                                </span>
                              </div>
                            )}
                            <div className="whitespace-pre-wrap text-sm">
                              {message.content}
                            </div>
                            <p className="text-xs mt-2 opacity-70">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-sm text-gray-600">AI is thinking</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                      {currentPlan && getAIRequestsRemaining() === 0 && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-900">Daily limit reached</p>
                              <p className="text-xs text-red-700 mt-1">
                                You've used all {currentPlan.aiRequestsPerDay} AI requests for today. 
                                {currentPlan.id === 'free' && ' Upgrade to Pro for 50 requests per day!'}
                                {currentPlan.id === 'pro' && ' Upgrade to Pro Plus for 200 requests per day!'}
                              </p>
                              {currentPlan.id !== 'pro_plus' && (
                                <Button
                                  size="sm"
                                  className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs"
                                  onClick={() => window.location.href = '/pricing'}
                                >
                                  {currentPlan.id === 'free' ? 'Upgrade to Pro' : 'Upgrade to Pro Plus'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {currentPlan && getAIRequestsRemaining() > 0 && getAIRequestsRemaining() <= 2 && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-900">Running low on requests</p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Only {getAIRequestsRemaining()} request{getAIRequestsRemaining() > 1 ? 's' : ''} remaining today.
                                {currentPlan.id === 'free' && ' Upgrade to Pro for 50 requests per day.'}
                                {currentPlan.id === 'pro' && ' Upgrade to Pro Plus for 200 requests per day.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {quickActions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs rounded-full"
                            onClick={() => handleQuickAction(action.label)}
                            disabled={getAIRequestsRemaining() === 0}
                          >
                            <action.icon className="h-3 w-3 mr-1" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Textarea
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder={
                            getAIRequestsRemaining() === 0
                              ? "Daily limit reached. Upgrade for more requests..."
                              : "Ask me anything about football tactics, player management, or team strategy..."
                          }
                          className="flex-1 border-gray-300 focus:border-blue-500 min-h-[44px] max-h-32 resize-none"
                          disabled={isLoading || getAIRequestsRemaining() === 0}
                          onKeyDown={handleKeyPress}
                        />
                        <Button 
                          onClick={handleSendMessage}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4"
                          disabled={isLoading || !inputMessage.trim() || getAIRequestsRemaining() === 0}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 mt-0">
            <div className="grid grid-cols-1 gap-6 h-full">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Assistant Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Response Depth</label>
                        <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                          {responseDepth === 1 ? 'Brief' : responseDepth === 2 ? 'Medium' : 'Detailed'}
                        </span>
                      </div>
                      <Slider
                        value={[responseDepth]}
                        onValueChange={(value) => setResponseDepth(value[0] ?? 2)}
                        max={3}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Brief</span>
                        <span>Medium</span>
                        <span>Detailed</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Auto Analysis</h3>
                        <p className="text-sm text-gray-500">Automatically analyze team data</p>
                      </div>
                      <Switch
                        checked={autoAnalysis}
                        onCheckedChange={setAutoAnalysis}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Real-time Updates</h3>
                        <p className="text-sm text-gray-500">Get live data updates</p>
                      </div>
                      <Switch
                        checked={realTimeUpdates}
                        onCheckedChange={setRealTimeUpdates}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Smart Suggestions</h3>
                        <p className="text-sm text-gray-500">Show contextual suggestions</p>
                      </div>
                      <Switch
                        checked={enableSuggestions}
                        onCheckedChange={setEnableSuggestions}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAssistant;