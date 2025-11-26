import React from 'react';
import { Transaction } from '../types.ts';
import { ShoppingBag, Coffee, Home, Car, Smartphone, Zap, Trash2, Dumbbell, Gift } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  limit?: number;
  currency: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, limit, currency }) => {
  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'покупки':
      case 'шопинг': return <ShoppingBag size={20} />;
      case 'еда':
      case 'продукты': return <Coffee size={20} />;
      case 'жилье':
      case 'дом': return <Home size={20} />;
      case 'транспорт':
      case 'авто': return <Car size={20} />;
      case 'жкх':
      case 'услуги': return <Zap size={20} />;
      case 'развлечения': return <Smartphone size={20} />;
      case 'спорт': return <Dumbbell size={20} />;
      default: return <Gift size={20} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'покупки': return 'bg-purple-100 text-purple-600';
      case 'еда': return 'bg-orange-100 text-orange-600';
      case 'жилье': return 'bg-blue-100 text-blue-600';
      case 'транспорт': return 'bg-indigo-100 text-indigo-600';
      case 'жкх': return 'bg-yellow-100 text-yellow-600';
      case 'спорт': return 'bg-teal-100 text-teal-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center opacity-50 animate-enter">
        <ShoppingBag className="mb-2 text-slate-400" size={32} />
        <p className="text-sm font-medium text-slate-500">Пока нет операций</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayTransactions.map((tx, index) => (
        <div 
          key={tx.id} 
          className="flex items-center justify-between group animate-enter opacity-0"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${getCategoryColor(tx.category)}`}>
              {getIcon(tx.category)}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{tx.merchant}</p>
              <p className="text-xs text-slate-400">{tx.category} • {new Date(tx.date).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-bold text-sm ${tx.type === 'expense' ? 'text-slate-800' : 'text-emerald-500'}`}>
              {tx.type === 'expense' ? '-' : '+'}{Math.abs(tx.amount).toLocaleString('ru-RU')} {currency}
            </span>
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }}
                className="text-slate-300 hover:text-rose-500 transition-colors hover:scale-110 active:scale-90"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};