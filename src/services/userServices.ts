
import { supabase } from '@/integrations/supabase/client';
import { SOSAlert, KycVerification, Advisory, CriminalProfile, CaseData, CriminalTip, KycDocument } from '@/types/officer';

// SOS Alerts
export const submitSOSAlert = async (alertData: any): Promise<SOSAlert[]> => {
  try {
    // Get current user details if available
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    const alertToSubmit = {
      ...alertData,
      reported_by: userId || alertData.reported_by,
      reported_time: new Date().toISOString(),
      status: 'New'
    };
    
    const { data, error } = await supabase
      .from('sos_alerts')
      .insert([alertToSubmit])
      .select();
    
    if (error) {
      console.error("Error submitting SOS alert:", error);
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
    
    // Create notification for officers
    try {
      await supabase.from('officer_notifications').insert([{
        notification_type: 'sos_alert',
        message: `New SOS Alert: ${alertData.message || 'Emergency assistance needed'}`,
      }]);
    } catch (notifError) {
      console.error("Error creating officer notification:", notifError);
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in submitSOSAlert:", error);
    throw error;
  }
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
    // First insert the main verification data
    const { data, error } = await supabase
      .from('kyc_verifications')
      .insert([{
        full_name: verificationData.fullName,
        email: verificationData.email,
        submission_date: new Date().toISOString(),
        status: 'Pending',
        id_front: verificationData.idFront,
        id_back: verificationData.idBack,
        selfie: verificationData.selfie,
        user_id: verificationData.userId || null
      }])
      .select();
    
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
      const documentsToInsert = verificationData.documents.map((doc: any) => ({
        verification_id: data[0].id,
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
    
    // Create notification for officers about new KYC submission
    try {
      await supabase.from('officer_notifications').insert([{
        notification_type: 'kyc_submission',
        message: `New KYC verification submitted by ${verificationData.fullName}`,
      }]);
    } catch (notifError) {
      console.error("Error creating officer notification:", notifError);
    }
    
    console.log('KYC verification submitted successfully:', results);
    return results;
  } catch (error) {
    console.error('Error in submitKycVerification:', error);
    throw error;
  }
};

export const getUserKycStatus = async (email: string): Promise<KycVerification | null> => {
  try {
    // First check if current user exists
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    let query = supabase
      .from('kyc_verifications')
      .select('*')
      .order('submission_date', { ascending: false })
      .limit(1);
      
    if (userId) {
      // If we have a user ID, use that as it's more reliable
      query = query.eq('user_id', userId);
    } else if (email) {
      // Fall back to email if no user ID
      query = query.eq('email', email);
    } else {
      throw new Error("No user identification provided");
    }
    
    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
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
  } catch (error) {
    console.error("Error in getUserKycStatus:", error);
    throw error;
  }
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
  
  // Create notification for officers about new tip
  try {
    await supabase.from('officer_notifications').insert([{
      notification_type: 'criminal_tip',
      message: `New criminal tip submitted: ${tipData.subject}`,
    }]);
  } catch (notifError) {
    console.error("Error creating officer notification:", notifError);
  }
  
  return data || [];
};
