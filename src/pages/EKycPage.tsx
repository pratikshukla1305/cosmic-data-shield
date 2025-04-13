
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KycForm from '@/components/ekyc/KycForm';
import KycVerification from '@/components/ekyc/KycVerification';
import KycCompleted from '@/components/ekyc/KycCompleted';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getUserVerificationStatus } from '@/data/kycVerificationsData';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type KycData = {
  fullName: string;
  dob: string;
  nationality: string;
  idType: "passport" | "national_id" | "driving_license";
  idNumber: string;
  address: string;
  phone: string;
  email: string;
};

const EKycPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<string>("form");
  const [kycData, setKycData] = useState<KycData>({
    fullName: "",
    dob: "",
    nationality: "",
    idType: "national_id",
    idNumber: "",
    address: "",
    phone: "",
    email: ""
  });
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    idFront?: File;
    idBack?: File;
    selfie?: File;
  }>({});
  const [user, setUser] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      // If user is authenticated, check their verification status
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('kyc_verifications')
            .select('status')
            .eq('email', session.user.email)
            .order('submission_date', { ascending: false })
            .limit(1)
            .single();
            
          if (data) {
            setVerificationStatus(data.status);
            if (data.status.toLowerCase() === 'approved') {
              setCurrentStep("completed");
            }
          }
        } catch (error) {
          console.error("Error checking verification status:", error);
        }
      }
    };
    
    checkAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFormSubmit = (data: KycData) => {
    // Validate if we're using Indian nationality with Aadhaar
    if (data.nationality.toLowerCase() === 'india' || data.nationality.toLowerCase() === 'indian') {
      // Check if it's a 12-digit number (Aadhaar ID)
      const aadhaarRegex = /^\d{12}$/;
      if (!aadhaarRegex.test(data.idNumber.replace(/\s/g, ''))) {
        toast({
          title: "Invalid Aadhaar Number",
          description: "Please enter a valid 12-digit Aadhaar number without spaces.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setKycData(data);
    setCurrentStep("verification");
    
    toast({
      title: "Personal Information Saved",
      description: "Please complete document verification in the next step."
    });
  };

  const handleVerificationComplete = () => {
    // Only move to completed step after verification is submitted
    setCurrentStep("completed");
    
    toast({
      title: "Verification Submitted",
      description: "Your verification is being processed. You can check the status here."
    });
  };

  const handleKycReset = () => {
    // Reset the form and go back to the beginning
    setCurrentStep("form");
    setKycData({
      fullName: "",
      dob: "",
      nationality: "",
      idType: "national_id",
      idNumber: "",
      address: "",
      phone: "",
      email: ""
    });
    setUploadedDocuments({});
    
    toast({
      title: "KYC Reset",
      description: "You can now start a new KYC verification process."
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Electronic Know Your Customer (e-KYC)
            </h1>
            <p className="text-gray-600 mb-8">
              Complete the verification process to access all features of Midshield.
            </p>
            
            {!user ? (
              <div className="text-center p-6 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
                <p className="text-gray-600 mb-4">
                  You need to sign in to complete the KYC verification process.
                </p>
                <Button onClick={() => navigate('/signin')} className="bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
              </div>
            ) : (
              <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger 
                    value="form" 
                    disabled={currentStep !== "form"}
                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                  >
                    1. Personal Information
                  </TabsTrigger>
                  <TabsTrigger 
                    value="verification" 
                    disabled={currentStep !== "verification" && currentStep !== "completed"}
                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                  >
                    2. Document Verification
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed" 
                    disabled={currentStep !== "completed"}
                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                  >
                    3. Verification Complete
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="form" className="mt-0">
                  <KycForm onSubmit={handleFormSubmit} formData={kycData} />
                </TabsContent>
                
                <TabsContent value="verification" className="mt-0">
                  <KycVerification 
                    userId={user?.id || "user-123"}
                    onComplete={handleVerificationComplete}
                    formData={kycData}
                  />
                </TabsContent>
                
                <TabsContent value="completed" className="mt-0">
                  <KycCompleted 
                    status={(verificationStatus || getUserVerificationStatus("user-123")) as "pending" | "approved" | "rejected"}
                    userId={user?.id || "user-123"}
                    onReset={handleKycReset}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EKycPage;
