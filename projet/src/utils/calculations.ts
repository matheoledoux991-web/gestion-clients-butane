import { Order, ClientStats } from '../types';

export function calculateClientStats(orders: Order[]): ClientStats {
  if (orders.length === 0) {
    return {
      totalOrders: 0,
      averageWeeksBetweenOrders: 0,
      weeklyConsumption: 0,
      monthlyConsumption: 0,
      lastOrderDuration: 0,
      nextOrderPrediction: null,
      lastOrder: null,
      weeksUntilNextOrder: 0,
    };
  }

  // Trier les commandes par année et semaine (plus récente en premier)
  const sortedOrders = orders.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });

  const lastOrder = sortedOrders[0];
  let weeklyConsumption = 0;
  let monthlyConsumption = 0;
  let averageWeeksBetweenOrders = 0;
  let nextOrderPrediction: { week: number; year: number } | null = null;

  if (orders.length === 1) {
    // NOUVELLE LOGIQUE : Pour une seule commande, prédiction automatique à 6 mois (26 semaines)
    const singleOrder = lastOrder;
    const nextWeek = singleOrder.weekNumber + 26; // 6 mois = 26 semaines
    let nextYear = singleOrder.year;
    let adjustedWeek = nextWeek;
    
    if (adjustedWeek > 52) {
      nextYear += Math.floor((adjustedWeek - 1) / 52);
      adjustedWeek = ((adjustedWeek - 1) % 52) + 1;
    }
    
    nextOrderPrediction = { week: adjustedWeek, year: nextYear };
    
    // Estimation basique pour une seule commande
    weeklyConsumption = singleOrder.total / 26; // Répartir sur 6 mois
    monthlyConsumption = weeklyConsumption * 4.33;
    averageWeeksBetweenOrders = 26; // 6 mois par défaut
  } else if (orders.length >= 2) {
    // VOTRE CALCUL EXACT : Kilos de la première à l'avant-dernière commande
    // Trier par ordre chronologique (plus ancienne en premier)
    const chronologicalOrders = [...sortedOrders].reverse();
    
    // Prendre de la première (index 0) à l'avant-dernière (length-2)
    const firstToSecondLast = chronologicalOrders.slice(0, -1);
    const totalKilosFirstToSecondLast = firstToSecondLast.reduce((sum, order) => sum + order.total, 0);
    
    // Écart total entre la première et la dernière commande (chronologique)
    const firstOrder = chronologicalOrders[0]; // Plus ancienne
    const lastOrder = chronologicalOrders[chronologicalOrders.length - 1]; // Plus récente
    
    const firstWeekOfYear = firstOrder.year * 52 + firstOrder.weekNumber;
    const lastWeekOfYear = lastOrder.year * 52 + lastOrder.weekNumber;
    const totalWeeksSpan = lastWeekOfYear - firstWeekOfYear;
    
    if (totalWeeksSpan > 0) {
      weeklyConsumption = totalKilosFirstToSecondLast / totalWeeksSpan;
      monthlyConsumption = weeklyConsumption * 4.33;
      averageWeeksBetweenOrders = totalWeeksSpan / (orders.length - 1);
      
      // Prédiction : kilos de la dernière commande ÷ consommation moyenne par semaine
      const weeksUntilNextOrder = (lastOrder.total / weeklyConsumption) - 12;
      const nextWeek = lastOrder.weekNumber + Math.round(weeksUntilNextOrder);
      let nextYear = lastOrder.year;
      let adjustedWeek = nextWeek;
      
      if (adjustedWeek > 52) {
        nextYear += Math.floor((adjustedWeek - 1) / 52);
        adjustedWeek = ((adjustedWeek - 1) % 52) + 1;
      }
      
      nextOrderPrediction = { week: adjustedWeek, year: nextYear };
    }
  }

  // Calcul du nombre de semaines jusqu'à la prochaine commande
  let weeksUntilNextOrder = 0;
  if (weeklyConsumption > 0 && lastOrder) {
    weeksUntilNextOrder = (lastOrder.total / weeklyConsumption) - 12;
  }

  // Durée estimée de la dernière commande
  let lastOrderDuration = 0;
  if (weeklyConsumption > 0 && lastOrder) {
    lastOrderDuration = (lastOrder.total / weeklyConsumption) - 12;
  }

  return {
    totalOrders: orders.length,
    averageWeeksBetweenOrders: Math.round(averageWeeksBetweenOrders * 10) / 10,
    weeklyConsumption: Math.round(weeklyConsumption * 100) / 100,
    monthlyConsumption: Math.round(monthlyConsumption * 100) / 100,
    lastOrderDuration: Math.round(lastOrderDuration * 10) / 10,
    nextOrderPrediction,
    lastOrder: { week: lastOrder.weekNumber, year: lastOrder.year },
    weeksUntilNextOrder: Math.round(weeksUntilNextOrder * 100) / 100,
  };
}

