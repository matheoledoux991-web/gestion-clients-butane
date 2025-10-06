import React, { useState, useEffect } from 'react';
import { Client, Order } from './types';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { clientService, orderService } from './services/supabase';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ClientList } from './components/ClientList';
import { ClientDetail } from './components/ClientDetail';
import { ClientForm } from './components/ClientForm';
import { OrderList } from './components/OrderList';
import { Search } from './components/Search';
import { OverdueOrdersPage } from './components/OverdueOrdersPage';
import { UpcomingOrdersPage } from './components/UpcomingOrdersPage';
import { InactiveClientsPage } from './components/InactiveClientsPage';
import { LogOut } from 'lucide-react';

function App() {
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useNotifications(clients, orders);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les données depuis Firestore
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [clientsData, ordersData] = await Promise.all([
          clientService.getClients(),
          orderService.getOrders()
        ]);
        setClients(clientsData);
        setOrders(ordersData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Écouter les changements en temps réel
    const unsubscribeClients = clientService.onClientsChange(setClients);
    const unsubscribeOrders = orderService.onOrdersChange(setOrders);

    return () => {
      unsubscribeClients();
      unsubscribeOrders();
    };
  }, [isAuthenticated]);

  // Client management
  const handleAddClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      console.log('Adding client:', clientData);
      const clientId = await clientService.addClient(clientData);
      console.log('Client added successfully with ID:', clientId);
      alert('Client ajouté avec succès!');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du client:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Impossible d\'ajouter le client'}`);
    }
  };

  const handleUpdateClient = async (id: string, clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      await clientService.updateClient(id, clientData);
      if (selectedClient?.id === id) {
        setSelectedClient({ ...selectedClient, ...clientData });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setActiveTab('client-detail');
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
  };

  const handleSaveEditClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      await handleUpdateClient(editingClient.id, clientData);
      setEditingClient(null);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      // Supprimer d'abord toutes les commandes du client
      const clientOrders = orders.filter(order => order.clientId === id);
      await Promise.all(clientOrders.map(order => orderService.deleteOrder(order.id)));
      
      // Puis supprimer le client
      await clientService.deleteClient(id);
      
      // Si le client supprimé était sélectionné, revenir à la liste
      if (selectedClient?.id === id) {
        setSelectedClient(null);
        setActiveTab('clients');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
    }
  };

  // Order management
  const handleAddOrder = async (orderData: Omit<Order, 'id'>) => {
    try {
      console.log('Adding order:', orderData);
      const orderId = await orderService.addOrder(orderData);
      console.log('Order added successfully with ID:', orderId);
      alert('Commande ajoutée avec succès!');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la commande:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Impossible d\'ajouter la commande'}`);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await orderService.deleteOrder(id);
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setClients([]);
      setOrders([]);
      setActiveTab('dashboard');
      setSelectedClient(null);
      setEditingClient(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleSelectClientFromNotification = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      handleSelectClient(client);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      );
    }

    if (activeTab === 'client-detail' && selectedClient) {
      return (
        <ClientDetail
          client={selectedClient}
          orders={orders}
          onBack={() => {
            setSelectedClient(null);
            setActiveTab('clients');
          }}
          onAddOrder={handleAddOrder}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
        />
      );
    }

    if (activeTab === 'overdue-orders') {
      return (
        <OverdueOrdersPage
          clients={clients}
          orders={orders}
          onBack={() => setActiveTab('dashboard')}
          onSelectClient={handleSelectClient}
        />
      );
    }

    if (activeTab === 'upcoming-orders') {
      return (
        <UpcomingOrdersPage
          clients={clients}
          orders={orders}
          onBack={() => setActiveTab('dashboard')}
          onSelectClient={handleSelectClient}
        />
      );
    }

    if (activeTab === 'inactive-clients') {
      return (
        <InactiveClientsPage
          clients={clients}
          orders={orders}
          onBack={() => setActiveTab('dashboard')}
          onSelectClient={handleSelectClient}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            clients={clients} 
            orders={orders} 
            onSelectClient={handleSelectClient}
            onShowOverdueOrders={() => setActiveTab('overdue-orders')}
            onShowUpcomingOrders={() => setActiveTab('upcoming-orders')}
            onShowInactiveClients={() => setActiveTab('inactive-clients')}
          />
        );
      case 'clients':
        return (
          <ClientList
            clients={clients}
            orders={orders}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onSelectClient={handleSelectClient}
            onDeleteClient={handleDeleteClient}
          />
        );
      case 'orders':
        return (
          <OrderList
            clients={clients}
            orders={orders}
            onAddOrder={handleAddOrder}
            onDeleteOrder={handleDeleteOrder}
          />
        );
      case 'search':
        return (
          <Search
            clients={clients}
            orders={orders}
            onSelectClient={handleSelectClient}
          />
        );
      default:
        return (
          <Dashboard 
            clients={clients} 
            orders={orders} 
            onSelectClient={handleSelectClient}
            onShowOverdueOrders={() => setActiveTab('overdue-orders')}
            onShowUpcomingOrders={() => setActiveTab('upcoming-orders')}
            onShowInactiveClients={() => setActiveTab('inactive-clients')}
          />
        );
    }
  };

  // Afficher l'écran de chargement pendant la vérification de l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Afficher l'écran de connexion si l'utilisateur n'est pas authentifié
  if (!user && !authLoading) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onClearAllNotifications={clearAllNotifications}
        onSelectClient={handleSelectClientFromNotification}
      />
      
      {/* Bouton de déconnexion */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center text-sm font-medium shadow-lg"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </button>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {editingClient && (
        <ClientForm
          client={editingClient}
          onSave={handleSaveEditClient}
          onCancel={() => setEditingClient(null)}
        />
      )}
    </div>
  );
}

export default App;