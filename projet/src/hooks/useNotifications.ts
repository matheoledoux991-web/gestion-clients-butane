import { useState, useEffect, useMemo } from 'react';
import { Client, Order, Notification } from '../types';
import { calculateClientStats, calculateProductPredictions, getCurrentWeek } from '../utils/calculations';

export function useNotifications(clients: Client[], orders: Order[]) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Générer les notifications automatiquement
  const generatedNotifications = useMemo(() => {
    const newNotifications: Notification[] = [];
    const currentWeek = getCurrentWeek();
    const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;

    clients.forEach(client => {
      const clientOrders = orders.filter(order => order.clientId === client.id);
      const stats = calculateClientStats(clientOrders);

      // 1. Notifications pour les produits en retard
      const productPredictions = calculateProductPredictions(clientOrders);
      productPredictions.forEach(prediction => {
        const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
        const weeksOverdue = currentWeekOfYear - targetWeekOfYear;

        if (weeksOverdue > 0) {
          newNotifications.push({
            id: `overdue-${client.id}-${prediction.productName}`,
            type: 'overdue',
            title: 'Commande en retard',
            message: `${client.nom} - ${prediction.productName} est en retard de ${weeksOverdue} semaine${weeksOverdue > 1 ? 's' : ''}`,
            clientId: client.id,
            clientName: client.nom,
            productName: prediction.productName,
            priority: weeksOverdue >= 4 ? 'high' : weeksOverdue >= 2 ? 'medium' : 'low',
            createdAt: new Date(),
            read: false,
            actionUrl: `/client/${client.id}`
          });
        }
      });

      // 2. Notifications pour les commandes attendues sous peu (dans les 3 prochaines semaines)
      productPredictions.forEach(prediction => {
        const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
        const weeksUntil = targetWeekOfYear - currentWeekOfYear;

        if (weeksUntil > 0 && weeksUntil <= 3) {
          newNotifications.push({
            id: `upcoming-${client.id}-${prediction.productName}`,
            type: 'upcoming',
            title: 'Commande attendue prochainement',
            message: `${client.nom} - ${prediction.productName} prévu dans ${weeksUntil} semaine${weeksUntil > 1 ? 's' : ''}`,
            clientId: client.id,
            clientName: client.nom,
            productName: prediction.productName,
            priority: weeksUntil === 1 ? 'high' : 'medium',
            createdAt: new Date(),
            read: false,
            actionUrl: `/client/${client.id}`
          });
        }
      });

      // 3. Notifications pour les clients inactifs (pas de commande depuis 8+ semaines)
      if (stats.lastOrder) {
        const lastOrderWeekOfYear = stats.lastOrder.year * 52 + stats.lastOrder.week;
        const weeksSinceLastOrder = currentWeekOfYear - lastOrderWeekOfYear;

        if (weeksSinceLastOrder >= 8) {
          newNotifications.push({
            id: `inactive-${client.id}`,
            type: 'inactive',
            title: 'Client inactif',
            message: `${client.nom} n'a pas commandé depuis ${weeksSinceLastOrder} semaines`,
            clientId: client.id,
            clientName: client.nom,
            priority: weeksSinceLastOrder >= 12 ? 'high' : 'medium',
            createdAt: new Date(),
            read: false,
            actionUrl: `/client/${client.id}`
          });
        }
      }
    });

    return newNotifications;
  }, [clients, orders]);

  // Mettre à jour les notifications
  useEffect(() => {
    setNotifications(generatedNotifications);
    setUnreadCount(generatedNotifications.filter(n => !n.read).length);
  }, [generatedNotifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? Math.max(0, prev - 1) : prev;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };
  const getNotificationsByType = (type: Notification['type']) => {
    return notifications.filter(n => n.type === type);
  };

  const getHighPriorityNotifications = () => {
    return notifications.filter(n => n.priority === 'high' && !n.read);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
    getHighPriorityNotifications
  };
}