import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Plane, Car, Building2, Ticket, MapPin, Home, ChevronDown, ChevronUp, PieChart, CreditCard } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useTravelStore, type Expense, type IconType, type PaymentMethod, type ExpenseSplit } from '../store';

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
  sky_coin: 'ANA SKY コイン',
  cash: '現金',
  other: 'その他'
};

const paymentMethodColors: Record<PaymentMethod, string> = {
  credit_card: '#3b82f6', // 青
  points: '#f59e0b',      // オレンジ
  miles: '#8b5cf6',       // 紫
  sky_coin: '#00579f',    // ANAブルー
  cash: '#10b981',        // 緑
  other: '#64748b'        // グレー
};

const paymentMethodIcons: Record<PaymentMethod, string> = {
  credit_card: '💳',
  points: '🪙',
  miles: '✈️',
  sky_coin: '🎫',
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
  if (name.includes('skyコイン') || name.includes('sky コイン') || name.includes('スカイコイン') || name.includes('skycoin')) return 'sky_coin';
  if (name.includes('ポイント') || name.includes('paypay') || name.includes('ペイ')) return 'points';
  if (name.includes('飛行機') || name.includes('航空') || name.includes('ホテル') || name.includes('宿泊') || name.includes('レンタカー') || amount > 10000) return 'credit_card';
  return 'cash'; // デフォルト
};

