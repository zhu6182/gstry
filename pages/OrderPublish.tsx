
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, OrderStatus } from '../types';
import { mockService } from '../services/mockService';
import { ArrowLeft, Upload, X, FileText, User as UserIcon, MapPin, MessageSquare, Tag, Lock, Layers, Plus, Trash2, Copy, CheckSquare, FileSpreadsheet, Download, AlertCircle, CheckCircle, RefreshCw, HelpCircle, AlertTriangle } from 'lucide-react';

interface OrderPublishProps {
  user: User;
  onBack: () => void;
  onSuccess: () => void;
}

interface BatchRow {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  publishPrice: string;
  description: string;
  cityCode?: string; 
}

interface UploadResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    data: any;
    reason: string;
  }>;
}

export const OrderPublish: React.FC<OrderPublishProps> = ({ user, onBack, onSuccess }) => {
  const partner = user.partnerId ? mockService.getPartnerById(user.partnerId) : null;
  const isInternal = user.role === UserRole.ADMIN || user.role === UserRole.OPERATIONS || user.role === UserRole.DISPATCHER;
  const canPublish = isInternal || (partner?.permissions?.canPublish === true);

  const cities = mockService.getCities();
  const provinces = mockService.getCityGroups();
  const orderTypes = mockService.getOrderTypes().filter(t => t.isActive);
  const publishTitles = mockService.getPublishTitles().filter(t => t.isActive);
  const customerSources = mockService.getCustomerSources().filter(s => s.isActive);
  
  // Helper to find province ID by city code
  const getProvinceIdByCity = (code: string) => cities.find(c => c.code === code)?.groupId || '';

  // Mode State
  const [mode, setMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [batchMethod, setBatchMethod] = useState<'MANUAL' | 'FILE'>('MANUAL');

  // --- Single Mode State ---
  const [singleFormData, setSingleFormData] = useState({
    type: orderTypes[0]?.name || '客咨',
    title: publishTitles[0]?.name || '',
    cityCode: 'SH',
    description: '',
    publishPrice: 0,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerSource: customerSources[0]?.name || '小红书',
  });
  // Province state for Single Mode (Derived initial value)
  const [singleProvinceId, setSingleProvinceId] = useState(getProvinceIdByCity('SH'));

  const [chatImages, setChatImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Duplicate Warning Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // --- Batch Manual Mode State ---
  const [batchGlobal, setBatchGlobal] = useState({
    type: orderTypes[0]?.name || '客咨',
    title: publishTitles[0]?.name || '',
    cityCode: 'SH',
    customerSource: customerSources[0]?.name || '小红书'
  });
  // Province state for Batch Mode
  const [batchProvinceId, setBatchProvinceId] = useState(getProvinceIdByCity('SH'));

  const [batchRows, setBatchRows] = useState<BatchRow[]>([
    { id: '1', customerName: '', customerPhone: '', customerAddress: '', publishPrice: '', description: '' },
    { id: '2', customerName: '', customerPhone: '', customerAddress: '', publishPrice: '', description: '' },
    { id: '3', customerName: '', customerPhone: '', customerAddress: '', publishPrice: '', description: '' },
  ]);

  // --- Batch File Upload State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

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

  // --- Helper: Check Duplicate Phone ---
  const checkDuplicate = (phone: string): boolean => {
    const existingOrders = mockService.getOrders();
    // Check if phone exists in orders that are NOT Cancelled.
    // If an order is cancelled, we assume the lead is dead or free to be re-entered.
    return existingOrders.some(o => 
      o.customerPhone === phone && 
      o.status !== OrderStatus.CANCELLED
    );
  };

  // --- Handlers: Single Mode ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleFormData.title) return alert('请选择订单标题');
    if (!singleFormData.customerName) return alert('请填写客户姓名');
    if (!singleFormData.customerPhone) return alert('请填写客户联系方式');
    if (!singleFormData.description || singleFormData.description.length < 5) return alert('需求描述不能少于5个字');
    if (!singleFormData.publishPrice || singleFormData.publishPrice <= 0) return alert('请填写有效的发布价格');

    // Duplicate Check
    if (checkDuplicate(singleFormData.customerPhone)) {
      setDuplicateWarning(singleFormData.customerPhone);
      return;
    }

    try {
      mockService.createOrder({
        ...singleFormData,
        chatAttachments: previews,
        publishPartnerId: user.partnerId || user.id, 
        publishPartnerName: partner?.name || '平台推送订单', 
        publishPrice: Number(singleFormData.publishPrice),
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('发布失败：系统错误');
    }
  };

  // --- Handlers: Batch Manual ---
  const addBatchRow = () => {
    setBatchRows([...batchRows, { 
      id: Date.now().toString(), 
      customerName: '', customerPhone: '', customerAddress: '', publishPrice: '', description: '' 
    }]);
  };

  const removeBatchRow = (id: string) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter(r => r.id !== id));
  };

  const updateBatchRow = (id: string, field: keyof BatchRow, value: string) => {
    setBatchRows(batchRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const duplicateLastRow = () => {
    const last = batchRows[batchRows.length - 1];
    setBatchRows([...batchRows, { ...last, id: Date.now().toString() }]);
  };

  const handleBatchManualSubmit = () => {
    const validRows = batchRows.filter(r => r.customerName && r.customerPhone && r.publishPrice);
    if (validRows.length === 0) return alert('请至少填写一行完整的订单信息（姓名、电话、价格必填）');

    // Duplicate Check for Batch Manual
    for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        if (checkDuplicate(row.customerPhone)) {
            // Find the visual index (1-based)
            const visualIndex = batchRows.findIndex(r => r.id === row.id) + 1;
            return alert(`无法发布：第 ${visualIndex} 行客户手机号 (${row.customerPhone}) 重复。这个客户已经有人跟进了，不可重复录入。`);
        }
    }

    if (!confirm(`确认批量发布 ${validRows.length} 条订单？`)) return;

    try {
      let count = 0;
      validRows.forEach(row => {
        mockService.createOrder({
          title: batchGlobal.title,
          type: batchGlobal.type,
          cityCode: row.cityCode || batchGlobal.cityCode,
          description: row.description || `${batchGlobal.title}需求`,
          customerName: row.customerName,
          customerPhone: row.customerPhone,
          customerAddress: row.customerAddress,
          customerSource: batchGlobal.customerSource,
          chatAttachments: [],
          publishPartnerId: user.partnerId || user.id, 
          publishPartnerName: partner?.name || '平台推送订单', 
          publishPrice: Number(row.publishPrice),
        });
        count++;
      });
      alert(`成功发布 ${count} 条订单！`);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('批量发布过程中出现错误');
    }
  };

  // --- Handlers: Batch File Upload ---
  const downloadTemplate = () => {
    // Added "服务省份" column to the template
    const headers = "客户姓名,联系电话,详细地址,发布价格(数字),需求描述,服务省份(选填),服务城市(选填),客户来源(选填),业务类型(选填)";
    const example = "张三,13800138000,上海市浦东新区某街道,100,需要维修空调,上海市,上海市,小红书,客咨";
    // Adding BOM for Excel compatibility to force UTF-8 (though users often save as GBK anyway)
    const BOM = "\uFEFF"; 
    const csvContent = BOM + headers + "\n" + example;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "批量发单模板.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Try to read file with auto-detecting encoding (UTF-8 vs GBK)
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Basic Heuristic: If we see the replacement character  (U+FFFD), it's likely a mismatch.
        // Excel CSVs on Windows CN are often GBK. If read as UTF-8, Chinese chars become .
        if (text.includes('\ufffd')) {
           // Retry with GBK
           const retryReader = new FileReader();
           retryReader.onload = (ev) => resolve(ev.target?.result as string);
           retryReader.onerror = () => reject(new Error('File read error (GBK)'));
           retryReader.readAsText(file, 'GBK');
        } else {
           resolve(text);
        }
      };
      
      reader.onerror = () => reject(new Error('File read error (UTF-8)'));
      reader.readAsText(file, 'UTF-8'); // Default try
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadResult(null);

    try {
      const text = await readFileContent(file);
      // Handle different newline types (\r\n for Windows, \n for Unix)
      const rows = text.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
      
      // Skip Header
      const dataRows = rows.slice(1);
      
      let successCount = 0;
      let failCount = 0;
      const errors: any[] = [];

      dataRows.forEach((rowStr, index) => {
        // Naive CSV Split (Ideally should handle quoted commas, but simple split suffices for basic template)
        const cols = rowStr.split(',').map(c => c.trim().replace(/^"|"$/g, '')); // remove potential quotes
        
        // Skip empty rows (sometimes Excel leaves blank lines)
        if (cols.length < 2) return; 

        // UPDATED: Now destructuring provinceName as well
        const [name, phone, address, priceStr, desc, provinceName, cityName, source, typeName] = cols;
        
        // 1. Validation: Basic Fields
        if (!name || !phone || !priceStr) {
            failCount++;
            errors.push({ row: index + 2, data: rowStr.substring(0, 50) + '...', reason: '缺失必填项(姓名/电话/价格)' });
            return;
        }

        // 2. Validation: Duplicate Check (File Import)
        if (checkDuplicate(phone)) {
            failCount++;
            errors.push({ row: index + 2, data: `${name},${phone}...`, reason: '重复客户: 此号码已有人跟进，不可重复录入' });
            return;
        }

        // 3. Validation: City Mapping
        let targetCityCode = batchGlobal.cityCode; // Default
        if (cityName && cityName.trim()) {
            let searchPool = cities;
            // Narrow down by Province if provided
            if (provinceName && provinceName.trim()) {
                const matchedProv = provinces.find(p => p.name.includes(provinceName.trim()));
                if (matchedProv) {
                    searchPool = cities.filter(c => c.groupId === matchedProv.id);
                }
            }

            const matchedCity = searchPool.find(c => c.name === cityName.trim() || c.name.includes(cityName.trim()));
            if (matchedCity) {
              targetCityCode = matchedCity.code;
            } else {
              failCount++;
              errors.push({ row: index + 2, data: `${name},${phone},${cityName}...`, reason: `无法匹配城市: ${provinceName ? provinceName+'/' : ''}${cityName}` });
              return;
            }
        }

        // 4. Validation: Type Mapping
        let targetType = batchGlobal.type; // Default
        if (typeName) {
            const matchedType = orderTypes.find(t => t.name === typeName);
            if (matchedType) {
              targetType = matchedType.name;
            } else {
              failCount++;
              errors.push({ row: index + 2, data: `${name},${typeName}...`, reason: `无法匹配业务类型: ${typeName}` });
              return;
            }
        }

        // 5. Validation: Price
        const price = Number(priceStr);
        if (isNaN(price) || price <= 0) {
            failCount++;
            errors.push({ row: index + 2, data: `价格: ${priceStr}`, reason: `价格格式错误` });
            return;
        }

        // Create Order
        mockService.createOrder({
          title: batchGlobal.title,
          type: targetType, 
          cityCode: targetCityCode,
          // Use provided description, or Fallback. 
          // Relaxed Validation: No minimum length check here to prevent valid short descriptions (e.g. "修锁") from failing.
          description: desc || `${batchGlobal.title}需求`,
          customerName: name,
          customerPhone: phone,
          customerAddress: address || '',
          customerSource: source || batchGlobal.customerSource,
          chatAttachments: [],
          publishPartnerId: user.partnerId || user.id, 
          publishPartnerName: partner?.name || '平台推送订单', 
          publishPrice: price,
        });
        successCount++;
      });

      setUploadResult({
        total: dataRows.length,
        success: successCount,
        failed: failCount,
        errors: errors
      });

    } catch (err) {
      console.error(err);
      alert('文件读取失败，请确保文件格式正确 (推荐另存为 CSV UTF-8 或 标准 CSV)');
    } finally {
      setIsProcessingFile(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> 返回
          </button>
          <div className="h-6 w-px bg-slate-300"></div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
               onClick={() => setMode('SINGLE')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'SINGLE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               单条发布
             </button>
             <button 
               onClick={() => setMode('BATCH')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'BATCH' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Layers className="w-3 h-3" />
               批量发布
             </button>
          </div>
        </div>
        <h1 className="text-xl font-bold text-slate-800 hidden md:block">
          {mode === 'SINGLE' ? '发布新资源' : '批量快速发单'}
        </h1>
      </div>

      {mode === 'SINGLE' ? (
        // --- Single Form ---
        <form onSubmit={handleSingleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* ... (Single form content) ... */}
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
                    value={singleFormData.type}
                    onChange={e => setSingleFormData({...singleFormData, type: e.target.value})}
                  >
                    {orderTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
               </div>
               
               {/* Province & City Selection */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">服务省市</label>
                  <div className="flex gap-2">
                    <select 
                      className="w-1/2 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      value={singleProvinceId}
                      onChange={e => {
                        const newProvId = e.target.value;
                        setSingleProvinceId(newProvId);
                        // Auto-select first city in province
                        const firstCity = cities.find(c => c.groupId === newProvId);
                        if (firstCity) {
                          setSingleFormData(prev => ({ ...prev, cityCode: firstCity.code }));
                        }
                      }}
                    >
                      <option value="" disabled>选择省份</option>
                      {provinces.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select 
                      className="w-1/2 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      value={singleFormData.cityCode}
                      onChange={e => setSingleFormData({...singleFormData, cityCode: e.target.value})}
                    >
                      {cities.filter(c => c.groupId === singleProvinceId).map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
               </div>

               <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">订单标题</label>
                  <select 
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={singleFormData.title}
                    onChange={e => setSingleFormData({...singleFormData, title: e.target.value})}
                  >
                    <option value="" disabled>请选择标题</option>
                    {publishTitles.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
               </div>
            </div>
          </div>

          {/* 2. Customer Info */}
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
                    value={singleFormData.customerName}
                    onChange={e => setSingleFormData({...singleFormData, customerName: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">联系方式 <span className="text-red-500">*</span></label>
                  <input 
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="手机号或微信号"
                    value={singleFormData.customerPhone}
                    onChange={e => setSingleFormData({...singleFormData, customerPhone: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">客户来源</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={singleFormData.customerSource}
                    onChange={e => setSingleFormData({...singleFormData, customerSource: e.target.value})}
                  >
                    {customerSources.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
               </div>
               <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">详细地址</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入客户详细收货或服务地址"
                      value={singleFormData.customerAddress}
                      onChange={e => setSingleFormData({...singleFormData, customerAddress: e.target.value})}
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* 3. Requirements & Attachments */}
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
                    value={singleFormData.description}
                    onChange={e => setSingleFormData({...singleFormData, description: e.target.value})}
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
                        <span className="text-[10px] text-slate-400 mt-1">支持多张</span>
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
                    value={singleFormData.publishPrice || ''}
                    onChange={e => setSingleFormData({...singleFormData, publishPrice: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
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
      ) : (
        // --- Batch Mode ---
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           {/* Global Settings */}
           <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 md:p-6 shadow-sm">
              <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" /> 统一基础设置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">业务类型</label>
                    <select 
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={batchGlobal.type}
                      onChange={e => setBatchGlobal({...batchGlobal, type: e.target.value})}
                    >
                      {orderTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                 </div>
                 
                 {/* Batch Province/City Selection */}
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-blue-600 mb-1">默认省市</label>
                    <div className="flex gap-2">
                      <select 
                        className="w-1/2 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        value={batchProvinceId}
                        onChange={e => {
                          const newProvId = e.target.value;
                          setBatchProvinceId(newProvId);
                          const firstCity = cities.find(c => c.groupId === newProvId);
                          if (firstCity) {
                            setBatchGlobal(prev => ({ ...prev, cityCode: firstCity.code }));
                          }
                        }}
                      >
                        <option value="" disabled>省份</option>
                        {provinces.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <select 
                        className="w-1/2 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        value={batchGlobal.cityCode}
                        onChange={e => setBatchGlobal({...batchGlobal, cityCode: e.target.value})}
                      >
                        {cities.filter(c => c.groupId === batchProvinceId).map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">默认标题</label>
                    <select 
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={batchGlobal.title}
                      onChange={e => setBatchGlobal({...batchGlobal, title: e.target.value})}
                    >
                      {publishTitles.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">客户来源</label>
                    <select 
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={batchGlobal.customerSource}
                      onChange={e => setBatchGlobal({...batchGlobal, customerSource: e.target.value})}
                    >
                      {customerSources.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                 </div>
              </div>
              <p className="text-xs text-blue-400 mt-2">* 如果导入数据中未指定城市或类型，将自动使用上方选择的默认设置。</p>
           </div>

           {/* Batch Method Switcher */}
           <div className="flex border-b border-slate-200">
              <button 
                onClick={() => setBatchMethod('MANUAL')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${batchMethod === 'MANUAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
              >
                表格录入 (手动)
              </button>
              <button 
                onClick={() => setBatchMethod('FILE')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${batchMethod === 'FILE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> 文件导入 (Excel/CSV)
              </button>
           </div>

           {/* --- Method: File Import --- */}
           {batchMethod === 'FILE' && (
             <div className="space-y-6">
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors group relative">
                   <input 
                     type="file" 
                     accept=".csv,.txt" // Limitation of simple parse
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                     onChange={handleFileUpload}
                     ref={fileInputRef}
                   />
                   <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500 group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-8 h-8" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2">点击或拖拽上传 CSV 文件</h3>
                   <p className="text-slate-500 text-sm max-w-sm mx-auto">
                     系统将自动识别 UTF-8 或 GBK 编码（兼容 Excel 导出格式）。
                   </p>
                   <button 
                     onClick={(e) => {
                       e.stopPropagation(); // Prevent triggering input
                       downloadTemplate();
                     }}
                     className="mt-6 flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline z-20 relative"
                   >
                     <Download className="w-4 h-4" /> 下载标准模板
                   </button>
                </div>
                
                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                   <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" />
                   <p>
                     <strong>提示：</strong> 为了避免乱码，如果您使用 Excel，建议另存为 "CSV UTF-8 (逗号分隔)"。但如果您直接保存为普通 CSV，系统也会尝试自动兼容。
                   </p>
                </div>

                {isProcessingFile && (
                  <div className="text-center py-8 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    正在解析文件 (智能识别编码)...
                  </div>
                )}

                {/* Upload Results Report */}
                {uploadResult && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                     <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-slate-800">导入结果报告</h3>
                        <button onClick={() => setUploadResult(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                     </div>
                     <div className="p-6">
                        <div className="flex gap-4 mb-6">
                           <div className="flex-1 bg-green-50 border border-green-100 p-4 rounded-lg flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle className="w-5 h-5"/></div>
                              <div>
                                 <p className="text-xs text-green-800 font-bold uppercase">成功发布</p>
                                 <p className="text-2xl font-bold text-green-700">{uploadResult.success} <span className="text-sm">单</span></p>
                              </div>
                           </div>
                           <div className="flex-1 bg-red-50 border border-red-100 p-4 rounded-lg flex items-center gap-3">
                              <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertCircle className="w-5 h-5"/></div>
                              <div>
                                 <p className="text-xs text-red-800 font-bold uppercase">导入失败</p>
                                 <p className="text-2xl font-bold text-red-700">{uploadResult.failed} <span className="text-sm">单</span></p>
                              </div>
                           </div>
                        </div>

                        {uploadResult.errors.length > 0 && (
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                             <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">失败详情</div>
                             <div className="max-h-60 overflow-y-auto">
                               <table className="w-full text-left text-sm">
                                 <thead className="bg-white sticky top-0 shadow-sm">
                                   <tr>
                                     <th className="px-4 py-2 w-16 text-slate-400">行号</th>
                                     <th className="px-4 py-2 w-1/2">原始数据摘要</th>
                                     <th className="px-4 py-2 text-red-600">失败原因</th>
                                   </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                   {uploadResult.errors.map((err, idx) => (
                                     <tr key={idx} className="hover:bg-slate-50">
                                       <td className="px-4 py-2 text-slate-400">#{err.row}</td>
                                       <td className="px-4 py-2 text-slate-600 truncate max-w-xs" title={err.data}>
                                         {err.data}
                                       </td>
                                       <td className="px-4 py-2 text-red-600 font-medium">
                                         {err.reason}
                                       </td>
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             </div>
                          </div>
                        )}
                        
                        <div className="mt-6 text-right">
                           <button 
                             onClick={onSuccess}
                             className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                           >
                             完成并查看订单
                           </button>
                        </div>
                     </div>
                  </div>
                )}
             </div>
           )}

           {/* --- Method: Manual Table --- */}
           {batchMethod === 'MANUAL' && (
             <>
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3 w-12 text-center">#</th>
                          <th className="px-4 py-3 w-32">客户姓名*</th>
                          <th className="px-4 py-3 w-40">联系方式*</th>
                          <th className="px-4 py-3 w-32">城市 (选填)</th>
                          <th className="px-4 py-3 w-64">详细地址</th>
                          <th className="px-4 py-3 w-32">价格 (¥)*</th>
                          <th className="px-4 py-3">需求描述</th>
                          <th className="px-4 py-3 w-16 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {batchRows.map((row, index) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
                            <td className="px-4 py-3">
                              <input 
                                className="w-full border border-slate-200 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                placeholder="王先生"
                                value={row.customerName}
                                onChange={e => updateBatchRow(row.id, 'customerName', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                className="w-full border border-slate-200 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                placeholder="1380000..."
                                value={row.customerPhone}
                                onChange={e => updateBatchRow(row.id, 'customerPhone', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select 
                                className="w-full border border-slate-200 rounded px-2 py-1 focus:border-blue-500 outline-none text-xs bg-white"
                                value={row.cityCode || ''}
                                onChange={e => updateBatchRow(row.id, 'cityCode', e.target.value)}
                              >
                                <option value="">{mockService.getCityName(batchGlobal.cityCode)} (默认)</option>
                                {provinces.map(prov => (
                                  <optgroup key={prov.id} label={prov.name}>
                                    {cities.filter(c => c.groupId === prov.id).map(c => (
                                      <option key={c.code} value={c.code}>{c.name}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                className="w-full border border-slate-200 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                placeholder="街道/小区..."
                                value={row.customerAddress}
                                onChange={e => updateBatchRow(row.id, 'customerAddress', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="number"
                                className="w-full border border-slate-200 rounded px-2 py-1 focus:border-blue-500 outline-none font-bold text-slate-700"
                                placeholder="0"
                                value={row.publishPrice}
                                onChange={e => updateBatchRow(row.id, 'publishPrice', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                className="w-full border border-slate-200 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                placeholder="如不填则默认使用标题+需求"
                                value={row.description}
                                onChange={e => updateBatchRow(row.id, 'description', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button 
                                onClick={() => removeBatchRow(row.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="删除此行"
                                disabled={batchRows.length <= 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                     <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={addBatchRow}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" /> 添加一行
                        </button>
                        <button 
                          type="button"
                          onClick={duplicateLastRow}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Copy className="w-4 h-4" /> 复制最后一行
                        </button>
                     </div>
                     <div className="text-xs text-slate-400">
                        当前共 {batchRows.length} 行待发布
                     </div>
                  </div>
               </div>

               <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleBatchManualSubmit}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    确认批量发布
                  </button>
               </div>
             </>
           )}
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-transform">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">重复客户提醒</h3>
                 <div className="text-slate-600 text-sm space-y-2">
                    <p>检测到该客户手机号已存在于系统中：</p>
                    <p className="font-mono font-bold text-lg text-slate-800 bg-slate-100 py-1 px-3 rounded inline-block">
                      {duplicateWarning}
                    </p>
                    <p className="text-red-500 font-medium">
                      该客户当前已有正在跟进的订单。<br/>为避免撞单，禁止重复录入。
                    </p>
                 </div>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100">
                 <button 
                   onClick={() => setDuplicateWarning(null)}
                   className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                 >
                   我知道了
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
