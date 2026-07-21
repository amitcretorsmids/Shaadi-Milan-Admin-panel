import { Timestamp } from "firebase/firestore";
export type Gender = 'Male' | 'Female';
export type UserType = 'Male' | 'Female' | 'Agent';
export type UserStatus = 'Active' | 'Pending' | 'Verified' | 'Suspended' | 'Rejected';
export type PaymentStatus = 'Paid' | 'Unpaid';
export type OrderStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';
export type PlanType = 'Standard' | 'Premium' | 'VIP';
export type FilterPeriod = 'Weekly' | 'Monthly' | 'Custom';
export type NotifTarget = 'Male' | 'Female' | 'Agent' | 'All';
export type ApprovalAction = 'Approved' | 'Rejected';

export type OriginalGender = 'male' | 'female';


// Updated User interface matching Firebase
export interface OriginalUser {
  uid: string;                    // Firebase UID
  fullName: string;               // Changed from 'name'
  gender: OriginalGender;                 // 'male' or 'female'
  phone: string;
  email: string;
  agentId: string;                // Agent's Firebase UID
  role: 'user' | 'admin';
  platform: 'android' | 'ios' | 'web';
  isProfileCreated: boolean;
  agentNotifiedOnRegister: boolean;
  agentNotifiedAt?: Timestamp | string;
  createdAt: Timestamp | string;
  fcmToken?: string;
  fcmTokenUpdatedAt?: Timestamp | string;
  
}


// Updated Agent interface matching Firebase
export interface OriginalAgent {
  uid: string;                    // Firebase UID
  agentId: string;                // Custom agent ID (e.g., "81266")
  agentName: string;
  agentEmail: string;
  agentMobile: string;
  agentAddress: string;
  agentCity: string;
  agentState: string;
  agentPincode: string;
  agentAadhar: string;
  agentLicenseNumber: string;
  isApproved: boolean;
  isRejected: boolean;
  role: 'admin' | 'user';
  platform: string;
  registrationDate: string;
  aadharUrl?: string;
  primaryImageUrl?: string;
  profileImageUrl?: string;
  
  
}





export interface User {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  state: string;
  district: string;
  agentId: string;
  status: UserStatus;
  paid: boolean;
  plan?: PlanType;
  phone: string;
  email: string;
  joinedAt: string;
  photo?: string;
  fixedWith?: string;
  marriageDate?: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  district: string;
  joinedAt: string;
  status: 'Active' | 'Inactive';
  usersAdded: number;
  usersPaid: number;
  conversionRate: number;
  totalRevenue: number;
  thisWeekReg: number;
  lastWeekReg: number;
  thisWeekFixed: number;
  lastWeekFixed: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userType: UserType;
  plan: PlanType;
  amount: number;
  date: string;
  status: OrderStatus;
  agentId: string;
}

export interface PendingApproval {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  state: string;
  district: string;
  agentId: string;
  issue: string;
  submittedAt: string;
  documents: string[];
}

export interface Notification {
  id: string;
  target: NotifTarget;
  title: string;
  message: string;
  sentAt: string;
  sentTo: number;
  status: 'Delivered' | 'Pending' | 'Failed';
}

export interface DashboardStats {
  totalRegistrations: number;
  maleFixed: number;
  femaleFixed: number;
  maleMarried: number;
  femaleMarried: number;
  totalAgents: number;
  activeAgents: number;
  pendingApprovals: number;
  monthlyRevenue: number;
  registrationGrowth: number;
  fixedGrowth: number;
  marriageGrowth: number;
}

export interface MonthlyData {
  month: string;
  male: number;
  female: number;
  agent: number;
  maleFixed: number;
  femaleFixed: number;
  marriages: number;
  revenue: number;
}

export interface WeeklyData {
  week: string;
  registrations: number;
  fixed: number;
  revenue: number;
}

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'viewer';
  avatar?: string;
}
