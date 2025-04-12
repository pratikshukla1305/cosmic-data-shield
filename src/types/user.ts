
export interface User {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: Date | string;
  lastLoginAt?: Date | string;
  reports?: string[]; // Report IDs
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date | string;
  reportId?: string;
}

export type NotificationType = 'report_status' | 'system' | 'alert' | 'tip';

export interface KycVerification {
  id: string;
  userId: string;
  status: 'pending' | 'verified' | 'rejected';
  documentType: 'national_id' | 'passport' | 'drivers_license';
  documentNumber: string;
  documentImageUrl: string;
  selfieImageUrl: string;
  submittedAt: Date | string;
  reviewedAt?: Date | string;
  reviewedBy?: string;
  rejectionReason?: string;
}
