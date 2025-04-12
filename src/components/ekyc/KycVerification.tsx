
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/ui/file-uploader';
import { toast } from '@/hooks/use-toast';
import { submitKycVerification } from '@/services/userServices';
import { Loader2 } from 'lucide-react';
import UserInfoCard from './UserInfoCard';

interface KycVerificationProps {
  onComplete: () => void;
  formData: {
    fullName: string;
    dob: string;
    nationality: string;
    idType: "passport" | "national_id" | "driving_license";
    idNumber: string;
    address: string;
    phone: string;
    email: string;
  };
  userId: string;
}

const KycVerification = ({ onComplete, formData, userId }: KycVerificationProps) => {
  const [activeTab, setActiveTab] = useState<string>('id-front');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  
  const [idFrontProgress, setIdFrontProgress] = useState<number>(0);
  const [idBackProgress, setIdBackProgress] = useState<number>(0);
  const [selfieProgress, setSelfieProgress] = useState<number>(0);
  
  const uploadFiles = async () => {
    if (!idFrontFile) {
      toast({
        title: "ID Front Required",
        description: "Please upload the front of your ID document",
        variant: "destructive"
      });
      setActiveTab('id-front');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (idFrontFile) setIdFrontProgress(Math.min(progress, 100));
        if (idBackFile) setIdBackProgress(Math.min(progress, 100));
        if (selfieFile) setSelfieProgress(Math.min(progress, 100));
        
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 100);
      
      // Simulate file upload and get URLs (in a real app, this would upload to storage)
      const idFrontUrl = idFrontFile ? await simulateFileUpload(idFrontFile) : null;
      const idBackUrl = idBackFile ? await simulateFileUpload(idBackFile) : null; 
      const selfieUrl = selfieFile ? await simulateFileUpload(selfieFile) : null;
      
      // Submit verification data
      await submitKycVerification({
        fullName: formData.fullName,
        email: formData.email,
        idFront: idFrontUrl,
        idBack: idBackUrl,
        selfie: selfieUrl,
        userId
      });
      
      toast({
        title: "Verification Submitted",
        description: "Your identity verification has been submitted successfully",
      });
      
      clearInterval(progressInterval);
      onComplete();
      
    } catch (error: any) {
      console.error("Error uploading verification documents:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simulate file upload and return a URL
  const simulateFileUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, this would be the URL of the uploaded file
        const fakeUrl = URL.createObjectURL(file);
        resolve(fakeUrl);
      }, 1000);
    });
  };
  
  const handleNextStep = () => {
    // Move to next tab
    if (activeTab === 'id-front') {
      if (!idFrontFile) {
        toast({
          title: "ID Front Required",
          description: "Please upload the front of your ID document",
          variant: "destructive"
        });
        return;
      }
      setActiveTab('id-back');
    } else if (activeTab === 'id-back') {
      setActiveTab('selfie');
    }
  };

  const isReadyToSubmit = idFrontFile !== null;

  return (
    <div>
      <UserInfoCard formData={formData} />
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="id-front">ID Front</TabsTrigger>
              <TabsTrigger value="id-back">ID Back</TabsTrigger>
              <TabsTrigger value="selfie">Selfie</TabsTrigger>
            </TabsList>
            
            <TabsContent value="id-front" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Upload ID Document (Front)</h3>
                <p className="text-sm text-gray-500">Please upload the front side of your ID card or passport</p>
              </div>
              
              <FileUploader
                id="id-front"
                onFileSelected={(file) => setIdFrontFile(file)}
                accept="image/*"
                progress={idFrontProgress}
                allowCapture={true}
                captureLabel="ID Front"
              />
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={handleNextStep} 
                  className="bg-shield-blue hover:bg-blue-700"
                  disabled={!idFrontFile || isLoading}
                >
                  Continue to ID Back
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="id-back" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Upload ID Document (Back)</h3>
                <p className="text-sm text-gray-500">Please upload the back side of your ID card</p>
              </div>
              
              <FileUploader
                id="id-back"
                onFileSelected={(file) => setIdBackFile(file)}
                accept="image/*"
                progress={idBackProgress}
                allowCapture={true}
                captureLabel="ID Back"
              />
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('id-front')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep} 
                  className="bg-shield-blue hover:bg-blue-700"
                  disabled={isLoading}
                >
                  Continue to Selfie
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="selfie" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Take a Selfie</h3>
                <p className="text-sm text-gray-500">Please take a clear photo of your face for verification</p>
              </div>
              
              <FileUploader
                id="selfie"
                onFileSelected={(file) => setSelfieFile(file)}
                accept="image/*"
                progress={selfieProgress}
                allowCapture={true}
                captureLabel="Selfie"
              />
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('id-back')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button 
                  onClick={uploadFiles} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!isReadyToSubmit || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Verification'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium mb-2">Document Requirements:</h4>
        <ul className="space-y-1 text-sm text-gray-600 list-disc pl-5">
          <li>Documents should be clear, with no glare or blur</li>
          <li>All corners of the document should be visible</li>
          <li>For passport, scan the page with your photo</li>
          <li>For ID card, upload both front and back</li>
          <li>Selfie should clearly show your face without sunglasses</li>
        </ul>
      </div>
    </div>
  );
};

export default KycVerification;
