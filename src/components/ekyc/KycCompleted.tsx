
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';

interface KycCompletedProps {
  status: 'pending' | 'approved' | 'rejected';
  verificationDetails?: any;
  onReset?: () => void;
}

const KycCompleted = ({ status, verificationDetails, onReset }: KycCompletedProps) => {
  const renderStatusIcon = () => {
    switch (status) {
      case 'approved':
        return <ShieldCheck className="h-16 w-16 text-green-500" />;
      case 'rejected':
        return <ShieldAlert className="h-16 w-16 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-16 w-16 text-yellow-500" />;
    }
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
    }
  };

  const renderStatusMessage = () => {
    switch (status) {
      case 'approved':
        return "Congratulations! Your identity has been successfully verified. You now have full access to all features.";
      case 'rejected':
        return `Your verification was rejected. Reason: ${verificationDetails?.rejection_reason || 'Not provided'}. Please review the feedback and try again.`;
      case 'pending':
      default:
        return "Your verification is currently under review. This usually takes 24-48 hours. We'll notify you once the verification is complete.";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {renderStatusIcon()}
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          Verification Status {renderStatusBadge()}
        </CardTitle>
        <CardDescription>
          {renderStatusMessage()}
        </CardDescription>
      </CardHeader>
      
      {verificationDetails && (
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Submission Date</h3>
                <p>{formatDate(verificationDetails.submission_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Email</h3>
                <p>{verificationDetails.email}</p>
              </div>
            </div>
            
            {status === 'approved' && (
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 h-5 w-5 mr-2" />
                  <span className="text-green-700 font-medium">Verification approved</span>
                </div>
                <p className="text-green-600 mt-1 text-sm">
                  Your identity has been verified successfully. You can now access all features.
                </p>
              </div>
            )}
            
            {status === 'rejected' && (
              <div className="mt-4 p-4 bg-red-50 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="text-red-500 h-5 w-5 mr-2" />
                  <span className="text-red-700 font-medium">Verification rejected</span>
                </div>
                <p className="text-red-600 mt-1 text-sm">
                  Reason: {verificationDetails.rejection_reason || 'No reason provided.'}
                </p>
              </div>
            )}
            
            {status === 'pending' && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                <div className="flex items-center">
                  <Clock className="text-yellow-500 h-5 w-5 mr-2" />
                  <span className="text-yellow-700 font-medium">Verification in progress</span>
                </div>
                <p className="text-yellow-600 mt-1 text-sm">
                  Your documents are currently being reviewed. This typically takes 24-48 hours.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
      
      <CardFooter className="flex justify-between">
        {onReset && status === 'rejected' && (
          <Button onClick={onReset}>Start New Verification</Button>
        )}
        {!onReset && (
          <div className="w-full text-center text-gray-500 text-sm">
            {status === 'pending' ? "We'll notify you when the verification process is complete." : ""}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default KycCompleted;
