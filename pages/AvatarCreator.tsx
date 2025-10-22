
import React, { useState } from 'react';
import { Upload, Wand2, Save } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { generateAvatarFromImage } from '../services/geminiService';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';

const AvatarCreatorPage: React.FC = () => {
  const { setAvatarUrl, user } = useAppContext();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setGeneratedAvatar(null);
      setError(null);
    }
  };

  const handleGenerateClick = async () => {
    if (!selectedFile) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedAvatar(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          const base64Avatar = await generateAvatarFromImage(base64String, selectedFile.type);
          setGeneratedAvatar(`data:image/png;base64,${base64Avatar}`);
      };
    } catch (err) {
      setError("Failed to generate avatar. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAvatar = () => {
    if (generatedAvatar) {
      setAvatarUrl(generatedAvatar);
      // Maybe show a success message
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-3xl font-bold text-white">Avatar Studio</h1>
        <p className="text-gray-300 mt-2">Create your personal avatar. Upload a photo, and our AI will craft a unique, stylized version for you.</p>
        <p className="text-sm text-amber-300 mt-2">Note: The AI generates a new artistic image based on your photo; it does not create a 3D model.</p>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card>
          <h2 className="text-xl font-semibold mb-4">1. Upload Your Photo</h2>
          <div className="w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex justify-center items-center bg-gray-900/50 relative">
            {selectedImage ? (
              <img src={selectedImage} alt="Uploaded" className="object-contain max-w-full max-h-full rounded-lg" />
            ) : (
              <div className="text-center text-gray-400">
                <Upload size={40} className="mx-auto mb-2" />
                <p>Click to upload or drag & drop</p>
                <p className="text-xs">PNG, JPG, or WEBP</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <button
            onClick={handleGenerateClick}
            disabled={!selectedImage || isLoading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? <Spinner /> : <Wand2 />}
            <span>{isLoading ? 'Generating...' : 'Generate My Avatar'}</span>
          </button>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">2. Your Generated Avatar</h2>
          <div className="w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex justify-center items-center bg-gray-900/50">
            {isLoading ? (
              <div className="text-center text-gray-400">
                 <Spinner />
                 <p className="mt-2">Creating your avatar...</p>
              </div>
            ) : generatedAvatar ? (
              <img src={generatedAvatar} alt="Generated Avatar" className="object-contain max-w-full max-h-full rounded-lg" />
            ) : (
              <div className="text-center text-gray-400">
                <p>Your new avatar will appear here</p>
              </div>
            )}
          </div>
           {error && <p className="text-red-400 mt-2 text-sm text-center">{error}</p>}
           <button
            onClick={handleSaveAvatar}
            disabled={!generatedAvatar || isLoading}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <Save />
            <span>Save as My Avatar</span>
          </button>
        </Card>
      </div>
    </div>
  );
};

export default AvatarCreatorPage;
