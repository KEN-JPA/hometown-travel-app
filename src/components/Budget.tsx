import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTravelStore } from '../store';

export default function Budget() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const addExpense = useTravelStore((state) => state.addExpense);
  const deleteExpense = useTravelStore((state) => state.deleteExpense);
  const toggleExpensePaid = useTravelStore((state) => state.toggleExpensePaid);

  const [isAdding, setIsAdding] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  
  if (!selectedTrip) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>旅行を選択してください</div>;
  }

  const expenses = selectedTrip.expenses;
  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const paidTotal = expenses.filter(e => e.isPaid).reduce((acc, curr) => acc + curr.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseName || !newExpenseAmount) return;
    
    // Assign random color
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    addExpense({
      category: newExpenseName,
      amount: parseInt(newExpenseAmount, 10),
      color,
      isPaid: false
    });
    
    setIsAdding(false);
    setNewExpenseName('');
    setNewExpenseAmount('');
  };

  return (
    <div>
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
      {expenses.length > 0 ? (
        <>
          <h3 className="title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>内訳</h3>
          <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
            {expenses.map((exp) => (
              <div key={exp.id} className="glass-card flex items-center justify-between" style={{ padding: '1rem', opacity: exp.isPaid ? 0.7 : 1 }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: exp.color }}></div>
                  <div className="flex flex-col">
                    <span style={{ fontWeight: 500, textDecoration: exp.isPaid ? 'line-through' : 'none' }}>{exp.category}</span>
                    <label className="flex items-center gap-1 mt-1 cursor-pointer w-fit">
                      <input 
                        type="checkbox" 
                        checked={exp.isPaid || false} 
                        onChange={() => toggleExpensePaid(exp.id)}
                        className="accent-emerald-500 w-3 h-3"
                      />
                      <span className="text-xs text-slate-500">{exp.isPaid ? '支払済' : '未払い'}</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontWeight: 600, fontFamily: 'Outfit', textDecoration: exp.isPaid ? 'line-through' : 'none' }}>¥{exp.amount.toLocaleString()}</span>
                  <button 
                    onClick={() => deleteExpense(exp.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
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
