import React, { useState } from 'react';
import { useTravelStore } from '../store';
import { CheckSquare, Square, Trash2, Plus, Gift, ShoppingBag, Edit2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Shopping() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  
  const toggleItem = useTravelStore((state) => state.toggleShoppingItem);
  const deleteItem = useTravelStore((state) => state.deleteShoppingItem);
  const addItem = useTravelStore((state) => state.addShoppingItem);
  const updateItem = useTravelStore((state) => state.updateShoppingItem);

  const [newItemName, setNewItemName] = useState('');
  const [newItemRecipient, setNewItemRecipient] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemBudget, setNewItemBudget] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // 編集用の state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemRecipient, setEditItemRecipient] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState('1');
  const [editItemBudget, setEditItemBudget] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');

  if (!selectedTrip) {
    return <Navigate to="/" replace />;
  }

  const items = selectedTrip.shoppingList || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addItem({ 
      name: newItemName,
      recipient: newItemRecipient || undefined,
      quantity: parseInt(newItemQuantity, 10) || 1,
      budget: parseInt(newItemBudget, 10) || undefined,
      description: newItemDescription || undefined
    });
    setNewItemName('');
    setNewItemRecipient('');
    setNewItemQuantity('1');
    setNewItemBudget('');
    setNewItemDescription('');
    setIsAdding(false);
  };

  const startEditing = (item: any) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemRecipient(item.recipient || '');
    setEditItemQuantity(item.quantity?.toString() || '1');
    setEditItemBudget(item.budget?.toString() || '');
    setEditItemDescription(item.description || '');
  };

  const handleUpdate = (e: React.FormEvent, itemId: string) => {
    e.preventDefault();
    if (!editItemName.trim()) return;
    updateItem(itemId, {
      name: editItemName,
      recipient: editItemRecipient || undefined,
      quantity: parseInt(editItemQuantity, 10) || 1,
      budget: parseInt(editItemBudget, 10) || undefined,
      description: editItemDescription || undefined
    });
    setEditingItemId(null);
  };

  const progress = items.length > 0 ? Math.round((items.filter(i => i.isBought).length / items.length) * 100) : 0;
  const totalBudget = items.reduce((acc, curr) => acc + (curr.budget || 0), 0);

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
        {totalBudget > 0 && (
          <div className="mt-3 text-right text-sm font-bold text-slate-700">
            予算合計: ¥{totalBudget.toLocaleString()}
          </div>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-panel mb-6 p-4">
          <div className="border-b border-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-slate-800">新しいお土産を追加</h3>
            <p className="text-xs text-slate-500 mt-1">誰に、何を買うかをメモしておきましょう。</p>
          </div>
          <div className="mb-3">
            <div className="text-xs font-bold text-slate-700 mb-1">お土産の内容（必須）</div>
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
          <div className="flex gap-2 mb-3">
            <div style={{ flex: 1 }}>
              <div className="text-xs font-bold text-slate-700 mb-1">渡す人（任意）</div>
              <input 
                type="text" 
                value={newItemRecipient}
                onChange={(e) => setNewItemRecipient(e.target.value)}
                placeholder="例: 職場、両親" 
                className="input-field mb-0"
              />
            </div>
            <div style={{ width: '80px' }}>
              <div className="text-xs font-bold text-slate-700 mb-1">数量</div>
              <input 
                type="number" 
                min="1"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                className="input-field mb-0"
              />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs font-bold text-slate-700 mb-1">予算（任意）</div>
            <input 
              type="number" 
              min="0"
              step="100"
              value={newItemBudget}
              onChange={(e) => setNewItemBudget(e.target.value)}
              placeholder="例: 3000" 
              className="input-field mb-0"
            />
          </div>
          <div className="mb-3">
            <div className="text-xs font-bold text-slate-700 mb-1">メモ・詳細（任意）</div>
            <textarea 
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="例: 白い恋人は36枚入りがコスパ良い" 
              style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', minHeight: '60px' }}
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="submit" className="btn-primary flex-1">保存する</button>
            <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary flex-1">キャンセル</button>
          </div>
        </form>
      )}

      <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
        {items.map(item => {
          const isEditing = editingItemId === item.id;
          return (
            <div 
              key={item.id} 
              className="glass-card" 
              style={{ padding: '1rem', opacity: item.isBought && !isEditing ? 0.6 : 1, transition: 'all 0.3s' }}
            >
              {isEditing ? (
                <form onSubmit={(e) => handleUpdate(e, item.id)} className="space-y-3 w-full">
                  <div>
                    <div className="text-xs font-bold text-slate-700 mb-1">お土産の内容（必須）</div>
                    <input 
                      type="text" 
                      value={editItemName}
                      onChange={(e) => setEditItemName(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <div style={{ flex: 1 }}>
                      <div className="text-xs font-bold text-slate-700 mb-1">渡す人</div>
                      <input 
                        type="text" 
                        value={editItemRecipient}
                        onChange={(e) => setEditItemRecipient(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                        placeholder="例: 職場"
                      />
                    </div>
                    <div style={{ width: '70px' }}>
                      <div className="text-xs font-bold text-slate-700 mb-1">数量</div>
                      <input 
                        type="number" 
                        min="1"
                        value={editItemQuantity}
                        onChange={(e) => setEditItemQuantity(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div style={{ flex: 1 }}>
                      <div className="text-xs font-bold text-slate-700 mb-1">予算</div>
                      <input 
                        type="number" 
                        min="0"
                        value={editItemBudget}
                        onChange={(e) => setEditItemBudget(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                        placeholder="予算"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700 mb-1">メモ・詳細</div>
                    <textarea
                      value={editItemDescription}
                      onChange={(e) => setEditItemDescription(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem', minHeight: '50px' }}
                      placeholder="メモを入力"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="btn-primary flex-1 py-1.5 text-xs">保存</button>
                    <button type="button" className="btn-secondary flex-1 py-1.5 text-xs" onClick={() => setEditingItemId(null)}>キャンセル</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between w-full">
                  <div 
                    className="flex items-start gap-3 flex-1 min-w-0" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.isBought ? (
                        <CheckSquare size={24} color="var(--accent-color)" />
                      ) : (
                        <Square size={24} color="var(--text-secondary)" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span style={{ textDecoration: item.isBought ? 'line-through' : 'none', fontWeight: item.isBought ? 400 : 600, fontSize: '1.05rem', wordBreak: 'break-all' }}>
                        {item.name}
                      </span>
                      {(item.recipient || item.quantity || item.budget) && (
                        <div className="flex gap-2 mt-1 items-center flex-wrap">
                          {item.recipient && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">渡す人: {item.recipient}</span>}
                          {item.quantity && item.quantity > 1 && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">x{item.quantity}</span>}
                          {item.budget && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">予算: ¥{item.budget.toLocaleString()}</span>}
                        </div>
                      )}
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded whitespace-pre-wrap">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(item);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:text-indigo-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`${item.name} を削除してもよろしいですか？`)) {
                          deleteItem(item.id);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:text-rose-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
