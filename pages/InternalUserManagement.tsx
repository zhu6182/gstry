import React, { useState } from 'react';
import { mockService } from '../services/mockService';
import { User, UserRole } from '../types';
import { Search, Plus, Trash2, Shield, User as UserIcon, Settings as SettingsIcon, AlertTriangle, X, RotateCcw, CheckSquare, Square, Send } from 'lucide-react';

export const InternalUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockService.getInternalUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState<User | null>(null);
  
  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Reset Password State
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const cities = mockService.getCities();
  
  // State for adding user
  const [newUser, setNewUser] = useState({
    username: '',
    realName: '',
    role: UserRole.OPERATIONS as UserRole,
    canAddPartner: false
  });

  // State for scope editing
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [scopeCanAddPartner, setScopeCanAddPartner] = useState(false);

  const refresh = () => setUsers([...mockService.getInternalUsers()]);

  const handleDeleteClick = (user: User) => {
    setDeleteTarget(user);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      mockService.deleteInternalUser(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    }
  };

  const handleResetClick = (user: User) => {
    setResetTarget(user);
    setNewPassword('');
  };

  const confirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetTarget && newPassword) {
      // Hardcoded admin ID for mock
      mockService.adminResetPassword('u1', resetTarget.id, newPassword);
      alert(`已将 ${resetTarget.realName} 的密码重置成功`);
      setResetTarget(null);
      setNewPassword('');
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.realName) return;
    
    mockService.addInternalUser(newUser);
    setShowAddModal(false);
    setNewUser({ username: '', realName: '', role: UserRole.OPERATIONS, canAddPartner: false });
    refresh();
  };

  const openScopeModal = (user: User) => {
    setSelectedScopes(user.managedCityCodes || []);
    setScopeCanAddPartner(!!user.canAddPartner);
    setShowScopeModal(user);
  };

  const saveScope = () => {
    if (showScopeModal) {
      mockService.updateInternalUserRights(showScopeModal.id, selectedScopes, scopeCanAddPartner);
      setShowScopeModal(null);
      refresh();
    }
  };

  const toggleCityScope = (code: string) => {
    if (selectedScopes.includes(code)) {
      setSelectedScopes(selectedScopes.filter(c => c !== code));
    } else {
      setSelectedScopes([...selectedScopes, code]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">内部人员管理</h1>
          <p className="text-slate-500 text-sm">管理平台管理员、运营、财务及发单人员账号</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增内部账号
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">人员信息</th>
              <th className="px-6 py-4">角色</th>
              <th className="px-6 py-4">权限配置</th>
              <th className="px-6 py-4">状态</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                    <div>
                      <p className="font-medium text-slate-900">{user.realName}</p>
                      <p className="text-xs text-slate-500">{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                    user.role === UserRole.FINANCE ? 'bg-green-100 text-green-800' :
                    user.role === UserRole.DISPATCHER ? 'bg-orange-100 text-orange-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === UserRole.ADMIN && <Shield className="w-3 h-3" />}
                    {user.role === UserRole.FINANCE && <span className="font-serif">¥</span>}
                    {user.role === UserRole.OPERATIONS && <UserIcon className="w-3 h-3" />}
                    {user.role === UserRole.DISPATCHER && <Send className="w-3 h-3" />}
                    
                    {user.role === UserRole.ADMIN ? '超级管理员' : 
                     user.role === UserRole.FINANCE ? '财务' : 
                     user.role === UserRole.DISPATCHER ? '发单员' : '运营人员'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.role === UserRole.OPERATIONS ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap gap-1">
                        {(!user.managedCityCodes || user.managedCityCodes.length === 0) ? (
                          <span className="text-slate-400 italic text-xs">未分配城市 (可见全部)</span>
                        ) : (
                          user.managedCityCodes.map(code => (
                            <span key={code} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200">
                              {mockService.getCityName(code)}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                         {user.canAddPartner ? (
                           <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1">
                             <CheckSquare className="w-3 h-3" /> 可新增合伙人
                           </span>
                         ) : (
                           <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                             <X className="w-3 h-3" /> 禁止新增合伙人
                           </span>
                         )}
                      </div>
                    </div>
                  ) : user.role === UserRole.DISPATCHER ? (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">平台发单权限</span>
                  ) : (
                    <span className="text-slate-400 text-xs">全局权限</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded">正常</span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {user.role === UserRole.OPERATIONS && (
                    <button 
                      onClick={() => openScopeModal(user)}
                      className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                      title="配置权限"
                    >
                      <SettingsIcon className="w-4 h-4" />
                    </button>
                  )}
                  {user.role !== UserRole.ADMIN && (
                    <>
                      <button 
                        onClick={() => handleResetClick(user)}
                        className="p-2 text-slate-400 hover:text-orange-600 rounded-full hover:bg-orange-50 transition-colors"
                        title="重置密码"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                        title="删除账号"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">添加内部人员</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">账号 (登录名)</label>
                <input 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                  placeholder="例如：dispatch_001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">真实姓名</label>
                <input 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={newUser.realName}
                  onChange={e => setNewUser({...newUser, realName: e.target.value})}
                  placeholder="例如：张发单"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">角色权限</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <input 
                      type="radio" 
                      name="role" 
                      checked={newUser.role === UserRole.OPERATIONS}
                      onChange={() => setNewUser({...newUser, role: UserRole.OPERATIONS})}
                      className="text-blue-600 w-4 h-4"
                    />
                    <div>
                        <span className="block text-sm font-bold text-slate-800">运营人员</span>
                        <span className="block text-xs text-slate-500">管理合伙人/查看订单</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <input 
                      type="radio" 
                      name="role" 
                      checked={newUser.role === UserRole.DISPATCHER}
                      onChange={() => setNewUser({...newUser, role: UserRole.DISPATCHER})}
                      className="text-blue-600 w-4 h-4"
                    />
                    <div>
                        <span className="block text-sm font-bold text-slate-800">发单专员</span>
                        <span className="block text-xs text-slate-500">仅用于发布/管理订单</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <input 
                      type="radio" 
                      name="role" 
                      checked={newUser.role === UserRole.FINANCE}
                      onChange={() => setNewUser({...newUser, role: UserRole.FINANCE})}
                      className="text-blue-600 w-4 h-4"
                    />
                     <div>
                        <span className="block text-sm font-bold text-slate-800">财务人员</span>
                        <span className="block text-xs text-slate-500">资金审核/打款</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <input 
                      type="radio" 
                      name="role" 
                      checked={newUser.role === UserRole.ADMIN}
                      onChange={() => setNewUser({...newUser, role: UserRole.ADMIN})}
                      className="text-blue-600 w-4 h-4"
                    />
                    <div>
                        <span className="block text-sm font-bold text-slate-800">管理员</span>
                        <span className="block text-xs text-slate-500">系统最高权限</span>
                    </div>
                  </label>
                </div>
              </div>

              {newUser.role === UserRole.OPERATIONS && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newUser.canAddPartner}
                        onChange={(e) => setNewUser({...newUser, canAddPartner: e.target.checked})}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">允许该运营新增合伙人账号</span>
                   </label>
                   <p className="text-xs text-slate-400 mt-1 pl-6">
                     开启后，该运营可以在其负责的城市范围内创建新合伙人。
                   </p>
                </div>
              )}

              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded">
                <p>• 初始密码将统一默认为 <strong>123</strong></p>
                <p>• 请通知员工登录后尽快修改密码</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scope Management Modal */}
      {showScopeModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">分配数据权限 - {showScopeModal.realName}</h3>
               <button onClick={() => setShowScopeModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-sm text-slate-700 mb-2">1. 功能权限</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={scopeCanAddPartner}
                        onChange={(e) => setScopeCanAddPartner(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-800">允许新增合伙人</span>
                   </label>
                   <p className="text-xs text-slate-500 mt-1 pl-6">
                     如关闭，该运营人员将无法看到“新增合伙人”按钮。
                   </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-700 mb-2">2. 城市管理范围</h4>
                <p className="text-xs text-slate-500 mb-3">请勾选该运营人员负责的城市。未勾选则代表无权管理该城市合伙人及订单。</p>
                <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 border rounded-lg">
                   {cities.map(city => (
                     <label key={city.code} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                       selectedScopes.includes(city.code) 
                         ? 'bg-blue-50 border-blue-200 text-blue-800' 
                         : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                     }`}>
                       <input 
                         type="checkbox"
                         checked={selectedScopes.includes(city.code)}
                         onChange={() => toggleCityScope(city.code)}
                         className="rounded text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm font-medium">{city.name}</span>
                     </label>
                   ))}
                </div>
                <div className="mt-2 text-right">
                   <button 
                      onClick={() => setSelectedScopes([])}
                      className="text-xs text-red-600 hover:text-red-700 font-medium px-2"
                   >
                     清空城市选择
                   </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
               <button 
                  onClick={() => setShowScopeModal(null)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
               >
                  取消
               </button>
               <button 
                  onClick={saveScope}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
               >
                  保存权限设置
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">确认删除该账号?</h3>
            <p className="text-slate-500 text-sm mb-6">
              您将删除 <strong>{deleteTarget.realName}</strong> 的内部账号。此操作不可恢复，请谨慎操作。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-100"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">重置密码</h3>
              <p className="text-sm text-slate-500 mb-4">
                正在为 <strong>{resetTarget.realName}</strong> 重置密码。
              </p>
              <form onSubmit={confirmReset} className="space-y-4">
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