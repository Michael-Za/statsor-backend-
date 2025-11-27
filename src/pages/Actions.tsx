import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Target, Plus, Search, Filter, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Action {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const Actions: React.FC = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [newAction, setNewAction] = useState({
    name: '',
    description: '',
    category: 'Training',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Load actions from localStorage
  useEffect(() => {
    const savedActions = localStorage.getItem('statsor_actions');
    if (savedActions) {
      try {
        const parsedActions = JSON.parse(savedActions).map((action: any) => ({
          ...action,
          createdAt: new Date(action.createdAt),
          updatedAt: new Date(action.updatedAt)
        }));
        setActions(parsedActions);
      } catch (error) {
        console.error('Error parsing actions:', error);
        setActions([]);
      }
    }
  }, []);

  // Save actions to localStorage
  useEffect(() => {
    localStorage.setItem('statsor_actions', JSON.stringify(actions));
  }, [actions]);

  const handleAddAction = () => {
    if (!newAction.name.trim()) {
      toast.error('Please enter an action name');
      return;
    }

    const action: Action = {
      id: Date.now().toString(),
      name: newAction.name,
      description: newAction.description,
      category: newAction.category,
      priority: newAction.priority,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setActions(prev => [action, ...prev]);
    setNewAction({ name: '', description: '', category: 'Training', priority: 'medium' });
    setIsAddingAction(false);
    toast.success('Action added successfully!');
  };

  const updateActionStatus = (id: string, status: 'pending' | 'in-progress' | 'completed') => {
    setActions(prev => 
      prev.map(action => 
        action.id === id 
          ? { ...action, status, updatedAt: new Date() } 
          : action
      )
    );
    toast.success('Action status updated!');
  };

  const handleDeleteAction = (id: string) => {
    setActions(prev => prev.filter(action => action.id !== id));
    toast.success('Action deleted successfully!');
  };

  // Get unique categories
  const categories = Array.from(new Set(actions.map(action => action.category)));

  // Filter actions based on search and filters
  const filteredActions = actions.filter(action => {
    const matchesSearch = action.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          action.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || action.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  // Get status counts
  const pendingCount = actions.filter(a => a.status === 'pending').length;
  const inProgressCount = actions.filter(a => a.status === 'in-progress').length;
  const completedCount = actions.filter(a => a.status === 'completed').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Target className="mr-3 h-8 w-8 text-blue-600" />
          Actions
        </h1>
        <Button 
          onClick={() => setIsAddingAction(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Action
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                <Square className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-700">{pendingCount}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
                <div className="text-sm text-blue-600">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center mr-3">
                <RotateCcw className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">{completedCount}</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Action Form */}
      {isAddingAction && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Action</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Action Name *</label>
              <Input
                placeholder="Enter action name"
                value={newAction.name}
                onChange={(e) => setNewAction(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select 
                value={newAction.category} 
                onValueChange={(value) => setNewAction(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Tactics">Tactics</SelectItem>
                  <SelectItem value="Fitness">Fitness</SelectItem>
                  <SelectItem value="Nutrition">Nutrition</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Input
                placeholder="Enter description"
                value={newAction.description}
                onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <Select 
                value={newAction.priority} 
                onValueChange={(value) => setNewAction(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingAction(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAction}>
                Add Action
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div>
          <Select 
            value={categoryFilter} 
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Select 
            value={priorityFilter} 
            onValueChange={(value) => setPriorityFilter(value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Actions List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions.map(action => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{action.name}</div>
                        <div className="text-sm text-gray-500">{action.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{action.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={
                          action.priority === 'high' ? 'bg-red-100 text-red-800' : 
                          action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }
                      >
                        {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={action.status} 
                        onValueChange={(value) => updateActionStatus(action.id, value as any)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {action.createdAt.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAction(action.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No actions found</p>
              <p className="text-sm">
                {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first action using the button above'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Actions;