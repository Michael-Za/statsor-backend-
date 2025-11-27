import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { User, Camera, Edit3, Save, RefreshCw, Trophy, MapPin, Mail, Phone, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Award {
  id: string;
  title: string;
  description: string;
  date: string;
}

const ProfileFixed: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: ''
  });

  const [awards, setAwards] = useState<Award[]>([]);
  const [editingAwards, setEditingAwards] = useState(false);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      if (updateProfile) {
        await updateProfile(profileData);
      }
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('auth_user_id', user.id);

      if (updateError) throw updateError;

      // Update local storage
      const updatedUser = { ...user, picture: publicUrl };
      localStorage.setItem('statsor_user', JSON.stringify(updatedUser));

      toast.success('Profile picture updated successfully!');
      window.location.reload(); // Reload to show new image
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const addAward = () => {
    const newAward: Award = {
      id: Date.now().toString(),
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    };
    setAwards([...awards, newAward]);
  };

  const removeAward = (id: string) => {
    setAwards(awards.filter(award => award.id !== id));
  };

  const updateAward = (id: string, field: keyof Award, value: string) => {
    setAwards(awards.map(award => 
      award.id === id ? { ...award, [field]: value } : award
    ));
  };

  const saveAwards = async () => {
    if (!user) return;
    
    try {
      // Save awards to database
      const { error } = await supabase
        .from('user_awards')
        .upsert(
          awards.map(award => ({
            user_id: user.id,
            title: award.title,
            description: award.description,
            date: award.date
          }))
        );

      if (error) throw error;

      setEditingAwards(false);
      toast.success('Awards saved successfully!');
    } catch (error) {
      console.error('Save awards error:', error);
      toast.error('Failed to save awards');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your profile information</p>
      </div>

      <div className="space-y-6">
        {/* Profile Overview Card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center">
            <div className="relative mx-auto mb-4">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <CardTitle className="text-xl">{profileData.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Mail size={14} />
              {profileData.email}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Personal Information Card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            <Button
              variant={editing ? "default" : "outline"}
              onClick={() => editing ? handleSaveProfile() : setEditing(true)}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : editing ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <Edit3 className="mr-2 h-4 w-4" />
              )}
              {editing ? 'Save' : 'Edit'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  disabled={!editing}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!editing}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!editing}
                  placeholder="Enter phone number"
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  disabled={!editing}
                  placeholder="Enter location"
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                disabled={!editing}
                placeholder="Tell us about yourself"
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Awards Section */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Awards & Achievements
              </CardTitle>
              <CardDescription>Your accomplishments and recognitions</CardDescription>
            </div>
            <div className="flex gap-2">
              {editingAwards && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAward}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Award
                </Button>
              )}
              <Button
                variant={editingAwards ? "default" : "outline"}
                size="sm"
                onClick={() => editingAwards ? saveAwards() : setEditingAwards(true)}
              >
                {editingAwards ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {awards.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No awards yet. Add your first award!</p>
                {!editingAwards && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setEditingAwards(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Award
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {awards.map((award) => (
                  <div key={award.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {editingAwards ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <Input
                              value={award.title}
                              onChange={(e) => updateAward(award.id, 'title', e.target.value)}
                              placeholder="Award title"
                              className="bg-white dark:bg-gray-800"
                            />
                            <Input
                              type="date"
                              value={award.date}
                              onChange={(e) => updateAward(award.id, 'date', e.target.value)}
                              className="bg-white dark:bg-gray-800"
                            />
                            <Textarea
                              value={award.description}
                              onChange={(e) => updateAward(award.id, 'description', e.target.value)}
                              placeholder="Award description"
                              className="bg-white dark:bg-gray-800"
                              rows={2}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                            onClick={() => removeAward(award.id)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{award.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{award.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {new Date(award.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileFixed;
