import React, { useState } from 'react';
import { Order, OrderStatus, User, UserRole } from '../types';
import { mockService } from '../services/mockService';
import { Plus, CheckCircle, Clock, AlertTriangle, Upload, X, Eye, Loader2, MapPin, User as UserIcon, Phone, FileText, Image as ImageIcon, Building, Briefcase, Gavel, Scale, ChevronRight } from 'lucide-react';

interface MyOrdersProps {
  user: User;
  onPublishClick: () => void;
}

const statusMap: Record<OrderStatus, string> = {
  [OrderStatus.PUBLISHED]: '已发布',
  [OrderStatus.PROCESSING]: '执行中',
  [OrderStatus.EXCEPTION]: '异常(待处理)',
  [OrderStatus.MEDIATING]: '平台介入中',
  [OrderStatus.CANCELLED]: '已退款',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.SETTLED]: '已结算',
};

export const MyOrders: React.FC<MyOrdersProps> = ({ user, onPublishClick }) => {
  const [activeTab, setActiveTab] = useState<'grabbed' | 'published'>('grabbed');
  const [orders, setOrders] = useState(mockService.getOrders());
  
  // Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // Exception Modal State (Grabber)
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedExceptionOrder, setSelectedExceptionOrder] = useState<Order | null>(null);
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionProofs, setExceptionProofs] = useState<File[]>([]);
  const [exceptionProofPreviews, setExceptionProofPreviews] = useState<string[]>([]);

  // Review Exception Modal State (Publisher)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Appeal (Reject Exception) State
  const [showAppealInput, setShowAppealInput] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  // Processing state for "Complete Order" button
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Logic for displaying orders:
  // - If Partner: show grabbed by them or published by them
  // - If Dispatcher: show all orders published by them (user.id or partnerId)
  
  const grabbedOrders = orders.filter(o => o.grabPartnerId === user.partnerId);
  const publishedOrders = orders.filter(o => o.publishPartnerId === user.partnerId || o.publishPartnerId === user.id);
  
  const displayedOrders = activeTab === 'grabbed' ? grabbedOrders : publishedOrders;

  const partner = user.partnerId ? mockService.getPartnerById(user.partnerId) : null;
  const isInternal = user.role === UserRole.ADMIN || user.role === UserRole.OPERATIONS || user.role === UserRole.DISPATCHER;
  const canPublish = isInternal || (partner?.permissions?.canPublish === true);

  // Dispatchers primarily use "Published" tab, default to it if internal
  React.useEffect(() => {
     if (isInternal && activeTab === 'grabbed') {
         setActiveTab('published');
     }
  }, [isInternal]);

  const refreshOrders = () => {
    setOrders([...mockService.getOrders()]);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PUBLISHED: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING: return 'bg-blue-100 text-blue-800';
      case OrderStatus.EXCEPTION: return 'bg-orange-100 text-orange-800';
      case OrderStatus.MEDIATING: return 'bg-purple-100 text-purple-800';
      case OrderStatus.CANCELLED: return 'bg-slate-200 text-slate-500 line-through';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case OrderStatus.SETTLED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleCompleteOrder = (orderId: string) => {
    setProcessingOrderId(orderId);
    setTimeout(() => {
      const success = mockService.updateOrderStatus(orderId, OrderStatus.COMPLETED, user.id);
      setProcessingOrderId(null);
      if (success) {
        refreshOrders();
      } else {
        alert('操作失败：可能由于订单状态已变更。');
      }
    }, 500);
  };

  // --- View Details Logic ---
  const openDetails = (order: Order) => {
    setViewOrder(order);
    setShowDetailsModal(true);
  };

  // --- Exception Handling Logic (Grabber) ---
  const openExceptionModal = (order: Order) => {
    setSelectedExceptionOrder(order);
    setExceptionReason('');
    setExceptionProofs([]);
    setExceptionProofPreviews([]);
    setShowExceptionModal(true);
  };

  const handleExceptionProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as File[];
      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      newFiles.forEach(file => {
        if (file.size <= 5 * 1024 * 1024) {
           validFiles.push(file);
           newPreviews.push(URL.createObjectURL(file));
        } else {
           alert(`文件 ${file.name} 超过 5MB 限制，已自动忽略`);
        }
      });

      setExceptionProofs(prev => [...prev, ...validFiles]);
      setExceptionProofPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeExceptionProof = (index: number) => {
    const newFiles = [...exceptionProofs];
    const newPreviews = [...exceptionProofPreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setExceptionProofs(newFiles);
    setExceptionProofPreviews(newPreviews);
  };

  const submitException = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExceptionOrder && exceptionReason && exceptionProofPreviews.length > 0) {
      const success = mockService.reportOrderException(selectedExceptionOrder.id, exceptionReason, exceptionProofPreviews);
      if (success) {
        alert('异常申诉已提交，请等待发布方处理。');
        setShowExceptionModal(false);
        refreshOrders();
      } else {
        alert('提交失败');
      }
    } else {
        alert('请填写原因并至少上传一张凭证');
    }
  };

  // --- Review Logic (Publisher) ---
  const openReviewModal = (order: Order) => {
    setReviewOrder(order);
    setShowReviewModal(true);
    setShowAppealInput(false); // Reset appeal state
    setAppealReason('');
  };

  // Publisher Agrees to Refund
  const confirmExceptionRefund = () => {
    if (reviewOrder) {
      // Remove native confirm to avoid UI blocking issues/incompatibility in some views
      // Proceed directly with processing state
      setIsProcessing(true);
      setTimeout(() => {
        try {
          const success = mockService.confirmOrderException(reviewOrder.id, user.realName);
          if (success) {
            setShowReviewModal(false);
            refreshOrders();
            // Show toast or alert after success if needed
          } else {
            alert('操作失败');
          }
        } catch (e) {
          alert('系统错误');
        } finally {
          setIsProcessing(false);
        }
      }, 500);
    }
  };

  // Publisher Rejects Exception -> Appeal/Mediating
  const submitAppeal = () => {
    if (reviewOrder && appealReason) {
      setIsProcessing(true);
      setTimeout(() => {
        try {
          const success = mockService.appealOrderException(reviewOrder.id, appealReason);
          if (success) {
            alert('已驳回异常申请，订单将进入平台人工介入流程。');
            setShowReviewModal(false);
            refreshOrders();
          } else {
            alert('操作失败');
          }
        } catch (e) {
          alert('系统错误');
        } finally {
          setIsProcessing(false);
        }
      }, 500);
    } else {
      alert('请填写驳回/申诉理由');
    }
  };

  // Helper to determine how to display counterparty
  const getCounterpartyDisplay = (order: Order) => {
    if (activeTab === 'grabbed') {
      // Counterparty is Publisher
      const isPartnerRole = user.role === UserRole.PARTNER;
      
      // Determine if publisher is Platform (Internal User or System)
      let isPlatform = false;
      const publisherPartner = mockService.getPartnerById(order.publishPartnerId);
      
      if (!publisherPartner) {
        // No partner profile usually means System/Admin direct publish
        isPlatform = true;
      } else {
         const publisherUser = mockService.getUserById(publisherPartner.userId);
         if (publisherUser && (publisherUser.role === UserRole.ADMIN || publisherUser.role === UserRole.OPERATIONS)) {
           isPlatform = true;
         }
      }

      if (isPartnerRole) {
        if (isPlatform) {
           return (
             <div className="flex items-center gap-2 text-blue-600 font-medium">
               <Building className="w-4 h-4" />
               <span>平台推送订单</span>
             </div>
           );
        } else {
           // Hide other partners' names
           return (
             <div className="flex items-center gap-2 text-slate-500">
               <Briefcase className="w-4 h-4" />
               <span>合伙人订单</span>
             </div>
           );
        }
      } else {
        // Non-partner roles (Admin/Ops/Dispatcher) see real name
         return (
             <div className="flex items-center gap-2 text-slate-900">
               {isPlatform ? <Building className="w-4 h-4 text-blue-500" /> : <Briefcase className="w-4 h-4 text-slate-400" />}
               <span>{order.publishPartnerName}</span>
             </div>
           );
      }
    } else {
      // Published Tab (Counterparty is Grabber)
      return (
        <span className="text-slate-900">{order.grabPartnerName || '待定...'}</span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">
            {isInternal ? '我的发布' : '我的订单'}
        </h1>
        {canPublish && (
           <button 
             onClick={onPublishClick}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
           >
             <Plus className="w-4 h-4" />
             发布订单
           </button>
        )}
      </div>

      <div className="flex border-b border-slate-200">
        {!isInternal && (
            <button
            onClick={() => setActiveTab('grabbed')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'grabbed' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            >
            我抢的单 (买入)
            </button>
        )}
        <button
           onClick={() => setActiveTab('published')}
           className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'published' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {isInternal ? '我发布的订单' : '我发的单 (卖出)'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {displayedOrders.length === 0 ? (
           <div className="p-12 text-center text-slate-500">
             此分类下暂无订单。
           </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">订单号 / 标题</th>
                <th className="px-6 py-4">城市</th>
                <th className="px-6 py-4">交易对手</th>
                <th className="px-6 py-4">状态</th>
                <th className="px-4 py-4 text-center w-24">订单详情</th>
                <th className="px-6 py-4 text-right">金额</th>
                <th className="px-6 py-4 text-center w-40">业务操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {displayedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 cursor-pointer" onClick={() => openDetails(order)}>
                    <div className="flex flex-col group">
                        <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{order.title}</span>
                        <span className="text-xs text-slate-500 font-mono">{order.orderNo}</span>
                        <span className="text-xs text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</span>
                        
                        {order.status === OrderStatus.PROCESSING && (
                            <span className="text-[10px] text-blue-500 mt-1 flex items-center gap-1 bg-blue-50 w-fit px-1 rounded">
                                <Clock className="w-3 h-3" /> 3天后自动结算
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {mockService.getCityName(order.cityCode)}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    {getCounterpartyDisplay(order)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {statusMap[order.status] || order.status}
                    </span>
                  </td>

                  {/* --- Dedicated Details Column (Moved to Middle) --- */}
                  <td className="px-4 py-4 text-center">
                     <button 
                        onClick={(e) => { e.stopPropagation(); openDetails(order); }}
                        className="group flex flex-col items-center justify-center gap-1 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors"
                        title="查看订单详情"
                     >
                        <div className="bg-slate-100 text-slate-500 p-1.5 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                           <ChevronRight className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-medium">详情</span>
                     </button>
                  </td>

                  <td className="px-6 py-4 text-right font-medium">
                    {activeTab === 'grabbed' ? (
                       <span className={order.status === OrderStatus.CANCELLED ? 'text-slate-400' : 'text-red-600'}>
                         -¥{order.grabPrice}
                       </span>
                    ) : (
                       <span className={order.status === OrderStatus.CANCELLED ? 'text-slate-400' : 'text-green-600'}>
                         +¥{order.publishPrice}
                       </span>
                    )}
                  </td>
                  
                  {/* --- Business Actions Column (Core logic only) --- */}
                  <td className="px-6 py-4 text-center">
                    {/* 1. Primary Action: Complete (Grabber) */}
                    {activeTab === 'grabbed' && order.status === OrderStatus.PROCESSING && (
                        <div className="flex flex-col items-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleCompleteOrder(order.id); }}
                                disabled={processingOrderId === order.id}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1 w-full ${
                                    processingOrderId === order.id
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                {processingOrderId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                {processingOrderId === order.id ? '提交中' : '确认完成'}
                            </button>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); openExceptionModal(order); }}
                                className="text-orange-600 hover:text-orange-800 text-xs font-medium flex items-center gap-1 hover:underline"
                            >
                                <AlertTriangle className="w-3 h-3" /> 异常申诉
                            </button>
                        </div>
                    )}

                    {/* 2. Primary Action: Review Exception (Publisher) */}
                    {activeTab === 'published' && order.status === OrderStatus.EXCEPTION && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); openReviewModal(order); }}
                            className="px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1 w-full bg-red-600 text-white hover:bg-red-700 animate-pulse"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            处理异常
                        </button>
                    )}

                    {/* 3. Status Placeholders (No Action) */}
                    {!(activeTab === 'grabbed' && order.status === OrderStatus.PROCESSING) && 
                     !(activeTab === 'published' && order.status === OrderStatus.EXCEPTION) && (
                        <div className="flex flex-col items-center gap-1 w-full text-xs text-slate-400">
                            {/* Context Status Text */}
                            {activeTab === 'grabbed' && order.status === OrderStatus.EXCEPTION && (
                                <span className="text-orange-500">等待处理</span>
                            )}
                            {activeTab === 'grabbed' && order.status === OrderStatus.MEDIATING && (
                                <span className="text-purple-500 flex items-center gap-1">
                                    <Gavel className="w-3 h-3" /> 平台介入
                                </span>
                            )}
                            {activeTab === 'published' && order.status === OrderStatus.PROCESSING && (
                                <span className="flex items-center justify-center gap-1">
                                    <Clock className="w-3 h-3" /> 待完成
                                </span>
                            )}
                            {activeTab === 'published' && order.status === OrderStatus.MEDIATING && (
                                <span className="text-purple-500 flex items-center gap-1">
                                    <Gavel className="w-3 h-3" /> 待裁决
                                </span>
                            )}
                            {(order.status === OrderStatus.COMPLETED || order.status === OrderStatus.SETTLED || order.status === OrderStatus.CANCELLED) && (
                                <span>-</span>
                            )}
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ... Order Details Modal ... */}
      {showDetailsModal && viewOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{viewOrder.title}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{viewOrder.orderNo}</p>
                    </div>
                    <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Banner */}
                    <div className={`p-3 rounded-lg flex items-center gap-3 ${
                        viewOrder.status === OrderStatus.COMPLETED || viewOrder.status === OrderStatus.SETTLED ? 'bg-green-50 text-green-800' :
                        viewOrder.status === OrderStatus.EXCEPTION ? 'bg-orange-50 text-orange-800' : 
                        viewOrder.status === OrderStatus.MEDIATING ? 'bg-purple-50 text-purple-800' :
                        viewOrder.status === OrderStatus.CANCELLED ? 'bg-slate-100 text-slate-600' :
                        'bg-blue-50 text-blue-800'
                    }`}>
                        <div className="font-bold text-sm">订单状态：{statusMap[viewOrder.status]}</div>
                        <span className="text-xs opacity-75">
                            {viewOrder.status === OrderStatus.PROCESSING ? '请按时完成任务，3天后系统将自动结算。' : ''}
                            {viewOrder.status === OrderStatus.COMPLETED ? '任务已完成，等待系统资金结算。' : ''}
                            {viewOrder.status === OrderStatus.EXCEPTION ? '接单方已发起异常申诉，请发布方尽快处理。' : ''}
                            {viewOrder.status === OrderStatus.MEDIATING ? '双方未达成一致，平台管理员介入裁决中。' : ''}
                            {viewOrder.status === OrderStatus.SETTLED ? '订单已结算完成。' : ''}
                        </span>
                    </div>

                    {/* Customer Info Section */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-purple-600" />
                            <h4 className="font-bold text-slate-700 text-sm">客户信息</h4>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500 block text-xs mb-1">客户姓名</span>
                                <span className="font-medium text-slate-900">{viewOrder.customerName}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-xs mb-1">联系电话</span>
                                <span className="font-medium text-slate-900 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {viewOrder.customerPhone}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-slate-500 block text-xs mb-1">详细地址</span>
                                <span className="font-medium text-slate-900 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {viewOrder.customerAddress || '无详细地址'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-xs mb-1">客户来源</span>
                                <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">
                                    {viewOrder.customerSource}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Requirement Details */}
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" /> 需求详情
                        </h4>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {viewOrder.description}
                        </div>
                    </div>

                    {/* Attachments */}
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-orange-600" /> 
                            附件 / 聊天记录 ({viewOrder.chatAttachments?.length || 0})
                        </h4>
                        {viewOrder.chatAttachments && viewOrder.chatAttachments.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {viewOrder.chatAttachments.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer group">
                                        <img src={url} alt={`Attachment ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 italic">无相关附件图片</div>
                        )}
                    </div>

                    {/* Financial Summary */}
                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                        <div className="text-xs text-slate-500">
                            <div>发布时间: {new Date(viewOrder.createdAt).toLocaleString()}</div>
                            {viewOrder.grabTime && <div>接单时间: {new Date(viewOrder.grabTime).toLocaleString()}</div>}
                        </div>
                        <div className="text-right">
                            <span className="text-sm text-slate-500 mr-2">交易金额</span>
                            <span className="text-xl font-bold text-slate-900">
                                ¥{activeTab === 'grabbed' ? viewOrder.grabPrice : viewOrder.publishPrice}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- 1. Exception Report Modal (Grabber) --- */}
      {showExceptionModal && selectedExceptionOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        申请订单异常
                    </h3>
                    <button onClick={() => setShowExceptionModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                
                <p className="text-sm text-slate-500 mb-4 bg-orange-50 p-3 rounded text-orange-800">
                    请提供异常说明及凭证。若发布方确认异常，订单将取消，您的资金将全额退回。
                </p>

                <form onSubmit={submitException} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">异常原因</label>
                        <textarea 
                            required
                            rows={3}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 resize-none"
                            placeholder="例如：客户联系不上 / 需求描述不符..."
                            value={exceptionReason}
                            onChange={e => setExceptionReason(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">上传凭证 (支持多张)</label>
                        <div className="grid grid-cols-3 gap-3">
                            {exceptionProofPreviews.map((url, index) => (
                                <div key={index} className="relative aspect-square border border-slate-200 rounded-lg overflow-hidden group">
                                    <img src={url} alt={`Proof ${index}`} className="w-full h-full object-cover" />
                                    <button 
                                      type="button" 
                                      onClick={() => removeExceptionProof(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <div className="relative border-2 border-dashed border-slate-300 rounded-lg aspect-square hover:bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer group">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleExceptionProofUpload}
                                />
                                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                <span className="text-xs text-slate-500">上传图片</span>
                            </div>
                        </div>
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full bg-orange-600 text-white font-bold py-2 rounded-lg hover:bg-orange-700">
                            提交申诉
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- 2. Exception Review Modal (Publisher) --- */}
      {showReviewModal && reviewOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        处理异常申诉
                    </h3>
                    <button onClick={() => setShowReviewModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">申诉方</span>
                            <span className="font-medium text-slate-700">接单合伙人</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">涉及金额 (您的收益)</span>
                            <span className="font-bold text-red-600">¥{reviewOrder.publishPrice}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">申诉时间</span>
                            <span className="font-mono">{new Date(reviewOrder.exceptionTime || '').toLocaleString()}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-2">申诉原因</h4>
                        <p className="text-sm text-slate-600 bg-white border border-slate-200 p-3 rounded-lg">
                            {reviewOrder.exceptionReason}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-2">凭证图片</h4>
                        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                            {reviewOrder.exceptionProofUrls && reviewOrder.exceptionProofUrls.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {reviewOrder.exceptionProofUrls.map((url, idx) => (
                                        <img key={idx} src={url} alt={`Proof ${idx}`} className="w-full h-32 object-cover rounded shadow-sm border border-white" />
                                    ))}
                                </div>
                            ) : reviewOrder.exceptionProofUrl ? (
                                <img src={reviewOrder.exceptionProofUrl} alt="Proof" className="max-h-60 mx-auto rounded shadow-sm" />
                            ) : (
                                <span className="text-sm text-slate-400 flex justify-center py-4">无图片凭证</span>
                            )}
                        </div>
                    </div>

                    {showAppealInput ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                           <label className="block text-sm font-bold text-slate-800 mb-2">驳回理由 / 申请平台介入</label>
                           <textarea 
                             className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                             rows={3}
                             placeholder="请详细说明驳回理由。提交后平台管理员将介入裁决。"
                             value={appealReason}
                             onChange={e => setAppealReason(e.target.value)}
                           />
                           <div className="flex gap-3 pt-3">
                              <button 
                                onClick={() => setShowAppealInput(false)}
                                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                              >
                                返回
                              </button>
                              <button 
                                onClick={submitAppeal}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                              >
                                确认驳回并申诉
                              </button>
                           </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button 
                                onClick={() => setShowAppealInput(true)}
                                className="flex-1 py-3 border border-red-200 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center gap-2"
                            >
                                <Scale className="w-4 h-4" /> 驳回并申诉
                            </button>
                            <button 
                                type="button"
                                onClick={confirmExceptionRefund}
                                disabled={isProcessing}
                                className={`flex-1 py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                                    isProcessing 
                                    ? 'bg-green-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                                }`}
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                同意退款
                            </button>
                        </div>
                    )}
                    
                    {!showAppealInput && (
                        <p className="text-xs text-center text-slate-400">
                            * 同意退款：您的冻结资金将返还接单方。<br/>
                            * 驳回并申诉：交由平台管理员人工介入裁决。
                        </p>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};