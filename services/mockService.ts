import { User, UserRole, Partner, PartnerLevel, Order, OrderStatus, Wallet, City, CityGroup, WalletFlow, WithdrawalRequest, TopUpRequest, FinanceConfig, CreatePartnerParams, CommissionRule, SystemLog, Notification, OrderType, PublishTitle } from '../types';

const MOCK_CITY_GROUPS: CityGroup[] = [
  { id: 'g1', name: '华东区域' },
  { id: 'g2', name: '华北区域' },
  { id: 'g3', name: '华南区域' },
];

const MOCK_CITIES: City[] = [
  { code: 'SH', name: '上海', groupId: 'g1', status: 'ACTIVE' },
  { code: 'HZ', name: '杭州', groupId: 'g1', status: 'ACTIVE' },
  { code: 'BJ', name: '北京', groupId: 'g2', status: 'ACTIVE' },
  { code: 'GZ', name: '广州', groupId: 'g3', status: 'ACTIVE' },
  { code: 'SZ', name: '深圳', groupId: 'g3', status: 'ACTIVE' },
  { code: 'CD', name: '成都', groupId: 'g3', status: 'ACTIVE' },
];

const MOCK_ORDER_TYPES: OrderType[] = [
  { id: 't1', name: '客咨', isActive: true },
  { id: 't2', name: '上门服务', isActive: true },
];

const MOCK_PUBLISH_TITLES: PublishTitle[] = [
  { id: 'pt1', name: '家具改色', isActive: true },
  { id: 'pt2', name: '坐垫定制', isActive: true },
];

const MOCK_RULES: CommissionRule[] = [
  { id: 'r1', cityCode: 'ALL', orderType: 'ALL', ruleType: 'PERCENTAGE', ruleValue: 10, isActive: true }, // 默认抽成 10%
  { id: 'r2', cityCode: 'SH', orderType: '上门服务', ruleType: 'FIXED', ruleValue: 200, isActive: true }, // 上海服务固定抽 200
];

