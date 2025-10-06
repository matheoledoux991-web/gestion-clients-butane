import React from 'react';
import { Client, Order } from '../types';
import { calculateProductPredictions, getCurrentWeek, formatWeek } from '../utils/calculations';
import { ArrowLeft, Clock, User, Package, ChevronDown, ChevronRight } from 'lucide-react';

interface UpcomingOrdersPageProps {
  clients: Client[];
  orders: Order[];
  onBack: () => void;
  onSelectClient: (client: Client) => void;
}

export function UpcomingOrdersPage({ clients, orders, onBack, onSelectClient }: UpcomingOrdersPageProps) {
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

  // Calculer toutes les prédictions par produit à venir
  const upcomingProductsByClient = new Map<string, Array<{
    client: Client;
    productName: string;
    productCategory: string;
    nextOrderPrediction: { week: number; year: number };
    weeksUntil: number;
  }>>();

  clients.forEach(client => {
    const clientOrders = orders.filter(order => order.clientId === client.id);
    const predictions = calculateProductPredictions(clientOrders);
    
    predictions.forEach(prediction => {
      const currentWeek = getCurrentWeek();
      const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;
      const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
      const weeksUntil = targetWeekOfYear - currentWeekOfYear;
      
      if (weeksUntil >= 0) {
        if (!upcomingProductsByClient.has(client.id)) {
          upcomingProductsByClient.set(client.id, []);
        }
        upcomingProductsByClient.get(client.id)!.push({
          client,
          productName: prediction.productName,
          productCategory: prediction.productCategory,
          nextOrderPrediction: prediction.nextOrderPrediction,
          weeksUntil
        });
      }
    });
  });

  // Trier les produits de chaque client par proximité
  upcomingProductsByClient.forEach((products) => {
    products.sort((a, b) => a.weeksUntil - b.weeksUntil);
  });

  // Obtenir les clients avec produits à venir, triés par nom
  const clientsWithUpcomingProducts = Array.from(upcomingProductsByClient.keys())
    .map(clientId => clients.find(c => c.id === clientId))
    .filter(Boolean)
    .sort((a, b) => (a!.nomEntreprise || a!.nom).localeCompare(b!.nomEntreprise || b!.nom));

  const totalUpcomingProducts = Array.from(upcomingProductsByClient.values())
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
              <Clock className="h-8 w-8 text-yellow-500 mr-3" />
              Commandes attendues
            </h1>
            <p className="text-gray-600">
              {totalUpcomingProducts} produit{totalUpcomingProducts > 1 ? 's' : ''} avec commande prévue prochainement chez {clientsWithUpcomingProducts.length} client{clientsWithUpcomingProducts.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {totalUpcomingProducts === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune commande prévue</h3>
          <p className="text-gray-500">Aucune prédiction de commande disponible pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {clientsWithUpcomingProducts.map((client) => {
              const clientProducts = upcomingProductsByClient.get(client!.id) || [];
              const isExpanded = expandedClients.has(client!.id);
              const totalProducts = clientProducts.length;
              const minWeeksUntil = Math.min(...clientProducts.map(p => p.weeksUntil));
              
              return (
                <div key={client!.id} className="bg-white">
                  {/* Client Header */}
                  <div 
                    className="px-6 py-4 cursor-pointer hover:bg-yellow-25 transition-colors duration-200"
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
                        <Clock className="h-5 w-5 text-yellow-600 mr-3" />
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
                          <div className="text-xs text-gray-500">Produits attendus</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-medium ${minWeeksUntil === 0 ? 'text-red-600' : minWeeksUntil <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {minWeeksUntil === 0 ? 'Cette semaine' : `${minWeeksUntil} semaines`}
                          </div>
                          <div className="text-xs text-gray-500">Plus proche</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClient(client!);
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors duration-200"
                        >
                          Voir fiche
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Client Products (Expanded) */}
                  {isExpanded && (
                    <div className="bg-yellow-25">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-yellow-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                                Catégorie
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                                Produit
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                                Prévu pour
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                                Dans
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                                Urgence
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {clientProducts.map((item, index) => {
                              const isUrgent = item.weeksUntil <= 2;
                              const urgencyColor = item.weeksUntil === 0 ? 'bg-red-100 text-red-800' :
                                                 item.weeksUntil <= 2 ? 'bg-yellow-100 text-yellow-800' :
                                                 'bg-green-100 text-green-800';
                              const urgencyText = item.weeksUntil === 0 ? 'Cette semaine' :
                                                item.weeksUntil <= 2 ? 'Urgent' :
                                                'Normal';

                              return (
                                <tr 
                                  key={`${item.productName}-${index}`}
                                  className={`hover:bg-yellow-50 transition-colors duration-150 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-yellow-25'
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
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyColor}`}>
                                      {item.weeksUntil === 0 ? 'Cette semaine' : `${item.weeksUntil} semaine${item.weeksUntil > 1 ? 's' : ''}`}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyColor}`}>
                                      {urgencyText}
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