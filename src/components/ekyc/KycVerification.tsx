import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ReloadIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/contexts/AuthContext';

interface KycVerificationProps {
  userId: string;
  onComplete: () => void;
  formData: any;
}

const KycVerification: React.FC<KycVerificationProps> = ({ userId, onComplete, formData }) => {
  const navigate = useNavigate();
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { user } = useAuth();

  const onDropFront = useCallback((acceptedFiles: File[]) => {
    setIdFront(acceptedFiles[0]);
  }, []);

  const onDropBack = useCallback((acceptedFiles: File[]) => {
    setIdBack(acceptedFiles[0]);
  }, []);

  const onDropSelfie = useCallback((acceptedFiles: File[]) => {
    setSelfie(acceptedFiles[0]);
  }, []);

  const {getRootProps: getRootPropsFront, getInputProps: getInputPropsFront, isDragActive: isDragActiveFront} = useDropzone({ onDrop: onDropFront, multiple: false });
  const {getRootProps: getRootPropsBack, getInputProps: getInputPropsBack, isDragActive: isDragActiveBack} = useDropzone({ onDrop: onDropBack, multiple: false });
  const {getRootProps: getRootPropsSelfie, getInputProps: getInputPropsSelfie, isDragActive: isDragActiveSelfie} = useDropzone({ onDrop: onDropSelfie, multiple: false });

  useEffect(() => {
    // Simulate data extraction (replace with actual API call)
    if (idFront) {
      // Simulate API response after a delay
      setTimeout(() => {
        setExtractedData({
          name: formData.fullName,
          idNumber: formData.idNumber,
          dob: formData.dob,
          address: formData.address
        });
      }, 1500);
    }
  }, [idFront, formData]);

  const handleSubmit = async () => {
    if (!idFront || !idBack || !selfie) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents (ID Front, ID Back, and Selfie).",
        variant: "destructive"
      });
      return;
    }

    if (!formData) {
      toast({
        title: "Missing Personal Information",
        description: "Please complete your personal information first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit your verification.",
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
      
      // Use the submitKycVerification service instead of direct Supabase call
      const { submitKycVerification } = await import('@/services/userServices');
      
      await submitKycVerification({
        fullName: formData.fullName,
        email: formData.email,
        idFront: idFrontBase64,
        idBack: idBackBase64,
        selfie: selfieBase64,
        extractedData: extractedData,
        userId: user.id
      });
      
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
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>1. Upload ID Front</CardTitle>
          <CardDescription>
            Upload a clear image of the front of your government-issued ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootPropsFront()} className={`dropzone ${isDragActiveFront ? 'active' : ''}`}>
            <input {...getInputPropsFront()} />
            {idFront ? (
              <div className="uploaded-file">
                <p>File: {idFront.name}</p>
              </div>
            ) : (
              <p>Drag 'n' drop your file here, or click to select file</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Upload ID Back</CardTitle>
          <CardDescription>
            Upload a clear image of the back of your government-issued ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootPropsBack()} className={`dropzone ${isDragActiveBack ? 'active' : ''}`}>
            <input {...getInputPropsBack()} />
            {idBack ? (
              <div className="uploaded-file">
                <p>File: {idBack.name}</p>
              </div>
            ) : (
              <p>Drag 'n' drop your file here, or click to select file</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Upload Selfie</CardTitle>
          <CardDescription>
            Upload a selfie of yourself holding your ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootPropsSelfie()} className={`dropzone ${isDragActiveSelfie ? 'active' : ''}`}>
            <input {...getInputPropsSelfie()} />
            {selfie ? (
              <div className="uploaded-file">
                <p>File: {selfie.name}</p>
              </div>
            ) : (
              <p>Drag 'n' drop your file here, or click to select file</p>
            )}
          </div>
        </CardContent>
      </Card>

      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
            <CardDescription>
              Please verify the extracted data from your ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={extractedData.name} readOnly />
              </div>
              <div>
                <Label htmlFor="idNumber">ID Number</Label>
                <Input id="idNumber" defaultValue={extractedData.idNumber} readOnly />
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" defaultValue={extractedData.dob} readOnly />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" defaultValue={extractedData.address} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button disabled={isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Verification"
          )}
        </Button>
      </div>
    </div>
  );
};

export default KycVerification;
