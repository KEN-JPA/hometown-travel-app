import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, X, GripVertical, Download, Upload, Settings } from 'lucide-react';
import { useTravelStore } from '../store';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTripItem({ trip, onSelect }: { trip: any, onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: trip.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      {...attributes} 
      {...listeners} 
      style={{ ...style, cursor: 'grab' }} 
      className="glass-card" 
      onClick={() => onSelect(trip.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            <GripVertical size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{trip.tripName}</h3>
            <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span style={{ fontSize: '14px' }}>📅</span>
              <span>{trip.tripDate ? `${new Date(trip.tripDate).toLocaleDateString('ja-JP')} 出発` : '日付未定'}</span>
            </div>
          </div>
        </div>
        <ChevronRight size={20} color="var(--text-secondary)" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectTrip = useTravelStore((state) => state.selectTrip);
  const addTrip = useTravelStore((state) => state.addTrip);
  const updateTrip = useTravelStore((state) => state.updateTrip);
  const deleteTrip = useTravelStore((state) => state.deleteTrip);
  const reorderTrips = useTravelStore((state) => state.reorderTrips);
  const addWishlistItem = useTravelStore((state) => state.addWishlistItem);
  const deleteWishlistItem = useTravelStore((state) => state.deleteWishlistItem);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = trips.findIndex(t => t.id === active.id);
      const newIndex = trips.findIndex(t => t.id === over.id);
      reorderTrips(oldIndex, newIndex);
    }
  };

  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDate, setNewTripDate] = useState('');
  const [newTripParticipants, setNewTripParticipants] = useState('1');

  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [editTripName, setEditTripName] = useState('');
  const [editTripDate, setEditTripDate] = useState('');
  const [editTripParticipants, setEditTripParticipants] = useState('1');

  const [showSettings, setShowSettings] = useState(false);

  // One-time fix to rename the old sample trip in existing local storage
  useEffect(() => {
    const trip1 = trips.find(t => t.id === 'trip-1');
    if (trip1 && trip1.tripName === '✈️ 2026 夏の北海道 家族旅行') {
      useTravelStore.setState(state => ({
        trips: state.trips.map(t => t.id === 'trip-1' ? { ...t, tripName: '✈️ 【サンプル】2026 夏の北海道 家族旅行' } : t)
      }));
    }
  }, [trips]);

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName) return;
    addTrip({
      tripName: newTripName,
      tripDate: newTripDate ? new Date(newTripDate).toISOString() : null,
      participantsCount: parseInt(newTripParticipants, 10) || 1
    });
    setIsAddingTrip(false);
    setNewTripName('');
    setNewTripDate('');
    setNewTripParticipants('1');
  };

  const openEdit = () => {
    if (!selectedTrip) return;
    setEditTripName(selectedTrip.tripName);
    setEditTripDate(selectedTrip.tripDate ? new Date(selectedTrip.tripDate).toISOString().split('T')[0] : '');
    setEditTripParticipants((selectedTrip.participantsCount || 1).toString());
    setIsEditingTrip(true);
  };

  const handleEditTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTripName || !selectedTrip) return;
    updateTrip(selectedTrip.id, editTripName, editTripDate ? new Date(editTripDate).toISOString() : null, parseInt(editTripParticipants, 10) || 1);
    setIsEditingTrip(false);
  };

  const handleDeleteTrip = () => {
    if (window.confirm('本当にこの旅行計画を削除しますか？')) {
      if (selectedTripId) deleteTrip(selectedTripId);
      selectTrip(null);
      setIsEditingTrip(false);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ trips: useTravelStore.getState().trips }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hometown-travel-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.trips && Array.isArray(json.trips)) {
          if (window.confirm('現在のデータを上書きしますか？（現在のデータは失われます）')) {
            useTravelStore.setState({ trips: json.trips, selectedTripId: null });
            alert('データをインポートしました。');
            setShowSettings(false);
          }
        } else {
          alert('無効なデータ形式です。');
        }
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // If no trip is selected, or if we want to show the trip list:
  if (!selectedTrip) {
    return (
      <div className="flex" style={{ flexDirection: 'column', gap: '1.25rem' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="title">マイ旅行計画</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--glass-bg)', color: 'var(--text-secondary)' }}>
              <Settings size={18} />
            </button>
            <button onClick={() => setIsAddingTrip(true)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
              <Plus size={14} /> 新規作成
            </button>
          </div>
        </div>
        
        <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={trips.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {trips.map(trip => (
                <SortableTripItem key={trip.id} trip={trip} onSelect={selectTrip} />
              ))}
            </SortableContext>
          </DndContext>
          {trips.length === 0 && (
            <div className="glass-panel p-6 text-center text-slate-500 mt-4">
              <p className="font-bold text-slate-700 mb-1">旅行計画がありません</p>
              <p className="text-sm">
                右上の「新規作成」ボタンから、これからの旅行プランや、過去の思い出アルバムを作りましょう！
              </p>
            </div>
          )}
        </div>

        {isAddingTrip && (
          <div className="modal-overlay" onClick={() => setIsAddingTrip(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>新しい旅行計画</h3>
                <button onClick={() => setIsAddingTrip(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTrip}>
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">旅行のタイトル（必須）</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ marginBottom: 0 }}
                    placeholder="例: 2026 夏の北海道 家族旅行" 
                    value={newTripName}
                    onChange={e => setNewTripName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">行き先や目的を入れると見やすくなります。</p>
                </div>
                
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">出発日（任意・未定でもOK）</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ marginBottom: 0 }}
                    value={newTripDate}
                    onChange={e => setNewTripDate(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">日付を入れると、トップ画面で「あと何日」かカウントダウンされます！</p>
                </div>
                
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">参加人数</label>
                  <input 
                    type="number" 
                    min="1"
                    className="input-field" 
                    style={{ marginBottom: 0 }}
                    value={newTripParticipants}
                    onChange={e => setNewTripParticipants(e.target.value)}
                  />
                </div>
                
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                  作成する
                </button>
              </form>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                <h3 className="flex items-center gap-2" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  <Settings size={20} color="var(--accent-color)" /> データ保存・設定
                </h3>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="glass-panel p-4">
                  <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Download size={16} /> データのバックアップ (書き出し)</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    現在の旅行データをJSONファイルとしてダウンロードします。家族に共有したり、バックアップとして保存できます。（※画像データは一部含まれない場合があります）
                  </p>
                  <button onClick={handleExport} className="btn-primary w-full justify-center">データをダウンロード</button>
                </div>

                <div className="glass-panel p-4">
                  <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Upload size={16} /> データの復元 (読み込み)</h4>
                  <p className="text-xs text-slate-500 mb-3 text-red-500 font-medium">
                    ⚠️ バックアップファイルを読み込みます。現在のデータはすべて上書きされ、元に戻せません。
                  </p>
                  <label className="btn-secondary w-full justify-center cursor-pointer text-center block">
                    <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                    データファイルを読み込む
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // When a trip is selected:
  const calculateDaysLeft = () => {
    if (!selectedTrip.tripDate) return null;
    const target = new Date(selectedTrip.tripDate).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft();

  // Find next event (simplified for now)
  const firstCat = selectedTrip.itineraryCategories[0]?.schedules[0]?.events || [];
  const nextEvent = firstCat[0] || null;

  // Calculate Dashboard Metrics
  const uncompletedPrepTasks = (selectedTrip.preparationTasks || []).filter(t => t.status !== 'completed').length;
  
  const packingItems = selectedTrip.packingList || [];
  const packingProgress = packingItems.length > 0 ? Math.round((packingItems.filter(i => i.isPacked).length / packingItems.length) * 100) : 0;
  
  const shoppingItems = selectedTrip.shoppingList || [];
  const shoppingProgress = shoppingItems.length > 0 ? Math.round((shoppingItems.filter(i => i.isBought).length / shoppingItems.length) * 100) : 0;
  
  const totalBudget = (selectedTrip.expenses || []).reduce((acc, curr) => acc + curr.amount, 0);
  const bookingCount = (selectedTrip.bookings || []).length;

  return (
    <div className="flex" style={{ flexDirection: 'column', gap: '1.25rem' }}>
      
      <button 
        onClick={() => selectTrip(null)}
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.875rem', alignSelf: 'flex-start' }}
      >
        <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> 一覧へ戻る
      </button>

      {/* Hero Section */}
      <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', border: 'none', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(255, 255, 255, 0.7))', borderBottom: '1px solid var(--accent-glow)' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="title" style={{ fontSize: '1.75rem' }}>旅行まであと...</h2>
            <button onClick={openEdit} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent-color)' }}>
              ✎
            </button>
          </div>
          <p className="subtitle" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{selectedTrip.tripName}</p>
          
          <div className="flex items-center gap-4 mt-4">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, fontFamily: 'Outfit' }}>
                {daysLeft !== null ? Math.max(0, daysLeft) : '-'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>日</div>
            </div>
            <div style={{ height: '40px', width: '1px', background: 'var(--glass-border)' }}></div>
            <div>
              {nextEvent ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: '16px' }}>✈️</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{nextEvent.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '16px' }}>📍</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{nextEvent.location}</span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>予定がありません</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, transform: 'rotate(15deg)', fontSize: '140px', lineHeight: 1 }}>
          ✈️
        </div>
      </div>

      {isEditingTrip && (
        <div className="modal-overlay" onClick={() => setIsEditingTrip(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>旅行計画の編集</h3>
              <button onClick={() => setIsEditingTrip(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditTrip}>
              <label className="input-label">旅行のタイトル</label>
              <input 
                type="text" 
                className="input-field" 
                value={editTripName}
                onChange={e => setEditTripName(e.target.value)}
                required
              />
              
              <label className="input-label">出発日 (未定でもOK)</label>
              <input 
                type="date" 
                className="input-field" 
                value={editTripDate}
                onChange={e => setEditTripDate(e.target.value)}
              />
              
              <label className="input-label mt-3">参加人数</label>
              <input 
                type="number" 
                min="1"
                className="input-field" 
                value={editTripParticipants}
                onChange={e => setEditTripParticipants(e.target.value)}
              />
              
              <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  更新する
                </button>
                <button type="button" onClick={handleDeleteTrip} className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <X size={16} /> 削除
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Status Cards / Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        
        {/* Uncompleted Prep Tasks */}
        <div className="glass-card flex" style={{ flexDirection: 'column', padding: '1rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <div style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}>📋</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>準備タスク</div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {uncompletedPrepTasks > 0 ? (
              <><span style={{ color: 'var(--danger)' }}>{uncompletedPrepTasks}</span>件 残り</>
            ) : (
              <span style={{ color: 'var(--success)', fontSize: '1rem' }}>すべて完了✨</span>
            )}
          </div>
        </div>
        
        {/* Total Budget */}
        <div className="glass-card flex" style={{ flexDirection: 'column', padding: '1rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <div style={{ padding: '0.4rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '8px' }}>💰</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>費用合計</div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Outfit' }}>
            ¥{totalBudget.toLocaleString()}
          </div>
        </div>

        {/* Packing Progress */}
        <div className="glass-card flex" style={{ flexDirection: 'column', padding: '1rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <div style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px' }}>🎒</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>持ち物準備</div>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ flex: 1, height: '6px', background: 'var(--glass-bg)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${packingProgress}%`, height: '100%', background: '#3b82f6' }}></div>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'Outfit', width: '30px', textAlign: 'right' }}>{packingProgress}%</span>
          </div>
        </div>

        {/* Shopping Progress */}
        <div className="glass-card flex" style={{ flexDirection: 'column', padding: '1rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <div style={{ padding: '0.4rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '8px' }}>🎁</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>お土産購入</div>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ flex: 1, height: '6px', background: 'var(--glass-bg)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${shoppingProgress}%`, height: '100%', background: '#8b5cf6' }}></div>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'Outfit', width: '30px', textAlign: 'right' }}>{shoppingProgress}%</span>
          </div>
        </div>
        
        {/* Booking Count */}
        <div className="glass-card flex" style={{ flexDirection: 'column', padding: '1rem', gridColumn: '1 / -1' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div style={{ padding: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}>🎟️</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>予約・チケット手配済み</div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {bookingCount}件
            </div>
          </div>
        </div>

      </div>

      {/* Wishlist / 行きたいとこメモ Section */}
      <div className="glass-panel" style={{ marginTop: '0.5rem' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent-color)' }}>
              <span style={{ fontSize: '1.25rem' }}>📍</span>
            </div>
            <h2 className="title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>行きたいとこメモ</h2>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(selectedTrip.wishlist || []).map((item) => {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const parts = item.name.split(urlRegex);
            
            return (
              <div key={item.id} className="flex items-center justify-between" style={{ background: 'var(--glass-bg)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontWeight: 500, wordBreak: 'break-word', flex: 1, marginRight: '1rem', lineHeight: '1.4' }}>
                  {parts.map((part, i) => 
                    part.match(urlRegex) ? (
                      <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline', wordBreak: 'break-all' }} onClick={e => e.stopPropagation()}>
                        {part}
                      </a>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm('本当に削除しますか？')) {
                      deleteWishlistItem(item.id);
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                >
                  <X size={18} />
                </button>
              </div>
            );
          })}

          {/* Add Item Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const input = form.elements.namedItem('wishlistName') as HTMLInputElement;
              if (input.value.trim()) {
                addWishlistItem(input.value.trim());
                input.value = '';
              }
            }}
            style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}
          >
            <input 
              type="text" 
              name="wishlistName"
              className="input-field" 
              style={{ flex: 1, marginBottom: 0 }}
              placeholder="例: 有名な〇〇カフェに行きたい！(URLもOK)" 
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}>
              <Plus size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
