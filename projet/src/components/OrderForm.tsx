import React, { useState } from 'react';
import { Client, Order, OrderProduct } from '../types';
import { getCurrentWeek } from '../utils/calculations';
import { X, Save, Package, Plus, Trash2 } from 'lucide-react';

interface OrderFormProps {
  clients: Client[];
  selectedClient?: Client;
  onSave: (order: Omit<Order, 'id'>) => void;
  onCancel: () => void;
}

const PAPER_COLORS = [
  'Blanc',
  'Chocolat – 477U',
  'Bordeaux – 491U',
  'Fuchsia – 214U',
  'Rose pâle – 691U',
  'Rose – 2405U',
  'Bleu – 279U',
  'Bleu ciel – 319U',
  'Bleu medium – BLUE 072U',
  'Bleu foncé – 2756U',
  'Bleu turquoise – 311U',
  'Bleu marine – 295C',
  'Gris clair – 7535U',
  'Gris pâle – COOL GRAY 1U',
  'Gris medium – 403U',
  'Gris foncé – COOL GRAY 10U',
  'Noir',
  'Jaune poussin – YELLOW U',
  'Jaune or – 122U',
  'Or – 7550U',
  'Orange – 021U',
  'Orange rouille – 1665U',
  'Rouge – RED 032U',
  'Rouge foncé – 201U',
  'Vert anis – 389U',
  'Vert pistache – 383U',
  'Vert AB – 361U',
  'Vert foncé – 335U'
];

