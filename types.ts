// Enums mapped from DB codes
export enum UserRole {
  ADMIN = 'admin',
  OPERATIONS = 'operator',
  FINANCE = 'finance',
  PARTNER = 'partner'
}

export enum OrderStatus {
  PUBLISHED = 'PUBLISHED',     // 已发布
  PROCESSING = 'PROCESSING',   // 抢单中/执行中
  EXCEPTION = 'EXCEPTION',     // 异常申诉中 (B发起，A待处理)
  MEDIATING = 'MEDIATING',     // 平台介入中 (A拒绝异常，管理员裁决)
  CANCELLED = 'CANCELLED',     // 已取消/已退款 (资金回退B)
  COMPLETED = 'COMPLETED',     // 已完成 (等待结算 - 此状态下资金在A冻结中)
  SETTLED = 'SETTLED'          // 已结算 (资金进入A余额)
}

// 1. 系统用户表 (sys_user)
export interface User {
  id: string;
  username: string; // 账号 (手机/工号)
  realName: string; // 真实姓名
  password?: string; // 密码 (Mock用，实际应加密)
  role: UserRole;   // 角色类型
  status: 'ACTIVE' | 'DISABLED';
  avatar: string;   // 前端展示用
  createdAt: string;
  // 前端辅助字段
  partnerId?: string; 
  // 权限控制字段 (二级管理)
  managedCityCodes?: string[]; // 该用户负责的城市代码列表 (空代表无限制或未分配)
  canAddPartner?: boolean; // 是否拥有新增合伙人的权限 (仅针对运营角色)
}

// 6. 合伙人表 (partner)
export interface Partner {
  id: string;
  userId: string;     // 关联 sys_user
  name: string;       // 合伙人/公司名称
  cityCode: string;   // 所属城市
  contactPhone: string;
  levelId: string;    // 合伙人等级
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  
  // 3. & 5. 权限配置 (简化版，聚合展示)
  permissions: {
    canPublish: boolean;
    canGrab: boolean;     // 接单权限
    canCrossCity: boolean;
    canViewCrossCity: boolean;
  };
}

// DTO for creating a new partner
export interface CreatePartnerParams {
  name: string;
  contactPhone: string;
  cityCode: string;
  contactName: string; // For creating the User realName
  username: string;    // For creating the User username
}

// 7. 合伙人等级 (partner_level)
export interface PartnerLevel {
  id: string;
  levelName: string;
  grabLimit: number;   // 抢单上限
  publishLimit: number; // 发布上限
}

// 8. 订单主表 (order) - 核心
export interface Order {
  id: string;
  orderNo: string;     // 业务订单号
  cityCode: string;    // 服务城市
  type: string;        // 订单类型
  
  publishPartnerId: string; // 发布方
  publishPartnerName: string; // 冗余显示
  
  grabPartnerId?: string;   // 接单方
  grabPartnerName?: string; // 冗余显示
  
  // 金额结果字段 (不反算)
  publishPrice: number; // 发布价 (给发布方)
  grabPrice: number;    // 接单价 (接单方支付)
  platformFee: number;  // 平台抽成
  
  status: OrderStatus;
  
  title: string;       // 资源描述/标题
  description: string; // 详情
  
  // --- 新增客户信息字段 ---
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerSource?: string; // e.g. '抖音', '小红书', '转介绍'
  chatAttachments?: string[]; // 聊天记录图片URL列表
  
  // --- 异常处理字段 ---
  exceptionReason?: string;
  exceptionProofUrl?: string; // Deprecated, keep for legacy
  exceptionProofUrls?: string[]; // New: Support multiple images
  exceptionTime?: string;
  
  // --- 申诉(反驳)字段 ---
  appealReason?: string; // A拒绝B异常时的理由
  appealTime?: string;

  grabTime?: string;   // 抢单时间
  finishTime?: string; // 完成时间
  createdAt: string;
}

// 10. 抽成规则 (commission_rule)
export interface CommissionRule {
  id: string;
  cityCode: string;    // 'ALL' or specific city code
  orderType: string;   // 'ALL' or specific type
  ruleType: 'FIXED' | 'PERCENTAGE';
  ruleValue: number;   // e.g. 30 for fixed, 10 for 10%
  isActive: boolean;
}

// 13. 合伙人资金账户 (partner_wallet)
export interface Wallet {
  partnerId: string;
  balance: number;       // 可用余额
  frozenBalance: number; // 冻结金额
  updatedAt: string;
}

// 14. 资金流水 (wallet_flow)
export interface WalletFlow {
  id: string;
  partnerId: string;
  orderId?: string; // Optional
  orderNo?: string; // Optional
  amount: number;
  flowType: 'INCOME' | 'EXPENSE'; // 收入 / 支出
  businessType: 'GRAB' | 'SETTLEMENT' | 'WITHDRAWAL' | 'TOPUP' | 'REFUND';
  description: string;
  proofUrl?: string; // Optional: Evidence image for Top-ups (Manual or Approved) or Withdrawals
  createdAt: string;
}

// 15. 提现申请 (withdraw_apply)
export interface WithdrawalRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  auditUser?: string;
  createdAt: string;
  auditTime?: string;
  proofUrl?: string; // 提现转账凭证
  rejectReason?: string; // 驳回原因
}

// 21. 充值申请 (topup_apply) - NEW
export interface TopUpRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  proofUrl: string; // URL to the uploaded image
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  auditUser?: string;
  createdAt: string;
  auditTime?: string;
  rejectReason?: string; // 驳回原因
}

// 22. 财务配置 (finance_config) - UPDATED
export interface FinanceConfig {
  bankName: string;
  accountName: string;
  accountNumber: string;
  wechatQrUrl?: string; // Optional WeChat Pay QR
  alipayQrUrl?: string; // Optional Alipay QR
}

// 城市区域分组
export interface CityGroup {
  id: string;
  name: string;
}

// 16. 城市表 (city)
export interface City {
  code: string;
  name: string;
  groupId?: string; // 所属区域ID
  status: 'ACTIVE' | 'DISABLED';
}

// 17. 订单类型 (order_type)
export interface OrderType {
  id: string;
  name: string;
  isActive: boolean;
}

// 20. 发布标题配置 (publish_title)
export interface PublishTitle {
  id: string;
  name: string;
  isActive: boolean;
}

// 18. 操作日志 (sys_log)
export interface SystemLog {
  id: string;
  operatorId: string;
  operatorName: string;
  action: string;      // e.g., 'ADD_PARTNER', 'UPDATE_RULE'
  module: string;      // e.g., 'PARTNER', 'FINANCE'
  details: string;
  createdAt: string;
  ip?: string;
}

// 19. 通知消息 (notification)
export interface Notification {
  id: string;
  userId: string;     // Target user, or 'ALL'
  title: string;
  content: string;
  type: 'ORDER' | 'SYSTEM' | 'FINANCE';
  isRead: boolean;
  createdAt: string;
}