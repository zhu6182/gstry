import React, { useState } from 'react';
import { User } from '../types';
import { mockService } from '../services/mockService';
import { ArrowLeft, Upload, X, FileText, User as UserIcon, MapPin, MessageSquare, Tag, Lock } from 'lucide-react';

interface OrderPublishProps {
  user: User;
  onBack: () => void;
  onSuccess: () => void;
}

export const OrderPublish: React.FC<OrderPublishProps> = ({ user, onBack, onSuccess }) => {
  const partner = user.partnerId ? mockService.getPartnerById(user.partnerId) : null;
  // Explicitly check for true to avoid undefined/null issues blocking valid users
  const canPublish = partner?.permissions?.canPublish === true;

  const cities = mockService.getCities();
  const orderTypes = mockService.getOrderTypes().filter(t => t.isActive);
  const publishTitles = mockService.getPublishTitles().filter(t => t.isActive);
  
  const [formData, setFormData] = useState({
    type: orderTypes[0]?.name || '客咨',
    title: publishTitles[0]?.name || '',
    cityCode: 'SH',
    description: '',
    publishPrice: 0,
    // New Fields
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerSource: '小红书',
  });

  const [chatImages, setChatImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // --- Permission Check ---
  if (!canPublish) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">暂无发布权限</h2>
          <p className="text-slate-500 mb-8 max-w-md text-lg">
            您的账号当前已被限制发布新订单。如需恢复发布权限，请联系平台管理员或运营人员进行申请。
          </p>
          <button 
            onClick={onBack}
            className="px-8 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors shadow-sm"
          >
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as File[];
      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      newFiles.forEach(file => {
        if (file.size <= 5 * 1024 * 1024) { // 5MB Limit
           validFiles.push(file);
           newPreviews.push(URL.createObjectURL(file));
        } else {
           alert(`文件 ${file.name} 超过 5MB 限制，已自动忽略`);
        }
      });

      setChatImages(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...chatImages];
    const newPreviews = [...previews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setChatImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicit Validation to help user understand what is missing
    if (!formData.title) return alert('请选择订单标题');
    if (!formData.customerName) return alert('请填写客户姓名');
    if (!formData.customerPhone) return alert('请填写客户联系方式');
    if (!formData.description || formData.description.length < 5) return alert('需求描述不能少于5个字');
    if (!formData.publishPrice || formData.publishPrice <= 0) return alert('请填写有效的发布价格');

    try {
      mockService.createOrder({
        title: formData.title,
        type: formData.type,
        cityCode: formData.cityCode,
        description: formData.description,
        // Pass new fields
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        customerSource: formData.customerSource,
        chatAttachments: previews, // Using preview URLs as mock uploaded URLs
        
        publishPartnerId: user.partnerId!,
        publishPartnerName: partner?.name || '我的公司名称', // In real app, fetch from profile
        publishPrice: Number(formData.publishPrice),
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('发布失败：无权限或系统错误');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回订单列表
        </button>
        <h1 className="text-2xl font-bold text-slate-800">发布新资源</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
               <FileText className="w-4 h-4" />
             </div>
             <h3 className="font-bold text-slate-800">业务基本信息</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">业务类型</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  {orderTypes.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">服务城市</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.cityCode}
                  onChange={e => setFormData({...formData, cityCode: e.target.value})}
                >
                  {cities.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
             </div>
             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">订单标题</label>
                <select 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                >
                  <option value="" disabled>请选择标题</option>
                  {publishTitles.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">标题由平台统一配置，方便分类检索。</p>
             </div>
          </div>
        </div>

        {/* 2. Customer Info (New) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
               <UserIcon className="w-4 h-4" />
             </div>
             <h3 className="font-bold text-slate-800">客户详细信息</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">客户姓名 <span className="text-red-500">*</span></label>
                <input 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：王先生"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">联系方式 <span className="text-red-500">*</span></label>
                <input 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="手机号或微信号"
                  value={formData.customerPhone}
                  onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">客户来源</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.customerSource}
                  onChange={e => setFormData({...formData, customerSource: e.target.value})}
                >
                  <option value="小红书">小红书</option>
                  <option value="抖音">抖音</option>
                  <option value="大众点评">大众点评</option>
                  <option value="线下门店">线下门店</option>
                  <option value="老客介绍">老客介绍</option>
                  <option value="其他">其他</option>
                </select>
             </div>
             <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">详细地址</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入客户详细收货或服务地址"
                    value={formData.customerAddress}
                    onChange={e => setFormData({...formData, customerAddress: e.target.value})}
                  />
                </div>
             </div>
          </div>
        </div>

        {/* 3. Requirements & Attachments (Updated) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
               <MessageSquare className="w-4 h-4" />
             </div>
             <h3 className="font-bold text-slate-800">需求详情与附件</h3>
          </div>
          <div className="p-6 space-y-6">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">详细需求描述 <span className="text-red-500">*</span></label>
                <textarea 
                  rows={4}
                  required
                  minLength={5}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="请描述客户具体需求、预算范围、交付时间线及其他特殊要求... (至少5个字)"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">上传聊天记录/需求截图</label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                   {previews.map((url, index) => (
                     <div key={index} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden group">
                        <img src={url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                     </div>
                   ))}
                   <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500 font-medium">点击上传</span>
                      <span className="text-[10px] text-slate-400 mt-1">支持多张, Max 5MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                   </label>
                </div>
             </div>
          </div>
        </div>

        {/* 4. Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
               <Tag className="w-4 h-4" />
             </div>
             <h3 className="font-bold text-slate-800">定价信息</h3>
          </div>
          <div className="p-6">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-slate-700 mb-1">发布价 (您获得) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">¥</span>
                <input 
                  type="number" 
                  min="1"
                  required
                  className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xl text-slate-900"
                  value={formData.publishPrice || ''}
                  onChange={e => setFormData({...formData, publishPrice: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 bg-blue-50 p-2 rounded text-blue-700 inline-block">
                系统将根据配置规则自动计算买家需支付的最终抢单价（包含平台服务费）。
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 pb-8">
          <button 
            type="submit" 
            className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg bg-blue-600 hover:bg-blue-700 shadow-blue-200"
          >
            立即发布订单
          </button>
        </div>
      </form>
    </div>
  );
};