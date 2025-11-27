import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  Search,
  Download,
  BookOpen,
  Star,
  Tag,
  Target,
  Users,
  Trophy,
  Activity,
  X,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  pinned: boolean;
}

interface PlayerAction {
  id: string;
  playerId: string;
  playerName: string;
  actionType: 'goal' | 'assist' | 'target' | 'save' | 'foul' | 'card' | 'substitution';
  matchId: string;
  matchName: string;
  timestamp: string;
  position: {
    x: number; // Field position X coordinate
    y: number; // Field position Y coordinate
    area: string; // e.g., "Penalty Area", "Midfield", "Right Wing"
  };
  details: string; // Additional details about the action
  created_at: string;
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  totalGoals: number;
  totalAssists: number;
  totalTargets: number;
  totalSaves: number;
  totalFouls: number;
  totalCards: number;
  matchesPlayed: number;
  lastUpdated: string;
}

export const GeneralNotepad: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // Refs for auto-focus
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [filterTag, setFilterTag] = useState('');
  
  // Player Performance state
  const [activeTab, setActiveTab] = useState<'notes' | 'analytics'>('notes');
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [actionForm, setActionForm] = useState({
    playerName: '',
    actionType: 'goal' as PlayerAction['actionType'],
    matchName: '',
    positionX: 50,
    positionY: 50,
    area: '',
    details: ''
  });

  // Apply full-screen and white theme as requested
  const isDark = false;


  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`notes_${user?.id || 'guest'}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    
    const savedActions = localStorage.getItem(`player_actions_${user?.id || 'guest'}`);
    if (savedActions) {
      setPlayerActions(JSON.parse(savedActions));
    }
    
    const savedStats = localStorage.getItem(`player_stats_${user?.id || 'guest'}`);
    if (savedStats) {
      setPlayerStats(JSON.parse(savedStats));
    }
  }, [user]);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem(`notes_${user?.id || 'guest'}`, JSON.stringify(notes));
  }, [notes, user]);
  
  // Save player actions to localStorage
  useEffect(() => {
    localStorage.setItem(`player_actions_${user?.id || 'guest'}`, JSON.stringify(playerActions));
  }, [playerActions, user]);
  
  // Save player stats to localStorage
  useEffect(() => {
    localStorage.setItem(`player_stats_${user?.id || 'guest'}`, JSON.stringify(playerStats));
  }, [playerStats, user]);

  const saveNote = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    const now = new Date().toISOString();
    const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    if (selectedNote) {
      // Update existing note
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === selectedNote.id 
            ? { ...note, title: editTitle, content: editContent, tags, updated_at: now }
            : note
        )
      );
      toast.success('Note updated successfully');
    } else {
      // Create new note
      const newNote: Note = {
        id: Date.now().toString(),
        title: editTitle,
        content: editContent,
        tags,
        created_at: now,
        updated_at: now,
        pinned: false
      };
      setNotes(prevNotes => [newNote, ...prevNotes]);
      toast.success('Note created successfully');
    }

    // Clear form
    setEditTitle('');
    setEditContent('');
    setEditTags('');
    setSelectedNote(null);
    setIsEditing(false);
  };

  const deleteNote = (noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
    toast.success('Note deleted successfully');
  };

  const togglePin = (noteId: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId ? { ...note, pinned: !note.pinned } : note
      )
    );
  };

  const startEditing = (note?: Note) => {
    if (note) {
      setSelectedNote(note);
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditTags(note.tags.join(', '));
    } else {
      setSelectedNote(null);
      setEditTitle('');
      setEditContent('');
      setEditTags('');
    }
    setIsEditing(true);
    
    // Auto-focus the title input after state update
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 100);
  };
  
  const startQuickWrite = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
    setIsEditing(true);
    
    // Auto-focus the content textarea for quick writing
    setTimeout(() => {
      if (contentTextareaRef.current) {
        contentTextareaRef.current.focus();
      }
    }, 100);
  };

  const exportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `notes_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Notes exported successfully');
  };
  
  // Player Performance Functions
  
  const updatePlayerStats = (playerId: string, playerName: string, actionType: PlayerAction['actionType']) => {
    setPlayerStats(prev => {
      const existingPlayer = prev.find(p => p.playerId === playerId);
      
      if (existingPlayer) {
        return prev.map(player => {
          if (player.playerId === playerId) {
            const updated = { ...player };
            switch (actionType) {
              case 'goal':
                updated.totalGoals += 1;
                break;
              case 'assist':
                updated.totalAssists += 1;
                break;
              case 'target':
                updated.totalTargets += 1;
                break;
              case 'save':
                updated.totalSaves += 1;
                break;
              case 'foul':
                updated.totalFouls += 1;
                break;
              case 'card':
                updated.totalCards += 1;
                break;
            }
            updated.lastUpdated = new Date().toISOString();
            return updated;
          }
          return player;
        });
      } else {
        const newPlayer: PlayerStats = {
          playerId,
          playerName,
          totalGoals: actionType === 'goal' ? 1 : 0,
          totalAssists: actionType === 'assist' ? 1 : 0,
          totalTargets: actionType === 'target' ? 1 : 0,
          totalSaves: actionType === 'save' ? 1 : 0,
          totalFouls: actionType === 'foul' ? 1 : 0,
          totalCards: actionType === 'card' ? 1 : 0,
          matchesPlayed: 1,
          lastUpdated: new Date().toISOString()
        };
        return [...prev, newPlayer];
      }
    });
  };
  
  
  

  const filteredNotes = notes
    .filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(note => 
      !filterTag || note.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()))
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const allTags = [...new Set(notes.flatMap(note => note.tags))];

  return (
    <div className="h-screen overflow-hidden p-6 bg-white">
      <div className="h-full flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                <BookOpen className="h-8 w-8 text-blue-500" />
                General Notepad
              </h1>
              <p className="mt-2 text-gray-600">
                Write, organize, and save your notes with titles and tags
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={exportNotes} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => startEditing()} className="bg-blue-600 hover:bg-blue-700 font-semibold px-6 py-2">
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
          {/* Notes List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 h-full flex flex-col overflow-hidden"
          >
            <Card className="bg-white h-full flex flex-col overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <FileText className="h-5 w-5" />
                    Notes ({notes.length})
                  </CardTitle>
                  <Button 
                    onClick={() => startEditing()} 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {/* Search and Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {allTags.length > 0 && (
                    <select
                      value={filterTag}
                      onChange={(e) => setFilterTag(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border bg-white border-gray-300 text-gray-900"
                    >
                      <option value="">All tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2 flex-1 overflow-y-auto min-h-0">
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-lg border cursor-pointer transition-colors bg-gray-50 border-gray-200 hover:bg-gray-100"
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {note.pinned && <Star className="h-4 w-4 text-yellow-500" />}
                          <h3 className="font-semibold text-sm truncate text-gray-900">
                            {note.title}
                          </h3>
                        </div>
                        <p className="text-xs mt-1 line-clamp-2 break-words text-gray-600">
                          {note.content}
                        </p>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {note.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{note.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                        <p className="text-xs mt-1 text-gray-500">
                          {new Date(note.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(note.id);
                          }}
                        >
                          <Star className={`h-4 w-4 ${note.pinned ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(note);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {filteredNotes.length === 0 && (
                  <div className="text-center py-8 text-gray-600">
                    {searchTerm || filterTag ? (
                      <div>
                        <p className="mb-4">No notes match your search</p>
                        <Button 
                          onClick={() => {
                            setSearchTerm('');
                            setFilterTag('');
                          }} 
                          variant="outline" 
                          size="sm"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-4">No notes yet. Create your first note!</p>
                        <Button 
                          onClick={() => startEditing()} 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Note
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Note Editor/Viewer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 h-full flex flex-col overflow-hidden"
          >
            <Card className="h-full bg-white flex flex-col overflow-hidden">
              {isEditing ? (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-gray-900">
                      <span>{selectedNote ? 'Edit Note' : 'Create New Note'}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveNote} className="bg-green-600 hover:bg-green-700">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 flex-1 overflow-y-auto min-h-0">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Title
                      </label>
                      <Input
                        ref={titleInputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Enter note title..."
                        className="text-lg font-semibold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && contentTextareaRef.current) {
                            contentTextareaRef.current.focus();
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Tags (comma-separated)
                      </label>
                      <Input
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="meeting, important, project..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Content
                      </label>
                      <Textarea
                        ref={contentTextareaRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Start writing your thoughts here...\n\nTip: Use this space for:\n• Meeting notes\n• Ideas and brainstorming\n• Task lists\n• Project planning\n• Daily reflections\n• Or anything else you want to remember!"
                        className="h-64 resize-none text-base leading-relaxed overflow-y-auto placeholder:text-gray-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            const start = e.currentTarget.selectionStart;
                            const end = e.currentTarget.selectionEnd;
                            const newContent = editContent.substring(0, start) + '    ' + editContent.substring(end);
                            setEditContent(newContent);
                            setTimeout(() => {
                              if (contentTextareaRef.current) {
                                contentTextareaRef.current.selectionStart = contentTextareaRef.current.selectionEnd = start + 4;
                              }
                            }, 0);
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </>
              ) : selectedNote ? (
                <>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className={`flex items-center gap-2 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedNote.pinned && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                          {selectedNote.title}
                        </CardTitle>
                        {selectedNote.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedNote.tags.map(tag => (
                              <Badge key={tag} variant="secondary">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className={`flex items-center gap-4 mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} flex-wrap`}>
                          <span>Created: {new Date(selectedNote.created_at).toLocaleString()}</span>
                          <span>Updated: {new Date(selectedNote.updated_at).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <Button onClick={() => startEditing(selectedNote)} className="bg-blue-600 hover:bg-blue-700">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-y-auto min-h-0">
                    <div className="whitespace-pre-wrap text-gray-700 h-full overflow-y-auto">
                      {selectedNote.content}
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent 
                  className="flex flex-col items-center justify-center flex-1 cursor-pointer transition-all duration-200 hover:bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 min-h-0 overflow-hidden"
                  onClick={startQuickWrite}
                >
                  <div className="text-center text-gray-600">
                    <div className="mb-6">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <Edit3 className="h-8 w-8 mx-auto mb-4 opacity-70" />
                    </div>
                    <p className="text-xl mb-3 font-semibold">Start Writing</p>
                    <p className="text-sm mb-4">Click here to start writing in this space</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>Quick notes and thoughts</p>
                      <p>Meeting minutes</p>
                      <p>Ideas and brainstorming</p>
                      <p>Task lists and planning</p>
                    </div>
                    <div className="mt-6">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          startQuickWrite();
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Start Writing Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        </div>
        
        {/* Floating Action Button for Mobile */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-6 md:hidden z-50"
        >
          <Button 
            onClick={() => startEditing()} 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default GeneralNotepad;