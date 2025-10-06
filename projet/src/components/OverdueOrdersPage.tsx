import React from 'react';
import { Client, Order } from '../types';
import { calculateProductPredictions, getCurrentWeek, formatWeek } from '../utils/calculations';
import { ArrowLeft, AlertCircle, User, Package, ChevronDown, ChevronRight } from 'lucide-react';

interface OverdueOrdersPageProps {
  clients: Client[];
  orders: Order[];
  onBack: () => void;
  onSelectClient: (client: Client) => void;
}

export function OverdueOrdersPage({ clients, orders, onBack, onSelectClient }: OverdueOrdersPageProps) {
  const [expandedClients, setExpandedClients] = React.useState<Set<string>>(new Set());

  const toggleClientExpansion = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  // Calculer toutes les prédictions par produit en retard
  const overdueProductsByClient = new Map<string, Array<{
    client: Client;
    productName: string;
    productCategory: string;
    nextOrderPrediction: { week: number; year: number };
    weeksOverdue: number;
  }>>();

  clients.forEach(client => {
    const clientOrders = orders.filter(order => order.clientId === client.id);
    const predictions = calculateProductPredictions(clientOrders);
    
    predictions.forEach(prediction => {
      const currentWeek = getCurrentWeek();
      const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;
      const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
      const weeksOverdue = currentWeekOfYear - targetWeekOfYear;
      
      if (weeksOverdue > 0) {
        if (!overdueProductsByClient.has(client.id)) {
          overdueProductsByClient.set(client.id, []);
        }
        overdueProductsByClient.get(client.id)!.push({
          client,
          productName: prediction.productName,
          productCategory: prediction.productCategory,
          nextOrderPrediction: prediction.nextOrderPrediction,
          weeksOverdue
        });
      }
    });
  });

  // Trier les produits de chaque client par nombre de semaines de retard
  overdueProductsByClient.forEach((products) => {
    products.sort((a, b) => b.weeksOverdue - a.weeksOverdue);
  });

  // Obtenir les clients avec produits en retard, triés par nom
  const clientsWithOverdueProducts = Array.from(overdueProductsByClient.keys())
    .map(clientId => clients.find(c => c.id === clientId))
    .filter(Boolean)
    .sort((a, b) => (a!.nomEntreprise || a!.nom).localeCompare(b!.nomEntreprise || b!.nom));

  const totalOverdueProducts = Array.from(overdueProductsByClient.values())
    .reduce((sum, products) => sum + products.length, 0);

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
              <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
              Commandes en retard
            </h1>
            <p className="text-gray-600">
              {totalOverdueProducts} produit{totalOverdueProducts > 1 ? 's' : ''} en retard de commande chez {clientsWithOverdueProducts.length} client{clientsWithOverdueProducts.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {totalOverdueProducts === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune commande en retard !</h3>
          <p className="text-gray-500">Tous vos clients sont à jour avec leurs commandes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {clientsWithOverdueProducts.map((client) => {
              const clientProducts = overdueProductsByClient.get(client!.id) || [];
              const isExpanded = expandedClients.has(client!.id);
              const totalProducts = clientProducts.length;
              const maxWeeksOverdue = Math.max(...clientProducts.map(p => p.weeksOverdue));
              
              return (
                <div key={client!.id} className="bg-white">
                  {/* Client Header */}
                  <div 
                    className="px-6 py-4 cursor-pointer hover:bg-red-25 transition-colors duration-200"
                    onClick={() => toggleClientExpansion(client!.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <User className="h-5 w-5 text-red-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{client!.nomEntreprise || client!.nom}</h3>
                          {client!.email && (
                            <p className="text-sm text-gray-500">{client!.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{totalProducts}</div>
                          <div className="text-xs text-gray-500">Produits en retard</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-red-600">{maxWeeksOverdue} semaines</div>
                          <div className="text-xs text-gray-500">Retard maximum</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClient(client!);
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors duration-200"
                        >
                          Voir fiche
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Client Products (Expanded) */}
                  {isExpanded && (
                    <div className="bg-red-25">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-red-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                                Catégorie
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                                Produit
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                                Prévu pour
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                                Retard
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                                Priorité
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {clientProducts.map((item, index) => {
                              const priority = item.weeksOverdue >= 4 ? 'high' : item.weeksOverdue >= 2 ? 'medium' : 'low';
                              const priorityColor = priority === 'high' ? 'bg-red-100 text-red-800' : 
                                                  priority === 'medium' ? 'bg-orange-100 text-orange-800' : 
                                                  'bg-yellow-100 text-yellow-800';
                              const priorityText = priority === 'high' ? 'Urgent' : 
                                                 priority === 'medium' ? 'Important' : 
                                                 'Normal';

                              return (
                                <tr 
                                  key={`${item.productName}-${index}`}
                                  className={`hover:bg-red-50 transition-colors duration-150 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-red-25'
                                  }`}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {categoryNames[item.productCategory] || item.productCategory}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {formatWeek(item.nextOrderPrediction.week, item.nextOrderPrediction.year)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      {item.weeksOverdue} semaine{item.weeksOverdue > 1 ? 's' : ''}
                                    </span>
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
            })}
          </div>
        </div>
      )}
    </div>
  );
}