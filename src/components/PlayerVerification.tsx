import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  Clock, 
  X, 
  Shield, 
  Video,
  User,
  AlertTriangle,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface VerificationRequest {
  id: string;
  user_id: string;
  player_name: string;
  team_name: string;
  position: string;
  video_url?: string;
  photo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_by?: string;
  review_notes?: string;
}

interface PlayerProfile {
  id: string;
  name: string;
  verified: boolean;
  verification_badge?: string;
  reputation_score: number;
  badges: string[];
  team_id?: string;
  position?: string;
}

export const PlayerVerification: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState({
    playerName: '',
    teamName: '',
    position: '',
    additionalInfo: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = type === 'photo' 
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid file type. Please select a valid ${type} file.`);
      return;
    }

    // Validate file size (10MB for photos, 50MB for videos)
    const maxSize = type === 'photo' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const uploadToCloudflare = async (file: File): Promise<string> => {
    // Mock Cloudflare upload - in production, implement actual Cloudflare R2/Stream upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return mock URL - in production, return actual Cloudflare URL
      return `https://cloudflare-r2.example.com/uploads/${Date.now()}-${file.name}`;
    } catch (error) {
      throw new Error('Upload failed');
    }
  };

  const submitVerificationRequest = async () => {
    if (!user || !selectedFile) {
      toast.error('Please select a file and fill in all required information.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload file to Cloudflare
      const fileUrl = await uploadToCloudflare(selectedFile);
      
      // Save verification request to Supabase
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          player_name: verificationData.playerName,
          team_name: verificationData.teamName,
          position: verificationData.position,
          [selectedFile.type.startsWith('video/') ? 'video_url' : 'photo_url']: fileUrl,
          additional_info: verificationData.additionalInfo,
          status: 'pending',
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;

      // Notify team captains/moderators
      await supabase
        .from('notifications')
        .insert({
          type: 'verification_request',
          title: 'New Player Verification Request',
          message: `${verificationData.playerName} has submitted a verification request for ${verificationData.teamName}`,
          data: { verification_id: data[0]?.id },
          created_at: new Date().toISOString()
        });

      setVerificationStatus('pending');
      setShowUploadModal(false);
      toast.success('Verification request submitted! You will be notified once reviewed.');
      
    } catch (error) {
      console.error('Verification submission error:', error);
      toast.error('Failed to submit verification request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVerificationForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Name *
          </label>
          <Input
            value={verificationData.playerName}
            onChange={(e) => setVerificationData(prev => ({ ...prev, playerName: e.target.value }))}
            placeholder="Your full name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Name *
          </label>
          <Input
            value={verificationData.teamName}
            onChange={(e) => setVerificationData(prev => ({ ...prev, teamName: e.target.value }))}
            placeholder="Your team/club name"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Position *
        </label>
        <select
          value={verificationData.position}
          onChange={(e) => setVerificationData(prev => ({ ...prev, position: e.target.value }))}
          className="w-full h-10 px-3 border border-gray-300 rounded-md"
          required
        >
          <option value="">Select position</option>
          <option value="GK">Goalkeeper (GK)</option>
          <option value="DEF">Defender (DEF)</option>
          <option value="MID">Midfielder (MID)</option>
          <option value="FWD">Forward (FWD)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Information
        </label>
        <Textarea
          value={verificationData.additionalInfo}
          onChange={(e) => setVerificationData(prev => ({ ...prev, additionalInfo: e.target.value }))}
          placeholder="Any additional information about your football background..."
          rows={3}
        />
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <div className="flex justify-center space-x-4 mb-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Upload Photo</span>
            </Button>
            
            <Button
              onClick={() => videoInputRef.current?.click()}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Video className="w-4 h-4" />
              <span>Upload Video</span>
            </Button>
          </div>
          
          <p className="text-sm text-gray-600">
            Upload a photo in your team kit or a short video (max 30 seconds) introducing yourself
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'photo')}
            className="hidden"
          />
          
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileSelect(e, 'video')}
            className="hidden"
          />
        </div>

        {previewUrl && (
          <div className="mt-4 flex justify-center">
            {selectedFile?.type.startsWith('video/') ? (
              <video
                src={previewUrl}
                controls
                className="max-w-xs max-h-48 rounded-lg"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-xs max-h-48 rounded-lg object-cover"
              />
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          onClick={() => setShowUploadModal(false)}
          variant="outline"
        >
          Cancel
        </Button>
        
        <Button
          onClick={submitVerificationRequest}
          disabled={isSubmitting || !selectedFile || !verificationData.playerName || !verificationData.teamName || !verificationData.position}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit for Verification'
          )}
        </Button>
      </div>
    </div>
  );

  const renderVerificationStatus = () => {
    const statusConfig = {
      pending: {
        icon: <Clock className="w-6 h-6 text-yellow-500" />,
        title: 'Verification Pending',
        description: 'Your verification request is being reviewed by team moderators.',
        color: 'border-yellow-200 bg-yellow-50'
      },
      approved: {
        icon: <CheckCircle className="w-6 h-6 text-green-500" />,
        title: 'Verified Player',
        description: 'Congratulations! You are now a verified player.',
        color: 'border-green-200 bg-green-50'
      },
      rejected: {
        icon: <X className="w-6 h-6 text-red-500" />,
        title: 'Verification Rejected',
        description: 'Your verification request was not approved. You can submit a new request.',
        color: 'border-red-200 bg-red-50'
      }
    };

    const config = statusConfig[verificationStatus as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Card className={`border-2 ${config.color}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            {config.icon}
            <div>
              <h3 className="text-lg font-semibold">{config.title}</h3>
              <p className="text-gray-600">{config.description}</p>
            </div>
          </div>
          
          {verificationStatus === 'rejected' && (
            <Button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Submit New Request
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Player Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verificationStatus === 'none' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Get Verified</h3>
                <p className="text-gray-600">
                  Verify your identity as a real player to unlock premium features and build trust in the community.
                </p>
              </div>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Verification
              </Button>
            </div>
          ) : (
            renderVerificationStatus()
          )}
        </CardContent>
      </Card>

      {/* Verification Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Player Verification</DialogTitle>
          </DialogHeader>
          {renderVerificationForm()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerVerification;