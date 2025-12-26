import React, { useMemo, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockService } from '../services/mockService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Users, AlertCircle, Wallet, Activity, Clock, CreditCard, Gavel } from 'lucide-react';

interface DashboardProps {
  user: User;
  onNavigate?: (view: string) => void;
}

const StatCard = ({ title, value, subtext, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        <p className={`text-xs mt-2 ${subtext.includes('+') ? 'text-green-600' : 'text-slate-400'}`}>
          {subtext}
        </p>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.OPERATIONS || user.role === UserRole.DISPATCHER;
  const isPartner = user.role === UserRole.PARTNER;
  const [tick, setTick] = useState(0);

  // Auto-refresh data every 5 seconds to show "Real-time" updates
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  // --- Dynamic Data Calculation ---
  
  // 1. Generate Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      // Create simplified date key YYYY-MM-DD for matching
      const dateKey = d.toISOString().split('T')[0]; 
      const displayDate = `${d.getMonth() + 1}/${d.getDate()}`; // Format M/D

      let dailyRevenue = 0;
      let dailyOrders = 0;

      if (isPartner && user.partnerId) {
         // Partner Logic: 
         // Revenue = Sum of INCOME flows on this day
         const flows = mockService.getWalletFlows(user.partnerId).filter(f => 
            f.flowType === 'INCOME' && f.createdAt.startsWith(dateKey)
         );
         dailyRevenue = flows.reduce((sum, f) => sum + f.amount, 0);
         
         // Orders = Orders published or grabbed on this day
         const involvedOrders = mockService.getOrders().filter(o => 
            (o.publishPartnerId === user.partnerId || o.grabPartnerId === user.partnerId) &&
            o.createdAt.startsWith(dateKey)
         );
         dailyOrders = involvedOrders.length;

      } else {
         // Admin Logic:
         // Revenue = Sum of platform fees from orders created on this day (simplified trend)
         const dayOrders = mockService.getOrders().filter(o => o.createdAt.startsWith(dateKey));
         dailyRevenue = dayOrders.reduce((sum, o) => sum + o.platformFee, 0);
         dailyOrders = dayOrders.length;
      }

      data.push({ name: displayDate, revenue: dailyRevenue, orders: dailyOrders });
    }
    return data;
  }, [isPartner, user.partnerId, tick]); // Depend on tick

  // 2. Fetch Latest Activity (Admin Only)
  const recentActivity = useMemo(() => {
    if (!isAdmin) return [];
    return mockService.getOrders()
      .filter(o => o.grabPartnerId && o.grabTime) 
      .sort((a, b) => new Date(b.grabTime!).getTime() - new Date(a.grabTime!).getTime())
      .slice(0, 5)
      .map(o => ({
         id: o.id,
         grabberName: o.grabPartnerName,
         publisherName: o.publishPartnerName,
         orderNo: o.orderNo,
         city: mockService.getCityName(o.cityCode),
         time: o.grabTime,
         fee: o.platformFee
      }));
  }, [isAdmin, tick]);

  // 3. Admin Pending Tasks
  const adminTasks = useMemo(() => {
    if (!isAdmin) return { withdrawals: 0, topups: 0, exceptions: 0 };
    return {
      withdrawals: mockService.getWithdrawals().filter(w => w.status === 'PENDING').length,
      topups: mockService.getTopUpRequests().filter(t => t.status === 'PENDING').length,
      exceptions: mockService.getOrders().filter(o => o.status === 'EXCEPTION' || o.status === 'MEDIATING').length
    };
  }, [isAdmin, tick]);

  // --- Partner View ---
  if (isPartner && user.partnerId) {
    const partner = mockService.getPartnerById(user.partnerId);
    const wallet = mockService.getWallet(user.partnerId);
    const myOrders = mockService.getOrders().filter(o => o.grabPartnerId === user.partnerId || o.publishPartnerId === user.partnerId);
    
    // Calculate Monthly Revenue
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyIncome = mockService.getWalletFlows(user.partnerId)
       .filter(f => f.flowType === 'INCOME' && f.createdAt.startsWith(currentMonth))
       .reduce((sum, f) => sum + f.amount, 0);

    const availableOrdersCount = mockService.getOrders().filter(o => 
      o.status === 'PUBLISHED' && o.publishPartnerId !== user.partnerId
    ).length;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <h1 className="text-2xl font-bold text-slate-800">合伙人概览</h1>
           <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
             <Activity className="w-3 h-3" /> 数据实时同步中
           </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="钱包可用余额" 
            value={`¥${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`} 
            subtext={`冻结: ¥${wallet.frozenBalance.toLocaleString()}`} 
            icon={Wallet} 
            color="bg-emerald-500" 
            onClick={() => onNavigate && onNavigate('finance')}
          />
          <StatCard 
            title="进行中订单" 
            value={myOrders.filter(o => o.status === 'PROCESSING').length} 
            subtext="当前正在执行的任务" 
            icon={ShoppingCart} 
            color="bg-blue-500" 
            onClick={() => onNavigate && onNavigate('my-orders')}
          />
          <StatCard 
            title="本月总收益" 
            value={`¥${monthlyIncome.toLocaleString()}`} 
            subtext="根据实际入账统计" 
            icon={TrendingUp} 
            color="bg-indigo-500" 
            onClick={() => onNavigate && onNavigate('finance')}
          />
          <StatCard 
            title="待抢订单" 
            value={availableOrdersCount} 
            subtext="发现新商机" 
            icon={Users} 
            color="bg-orange-500" 
            onClick={() => onNavigate && onNavigate('order-hall')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">近7天业绩趋势 (收益)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip formatter={(value: number) => [`¥${value}`, '收益']} />
                  <Line type="monotone" dataKey="revenue" name="收益" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-semibold mb-4 text-slate-800">快捷操作</h3>
             <div className="space-y-3">
               <button 
                 onClick={() => onNavigate && onNavigate('order-hall')}
                 className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-blue-200 shadow-lg flex items-center justify-center gap-2"
               >
                 <ShoppingCart className="w-4 h-4" /> 去抢单
               </button>
               {partner?.permissions.canPublish && (
                 <button 
                   onClick={() => onNavigate && onNavigate('publish')}
                   className="w-full py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                 >
                   <TrendingUp className="w-4 h-4" /> 发布新需求
                 </button>
               )}
               <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mt-4">
                 <div className="flex items-center gap-2 text-blue-800 font-semibold mb-1">
                   <AlertCircle className="w-4 h-4" /> 提示
                 </div>
                 <p className="text-sm text-blue-700">
                   结算每周二处理。请确保您的订单在周日之前标记为完成，以便及时到账。
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Admin/Operations/Dispatcher View ---
  const stats = mockService.getPlatformStats();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-slate-800">平台总览</h1>
         <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full animate-pulse">
           <Activity className="w-3 h-3" /> 数据实时监控中
         </span>
      </div>
      
      {/* 待办事项提醒 (Admin Only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* Only show finance tasks to Admin/Finance, not Dispatcher */}
         {user.role !== UserRole.DISPATCHER && (
           <>
             <div 
               className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-orange-100 transition-colors"
               onClick={() => onNavigate && onNavigate('finance')}
             >
                <div className="flex items-center gap-3">
                   <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                      <Clock className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">待审提现</p>
                      <p className="text-lg font-bold text-slate-800">{adminTasks.withdrawals} 笔</p>
                   </div>
                </div>
                {adminTasks.withdrawals > 0 && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
             </div>
             <div 
               className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-100 transition-colors"
               onClick={() => onNavigate && onNavigate('finance')}
             >
                <div className="flex items-center gap-3">
                   <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <CreditCard className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">待审充值</p>
                      <p className="text-lg font-bold text-slate-800">{adminTasks.topups} 笔</p>
                   </div>
                </div>
                {adminTasks.topups > 0 && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
             </div>
           </>
         )}
         
         {/* Everyone sees Exception tasks */}
         <div 
           className={`bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors ${user.role === UserRole.DISPATCHER ? 'col-span-3' : ''}`}
           onClick={() => onNavigate && onNavigate('orders')}
         >
            <div className="flex items-center gap-3">
               <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                  <Gavel className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">异常/仲裁订单</p>
                  <p className="text-lg font-bold text-slate-800">{adminTasks.exceptions} 单</p>
               </div>
            </div>
            {adminTasks.exceptions > 0 && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="平台累计抽成" 
          value={`¥${stats.revenue.toLocaleString()}`} 
          subtext="净佣金收入" 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="总交易流水 (GMV)" 
          value={`¥${stats.volume.toLocaleString()}`} 
          subtext="商品交易总额" 
          icon={ShoppingCart} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="待结算金额" 
          value={`¥${stats.pendingSettlement.toLocaleString()}`} 
          subtext="冻结池资金" 
          icon={Wallet} 
          color="bg-orange-500" 
        />
         <StatCard 
          title="活跃合伙人" 
          value={mockService.getPartners().filter(p => p.status === 'ACTIVE').length} 
          subtext={`总计 ${mockService.getPartners().length} 位`} 
          icon={Users} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">近7天营收与订单趋势</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} />
                <RechartsTooltip formatter={(value: number, name: string) => [name === 'revenue' ? `¥${value}` : value, name === 'revenue' ? '营收' : '订单量']} />
                <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="营收" barSize={30} />
                <Bar yAxisId="right" dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} name="订单量" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-slate-800">近期交易动态</h3>
             <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">实时更新</span>
           </div>
           <div className="space-y-0 divide-y divide-slate-50">
             {recentActivity.length > 0 ? recentActivity.map((act) => (
               <div key={act.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors -mx-3 px-3 rounded-lg">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                   <Activity className="w-5 h-5" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-slate-800 truncate">
                     <span className="font-bold text-blue-600">{act.grabberName}</span> 抢单成功
                   </p>
                   <p className="text-xs text-slate-500 truncate mt-0.5">
                     订单号 {act.orderNo} • {act.city}
                   </p>
                 </div>
                 <div className="text-right shrink-0">
                   <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded block">
                     + ¥{act.fee} 营收
                   </span>
                   <span className="text-[10px] text-slate-400 mt-1 block">
                     {new Date(act.time || '').toLocaleTimeString()}
                   </span>
                 </div>
               </div>
             )) : (
               <div className="py-12 text-center text-slate-400 text-sm">
                 暂无近期抢单记录
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};