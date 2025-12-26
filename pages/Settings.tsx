import React, { useState, useMemo, useRef, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { City, CityGroup, OrderType, PublishTitle, User, CustomerSource, SystemConfig, ServerConfig } from '../types';
import { Globe, FileType, Tag, Share2, Palette, Plus, MapPin, AlertTriangle, ToggleLeft, ToggleRight, Check, Search, LayoutGrid, X, Database, Save, Server, Trash2, Power } from 'lucide-react';

interface SettingsProps {
  user: User;
  systemConfig: SystemConfig;
  onUpdateConfig: (config: SystemConfig) => void;
  onLogout: () => void;
}

type TabType = 'city' | 'type' | 'title' | 'source' | 'branding' | 'database';

// 辅助组件：Top Navigation Button
const NavBtn = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all font-bold text-sm whitespace-nowrap ${
        active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`}
  >
     <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
     <span>{label}</span>
  </button>
);

export const Settings: React.FC<SettingsProps> = ({ user, systemConfig, onUpdateConfig, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('city');
  
  // City Network State
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [provinceSearch, setProvinceSearch] = useState('');

  // Add City Inline State
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const cityInputRef = useRef<HTMLInputElement>(null);

  // General Config Inline Add State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const itemInputRef = useRef<HTMLInputElement>(null);

  // Server Config State
  const [serverForm, setServerForm] = useState<ServerConfig>(mockService.getServerConfig());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState('');

  const [cities, setCities] = useState<City[]>(mockService.getCities());
  const [provinces, setProvinces] = useState<CityGroup[]>(mockService.getCityGroups());
  const [orderTypes, setOrderTypes] = useState<OrderType[]>(mockService.getOrderTypes());
  const [publishTitles, setPublishTitles] = useState<PublishTitle[]>(mockService.getPublishTitles());
  const [customerSources, setCustomerSources] = useState<CustomerSource[]>(mockService.getCustomerSources());

  const regions = mockService.getRegions();
  const [brandForm, setBrandForm] = useState<SystemConfig>({ ...systemConfig });

  // Auto-select first province if data exists and none selected
  React.useEffect(() => {
    if (!selectedProvinceId && provinces.length > 0) {
        // Try to find Shanghai or Beijing first for better UX, else first one
        const defaultProv = provinces.find(p => p.name.includes('上海')) || provinces.find(p => p.name.includes('北京')) || provinces[0];
        setSelectedProvinceId(defaultProv.id);
    }
  }, [provinces, selectedProvinceId]);

  // Auto focus input when adding city
  useEffect(() => {
    if (isAddingCity && cityInputRef.current) {
      cityInputRef.current.focus();
    }
  }, [isAddingCity]);

  // Auto focus input when adding general item
  useEffect(() => {
    if (isAddingItem && itemInputRef.current) {
      itemInputRef.current.focus();
    }
  }, [isAddingItem]);

  // Reset adding state when tab changes
  useEffect(() => {
    setIsAddingItem(false);
    setNewItemName('');
  }, [activeTab]);

  const refresh = () => {
    setCities([...mockService.getCities()]);
    setProvinces([...mockService.getCityGroups()]);
    setOrderTypes([...mockService.getOrderTypes()]);
    setPublishTitles([...mockService.getPublishTitles()]);
    setCustomerSources([...mockService.getCustomerSources()]);
  };

  const toggleProvinceStatus = (provId: string, enable: boolean) => {
    mockService.bulkUpdateProvinceStatus(provId, enable ? 'ACTIVE' : 'DISABLED');
    refresh();
  };

  const toggleCityStatus = (cityCode: string) => {
    const city = cities.find(c => c.code === cityCode);
    if (city) {
      city.status = city.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      refresh();
    }
  };

  // --- 基础配置通用逻辑 ---
  const handleAddItem = () => {
    setIsAddingItem(true);
  };

  const handleSaveNewItem = () => {
    if (!newItemName.trim()) {
      setIsAddingItem(false);
      return;
    }
    
    if (activeTab === 'type') mockService.addOrderType(newItemName.trim());
    if (activeTab === 'title') mockService.addPublishTitle(newItemName.trim());
    if (activeTab === 'source') mockService.addCustomerSource(newItemName.trim());
    
    setNewItemName('');
    setIsAddingItem(false);
    refresh();
  };

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveNewItem();
    } else if (e.key === 'Escape') {
      setIsAddingItem(false);
      setNewItemName('');
    }
  };

  const handleToggleItem = (tab: TabType, id: string) => {
    if (tab === 'type') mockService.toggleOrderType(id);
    if (tab === 'title') mockService.togglePublishTitle(id);
    if (tab === 'source') mockService.toggleCustomerSource(id);
    refresh();
  };

  // Handle saving new city from inline input
  const handleSaveNewCity = () => {
    if (!selectedProvinceId || !newCityName.trim()) {
      setIsAddingCity(false);
      return;
    }
    
    mockService.addCity(newCityName.trim(), selectedProvinceId);
    setNewCityName('');
    setIsAddingCity(false);
    refresh();
  };

  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveNewCity();
    } else if (e.key === 'Escape') {
      setIsAddingCity(false);
      setNewCityName('');
    }
  };

  const handleServerSave = () => {
    mockService.updateServerConfig(serverForm);
    alert('数据库连接配置已更新');
  };

  const executeFactoryReset = () => {
    if (resetInput !== 'CONFIRM') {
      alert('请输入 CONFIRM 以确认清空');
      return;
    }
    mockService.factoryReset(user.id);
    alert('系统数据已重置！即将退出登录以刷新状态...');
    setShowResetConfirm(false);
    setResetInput('');
    // Instead of reload which crashes some environments, just logout.
    // The service singleton is already cleared in memory.
    onLogout();
  };

  // Filtered Province List based on search
  const filteredRegionMap = useMemo(() => {
    if (!provinceSearch) return regions;
    
    // Return regions that have matching provinces
    return regions.map(reg => {
       const matchingProvinces = reg.provinces.filter(pName => pName.includes(provinceSearch));
       if (matchingProvinces.length === 0) return null;
       return { ...reg, provinces: matchingProvinces };
    }).filter(Boolean) as typeof regions;
  }, [regions, provinceSearch]);

  const activeProvince = provinces.find(p => p.id === selectedProvinceId);
  const activeProvinceCities = cities.filter(c => c.groupId === selectedProvinceId);
  const activeProvinceActiveCount = activeProvinceCities.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">系统运营配置</h1>
          <p className="text-slate-500 text-sm">管理全国业务网络及业务标准字典</p>
        </div>
        
        <div className="flex gap-3">
          {activeTab !== 'city' && activeTab !== 'branding' && activeTab !== 'database' && (
            <button 
              onClick={handleAddItem}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" /> 新增配置
            </button>
          )}
          {/* 一键清除按钮 */}
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" /> 一键清空测试数据
          </button>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex overflow-x-auto gap-1 shrink-0">
         <NavBtn active={activeTab === 'city'} onClick={() => setActiveTab('city')} icon={Globe} label="城市网络" />
         <NavBtn active={activeTab === 'type'} onClick={() => setActiveTab('type')} icon={FileType} label="业务类型" />
         <NavBtn active={activeTab === 'title'} onClick={() => setActiveTab('title')} icon={Tag} label="发布标题" />
         <NavBtn active={activeTab === 'source'} onClick={() => setActiveTab('source')} icon={Share2} label="客户来源" />
         <div className="w-px bg-slate-200 mx-2 my-1"></div>
         <NavBtn active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={Palette} label="系统品牌" />
         <NavBtn active={activeTab === 'database'} onClick={() => setActiveTab('database')} icon={Database} label="服务配置" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 min-h-0 overflow-hidden flex flex-col">
          
          {/* 1. 城市管理 */}
          {activeTab === 'city' && (
            <div className="flex flex-col h-full">
               {/* Stats Header */}
               <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
                  <div className="flex gap-6 text-sm">
                     <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                           <Globe className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-slate-500 text-xs">覆盖省份</p>
                           <p className="font-bold text-slate-800">{provinces.length} 个</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded">
                           <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-slate-500 text-xs">核心城市</p>
                           <p className="font-bold text-slate-800">{cities.length} 个</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded">
                           <Check className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-slate-500 text-xs">已开通</p>
                           <p className="font-bold text-slate-800">{cities.filter(c => c.status === 'ACTIVE').length} 个</p>
                        </div>
                     </div>
                  </div>
                  <div className="text-xs text-slate-400">
                     全国一张网 • 统一运营
                  </div>
               </div>

               {/* Split View Container */}
               <div className="flex flex-1 min-h-0">
                  {/* Left Sidebar: Province List */}
                  <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
                      <div className="p-3 border-b border-slate-200">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="搜索省份..." 
                              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                              value={provinceSearch}
                              onChange={e => setProvinceSearch(e.target.value)}
                            />
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-2 space-y-4">
                        {provinces.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs">
                              暂无数据<br/>请点击右上角载入
                            </div>
                        ) : (
                            filteredRegionMap.map(reg => {
                              const existingProvinces = reg.provinces
                                .map(pName => provinces.find(p => p.name === pName))
                                .filter(Boolean) as CityGroup[];
                              
                              if (existingProvinces.length === 0) return null;

                              return (
                                  <div key={reg.id}>
                                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        {reg.name}
                                    </div>
                                    <div className="space-y-0.5">
                                        {existingProvinces.map(prov => {
                                          const isActive = selectedProvinceId === prov.id;
                                          const pCities = cities.filter(c => c.groupId === prov.id);
                                          const isFullyActive = pCities.length > 0 && pCities.every(c => c.status === 'ACTIVE');
                                          
                                          return (
                                              <button
                                                key={prov.id}
                                                onClick={() => setSelectedProvinceId(prov.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                                    isActive 
                                                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100' 
                                                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                                                }`}
                                              >
                                                <span className="truncate">{prov.name}</span>
                                                {isFullyActive && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                                              </button>
                                          );
                                        })}
                                    </div>
                                  </div>
                              );
                            })
                        )}
                      </div>
                  </div>

                  {/* Right Content: Cities Grid */}
                  <div className="flex-1 flex flex-col overflow-hidden bg-white">
                      {activeProvince ? (
                        <>
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                              <div>
                                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {activeProvince.name}
                                    <span className="text-sm font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                        {activeProvinceCities.length} 个城市
                                    </span>
                                  </h2>
                                  <p className="text-xs text-slate-400 mt-1">
                                    当前已开通 {activeProvinceActiveCount} 城
                                  </p>
                              </div>
                              <div className="flex gap-2">
                                  {activeProvinceCities.length > 0 && (
                                    <button 
                                        onClick={() => toggleProvinceStatus(activeProvince.id, activeProvinceActiveCount === 0)}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                                            activeProvinceActiveCount > 0
                                            ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                                            : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                        }`}
                                    >
                                        {activeProvinceActiveCount > 0 ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                        {activeProvinceActiveCount > 0 ? '全省停用' : '全省开通'}
                                    </button>
                                  )}
                              </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6">
                              {activeProvinceCities.length === 0 && !isAddingCity ? (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <LayoutGrid className="w-12 h-12 mb-3 opacity-20" />
                                    <p>该省份暂无城市数据</p>
                                    <button 
                                        onClick={() => setIsAddingCity(true)} 
                                        className="mt-4 text-blue-600 font-bold hover:underline"
                                    >
                                        点击添加第一个城市
                                    </button>
                                  </div>
                              ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {activeProvinceCities.map(city => (
                                        <button
                                          key={city.code}
                                          onClick={() => toggleCityStatus(city.code)}
                                          className={`relative group flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                                              city.status === 'ACTIVE' 
                                              ? 'border-blue-500 bg-blue-50/30' 
                                              : 'border-slate-200 bg-white opacity-70 hover:opacity-100'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full mb-1">
                                              <span className={`font-bold ${city.status === 'ACTIVE' ? 'text-blue-900' : 'text-slate-600'}`}>{city.name}</span>
                                              {city.status === 'ACTIVE' ? (
                                                <Check className="w-4 h-4 text-blue-600" />
                                              ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                                              )}
                                          </div>
                                          <span className="text-xs text-slate-400 font-mono mt-1 block">{city.code}</span>
                                        </button>
                                    ))}
                                    {/* Inline Add Logic */}
                                    {isAddingCity ? (
                                        <div className="flex flex-col p-4 rounded-xl border border-blue-500 bg-white shadow-md animate-in zoom-in-95 duration-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-blue-600">新城市名称</span>
                                                <button onClick={() => setIsAddingCity(false)} className="text-slate-400 hover:text-red-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <input 
                                                ref={cityInputRef}
                                                type="text" 
                                                className="w-full border-b border-blue-200 outline-none text-sm font-bold text-slate-800 pb-1 mb-3 placeholder:text-slate-300"
                                                placeholder="输入名称"
                                                value={newCityName}
                                                onChange={e => setNewCityName(e.target.value)}
                                                onKeyDown={handleCityKeyDown}
                                            />
                                            <button 
                                                onClick={handleSaveNewCity}
                                                disabled={!newCityName.trim()}
                                                className={`w-full py-1.5 rounded-lg text-xs font-bold text-white transition-colors ${
                                                    newCityName.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
                                                }`}
                                            >
                                                确认添加
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsAddingCity(true)} className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all min-h-[100px]">
                                          <Plus className="w-6 h-6 mb-1" />
                                          <span className="text-xs font-bold">新增</span>
                                        </button>
                                    )}
                                  </div>
                              )}
                            </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                            <MapPin className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="text-lg font-medium">请选择左侧省份</p>
                        </div>
                      )}
                  </div>
               </div>
            </div>
          )}

          {/* 2. 通用配置 */}
          {(activeTab === 'type' || activeTab === 'title' || activeTab === 'source') && (
            <div className="p-8 overflow-y-auto h-full">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 text-sm mb-6 max-w-4xl mx-auto">
                 <AlertTriangle className="w-5 h-5 shrink-0" />
                 <p>注意：修改这些核心字典项将直接影响合伙人的技能选择及发单列表。停用项将不再显示在前端选择中。</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                 {(activeTab === 'type' ? orderTypes : activeTab === 'title' ? publishTitles : customerSources).map((item: any) => (
                    <div key={item.id} className={`p-5 rounded-2xl border flex items-center justify-between transition-all group hover:shadow-lg ${item.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                             {activeTab === 'type' ? <FileType className="w-6 h-6" /> : activeTab === 'title' ? <Tag className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                             <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mt-1">{item.isActive ? '已启用' : '已停用'}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => handleToggleItem(activeTab, item.id)} 
                            className={`p-2.5 rounded-xl transition-colors ${item.isActive ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-400 bg-slate-200 hover:bg-slate-300'}`}
                            title={item.isActive ? '点击停用' : '点击启用'}
                          >
                             {item.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                       </div>
                    </div>
                 ))}
                 {/* Inline Add Card */}
                 {isAddingItem ? (
                    <div className="p-5 rounded-2xl border border-blue-500 bg-white shadow-md animate-in zoom-in-95 duration-200 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-blue-600">新增</span>
                            <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                        <input ref={itemInputRef} type="text" className="w-full border-b border-blue-200 outline-none text-lg font-bold text-slate-800 pb-1 mb-4 placeholder:text-slate-300 bg-transparent" placeholder="请输入名称..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={handleItemKeyDown} />
                        <button onClick={handleSaveNewItem} disabled={!newItemName.trim()} className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${newItemName.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}>确认添加</button>
                    </div>
                 ) : (
                    <button onClick={() => setIsAddingItem(true)} className="p-5 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-500 min-h-[140px]">
                      <Plus className="w-8 h-8" /><span className="font-bold text-sm">点击新增</span>
                    </button>
                 )}
              </div>
            </div>
          )}

          {/* 3. 品牌设置 */}
          {activeTab === 'branding' && (
            <div className="p-8 max-w-4xl mx-auto space-y-8 overflow-y-auto h-full">
               <div className="bg-slate-900 rounded-2xl p-10 text-white relative overflow-hidden shadow-xl">
                  <div className="relative z-10 flex items-center gap-8">
                     <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                        <Palette className="w-12 h-12 text-white" />
                     </div>
                     <div>
                        <h2 className="text-4xl font-black tracking-tight">{brandForm.systemName || '系统名称预览'}</h2>
                        <p className="text-slate-400 mt-2 text-xl">{brandForm.loginSubtitle || '副标题预览区域'}</p>
                     </div>
                  </div>
                  <Globe className="absolute -right-10 -bottom-16 w-80 h-80 text-white opacity-5 pointer-events-none" />
               </div>

               <div className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-xl border-b border-slate-100 pb-4">基本信息配置</h3>
                  <div className="grid grid-cols-1 gap-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">系统主标题 (System Name)</label>
                        <input className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-blue-500 outline-none transition-colors text-lg" value={brandForm.systemName} onChange={e => setBrandForm({...brandForm, systemName: e.target.value})} placeholder="例如：PartnerNexus" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">登录页副标题 (Subtitle)</label>
                        <input className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-blue-500 outline-none transition-colors" value={brandForm.loginSubtitle} onChange={e => setBrandForm({...brandForm, loginSubtitle: e.target.value})} placeholder="例如：全国合伙人统一管理平台" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">页脚版权信息 (Copyright)</label>
                        <input className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-blue-500 outline-none transition-colors" value={brandForm.copyright} onChange={e => setBrandForm({...brandForm, copyright: e.target.value})} placeholder="例如：© 2024 PartnerNexus Inc." />
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                     <button onClick={() => { onUpdateConfig(brandForm); alert('品牌配置已生效'); }} className="px-10 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">保存当前设置</button>
                  </div>
               </div>
            </div>
          )}

          {/* 4. 数据库/服务配置 */}
          {activeTab === 'database' && (
            <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                     <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Server className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-800 text-xl">数据库连接配置</h3>
                        <p className="text-slate-500 text-sm">配置后端服务连接参数，方便部署与交付</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">API 基础路径</label>
                        <input className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-slate-50 text-slate-600 font-mono" value={serverForm.apiBaseUrl} onChange={e => setServerForm({...serverForm, apiBaseUrl: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">DB Host</label>
                        <input className="w-full border border-slate-300 rounded-lg px-4 py-3" value={serverForm.dbHost} onChange={e => setServerForm({...serverForm, dbHost: e.target.value})} placeholder="127.0.0.1" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">DB Port</label>
                        <input className="w-full border border-slate-300 rounded-lg px-4 py-3" value={serverForm.dbPort} onChange={e => setServerForm({...serverForm, dbPort: e.target.value})} placeholder="3306" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Database Name</label>
                        <input className="w-full border border-slate-300 rounded-lg px-4 py-3" value={serverForm.dbName} onChange={e => setServerForm({...serverForm, dbName: e.target.value})} placeholder="partner_nexus" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Environment</label>
                        <select className="w-full border border-slate-300 rounded-lg px-4 py-3" value={serverForm.environment} onChange={e => setServerForm({...serverForm, environment: e.target.value as any})}>
                           <option value="DEV">Development (开发环境)</option>
                           <option value="PROD">Production (生产环境)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">DB User</label>
                        <input className="w-full border border-slate-300 rounded-lg px-4 py-3" value={serverForm.dbUser} onChange={e => setServerForm({...serverForm, dbUser: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">DB Password</label>
                        <input type="password" className="w-full border border-slate-300 rounded-lg px-4 py-3" value={serverForm.dbPassword} onChange={e => setServerForm({...serverForm, dbPassword: e.target.value})} placeholder="••••••" />
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                     <button onClick={handleServerSave} className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors">
                        <Save className="w-4 h-4" /> 保存配置
                     </button>
                  </div>
               </div>
            </div>
          )}

      {/* Factory Reset Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">危险操作警告</h3>
              <p className="text-slate-600 mb-6">
                 您即将执行<span className="text-red-600 font-bold">全系统数据清空</span>操作。
                 <br/><br/>
                 <ul className="text-left text-sm bg-red-50 p-4 rounded-lg space-y-2 text-red-800">
                    <li>• 所有合伙人账号将被删除</li>
                    <li>• 所有订单数据及聊天记录将被删除</li>
                    <li>• 所有财务流水及提现记录将被删除</li>
                    <li>• 除您(管理员)外的所有内部账号将被删除</li>
                 </ul>
              </p>
              
              <div className="mb-6 text-left">
                 <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">请输入 CONFIRM 以确认执行</label>
                 <input 
                   type="text" 
                   className="w-full border-2 border-red-200 rounded-xl px-4 py-3 focus:border-red-500 outline-none font-mono text-center uppercase tracking-widest"
                   placeholder="CONFIRM"
                   value={resetInput}
                   onChange={e => setResetInput(e.target.value.toUpperCase())}
                 />
              </div>

              <div className="flex gap-4">
                 <button 
                   onClick={() => { setShowResetConfirm(false); setResetInput(''); }}
                   className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                 >
                   取消
                 </button>
                 <button 
                   onClick={executeFactoryReset}
                   disabled={resetInput !== 'CONFIRM'}
                   className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                      resetInput === 'CONFIRM' 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                      : 'bg-slate-300 cursor-not-allowed'
                   }`}
                 >
                   确认清空
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};