import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Plane, Car, Building2, Ticket, MapPin, Home, ChevronDown, ChevronUp, PieChart, CreditCard } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useTravelStore, type Expense, type IconType, type PaymentMethod } from '../store';

const iconLabels: Record<IconType, string> = {
  plane: '飛行機・交通',
  car: 'レンタカー・移動',
  home: '一軒家・民宿',
  building: 'ホテル・宿泊',
  ticket: 'チケット・入場料',
  'map-pin': '観光・食事'
};

const iconColors: Record<IconType, string> = {
  plane: '#3b82f6', // 青
  car: '#10b981',   // 緑
  home: '#8b5cf6',  // 紫
  building: '#a78bfa', // 薄紫
  ticket: '#f59e0b', // オレンジ
  'map-pin': '#ec4899' // ピンク
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  credit_card: 'クレジットカード',
  points: 'ポイント',
  miles: 'マイル',
  cash: '現金',
  other: 'その他'
};

const paymentMethodColors: Record<PaymentMethod, string> = {
  credit_card: '#3b82f6', // 青
  points: '#f59e0b',      // オレンジ
  miles: '#8b5cf6',       // 紫
  cash: '#10b981',        // 緑
  other: '#64748b'        // グレー
};

const paymentMethodIcons: Record<PaymentMethod, string> = {
  credit_card: '💳',
  points: '🪙',
  miles: '✈️',
  cash: '💵',
  other: '❓'
};

const getIcon = (type: IconType) => {
  switch (type) {
    case 'plane': return Plane;
    case 'car': return Car;
    case 'home': return Home;
    case 'building': return Building2;
    case 'ticket': return Ticket;
    case 'map-pin': return MapPin;
    default: return Ticket;
  }
};

const guessIconFromCategory = (category: string, currentIcon?: IconType): IconType => {
  if (currentIcon) return currentIcon;
  const name = category.toLowerCase();
  if (name.includes('飛行機') || name.includes('航空') || name.includes('フライト') || (name.includes('チケット') && (name.includes('空') || name.includes('ana') || name.includes('jal') || name.includes('peach')))) return 'plane';
  if (name.includes('レンタカー') || name.includes('車') || name.includes('ガソリン') || name.includes('高速') || name.includes('交通') || name.includes('タクシー') || name.includes('電車') || name.includes('新幹線')) return 'car';
  if (name.includes('ホテル') || name.includes('宿') || name.includes('旅館') || name.includes('宿泊') || name.includes('滞在') || name.includes('泊')) return 'building';
  if (name.includes('民宿') || name.includes('コテージ') || name.includes('一軒家') || name.includes('貸切') || name.includes('テント') || name.includes('キャンプ')) return 'home';
  if (name.includes('切符') || name.includes('チケット') || name.includes('入場') || name.includes('パス') || name.includes('拝観')) return 'ticket';
  if (name.includes('観光') || name.includes('食事') || name.includes('飯') || name.includes('店') || name.includes('お土産') || name.includes('カフェ') || name.includes('居酒屋') || name.includes('食')) return 'map-pin';
  return 'ticket'; // デフォルト
};

const guessPaymentMethodFromCategory = (category: string, amount: number, currentMethod?: PaymentMethod): PaymentMethod => {
  if (currentMethod) return currentMethod;
  const name = category.toLowerCase();
  if (name.includes('マイル')) return 'miles';
  if (name.includes('ポイント') || name.includes('paypay') || name.includes('ペイ')) return 'points';
  if (name.includes('飛行機') || name.includes('航空') || name.includes('ホテル') || name.includes('宿泊') || name.includes('レンタカー') || amount > 10000) return 'credit_card';
  return 'cash'; // デフォルト
};

