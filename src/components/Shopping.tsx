import React, { useState } from 'react';
import { useTravelStore } from '../store';
import { CheckSquare, Square, Trash2, Plus, Gift, ShoppingBag } from 'lucide-react';

export default function Shopping() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  
  const toggleItem = useTravelStore((state) => state.toggleShoppingItem);
  const deleteItem = useTravelStore((state) => state.deleteShoppingItem);
  const addItem = useTravelStore((state) => state.addShoppingItem);

  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!selectedTrip) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>旅行を選択してください</div>;
  }

  const items = selectedTrip.shoppingList || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addItem({ name: newItemName });
    setNewItemName('');
    setIsAdding(false);
  };

  const progress = items.length > 0 ? Math.round((items.filter(i => i.isBought).length / items.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="title flex items-center gap-2"><Gift size={24} color="var(--accent-color)" /> お土産リスト</h2>
          <p className="subtitle">買い忘れを防ごう</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus size={16} /> 追加
        </button>
      </div>

      <div className="glass-panel mb-6" style={{ padding: '1rem' }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>購入済</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-color)', fontFamily: 'M PLUS Rounded 1c' }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '12px', background: 'var(--glass-bg)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-color)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-panel mb-6 p-4">
          <div className="border-b border-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-slate-800">新しいお土産を追加</h3>
            <p className="text-xs text-slate-500 mt-1">誰に、何を買うかをメモしておきましょう。</p>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700 mb-1">お土産の内容</div>
            <input 
              type="text" 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="例: 職場の部署へ 個包装のクッキー" 
              className="input-field mb-0"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="submit" className="btn-primary flex-1">保存する</button>
            <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary flex-1">キャンセル</button>
          </div>
        </form>
      )}

      <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
        {items.map(item => (
          <div 
            key={item.id} 
            className="glass-card flex items-center justify-between" 
            style={{ padding: '1rem', opacity: item.isBought ? 0.6 : 1, transition: 'all 0.3s' }}
          >
            <div 
              className="flex items-center gap-3" 
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => toggleItem(item.id)}
            >
              {item.isBought ? (
                <CheckSquare size={24} color="var(--accent-color)" />
              ) : (
                <Square size={24} color="var(--text-secondary)" />
              )}
              <span style={{ textDecoration: item.isBought ? 'line-through' : 'none', fontWeight: item.isBought ? 400 : 600, fontSize: '1.05rem' }}>
                {item.name}
              </span>
            </div>
            <button 
              onClick={() => deleteItem(item.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      
      {items.length === 0 && !isAdding && (
        <div className="glass-panel p-6 text-center text-slate-500 mt-6">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30 text-indigo-500" />
          <p className="font-bold text-slate-700 mb-1">お土産リストが空です</p>
          <p className="text-sm">
            上の「追加」ボタンから、誰に何を買うかメモしておきましょう。<br />
            リスト化しておくと、現地での買い忘れや買いすぎを防げます！
          </p>
        </div>
      )}
    </div>
  );
}
