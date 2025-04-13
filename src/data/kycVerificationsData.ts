
// This file contains types and mock data for KYC verifications

export type VerificationStatus = "pending" | "approved" | "rejected" | "none";

export interface KycDocumentData {
  id: string;
  type: string;
  url: string;
  extractedData?: any;
  created_at?: string;
}

export interface KycVerificationData {
  id: number;
  fullName: string;
  email: string;
  submissionDate: string;
  status: VerificationStatus;
  idFrontUrl?: string;
  idBackUrl?: string;
  selfieUrl?: string;
  documents?: KycDocumentData[];
  extractedData?: any;
  ocrStatus?: string;
}

export const mockKycVerifications: KycVerificationData[] = [
  {
    id: 1,
    fullName: "John Doe",
    email: "john@example.com",
    submissionDate: "2024-04-01T10:30:00Z",
    status: "approved",
    idFrontUrl: "https://example.com/id-front.jpg",
    idBackUrl: "https://example.com/id-back.jpg",
    selfieUrl: "https://example.com/selfie.jpg",
    documents: [
      {
        id: "1",
        type: "aadhar_front",
        url: "https://example.com/id-front.jpg"
      },
      {
        id: "2",
        type: "aadhar_back",
        url: "https://example.com/id-back.jpg"
      },
      {
        id: "3",
        type: "selfie",
        url: "https://example.com/selfie.jpg"
      }
    ]
  },
  {
    id: 2,
    fullName: "Jane Smith",
    email: "jane@example.com",
    submissionDate: "2024-04-02T14:45:00Z",
    status: "pending",
    idFrontUrl: "https://example.com/id-front-2.jpg",
    idBackUrl: "https://example.com/id-back-2.jpg",
    selfieUrl: "https://example.com/selfie-2.jpg"
  },
  {
    id: 3,
    fullName: "Bob Johnson",
    email: "bob@example.com",
    submissionDate: "2024-04-03T09:15:00Z",
    status: "rejected",
    idFrontUrl: "https://example.com/id-front-3.jpg",
    idBackUrl: "https://example.com/id-back-3.jpg",
    selfieUrl: "https://example.com/selfie-3.jpg"
  }
];

// This function determines verification status for a user
export const getUserVerificationStatus = (userId: string): VerificationStatus => {
  // In a real application, this would call an API or check a database
  // For now, we'll just return a random status for demonstration purposes
  const statuses: VerificationStatus[] = ["pending", "approved", "rejected"];
  
  // For deterministic behavior in development (based on userId)
  const userIdSum = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const statusIndex = userIdSum % statuses.length;
  
  return statuses[statusIndex];
};
