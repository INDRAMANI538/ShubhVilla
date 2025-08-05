// src/App.tsx

import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import DashboardStats from './components/Dashboard/DashboardStats';
import RecentActivities from './components/Dashboard/RecentActivities';
import MaintenanceManagement from './components/Maintenance/MaintenanceManagement';
import OwnerDetails from './components/Owners/OwnerDetails';
import TenantDetails from './components/Tenants/TenantDetails';
import VerificationSystem from './components/Verification/VerificationSystem';
import PaymentForm from './components/payment/PaymentForm';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { currentUser } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {currentUser?.name || 'User'}!
              </h2>
              <p className="text-gray-600">
                Here's what's happening in SHUBH VILLA SOCIETY today.
              </p>
            </div>
            <DashboardStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivities />
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('maintenance')}
                    className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                  >
                    <div className="text-blue-600 font-medium">Maintenance</div>
                    <div className="text-sm text-gray-600">Manage payments</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
                  >
                    <div className="text-green-600 font-medium">Verification</div>
                    <div className="text-sm text-gray-600">Review requests</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('tenants')}
                    className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
                  >
                    <div className="text-purple-600 font-medium">Tenants</div>
                    <div className="text-sm text-gray-600">Manage tenants</div>
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => setActiveTab('owners')}
                      className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors"
                    >
                      <div className="text-orange-600 font-medium">Owners</div>
                      <div className="text-sm text-gray-600">Manage owners</div>
                    </button>
                  )}
                  {!currentUser?.role || currentUser?.role !== 'admin' ? (
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors"
                    >
                      <div className="text-yellow-600 font-medium">Pay Maintenance</div>
                      <div className="text-sm text-gray-600">Submit your bill</div>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      case 'maintenance':
        return <MaintenanceManagement />;
      case 'owners':
        return <OwnerDetails />;
      case 'tenants':
        return <TenantDetails />;
      case 'verification':
        return <VerificationSystem />;
      case 'payments':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pay Maintenance</h2>
            <PaymentForm billId="manual-entry" />
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
            <p className="text-gray-600">Comprehensive reporting features coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginForm />;
  }

  return <Dashboard />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
