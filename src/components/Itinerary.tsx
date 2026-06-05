import React, { useState } from 'react';
import { Plane, Car, Home, Building2, Ticket, MapPin, Plus, FolderPlus, Map } from 'lucide-react';
import { useTravelStore, type IconType } from '../store';
import { Navigate } from 'react-router-dom';

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
  const updateCategory = useTravelStore((state) => state.updateCategory);
  const deleteCategory = useTravelStore((state) => state.deleteCategory);
  const addDaySchedule = useTravelStore((state) => state.addDaySchedule);
  const updateDaySchedule = useTravelStore((state) => state.updateDaySchedule);
  const deleteDaySchedule = useTravelStore((state) => state.deleteDaySchedule);
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
  const [newEventIcon, setNewEventIcon] = useState<IconType>('map-pin');

  // カテゴリ（大枠）編集用の状態
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // 日程（日付）編集用の状態
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editDayDate, setEditDayDate] = useState('');

  const startEditingCat = (id: string, name: string) => {
    setEditingCatId(id);
    setEditCatName(name);
  };

  const handleUpdateCat = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editCatName.trim()) return;
    updateCategory(id, editCatName);
    setEditingCatId(null);
  };

  const startEditingDay = (id: string, date: string) => {
    setEditingDayId(id);
    setEditDayDate(date);
  };

  const handleUpdateDay = (e: React.FormEvent, catId: string, dayId: string) => {
    e.preventDefault();
    if (!editDayDate.trim()) return;
    updateDaySchedule(catId, dayId, editDayDate);
    setEditingDayId(null);
  };

  if (!selectedTrip) {
    return <Navigate to="/" replace />;
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
      icon: newEventIcon
    });
    setAddingEventTo(null);
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventLoc('');
    setNewEventIcon('map-pin');
  };

  const handleUpdateEvent = (e: React.FormEvent, catId: string, dayId: string, eventId: string) => {
    e.preventDefault();
    updateEvent(catId, dayId, eventId, {
      title: newEventTitle,
      time: newEventTime,
      location: newEventLoc,
      icon: newEventIcon
    });
    setEditingEventId(null);
  };

  const startEditing = (_catId: string, _dayId: string, event: any) => {
    setNewEventTitle(event.title);
    setNewEventTime(event.time);
    setNewEventLoc(event.location);
    setNewEventIcon(event.icon || 'map-pin');
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
          <div className="border-b border-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-slate-800">新しい計画（大枠）を追加</h3>
            <p className="text-xs text-slate-500 mt-1">
              「1日目」「東京観光」など、スケジュールを区切る大きな枠組みを作ります。
            </p>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700 mb-1">計画の名前（必須）</div>
            <input type="text" placeholder="例: 1日目 - 東京観光編" className="input-field" style={{ marginBottom: 0 }} value={newCatName} onChange={e => setNewCatName(e.target.value)} required autoFocus />
          </div>
          <div className="flex gap-2 pt-3">
            <button type="submit" className="btn-primary flex-1">保存する</button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setIsAddingCat(false)}>キャンセル</button>
          </div>
        </form>
      )}

      {addingEventTo && (
        <form onSubmit={handleAddEvent} className="glass-panel mb-6 p-4">
          <div className="border-b border-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-slate-800">予定を追加</h3>
            <p className="text-xs text-slate-500 mt-1">
              時間、内容、場所を入れて、当日のタイムラインを作りましょう。
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-700 mb-1">開始時間（必須）</div>
                <input type="time" className="input-field" style={{ marginBottom: 0 }} value={newEventTime} onChange={e => setNewEventTime(e.target.value)} required autoFocus />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-700 mb-1">種類</div>
                <select className="input-field" style={{ marginBottom: 0 }} value={newEventIcon} onChange={e => setNewEventIcon(e.target.value as IconType)}>
                  <option value="plane">飛行機・新幹線</option>
                  <option value="car">車・移動</option>
                  <option value="map-pin">観光・その他</option>
                  <option value="ticket">イベント・遊び</option>
                  <option value="building">ホテル・宿</option>
                  <option value="home">自宅</option>
                </select>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">予定の内容（必須）</div>
              <input type="text" placeholder="例: 東京スカイツリー展望台" className="input-field" style={{ marginBottom: 0 }} value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} required />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">場所・住所（任意）</div>
              <input type="text" placeholder="例: 東京都墨田区押上1-1-2" className="input-field" style={{ marginBottom: 0 }} value={newEventLoc} onChange={e => setNewEventLoc(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary flex-1">保存する</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setAddingEventTo(null)}>キャンセル</button>
            </div>
          </div>
        </form>
      )}
      
      <div className="flex" style={{ flexDirection: 'column', gap: '3rem' }}>
        {categories.length > 0 ? (
          categories.map((cat) => (
            <div key={cat.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.4)' }}>
              <div className="flex items-center justify-between mb-3" style={{ borderBottom: '2px solid var(--accent-color)', paddingBottom: '0.5rem' }}>
                {editingCatId === cat.id ? (
                  <form onSubmit={(e) => handleUpdateCat(e, cat.id)} className="flex items-center gap-2 flex-1 mr-4">
                    <input 
                      type="text" 
                      value={editCatName} 
                      onChange={e => setEditCatName(e.target.value)} 
                      style={{ fontSize: '1rem', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', flex: 1 }}
                      required
                      autoFocus
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>保存</button>
                    <button type="button" className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditingCatId(null)}>キャンセル</button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cat.name}
                    </h3>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => startEditingCat(cat.id, cat.name)} 
                        title="計画名を編集"
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                        className="hover:text-indigo-600"
                      >
                        ✎
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`「${cat.name}」とその中のすべての日程・予定を削除してもよろしいですか？`)) {
                            deleteCategory(cat.id);
                          }
                        }} 
                        title="計画を削除"
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                        className="hover:text-rose-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
                <button onClick={() => setAddingDayToCat(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Plus size={14} /> 日付を追加
                </button>
              </div>

              {addingDayToCat === cat.id && (
                <form onSubmit={handleAddDay} className="mb-4 glass-card p-3">
                  <div className="text-xs font-bold text-slate-700 mb-1">日付や見出し（必須）</div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="例: 8月10日 (月) - 小樽観光" className="input-field" style={{ marginBottom: 0, flex: 1 }} value={newDayDate} onChange={e => setNewDayDate(e.target.value)} required autoFocus />
                    <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>保存</button>
                    <button type="button" className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setAddingDayToCat(null)}>中止</button>
                  </div>
                </form>
              )}
              
              <div className="flex" style={{ flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
                {cat.schedules.map((day) => (
                  <div key={day.id}>
                    <div className="flex items-center justify-between mb-3">
                      {editingDayId === day.id ? (
                        <form onSubmit={(e) => handleUpdateDay(e, cat.id, day.id)} className="flex items-center gap-2 flex-1 mr-4">
                          <input 
                            type="text" 
                            value={editDayDate} 
                            onChange={e => setEditDayDate(e.target.value)} 
                            style={{ fontSize: '0.9rem', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', flex: 1 }}
                            required
                            autoFocus
                          />
                          <button type="submit" className="btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>保存</button>
                          <button type="button" className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditingDayId(null)}>キャンセル</button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {day.date}
                          </h4>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => startEditingDay(day.id, day.date)} 
                              title="日程名を編集"
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                              className="hover:text-indigo-600"
                            >
                              ✎
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm(`「${day.date}」とその中のすべての予定を削除してもよろしいですか？`)) {
                                  deleteDaySchedule(cat.id, day.id);
                                }
                              }} 
                              title="日程を削除"
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                              className="hover:text-rose-600"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                      <button onClick={() => setAddingEventTo({catId: cat.id, dayId: day.id})} style={{ background: 'var(--glass-bg)', border: '1px solid var(--accent-glow)', borderRadius: '8px', padding: '0.25rem 0.75rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
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
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <div className="text-xs font-bold text-slate-700 mb-1">時間</div>
                                      <input type="time" className="input-field" style={{ marginBottom: '0.5rem' }} value={newEventTime} onChange={e => setNewEventTime(e.target.value)} required />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs font-bold text-slate-700 mb-1">種類</div>
                                      <select className="input-field" style={{ marginBottom: '0.5rem' }} value={newEventIcon} onChange={e => setNewEventIcon(e.target.value as IconType)}>
                                        <option value="plane">飛行機・新幹線</option>
                                        <option value="car">車・移動</option>
                                        <option value="map-pin">観光・その他</option>
                                        <option value="ticket">イベント・遊び</option>
                                        <option value="building">ホテル・宿</option>
                                        <option value="home">自宅</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="text-xs font-bold text-slate-700 mb-1">予定の内容</div>
                                  <input type="text" className="input-field" style={{ marginBottom: '0.5rem' }} value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} required />
                                  <div className="text-xs font-bold text-slate-700 mb-1">場所</div>
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
                        <div className="glass-panel p-4 text-center text-slate-500 bg-white/40">
                          <p className="font-bold text-slate-700 text-sm mb-1">予定がありません</p>
                          <p className="text-xs">
                            右上の「予定追加」ボタンから、この日のタイムラインを作りましょう。
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {cat.schedules.length === 0 && (
                  <div className="glass-panel p-4 text-center text-slate-500 bg-white/40">
                    <p className="font-bold text-slate-700 text-sm mb-1">日付がありません</p>
                    <p className="text-xs">
                      「日付を追加」ボタンから、「8月10日」や「1日目」などの区切りを追加してください。
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          !isAddingCat && (
            <div className="glass-panel p-6 text-center text-slate-500">
              <FolderPlus size={40} className="mx-auto mb-3 opacity-30 text-indigo-500" />
              <p className="font-bold text-slate-700 mb-1">スケジュールがありません</p>
              <p className="text-sm">
                上の「計画を追加」ボタンから、まずは「1日目」などの大枠を作ってみましょう！<br />
                タイムライン形式で当日の動きが見やすくなります。
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
