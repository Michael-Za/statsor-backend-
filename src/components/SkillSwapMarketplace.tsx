import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Search,
  Plus,
  User,
  Star,
  MapPin,
  Clock,
  Filter
} from 'lucide-react';

interface SkillOffer {
  id: string;
  title: string;
  description: string;
  user: string;
  rating: number;
  location: string;
  createdAt: Date;
}

const SkillSwapMarketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    location: ''
  });

  // Mock data for skill offers
  const [skillOffers] = useState<SkillOffer[]>([
    {
      id: '1',
      title: 'Goalkeeping Training',
      description: 'Experienced goalkeeper offering training sessions for beginners and intermediate players. Focus on positioning, reflexes, and distribution.',
      user: 'Carlos Rodriguez',
      rating: 4.8,
      location: 'Madrid, Spain',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Tactical Analysis',
      description: 'Former coach offering tactical analysis sessions. Help improve your game understanding and decision-making on the field.',
      user: 'Maria Santos',
      rating: 4.9,
      location: 'Barcelona, Spain',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Fitness Training',
      description: 'Professional fitness trainer specializing in football conditioning. Improve your speed, strength, and endurance.',
      user: 'David Johnson',
      rating: 4.7,
      location: 'London, UK',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ]);

  const handleCreateOffer = () => {
    if (!newOffer.title || !newOffer.description) {
      alert('Please fill in all required fields');
      return;
    }

    // In a real app, this would save to a backend
    alert('Skill offer created successfully!');
    setNewOffer({ title: '', description: '', location: '' });
    setShowCreateForm(false);
  };

  const filteredOffers = skillOffers.filter(offer => 
    offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Offer Skill
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Skill Offer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Title *
              </label>
              <Input
                value={newOffer.title}
                onChange={(e) => setNewOffer({...newOffer, title: e.target.value})}
                placeholder="e.g. Goalkeeping Training"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <Textarea
                value={newOffer.description}
                onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
                placeholder="Describe your skill and what you can offer..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                value={newOffer.location}
                onChange={(e) => setNewOffer({...newOffer, location: e.target.value})}
                placeholder="e.g. Madrid, Spain"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOffer}>
                Create Offer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map((offer) => (
          <Card key={offer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{offer.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{offer.description}</p>
              
              <div className="flex items-center text-sm text-gray-500">
                <User className="w-4 h-4 mr-1" />
                {offer.user}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm ml-1">{offer.rating}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  {offer.location}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {offer.createdAt.toLocaleDateString()}
              </div>
              
              <Button className="w-full mt-2">
                Contact
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No skill offers found</h3>
          <p className="mt-1 text-gray-500">
            Be the first to offer your skills to the community!
          </p>
          <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </div>
      )}
    </div>
  );
};

export default SkillSwapMarketplace;