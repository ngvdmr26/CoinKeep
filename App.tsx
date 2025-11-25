import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Wallet, 
  PieChart, 
  Settings, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Bell, 
  Wifi,
  CreditCard as CreditCardIcon,
  X,
  Check,
  User,
  Coffee,
  ShoppingBag,
  Car,
  Zap,
  Smartphone,
  Dumbbell,
  Briefcase,
  Sparkles,
  Upload,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, CartesianGrid } from 'recharts';

// Исправлены импорты: добавлены расширения файлов
import { Transaction, MonthlyData, Subscription } from './types.ts';
import { StatCard } from './components/StatCard.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { AIAssistant } from './components/AIAssistant.tsx';

// -- Constants & Helpers --

// Base Currency for internal calculation logic: USD
// Rate = How many units of currency per 1 USD
const DEFAULT_RATES: Record<string, number> = {
  'USD': 1,
  'RUB': 96.5,
  'EUR': 0.92,
  'KZT': 490.0,
  'BYN': 3.25
};

const CURRENCIES = [
  { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'KZT', symbol: '₸', name: 'Тенге' },
  { code: 'BYN', symbol: 'Br', name: 'Бел. рубль' },
];

const CATEGORIES = [
  { id: 'Еда', label: 'Еда', icon: <Coffee size={24} />, color: 'bg-orange-100 text-orange-600' },
  { id: 'Транспорт', label: 'Транспорт', icon: <Car size={24} />, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'Покупки', label: 'Покупки', icon: <ShoppingBag size={24} />, color: 'bg-purple-100 text-purple-600' },
  { id: 'ЖКХ', label: 'ЖКХ', icon: <Zap size={24} />, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'Жилье', label: 'Жилье', icon: <Home size={24} />, color: 'bg-blue-100 text-blue-600' },
  { id: 'Развлечения', label: 'Отдых', icon: <Smartphone size={24} />, color: 'bg-pink-100 text-pink-600' },
  { id: 'Спорт', label: 'Спорт', icon: <Dumbbell size={24} />, color: 'bg-teal-100 text-teal-600' },
  { id: 'Доход', label: 'Доход', icon: <Briefcase size={24} />, color: 'bg-emerald-100 text-emerald-600' },
];

// -- Components for Mobile Layout --

