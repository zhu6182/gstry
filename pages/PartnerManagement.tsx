
import React, { useState, useEffect, useRef } from 'react';
import { mockService } from '../services/mockService';
import { Partner, UserRole, User, PartnerPermissions } from '../types';
import { MoreHorizontal, MapPin, Search, Plus, Trash2, Power, X, AlertTriangle, CheckCircle, RotateCcw, Edit, Phone, Tag, Globe, ChevronDown, ChevronRight, CheckSquare, Square, Shield, Lock, Unlock, Ban } from 'lucide-react';

interface PartnerManagementProps {
  user: User;
}

export const PartnerManagement: React.FC<PartnerManagementProps> = ({ user }) => {
  const [partners, setPartners] = useState(mockService.getPartners());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  // Province selection states for cascading dropdowns
  const [addProvinceId, setAddProvinceId] = useState('');
  const [editProvinceId, setEditProvinceId] = useState('');

  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  
  const defaultPermissions: PartnerPermissions = {
    canPublish: true,
    canGrab: true,
    canCrossCity: false,
    canViewCrossCity: false
  };

  const [editFormData, setEditFormData] = useState({
    name: '', contactName: '', phone: '', cityCode: '',
    businessTypes: [] as string[], crossCityCodes: [] as string[],
    permissions: defaultPermissions
  });

  const [formData, setFormData] = useState({
    name: '', contactName: '', phone: '', cityCode: '',
    username: '', businessTypes: [] as string[], crossCityCodes: [] as string[],
    permissions: defaultPermissions
  });

  // Modal expand states for provinces
  const [expandedProvinces, setExpandedProvinces] = useState<Record<string, boolean>>({});

  const cities = mockService.getCities();
  const provinces = mockService.getCityGroups();
  const publishTitles = mockService.getPublishTitles().filter(t => t.isActive);

  const refreshList = () => setPartners([...mockService.getPartners()]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mockService.addPartner({ ...formData, contactPhone: formData.phone });
    setShowAddModal(false);
    refreshList();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      mockService.updatePartner(editingPartner.id, editFormData);
      setEditingPartner(null);
      refreshList();
    }
  };

  const handleDeletePartner = () => {
    if (deleteTarget) {
      mockService.deletePartner(deleteTarget.id);
      setDeleteTarget(null);
      refreshList();
    }
  };

  const handleToggleStatus = (p: Partner) => {
    mockService.togglePartnerStatus(p.id);
    refreshList();
  };

  const toggleProvince = (id: string) => {
    setExpandedProvinces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCitySelection = (cityCode: string, isEdit: boolean) => {
    const targetState = isEdit ? setEditFormData : setFormData;
    targetState((prev: any) => ({
      ...prev,
      crossCityCodes: prev.crossCityCodes.includes(cityCode)
        ? prev.crossCityCodes.filter((c: string) => c !== cityCode)
        : [...prev.crossCityCodes, cityCode]
    }));
  };

  const toggleProvinceAll = (provinceId: string, isEdit: boolean) => {
    const provinceCities = cities.filter(c => c.groupId === provinceId);
    const codes = provinceCities.map(c => c.code);
    const targetState = isEdit ? setEditFormData : setFormData;
    const currentCodes = isEdit ? editFormData.crossCityCodes : formData.crossCityCodes;
    
    const allSelected = codes.every(c => currentCodes.includes(c));
    
    if (allSelected) {
      targetState((prev: any) => ({
        ...prev,
        crossCityCodes: prev.crossCityCodes.filter((c: string) => !codes.includes(c))
      }));
    } else {
      targetState((prev: any) => ({
        ...prev,
        crossCityCodes: Array.from(new Set([...prev.crossCityCodes, ...codes]))
      }));
    }
  };

  const updatePermissions = (key: keyof PartnerPermissions, value: boolean, isEdit: boolean) => {
    const targetState = isEdit ? setEditFormData : setFormData;
    targetState((prev: any) => ({
        ...prev,
        permissions: {
            ...prev.permissions,
            [key]: value
        }
    }));
  };

  // Open Add Modal and reset form
  const handleOpenAddModal = () => {
    setFormData({
      name: '', contactName: '', phone: '', cityCode: '',
      username: '', businessTypes: [], crossCityCodes: [],
      permissions: { ...defaultPermissions }
    });
    setAddProvinceId('');
    setShowAddModal(true);
  };

  // Open Edit Modal and populate data
  const handleOpenEditModal = (p: Partner) => {
    const user = mockService.getUserById(p.userId);
    const city = cities.find(c => c.code === p.cityCode);
    
    setEditingPartner(p);
    setEditProvinceId(city?.groupId || ''); // Set province based on city
    setEditFormData({
      name: p.name, contactName: user?.realName || '', phone: p.contactPhone,
      cityCode: p.cityCode, businessTypes: p.businessTypes || [], crossCityCodes: p.crossCityCodes || [],
      permissions: p.permissions || { ...defaultPermissions }
    });
  };

  // Helper to render city selector tree
  const ProvinceCityTree = ({ isEdit }: { isEdit: boolean }) => {
    const currentCodes = isEdit ? editFormData.crossCityCodes : formData.crossCityCodes;
    const currentHomeCity = isEdit ? editFormData.cityCode : formData.cityCode;

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
        {provinces.map(prov => {
          const provCities = cities.filter(c => c.groupId === prov.id && c.code !== currentHomeCity);
          if (provCities.length === 0) return null;
          
          const isExpanded = expandedProvinces[prov.id];
          const selectedCount = provCities.filter(c => currentCodes.includes(c.code)).length;
          const isAllSelected = selectedCount === provCities.length;

          return (
            <div key={prov.id} className="border-b border-slate-100 last:border-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleProvince(prov.id)}>
                   {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                   <span className="text-sm font-bold text-slate-700">{prov.name}</span>
                   {selectedCount > 0 && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{selectedCount}</span>}
                </div>
                <button 
                  type="button"
                  onClick={() => toggleProvinceAll(prov.id, isEdit)}
                  className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${isAllSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-500 hover:border-blue-400'}`}
                >
                  {isAllSelected ? '取消全选' : '全选本省'}
                </button>
              </div>
              {isExpanded && (
                <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2 bg-white animate-in slide-in-from-top-1 duration-200">
                   {provCities.map(city => (
                     <label key={city.code} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${currentCodes.includes(city.code) ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={currentCodes.includes(city.code)} 
                          onChange={() => toggleCitySelection(city.code, isEdit)} 
                        />
                        {currentCodes.includes(city.code) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span className="text-xs font-medium">{city.name}</span>
                     </label>
                   ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const PermissionsSection = ({ isEdit }: { isEdit: boolean }) => {
      const perms = isEdit ? editFormData.permissions : formData.permissions;
      return (
          <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${perms.canPublish ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                  <input type="checkbox" className="hidden" checked={perms.canPublish} onChange={(e) => updatePermissions('canPublish', e.target.checked, isEdit)} />
                  <div className={`p-2 rounded-lg ${perms.canPublish ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Edit className="w-4 h-4" />
                  </div>
                  <div>
                      <span className="block text-sm font-bold text-slate-800">允许发布订单</span>
                      <span className="block text-xs text-slate-400">合伙人可发布需求</span>
                  </div>
                  {perms.canPublish && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />}
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${perms.canGrab ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                  <input type="checkbox" className="hidden" checked={perms.canGrab} onChange={(e) => updatePermissions('canGrab', e.target.checked, isEdit)} />
                  <div className={`p-2 rounded-lg ${perms.canGrab ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                      <span className="block text-sm font-bold text-slate-800">允许抢单</span>
                      <span className="block text-xs text-slate-400">合伙人可参与抢单</span>
                  </div>
                  {perms.canGrab && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${perms.canViewCrossCity ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-100'}`}>
                  <input type="checkbox" className="hidden" checked={perms.canViewCrossCity} onChange={(e) => updatePermissions('canViewCrossCity', e.target.checked, isEdit)} />
                  <div className={`p-2 rounded-lg ${perms.canViewCrossCity ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Globe className="w-4 h-4" />
                  </div>
                  <div>
                      <span className="block text-sm font-bold text-slate-800">允许查看跨城</span>
                      <span className="block text-xs text-slate-400">可见其他授权城市</span>
                  </div>
                  {perms.canViewCrossCity && <CheckCircle className="w-4 h-4 text-purple-600 ml-auto" />}
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${perms.canCrossCity ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                  <input type="checkbox" className="hidden" checked={perms.canCrossCity} onChange={(e) => updatePermissions('canCrossCity', e.target.checked, isEdit)} />
                  <div className={`p-2 rounded-lg ${perms.canCrossCity ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                      <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                      <span className="block text-sm font-bold text-slate-800">允许跨城接单</span>
                      <span className="block text-xs text-slate-400">可接非本城订单</span>
                  </div>
                  {perms.canCrossCity && <CheckCircle className="w-4 h-4 text-orange-600 ml-auto" />}
              </label>
          </div>
      )
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">合伙人管理</h1>
          <p className="text-slate-500 text-sm">全国性合伙人分级管理与跨城授权中心</p>
        </div>
        <button onClick={handleOpenAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> 新增合伙人
        </button>
      </div>

      {/* Main Partner Table UI */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible min-h-[400px]">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">合伙人团队</th>
              <th className="px-6 py-4">省份/城市</th>
              <th className="px-6 py-4">授权区域</th>
              <th className="px-6 py-4 text-center">状态</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {partners.map(p => (
               <tr key={p.id} className="hover:bg-slate-50/50 group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                        {p.name}
                        {p.status === 'DISABLED' && <Ban className="w-3 h-3 text-red-500" />}
                    </div>
                    <div className="text-xs text-slate-400">{p.contactPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-bold border border-slate-200">
                        {mockService.getCityName(p.cityCode)}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1 max-w-xs">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold">本城</span>
                        {p.crossCityCodes?.slice(0, 3).map(c => (
                          <span key={c} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold">{mockService.getCityName(c)}</span>
                        ))}
                        {p.crossCityCodes.length > 3 && <span className="text-[10px] text-slate-400">+{p.crossCityCodes.length - 3} 更多...</span>}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {p.status === 'ACTIVE' ? '正常' : '已停用'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => handleToggleStatus(p)} 
                            className={`p-2 rounded-lg transition-colors ${p.status === 'ACTIVE' ? 'text-green-600 bg-green-50 hover:bg-red-50 hover:text-red-600' : 'text-slate-400 bg-slate-100 hover:bg-green-50 hover:text-green-600'}`}
                            title={p.status === 'ACTIVE' ? '点击停用账号' : '点击启用账号'}
                        >
                            {p.status === 'ACTIVE' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={() => handleOpenEditModal(p)} 
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="编辑资料与权限"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setDeleteTarget(p)} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除合伙人"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-slate-800">新增城市合伙人</h3>
                 <button onClick={() => setShowAddModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                 {/* Basic Inputs Section */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                       <label className="block text-sm font-bold text-slate-700 mb-2">公司/团队名称</label>
                       <input required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例如：四川至诚家居服务中心" />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">联系人姓名</label>
                       <input required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">登录手机号</label>
                       <input required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value, username: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">归属省份 / 城市 (本城)</label>
                       <div className="flex gap-2">
                           <select 
                              className="w-1/2 border-2 border-slate-100 rounded-xl px-3 py-3 focus:border-blue-500 outline-none transition-colors text-sm font-medium"
                              value={addProvinceId}
                              onChange={e => {
                                  setAddProvinceId(e.target.value);
                                  setFormData({...formData, cityCode: ''}); 
                              }}
                           >
                              <option value="">选择省份</option>
                              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                           <select 
                              required
                              className="w-1/2 border-2 border-slate-100 rounded-xl px-3 py-3 focus:border-blue-500 outline-none transition-colors text-sm font-medium"
                              value={formData.cityCode}
                              onChange={e => setFormData({...formData, cityCode: e.target.value})}
                              disabled={!addProvinceId}
                           >
                              <option value="">{addProvinceId ? '选择城市' : '请先选省份'}</option>
                              {cities.filter(c => c.groupId === addProvinceId).map(c => (
                                  <option key={c.code} value={c.code}>{c.name}</option>
                              ))}
                           </select>
                       </div>
                    </div>
                 </div>

                 {/* Permissions Section */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> 权限配置</label>
                    <PermissionsSection isEdit={false} />
                 </div>

                 {/* Skills Section */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-blue-500" /> 专业领域授权</label>
                    <div className="flex flex-wrap gap-2">
                       {publishTitles.map(t => (
                         <label key={t.id} className={`px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${formData.businessTypes.includes(t.name) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600'}`}>
                            <input type="checkbox" className="hidden" checked={formData.businessTypes.includes(t.name)} onChange={() => {
                              const types = formData.businessTypes.includes(t.name) ? formData.businessTypes.filter(x => x !== t.name) : [...formData.businessTypes, t.name];
                              setFormData({...formData, businessTypes: types});
                            }} />
                            <span className="text-xs font-bold">{t.name}</span>
                         </label>
                       ))}
                    </div>
                 </div>

                 {/* Cross-City Section */}
                 <div>
                    <div className="flex items-center justify-between mb-4">
                       <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-500" /> 跨城抢单手动授权 (全国范围)</label>
                       <span className="text-xs text-slate-400">已选 {formData.crossCityCodes.length} 个城市</span>
                    </div>
                    <ProvinceCityTree isEdit={false} />
                 </div>
              </form>
              <div className="p-6 border-t bg-slate-50 flex gap-4">
                 <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600">取消</button>
                 <button onClick={handleAddSubmit} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">完成创建</button>
              </div>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPartner && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-slate-800">编辑合伙人：{editingPartner.name}</h3>
                 <button onClick={() => setEditingPartner(null)}><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                       <label className="block text-sm font-bold text-slate-700 mb-2">公司名称</label>
                       <input required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">联系手机 (只读)</label>
                       <input disabled className="w-full border-2 border-slate-50 bg-slate-50 text-slate-400 rounded-xl px-4 py-3" value={editFormData.phone} />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">归属省份 / 城市 (本城)</label>
                       <div className="flex gap-2">
                           <select 
                              className="w-1/2 border-2 border-slate-100 rounded-xl px-3 py-3 focus:border-blue-500 outline-none transition-colors text-sm font-medium"
                              value={editProvinceId}
                              onChange={e => {
                                  setEditProvinceId(e.target.value);
                                  setEditFormData({...editFormData, cityCode: ''}); 
                              }}
                           >
                              <option value="">选择省份</option>
                              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                           <select 
                              required
                              className="w-1/2 border-2 border-slate-100 rounded-xl px-3 py-3 focus:border-blue-500 outline-none transition-colors text-sm font-medium"
                              value={editFormData.cityCode}
                              onChange={e => setEditFormData({...editFormData, cityCode: e.target.value})}
                              disabled={!editProvinceId}
                           >
                              <option value="">{editProvinceId ? '选择城市' : '请先选省份'}</option>
                              {cities.filter(c => c.groupId === editProvinceId).map(c => (
                                  <option key={c.code} value={c.code}>{c.name}</option>
                              ))}
                           </select>
                       </div>
                    </div>
                 </div>

                 {/* Permissions Section */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> 权限配置</label>
                    <PermissionsSection isEdit={true} />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-4">技能领域</label>
                    <div className="flex flex-wrap gap-2">
                       {publishTitles.map(t => (
                         <label key={t.id} className={`px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${editFormData.businessTypes.includes(t.name) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600'}`}>
                            <input type="checkbox" className="hidden" checked={editFormData.businessTypes.includes(t.name)} onChange={() => {
                              const types = editFormData.businessTypes.includes(t.name) ? editFormData.businessTypes.filter(x => x !== t.name) : [...editFormData.businessTypes, t.name];
                              setEditFormData({...editFormData, businessTypes: types});
                            }} />
                            <span className="text-xs font-bold">{t.name}</span>
                         </label>
                       ))}
                    </div>
                 </div>

                 <div>
                    <div className="flex items-center justify-between mb-4">
                       <label className="text-sm font-bold text-slate-700">全国跨城抢单权限配置</label>
                       <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">已授权 {editFormData.crossCityCodes.length} 城</span>
                    </div>
                    <ProvinceCityTree isEdit={true} />
                 </div>
              </form>
              <div className="p-6 border-t bg-slate-50 flex gap-4">
                 <button type="button" onClick={() => setEditingPartner(null)} className="flex-1 py-3 border border-slate-300 rounded-xl font-bold">取消</button>
                 <button onClick={handleEditSubmit} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">保存修改</button>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">确认删除合伙人?</h3>
              <p className="text-slate-600 text-sm mb-6">
                 您即将删除 <strong>{deleteTarget.name}</strong>。<br/>
                 此操作不可恢复，该账号下的所有数据（订单、资金流水）可能丢失引用。
              </p>
              <div className="flex gap-4">
                 <button 
                   onClick={() => setDeleteTarget(null)}
                   className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleDeletePartner}
                   className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg"
                 >
                   确认删除
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
