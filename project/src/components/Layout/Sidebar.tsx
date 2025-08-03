// src/components/Layout/Sidebar.tsx
import React from 'react';
import {
  Home,
  Wrench,
  Users,
  UserCheck,
  Shield,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, adminOnly: false },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, adminOnly: false },
    { id: 'owners', label: 'Owner Details', icon: Users, adminOnly: false }, // changed this
    { id: 'tenants', label: 'Tenant Details', icon: UserCheck, adminOnly: false },
    { id: 'verification', label: 'Verification', icon: Shield, adminOnly: false },
    { id: 'payments', label: 'Payments', icon: CreditCard, adminOnly: true },
    { id: 'reports', label: 'Reports', icon: FileText, adminOnly: true },
  ];

  const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="bg-white w-64 shadow-sm border-r border-gray-200">
      <nav className="mt-8">
        <ul className="space-y-2 px-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