export default function Budget() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const addExpense = useTravelStore((state) => state.addExpense);
  const updateExpense = useTravelStore((state) => state.updateExpense);
  const deleteExpense = useTravelStore((state) => state.deleteExpense);
  const toggleExpensePaid = useTravelStore((state) => state.toggleExpensePaid);

  const [isAdding, setIsAdding] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [newExpenseIcon, setNewExpenseIcon] = useState<IconType>('ticket');
  const [newExpensePayment, setNewExpensePayment] = useState<PaymentMethod>('credit_card');
  
  // 編集用の状態
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseName, setEditExpenseName] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseDescription, setEditExpenseDescription] = useState('');
  const [editExpenseIcon, setEditExpenseIcon] = useState<IconType>('ticket');
  const [editExpensePayment, setEditExpensePayment] = useState<PaymentMethod>('credit_card');

  const [expandedIcons, setExpandedIcons] = useState<Record<string, boolean>>({});
  const [groupBy, setGroupBy] = useState<'category' | 'payment'>('category');

  // 分析アコーディオンの開閉用状態
  const [showCategoryAnalysis, setShowCategoryAnalysis] = useState(false);
  const [showPaymentAnalysis, setShowPaymentAnalysis] = useState(false);

  const toggleIcon = (iconKey: string) => {
    setExpandedIcons(prev => ({
      ...prev,
      [iconKey]: !prev[iconKey]
    }));
  };

  if (!selectedTrip) {
    return <Navigate to="/" replace />;
  }

  const expenses = selectedTrip.expenses;

  // 各費用の補完（過去データ対応）
  const processedExpenses = expenses.map(e => ({
    ...e,
    icon: guessIconFromCategory(e.category, e.icon),
    paymentMethod: guessPaymentMethodFromCategory(e.category, e.amount, e.paymentMethod)
  }));

  const total = processedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const paidTotal = processedExpenses.filter(e => e.isPaid).reduce((acc, curr) => acc + curr.amount, 0);

  // icon ごとにグループ化
  const groupedExpenses = processedExpenses.reduce((acc, expense) => {
    const iconKey = expense.icon || 'ticket';
    if (!acc[iconKey]) {
      acc[iconKey] = [];
    }
    acc[iconKey].push(expense);
    return acc;
  }, {} as Record<IconType, Expense[]>);

  // paymentMethod ごとにグループ化
  const groupedByPayment = processedExpenses.reduce((acc, expense) => {
    const paymentKey = expense.paymentMethod || 'cash';
    if (!acc[paymentKey]) {
      acc[paymentKey] = [];
    }
    acc[paymentKey].push(expense);
    return acc;
  }, {} as Record<PaymentMethod, Expense[]>);

  // カテゴリ（アイコン）別集計の算出
  const categorySummary = Object.keys(iconLabels).map((key) => {
    const iconKey = key as IconType;
    const catExpenses = processedExpenses.filter(e => e.icon === iconKey);
    const amount = catExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    return {
      iconKey,
      label: iconLabels[iconKey],
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    };
  }).filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // 支払い方法別集計の算出
  const paymentSummary = Object.keys(paymentMethodLabels).map((key) => {
    const methodKey = key as PaymentMethod;
    const methodExpenses = processedExpenses.filter(e => e.paymentMethod === methodKey);
    const amount = methodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    return {
      methodKey,
      label: paymentMethodLabels[methodKey],
      icon: paymentMethodIcons[methodKey],
      color: paymentMethodColors[methodKey],
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    };
  }).filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseName || !newExpenseAmount) return;
    
    const color = iconColors[newExpenseIcon] || '#3b82f6';

    addExpense({
      category: newExpenseName,
      amount: parseInt(newExpenseAmount, 10),
      color,
      isPaid: false,
      description: newExpenseDescription || undefined,
      icon: newExpenseIcon,
      paymentMethod: newExpensePayment
    });
    
    // 追加したキーを自動展開
    const autoExpandKey = groupBy === 'category' ? newExpenseIcon : newExpensePayment;
    setExpandedIcons(prev => ({
      ...prev,
      [autoExpandKey]: true
    }));

    setIsAdding(false);
    setNewExpenseName('');
    setNewExpenseAmount('');
    setNewExpenseDescription('');
    setNewExpenseIcon('ticket');
    setNewExpensePayment('credit_card');
  };

  const startEditing = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setEditExpenseName(exp.category);
    setEditExpenseAmount(exp.amount.toString());
    setEditExpenseDescription(exp.description || '');
    setEditExpenseIcon(guessIconFromCategory(exp.category, exp.icon));
    setEditExpensePayment(guessPaymentMethodFromCategory(exp.category, exp.amount, exp.paymentMethod));
  };

  const handleUpdate = (e: React.FormEvent, expenseId: string) => {
    e.preventDefault();
    if (!editExpenseName.trim() || !editExpenseAmount.trim()) return;

    const color = iconColors[editExpenseIcon] || '#3b82f6';

    updateExpense(expenseId, {
      category: editExpenseName,
      amount: parseInt(editExpenseAmount, 10),
      description: editExpenseDescription || undefined,
      icon: editExpenseIcon,
      paymentMethod: editExpensePayment,
      color
    });
    setEditingExpenseId(null);
  };

  const activeGrouped = groupBy === 'category' ? groupedExpenses : groupedByPayment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="title">費用・予算</h2>
          <p className="subtitle">旅行の経費管理</p>
        </div>
        <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => setIsAdding(true)}>
          <Plus size={16} /> 追加
        </button>
      </div>
      
      {isAdding && (
        <form onSubmit={handleAdd} className="glass-panel mb-6 p-4">
          <div className="border-b border-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-slate-800">新しい費用を追加</h3>
            <p className="text-xs text-slate-500 mt-1">旅行にかかった費用や、予定している予算を入力してください。</p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">費用の項目（必須）</div>
              <input
                type="text"
                placeholder="例: 食費、お土産代、交通費"
                className="input-field"
                style={{ marginBottom: 0 }}
                value={newExpenseName}
                onChange={(e) => setNewExpenseName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <div style={{ flex: 1 }}>
                <div className="text-xs font-bold text-slate-700 mb-1">アイコン（種類）</div>
                <select 
                  value={newExpenseIcon} 
                  onChange={e => setNewExpenseIcon(e.target.value as IconType)}
                  style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white' }}
                >
                  <option value="plane">飛行機・交通</option>
                  <option value="car">レンタカー・移動</option>
                  <option value="building">ホテル・宿泊</option>
                  <option value="home">一軒家・民宿</option>
                  <option value="ticket">チケット・入場料</option>
                  <option value="map-pin">観光・食事</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-xs font-bold text-slate-700 mb-1">支払い方法</div>
                <select 
                  value={newExpensePayment} 
                  onChange={e => setNewExpensePayment(e.target.value as PaymentMethod)}
                  style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white' }}
                >
                  <option value="credit_card">💳 クレジットカード</option>
                  <option value="points">🪙 ポイント払い</option>
                  <option value="miles">✈️ マイル払い</option>
                  <option value="cash">💵 現金払い</option>
                  <option value="other">❓ その他</option>
                </select>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">金額（円）</div>
              <input
                type="number"
                placeholder="例: 5000"
                className="input-field"
                style={{ marginBottom: 0 }}
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">メモ・詳細（任意）</div>
              <textarea
                placeholder="メモや詳細を入力"
                className="input-field"
                style={{ marginBottom: 0, minHeight: '60px' }}
                value={newExpenseDescription}
                onChange={(e) => setNewExpenseDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary flex-1">保存する</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setIsAdding(false)}>キャンセル</button>
            </div>
          </div>
        </form>
      )}
      
      {/* Total Overview */}
      <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem 1rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(255, 255, 255, 0.8))' }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>予算・費用合計</div>
        <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit' }}>
          ¥{total.toLocaleString()}
        </div>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <div><span className="text-slate-500">支払済:</span> <span className="font-bold text-emerald-600">¥{paidTotal.toLocaleString()}</span></div>
          <div><span className="text-slate-500">未払い:</span> <span className="font-bold text-amber-600">¥{(total - paidTotal).toLocaleString()}</span></div>
        </div>
        {selectedTrip.participantsCount && selectedTrip.participantsCount > 1 && (
          <div className="mt-3 inline-block bg-white/50 px-3 py-1 rounded-full text-sm font-bold text-indigo-700">
            1人あたり: ¥{Math.round(total / selectedTrip.participantsCount).toLocaleString()}
          </div>
        )}
      </div>
      
      {/* Breakdown */}
      {processedExpenses.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4 mt-2">
            <h3 className="title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>内訳のまとめ方</h3>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50" style={{ width: 'fit-content' }}>
              <button 
                onClick={() => setGroupBy('category')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${groupBy === 'category' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                種類別
              </button>
              <button 
                onClick={() => setGroupBy('payment')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${groupBy === 'payment' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                支払い方法別
              </button>
            </div>
          </div>

          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(activeGrouped).map(([key, groupExpenses]) => {
              const isOpen = expandedIcons[key];
              
              let label = '';
              let iconElement = null;
              let color = '#3b82f6';
              
              if (groupBy === 'category') {
                const iconKey = key as IconType;
                const IconComponent = getIcon(iconKey);
                label = iconLabels[iconKey] || 'その他';
                color = iconColors[iconKey] || '#3b82f6';
                iconElement = <IconComponent size={20} />;
              } else {
                const paymentKey = key as PaymentMethod;
                label = paymentMethodLabels[paymentKey] || 'その他';
                color = paymentMethodColors[paymentKey] || '#3b82f6';
                const emoji = paymentMethodIcons[paymentKey] || '❓';
                iconElement = <span style={{ fontSize: '18px' }}>{emoji}</span>;
              }
              
              const catTotal = groupExpenses.reduce((acc, curr) => acc + curr.amount, 0);

              return (
                <div key={key} className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
                  {/* アコーディオンヘッダー */}
                  <button
                    onClick={() => toggleIcon(key)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                    style={{
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      outline: 'none',
                      display: 'flex',
                      width: '100%',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{
                        background: `${color}15`,
                        color: color,
                        padding: '0.5rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {iconElement}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{label}</span>
                        <span className="text-xs text-slate-400 ml-2">({groupExpenses.length}件)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-bold text-slate-800 text-sm mr-1">¥{catTotal.toLocaleString()}</span>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {/* 展開された中身 */}
                  {isOpen && (
                    <div className="p-4 border-t border-slate-100/80 bg-slate-50/30 flex flex-col gap-3">
                      {groupExpenses.map((exp) => {
                        const isEditing = editingExpenseId === exp.id;
                        const paymentIcon = paymentMethodIcons[exp.paymentMethod || 'cash'];
                        const paymentLabel = paymentMethodLabels[exp.paymentMethod || 'cash'];
                        return (
                          <div key={exp.id} className="glass-card bg-white p-3" style={{ opacity: exp.isPaid && !isEditing ? 0.7 : 1 }}>
                            {isEditing ? (
                              <form onSubmit={(e) => handleUpdate(e, exp.id)} className="space-y-3 w-full">
                                <div className="flex gap-2">
                                  <div style={{ flex: 2 }}>
                                    <div className="text-xs font-bold text-slate-700 mb-1">費用の項目（必須）</div>
                                    <input 
                                      type="text" 
                                      value={editExpenseName}
                                      onChange={(e) => setEditExpenseName(e.target.value)}
                                      style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                                      required
                                    />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div className="text-xs font-bold text-slate-700 mb-1">金額（円）</div>
                                    <input 
                                      type="number" 
                                      value={editExpenseAmount}
                                      onChange={(e) => setEditExpenseAmount(e.target.value)}
                                      style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <div style={{ flex: 1 }}>
                                    <div className="text-xs font-bold text-slate-700 mb-1">アイコン</div>
                                    <select 
                                      value={editExpenseIcon} 
                                      onChange={e => setEditExpenseIcon(e.target.value as IconType)}
                                      style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white', fontSize: '0.875rem' }}
                                    >
                                      <option value="plane">飛行機・交通</option>
                                      <option value="car">レンタカー・移動</option>
                                      <option value="building">ホテル・宿泊</option>
                                      <option value="home">一軒家・民宿</option>
                                      <option value="ticket">チケット・入場料</option>
                                      <option value="map-pin">観光・食事</option>
                                    </select>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div className="text-xs font-bold text-slate-700 mb-1">支払い方法</div>
                                    <select 
                                      value={editExpensePayment} 
                                      onChange={e => setEditExpensePayment(e.target.value as PaymentMethod)}
                                      style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white', fontSize: '0.875rem' }}
                                    >
                                      <option value="credit_card">💳 クレジットカード</option>
                                      <option value="points">🪙 ポイント払い</option>
                                      <option value="miles">✈️ マイル払い</option>
                                      <option value="cash">💵 現金払い</option>
                                      <option value="other">❓ その他</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-700 mb-1">メモ・詳細（任意）</div>
                                  <textarea
                                    value={editExpenseDescription}
                                    onChange={(e) => setEditExpenseDescription(e.target.value)}
                                    style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem', minHeight: '50px' }}
                                    placeholder="詳細やメモを入力"
                                  />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button type="submit" className="btn-primary flex-1 py-1.5 text-xs">保存</button>
                                  <button type="button" className="btn-secondary flex-1 py-1.5 text-xs" onClick={() => setEditingExpenseId(null)}>キャンセル</button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-col w-full">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-3">
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: exp.color }}></div>
                                    <div className="flex flex-col">
                                      <span style={{ fontWeight: 600, textDecoration: exp.isPaid ? 'line-through' : 'none', color: 'var(--text-primary)' }}>{exp.category}</span>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <label className="flex items-center gap-1 cursor-pointer w-fit">
                                          <input 
                                            type="checkbox" 
                                            checked={exp.isPaid || false} 
                                            onChange={() => toggleExpensePaid(exp.id)}
                                            className="accent-emerald-500 w-3 h-3"
                                          />
                                          <span className="text-xs text-slate-500">{exp.isPaid ? '支払済' : '未払い'}</span>
                                        </label>
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                          {paymentIcon} {paymentLabel}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span style={{ fontWeight: 700, fontFamily: 'Outfit', textDecoration: exp.isPaid ? 'line-through' : 'none' }}>¥{exp.amount.toLocaleString()}</span>
                                    <div className="flex gap-1 shrink-0 ml-2">
                                      <button 
                                        onClick={() => startEditing(exp)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                                        className="hover:text-indigo-600"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (window.confirm(`${exp.category} を削除してもよろしいですか？`)) {
                                            deleteExpense(exp.id);
                                          }
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                                        className="hover:text-rose-600"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                {exp.description && (
                                  <div className="mt-2 pl-6">
                                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded whitespace-pre-wrap">
                                      {exp.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        !isAdding && (
          <div className="glass-panel p-6 text-center text-slate-500 mt-6">
            <p className="font-bold text-slate-700 mb-1">費用データがありません</p>
            <p className="text-sm">
              上の「追加」ボタンから、使ったお金や予定の予算を記録しましょう。<br />
              旅行全体でいくらかかっているかがひと目でわかります！
            </p>
          </div>
        )
      )}

      {/* 予算分析メーター（画面最下部に配置 ＆ タップで表示するアコーディオン設計） */}
      {processedExpenses.length > 0 && (
        <div className="space-y-3 mt-8 pb-8">
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-400 mb-2">予算・支払いの分析</h4>
          </div>
          
          {/* カテゴリ比率分析 */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
            <button
              type="button"
              onClick={() => setShowCategoryAnalysis(!showCategoryAnalysis)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/50 transition-colors"
              style={{
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                width: '100%',
              }}
            >
              <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                <PieChart size={14} className="text-indigo-500" />
                <span>費用・カテゴリ比率分析（タップして確認）</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {showCategoryAnalysis ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            
            {showCategoryAnalysis && (
              <div className="p-3.5 border-t border-slate-100 bg-white space-y-3 text-xs">
                {/* 積み上げ比率バー */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex" style={{ border: '1px solid var(--glass-border)' }}>
                  {categorySummary.map((item) => (
                    <div 
                      key={item.iconKey} 
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: iconColors[item.iconKey],
                        height: '100%'
                      }}
                      title={`${item.label}: ${item.percentage}%`}
                    />
                  ))}
                </div>

                {/* 各カテゴリの詳細リスト */}
                <div className="grid grid-cols-2 gap-2">
                  {categorySummary.map((item) => {
                    const IconComponent = getIcon(item.iconKey);
                    const color = iconColors[item.iconKey];
                    return (
                      <div key={item.iconKey} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div style={{ color, padding: '0.15rem', background: `${color}10`, borderRadius: '4px', display: 'flex' }}>
                            <IconComponent size={12} />
                          </div>
                          <span className="font-bold text-slate-700 truncate">{item.label}</span>
                        </div>
                        <div className="text-right shrink-0 font-bold text-slate-800">
                          <span>¥{item.amount.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-400 ml-1 font-bold">({item.percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 支払い方法比率分析 */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
            <button
              type="button"
              onClick={() => setShowPaymentAnalysis(!showPaymentAnalysis)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/50 transition-colors"
              style={{
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                width: '100%',
              }}
            >
              <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                <CreditCard size={14} className="text-indigo-500" />
                <span>支払い方法ごとの合計・比率（タップして確認）</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {showPaymentAnalysis ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            
            {showPaymentAnalysis && (
              <div className="p-3.5 border-t border-slate-100 bg-white space-y-3 text-xs">
                {/* 積み上げ比率バー */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex" style={{ border: '1px solid var(--glass-border)' }}>
                  {paymentSummary.map((item) => (
                    <div 
                      key={item.methodKey} 
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color,
                        height: '100%'
                      }}
                      title={`${item.label}: ${item.percentage}%`}
                    />
                  ))}
                </div>

                {/* 各支払い方法の詳細リスト */}
                <div className="grid grid-cols-2 gap-2">
                  {paymentSummary.map((item) => {
                    return (
                      <div key={item.methodKey} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span style={{ fontSize: '12px' }}>{item.icon}</span>
                          <span className="font-bold text-slate-700 truncate">{item.label}</span>
                        </div>
                        <div className="text-right shrink-0 font-bold text-slate-800">
                          <span>¥{item.amount.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-400 ml-1 font-bold">({item.percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-400 mt-2 bg-indigo-50/30 p-2 rounded border border-indigo-100/50" style={{ lineHeight: '1.4' }}>
                  💡 <b>今後の旅行への生かし方:</b><br />
                  今回の旅行では「<b>{categorySummary[0]?.label}</b>」が支出の最大項目（<b>{categorySummary[0]?.percentage}%</b>）であり、支払いは「<b>{paymentSummary[0]?.label}</b>」（<b>{paymentSummary[0]?.percentage}%</b>）が最多です。
                  次回以降の旅行計画でも「マイルやポイントをどの項目に充てるか」の計画に役立ちます。
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
