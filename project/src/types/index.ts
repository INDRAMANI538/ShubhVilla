export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  flatNumber?: string;
  phoneNumber?: string;
  createdAt: Date;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  flatNumber: string;
  aadharNumber?: string;
  panNumber?: string;
  emergencyContact?: string;
  joinedDate: Date;
  isActive: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  flatNumber: string;
  ownerId: string;
  ownerName: string;
  aadharNumber?: string;
  leaseStartDate: Date;
  leaseEndDate: Date;
  rentAmount: number;
  depositAmount: number;
  isVerified: boolean;
}

export interface MaintenanceRecord {
  id: string;
  flatNumber: string;
  ownerName: string;
  month: string;
  year: number;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  receiptNumber?: string;
  paymentMode?: string;
}

export interface VerificationRequest {
  id: string;
  type: 'tenant' | 'owner' | 'document';
  requesterId: string;
  requesterName: string;
  flatNumber: string;
  documents: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: Date;
  reviewedDate?: Date;
  reviewedBy?: string;
  comments?: string;
}