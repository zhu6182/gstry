
import React, { useState, useEffect } from 'react';
import { User, UserRole, SystemConfig } from './types';
import { mockService } from './services/mockService';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { OrderHall } from './pages/OrderHall';
import { PartnerManagement } from './pages/PartnerManagement';
import { MyOrders } from './pages/MyOrders';
import { OrderPublish } from './pages/OrderPublish';
import { AllOrders } from './pages/AllOrders';
import { Finance } from './pages/Finance';
import { Reports } from './pages/Reports';
import { CommissionRules } from './pages/CommissionRules';
import { Settings } from './pages/Settings';
import { SystemLogs } from './pages/SystemLogs';
import { Notifications } from './pages/Notifications';
import { InternalUserManagement } from './pages/InternalUserManagement';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(mockService.getSystemConfig());

  const handleLogin = (user: User) => {
    setUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const updateConfig = (newConfig: SystemConfig) => {
    mockService.updateSystemConfig(newConfig);
    setSystemConfig(newConfig);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user!} onNavigate={setCurrentView} />;
      case 'partners':
        return <PartnerManagement user={user!} />;
      case 'order-hall':
        return <OrderHall user={user!} />;
      case 'my-orders':
        return <MyOrders user={user!} onPublishClick={() => setCurrentView('publish')} />;
      case 'publish':
        return (
          <OrderPublish 
            user={user!} 
            onBack={() => setCurrentView('my-orders')}
            onSuccess={() => setCurrentView('my-orders')}
          />
        );
      case 'orders':
        return <AllOrders user={user!} />;
      case 'finance':
        return <Finance user={user!} />;
      case 'reports':
        return <Reports user={user!} />;
      case 'rules':
        return <CommissionRules />;
      case 'settings':
        return <Settings user={user!} systemConfig={systemConfig} onUpdateConfig={updateConfig} onLogout={handleLogout} />;
      case 'logs':
        return <SystemLogs />;
      case 'notifications':
        return <Notifications user={user!} />;
      case 'internal-users':
        return <InternalUserManagement />;
      default:
        return <Dashboard user={user!} onNavigate={setCurrentView} />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} systemConfig={systemConfig} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentView={currentView}
      onChangeView={setCurrentView}
      systemConfig={systemConfig}
    >
      {renderContent()}
    </Layout>
  );
}
