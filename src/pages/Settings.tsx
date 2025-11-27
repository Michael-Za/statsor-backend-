import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  dateOfBirth: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  matchReminders: boolean;
  trainingAlerts: boolean;
  teamUpdates: boolean;
  analyticsReports: boolean;
  marketingEmails: boolean;
}

interface PrivacySettings {
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
  dataSharing: boolean;
  analyticsTracking: boolean;
}

interface SystemSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  autoSave: boolean;
  darkMode: boolean;
}

const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    dateOfBirth: ''
  });
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    matchReminders: true,
    trainingAlerts: true,
    teamUpdates: true,
    analyticsReports: false,
    marketingEmails: false
  });
  
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'team',
    showEmail: false,
    showPhone: false,
    dataSharing: false,
    analyticsTracking: true
  });
  
  const [system, setSystem] = useState<SystemSettings>({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    autoSave: true,
    darkMode: false // Always false since theme is locked to midnight (white theme)
  });

  useEffect(() => {
    try {
      setIsInitialized(true);
    } catch (err) {
      setError('Failed to initialize settings: ' + (err as Error).message);
    }
  }, [user, theme]);

  const getCardClassName = (): string => {
    return 'bg-white border-gray-300'; // Always use white theme
  };

  const getInputClassName = (): string => {
    return 'bg-white border-gray-300'; // Always use white theme
  };

  const getSeparatorClassName = (): string => {
    return 'bg-gray-300'; // Always use white theme
  };

  const handleSaveChanges = async (
    category: 'profile' | 'notifications' | 'privacy' | 'system', 
    data: ProfileData | NotificationSettings | PrivacySettings | SystemSettings
  ): Promise<void> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      switch (category) {
        case 'profile':
          if (updateProfile) {
            await updateProfile(data as any);
          }
          setProfileData(data as ProfileData);
          break;
        case 'notifications':
          setNotifications(data as NotificationSettings);
          break;
        case 'privacy':
          setPrivacy(data as PrivacySettings);
          break;
        case 'system':
          setSystem(data as SystemSettings);
          const systemData = data as SystemSettings;
          if (systemData.darkMode !== undefined) {
            // Theme is locked to 'midnight', so we just update the state without changing theme
            setTheme('midnight');
          }
          break;
      }
      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} settings updated successfully!`);
    } catch (error) {
      console.error(`Failed to update ${category} settings:`, error);
      toast.error(`Failed to update ${category} settings.`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (): void => {
    const data = {
      profile: profileData,
      notifications,
      privacy,
      system,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Settings exported successfully!');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.profile) setProfileData(data.profile);
        if (data.notifications) setNotifications(data.notifications);
        if (data.privacy) setPrivacy(data.privacy);
        if (data.system) setSystem(data.system);
        toast.success('Settings imported successfully!');
      } catch (error) {
        toast.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSettings = (): void => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setNotifications({
        emailNotifications: true,
        pushNotifications: true,
        matchReminders: true,
        trainingAlerts: true,
        teamUpdates: true,
        analyticsReports: false,
        marketingEmails: false
      });
      setPrivacy({
        profileVisibility: 'team',
        showEmail: false,
        showPhone: false,
        dataSharing: false,
        analyticsTracking: true
      });
      setSystem({
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        autoSave: true,
        darkMode: false
      });
      toast.success('Settings reset to default');
    }
  };

  if (!isInitialized) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading Settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Settings Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <Button 
                onClick={() => {
                  setError(null);
                  setIsInitialized(false);
                }} 
                variant="outline" 
                className="w-full mt-4"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen transition-all duration-500 bg-white text-gray-900`}>
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8"
          >
            <h1 className={`text-2xl md:text-3xl font-bold mb-2 text-gray-900`}>
              Settings
            </h1>
            <p className="text-gray-600">
              Manage your account preferences and application settings
            </p>
          </motion.div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={`grid w-full grid-cols-4 bg-gray-100`}>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User size={16} />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell size={16} />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield size={16} />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database size={16} />
                Data
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className={getCardClassName()}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and profile details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className={getInputClassName()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          className={getInputClassName()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          className={getInputClassName()}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                          className={getInputClassName()}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        className={getInputClassName()}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleSaveChanges('profile', profileData)} 
                      disabled={loading} 
                      className="w-full md:w-auto"
                    >
                      {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Profile
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className={getCardClassName()}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-gray-400">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={notifications.emailNotifications}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                        />
                      </div>
                      <Separator className={getSeparatorClassName()} />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-gray-400">Receive push notifications in browser</p>
                        </div>
                        <Switch
                          checked={notifications.pushNotifications}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleSaveChanges('notifications', notifications)} 
                      disabled={loading} 
                      className="w-full md:w-auto"
                    >
                      {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Notifications
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className={getCardClassName()}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Profile Visibility</Label>
                        <Select
                          value={privacy.profileVisibility}
                          onValueChange={(value) => setPrivacy(prev => ({ ...prev, profileVisibility: value }))}
                        >
                          <SelectTrigger className={getInputClassName()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public - Everyone can see</SelectItem>
                            <SelectItem value="team">Team Only - Team members only</SelectItem>
                            <SelectItem value="private">Private - Only you</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleSaveChanges('privacy', privacy)} 
                      disabled={loading} 
                      className="w-full md:w-auto"
                    >
                      {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Privacy Settings
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Data Management */}
            <TabsContent value="data" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className={getCardClassName()}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
                        <Download size={16} />
                        Export Settings
                      </Button>
                      <div>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                          id="import-settings"
                        />
                        <Button
                          onClick={() => document.getElementById('import-settings')?.click()}
                          variant="outline"
                          className="flex items-center gap-2 w-full"
                        >
                          <Upload size={16} />
                          Import Settings
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <h3 className="text-lg font-semibold mb-2 text-red-600">
                        Danger Zone
                      </h3>
                      <p className="text-sm mb-4 text-gray-700">
                        Reset all settings to their default values. This action cannot be undone.
                      </p>
                      <Button onClick={handleResetSettings} variant="destructive" className="flex items-center gap-2">
                        <Trash2 size={16} />
                        Reset All Settings
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleSaveChanges('system', system)} 
                      disabled={loading} 
                      className="w-full md:w-auto"
                    >
                      {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Data Settings
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Settings;
