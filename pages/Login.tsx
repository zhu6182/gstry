
import React, { useState } from 'react';
import { User, SystemConfig } from '../types';
import { mockService } from '../services/mockService';
import { ShieldCheck, User as UserIcon, Lock, ArrowRight, Building, Wallet, Layout } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  systemConfig: SystemConfig;
}

export const Login: React.FC<LoginProps> = ({ onLogin, systemConfig }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = mockService.authenticate(username, password);
    if (user) {
      onLogin(user);
    } else {
      setError('账号或密码错误');
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    // Optional: Auto submit after a small delay for better UX
    setTimeout(() => {
        const user = mockService.authenticate(u, p);
        if (user) onLogin(user);
    }, 400);
  };

  const TestAccountCard = ({ role, name, user, pass, icon: Icon, color }: any) => (
    <button 
      onClick={() => quickLogin(user, pass)}
      className="w-full bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-3 group text-left"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm truncate">{name}</p>
        <p className="text-xs text-slate-500 font-mono truncate">{user}</p>
      </div>
      <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side: Login Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
               {systemConfig.logoUrl ? (
                 <img src={systemConfig.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />
               ) : (
                 <ShieldCheck className="w-8 h-8 text-blue-600" />
               )}
               <span className="text-2xl font-bold text-slate-900 tracking-tight">{systemConfig.systemName}</span>
            </div>
            <p className="text-slate-500">{systemConfig.loginSubtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">账号</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入手机号或工号"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入登录密码"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                 {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-slate-200 mt-2"
            >
              登 录
            </button>
          </form>

          <div className="mt-auto pt-8 text-center text-xs text-slate-400">
             {systemConfig.copyright}
          </div>
        </div>

        {/* Right Side: Quick Access */}
        <div className="md:w-[400px] bg-slate-50 border-l border-slate-100 p-8 flex flex-col justify-center">
           <div className="mb-6">
             <h3 className="font-bold text-slate-800 text-lg">快速体验账号</h3>
             <p className="text-slate-500 text-sm">点击下方卡片可直接填充登录信息</p>
           </div>

           <div className="space-y-3">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">管理团队</div>
             <TestAccountCard 
               name="超级管理员" 
               user="admin" 
               pass="123" 
               icon={Layout} 
               color="bg-purple-500" 
             />
             <TestAccountCard 
               name="财务专员" 
               user="fin001" 
               pass="123" 
               icon={Wallet} 
               color="bg-green-500" 
             />

             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">合伙人 (测试数据)</div>
             <TestAccountCard 
               name="张总 (上海)" 
               user="13800138001" 
               pass="123" 
               icon={Building} 
               color="bg-blue-500" 
             />
             <TestAccountCard 
               name="刘工 (北京)" 
               user="13900139002" 
               pass="123" 
               icon={Building} 
               color="bg-blue-500" 
             />
             <TestAccountCard 
               name="陈经理 (广州)" 
               user="13700137003" 
               pass="123" 
               icon={Building} 
               color="bg-blue-500" 
             />
           </div>
        </div>

      </div>
    </div>
  );
};
