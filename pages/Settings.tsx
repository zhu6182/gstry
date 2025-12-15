import React, { useState } from 'react';
import { mockService } from '../services/mockService';
import { City, CityGroup, OrderType, PublishTitle, User, UserRole } from '../types';
import { MapPin, Briefcase, Plus, Power, Trash2, FolderPlus, Layers, Edit, AlertTriangle, FileType, ShieldAlert, RefreshCw } from 'lucide-react';

type DeleteType = 'CITY' | 'GROUP' | 'TYPE' | 'TITLE';

interface SettingsProps {
  user?: User; // Make user optional to be backward compatible if needed, but App.tsx passes it now
}

export const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'city' | 'type' | 'title' | 'system'>('city');
  
  // City & Group State
  const [cities, setCities] = useState<City[]>(mockService.getCities());
  const [groups, setGroups] = useState<CityGroup[]>(mockService.getCityGroups());
  const [newCityName, setNewCityName] = useState('');
  const [newCityCode, setNewCityCode] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showCityModal, setShowCityModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  // Type State
  const [orderTypes, setOrderTypes] = useState<OrderType[]>(mockService.getOrderTypes());
  const [newTypeName, setNewTypeName] = useState('');

  // Title State
  const [publishTitles, setPublishTitles] = useState<PublishTitle[]>(mockService.getPublishTitles());
  const [newTitleName, setNewTitleName] = useState('');

  // Delete Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: DeleteType, id: string, name: string } | null>(null);

  // System Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInput, setResetInput] = useState('');

  const isAdmin = user?.role === UserRole.ADMIN;

  const refresh = () => {
    setCities([...mockService.getCities()]);
    setGroups([...mockService.getCityGroups()]);
    setOrderTypes([...mockService.getOrderTypes()]);
    setPublishTitles([...mockService.getPublishTitles()]);
  };

  // --- City Logic ---
  const toggleCity = (code: string, currentStatus: string) => {
    mockService.updateCityStatus(code, currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE');
    refresh();
  };

  const handleAddGroup = () => {
    if (!newGroupName) return;
    mockService.addCityGroup(newGroupName);
    setNewGroupName('');
    refresh();
  };

  const handleDeleteGroupClick = (id: string, name: string) => {
    setDeleteConfirm({ type: 'GROUP', id, name });
  };

  const openAddCityModal = () => {
    setEditingCity(null);
    setNewCityName('');
    setNewCityCode('');
    setSelectedGroupId('');
    setShowCityModal(true);
  };

  const openEditCityModal = (city: City) => {
    setEditingCity(city);
    setNewCityName(city.name);
    setNewCityCode(city.code);
    setSelectedGroupId(city.groupId || '');
    setShowCityModal(true);
  };

  const handleSaveCity = () => {
    if (!newCityName || !newCityCode) return;

    if (editingCity) {
      mockService.updateCity(editingCity.code, {
        name: newCityName,
        groupId: selectedGroupId || undefined
      });
    } else {
      mockService.addCity({
        code: newCityCode.toUpperCase(),
        name: newCityName,
        groupId: selectedGroupId || undefined,
        status: 'ACTIVE'
      });
    }

    setShowCityModal(false);
    refresh();
  };

  const handleDeleteCityClick = (code: string, name: string) => {
    setDeleteConfirm({ type: 'CITY', id: code, name });
  };

  // --- Type Logic ---
  const toggleType = (id: string) => {
    mockService.toggleOrderType(id);
    refresh();
  };

  const addType = () => {
    if (!newTypeName) return;
    mockService.addOrderType(newTypeName);
    setNewTypeName('');
    refresh();
  };

  const handleDeleteTypeClick = (id: string, name: string) => {
    setDeleteConfirm({ type: 'TYPE', id, name });
  };

  // --- Title Logic ---
  const toggleTitle = (id: string) => {
    mockService.togglePublishTitle(id);
    refresh();
  };

  const addTitle = () => {
    if (!newTitleName) return;
    mockService.addPublishTitle(newTitleName);
    setNewTitleName('');
    refresh();
  };

  const handleDeleteTitleClick = (id: string, name: string) => {
    setDeleteConfirm({ type: 'TITLE', id, name });
  };

  // --- Unified Delete Execution ---
  const executeDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'CITY') {
      mockService.deleteCity(deleteConfirm.id);
    } else if (deleteConfirm.type === 'GROUP') {
      mockService.deleteCityGroup(deleteConfirm.id);
    } else if (deleteConfirm.type === 'TYPE') {
      mockService.deleteOrderType(deleteConfirm.id);
    } else if (deleteConfirm.type === 'TITLE') {
      mockService.deletePublishTitle(deleteConfirm.id);
    }
    setDeleteConfirm(null);
    refresh();
  };

  // --- System Reset Logic ---
  const handleSystemReset = () => {
    if (resetInput === '我确认删除') {
      mockService.resetSystemData();
      alert('系统数据已成功清空重置。');
      setShowResetModal(false);
      setResetInput('');
      refresh();
    }
  };

  // Group cities for display
  const groupedCities = groups.map(group => ({
    group,
    cities: cities.filter(c => c.groupId === group.id)
  }));
  const ungroupedCities = cities.filter(c => !c.groupId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">系统设置</h1>
          <p className="text-slate-500 text-sm">管理开放城市、区域划分及业务类型配置</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white px-6 rounded-t-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('city')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'city' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          <MapPin className="w-4 h-4" /> 城市与区域
        </button>
        <button
          onClick={() => setActiveTab('type')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'type' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          <Briefcase className="w-4 h-4" /> 业务类型
        </button>
        <button
          onClick={() => setActiveTab('title')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'title' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          <FileType className="w-4 h-4" /> 发布标题
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('system')}
            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'system' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-red-500'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> 系统维护
          </button>
        )}
      </div>

      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 border-t-0 p-6 min-h-[400px]">
        {activeTab === 'city' && (
          <div className="space-y-8">
            {/* Group Management Bar */}
            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4 border border-slate-100">
               <div className="flex items-center gap-2 flex-1">
                 <FolderPlus className="w-5 h-5 text-slate-400" />
                 <input 
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-48"
                    placeholder="新区域名称 (如: 华东)"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                 />
                 <button onClick={handleAddGroup} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">
                   添加分组
                 </button>
               </div>
               <button 
                 onClick={openAddCityModal} 
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
               >
                 <Plus className="w-4 h-4" /> 新增城市
               </button>
            </div>

            {/* Ungrouped Cities */}
            {ungroupedCities.length > 0 && (
              <div className="space-y-3">
                 <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider flex items-center gap-2">
                   <Layers className="w-4 h-4" /> 未分组城市
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ungroupedCities.map(city => (
                      <CityCard 
                        key={city.code} 
                        city={city} 
                        onToggle={() => toggleCity(city.code, city.status)} 
                        onDelete={() => handleDeleteCityClick(city.code, city.name)}
                        onEdit={() => openEditCityModal(city)}
                      />
                    ))}
                 </div>
              </div>
            )}

            {/* Grouped Cities */}
            {groupedCities.map(({ group, cities }) => (
              <div key={group.id} className="space-y-3">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-blue-500" /> {group.name}
                    </h3>
                    <button onClick={() => handleDeleteGroupClick(group.id, group.name)} className="text-xs text-red-400 hover:text-red-600">删除分组</button>
                 </div>
                 {cities.length === 0 ? (
                   <div className="text-sm text-slate-400 italic py-2">暂无城市</div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cities.map(city => (
                        <CityCard 
                          key={city.code} 
                          city={city} 
                          onToggle={() => toggleCity(city.code, city.status)} 
                          onDelete={() => handleDeleteCityClick(city.code, city.name)}
                          onEdit={() => openEditCityModal(city)}
                        />
                      ))}
                   </div>
                 )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'type' && (
          <div className="space-y-6">
            <div className="flex gap-2 max-w-md">
              <input 
                 className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
                 placeholder="输入新业务类型名称"
                 value={newTypeName}
                 onChange={e => setNewTypeName(e.target.value)}
              />
              <button 
                onClick={addType}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                添加
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orderTypes.map(type => (
                <div key={type.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow group">
                   <span className="font-medium text-slate-800">{type.name}</span>
                   <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${type.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {type.isActive ? '启用' : '禁用'}
                      </span>
                      <button 
                        onClick={() => toggleType(type.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-slate-50 hover:bg-blue-50"
                        title="切换状态"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTypeClick(type.id, type.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-slate-50 hover:bg-red-50"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'title' && (
          <div className="space-y-6">
            <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span>此处配置合伙人发布订单时可选的默认标题。</span>
            </div>
            <div className="flex gap-2 max-w-md">
              <input 
                 className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
                 placeholder="输入新标题名称 (如: 家具改色)"
                 value={newTitleName}
                 onChange={e => setNewTitleName(e.target.value)}
              />
              <button 
                onClick={addTitle}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                添加
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishTitles.map(title => (
                <div key={title.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow group">
                   <span className="font-medium text-slate-800">{title.name}</span>
                   <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${title.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {title.isActive ? '启用' : '禁用'}
                      </span>
                      <button 
                        onClick={() => toggleTitle(title.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-slate-50 hover:bg-blue-50"
                        title="切换状态"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTitleClick(title.id, title.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-slate-50 hover:bg-red-50"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Reset Tab */}
        {activeTab === 'system' && isAdmin && (
          <div className="space-y-8 flex flex-col items-center justify-center py-10">
             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="w-10 h-10 text-red-600" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900">数据一键清空 (危险)</h2>
             <p className="text-slate-500 max-w-lg text-center leading-relaxed">
               此操作将执行“系统出厂重置”。<br/>
               它将<strong>永久删除</strong>所有合伙人、订单、资金流水、日志及通知数据。<br/>
               系统配置（城市、类型、规则）将恢复到默认初始状态。<br/>
               <span className="text-red-600 font-bold">仅保留当前 Admin 账号，其他所有数据无法恢复。</span>
             </p>
             <button 
               onClick={() => { setResetInput(''); setShowResetModal(true); }}
               className="mt-6 px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center gap-2"
             >
               <RefreshCw className="w-5 h-5" />
               开始重置系统
             </button>
          </div>
        )}
      </div>

      {/* Add/Edit City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-xl p-6 w-96 animate-in fade-in zoom-in-95">
              <h3 className="font-bold text-lg mb-4">{editingCity ? '编辑城市' : '新增城市'}</h3>
              <div className="space-y-4">
                 <div>
                   <label className="block text-sm text-slate-600 mb-1">城市名称</label>
                   <input className="w-full border rounded-lg px-3 py-2" value={newCityName} onChange={e => setNewCityName(e.target.value)} placeholder="如：南京" />
                 </div>
                 <div>
                   <label className="block text-sm text-slate-600 mb-1">城市代码 (大写)</label>
                   <input 
                      className={`w-full border rounded-lg px-3 py-2 ${editingCity ? 'bg-slate-100 text-slate-500' : ''}`}
                      value={newCityCode} 
                      onChange={e => setNewCityCode(e.target.value)} 
                      placeholder="如：NJ" 
                      disabled={!!editingCity}
                    />
                    {editingCity && <p className="text-xs text-slate-400 mt-1">城市代码是系统唯一标识，不可修改。</p>}
                 </div>
                 <div>
                   <label className="block text-sm text-slate-600 mb-1">所属区域 (可选)</label>
                   <select className="w-full border rounded-lg px-3 py-2" value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
                     <option value="">-- 不分组 --</option>
                     {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                   </select>
                 </div>
                 <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowCityModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-slate-50">取消</button>
                    <button onClick={handleSaveCity} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      {editingCity ? '保存修改' : '确认添加'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">确认删除?</h3>
            <p className="text-slate-500 text-sm mb-6">
              您确定要删除 
              {deleteConfirm.type === 'CITY' && '城市'}
              {deleteConfirm.type === 'GROUP' && '区域分组'}
              {deleteConfirm.type === 'TYPE' && '业务类型'}
              {deleteConfirm.type === 'TITLE' && '发布标题'}
              {' '}
              <strong className="text-slate-900">{deleteConfirm.name}</strong> 吗？
              {deleteConfirm.type === 'CITY' && ' 删除后关联的历史数据可能会显示异常。'}
              {deleteConfirm.type === 'GROUP' && ' 该分组下的城市将自动变为“未分组”。'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-100"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 border-t-4 border-red-600">
            <div className="text-center mb-6">
               <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">最终确认</h2>
               <p className="text-red-600 font-bold mt-2">此操作不可撤销！</p>
            </div>
            
            <div className="space-y-4">
               <p className="text-sm text-slate-600 text-center">
                 为了防止误操作，请在下方输入框中准确输入：<br/>
                 <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded select-all">我确认删除</span>
               </p>
               <input 
                 type="text" 
                 className="w-full border-2 border-red-100 focus:border-red-500 rounded-lg px-4 py-3 text-center font-bold text-slate-900 outline-none transition-colors"
                 placeholder="在此输入确认文字"
                 value={resetInput}
                 onChange={e => setResetInput(e.target.value)}
                 autoFocus
               />
            </div>

            <div className="flex gap-4 mt-8">
               <button 
                 onClick={() => { setShowResetModal(false); setResetInput(''); }}
                 className="flex-1 py-3 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
               >
                 取消
               </button>
               <button 
                 onClick={handleSystemReset}
                 disabled={resetInput !== '我确认删除'}
                 className={`flex-1 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${
                   resetInput === '我确认删除' 
                   ? 'bg-red-600 hover:bg-red-700 shadow-red-200 cursor-pointer' 
                   : 'bg-slate-300 cursor-not-allowed opacity-50'
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

interface CityCardProps {
  city: City;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const CityCard: React.FC<CityCardProps> = ({ city, onToggle, onDelete, onEdit }) => (
  <div className="border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow bg-white">
    <div className="flex items-center gap-3">
       <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-sm">
         {city.code}
       </div>
       <div>
         <p className="font-bold text-slate-800">{city.name}</p>
         <p className="text-xs text-slate-500">{city.status === 'ACTIVE' ? '运营中' : '已暂停'}</p>
       </div>
    </div>
    <div className="flex items-center gap-2">
      <button 
        onClick={onToggle}
        className={`p-2 rounded-full transition-colors ${city.status === 'ACTIVE' ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
        title={city.status === 'ACTIVE' ? '点击停用' : '点击启用'}
      >
        <Power className="w-4 h-4" />
      </button>
      <button 
        onClick={onEdit}
        className="p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title="编辑信息"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button 
        onClick={onDelete}
        className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        title="删除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);