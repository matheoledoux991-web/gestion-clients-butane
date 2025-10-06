export interface Client {
  id: string;
  nom: string;
  prenom: string;
  nomEntreprise: string;
  email: string;
  telephone: string;
  codePostal: string;
  rue: string;
  ville: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  clientId: string;
  orderNumber?: string;
  weekNumber: number;
  year: number;
  deliveryWeek?: number;
  deliveryYear?: number;
  dayOfWeek?: string;
  closureDays?: string[];
  deliveryInstructions?: string;
  products: OrderProduct[];
  total: number;
}

export interface OrderProduct {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unit: string;
  color?: string; // Pour compatibilité avec les anciennes commandes
  colors?: string[];
  couvAT?: string; // Pour les pots
  impressionColor?: string; // Pour les pots
}

export interface ClientStats {
  totalOrders: number;
  averageWeeksBetweenOrders: number;
  weeklyConsumption: number;
  monthlyConsumption: number;
  lastOrderDuration: number;
  nextOrderPrediction: { week: number; year: number } | null;
  lastOrder: { week: number; year: number } | null;
  weeksUntilNextOrder: number;
}

export interface Notification {
  id: string;
  type: 'overdue' | 'upcoming' | 'inactive';
  title: string;
  message: string;
  clientId: string;
  clientName: string;
  productName?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}