
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import KycForm from '@/components/ekyc/KycForm';
import KycVerification from '@/components/ekyc/KycVerification';
import KycCompleted from '@/components/ekyc/KycCompleted';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { getUserKycStatus } from '@/services/userServices';
import { toast } from '@/hooks/use-toast';
import { VerificationStatus } from '@/data/kycVerificationsData';

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
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
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
  const [kycStatus, setKycStatus] = useState<VerificationStatus>("none");

  useEffect(() => {
    const checkUserSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data?.session?.user?.id) {
        setUserId(data.session.user.id);
        
        try {
          const email = data.session.user.email;
          if (email) {
            // Try to populate user data if available
            if (data.session.user.user_metadata?.full_name) {
              setKycData(prev => ({
                ...prev,
                fullName: data.session.user.user_metadata.full_name || "",
                email: email || ""
              }));
            }
            
            const kycInfo = await getUserKycStatus(email);
            if (kycInfo) {
              const status = kycInfo.status?.toLowerCase() as VerificationStatus || "pending";
              setKycStatus(status);
              setCurrentStep("completed");
            }
          }
        } catch (error) {
          console.error("Error checking KYC status:", error);
          // If there's an error fetching status, just continue with the form
        }
      } else {
        toast({
          title: "Authentication Required",
          description: "Please sign in to complete KYC verification.",
          variant: "destructive"
        });
        navigate('/signin');
      }
      
      setLoading(false);
    };
    
    checkUserSession();
  }, [navigate]);

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
    setKycStatus("pending");
    
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
    
    toast({
      title: "KYC Reset",
      description: "You can now start a new KYC verification process."
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shield-blue"></div>
        </main>
        <Footer />
      </div>
    );
  }

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
                  userId={userId}
                  onComplete={handleVerificationComplete}
                  formData={kycData}
                />
              </TabsContent>
              
              <TabsContent value="completed" className="mt-0">
                <KycCompleted 
                  status={kycStatus}
                  userId={userId}
                  onReset={handleKycReset}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EKycPage;
