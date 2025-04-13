import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getKycVerifications, updateKycVerificationStatus } from '@/services/officerServices';
import { KycVerification } from '@/types/officer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, Eye, Download } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface KycVerificationListProps {
  limit?: number;
}

const KycVerificationList: React.FC<KycVerificationListProps> = ({ limit }) => {
  const [verifications, setVerifications] = useState<KycVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<KycVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const { toast } = useToast();

  const [selectedVerification, setSelectedVerification] = useState<KycVerification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchVerifications = async () => {
    setIsLoading(true);
    try {
      const data = await getKycVerifications();
      console.log("Fetched KYC verifications:", data);
      
      // Convert status to lowercase for consistent comparison
      const formattedData = data.map(item => ({
        ...item,
        status: item.status?.toLowerCase() as any
      }));
      
      const limitedData = limit ? formattedData.slice(0, limit) : formattedData;
      setVerifications(limitedData);
      
      // Filter based on active tab
      filterVerificationsByStatus(activeTab, limitedData);
    } catch (error: any) {
      console.error("Error fetching KYC verifications:", error);
      toast({
        title: "Error fetching verifications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [limit]);

  const filterVerificationsByStatus = (status: string, data?: KycVerification[]) => {
    const dataToFilter = data || verifications;
    
    if (status === 'all') {
      setFilteredVerifications(dataToFilter);
    } else {
      const filtered = dataToFilter.filter(v => v.status?.toLowerCase() === status);
      setFilteredVerifications(filtered);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    filterVerificationsByStatus(value);
  };

  const handleStatusUpdate = async (verificationId: number, status: string) => {
    try {
      // If rejecting, use the rejection reason
      const additionalData = status === 'rejected' ? { rejection_reason: rejectionReason } : {};
      
      await updateKycVerificationStatus(verificationId, status, additionalData);
      
      toast({
        title: "Status updated",
        description: `Verification status updated to ${status}`,
      });
      
      // Close the action modal
      setIsActionModalOpen(false);
      setActionType(null);
      setRejectionReason('');
      
      // Refresh the verifications
      fetchVerifications();
    } catch (error: any) {
      console.error("Error updating KYC verification status:", error);
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewDocument = (verification: KycVerification) => {
    setSelectedVerification(verification);
    setIsViewModalOpen(true);
  };

  const openActionModal = (verification: KycVerification, action: 'approve' | 'reject') => {
    setSelectedVerification(verification);
    setActionType(action);
    setIsActionModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shield-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      
        {['pending', 'approved', 'rejected', 'all'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filteredVerifications.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-md">
                <p className="text-gray-500">No {tab !== 'all' ? tab : ''} verifications found</p>
              </div>
            ) : (
              filteredVerifications.map((verification) => (
                <div 
                  key={verification.id} 
                  className="bg-white border rounded-md p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{verification.full_name}</h3>
                      <p className="text-sm text-gray-600">{verification.email}</p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(verification.submission_date).toLocaleString()}
                      </p>
                      <div className="mt-2">
                        {verification.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </span>
                        )}
                        {verification.status === 'approved' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="mr-1 h-3 w-3" />
                            Approved
                          </span>
                        )}
                        {verification.status === 'rejected' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <X className="mr-1 h-3 w-3" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocument(verification)}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      {verification.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openActionModal(verification, 'approve')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => openActionModal(verification, 'reject')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {verification.status === 'rejected' && verification.rejection_reason && (
                    <div className="mt-2 text-sm bg-red-50 border border-red-100 p-2 rounded text-red-700">
                      <span className="font-medium">Reason for rejection:</span> {verification.rejection_reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* View Documents Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Verification Documents</DialogTitle>
            <DialogDescription>
              {selectedVerification?.full_name}'s submitted verification documents
            </DialogDescription>
          </DialogHeader>
          
          {selectedVerification && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ID Front */}
              <div className="border rounded-md p-2">
                <h4 className="text-sm font-medium mb-2">ID Front</h4>
                {selectedVerification.id_front ? (
                  <div className="relative aspect-video">
                    <img 
                      src={selectedVerification.id_front} 
                      alt="ID Front" 
                      className="object-contain w-full h-full rounded-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not provided</p>
                )}
              </div>
              
              {/* ID Back */}
              <div className="border rounded-md p-2">
                <h4 className="text-sm font-medium mb-2">ID Back</h4>
                {selectedVerification.id_back ? (
                  <div className="relative aspect-video">
                    <img 
                      src={selectedVerification.id_back} 
                      alt="ID Back" 
                      className="object-contain w-full h-full rounded-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not provided</p>
                )}
              </div>
              
              {/* Selfie */}
              <div className="border rounded-md p-2">
                <h4 className="text-sm font-medium mb-2">Selfie</h4>
                {selectedVerification.selfie ? (
                  <div className="relative aspect-video">
                    <img 
                      src={selectedVerification.selfie} 
                      alt="Selfie" 
                      className="object-contain w-full h-full rounded-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not provided</p>
                )}
              </div>
            </div>
          )}
          
          {/* Extracted OCR Data */}
          {selectedVerification?.extracted_data && typeof selectedVerification.extracted_data === 'object' && 
           Object.keys(selectedVerification.extracted_data).length > 0 && (
            <div className="mt-4 border rounded-md p-4 bg-blue-50">
              <h4 className="font-medium mb-2">Extracted Information</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedVerification.extracted_data).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-sm font-medium capitalize">{key.replace('_', ' ')}: </span>
                    <span className="text-sm">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Action Confirmation Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Verification' : 'Reject Verification'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? "This will approve the user's identity verification." 
                : "Please provide a reason for rejection."}
            </DialogDescription>
          </DialogHeader>
          
          {actionType === 'reject' && (
            <div className="py-2">
              <Label htmlFor="rejection-reason">Reason for Rejection</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why the verification is being rejected"
                className="mt-1"
                rows={4}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsActionModalOpen(false)}
            >
              Cancel
            </Button>
            {actionType === 'approve' ? (
              <Button 
                onClick={() => selectedVerification?.id && handleStatusUpdate(selectedVerification.id, 'approved')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Confirm Approval
              </Button>
            ) : (
              <Button 
                onClick={() => selectedVerification?.id && handleStatusUpdate(selectedVerification.id, 'rejected')}
                className="bg-red-500 hover:bg-red-600"
                disabled={!rejectionReason.trim()}
              >
                <X className="h-4 w-4 mr-1" />
                Confirm Rejection
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KycVerificationList;
