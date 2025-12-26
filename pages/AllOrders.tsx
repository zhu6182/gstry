
import React, { useState, useEffect, useRef } from 'react';
import { mockService } from '../services/mockService';
import { Order, OrderStatus, User, UserRole } from '../types';
import { Search, Filter, MoreHorizontal, AlertTriangle, CheckCircle, X, RotateCcw, Gavel, Eye, FileText, User as UserIcon, Phone, MapPin, Image as ImageIcon, MessageSquare, Scale, HelpCircle, Calendar, RefreshCw } from 'lucide-react';

const statusMap: Record<OrderStatus, string> = {
  [OrderStatus.PUBLISHED]: '已发布',
  [OrderStatus.PROCESSING]: '执行中',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.SETTLED]: '已结算',
  [OrderStatus.EXCEPTION]: '异常(待处理)',
  [OrderStatus.MEDIATING]: '平台介入中',
  [OrderStatus.CANCELLED]: '已取消/退款',
};

const statusColorMap: Record<OrderStatus, string> = {
  [OrderStatus.PUBLISHED]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [OrderStatus.SETTLED]: 'bg-gray-100 text-gray-800',
  [OrderStatus.EXCEPTION]: 'bg-orange-100 text-orange-800',
  [OrderStatus.MEDIATING]: 'bg-purple-100 text-purple-800',
  [OrderStatus.CANCELLED]: 'bg-slate-200 text-slate-500',
};

interface AllOrdersProps {
  user: User;
}

