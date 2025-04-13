
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/ui/file-uploader';
import { toast } from '@/hooks/use-toast';
import { submitKycVerification } from '@/services/userServices';
import { Loader2 } from 'lucide-react';
import UserInfoCard from './UserInfoCard';
import { uploadKycDocument } from '@/utils/kycUtils';
import OcrDataEditor from './OcrDataEditor';
import { supabase } from '@/integrations/supabase/client';

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
  const [verificationId, setVerificationId] = useState<number | null>(null);
  
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  
  const [idFrontProgress, setIdFrontProgress] = useState<number>(0);
  const [idBackProgress, setIdBackProgress] = useState<number>(0);
  const [selfieProgress, setSelfieProgress] = useState<number>(0);
  
  const [extractedData, setExtractedData] = useState<any>(null);
  const [ocrStatus, setOcrStatus] = useState<string>('pending');
  
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  
  // Create a verification record when component loads
  useEffect(() => {
    const createVerificationRecord = async () => {
      try {
        // Check if we already have a verification in progress for this user
        const { data: existingData, error: existingError } = await supabase
          .from('kyc_verifications')
          .select('id, status')
          .eq('user_id', userId)
          .eq('status', 'Pending')
          .order('submission_date', { ascending: false })
          .limit(1);
        
        if (!existingError && existingData && existingData.length > 0) {
          // Use existing verification
          setVerificationId(existingData[0].id);
          return;
        }
        
        // Create new verification record
        const { data, error } = await supabase
          .from('kyc_verifications')
          .insert({
            full_name: formData.fullName,
            email: formData.email,
            submission_date: new Date().toISOString(),
            status: 'Pending',
            user_id: userId
          })
          .select('id');
        
        if (error) {
          console.error('Error creating verification record:', error);
          toast({
            title: 'Setup Error',
            description: 'Could not initialize verification. Please try again.',
            variant: 'destructive'
          });
          return;
        }
        
        if (data && data.length > 0) {
          setVerificationId(data[0].id);
        }
      } catch (error) {
        console.error('Error in createVerificationRecord:', error);
      }
    };
    
    if (userId) {
      createVerificationRecord();
    }
  }, [userId, formData]);

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
    
    if (!verificationId) {
      toast({
        title: "Setup Error",
        description: "Verification record not initialized. Please try again.",
        variant: "destructive"
      });
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
      
      // Upload documents to storage and create records in database
      let frontResult = null;
      let backResult = null;
      let selfieResult = null;
      
      if (idFrontFile) {
        frontResult = await uploadKycDocument(idFrontFile, userId, 'aadhar_front', verificationId);
        if (frontResult?.documentUrl) {
          setIdFrontUrl(frontResult.documentUrl);
        }
      }
      
      if (idBackFile) {
        backResult = await uploadKycDocument(idBackFile, userId, 'aadhar_back', verificationId);
        if (backResult?.documentUrl) {
          setIdBackUrl(backResult.documentUrl);
        }
      }
      
      if (selfieFile) {
        selfieResult = await uploadKycDocument(selfieFile, userId, 'selfie', verificationId);
        if (selfieResult?.documentUrl) {
          setSelfieUrl(selfieResult.documentUrl);
        }
      }
      
      // Update verification record with document URLs
      await supabase
        .from('kyc_verifications')
        .update({
          id_front: frontResult?.documentUrl || null,
          id_back: backResult?.documentUrl || null,
          selfie: selfieResult?.documentUrl || null
        })
        .eq('id', verificationId);
      
      // Submit verification data to complete the process
      await submitKycVerification({
        fullName: formData.fullName,
        email: formData.email,
        idFront: frontResult?.documentUrl || null,
        idBack: backResult?.documentUrl || null,
        selfie: selfieResult?.documentUrl || null,
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
  
  const handleNextStep = () => {
    // Move to next tab
    if (activeTab === 'id-front') {
      if (!idFrontFile && !idFrontUrl) {
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
    } else if (activeTab === 'selfie') {
      setActiveTab('review');
    }
  };

  const isReadyToSubmit = idFrontUrl !== null || idFrontFile !== null;

  return (
    <div>
      <UserInfoCard formData={formData} />
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="id-front">ID Front</TabsTrigger>
              <TabsTrigger value="id-back">ID Back</TabsTrigger>
              <TabsTrigger value="selfie">Selfie</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>
            
            <TabsContent value="id-front" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Upload ID Document (Front)</h3>
                <p className="text-sm text-gray-500">Please upload the front side of your Aadhaar card</p>
              </div>
              
              {idFrontUrl ? (
                <div className="mb-4">
                  <p className="text-sm text-green-600 mb-2">Document uploaded successfully</p>
                  <div className="relative w-full aspect-[3/2] max-w-md mx-auto border rounded-md overflow-hidden">
                    <img 
                      src={idFrontUrl} 
                      alt="ID Front" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <FileUploader
                  id="id-front"
                  onFileSelected={(file) => setIdFrontFile(file)}
                  accept="image/*"
                  progress={idFrontProgress}
                  allowCapture={true}
                  captureLabel="Aadhaar Front"
                />
              )}
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={handleNextStep} 
                  className="bg-shield-blue hover:bg-blue-700"
                  disabled={(!idFrontFile && !idFrontUrl) || isLoading}
                >
                  Continue to ID Back
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="id-back" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Upload ID Document (Back)</h3>
                <p className="text-sm text-gray-500">Please upload the back side of your Aadhaar card</p>
              </div>
              
              {idBackUrl ? (
                <div className="mb-4">
                  <p className="text-sm text-green-600 mb-2">Document uploaded successfully</p>
                  <div className="relative w-full aspect-[3/2] max-w-md mx-auto border rounded-md overflow-hidden">
                    <img 
                      src={idBackUrl} 
                      alt="ID Back" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <FileUploader
                  id="id-back"
                  onFileSelected={(file) => setIdBackFile(file)}
                  accept="image/*"
                  progress={idBackProgress}
                  allowCapture={true}
                  captureLabel="Aadhaar Back"
                />
              )}
              
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
              
              {selfieUrl ? (
                <div className="mb-4">
                  <p className="text-sm text-green-600 mb-2">Selfie uploaded successfully</p>
                  <div className="relative w-full aspect-[3/2] max-w-md mx-auto border rounded-md overflow-hidden">
                    <img 
                      src={selfieUrl} 
                      alt="Selfie" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <FileUploader
                  id="selfie"
                  onFileSelected={(file) => setSelfieFile(file)}
                  accept="image/*"
                  progress={selfieProgress}
                  allowCapture={true}
                  captureLabel="Selfie"
                />
              )}
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('id-back')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep} 
                  className="bg-shield-blue hover:bg-blue-700"
                  disabled={isLoading || (!selfieFile && !selfieUrl)}
                >
                  Continue to Review
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="review" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Review & Confirm</h3>
                <p className="text-sm text-gray-500">Please verify the extracted information from your documents</p>
              </div>
              
              {verificationId && (
                <OcrDataEditor verificationId={verificationId} />
              )}
              
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('selfie')}
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
          <li>For Aadhaar card, upload both front and back sides</li>
          <li>Ensure the Aadhaar number is clearly visible</li>
          <li>Selfie should clearly show your face without sunglasses</li>
        </ul>
      </div>
    </div>
  );
};

export default KycVerification;
