import React from 'react';
import { NotificationBell } from './NotificationBell';
import { Notification } from '../types';
import { Package, Users, BarChart3, Search } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notifications?: Notification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  onSelectClient?: (clientId: string) => void;
}

export function Navbar({ 
  activeTab, 
  onTabChange, 
  notifications = [], 
  unreadCount = 0, 
  onMarkAsRead = () => {}, 
  onMarkAllAsRead = () => {},
  onDeleteNotification = () => {},
  onClearAllNotifications = () => {},
  onSelectClient = () => {}
}: NavbarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'orders', label: 'Commandes', icon: Package },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16 relative">
          {/* Section gauche avec recherche et logo */}
          {/* Section droite avec notifications */}
          <div className="absolute right-0 flex items-center">
            <div className="flex-shrink-0 flex items-center mr-8">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PaperFlow
              </span>
            </div>
          </div>
          
          {/* Section centrale avec les onglets */}
          <div className="flex items-center">
            <div className="flex space-x-8">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg px-3'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t-lg px-3'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
              <button
                onClick={() => onTabChange('search')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'search'
                    ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg px-3'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t-lg px-3'
                }`}
              >
                <Search className="h-4 w-4 mr-2" />
                Recherche
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onDeleteNotification={onDeleteNotification}
              onClearAllNotifications={onClearAllNotifications}
              onSelectClient={onSelectClient}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}