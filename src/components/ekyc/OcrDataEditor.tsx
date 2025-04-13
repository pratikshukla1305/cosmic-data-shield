
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getExtractedKycData, updateExtractedKycData } from '@/utils/kycUtils';
import { Loader2, Check, RefreshCcw } from 'lucide-react';

interface OcrDataEditorProps {
  verificationId: number;
}

const OcrDataEditor: React.FC<OcrDataEditorProps> = ({ verificationId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>({
    aadhaar_number: '',
    name: '',
    dob: '',
    gender: ''
  });
  
  const [ocrStatus, setOcrStatus] = useState<string>('pending');
  const [processingMessage, setProcessingMessage] = useState('Processing your documents...');
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getExtractedKycData(verificationId);
      
      if (result) {
        setOcrStatus(result.ocrStatus);
        
        if (result.extractedData) {
          setData({
            aadhaar_number: result.extractedData.aadhaar_number || '',
            name: result.extractedData.name || '',
            dob: result.extractedData.dob || '',
            gender: result.extractedData.gender || ''
          });
        }
      }
      setLoading(false);
    };
    
    fetchData();
    
    // Poll for OCR updates if still processing
    if (ocrStatus === 'pending') {
      const interval = setInterval(async () => {
        const result = await getExtractedKycData(verificationId);
        if (result) {
          setOcrStatus(result.ocrStatus);
          
          if (result.ocrStatus === 'completed' && result.extractedData) {
            setData({
              aadhaar_number: result.extractedData.aadhaar_number || '',
              name: result.extractedData.name || '',
              dob: result.extractedData.dob || '',
              gender: result.extractedData.gender || ''
            });
            clearInterval(interval);
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
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [verificationId, ocrStatus, pollingCount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateExtractedKycData(verificationId, data);
    setSaving(false);
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
          <Check className="h-5 w-5 text-green-600" />
          Extracted Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          We've extracted the following information from your documents. Please verify and correct if needed.
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
          
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-shield-blue hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Update Information
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
