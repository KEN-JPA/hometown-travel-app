import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTravelStore } from '../store';

export default function Budget() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const addExpense = useTravelStore((state) => state.addExpense);
  const deleteExpense = useTravelStore((state) => state.deleteExpense);

  const [isAdding, setIsAdding] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  
  if (!selectedTrip) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>旅行を選択してください</div>;
  }

  const expenses = selectedTrip.expenses;
  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseName || !newExpenseAmount) return;
    
    // Assign random color
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    addExpense({
      category: newExpenseName,
      amount: parseInt(newExpenseAmount, 10),
      color
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
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="項目名 (例: 食費)"
              className="input-field"
              value={newExpenseName}
              onChange={(e) => setNewExpenseName(e.target.value)}
            />
            <input
              type="number"
              placeholder="金額 (円)"
              className="input-field"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">保存</button>
              <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>キャンセル</button>
            </div>
          </div>
        </form>
      )}
      
      {/* Total Overview */}
      <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem 1rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(255, 255, 255, 0.8))' }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>合計</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Outfit' }}>
          ¥{total.toLocaleString()}
        </div>
      </div>

      {/* Breakdown */}
      <h3 className="title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>内訳</h3>
      <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
        {expenses.map((exp) => (
          <div key={exp.id} className="glass-card flex items-center justify-between" style={{ padding: '1rem' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: exp.color }}></div>
              <span style={{ fontWeight: 500 }}>{exp.category}</span>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ fontWeight: 600, fontFamily: 'Outfit' }}>¥{exp.amount.toLocaleString()}</span>
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
    </div>
  );
}
