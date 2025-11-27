import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { MessageCircle, Send, Camera, MapPin, Users, Clock, Heart, Siren as Fire, ThumbsUp, Flag, Image as ImageIcon, Video, Mic, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface MatchThread {
  id: string;
  match_id: string;
  home_team: string;
  away_team: string;
  match_time: string;
  venue: string;
  status: 'upcoming' | 'live' | 'finished';
  participant_count: number;
  created_at: string;
}

interface ThreadMessage {
  id: string;
  thread_id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  content: string;
  message_type: 'text' | 'photo' | 'video' | 'heatmap' | 'reaction';
  media_url?: string;
  heatmap_data?: {
    x: number;
    y: number;
    zone: string;
    comment: string;
  };
  reactions: {
    fire: number;
    heart: number;
    thumbs_up: number;
  };
  timestamp: string;
  is_typing?: boolean;
}

interface HeatmapClick {
  x: number;
  y: number;
  zone: string;
}

export const LiveMatchThreads: React.FC = () => {
  const { user } = useAuth();
  const [activeThreads, setActiveThreads] = useState<MatchThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MatchThread | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load active match threads
  useEffect(() => {
    loadActiveThreads();
    
    // Subscribe to new threads
    const threadsSubscription = supabase
      .channel('match_threads')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'match_threads'
      }, () => {
        loadActiveThreads();
      })
      .subscribe();

    return () => {
      threadsSubscription.unsubscribe();
    };
  }, []);

  // Subscribe to messages for selected thread
  useEffect(() => {
    if (!selectedThread) return;

    loadMessages(selectedThread.id);

    const messagesSubscription = supabase
      .channel(`thread_${selectedThread.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'thread_messages',
        filter: `thread_id=eq.${selectedThread.id}`
      }, (payload) => {
        const newMessage = payload.new as ThreadMessage;
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'thread_messages',
        filter: `thread_id=eq.${selectedThread.id}`
      }, (payload) => {
        const updatedMessage = payload.new as ThreadMessage;
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      })
      .subscribe();

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel(`typing_${selectedThread.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, username, is_typing } = payload.payload;
        if (user_id !== user?.id) {
          setTypingUsers(prev => {
            if (is_typing) {
              return prev.includes(username) ? prev : [...prev, username];
            } else {
              return prev.filter(u => u !== username);
            }
          });
        }
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [selectedThread, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadActiveThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('match_threads')
        .select(`
          *,
          matches (
            home_team,
            away_team,
            date,
            venue,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedThreads = data?.map(thread => ({
        id: thread.id,
        match_id: thread.match_id,
        home_team: thread.matches?.home_team || 'Team A',
        away_team: thread.matches?.away_team || 'Team B',
        match_time: thread.matches?.date || new Date().toISOString(),
        venue: thread.matches?.venue || 'Stadium',
        status: thread.matches?.status || 'upcoming',
        participant_count: thread.participant_count || 0,
        created_at: thread.created_at
      })) || [];

      setActiveThreads(formattedThreads);
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('thread_messages')
        .select(`
          *,
          users (
            name,
            picture
          )
        `)
        .eq('thread_id', threadId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        thread_id: msg.thread_id,
        user_id: msg.user_id,
        username: msg.users?.name || 'Anonymous',
        user_avatar: msg.users?.picture,
        content: msg.content,
        message_type: msg.message_type,
        media_url: msg.media_url,
        heatmap_data: msg.heatmap_data,
        reactions: msg.reactions || { fire: 0, heart: 0, thumbs_up: 0 },
        timestamp: msg.timestamp
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedThread || !user || (!newMessage.trim() && !selectedMedia)) return;

    try {
      let mediaUrl = null;
      
      // Upload media if selected
      if (selectedMedia) {
        mediaUrl = await uploadMedia(selectedMedia);
      }

      const messageData = {
        thread_id: selectedThread.id,
        user_id: user.id,
        content: newMessage.trim(),
        message_type: selectedMedia?.type.startsWith('video/') ? 'video' : 
                     selectedMedia?.type.startsWith('image/') ? 'photo' : 'text',
        media_url: mediaUrl,
        reactions: { fire: 0, heart: 0, thumbs_up: 0 },
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('thread_messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      setSelectedMedia(null);
      setMediaPreview(null);
      stopTyping();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const uploadMedia = async (file: File): Promise<string> => {
    // Mock upload to Cloudflare R2 - implement actual upload in production
    const formData = new FormData();
    formData.append('file', file);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `https://cloudflare-r2.example.com/media/${Date.now()}-${file.name}`;
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!isTyping) {
      setIsTyping(true);
      broadcastTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      broadcastTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const broadcastTyping = (typing: boolean) => {
    if (!selectedThread || !user) return;

    supabase.channel(`typing_${selectedThread.id}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          username: user.name,
          is_typing: typing
        }
      });
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedMedia(file);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const addReaction = async (messageId: string, reactionType: 'fire' | 'heart' | 'thumbs_up') => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const updatedReactions = {
        ...message.reactions,
        [reactionType]: message.reactions[reactionType] + 1
      };

      const { error } = await supabase
        .from('thread_messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) throw error;

    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleHeatmapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    // Determine zone based on click position
    const zone = getZoneFromCoordinates(x, y);
    
    setShowHeatmapModal(true);
    // Store click data for comment
  };

  const getZoneFromCoordinates = (x: number, y: number): string => {
    if (y < 33) return x < 50 ? 'top-left' : 'top-right';
    if (y < 66) return x < 50 ? 'middle-left' : 'middle-right';
    return x < 50 ? 'bottom-left' : 'bottom-right';
  };

  const renderMessage = (message: ThreadMessage) => (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex space-x-3 p-3 hover:bg-gray-50 rounded-lg"
    >
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
        {message.user_avatar ? (
          <img src={message.user_avatar} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          message.username.charAt(0).toUpperCase()
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-sm">{message.username}</span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        <div className="text-sm text-gray-900 mb-2">{message.content}</div>
        
        {message.media_url && (
          <div className="mb-2">
            {message.message_type === 'photo' ? (
              <img
                src={message.media_url}
                alt="Shared image"
                className="max-w-xs rounded-lg cursor-pointer"
                onClick={() => window.open(message.media_url, '_blank')}
              />
            ) : message.message_type === 'video' ? (
              <video
                src={message.media_url}
                controls
                className="max-w-xs rounded-lg"
              />
            ) : null}
          </div>
        )}
        
        {message.heatmap_data && (
          <div className="mb-2 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
            <div className="text-xs text-blue-600 font-medium">
              📍 {message.heatmap_data.zone} - {message.heatmap_data.comment}
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => addReaction(message.id, 'fire')}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-orange-500"
          >
            <Fire className="w-3 h-3" />
            <span>{message.reactions.fire}</span>
          </button>
          
          <button
            onClick={() => addReaction(message.id, 'heart')}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500"
          >
            <Heart className="w-3 h-3" />
            <span>{message.reactions.heart}</span>
          </button>
          
          <button
            onClick={() => addReaction(message.id, 'thumbs_up')}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500"
          >
            <ThumbsUp className="w-3 h-3" />
            <span>{message.reactions.thumbs_up}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderThreadsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Live Match Threads</h2>
        <Badge className="bg-red-500 text-white animate-pulse">
          {activeThreads.filter(t => t.status === 'live').length} LIVE
        </Badge>
      </div>
      
      {activeThreads.map(thread => (
        <Card
          key={thread.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedThread(thread)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">
                  {thread.home_team} vs {thread.away_team}
                </h3>
                <Badge className={
                  thread.status === 'live' ? 'bg-red-500 text-white' :
                  thread.status === 'upcoming' ? 'bg-blue-500 text-white' :
                  'bg-gray-500 text-white'
                }>
                  {thread.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{thread.participant_count}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(thread.match_time).toLocaleString()}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{thread.venue}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderChatInterface = () => (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {selectedThread?.home_team} vs {selectedThread?.away_team}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{selectedThread?.venue}</span>
              <Badge className={
                selectedThread?.status === 'live' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
              }>
                {selectedThread?.status.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <Button
            onClick={() => setSelectedThread(null)}
            variant="outline"
            size="sm"
          >
            Back to Threads
          </Button>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="p-4 border-b bg-green-50">
        <h3 className="text-sm font-semibold mb-2">🔥 Click on the pitch to comment</h3>
        <div
          className="relative bg-green-400 rounded-lg h-32 cursor-crosshair"
          onClick={handleHeatmapClick}
        >
          {/* Football pitch visualization */}
          <div className="absolute inset-0 border-2 border-white rounded-lg">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(renderMessage)}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 italic">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {mediaPreview && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedMedia?.type.startsWith('image/') ? (
                <img src={mediaPreview} alt="Preview" className="w-12 h-12 rounded object-cover" />
              ) : (
                <video src={mediaPreview} className="w-12 h-12 rounded object-cover" />
              )}
              <span className="text-sm text-gray-600">{selectedMedia?.name}</span>
            </div>
            <Button
              onClick={() => {
                setSelectedMedia(null);
                setMediaPreview(null);
              }}
              variant="ghost"
              size="sm"
            >
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t p-4 bg-white">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
          >
            <Camera className="w-4 h-4" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Share your thoughts on the match..."
            className="flex-1"
          />
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() && !selectedMedia}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {selectedThread ? renderChatInterface() : renderThreadsList()}
    </div>
  );
};

export default LiveMatchThreads;