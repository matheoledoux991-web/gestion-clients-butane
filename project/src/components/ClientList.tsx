import React, { useState } from 'react';
import { Client, Order } from '../types';
import { ClientForm } from './ClientForm';
import { ConfirmDialog } from './ConfirmDialog';
import { calculateClientStats, formatWeek } from '../utils/calculations';
import { Plus, CreditCard as Edit2, Mail, Phone, MapPin, TrendingUp, Calendar, Package, Trash2, Search } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  orders: Order[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient: (id: string, client: Omit<Client, 'id' | 'createdAt'>) => void;
  onSelectClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export function ClientList({ clients, orders, onAddClient, onUpdateClient, onSelectClient, onDeleteClient }: ClientListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Trier les clients par ordre alphabétique
  const filteredAndSortedClients = [...clients]
    .filter(client => 
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.telephone && client.telephone.includes(searchTerm)) ||
      (client.rue && client.rue.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.ville && client.ville.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const handleSaveClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      onUpdateClient(editingClient.id, clientData);
    } else {
      onAddClient(clientData);
    }
    setShowForm(false);
    setEditingClient(undefined);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingClient(undefined);
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
  };

  const confirmDeleteClient = () => {
    if (clientToDelete) {
      onDeleteClient(clientToDelete.id);
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des clients</h1>
          <p className="text-gray-600">Gérez vos clients et consultez leurs statistiques</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un client..."
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 w-80"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouveau client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedClients.map((client) => {
          const clientOrders = orders.filter(order => order.clientId === client.id);
          const stats = calculateClientStats(clientOrders);

          return (
            <div
              key={client.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => onSelectClient(client)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">
                    {client.nomEntreprise || client.nom}
                  </h3>
                </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClient(client);
                      }}
                      className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClient(client);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                <div className="space-y-2 mb-4">
                  {client.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.telephone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{client.telephone}</span>
                    </div>
                  )}
                  {(client.rue || client.ville) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">
                        {client.rue && client.ville && client.codePostal 
                          ? `${client.rue}, ${client.codePostal} ${client.ville}` 
                          : client.rue && client.ville 
                            ? `${client.rue}, ${client.ville}`
                            : client.rue || (client.codePostal && client.ville ? `${client.codePostal} ${client.ville}` : client.ville)
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <p className="text-lg font-semibold text-gray-900">{stats.monthlyConsumption.toFixed(0)} kg</p>
                    </div>
                  </div>

                  {stats.nextOrderPrediction && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Prochaine commande prévue</p>
                          <p className="text-sm font-semibold text-blue-800">
                            {formatWeek(stats.nextOrderPrediction.week, stats.nextOrderPrediction.year)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {clients.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Package className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client</h3>
            <p className="text-gray-500 mb-6">Commencez par ajouter votre premier client</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Ajouter un client
            </button>
          </div>
        )}
        
        {clients.length > 0 && filteredAndSortedClients.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Search className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
            <p className="text-gray-500 mb-6">Aucun client ne correspond à votre recherche "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Effacer la recherche
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <ClientForm
          client={editingClient}
          onSave={handleSaveClient}
          onCancel={handleCancelForm}
        />
      )}

      {clientToDelete && (
        <ConfirmDialog
          title="Supprimer le client"
          message={`Êtes-vous sûr de vouloir supprimer le client "${clientToDelete.nom}" ? Cette action supprimera également toutes ses commandes et ne peut pas être annulée.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={confirmDeleteClient}
          onCancel={() => setClientToDelete(null)}
          type="danger"
        />
      )}
    </div>
  );
}