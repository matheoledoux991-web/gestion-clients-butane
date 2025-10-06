import React from 'react';
import { Client, Order } from '../types';
import { calculateClientStats, getCurrentWeek, formatWeek } from '../utils/calculations';
import { ArrowLeft, UserX, User, Calendar, Package } from 'lucide-react';

interface InactiveClientsPageProps {
  clients: Client[];
  orders: Order[];
  onBack: () => void;
  onSelectClient: (client: Client) => void;
}

export function InactiveClientsPage({ clients, orders, onBack, onSelectClient }: InactiveClientsPageProps) {
  // Calculer les clients inactifs
  const inactiveClients: Array<{
    client: Client;
    weeksSinceLastOrder: number;
    lastOrder: { week: number; year: number } | null;
    totalOrders: number;
  }> = [];

  const currentWeek = getCurrentWeek();
  const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;

  clients.forEach(client => {
    const clientOrders = orders.filter(order => order.clientId === client.id);
    const stats = calculateClientStats(clientOrders);

    if (stats.lastOrder) {
      const lastOrderWeekOfYear = stats.lastOrder.year * 52 + stats.lastOrder.week;
      const weeksSinceLastOrder = currentWeekOfYear - lastOrderWeekOfYear;

      if (weeksSinceLastOrder >= 8) {
        inactiveClients.push({
          client,
          weeksSinceLastOrder,
          lastOrder: stats.lastOrder,
          totalOrders: stats.totalOrders
        });
      }
    }
  });

  // Trier par nombre de semaines d'inactivité (plus inactif en premier)
  inactiveClients.sort((a, b) => b.weeksSinceLastOrder - a.weeksSinceLastOrder);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <UserX className="h-8 w-8 text-gray-500 mr-3" />
              Clients inactifs
            </h1>
            <p className="text-gray-600">
              {inactiveClients.length} client{inactiveClients.length > 1 ? 's' : ''} sans commande depuis plus de 8 semaines
            </p>
          </div>
        </div>
      </div>

      {inactiveClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Tous les clients sont actifs !</h3>
          <p className="text-gray-500">Aucun client n'est inactif depuis plus de 8 semaines.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inactif depuis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total commandes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inactiveClients.map((item, index) => {
                  const priority = item.weeksSinceLastOrder >= 12 ? 'high' : 'medium';
                  const priorityColor = priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
                  const priorityText = priority === 'high' ? 'Urgent' : 'Important';

                  return (
                    <tr 
                      key={item.client.id}
                      className="hover:bg-gray-25 transition-colors duration-150 cursor-pointer"
                      onClick={() => onSelectClient(item.client)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.client.nomEntreprise || item.client.nom}
                            </div>
                            {item.client.nom && item.client.prenom && (
                              <div className="text-sm text-gray-500">
                                {item.client.prenom} {item.client.nom}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.client.email && (
                            <div className="flex items-center mb-1">
                              <span className="text-gray-500">📧</span>
                              <span className="ml-2">{item.client.email}</span>
                            </div>
                          )}
                          {item.client.telephone && (
                            <div className="flex items-center">
                              <span className="text-gray-500">📞</span>
                              <span className="ml-2">{item.client.telephone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {item.lastOrder ? formatWeek(item.lastOrder.week, item.lastOrder.year) : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.weeksSinceLastOrder} semaine{item.weeksSinceLastOrder > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">{item.totalOrders}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor}`}>
                          {priorityText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}