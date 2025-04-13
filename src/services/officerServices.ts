
import { supabase } from '@/integrations/supabase/client';
import { KycVerification, SOSAlert, CriminalProfile, CaseData } from '@/types/officer';

// KYC Verifications
export const getKycVerifications = async (limit?: number): Promise<KycVerification[]> => {
  let query = supabase
    .from('kyc_verifications')
    .select('*, kyc_document_extractions(*)')
    .order('submission_date', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching KYC verifications:', error);
    throw error;
  }
  
  // Process the data to match our KycVerification type
  const verifications = data.map((item: any) => {
    // Convert any documents to our expected format
    const documents = item.kyc_document_extractions ? item.kyc_document_extractions.map((doc: any) => ({
      id: doc.id,
      type: doc.document_type,
      url: doc.document_url,
      extractedData: doc.extracted_data,
      created_at: doc.created_at
    })) : [];
    
    // Remove the nested documents array to avoid duplicates
    const { kyc_document_extractions, ...rest } = item;
    
    return {
      ...rest,
      status: item.status?.toLowerCase(),
      documents
    };
  });
  
  return verifications;
};

export const updateKycVerificationStatus = async (
  verificationId: number,
  status: string,
  additionalData: any = {}
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('kyc_verifications')
      .update({ 
        status: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize first letter
        ...additionalData
      })
      .eq('id', verificationId);
    
    if (error) {
      console.error('Error updating KYC verification status:', error);
      throw error;
    }
    
    // Get information about the verification
    const { data: verificationData } = await supabase
      .from('kyc_verifications')
      .select('user_id, email, full_name')
      .eq('id', verificationId)
      .single();
    
    // Create notification for the user if possible
    if (verificationData?.user_id) {
      await supabase.from('user_notifications').insert([{
        notification_type: 'kyc_status_update',
        message: `Your identity verification has been ${status.toLowerCase()}`,
        user_id: verificationData.user_id
      }]);
    }
    
  } catch (error) {
    console.error('Error in updateKycVerificationStatus:', error);
    throw error;
  }
};

// SOS Alerts
export const getSosAlerts = async (limit?: number): Promise<SOSAlert[]> => {
  let query = supabase
    .from('sos_alerts')
    .select('*, voice_recordings(*)')
    .order('reported_time', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching SOS alerts:', error);
    throw error;
  }
  
  return data || [];
};

export const updateSosAlertStatus = async (
  alertId: string,
  status: string,
  officerId?: string
): Promise<void> => {
  try {
    const updateData: any = { status };
    
    if (officerId && (status === 'assigned' || status === 'in_progress')) {
      updateData.officer_id = officerId;
      updateData.assigned_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('sos_alerts')
      .update(updateData)
      .eq('alert_id', alertId);
    
    if (error) {
      console.error('Error updating SOS alert status:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateSosAlertStatus:', error);
    throw error;
  }
};

// Officer Authentication
export const officerLogin = async (email: string, password: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('officer_profiles')
      .select('*')
      .eq('department_email', email)
      .single();
      
    if (error || !data) {
      throw new Error('Officer not found');
    }
    
    // In a real app, we'd use proper password hashing and verification
    // This is just a simple check for demonstration purposes
    if (data.password !== password) {
      throw new Error('Invalid credentials');
    }
    
    return data;
  } catch (error) {
    console.error('Error in officerLogin:', error);
    throw error;
  }
};

// Fixed functions for OfficerCaseMap component
export const getCases = async (): Promise<CaseData[]> => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('case_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching cases:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCases:', error);
    throw error;
  }
};

export const createCase = async (caseData: Partial<CaseData>): Promise<CaseData> => {
  try {
    // Fix: Don't wrap caseData in an array
    const { data, error } = await supabase
      .from('cases')
      .insert(caseData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating case:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createCase:', error);
    throw error;
  }
};

// Fixed functions for OfficerCriminalPanel component
export const getCriminalProfiles = async (): Promise<CriminalProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('criminal_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching criminal profiles:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCriminalProfiles:', error);
    throw error;
  }
};

export const createCriminalProfile = async (profileData: Partial<CriminalProfile>): Promise<CriminalProfile> => {
  try {
    // Fix: Don't wrap profileData in an array
    const { data, error } = await supabase
      .from('criminal_profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating criminal profile:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createCriminalProfile:', error);
    throw error;
  }
};

// Add missing function for OfficerRegistration component
export const registerOfficer = async (officerData: any): Promise<any> => {
  try {
    // Using the database function to register the officer
    const { data, error } = await supabase
      .rpc('register_officer', {
        full_name: officerData.full_name,
        badge_number: officerData.badge_number,
        department: officerData.department,
        department_email: officerData.department_email,
        phone_number: officerData.phone_number,
        password: officerData.password,
        confirm_password: officerData.confirm_password
      });
    
    if (error) {
      console.error('Error registering officer:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in registerOfficer:', error);
    throw error;
  }
};
