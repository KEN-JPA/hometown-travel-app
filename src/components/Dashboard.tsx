import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, X, GripVertical } from 'lucide-react';
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

  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [editTripName, setEditTripName] = useState('');
  const [editTripDate, setEditTripDate] = useState('');

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
      tripDate: newTripDate ? new Date(newTripDate).toISOString() : null
    });
    setIsAddingTrip(false);
    setNewTripName('');
    setNewTripDate('');
  };

  const openEdit = () => {
    if (!selectedTrip) return;
    setEditTripName(selectedTrip.tripName);
    setEditTripDate(selectedTrip.tripDate ? new Date(selectedTrip.tripDate).toISOString().split('T')[0] : '');
    setIsEditingTrip(true);
  };

  const handleEditTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTripName || !selectedTrip) return;
    updateTrip(selectedTrip.id, editTripName, editTripDate ? new Date(editTripDate).toISOString() : null);
    setIsEditingTrip(false);
  };

  const handleDeleteTrip = () => {
    if (!selectedTrip) return;
    if (confirm('本当にこの旅行計画を削除しますか？')) {
      deleteTrip(selectedTrip.id);
      setIsEditingTrip(false);
    }
  };

  // If no trip is selected, or if we want to show the trip list:
  if (!selectedTrip) {
    return (
      <div className="flex" style={{ flexDirection: 'column', gap: '1.25rem' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="title">マイ旅行計画</h2>
          <button onClick={() => setIsAddingTrip(true)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
            <Plus size={14} /> 新規作成
          </button>
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
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              旅行計画がありません。<br/>右上のボタンから追加してください。
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
                <label className="input-label">旅行のタイトル</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="例: 夏の沖縄家族旅行" 
                  value={newTripName}
                  onChange={e => setNewTripName(e.target.value)}
                  required
                />
                
                <label className="input-label">出発日 (未定でもOK)</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={newTripDate}
                  onChange={e => setNewTripDate(e.target.value)}
                />
                
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                  作成する
                </button>
              </form>
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

      {/* Quick Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="glass-card flex" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '8px', fontSize: '1.5rem', lineHeight: 1 }}>
            ☔
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>現地の天気</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'Outfit' }}>24°C / 雨</div>
          </div>
        </div>
        
        <div className="glass-card flex" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', fontSize: '1.5rem', lineHeight: 1 }}>
            🏨
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>次のチェックイン</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Outfit' }}>トヨタレンタカー</div>
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
          {(selectedTrip.wishlist || []).map((item) => (
            <div key={item.id} className="flex items-center justify-between" style={{ background: 'var(--glass-bg)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontWeight: 500 }}>{item.name}</span>
              <button 
                onClick={() => deleteWishlistItem(item.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
          ))}

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
              placeholder="行きたい場所を追加..." 
              style={{ flex: 1 }}
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
