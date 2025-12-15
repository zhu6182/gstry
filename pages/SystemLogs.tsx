import React, { useState } from 'react';
import { mockService } from '../services/mockService';
import { ShieldAlert, Search, Download, Calendar, RefreshCw } from 'lucide-react';

export const SystemLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const allLogs = mockService.getLogs();

  // Filter Logic
  const filteredLogs = allLogs.filter(log => {
    // Search Term Matching
    const matchesSearch = 
      searchTerm === '' ||
      log.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    // Date Range Matching
    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && new Date(log.createdAt) >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(log.createdAt) <= end;
    }

    return matchesSearch && matchesDate;
  });

  const handleExport = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `System_Logs_${timestamp}.csv`;
    
    // CSV Header
    let csvContent = "时间,操作人,模块,动作类型,详细内容\n";
    
    // CSV Rows
    filteredLogs.forEach(log => {
       const time = new Date(log.createdAt).toLocaleString();
       // Escape double quotes by doubling them
       const details = `"${log.details.replace(/"/g, '""')}"`; 
       csvContent += `${time},${log.operatorName},${log.module},${log.action},${details}\n`;
    });

    // Add BOM for Excel Chinese character support
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">操作日志 & 风控</h1>
          <p className="text-slate-500 text-sm">监控系统关键操作记录与安全审计</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
           {/* Date Range Filter */}
           <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-300 shadow-sm">
              <div className="pl-2 text-slate-400"><Calendar className="w-4 h-4" /></div>
              <input 
                type="date"
                className="text-sm border-none outline-none text-slate-600 bg-transparent py-1 w-32 cursor-pointer"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                title="开始日期"
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date"
                className="text-sm border-none outline-none text-slate-600 bg-transparent py-1 w-32 cursor-pointer"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                title="结束日期"
              />
           </div>

           {/* Search Input */}
           <div className="relative md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="搜索操作人/动作/详情..." 
               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>

           {/* Actions */}
           <div className="flex gap-2">
             <button 
               onClick={handleResetFilters}
               className="p-2 text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
               title="重置筛选"
             >
               <RefreshCw className="w-4 h-4" />
             </button>
             <button 
               onClick={handleExport}
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
             >
               <Download className="w-4 h-4" />
               导出 Excel
             </button>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">时间</th>
              <th className="px-6 py-4">操作人</th>
              <th className="px-6 py-4">模块</th>
              <th className="px-6 py-4">动作类型</th>
              <th className="px-6 py-4">详细内容</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {log.operatorName}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                    {log.module}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-blue-600">
                  {log.action}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {log.details}
                </td>
              </tr>
            ))}
             {filteredLogs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">暂无日志记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};