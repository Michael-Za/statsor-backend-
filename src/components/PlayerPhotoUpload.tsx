import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { uploadService } from '../services/uploadService';
import { toast } from 'sonner';

interface PlayerPhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSave: (photoUrl: string) => void;
  currentPhoto?: string;
  playerName: string;
  playerId: string;
}

export const PlayerPhotoUpload: React.FC<PlayerPhotoUploadProps> = ({
  isOpen,
  onClose,
  onPhotoSave,
  currentPhoto,
  playerName,
  playerId
}) => {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhoto || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file using upload service
      const validation = (uploadService as any).validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }


      setSelectedFile(file);
      
      // Create preview URL using upload service
      uploadService.fileToBase64(file).then(base64 => {
        setPreviewUrl(base64);
      }).catch(error => {
        console.error('Preview generation failed:', error);
        toast.error('Failed to generate preview');
      });
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadService.uploadPlayerPhoto(selectedFile, playerId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url) {
        onPhotoSave(result.url);
        toast.success('Photo uploaded successfully!');
        onClose();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('photo.upload.title')} - {playerName}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Photo Preview */}
          <div className="flex justify-center">
            <div className="relative">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt={playerName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                  <Button
                    onClick={handleRemovePhoto}
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-8 h-8 p-0 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Upload Controls */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={triggerFileInput}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('photo.upload.select')}
            </Button>

            {selectedFile && (
              <div className="text-sm text-gray-600 text-center">
                <p>{t('photo.upload.selected')}: {selectedFile.name}</p>
                <p>{t('photo.upload.size')}: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              {t('photo.upload.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!previewUrl || isUploading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t('photo.upload.save')}
                </>
              )}
            </Button>
          </div>
          
          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 text-center">
                Uploading and processing image...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};