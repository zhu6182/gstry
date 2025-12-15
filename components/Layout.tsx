import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockService } from '../services/mockService';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Wallet, 
  LogOut, 
  Menu,
  ShieldCheck,
  FileText,
  Bell,
  Settings,
  Scale,
  Activity,
  UserCog,
  Key
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
}

const roleNames: Record<UserRole, string> = {
  [UserRole.ADMIN]: '平台管理员',
  [UserRole.OPERATIONS]: '运营人员',
  [UserRole.FINANCE]: '财务人员',
  [UserRole.PARTNER]: '合伙人',
};

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onChangeView }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirmPass: '' });
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for notifications
  useEffect(() => {
    const checkNotifications = () => {
      const notifs = mockService.getNotifications(user.id);
      const count = notifs.filter(n => !n.isRead).length;
      setUnreadCount(count);
    };
    
    checkNotifications(); // Initial check
    const interval = setInterval(checkNotifications, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [user.id]);

  const getMenuItems = () => {
    const common = [
      { id: 'dashboard', label: '首页仪表盘', icon: LayoutDashboard },
    ];

    if (user.role === UserRole.ADMIN) {
      return [
        ...common,
        { id: 'partners', label: '合伙人管理', icon: Users },
        { id: 'orders', label: '全部订单', icon: ShoppingBag },
        { id: 'finance', label: '财务结算', icon: Wallet },
        { id: 'rules', label: '抽成规则', icon: Scale }, 
        { id: 'reports', label: '数据报表', icon: FileText },
        { id: 'logs', label: '操作日志', icon: Activity },
        { id: 'internal-users', label: '内部人员', icon: UserCog },
        { id: 'settings', label: '系统设置', icon: Settings },
      ];
    }

    if (user.role === UserRole.OPERATIONS) {
      return [
        ...common,
        { id: 'partners', label: '合伙人管理', icon: Users },
        { id: 'orders', label: '全部订单', icon: ShoppingBag },
        { id: 'reports', label: '数据报表', icon: FileText },
        // Operations restricted from: Finance, Rules, Logs, Settings, Internal Users
      ];
    }
    
    if (user.role === UserRole.FINANCE) {
      return [
        ...common,
        { id: 'finance', label: '结算管理', icon: Wallet },
        { id: 'orders', label: '订单审核', icon: ShoppingBag },
        { id: 'reports', label: '财务报表', icon: FileText },
      ];
    }

    if (user.role === UserRole.PARTNER) {
      return [
        ...common,
        { id: 'order-hall', label: '抢单大厅', icon: ShoppingBag },
        { id: 'my-orders', label: '我的订单', icon: FileText },
        { id: 'finance', label: '我的钱包', icon: Wallet },
      ];
    }

    return common;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirmPass) {
      alert('两次输入的密码不一致');
      return;
    }
    if (passwordForm.newPass.length < 3) {
      alert('密码长度太短');
      return;
    }
    
    const success = mockService.changePassword(user.id, passwordForm.newPass);
    if (success) {
      alert('密码修改成功');
      setShowPasswordModal(false);
      setPasswordForm({ newPass: '', confirmPass: '' });
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-400">
              <ShieldCheck className="w-6 h-6" />
              <span>PartnerNexus</span>
            </div>
          ) : (
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 min-w-[20px]" />
              {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full border-2 border-slate-600" />
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.realName}</p>
                <p className="text-xs text-slate-500 truncate">{roleNames[user.role]}</p>
              </div>
            )}
          </div>
          
          <div className={`mt-4 grid gap-2 ${!sidebarOpen && 'justify-items-center'}`}>
            <button 
              onClick={() => setShowPasswordModal(true)}
              className={`flex items-center gap-2 px-2 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md transition-colors w-full ${!sidebarOpen && 'justify-center'}`}
            >
              <Key className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">修改密码</span>}
            </button>
            <button 
              onClick={onLogout}
              className={`flex items-center gap-2 px-2 py-2 text-red-400 hover:bg-slate-800 rounded-md transition-colors w-full ${!sidebarOpen && 'justify-center'}`}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">退出登录</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-md text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-100">
              {roleNames[user.role]} 工作台
            </span>
            <button 
              onClick={() => onChangeView('notifications')}
              className={`relative p-2 hover:bg-slate-100 rounded-full transition-colors ${currentView === 'notifications' ? 'text-blue-600' : 'text-slate-500'}`}
              title="查看通知"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
           {children}
        </main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold text-slate-800 mb-4">修改我的密码</h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm text-slate-600 mb-1">新密码</label>
                    <input 
                      type="password"
                      required
                      className="w-full border rounded-lg px-3 py-2"
                      value={passwordForm.newPass}
                      onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm text-slate-600 mb-1">确认新密码</label>
                    <input 
                      type="password"
                      required
                      className="w-full border rounded-lg px-3 py-2"
                      value={passwordForm.confirmPass}
                      onChange={e => setPasswordForm({...passwordForm, confirmPass: e.target.value})}
                    />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      取消
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      确认修改
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};