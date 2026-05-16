import React, { useState } from 'react';
import { useTravelStore } from '../store';
import { CheckSquare, Square, Trash2, Plus, Package } from 'lucide-react';

export default function PackingList() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  
  const toggleItem = useTravelStore((state) => state.togglePackingItem);
  const deleteItem = useTravelStore((state) => state.deletePackingItem);
  const addItem = useTravelStore((state) => state.addPackingItem);

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('衣類');
  const [isAdding, setIsAdding] = useState(false);

  if (!selectedTrip) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>旅行を選択してください</div>;
  }

  const items = selectedTrip.packingList || [];
  
  // Group by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addItem({ name: newItemName, category: newItemCategory });
    setNewItemName('');
    setIsAdding(false);
  };

  const progress = items.length > 0 ? Math.round((items.filter(i => i.isPacked).length / items.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="title">持ち物リスト</h2>
          <p className="subtitle">忘れ物を防ぎましょう</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus size={16} /> アイテム追加
        </button>
      </div>

      <div className="glass-panel mb-6" style={{ padding: '1rem' }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>準備進行度</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-color)', fontFamily: 'Outfit' }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--glass-bg)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-color)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-panel mb-6" style={{ padding: '1rem', background: 'rgba(255,255,255,0.6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>新しい持ち物を追加</h3>
          <div className="flex gap-2 mb-3">
            <select 
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white' }}
            >
              <option value="重要">重要書類・貴重品</option>
              <option value="衣類">衣類</option>
              <option value="日用品">日用品</option>
              <option value="ガジェット">ガジェット</option>
              <option value="その他">その他</option>
            </select>
            <input 
              type="text" 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="例: 歯ブラシ" 
              style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: 'var(--text-secondary)' }}>
              キャンセル
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
              追加する
            </button>
          </div>
        </form>
      )}

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="mb-6">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-color)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} /> {category}
          </h3>
          <div className="flex" style={{ flexDirection: 'column', gap: '0.5rem' }}>
            {categoryItems.map(item => (
              <div 
                key={item.id} 
                className="glass-card flex items-center justify-between" 
                style={{ padding: '0.75rem 1rem', opacity: item.isPacked ? 0.6 : 1 }}
              >
                <div 
                  className="flex items-center gap-3" 
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => toggleItem(item.id)}
                >
                  {item.isPacked ? (
                    <CheckSquare size={20} color="var(--accent-color)" />
                  ) : (
                    <Square size={20} color="var(--text-secondary)" />
                  )}
                  <span style={{ textDecoration: item.isPacked ? 'line-through' : 'none', fontWeight: item.isPacked ? 400 : 500 }}>
                    {item.name}
                  </span>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {items.length === 0 && !isAdding && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          持ち物が登録されていません。上のボタンから追加してください。
        </div>
      )}
    </div>
  );
}
