import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getExtractedKycData, updateExtractedKycData } from '@/utils/kycUtils';
import { Loader2, Check, RefreshCcw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface OcrDataEditorProps {
  verificationId: number;
}

// Define a type for our extracted data
interface ExtractedData {
  aadhaar_number: string;
  name: string;
  dob: string;
  gender: string;
  address?: string;
  [key: string]: string | undefined; // Allow for other properties
}

const OcrDataEditor: React.FC<OcrDataEditorProps> = ({ verificationId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ExtractedData>({
    aadhaar_number: '',
    name: '',
    dob: '',
    gender: '',
    address: ''
  });
  
  const [ocrStatus, setOcrStatus] = useState<string>('pending');
  const [processingMessage, setProcessingMessage] = useState('Processing your documents...');
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getExtractedKycData(verificationId);
        
        if (result) {
          setOcrStatus(result.ocrStatus);
          
          if (result.extractedData) {
            // Ensure we're dealing with an object
            const extractedData = typeof result.extractedData === 'object' && result.extractedData !== null 
              ? result.extractedData as ExtractedData 
              : { aadhaar_number: '', name: '', dob: '', gender: '', address: '' };
              
            setData({
              aadhaar_number: extractedData.aadhaar_number || '',
              name: extractedData.name || '',
              dob: extractedData.dob || '',
              gender: extractedData.gender || '',
              address: extractedData.address || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching OCR data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Poll for OCR updates if still processing
    if (ocrStatus === 'pending') {
      pollingInterval = setInterval(async () => {
        try {
          const result = await getExtractedKycData(verificationId);
          if (result) {
            setOcrStatus(result.ocrStatus);
            
            if (result.ocrStatus === 'completed' && result.extractedData) {
              // Ensure we're dealing with an object
              const extractedData = typeof result.extractedData === 'object' && result.extractedData !== null 
                ? result.extractedData as ExtractedData 
                : { aadhaar_number: '', name: '', dob: '', gender: '', address: '' };
                
              setData({
                aadhaar_number: extractedData.aadhaar_number || '',
                name: extractedData.name || '',
                dob: extractedData.dob || '',
                gender: extractedData.gender || '',
                address: extractedData.address || ''
              });
              
              if (pollingInterval) {
                clearInterval(pollingInterval);
              }
            }
          }
          
          // Update processing message to show progress
          setPollingCount(prev => prev + 1);
          if (pollingCount > 3) {
            setProcessingMessage('Still processing... This may take a moment.');
          }
          if (pollingCount > 6) {
            setProcessingMessage('Almost there! Finalizing document analysis...');
          }
        } catch (error) {
          console.error('Error polling for OCR updates:', error);
        }
      }, 3000);
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [verificationId, ocrStatus, pollingCount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateExtractedKycData(verificationId, data);
      // Success notification will be shown by the updateExtractedKycData function
    } catch (error) {
      console.error('Error saving OCR data:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRetryOcr = async () => {
    setOcrStatus('pending');
    setPollingCount(0);
    setProcessingMessage('Reprocessing your documents...');
    
    // Fetch document IDs associated with this verification
    try {
      const { data: documents, error } = await supabase
        .from('kyc_document_extractions')
        .select('id, document_type')
        .eq('verification_id', verificationId)
        .neq('document_type', 'selfie');
      
      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }
      
      // Trigger OCR processing for each document
      for (const doc of documents) {
        await supabase.functions.invoke('process-kyc-ocr', {
          body: { documentId: doc.id }
        });
      }
    } catch (error) {
      console.error('Error retrying OCR:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-shield-blue mb-4" />
        <p className="text-gray-600">Loading document data...</p>
      </div>
    );
  }

  if (ocrStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-shield-blue mb-4" />
        <p className="text-gray-600">{processingMessage}</p>
      </div>
    );
  }

  return (
    <Card className="border-blue-100 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {ocrStatus === 'completed' ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
          Extracted Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ocrStatus === 'failed' && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>OCR Processing Failed</AlertTitle>
            <AlertDescription>
              We couldn't automatically extract information from your documents. Please enter your details manually.
            </AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-gray-600 mb-4">
          {ocrStatus === 'completed'
            ? "We've extracted the following information from your documents. Please verify and correct if needed."
            : "Please enter your document information manually."}
        </p>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
            <Input 
              id="aadhaar_number"
              name="aadhaar_number"
              value={data.aadhaar_number}
              onChange={handleChange}
              className="bg-white"
              placeholder="Your 12-digit Aadhaar number"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name"
              name="name"
              value={data.name}
              onChange={handleChange}
              className="bg-white"
              placeholder="Your full name as on Aadhaar"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input 
                id="dob"
                name="dob"
                value={data.dob}
                onChange={handleChange}
                className="bg-white"
                placeholder="DD/MM/YYYY"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="gender">Gender</Label>
              <Input 
                id="gender"
                name="gender"
                value={data.gender}
                onChange={handleChange}
                className="bg-white"
                placeholder="MALE/FEMALE/OTHER"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address"
              name="address"
              value={data.address || ''}
              onChange={handleChange}
              className="bg-white"
              placeholder="Address as on Aadhaar"
            />
          </div>
          
          <div className="mt-4 flex justify-between">
            {ocrStatus !== 'pending' && (
              <Button 
                onClick={handleRetryOcr}
                variant="outline"
                className="border-shield-blue text-shield-blue"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry OCR
              </Button>
            )}
            
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-shield-blue hover:bg-blue-700 ml-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Information
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OcrDataEditor;