// Nouvelle fonction pour calculer les prédictions par produit
export function calculateProductPredictions(orders: Order[]): {
  productName: string;
  productCategory: string;
  nextOrderPrediction: { week: number; year: number };
  weeklyConsumption: number;
  weeksUntilNextOrder: number;
}[] {
  
  if (orders.length === 0) return [];

  // Obtenir tous les produits uniques avec leurs catégories
  const allProducts = new Map<string, string>(); // productName -> category
  
  orders.forEach(order => {
    if (order.products && order.products.length > 0) {
      // Structure moderne avec products array
      order.products.forEach(product => {
        if (product.quantity > 0) {
          allProducts.set(product.name, product.category);
        }
      });
    }
  });

  const predictions: {
    productName: string;
    productCategory: string;
    nextOrderPrediction: { week: number; year: number };
    weeklyConsumption: number;
    weeksUntilNextOrder: number;
  }[] = [];

  // Calculer la prédiction pour chaque produit
  allProducts.forEach((category, productName) => {
    const lastOrder = getLastOrderForProduct(orders, productName);
    
    if (!lastOrder) return; // Pas de commande pour ce produit
    
    let weeklyConsumption = 0;
    let weeksUntilNextOrder = 26; // Par défaut : 6 mois (26 semaines)
    
    if (orders.length === 1) {
      // NOUVELLE LOGIQUE : Une seule commande = prédiction à 6 mois
      weeklyConsumption = lastOrder.quantity / 26; // Répartir sur 6 mois
      weeksUntilNextOrder = 26;
    } else if (orders.length >= 2) {
      // Si on a plusieurs commandes, on calcule la consommation
      const productConsumption = calculateProductConsumption(orders, productName);
      weeklyConsumption = productConsumption.weeklyConsumption;
      
      if (weeklyConsumption > 0) {
        weeksUntilNextOrder = (lastOrder.quantity / weeklyConsumption) - 12;
      }
    }
    
    // Calculer la prochaine commande
    const nextWeek = lastOrder.weekNumber + Math.round(weeksUntilNextOrder);
    let nextYear = lastOrder.year;
    let adjustedWeek = nextWeek;
    
    if (adjustedWeek > 52) {
      nextYear += Math.floor((adjustedWeek - 1) / 52);
      adjustedWeek = ((adjustedWeek - 1) % 52) + 1;
    }

    const prediction = {
      productName,
      productCategory: category,
      nextOrderPrediction: { week: adjustedWeek, year: nextYear },
      weeklyConsumption: Math.round(weeklyConsumption * 100) / 100,
      weeksUntilNextOrder: Math.round(weeksUntilNextOrder * 100) / 100
    };
    
    predictions.push(prediction);
  });

  return predictions;
}

