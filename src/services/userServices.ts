
import { supabase } from '@/integrations/supabase/client';
import { SOSAlert, KycVerification, Advisory, CriminalProfile, CaseData, CriminalTip, KycDocument } from '@/types/officer';

// SOS Alerts
export const submitSOSAlert = async (alertData: any): Promise<SOSAlert[]> => {
  const { data, error } = await supabase
    .from('sos_alerts')
    .insert([alertData])
    .select();
  
  if (error) {
    throw error;
  }
  
  // If a voice recording URL is provided, store it in the voice_recordings table
  if (alertData.voice_recording) {
    const { error: voiceError } = await supabase
      .from('voice_recordings')
      .insert([
        {
          alert_id: data[0].alert_id,
          recording_url: alertData.voice_recording
        }
      ]);
      
    if (voiceError) {
      console.error("Error saving voice recording:", voiceError);
      // Don't throw here, as the alert was already saved
    }
  }
  
  return data || [];
};

export const getUserSOSAlerts = async (userId: string): Promise<SOSAlert[]> => {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('*')
    .eq('reported_by', userId)
    .order('reported_time', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data || [];
};

// KYC Verification
export const submitKycVerification = async (verificationData: any): Promise<KycVerification[]> => {
  try {
    // Ensure we have a user ID stored with the verification
    const userData = {
      full_name: verificationData.fullName,
      email: verificationData.email,
      submission_date: new Date().toISOString(),
      status: 'Pending',
      id_front: verificationData.idFront,
      id_back: verificationData.idBack,
      selfie: verificationData.selfie,
      user_id: verificationData.user_id || null,
      extracted_data: {}
    };

    // If we have extracted data, add it to the verification
    if (verificationData.documents && verificationData.documents.length > 0 && 
        verificationData.documents[0].extracted_data) {
      userData.extracted_data = verificationData.documents[0].extracted_data;
    }
    
    console.log("Submitting KYC verification with data:", { 
      ...userData, 
      id_front: "BASE64_IMAGE_DATA", // Don't log the entire image data
      id_back: "BASE64_IMAGE_DATA", 
      selfie: "BASE64_IMAGE_DATA" 
    });
    
    // First check if a verification already exists for this email
    const { data: existingData, error: existingError } = await supabase
      .from('kyc_verifications')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();
      
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking for existing KYC verification:', existingError);
      throw existingError;
    }
    
    let data;
    let error;
    
    // If a verification already exists, update it instead of inserting a new one
    if (existingData) {
      console.log('Found existing KYC verification, updating instead of inserting');
      const { data: updatedData, error: updateError } = await supabase
        .from('kyc_verifications')
        .update({
          full_name: userData.full_name,
          submission_date: userData.submission_date,
          id_front: userData.id_front,
          id_back: userData.id_back,
          selfie: userData.selfie,
          user_id: userData.user_id,
          extracted_data: userData.extracted_data,
          status: 'Pending' // Reset status to pending if resubmitting
        })
        .eq('email', userData.email)
        .select();
        
      data = updatedData;
      error = updateError;
    } else {
      // Insert new verification if one doesn't exist
      const { data: insertedData, error: insertError } = await supabase
        .from('kyc_verifications')
        .insert([userData])
        .select();
        
      data = insertedData;
      error = insertError;
    }
    
    if (error) {
      console.error('Error submitting KYC verification:', error);
      throw error;
    }
    
    // Initialize the documents array
    const results: KycVerification[] = data.map(item => ({
      ...item,
      documents: []
    }));
    
    // If documents are provided, store them in the kyc_documents table
    if (verificationData.documents && verificationData.documents.length > 0) {
      // First check if documents already exist for this verification
      const verificationId = data[0].id;
      const { data: existingDocs, error: existingDocsError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('verification_id', verificationId);
        
      if (existingDocsError) {
        console.error("Error checking for existing KYC documents:", existingDocsError);
      }
      
      if (existingDocs && existingDocs.length > 0) {
        // Delete existing documents before inserting new ones
        const { error: deleteError } = await supabase
          .from('kyc_documents')
          .delete()
          .eq('verification_id', verificationId);
          
        if (deleteError) {
          console.error("Error deleting existing KYC documents:", deleteError);
        }
      }
      
      // Insert new documents
      const documentsToInsert = verificationData.documents.map((doc: any) => ({
        verification_id: verificationId,
        document_type: doc.type,
        document_url: doc.url,
        extracted_data: doc.extracted_data || null
      }));
      
      const { data: docData, error: docError } = await supabase
        .from('kyc_documents')
        .insert(documentsToInsert)
        .select();
        
      if (docError) {
        console.error("Error saving KYC documents:", docError);
        // Don't throw here, as the verification was already saved
      } else if (docData) {
        // Attach the documents to the result
        results[0].documents = docData as KycDocument[];
      }
    }
    
    console.log('KYC verification submitted successfully:', results);
    return results;
  } catch (error) {
    console.error('Error in submitKycVerification:', error);
    throw error;
  }
};

export const getUserKycStatus = async (email: string): Promise<KycVerification | null> => {
  console.log("Checking KYC status for email:", email);
  const { data, error } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('email', email)
    .order('submission_date', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
    console.error("Error fetching KYC status:", error);
    throw error;
  }
  
  if (!data) {
    console.log("No KYC verification found for email:", email);
    return null;
  }
  
  console.log("Found KYC verification with status:", data.status);
  
  // Get documents for this verification
  const { data: documents, error: docError } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('verification_id', data.id);
  
  if (docError) {
    console.error("Error fetching KYC documents:", docError);
  }
  
  return {
    ...data,
    documents: documents || []
  };
};

// Check for user notifications regarding KYC verifications
export const getUserKycNotifications = async (userId: string): Promise<any[]> => {
  console.log("Checking for KYC notifications for user ID:", userId);
  const { data, error } = await supabase
    .from('user_kyc_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching user KYC notifications:", error);
    throw error;
  }

  console.log(`Found ${data?.length || 0} KYC notifications for user`);
  return data || [];
};

// Mark a KYC notification as read
export const markKycNotificationAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_kyc_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error("Error marking KYC notification as read:", error);
    throw error;
  }
  
  console.log("Notification marked as read:", notificationId);
};

// Advisories
export const getPublicAdvisories = async (): Promise<Advisory[]> => {
  const { data, error } = await supabase
    .from('advisories')
    .select('*')
    .order('issue_date', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data || [];
};

// Criminal Profiles
export const getWantedCriminals = async (): Promise<CriminalProfile[]> => {
  const { data, error } = await supabase
    .from('criminal_profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data || [];
};

// Cases
export const getPublicCases = async (): Promise<CaseData[]> => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .order('case_date', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data || [];
};

// Criminal Tip Submission
export const submitCriminalTip = async (tipData: any): Promise<CriminalTip[]> => {
  const { data, error } = await supabase
    .from('criminal_tips')
    .insert([tipData])
    .select();
  
  if (error) {
    throw error;
  }
  
  return data || [];
};
