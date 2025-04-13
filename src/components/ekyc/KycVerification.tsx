import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/ui/file-uploader';
import { toast } from '@/hooks/use-toast';
import { submitKycVerification } from '@/services/userServices';
import { Loader2, CheckCircle2 } from 'lucide-react';
import UserInfoCard from './UserInfoCard';
import { uploadKycDocument, getExistingVerification } from '@/utils/kycUtils';
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationId, setVerificationId] = useState<number | null>(null);
  
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  
  const [idFrontProgress, setIdFrontProgress] = useState<number>(0);
  const [idBackProgress, setIdBackProgress] = useState<number>(0);
  const [selfieProgress, setSelfieProgress] = useState<number>(0);
  
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  
  const [filesUploaded, setFilesUploaded] = useState<{
    idFront: boolean;
    idBack: boolean;
    selfie: boolean;
  }>({
    idFront: false,
    idBack: false,
    selfie: false
  });
  
  const [shouldShowOcr, setShouldShowOcr] = useState<boolean>(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  // Load existing verification data
  useEffect(() => {
    const loadExistingVerification = async () => {
      setIsLoading(true);
      try {
        // Check for existing verification records
        const existingVerification = await getExistingVerification(userId);
        
        if (existingVerification) {
          // Use existing verification
          setVerificationId(existingVerification.id);
          
          // Set previously uploaded document URLs
          if (existingVerification.id_front) {
            setIdFrontUrl(existingVerification.id_front);
            setFilesUploaded(prev => ({ ...prev, idFront: true }));
          }
          
          if (existingVerification.id_back) {
            setIdBackUrl(existingVerification.id_back);
            setFilesUploaded(prev => ({ ...prev, idBack: true }));
          }
          
          if (existingVerification.selfie) {
            setSelfieUrl(existingVerification.selfie);
            setFilesUploaded(prev => ({ ...prev, selfie: true }));
          }
          
          // If all documents are already uploaded, go to review tab
          if (existingVerification.id_front && existingVerification.id_back && existingVerification.selfie) {
            setActiveTab('review');
          }
        } else {
          // Create new verification record
          await createVerificationRecord();
        }
      } catch (error) {
        console.error('Error loading existing verification:', error);
        toast({
          title: 'Error',
          description: 'Failed to load verification data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      loadExistingVerification();
    }
  }, [userId, formData]);
  
  // Create verification record if needed
  const createVerificationRecord = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          submission_date: new Date().toISOString(),
          status: 'Pending', // Set initial status to Pending, not Rejected
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

  // Handle file upload
  const handleFileUpload = async (fileType: 'idFront' | 'idBack' | 'selfie', file: File) => {
    if (!verificationId) {
      toast({
        title: "Setup Error",
        description: "Verification record not initialized. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Set progress state based on file type
    const setProgress = {
      idFront: setIdFrontProgress,
      idBack: setIdBackProgress,
      selfie: setSelfieProgress
    }[fileType];
    
    // Document type based on file type
    const documentType = {
      idFront: 'aadhar_front',
      idBack: 'aadhar_back',
      selfie: 'selfie'
    }[fileType];
    
    try {
      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        setProgress(Math.min(progress, 95));
        
        if (progress >= 95) {
          clearInterval(progressInterval);
        }
      }, 100);
      
      // Upload the file
      const result = await uploadKycDocument(file, userId, documentType, verificationId);
      clearInterval(progressInterval);
      
      if (result?.documentUrl && result?.documentId) {
        // Store the document ID for OCR processing
        if (fileType === 'idFront') {
          setDocumentId(result.documentId);
          setShouldShowOcr(true);
        }
        
        // Update the appropriate URL state
        if (fileType === 'idFront') {
          setIdFrontUrl(result.documentUrl);
          // Update verification record with the URL
          await supabase
            .from('kyc_verifications')
            .update({ id_front: result.documentUrl })
            .eq('id', verificationId);
        } else if (fileType === 'idBack') {
          setIdBackUrl(result.documentUrl);
          // Update verification record with the URL
          await supabase
            .from('kyc_verifications')
            .update({ id_back: result.documentUrl })
            .eq('id', verificationId);
        } else if (fileType === 'selfie') {
          setSelfieUrl(result.documentUrl);
          // Update verification record with the URL
          await supabase
            .from('kyc_verifications')
            .update({ selfie: result.documentUrl })
            .eq('id', verificationId);
        }
        
        // Set progress to 100%
        setProgress(100);
        
        // Mark file as uploaded
        setFilesUploaded(prev => ({ ...prev, [fileType]: true }));
        
        toast({
          title: "Upload Successful",
          description: `Your ${fileType === 'idFront' ? 'ID front' : fileType === 'idBack' ? 'ID back' : 'selfie'} has been uploaded.`
        });

        // If it's the front of the ID, immediately show the OCR editor
        if (fileType === 'idFront' && verificationId) {
          setActiveTab('review');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      console.error(`Error uploading ${fileType}:`, error);
      setProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message || `Failed to upload ${fileType}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const submitVerification = async () => {
    if (!verificationId) {
      toast({
        title: "Setup Error",
        description: "Verification record not initialized. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    if (!idFrontUrl) {
      toast({
        title: "ID Front Required",
        description: "Please upload the front of your ID document",
        variant: "destructive"
      });
      setActiveTab('id-front');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Ensure the verification status is set to Pending
      await supabase
        .from('kyc_verifications')
        .update({ status: 'Pending' })
        .eq('id', verificationId);
      
      // Submit verification data to complete the process
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
      
      onComplete();
    } catch (error: any) {
      console.error("Error submitting verification:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNextStep = () => {
    // Move to next tab
    if (activeTab === 'id-front') {
      if (!idFrontUrl && !filesUploaded.idFront) {
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-shield-blue mb-4" />
        <p className="text-gray-600">Preparing your verification...</p>
      </div>
    );
  }

  return (
    <div>
      <UserInfoCard formData={formData} />
      
      <Card className="mb-6">
        <CardContent className="p-6">
          {shouldShowOcr && documentId && verificationId ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Verify Extracted Information</h3>
                <p className="text-sm text-gray-500">We've automatically extracted information from your document. Please verify and correct if needed.</p>
              </div>
              
              <OcrDataEditor verificationId={verificationId} />
              
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setShouldShowOcr(false)}
                >
                  Back to Documents
                </Button>
                <Button 
                  onClick={() => {
                    setShouldShowOcr(false);
                    setActiveTab('id-back');
                  }} 
                  className="bg-shield-blue hover:bg-blue-700"
                >
                  Continue to Next Document
                </Button>
              </div>
            </div>
          ) : (
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
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm">Document uploaded successfully</p>
                    </div>
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
                    onFileSelected={(file) => {
                      setIdFrontFile(file);
                      handleFileUpload('idFront', file);
                    }}
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
                    disabled={(!idFrontUrl && !filesUploaded.idFront) || isSubmitting}
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
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm">Document uploaded successfully</p>
                    </div>
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
                    onFileSelected={(file) => {
                      setIdBackFile(file);
                      handleFileUpload('idBack', file);
                    }}
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
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleNextStep} 
                    className="bg-shield-blue hover:bg-blue-700"
                    disabled={isSubmitting}
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
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm">Selfie uploaded successfully</p>
                    </div>
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
                    onFileSelected={(file) => {
                      setSelfieFile(file);
                      handleFileUpload('selfie', file);
                    }}
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
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleNextStep} 
                    className="bg-shield-blue hover:bg-blue-700"
                    disabled={isSubmitting || (!selfieUrl && !filesUploaded.selfie)}
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {idFrontUrl && (
                    <div className="border rounded-md p-2">
                      <p className="text-sm font-medium mb-2">Aadhaar Front</p>
                      <div className="aspect-[3/2] w-full overflow-hidden rounded border">
                        <img src={idFrontUrl} alt="Aadhaar Front" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                  
                  {idBackUrl && (
                    <div className="border rounded-md p-2">
                      <p className="text-sm font-medium mb-2">Aadhaar Back</p>
                      <div className="aspect-[3/2] w-full overflow-hidden rounded border">
                        <img src={idBackUrl} alt="Aadhaar Back" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                  
                  {selfieUrl && (
                    <div className="border rounded-md p-2">
                      <p className="text-sm font-medium mb-2">Selfie</p>
                      <div className="aspect-[3/2] w-full overflow-hidden rounded border">
                        <img src={selfieUrl} alt="Selfie" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('selfie')}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={submitVerification} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!idFrontUrl || isSubmitting}
                  >
                    {isSubmitting ? (
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
          )}
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
