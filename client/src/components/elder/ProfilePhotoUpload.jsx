import React, { useState, useRef } from 'react';
import { Camera, Upload, User } from 'lucide-react';
import { Button, Alert } from '..';

const ProfilePhotoUpload = ({ currentPhoto, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(currentPhoto);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();

      if (onUpload) {
        await onUpload(data.url);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
      setPreview(currentPhoto); // Revert preview
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Photo Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-white/10 border-4 border-white/20 flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-gray-400" />
          )}
        </div>

        {/* Camera Icon Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Upload photo"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* Upload Button */}
      <Button
        variant="ghost"
        size="sm"
        icon={Upload}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        loading={uploading}
        className="bg-white/5 text-white hover:bg-white/10"
      >
        {uploading ? 'Uploading...' : 'Change Photo'}
      </Button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)} className="w-full">
          {error}
        </Alert>
      )}

      {/* Help Text */}
      <p className="text-gray-400 text-xs text-center">
        Recommended: Square image, at least 200x200px
        <br />
        Max size: 5MB • Formats: JPG, PNG, GIF
      </p>
    </div>
  );
};

export default ProfilePhotoUpload;
