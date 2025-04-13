
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface UseDocumentUploadProps {
  bucketName: string;
  userId: string;
  folderPath?: string;
}

export function useDocumentUpload({ bucketName, userId, folderPath = '' }: UseDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const uploadDocument = async (file: File): Promise<string | null> => {
    if (!file || !userId) {
      toast.error('Missing file or user ID for upload');
      return null;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 200);
      
      // Prepare file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = folderPath 
        ? `${userId}/${folderPath}/${fileName}`
        : `${userId}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      if (uploadError) {
        console.error('Error uploading document:', uploadError);
        toast.error('Failed to upload document. Please try again.');
        setUploadProgress(0);
        return null;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      if (!publicUrlData?.publicUrl) {
        toast.error('Failed to get public URL for uploaded document');
        return null;
      }
      
      // Successfully uploaded
      setUploadProgress(100);
      setUploadedUrl(publicUrlData.publicUrl);
      toast.success('Document uploaded successfully');
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in document upload:', error);
      toast.error('Upload failed. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetUpload = () => {
    setUploadedUrl(null);
    setUploadProgress(0);
  };
  
  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadedUrl,
    resetUpload
  };
}
