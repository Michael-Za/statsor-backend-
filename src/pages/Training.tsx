import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Search,
  Clock,
  Users,
  Target,
  Zap,
  Plus,
  Save,
  Share,
  Download,
  Pencil,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { trainingService, TrainingSession } from '../services/trainingService';

// Extended interface for upcoming sessions with scheduled date
interface UpcomingTrainingSession extends TrainingSession {
  scheduledDate?: Date;
  notes?: string;
}

interface Exercise {
  id: string;
  name: string;
  type: 'tactico' | 'tecnico' | 'fisico' | 'cognitivo';
  category: 'ataque' | 'defensa' | 'transiciones' | 'abp' | 'especiales';
  duration: number; // in minutes
  players: number;
  objective: string;
  image?: string;
  notes?: string;
}

// Mock exercises data in English
const mockExercises: Exercise[] = [
  {
    id: '1',
    name: '7v7+2 Possession',
    type: 'tactico',
    category: 'ataque',
    duration: 15,
    players: 16,
    objective: 'Maintain ball possession and create numerical advantages',
    image: '/lovable-uploads/photo_2025-06-28_12-01-21.jpg'
  },
  {
    id: '2',
    name: 'Pressure after loss',
    type: 'tactico',
    category: 'defensa',
    duration: 20,
    players: 22,
    objective: 'Quickly recover the ball after losing possession',
    image: '/lovable-uploads/photo_2025-06-28_12-01-27.jpg'
  },
  {
    id: '3',
    name: 'Defense-attack transition',
    type: 'tactico',
    category: 'transiciones',
    duration: 18,
    players: 20,
    objective: 'Quick mental shift from defensive to offensive mindset',
    image: '/lovable-uploads/photo_2025-06-28_12-01-32.jpg'
  },
  {
    id: '4',
    name: 'Oriented control',
    type: 'tecnico',
    category: 'abp',
    duration: 12,
    players: 8,
    objective: 'Improve first touch and body orientation',
    image: '/lovable-uploads/photo_2025-06-28_12-01-36.jpg'
  },
  {
    id: '5',
    name: '1v1 Finishing',
    type: 'tecnico',
    category: 'ataque',
    duration: 10,
    players: 6,
    objective: 'Improve finishing in one-on-one situations',
    image: '/lovable-uploads/photo_2025-06-28_12-01-44.jpg'
  },
  {
    id: '6',
    name: 'Defensive corners',
    type: 'tactico',
    category: 'especiales',
    duration: 8,
    players: 22,
    objective: 'Defensive organization in corner situations',
    image: '/lovable-uploads/football-button.jpg'
  },
  {
    id: '7',
    name: 'High press',
    type: 'tactico',
    category: 'defensa',
    duration: 15,
    players: 22,
    objective: 'Apply high pressure to force opponent mistakes',
    image: '/lovable-uploads/football-button.jpg'
  },
  {
    id: '8',
    name: 'Counter attack',
    type: 'tactico',
    category: 'ataque',
    duration: 12,
    players: 18,
    objective: 'Quick transition from defense to attack',
    image: '/lovable-uploads/football-button.jpg'
  },
  {
    id: '9',
    name: 'Set pieces - Attack',
    type: 'tactico',
    category: 'especiales',
    duration: 20,
    players: 22,
    objective: 'Organize attacking set pieces (corners, free kicks)',
    image: '/lovable-uploads/football-button.jpg'
  }
];

