import React from 'react';
import { Client, Order } from '../types';
import { NotificationSummary } from './NotificationSummary';
import { useNotifications } from '../hooks/useNotifications';
import { calculateClientStats, formatWeek, formatCurrency, getCurrentWeek, getWeekStatus, calculateProductPredictions } from '../utils/calculations';
import { Users, Package, TrendingUp, Calendar, AlertCircle, CheckCircle, Bug } from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  orders: Order[];
  onSelectClient?: (client: Client) => void;
  onShowOverdueOrders?: () => void;
  onShowUpcomingOrders?: () => void;
  onShowInactiveClients?: () => void;
}

export function Dashboard({ clients, orders, onSelectClient, onShowOverdueOrders, onShowUpcomingOrders, onShowInactiveClients }: DashboardProps) {
  const { notifications } = useNotifications(clients, orders);
  
  const totalClients = clients.length;
  const totalOrders = orders.length;
  const totalVolume = orders.reduce((sum, order) => sum + order.total, 0);

  const handleSelectClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client && onSelectClient) {
      onSelectClient(client);
    }
  };

  // Get recent orders (last 4 weeks)
  const currentWeek = getCurrentWeek();
  const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;
  const recentOrders = orders.filter(order => {
    const orderWeekOfYear = order.year * 52 + order.weekNumber;
    return (currentWeekOfYear - orderWeekOfYear) <= 4;
  });

  // NOUVELLE LOGIQUE SIMPLE : Un client = une prédiction globale
  const clientPredictions = clients.map(client => {
    const clientOrders = orders.filter(order => order.clientId === client.id);
    const stats = calculateClientStats(clientOrders);
    
    if (stats.nextOrderPrediction) {
      const status = getWeekStatus(stats.nextOrderPrediction);
      return {
        client,
        nextOrderPrediction: stats.nextOrderPrediction,
        status,
        lastOrder: stats.lastOrder,
        weeklyConsumption: stats.weeklyConsumption
      };
    }
    return null;
  }).filter(Boolean) as Array<{
    client: Client;
    nextOrderPrediction: { week: number; year: number };
    status: { color: string; text: string; weeksUntil: number };
    lastOrder: { week: number; year: number } | null;
    weeklyConsumption: number;
  }>;

  // Séparer en retard vs à venir
  const overdueClients = clientPredictions.filter(({ status }) => status.weeksUntil < 0);
  const upcomingClients = clientPredictions.filter(({ status }) => status.weeksUntil >= 0);

  // Trier par proximité
  overdueClients.sort((a, b) => a.status.weeksUntil - b.status.weeksUntil);
  upcomingClients.sort((a, b) => a.status.weeksUntil - b.status.weeksUntil);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de vos commandes et clients</p>
        </div>
      </div>

      {/* Notification Summary Cards */}
      <NotificationSummary 
        notifications={notifications} 
        onSelectClient={handleSelectClient}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100">
              <Package className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Volume Total (kg)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalVolume)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">4 dernières semaines</p>
              <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients en retard */}
        <div 
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          onClick={onShowOverdueOrders}
        >
          <div className="flex items-center mb-4">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Clients en retard</h3>
            <span className="ml-auto text-xs text-gray-500">Cliquer pour voir tout</span>
          </div>
          <div className="space-y-3">
            {(() => {
              // Calculer toutes les prédictions par produit
              const allProductPredictions: Array<{
                client: Client;
                productName: string;
                productCategory: string;
                nextOrderPrediction: { week: number; year: number };
                weeksUntilNextOrder: number;
              }> = [];

              clients.forEach(client => {
                const clientOrders = orders.filter(order => order.clientId === client.id);
                const predictions = calculateProductPredictions(clientOrders);
                predictions.forEach(prediction => {
                  const currentWeek = getCurrentWeek();
                  const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;
                  const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
                  const weeksUntilNextOrder = targetWeekOfYear - currentWeekOfYear;
                  
                  allProductPredictions.push({
                    client,
                    productName: prediction.productName,
                    productCategory: prediction.productCategory,
                    nextOrderPrediction: prediction.nextOrderPrediction,
                    weeksUntilNextOrder
                  });
                });
              });

              const overdueProducts = allProductPredictions.filter(p => p.weeksUntilNextOrder < 0);
              
              return overdueProducts.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun client en retard</p>
              ) : (
                overdueProducts.map((prediction, index) => {
                  const categoryNames: { [key: string]: string } = {
                    papier_thermo: 'Papier Thermo',
                    papier_paraffine: 'Papier Paraffiné',
                    pots: 'Pots',
                    bretelles: 'Bretelles',
                    cabas_kraft_pp: 'Cabas Kraft PP',
                    cabas_kraft_pt: 'Cabas Kraft PT',
                    reutilisable: 'Réutilisable',
                    isotherme: 'Isotherme',
                    objet_pub: 'Objet Pub'
                  };
                  
                  const categoryName = categoryNames[prediction.productCategory] || prediction.productCategory;
                  
                  return (
                    <div key={`${prediction.client.id}-${prediction.productName}-${index}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <p className="font-medium text-gray-900">{prediction.client.nom}</p>
                        <p className="text-sm text-red-600">
                          {categoryName} - {prediction.productName} - {formatWeek(prediction.nextOrderPrediction.week, prediction.nextOrderPrediction.year)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          En retard ({Math.abs(prediction.weeksUntilNextOrder)} semaines)
                        </span>
                      </div>
                    </div>
                  );
                })
              );
            })()}
          </div>
        </div>

        {/* Prochaines commandes */}
        <div 
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          onClick={onShowUpcomingOrders}
        >
          <div className="flex items-center mb-4">
            <CheckCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Prochaines commandes prévues</h3>
            <span className="ml-auto text-xs text-gray-500">Cliquer pour voir tout</span>
          </div>
          <div className="space-y-3">
            {(() => {
              // Calculer toutes les prédictions par produit
              const allProductPredictions: Array<{
                client: Client;
                productName: string;
                productCategory: string;
                nextOrderPrediction: { week: number; year: number };
                weeksUntilNextOrder: number;
              }> = [];

              clients.forEach(client => {
                const clientOrders = orders.filter(order => order.clientId === client.id);
                const predictions = calculateProductPredictions(clientOrders);
                
                predictions.forEach(prediction => {
                  const currentWeek = getCurrentWeek();
                  const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;
                  const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
                  const weeksUntilNextOrder = targetWeekOfYear - currentWeekOfYear;
                  
                  allProductPredictions.push({
                    client,
                    productName: prediction.productName,
                    productCategory: prediction.productCategory,
                    nextOrderPrediction: prediction.nextOrderPrediction,
                    weeksUntilNextOrder
                  });
                });
              });

              // Filtrer les produits à venir (pas en retard)
              const upcomingProducts = allProductPredictions.filter(p => p.weeksUntilNextOrder >= 0);
              
              return upcomingProducts.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune prédiction disponible</p>
              ) : (
                upcomingProducts.map((prediction, index) => {
                  const categoryNames: { [key: string]: string } = {
                    papier_thermo: 'Papier Thermo',
                    papier_paraffine: 'Papier Paraffiné',
                    pots: 'Pots',
                    bretelles: 'Bretelles',
                    cabas_kraft_pp: 'Cabas Kraft PP',
                    cabas_kraft_pt: 'Cabas Kraft PT',
                    reutilisable: 'Réutilisable',
                    isotherme: 'Isotherme',
                    objet_pub: 'Objet Pub'
                  };
                  
                  const categoryName = categoryNames[prediction.productCategory] || prediction.productCategory;
                  const isUrgent = prediction.weeksUntilNextOrder <= 2;
                  
                  return (
                    <div key={`${prediction.client.id}-${prediction.productName}-${index}`} className={`flex items-center justify-between p-3 rounded-lg border ${
                      isUrgent ? 'bg-yellow-50 border-yellow-100' : 'bg-blue-50 border-blue-100'
                    }`}>
                      <div>
                        <p className="font-medium text-gray-900">{prediction.client.nom}</p>
                        <p className={`text-sm ${isUrgent ? 'text-yellow-600' : 'text-blue-600'}`}>
                          {categoryName} - {prediction.productName} - {formatWeek(prediction.nextOrderPrediction.week, prediction.nextOrderPrediction.year)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isUrgent ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {prediction.weeksUntilNextOrder === 0 ? 'Cette semaine' : `Dans ${prediction.weeksUntilNextOrder} semaine${prediction.weeksUntilNextOrder > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              );
            })()}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commandes récentes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N°
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semaine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total (kg)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.slice(0, 5).map((order) => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.orderNumber || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {client ? (client.nomEntreprise || client.nom) : 'Client inconnu'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatWeek(order.weekNumber, order.year)}
                        {order.dayOfWeek && (
                          <div className="text-xs text-blue-600 font-medium">
                            {order.dayOfWeek}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.total} kg
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune commande récente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}