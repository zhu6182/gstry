import React, { useState, useEffect, useRef } from 'react';
import { mockService } from '../services/mockService';
import { Partner, UserRole, User } from '../types';
import { MoreHorizontal, MapPin, Search, Plus, Trash2, Power, X, AlertTriangle, CheckCircle, RotateCcw, Edit, User as UserIcon, Phone } from 'lucide-react';

interface PartnerManagementProps {
  user: User;
}

export const PartnerManagement: React.FC<PartnerManagementProps> = ({ user }) => {
  const [partners, setPartners] = useState(mockService.getPartners());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // State for Delete Confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // State for Status Change Confirmation (Enable/Disable)
  const [statusChangeTarget, setStatusChangeTarget] = useState<{id: string, currentStatus: 'ACTIVE' | 'DISABLED', name: string} | null>(null);

  // State for Password Reset
  const [resetTarget, setResetTarget] = useState<{id: string, userId: string, name: string} | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // State for Edit Partner
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    cityCode: ''
  });

  // State for Dropdown Menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // State for Adding Partner
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    cityCode: 'SH',
    username: ''
  });

  const cities = mockService.getCities();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshList = () => {
    setPartners(mockService.getPartners());
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    
    mockService.addPartner({
      name: formData.name,
      contactName: formData.contactName,
      contactPhone: formData.phone,
      cityCode: formData.cityCode,
      username: formData.phone // Phone is explicitly used as username
    });
    
    setShowAddModal(false);
    setFormData({ name: '', contactName: '', phone: '', cityCode: 'SH', username: '' });
    refreshList();
  };

  const initiateDelete = (id: string) => {
    setDeleteTargetId(id);
    setOpenMenuId(null);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      mockService.deletePartner(deleteTargetId);
      refreshList();
      setDeleteTargetId(null);
    }
  };

  const initiateStatusChange = (id: string, currentStatus: 'ACTIVE' | 'DISABLED', name: string) => {
    setStatusChangeTarget({ id, currentStatus, name });
    setOpenMenuId(null);
  };

  const confirmStatusChange = () => {
    if (statusChangeTarget) {
      const newStatus = statusChangeTarget.currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      mockService.updatePartnerStatus(statusChangeTarget.id, newStatus);
      refreshList();
      setStatusChangeTarget(null);
    }
  };

  const initiateResetPassword = (partner: Partner) => {
    setResetTarget({ id: partner.id, userId: partner.userId, name: partner.name });
    setNewPassword('');
    setOpenMenuId(null);
  };

  const confirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetTarget && newPassword) {
      // Hardcoded admin ID for mock
      mockService.adminResetPassword('u1', resetTarget.userId, newPassword);
      alert(`已重置合伙人 ${resetTarget.name} 的登录密码`);
      setResetTarget(null);
      setNewPassword('');
    }
  };

  const initiateEdit = (partner: Partner) => {
    const user = mockService.getUserById(partner.userId);
    setEditingPartner(partner);
    setEditFormData({
      name: partner.name,
      contactName: user?.realName || '',
      phone: partner.contactPhone,
      cityCode: partner.cityCode
    });
    setOpenMenuId(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      mockService.updatePartner(editingPartner.id, editFormData);
      setEditingPartner(null);
      refreshList();
    }
  };

  const togglePermission = (id: string, key: keyof Partner['permissions']) => {
    const updated = partners.map(p => {
      if (p.id === id) {
        // @ts-ignore
        const newVal = !p.permissions[key];
        const newPermissions = { ...p.permissions, [key]: newVal };
        mockService.updatePartnerPermissions(id, newPermissions);
        return { ...p, permissions: newPermissions };
      }
      return p;
    });
    setPartners(updated);
  };

  // --- Filtering Logic for Permissions ---
  const isOperations = user?.role === UserRole.OPERATIONS;
  const managedCities = user?.managedCityCodes || [];
  const canAdd = user?.role === UserRole.ADMIN || (isOperations && user?.canAddPartner);

  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.cityCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Permission Filter: If Ops, must be in managed cities
    let matchesScope = true;
    if (isOperations && managedCities.length > 0) {
        matchesScope = managedCities.includes(p.cityCode);
    }
    
    return matchesSearch && matchesScope;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">合伙人管理</h1>
          <p className="text-slate-500 text-sm">
            {isOperations ? `管理您负责区域的合伙人 (${managedCities.map(c => mockService.getCityName(c)).join(', ') || '全部'})` : '管理权限、实名认证及账号状态'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="搜索合伙人..." 
               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          {canAdd && (
            <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
                <Plus className="w-4 h-4" />
                新增合伙人
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">公司 / 团队</th>
              <th className="px-6 py-4 font-semibold">联系人 (登录账号)</th>
              <th className="px-6 py-4 font-semibold">状态</th>
              <th className="px-6 py-4 font-semibold">所在地</th>
              <th className="px-6 py-4 font-semibold">可用余额</th>
              <th className="px-6 py-4 font-semibold text-center">权限配置</th>
              <th className="px-6 py-4 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPartners.map((partner) => {
              const user = mockService.getUserById(partner.userId);
              return (
                <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                        {partner.name.substring(0, 2)}
                      </div>
                      <p className="font-medium text-slate-900">{partner.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-slate-900 font-medium text-sm">
                         <UserIcon className="w-3 h-3 text-slate-400" />
                         {user?.realName || '未知'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                         <Phone className="w-3 h-3 text-slate-400" />
                         {partner.contactPhone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {partner.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        正常
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        已停用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {mockService.getCityName(partner.cityCode)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="font-mono text-slate-700">¥{mockService.getWallet(partner.id).balance.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <PermissionToggle 
                        active={partner.permissions.canPublish} 
                        onClick={() => togglePermission(partner.id, 'canPublish')}
                        label="发布权限"
                      />
                      <PermissionToggle 
                        active={partner.permissions.canGrab} 
                        onClick={() => togglePermission(partner.id, 'canGrab')}
                        label="接单权限"
                      />
                       <PermissionToggle 
                        active={partner.permissions.canCrossCity} 
                        onClick={() => togglePermission(partner.id, 'canCrossCity')}
                        label="跨城权限"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === partner.id ? null : partner.id)}
                      className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === partner.id && (
                      <div ref={menuRef} className="absolute right-8 top-8 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-10 overflow-hidden">
                        <button 
                          onClick={() => initiateEdit(partner)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                           <Edit className="w-3 h-3" />
                           编辑信息
                        </button>
                        <button 
                          onClick={() => initiateStatusChange(partner.id, partner.status, partner.name)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                           <Power className="w-3 h-3" />
                           {partner.status === 'ACTIVE' ? '停用账号' : '启用账号'}
                        </button>
                        <button 
                          onClick={() => initiateResetPassword(partner)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                           <RotateCcw className="w-3 h-3" />
                           重置密码
                        </button>
                        <button 
                          onClick={() => initiateDelete(partner.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                           <Trash2 className="w-3 h-3" />
                           删除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredPartners.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    {isOperations && managedCities.length > 0 
                        ? '您管理的城市暂无合伙人' 
                        : '暂无符合条件的合伙人'}
                </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">新增城市合伙人</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">合伙人/公司名称</label>
                 <input 
                   required
                   className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   placeholder="例如：上海云创科技"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">所属城市</label>
                   <select 
                     className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                     value={formData.cityCode}
                     onChange={e => setFormData({...formData, cityCode: e.target.value})}
                   >
                     {cities
                        .filter(c => !isOperations || managedCities.length === 0 || managedCities.includes(c.code))
                        .map(c => (
                       <option key={c.code} value={c.code}>{c.name}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">联系人姓名</label>
                    <input 
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.contactName}
                      onChange={e => setFormData({...formData, contactName: e.target.value})}
                      placeholder="真实姓名"
                    />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">手机号 (登录账号)</label>
                 <input 
                   required
                   className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                   value={formData.phone}
                   onChange={e => setFormData({...formData, phone: e.target.value, username: e.target.value})}
                   placeholder="13800000000"
                 />
                 <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded mt-2">
                    <p>• 该手机号将作为唯一登录账号</p>
                    <p>• 系统初始密码统一为 <strong>123</strong></p>
                 </div>
               </div>

               <div className="pt-2">
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors">
                   确认创建
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {editingPartner && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">编辑合伙人信息</h3>
              <button onClick={() => setEditingPartner(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">合伙人/公司名称</label>
                 <input 
                   required
                   className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                   value={editFormData.name}
                   onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">所属城市</label>
                   <select 
                     className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                     value={editFormData.cityCode}
                     onChange={e => setEditFormData({...editFormData, cityCode: e.target.value})}
                     disabled={isOperations} // Operations shouldn't arbitrarily move partners to cities they don't manage
                   >
                     {cities
                        .filter(c => !isOperations || managedCities.length === 0 || managedCities.includes(c.code))
                        .map(c => (
                       <option key={c.code} value={c.code}>{c.name}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">联系人姓名</label>
                    <input 
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.contactName}
                      onChange={e => setEditFormData({...editFormData, contactName: e.target.value})}
                    />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">手机号 (登录账号)</label>
                 <input 
                   required
                   className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                   value={editFormData.phone}
                   onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                 />
                 <p className="text-xs text-slate-500 mt-1">
                   注意：修改手机号将同步更改该用户的登录账号。
                 </p>
               </div>

               <div className="pt-2">
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors">
                   保存修改
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">确认删除?</h3>
            <p className="text-slate-500 text-sm mb-6">
              此操作将永久删除该合伙人账号、关联的钱包及权限配置，且无法恢复。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Confirmation Modal */}
      {statusChangeTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              statusChangeTarget.currentStatus === 'ACTIVE' ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              {statusChangeTarget.currentStatus === 'ACTIVE' ? (
                <Power className="w-6 h-6 text-orange-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {statusChangeTarget.currentStatus === 'ACTIVE' ? '确认停用账号?' : '确认启用账号?'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {statusChangeTarget.currentStatus === 'ACTIVE' 
                ? `您确定要停用 ${statusChangeTarget.name} 吗？停用后该账号将无法登录。` 
                : `您确定要恢复 ${statusChangeTarget.name} 的登录权限吗？`}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setStatusChangeTarget(null)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmStatusChange}
                className={`flex-1 py-2 rounded-lg text-white font-medium transition-colors shadow-lg ${
                   statusChangeTarget.currentStatus === 'ACTIVE' 
                   ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' 
                   : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                }`}
              >
                {statusChangeTarget.currentStatus === 'ACTIVE' ? '确认停用' : '确认启用'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">重置合伙人密码</h3>
              <p className="text-sm text-slate-500 mb-4">
                正在为合伙人 <strong>{resetTarget.name}</strong> 重置密码。
              </p>
              <form onSubmit={confirmResetPassword} className="space-y-4">
                 <div>
                    <label className="block text-sm text-slate-600 mb-1">新密码</label>
                    <input 
                      type="text"
                      required
                      placeholder="请输入新密码"
                      className="w-full border rounded-lg px-3 py-2"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setResetTarget(null)}
                      className="flex-1 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      取消
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                    >
                      确认重置
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const PermissionToggle = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onClick}>
    <div
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        active ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
          active ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </div>
    <span className="text-[10px] text-slate-500 font-medium">{label}</span>
  </div>
);