// Fonction pour trouver la dernière commande d'un produit spécifique
function getLastOrderForProduct(orders: Order[], productName: string): {
  weekNumber: number;
  year: number;
  quantity: number;
} | null {
  const sortedOrders = orders.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });

  for (const order of sortedOrders) {
    if (order.products && order.products.length > 0) {
      const product = order.products.find(p => p.name === productName);
      if (product && product.quantity > 0) {
        return {
          weekNumber: order.weekNumber,
          year: order.year,
          quantity: product.quantity
        };
      }
    }
  }
  
  return null;
}
// Fonction pour calculer la consommation d'un produit spécifique
function calculateProductConsumption(orders: Order[], productName: string): {
  weeklyConsumption: number;
  monthlyConsumption: number;
} {
  if (orders.length < 2) {
    return { weeklyConsumption: 0, monthlyConsumption: 0 };
  }

  // Trier par ordre chronologique (plus ancienne en premier)
  const sortedOrders = orders.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.weekNumber - b.weekNumber;
  });
  
  // Prendre de la première à l'avant-dernière commande
  const firstToSecondLast = sortedOrders.slice(0, -1);
  
  // Calculer le total pour ce produit spécifique
  const totalProductQuantity = firstToSecondLast.reduce((sum, order) => {
    if (order.products && order.products.length > 0) {
      const product = order.products.find(p => p.name === productName);
      return sum + (product ? product.quantity : 0);
    }
    return sum;
  }, 0);
  
  const firstOrder = sortedOrders[0];
  const lastOrder = sortedOrders[sortedOrders.length - 1];
  
  const firstWeekOfYear = firstOrder.year * 52 + firstOrder.weekNumber;
  const lastWeekOfYear = lastOrder.year * 52 + lastOrder.weekNumber;
  const totalWeeksSpan = lastWeekOfYear - firstWeekOfYear;
  
  if (totalWeeksSpan > 0 && totalProductQuantity > 0) {
    const weeklyConsumption = totalProductQuantity / totalWeeksSpan;
    const monthlyConsumption = weeklyConsumption * 4.33;
    return {
      weeklyConsumption: Math.round(weeklyConsumption * 100) / 100,
      monthlyConsumption: Math.round(monthlyConsumption * 100) / 100
    };
  }
  return { weeklyConsumption: 0, monthlyConsumption: 0 };
}

// Fonction pour obtenir la prédiction la plus proche (produit qui arrive à échéance en premier)
export function getNextProductPrediction(orders: Order[]): {
  productName: string;
  productCategory: string;
  nextOrderPrediction: { week: number; year: number };
  weeksUntilNextOrder: number;
} | null {
  const predictions = calculateProductPredictions(orders);
  
  if (predictions.length === 0) return null;

  // Trier par proximité (le plus proche en premier)
  const sortedPredictions = predictions.sort((a, b) => {
    const currentWeek = getCurrentWeek();
    const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;
    
    const aWeekOfYear = a.nextOrderPrediction.year * 52 + a.nextOrderPrediction.week;
    const bWeekOfYear = b.nextOrderPrediction.year * 52 + b.nextOrderPrediction.week;
    
    const aWeeksUntil = aWeekOfYear - currentWeekOfYear;
    const bWeeksUntil = bWeekOfYear - currentWeekOfYear;
    
    return aWeeksUntil - bWeeksUntil;
  });

  const closest = sortedPredictions[0];
  const currentWeek = getCurrentWeek();
  const currentWeekOfYear = currentWeek.year * 52 + currentWeek.week;
  const targetWeekOfYear = closest.nextOrderPrediction.year * 52 + closest.nextOrderPrediction.week;
  const weeksUntilNextOrder = targetWeekOfYear - currentWeekOfYear;

  return {
    productName: closest.productName,
    productCategory: closest.productCategory,
    nextOrderPrediction: closest.nextOrderPrediction,
    weeksUntilNextOrder
  };
}

export function formatWeek(week: number, year: number): string {
  return `Semaine ${week}, ${year}`;
}

export function getCurrentWeek(): { week: number; year: number } {
  const now = new Date();
  const year = now.getFullYear();
  
  // Calculate week number (ISO 8601)
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return { week: Math.min(week, 52), year };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

export function getWeekStatus(targetWeek: { week: number; year: number }): {
  color: string;
  text: string;
  weeksUntil: number;
} {
  const current = getCurrentWeek();
  const currentWeekOfYear = current.year * 52 + current.week;
  const targetWeekOfYear = targetWeek.year * 52 + targetWeek.week;
  const weeksUntil = targetWeekOfYear - currentWeekOfYear;

  if (weeksUntil < 0) {
    return {
      color: 'bg-red-100 text-red-800',
      text: `En retard (${Math.abs(weeksUntil)} semaines)`,
      weeksUntil
    };
  } else if (weeksUntil <= 2) {
    return {
      color: 'bg-yellow-100 text-yellow-800',
      text: weeksUntil === 0 ? 'Cette semaine' : `Dans ${weeksUntil} semaine${weeksUntil > 1 ? 's' : ''}`,
      weeksUntil
    };
  } else {
    return {
      color: 'bg-green-100 text-green-800',
      text: `Dans ${weeksUntil} semaines`,
      weeksUntil
    };
  }
}