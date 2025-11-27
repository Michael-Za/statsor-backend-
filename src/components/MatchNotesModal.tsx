import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Plus, Trash2, Target, Shield, Award, User } from 'lucide-react';
import { toast } from 'sonner';

interface MatchNote {
  id: string;
  title: string;
  content: string;
  minute: number;
  type: 'goal' | 'card' | 'substitution' | 'injury' | 'other';
  player?: string;
  team?: string;
  createdAt: Date;
}

interface MatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  notes: MatchNote[];
  onSaveNotes: (notes: MatchNote[]) => void;
}

export const MatchNotesModal: React.FC<MatchNotesModalProps> = ({ 
  isOpen, 
  onClose, 
  matchId, 
  notes, 
  onSaveNotes 
}) => {
  const [localNotes, setLocalNotes] = useState<MatchNote[]>(notes);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    minute: 0,
    type: 'other' as 'goal' | 'card' | 'substitution' | 'injury' | 'other',
    player: '',
    team: ''
  });

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleAddNote = () => {
    if (!newNote.title.trim() || newNote.minute < 0 || newNote.minute > 120) {
      toast.error('Please provide a title and valid minute (0-120)');
      return;
    }

    const note: MatchNote = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      minute: newNote.minute,
      type: newNote.type,
      player: newNote.player,
      team: newNote.team,
      createdAt: new Date()
    };

    const updatedNotes = [...localNotes, note];
    setLocalNotes(updatedNotes);
    onSaveNotes(updatedNotes);
    
    setNewNote({
      title: '',
      content: '',
      minute: 0,
      type: 'other',
      player: '',
      team: ''
    });
    setIsAddingNote(false);
    toast.success('Note added successfully!');
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = localNotes.filter(note => note.id !== id);
    setLocalNotes(updatedNotes);
    onSaveNotes(updatedNotes);
    toast.success('Note deleted successfully!');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="w-4 h-4" />;
      case 'card':
        return <Award className="w-4 h-4" />;
      case 'substitution':
        return <User className="w-4 h-4" />;
      case 'injury':
        return <Shield className="w-4 h-4" />;
      default:
        return <span className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'bg-green-100 text-green-800';
      case 'card':
        return 'bg-yellow-100 text-yellow-800';
      case 'substitution':
        return 'bg-blue-100 text-blue-800';
      case 'injury':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Match Notes</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isAddingNote ? (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold">Add New Note</h3>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <Input
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter note title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Minute *</label>
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      value={newNote.minute}
                      onChange={(e) => setNewNote(prev => ({ ...prev, minute: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <Select value={newNote.type} onValueChange={(value: any) => setNewNote(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="goal">Goal</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="substitution">Substitution</SelectItem>
                        <SelectItem value="injury">Injury</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(newNote.type === 'goal' || newNote.type === 'card' || newNote.type === 'substitution') && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Player</label>
                    <Input
                      value={newNote.player}
                      onChange={(e) => setNewNote(prev => ({ ...prev, player: e.target.value }))}
                      placeholder="Enter player name"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Content</label>
                  <Textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter note details"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setIsAddingNote(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            )}
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {localNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No notes added for this match</p>
                </div>
              ) : (
                localNotes.map((note) => (
                  <div key={note.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(note.type)}`}>
                            <span className="flex items-center">
                              {getTypeIcon(note.type)}
                              <span className="ml-1 capitalize">{note.type}</span>
                            </span>
                          </span>
                          <span className="text-sm text-gray-500">{note.minute}'</span>
                        </div>
                        
                        <h4 className="font-semibold">{note.title}</h4>
                        
                        {note.player && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Player:</span> {note.player}
                          </p>
                        )}
                        
                        {note.content && (
                          <p className="text-sm text-gray-700 mt-2">
                            {note.content}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {note.createdAt.toLocaleString()}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchNotesModal;