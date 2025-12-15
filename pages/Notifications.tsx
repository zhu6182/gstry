import React, { useState } from 'react';
import { mockService } from '../services/mockService';
import { User } from '../types';
import { Bell, Check, MessageSquare } from 'lucide-react';

export const Notifications: React.FC<{ user: User }> = ({ user }) => {
  const [notifications, setNotifications] = useState(mockService.getNotifications(user.id));

  const markRead = (id: string) => {
    mockService.markNotificationRead(id);
    setNotifications([...mockService.getNotifications(user.id)]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">消息通知</h1>
          <p className="text-slate-500 text-sm">系统公告与业务动态</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-xl border transition-all ${
            n.isRead ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-200 shadow-sm'
          }`}>
             <div className="flex gap-4">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                 n.type === 'SYSTEM' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
               }`}>
                 {n.type === 'SYSTEM' ? <Bell className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
               </div>
               <div className="flex-1">
                 <div className="flex justify-between items-start">
                   <h3 className={`font-bold ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h3>
                   <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                 </div>
                 <p className={`text-sm mt-1 ${n.isRead ? 'text-slate-500' : 'text-slate-800'}`}>{n.content}</p>
                 
                 {!n.isRead && (
                   <button 
                     onClick={() => markRead(n.id)}
                     className="mt-3 text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                   >
                     <Check className="w-3 h-3" /> 标记为已读
                   </button>
                 )}
               </div>
             </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
            暂无消息通知
          </div>
        )}
      </div>
    </div>
  );
};