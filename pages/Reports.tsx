import React from 'react';
import { mockService } from '../services/mockService';
import { OrderStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, Trophy, TrendingUp, Users } from 'lucide-react';

export const Reports: React.FC = () => {
  const data = mockService.getReportData();
  const partners = mockService.getPartners();
  const orders = mockService.getOrders();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Calculate detailed performance stats per partner
  const partnerStats = partners.map(partner => {
    const publishedOrders = orders.filter(o => o.publishPartnerId === partner.id);
    const grabbedOrders = orders.filter(o => o.grabPartnerId === partner.id);
    
    const totalPublishedAmount = publishedOrders.reduce((acc, curr) => acc + curr.publishPrice, 0);
    const totalGrabbedRevenue = grabbedOrders.reduce((acc, curr) => acc + curr.publishPrice, 0); // Estimate revenue as publish price they get (simplified)
    const completedTasks = grabbedOrders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SETTLED).length;

    return {
      ...partner,
      publishCount: publishedOrders.length,
      grabCount: grabbedOrders.length,
      completedCount: completedTasks,
      totalVolume: totalPublishedAmount + totalGrabbedRevenue
    };
  }).sort((a, b) => b.totalVolume - a.totalVolume);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">数据分析报表</h1>
          <p className="text-slate-500 text-sm">平台核心业务指标统计</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm">
          <Download className="w-4 h-4" />
          导出 Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            城市营收排名 (TOP 5)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.revenueByCity}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={50} />
                <RechartsTooltip formatter={(value) => `¥${value}`} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="营收额" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Type Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            订单类型分布
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.orderTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {data.orderTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Detailed Partner Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
           <Trophy className="w-5 h-5 text-yellow-500" />
           <h3 className="font-bold text-slate-800">合伙人业绩排行榜</h3>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead>
               <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                 <th className="px-6 py-4">排名</th>
                 <th className="px-6 py-4">合伙人名称</th>
                 <th className="px-6 py-4">所属城市</th>
                 <th className="px-6 py-4 text-center">发布订单数</th>
                 <th className="px-6 py-4 text-center">抢单总数</th>
                 <th className="px-6 py-4 text-center">已完成交付</th>
                 <th className="px-6 py-4 text-right">总流水金额估算</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-sm">
               {partnerStats.map((stat, index) => (
                 <tr key={stat.id} className="hover:bg-slate-50">
                   <td className="px-6 py-4">
                     <span className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                       index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'
                     }`}>
                       {index + 1}
                     </span>
                   </td>
                   <td className="px-6 py-4 font-medium text-slate-900">
                     {stat.name}
                   </td>
                   <td className="px-6 py-4 text-slate-500">
                     {mockService.getCityName(stat.cityCode)}
                   </td>
                   <td className="px-6 py-4 text-center text-slate-700">
                     {stat.publishCount}
                   </td>
                   <td className="px-6 py-4 text-center text-slate-700">
                     {stat.grabCount}
                   </td>
                   <td className="px-6 py-4 text-center">
                     <span className="text-green-600 font-medium">{stat.completedCount}</span>
                   </td>
                   <td className="px-6 py-4 text-right font-bold text-blue-600">
                     ¥{stat.totalVolume.toLocaleString()}
                   </td>
                 </tr>
               ))}
               {partnerStats.length === 0 && (
                 <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">暂无数据</td></tr>
               )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};