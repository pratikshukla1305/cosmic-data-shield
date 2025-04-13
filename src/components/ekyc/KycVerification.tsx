
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { submitKycVerification, getUserKycStatus } from '@/services/userServices';

// Import our new separated components
import IdCard from './verification/IdCard';
import CameraCapture from './verification/CameraCapture';
import ImagePreview from './verification/ImagePreview';
import ExtractedData from './verification/ExtractedData';
import EditDataDialog from './verification/EditDataDialog';
import PersonalInfo from './verification/PersonalInfo';
import { useCamera } from './verification/useCamera';
import { useImagePreview } from './verification/useImagePreview';
import { useDocumentProcessor } from './verification/useDocumentProcessor';

export interface KycVerificationProps {
  userId: string;
  onComplete?: () => void;
  formData?: {
    fullName: string;
    dob: string;
    nationality: string;
    idType: "passport" | "national_id" | "driving_license";
    idNumber: string;
    address: string;
    phone: string;
    email: string;
  };
}

const KycVerification: React.FC<KycVerificationProps> = ({ userId, onComplete, formData }) => {
  const [activeTab, setActiveTab] = useState("id");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [editDialogType, setEditDialogType] = useState<"idNumber" | "name" | "dob">("idNumber");
  const [editedIdNumber, setEditedIdNumber] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedDob, setEditedDob] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Use our custom hooks
  const { 
    extractedData, 
    isProcessing, 
    extractDataFromAadhaar 
  } = useDocumentProcessor(formData);
  
  const {
    isCameraOpen,
    captureType,
    videoRef,
    canvasRef,
    handleCameraOpen,
    capturePhoto,
    handleCameraClose
  } = useCamera();
  
  const {
    isPreviewOpen,
    previewType,
    handlePreview,
    closePreview
  } = useImagePreview();

  useEffect(() => {
    const checkExistingVerification = async () => {
      try {
        if (formData?.email) {
          const verification = await getUserKycStatus(formData.email);
          if (verification && verification.status === 'Approved') {
            setIsComplete(true);
          }
        }
      } catch (error) {
        console.error("Error checking KYC status:", error);
      }
    };
    
    checkExistingVerification();
  }, [userId, formData]);

  useEffect(() => {
    if (idFront && formData) {
      extractDataFromAadhaar(idFront);
    }
  }, [idFront, formData, extractDataFromAadhaar]);

  const handleIdFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIdFront(e.target.files[0]);
    }
  };

  const handleIdBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIdBack(e.target.files[0]);
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelfie(e.target.files[0]);
    }
  };

  const handleCaptureComplete = (file: File) => {
    if (captureType === 'idFront') setIdFront(file);
    else if (captureType === 'idBack') setIdBack(file);
    else if (captureType === 'selfie') setSelfie(file);
  };

  const openEditDialog = (type: "idNumber" | "name" | "dob") => {
    setEditDialogType(type);
    if (type === "idNumber") {
      setEditedIdNumber(extractedData.idNumber || "");
    } else if (type === "name") {
      setEditedName(extractedData.name || "");
    } else if (type === "dob") {
      setEditedDob(extractedData.dob || "");
    }
    setIsEditDialogOpen(true);
  };

  const handleEditData = () => {
    if (formData) {
      toast({
        title: `${editDialogType === "idNumber" ? "ID Number" : editDialogType === "name" ? "Name" : "Date of Birth"} Updated`,
        description: `Value has been updated successfully.`
      });
    }
    setIsEditDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!idFront || !idBack || !selfie) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents (ID Front, ID Back, and Selfie).",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const convertFileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    try {
      const idFrontBase64 = idFront ? await convertFileToBase64(idFront) : '';
      const idBackBase64 = idBack ? await convertFileToBase64(idBack) : '';
      const selfieBase64 = selfie ? await convertFileToBase64(selfie) : '';
      
      const documents = [];
      if (Object.keys(extractedData).length > 0) {
        documents.push({
          type: 'ID Card OCR',
          url: idFrontBase64,
          extracted_data: extractedData
        });
      }
      
      if (formData) {
        await submitKycVerification({
          fullName: formData.fullName,
          email: formData.email,
          idFront: idFrontBase64,
          idBack: idBackBase64,
          selfie: selfieBase64,
          documents: documents,
          user_id: userId
        });
      }
      
      setIsSubmitting(false);
      setIsComplete(true);
      
      toast({
        title: "Verification Submitted",
        description: "Your identity verification has been submitted successfully.",
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      setIsSubmitting(false);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your verification. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Document Verification</CardTitle>
      </CardHeader>
      
      <CardContent>
        {!isComplete ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="id">ID Front</TabsTrigger>
              <TabsTrigger value="idBack">ID Back</TabsTrigger>
              <TabsTrigger value="selfie">Selfie</TabsTrigger>
            </TabsList>
            
            <TabsContent value="id" className="mt-4">
              <IdCard
                idImage={idFront}
                onUpload={handleIdFrontChange}
                onCapture={() => handleCameraOpen("idFront")}
                onPreview={() => handlePreview("idFront")}
                title="Upload or Capture Front of Aadhaar Card"
                inputId="id-front"
                isProcessing={isProcessing}
              />
              <ExtractedData
                extractedData={extractedData}
                onEdit={openEditDialog}
              />
            </TabsContent>
            
            <TabsContent value="idBack" className="mt-4">
              <IdCard
                idImage={idBack}
                onUpload={handleIdBackChange}
                onCapture={() => handleCameraOpen("idBack")}
                onPreview={() => handlePreview("idBack")}
                title="Upload or Capture Back of Aadhaar Card"
                inputId="id-back"
              />
            </TabsContent>
            
            <TabsContent value="selfie" className="mt-4">
              <IdCard
                idImage={selfie}
                onUpload={handleSelfieChange}
                onCapture={() => handleCameraOpen("selfie")}
                onPreview={() => handlePreview("selfie")}
                title="Upload or Capture Selfie"
                inputId="selfie"
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold mt-4">Verification Complete!</h3>
            <p className="text-gray-500 mt-2">
              Your documents have been successfully submitted for verification.
            </p>
          </div>
        )}

        {formData && !isComplete && (
          <PersonalInfo formData={formData} />
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {!isComplete ? (
          <Button onClick={handleSubmit} disabled={isSubmitting || !idFront || !idBack || !selfie}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>Submit Verification</>
            )}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => window.location.reload()}>
            Go Back
          </Button>
        )}
      </CardFooter>

      {/* Camera capture modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={handleCameraClose}
        onCapture={() => capturePhoto(handleCaptureComplete)}
        captureType={captureType || ""}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />

      {/* Image preview modal */}
      <ImagePreview
        isOpen={isPreviewOpen}
        onClose={closePreview}
        imageFile={
          previewType === "idFront" ? idFront :
          previewType === "idBack" ? idBack :
          previewType === "selfie" ? selfie : null
        }
        previewType={previewType || ""}
      />

      {/* Edit dialog */}
      <EditDataDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleEditData}
        dialogType={editDialogType}
        value={
          editDialogType === "idNumber" ? editedIdNumber :
          editDialogType === "name" ? editedName : editedDob
        }
        onChange={value => {
          if (editDialogType === "idNumber") setEditedIdNumber(value);
          else if (editDialogType === "name") setEditedName(value);
          else setEditedDob(value);
        }}
      />
    </Card>
  );
};

export default KycVerification;
