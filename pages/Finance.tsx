import React, { useState } from 'react';
import { User, UserRole, WalletFlow, WithdrawalRequest, Order, OrderStatus, FinanceConfig } from '../types';
import { mockService } from '../services/mockService';
import { Wallet, History, Check, X, AlertCircle, Eye, ArrowRight, Coins, FileText, TrendingUp, PiggyBank, DollarSign, Plus, Download, Search, CreditCard, Upload, QrCode, Settings, Image as ImageIcon, MessageSquare, Calendar, ArrowRightLeft, RefreshCw, Clock, ListFilter } from 'lucide-react';

interface FinanceProps {
  user: User;
}

export const Finance: React.FC<FinanceProps> = ({ user }) => {
  const isFinance = user.role === UserRole.FINANCE || user.role === UserRole.ADMIN;
  const [refreshKey, setRefreshKey] = useState(0); // For forcing re-render
  
  // --- Partner View Components ---
  if (user.role === UserRole.PARTNER && user.partnerId) {
    const wallet = mockService.getWallet(user.partnerId);
    const flows = mockService.getWalletFlows(user.partnerId);
    const financeConfig = mockService.getFinanceConfig();
    
    // Partner Tab State
    const [partnerTab, setPartnerTab] = useState<'flows' | 'applications'>('flows');

    // Fetch Applications (Top-ups & Withdrawals)
    const myWithdrawals = mockService.getWithdrawals().filter(w => w.partnerId === user.partnerId);
    const myTopUps = mockService.getTopUpRequests().filter(t => t.partnerId === user.partnerId);
    
    // Merge and sort applications
    const myApplications = [
      ...myWithdrawals.map(w => ({ ...w, type: 'WITHDRAWAL' as const })),
      ...myTopUps.map(t => ({ ...t, type: 'TOPUP' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // State for withdrawal
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [showWithdraw, setShowWithdraw] = useState(false);

    // State for Recharge Modal
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string>('');

    // State for Proof Viewer
    const [partnerProofPreview, setPartnerProofPreview] = useState<string | null>(null);

    const handleWithdraw = () => {
      const amount = Number(withdrawAmount);
      if (amount <= 0 || amount > wallet.balance) return;
      
      const success = mockService.createWithdrawal(user.partnerId!, amount);
      if (success) {
        alert('提现申请已提交，等待财务审核');
        setWithdrawAmount('');
        setShowWithdraw(false);
        setPartnerTab('applications'); // Switch to apps tab to show the new request
        setRefreshKey(prev => prev + 1); // Refresh wallet display
      } else {
        alert('提交失败，余额可能不足');
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('图片大小不能超过 5MB');
          return;
        }
        setProofFile(file);
        setProofPreview(URL.createObjectURL(file));
      }
    };

    const handleRechargeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!rechargeAmount || !proofFile) {
        alert('请填写充值金额并上传转账凭证');
        return;
      }
      
      // Mock Upload: Use the blob URL as the "uploaded" URL
      const success = mockService.requestTopUp(user.partnerId!, Number(rechargeAmount), proofPreview);
      if (success) {
        alert('充值申请已提交！财务审核通过后余额将自动到账。');
        setShowRechargeModal(false);
        setRechargeAmount('');
        setProofFile(null);
        setProofPreview('');
        setPartnerTab('applications'); // Switch to apps tab
        setRefreshKey(prev => prev + 1);
      } else {
        alert('提交失败，请重试');
      }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> 审核中</span>;
            case 'APPROVED': return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1 w-fit"><Check className="w-3 h-3" /> 已通过</span>;
            case 'REJECTED': return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1 w-fit"><X className="w-3 h-3" /> 已驳回</span>;
            default: return status;
        }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">我的钱包</h1>
        
        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-200 text-sm font-medium mb-1">可用余额</p>
              <h2 className="text-4xl font-bold mb-6">¥{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowWithdraw(!showWithdraw)}
                  className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors"
                >
                  申请提现
                </button>
                <button 
                  onClick={() => setShowRechargeModal(true)}
                  className="bg-blue-700 bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-70 transition-colors"
                >
                  充值
                </button>
              </div>
            </div>
            <Wallet className="absolute right-[-20px] bottom-[-20px] w-40 h-40 text-white opacity-10" />
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                 <AlertCircle className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-sm text-slate-500">冻结资金</p>
                 <h3 className="text-2xl font-bold text-slate-800">¥{wallet.frozenBalance.toLocaleString()}</h3>
               </div>
             </div>
             <p className="text-xs text-slate-400 pl-16">
               包含抢单支付的保证金以及处理中的提现申请。
             </p>
          </div>
        </div>

        {/* Withdraw Form (Conditional) */}
        {showWithdraw && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-end gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-800 mb-1">提现金额</label>
              <input 
                type="number" 
                className="w-full border border-blue-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入金额"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
              />
            </div>
            <button 
              onClick={handleWithdraw}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 h-[42px]"
            >
              确认提交
            </button>
          </div>
        )}

        {/* Recharge Modal */}
        {showRechargeModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
              {/* Left Side: Bank Info */}
              <div className="bg-slate-50 p-8 md:w-1/2 border-r border-slate-200 overflow-y-auto">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-600" /> 
                  平台收款信息
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">银行转账</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">开户银行</span>
                        <span className="font-medium text-slate-800">{financeConfig.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">账户名称</span>
                        <span className="font-medium text-slate-800">{financeConfig.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">银行账号</span>
                        <span className="font-mono font-bold text-slate-800">{financeConfig.accountNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">扫码支付</p>
                    <div className="flex justify-center gap-4 flex-wrap">
                      {financeConfig.wechatQrUrl && (
                        <div className="flex flex-col items-center">
                          <div className="w-32 h-32 bg-slate-100 rounded p-1 border border-slate-200">
                             <img src={financeConfig.wechatQrUrl} alt="WeChat Pay" className="w-full h-full object-contain" />
                          </div>
                          <p className="text-xs text-green-600 mt-2 font-bold flex items-center gap-1">
                            微信支付
                          </p>
                        </div>
                      )}
                      {financeConfig.alipayQrUrl && (
                        <div className="flex flex-col items-center">
                          <div className="w-32 h-32 bg-slate-100 rounded p-1 border border-slate-200">
                             <img src={financeConfig.alipayQrUrl} alt="Alipay" className="w-full h-full object-contain" />
                          </div>
                          <p className="text-xs text-blue-500 mt-2 font-bold flex items-center gap-1">
                            支付宝
                          </p>
                        </div>
                      )}
                      {!financeConfig.wechatQrUrl && !financeConfig.alipayQrUrl && (
                        <p className="text-slate-400 text-sm py-4">暂无收款二维码</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="p-8 md:w-1/2 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">提交充值申请</h3>
                  <button onClick={() => setShowRechargeModal(false)}><X className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                </div>

                <form onSubmit={handleRechargeSubmit} className="space-y-6 flex-1 flex flex-col">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">充值金额 (¥)</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                      placeholder="0.00"
                      value={rechargeAmount}
                      onChange={e => setRechargeAmount(e.target.value)}
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">上传转账凭证</label>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors h-48 flex flex-col items-center justify-center cursor-pointer group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                      />
                      {proofPreview ? (
                        <div className="relative w-full h-full">
                          <img src={proofPreview} alt="Proof" className="w-full h-full object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white font-medium">
                            更换图片
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600 font-medium">点击或拖拽上传图片</p>
                          <p className="text-xs text-slate-400 mt-1">支持 JPG, PNG (最大 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-100"
                    >
                      提交审核
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3">提交后财务人员将在 24 小时内完成审核</p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
           <button 
             onClick={() => setPartnerTab('flows')}
             className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
               partnerTab === 'flows' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
             }`}
           >
             <History className="w-4 h-4" /> 资金流水 (已完成)
           </button>
           <button 
             onClick={() => setPartnerTab('applications')}
             className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
               partnerTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
             }`}
           >
             <ListFilter className="w-4 h-4" /> 申请记录 (状态追踪)
           </button>
        </div>

        {/* Tab Content: Transaction History (Flows) */}
        {partnerTab === 'flows' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">时间</th>
                  <th className="px-6 py-3">类型</th>
                  <th className="px-6 py-3">描述/单号</th>
                  <th className="px-6 py-3 text-right">金额</th>
                  <th className="px-6 py-3 text-right">凭证</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {flows.map((flow) => (
                  <tr key={flow.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-500">{new Date(flow.createdAt).toLocaleDateString()} {new Date(flow.createdAt).toLocaleTimeString()}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        flow.businessType === 'SETTLEMENT' || flow.businessType === 'TOPUP' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {flow.businessType}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-slate-900">{flow.description}</p>
                      {flow.orderNo && <p className="text-xs text-slate-400 font-mono">{flow.orderNo}</p>}
                    </td>
                    <td className={`px-6 py-3 text-right font-bold ${flow.flowType === 'INCOME' ? 'text-green-600' : 'text-slate-900'}`}>
                      {flow.flowType === 'INCOME' ? '+' : '-'}¥{flow.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                        {flow.proofUrl && (
                          <button 
                            onClick={() => setPartnerProofPreview(flow.proofUrl || null)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <ImageIcon className="w-3 h-3" /> 查看凭证
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
                {flows.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">暂无资金流水记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Applications History */}
        {partnerTab === 'applications' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                 <tr>
                   <th className="px-6 py-3">申请时间</th>
                   <th className="px-6 py-3">类型</th>
                   <th className="px-6 py-3 text-right">申请金额</th>
                   <th className="px-6 py-3">状态</th>
                   <th className="px-6 py-3">备注 / 驳回原因</th>
                   <th className="px-6 py-3 text-right">凭证</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm">
                 {myApplications.map((app) => (
                   <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(app.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                           app.type === 'TOPUP' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                        }`}>
                           {app.type === 'TOPUP' ? '充值申请' : '提现申请'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-slate-700">
                         ¥{app.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                         {getStatusBadge(app.status)}
                      </td>
                      <td className="px-6 py-3">
                         {app.status === 'REJECTED' && app.rejectReason ? (
                           <span className="text-red-500 text-xs">{app.rejectReason}</span>
                         ) : (
                           <span className="text-slate-400 text-xs">-</span>
                         )}
                      </td>
                      <td className="px-6 py-3 text-right">
                         {app.proofUrl && (
                            <button 
                              onClick={() => setPartnerProofPreview(app.proofUrl || null)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              <ImageIcon className="w-3 h-3" /> 查看凭证
                            </button>
                         )}
                      </td>
                   </tr>
                 ))}
                 {myApplications.length === 0 && (
                   <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">暂无申请记录</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        )}

        {/* Partner Proof Preview Modal */}
        {partnerProofPreview && (
          <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 animate-in fade-in" onClick={() => setPartnerProofPreview(null)}>
             <div className="bg-transparent max-w-4xl max-h-[90vh] p-4 relative" onClick={e => e.stopPropagation()}>
               <button 
                 onClick={() => setPartnerProofPreview(null)} 
                 className="absolute -top-10 right-0 text-white hover:text-gray-300"
               >
                 <X className="w-8 h-8" />
               </button>
               <img src={partnerProofPreview} alt="Proof" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- Finance/Admin View Components ---
  if (isFinance) {
    const [activeTab, setActiveTab] = useState<'audit' | 'settlement' | 'topup' | 'reports'>('audit');
    const [selectedSettlementOrder, setSelectedSettlementOrder] = useState<Order | null>(null);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    
    // Config Modal State
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configForm, setConfigForm] = useState<FinanceConfig>(mockService.getFinanceConfig());

    // Top Up Form State (Manual)
    const [topUpForm, setTopUpForm] = useState({ partnerId: '', amount: '', remark: '' });
    // State for Admin Manual Top-up Proof
    const [manualProofFile, setManualProofFile] = useState<File | null>(null);
    const [manualProofPreview, setManualProofPreview] = useState<string>('');

    // State for Withdrawal Audit Modal (Upload Proof)
    const [approvingWithdrawal, setApprovingWithdrawal] = useState<WithdrawalRequest | null>(null);
    const [withdrawalProofFile, setWithdrawalProofFile] = useState<File | null>(null);
    const [withdrawalProofPreview, setWithdrawalProofPreview] = useState<string>('');

    // Toggle for Withdrawal History in Audit Tab
    const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false);

    // Proof Viewer State
    const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

    // State for Rejection Modal
    const [rejectModalState, setRejectModalState] = useState<{isOpen: boolean, type: 'TOPUP' | 'WITHDRAWAL', id: string, name: string} | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Report Date Filter State
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // Default YYYY-MM

    // Transaction History Filter State
    const [transactionStartDate, setTransactionStartDate] = useState('');
    const [transactionEndDate, setTransactionEndDate] = useState('');

    const partners = mockService.getPartners();
    
    // Data Fetching
    const withdrawals = mockService.getWithdrawals();
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING');
    const historyWithdrawals = withdrawals.filter(w => w.status !== 'PENDING');

    // Fetch Top Up Requests
    const topUpRequests = mockService.getTopUpRequests();
    const pendingTopUps = topUpRequests.filter(t => t.status === 'PENDING');
    const historyTopUps = topUpRequests.filter(t => t.status !== 'PENDING');

    // Unified Transaction Flows for 'Income & Expense Records' tab
    let transactionRecords = mockService.getWalletFlows().filter(f => f.businessType === 'TOPUP' || f.businessType === 'WITHDRAWAL');

    // Apply Date Filter for Transaction Records
    if (transactionStartDate) {
      const start = new Date(transactionStartDate).setHours(0,0,0,0);
      transactionRecords = transactionRecords.filter(t => new Date(t.createdAt).getTime() >= start);
    }
    if (transactionEndDate) {
      const end = new Date(transactionEndDate).setHours(23,59,59,999);
      transactionRecords = transactionRecords.filter(t => new Date(t.createdAt).getTime() <= end);
    }

    const topUps = mockService.getTopUpRecords();

    const settlementOrders = mockService.getOrders().filter(o => 
      o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SETTLED
    );
    const financeStats = mockService.getFinanceOverview();

    // Handlers
    const initiateWithdrawalApproval = (request: WithdrawalRequest) => {
      setApprovingWithdrawal(request);
      setWithdrawalProofFile(null);
      setWithdrawalProofPreview('');
    };

    const handleWithdrawalProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('图片大小不能超过 5MB');
          return;
        }
        setWithdrawalProofFile(file);
        setWithdrawalProofPreview(URL.createObjectURL(file));
      }
    };

    const confirmWithdrawalApproval = () => {
      if (approvingWithdrawal) {
        if (!withdrawalProofPreview) {
          alert('请上传转账凭证以确认提现');
          return;
        }
        mockService.processWithdrawal(approvingWithdrawal.id, true, user.realName, withdrawalProofPreview);
        setApprovingWithdrawal(null);
        setRefreshKey(prev => prev + 1);
      }
    };

    // New Reject Handler
    const initiateReject = (type: 'TOPUP' | 'WITHDRAWAL', id: string, name: string) => {
      setRejectModalState({ isOpen: true, type, id, name });
      setRejectReason('');
    };

    const confirmReject = (e: React.FormEvent) => {
      e.preventDefault();
      if (!rejectModalState || !rejectReason) return;

      if (rejectModalState.type === 'TOPUP') {
        mockService.processTopUp(rejectModalState.id, false, user.realName, rejectReason);
      } else {
        mockService.processWithdrawal(rejectModalState.id, false, user.realName, undefined, rejectReason);
      }
      
      setRejectModalState(null);
      setRejectReason('');
      setRefreshKey(prev => prev + 1);
    };

    const handleTopUpAudit = (id: string, approved: boolean) => {
      mockService.processTopUp(id, approved, user.realName);
      setPreviewProofUrl(null); // Close preview if open
      setRefreshKey(prev => prev + 1);
    };

    const handleSettle = (orderId: string) => {
      const success = mockService.settleOrder(orderId, user.id);
      if (success) {
        alert('结算成功！资金已划转至发布方账户。');
        setRefreshKey(prev => prev + 1);
      } else {
        alert('结算失败，请检查订单状态。');
      }
    };

    const handleManualProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过 5MB');
            return;
          }
          setManualProofFile(file);
          setManualProofPreview(URL.createObjectURL(file));
        }
    };

    const handleTopUpSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!topUpForm.partnerId || !topUpForm.amount) return;

      const success = mockService.manualTopUp(
        topUpForm.partnerId, 
        Number(topUpForm.amount), 
        user.realName, 
        topUpForm.remark,
        manualProofPreview // Pass proof URL if any
      );

      if (success) {
        alert('充值成功！');
        setShowTopUpModal(false);
        setTopUpForm({ partnerId: '', amount: '', remark: '' });
        setManualProofFile(null);
        setManualProofPreview('');
        setRefreshKey(prev => prev + 1);
      }
    };

    const handleConfigSave = (e: React.FormEvent) => {
      e.preventDefault();
      // Fixed: Removed the unused second argument 'user.realName' to match mockService.updateFinanceConfig signature.
      mockService.updateFinanceConfig(configForm);
      alert('财务配置已更新');
      setShowConfigModal(false);
    };

    const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'wechat' | 'alipay') => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('图片大小不能超过 5MB');
          return;
        }
        const url = URL.createObjectURL(file);
        if (type === 'wechat') {
          setConfigForm({ ...configForm, wechatQrUrl: url });
        } else {
          setConfigForm({ ...configForm, alipayQrUrl: url });
        }
      }
    };

    // Report Generation Logic (With Filters)
    const generateReportData = () => {
      // Filter Logic
      const periodTopUps = topUps.filter(t => t.createdAt.startsWith(reportMonth));
      const periodWithdrawals = withdrawals.filter(w => w.status === 'APPROVED' && w.auditTime && w.auditTime.startsWith(reportMonth));
      const periodRevenueOrders = mockService.getOrders().filter(o => 
        (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SETTLED) && 
        o.finishTime && o.finishTime.startsWith(reportMonth)
      );

      const periodTopUpTotal = periodTopUps.reduce((sum, t) => sum + t.amount, 0);
      const periodWithdrawalTotal = periodWithdrawals.filter(w => w.status === 'APPROVED').reduce((sum, w) => sum + w.amount, 0);
      const periodPlatformRevenue = periodRevenueOrders.reduce((sum, o) => sum + o.platformFee, 0);
      const periodNetFlow = periodTopUpTotal + periodPlatformRevenue - periodWithdrawalTotal; // Simplified cash flow view
      
      return [
        { item: '当期充值金额 (资金流入)', amount: periodTopUpTotal, type: 'INCOME' },
        { item: '当期提现金额 (资金流出)', amount: periodWithdrawalTotal, type: 'EXPENSE' },
        { item: '当期平台营收 (利润)', amount: periodPlatformRevenue, type: 'INCOME' },
        { item: '当期净现金流 (流入-流出)', amount: periodNetFlow, type: 'NET' }
      ];
    };

    const handleExport = () => {
      const data = generateReportData();
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Finance_Report_${reportMonth}_${timestamp}.csv`;
      
      let csvContent = `统计周期: ${reportMonth}\n统计项目,金额,类型\n`;
      data.forEach(row => {
         const typeLabel = row.type === 'INCOME' ? '收入/流入' : row.type === 'EXPENSE' ? '支出/流出' : '统计';
         csvContent += `${row.item},${row.amount.toFixed(2)},${typeLabel}\n`;
      });

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    const handleExportTransactions = () => {
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Transactions_${timestamp}.csv`;
      
      let csvContent = "交易时间,交易对象,类型,金额,说明/备注,状态\n";
      transactionRecords.forEach(t => {
         const partnerName = partners.find(p => p.id === t.partnerId)?.name || 'Unknown';
         const typeLabel = t.businessType === 'TOPUP' ? '充值入账' : '提现出账';
         const amountPrefix = t.flowType === 'INCOME' ? '+' : '-';
         const cleanDescription = t.description.replace(/,/g, ' '); // Avoid CSV delimiter conflict
         csvContent += `${new Date(t.createdAt).toLocaleString()},${partnerName},${typeLabel},${amountPrefix}${t.amount},${cleanDescription},已完成\n`;
      });

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">财务工作台</h1>
          <button 
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" />
            收款设置
          </button>
        </div>

        {/* Finance Overview Stats (Always Global) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="p-4 bg-emerald-100 rounded-lg text-emerald-600">
                <TrendingUp className="w-6 h-6" />
             </div>
             <div>
                <p className="text-sm font-medium text-slate-500">平台累计抽成 (总营收)</p>
                <h3 className="text-2xl font-bold text-slate-800">¥{financeStats.totalRevenue.toLocaleString()}</h3>
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="p-4 bg-blue-100 rounded-lg text-blue-600">
                <FileText className="w-6 h-6" />
             </div>
             <div>
                <p className="text-sm font-medium text-slate-500">待结算金额 (应付)</p>
                <h3 className="text-2xl font-bold text-slate-800">¥{financeStats.pendingSettlement.toLocaleString()}</h3>
             </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="p-4 bg-purple-100 rounded-lg text-purple-600">
                <PiggyBank className="w-6 h-6" />
             </div>
             <div>
                <p className="text-sm font-medium text-slate-500">合伙人资金池 (当前余额)</p>
                <h3 className="text-2xl font-bold text-slate-800">¥{financeStats.totalPool.toLocaleString()}</h3>
             </div>
           </div>
        </div>

        <div className="flex border-b border-slate-200 mt-4 overflow-x-auto">
          {[
            { id: 'audit', label: '资金审核', icon: Coins },
            { id: 'settlement', label: '业务结算', icon: FileText },
            { id: 'topup', label: '出入账记录', icon: ArrowRightLeft },
            { id: 'reports', label: '资金报表', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'audit' && (pendingWithdrawals.length + pendingTopUps.length) > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingWithdrawals.length + pendingTopUps.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* --- Audit Tab (Withdrawals + TopUps) --- */}
        {activeTab === 'audit' && (
          <div className="space-y-8">
            {/* 1. Pending Top Ups */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-blue-50 flex items-center gap-2 text-blue-800">
                  <CreditCard className="w-4 h-4" />
                  <h3 className="font-bold">充值申请审核 ({pendingTopUps.length})</h3>
               </div>
               <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">提交时间</th>
                    <th className="px-6 py-4">合伙人</th>
                    <th className="px-6 py-4">充值金额</th>
                    <th className="px-6 py-4">转账凭证</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {pendingTopUps.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.partnerName}</td>
                      <td className="px-6 py-4 font-bold text-green-600">+¥{item.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setPreviewProofUrl(item.proofUrl)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 underline text-xs"
                        >
                          <Eye className="w-3 h-3" /> 查看凭证
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleTopUpAudit(item.id, true)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 text-xs font-medium flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> 确认到账
                          </button>
                          <button 
                            onClick={() => initiateReject('TOPUP', item.id, item.partnerName)}
                            className="bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 text-xs font-medium flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> 驳回
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingTopUps.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">当前没有待审核的充值</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 2. Pending Withdrawals */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-yellow-50 flex items-center justify-between text-yellow-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <h3 className="font-bold">提现申请审核 ({pendingWithdrawals.length})</h3>
                  </div>
                  <button 
                    onClick={() => setShowWithdrawalHistory(!showWithdrawalHistory)}
                    className="text-xs font-medium underline hover:text-yellow-900"
                  >
                    {showWithdrawalHistory ? '隐藏历史记录' : '查看提现历史'}
                  </button>
               </div>
               
               {/* Pending Table */}
               {!showWithdrawalHistory && (
                 <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">申请时间</th>
                      <th className="px-6 py-4">申请合伙人</th>
                      <th className="px-6 py-4">提现金额</th>
                      <th className="px-6 py-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pendingWithdrawals.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{item.partnerName}</td>
                        <td className="px-6 py-4 font-bold text-red-600">-¥{item.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => initiateWithdrawalApproval(item)}
                              className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 text-xs font-medium flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> 通过
                            </button>
                            <button 
                              onClick={() => initiateReject('WITHDRAWAL', item.id, item.partnerName)}
                              className="bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 text-xs font-medium flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> 拒绝
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingWithdrawals.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">当前没有待审核的提现</td></tr>
                    )}
                  </tbody>
                </table>
               )}

               {/* History Table */}
               {showWithdrawalHistory && (
                 <table className="w-full text-left bg-slate-50/50">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">处理时间</th>
                      <th className="px-6 py-4">合伙人</th>
                      <th className="px-6 py-4">金额</th>
                      <th className="px-6 py-4">状态</th>
                      <th className="px-6 py-4">审核人</th>
                      <th className="px-6 py-4 text-right">备注/凭证</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {historyWithdrawals.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-500">{item.auditTime ? new Date(item.auditTime).toLocaleString() : '-'}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{item.partnerName}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">¥{item.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.status === 'APPROVED' ? '已打款' : '已拒绝'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{item.auditUser}</td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {item.status === 'REJECTED' && item.rejectReason && (
                             <div className="group relative">
                                <span className="text-xs text-red-500 underline cursor-help flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> 驳回原因
                                </span>
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                  {item.rejectReason}
                                </div>
                             </div>
                          )}
                          {item.proofUrl ? (
                            <button 
                              onClick={() => setPreviewProofUrl(item.proofUrl || null)}
                              className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> 凭证
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs">{item.status !== 'REJECTED' && '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {historyWithdrawals.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">暂无历史提现记录</td></tr>
                    )}
                  </tbody>
                </table>
               )}
            </div>
          </div>
        )}

        {/* --- Transaction History Filter Tab --- */}
        {activeTab === 'topup' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center bg-slate-50 gap-4">
               <div>
                 <h3 className="font-bold text-slate-800">出入账明细</h3>
                 <p className="text-xs text-slate-500">包含所有充值入账及提现出账记录</p>
               </div>
               
               <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                 <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <input 
                      type="date"
                      className="text-xs border-none outline-none text-slate-600 bg-transparent px-2"
                      value={transactionStartDate}
                      onChange={e => setTransactionStartDate(e.target.value)}
                      title="开始日期"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="date"
                      className="text-xs border-none outline-none text-slate-600 bg-transparent px-2"
                      value={transactionEndDate}
                      onChange={e => setTransactionEndDate(e.target.value)}
                      title="结束日期"
                    />
                    {(transactionStartDate || transactionEndDate) && (
                      <button 
                        onClick={() => { setTransactionStartDate(''); setTransactionEndDate(''); }}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="重置筛选"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                 </div>

                 <div className="flex gap-2">
                   <button 
                     onClick={handleExportTransactions}
                     className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                   >
                     <Download className="w-3 h-3" />
                     导出 Excel
                   </button>
                   <button 
                     onClick={() => setShowTopUpModal(true)}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                   >
                     <Plus className="w-3 h-3" />
                     人工补录
                   </button>
                 </div>
               </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-4">交易时间</th>
                  <th className="px-6 py-4">交易对象</th>
                  <th className="px-6 py-4">类型</th>
                  <th className="px-6 py-4">金额</th>
                  <th className="px-6 py-4">说明/备注</th>
                  <th className="px-6 py-4 text-right">凭证</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactionRecords.map(t => {
                   const partnerName = partners.find(p => p.id === t.partnerId)?.name || 'Unknown';
                   const isIncome = t.flowType === 'INCOME';
                   return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{partnerName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {t.businessType === 'TOPUP' ? '充值入账' : '提现出账'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}¥{t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{t.description}</td>
                      <td className="px-6 py-4 text-right">
                        {t.proofUrl ? (
                          <button 
                            onClick={() => setPreviewProofUrl(t.proofUrl || null)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:border-blue-200 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> 查看
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">无凭证</span>
                        )}
                      </td>
                    </tr>
                   );
                })}
                {transactionRecords.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">暂无符合条件的交易记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- Reports Tab --- */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <div>
                   <h3 className="text-lg font-bold text-slate-800">资金对账总表</h3>
                   <p className="text-slate-500 text-sm">选择日期范围进行周期性统计</p>
                 </div>
                 
                 <div className="flex items-center gap-3">
                   <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input 
                       type="month"
                       className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm"
                       value={reportMonth}
                       onChange={e => setReportMonth(e.target.value)}
                     />
                   </div>
                   <button 
                     onClick={handleExport}
                     className="flex items-center gap-2 text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                   >
                     <Download className="w-4 h-4" /> 导出
                   </button>
                 </div>
               </div>
               
               <div className="overflow-hidden rounded-lg border border-slate-200">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                     <tr>
                       <th className="px-6 py-4">统计项目</th>
                       <th className="px-6 py-4 text-right">总金额</th>
                       <th className="px-6 py-4">类型</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-sm">
                     {generateReportData().map((row, idx) => (
                       <tr key={idx} className="hover:bg-slate-50">
                         <td className="px-6 py-4 font-medium text-slate-900">{row.item}</td>
                         <td className={`px-6 py-4 text-right font-bold text-lg ${
                           row.type === 'INCOME' ? 'text-green-600' : 
                           row.type === 'EXPENSE' ? 'text-red-600' : 
                           row.amount >= 0 ? 'text-blue-600' : 'text-red-500'
                         }`}>
                           ¥{row.amount.toLocaleString()}
                         </td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-xs ${
                              row.type === 'INCOME' ? 'bg-green-100 text-green-700' : 
                              row.type === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                           }`}>{
                             row.type === 'INCOME' ? '收入/流入' : 
                             row.type === 'EXPENSE' ? '支出/流出' : '统计'
                           }</span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* --- Settlement Tab --- */}
        {activeTab === 'settlement' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">订单编号</th>
                    <th className="px-6 py-4">发布方 (应收)</th>
                    <th className="px-6 py-4">接单方 (应付)</th>
                    <th className="px-6 py-4 text-center">平台收益</th>
                    <th className="px-6 py-4 text-center">总金额</th>
                    <th className="px-6 py-4 text-center">结算状态</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {settlementOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-mono text-slate-700">{order.orderNo}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs shrink-0">卖</div>
                          <div>
                             <p className="text-slate-900 font-medium">{order.publishPartnerName}</p>
                             <p className="text-xs text-green-600">+¥{order.publishPrice.toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">买</div>
                          <div>
                             <p className="text-slate-900 font-medium">{order.grabPartnerName}</p>
                             <p className="text-xs text-red-600">-¥{order.grabPrice.toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                          <div className="inline-block px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="font-bold text-blue-600">+¥{order.platformFee.toLocaleString()}</p>
                              <p className="text-[10px] text-blue-400">服务费</p>
                          </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-500">
                        ¥{order.grabPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === OrderStatus.SETTLED ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status === OrderStatus.SETTLED ? '已结算' : '待结算'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                        <button 
                          onClick={() => setSelectedSettlementOrder(order)}
                          className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium"
                        >
                          <Eye className="w-4 h-4" /> 明细
                        </button>
                        
                        {order.status === OrderStatus.COMPLETED && (
                          <button 
                            onClick={() => handleSettle(order.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors shadow-sm"
                          >
                            立即结算
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                   {settlementOrders.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">暂无待结算或已结算订单</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Settlement Breakdown Modal */}
            {selectedSettlementOrder && (
              <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">订单结算明细</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedSettlementOrder.orderNo}</p>
                    </div>
                    <button onClick={() => setSelectedSettlementOrder(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-slate-500">业务类型</p>
                        <p className="font-bold text-slate-800">{selectedSettlementOrder.type}</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-slate-300" />
                       <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
                          <Coins className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-slate-500">总交易额</p>
                        <p className="font-bold text-slate-800">¥{selectedSettlementOrder.grabPrice.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-5 space-y-4 border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">资金分账详情</h4>
                      
                      {/* Incoming */}
                      <div className="flex justify-between items-center pb-4 border-b border-slate-200 border-dashed">
                        <div>
                          <p className="font-medium text-slate-700">接单方支付 (成本)</p>
                          <p className="text-xs text-slate-500">{selectedSettlementOrder.grabPartnerName}</p>
                        </div>
                        <span className="font-bold text-slate-800">¥{selectedSettlementOrder.grabPrice.toLocaleString()}</span>
                      </div>

                      {/* Outgoing - Platform */}
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                           <span className="text-sm text-slate-600">平台抽成 (利润)</span>
                         </div>
                         <span className="font-bold text-blue-600">- ¥{selectedSettlementOrder.platformFee.toLocaleString()}</span>
                      </div>

                      {/* Outgoing - Publisher */}
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-green-500"></span>
                           <div>
                             <p className="text-sm text-slate-600">发布方收入 (实际到账)</p>
                             <p className="text-xs text-slate-400">{selectedSettlementOrder.publishPartnerName}</p>
                           </div>
                         </div>
                         <span className="font-bold text-green-600">= ¥{selectedSettlementOrder.publishPrice.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {selectedSettlementOrder.status === OrderStatus.COMPLETED && (
                      <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100 flex items-start gap-2">
                         <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                         <p>此订单已完成验收，但资金尚未划拨。点击下方“立即结算”将扣除接单方冻结款并转入发布方余额。</p>
                      </div>
                    )}

                    <div className="mt-6 flex gap-3">
                       <button 
                         onClick={() => setSelectedSettlementOrder(null)}
                         className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 px-6 py-2 rounded-lg font-medium transition-colors"
                       >
                         关闭
                       </button>
                       {selectedSettlementOrder.status === OrderStatus.COMPLETED && (
                         <button 
                           onClick={() => {
                             handleSettle(selectedSettlementOrder.id);
                             setSelectedSettlementOrder(null);
                           }}
                           className="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
                         >
                           立即结算
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* --- Withdrawal Approval Upload Modal --- */}
        {approvingWithdrawal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6">确认提现转账</h3>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">提现金额</p>
                    <p className="text-2xl font-bold text-slate-900">¥{approvingWithdrawal.amount.toLocaleString()}</p>
                    <div className="mt-2 text-sm text-slate-600">
                      申请人: {approvingWithdrawal.partnerName}
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">上传转账凭证</label>
                     <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors h-40 flex flex-col items-center justify-center cursor-pointer group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={handleWithdrawalProofChange}
                        />
                        {withdrawalProofPreview ? (
                          <div className="relative w-full h-full">
                            <img src={withdrawalProofPreview} alt="Proof" className="w-full h-full object-contain rounded" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded text-white font-medium">
                              更换图片
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-600 font-medium">点击上传转账截图</p>
                          </>
                        )}
                     </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                     <button 
                       type="button"
                       onClick={() => setApprovingWithdrawal(null)}
                       className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                     >
                       取消
                     </button>
                     <button 
                       type="button"
                       onClick={confirmWithdrawalApproval}
                       className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                     >
                       确认已转账
                     </button>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* --- Rejection Reason Modal --- */}
        {rejectModalState && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                   <AlertCircle className="w-6 h-6" />
                   <h3 className="text-lg font-bold">确认驳回?</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  您正在驳回 <strong>{rejectModalState.name}</strong> 的
                  {rejectModalState.type === 'TOPUP' ? '充值' : '提现'}
                  申请。请填写驳回原因，该信息将发送给申请人。
                </p>
                <form onSubmit={confirmReject}>
                   <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">驳回原因</label>
                      <textarea 
                        required
                        autoFocus
                        rows={3}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="例如：转账凭证模糊 / 金额不符"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                   </div>
                   <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setRejectModalState(null)}
                        className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                      >
                        取消
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                      >
                        确认驳回
                      </button>
                   </div>
                </form>
             </div>
          </div>
        )}

        {/* --- Config Modal --- */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">财务收款配置</h3>
                  <button onClick={() => setShowConfigModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <form onSubmit={handleConfigSave} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                    <h4 className="font-bold text-sm text-slate-700 uppercase">银行转账信息</h4>
                    <div>
                       <label className="block text-sm font-medium text-slate-600 mb-1">开户银行</label>
                       <input 
                         required
                         className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                         value={configForm.bankName}
                         onChange={e => setConfigForm({...configForm, bankName: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-600 mb-1">账户名称</label>
                       <input 
                         required
                         className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                         value={configForm.accountName}
                         onChange={e => setConfigForm({...configForm, accountName: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-600 mb-1">银行账号</label>
                       <input 
                         required
                         className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-mono"
                         value={configForm.accountNumber}
                         onChange={e => setConfigForm({...configForm, accountNumber: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                    <h4 className="font-bold text-sm text-slate-700 uppercase">扫码支付配置</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* WeChat Pay */}
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-slate-600 mb-2">微信收款码</label>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-lg h-32 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer group bg-white overflow-hidden">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => handleQrUpload(e, 'wechat')}
                          />
                          {configForm.wechatQrUrl ? (
                            <div className="relative w-full h-full">
                              <img src={configForm.wechatQrUrl} alt="WeChat" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                                点击更换
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-slate-400">
                              <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                              <span className="text-xs">上传图片</span>
                            </div>
                          )}
                        </div>
                        {configForm.wechatQrUrl && (
                          <button 
                            type="button" 
                            onClick={() => setConfigForm({...configForm, wechatQrUrl: ''})}
                            className="text-xs text-red-500 mt-1 hover:underline text-center"
                          >
                            移除
                          </button>
                        )}
                      </div>

                      {/* Alipay */}
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-slate-600 mb-2">支付宝收款码</label>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-lg h-32 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer group bg-white overflow-hidden">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => handleQrUpload(e, 'alipay')}
                          />
                          {configForm.alipayQrUrl ? (
                            <div className="relative w-full h-full">
                              <img src={configForm.alipayQrUrl} alt="Alipay" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                                点击更换
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-slate-400">
                              <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                              <span className="text-xs">上传图片</span>
                            </div>
                          )}
                        </div>
                        {configForm.alipayQrUrl && (
                          <button 
                            type="button" 
                            onClick={() => setConfigForm({...configForm, alipayQrUrl: ''})}
                            className="text-xs text-red-500 mt-1 hover:underline text-center"
                          >
                            移除
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 text-center">
                      * 支持 JPG/PNG 格式，单张图片限制 5MB 以内。
                    </p>
                  </div>

                  <div className="pt-2 flex gap-3">
                     <button 
                       type="button"
                       onClick={() => setShowConfigModal(false)}
                       className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                     >
                       取消
                     </button>
                     <button 
                       type="submit"
                       className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                     >
                       保存配置
                     </button>
                  </div>
                </form>
             </div>
          </div>
        )}

        {/* --- Manual Top Up Modal --- */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6">人工入账补录</h3>
                <form onSubmit={handleTopUpSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">充值对象</label>
                     <select 
                       required
                       className="w-full border border-slate-300 rounded-lg px-3 py-2"
                       value={topUpForm.partnerId}
                       onChange={e => setTopUpForm({...topUpForm, partnerId: e.target.value})}
                     >
                        <option value="">请选择合伙人</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.contactPhone})</option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">充值金额 (¥)</label>
                     <input 
                       type="number"
                       required
                       min="1"
                       className="w-full border border-slate-300 rounded-lg px-3 py-2"
                       value={topUpForm.amount}
                       onChange={e => setTopUpForm({...topUpForm, amount: e.target.value})}
                       placeholder="请输入入账金额"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">入账凭证 (可选)</label>
                     <div className="flex items-center gap-3">
                       <div className="relative border border-slate-300 border-dashed rounded-lg w-16 h-16 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden shrink-0">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            onChange={handleManualProofChange}
                          />
                          {manualProofPreview ? (
                            <img src={manualProofPreview} alt="Proof" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-6 h-6 text-slate-400" />
                          )}
                       </div>
                       <div className="flex-1 text-xs text-slate-500">
                         {manualProofFile ? (
                           <span className="text-slate-800 font-medium truncate block">{manualProofFile.name}</span>
                         ) : (
                           "上传银行回单或截图"
                         )}
                         <p className="mt-0.5">支持 Max 5MB</p>
                       </div>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">入账备注</label>
                     <textarea 
                       required
                       rows={3}
                       className="w-full border border-slate-300 rounded-lg px-3 py-2 resize-none"
                       value={topUpForm.remark}
                       onChange={e => setTopUpForm({...topUpForm, remark: e.target.value})}
                       placeholder="例如：招商银行转账流水号 123456"
                     />
                  </div>
                  <div className="pt-2 flex gap-3">
                     <button 
                       type="button"
                       onClick={() => setShowTopUpModal(false)}
                       className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                     >
                       取消
                     </button>
                     <button 
                       type="submit"
                       className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                     >
                       确认充值
                     </button>
                  </div>
                </form>
             </div>
          </div>
        )}

        {/* --- Proof Image Preview Modal --- */}
        {previewProofUrl && (
          <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 animate-in fade-in" onClick={() => setPreviewProofUrl(null)}>
             <div className="bg-transparent max-w-4xl max-h-[90vh] p-4 relative" onClick={e => e.stopPropagation()}>
               <button 
                 onClick={() => setPreviewProofUrl(null)} 
                 className="absolute -top-10 right-0 text-white hover:text-gray-300"
               >
                 <X className="w-8 h-8" />
               </button>
               <img src={previewProofUrl} alt="Transfer Proof" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
             </div>
          </div>
        )}
      </div>
    );
  }

  return <div>Access Denied</div>;
};