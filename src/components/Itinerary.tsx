import React, { useState } from 'react';
import { Plane, Car, Home, Building2, Ticket, MapPin, Plus, FolderPlus, Map } from 'lucide-react';
import { useTravelStore, type IconType } from '../store';

const getIcon = (type: IconType) => {
  switch (type) {
    case 'plane': return Plane;
    case 'car': return Car;
    case 'home': return Home;
    case 'building': return Building2;
    case 'ticket': return Ticket;
    case 'map-pin': return MapPin;
    default: return MapPin;
  }
};

export default function Itinerary() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const addCategory = useTravelStore((state) => state.addCategory);
  const addDaySchedule = useTravelStore((state) => state.addDaySchedule);
  const addEvent = useTravelStore((state) => state.addEvent);
  const updateEvent = useTravelStore((state) => state.updateEvent);
  const deleteEvent = useTravelStore((state) => state.deleteEvent);
  
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [addingDayToCat, setAddingDayToCat] = useState<string | null>(null);
  const [newDayDate, setNewDayDate] = useState('');

  const [addingEventTo, setAddingEventTo] = useState<{catId: string, dayId: string} | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLoc, setNewEventLoc] = useState('');

  if (!selectedTrip) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>旅行を選択してください</div>;
  }

  const categories = selectedTrip.itineraryCategories;

  const toggleEvent = (id: string) => {
    setExpandedEventId(prev => prev === id ? null : id);
  };

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    addCategory({ name: newCatName, schedules: [] });
    setIsAddingCat(false);
    setNewCatName('');
  };

  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingDayToCat || !newDayDate) return;
    addDaySchedule(addingDayToCat, newDayDate);
    setAddingDayToCat(null);
    setNewDayDate('');
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingEventTo || !newEventTitle || !newEventTime) return;
    addEvent(addingEventTo.catId, addingEventTo.dayId, {
      title: newEventTitle,
      time: newEventTime,
      location: newEventLoc,
      icon: 'map-pin'
    });
    setAddingEventTo(null);
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventLoc('');
  };

  const handleUpdateEvent = (e: React.FormEvent, catId: string, dayId: string, eventId: string) => {
    e.preventDefault();
    updateEvent(catId, dayId, eventId, {
      title: newEventTitle,
      time: newEventTime,
      location: newEventLoc
    });
    setEditingEventId(null);
  };

  const startEditing = (catId: string, dayId: string, event: any) => {
    setNewEventTitle(event.title);
    setNewEventTime(event.time);
    setNewEventLoc(event.location);
    setEditingEventId(event.id);
  };

  const openMap = (location: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="title">スケジュール</h2>
          <p className="subtitle">旅行のタイムライン</p>
        </div>
        <button onClick={() => setIsAddingCat(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <FolderPlus size={16} /> 計画を追加
        </button>
      </div>

      {isAddingCat && (
        <form onSubmit={handleAddCat} className="glass-panel mb-6 p-4">
          <input type="text" placeholder="大カテゴリ名 (例: 東京観光編)" className="input-field" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">保存</button>
            <button type="button" className="btn-secondary" onClick={() => setIsAddingCat(false)}>キャンセル</button>
          </div>
        </form>
      )}

      {addingEventTo && (
        <form onSubmit={handleAddEvent} className="glass-panel mb-6 p-4">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>予定を追加</h3>
          <input type="time" className="input-field" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} required />
          <input type="text" placeholder="予定の内容 (例: スカイツリー)" className="input-field" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} required />
          <input type="text" placeholder="場所 (例: 東京都墨田区...)" className="input-field" value={newEventLoc} onChange={e => setNewEventLoc(e.target.value)} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">保存</button>
            <button type="button" className="btn-secondary" onClick={() => setAddingEventTo(null)}>キャンセル</button>
          </div>
        </form>
      )}
      
      <div className="flex" style={{ flexDirection: 'column', gap: '3rem' }}>
        {categories.map((cat) => (
          <div key={cat.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.4)' }}>
            <div className="flex items-center justify-between mb-3" style={{ borderBottom: '2px solid var(--accent-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {cat.name}
              </h3>
              <button onClick={() => setAddingDayToCat(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                <Plus size={14} /> 日付を追加
              </button>
            </div>

            {addingDayToCat === cat.id && (
              <form onSubmit={handleAddDay} className="mb-4 flex gap-2">
                <input type="text" placeholder="例: 8月10日 (月) - 小樽観光" className="input-field" style={{ marginBottom: 0, flex: 1 }} value={newDayDate} onChange={e => setNewDayDate(e.target.value)} required autoFocus />
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>保存</button>
                <button type="button" className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setAddingDayToCat(null)}>中止</button>
              </form>
            )}
            
            <div className="flex" style={{ flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
              {cat.schedules.map((day) => (
                <div key={day.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {day.date}
                    </h4>
                    <button onClick={() => setAddingEventTo({catId: cat.id, dayId: day.id})} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Plus size={14} /> 予定追加
                    </button>
                  </div>
                  
                  <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem', paddingLeft: '0.5rem' }}>
                    {day.events.length > 0 ? day.events.map((event, idx) => {
                      const Icon = getIcon(event.icon);
                      const isExpanded = expandedEventId === event.id;
                      
                      return (
                        <div key={event.id} className="flex gap-4" style={{ position: 'relative' }}>
                          {/* Timeline line */}
                          {idx !== day.events.length - 1 && (
                            <div style={{ position: 'absolute', left: '19px', top: '40px', bottom: '-1.5rem', width: '2px', background: 'var(--glass-border)' }}></div>
                          )}
                          
                          {/* Icon */}
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', 
                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-primary)', flexShrink: 0, zIndex: 1
                          }}>
                            <Icon size={18} />
                          </div>
                          
                          {/* Content */}
                          <div 
                            className="glass-card w-full" 
                            style={{ padding: '1rem', cursor: 'pointer' }}
                            onClick={() => toggleEvent(event.id)}
                          >
                            {editingEventId === event.id ? (
                              <form onClick={e => e.stopPropagation()} onSubmit={(e) => handleUpdateEvent(e, cat.id, day.id, event.id)}>
                                <input type="time" className="input-field" style={{ marginBottom: '0.5rem' }} value={newEventTime} onChange={e => setNewEventTime(e.target.value)} required />
                                <input type="text" className="input-field" style={{ marginBottom: '0.5rem' }} value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} required />
                                <input type="text" className="input-field" style={{ marginBottom: '0.5rem' }} value={newEventLoc} onChange={e => setNewEventLoc(e.target.value)} />
                                <div className="flex gap-2">
                                  <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', flex: 1 }}>保存</button>
                                  <button type="button" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setEditingEventId(null)}>キャンセル</button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                                      {event.time}
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                      {event.title}
                                    </div>
                                    <div className="flex items-center gap-1" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                      <MapPin size={14} />
                                      <span>{event.location}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div className="flex gap-2">
                                      <button onClick={(e) => { e.stopPropagation(); openMap(event.location); }} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--glass-bg)', color: 'var(--accent-color)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
                                        <Map size={14} /> マップ
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); startEditing(cat.id, day.id, event); }} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--accent-color)' }}>
                                        編集
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); deleteEvent(cat.id, day.id, event.id); }} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        削除
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                        予定がありません。追加してください。
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {cat.schedules.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  日程が登録されていません
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