const Training: React.FC = () => {
  const { t } = useLanguage();
  const [exercises] = useState<Exercise[]>(mockExercises);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(mockExercises);
  const [currentSession, setCurrentSession] = useState<TrainingSession>({
    id: Date.now().toString(),
    name: 'New Session',
    exercises: [],
    totalDuration: 0,
    createdAt: new Date(),
    createdBy: 'current_user',
    sport: 'soccer'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [draggedExercise, setDraggedExercise] = useState<Exercise | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    type: 'tactico',
    category: 'ataque',
    duration: 15,
    players: 11,
    objective: '',
    image: '/placeholder.svg'
  });
  const [sessionHistory, setSessionHistory] = useState<TrainingSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingTrainingSession[]>([]);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Load session history and upcoming sessions on component mount
  useEffect(() => {
    const history = trainingService.getSessionHistory();
    setSessionHistory(history);
    
    // Load upcoming sessions from localStorage
    const savedUpcoming = localStorage.getItem('upcoming_sessions');
    if (savedUpcoming) {
      try {
        const parsed = JSON.parse(savedUpcoming);
        // Convert date strings back to Date objects
        const withDates = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          scheduledDate: session.scheduledDate ? new Date(session.scheduledDate) : undefined
        }));
        setUpcomingSessions(withDates);
      } catch (e) {
        console.error('Error parsing upcoming sessions', e);
        // If there's an error parsing, clear the localStorage item
        localStorage.removeItem('upcoming_sessions');
      }
    }
  }, []);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'ataque', label: 'Attack' },
    { value: 'defensa', label: 'Defense' },
    { value: 'transiciones', label: 'Transitions' },
    { value: 'abp', label: 'ABP' },
    { value: 'especiales', label: 'Special Situations' }
  ];

  const types = [
    { value: 'all', label: 'All' },
    { value: 'tactico', label: 'Tactical' },
    { value: 'tecnico', label: 'Technical' },
    { value: 'fisico', label: 'Physical' },
    { value: 'cognitivo', label: 'Cognitive' }
  ];

  // Filter exercises based on search and filters
  useEffect(() => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.objective.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(exercise => exercise.type === selectedType);
    }

    setFilteredExercises(filtered);
  }, [searchTerm, selectedCategory, selectedType, exercises]);

  const handleDragStart = (exercise: Exercise) => {
    setDraggedExercise(exercise);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedExercise) {
      addExerciseToSession(draggedExercise);
      setDraggedExercise(null);
    }
  };

  const addExerciseToSession = (exercise: Exercise) => {
    const newSession = {
      ...currentSession,
      exercises: [...currentSession.exercises, { ...exercise, id: `${exercise.id}_${Date.now()}` }],
      totalDuration: currentSession.totalDuration + exercise.duration
    };
    setCurrentSession(newSession);
    toast.success(`${exercise.name} added to session`);
  };

  const removeExerciseFromSession = (exerciseId: string) => {
    const exerciseToRemove = currentSession.exercises.find(ex => ex.id === exerciseId);
    if (exerciseToRemove) {
      const newSession = {
        ...currentSession,
        exercises: currentSession.exercises.filter(ex => ex.id !== exerciseId),
        totalDuration: currentSession.totalDuration - exerciseToRemove.duration
      };
      setCurrentSession(newSession);
      toast.success('Exercise removed from session');
      
      // Remove notes for this exercise if they exist
      const newNotes = { ...exerciseNotes };
      delete newNotes[exerciseId];
      setExerciseNotes(newNotes);
    }
  };

  const saveSession = () => {
    if (currentSession.exercises.length === 0) {
      toast.error('Add at least one exercise to save the session');
      return;
    }

    try {
      const sessionToSave = {
        name: currentSession.name,
        exercises: currentSession.exercises.map(ex => {
          // Add notes to each exercise if they exist
          return {
            ...ex,
            notes: exerciseNotes[ex.id] || ''
          };
        }),
        totalDuration: currentSession.totalDuration,
        createdBy: 'current_user', // In production, get from auth context
        sport: 'soccer' as const, // Get from sport context
        notes: sessionNotes
      };

      trainingService.saveSession(sessionToSave).then(savedSession => {
        toast.success('Training session saved successfully!');
        setSessionHistory(prev => [savedSession, ...prev]);
        
        // If a scheduled date is set, also add to upcoming sessions
        if (scheduledDate) {
          const upcomingSession: UpcomingTrainingSession = {
            ...savedSession,
            scheduledDate: new Date(scheduledDate)
          };
          const newUpcomingSessions = [upcomingSession, ...upcomingSessions];
          setUpcomingSessions(newUpcomingSessions);
          // Save to localStorage
          localStorage.setItem('upcoming_sessions', JSON.stringify(newUpcomingSessions));
          setScheduledDate(''); // Reset scheduled date
        }
        
        // Reset current session
        setCurrentSession({
          id: Date.now().toString(),
          name: 'New Session',
          exercises: [],
          totalDuration: 0,
          createdAt: new Date(),
          createdBy: 'current_user',
          sport: 'soccer'
        });
        
        // Reset notes
        setExerciseNotes({});
        setSessionNotes('');
      });
    } catch (error) {
      toast.error('Failed to save session');
      console.error('Save session error:', error);
    }
  };

  const shareSession = async (format: 'link' | 'email' | 'whatsapp') => {
    if (currentSession.exercises.length === 0) {
      toast.error('Add exercises to share the session');
      return;
    }

    try {
      // First save the session if it's not saved
      let sessionToShare = currentSession;
      if (!sessionHistory.find(s => s.id === currentSession.id)) {
        const sessionToSave = {
          name: currentSession.name,
          exercises: currentSession.exercises,
          totalDuration: currentSession.totalDuration,
          createdBy: 'current_user',
          sport: 'soccer' as const,
          notes: sessionNotes
        };
        sessionToShare = await trainingService.saveSession(sessionToSave);
      }

      const shareUrl = await trainingService.shareSession(sessionToShare.id, { format });
      
      switch (format) {
        case 'link':
          toast.success('Share link copied to clipboard!');
          break;
        case 'email':
          toast.success('Email client opened');
          break;
        case 'whatsapp':
          toast.success('WhatsApp opened');
          break;
      }
    } catch (error) {
      toast.error('Failed to share session');
      console.error('Share session error:', error);
    }
  };

  const exportToPDF = async () => {
    if (currentSession.exercises.length === 0) {
      toast.error('Add exercises to export the session');
      return;
    }

    try {
      // Convert current session to TrainingSession format
      const sessionToExport: TrainingSession = {
        id: currentSession.id,
        name: currentSession.name,
        exercises: currentSession.exercises,
        totalDuration: currentSession.totalDuration,
        createdAt: currentSession.createdAt,
        updatedAt: new Date(),
        createdBy: 'current_user',
        sport: 'soccer',
        notes: sessionNotes
      };

      await trainingService.exportToPDF(sessionToExport);
      toast.success('PDF export initiated - check your browser for the print dialog');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    }
  };

  const handleCreateExercise = () => {
    if (!newExercise.name || !newExercise.objective) {
      toast.error('Please complete all required fields');
      return;
    }

    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExercise.name,
      type: newExercise.type as 'tactico' | 'tecnico' | 'fisico' | 'cognitivo',
      category: newExercise.category as 'ataque' | 'defensa' | 'transiciones' | 'abp' | 'especiales',
      duration: newExercise.duration,
      players: newExercise.players,
      objective: newExercise.objective,
      image: newExercise.image
    };

    // Add to exercises list (in a real app, this would be saved to backend)
    exercises.push(exercise);
    setFilteredExercises([...exercises]);
    
    // Reset form
    setNewExercise({
      name: '',
      type: 'tactico',
      category: 'ataque',
      duration: 15,
      players: 11,
      objective: '',
      image: '/placeholder.svg'
    });
    setShowCreateForm(false);
    
    toast.success('Exercise created successfully');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tactico': return 'bg-blue-100 text-blue-800';
      case 'tecnico': return 'bg-green-100 text-green-800';
      case 'fisico': return 'bg-red-100 text-red-800';
      case 'cognitivo': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ataque': return 'bg-orange-100 text-orange-800';
      case 'defensa': return 'bg-indigo-100 text-indigo-800';
      case 'transiciones': return 'bg-yellow-100 text-yellow-800';
      case 'abp': return 'bg-pink-100 text-pink-800';
      case 'especiales': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Date not set';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  // Remove upcoming session
  const removeUpcomingSession = (sessionId: string) => {
    const newUpcomingSessions = upcomingSessions.filter(session => session.id !== sessionId);
    setUpcomingSessions(newUpcomingSessions);
    localStorage.setItem('upcoming_sessions', JSON.stringify(newUpcomingSessions));
    toast.success('Session removed from upcoming sessions');
  };

  // Toggle upcoming sessions visibility
  const toggleUpcomingVisibility = () => {
    setShowUpcoming(!showUpcoming);
  };

  // Add note to an exercise
  const addNoteToExercise = (exerciseId: string, note: string) => {
    setExerciseNotes(prev => ({
      ...prev,
      [exerciseId]: note
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training</h1>
          <p className="text-muted-foreground mt-2">Create custom training sessions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={saveSession}>
            <Save className="w-4 h-4 mr-2" />
            Save Session
          </Button>
          <Button 
            variant="outline"
            onClick={(event) => {
              const dropdown = document.createElement('div');
              dropdown.className = 'absolute bg-white border rounded shadow-lg p-2 z-50';
              dropdown.style.top = '100%';
              dropdown.style.right = '0';
              
              // Create share buttons programmatically
              const shareOptions = [
                { text: 'Share Link', action: 'link' },
                { text: 'Share via Email', action: 'email' },
                { text: 'Share via WhatsApp', action: 'whatsapp' }
              ];
              
              shareOptions.forEach(option => {
                const button = document.createElement('button');
                button.className = 'block w-full text-left px-3 py-2 hover:bg-gray-100 rounded';
                button.textContent = option.text;
                button.addEventListener('click', () => {
                  // Handle share action here
                  console.log(`Sharing via ${option.action}`);
                  dropdown.remove();
                });
                dropdown.appendChild(button);
              });
              
              // Add to DOM temporarily
              const container = document.createElement('div');
              container.className = 'relative inline-block';
              container.appendChild(dropdown);
              
              // Position and show
              const rect = (event.target as HTMLElement).getBoundingClientRect();
              container.style.position = 'fixed';
              container.style.top = rect.bottom + 'px';
              container.style.right = (window.innerWidth - rect.right) + 'px';
              document.body.appendChild(container);
              
              // Add global click handler to close
              const closeDropdown = () => {
                document.body.removeChild(container);
                document.removeEventListener('click', closeDropdown);
              };
              setTimeout(() => document.addEventListener('click', closeDropdown), 100);
              
              // Make functions available globally
              (window as any).shareSession = shareSession;
            }}
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowHistory(!showHistory)}
          >
            <Clock className="w-4 h-4 mr-2" />
            History ({sessionHistory.length})
          </Button>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create Exercise'}
          </Button>
        </div>
      </div>

      {/* Upcoming Sessions */}
      {showUpcoming && (
        <div className="bg-card rounded-lg border shadow-sm mb-6">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Sessions
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleUpcomingVisibility}
              >
                Hide
              </Button>
            </div>
          </div>
          <div className="p-4">
            {upcomingSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No upcoming sessions scheduled</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{session.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {session.exercises.length} exercises • {session.totalDuration} min • {session.scheduledDate ? formatDate(session.scheduledDate) : 'Date not set'}
                      </p>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Notes: {session.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentSession({
                            id: session.id,
                            name: session.name,
                            exercises: session.exercises,
                            totalDuration: session.totalDuration,
                            createdAt: new Date(),
                            createdBy: session.createdBy || 'current_user',
                            sport: session.sport || 'soccer',
                            notes: session.notes || ''
                          });
                          
                          // Load exercise notes if they exist
                          const notes: Record<string, string> = {};
                          session.exercises.forEach(ex => {
                            // Skip checking notes on exercise objects as they may not exist in the saved session
                            // Notes are stored separately in the session notes field
                          });
                          setExerciseNotes(notes);
                          
                          // Load session notes
                          setSessionNotes(session.notes || '');
                          
                          toast.success('Session loaded');
                        }}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeUpcomingSession(session.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session History */}
      {showHistory && (
        <div className="bg-card rounded-lg border shadow-sm mb-6">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Session History</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowHistory(false)}
            >
              Hide
            </Button>
          </div>
          <div className="p-4">
            {sessionHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No saved sessions yet</p>
            ) : (
              <div className="space-y-3">
                {sessionHistory.slice(0, 10).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{session.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {session.exercises.length} exercises • {session.totalDuration} min • {session.createdAt.toLocaleDateString()}
                      </p>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Notes: {session.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentSession({
                            id: session.id,
                            name: session.name + ' (Copy)',
                            exercises: session.exercises,
                            totalDuration: session.totalDuration,
                            createdAt: new Date(),
                            createdBy: session.createdBy || 'current_user',
                            sport: session.sport || 'soccer',
                            notes: session.notes || ''
                          });
                          
                          // Load exercise notes if they exist
                          const notes: Record<string, string> = {};
                          // Skip loading exercise notes as they may not exist in the saved session
                          // Notes are stored separately in the session notes field
                          setExerciseNotes(notes);
                          
                          // Load session notes
                          setSessionNotes(session.notes || '');
                          
                          setShowHistory(false);
                          toast.success('Session loaded');
                        }}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => trainingService.exportToPDF(session)}
                      >
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Exercise Form */}
      {showCreateForm && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Exercise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exercise Name *
                </label>
                <Input
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                  placeholder="E.g. Possession 4v2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={newExercise.duration}
                  onChange={(e) => setNewExercise({...newExercise, duration: parseInt(e.target.value) || 15})}
                  min="5"
                  max="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Players
                </label>
                <Input
                  type="number"
                  value={newExercise.players}
                  onChange={(e) => setNewExercise({...newExercise, players: parseInt(e.target.value) || 11})}
                  min="2"
                  max="22"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={newExercise.type}
                  onChange={(e) => setNewExercise({...newExercise, type: e.target.value})}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                >
                  <option value="tactico">Tactical</option>
                  <option value="tecnico">Technical</option>
                  <option value="fisico">Physical</option>
                  <option value="cognitivo">Cognitive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objective *
                </label>
                <textarea
                  value={newExercise.objective}
                  onChange={(e) => setNewExercise({...newExercise, objective: e.target.value})}
                  placeholder="Describe the objective of the exercise..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateExercise}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Exercise
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercise Gallery */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold mb-4">Exercise Gallery</h2>
              
              {/* Search and Filters */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {types.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Exercises Grid */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    draggable
                    onDragStart={() => handleDragStart(exercise)}
                    className="bg-background border rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
                  >
                    {exercise.image && (
                      <img
                        src={exercise.image}
                        alt={exercise.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-foreground mb-2">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{exercise.objective}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getTypeColor(exercise.type)}>
                        {exercise.type}
                      </Badge>
                      <Badge className={getCategoryColor(exercise.category)}>
                        {exercise.category}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {exercise.duration} min
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {exercise.players} players
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Session Builder */}
        <div className="space-y-6">
          {/* Session Timeline */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Training Session</h2>
              <Input
                value={currentSession.name}
                onChange={(e) => setCurrentSession({...currentSession, name: e.target.value})}
                className="mt-2"
                placeholder="Session name"
              />
              {/* Scheduled Date Input */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule for date:
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full"
                />
              </div>
              {/* Session Notes */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Notes:
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Add notes for this session..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md resize-none"
                />
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Total Duration</span>
                  <span className="text-lg font-bold text-primary">
                    {currentSession.totalDuration} min
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((currentSession.totalDuration / 90) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Goal: 90 minutes
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 mb-4 min-h-[100px] bg-muted/10"
              >
                {currentSession.exercises.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Drag exercises here to create your session</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentSession.exercises.map((exercise, index) => (
                      <div
                        key={exercise.id}
                        className="bg-background border rounded-lg p-3 flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{exercise.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getTypeColor(exercise.type)}>
                              {exercise.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {exercise.duration} min
                            </span>
                          </div>
                          {exerciseNotes[exercise.id] && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Note: {exerciseNotes[exercise.id]}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const note = prompt('Add note for this exercise:', exerciseNotes[exercise.id] || '');
                              if (note !== null) {
                                addNoteToExercise(exercise.id, note);
                                toast.success('Note added to exercise');
                              }
                            }}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExerciseFromSession(exercise.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Smart Suggestions */}
              <div className="border rounded-lg p-4 bg-primary/5">
                <div className="flex items-center mb-2">
                  <Zap className="w-4 h-4 mr-2 text-primary" />
                  <h3 className="font-semibold text-sm">Smart Suggestions</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Based on the last match, we recommend defensive exercises
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => exercises[1] && addExerciseToSession(exercises[1])}
                    disabled={!exercises[1]}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Pressure after loss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => exercises[5] && addExerciseToSession(exercises[5])}
                    disabled={!exercises[5]}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Defensive corners
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Training;