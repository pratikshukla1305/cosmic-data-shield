
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { submitKycVerification } from '@/services/userServices';
import { uploadKycDocument } from '@/utils/uploadUtils';
import { FileUploader } from '@/components/ui/file-uploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type KycVerificationProps = {
  userId: string;
  onComplete: () => void;
  formData: any;
};

const KycVerification = ({ userId, onComplete, formData }: KycVerificationProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("idFront");
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
      
      // After file is selected, move to next tab if appropriate
      if (type === 'idFront') {
        setTimeout(() => setActiveTab('idBack'), 500);
      } else if (type === 'idBack') {
        setTimeout(() => setActiveTab('selfie'), 500);
      }
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Document Verification</h2>
        <p className="text-sm text-gray-500">
          Please upload clear photos of your identification documents and a selfie for verification.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="idFront">ID Front</TabsTrigger>
          <TabsTrigger value="idBack">ID Back</TabsTrigger>
          <TabsTrigger value="selfie">Selfie</TabsTrigger>
        </TabsList>
        
        <TabsContent value="idFront">
          <Card className="p-4">
            <FileUploader
              id="upload-idFront"
              label="ID Front Side"
              description="Upload or capture the front side of your government-issued ID"
              progress={progress.idFront}
              onFileSelected={(file) => handleFileSelected('idFront', file)}
              accept="image/*"
              allowCapture={true}
              captureLabel="ID Front"
            />
          </Card>
        </TabsContent>
        
        <TabsContent value="idBack">
          <Card className="p-4">
            <FileUploader
              id="upload-idBack"
              label="ID Back Side"
              description="Upload or capture the back side of your government-issued ID"
              progress={progress.idBack}
              onFileSelected={(file) => handleFileSelected('idBack', file)}
              accept="image/*"
              allowCapture={true}
              captureLabel="ID Back"
            />
          </Card>
        </TabsContent>
        
        <TabsContent value="selfie">
          <Card className="p-4">
            <FileUploader
              id="upload-selfie"
              label="Selfie Photo"
              description="Take a clear photo of yourself holding your ID"
              progress={progress.selfie}
              onFileSelected={(file) => handleFileSelected('selfie', file)}
              accept="image/*"
              allowCapture={true}
              captureLabel="Selfie"
            />
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-start space-x-2 mt-6">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-600">
          Your documents will be encrypted and securely stored. They will only be used for identity verification purposes.
        </p>
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <Button variant="outline" disabled={isSubmitting} onClick={() => setActiveTab('idFront')}>
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
