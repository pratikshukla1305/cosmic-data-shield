
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Upload KYC document to Supabase storage and store record in database
export const uploadKycDocument = async (
  file: File,
  userId: string,
  verificationType: string,
  verificationId?: number
): Promise<{ documentUrl: string, documentId: string } | null> => {
  try {
    if (!file || !userId) {
      console.error('Missing required parameters for uploadKycDocument');
      return null;
    }
    
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${verificationType}_${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error(`Error uploading ${verificationType} document:`, uploadError);
      toast.error(`Failed to upload ${verificationType} document. Please try again.`);
      return null;
    }
    
    // 2. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(filePath);
    
    if (!publicUrlData?.publicUrl) {
      console.error('Failed to get public URL for uploaded document');
      return null;
    }
    
    const documentUrl = publicUrlData.publicUrl;
    
    // 3. Store document record in database
    const { data: docData, error: docError } = await supabase
      .from('kyc_document_extractions')
      .insert([{
        verification_id: verificationId,
        user_id: userId,
        document_type: verificationType,
        document_url: documentUrl
      }])
      .select('id')
      .single();
    
    if (docError) {
      console.error('Error storing document record:', docError);
      return null;
    }
    
    // 4. Trigger OCR processing if it's not a selfie
    if (verificationType !== 'selfie' && docData?.id) {
      try {
        await supabase.functions.invoke('process-kyc-ocr', {
          body: { documentId: docData.id }
        });
      } catch (ocrError) {
        console.error('Error triggering OCR processing:', ocrError);
        // Continue anyway as this shouldn't block the user
      }
    }
    
    return { 
      documentUrl,
      documentId: docData?.id || ''
    };
  } catch (error) {
    console.error('Error in uploadKycDocument:', error);
    toast.error('Upload failed. Please try again.');
    return null;
  }
};

// Retrieve OCR data for a verification
export const getExtractedKycData = async (verificationId: number) => {
  try {
    const { data, error } = await supabase
      .from('kyc_verifications')
      .select('extracted_data, edited_data, is_data_edited, ocr_status')
      .eq('id', verificationId)
      .single();
      
    if (error) {
      console.error('Error getting extracted KYC data:', error);
      return null;
    }
    
    return {
      extractedData: data.is_data_edited ? data.edited_data : data.extracted_data,
      ocrStatus: data.ocr_status,
      isDataEdited: data.is_data_edited
    };
  } catch (error) {
    console.error('Error in getExtractedKycData:', error);
    return null;
  }
};

// Update edited extracted data
export const updateExtractedKycData = async (verificationId: number, editedData: any) => {
  try {
    const { error } = await supabase
      .from('kyc_verifications')
      .update({
        edited_data: editedData,
        is_data_edited: true
      })
      .eq('id', verificationId);
      
    if (error) {
      console.error('Error updating extracted KYC data:', error);
      toast.error('Failed to update extracted data.');
      return false;
    }
    
    toast.success('Document data updated successfully.');
    return true;
  } catch (error) {
    console.error('Error in updateExtractedKycData:', error);
    toast.error('Update failed. Please try again.');
    return false;
  }
};
