
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import KycForm from '@/components/ekyc/KycForm';
import KycVerification from '@/components/ekyc/KycVerification';
import KycCompleted from '@/components/ekyc/KycCompleted';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getUserKycStatus, getUserKycNotifications } from '@/services/userServices';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [existingVerification, setExistingVerification] = useState<any>(null);
  const [kycNotifications, setKycNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        fetchKycStatus(user);
      } else {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access the KYC verification.",
          variant: "destructive"
        });
        navigate("/signin", { state: { redirectTo: "/e-kyc" } });
      }
    };

    checkAuth();

    // Set up subscription for KYC verification status changes
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'kyc_verifications',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        (payload) => {
          console.log('Received update for KYC verification:', payload);
          if (user) fetchKycStatus(user);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, user?.id]);

  const fetchKycStatus = async (user: any) => {
    setLoading(true);
    try {
      const verification = await getUserKycStatus();

      if (verification) {
        setExistingVerification(verification);
        
        // Set the appropriate step based on the verification status
        if (verification.status === 'Pending') {
          setCurrentStep("completed");
        } else if (verification.status === 'Approved' || verification.status === 'Rejected') {
          setCurrentStep("completed");
        }
      }

      // Fetch KYC notifications
      const notifications = await getUserKycNotifications();
      setKycNotifications(notifications);
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

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

    // Refresh the KYC status
    if (user) fetchKycStatus(user);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container max-w-5xl mx-auto px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="bg-white shadow-xl rounded-lg overflow-hidden p-6 sm:p-10">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          </div>
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
            
            {existingVerification && existingVerification.status && (
              <Alert className={`mb-6 ${existingVerification.status === 'Approved' ? 'bg-green-50' : existingVerification.status === 'Rejected' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                {existingVerification.status === 'Approved' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className={`h-4 w-4 ${existingVerification.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`} />
                )}
                <AlertTitle>
                  KYC Status: {existingVerification.status}
                </AlertTitle>
                <AlertDescription>
                  {existingVerification.status === 'Approved' 
                    ? 'Your KYC verification has been approved.' 
                    : existingVerification.status === 'Rejected' 
                      ? `Your KYC verification was rejected. Reason: ${existingVerification.rejection_reason || 'Not provided'}`
                      : 'Your KYC verification is currently being processed. Please check back later.'}
                </AlertDescription>
              </Alert>
            )}

            {kycNotifications && kycNotifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Recent Notifications</h3>
                <div className="space-y-2">
                  {kycNotifications.slice(0, 3).map((notification) => (
                    <Alert key={notification.id} className={`
                      ${notification.status === 'Approved' ? 'bg-green-50' : 
                        notification.status === 'Rejected' ? 'bg-red-50' : 'bg-blue-50'}
                    `}>
                      <AlertTitle>{notification.status} - {new Date(notification.created_at).toLocaleDateString()}</AlertTitle>
                      <AlertDescription>
                        {notification.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
            
            <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger 
                  value="form" 
                  disabled={currentStep !== "form" && existingVerification?.status === 'Pending'}
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  1. Personal Information
                </TabsTrigger>
                <TabsTrigger 
                  value="verification" 
                  disabled={currentStep === "form" || (currentStep === "completed" && existingVerification?.status === 'Pending')}
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  2. Document Verification
                </TabsTrigger>
                <TabsTrigger 
                  value="completed" 
                  disabled={currentStep !== "completed" && !existingVerification}
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  3. Verification Status
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="form" className="mt-0">
                <KycForm onSubmit={handleFormSubmit} formData={kycData} />
              </TabsContent>
              
              <TabsContent value="verification" className="mt-0">
                <KycVerification 
                  onComplete={handleVerificationComplete}
                  formData={kycData}
                />
              </TabsContent>
              
              <TabsContent value="completed" className="mt-0">
                <KycCompleted 
                  status={existingVerification?.status?.toLowerCase() as "pending" | "approved" | "rejected" || 'pending'}
                  verificationDetails={existingVerification}
                  onReset={existingVerification?.status === 'Rejected' ? handleKycReset : undefined}
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
