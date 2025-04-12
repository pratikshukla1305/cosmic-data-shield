
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUploader } from '@/components/ui/file-uploader';
import { Check, Upload, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { submitKycVerification } from '@/services/userServices';
import { uploadKycDocument } from '@/utils/uploadUtils';

type KycVerificationProps = {
  userId: string;
  onComplete: () => void;
  formData: any;
};

const KycVerification = ({ userId, onComplete, formData }: KycVerificationProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({
    idFront: 0,
    idBack: 0,
    selfie: 0
  });

  const [uploadedFiles, setUploadedFiles] = useState<{
    idFront: File | null;
    idBack: File | null;
    selfie: File | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null
  });

  const [uploadedUrls, setUploadedUrls] = useState<{
    idFront: string | null;
    idBack: string | null;
    selfie: string | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null
  });

  const handleFileSelected = (type: 'idFront' | 'idBack' | 'selfie', file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }));

    if (file) {
      setProgress(prev => ({
        ...prev,
        [type]: 1 // Show progress started
      }));
      
      // Simulate upload progress (in a real app, monitor actual upload progress)
      let currentProgress = 0;
      const interval = setInterval(() => {
        if (currentProgress >= 95) {
          clearInterval(interval);
        } else {
          currentProgress += Math.floor(Math.random() * 20);
          if (currentProgress > 95) currentProgress = 95;
          setProgress(prev => ({
            ...prev,
            [type]: currentProgress
          }));
        }
      }, 300);
    } else {
      setProgress(prev => ({
        ...prev,
        [type]: 0
      }));
      setUploadedUrls(prev => ({
        ...prev,
        [type]: null
      }));
    }
  };

  const uploadDocument = async (type: 'idFront' | 'idBack' | 'selfie', file: File | null) => {
    if (!file) return null;
    
    try {
      const url = await uploadKycDocument(file, userId, type);
      if (url) {
        setProgress(prev => ({
          ...prev,
          [type]: 100
        }));
        setUploadedUrls(prev => ({
          ...prev,
          [type]: url
        }));
        return url;
      }
      return null;
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: `Error uploading ${type}`,
        description: "There was a problem uploading your document. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSubmit = async () => {
    // Validate required files
    if (!uploadedFiles.idFront || !uploadedFiles.idBack || !uploadedFiles.selfie) {
      toast({
        title: "Missing documents",
        description: "Please upload both sides of your ID and a selfie photo.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload files to Supabase storage and get URLs
      const idFrontUrl = await uploadDocument('idFront', uploadedFiles.idFront);
      const idBackUrl = await uploadDocument('idBack', uploadedFiles.idBack);
      const selfieUrl = await uploadDocument('selfie', uploadedFiles.selfie);

      // Submit verification data
      const verificationData = {
        ...formData,
        idFront: idFrontUrl,
        idBack: idBackUrl,
        selfie: selfieUrl,
        userId: userId
      };

      const result = await submitKycVerification(verificationData);
      
      if (result && result.length > 0) {
        toast({
          title: "Verification submitted successfully",
          description: "Your identity verification has been sent for review.",
        });
        onComplete();
      } else {
        toast({
          title: "Submission error",
          description: "There was an error submitting your verification. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Verification failed",
        description: error.message || "Failed to submit your verification. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUploadCard = (type: 'idFront' | 'idBack' | 'selfie', title: string, description: string) => {
    const file = uploadedFiles[type];
    const progressValue = progress[type];
    
    return (
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">{title}</Label>
            {progressValue === 100 && <Check className="h-5 w-5 text-green-500" />}
          </div>
          <p className="text-sm text-gray-500">{description}</p>
          
          {file ? (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">{Math.round(file.size / 1024)} KB</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressValue}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {progressValue === 100 ? 'Completed' : 'Uploading...'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleFileSelected(type, null)}
                  className="h-auto p-0 text-xs text-red-500 hover:text-red-700 hover:bg-transparent"
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Input
                type="file"
                id={`upload-${type}`}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileSelected(type, e.target.files?.[0] || null)}
              />
              <label 
                htmlFor={`upload-${type}`}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              </label>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Document Verification</h2>
        <p className="text-sm text-gray-500">
          Please upload clear photos of your identification documents and a selfie for verification.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {renderUploadCard(
          'idFront', 
          'ID Front Side', 
          'Upload the front side of your government-issued ID'
        )}
        
        {renderUploadCard(
          'idBack', 
          'ID Back Side', 
          'Upload the back side of your government-issued ID'
        )}
      </div>

      <div className="md:max-w-md">
        {renderUploadCard(
          'selfie', 
          'Selfie Photo', 
          'Take a clear photo of yourself holding your ID'
        )}
      </div>

      <div className="flex items-start space-x-2 mt-6">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-600">
          Your documents will be encrypted and securely stored. They will only be used for identity verification purposes.
        </p>
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <Button variant="outline" disabled={isSubmitting}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !uploadedFiles.idFront || !uploadedFiles.idBack || !uploadedFiles.selfie}
          className="flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <span>Submit for Verification</span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default KycVerification;
