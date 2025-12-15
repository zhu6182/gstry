import React from 'react';
import { User, UserRole } from '../types';
import { mockService } from '../services/mockService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Users, AlertCircle, Wallet } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
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

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.OPERATIONS;
  const isPartner = user.role === UserRole.PARTNER;

  const stats = isAdmin ? mockService.getPlatformStats() : { volume: 0, revenue: 0, pendingSettlement: 0 };
  
  // Mock chart data
  const chartData = [
    { name: '周一', revenue: 4000, orders: 24 },
    { name: '周二', revenue: 3000, orders: 13 },
    { name: '周三', revenue: 2000, orders: 38 },
    { name: '周四', revenue: 2780, orders: 39 },
    { name: '周五', revenue: 1890, orders: 48 },
    { name: '周六', revenue: 2390, orders: 38 },
    { name: '周日', revenue: 3490, orders: 43 },
  ];

  if (isPartner && user.partnerId) {
    const partner = mockService.getPartnerById(user.partnerId);
    const wallet = mockService.getWallet(user.partnerId);
    const myOrders = mockService.getOrders().filter(o => o.grabPartnerId === user.partnerId || o.publishPartnerId === user.partnerId);
    
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">合伙人概览</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="钱包可用余额" 
            value={`¥${wallet.balance.toLocaleString()}`} 
            subtext={`冻结: ¥${wallet.frozenBalance}`} 
            icon={Wallet} 
            color="bg-emerald-500" 
          />
          <StatCard 
            title="进行中订单" 
            value={myOrders.filter(o => o.status === 'PROCESSING').length} 
            subtext="当前正在执行的任务" 
            icon={ShoppingCart} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="本月总收益" 
            value="¥12,450" 
            subtext="较上月 +15%" 
            icon={TrendingUp} 
            color="bg-indigo-500" 
          />
          <StatCard 
            title="待抢订单" 
            value={mockService.getOrders().filter(o => o.status === 'PUBLISHED').length} 
            subtext="发现新商机" 
            icon={Users} 
            color="bg-orange-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">业绩趋势</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="revenue" name="收益" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-semibold mb-4 text-slate-800">快捷操作</h3>
             <div className="space-y-3">
               <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-blue-200 shadow-lg">
                 去抢单
               </button>
               {partner?.permissions.canPublish && (
                 <button className="w-full py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors">
                   发布新需求
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

  // Admin View
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">平台总览</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="总交易额" 
          value={`¥${stats.volume.toLocaleString()}`} 
          subtext="GMV (商品交易总额)" 
          icon={ShoppingCart} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="平台营收" 
          value={`¥${stats.revenue.toLocaleString()}`} 
          subtext="净佣金收入 (约30%)" 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="待结算金额" 
          value={`¥${stats.pendingSettlement.toLocaleString()}`} 
          subtext="待支付给合伙人" 
          icon={Wallet} 
          color="bg-orange-500" 
        />
         <StatCard 
          title="活跃合伙人" 
          value={mockService.getPartners().length} 
          subtext="覆盖 12 个城市" 
          icon={Users} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">营收与订单趋势</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="营收" />
                <Bar yAxisId="right" dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} name="订单量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-semibold mb-4 text-slate-800">近期系统动态</h3>
           <div className="space-y-4">
             {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                 <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                   <Users className="w-5 h-5" />
                 </div>
                 <div className="flex-1">
                   <p className="text-sm font-medium text-slate-800">合伙人 A 抢到了订单 #ORD102{i}</p>
                   <p className="text-xs text-slate-500">2 分钟前 • 上海</p>
                 </div>
                 <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                   + ¥300 抽成
                 </span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
