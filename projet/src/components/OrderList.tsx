import React, { useState } from 'react';
import { Client, Order, OrderProduct } from '../types';
import { OrderForm } from './OrderForm';
import { ConfirmDialog } from './ConfirmDialog';
import { formatWeek, formatCurrency } from '../utils/calculations';
import { Plus, Calendar, Package, User, Download, Trash2, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { Search } from 'lucide-react';
import { exportOrderToBF } from '../utils/bfExport';

interface OrderListProps {
  clients: Client[];
  orders: Order[];
  onAddOrder: (order: Omit<Order, 'id'>) => void;
  onDeleteOrder: (id: string) => void;
}

export function OrderList({ clients, orders, onAddOrder, onDeleteOrder }: OrderListProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [sortField, setSortField] = useState<'week' | 'total' | 'client'>('client');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterClient, setFilterClient] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const handleSaveOrder = (orderData: Omit<Order, 'id'>) => {
    onAddOrder(orderData);
    setShowForm(false);
    setSelectedClient(undefined);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedClient(undefined);
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
  };

  const handleExportBF = async (order: Order) => {
    try {
      const client = clients.find(c => c.id === order.clientId);
      if (client) {
        await exportOrderToBF(client, order);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export BF:', error);
      alert('Erreur lors de la génération du bon de commande. Veuillez réessayer.');
    }
  };

  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  const toggleClientExpansion = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  const handleSort = (field: 'week' | 'total' | 'client') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtrer les commandes
  const filteredOrders = orders.filter(order => {
    const client = clients.find(c => c.id === order.clientId);
    
    // Recherche par terme général
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesClient = client && client.nom.toLowerCase().includes(searchLower);
      const matchesCity = client && client.ville && client.ville.toLowerCase().includes(searchLower);
      const matchesOrderNumber = order.orderNumber && order.orderNumber.toLowerCase().includes(searchLower);
      
      if (!matchesClient && !matchesCity && !matchesOrderNumber) {
        return false;
      }
    }
    
    if (filterClient && client && !client.nom.toLowerCase().includes(filterClient.toLowerCase())) {
      return false;
    }
    
    if (filterYear && order.year.toString() !== filterYear) {
      return false;
    }
    
    return true;
  });

  // Grouper les commandes par client
  const ordersByClient = new Map<string, Order[]>();
  
  filteredOrders.forEach(order => {
    if (!ordersByClient.has(order.clientId)) {
      ordersByClient.set(order.clientId, []);
    }
    ordersByClient.get(order.clientId)!.push(order);
  });

  // Trier les commandes de chaque client (plus récente en premier)
  ordersByClient.forEach((orders, clientId) => {
    orders.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.weekNumber - a.weekNumber;
    });
  });

  // Obtenir les clients avec commandes, triés par nom
  const clientsWithOrders = Array.from(ordersByClient.keys())
    .map(clientId => clients.find(c => c.id === clientId))
    .filter(Boolean)
    .sort((a, b) => a!.nom.localeCompare(b!.nom));

  // Obtenir les années disponibles
  const availableYears = [...new Set(orders.map(order => order.year))].sort((a, b) => b - a);

  const clearFilters = () => {
    setFilterClient('');
    setFilterYear('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterClient || filterYear || searchTerm;
  const exportToCSV = () => {
    const headers = ['Client', 'N° Commande', 'Semaine', 'Année', 'Produits', 'Total'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => {
        const client = clients.find(c => c.id === order.clientId);
        const productsText = order.products && order.products.length > 0 
          ? order.products.map(p => `${p.name}: ${p.quantity} ${p.unit}`).join('; ')
          : 'Détails non disponibles';
        return [
          `"${client ? (client.nomEntreprise || client.nom) : 'Client inconnu'}"`,
          `"${order.orderNumber || ''}"`,
          order.weekNumber,
          order.year,
          `"${productsText}"`,
          order.total
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Vérification de sécurité pour éviter les erreurs de rendu
  if (!clients || !orders) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des commandes</h1>
          <p className="text-gray-600">Enregistrez et suivez toutes les commandes</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par client, ville ou N° commande..."
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 w-80"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg transition-colors duration-200 flex items-center font-medium ${
              showFilters || hasActiveFilters
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                {[searchTerm, filterClient, filterYear].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={exportToCSV}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center font-medium shadow-lg"
          >
            <Download className="h-5 w-5 mr-2" />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par client
              </label>
              <input
                type="text"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                placeholder="Nom du client..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par année
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les années</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Effacer les filtres
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''} trouvée{filteredOrders.length > 1 ? 's' : ''}
            {hasActiveFilters && ` sur ${orders.length} au total`}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {clientsWithOrders.map((client) => {
            const clientOrders = ordersByClient.get(client!.id) || [];
            const isExpanded = expandedClients.has(client!.id);
            const totalOrders = clientOrders.length;
            const totalVolume = clientOrders.reduce((sum, order) => sum + order.total, 0);
            
            return (
              <div key={client!.id} className="bg-white">
                {/* Client Header */}
                <div 
                  className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
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
                      <User className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{client!.nom}</h3>
                        <h3 className="text-lg font-semibold text-gray-900">{client!.nomEntreprise || client!.nom}</h3>
                        {client!.email && (
                          <p className="text-sm text-gray-500">{client!.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{totalOrders}</div>
                        <div className="text-xs text-gray-500">Commandes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(totalVolume)} kg</div>
                        <div className="text-xs text-gray-500">Volume total</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Orders (Expanded) */}
                {isExpanded && (
                  <div className="bg-gray-50">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              N°
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                Semaine
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Produits
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <Package className="h-4 w-4 mr-2" />
                                Total
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {clientOrders.map((order, index) => (
                            <tr 
                              key={order.id} 
                              className={`hover:bg-gray-50 transition-colors duration-150 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {order.orderNumber || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatWeek(order.weekNumber, order.year)}
                                  {order.dayOfWeek && (
                                    <div className="text-xs text-blue-600 font-medium">
                                      {order.dayOfWeek}
                                    </div>
                                  )}
                                  {order.closureDays && order.closureDays.length > 0 && (
                                    <div className="text-xs text-red-600 font-medium">
                                      Fermé: {order.closureDays.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {order.deliveryWeek && order.deliveryYear ? (
                                    <span className="text-emerald-600 font-medium">
                                      {formatWeek(order.deliveryWeek, order.deliveryYear)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">Non spécifiée</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {order.products && order.products.length > 0 ? (
                                    <div className="space-y-1">
                                      {order.products.map((product, idx) => (
                                        <div key={idx} className="flex justify-between">
                                          <span className="text-gray-700">
                                            {(() => {
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
                                              const categoryName = categoryNames[product.category] || product.category;
                                              return (
                                                <div>
                                                  <div className="font-medium text-blue-600 text-xs">{categoryName}</div>
                                                  <div>{product.name}</div>
                                                </div>
                                              );
                                            })()}
                                            {product.color && (
                                              <span className="text-blue-600 ml-1">({product.color})</span>
                                            )}
                                            {product.colors && product.colors.length > 0 && (
                                              <span className="text-blue-600 ml-1">({product.colors.join(', ')})</span>
                                            )}
                                          </span>
                                          <span className="font-medium">
                                            {product.quantity} {
                                              (product.category === 'papier_thermo' || product.category === 'papier_paraffine') 
                                                ? 'kg' 
                                                : product.unit
                                            }
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    // Fallback pour les anciennes commandes
                                    <div className="space-y-1 text-xs text-gray-500">
                                      {(order as any).bob35 > 0 && <div>Bob 35: {formatCurrency((order as any).bob35)} kg</div>}
                                      {(order as any).f50x70 > 0 && <div>50x70: {formatCurrency((order as any).f50x70)} kg</div>}
                                      {(order as any).f35x50 > 0 && <div>35x50: {formatCurrency((order as any).f35x50)} kg</div>}
                                      {(order as any).f25x35 > 0 && <div>25x35: {formatCurrency((order as any).f25x35)} kg</div>}
                                      {(order as any).f32x35 > 0 && <div>32x35: {formatCurrency((order as any).f32x35)} kg</div>}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {order.total} {order.products && order.products.length > 0 ? 'unités' : 'kg'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleExportBF(order)}
                                    className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1"
                                    title="Exporter bon de commande fournisseur"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrder(order)}
                                    className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1"
                                    title="Supprimer la commande"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {clientsWithOrders.length === 0 && orders.length > 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Package className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
            <p className="text-gray-500 mb-6">Aucune commande ne correspond aux filtres sélectionnés</p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Effacer les filtres
            </button>
          </div>
        )}
        
        {clientsWithOrders.length === 0 && orders.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Package className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
            <p className="text-gray-500 mb-6">Commencez par enregistrer votre première commande</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Ajouter une commande
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <OrderForm
          clients={clients}
          selectedClient={selectedClient}
          onSave={handleSaveOrder}
          onCancel={handleCancelForm}
        />
      )}

      {orderToDelete && (
        <ConfirmDialog
          title="Supprimer la commande"
          message={`Êtes-vous sûr de vouloir supprimer cette commande de ${formatWeek(orderToDelete.weekNumber, orderToDelete.year)} ? Cette action ne peut pas être annulée.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={confirmDeleteOrder}
          onCancel={() => setOrderToDelete(null)}
          type="danger"
        />
      )}
    </div>
  );
}