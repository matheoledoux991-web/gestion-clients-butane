import React, { useState, useMemo } from 'react';
import { Client, Order } from '../types';
import { calculateClientStats, formatWeek, formatCurrency, getWeekStatus } from '../utils/calculations';
import { Search as SearchIcon, User, Package, TrendingUp, Calendar, Filter, X } from 'lucide-react';

interface SearchProps {
  clients: Client[];
  orders: Order[];
  onSelectClient: (client: Client) => void;
}

export function Search({ clients, orders, onSelectClient }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hasOrders: false,
    needsFollowup: false,
    overdue: false,
  });

  // Trier les clients par ordre alphabétique
  const sortedClients = [...clients].sort((a, b) => a.nom.localeCompare(b.nom));

  const filteredResults = useMemo(() => {
    let results = sortedClients.filter(client =>
      (client.nomEntreprise || client.nom).toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone.includes(searchTerm) ||
      (client.codePostal && client.codePostal.includes(searchTerm)) ||
      (client.rue && client.rue.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.ville && client.ville.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filters.hasOrders || filters.needsFollowup || filters.overdue) {
      results = results.filter(client => {
        const clientOrders = orders.filter(order => order.clientId === client.id);
        const stats = calculateClientStats(clientOrders);

        if (filters.hasOrders && clientOrders.length === 0) return false;
        
        if (filters.needsFollowup) {
          if (!stats.nextOrderPrediction) return false;
          const status = getWeekStatus(stats.nextOrderPrediction);
          if (!(status.weeksUntil <= 2 && status.weeksUntil >= 0)) return false;
        }

        if (filters.overdue) {
          if (!stats.nextOrderPrediction) return false;
          const status = getWeekStatus(stats.nextOrderPrediction);
          if (!(status.weeksUntil < 0)) return false;
        }

        return true;
      });
    }

    return results;
  }, [searchTerm, sortedClients, orders, filters]);

  const handleFilterChange = (filterKey: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const clearFilters = () => {
    setFilters({
      hasOrders: false,
      needsFollowup: false,
      overdue: false,
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recherche client</h1>
        <p className="text-gray-600">Trouvez rapidement vos clients et consultez leurs informations</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, email, téléphone, rue ou ville..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg transition-colors duration-200 flex items-center font-medium ${
                showFilters || activeFiltersCount > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasOrders}
                  onChange={() => handleFilterChange('hasOrders')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Clients avec commandes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.needsFollowup}
                  onChange={() => handleFilterChange('needsFollowup')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Relance nécessaire</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.overdue}
                  onChange={() => handleFilterChange('overdue')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">En retard</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredResults.length === 0 && searchTerm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
            <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
            <p className="text-gray-500">Aucun client ne correspond à votre recherche</p>
          </div>
        )}

        {filteredResults.map((client) => {
          const clientOrders = orders.filter(order => order.clientId === client.id);
          const stats = calculateClientStats(clientOrders);
          
          let statusColor = 'bg-gray-100 text-gray-800';
          let statusText = 'Aucune commande';
          
          if (stats.nextOrderPrediction) {
            const status = getWeekStatus(stats.nextOrderPrediction);
            statusColor = status.color;
            statusText = status.text;
          }

          return (
            <div
              key={client.id}
              onClick={() => onSelectClient(client)}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <User className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">{client.nom}</h3>
                    <h3 className="text-lg font-semibold text-gray-900">{client.nomEntreprise || client.nom}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {client.email && <p>{client.email}</p>}
                    {client.telephone && <p>{client.telephone}</p>}
                    {(client.rue || client.ville) && (
                      <p className="truncate">
                        {client.rue && client.ville && client.codePostal 
                          ? `${client.rue}, ${client.codePostal} ${client.ville}` 
                          : client.rue && client.ville 
                            ? `${client.rue}, ${client.ville}`
                            : client.rue || (client.codePostal && client.ville ? `${client.codePostal} ${client.ville}` : client.ville)
                        }
                      </p>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                  {statusText}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Package className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-xs text-gray-500">Commandes</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                    <span className="text-xs text-gray-500">Consommation/mois</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.monthlyConsumption)} kg</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="h-4 w-4 text-indigo-500 mr-1" />
                    <span className="text-xs text-gray-500">Dernière commande</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {stats.lastOrder ? formatWeek(stats.lastOrder.week, stats.lastOrder.year) : 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-xs text-gray-500">Prochaine prévue</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {stats.nextOrderPrediction ? formatWeek(stats.nextOrderPrediction.week, stats.nextOrderPrediction.year) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!searchTerm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
          <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Rechercher un client</h3>
          <p className="text-gray-500">Utilisez la barre de recherche pour trouver vos clients</p>
        </div>
      )}
    </div>
  );
}