const BottomNav = ({ active, onChange }: { active: string, onChange: (val: string) => void }) => {
  const items = [
    { id: 'home', icon: <Home size={24} />, label: 'Главная' },
    { id: 'stats', icon: <PieChart size={24} />, label: 'Отчеты' },
    { id: 'ai', icon: <Sparkles size={24} />, label: 'Советник' },
    { id: 'wallet', icon: <Wallet size={24} />, label: 'Кошелек' },
    { id: 'settings', icon: <Settings size={24} />, label: 'Меню' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe pt-2 px-4 flex justify-between items-end h-[80px] z-40 max-w-[480px] mx-auto">
      {items.map((item) => (
        <button 
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex flex-col items-center gap-1 mb-4 transition-all w-full ${active === item.id ? 'text-indigo-600 scale-105' : 'text-slate-400'}`}
        >
          {item.icon}
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const CreditCardComponent = ({ balance, currency, ownerName }: { balance: number, currency: string, ownerName: string }) => (
  <div className="w-full aspect-[1.586] bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800 rounded-[2rem] p-6 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden transform transition-transform hover:scale-[1.01]">
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 opacity-20 rounded-full blur-xl"></div>
    
    <div className="flex flex-col justify-between h-full relative z-10">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Общий баланс</p>
          <h2 className="text-3xl font-bold tracking-tight">{balance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} {currency}</h2>
        </div>
        <Wifi className="text-white/50 rotate-90" size={24} />
      </div>

      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
           <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
           </div>
           <span className="font-mono text-lg text-white/90 tracking-widest">****</span>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-indigo-200 uppercase font-bold mb-1">Владелец</p>
           <p className="font-medium text-sm uppercase truncate max-w-[120px]">{ownerName}</p>
        </div>
      </div>
    </div>
  </div>
);

// -- Onboarding Component --
const OnboardingScreen = ({ onComplete }: { onComplete: (name: string, currency: string) => void }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('RUB');

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-8 animate-fade-in max-w-[480px] mx-auto">
      <div className="w-full max-w-xs text-center">
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-8">
              <Sparkles size={40} />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-slate-900">Добро пожаловать</h1>
            <p className="text-slate-500 mb-8">Давайте настроим ваш профиль для начала работы.</p>
            
            <div className="text-left mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ваше имя</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Иван"
                className="w-full mt-2 p-4 bg-slate-50 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-100"
                autoFocus
              />
            </div>
            
            <button 
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Далее
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Выберите валюту</h2>
            <p className="text-slate-500 mb-6">В какой валюте вы хотите вести учет?</p>
            
            <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto">
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                    currency === c.code 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className={`font-bold ${currency === c.code ? 'text-indigo-200' : 'text-slate-400'}`}>{c.symbol}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => onComplete(name, currency)}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
            >
              Начать работу
            </button>
            
            <button 
              onClick={() => setStep(1)}
              className="mt-4 text-slate-400 text-sm font-medium"
            >
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// -- Main App --

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);
  
  // User Settings State
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState('RUB');
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '₽';

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [selectedCategory, setSelectedCategory] = useState('Еда');
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Data
  useEffect(() => {
    const savedUser = localStorage.getItem('coinkeep_username');
    
    if (!savedUser) {
      setShowOnboarding(true);
      setIsLoading(false);
      return;
    }

    const savedTx = localStorage.getItem('coinkeep_transactions');
    const savedSub = localStorage.getItem('coinkeep_subscriptions');
    const savedAvatar = localStorage.getItem('coinkeep_avatar');
    const savedCurr = localStorage.getItem('coinkeep_currency');

    setUserName(savedUser);
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedSub) setSubscriptions(JSON.parse(savedSub));
    if (savedAvatar) setUserAvatar(savedAvatar);
    if (savedCurr) setCurrencyCode(savedCurr);
    
    setIsLoading(false);
  }, []);

  // Fetch Real Rates
  useEffect(() => {
    const fetchRates = async () => {
      setRatesLoading(true);
      try {
        // Fetch Base USD rates
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates) {
          setRates(prev => ({
            ...prev,
            ...data.rates
          }));
        }
      } catch (e) {
        console.error("Failed to fetch rates, using defaults", e);
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, []);

  // Save Data
  useEffect(() => {
    if (!isLoading && !showOnboarding) {
      localStorage.setItem('coinkeep_transactions', JSON.stringify(transactions));
      localStorage.setItem('coinkeep_subscriptions', JSON.stringify(subscriptions));
      localStorage.setItem('coinkeep_username', userName);
      localStorage.setItem('coinkeep_currency', currencyCode);
      if (userAvatar) localStorage.setItem('coinkeep_avatar', userAvatar);
    }
  }, [transactions, subscriptions, userName, currencyCode, userAvatar, isLoading, showOnboarding]);

  // Conversion Logic: (Amount / RateFrom) * RateTo
  const convertValue = (amount: number, fromCode: string, toCode: string) => {
    if (fromCode === toCode) return amount;
    const rateFrom = rates[fromCode] || DEFAULT_RATES[fromCode] || 1;
    const rateTo = rates[toCode] || DEFAULT_RATES[toCode] || 1;
    
    // Amount in USD
    const inUSD = amount / rateFrom;
    // Amount in Target
    const result = inUSD * rateTo;
    
    return Math.round(result * 100) / 100;
  };

  const handleChangeCurrency = (newCode: string) => {
    if (newCode === currencyCode) return;

    // Convert transactions
    const newTx = transactions.map(t => ({
      ...t,
      amount: convertValue(t.amount, currencyCode, newCode)
    }));
    setTransactions(newTx);

    // Convert subscriptions
    const newSub = subscriptions.map(s => ({
      ...s,
      amount: convertValue(s.amount, currencyCode, newCode)
    }));
    setSubscriptions(newSub);

    setCurrencyCode(newCode);
    setIsCurrencyModalOpen(false);
  };

  const handleClearData = () => {
    if (window.confirm("Вы уверены? Это удалит все данные приложения безвозвратно.")) {
      localStorage.removeItem('coinkeep_transactions');
      localStorage.removeItem('coinkeep_subscriptions');
      localStorage.removeItem('coinkeep_username');
      localStorage.removeItem('coinkeep_avatar');
      localStorage.removeItem('coinkeep_currency');
      
      window.location.reload();
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUserAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOnboardingComplete = (name: string, currency: string) => {
    setUserName(name);
    setCurrencyCode(currency);
    setShowOnboarding(false);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
  const totalBalance = totalIncome - totalExpenses;
  const monthlySubscriptionCost = subscriptions.filter(s => s.active).reduce((acc, curr) => acc + curr.amount, 0);

  // Handlers
  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const type = txType;
    
    if (!amount) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      date: formData.get('date') as string,
      merchant: formData.get('merchant') as string,
      category: selectedCategory,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      type,
      status: 'completed'
    };

    setTransactions([newTx, ...transactions]);
    setIsTxModalOpen(false);
    setSelectedCategory('Еда');
  };

  const handleAddSubscription = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSub: Subscription = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      amount: parseFloat(formData.get('amount') as string),
      billingDay: parseInt(formData.get('billingDay') as string),
      category: formData.get('category') as string,
      active: true
    };
    setSubscriptions([...subscriptions, newSub]);
    setIsSubModalOpen(false);
  };

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUserName(formData.get('username') as string);
    setIsProfileModalOpen(false);
  }

  const generateChartData = (): MonthlyData[] => {
    const base = Math.max(totalBalance, 100); 
    return [
      { name: 'Май', income: base * 0.9, expenses: base * 0.7 },
      { name: 'Июн', income: base * 1.1, expenses: base * 0.8 },
      { name: 'Июл', income: base * 0.95, expenses: base * 1.0 },
      { name: 'Авг', income: base * 1.2, expenses: base * 0.9 },
      { name: 'Сен', income: base * 1.0, expenses: base * 0.6 },
      { name: 'Окт', income: base * 1.05, expenses: base * 0.85 },
    ];
  };

  if (isLoading) return null;

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col h-screen overflow-hidden">
      
      {activeTab !== 'ai' && (
        <header className="pt-10 px-6 pb-4 flex justify-between items-center bg-white z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer flex-shrink-0"
            >
               {userAvatar ? (
                 <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Profile" className="w-full h-full object-cover" />
               )}
            </div>
            <div onClick={() => setIsProfileModalOpen(true)} className="cursor-pointer">
              <p className="text-xs text-slate-400 font-medium">Доброе утро,</p>
              <h1 className="text-lg font-bold text-slate-800 truncate max-w-[150px]">{userName}</h1>
            </div>
          </div>
          <button className="relative p-2 rounded-full bg-slate-50 border border-slate-100">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
          </button>
        </header>
      )}

      {/* Main Content Area - Full height for AI with no padding, standard for others */}
      <main className={`flex-1 animate-fade-in ${activeTab === 'ai' ? 'px-0 pt-0 overflow-hidden relative' : 'px-6 pb-[100px] overflow-y-auto'}`}>
        
        {activeTab === 'home' && (
          <div className="space-y-8 pb-6">
            <CreditCardComponent balance={totalBalance} currency={currencySymbol} ownerName={userName} />

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setTxType('income'); setIsTxModalOpen(true); }}
                className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center gap-2 group active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800">Доход</span>
                  <span className="text-[10px] text-slate-400">Пополнить</span>
                </div>
              </button>
              <button 
                onClick={() => { setTxType('expense'); setIsTxModalOpen(true); }}
                className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center gap-2 group active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800">Расход</span>
                  <span className="text-[10px] text-slate-400">Потратить</span>
                </div>
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800">Сегодня</h3>
                <button onClick={() => setActiveTab('stats')} className="text-sm text-indigo-600 font-medium">Все</button>
              </div>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 min-h-[200px]">
                <TransactionList 
                  transactions={transactions} 
                  limit={5} 
                  onDelete={(id) => setTransactions(transactions.filter(t => t.id !== id))} 
                  currency={currencySymbol}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 pb-6">
            <h2 className="text-2xl font-bold">Статистика</h2>
            
            <div className="h-64 bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 relative overflow-hidden">
               <h3 className="text-sm font-medium text-slate-500 mb-4 px-2">Динамика баланса</h3>
               <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={generateChartData()}>
                    <defs>
                      <linearGradient id="colorIncomeMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10}} 
                      dy={10}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: 'white', fontSize: '12px' }}
                        itemStyle={{ color: '#94a3b8' }}
                        labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                        formatter={(value: number) => [`${value.toFixed(0)} ${currencySymbol}`, 'Сумма']}
                      />
                    <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={3} fill="url(#colorIncomeMobile)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>

            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              <StatCard title="Доход" value={`+${totalIncome.toFixed(0)} ${currencySymbol}`} color="emerald" icon={<ArrowDownLeft size={16}/>} />
              <StatCard title="Расход" value={`-${totalExpenses.toFixed(0)} ${currencySymbol}`} color="rose" icon={<ArrowUpRight size={16}/>} />
              <StatCard title="Подписки" value={`${monthlySubscriptionCost.toFixed(0)} ${currencySymbol}`} color="amber" icon={<CreditCardIcon size={16}/>} />
            </div>

            <div className="pb-10">
               <h3 className="font-bold text-lg mb-4">История операций</h3>
               <TransactionList 
                  transactions={transactions} 
                  onDelete={(id) => setTransactions(transactions.filter(t => t.id !== id))} 
                  currency={currencySymbol}
                />
            </div>
          </div>
        )}

        {/* AI Separate Tab - Occupies full height minus bottom bar */}
        {activeTab === 'ai' && (
           <AIAssistant transactions={transactions} totalBalance={totalBalance} />
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-6 pb-6">
            <div className="flex justify-between items-end">
               <h2 className="text-2xl font-bold">Мои подписки</h2>
               <button 
                onClick={() => setIsSubModalOpen(true)} 
                className="bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
               >
                 <Plus size={20} />
               </button>
            </div>

            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-10 text-center border border-dashed border-slate-300">
                <CreditCardIcon size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Нет активных подписок</p>
                <p className="text-xs text-slate-400 mt-2">Добавьте регулярные платежи для контроля</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg">
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{sub.name}</h4>
                        <p className="text-xs text-slate-400">{sub.billingDay}-е число месяца</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-lg">{sub.amount} {currencySymbol}</span>
                      <button 
                        onClick={() => setSubscriptions(subscriptions.filter(s => s.id !== sub.id))}
                        className="text-xs text-rose-500 bg-rose-50 px-2 py-1 rounded-lg"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
             <div className="bg-indigo-600 rounded-[2rem] p-6 text-white mt-4">
                <h3 className="font-bold text-lg mb-1">Итого в месяц</h3>
                <p className="opacity-80 text-sm mb-4">Общая сумма всех подписок</p>
                <p className="text-3xl font-bold">{monthlySubscriptionCost.toLocaleString('ru-RU')} {currencySymbol}</p>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 pb-6">
            <h2 className="text-2xl font-bold">Настройки</h2>
            <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">
               
               <div 
                 onClick={() => setIsProfileModalOpen(true)}
                 className="p-4 border-b border-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
               >
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><User size={20}/></div>
                    <span className="font-medium text-slate-700">Профиль</span>
                  </div>
                  <div className="text-slate-400 text-sm flex items-center gap-2">{userName}</div>
               </div>

               <div 
                  onClick={() => setIsCurrencyModalOpen(true)}
                  className="p-4 border-b border-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
               >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><Wallet size={20}/></div>
                    <span className="font-medium text-slate-700">Валюта</span>
                  </div>
                  <div className="text-slate-400 text-sm">{currencyCode} ({currencySymbol})</div>
               </div>

               <div 
                 onClick={handleClearData}
                 className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-50 p-2 rounded-xl text-rose-500 group-hover:bg-rose-100"><LogOut size={20}/></div>
                    <span className="font-medium text-rose-500">Сбросить данные</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-rose-400" />
               </div>
            </div>
            <p className="text-center text-xs text-slate-400 mt-10">CoinKeep v2.6 Mobile</p>
          </div>
        )}

      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* -- Modals -- */}
      {/* ... (Existing modals for Tx, Sub, Profile remain mostly same, Currency modal updated below) ... */}
      
      {/* Add Transaction Overlay */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-[480px] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {txType === 'expense' ? 'Новый расход' : 'Новый доход'}
              </h3>
              <button onClick={() => setIsTxModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Сумма</label>
                <div className="relative mt-1">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">{currencySymbol}</span>
                  <input 
                    name="amount" 
                    type="number" 
                    step="0.01"
                    autoFocus
                    required
                    placeholder="0" 
                    className="w-full text-4xl font-bold text-slate-800 bg-transparent border-b-2 border-slate-100 pb-2 pl-8 focus:border-indigo-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Категория</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all ${
                        selectedCategory === cat.id 
                          ? `${cat.color} ring-2 ring-offset-1 ring-slate-200 shadow-sm scale-105` 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {cat.icon}
                      <span className="text-[10px] font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Дата</label>
                <input 
                  name="date" 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full mt-2 p-4 bg-slate-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase ml-1">Название</label>
                 <input 
                    name="merchant" 
                    type="text" 
                    placeholder="Например: Супермаркет"
                    required
                    className="w-full mt-2 p-4 bg-slate-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-100"
                 />
              </div>

              <button 
                type="submit" 
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg text-lg active:scale-95 transition-transform ${
                  txType === 'expense' ? 'bg-rose-500 shadow-rose-200' : 'bg-emerald-500 shadow-emerald-200'
                }`}
              >
                {txType === 'expense' ? 'Добавить расход' : 'Добавить доход'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Subscription Overlay */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-[480px] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-10 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Новая подписка</h3>
              <button onClick={() => setIsSubModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Название сервиса</label>
                <input name="name" placeholder="Netflix, Spotify..." required className="w-full mt-1 p-4 bg-slate-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-100" />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Стоимость ({currencySymbol})</label>
                  <input name="amount" type="number" placeholder="0" required className="w-full mt-1 p-4 bg-slate-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div className="w-1/3">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">День списания</label>
                  <input name="billingDay" type="number" min="1" max="31" placeholder="1-31" required className="w-full mt-1 p-4 bg-slate-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>

              <input type="hidden" name="category" value="Развлечения" />
              
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform mt-4">
                Сохранить подписку
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-[480px] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-10 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Редактировать профиль</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
               <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200">
                        {userAvatar ? (
                            <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Avatar" className="w-full h-full object-cover" />
                        )}
                    </div>
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg"
                    >
                        <Upload size={16} />
                    </button>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Нажмите на иконку чтобы изменить фото</p>
               </div>

               <div>
                 <label className="text-xs font-bold text-slate-400 uppercase ml-1">Имя пользователя</label>
                 <input 
                    name="username" 
                    defaultValue={userName} 
                    required 
                    className="w-full mt-2 p-4 bg-slate-50 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-100 text-center" 
                 />
               </div>

               <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-95 transition-transform">
                 Сохранить изменения
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Currency Modal */}
      {isCurrencyModalOpen && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-[480px] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-10 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Смена валюты</h3>
              <button onClick={() => setIsCurrencyModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 bg-amber-50 p-4 rounded-2xl text-amber-700 border border-amber-100">
                Внимание: При смене валюты все ваши текущие суммы будут автоматически пересчитаны по текущему курсу ({ratesLoading ? 'загрузка...' : 'API подключен'}).
            </p>

            <div className="space-y-3">
               {CURRENCIES.map(c => (
                 <button
                   key={c.code}
                   onClick={() => handleChangeCurrency(c.code)}
                   className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                     currencyCode === c.code 
                       ? 'bg-indigo-600 text-white shadow-md' 
                       : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                      <span className="font-bold w-8">{c.symbol}</span>
                      <span className="font-medium">{c.name}</span>
                   </div>
                   {currencyCode === c.code && <Check size={20} />}
                 </button>
               ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;