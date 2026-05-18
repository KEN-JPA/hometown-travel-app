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
  const [newItemAssignee, setNewItemAssignee] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [isAdding, setIsAdding] = useState(false);
  const [showUnpackedOnly, setShowUnpackedOnly] = useState(false);

  if (!selectedTrip) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>旅行を選択してください</div>;
  }

  const allItems = selectedTrip.packingList || [];
  const items = showUnpackedOnly ? allItems.filter(i => !i.isPacked) : allItems;
  
  // Group by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addItem({ 
      name: newItemName, 
      category: newItemCategory,
      assignee: newItemAssignee || undefined,
      quantity: parseInt(newItemQuantity, 10) || 1
    });
    setNewItemName('');
    setNewItemAssignee('');
    setNewItemQuantity('1');
    setIsAdding(false);
  };

  const addTemplates = () => {
    const templates = [
      { name: 'パスポート', category: '重要', assignee: 'パパ', quantity: 1 },
      { name: '航空券・チケット', category: '重要', assignee: 'パパ', quantity: 1 },
      { name: 'スマートフォン充電器', category: 'ガジェット', assignee: 'ママ', quantity: 2 },
      { name: '着替え（下着・靴下）', category: '衣類', assignee: '', quantity: 3 },
      { name: '歯ブラシ・洗面用具', category: '日用品', assignee: '', quantity: 1 }
    ];
    templates.forEach(t => addItem(t));
  };

  const progress = allItems.length > 0 ? Math.round((allItems.filter(i => i.isPacked).length / allItems.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="title">持ち物リスト</h2>
          <p className="subtitle">忘れ物を防ぎましょう</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn-secondary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            onClick={() => setShowUnpackedOnly(!showUnpackedOnly)}
          >
            {showUnpackedOnly ? 'すべて表示' : '未準備のみ'}
          </button>
          <button 
            className="btn-primary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus size={16} /> 追加
          </button>
        </div>
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
          <div className="border-b border-slate-200 pb-2 mb-3">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>新しい持ち物を追加</h3>
            <p className="text-xs text-slate-500 mt-1">ジャンルを選んで、アイテム名を入力してください。</p>
          </div>
          <div className="flex gap-2 mb-3">
            <div style={{ flex: '0 0 140px' }}>
              <div className="text-xs font-bold text-slate-700 mb-1">ジャンル</div>
              <select 
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white' }}
              >
                <option value="重要">重要書類・貴重品</option>
                <option value="衣類">衣類</option>
                <option value="日用品">日用品</option>
                <option value="ガジェット">ガジェット</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="text-xs font-bold text-slate-700 mb-1">アイテム名</div>
              <input 
                type="text" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="例: 充電器、パスポート" 
                style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                autoFocus
                required
              />
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <div style={{ flex: 1 }}>
              <div className="text-xs font-bold text-slate-700 mb-1">担当（誰が持っていく？）</div>
              <input 
                type="text" 
                value={newItemAssignee}
                onChange={(e) => setNewItemAssignee(e.target.value)}
                placeholder="例: パパ、ママ" 
                style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
              />
            </div>
            <div style={{ width: '80px' }}>
              <div className="text-xs font-bold text-slate-700 mb-1">数量</div>
              <input 
                type="number" 
                min="1"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1" style={{ padding: '0.5rem 1rem' }}>保存する</button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setIsAdding(false)} style={{ padding: '0.5rem 1rem' }}>キャンセル</button>
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
                  {(item.assignee || item.quantity) && (
                    <div className="flex gap-2 ml-2">
                      {item.assignee && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.assignee}</span>}
                      {item.quantity && item.quantity > 1 && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">x{item.quantity}</span>}
                    </div>
                  )}
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
      
      {allItems.length === 0 && !isAdding && (
        <div className="glass-panel p-6 text-center text-slate-500 mt-6">
          <Package size={40} className="mx-auto mb-3 opacity-30 text-indigo-500" />
          <p className="font-bold text-slate-700 mb-1">持ち物リストが空です</p>
          <p className="text-sm mb-4">
            上の「追加」ボタンから、旅行に必要なものをリストアップしましょう。<br />
            まずは「パスポート」や「財布」など、絶対に忘れてはいけないものから追加するのがおすすめです！
          </p>
          <button onClick={addTemplates} className="btn-secondary mx-auto">
            <Plus size={16} /> 家族旅行の基本セットを追加
          </button>
        </div>
      )}
    </div>
  );
}
