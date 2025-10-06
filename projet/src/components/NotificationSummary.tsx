import React from 'react';
import { Notification } from '../types';
import { AlertCircle, Clock, UserX, TrendingUp } from 'lucide-react';

interface NotificationSummaryProps {
  notifications: Notification[];
  onSelectClient: (clientId: string) => void;
  onShowOverdueOrders?: () => void;
  onShowUpcomingOrders?: () => void;
  onShowInactiveClients?: () => void;
}

export function NotificationSummary({ notifications, onSelectClient, onShowOverdueOrders, onShowUpcomingOrders, onShowInactiveClients }: NotificationSummaryProps) {
  const overdueNotifications = notifications.filter(n => n.type === 'overdue');
  const upcomingNotifications = notifications.filter(n => n.type === 'upcoming');
  const inactiveNotifications = notifications.filter(n => n.type === 'inactive');

  const NotificationCard = ({ 
    title, 
    count, 
    icon: Icon, 
    color, 
    bgColor, 
    notifications: notifs,
    onClick
  }: {
    title: string;
    count: number;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    notifications: Notification[];
    onClick?: () => void;
  }) => (
    <div 
      className={`${bgColor} rounded-xl border border-gray-100 p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-300' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${color === 'red' ? 'bg-red-100' : color === 'yellow' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
            <Icon className={`h-6 w-6 ${color === 'red' ? 'text-red-600' : color === 'yellow' ? 'text-yellow-600' : 'text-gray-600'}`} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className={`text-2xl font-bold ${color === 'red' ? 'text-red-600' : color === 'yellow' ? 'text-yellow-600' : 'text-gray-600'}`}>
              {count}
            </p>
          </div>
        </div>
        {onClick && (
          <span className="text-xs text-gray-500">Cliquer pour voir tout</span>
        )}
      </div>
      
      {notifs.length > 0 && (
        <div className="space-y-2">
          {notifs.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              onClick={() => onSelectClient(notification.clientId)}
              className="p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{notification.clientName}</p>
                  {notification.productName && (
                    <p className="text-sm text-gray-600">{notification.productName}</p>
                  )}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  notification.priority === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : notification.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {notification.priority === 'high' ? 'Urgent' : notification.priority === 'medium' ? 'Important' : 'Normal'}
                </span>
              </div>
            </div>
          ))}
          {notifs.length > 3 && (
            <p className="text-sm text-gray-500 text-center">
              +{notifs.length - 3} autre{notifs.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <NotificationCard
        title="Commandes en retard"
        count={overdueNotifications.length}
        icon={AlertCircle}
        color="red"
        bgColor="bg-red-50"
        notifications={overdueNotifications}
        onClick={onShowOverdueOrders}
      />
      
      <NotificationCard
        title="Commandes attendues"
        count={upcomingNotifications.length}
        icon={Clock}
        color="yellow"
        bgColor="bg-yellow-50"
        notifications={upcomingNotifications}
        onClick={onShowUpcomingOrders}
      />
      
      <NotificationCard
        title="Clients inactifs"
        count={inactiveNotifications.length}
        icon={UserX}
        color="gray"
        bgColor="bg-gray-50"
        notifications={inactiveNotifications}
        onClick={onShowInactiveClients}
      />
    </div>
  );
}