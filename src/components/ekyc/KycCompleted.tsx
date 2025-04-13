
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, AlertTriangle } from 'lucide-react';
import { getUserVerificationStatus, VerificationStatus } from '@/data/kycVerificationsData';
import { supabase } from '@/integrations/supabase/client';

interface KycCompletedProps {
  status?: VerificationStatus;
  userId?: string;
  onReset?: () => void;
}

const KycCompleted = ({ 
  status: initialStatus = 'pending',
  userId = "user-123",
  onReset 
}: KycCompletedProps) => {
  const [status, setStatus] = useState<VerificationStatus>(initialStatus);
  
  // Poll for status updates (in a real app this would use websockets or a real-time database)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check current status from database
        if (userId) {
          const { data, error } = await supabase
            .from('kyc_verifications')
            .select('status')
            .eq('user_id', userId)
            .order('submission_date', { ascending: false })
            .limit(1)
            .single();
            
          if (!error && data) {
            const dbStatus = data.status?.toLowerCase() as VerificationStatus;
            if (dbStatus && dbStatus !== status) {
              setStatus(dbStatus);
            }
          }
        } else {
          // Fallback to mock data if no userId
          const currentStatus = getUserVerificationStatus(userId);
          if (currentStatus !== 'none' && currentStatus !== status) {
            setStatus(currentStatus);
          }
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    };
    
    // Check immediately and then set interval
    checkStatus();
    
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [userId, status, initialStatus]);
  
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Identity Verification Status</CardTitle>
        <CardDescription>
          {status === 'pending' 
            ? 'Your verification is being reviewed by our team'
            : status === 'approved'
              ? 'Your identity has been successfully verified'
              : 'Please check your document details and try again'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-6">
        {status === 'pending' && (
          <div className="text-center">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100 mb-4">
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Verification In Progress</h3>
            <p className="text-gray-500 mb-4">
              We're currently reviewing your submitted documents. This typically takes 1-2 business days.
            </p>
          </div>
        )}
        
        {status === 'approved' && (
          <div className="text-center">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Verification Approved</h3>
            <p className="text-gray-500 mb-4">
              Your identity has been successfully verified. You now have full access to all features.
            </p>
          </div>
        )}
        
        {status === 'rejected' && (
          <div className="text-center">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-100 mb-4">
              <X className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Verification Needs Attention</h3>
            <p className="text-gray-500 mb-4">
              We need some additional information to complete your verification. Please try again with clearer documents.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Try again with:</h4>
                <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                  <li>Clear, well-lit photos of your documents</li>
                  <li>Make sure your full face is visible in the selfie</li>
                  <li>Ensure all document corners are visible</li>
                  <li>All text on documents should be legible</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {status === 'rejected' && (
          <Button 
            className="w-full max-w-xs" 
            onClick={onReset ? onReset : () => window.location.reload()}
          >
            Try Again
          </Button>
        )}
        {status === 'approved' && (
          <Button variant="outline" className="w-full max-w-xs" onClick={() => window.location.href = "/"}>
            Return to Home
          </Button>
        )}
        {status === 'pending' && (
          <Button variant="outline" className="w-full max-w-xs" onClick={() => window.location.href = "/"}>
            Return Later
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default KycCompleted;
