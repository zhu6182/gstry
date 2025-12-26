
// 1. User & Roles
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATIONS = 'OPERATIONS',
  FINANCE = 'FINANCE',
  PARTNER = 'PARTNER',
  DISPATCHER = 'DISPATCHER',
}

export interface User {
  id: string;
  username: string;
  realName: string;
  password?: string;
  role: UserRole;
  status: 'ACTIVE' | 'DISABLED';
  avatar?: string;
  createdAt: string;
  partnerId?: string;
  managedCityCodes?: string[];
  canAddPartner?: boolean;
}

// 2. Partner Management
export interface PartnerPermissions {
  canPublish: boolean;
  canGrab: boolean;
  canCrossCity: boolean;
  canViewCrossCity: boolean;
}

export interface Partner {
  id: string;
  userId: string;
  name: string;
  cityCode: string;
  contactPhone: string;
  levelId: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  permissions: PartnerPermissions;
  businessTypes: string[]; // List of publish titles (expertise areas)
  crossCityCodes: string[]; // Added: Manually configured cities for cross-city access
}

export interface PartnerLevel {
  id: string;
  name: string;
}

export interface CreatePartnerParams {
  name: string;
  contactName: string;
  contactPhone: string;
  cityCode: string;
  username: string;
  businessTypes?: string[];
  crossCityCodes?: string[];
}

// 3. City & Region
export interface CityGroup {
  id: string;
  name: string;
}

export interface City {
  code: string;
  name: string;
  groupId?: string;
  status: 'ACTIVE' | 'DISABLED';
}

// 4. Order Management
export enum OrderStatus {
  PUBLISHED = 'PUBLISHED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  SETTLED = 'SETTLED',
  EXCEPTION = 'EXCEPTION',
  MEDIATING = 'MEDIATING',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  id: string;
  orderNo: string;
  cityCode: string;
  type: string;
  title: string;
  description: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerSource: string;
  
  publishPartnerId: string;
  publishPartnerName: string;
  grabPartnerId?: string;
  grabPartnerName?: string;
  
  publishPrice: number;
  platformFee: number;
  grabPrice: number;
  
  status: OrderStatus;
  createdAt: string;
  grabTime?: string;
  finishTime?: string;
  
  chatAttachments?: string[];
  
  // Exception handling
  exceptionReason?: string;
  exceptionProofUrls?: string[];
  exceptionProofUrl?: string;
  exceptionTime?: string;
  
  appealReason?: string;
  appealTime?: string;
}

export interface OrderType {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PublishTitle {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CustomerSource {
  id: string;
  name: string;
  isActive: boolean;
}

// 5. Finance & Wallet
export interface Wallet {
  partnerId: string;
  balance: number;
  frozenBalance: number;
  updatedAt: string;
}

export interface WalletFlow {
  id: string;
  partnerId: string;
  amount: number;
  flowType: 'INCOME' | 'EXPENSE';
  businessType: 'TOPUP' | 'WITHDRAWAL' | 'GRAB' | 'REFUND' | 'SETTLEMENT';
  description: string;
  createdAt: string;
  orderId?: string;
  orderNo?: string;
  proofUrl?: string;
}

export interface WithdrawalRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  proofUrl?: string;
  rejectReason?: string;
  auditUser?: string;
  auditTime?: string;
}

export interface TopUpRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  proofUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  rejectReason?: string;
  auditUser?: string;
  auditTime?: string;
}

export interface FinanceConfig {
  bankName: string;
  accountName: string;
  accountNumber: string;
  wechatQrUrl?: string;
  alipayQrUrl?: string;
}

export interface CommissionRule {
  id: string;
  cityCode: string;
  orderType: string;
  category: string; // New field: Professional Skill/Domain (PublishTitle.name)
  ruleType: 'PERCENTAGE' | 'FIXED';
  ruleValue: number;
  isActive: boolean;
}

// 6. System & Logs
export interface SystemLog {
  id: string;
  operatorId: string;
  operatorName: string;
  action: string;
  module: string;
  details: string;
  createdAt: string;
  ip?: string;
}

export interface Notification {
  id: string;
  userId: string;     // Target user, or 'ALL'
  title: string;
  content: string;
  type: 'ORDER' | 'SYSTEM' | 'FINANCE';
  isRead: boolean;
  createdAt: string;
}

// 7. System Configuration (SAAS White-labeling)
export interface SystemConfig {
  systemName: string;
  logoUrl: string; // URL or Base64, if empty use default
  loginSubtitle: string;
  copyright: string;
}

// 8. Server Configuration
export interface ServerConfig {
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  apiBaseUrl: string;
  environment: 'DEV' | 'PROD';
}
