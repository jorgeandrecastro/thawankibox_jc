import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Download, TrendingUp, Sparkles, ShoppingBasket, X, Check, BarChart3, Settings, Calendar, Search, Moon, Sun, Minus, Shield } from 'lucide-react';

// Utilitaires de stockage
const storage = {
  getItems: () => {
    try {
      return JSON.parse(localStorage.getItem('groceryItems') || '[]');
    } catch {
      return [];
    }
  },
  setItems: (items) => {
    localStorage.setItem('groceryItems', JSON.stringify(items));
  },
  getTrends: () => {
    try {
      return JSON.parse(localStorage.getItem('itemTrends') || '{}');
    } catch {
      return {};
    }
  },
  setTrends: (trends) => {
    localStorage.setItem('itemTrends', JSON.stringify(trends));
  },
  getPurchaseHistory: () => {
    try {
      return JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
    } catch {
      return [];
    }
  },
  addToPurchaseHistory: (items) => {
    try {
      const history = storage.getPurchaseHistory();
      const purchased = items.filter(item => item.checked).map(item => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        purchasedAt: Date.now(),
        date: new Date().toISOString().split('T')[0]
      }));
      if (purchased.length > 0) {
        localStorage.setItem('purchaseHistory', JSON.stringify([...history, ...purchased]));
      }
    } catch (e) {
      console.error('Error saving purchase history:', e);
    }
  },
  resetTrends: () => {
    localStorage.setItem('itemTrends', JSON.stringify({}));
  },
  resetStats: () => {
    localStorage.setItem('purchaseHistory', JSON.stringify([]));
  },
  resetAll: () => {
    localStorage.removeItem('groceryItems');
    localStorage.removeItem('itemTrends');
    localStorage.removeItem('purchaseHistory');
  },
  getTheme: () => {
    return localStorage.getItem('theme') || 'light';
  },
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
  }
};

