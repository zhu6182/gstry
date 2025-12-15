import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, User, UserRole } from '../types';
import { mockService } from '../services/mockService';
import { MapPin, Clock, Briefcase, ChevronRight, CheckCircle, Lock, Building } from 'lucide-react';

interface OrderHallProps {
  user: User;
}

export const OrderHall: React.FC<OrderHallProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterCityCode, setFilterCityCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [grabSuccess, setGrabSuccess] = useState<string | null>(null);

  const partner = user.partnerId ? mockService.getPartnerById(user.partnerId) : null;
  const canGrab = partner?.permissions.canGrab;
  const canCrossCity = partner?.permissions.canCrossCity;
  const myCityCode = partner?.cityCode || '';

  useEffect(() => {
    setOrders(mockService.getOrders());
    // 如果没有跨城权限，强制只能看本地
    if (!canCrossCity && myCityCode) {
      setFilterCityCode(myCityCode);
    }
  }, [grabSuccess, canCrossCity, myCityCode]);

  const handleGrab = (orderId: string) => {
    setLoading(true);
    setTimeout(() => {
      if (!canGrab) {
        setLoading(false);
        return;
      }
      
      const success = mockService.grabOrder(orderId, user.partnerId!, partner?.name || '未知公司');
      setLoading(false);
      if (success) {
        setGrabSuccess(orderId);
        setTimeout(() => setGrabSuccess(null), 3000);
      } else {
        alert('订单已被抢或无效！');
      }
    }, 800);
  };

  const getPublisherDisplay = (order: Order) => {
    // Admin/Ops see the real name for management purposes
    if (user.role !== UserRole.PARTNER) {
      return { label: order.publishPartnerName.split(' ')[0], type: 'REAL', isPlatform: false };
    }

    // Check if the publisher is an internal role (Platform)
    const publisherPartner = mockService.getPartnerById(order.publishPartnerId);
    
    // If no partner profile exists for the ID, it implies a System/Admin direct creation
    if (!publisherPartner) {
      return { label: '平台推送订单', type: 'PLATFORM', isPlatform: true };
    }

    const publisherUser = mockService.getUserById(publisherPartner.userId);
    // If the user linked to the partner profile is actually an internal role
    if (publisherUser && (publisherUser.role === UserRole.ADMIN || publisherUser.role === UserRole.OPERATIONS)) {
       return { label: '平台推送订单', type: 'PLATFORM', isPlatform: true };
    }

    // Default case: Another Partner
    return { label: '合伙人订单', type: 'PARTNER', isPlatform: false };
  };

  const cities = mockService.getCities();

  const availableOrders = orders.filter(o => 
    o.status === OrderStatus.PUBLISHED && 
    o.publishPartnerId !== user.partnerId && 
    (filterCityCode === '' || o.cityCode === filterCityCode) &&
    // 核心权限过滤：无跨城权限时，必须匹配本地城市
    (canCrossCity || o.cityCode === myCityCode)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">抢单大厅</h1>
          <p className="text-slate-500 text-sm">抢接其他合伙人发布的优质订单和任务</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             {/* 城市筛选器逻辑优化 */}
             {!canCrossCity ? (
                <div 
                  className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2 flex items-center justify-between cursor-not-allowed select-none"
                  title="您当前权限仅支持查看本地订单"
                >
                   <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {mockService.getCityName(myCityCode)} (本地)
                   </span>
                   <Lock className="w-3 h-3 text-slate-400" />
                </div>
             ) : (
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={filterCityCode}
                  onChange={e => setFilterCityCode(e.target.value)}
                >
                    <option value="">所有城市</option>
                    {cities.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                </select>
             )}
          </div>
        </div>
      </div>
      
      {/* 权限提示横幅 */}
      {!canGrab && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <Lock className="w-5 h-5" />
          <div>
            <p className="font-bold text-sm">暂无接单权限</p>
            <p className="text-xs">您的账号已被管理员限制接单，请联系平台运营人员恢复权限。</p>
          </div>
        </div>
      )}
      
      {!canCrossCity && canGrab && (
         <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4" />
            <span>当前仅显示 <strong>{mockService.getCityName(myCityCode)}</strong> 地区的订单。如需跨城接单，请申请开通跨城权限。</span>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {availableOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">暂无可用订单</h3>
            <p className="text-slate-500">
              {canCrossCity ? '请稍后再来看，或尝试更改筛选条件。' : '本地区暂无新订单，请稍后再来。'}
            </p>
          </div>
        ) : (
          availableOrders.map((order) => {
            const pubInfo = getPublisherDisplay(order);
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {order.type}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 2小时前
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {order.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {order.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {mockService.getCityName(order.cityCode)}
                    </div>
                    <div className="flex items-center gap-1">
                      {pubInfo.isPlatform ? (
                        <Building className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Briefcase className="w-4 h-4 text-slate-400" />
                      )}
                      <span className={pubInfo.isPlatform ? 'text-blue-600 font-bold' : ''}>
                        {pubInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">抢单价</p>
                      <p className="text-xl font-bold text-slate-900">¥{order.grabPrice}</p>
                    </div>
                    
                    {grabSuccess === order.id ? (
                      <button disabled className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium">
                        <CheckCircle className="w-4 h-4" /> 抢单成功
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleGrab(order.id)}
                        disabled={loading || !canGrab}
                        className={`px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 active:scale-95 ${
                          !canGrab 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-900 hover:bg-blue-600 text-white'
                        }`}
                        title={!canGrab ? '无接单权限' : ''}
                      >
                        {loading ? '处理中...' : (
                          canGrab ? '立即抢单' : '无法接单'
                        )}
                        {!loading && canGrab && <ChevronRight className="w-4 h-4" />}
                        {!loading && !canGrab && <Lock className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-2 text-xs text-slate-400 border-t border-slate-100 flex justify-between">
                   <span>单号: {order.orderNo}</span>
                   <span>需预付保证金</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};