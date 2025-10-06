import React, { useMemo } from 'react';
import { Order } from '../types';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface ConsumptionChartProps {
  orders: Order[];
  clientName: string;
}

interface MonthlyData {
  month: number;
  year: number;
  products: { [productName: string]: number };
  total: number;
}

export function ConsumptionChart({ orders, clientName }: ConsumptionChartProps) {
  const chartData = useMemo(() => {
    if (orders.length === 0) return { monthlyData: [], productNames: [] };

    // Grouper les commandes par mois
    const monthlyMap = new Map<string, MonthlyData>();
    const productSet = new Set<string>();

    orders.forEach(order => {
      // Convertir le numéro de semaine en mois approximatif
      const month = Math.ceil(order.weekNumber / 4.33);
      const clampedMonth = Math.min(Math.max(month, 1), 12);
      const monthKey = `${order.year}-${clampedMonth.toString().padStart(2, '0')}`;
      
      // Initialiser le mois s'il n'existe pas
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: clampedMonth,
          year: order.year,
          products: {},
          total: 0
        });
      }
      
      const monthData = monthlyMap.get(monthKey)!;
      
      if (order.products && order.products.length > 0) {
        // Nouvelle structure avec products array
        order.products.forEach(product => {
          if (product.quantity > 0) {
            productSet.add(product.name);
            monthData.products[product.name] = (monthData.products[product.name] || 0) + product.quantity;
            monthData.total += product.quantity;
          }
        });
      } else {
        // Fallback pour les anciennes commandes
        const oldOrder = order as any;
        if (oldOrder.bob35 > 0) {
          productSet.add('Bob 35');
          monthData.products['Bob 35'] = (monthData.products['Bob 35'] || 0) + oldOrder.bob35;
        }
        if (oldOrder.f50x70 > 0) {
          productSet.add('50x70');
          monthData.products['50x70'] = (monthData.products['50x70'] || 0) + oldOrder.f50x70;
        }
        if (oldOrder.f35x50 > 0) {
          productSet.add('35x50');
          monthData.products['35x50'] = (monthData.products['35x50'] || 0) + oldOrder.f35x50;
        }
        if (oldOrder.f25x35 > 0) {
          productSet.add('25x35');
          monthData.products['25x35'] = (monthData.products['25x35'] || 0) + oldOrder.f25x35;
        }
        if (oldOrder.f32x35 > 0) {
          productSet.add('32x35');
          monthData.products['32x35'] = (monthData.products['32x35'] || 0) + oldOrder.f32x35;
        }
        monthData.total += order.total;
      }
    });

    // Créer une timeline complète de 2023 à 2030 avec les données existantes
    const fullTimeline: MonthlyData[] = [];
    for (let year = 2023; year <= 2030; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        const existingData = monthlyMap.get(monthKey);
        
        if (existingData) {
          fullTimeline.push(existingData);
        } else {
          // Mois sans données
          const emptyMonth: MonthlyData = {
            month,
            year,
            products: {},
            total: 0
          };
          // Initialiser tous les produits connus à 0 pour ce mois
          productSet.forEach(productName => {
            emptyMonth.products[productName] = 0;
          });
          fullTimeline.push(emptyMonth);
        }
      }
    }

    const monthlyData = fullTimeline;
    const productNames = Array.from(productSet).sort();

    return { monthlyData, productNames };
  }, [orders]);

  const { monthlyData, productNames } = chartData;

  // Couleurs pour les différents produits
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // emerald
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#6366F1', // indigo
  ];

  const getProductColor = (productName: string, index: number) => {
    return colors[index % colors.length];
  };

  // Calculer les valeurs max pour l'échelle
  const maxValue = Math.max(...monthlyData.map(data => data.total));
  
  // S'assurer qu'on a une valeur max valide
  const safeMaxValue = maxValue > 0 ? maxValue : 100;

  if (monthlyData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Consommation mensuelle</h3>
        </div>
        <div className="text-center py-8">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée</h3>
          <p className="text-gray-500">Pas assez de commandes pour générer un graphique</p>
        </div>
      </div>
    );
  }

  const chartWidth = 1200; // Plus large pour accommoder 8 années
  const chartHeight = 300;
  const padding = 60;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Consommation mensuelle - {clientName}</h3>
        </div>
        <div className="text-sm text-gray-500">
          {monthlyData.length} mois de données
        </div>
      </div>

      {/* Légende */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          {productNames.map((product, index) => (
            <div key={product} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: getProductColor(product, index) }}
              ></div>
              <span className="text-sm text-gray-700">{product}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique SVG */}
      <div className="relative bg-gray-50 rounded-lg p-4">
        <svg 
          width={chartWidth + padding * 2} 
          height={chartHeight + padding * 2}
          className="overflow-visible w-full"
        >
          {/* Grille horizontale */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding + chartHeight - (ratio * chartHeight);
            return (
              <g key={index}>
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {Math.round(safeMaxValue * ratio)}
                </text>
              </g>
            );
          })}

          {/* Grille verticale et labels temporels */}
          {(() => {
            const elements = [];
            
            // Lignes verticales pour chaque année
            for (let year = 2023; year <= 2030; year++) {
              const yearIndex = (year - 2023) * 12;
              const x = padding + (yearIndex * chartWidth) / (monthlyData.length - 1);
              
              elements.push(
                <g key={`year-${year}`}>
                  <line
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={padding + chartHeight}
                    stroke="#374151"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={padding + chartHeight + 35}
                    textAnchor="middle"
                    className="text-sm font-semibold fill-gray-700"
                  >
                    {year}
                  </text>
                </g>
              );
              
              // Petites barres pour les mois (sauf pour la dernière année pour éviter le débordement)
              if (year < 2030) {
                for (let month = 1; month <= 11; month++) {
                  const monthIndex = yearIndex + month;
                  const monthX = padding + (monthIndex * chartWidth) / (monthlyData.length - 1);
                  
                  elements.push(
                    <line
                      key={`month-${year}-${month}`}
                      x1={monthX}
                      y1={padding + chartHeight - 5}
                      x2={monthX}
                      y2={padding + chartHeight + 5}
                      stroke="#9CA3AF"
                      strokeWidth="1"
                    />
                  );
                }
              }
            }
            
            return elements;
          })()}

          {/* Courbes pour chaque produit */}
          {productNames.map((product, productIndex) => {
            const productData = monthlyData.map(data => data.products[product] || 0);
            const color = getProductColor(product, productIndex);
            
            return (
              <g key={product}>
                {/* Courbe */}
                <path
                  d={(() => {
                    let path = '';
                    productData.forEach((value, index) => {
                      const x = padding + (index * chartWidth) / (monthlyData.length - 1);
                      const y = padding + chartHeight - (value / safeMaxValue) * chartHeight;
                      
                      if (index === 0) {
                        path += `M ${x} ${y}`;
                      } else {
                        const prevX = padding + ((index - 1) * chartWidth) / (monthlyData.length - 1);
                        const prevY = padding + chartHeight - (productData[index - 1] / safeMaxValue) * chartHeight;
                        const cpX1 = prevX + (x - prevX) * 0.4;
                        const cpY1 = prevY;
                        const cpX2 = x - (x - prevX) * 0.4;
                        const cpY2 = y;
                        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
                      }
                    });
                    return path;
                  })()}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Points sur la courbe */}
                {productData.map((value, index) => {
                  const x = padding + (index * chartWidth) / (monthlyData.length - 1);
                  const y = padding + chartHeight - (value / safeMaxValue) * chartHeight;
                  
                  // N'afficher le point que s'il y a une valeur
                  return value > 0 ? (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                      className="hover:r-6 transition-all duration-200"
                    >
                      <title>{`${product}: ${value} unités`}</title>
                    </circle>
                  ) : null;
                })}
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={padding}
            y1={padding + chartHeight}
            x2={padding + chartWidth}
            y2={padding + chartHeight}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={padding + chartHeight}
            stroke="#374151"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Statistiques résumées */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-sm text-gray-500">Moyenne mensuelle</div>
          <div className="text-lg font-semibold text-gray-900">
            {(() => {
              const nonZeroMonths = monthlyData.filter(data => data.total > 0);
              if (nonZeroMonths.length === 0) return 0;
              return Math.round(nonZeroMonths.reduce((sum, data) => sum + data.total, 0) / nonZeroMonths.length);
            })()} unités
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Pic maximum</div>
          <div className="text-lg font-semibold text-gray-900">{safeMaxValue} unités</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Produits différents</div>
          <div className="text-lg font-semibold text-gray-900">{productNames.length}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Période</div>
          <div className="text-lg font-semibold text-gray-900">2023-2030</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Mois avec données</div>
          <div className="text-lg font-semibold text-gray-900">
            {monthlyData.filter(data => data.total > 0).length}
          </div>
        </div>
      </div>
    </div>
  );
}

function getMonthName(monthNumber: number): string {
  // Fonction conservée pour compatibilité mais plus utilisée
  return '';
}