export const AllOrders: React.FC<AllOrdersProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orders, setOrders] = useState(mockService.getOrders());
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRulingConfirm, setShowRulingConfirm] = useState<'SETTLE' | 'REFUND' | null>(null);
  
  // Action Menu State (Legacy)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.OPERATIONS || user.role === UserRole.DISPATCHER;
  const isOperations = user.role === UserRole.OPERATIONS;
  const isDispatcher = user.role === UserRole.DISPATCHER;
  const managedCities = user.managedCityCodes || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refresh = () => {
    setOrders([...mockService.getOrders()]);
  };

  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    // Dispatchers cannot update status unless they own the order (which is handled in MyOrders), 
    // here is global view, so let's restrict or allow based on role.
    // For now, let's say Dispatchers are view-only in "All Orders" to avoid confusion, 
    // or they can manage if they are the publisher (but logic is complex here).
    // Let's restrict global actions to Admin/Ops.
    if (isDispatcher) {
        alert('发单员请在“我的发布”中管理订单。');
        return;
    }

    const success = mockService.updateOrderStatus(orderId, status, user.id);
    if (success) {
      setActiveMenuId(null);
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      refresh();
    } else {
      alert('状态更新失败，请重试');
    }
  };

  const executeRuling = () => {
    if (!selectedOrder || !showRulingConfirm) return;
    
    if (isDispatcher) return; // Dispatchers don't rule.

    let success = false;
    if (showRulingConfirm === 'SETTLE') {
      success = mockService.settleOrder(selectedOrder.id, user.id);
    } else {
      success = mockService.confirmOrderException(selectedOrder.id, user.realName);
    }

    if (success) {
      alert('裁决执行成功！');
      setShowRulingConfirm(null);
      setSelectedOrder(null);
      refresh();
    } else {
      alert('操作失败：可能由于订单状态已变更或数据异常。');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.publishPartnerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    
    // Date Range Matching
    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && new Date(o.createdAt) >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(o.createdAt) <= end;
    }

    // Permission Scope Filter
    let matchesScope = true;
    if (isOperations && managedCities.length > 0) {
        matchesScope = managedCities.includes(o.cityCode);
    }
    // Dispatcher sees all orders (Market view) or maybe just their own?
    // Requirement says "can see order relevant data". Usually implies global view or scope.
    // Let's assume Global Read Access for Dispatcher to monitor market.

    return matchesSearch && matchesStatus && matchesScope && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">全部订单管理</h1>
          <p className="text-slate-500 text-sm">
             {isOperations 
               ? `查看您负责区域的订单 (${managedCities.map(c => mockService.getCityName(c)).join(', ') || '全部'})`
               : isDispatcher 
                  ? '查看平台所有订单流转状态' 
                  : '查看平台所有订单流转状态，处理异常与纠纷裁决'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-300 shadow-sm h-[42px]">
              <div className="pl-2 text-slate-400"><Calendar className="w-4 h-4" /></div>
              <input 
                type="date"
                className="text-xs border-none outline-none text-slate-600 bg-transparent py-1 w-28 cursor-pointer"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                title="开始日期"
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date"
                className="text-xs border-none outline-none text-slate-600 bg-transparent py-1 w-28 cursor-pointer"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                title="结束日期"
              />
              {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title="重置日期"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
              )}
          </div>

          <div className="relative h-[42px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="h-full pl-10 pr-8 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-sm min-w-[140px]"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">所有状态</option>
              {Object.keys(OrderStatus).map(key => (
                 <option key={key} value={key}>{statusMap[key as OrderStatus]}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 xl:w-64 h-[42px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索订单号/标题/合伙人..." 
              className="w-full h-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible min-h-[400px]">
        <div className="overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">订单号 / 时间</th>
                <th className="px-6 py-4">项目信息</th>
                <th className="px-6 py-4">发布方 (卖)</th>
                <th className="px-6 py-4">接单方 (买)</th>
                <th className="px-6 py-4">金额结构</th>
                <th className="px-6 py-4 text-center">状态</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono font-medium text-slate-700">{order.orderNo}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="font-medium text-slate-900 truncate">{order.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{mockService.getCityName(order.cityCode)}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{order.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{order.publishPartnerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    {order.grabPartnerName ? (
                      <p className="text-slate-900">{order.grabPartnerName}</p>
                    ) : (
                      <span className="text-slate-400 italic">等待抢单...</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs space-y-1">
                    <div className="flex justify-between w-32">
                      <span className="text-slate-500">发布价:</span>
                      <span className="font-medium">¥{order.publishPrice}</span>
                    </div>
                    <div className="flex justify-between w-32">
                      <span className="text-slate-500">抢单价:</span>
                      <span className="font-medium">¥{order.grabPrice}</span>
                    </div>
                    <div className="flex justify-between w-32 border-t border-slate-100 pt-1">
                      <span className="text-blue-600">平台抽成:</span>
                      <span className="font-bold text-blue-600">¥{Number(order.platformFee).toFixed(2).replace(/\.?0+$/, '')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColorMap[order.status]}`}>
                      {statusMap[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      {order.status === OrderStatus.MEDIATING && !isDispatcher ? '裁决' : '查看'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            {isOperations ? '您管理的区域暂无符合条件的订单' : '没有找到符合条件的订单'}
          </div>
        )}
      </div>

      {/* --- Admin Order Detail & Dispute Resolution Modal --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${statusColorMap[selectedOrder.status]}`}>
                   <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {selectedOrder.title}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColorMap[selectedOrder.status]} bg-white border-current opacity-80`}>
                      {statusMap[selectedOrder.status]}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">单号: {selectedOrder.orderNo}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* 1. Dispute / Exception Section */}
              {(selectedOrder.status === OrderStatus.EXCEPTION || selectedOrder.status === OrderStatus.MEDIATING || selectedOrder.exceptionReason) && (
                <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden">
                   <div className="px-4 py-3 bg-red-100 border-b border-red-200 flex items-center gap-2 text-red-800 font-bold">
                      <Gavel className="w-5 h-5" />
                      异常与申诉档案
                   </div>
                   <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Grabber Side */}
                      <div className="space-y-3">
                         <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                           <UserIcon className="w-4 h-4" /> 接单方申诉 (发起方)
                         </h4>
                         <div className="bg-white p-3 rounded-lg border border-red-100 text-sm text-slate-600 shadow-sm">
                            <p className="mb-2"><span className="font-bold text-slate-800">异常原因:</span> {selectedOrder.exceptionReason}</p>
                            <div className="flex gap-2 flex-wrap">
                               {selectedOrder.exceptionProofUrls?.map((url, i) => (
                                 <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity">
                                   <img src={url} alt="proof" className="w-full h-full object-cover" />
                                 </a>
                               )) || (selectedOrder.exceptionProofUrl && (
                                 <a href={selectedOrder.exceptionProofUrl} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded border border-slate-200 overflow-hidden">
                                   <img src={selectedOrder.exceptionProofUrl} alt="proof" className="w-full h-full object-cover" />
                                 </a>
                               ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">提交时间: {selectedOrder.exceptionTime ? new Date(selectedOrder.exceptionTime).toLocaleString() : '-'}</p>
                         </div>
                      </div>

                      {/* Publisher Side */}
                      <div className="space-y-3">
                         <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                           <UserIcon className="w-4 h-4" /> 发布方回应 (驳回方)
                         </h4>
                         {selectedOrder.appealReason ? (
                           <div className="bg-white p-3 rounded-lg border border-purple-100 text-sm text-slate-600 shadow-sm h-full">
                              <p><span className="font-bold text-slate-800">驳回/申诉理由:</span></p>
                              <p className="mt-1">{selectedOrder.appealReason}</p>
                              <p className="text-xs text-slate-400 mt-4">提交时间: {selectedOrder.appealTime ? new Date(selectedOrder.appealTime).toLocaleString() : '-'}</p>
                           </div>
                         ) : (
                           <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-sm text-slate-400 h-full flex items-center justify-center italic">
                              暂无回应或已同意
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              )}

              {/* 2. Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Left Col */}
                 <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                       <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                         <UserIcon className="w-4 h-4 text-blue-500" /> 客户信息
                       </h4>
                       <div className="space-y-2 text-sm">
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                             <span className="text-slate-500">姓名</span>
                             <span className="font-medium">{selectedOrder.customerName}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                             <span className="text-slate-500">联系方式</span>
                             <span className="font-medium">{selectedOrder.customerPhone}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                             <span className="text-slate-500">来源渠道</span>
                             <span className="font-medium">{selectedOrder.customerSource}</span>
                          </div>
                          <div className="pt-1">
                             <span className="text-slate-500 block text-xs mb-1">地址</span>
                             <div className="font-medium flex items-start gap-1">
                               <MapPin className="w-3 h-3 mt-0.5 text-slate-400" />
                               {selectedOrder.customerAddress || '无详细地址'}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                       <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                         <Scale className="w-4 h-4 text-green-500" /> 交易金额
                       </h4>
                       <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                             <span className="text-slate-500">发布价 (A得)</span>
                             <span className="font-bold text-green-600">¥{selectedOrder.publishPrice}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-slate-500">平台抽成</span>
                             <span className="font-bold text-blue-600">¥{selectedOrder.platformFee}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                             <span className="text-slate-700 font-bold">抢单价 (B付)</span>
                             <span className="font-bold text-slate-900 text-lg">¥{selectedOrder.grabPrice}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Right Col */}
                 <div className="space-y-4">
                    <div>
                       <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                         <MessageSquare className="w-4 h-4 text-orange-500" /> 需求描述
                       </h4>
                       <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                          {selectedOrder.description}
                       </div>
                    </div>
                    
                    <div>
                       <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                         <ImageIcon className="w-4 h-4 text-slate-500" /> 聊天记录/附件
                       </h4>
                       {selectedOrder.chatAttachments && selectedOrder.chatAttachments.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                             {selectedOrder.chatAttachments.map((url, i) => (
                               <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg border border-slate-200 overflow-hidden hover:opacity-80">
                                 <img src={url} alt="attachment" className="w-full h-full object-cover" />
                               </a>
                             ))}
                          </div>
                       ) : (
                          <div className="text-slate-400 text-sm italic bg-slate-50 p-3 rounded-lg text-center">无附件</div>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center sticky bottom-0 z-10">
               <div className="text-xs text-slate-500">
                  <p>订单创建: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  {selectedOrder.grabTime && <p>接单时间: {new Date(selectedOrder.grabTime).toLocaleString()}</p>}
               </div>
               
               <div className="flex gap-3">
                  {selectedOrder.status === OrderStatus.MEDIATING && !isDispatcher && (
                    <>
                      <button 
                        onClick={() => setShowRulingConfirm('SETTLE')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm flex items-center gap-2"
                      >
                        <Gavel className="w-4 h-4" /> 裁决：结算给发布人
                      </button>
                      <button 
                        onClick={() => setShowRulingConfirm('REFUND')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm flex items-center gap-2"
                      >
                        <Gavel className="w-4 h-4" /> 裁决：退款给接单人
                      </button>
                    </>
                  )}
                  
                  {(selectedOrder.status === OrderStatus.PROCESSING || selectedOrder.status === OrderStatus.EXCEPTION) && !isDispatcher && (
                     <div className="flex gap-2">
                        <button 
                          onClick={() => handleStatusUpdate(selectedOrder.id, OrderStatus.COMPLETED)}
                          className="px-3 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
                        >
                          强制完成
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(selectedOrder.id, OrderStatus.CANCELLED)}
                          className="px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium"
                        >
                          强制取消
                        </button>
                     </div>
                  )}

                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                  >
                    关闭
                  </button>
               </div>
            </div>

            {/* Custom Confirmation Modal Layer */}
            {showRulingConfirm && (
              <div className="absolute inset-0 bg-slate-900/60 z-20 flex items-center justify-center p-6 animate-in fade-in">
                 <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border-t-4 border-yellow-500">
                    <div className="flex items-center gap-3 mb-4">
                       <HelpCircle className="w-8 h-8 text-yellow-500" />
                       <h3 className="text-lg font-bold text-slate-800">确认最终裁决?</h3>
                    </div>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                       {showRulingConfirm === 'SETTLE' 
                         ? '您判定交易【正常】，将强制将冻结资金结算给发布人。' 
                         : '您判定交易【异常】，将强制将资金退还给接单人。'
                       }
                       <br/><span className="text-red-500 font-bold mt-1 block">此操作不可撤销。</span>
                    </p>
                    <div className="flex gap-3">
                       <button 
                         onClick={() => setShowRulingConfirm(null)}
                         className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                       >
                         再想想
                       </button>
                       <button 
                         onClick={executeRuling}
                         className={`flex-1 py-2 rounded-lg text-white font-bold shadow-lg ${
                           showRulingConfirm === 'SETTLE' 
                             ? 'bg-green-600 hover:bg-green-700' 
                             : 'bg-red-600 hover:bg-red-700'
                         }`}
                       >
                         确认执行
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
