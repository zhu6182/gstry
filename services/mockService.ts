import { 
  User, UserRole, Partner, City, CityGroup, Order, OrderStatus, 
  OrderType, PublishTitle, CustomerSource, Wallet, WalletFlow, 
  WithdrawalRequest, TopUpRequest, FinanceConfig, CommissionRule, 
  SystemLog, Notification, SystemConfig, ServerConfig 
} from '../types';

class MockService {
  private users: User[] = [
    { id: 'u1', username: 'admin', realName: '超级管理员', password: '123', role: UserRole.ADMIN, status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', createdAt: '2023-01-01T00:00:00Z' },
    { id: 'u2', username: 'op1', realName: '运营小张', password: '123', role: UserRole.OPERATIONS, status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=op1', createdAt: '2023-01-02T00:00:00Z', canAddPartner: true },
    { id: 'u3', username: 'fin001', realName: '财务李姐', password: '123', role: UserRole.FINANCE, status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fin1', createdAt: '2023-01-03T00:00:00Z' },
    { id: 'u4', username: '13800138001', realName: '张总 (上海)', password: '123', role: UserRole.PARTNER, status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p1', createdAt: '2023-01-05T00:00:00Z', partnerId: 'p1' },
    { id: 'u5', username: '13900139002', realName: '刘工 (北京)', password: '123', role: UserRole.PARTNER, status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p2', createdAt: '2023-02-10T00:00:00Z', partnerId: 'p2' },
    { id: 'u6', username: 'disp001', realName: '发单专员A', password: '123', role: UserRole.DISPATCHER, status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=disp1', createdAt: '2023-03-01T00:00:00Z' },
  ];

  private partners: Partner[] = [
    { 
      id: 'p1', userId: 'u4', name: '上海先锋服务队', cityCode: 'SH', contactPhone: '13800138001', levelId: 'L2', status: 'ACTIVE', createdAt: '2023-01-05T00:00:00Z',
      permissions: { canPublish: true, canGrab: true, canCrossCity: true, canViewCrossCity: true },
      businessTypes: ['家电清洗', '甲醛治理'],
      crossCityCodes: ['SU', 'HZ']
    },
    { 
      id: 'p2', userId: 'u5', name: '北京安居团队', cityCode: 'BJ', contactPhone: '13900139002', levelId: 'L1', status: 'ACTIVE', createdAt: '2023-02-10T00:00:00Z',
      permissions: { canPublish: true, canGrab: true, canCrossCity: false, canViewCrossCity: false },
      businessTypes: ['家电清洗'],
      crossCityCodes: []
    }
  ];

  // 1. Defined Regions Structure
  private regions = [
    { id: 'R1', name: '华东地区', provinces: ['上海市', '江苏省', '浙江省', '安徽省'] },
    { id: 'R2', name: '华北地区', provinces: ['北京市', '天津市', '河北省'] },
    { id: 'R3', name: '华南地区', provinces: ['广东省', '福建省'] },
    { id: 'R4', name: '西南地区', provinces: ['四川省', '重庆市'] },
    { id: 'R5', name: '华中地区', provinces: ['湖北省', '湖南省'] },
  ];

  // 2. City Groups (Provinces)
  private cityGroups: CityGroup[] = [
    { id: 'CN-31', name: '上海市' },
    { id: 'CN-32', name: '江苏省' },
    { id: 'CN-33', name: '浙江省' },
    { id: 'CN-11', name: '北京市' },
    { id: 'CN-12', name: '天津市' },
    { id: 'CN-44', name: '广东省' },
    { id: 'CN-35', name: '福建省' },
    { id: 'CN-51', name: '四川省' },
    { id: 'CN-50', name: '重庆市' },
    { id: 'CN-42', name: '湖北省' },
  ];

  // 3. Cities
  private cities: City[] = [
    // East
    { code: 'SH', name: '上海市', groupId: 'CN-31', status: 'ACTIVE' },
    { code: 'NJ', name: '南京市', groupId: 'CN-32', status: 'ACTIVE' },
    { code: 'SU', name: '苏州市', groupId: 'CN-32', status: 'ACTIVE' },
    { code: 'WX', name: '无锡市', groupId: 'CN-32', status: 'ACTIVE' },
    { code: 'HZ', name: '杭州市', groupId: 'CN-33', status: 'ACTIVE' },
    { code: 'NB', name: '宁波市', groupId: 'CN-33', status: 'ACTIVE' },
    
    // North
    { code: 'BJ', name: '北京市', groupId: 'CN-11', status: 'ACTIVE' },
    { code: 'TJ', name: '天津市', groupId: 'CN-12', status: 'ACTIVE' },
    
    // South
    { code: 'GZ', name: '广州市', groupId: 'CN-44', status: 'ACTIVE' },
    { code: 'SZ', name: '深圳市', groupId: 'CN-44', status: 'ACTIVE' },
    { code: 'XM', name: '厦门市', groupId: 'CN-35', status: 'ACTIVE' },
    
    // Southwest
    { code: 'CD', name: '成都市', groupId: 'CN-51', status: 'ACTIVE' },
    { code: 'CQ', name: '重庆市', groupId: 'CN-50', status: 'ACTIVE' },
    
    // Central
    { code: 'WH', name: '武汉市', groupId: 'CN-42', status: 'ACTIVE' },
  ];

  private wallets: Wallet[] = [
    { partnerId: 'p1', balance: 5000.00, frozenBalance: 200.00, updatedAt: '2023-10-01T10:00:00Z' },
    { partnerId: 'p2', balance: 1200.50, frozenBalance: 0.00, updatedAt: '2023-10-02T11:30:00Z' },
  ];

  private orders: Order[] = [
    { 
      id: 'o1', orderNo: 'ORD202310010001', cityCode: 'SH', type: '客咨', title: '家电清洗', description: '客户需要清洗3台空调挂机，位于浦东新区，要求周末上门。',
      customerName: '王先生', customerPhone: '13512345678', customerAddress: '上海市浦东新区张江高科苑', customerSource: '美团',
      publishPartnerId: 'p1', publishPartnerName: '上海先锋服务队',
      publishPrice: 180, platformFee: 20, grabPrice: 200,
      status: OrderStatus.PUBLISHED, createdAt: '2023-10-01T09:00:00Z'
    },
    { 
      id: 'o2', orderNo: 'ORD202310010002', cityCode: 'BJ', type: '派单', title: '甲醛治理', description: '新房装修除甲醛，面积120平，需专业CMA检测报告。',
      customerName: '李女士', customerPhone: '13687654321', customerAddress: '北京市朝阳区大悦城附近', customerSource: '小红书',
      publishPartnerId: 'u1', publishPartnerName: '平台推送订单',
      publishPrice: 800, platformFee: 100, grabPrice: 900, grabPartnerId: 'p2', grabPartnerName: '北京安居团队', grabTime: '2023-10-01T14:30:00Z',
      status: OrderStatus.PROCESSING, createdAt: '2023-10-01T10:00:00Z'
    },
    { 
        id: 'o3', orderNo: 'ORD202310020001', cityCode: 'SH', type: '客咨', title: '家电清洗', description: '油烟机清洗，重油污，急需处理。',
        customerName: '赵先生', customerPhone: '13700001111', customerAddress: '上海市徐汇区', customerSource: '抖音',
        publishPartnerId: 'u1', publishPartnerName: '平台推送订单',
        publishPrice: 150, platformFee: 30, grabPrice: 180, grabPartnerId: 'p1', grabPartnerName: '上海先锋服务队', grabTime: '2023-10-02T09:15:00Z', finishTime: '2023-10-03T10:00:00Z',
        status: OrderStatus.COMPLETED, createdAt: '2023-10-02T08:00:00Z'
      }
  ];

  private flows: WalletFlow[] = [
    { id: 'wf1', partnerId: 'p1', amount: 5000, flowType: 'INCOME', businessType: 'TOPUP', description: '线下充值入账', createdAt: '2023-09-01T10:00:00Z', proofUrl: 'https://via.placeholder.com/150' },
    { id: 'wf2', partnerId: 'p1', amount: 180, flowType: 'EXPENSE', businessType: 'GRAB', description: '抢单支付: ORD202310020001', createdAt: '2023-10-02T09:15:00Z', orderNo: 'ORD202310020001' },
  ];

  private withdrawals: WithdrawalRequest[] = [
    { id: 'w1', partnerId: 'p1', partnerName: '上海先锋服务队', amount: 1000, status: 'PENDING', createdAt: '2023-10-05T10:00:00Z' },
    { id: 'w2', partnerId: 'p2', partnerName: '北京安居团队', amount: 500, status: 'APPROVED', createdAt: '2023-09-20T14:00:00Z', auditUser: '财务李姐', auditTime: '2023-09-21T09:00:00Z', proofUrl: 'https://via.placeholder.com/150' },
  ];

  private topups: TopUpRequest[] = [
     { id: 't1', partnerId: 'p2', partnerName: '北京安居团队', amount: 2000, status: 'PENDING', proofUrl: 'https://via.placeholder.com/150', createdAt: '2023-10-06T11:00:00Z' }
  ];

  private orderTypes: OrderType[] = [
    { id: 'ot1', name: '客咨', isActive: true },
    { id: 'ot2', name: '派单', isActive: true },
    { id: 'ot3', name: '合作', isActive: true },
  ];

  private publishTitles: PublishTitle[] = [
    { id: 'pt1', name: '家电清洗', isActive: true },
    { id: 'pt2', name: '甲醛治理', isActive: true },
    { id: 'pt3', name: '家庭保洁', isActive: true },
    { id: 'pt4', name: '管道疏通', isActive: true },
    { id: 'pt5', name: '防水补漏', isActive: true },
  ];

  private customerSources: CustomerSource[] = [
    { id: 'cs1', name: '美团', isActive: true },
    { id: 'cs2', name: '抖音', isActive: true },
    { id: 'cs3', name: '小红书', isActive: true },
    { id: 'cs4', name: '58同城', isActive: true },
    { id: 'cs5', name: '老客户转介绍', isActive: true },
  ];

  private commissionRules: CommissionRule[] = [
    { id: 'r1', cityCode: 'ALL', orderType: 'ALL', category: 'ALL', ruleType: 'PERCENTAGE', ruleValue: 10, isActive: true },
    { id: 'r2', cityCode: 'SH', orderType: '客咨', category: '家电清洗', ruleType: 'FIXED', ruleValue: 20, isActive: true }
  ];

  private logs: SystemLog[] = [
    { id: 'l1', operatorId: 'u1', operatorName: '超级管理员', action: 'LOGIN', module: 'AUTH', details: 'User logged in', createdAt: '2023-10-07T08:00:00Z' },
    { id: 'l2', operatorId: 'u2', operatorName: '运营小张', action: 'CREATE_PARTNER', module: 'PARTNER', details: 'Created partner p3', createdAt: '2023-10-07T09:30:00Z' },
  ];

  private notifications: Notification[] = [
    { id: 'n1', userId: 'u4', title: '系统维护通知', content: '系统将于今晚凌晨2点进行维护升级，预计耗时1小时。', type: 'SYSTEM', isRead: false, createdAt: '2023-10-01T10:00:00Z' },
    { id: 'n2', userId: 'u4', title: '订单结算成功', content: '您的订单 ORD202310020001 已完成结算，资金已解冻。', type: 'FINANCE', isRead: true, createdAt: '2023-10-03T10:05:00Z' },
  ];

  private systemConfig: SystemConfig = {
    systemName: 'PartnerNexus',
    logoUrl: '',
    loginSubtitle: '全国城市合伙人统一协作与管理平台',
    copyright: '© 2024 PartnerNexus Inc. All Rights Reserved.'
  };

  private serverConfig: ServerConfig = {
    dbHost: '127.0.0.1',
    dbPort: '3306',
    dbName: 'partner_nexus',
    dbUser: 'root',
    dbPassword: '',
    apiBaseUrl: 'https://api.partnernexus.com/v1',
    environment: 'PROD'
  };

  private financeConfig: FinanceConfig = {
    bankName: '招商银行上海分行',
    accountName: '上海某某网络科技有限公司',
    accountNumber: '6225 8888 8888 8888',
    wechatQrUrl: '',
    alipayQrUrl: ''
  };

  // --- Methods ---

  // Auth
  authenticate(u: string, p: string): User | undefined {
    return this.users.find(user => (user.username === u || user.id === u) && user.password === p && user.status === 'ACTIVE');
  }

  changePassword(userId: string, newPass: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.password = newPass;
      return true;
    }
    return false;
  }

  adminResetPassword(adminId: string, userId: string, newPass: string) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
        user.password = newPass;
        this.addLog(adminId, '超级管理员', 'USER', 'RESET_PASSWORD', `Reset password for user ${user.username}`);
        return true;
    }
    return false;
  }

  // Users
  getInternalUsers(): User[] {
    return this.users.filter(u => u.role !== UserRole.PARTNER);
  }

  addInternalUser(data: Partial<User>) {
    const id = `u-${Date.now()}`;
    const newUser: User = {
      id,
      username: data.username!,
      realName: data.realName!,
      password: '123',
      role: data.role || UserRole.OPERATIONS,
      status: 'ACTIVE',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      createdAt: new Date().toISOString(),
      canAddPartner: data.canAddPartner
    };
    this.users.push(newUser);
    this.addLog('system', 'System', 'USER', 'CREATE', `Created internal user ${newUser.username}`);
  }

  deleteInternalUser(id: string) {
    this.users = this.users.filter(u => u.id !== id);
  }

  updateInternalUserRights(userId: string, cityCodes: string[], canAddPartner: boolean) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.managedCityCodes = cityCodes;
      user.canAddPartner = canAddPartner;
    }
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  // Partners
  getPartners(): Partner[] { return this.partners; }
  
  getPartnerById(id: string): Partner | undefined {
    return this.partners.find(p => p.id === id);
  }

  addPartner(params: any) {
    const id = `p-${Date.now()}`;
    const userId = `u-${Date.now()}`;
    
    // Create User Account for Partner
    this.users.push({
      id: userId,
      username: params.phone, // Phone as username
      realName: params.contactName,
      password: '123',
      role: UserRole.PARTNER,
      status: 'ACTIVE',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      createdAt: new Date().toISOString(),
      partnerId: id
    });

    // Create Partner Profile
    this.partners.push({
      id,
      userId,
      name: params.name,
      cityCode: params.cityCode,
      contactPhone: params.phone,
      levelId: 'L1',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      permissions: params.permissions || { canPublish: true, canGrab: true, canCrossCity: false, canViewCrossCity: false },
      businessTypes: params.businessTypes || [],
      crossCityCodes: params.crossCityCodes || []
    });

    // Create Wallet
    this.wallets.push({ partnerId: id, balance: 0, frozenBalance: 0, updatedAt: new Date().toISOString() });
    
    this.addLog('system', 'System', 'PARTNER', 'CREATE', `Created partner ${params.name}`);
  }

  updatePartner(id: string, data: any) {
    const p = this.partners.find(x => x.id === id);
    if (p) Object.assign(p, data);
  }

  deletePartner(id: string) {
    this.partners = this.partners.filter(p => p.id !== id);
    this.users = this.users.filter(u => u.partnerId !== id);
    this.wallets = this.wallets.filter(w => w.partnerId !== id);
  }

  togglePartnerStatus(id: string) {
    const p = this.partners.find(x => x.id === id);
    if (p) {
      p.status = p.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      // Sync user status
      const u = this.users.find(u => u.id === p.userId);
      if (u) u.status = p.status;
    }
  }

  // Cities
  getCities(): City[] { return this.cities; }
  getCityGroups(): CityGroup[] { return this.cityGroups; }
  
  getCityName(code: string): string {
    return this.cities.find(c => c.code === code)?.name || code;
  }
  
  getRegions() {
    return this.regions;
  }

  addCity(name: string, provinceId: string) {
    // Generate a simple code
    const code = 'C' + Date.now().toString().slice(-4);
    this.cities.push({
        code,
        name,
        groupId: provinceId,
        status: 'ACTIVE'
    });
  }

  bulkUpdateProvinceStatus(provId: string, status: 'ACTIVE' | 'DISABLED') {
    this.cities.forEach(c => {
        if (c.groupId === provId) c.status = status;
    });
  }

  // Orders
  getOrders(): Order[] { return this.orders; }

  createOrder(data: any) {
    const newOrder: Order = {
      id: `o${Date.now()}${Math.floor(Math.random()*100)}`,
      orderNo: `ORD${new Date().toISOString().slice(0,10).replace(/-/g,'')}${Math.floor(Math.random()*10000)}`,
      status: OrderStatus.PUBLISHED,
      createdAt: new Date().toISOString(),
      platformFee: data.publishPrice * 0.1, // Default 10% logic mock
      grabPrice: data.publishPrice * 1.1, // Mock logic
      ...data
    };
    this.orders.unshift(newOrder);
    return newOrder;
  }

  updateOrderStatus(orderId: string, status: OrderStatus, userId: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (status === OrderStatus.COMPLETED) order.finishTime = new Date().toISOString();
      // Logic for money movement could be here
      return true;
    }
    return false;
  }

  reportOrderException(orderId: string, reason: string, proofs: string[]) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
        order.status = OrderStatus.EXCEPTION;
        order.exceptionReason = reason;
        order.exceptionProofUrls = proofs;
        order.exceptionTime = new Date().toISOString();
        return true;
    }
    return false;
  }

  confirmOrderException(orderId: string, operatorName: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
        order.status = OrderStatus.CANCELLED;
        // Refund logic should happen here
        this.addLog('system', operatorName, 'ORDER', 'EXCEPTION_CONFIRM', `Refund confirmed for order ${order.orderNo}`);
        return true;
    }
    return false;
  }

  appealOrderException(orderId: string, reason: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
        order.status = OrderStatus.MEDIATING;
        order.appealReason = reason;
        order.appealTime = new Date().toISOString();
        return true;
    }
    return false;
  }

  settleOrder(orderId: string, operatorId: string) {
      const order = this.orders.find(o => o.id === orderId);
      if (order) {
          order.status = OrderStatus.SETTLED;
          // Transfer funds logic
          if (order.publishPartnerId) {
             const wallet = this.getWallet(order.publishPartnerId);
             wallet.balance += order.publishPrice;
             this.flows.unshift({
                id: `wf${Date.now()}`,
                partnerId: order.publishPartnerId,
                amount: order.publishPrice,
                flowType: 'INCOME',
                businessType: 'SETTLEMENT',
                description: `订单结算收入: ${order.title}`,
                orderNo: order.orderNo,
                createdAt: new Date().toISOString()
             });
          }
          return true;
      }
      return false;
  }

  // Configurations (Order Types, Titles, Sources)
  getOrderTypes() { return this.orderTypes; }
  addOrderType(name: string) { this.orderTypes.push({ id: `ot${Date.now()}`, name, isActive: true }); }
  toggleOrderType(id: string) { const t = this.orderTypes.find(x => x.id === id); if(t) t.isActive = !t.isActive; }

  getPublishTitles() { return this.publishTitles; }
  addPublishTitle(name: string) { this.publishTitles.push({ id: `pt${Date.now()}`, name, isActive: true }); }
  togglePublishTitle(id: string) { const t = this.publishTitles.find(x => x.id === id); if(t) t.isActive = !t.isActive; }

  getCustomerSources() { return this.customerSources; }
  addCustomerSource(name: string) { this.customerSources.push({ id: `cs${Date.now()}`, name, isActive: true }); }
  toggleCustomerSource(id: string) { const t = this.customerSources.find(x => x.id === id); if(t) t.isActive = !t.isActive; }

  // Finance
  getWallet(partnerId: string): Wallet {
    let w = this.wallets.find(x => x.partnerId === partnerId);
    if (!w) {
        w = { partnerId, balance: 0, frozenBalance: 0, updatedAt: new Date().toISOString() };
        this.wallets.push(w);
    }
    return w;
  }

  getWalletFlows(partnerId?: string): WalletFlow[] {
    if (partnerId) return this.flows.filter(f => f.partnerId === partnerId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return this.flows.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getWithdrawals() { return this.withdrawals.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  getTopUpRequests() { return this.topups.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  getTopUpRecords() { return this.topups.filter(t => t.status === 'APPROVED'); } // Simplified

  createWithdrawal(partnerId: string, amount: number) {
    const wallet = this.getWallet(partnerId);
    if (wallet.balance >= amount) {
        wallet.balance -= amount;
        wallet.frozenBalance += amount;
        this.withdrawals.unshift({
            id: `w${Date.now()}`,
            partnerId,
            partnerName: this.getPartnerById(partnerId)?.name || 'Unknown',
            amount,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        });
        return true;
    }
    return false;
  }

  requestTopUp(partnerId: string, amount: number, proofUrl: string) {
      this.topups.unshift({
          id: `t${Date.now()}`,
          partnerId,
          partnerName: this.getPartnerById(partnerId)?.name || 'Unknown',
          amount,
          proofUrl,
          status: 'PENDING',
          createdAt: new Date().toISOString()
      });
      return true;
  }

  processWithdrawal(id: string, approved: boolean, operator: string, proofUrl?: string, rejectReason?: string) {
      const w = this.withdrawals.find(x => x.id === id);
      if (w && w.status === 'PENDING') {
          w.status = approved ? 'APPROVED' : 'REJECTED';
          w.auditUser = operator;
          w.auditTime = new Date().toISOString();
          w.proofUrl = proofUrl;
          w.rejectReason = rejectReason;

          const wallet = this.getWallet(w.partnerId);
          wallet.frozenBalance -= w.amount;

          if (approved) {
              // Money leaves system
              this.flows.unshift({
                  id: `wf${Date.now()}`,
                  partnerId: w.partnerId,
                  amount: w.amount,
                  flowType: 'EXPENSE',
                  businessType: 'WITHDRAWAL',
                  description: '余额提现出账',
                  createdAt: new Date().toISOString(),
                  proofUrl
              });
          } else {
              // Money returns to balance
              wallet.balance += w.amount;
          }
      }
  }

  processTopUp(id: string, approved: boolean, operator: string, rejectReason?: string) {
      const t = this.topups.find(x => x.id === id);
      if (t && t.status === 'PENDING') {
          t.status = approved ? 'APPROVED' : 'REJECTED';
          t.auditUser = operator;
          t.auditTime = new Date().toISOString();
          t.rejectReason = rejectReason;

          if (approved) {
              const wallet = this.getWallet(t.partnerId);
              wallet.balance += t.amount;
              this.flows.unshift({
                  id: `wf${Date.now()}`,
                  partnerId: t.partnerId,
                  amount: t.amount,
                  flowType: 'INCOME',
                  businessType: 'TOPUP',
                  description: '余额充值入账',
                  createdAt: new Date().toISOString(),
                  proofUrl: t.proofUrl
              });
          }
      }
  }

  manualTopUp(partnerId: string, amount: number, operator: string, remark: string, proofUrl?: string) {
      const wallet = this.getWallet(partnerId);
      wallet.balance += amount;
      
      // Add a record to topups history as auto-approved
      this.topups.unshift({
        id: `mt${Date.now()}`,
        partnerId,
        partnerName: this.getPartnerById(partnerId)?.name || 'Unknown',
        amount,
        proofUrl: proofUrl || '',
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        auditUser: operator,
        auditTime: new Date().toISOString()
      });

      this.flows.unshift({
          id: `wf${Date.now()}`,
          partnerId: partnerId,
          amount: amount,
          flowType: 'INCOME',
          businessType: 'TOPUP',
          description: `人工入账: ${remark}`,
          createdAt: new Date().toISOString(),
          proofUrl
      });
      return true;
  }

  getFinanceConfig() { return this.financeConfig; }
  updateFinanceConfig(cfg: FinanceConfig) { this.financeConfig = cfg; }
  
  getFinanceOverview() {
      // Mock calculations
      const totalRevenue = this.orders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
      const pendingSettlement = this.orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((sum, o) => sum + (o.grabPrice || 0), 0);
      const totalPool = this.wallets.reduce((sum, w) => sum + w.balance + w.frozenBalance, 0);
      return { totalRevenue, pendingSettlement, totalPool };
  }

  getReportData() {
     // Mock stats for Reports page
     return {
        revenueByCity: this.cities.slice(0, 5).map(c => ({ name: c.name, value: Math.floor(Math.random() * 50000) })),
        orderTypeDistribution: this.orderTypes.map(t => ({ name: t.name, value: Math.floor(Math.random() * 100) }))
     };
  }
  
  // Platform Stats for Dashboard
  getPlatformStats() {
      const revenue = this.orders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
      const volume = this.orders.reduce((sum, o) => sum + (o.publishPrice || 0), 0);
      const pendingSettlement = this.orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((sum, o) => sum + (o.grabPrice || 0), 0);
      return { revenue, volume, pendingSettlement };
  }

  // Rules
  getRules() { return this.commissionRules; }
  addRule(data: any) { this.commissionRules.push({ id: `r${Date.now()}`, ...data, isActive: true }); }
  updateRule(id: string, data: any) { const r = this.commissionRules.find(x => x.id === id); if(r) Object.assign(r, data); }
  deleteRule(id: string) { this.commissionRules = this.commissionRules.filter(x => x.id !== id); }
  toggleRule(id: string) { const r = this.commissionRules.find(x => x.id === id); if(r) r.isActive = !r.isActive; }

  // System Config
  getSystemConfig() { return this.systemConfig; }
  updateSystemConfig(cfg: SystemConfig) { this.systemConfig = cfg; }
  getServerConfig() { return this.serverConfig; }
  updateServerConfig(cfg: ServerConfig) { this.serverConfig = cfg; }

  factoryReset(userId: string) {
    // Keep the current admin user, wipe everything else
    const currentUser = this.users.find(u => u.id === userId);
    this.users = currentUser ? [currentUser] : [];
    this.partners = [];
    this.orders = [];
    this.wallets = [];
    this.flows = [];
    this.withdrawals = [];
    this.topups = [];
    this.logs = [];
    this.notifications = [];
  }

  // Logs & Notifications
  getLogs() { return this.logs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  addLog(operatorId: string, operatorName: string, module: string, action: string, details: string) {
      this.logs.unshift({
          id: `l${Date.now()}`,
          operatorId, operatorName, module, action, details,
          createdAt: new Date().toISOString()
      });
  }

  getNotifications(userId: string) { 
      return this.notifications.filter(n => n.userId === userId || n.userId === 'ALL').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
  }
  markNotificationRead(id: string) {
      const n = this.notifications.find(x => x.id === id);
      if(n) n.isRead = true;
  }
}

export const mockService = new MockService();
