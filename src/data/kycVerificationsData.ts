
// Define the type for KYC verification status
export type VerificationStatus = "pending" | "approved" | "rejected" | "none";

// Store user verification statuses - in a real app, this would come from the database
const userVerifications: Record<string, VerificationStatus> = {
  "user-123": "approved",
  "user-456": "pending",
  "user-789": "rejected"
};

// Get user verification status
export const getUserVerificationStatus = (userId: string): VerificationStatus => {
  return userVerifications[userId] || "none";
};

// Update user verification status - in a real app, this would update the database
export const updateUserVerificationStatus = (userId: string, status: VerificationStatus): void => {
  userVerifications[userId] = status;
};
