import React, { useState } from 'react';
import { Client, Order } from '../types';
import { OrderForm } from './OrderForm';
import { calculateClientStats, formatWeek, formatCurrency, getWeekStatus, calculateProductPredictions, getCurrentWeek } from '../utils/calculations';
import { ConsumptionChart } from './ConsumptionChart';
import { 
  ArrowLeft, 
  Plus, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  TrendingUp, 
  Calendar,
  Clock, 
  BarChart3,
  Edit2,
  Trash2,
  Bug,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { exportClientToPDF } from '../utils/pdfExport';

interface ClientDetailProps {
  client: Client;
  orders: Order[];
  onBack: () => void;
  onAddOrder: (order: Omit<Order, 'id'>) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export function ClientDetail({ client, orders, onBack, onAddOrder, onEditClient, onDeleteClient }: ClientDetailProps) {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('total');
  
  const clientOrders = orders.filter(order => order.clientId === client.id);
  const stats = calculateClientStats(clientOrders);
  
  const sortedOrders = clientOrders.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });

  // Obtenir tous les produits uniques commandés par ce client
  const getUniqueProducts = () => {
    const products = new Set<string>();
    clientOrders.forEach(order => {
      if (order.products && order.products.length > 0) {
        order.products.forEach(product => {
          products.add(product.name);
        });
      } else {
        // Fallback pour les anciennes commandes - vérifier si les champs existent
        if ((order as any).bob35 !== undefined && (order as any).bob35 > 0) products.add('bob35');
        if ((order as any).f50x70 !== undefined && (order as any).f50x70 > 0) products.add('f50x70');
        if ((order as any).f35x50 !== undefined && (order as any).f35x50 > 0) products.add('f35x50');
        if ((order as any).f25x35 !== undefined && (order as any).f25x35 > 0) products.add('f25x35');
        if ((order as any).f32x35 !== undefined && (order as any).f32x35 > 0) products.add('f32x35');
      }
    });
    return Array.from(products).sort();
  };

  const uniqueProducts = getUniqueProducts();

  // Calculer la consommation pour un produit spécifique
  const calculateProductConsumption = (productName: string) => {
    if (productName === 'total') {
      return {
        weeklyConsumption: stats.weeklyConsumption,
        monthlyConsumption: stats.monthlyConsumption
      };
    }

    if (clientOrders.length < 2) {
      return { weeklyConsumption: 0, monthlyConsumption: 0 };
    }

    // Trier par ordre chronologique (plus ancienne en premier)
    const chronologicalOrders = [...sortedOrders].reverse();
    
    // Prendre de la première à l'avant-dernière commande
    const firstToSecondLast = chronologicalOrders.slice(0, -1);
    
    // Calculer le total pour ce produit spécifique
    const totalProductQuantity = firstToSecondLast.reduce((sum, order) => {
      if (order.products && order.products.length > 0) {
        // Nouvelle structure avec products array
        const product = order.products.find(p => p.name === productName);
        return sum + (product ? product.quantity : 0);
      } else {
        // Fallback pour les anciennes commandes avec structure directe
        switch (productName) {
          case 'bob35': return sum + ((order as any).bob35 || 0);
          case 'f50x70': return sum + ((order as any).f50x70 || 0);
          case 'f35x50': return sum + ((order as any).f35x50 || 0);
          case 'f25x35': return sum + ((order as any).f25x35 || 0);
          case 'f32x35': return sum + ((order as any).f32x35 || 0);
          case 'bob50': return sum + ((order as any).bob50 || 0);
          case 'f25x32': return sum + ((order as any).f25x32 || 0);
          case 'f32x50': return sum + ((order as any).f32x50 || 0);
          case 'f50x65': return sum + ((order as any).f50x65 || 0);
          case 'f32x32_5': return sum + ((order as any).f32x32_5 || 0);
          case 'bob32_5': return sum + ((order as any).bob32_5 || 0);
          default: return sum;
        }
      }
    }, 0);
    
    // Écart total entre la première et la dernière commande
    const firstOrder = chronologicalOrders[0];
    const lastOrder = chronologicalOrders[chronologicalOrders.length - 1];
    
    const firstWeekOfYear = firstOrder.year * 52 + firstOrder.weekNumber;
    const lastWeekOfYear = lastOrder.year * 52 + lastOrder.weekNumber;
    const totalWeeksSpan = lastWeekOfYear - firstWeekOfYear;
    
    if (totalWeeksSpan > 0) {
      const weeklyConsumption = totalProductQuantity / totalWeeksSpan;
      const monthlyConsumption = weeklyConsumption * 4.33;
      return {
        weeklyConsumption: Math.round(weeklyConsumption * 100) / 100,
        monthlyConsumption: Math.round(monthlyConsumption * 100) / 100
      };
    }

    return { weeklyConsumption: 0, monthlyConsumption: 0 };
  };

  const productConsumption = calculateProductConsumption(selectedProduct);
  const handleSaveOrder = (orderData: Omit<Order, 'id'>) => {
    onAddOrder(orderData);
    setShowOrderForm(false);
  };

  const handleExportPDF = async () => {
    try {
      await exportClientToPDF(client, clientOrders);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const handleDeleteClient = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.nom}" ? Cette action supprimera également toutes ses commandes et ne peut pas être annulée.`)) {
      onDeleteClient(client.id);
    }
  };

  const getStatusInfo = () => {
    if (!stats.nextOrderPrediction) {
      return { color: 'bg-gray-100 text-gray-800', text: 'Aucune prévision' };
    }
    
    return getWeekStatus(stats.nextOrderPrediction);
  };

  const statusInfo = getStatusInfo();

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
            <h1 className="text-3xl font-bold text-gray-900">{client.nomEntreprise || client.nom}</h1>
            <p className="text-gray-600">Détails client et historique des commandes</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportPDF}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center font-medium shadow-lg"
          >
            <FileText className="h-5 w-5 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => onEditClient(client)}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center font-medium shadow-lg"
          >
            <Edit2 className="h-5 w-5 mr-2" />
            Modifier
          </button>
          <button
            onClick={handleDeleteClient}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center font-medium shadow-lg"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Supprimer
          </button>
          <button
            onClick={() => setShowOrderForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <User className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Informations client</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {client.email && (
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{client.email}</p>
              </div>
            </div>
          )}
          {client.telephone && (
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-medium text-gray-900">{client.telephone}</p>
              </div>
            </div>
          )}
          {(client.rue || client.ville) && (
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-medium text-gray-900">
                  {client.rue && client.ville && client.codePostal 
                    ? `${client.rue}, ${client.codePostal} ${client.ville}` 
                    : client.rue && client.ville 
                      ? `${client.rue}, ${client.ville}`
                      : client.rue || (client.codePostal && client.ville ? `${client.codePostal} ${client.ville}` : client.ville)
                  }
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Client depuis</p>
              <p className="font-medium text-gray-900">{new Date(client.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Client-specific Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produits en retard pour ce client */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Produits en retard</h3>
          </div>
          <div className="space-y-3">
            {(() => {
              const predictions = calculateProductPredictions(clientOrders);
              const currentWeek = getCurrentWeek();
              const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;
              
              const overdueProducts = predictions.filter(prediction => {
                const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
                const weeksUntilNextOrder = targetWeekOfYear - currentWeekOfYear;
                return weeksUntilNextOrder < 0;
              });
              
              return overdueProducts.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun produit en retard</p>
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
                  const currentWeekOfYear = getCurrentWeek().year * 52 + getCurrentWeek().week;
                  const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
                  const weeksUntilNextOrder = targetWeekOfYear - currentWeekOfYear;
                  
                  return (
                    <div key={`${prediction.productName}-${index}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <p className="font-medium text-gray-900">{categoryName} - {prediction.productName}</p>
                        <p className="text-sm text-red-600">
                          Prévu pour {formatWeek(prediction.nextOrderPrediction.week, prediction.nextOrderPrediction.year)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          En retard ({Math.abs(weeksUntilNextOrder)} semaines)
                        </span>
                      </div>
                    </div>
                  );
                })
              );
            })()}
          </div>
        </div>

        {/* Prochaines commandes prévues pour ce client */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Prochaines commandes prévues</h3>
          </div>
          <div className="space-y-3">
            {(() => {
              const predictions = calculateProductPredictions(clientOrders);
              const currentWeek = getCurrentWeek();
              const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;
              
              const upcomingProducts = predictions.filter(prediction => {
                const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
                const weeksUntilNextOrder = targetWeekOfYear - currentWeekOfYear;
                return weeksUntilNextOrder >= 0;
              });
              
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
                  const currentWeekOfYear = getCurrentWeek().year * 52 + getCurrentWeek().week;
                  const targetWeekOfYear = prediction.nextOrderPrediction.year * 52 + prediction.nextOrderPrediction.week;
                  const weeksUntilNextOrder = targetWeekOfYear - currentWeekOfYear;
                  const isUrgent = weeksUntilNextOrder <= 2;
                  
                  return (
                    <div key={`${prediction.productName}-${index}`} className={`flex items-center justify-between p-3 rounded-lg border ${
                      isUrgent ? 'bg-yellow-50 border-yellow-100' : 'bg-blue-50 border-blue-100'
                    }`}>
                      <div>
                        <p className="font-medium text-gray-900">{categoryName} - {prediction.productName}</p>
                        <p className={`text-sm ${isUrgent ? 'text-yellow-600' : 'text-blue-600'}`}>
                          Prévu pour {formatWeek(prediction.nextOrderPrediction.week, prediction.nextOrderPrediction.year)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isUrgent ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {weeksUntilNextOrder === 0 ? 'Cette semaine' : `Dans ${weeksUntilNextOrder} semaine${weeksUntilNextOrder > 1 ? 's' : ''}`}
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

      {/* Product Consumption Selector */}
      {uniqueProducts.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Consommation par produit</h2>
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Produit :</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-sm"
              >
                <option value="total">Total général</option>
                {uniqueProducts.map(product => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">Consommation hebdomadaire</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(productConsumption.weeklyConsumption)} {(() => {
                  if (selectedProduct === 'total') return 'kg';
                  // Vérifier si le produit sélectionné est du papier
                  const productOrders = clientOrders.filter(order => 
                    order.products && order.products.some(p => p.name === selectedProduct)
                  );
                  if (productOrders.length > 0) {
                    const productInfo = productOrders[0].products?.find(p => p.name === selectedProduct);
                    if (productInfo && (productInfo.category === 'papier_thermo' || productInfo.category === 'papier_paraffine')) {
                      return 'kg';
                    }
                  }
                  return 'unités';
                })()}
              </p>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-indigo-800">Consommation semaine</span>
              </div>
              <p className="text-2xl font-bold text-indigo-900">
                {formatCurrency(productConsumption.monthlyConsumption)} {(() => {
                  if (selectedProduct === 'total') return 'kg';
                  // Vérifier si le produit sélectionné est du papier
                  const productOrders = clientOrders.filter(order => 
                    order.products && order.products.some(p => p.name === selectedProduct)
                  );
                  if (productOrders.length > 0) {
                    const productInfo = productOrders[0].products?.find(p => p.name === selectedProduct);
                    if (productInfo && (productInfo.category === 'papier_thermo' || productInfo.category === 'papier_paraffine')) {
                      return 'kg';
                    }
                  }
                  return 'unités';
                })()}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Produit sélectionné :</strong> {selectedProduct}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedProduct === 'total' 
                ? 'Calcul basé sur le total de toutes les commandes (première à avant-dernière), réparties sur la période totale.'
                : productConsumption.weeklyConsumption > 0 
                  ? 'Calcul basé sur les quantités de ce produit spécifique (première à avant-dernière commande), réparties sur la période totale.'
                  : 'Aucune donnée pour ce produit dans les commandes existantes. Vous devez d\'abord renseigner les quantités de ce produit dans vos commandes.'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-gray-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Consommation par produit</h2>
          </div>
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun détail de produit</h3>
            <p className="text-gray-500 mb-4">
              Les commandes existantes ne contiennent que le total global.
            </p>
            <p className="text-sm text-gray-400">
              Les nouvelles commandes incluront automatiquement les détails par produit.
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Consommation/mois</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyConsumption)} kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100">
              <Clock className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Écart moyen (semaines)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageWeeksBetweenOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Consommation/semaine</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.weeklyConsumption)} kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Order Prediction */}
      {stats.nextOrderPrediction && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Prochaine commande prévue</h3>
              <p className="text-2xl font-bold text-blue-800">
                {formatWeek(stats.nextOrderPrediction.week, stats.nextOrderPrediction.year)}
              </p>
              <p className="text-blue-600 mt-1">
                Basé sur un écart moyen de {stats.averageWeeksBetweenOrders} semaines entre les commandes
              </p>
            </div>
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Orders History */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Historique des commandes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N°
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semaine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livraison
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedOrders.map((order, index) => (
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
                    <div className="text-sm font-medium text-gray-900">
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
                        <span className="text-gray-400 text-xs">Non spécifiée</span>
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
                                {product.name}
                                {product.color && (
                                  <span className="text-blue-600 ml-1">({product.color})</span>
                                )}
                              </span>
                              <span className="font-medium">{product.quantity} {product.unit}</span>
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
                      {(() => {
                        if (order.products && order.products.length > 0) {
                          // Vérifier si tous les produits sont du papier (thermo ou paraffiné)
                          const allPaper = order.products.every(p => 
                            p.category === 'papier_thermo' || p.category === 'papier_paraffine'
                          );
                          return `${order.total} ${allPaper ? 'kg' : 'unités'}`;
                        }
                        return `${order.total} kg`; // Anciennes commandes
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {clientOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
            <p className="text-gray-500 mb-6">Ce client n'a pas encore passé de commande</p>
            <button
              onClick={() => setShowOrderForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Première commande
            </button>
          </div>
        )}
      </div>

      {showOrderForm && (
        <OrderForm
          clients={[client]}
          selectedClient={client}
          onSave={handleSaveOrder}
          onCancel={() => setShowOrderForm(false)}
        />
      )}
    </div>
  );
}