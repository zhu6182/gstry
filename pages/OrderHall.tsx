
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, User, UserRole } from '../types';
import { mockService } from '../services/mockService';
import { MapPin, Clock, Briefcase, ChevronRight, CheckCircle, Lock, Building, AlertTriangle, Tag, Globe } from 'lucide-react';

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
  const myCityCode = partner?.cityCode || '';
  const myAllowedTitles = partner?.businessTypes || []; 
  const myCrossCityCodes = partner?.crossCityCodes || []; 

  const isInternal = user.role === UserRole.ADMIN || user.role === UserRole.OPERATIONS || user.role === UserRole.DISPATCHER;

  useEffect(() => {
    setOrders(mockService.getOrders());
  }, [grabSuccess]);

  const accessibleCityCodes = isInternal ? mockService.getCities().map(c => c.code) : [myCityCode, ...myCrossCityCodes];
  const provinces = mockService.getCityGroups();
  const allCities = mockService.getCities();

  const availableOrders = orders.filter(o => 
    o.status === OrderStatus.PUBLISHED && 
    o.publishPartnerId !== user.partnerId && 
    (filterCityCode === '' || o.cityCode === filterCityCode) &&
    accessibleCityCodes.includes(o.cityCode) &&
    (isInternal || myAllowedTitles.includes(o.title))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
             {isInternal ? '全国接单大厅' : '抢单大厅'}
          </h1>
          <p className="text-slate-500 text-sm">实时监控全网派单情况，精准匹配专业技能</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
                <select 
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white text-sm font-bold text-slate-700" 
                    value={filterCityCode} 
                    onChange={e => setFilterCityCode(e.target.value)} 
                >
                    <option value="">全部授权区域 ({accessibleCityCodes.length} 城)</option>
                    {provinces.map(prov => {
                       const provCities = allCities.filter(c => c.groupId === prov.id && accessibleCityCodes.includes(c.code));
                       if (provCities.length === 0) return null;
                       return (
                         <optgroup key={prov.id} label={prov.name}>
                            {provCities.map(c => (
                               <option key={c.code} value={c.code}>
                                  {c.name} {c.code === myCityCode ? '(本城)' : ''}
                                </option>
                            ))}
                         </optgroup>
                       );
                    })}
                </select>
          </div>
        </div>
      </div>
      
      {/* Existing Summary and Cards UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {availableOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">当前区域暂无新订单</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-sm mt-2">系统已为您过滤匹配领域和授权城市的订单。您可以尝试切换筛选区域。</p>
          </div>
        ) : (
          availableOrders.map((order) => (
             <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-start mb-4">
                    <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{order.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{mockService.getCityName(order.cityCode)}</span>
                </div>
                <h4 className="font-bold text-slate-900 mb-2 truncate">{order.title}服务需求</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-6 h-8">{order.description}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">抢单收益</p>
                        <p className="text-lg font-black text-slate-900">¥{order.grabPrice}</p>
                    </div>
                    <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors">立即抢接</button>
                </div>
             </div>
          ))
        )}
      </div>
    </div>
  );
};
