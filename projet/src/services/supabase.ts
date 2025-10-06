import { supabase } from '../config/supabase';
import { Client, Order } from '../types';

export const clientService = {
  async addClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          nom: clientData.nom,
          prenom: clientData.prenom,
          nom_entreprise: clientData.nomEntreprise,
          email: clientData.email || '',
          telephone: clientData.telephone || '',
          code_postal: clientData.codePostal || '',
          rue: clientData.rue || '',
          ville: clientData.ville || '',
          user_id: user.id
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create client');
      return data.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du client:', error);
      throw error;
    }
  },

  async updateClient(id: string, clientData: Omit<Client, 'id' | 'createdAt'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          nom: clientData.nom,
          prenom: clientData.prenom,
          nom_entreprise: clientData.nomEntreprise,
          email: clientData.email,
          telephone: clientData.telephone,
          code_postal: clientData.codePostal,
          rue: clientData.rue,
          ville: clientData.ville
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      throw error;
    }
  },

  async deleteClient(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      throw error;
    }
  },

  async getClients(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(client => ({
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        nomEntreprise: client.nom_entreprise,
        email: client.email,
        telephone: client.telephone,
        codePostal: client.code_postal,
        rue: client.rue,
        ville: client.ville,
        createdAt: new Date(client.created_at)
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },

  onClientsChange(callback: (clients: Client[]) => void) {
    const channel = supabase
      .channel('clients_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        async () => {
          const clients = await this.getClients();
          callback(clients);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export const orderService = {
  async addOrder(orderData: Omit<Order, 'id'>): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('orders')
        .insert([{
          client_id: orderData.clientId,
          order_number: orderData.orderNumber,
          week_number: orderData.weekNumber,
          year: orderData.year,
          delivery_week: orderData.deliveryWeek,
          delivery_year: orderData.deliveryYear,
          day_of_week: orderData.dayOfWeek,
          closure_days: orderData.closureDays,
          delivery_instructions: orderData.deliveryInstructions,
          products: orderData.products,
          total: orderData.total,
          user_id: user.id
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create order');
      return data.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la commande:', error);
      throw error;
    }
  },

  async updateOrder(id: string, orderData: Omit<Order, 'id'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          client_id: orderData.clientId,
          order_number: orderData.orderNumber,
          week_number: orderData.weekNumber,
          year: orderData.year,
          delivery_week: orderData.deliveryWeek,
          delivery_year: orderData.deliveryYear,
          day_of_week: orderData.dayOfWeek,
          closure_days: orderData.closureDays,
          delivery_instructions: orderData.deliveryInstructions,
          products: orderData.products,
          total: orderData.total
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw error;
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      throw error;
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('year', { ascending: false })
        .order('week_number', { ascending: false });

      if (error) throw error;

      return (data || []).map(order => ({
        id: order.id,
        clientId: order.client_id,
        orderNumber: order.order_number,
        weekNumber: order.week_number,
        year: order.year,
        deliveryWeek: order.delivery_week,
        deliveryYear: order.delivery_year,
        dayOfWeek: order.day_of_week,
        closureDays: order.closure_days,
        deliveryInstructions: order.delivery_instructions,
        products: order.products,
        total: order.total
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw error;
    }
  },

  async getOrdersByClient(clientId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', clientId)
        .order('year', { ascending: false })
        .order('week_number', { ascending: false });

      if (error) throw error;

      return (data || []).map(order => ({
        id: order.id,
        clientId: order.client_id,
        orderNumber: order.order_number,
        weekNumber: order.week_number,
        year: order.year,
        deliveryWeek: order.delivery_week,
        deliveryYear: order.delivery_year,
        dayOfWeek: order.day_of_week,
        closureDays: order.closure_days,
        deliveryInstructions: order.delivery_instructions,
        products: order.products,
        total: order.total
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes du client:', error);
      throw error;
    }
  },

  onOrdersChange(callback: (orders: Order[]) => void) {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async () => {
          const orders = await this.getOrders();
          callback(orders);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