const MOCK_USERS: User[] = [
  // 内部人员
  { id: 'u1', username: 'admin', realName: '超级管理员', password: '123', role: UserRole.ADMIN, status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', createdAt: '2023-01-01' },
  { id: 'u2', username: 'ops001', realName: '王运营', password: '123', role: UserRole.OPERATIONS, status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ops', createdAt: '2023-01-01', managedCityCodes: ['SH', 'HZ'], canAddPartner: true },
  { id: 'u3', username: 'fin001', realName: '李财务', password: '123', role: UserRole.FINANCE, status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fin', createdAt: '2023-01-01' },
  
  // 合伙人 (手机号作为账号)
  // P1: 上海发布大户
  { id: 'u4', username: '13800138001', realName: '张总(上海)', password: '123', role: UserRole.PARTNER, partnerId: 'p1', status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p1', createdAt: '2023-02-01' },
  // P2: 北京抢单大户
  { id: 'u5', username: '13900139002', realName: '刘工(北京)', password: '123', role: UserRole.PARTNER, partnerId: 'p2', status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p2', createdAt: '2023-02-15' },
  // P3: 广州新合伙人 (测试提现)
  { id: 'u6', username: '13700137003', realName: '陈经理(广州)', password: '123', role: UserRole.PARTNER, partnerId: 'p3', status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p3', createdAt: '2023-03-10' },
];

const MOCK_PARTNERS: Partner[] = [
  {
    id: 'p1',
    userId: 'u4',
    name: '上海智汇网络科技有限公司',
    cityCode: 'SH',
    contactPhone: '13800138001',
    levelId: 'L3',
    status: 'ACTIVE',
    createdAt: '2023-02-01',
    permissions: { canPublish: true, canGrab: true, canCrossCity: true, canViewCrossCity: true }
  },
  {
    id: 'p2',
    userId: 'u5',
    name: '北京极速开发工作室',
    cityCode: 'BJ',
    contactPhone: '13900139002',
    levelId: 'L2',
    status: 'ACTIVE',
    createdAt: '2023-02-15',
    permissions: { canPublish: true, canGrab: true, canCrossCity: false, canViewCrossCity: true }
  },
  {
    id: 'p3',
    userId: 'u6',
    name: '广州创意坊文化传媒',
    cityCode: 'GZ',
    contactPhone: '13700137003',
    levelId: 'L1',
    status: 'ACTIVE',
    createdAt: '2023-03-10',
    permissions: { canPublish: false, canGrab: true, canCrossCity: false, canViewCrossCity: false }
  }
];

const MOCK_WALLETS: Wallet[] = [
  { partnerId: 'p1', balance: 48000.00, frozenBalance: 0.00, updatedAt: new Date().toISOString() },
  { partnerId: 'p2', balance: 1170.00, frozenBalance: 10630.00, updatedAt: new Date().toISOString() }, 
  { partnerId: 'p3', balance: 2000.00, frozenBalance: 3000.00, updatedAt: new Date().toISOString() }, 
];

const MOCK_WALLET_FLOWS: WalletFlow[] = [
  { id: 'wf1', partnerId: 'p1', amount: 50000, flowType: 'INCOME', businessType: 'TOPUP', description: '银行转账充值 (初始资金)', createdAt: '2023-09-01T10:00:00Z' },
];

const MOCK_WITHDRAWALS: WithdrawalRequest[] = [];
const MOCK_TOPUPS: TopUpRequest[] = [];

const DEFAULT_FINANCE_CONFIG: FinanceConfig = {
  bankName: '招商银行上海分行',
  accountName: 'PartnerNexus 平台运营中心',
  accountNumber: '6225 8888 8888 8888',
  wechatQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WeChatPay_PartnerNexus',
  alipayQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Alipay_PartnerNexus',
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    orderNo: 'ORD202310010001',
    cityCode: 'SH',
    type: '上门服务',
    title: '家具改色',
    description: '客户需要老式红木家具翻新改色，要求上门服务，工期约3天。',
    customerName: '李先生',
    customerPhone: '13911112222',
    customerAddress: '上海市静安区南京西路1266号',
    customerSource: '小红书',
    publishPartnerId: 'p1',
    publishPartnerName: '上海智汇网络科技有限公司',
    grabPartnerId: 'p2',
    grabPartnerName: '北京极速开发工作室',
    publishPrice: 8000,
    platformFee: 200,
    grabPrice: 8200,
    status: OrderStatus.SETTLED,
    createdAt: '2023-10-01T09:00:00Z',
    grabTime: '2023-10-01T10:30:00Z',
    finishTime: '2023-10-14T10:00:00Z',
  },
  {
    id: 'ord-004',
    orderNo: 'ORD202310210088',
    cityCode: 'HZ',
    type: '客咨',
    title: '坐垫定制',
    description: '杭州余杭区办公楼批量采购工位坐垫，约200个。',
    customerName: '赵经理',
    customerPhone: '13555554444',
    customerAddress: '杭州市余杭区阿里巴巴园区附近',
    customerSource: '线下门店',
    publishPartnerId: 'p1',
    publishPartnerName: '上海智汇网络科技有限公司',
    publishPrice: 15000,
    platformFee: 1500,
    grabPrice: 16500,
    status: OrderStatus.PUBLISHED,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  }
];

const MOCK_LOGS: SystemLog[] = [];
const MOCK_NOTIFICATIONS: Notification[] = [];

class MockService {
  private users = MOCK_USERS;
  private partners = MOCK_PARTNERS;
  private orders = MOCK_ORDERS;
  private wallets = MOCK_WALLETS;
  private flows = MOCK_WALLET_FLOWS;
  private withdrawals = MOCK_WITHDRAWALS;
  private topUps = MOCK_TOPUPS;
  private financeConfig = DEFAULT_FINANCE_CONFIG;
  private cities = MOCK_CITIES;
  private cityGroups = MOCK_CITY_GROUPS;
  private rules = MOCK_RULES;
  private logs = MOCK_LOGS;
  private notifications = MOCK_NOTIFICATIONS;
  private orderTypes = MOCK_ORDER_TYPES;
  private publishTitles = MOCK_PUBLISH_TITLES;

  private addLog(operatorId: string, operatorName: string, action: string, module: string, details: string) {
    const newLog: SystemLog = {
      id: `l-${Date.now()}`,
      operatorId,
      operatorName,
      action,
      module,
      details,
      createdAt: new Date().toISOString()
    };
    this.logs.unshift(newLog);
  }

  // --- Notification Helpers ---
  private sendNotification(userId: string, title: string, content: string, type: 'ORDER' | 'SYSTEM' | 'FINANCE') {
     this.notifications.unshift({
      id: `n-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      userId,
      title,
      content,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  private broadcastNotification(roles: UserRole[], title: string, content: string, type: 'ORDER' | 'SYSTEM' | 'FINANCE') {
      const targets = this.users.filter(u => roles.includes(u.role));
      targets.forEach(u => this.sendNotification(u.id, title, content, type));
  }

  resetSystemData() {
    this.users = this.users.filter(u => u.role === UserRole.ADMIN && u.username === 'admin');
    this.partners = [];
    this.orders = [];
    this.wallets = [];
    this.flows = [];
    this.withdrawals = [];
    this.topUps = [];
    this.logs = [];
    this.notifications = [];
    this.cities = [...MOCK_CITIES];
    this.cityGroups = [...MOCK_CITY_GROUPS];
    this.orderTypes = [...MOCK_ORDER_TYPES];
    this.publishTitles = [...MOCK_PUBLISH_TITLES];
    this.financeConfig = {...DEFAULT_FINANCE_CONFIG};
    this.rules = [...MOCK_RULES];
    this.addLog('admin', '超级管理员', 'SYSTEM_RESET', 'SYSTEM', '执行了系统数据一键清空/重置');
  }

  authenticate(username: string, pass: string): User | null {
    const user = this.users.find(u => u.username === username && u.password === pass);
    if (user) {
      this.addLog(user.id, user.realName, 'LOGIN', 'AUTH', '用户通过密码登录系统');
      return user;
    }
    return null;
  }

  // --- Users & Partners ---

  getPartners(): Partner[] {
    return this.partners;
  }

  getPartnerById(id: string): Partner | undefined {
    return this.partners.find(p => p.id === id);
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getInternalUsers(): User[] {
    return this.users.filter(u => u.role !== UserRole.PARTNER);
  }

  addPartner(data: CreatePartnerParams) {
    const newUserId = `u-${Date.now()}`;
    const newPartnerId = `p-${Date.now()}`;
    
    // Create User Account
    const newUser: User = {
      id: newUserId,
      username: data.username,
      realName: data.contactName,
      password: '123',
      role: UserRole.PARTNER,
      partnerId: newPartnerId,
      status: 'ACTIVE',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUserId}`,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);

    // Create Partner Profile
    const newPartner: Partner = {
      id: newPartnerId,
      userId: newUserId,
      name: data.name,
      cityCode: data.cityCode,
      contactPhone: data.contactPhone,
      levelId: 'L1',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      permissions: { canPublish: true, canGrab: true, canCrossCity: false, canViewCrossCity: false }
    };
    this.partners.push(newPartner);

    // Create Wallet
    this.wallets.push({
      partnerId: newPartnerId,
      balance: 0,
      frozenBalance: 0,
      updatedAt: new Date().toISOString()
    });

    this.addLog('admin', '管理员', 'ADD_PARTNER', 'PARTNER', `新增合伙人: ${data.name}`);
  }

  updatePartner(id: string, data: Partial<Partner & { contactName: string }>) {
    const partner = this.partners.find(p => p.id === id);
    if (partner) {
      if (data.name) partner.name = data.name;
      if (data.cityCode) partner.cityCode = data.cityCode;
      if (data.contactPhone) partner.contactPhone = data.contactPhone;
      
      const user = this.users.find(u => u.id === partner.userId);
      if (user) {
        if (data.contactName) user.realName = data.contactName;
        // Sync username if phone changed (as phone is username)
        if (data.contactPhone) user.username = data.contactPhone;
      }
      this.addLog('admin', '管理员', 'UPDATE_PARTNER', 'PARTNER', `更新合伙人信息: ${partner.name}`);
    }
  }

  deletePartner(id: string) {
    const partner = this.partners.find(p => p.id === id);
    if (partner) {
      this.partners = this.partners.filter(p => p.id !== id);
      this.users = this.users.filter(u => u.id !== partner.userId);
      this.wallets = this.wallets.filter(w => w.partnerId !== id);
      this.addLog('admin', '管理员', 'DELETE_PARTNER', 'PARTNER', `删除合伙人: ${partner.name}`);
    }
  }

  updatePartnerStatus(id: string, status: 'ACTIVE' | 'DISABLED') {
    const partner = this.partners.find(p => p.id === id);
    if (partner) {
      partner.status = status;
      const user = this.users.find(u => u.id === partner.userId);
      if (user) user.status = status;
      this.addLog('admin', '管理员', 'UPDATE_STATUS', 'PARTNER', `${status === 'ACTIVE' ? '启用' : '停用'}合伙人: ${partner.name}`);
    }
  }

  updatePartnerPermissions(id: string, permissions: Partner['permissions']) {
    const partner = this.partners.find(p => p.id === id);
    if (partner) {
      partner.permissions = permissions;
      this.addLog('admin', '管理员', 'UPDATE_PERM', 'PARTNER', `更新合伙人权限: ${partner.name}`);
    }
  }

  adminResetPassword(adminId: string, userId: string, newPass: string) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.password = newPass;
      this.addLog(adminId, '管理员', 'RESET_PWD', 'AUTH', `重置用户 ${user.realName} 密码`);
    }
  }

  changePassword(userId: string, newPass: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.password = newPass;
      this.addLog(userId, user.realName, 'CHANGE_PWD', 'AUTH', '修改个人密码');
      return true;
    }
    return false;
  }

  // --- Internal Users ---
  
  addInternalUser(data: { username: string, realName: string, role: UserRole, canAddPartner?: boolean }) {
    const newUser: User = {
      id: `u-${Date.now()}`,
      username: data.username,
      realName: data.realName,
      password: '123',
      role: data.role,
      status: 'ACTIVE',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      createdAt: new Date().toISOString(),
      canAddPartner: data.role === UserRole.OPERATIONS ? !!data.canAddPartner : undefined
    };
    this.users.push(newUser);
    this.addLog('admin', '管理员', 'ADD_USER', 'SYSTEM', `添加内部人员: ${data.realName}`);
  }

  deleteInternalUser(id: string) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      this.users = this.users.filter(u => u.id !== id);
      this.addLog('admin', '管理员', 'DELETE_USER', 'SYSTEM', `删除内部人员: ${user.realName}`);
    }
  }

  updateInternalUserRights(id: string, cityCodes: string[], canAddPartner: boolean) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.managedCityCodes = cityCodes;
      user.canAddPartner = canAddPartner;
      this.addLog('admin', '管理员', 'UPDATE_RIGHTS', 'SYSTEM', `更新人员权限: ${user.realName}`);
    }
  }

  // --- Orders ---

  getOrders(): Order[] {
    return this.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createOrder(data: any) {
    // 1. Calculate Fee
    let fee = 0;
    const rule = this.findMatchingRule(data.cityCode, data.type);
    if (rule.ruleType === 'PERCENTAGE') {
      const rawFee = data.publishPrice * (rule.ruleValue / 100);
      fee = Math.round(rawFee * 100) / 100;
    } else {
      fee = rule.ruleValue;
    }
    
    // 2. Determine Grab Price
    const grabPrice = Math.round((data.publishPrice + fee) * 100) / 100;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNo: `ORD${new Date().toISOString().slice(0,10).replace(/-/g,'')}${Math.floor(Math.random()*10000)}`,
      status: OrderStatus.PUBLISHED,
      createdAt: new Date().toISOString(),
      platformFee: fee,
      grabPrice: grabPrice,
      // @ts-ignore
      publishPartnerId: data.publishPartnerId,
      publishPartnerName: data.publishPartnerName,
      publishPrice: data.publishPrice,
      cityCode: data.cityCode,
      type: data.type,
      title: data.title,
      description: data.description,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      customerSource: data.customerSource,
      chatAttachments: data.chatAttachments
    };
    this.orders.unshift(newOrder);
    this.addLog(data.publishPartnerId, data.publishPartnerName, 'PUBLISH_ORDER', 'ORDER', `发布订单 ${newOrder.orderNo}`);
    return newOrder;
  }

  // Logic Change: B pays -> Money moves to A's Frozen Wallet immediately
  grabOrder(orderId: string, partnerId: string, partnerName: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order || order.status !== OrderStatus.PUBLISHED) return false;

    // 1. Process Buyer (Grabber) - Pay the full Grab Price
    const buyerWallet = this.wallets.find(w => w.partnerId === partnerId);
    if (!buyerWallet || buyerWallet.balance < order.grabPrice) return false;

    buyerWallet.balance -= order.grabPrice;
    // Note: We don't freeze money in B's wallet anymore, we transfer it.
    
    this.flows.unshift({
      id: `wf-${Date.now()}-b`,
      partnerId,
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.grabPrice,
      flowType: 'EXPENSE',
      businessType: 'GRAB',
      description: `抢单支付: ${order.title}`,
      createdAt: new Date().toISOString()
    });

    // 2. Process Seller (Publisher) - Receive money into FROZEN balance
    // Note: Only receive the Publish Price (Platform keeps the fee difference)
    const sellerWallet = this.wallets.find(w => w.partnerId === order.publishPartnerId);
    if (sellerWallet) {
      sellerWallet.frozenBalance += order.publishPrice;
    }

    // Update Order
    order.status = OrderStatus.PROCESSING;
    order.grabPartnerId = partnerId;
    order.grabPartnerName = partnerName;
    order.grabTime = new Date().toISOString();

    this.addLog(partnerId, partnerName, 'GRAB_ORDER', 'ORDER', `抢单成功 ${order.orderNo}`);
    
    // Notification for Publisher
    const pubUser = this.partners.find(p => p.id === order.publishPartnerId)?.userId;
    if (pubUser) {
        this.sendNotification(pubUser, '订单被抢', `您的订单 ${order.orderNo} 已被 ${partnerName} 接单，资金已冻结。`, 'ORDER');
    }

    return true;
  }

  updateOrderStatus(orderId: string, status: OrderStatus, userId: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    const oldStatus = order.status;
    order.status = status;
    
    if (status === OrderStatus.COMPLETED) {
      order.finishTime = new Date().toISOString();
      // Notify Publisher: Order completed, wait for settlement
      const pubUser = this.partners.find(p => p.id === order.publishPartnerId)?.userId;
      if (pubUser) this.sendNotification(pubUser, '订单完成待验收', `订单 ${order.orderNo} 接单方已标记完成，请验收并结算。`, 'ORDER');
    }

    if (status === OrderStatus.CANCELLED) {
        // Notify both
        const pubUser = this.partners.find(p => p.id === order.publishPartnerId)?.userId;
        const grabUser = order.grabPartnerId ? this.partners.find(p => p.id === order.grabPartnerId)?.userId : null;
        if (pubUser) this.sendNotification(pubUser, '订单已取消', `订单 ${order.orderNo} 已强制取消。`, 'ORDER');
        if (grabUser) this.sendNotification(grabUser, '订单已取消', `订单 ${order.orderNo} 已强制取消。`, 'ORDER');
    }

    const user = this.users.find(u => u.id === userId);
    this.addLog(userId, user?.realName || 'System', 'UPDATE_ORDER', 'ORDER', `更新订单 ${order.orderNo} 状态: ${oldStatus} -> ${status}`);
    return true;
  }

  reportOrderException(orderId: string, reason: string, proofs: string[]): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = OrderStatus.EXCEPTION;
    order.exceptionReason = reason;
    order.exceptionProofUrls = proofs;
    order.exceptionTime = new Date().toISOString();
    
    // Notify Publisher
    const pubUser = this.partners.find(p => p.id === order.publishPartnerId)?.userId;
    if (pubUser) this.sendNotification(pubUser, '订单异常申诉', `订单 ${order.orderNo} 接单方发起了异常申诉，请处理。`, 'ORDER');

    this.addLog(order.grabPartnerId!, order.grabPartnerName!, 'REPORT_EXCEPTION', 'ORDER', `订单异常申诉 ${order.orderNo}`);
    return true;
  }

  // Publisher appeals/rejects the exception -> Escalates to Admin (MEDIATING)
  appealOrderException(orderId: string, reason: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order || order.status !== OrderStatus.EXCEPTION) return false;

    order.status = OrderStatus.MEDIATING;
    order.appealReason = reason;
    order.appealTime = new Date().toISOString();

    // Notify Grabber
    if (order.grabPartnerId) {
        const grabUser = this.partners.find(p => p.id === order.grabPartnerId)?.userId;
        if (grabUser) this.sendNotification(grabUser, '异常被驳回', `订单 ${order.orderNo} 异常申请被驳回，平台将介入。`, 'ORDER');
    }
    
    // Notify Admins
    this.broadcastNotification([UserRole.ADMIN, UserRole.OPERATIONS], '平台介入请求', `订单 ${order.orderNo} 产生纠纷，请介入裁决。`, 'SYSTEM');

    this.addLog(order.publishPartnerId, order.publishPartnerName, 'APPEAL_EXCEPTION', 'ORDER', `拒绝异常并申请平台介入 ${order.orderNo}`);
    return true;
  }

  // Publisher (or Admin) confirms exception -> Refund B, Deduct from A's Frozen
  confirmOrderException(orderId: string, operatorName: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order || !order.grabPartnerId) return false;

    // 1. Remove from Publisher (A) Frozen
    const publisherWallet = this.wallets.find(w => w.partnerId === order.publishPartnerId);
    if (publisherWallet) {
      publisherWallet.frozenBalance -= order.publishPrice;
    }

    // 2. Refund Grabber (B)
    const grabberWallet = this.wallets.find(w => w.partnerId === order.grabPartnerId);
    if (grabberWallet) {
      grabberWallet.balance += order.grabPrice; // Refund full price
      
      this.flows.unshift({
        id: `wf-${Date.now()}-ref`,
        partnerId: order.grabPartnerId,
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.grabPrice,
        flowType: 'INCOME',
        businessType: 'REFUND',
        description: `订单异常取消退款: ${order.title}`,
        createdAt: new Date().toISOString()
      });

      // Notify Grabber (Refund)
      const grabUser = this.partners.find(p => p.id === order.grabPartnerId)?.userId;
      if (grabUser) this.sendNotification(grabUser, '订单异常退款', `订单 ${order.orderNo} 异常成立，资金已退回余额。`, 'FINANCE');
    }

    order.status = OrderStatus.CANCELLED;
    
    // Notify Publisher (Cancelled)
    const pubUser = this.partners.find(p => p.id === order.publishPartnerId)?.userId;
    if (pubUser) this.sendNotification(pubUser, '订单异常终结', `订单 ${order.orderNo} 异常成立，订单已取消。`, 'ORDER');

    this.addLog('system', operatorName, 'CONFIRM_EXCEPTION', 'ORDER', `确认异常并退款 ${order.orderNo}`);
    return true;
  }

  // Settlement: Move money from A's Frozen to A's Available
  settleOrder(orderId: string, adminId: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    // Allow settlement from COMPLETED or directly from MEDIATING (Admin decision)
    if (!order || (order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.MEDIATING)) return false;

    // Process Publisher (A)
    const publisherWallet = this.wallets.find(w => w.partnerId === order.publishPartnerId);
    if (publisherWallet) {
      publisherWallet.frozenBalance -= order.publishPrice;
      publisherWallet.balance += order.publishPrice;
      
      this.flows.unshift({
        id: `wf-${Date.now()}-set`,
        partnerId: order.publishPartnerId,
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.publishPrice,
        flowType: 'INCOME',
        businessType: 'SETTLEMENT',
        description: `订单结算收益: ${order.title}`,
        createdAt: new Date().toISOString()
      });

      // Notify Publisher (Income)
      const pubUser = this.partners.find(p => p.id === order.publishPartnerId)?.userId;
      if (pubUser) this.sendNotification(pubUser, '订单结算到账', `订单 ${order.orderNo} 已结算，收益已转入余额。`, 'FINANCE');
    }

    order.status = OrderStatus.SETTLED;
    const operator = this.users.find(u => u.id === adminId);
    this.addLog(adminId, operator?.realName || 'System', 'SETTLE_ORDER', 'FINANCE', `结算订单 ${order.orderNo}`);
    return true;
  }

  // Admin Force Refund (Used in Mediating)
  adminForceRefund(orderId: string, adminName: string): boolean {
    return this.confirmOrderException(orderId, adminName);
  }

  // --- Finance ---

  getWallet(partnerId: string): Wallet {
    return this.wallets.find(w => w.partnerId === partnerId) || { partnerId, balance: 0, frozenBalance: 0, updatedAt: '' };
  }

  getWalletFlows(partnerId?: string): WalletFlow[] {
    if (partnerId) {
      return this.flows.filter(f => f.partnerId === partnerId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.flows.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getWithdrawals(): WithdrawalRequest[] {
    return this.withdrawals.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getTopUpRequests(): TopUpRequest[] {
    return this.topUps.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  getTopUpRecords(): WalletFlow[] {
    return this.flows.filter(f => f.businessType === 'TOPUP').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createWithdrawal(partnerId: string, amount: number): boolean {
    const wallet = this.wallets.find(w => w.partnerId === partnerId);
    const partner = this.partners.find(p => p.id === partnerId);
    if (!wallet || wallet.balance < amount) return false;

    wallet.balance -= amount;
    wallet.frozenBalance += amount;

    this.withdrawals.unshift({
      id: `wd-${Date.now()}`,
      partnerId,
      partnerName: partner?.name || 'Unknown',
      amount,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
    
    this.addLog(partnerId, partner?.name || '', 'APPLY_WITHDRAWAL', 'FINANCE', `申请提现 ¥${amount}`);
    
    // NEW: Notify Finance & Admin
    this.broadcastNotification([UserRole.FINANCE, UserRole.ADMIN], '新的提现申请', `${partner?.name} 申请提现 ¥${amount}，请前往财务审核。`, 'FINANCE');

    return true;
  }

  processWithdrawal(id: string, approved: boolean, adminName: string, proofUrl?: string, rejectReason?: string) {
    const withdrawal = this.withdrawals.find(w => w.id === id);
    if (!withdrawal) return;

    const wallet = this.wallets.find(w => w.partnerId === withdrawal.partnerId);
    if (!wallet) return;

    if (approved) {
      wallet.frozenBalance -= withdrawal.amount;
      // Money leaves system
      this.flows.unshift({
        id: `wf-${Date.now()}`,
        partnerId: withdrawal.partnerId,
        amount: withdrawal.amount,
        flowType: 'EXPENSE',
        businessType: 'WITHDRAWAL',
        description: '余额提现成功',
        proofUrl: proofUrl,
        createdAt: new Date().toISOString()
      });
      withdrawal.status = 'APPROVED';
      withdrawal.proofUrl = proofUrl;
    } else {
      wallet.frozenBalance -= withdrawal.amount;
      wallet.balance += withdrawal.amount; // Return to balance
      withdrawal.status = 'REJECTED';
      withdrawal.rejectReason = rejectReason;
    }
    
    // Notify Partner
    const partnerUser = this.users.find(u => u.partnerId === withdrawal.partnerId);
    if (partnerUser) {
        if (approved) {
            this.sendNotification(partnerUser.id, '提现已通过', `您的提现申请 (¥${withdrawal.amount}) 已通过并打款。`, 'FINANCE');
        } else {
            this.sendNotification(partnerUser.id, '提现被驳回', `您的提现申请被驳回，原因：${rejectReason}`, 'FINANCE');
        }
    }

    withdrawal.auditUser = adminName;
    withdrawal.auditTime = new Date().toISOString();
    this.addLog('admin', adminName, 'AUDIT_WITHDRAWAL', 'FINANCE', `${approved ? '批准' : '拒绝'}提现 ${id}`);
  }

  requestTopUp(partnerId: string, amount: number, proofUrl: string): boolean {
    const partner = this.partners.find(p => p.id === partnerId);
    if (!partner) return false;

    this.topUps.unshift({
      id: `tr-${Date.now()}`,
      partnerId,
      partnerName: partner.name,
      amount,
      proofUrl,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
    this.addLog(partnerId, partner.name, 'APPLY_TOPUP', 'FINANCE', `申请充值 ¥${amount}`);

    // NEW: Notify Finance & Admin
    this.broadcastNotification([UserRole.FINANCE, UserRole.ADMIN], '新的充值申请', `${partner.name} 申请充值 ¥${amount}，请核对后确认到账。`, 'FINANCE');

    return true;
  }

  processTopUp(id: string, approved: boolean, adminName: string, rejectReason?: string) {
    const request = this.topUps.find(t => t.id === id);
    if (!request) return;

    request.status = approved ? 'APPROVED' : 'REJECTED';
    request.auditUser = adminName;
    request.auditTime = new Date().toISOString();
    request.rejectReason = rejectReason;

    if (approved) {
      const wallet = this.wallets.find(w => w.partnerId === request.partnerId);
      if (wallet) wallet.balance += request.amount;

      this.flows.unshift({
        id: `wf-${Date.now()}`,
        partnerId: request.partnerId,
        amount: request.amount,
        flowType: 'INCOME',
        businessType: 'TOPUP',
        description: '在线充值申请已到账',
        proofUrl: request.proofUrl,
        createdAt: new Date().toISOString()
      });
    }
    
    // Notify Partner
    const partnerUser = this.users.find(u => u.partnerId === request.partnerId);
    if (partnerUser) {
        if (approved) {
            this.sendNotification(partnerUser.id, '充值已到账', `您的充值申请 (¥${request.amount}) 已审核通过。`, 'FINANCE');
        } else {
            this.sendNotification(partnerUser.id, '充值被驳回', `您的充值申请被驳回，原因：${rejectReason}`, 'FINANCE');
        }
    }

    this.addLog('admin', adminName, 'AUDIT_TOPUP', 'FINANCE', `${approved ? '批准' : '拒绝'}充值 ${id}`);
  }

  manualTopUp(partnerId: string, amount: number, adminName: string, remark: string, proofUrl?: string): boolean {
    const wallet = this.wallets.find(w => w.partnerId === partnerId);
    if (!wallet) return false;

    wallet.balance += amount;
    this.flows.unshift({
      id: `wf-${Date.now()}`,
      partnerId,
      amount,
      flowType: 'INCOME',
      businessType: 'TOPUP',
      description: `人工补录: ${remark}`,
      proofUrl,
      createdAt: new Date().toISOString()
    });
    
    // Notify Partner
    const partnerUser = this.users.find(u => u.partnerId === partnerId);
    if (partnerUser) {
        this.sendNotification(partnerUser.id, '人工入账提醒', `管理员为您人工充值 ¥${amount}，备注：${remark}`, 'FINANCE');
    }

    this.addLog('admin', adminName, 'MANUAL_TOPUP', 'FINANCE', `人工充值 ¥${amount} 给 ${partnerId}`);
    return true;
  }

  getFinanceOverview() {
    // Platform Revenue = Sum of platformFee from all SETTLED/COMPLETED orders
    const totalRevenue = this.orders
      .filter(o => o.status === OrderStatus.SETTLED || o.status === OrderStatus.COMPLETED)
      .reduce((acc, cur) => acc + cur.platformFee, 0);

    // Pending Settlement = Sum of publishPrice for orders not yet SETTLED but money is frozen in A
    // Logic check: When B pays, A has frozen money. 
    // If completed, it waits for settlement. If Exception, it waits for resolution.
    // 'Pending Settlement' usually refers to what platform OWEs (or needs to process). 
    // Here, money is technically already in A's wallet (frozen). 
    // So Pending Settlement metric might be redefined as: Frozen funds in all wallets related to orders.
    const pendingSettlement = this.wallets.reduce((acc, cur) => acc + cur.frozenBalance, 0);

    // Total Pool = Sum of all wallet balances (Available + Frozen)
    const totalPool = this.wallets.reduce((acc, cur) => acc + cur.balance + cur.frozenBalance, 0);

    return { totalRevenue, pendingSettlement, totalPool };
  }

  getFinanceConfig() {
    return this.financeConfig;
  }

  updateFinanceConfig(config: FinanceConfig, adminName: string) {
    this.financeConfig = config;
    this.addLog('admin', adminName, 'UPDATE_CONFIG', 'FINANCE', '更新财务收款配置');
  }

  // --- Configuration ---

  getCities(): City[] {
    return this.cities;
  }

  getCityGroups(): CityGroup[] {
    return this.cityGroups;
  }

  getCityName(code: string): string {
    return this.cities.find(c => c.code === code)?.name || code;
  }

  addCityGroup(name: string) {
    this.cityGroups.push({ id: `g-${Date.now()}`, name });
  }

  deleteCityGroup(id: string) {
    this.cityGroups = this.cityGroups.filter(g => g.id !== id);
    // Unlink cities
    this.cities.forEach(c => {
      if (c.groupId === id) c.groupId = undefined;
    });
  }

  addCity(city: City) {
    this.cities.push(city);
  }

  updateCity(code: string, data: Partial<City>) {
    const city = this.cities.find(c => c.code === code);
    if (city) Object.assign(city, data);
  }

  deleteCity(code: string) {
    this.cities = this.cities.filter(c => c.code !== code);
  }

  updateCityStatus(code: string, status: 'ACTIVE' | 'DISABLED') {
    const city = this.cities.find(c => c.code === code);
    if (city) city.status = status;
  }

  getOrderTypes(): OrderType[] {
    return this.orderTypes;
  }

  toggleOrderType(id: string) {
    const type = this.orderTypes.find(t => t.id === id);
    if (type) type.isActive = !type.isActive;
  }

  addOrderType(name: string) {
    this.orderTypes.push({ id: `t-${Date.now()}`, name, isActive: true });
  }

  deleteOrderType(id: string) {
    this.orderTypes = this.orderTypes.filter(t => t.id !== id);
  }

  getPublishTitles(): PublishTitle[] {
    return this.publishTitles;
  }

  togglePublishTitle(id: string) {
    const title = this.publishTitles.find(t => t.id === id);
    if (title) title.isActive = !title.isActive;
  }

  addPublishTitle(name: string) {
    this.publishTitles.push({ id: `pt-${Date.now()}`, name, isActive: true });
  }

  deletePublishTitle(id: string) {
    this.publishTitles = this.publishTitles.filter(t => t.id !== id);
  }

  getRules(): CommissionRule[] {
    return this.rules;
  }

  addRule(rule: Omit<CommissionRule, 'id' | 'isActive'>) {
    this.rules.push({ ...rule, id: `r-${Date.now()}`, isActive: true });
  }

  updateRule(id: string, data: Partial<CommissionRule>) {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      if (data.cityCode) rule.cityCode = data.cityCode;
      if (data.orderType) rule.orderType = data.orderType;
      if (data.ruleType) rule.ruleType = data.ruleType;
      if (data.ruleValue !== undefined) rule.ruleValue = data.ruleValue;
      this.addLog('admin', '管理员', 'UPDATE_RULE', 'SYSTEM', `更新抽成规则配置`);
    }
  }

  deleteRule(id: string) {
    this.rules = this.rules.filter(r => r.id !== id);
  }

  toggleRule(id: string) {
    const rule = this.rules.find(r => r.id === id);
    if (rule) rule.isActive = !rule.isActive;
  }

  private findMatchingRule(cityCode: string, orderType: string): CommissionRule {
    // Priority: 1. City + Type, 2. City + ALL, 3. ALL + Type, 4. ALL + ALL
    let match = this.rules.find(r => r.cityCode === cityCode && r.orderType === orderType && r.isActive);
    if (match) return match;
    
    match = this.rules.find(r => r.cityCode === cityCode && r.orderType === 'ALL' && r.isActive);
    if (match) return match;

    match = this.rules.find(r => r.cityCode === 'ALL' && r.orderType === orderType && r.isActive);
    if (match) return match;

    match = this.rules.find(r => r.cityCode === 'ALL' && r.orderType === 'ALL' && r.isActive);
    return match || { id: 'default', cityCode: 'ALL', orderType: 'ALL', ruleType: 'PERCENTAGE', ruleValue: 10, isActive: true };
  }

  // --- Stats & Logs ---

  getPlatformStats() {
    const totalVolume = this.orders.reduce((acc, cur) => acc + cur.publishPrice, 0);
    const totalRevenue = this.orders.reduce((acc, cur) => acc + cur.platformFee, 0);
    const pending = this.orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((acc, cur) => acc + cur.publishPrice, 0);
    
    return {
      volume: totalVolume,
      revenue: totalRevenue,
      pendingSettlement: pending
    };
  }

  getLogs(): SystemLog[] {
    return this.logs;
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === 'ALL' || n.userId === userId);
  }

  markNotificationRead(id: string) {
    const n = this.notifications.find(item => item.id === id);
    if (n) n.isRead = true;
  }

  getReportData() {
    // 1. Revenue by City
    const cityRevenue: Record<string, number> = {};
    this.orders.forEach(o => {
      const cityName = this.getCityName(o.cityCode);
      cityRevenue[cityName] = (cityRevenue[cityName] || 0) + o.platformFee;
    });
    const revenueByCity = Object.entries(cityRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5);

    // 2. Order Type Distribution
    const typeCount: Record<string, number> = {};
    this.orders.forEach(o => {
      typeCount[o.type] = (typeCount[o.type] || 0) + 1;
    });
    const orderTypeDistribution = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

    return { revenueByCity, orderTypeDistribution };
  }
}

export const mockService = new MockService();