
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { CommissionRule } from '../types';
import { Plus, Trash2, Power, AlertCircle, Percent, DollarSign, X, Edit, AlertTriangle } from 'lucide-react';

export const CommissionRules: React.FC = () => {
  const [rules, setRules] = useState<CommissionRule[]>(mockService.getRules());
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // State for Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const cities = mockService.getCities();
  const orderTypes = mockService.getOrderTypes().filter(t => t.isActive);
  const publishTitles = mockService.getPublishTitles().filter(t => t.isActive); // Professional Skills

  const [formData, setFormData] = useState({
    cityCode: 'ALL',
    orderType: 'ALL',
    category: 'ALL',
    ruleType: 'PERCENTAGE',
    ruleValue: 10,
  });

  const refresh = () => setRules([...mockService.getRules()]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      cityCode: 'ALL',
      orderType: 'ALL',
      category: 'ALL',
      ruleType: 'PERCENTAGE',
      ruleValue: 10,
    });
    setShowModal(true);
  };

  const openEditModal = (rule: CommissionRule) => {
    setEditingId(rule.id);
    setFormData({
      cityCode: rule.cityCode,
      orderType: rule.orderType,
      category: rule.category || 'ALL', // Handle legacy data
      // @ts-ignore
      ruleType: rule.ruleType,
      ruleValue: rule.ruleValue,
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      mockService.updateRule(editingId, formData);
    } else {
      // @ts-ignore
      mockService.addRule(formData);
    }
    setShowModal(false);
    refresh();
  };

  const initiateDelete = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      mockService.deleteRule(deleteTargetId);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      refresh();
    }
  };

  const handleToggle = (id: string) => {
    mockService.toggleRule(id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">抽成规则配置</h1>
          <p className="text-slate-500 text-sm">设置平台在不同业务场景与技能领域下的自动抽成策略</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建规则
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3 text-sm text-blue-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">规则匹配优先级说明：</p>
          <p>
            系统在计算订单抽成时，将按照以下顺序寻找匹配规则（越靠前优先级越高）：<br/>
            1. <strong>特定城市</strong> + <strong>特定业务类型</strong> + <strong>特定专业技能</strong><br/>
            2. <strong>特定城市</strong> + <strong>特定业务类型</strong><br/>
            3. <strong>特定城市</strong><br/>
            4. <strong>通用规则</strong> (所有城市、所有类型、所有技能)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">适用城市</th>
              <th className="px-6 py-4">业务类型</th>
              <th className="px-6 py-4">专业技能领域</th>
              <th className="px-6 py-4">抽成方式</th>
              <th className="px-6 py-4">数值</th>
              <th className="px-6 py-4 text-center">状态</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {rules.map(rule => (
              <tr key={rule.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  {rule.cityCode === 'ALL' ? <span className="text-slate-400">所有城市</span> : (
                    <span className="font-medium text-slate-700">{mockService.getCityName(rule.cityCode)}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {rule.orderType === 'ALL' ? <span className="text-slate-400">所有类型</span> : rule.orderType}
                </td>
                <td className="px-6 py-4">
                  {rule.category === 'ALL' || !rule.category ? 
                    <span className="text-slate-400">全领域技能</span> : 
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">{rule.category}</span>
                  }
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    rule.ruleType === 'PERCENTAGE' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {rule.ruleType === 'PERCENTAGE' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                    {rule.ruleType === 'PERCENTAGE' ? '比例抽成' : '固定金额'}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-800">
                  {rule.ruleType === 'PERCENTAGE' ? `${rule.ruleValue}%` : `¥${rule.ruleValue}`}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => handleToggle(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rule.isActive ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rule.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(rule)}
                      className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                      title="编辑规则"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => initiateDelete(rule.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                      title="删除规则"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">暂无配置规则</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">
                 {editingId ? '编辑抽成规则' : '新建抽成规则'}
               </h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="space-y-5">
              {/* Scope Configuration */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">适用范围条件</h4>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">适用城市</label>
                     <select 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                        value={formData.cityCode}
                        onChange={e => setFormData({...formData, cityCode: e.target.value})}
                     >
                       <option value="ALL">所有城市 (通用)</option>
                       {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                     </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">业务类型</label>
                       <select 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                          value={formData.orderType}
                          onChange={e => setFormData({...formData, orderType: e.target.value})}
                       >
                         <option value="ALL">所有类型</option>
                         {orderTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">专业技能领域</label>
                       <select 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                       >
                         <option value="ALL">所有技能领域</option>
                         {publishTitles.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                       </select>
                    </div>
                  </div>
              </div>

              {/* Value Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">抽成模式</label>
                   <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      value={formData.ruleType}
                      // @ts-ignore
                      onChange={e => setFormData({...formData, ruleType: e.target.value})}
                   >
                     <option value="PERCENTAGE">比例抽成 (%)</option>
                     <option value="FIXED">固定金额 (¥)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">
                      {formData.ruleType === 'PERCENTAGE' ? '百分比数值' : '固定金额'}
                   </label>
                   <div className="relative">
                      <input 
                          type="number"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-8"
                          value={formData.ruleValue}
                          onChange={e => setFormData({...formData, ruleValue: Number(e.target.value)})}
                          placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          {formData.ruleType === 'PERCENTAGE' ? '%' : '¥'}
                      </span>
                   </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  取消
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold"
                >
                  {editingId ? '保存修改' : '确认新建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">确认删除规则?</h3>
            <p className="text-slate-500 text-sm mb-6">
              此操作不可撤销。删除后，新的订单将不再应用此计算规则。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
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
    </div>
  );
};
