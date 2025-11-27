import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Minimize2,
  Maximize2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export const HumanizedHelperBot: React.FC = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: language === 'en' 
        ? "Hi there! 👋 I'm your Statsor assistant. How can I help you today?" 
        : "¡Hola! 👋 Soy tu asistente de Statsor. ¿Cómo puedo ayudarte hoy?",
      timestamp: new Date(),
      suggestions: [
        language === 'en' ? "Tell me about features" : "Cuéntame sobre las funciones",
        language === 'en' ? "How much does it cost?" : "¿Cuánto cuesta?",
        language === 'en' ? "Show me a demo" : "Muéstrame una demo"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): { content: string; suggestions?: string[] } => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('feature') || lowerMessage.includes('función')) {
      return {
        content: language === 'en' 
          ? "Our platform offers real-time match statistics, player performance tracking, and AI-powered insights for football teams."
          : "Nuestra plataforma ofrece estadísticas de partidos en tiempo real, seguimiento del rendimiento de jugadores e insights impulsados por IA para equipos de fútbol.",
        suggestions: [
          language === 'en' ? "Tell me about pricing" : "Cuéntame sobre precios",
          language === 'en' ? "Show me a demo" : "Muéstrame una demo"
        ]
      };
    }
    
    if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('precio')) {
      return {
        content: language === 'en' 
          ? "We offer flexible pricing plans starting from a free tier. Our Pro plan is €25/month with all features included."
          : "Ofrecemos planes de precios flexibles comenzando desde un nivel gratuito. Nuestro plan Pro es €25/mes con todas las funciones incluidas.",
        suggestions: [
          language === 'en' ? "I want to try it" : "Quiero probarlo",
          language === 'en' ? "Tell me about features" : "Cuéntame sobre las funciones"
        ]
      };
    }
    
    if (lowerMessage.includes('demo') || lowerMessage.includes('show')) {
      return {
        content: language === 'en' 
          ? "I'd be happy to show you a demo! You can try our interactive demo or schedule a personalized session with our team."
          : "¡Me encantaría mostrarte una demo! Puedes probar nuestra demo interactiva o programar una sesión personalizada con nuestro equipo.",
        suggestions: [
          language === 'en' ? "Start free trial" : "Iniciar prueba gratuita",
          language === 'en' ? "Contact support" : "Contactar soporte"
        ]
      };
    }
    
    return {
      content: language === 'en' 
        ? "I'm here to help! You can ask me about our features, pricing, or request a demo."
        : "¡Estoy aquí para ayudar! Puedes preguntarme sobre nuestras funciones, precios o solicitar una demo.",
      suggestions: [
        language === 'en' ? "Tell me about features" : "Cuéntame sobre las funciones",
        language === 'en' ? "What are the prices?" : "¿Cuáles son los precios?",
        language === 'en' ? "Show me a demo" : "Muéstrame una demo"
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = getBotResponse(inputValue);
    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response.content,
      timestamp: new Date(),
      suggestions: response.suggestions
    };

    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false);
  };

  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-black hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <MessageCircle className="h-6 w-6" />
        
        {/* Notification dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-black"></div>
        
        {/* Hover tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-sm rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {language === 'en' ? 'Chat with us!' : '¡Chatea con nosotros!'}
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] max-h-[600px]"
            style={{
              position: 'fixed',
              bottom: '6rem',
              right: '1.5rem',
              zIndex: 40
            }}
          >
            <div className="bg-white border-2 border-black rounded-2xl shadow-2xl overflow-hidden">
              {!isMinimized && (
                <>
                  {/* Header */}
                  <div className="p-3 border-b-2 border-black bg-black text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-black" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">Statsor Assistant</h3>
                          <p className="text-xs text-gray-300">
                            {language === 'en' ? 'Online' : 'En línea'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setIsMinimized(true)}
                          className="p-1 hover:bg-gray-800 rounded transition-colors"
                        >
                          <Minimize2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setIsOpen(false)}
                          className="p-1 hover:bg-gray-800 rounded transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-3 h-64 overflow-y-auto bg-white">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-start space-x-2 max-w-[85%] ${
                            message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                          }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.type === 'user' ? 'bg-black' : 'bg-gray-200'
                            }`}>
                              {message.type === 'user' ? (
                                <User className="h-3 w-3 text-white" />
                              ) : (
                                <Bot className="h-3 w-3 text-black" />
                              )}
                            </div>
                            <div className={`px-3 py-2 rounded-2xl text-sm ${
                              message.type === 'user'
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-black border border-gray-300'
                            }`}>
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <Bot className="h-3 w-3 text-black" />
                            </div>
                            <div className="bg-gray-100 border border-gray-300 px-3 py-2 rounded-2xl">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Suggestions */}
                  {messages.length > 0 && messages[messages.length - 1].suggestions && (
                    <div className="px-3 pb-2">
                      <div className="flex flex-wrap gap-1">
                        {messages[messages.length - 1].suggestions?.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestion(suggestion)}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-black border border-gray-300 rounded-full transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-3 border-t-2 border-black bg-white">
                    <div className="flex space-x-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={language === 'en' ? 'Type your message...' : 'Escribe tu mensaje...'}
                        className="flex-1 border-2 border-black bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-black"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        className="p-2 bg-black hover:bg-gray-800 text-white border-2 border-black"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              
              {isMinimized && (
                <div className="p-3 bg-black text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <span className="text-sm font-medium">Statsor Assistant</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setIsMinimized(false)}
                        className="p-1 hover:bg-gray-800 rounded transition-colors"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-gray-800 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};