const formatPaymentAmount = (method: PaymentMethod | undefined, amount: number) => {
  const m = method || 'cash';
  if (m === 'miles') return `${amount.toLocaleString()}マイル`;
  if (m === 'points') return `${amount.toLocaleString()}P`;
  if (m === 'sky_coin') return `${amount.toLocaleString()}コイン`;
  return `¥${amount.toLocaleString()}`;
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
  
  // 複数支払い用の状態
  const [useMultiplePayments, setUseMultiplePayments] = useState(false);
  const [newExpenseSplits, setNewExpenseSplits] = useState<ExpenseSplit[]>([
    { paymentMethod: 'credit_card', amount: 0 }
  ]);
  
  // 編集用の状態
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseName, setEditExpenseName] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseDescription, setEditExpenseDescription] = useState('');
  const [editExpenseIcon, setEditExpenseIcon] = useState<IconType>('ticket');
  const [editExpensePayment, setEditExpensePayment] = useState<PaymentMethod>('credit_card');

  // 編集用の複数支払い用の状態
  const [editUseMultiplePayments, setEditUseMultiplePayments] = useState(false);
  const [editExpenseSplits, setEditExpenseSplits] = useState<ExpenseSplit[]>([]);

  const handleAddNewSplit = () => {
    setNewExpenseSplits([...newExpenseSplits, { paymentMethod: 'credit_card', amount: 0 }]);
  };

  const handleRemoveNewSplit = (index: number) => {
    setNewExpenseSplits(newExpenseSplits.filter((_, i) => i !== index));
  };

  const handleNewSplitChange = (index: number, field: keyof ExpenseSplit, value: any) => {
    const updated = [...newExpenseSplits];
    if (field === 'amount') {
      updated[index].amount = parseInt(value, 10) || 0;
    } else {
      updated[index].paymentMethod = value as PaymentMethod;
    }
    setNewExpenseSplits(updated);
  };

  const handleAddEditSplit = () => {
    setEditExpenseSplits([...editExpenseSplits, { paymentMethod: 'credit_card', amount: 0 }]);
  };

  const handleRemoveEditSplit = (index: number) => {
    setEditExpenseSplits(editExpenseSplits.filter((_, i) => i !== index));
  };

  const handleEditSplitChange = (index: number, field: keyof ExpenseSplit, value: any) => {
    const updated = [...editExpenseSplits];
    if (field === 'amount') {
      updated[index].amount = parseInt(value, 10) || 0;
    } else {
      updated[index].paymentMethod = value as PaymentMethod;
    }
    setEditExpenseSplits(updated);
  };

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

  // 支払い方法別の合計算出ロジック
  const getTotalsByPaymentMethod = (isPaidFilter?: boolean) => {
    let yen = 0;
    let miles = 0;
    let points = 0;
    let skyCoin = 0;

    processedExpenses.forEach(e => {
      if (isPaidFilter !== undefined && e.isPaid !== isPaidFilter) return;

      if (e.splits && e.splits.length > 0) {
        e.splits.forEach(split => {
          if (split.paymentMethod === 'miles') {
            miles += split.amount;
          } else if (split.paymentMethod === 'points') {
            points += split.amount;
          } else if (split.paymentMethod === 'sky_coin') {
            skyCoin += split.amount;
          } else {
            yen += split.amount;
          }
        });
      } else {
        if (e.paymentMethod === 'miles') {
          miles += e.amount;
        } else if (e.paymentMethod === 'points') {
          points += e.amount;
        } else if (e.paymentMethod === 'sky_coin') {
          skyCoin += e.amount;
        } else {
          yen += e.amount;
        }
      }
    });

    return { yen, miles, points, skyCoin };
  };

  const totals = getTotalsByPaymentMethod();
  const paidTotals = getTotalsByPaymentMethod(true);
  const unpaidTotals = getTotalsByPaymentMethod(false);

  const total = processedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

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
    if (expense.splits && expense.splits.length > 0) {
      expense.splits.forEach(split => {
        const paymentKey = split.paymentMethod;
        if (!acc[paymentKey]) {
          acc[paymentKey] = [];
        }
        // 重複を避けて追加
        if (!acc[paymentKey].some(e => e.id === expense.id)) {
          acc[paymentKey].push(expense);
        }
      });
    } else {
      const paymentKey = expense.paymentMethod || 'cash';
      if (!acc[paymentKey]) {
        acc[paymentKey] = [];
      }
      acc[paymentKey].push(expense);
    }
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
    let amount = 0;
    
    processedExpenses.forEach(e => {
      if (e.splits && e.splits.length > 0) {
        const split = e.splits.find(s => s.paymentMethod === methodKey);
        if (split) {
          amount += split.amount;
        }
      } else {
        if (e.paymentMethod === methodKey) {
          amount += e.amount;
        }
      }
    });

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
    if (!newExpenseName || (!useMultiplePayments && !newExpenseAmount)) return;
    
    const color = iconColors[newExpenseIcon] || '#3b82f6';

    let finalAmount = parseInt(newExpenseAmount, 10) || 0;
    let finalSplits: ExpenseSplit[] | undefined = undefined;
    let finalPayment = newExpensePayment;

    if (useMultiplePayments) {
      finalAmount = newExpenseSplits.reduce((sum, s) => sum + s.amount, 0);
      finalSplits = newExpenseSplits;
      finalPayment = newExpenseSplits[0]?.paymentMethod || 'credit_card';
    }

    addExpense({
      category: newExpenseName,
      amount: finalAmount,
      color,
      isPaid: false,
      description: newExpenseDescription || undefined,
      icon: newExpenseIcon,
      paymentMethod: finalPayment,
      splits: finalSplits
    });
    
    // 追加したキーを自動展開
    const autoExpandKey = groupBy === 'category' ? newExpenseIcon : finalPayment;
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
    setUseMultiplePayments(false);
    setNewExpenseSplits([{ paymentMethod: 'credit_card', amount: 0 }]);
  };

  const startEditing = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setEditExpenseName(exp.category);
    setEditExpenseAmount(exp.amount.toString());
    setEditExpenseDescription(exp.description || '');
    setEditExpenseIcon(guessIconFromCategory(exp.category, exp.icon));
    setEditExpensePayment(guessPaymentMethodFromCategory(exp.category, exp.amount, exp.paymentMethod));
    
    if (exp.splits && exp.splits.length > 0) {
      setEditUseMultiplePayments(true);
      setEditExpenseSplits(exp.splits);
    } else {
      setEditUseMultiplePayments(false);
      setEditExpenseSplits([{ paymentMethod: guessPaymentMethodFromCategory(exp.category, exp.amount, exp.paymentMethod), amount: exp.amount }]);
    }
  };

  const handleUpdate = (e: React.FormEvent, expenseId: string) => {
    e.preventDefault();
    if (!editExpenseName.trim() || (!editUseMultiplePayments && !editExpenseAmount.trim())) return;

    const color = iconColors[editExpenseIcon] || '#3b82f6';

    let finalAmount = parseInt(editExpenseAmount, 10) || 0;
    let finalSplits: ExpenseSplit[] | undefined = undefined;
    let finalPayment = editExpensePayment;

    if (editUseMultiplePayments) {
      finalAmount = editExpenseSplits.reduce((sum, s) => sum + s.amount, 0);
      finalSplits = editExpenseSplits;
      finalPayment = editExpenseSplits[0]?.paymentMethod || 'credit_card';
    }

    updateExpense(expenseId, {
      category: editExpenseName,
      amount: finalAmount,
      description: editExpenseDescription || undefined,
      icon: editExpenseIcon,
      paymentMethod: finalPayment,
      splits: finalSplits,
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
            </div>

            {/* 複数支払い方法トグル */}
            <div className="flex items-center gap-2 py-1">
              <input 
                type="checkbox" 
                id="useMultiplePayments" 
                checked={useMultiplePayments} 
                onChange={e => setUseMultiplePayments(e.target.checked)} 
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="useMultiplePayments" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                複数の支払い方法を組み合わせる（マイル＋クレカなど）
              </label>
            </div>

            {!useMultiplePayments ? (
              <div className="flex gap-2">
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
                    <option value="sky_coin">🎫 ANA SKY コイン</option>
                    <option value="cash">💵 現金払い</option>
                    <option value="other">❓ その他</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-xs font-bold text-slate-700 mb-1">金額</div>
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
              </div>
            ) : (
              <div className="glass-panel p-3 bg-slate-50/50 space-y-2" style={{ borderRadius: '12px' }}>
                <div className="text-xs font-bold text-slate-700 mb-1">支払い方法の内訳</div>
                {newExpenseSplits.map((split, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select 
                      value={split.paymentMethod} 
                      onChange={e => handleNewSplitChange(index, 'paymentMethod', e.target.value)}
                      style={{ flex: 1, padding: '0.5rem 0.4rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white', fontSize: '0.8rem' }}
                    >
                      <option value="credit_card">💳 クレジットカード</option>
                      <option value="points">🪙 ポイント払い</option>
                      <option value="miles">✈️ マイル払い</option>
                      <option value="sky_coin">🎫 ANA SKY コイン</option>
                      <option value="cash">💵 現金払い</option>
                      <option value="other">❓ その他</option>
                    </select>
                    <input
                      type="number"
                      placeholder="金額"
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}
                      value={split.amount || ''}
                      onChange={e => handleNewSplitChange(index, 'amount', e.target.value)}
                      required
                    />
                    {newExpenseSplits.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveNewSplit(index)} 
                        className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={handleAddNewSplit} 
                  className="text-xs text-indigo-600 font-bold flex items-center gap-1 mt-1 hover:underline"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Plus size={12} /> 支払い方法を追加
                </button>
                <div className="text-xs text-right text-slate-600 font-bold pt-1.5 border-t border-slate-200/50 mt-1">
                  合計金額: ¥{newExpenseSplits.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                </div>
              </div>
            )}
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
        <div className="flex flex-col items-center justify-center">
          {/* 支払い方法すべての合算した金額を黒文字で太く */}
          <span style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit', lineHeight: 1.2 }}>
            ¥{(totals.yen + totals.miles + totals.points + totals.skyCoin).toLocaleString()}
          </span>
          
          {/* 支払い方法別の金額をちいさく記載 */}
          {(totals.miles > 0 || totals.points > 0 || totals.skyCoin > 0) && (
            <div className="flex flex-wrap justify-center items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500 font-medium mt-1">
              <span>内訳:</span>
              <span>¥{totals.yen.toLocaleString()}</span>
              {totals.miles > 0 && (
                <span style={{ color: '#7c3aed' }}>+ {totals.miles.toLocaleString()}マイル</span>
              )}
              {totals.points > 0 && (
                <span style={{ color: '#d97706' }}>+ {totals.points.toLocaleString()}P</span>
              )}
              {totals.skyCoin > 0 && (
                <span style={{ color: '#0284c7' }}>+ {totals.skyCoin.toLocaleString()}コイン</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 mt-2 text-sm">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <div>
              <span className="text-slate-500">支払済:</span>{' '}
              <span className="font-bold text-emerald-600">
                ¥{paidTotals.yen.toLocaleString()}
                {paidTotals.miles > 0 && ` + ${paidTotals.miles.toLocaleString()}マイル`}
                {paidTotals.points > 0 && ` + ${paidTotals.points.toLocaleString()}P`}
                {paidTotals.skyCoin > 0 && ` + ${paidTotals.skyCoin.toLocaleString()}コイン`}
              </span>
            </div>
            <div>
              <span className="text-slate-500">未払い:</span>{' '}
              <span className="font-bold text-amber-600">
                ¥{unpaidTotals.yen.toLocaleString()}
                {unpaidTotals.miles > 0 && ` + ${unpaidTotals.miles.toLocaleString()}マイル`}
                {unpaidTotals.points > 0 && ` + ${unpaidTotals.points.toLocaleString()}P`}
                {unpaidTotals.skyCoin > 0 && ` + ${unpaidTotals.skyCoin.toLocaleString()}コイン`}
              </span>
            </div>
          </div>
        </div>

        {selectedTrip.participantsCount && selectedTrip.participantsCount > 1 && (
          <div className="mt-3 inline-block bg-white/50 px-3 py-1 rounded-full text-xs font-bold text-indigo-700">
            1人あたり:{' '}
            <span>
              ¥{Math.round(totals.yen / selectedTrip.participantsCount).toLocaleString()}
              {totals.miles > 0 && ` + ${Math.round(totals.miles / selectedTrip.participantsCount).toLocaleString()}マイル`}
              {totals.points > 0 && ` + ${Math.round(totals.points / selectedTrip.participantsCount).toLocaleString()}P`}
              {totals.skyCoin > 0 && ` + ${Math.round(totals.skyCoin / selectedTrip.participantsCount).toLocaleString()}コイン`}
            </span>
          </div>
        )}
      </div>

      {/* 予算・支払いの分析（合計予算のすぐ下に移動） */}
      {processedExpenses.length > 0 && (
        <div className="space-y-3 mt-4 mb-6">
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
                    let unit = '円';
                    if (item.methodKey === 'miles') unit = 'マイル';
                    else if (item.methodKey === 'points') unit = 'P';
                    else if (item.methodKey === 'sky_coin') unit = 'コイン';
                    
                    const displayAmount = unit === '円' ? `¥${item.amount.toLocaleString()}` : `${item.amount.toLocaleString()} ${unit}`;

                    return (
                      <div key={item.methodKey} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span style={{ fontSize: '12px' }}>{item.icon}</span>
                          <span className="font-bold text-slate-700 truncate">{item.label}</span>
                        </div>
                        <div className="text-right shrink-0 font-bold text-slate-800">
                          <span>{displayAmount}</span>
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

      {/* Breakdown */}
      {processedExpenses.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4 mt-6">
            <h3 className="title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>支払い内訳</h3>
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
              
              let catTotal = 0;
              if (groupBy === 'category') {
                catTotal = groupExpenses.reduce((acc, curr) => acc + curr.amount, 0);
              } else {
                const paymentKey = key as PaymentMethod;
                catTotal = groupExpenses.reduce((acc, curr) => {
                  if (curr.splits && curr.splits.length > 0) {
                    const split = curr.splits.find(s => s.paymentMethod === paymentKey);
                    return acc + (split ? split.amount : 0);
                  }
                  return acc + curr.amount;
                }, 0);
              }

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
                                </div>

                                <div className="flex flex-col gap-2">
                                  <div>
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
                                </div>

                                {/* 編集フォーム内の複数支払い方法トグル */}
                                <div className="flex items-center gap-2 py-1">
                                  <input 
                                    type="checkbox" 
                                    id={`editUseMultiplePayments-${exp.id}`} 
                                    checked={editUseMultiplePayments} 
                                    onChange={e => setEditUseMultiplePayments(e.target.checked)} 
                                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                                  />
                                  <label htmlFor={`editUseMultiplePayments-${exp.id}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                    複数の支払い方法を組み合わせる
                                  </label>
                                </div>

                                {!editUseMultiplePayments ? (
                                  <div className="flex gap-2">
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
                                        <option value="sky_coin">🎫 ANA SKY コイン</option>
                                        <option value="cash">💵 現金払い</option>
                                        <option value="other">❓ その他</option>
                                      </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div className="text-xs font-bold text-slate-700 mb-1">金額</div>
                                      <input 
                                        type="number" 
                                        value={editExpenseAmount}
                                        onChange={(e) => setEditExpenseAmount(e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                                        required
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="glass-panel p-3 bg-slate-50/50 space-y-2" style={{ borderRadius: '12px' }}>
                                    <div className="text-xs font-bold text-slate-700 mb-1">支払い方法の内訳</div>
                                    {editExpenseSplits.map((split, index) => (
                                      <div key={index} className="flex gap-2 items-center">
                                        <select 
                                          value={split.paymentMethod} 
                                          onChange={e => handleEditSplitChange(index, 'paymentMethod', e.target.value)}
                                          style={{ flex: 1, padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white', fontSize: '0.8rem' }}
                                        >
                                          <option value="credit_card">💳 クレジットカード</option>
                                          <option value="points">🪙 ポイント払い</option>
                                          <option value="miles">✈️ マイル払い</option>
                                          <option value="sky_coin">🎫 ANA SKY コイン</option>
                                          <option value="cash">💵 現金払い</option>
                                          <option value="other">❓ その他</option>
                                        </select>
                                        <input
                                          type="number"
                                          placeholder="金額"
                                          style={{ flex: 1, padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}
                                          value={split.amount || ''}
                                          onChange={e => handleEditSplitChange(index, 'amount', e.target.value)}
                                          required
                                        />
                                        {editExpenseSplits.length > 1 && (
                                          <button 
                                            type="button" 
                                            onClick={() => handleRemoveEditSplit(index)} 
                                            className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button 
                                      type="button" 
                                      onClick={handleAddEditSplit} 
                                      className="text-xs text-indigo-600 font-bold flex items-center gap-1 mt-1 hover:underline"
                                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                      <Plus size={12} /> 支払い方法を追加
                                    </button>
                                    <div className="text-xs text-right text-slate-600 font-bold pt-1.5 border-t border-slate-200/50 mt-1">
                                      合計金額: ¥{editExpenseSplits.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                                    </div>
                                  </div>
                                )}
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
                                        {exp.splits && exp.splits.length > 0 ? (
                                          exp.splits.map((split, sIdx) => {
                                            const sIcon = paymentMethodIcons[split.paymentMethod];
                                            const sLabel = paymentMethodLabels[split.paymentMethod];
                                            return (
                                              <span key={sIdx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                                {sIcon} {sLabel}: {formatPaymentAmount(split.paymentMethod, split.amount)}
                                              </span>
                                            );
                                          })
                                        ) : (
                                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                            {paymentIcon} {paymentLabel}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span style={{ fontWeight: 700, fontFamily: 'Outfit', textDecoration: exp.isPaid ? 'line-through' : 'none' }}>
                                      {formatPaymentAmount(exp.splits && exp.splits.length > 0 ? 'credit_card' : exp.paymentMethod, exp.amount)}
                                    </span>
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


    </div>
  );
}