const POT_COLORS = [
  // BLEU
  'BLEU 072',
  'BLEU 290',
  'BLEU 300',
  'BLEU 548',
  'BLEU 293',
  'BLEU 301',
  'BLEU 287',
  'BLEU 2995',
  'BLEU 2738',
  'BLEU 7463',
  'BLEU 3005',
  // GRIS
  'GRIS 421',
  'GRIS 431',
  'GRIS 425',
  'GRIS 447',
  'GRIS 430',
  // VERT
  'VERT 362',
  'VERT 320',
  'VERT 3275',
  'VERT 356',
  'VERT 382',
  'VERT 361',
  'VERT 376',
  'VERT 348',
  // DOREE
  'DOREE 871',
  // ARGENT
  'ARGENT 877',
  // ORANGE
  'ORANGE 151',
  // NOIRE
  'NOIRE 4C',
  'NOIRE 22400',
  // ROUGE
  'ROUGE 186',
  'ROUGE 485',
  'ROUGE 187',
  'ROUGE 188',
  'ROUGE 032',
  // BORDEAUX
  'BORDEAUX 7420',
  // BISTRE
  'BISTRE 209',
  // ROSE
  'ROSE 484',
  'ROSE 211',
  'ROSE 227',
  'ROSE 213',
  'ROSE 1555',
  'ROSE 155',
  'ROSE 204',
  'ROSE 182',
  // MARRON
  'MARRON 4655',
  'MARRON 464',
  'MARRON 476',
  'MARRON 132',
  'MARRON 457',
  'MARRON 408',
  'MARRON 484',
  'MARRON 125',
  // VIOLET
  'VIOLET 2613',
  'VIOLET 266',
  'VIOLET 2603',
  // JAUNE
  'JAUNE 138',
  'JAUNE 123',
  'JAUNE 109',
  'JAUNE 1205'
];
const PRODUCT_CATEGORIES = {
  papier_thermo: {
    name: 'Papier Thermo',
    products: [
      { name: 'Bob 35', unit: 'kg' },
      { name: 'Bob 50', unit: 'kg' },
      { name: '50x70', unit: 'kg' },
      { name: '35x50', unit: 'kg' },
      { name: '25x35', unit: 'kg' },
      { name: '32x35', unit: 'kg' },
      { name: 'Autre', unit: 'kg' }
    ]
  },
  papier_paraffine: {
    name: 'Papier Paraffiné',
    products: [
      { name: '25x32', unit: 'kg' },
      { name: '32x50', unit: 'kg' },
      { name: '50x65', unit: 'kg' },
      { name: '32x32,5', unit: 'kg' },
      { name: 'Bob 32,5', unit: 'kg' },
      { name: 'Bob 50', unit: 'kg' },
      { name: 'Autre', unit: 'kg' }
    ]
  },
  pots: { 
    name: 'Pots', 
    products: [
      { name: '125gr', unit: 'unité' },
      { name: '250gr', unit: 'unité' },
      { name: '500gr', unit: 'unité' },
      { name: 'Autre', unit: 'unité' }
    ] 
  },
  bretelles: { 
    name: 'Bretelles', 
    products: [
      { name: '210+60x400', unit: 'unité' },
      { name: '260+60x460', unit: 'unité' },
      { name: '280+70x500', unit: 'unité' },
      { name: '300+70x540', unit: 'unité' },
      { name: '300+80x600', unit: 'unité' },
      { name: 'Autre', unit: 'unité' }
    ] 
  },
  cabas_kraft_pp: { 
    name: 'Cabas Kraft PP', 
    products: [
      { name: '18+8x22', unit: 'unité' },
      { name: '22+10x28', unit: 'unité' },
      { name: '26+14x32', unit: 'unité' },
      { name: '32+14x42', unit: 'unité' },
      { name: 'Autre', unit: 'unité' }
    ] 
  },
  cabas_kraft_pt: { 
    name: 'Cabas Kraft PT', 
    products: [
      { name: '18+8x22', unit: 'unité' },
      { name: '24+10x32', unit: 'unité' },
      { name: '34+14x42', unit: 'unité' },
      { name: 'Autre', unit: 'unité' }
    ] 
  },
  reutilisable: { 
    name: 'Réutilisable', 
    products: [
      { name: 'Nylon', unit: 'unité' },
      { name: 'Polypropylène tissé', unit: 'unité' },
      { name: 'Toile de jute', unit: 'unité' },
      { name: 'Tote bags', unit: 'unité' },
      { name: 'Thermosoudé', unit: 'unité' },
      { name: 'Autre', unit: 'unité' }
    ] 
  },
  isotherme: { 
    name: 'Isotherme', 
    products: [
      { name: '36x20x30', unit: 'unité' },
      { name: '36x15x38', unit: 'unité' },
      { name: 'Autre', unit: 'unité' }
    ] 
  },
  objet_pub: { 
    name: 'Objet Pub', 
    products: [
      { name: 'Stylos', unit: 'unité' },
      { name: 'Limonadier', unit: 'unité' },
      { name: 'Planche bois', unit: 'unité' },
      { name: 'Autre', unit: 'unité' }
    ] 
  }
};

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function calculateTotal(products: OrderProduct[]): number {
  // Pour l'instant, on fait juste la somme des quantités
  // Vous pourrez ajouter des prix unitaires plus tard
  return products.reduce((sum, product) => sum + product.quantity, 0);
}

