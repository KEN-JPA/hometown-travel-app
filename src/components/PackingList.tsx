import React, { useState } from 'react';
import { useTravelStore, type PackingItem } from '../store';
import { CheckSquare, Square, Trash2, Plus, Package, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function PackingList() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  
  const toggleItem = useTravelStore((state) => state.togglePackingItem);
  const deleteItem = useTravelStore((state) => state.deletePackingItem);
  const addItem = useTravelStore((state) => state.addPackingItem);
  const updateItem = useTravelStore((state) => state.updatePackingItem);

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('衣類');
  const [newItemAssignee, setNewItemAssignee] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showUnpackedOnly, setShowUnpackedOnly] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // 編集用の state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('衣類');
  const [editItemAssignee, setEditItemAssignee] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState('1');
  const [editItemDescription, setEditItemDescription] = useState('');

  if (!selectedTrip) {
    return <Navigate to="/" replace />;
  }

  const allItems = selectedTrip.packingList || [];
  const items = showUnpackedOnly ? allItems.filter(i => !i.isPacked) : allItems;
  
  // Group by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const categoryStats = allItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = { total: 0, packed: 0 };
    acc[item.category].total += 1;
    if (item.isPacked) acc[item.category].packed += 1;
    return acc;
  }, {} as Record<string, { total: number; packed: number }>);

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addItem({ 
      name: newItemName, 
      category: newItemCategory,
      assignee: newItemAssignee || undefined,
      quantity: parseInt(newItemQuantity, 10) || 1,
      description: newItemDescription || undefined
    });
    setNewItemName('');
    setNewItemAssignee('');
    setNewItemQuantity('1');
    setNewItemDescription('');
    setIsAdding(false);
  };

  const startEditing = (item: PackingItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemCategory(item.category);
    setEditItemAssignee(item.assignee || '');
    setEditItemQuantity(item.quantity?.toString() || '1');
    setEditItemDescription(item.description || '');
  };

  const handleUpdate = (e: React.FormEvent, itemId: string) => {
    e.preventDefault();
    if (!editItemName.trim()) return;
    updateItem(itemId, {
      name: editItemName,
      category: editItemCategory,
      assignee: editItemAssignee || undefined,
      quantity: parseInt(editItemQuantity, 10) || 1,
      description: editItemDescription || undefined
    });
    setEditingItemId(null);
  };

  const addTemplates = () => {
    const templates = [
      { name: 'パスポート', category: '重要', assignee: 'パパ', quantity: 1, description: '有効期限が切れていないか要確認' },
      { name: '航空券・チケット', category: '重要', assignee: 'パパ', quantity: 1, description: 'QRコードのスクショも用意しておく' },
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
          <div className="mb-3">
            <div className="text-xs font-bold text-slate-700 mb-1">メモ・詳細（任意）</div>
            <textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="例: 充電器は2個口以上のものが便利" 
              style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', minHeight: '60px' }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1" style={{ padding: '0.5rem 1rem' }}>保存する</button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setIsAdding(false)} style={{ padding: '0.5rem 1rem' }}>キャンセル</button>
          </div>
        </form>
      )}

      {Object.entries(groupedItems).map(([category, categoryItems]) => {
        const isCollapsed = collapsedCategories[category] === true;
        const stats = categoryStats[category] || { total: categoryItems.length, packed: categoryItems.filter(item => item.isPacked).length };
        const categoryProgress = stats.total > 0 ? Math.round((stats.packed / stats.total) * 100) : 0;

        return (
        <div key={category} className="glass-panel mb-4" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleCategory(category)}
            className="w-full flex items-center justify-between"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.9rem 1rem',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
              </div>
              <div style={{
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-color)',
                padding: '0.45rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Package size={17} />
              </div>
              <div className="min-w-0">
                <div style={{ fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {category}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {stats.packed}/{stats.total} 完了 ・ {categoryProgress}%
                </div>
              </div>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full shrink-0">
              {categoryItems.length}件
            </span>
          </button>

          {!isCollapsed && (
          <div className="flex" style={{ flexDirection: 'column', gap: '0.5rem', padding: '0 1rem 1rem' }}>
            {categoryItems.map(item => {
              const isEditing = editingItemId === item.id;
              return (
                <div 
                  key={item.id} 
                  className="glass-card" 
                  style={{ padding: '0.75rem 1rem', opacity: item.isPacked && !isEditing ? 0.6 : 1 }}
                >
                  {isEditing ? (
                    <form onSubmit={(e) => handleUpdate(e, item.id)} className="space-y-3 w-full">
                      <div className="flex gap-2">
                        <div style={{ flex: '0 0 120px' }}>
                          <div className="text-xs font-bold text-slate-700 mb-1">ジャンル</div>
                          <select 
                            value={editItemCategory}
                            onChange={(e) => setEditItemCategory(e.target.value)}
                            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white', fontSize: '0.875rem' }}
                          >
                            <option value="重要">重要書類</option>
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
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div style={{ flex: 1 }}>
                          <div className="text-xs font-bold text-slate-700 mb-1">担当</div>
                          <input 
                            type="text" 
                            value={editItemAssignee}
                            onChange={(e) => setEditItemAssignee(e.target.value)}
                            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                            placeholder="例: パパ"
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
                      <div className="flex-1 min-w-0">
                        <div 
                          className="flex items-start gap-3" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleItem(item.id)}
                        >
                          <div className="mt-0.5 shrink-0">
                            {item.isPacked ? (
                              <CheckSquare size={20} color="var(--accent-color)" />
                            ) : (
                              <Square size={20} color="var(--text-secondary)" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span style={{ textDecoration: item.isPacked ? 'line-through' : 'none', fontWeight: item.isPacked ? 400 : 500, wordBreak: 'break-all' }}>
                              {item.name}
                            </span>
                            {(item.assignee || item.quantity) && (
                              <div className="flex gap-2 mt-1">
                                {item.assignee && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.assignee}</span>}
                                {item.quantity && item.quantity > 1 && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">x{item.quantity}</span>}
                              </div>
                            )}
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded whitespace-pre-wrap">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button 
                          onClick={() => startEditing(item)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                          className="hover:text-indigo-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`${item.name} を削除してもよろしいですか？`)) {
                              deleteItem(item.id);
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                          className="hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