// Fonction d'export CSV
const exportToCSV = (items) => {
  const headers = ['Article', 'Catégorie', 'Quantité', 'Statut', 'Date'];
  const rows = items.map(item => [
    item.name,
    item.category || 'Autres',
    item.quantity,
    item.checked ? 'Acheté' : 'À acheter',
    new Date(item.addedAt).toLocaleDateString('fr-FR')
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `courses_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Composant Modal réutilisable
const Modal = ({ isOpen, onClose, title, children, theme, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden rounded-3xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-2xl`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
        
        <div className={`flex justify-end p-6 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal pour le menu de paramètres
const SettingsModal = ({ isOpen, onClose, theme, onResetTrends, onResetStats, onResetAll }) => {
  if (!isOpen) return null;

  const handleResetAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir tout réinitialiser ? Cette action supprimera définitivement votre liste, vos tendances et vos statistiques.')) {
      onResetAll();
      onClose();
    }
  };
  
  const handleResetTrends = () => {
    if (window.confirm('Réinitialiser les tendances ? Les données de vos articles les plus ajoutés seront perdues.')) {
      onResetTrends();
      onClose();
    }
  };
  
  const handleResetStats = () => {
    if (window.confirm('Réinitialiser les statistiques ? Votre historique d\'achats sera effacé.')) {
      onResetStats();
      onClose();
    }
  };

  const openPrivacyPolicy = () => {
    window.open('./privacy.html', '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`max-w-md w-full max-h-[90vh] overflow-hidden rounded-3xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-2xl`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Paramètres
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <div className="space-y-4">
            {/* Reset tendances */}
            <button
              onClick={handleResetTrends}
              className="w-full text-left px-4 py-4 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 font-medium transition-all flex items-center gap-3 text-sm rounded-xl border-2 border-orange-200 dark:border-orange-800"
            >
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                <div className="font-semibold">Reset tendances</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Effacer les données des articles les plus ajoutés
                </div>
              </div>
            </button>
            
            {/* Reset statistiques */}
            <button
              onClick={handleResetStats}
              className="w-full text-left px-4 py-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 font-medium transition-all flex items-center gap-3 text-sm rounded-xl border-2 border-blue-200 dark:border-blue-800"
            >
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-semibold">Reset statistiques</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Effacer l'historique des achats
                </div>
              </div>
            </button>
            
            {/* POLITIQUE DE CONFIDENTIALITÉ */}
            <button
              onClick={openPrivacyPolicy}
              className="w-full text-left px-4 py-4 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 font-medium transition-all flex items-center gap-3 text-sm rounded-xl border-2 border-green-200 dark:border-green-800"
            >
              <Shield className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <div className="font-semibold">Politique de confidentialité</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Comment nous protégeons vos données
                </div>
              </div>
            </button>
            
            {/* Tout réinitialiser */}
            <button
              onClick={handleResetAll}
              className="w-full text-left px-4 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold transition-all flex items-center gap-3 text-sm rounded-xl border-2 border-red-200 dark:border-red-800"
            >
              <Trash2 className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-semibold">Tout réinitialiser</div>
                <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Supprimer toutes les données de l'application
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <div className={`flex justify-end p-6 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper pour les emojis de catégorie
const getCategoryEmoji = (category) => {
  const emojis = {
    'Fruits & Légumes': '🥬',
    'Viandes & Poissons': '🥩',
    'Produits laitiers': '🥛',
    'Épicerie': '🍝',
    'Boissons': '🥤',
    'Hygiène': '🧼',
    'Autres': '📦'
  };
  return emojis[category] || '📦';
};

// Composant pour le contenu de la modal Trends
const TrendsModalContent = ({ trends, theme }) => {
  const sortedTrends = Object.entries(trends)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  if (sortedTrends.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📊</div>
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Aucune donnée de tendance
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
        {sortedTrends.map(([item, count], index) => (
          <div
            key={item}
            className={`p-4 rounded-xl border-2 ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`}
                </span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {item}
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full font-bold ${
                theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-orange-100 text-orange-600'
              }`}>
                {count}×
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant pour le contenu de la modal History
const HistoryModalContent = ({ purchaseHistory, items, theme }) => {
  // Combiner l'historique avec les articles actuellement cochés
  const currentCheckedItems = items.filter(item => item.checked).map(item => ({
    name: item.name,
    category: item.category,
    quantity: item.quantity || 1,
    purchasedAt: Date.now(),
    date: new Date().toISOString().split('T')[0]
  }));
  
  const combinedHistory = [...purchaseHistory, ...currentCheckedItems];
  
  const purchasesByDate = combinedHistory.reduce((acc, purchase) => {
    const date = purchase.date || new Date(purchase.purchasedAt).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(purchase);
    return acc;
  }, {});

  const sortedDates = Object.keys(purchasesByDate).sort((a, b) => new Date(b) - new Date(a));

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📅</div>
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Aucun historique d'achat
        </p>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
          {items.filter(item => item.checked).length > 0 
            ? `${items.filter(item => item.checked).length} article(s) coché(s) seront ajoutés après validation`
            : 'Validez vos premiers achats pour les voir ici'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentCheckedItems.length > 0 && (
        <div className={`p-4 rounded-xl ${
          theme === 'dark' ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm text-center ${
            theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
          }`}>
            📝 Inclut {currentCheckedItems.length} article(s) actuellement coché(s) (en attente de validation)
          </p>
        </div>
      )}
      
      {sortedDates.map(date => (
        <div key={date} className={`rounded-xl p-4 ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-bold text-lg ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              {new Date(date).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <span className={`px-3 py-1 rounded-full font-bold ${
              theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              {purchasesByDate[date].length} articles
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {purchasesByDate[date].map((purchase, index) => {
              // Vérifier si l'article est en attente de validation (acheté aujourd'hui)
              const isPending = new Date(purchase.purchasedAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] &&
                               purchaseHistory.findIndex(p => p.name === purchase.name && p.purchasedAt === purchase.purchasedAt) === -1;
              
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-600' : 'bg-white'
                  } ${isPending ? 'border-2 border-yellow-400' : ''}`}
                >
                  <span className="text-lg">{getCategoryEmoji(purchase.category)}</span>
                  <span className={`flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} ${isPending ? 'italic' : ''}`}>
                    {purchase.name}
                    {isPending && <span className="text-xs ml-2 text-yellow-600">(en attente)</span>}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    theme === 'dark' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {purchase.quantity || 1}
                  </span>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(purchase.purchasedAt).toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// Composant carte de statistique
const StatCard = ({ title, value, icon, theme }) => (
  <div className={`rounded-xl p-4 text-center ${
    theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'
  }`}>
    <div className="text-3xl mb-2">{icon}</div>
    <div className={`text-2xl font-bold mb-1 ${
      theme === 'dark' ? 'text-white' : 'text-gray-800'
    }`}>
      {value}
    </div>
    <div className={`text-xs ${
      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
    }`}>
      {title}
    </div>
  </div>
);

// Composant pour le contenu de la modal Stats
const StatsModalContent = ({ purchaseHistory, items, theme }) => {
  // Combiner l'historique avec les articles actuellement cochés
  const currentCheckedItems = items.filter(item => item.checked);
  const allPurchases = [
    ...purchaseHistory,
    ...currentCheckedItems.map(item => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity || 1,
      purchasedAt: Date.now(),
      date: new Date().toISOString().split('T')[0]
    }))
  ];

  // Calculs statistiques avancés
  const totalPurchases = allPurchases.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const uniqueItems = [...new Set(allPurchases.map(p => p.name))].length;
  const purchaseDates = [...new Set(allPurchases.map(p => 
    p.date || new Date(p.purchasedAt).toISOString().split('T')[0]
  ))];
  
  const dailyAverage = totalPurchases > 0 ? (totalPurchases / purchaseDates.length).toFixed(1) : 0;
  
  const categoryStats = allPurchases.reduce((acc, item) => {
    const cat = item.category || 'Autres';
    acc[cat] = (acc[cat] || 0) + (item.quantity || 1);
    return acc;
  }, {});
  
  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const purchaseCounts = allPurchases.reduce((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + (item.quantity || 1);
    return acc;
  }, {});
  
  const topItems = Object.entries(purchaseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {currentCheckedItems.length > 0 && (
        <div className={`p-4 rounded-xl ${
          theme === 'dark' ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm text-center ${
            theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
          }`}>
            📊 Inclut {currentCheckedItems.length} article(s) actuellement coché(s) + historique
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Articles" 
          value={totalPurchases} 
          icon="🛒"
          theme={theme}
        />
        <StatCard 
          title="Jours d'achat" 
          value={purchaseDates.length} 
          icon="📅"
          theme={theme}
        />
        <StatCard 
          title="Moyenne/jour" 
          value={dailyAverage} 
          icon="📊"
          theme={theme}
        />
        <StatCard 
          title="Articles uniques" 
          value={uniqueItems} 
          icon="🎯"
          theme={theme}
        />
      </div>

      {topCategories.length > 0 && (
        <div className={`rounded-xl p-4 ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h3 className={`font-bold text-lg mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Top Catégories
          </h3>
          <div className="space-y-2">
            {topCategories.map(([category, count], index) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getCategoryEmoji(category)}</span>
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                    {category}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full font-bold ${
                  theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-green-100 text-green-600'
                }`}>
                  {count} articles
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topItems.length > 0 && (
        <div className={`rounded-xl p-4 ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h3 className={`font-bold text-lg mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Top Articles
          </h3>
          <div className="space-y-2">
            {topItems.map(([item, count], index) => (
              <div key={item} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{index + 1}.</span>
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                    {item}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full font-bold ${
                  theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-purple-100 text-purple-600'
                }`}>
                  {count} fois
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Animation "Liste terminée"
const CompletionAnimation = ({ 
  show, 
  onClose, 
  onViewStats, 
  onViewHistory, 
  onValidateAndClear,
  theme 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!isVisible && !show) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`max-w-md w-full mx-4 rounded-3xl overflow-hidden transform transition-transform duration-300 ${
        isVisible ? 'scale-100' : 'scale-95'
      } ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-6 text-center ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-green-600 to-emerald-700' 
            : 'bg-gradient-to-br from-green-400 to-emerald-600'
        }`}>
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h3 className="text-2xl font-bold text-white mb-2">Liste terminée !</h3>
          <p className="text-white/90">Tous les articles ont été achetés !</p>
        </div>
        
        <div className={`p-6 space-y-4 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <p className={`text-center text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Que souhaitez-vous faire maintenant ?
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={onViewStats}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Voir les statistiques
            </button>
            
            <button
              onClick={onViewHistory}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 ${
                theme === 'dark'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Voir l'historique
            </button>

            <button
              onClick={onValidateAndClear}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 ${
                theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <Check className="w-5 h-5" />
              Valider et effacer
            </button>
            
            <button
              onClick={handleClose}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 ${
                theme === 'dark'
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
              Continuer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Header COMPLET avec menu fonctionnel
const Header = ({ totalItems, checkedItems, onResetTrends, onResetStats, onResetAll, theme, setTheme, onOpenSettings }) => {
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
  
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    storage.setTheme(newTheme);
  };

  return (
    <div className={`relative overflow-hidden px-4 sm:px-6 py-6 sm:py-8 mb-6 sm:mb-8 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500'
    }`}>
      <div className="absolute inset-0 bg-white opacity-20"></div>
      <div className="relative max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <ShoppingBasket className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Mes Courses
              </h1>
              <p className="text-white/80 text-xs sm:text-sm font-medium mt-1">
                Liste intelligente • 100% offline
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`flex items-center gap-2 p-1 rounded-xl ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-2 rounded-lg transition-all ${
                  theme === 'light' 
                    ? 'bg-white text-orange-600 shadow-lg' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Mode clair"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-2 rounded-lg transition-all ${
                  theme === 'dark' 
                    ? 'bg-white text-gray-900 shadow-lg' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Mode sombre"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {totalItems > 0 && (
              <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-white/20 backdrop-blur-sm'
              }`}>
                <div className="text-white text-center">
                  <div className="text-2xl sm:text-3xl font-black">{checkedItems}/{totalItems}</div>
                  <div className="text-xs font-medium opacity-90">articles</div>
                </div>
              </div>
            )}
            
            <div className="relative">
              <button
                onClick={onOpenSettings}
                className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all active:scale-95 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
                }`}
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
        {totalItems > 0 && (
          <div className={`rounded-full h-2 sm:h-3 overflow-hidden ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-white/20 backdrop-blur-sm'
          }`}>
            <div 
              className="bg-white h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Barre de recherche et tri
const SearchAndSort = ({ searchTerm, setSearchTerm, sortBy, setSortBy, sortOrder, setSortOrder, theme }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="🔍 Recherche instantanée..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-orange-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>
      
      <div className="flex gap-2">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-orange-400 focus:outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="name">Nom</option>
          <option value="category">Catégorie</option>
          <option value="date">Date</option>
          <option value="quantity">Quantité</option>
        </select>
        
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-medium"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  </div>
);

// Formulaire d'ajout avec quantité
const AddItemForm = ({ onAdd, theme }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isFocused, setIsFocused] = useState(false);
  
  const categories = [
    { name: 'Fruits & Légumes', emoji: '🥬', color: 'from-green-400 to-emerald-500' },
    { name: 'Viandes & Poissons', emoji: '🥩', color: 'from-red-400 to-rose-500' },
    { name: 'Produits laitiers', emoji: '🥛', color: 'from-blue-400 to-cyan-500' },
    { name: 'Épicerie', emoji: '🍝', color: 'from-yellow-400 to-amber-500' },
    { name: 'Boissons', emoji: '🥤', color: 'from-purple-400 to-violet-500' },
    { name: 'Hygiène', emoji: '🧼', color: 'from-pink-400 to-fuchsia-500' },
    { name: 'Autres', emoji: '📦', color: 'from-gray-400 to-slate-500' }
  ];
  
  const handleSubmit = () => {
    if (name.trim()) {
      onAdd({
        id: Date.now(),
        name: name.trim(),
        category: category || 'Autres',
        quantity: quantity,
        checked: false,
        addedAt: Date.now()
      });
      setName('');
      setCategory('');
      setQuantity(1);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decreaseQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
  };

  return (
    <div className={`relative rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 transition-all duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
    } ${isFocused ? 'ring-4 ring-orange-400/50 scale-[1.01] sm:scale-[1.02]' : ''}`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-orange-400 to-rose-500 p-2 rounded-xl">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={3} />
        </div>
        <h2 className={`text-lg sm:text-xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          Nouvel article
        </h2>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Que voulez-vous acheter ?"
            className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:border-orange-400 focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.name)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-xs sm:text-sm ${
                category === cat.name
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105`
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:scale-95'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
              }`}
            >
              <span className="text-base sm:text-xl">{cat.emoji}</span>
              <span className="truncate">{cat.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        
        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Quantité
          </label>
          <div className="flex items-center justify-between">
            <button
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className={`p-2 rounded-lg transition-all ${
                quantity <= 1
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <span className={`text-2xl font-bold px-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              {quantity}
            </span>
            
            <button
              onClick={increaseQuantity}
              className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 text-sm sm:text-base"
        >
          Ajouter à ma liste
        </button>
      </div>
    </div>
  );
};

// Liste avec gestion des quantités
const GroceryList = ({ items, onToggle, onDelete, onUpdateQuantity, onClearAll, onClearChecked, onDuplicateList, onResetChecked, theme }) => {
  const categoryInfo = {
    'Fruits & Légumes': { emoji: '🥬', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-400', check: 'bg-green-500' },
    'Viandes & Poissons': { emoji: '🥩', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-400', check: 'bg-red-500' },
    'Produits laitiers': { emoji: '🥛', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-400', check: 'bg-blue-500' },
    'Épicerie': { emoji: '🍝', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-400', check: 'bg-yellow-500' },
    'Boissons': { emoji: '🥤', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-400', check: 'bg-purple-500' },
    'Hygiène': { emoji: '🧼', bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-700 dark:text-pink-400', check: 'bg-pink-500' },
    'Autres': { emoji: '📦', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-300', check: 'bg-gray-500' }
  };
  
  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category || 'Autres';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  
  const hasCheckedItems = items.some(item => item.checked);
  
  const totalItemsCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const checkedItemsCount = items.reduce((sum, item) => sum + (item.checked ? (item.quantity || 1) : 0), 0);

  return (
    <div className={`rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 ${
      theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Ma liste
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {items.length} article{items.length > 1 ? 's' : ''} • {totalItemsCount} unité{totalItemsCount > 1 ? 's' : ''}
            {hasCheckedItems && ` • ${checkedItemsCount} coché${checkedItemsCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {items.length > 0 && (
            <button
              onClick={onDuplicateList}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm active:scale-95"
              title="Dupliquer la liste (les articles cochés seront décochés)"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Dupliquer</span>
            </button>
          )}
          
          {hasCheckedItems && (
            <button
              onClick={onResetChecked}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm active:scale-95"
              title="Décocher tous les articles"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Décocher tout</span>
              <span className="sm:hidden">Décocher</span>
            </button>
          )}
          
          {hasCheckedItems && (
            <button
              onClick={onClearChecked}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm active:scale-95"
              title="Supprimer les articles cochés et les ajouter à l'historique"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Valider achetés</span>
              <span className="sm:hidden">Achetés</span>
            </button>
          )}
          
          {items.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm active:scale-95"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Tout effacer</span>
              <span className="sm:hidden">Effacer</span>
            </button>
          )}
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-orange-900/20 to-rose-900/20' 
              : 'bg-gradient-to-br from-orange-100 to-rose-100'
          }`}>
            <ShoppingBasket className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" />
          </div>
          <p className={`font-medium text-sm sm:text-base ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Votre liste est vide
          </p>
          <p className={`text-xs sm:text-sm mt-1 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Commencez par ajouter un article
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const info = categoryInfo[category];
            const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const categoryChecked = categoryItems.reduce((sum, item) => sum + (item.checked ? (item.quantity || 1) : 0), 0);
            
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl">{info.emoji}</span>
                  <h3 className={`font-bold text-sm sm:text-base ${info.text}`}>
                    {category}
                  </h3>
                  <span className={`text-xs ml-auto ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {categoryChecked}/{categoryTotal}
                  </span>
                </div>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`${info.bg} border-2 ${info.border} rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 group hover:shadow-md transition-all duration-200 ${
                        item.checked ? 'opacity-60' : ''
                      }`}
                    >
                      <button
                        onClick={() => onToggle(item.id)}
                        className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                          item.checked 
                            ? `${info.check} border-transparent` 
                            : theme === 'dark'
                            ? 'border-gray-600 bg-gray-700 hover:border-gray-500 active:scale-90'
                            : 'border-gray-300 bg-white hover:border-gray-400 active:scale-90'
                        }`}
                      >
                        {item.checked && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={3} />}
                      </button>
                      
                      <span className={`font-semibold ${info.text} flex-1 text-sm sm:text-base ${
                        item.checked ? 'line-through' : ''
                      }`}>
                        {item.name}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          disabled={(item.quantity || 1) <= 1}
                          className={`p-1 rounded-lg transition-all ${
                            (item.quantity || 1) <= 1
                              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
                          }`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        
                        <span className={`px-2 py-1 min-w-8 text-center font-bold rounded-lg ${
                          theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {item.quantity || 1}
                        </span>
                        
                        <button
                          onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="p-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => onDelete(item.id)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-white dark:bg-gray-700 p-1.5 sm:p-2 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-110 active:scale-95"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Tendances
const TrendList = ({ trends, onResetTrends, theme, onViewDetails }) => {
  const MIN_COUNT = 3;
  
  const topTrends = Object.entries(trends)
    .filter(([_, count]) => count >= MIN_COUNT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topTrends.length === 0) {
    return (
      <div className={`rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 border border-gray-700' 
          : 'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500'
      } text-white`}>
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-2 rounded-xl ${
              theme === 'dark' ? 'bg-gray-600' : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                Top Ajouts
              </h2>
              <p className="text-white/80 text-xs sm:text-sm">
                Articles les plus ajoutés
              </p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
        }`}>
          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">📊</div>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Pas assez de données
          </p>
          <p className="text-xs text-white/70 mt-2">
            Ajoutez le même article au moins {MIN_COUNT} fois
          </p>
        </div>
      </div>
    );
  }
  
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  
  return (
    <div className={`rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 border border-gray-700' 
        : 'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500'
    } text-white`}>
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`p-2 rounded-xl ${
            theme === 'dark' ? 'bg-gray-600' : 'bg-white/20 backdrop-blur-sm'
          }`}>
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold">
              Top Ajouts
            </h2>
            <p className="text-white/80 text-xs sm:text-sm">
              Articles ajoutés {MIN_COUNT}+ fois
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onViewDetails}
            className={`p-2 rounded-lg transition-all active:scale-95 ${
              theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title="Voir le détail"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onResetTrends}
            className={`p-2 rounded-lg transition-all active:scale-95 flex-shrink-0 ${
              theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title="Réinitialiser les tendances"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {topTrends.map(([item, count], index) => (
          <div
            key={item}
            className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between hover:bg-white/10 transition-all ${
              theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-white/10 backdrop-blur-sm'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <span className="text-2xl sm:text-3xl flex-shrink-0">{medals[index]}</span>
              <span className="font-semibold text-sm sm:text-lg truncate">
                {item}
              </span>
            </div>
            <div className={`px-2 sm:px-3 py-1 rounded-full flex-shrink-0 ml-2 ${
              theme === 'dark' ? 'bg-gray-600' : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <span className="font-bold text-xs sm:text-sm">{count}×</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
        <p className="text-xs text-white/70 text-center">
          Total: {Object.keys(trends).length} articles différents suivis
        </p>
      </div>
    </div>
  );
};

// Historique par Jour
const DayHistory = ({ purchaseHistory, items, onResetStats, theme, onViewDetails }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Combiner l'historique avec les articles actuellement cochés
  const currentCheckedItems = items.filter(item => item.checked).map(item => ({
    name: item.name,
    category: item.category,
    quantity: item.quantity || 1,
    purchasedAt: Date.now(),
    date: new Date().toISOString().split('T')[0]
  }));
  
  const combinedHistory = [...purchaseHistory, ...currentCheckedItems];
  
  const purchasesByDate = combinedHistory.reduce((acc, purchase) => {
    const date = purchase.date || new Date(purchase.purchasedAt).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(purchase);
    return acc;
  }, {});
  
  const sortedDates = Object.keys(purchasesByDate).sort((a, b) => new Date(b) - new Date(a));
  
  const selectedPurchases = purchasesByDate[selectedDate] || [];
  
  const categoryStats = selectedPurchases.reduce((acc, item) => {
    const cat = item.category || 'Autres';
    acc[cat] = (acc[cat] || 0) + (item.quantity || 1);
    return acc;
  }, {});
  
  const categoryInfo = {
    'Fruits & Légumes': { emoji: '🥬', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' },
    'Viandes & Poissons': { emoji: '🥩', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' },
    'Produits laitiers': { emoji: '🥛', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    'Épicerie': { emoji: '🍝', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
    'Boissons': { emoji: '🥤', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/20' },
    'Hygiène': { emoji: '🧼', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/20' },
    'Autres': { emoji: '📦', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateString === today) return 'Aujourd\'hui';
    if (dateString === yesterday) return 'Hier';
    
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className={`rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 border border-gray-700' 
        : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500'
    } text-white`}>
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`p-2 rounded-xl ${
            theme === 'dark' ? 'bg-gray-600' : 'bg-white/20 backdrop-blur-sm'
          }`}>
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">
              Historique
            </h2>
            <p className="text-white/80 text-xs sm:text-sm">
              Vos achats par jour
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sortedDates.length > 0 && (
            <button
              onClick={onViewDetails}
              className={`p-2 rounded-lg transition-all active:scale-95 ${
                theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
              }`}
              title="Voir l'historique complet"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          {sortedDates.length > 0 && (
            <button
              onClick={onResetStats}
              className={`p-2 rounded-lg transition-all active:scale-95 ${
                theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
              }`}
              title="Réinitialiser l'historique"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
      
      {sortedDates.length === 0 ? (
        <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
        }`}>
          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">📅</div>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Aucun historique
          </p>
          <p className="text-xs text-white/70 mt-2">
            {items.filter(item => item.checked).length > 0 
              ? `${items.filter(item => item.checked).length} article(s) coché(s) seront ajoutés après validation`
              : 'Vos achats apparaîtront ici'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentCheckedItems.length > 0 && (
            <div className={`p-3 rounded-xl ${
              theme === 'dark' ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-xs text-center ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
              }`}>
                📝 Inclut {currentCheckedItems.length} article(s) actuellement coché(s) (en attente de validation)
              </p>
            </div>
          )}

          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
            theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
          }`}>
            <label className="block text-white/80 text-xs sm:text-sm mb-2 font-medium">
              Sélectionnez une date :
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white/20 border border-white/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {sortedDates.map(date => (
                <option key={date} value={date} className="text-gray-800">
                  {formatDate(date)} ({purchasesByDate[date].reduce((sum, item) => sum + (item.quantity || 1), 0)} articles)
                </option>
              ))}
            </select>
          </div>
          
          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
            theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm sm:text-base">
                {formatDate(selectedDate)}
              </h3>
              <div className={`px-2 sm:px-3 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-600' : 'bg-white/20 backdrop-blur-sm'
              }`}>
                <span className="font-bold text-xs sm:text-sm">
                  {selectedPurchases.reduce((sum, item) => sum + (item.quantity || 1), 0)} articles
                </span>
              </div>
            </div>
            
            {Object.keys(categoryStats).length > 0 && (
              <div className="mb-3">
                <p className="text-white/80 text-xs mb-2">Répartition :</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(categoryStats).map(([category, count]) => {
                    const info = categoryInfo[category] || categoryInfo['Autres'];
                    return (
                      <span
                        key={category}
                        className={`${info.bg} ${info.color} px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
                      >
                        <span>{info.emoji}</span>
                        <span>{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedPurchases.map((purchase, index) => {
                const info = categoryInfo[purchase.category] || categoryInfo['Autres'];
                const isPending = new Date(purchase.purchasedAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] &&
                                 purchaseHistory.findIndex(p => p.name === purchase.name && p.purchasedAt === purchase.purchasedAt) === -1;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between py-2 border-b border-white/10 last:border-b-0 ${
                      isPending ? 'border-2 border-yellow-400 rounded-lg p-2' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.emoji}</span>
                      <span className={`font-medium text-sm sm:text-base ${isPending ? 'italic' : ''}`}>
                        {purchase.name}
                        {isPending && <span className="text-xs ml-2 text-yellow-400">(en attente)</span>}
                      </span>
                      {purchase.quantity > 1 && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white/20 text-white'
                        }`}>
                          {purchase.quantity}
                        </span>
                      )}
                    </div>
                    <div className="text-white/70 text-xs">
                      {new Date(purchase.purchasedAt).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center ${
            theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
          }`}>
            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <div className="text-white/80">Total jours</div>
                <div className="font-bold text-lg sm:text-xl">{sortedDates.length}</div>
              </div>
              <div>
                <div className="text-white/80">Total achats</div>
                <div className="font-bold text-lg sm:text-xl">
                  {combinedHistory.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Statistiques avec moyenne par jour
const PurchaseStats = ({ purchaseHistory, items, theme, onViewDetails }) => {
  // Combiner l'historique avec les articles actuellement cochés
  const currentCheckedItems = items.filter(item => item.checked);
  const allPurchases = [
    ...purchaseHistory,
    ...currentCheckedItems.map(item => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity || 1,
      purchasedAt: Date.now(),
      date: new Date().toISOString().split('T')[0]
    }))
  ];

  // Calculs statistiques avancés
  const totalPurchases = allPurchases.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const uniqueItems = [...new Set(allPurchases.map(p => p.name))].length;
  const purchaseDates = [...new Set(allPurchases.map(p => 
    p.date || new Date(p.purchasedAt).toISOString().split('T')[0]
  ))];
  
  const dailyAverage = totalPurchases > 0 ? (totalPurchases / purchaseDates.length).toFixed(1) : 0;
  
  const categoryStats = allPurchases.reduce((acc, item) => {
    const cat = item.category || 'Autres';
    acc[cat] = (acc[cat] || 0) + (item.quantity || 1);
    return acc;
  }, {});
  
  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const purchaseCounts = allPurchases.reduce((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + (item.quantity || 1);
    return acc;
  }, {});
  
  const topItems = Object.entries(purchaseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];

  const hasData = totalPurchases > 0;

  if (!hasData) {
    return (
      <div className={`rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 border border-gray-700' 
          : 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500'
      } text-white`}>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className={`p-2 rounded-xl ${
            theme === 'dark' ? 'bg-gray-600' : 'bg-white/20 backdrop-blur-sm'
          }`}>
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">
              Statistiques
            </h2>
            <p className="text-white/80 text-xs sm:text-sm">
              Vos habitudes d'achat
            </p>
          </div>
        </div>
        <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
        }`}>
          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">📈</div>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Aucune donnée
          </p>
          <p className="text-xs text-white/70 mt-2">
            {items.filter(item => item.checked).length > 0 
              ? `${items.filter(item => item.checked).length} article(s) coché(s) seront inclus après validation`
              : 'Vos statistiques apparaîtront ici'
            }
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 border border-gray-700' 
        : 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500'
    } text-white`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className={`p-2 rounded-xl ${
          theme === 'dark' ? 'bg-gray-600' : 'bg-white/20 backdrop-blur-sm'
        }`}>
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold">
            Statistiques
            </h2>
          <p className="text-white/80 text-xs sm:text-sm">
            {currentCheckedItems.length > 0 ? "Achats actuels + historique" : "Vos habitudes d'achat"}
          </p>
        </div>
        {hasData && (
          <button
            onClick={onViewDetails}
            className={`p-2 rounded-lg transition-all active:scale-95 ${
              theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title="Voir les statistiques détaillées"
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
        }`}>
          <div className="text-white/80 text-xs sm:text-sm mb-1">Total acheté</div>
          <div className="text-2xl sm:text-3xl font-black">{totalPurchases}</div>
          <div className="text-white/70 text-xs mt-1">
            {currentCheckedItems.length > 0 && (
              <span>(+{currentCheckedItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} en cours)</span>
            )}
          </div>
        </div>
        
        <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
        }`}>
          <div className="text-white/80 text-xs sm:text-sm mb-1">Moyenne par jour</div>
          <div className="text-2xl sm:text-3xl font-black">{dailyAverage}</div>
          <div className="text-white/70 text-xs mt-1">articles/jour</div>
        </div>
        
        <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
        }`}>
          <div className="text-white/80 text-xs sm:text-sm mb-1">Jours d'achat</div>
          <div className="text-2xl sm:text-3xl font-black">{purchaseDates.length}</div>
          <div className="text-white/70 text-xs mt-1">jours différents</div>
        </div>
        
        {topCategory && (
          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
            theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
          }`}>
            <div className="text-white/80 text-xs sm:text-sm mb-1">Catégorie favorite</div>
            <div className="text-lg sm:text-xl font-bold truncate">{topCategory[0]}</div>
            <div className="text-white/70 text-xs mt-1">{topCategory[1]} achats</div>
          </div>
        )}
        
        {topItems.length > 0 && (
          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
            theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/10 backdrop-blur-sm'
          }`}>
            <div className="text-white/80 text-xs sm:text-sm mb-2 sm:mb-3">Top achats</div>
            <div className="space-y-2">
              {topItems.slice(0, 3).map(([item, count], idx) => (
                <div key={item} className="flex items-center justify-between gap-2">
                  <span className="font-medium text-xs sm:text-sm truncate">{idx + 1}. {item}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                    theme === 'dark' ? 'bg-gray-600' : 'bg-white/20 backdrop-blur-sm'
                  }`}>{count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant principal
export default function App() {
  const [items, setItems] = useState([]);
  const [trends, setTrends] = useState({});
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [theme, setTheme] = useState('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCompletion, setShowCompletion] = useState(false);
  
  // États pour les modales
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // État pour le responsive
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Chargement initial
  useEffect(() => {
    setItems(storage.getItems());
    setTrends(storage.getTrends());
    setPurchaseHistory(storage.getPurchaseHistory());
    
    // Charger le thème sauvegardé
    const savedTheme = storage.getTheme();
    setTheme(savedTheme);
  }, []);
  
  // Gestion du thème
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  // Gestion du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Déterminer le type d'appareil
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;
  
  // Animation "Liste terminée"
  useEffect(() => {
    if (items.length > 0 && items.every(item => item.checked)) {
      setShowCompletion(true);
    }
  }, [items]);
  
  // Sauvegarde auto silencieuse
  useEffect(() => {
    const interval = setInterval(() => {
      if (items.length > 0) {
        storage.setItems(items);
        storage.setTrends(trends);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [items, trends]);
  
  // Fonction de recherche et tri
  const sortedItems = useMemo(() => {
    let filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name': aVal = a.name; bVal = b.name; break;
        case 'category': aVal = a.category; bVal = b.category; break;
        case 'date': aVal = a.addedAt; bVal = b.addedAt; break;
        case 'quantity': aVal = a.quantity || 1; bVal = b.quantity || 1; break;
        default: return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : 1;
      } else {
        return aVal > bVal ? -1 : 1;
      }
    });
  }, [items, searchTerm, sortBy, sortOrder]);
  
  const addItem = (item) => {
    const newItems = [...items, item];
    setItems(newItems);
    storage.setItems(newItems);
    
    const newTrends = { ...trends };
    newTrends[item.name] = (newTrends[item.name] || 0) + 1;
    setTrends(newTrends);
    storage.setTrends(newTrends);
  };
  
  const toggleItem = (id) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(newItems);
    storage.setItems(newItems);
  };
  
  const deleteItem = (id) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    storage.setItems(newItems);
  };
  
  const updateQuantity = (id, newQuantity) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setItems(newItems);
    storage.setItems(newItems);
  };
  
  const clearAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir tout effacer ?')) {
      setItems([]);
      storage.setItems([]);
    }
  };
  
  const clearChecked = () => {
    const checkedItems = items.filter(item => item.checked);
    
    if (checkedItems.length === 0) {
      alert('Aucun article coché à supprimer !');
      return;
    }
    
    if (window.confirm(`Supprimer ${checkedItems.length} article(s) coché(s) et les ajouter à l'historique ?`)) {
      storage.addToPurchaseHistory(items);
      const newItems = items.filter(item => !item.checked);
      setItems(newItems);
      storage.setItems(newItems);
      const updatedHistory = storage.getPurchaseHistory();
      setPurchaseHistory(updatedHistory);
      alert(`${checkedItems.length} article(s) ajouté(s) à l'historique et supprimé(s) de la liste !`);
    }
  };
  
  const resetCheckedItems = () => {
    const checkedItems = items.filter(item => item.checked);
    
    if (checkedItems.length === 0) {
      alert('Aucun article coché à réinitialiser !');
      return;
    }
    
    if (window.confirm(`Décocher ${checkedItems.length} article(s) ?`)) {
      const newItems = items.map(item => ({
        ...item,
        checked: false
      }));
      
      setItems(newItems);
      storage.setItems(newItems);
    }
  };
  
  const duplicateList = () => {
    if (items.length === 0) {
      alert('La liste est vide !');
      return;
    }
    
    if (!window.confirm('Voulez-vous dupliquer la liste actuelle ? Les articles cochés seront décochés dans la nouvelle liste.')) {
      return;
    }
    
    const newItems = items.map(item => ({
      ...item,
      id: Date.now() + Math.random(),
      checked: false,
      addedAt: Date.now()
    }));
    
    setItems(newItems);
    storage.setItems(newItems);
    alert(`Liste dupliquée avec succès ! ${newItems.length} article(s) copié(s).`);
  };
  
  const validateAndClear = () => {
    storage.addToPurchaseHistory(items);
    const newItems = items.filter(item => !item.checked);
    setItems(newItems);
    storage.setItems(newItems);
    const updatedHistory = storage.getPurchaseHistory();
    setPurchaseHistory(updatedHistory);
    setShowCompletion(false);
    alert(`${items.filter(item => item.checked).length} article(s) validé(s) et supprimé(s) de la liste !`);
  };
  
  const resetTrends = () => {
    storage.resetTrends();
    setTrends({});
  };
  
  const resetStats = () => {
    storage.resetStats();
    setPurchaseHistory([]);
  };
  
  const resetAll = () => {
    storage.resetAll();
    setItems([]);
    setTrends({});
    setPurchaseHistory([]);
  };
  
  const handleExport = () => {
    if (items.length === 0) {
      alert('Votre liste est vide !');
      return;
    }
    exportToCSV(items);
  };
  
  const checkedCount = items.reduce((sum, item) => sum + (item.checked ? (item.quantity || 1) : 0), 0);
  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50'
    } ${isMobile ? 'mobile-layout' : isTablet ? 'tablet-layout' : 'desktop-layout'}`}>
      <Header 
        totalItems={totalCount} 
        checkedItems={checkedCount}
        onResetTrends={resetTrends}
        onResetStats={resetStats}
        onResetAll={resetAll}
        theme={theme}
        setTheme={setTheme}
        onOpenSettings={() => setShowSettingsModal(true)}
      />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-8 sm:pb-12">
        <div className={`grid ${
          isMobile ? 'grid-cols-1' : 
          isTablet ? 'grid-cols-1' : 
          'grid-cols-1 lg:grid-cols-3'
        } gap-4 sm:gap-6`}>
          {/* Colonne principale avec la liste des courses */}
          <div className="lg:col-span-2">
            {items.length > 0 && (
              <SearchAndSort
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                theme={theme}
              />
            )}
            
            <GroceryList
              items={sortedItems}
              onToggle={toggleItem}
              onDelete={deleteItem}
              onUpdateQuantity={updateQuantity}
              onClearAll={clearAll}
              onClearChecked={clearChecked}
              onDuplicateList={duplicateList}
              onResetChecked={resetCheckedItems}
              theme={theme}
            />
          </div>
          
          {/* Colonne latérale avec formulaire, stats et historique */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <AddItemForm onAdd={addItem} theme={theme} />
            
            {items.length > 0 && (
              <button
                onClick={handleExport}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95 text-sm sm:text-base"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                Exporter CSV
              </button>
            )}
            
            <TrendList 
              trends={trends} 
              onResetTrends={resetTrends} 
              theme={theme}
              onViewDetails={() => setShowTrendsModal(true)}
            />
            <DayHistory 
              purchaseHistory={purchaseHistory} 
              items={items}
              onResetStats={resetStats} 
              theme={theme}
              onViewDetails={() => setShowHistoryModal(true)}
            />
            <PurchaseStats 
              purchaseHistory={purchaseHistory} 
              items={items}
              theme={theme}
              onViewDetails={() => setShowStatsModal(true)}
            />
          </div>
        </div>
        
        <div className="mt-8 sm:mt-12 text-center">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-md ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
            <span className={`text-xs sm:text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              ✓ Gestion des quantités • ✓ Recherche instantanée • ✓ Tri (catégorie/nom/date/quantité)<br />
              ✓ Dupliquer la liste • ✓ Animation "Liste terminée" • ✓ Stats en temps réel<br />
              ✓ Sauvegarde auto silencieuse • 100% local • Zéro permission 
            </span>
          </div>
        </div>
      </main>
      
      <CompletionAnimation 
        show={showCompletion} 
        onClose={() => setShowCompletion(false)}
        onViewStats={() => setShowStatsModal(true)}
        onViewHistory={() => setShowHistoryModal(true)}
        onValidateAndClear={validateAndClear}
        theme={theme}
      />
      
      <Modal 
        isOpen={showTrendsModal} 
        onClose={() => setShowTrendsModal(false)}
        title="Top Ajouts - Détail Complet"
        theme={theme}
        size="lg"
      >
        <div className="p-6">
          <TrendsModalContent trends={trends} theme={theme} />
        </div>
      </Modal>

      <Modal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)}
        title="Historique Complet des Achats"
        theme={theme}
        size="xl"
      >
        <div className="p-6">
          <HistoryModalContent 
            purchaseHistory={purchaseHistory} 
            items={items}
            theme={theme} 
          />
        </div>
      </Modal>

      <Modal 
        isOpen={showStatsModal} 
        onClose={() => setShowStatsModal(false)}
        title="Statistiques Détaillées"
        theme={theme}
        size="lg"
      >
        <div className="p-6">
          <StatsModalContent purchaseHistory={purchaseHistory} items={items} theme={theme} />
        </div>
      </Modal>

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        onResetTrends={resetTrends}
        onResetStats={resetStats}
        onResetAll={resetAll}
      />
    </div>
  );
}