export function OrderForm({ clients, selectedClient, onSave, onCancel }: OrderFormProps) {
  const currentWeek = getCurrentWeek();
  
  const [formData, setFormData] = useState({
    clientId: selectedClient?.id || '',
    orderNumber: '',
    weekNumber: currentWeek.week,
    year: currentWeek.year,
    deliveryWeek: currentWeek.week + 1, // Par défaut, livraison la semaine suivante
    deliveryYear: currentWeek.year,
    dayOfWeek: '',
    closureDays: [] as string[],
    deliveryInstructions: '',
    products: [] as OrderProduct[],
  });

  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showColorInput, setShowColorInput] = useState<{ [key: string]: boolean }>({});
  const [newColorInput, setNewColorInput] = useState<{ [key: string]: string }>({});
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.clientId) {
      onSave({
        ...formData,
        total: calculateTotal(formData.products),
      });
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClosureDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      closureDays: prev.closureDays.includes(day)
        ? prev.closureDays.filter(d => d !== day)
        : [...prev.closureDays, day]
    }));
  };

  const addProduct = () => {
    const newProduct: OrderProduct = {
      id: generateId(),
      category: '',
      name: '',
      quantity: 0,
      unit: 'unité',
      colors: []
    };
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
  };

  const updateProduct = (id: string, field: keyof OrderProduct, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(product => 
        product.id === id ? { ...product, [field]: value } : product
      )
    }));
  };

  const removeProduct = (id: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(product => product.id !== id)
    }));
  };

  const handleCategoryChange = (productId: string, category: string) => {
    updateProduct(productId, 'category', category);
    updateProduct(productId, 'name', ''); // Reset product name when category changes
  };

  const handleAddCustomColor = (productId: string) => {
    const newColor = newColorInput[productId]?.trim();
    if (newColor && !customColors.includes(newColor) && !PAPER_COLORS.includes(newColor)) {
      setCustomColors(prev => [...prev, newColor]);
      updateProduct(productId, 'color', newColor);
      setShowColorInput(prev => ({ ...prev, [productId]: false }));
      setNewColorInput(prev => ({ ...prev, [productId]: '' }));
    }
  };

  const handleCancelAddColor = (productId: string) => {
    setShowColorInput(prev => ({ ...prev, [productId]: false }));
    setNewColorInput(prev => ({ ...prev, [productId]: '' }));
  };

  const getAllAvailableColors = () => {
    return [...PAPER_COLORS, ...customColors].sort();
  };

  const getAllAvailableColorsForProduct = (category: string) => {
    if (category === 'pots') {
      return [...POT_COLORS, ...customColors].sort();
    }
    return [...PAPER_COLORS, ...customColors].sort();
  };
  const total = calculateTotal(formData.products);

  // Generate year options (current year ± 2)
  const yearOptions = [];
  for (let i = currentWeek.year - 2; i <= currentWeek.year + 2; i++) {
    yearOptions.push(i);
  }

  // Generate week options (1-52)
  const weekOptions = [];
  for (let i = 1; i <= 52; i++) {
    weekOptions.push(i);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Nouvelle commande</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              >
                <option value="">Sélectionner un client</option>
                {[...clients].sort((a, b) => (a.nomEntreprise || a.nom).localeCompare(b.nomEntreprise || b.nom)).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nomEntreprise || client.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de semaine *
              </label>
              <select
                value={formData.weekNumber}
                onChange={(e) => handleChange('weekNumber', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              >
                {weekOptions.map((week) => (
                  <option key={week} value={week}>
                    Semaine {week}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année *
              </label>
              <select
                value={formData.year}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semaine de livraison
              </label>
              <select
                value={formData.deliveryWeek || ''}
                onChange={(e) => handleChange('deliveryWeek', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="">Sélectionner une semaine</option>
                {weekOptions.map((week) => (
                  <option key={week} value={week}>
                    Semaine {week}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année de livraison
              </label>
              <select
                value={formData.deliveryYear || ''}
                onChange={(e) => handleChange('deliveryYear', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="">Sélectionner une année</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N° de commande
              </label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => handleChange('orderNumber', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Ex: CMD-001"
              />
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jours de fermeture
            </label>
            <div className="grid grid-cols-5 gap-2">
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.closureDays.includes(day)}
                    onChange={() => handleClosureDayToggle(day)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions livraison
            </label>
            <textarea
              value={formData.deliveryInstructions}
              onChange={(e) => handleChange('deliveryInstructions', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
              placeholder="Instructions spéciales pour la livraison..."
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Produits</h3>
              <button
                type="button"
                onClick={addProduct}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau produit
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.products.map((product, index) => (
                <div key={product.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-700">Produit {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie
                      </label>
                      <select
                        value={product.category}
                        onChange={(e) => handleCategoryChange(product.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {Object.entries(PRODUCT_CATEGORIES).map(([key, category]) => (
                          <option key={key} value={key}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Produit
                      </label>
                      <select
                        value={product.name}
                        onChange={(e) => {
                          updateProduct(product.id, 'name', e.target.value);
                          // Update unit based on selected product
                          const selectedCategory = PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES];
                          if (selectedCategory) {
                            const selectedProduct = selectedCategory.products.find(p => p.name === e.target.value);
                            if (selectedProduct) {
                              updateProduct(product.id, 'unit', selectedProduct.unit);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                        disabled={!product.category}
                      >
                        <option value="">Sélectionner un produit</option>
                        {product.category && PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES]?.products.map((prod) => (
                          <option key={prod.name} value={prod.name}>
                            {prod.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Sélecteur de couleur pour papier thermo et paraffiné */}
                    {(product.category === 'papier_thermo' || product.category === 'papier_paraffine') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Couleurs
                        </label>
                        <div className="space-y-2">
                          {/* Affichage des couleurs sélectionnées */}
                          {product.colors && product.colors.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.colors.map((color, colorIndex) => (
                                <span
                                  key={colorIndex}
                                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {color}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newColors = product.colors?.filter((_, i) => i !== colorIndex) || [];
                                      updateProduct(product.id, 'colors', newColors);
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Sélecteur pour ajouter une couleur */}
                          {!showColorInput[product.id] ? (
                            <div className="flex space-x-2">
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const currentColors = product.colors || [];
                                    if (!currentColors.includes(e.target.value)) {
                                      updateProduct(product.id, 'colors', [...currentColors, e.target.value]);
                                    }
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                              >
                                <option value="">Ajouter une couleur</option>
                                {getAllAvailableColorsForProduct(product.category)
                                  .filter(color => !(product.colors || []).includes(color))
                                  .map((color) => (
                                    <option key={color} value={color}>
                                      {color}
                                    </option>
                                  ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setShowColorInput(prev => ({ ...prev, [product.id]: true }))}
                                className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-200 text-sm font-medium"
                                title="Ajouter une couleur personnalisée"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={newColorInput[product.id] || ''}
                                onChange={(e) => setNewColorInput(prev => ({ ...prev, [product.id]: e.target.value }))}
                                placeholder="Nouvelle couleur..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomColor(product.id);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddCustomColor(product.id)}
                                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                                title="Confirmer"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelAddColor(product.id)}
                                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                                title="Annuler"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Champs spécifiques pour les pots */}
                    {product.category === 'pots' && (
                      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Couleur de pot */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Couleur de pot
                          </label>
                          <select
                            value={product.color || ''}
                            onChange={(e) => updateProduct(product.id, 'color', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                          >
                            <option value="">Sélectionner une couleur</option>
                            <option value="PS Blanc">PS Blanc</option>
                            <option value="PS Coquille d'œuf">PS Coquille d'œuf</option>
                            <option value="PS Grès">PS Grès</option>
                            <option value="PP Blanc">PP Blanc</option>
                            <option value="PP Coquille d'œuf">PP Coquille d'œuf</option>
                            <option value="PP Grès">PP Grès</option>
                          </select>
                        </div>
                        
                        {/* Couv AT */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Couv AT
                          </label>
                          <select
                            value={(product as any).couvAT || ''}
                            onChange={(e) => updateProduct(product.id, 'couvAT' as any, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                          >
                            <option value="">Sélectionner une couleur</option>
                            <option value="Noir">Noir</option>
                            <option value="Rouge">Rouge</option>
                            <option value="Blanc">Blanc</option>
                            <option value="Marron">Marron</option>
                            <option value="Bordeaux">Bordeaux</option>
                          </select>
                        </div>
                        
                        {/* Couleur impression */}
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Couleur impression
                          </label>
                          <div className="space-y-2">
                            {/* Affichage des couleurs sélectionnées */}
                            {(product as any).impressionColors && (product as any).impressionColors.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {(product as any).impressionColors.map((color: string, colorIndex: number) => (
                                  <span
                                    key={colorIndex}
                                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded border"
                                  >
                                    {color}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newColors = (product as any).impressionColors?.filter((_: string, i: number) => i !== colorIndex) || [];
                                        updateProduct(product.id, 'impressionColors' as any, newColors);
                                      }}
                                      className="ml-2 text-gray-500 hover:text-gray-700 text-lg leading-none"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Sélecteur pour ajouter une couleur */}
                              <div className="flex space-x-2">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const currentColors = (product as any).impressionColors || [];
                                      if (!currentColors.includes(e.target.value)) {
                                        updateProduct(product.id, 'impressionColors' as any, [...currentColors, e.target.value]);
                                      }
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                                >
                                  <option value="">Ajouter une couleur</option>
                                  <optgroup label="BLEU">
                                    <option value="BLEU 072">BLEU 072</option>
                                    <option value="BLEU 290">BLEU 290</option>
                                    <option value="BLEU 300">BLEU 300</option>
                                    <option value="BLEU 548">BLEU 548</option>
                                    <option value="BLEU 293">BLEU 293</option>
                                    <option value="BLEU 301">BLEU 301</option>
                                    <option value="BLEU 287">BLEU 287</option>
                                    <option value="BLEU 2995">BLEU 2995</option>
                                    <option value="BLEU 2738">BLEU 2738</option>
                                    <option value="BLEU 7463">BLEU 7463</option>
                                    <option value="BLEU 3005">BLEU 3005</option>
                                  </optgroup>
                                  <optgroup label="GRIS">
                                    <option value="GRIS 421">GRIS 421</option>
                                    <option value="GRIS 431">GRIS 431</option>
                                    <option value="GRIS 425">GRIS 425</option>
                                    <option value="GRIS 447">GRIS 447</option>
                                    <option value="GRIS 430">GRIS 430</option>
                                  </optgroup>
                                  <optgroup label="VERT">
                                    <option value="VERT 362">VERT 362</option>
                                    <option value="VERT 320">VERT 320</option>
                                    <option value="VERT 3275">VERT 3275</option>
                                    <option value="VERT 356">VERT 356</option>
                                    <option value="VERT 382">VERT 382</option>
                                    <option value="VERT 361">VERT 361</option>
                                    <option value="VERT 376">VERT 376</option>
                                    <option value="VERT 348">VERT 348</option>
                                  </optgroup>
                                  <optgroup label="DOREE">
                                    <option value="DOREE 871">DOREE 871</option>
                                  </optgroup>
                                  <optgroup label="ARGENT">
                                    <option value="ARGENT 877">ARGENT 877</option>
                                  </optgroup>
                                  <optgroup label="ORANGE">
                                    <option value="ORANGE 151">ORANGE 151</option>
                                  </optgroup>
                                  <optgroup label="NOIRE">
                                    <option value="NOIRE 4C">NOIRE 4C</option>
                                    <option value="NOIRE 22400">NOIRE 22400</option>
                                  </optgroup>
                                  <optgroup label="ROUGE">
                                    <option value="ROUGE 186">ROUGE 186</option>
                                    <option value="ROUGE 485">ROUGE 485</option>
                                    <option value="ROUGE 187">ROUGE 187</option>
                                    <option value="ROUGE 188">ROUGE 188</option>
                                    <option value="ROUGE 032">ROUGE 032</option>
                                  </optgroup>
                                  <optgroup label="BORDEAUX">
                                    <option value="BORDEAUX 7420">BORDEAUX 7420</option>
                                  </optgroup>
                                  <optgroup label="BISTRE">
                                    <option value="BISTRE 209">BISTRE 209</option>
                                  </optgroup>
                                  <optgroup label="ROSE">
                                    <option value="ROSE 484">ROSE 484</option>
                                    <option value="ROSE 211">ROSE 211</option>
                                    <option value="ROSE 227">ROSE 227</option>
                                    <option value="ROSE 213">ROSE 213</option>
                                    <option value="ROSE 1555">ROSE 1555</option>
                                    <option value="ROSE 155">ROSE 155</option>
                                    <option value="ROSE 204">ROSE 204</option>
                                    <option value="ROSE 182">ROSE 182</option>
                                  </optgroup>
                                  <optgroup label="MARRON">
                                    <option value="MARRON 4655">MARRON 4655</option>
                                    <option value="MARRON 464">MARRON 464</option>
                                    <option value="MARRON 476">MARRON 476</option>
                                    <option value="MARRON 132">MARRON 132</option>
                                    <option value="MARRON 457">MARRON 457</option>
                                    <option value="MARRON 408">MARRON 408</option>
                                    <option value="MARRON 484">MARRON 484</option>
                                    <option value="MARRON 125">MARRON 125</option>
                                  </optgroup>
                                  <optgroup label="VIOLET">
                                    <option value="VIOLET 2613">VIOLET 2613</option>
                                    <option value="VIOLET 266">VIOLET 266</option>
                                    <option value="VIOLET 2603">VIOLET 2603</option>
                                  </optgroup>
                                  <optgroup label="JAUNE">
                                    <option value="JAUNE 138">JAUNE 138</option>
                                    <option value="JAUNE 123">JAUNE 123</option>
                                    <option value="JAUNE 109">JAUNE 109</option>
                                    <option value="JAUNE 1205">JAUNE 1205</option>
                                  </optgroup>
                                  {customColors.length > 0 && (
                                    <optgroup label="COULEURS PERSONNALISÉES">
                                      {customColors.map((color) => (
                                        <option key={color} value={color}>
                                          {color}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setShowColorInput(prev => ({ ...prev, [`impression-${product.id}`]: true }))}
                                  className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors duration-200 text-lg font-bold leading-none"
                                  title="Ajouter couleur personnalisée"
                                >
                                  +
                                </button>
                              </div>
                            
                            {/* Input pour couleur personnalisée */}
                            {showColorInput[`impression-${product.id}`] && (
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={newColorInput[`impression-${product.id}`] || ''}
                                  onChange={(e) => setNewColorInput(prev => ({ ...prev, [`impression-${product.id}`]: e.target.value }))}
                                  placeholder="Ex: VERT 999"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const newColor = newColorInput[`impression-${product.id}`]?.trim();
                                      if (newColor && !customColors.includes(newColor)) {
                                        setCustomColors(prev => [...prev, newColor]);
                                        const currentColors = (product as any).impressionColors || [];
                                        if (!currentColors.includes(newColor)) {
                                          updateProduct(product.id, 'impressionColors' as any, [...currentColors, newColor]);
                                        }
                                        setShowColorInput(prev => ({ ...prev, [`impression-${product.id}`]: false }));
                                        setNewColorInput(prev => ({ ...prev, [`impression-${product.id}`]: '' }));
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newColor = newColorInput[`impression-${product.id}`]?.trim();
                                    if (newColor) {
                                      // Ajouter à la liste des couleurs personnalisées si pas déjà présente
                                      if (!customColors.includes(newColor)) {
                                        setCustomColors(prev => [...prev, newColor]);
                                      }
                                      // Ajouter la couleur au produit
                                      const currentColors = (product as any).impressionColors || [];
                                      if (!currentColors.includes(newColor)) {
                                        updateProduct(product.id, 'impressionColors' as any, [...currentColors, newColor]);
                                      }
                                      // Réinitialiser l'interface
                                      setShowColorInput(prev => ({ ...prev, [`impression-${product.id}`]: false }));
                                      setNewColorInput(prev => ({ ...prev, [`impression-${product.id}`]: '' }));
                                    }
                                  }}
                                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                                  title="Confirmer"
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowColorInput(prev => ({ ...prev, [`impression-${product.id}`]: false }));
                                    setNewColorInput(prev => ({ ...prev, [`impression-${product.id}`]: '' }));
                                  }}
                                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                                  title="Annuler"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité ({product.unit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={product.quantity || ''}
                        onChange={(e) => updateProduct(product.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.products.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Aucun produit ajouté</p>
                  <p className="text-sm">Cliquez sur "Nouveau produit" pour commencer</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-blue-600">{total} unités</span>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center shadow-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer la commande
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}