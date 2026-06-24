import React, { useState, useEffect } from 'react';
import { Plane, Car, Building2, Ticket, Copy, ExternalLink, MapPin, Home, Upload, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useTravelStore, type IconType, type Booking } from '../store';
import { set, get } from 'idb-keyval';
import { Navigate } from 'react-router-dom';

const getIcon = (type: IconType) => {
  switch (type) {
    case 'plane': return Plane;
    case 'car': return Car;
    case 'home': return Home;
    case 'building': return Building2;
    case 'ticket': return Ticket;
    case 'map-pin': return MapPin;
    default: return Ticket;
  }
};

const BookingCard = ({ booking }: { booking: Booking }) => {
  const updateBookingImage = useTravelStore((state) => state.updateBookingImage);
  const deleteBooking = useTravelStore((state) => state.deleteBooking);
  const updateBooking = useTravelStore((state) => state.updateBooking);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // 編集用の state
  const [isEditing, setIsEditing] = useState(false);
  const [editCategory, setEditCategory] = useState(booking.category);
  const [editProvider, setEditProvider] = useState(booking.provider);
  const [editReference, setEditReference] = useState(booking.reference);
  const [editDetails, setEditDetails] = useState(booking.details);
  const [editLink, setEditLink] = useState(booking.link || '');
  const [editIcon, setEditIcon] = useState<IconType>(booking.icon);
  const [editTicketNumber, setEditTicketNumber] = useState(booking.ticketNumber || '');
  const [editSeatNumber, setEditSeatNumber] = useState(booking.seatNumber || '');
  const [editDate, setEditDate] = useState(booking.date || '');

  useEffect(() => {
    if (booking.imageKey) {
      get(booking.imageKey).then((data) => {
        if (data) setImageUrl(data as string);
      });
    }
  }, [booking.imageKey]);

  useEffect(() => {
    setEditCategory(booking.category);
    setEditProvider(booking.provider);
    setEditReference(booking.reference);
    setEditDetails(booking.details);
    setEditLink(booking.link || '');
    setEditIcon(booking.icon);
    setEditTicketNumber(booking.ticketNumber || '');
    setEditSeatNumber(booking.seatNumber || '');
    setEditDate(booking.date || '');
  }, [booking]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`コピーしました: ${text}`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const key = `booking-img-${booking.id}-${Date.now()}`;
      await set(key, base64String);
      updateBookingImage(booking.id, key);
      setImageUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory.trim() || !editProvider.trim()) return;
    updateBooking(booking.id, {
      category: editCategory,
      provider: editProvider,
      reference: editReference,
      details: editDetails,
      link: editLink || undefined,
      icon: editIcon,
      ticketNumber: editTicketNumber || undefined,
      seatNumber: editSeatNumber || undefined,
      date: editDate || undefined
    });
    setIsEditing(false);
  };

  const Icon = getIcon(booking.icon);

  return (
    <>
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        {isEditing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-800 text-sm">予約情報を編集</h4>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">種類（例: 飛行機、ホテル、レンタカー、ツアー）</div>
              <input type="text" className="input-field" style={{ marginBottom: 0, fontSize: '0.875rem' }} value={editCategory} onChange={e => setEditCategory(e.target.value)} required />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">日付（任意）</div>
              <input type="date" className="input-field" style={{ marginBottom: 0, fontSize: '0.875rem' }} value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <div style={{ flex: '0 0 120px' }}>
                <div className="text-xs font-bold text-slate-700 mb-1">アイコン</div>
                <select 
                  value={editIcon} 
                  onChange={e => setEditIcon(e.target.value as IconType)}
                  style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white', fontSize: '0.875rem' }}
                >
                  <option value="plane">飛行機</option>
                  <option value="car">レンタカー</option>
                  <option value="home">一軒家・民宿</option>
                  <option value="building">ホテル</option>
                  <option value="ticket">チケット</option>
                  <option value="map-pin">スポット</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-xs font-bold text-slate-700 mb-1">会社名や便名・施設名</div>
                <input type="text" className="input-field" style={{ marginBottom: 0, fontSize: '0.875rem' }} value={editProvider} onChange={e => setEditProvider(e.target.value)} required />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">
                {editIcon === 'plane' ? '予約番号' : '予約番号・コード'}
              </div>
              <input type="text" className="input-field" style={{ marginBottom: 0, fontSize: '0.875rem' }} value={editReference} onChange={e => setEditReference(e.target.value)} />
            </div>
            {editIcon === 'plane' && (
              <div className="flex gap-2">
                <div style={{ flex: 1 }}>
                  <div className="text-xs font-bold text-slate-700 mb-1">航空券番号</div>
                  <input type="text" placeholder="例: 2051234567890" className="input-field" style={{ marginBottom: 0, fontSize: '0.875rem' }} value={editTicketNumber} onChange={e => setEditTicketNumber(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-xs font-bold text-slate-700 mb-1">座席番号</div>
                  <input type="text" placeholder="例: 15A" className="input-field" style={{ marginBottom: 0, fontSize: '0.875rem' }} value={editSeatNumber} onChange={e => setEditSeatNumber(e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">詳細内容・メモ</div>
              <textarea className="input-field" style={{ marginBottom: 0, fontSize: '0.875rem', minHeight: '60px' }} value={editDetails} onChange={e => setEditDetails(e.target.value)} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">予約確認ページのURL</div>
              <input type="url" className="input-field" style={{ marginBottom: 0, fontSize: '0.875rem' }} value={editLink} onChange={e => setEditLink(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1 py-1.5 text-xs">保存</button>
              <button type="button" className="btn-secondary flex-1 py-1.5 text-xs" onClick={() => setIsEditing(false)}>キャンセル</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon size={20} color={booking.color} />
                <span style={{ fontWeight: 600 }}>{booking.category}</span>
                {booking.date && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                    {booking.date}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1" style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.875rem', cursor: 'pointer' }}>
                  編集
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(`${booking.provider} の予約を削除してもよろしいですか？`)) {
                      deleteBooking(booking.id);
                    }
                  }} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {booking.provider}
            </div>
            {booking.details && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                {booking.details}
              </div>
            )}
            
            {booking.icon === 'plane' && (booking.reference || booking.ticketNumber || booking.seatNumber) ? (
              <div className="flex flex-col gap-2 mb-4">
                {booking.reference && (
                  <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.6rem 0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex-1">
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>予約番号</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>{booking.reference}</div>
                    </div>
                    <button onClick={() => handleCopy(booking.reference || '')} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.4rem', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <Copy size={14} />
                    </button>
                  </div>
                )}
                {booking.ticketNumber && (
                  <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.6rem 0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex-1">
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>航空券番号</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>{booking.ticketNumber}</div>
                    </div>
                    <button onClick={() => handleCopy(booking.ticketNumber || '')} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.4rem', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <Copy size={14} />
                    </button>
                  </div>
                )}
                {booking.seatNumber && (
                  <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.6rem 0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex-1">
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>座席番号</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>{booking.seatNumber}</div>
                    </div>
                    <button onClick={() => handleCopy(booking.seatNumber || '')} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.4rem', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <Copy size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              booking.reference && (
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="flex-1">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>予約番号・コード</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '1px', wordBreak: 'break-all' }}>{booking.reference}</div>
                  </div>
                  <button onClick={() => handleCopy(booking.reference)} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <Copy size={16} />
                  </button>
                </div>
              )
            )}

            {booking.link && (
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                <a href={booking.link} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <ExternalLink size={16} /> デジタルチケットを開く
                </a>
              </div>
            )}

            {/* Image / Screenshot Section */}
            {imageUrl ? (
              <div style={{ marginTop: '1rem' }}>
                <button 
                  onClick={() => setShowQR(true)} 
                  className="btn-primary" 
                  style={{ width: '100%', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                >
                  <Ticket size={18} /> QRコードを表示して使う
                </button>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
                  <img src={imageUrl} alt="予約の画像" style={{ width: '100%', height: '120px', objectFit: 'cover', opacity: 0.6, display: 'block' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>画像プレビュー</span>
                  </div>
                </div>
                <label style={{ display: 'block', padding: '0.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.03)', cursor: 'pointer', fontSize: '0.875rem', borderRadius: '0 0 8px 8px' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  画像を変更する
                </label>
              </div>
            ) : (
              <label className="glass-card flex items-center justify-center gap-2" style={{ width: '100%', cursor: 'pointer', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', border: '1px dashed var(--accent-glow)' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                <Upload size={16} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>QRスクショを追加</span>
              </label>
            )}
          </>
        )}
      </div>

      {/* QR Code Full Screen Modal */}
      {showQR && imageUrl && (
        <div 
          onClick={() => setShowQR(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: '#FFFFFF', // Pure white to maximize brightness
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
          }}
        >
          <button 
            onClick={() => setShowQR(false)}
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: '#F3F4F6', border: 'none', borderRadius: '50%',
              width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#374151', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <X size={24} />
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>{booking.provider}</h3>
            <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>{booking.category}</p>
          </div>

          <div style={{ 
            width: '100%', maxWidth: '400px', 
            background: 'white', padding: '1rem',
            borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
          }}>
            <img 
              src={imageUrl} 
              alt="QR Code" 
              style={{ 
                width: '100%', height: 'auto', display: 'block',
                filter: 'contrast(1.2) brightness(1.05)' // Boost contrast for easier scanning
              }} 
            />
          </div>
          
          <p style={{ marginTop: '2rem', color: '#6B7280', fontSize: '0.875rem', textAlign: 'center' }}>
            読み取りやすいよう画面を<br/>明るくして表示しています
          </p>
        </div>
      )}
    </>
  );
};

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr === '未定') return '日程未定';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}月${date.getDate()}日 (${weekdays[date.getDay()]})`;
  } catch (e) {
    return dateStr;
  }
};

export default function Bookings() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const addBooking = useTravelStore((state) => state.addBooking);

  const [isAdding, setIsAdding] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newIcon, setNewIcon] = useState<IconType>('ticket');
  const [newTicketNumber, setNewTicketNumber] = useState('');
  const [newSeatNumber, setNewSeatNumber] = useState('');
  const [newDate, setNewDate] = useState('');

  const [expandedIcons, setExpandedIcons] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleIcon = (iconKey: string) => {
    setExpandedIcons(prev => ({
      ...prev,
      [iconKey]: !prev[iconKey]
    }));
  };

  const toggleDate = (iconKey: string, dateKey: string) => {
    const key = `${iconKey}-${dateKey}`;
    setExpandedDates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!selectedTrip) {
    return <Navigate to="/" replace />;
  }

  const bookings = selectedTrip.bookings;

  // アイコンの種類名マッピング
  const iconLabels: Record<IconType, string> = {
    plane: '飛行機',
    car: 'レンタカー',
    home: '一軒家・民宿',
    building: 'ホテル',
    ticket: 'チケット',
    'map-pin': 'スポット'
  };

  // icon ごと、さらに date ごとにグループ化
  const groupedBookings = bookings.reduce((acc, booking) => {
    const iconKey = booking.icon || 'ticket';
    const dateKey = booking.date || '未定';
    if (!acc[iconKey]) {
      acc[iconKey] = {};
    }
    if (!acc[iconKey][dateKey]) {
      acc[iconKey][dateKey] = [];
    }
    acc[iconKey][dateKey].push(booking);
    return acc;
  }, {} as Record<IconType, Record<string, Booking[]>>);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat || !newProvider) return;
    addBooking({
      category: newCat,
      provider: newProvider,
      reference: newRef,
      link: newLink,
      details: newDetails || '手動追加',
      icon: newIcon,
      color: '#3b82f6',
      ticketNumber: newIcon === 'plane' ? newTicketNumber : undefined,
      seatNumber: newIcon === 'plane' ? newSeatNumber : undefined,
      date: newDate || undefined
    });
    setExpandedIcons(prev => ({
      ...prev,
      [newIcon]: true
    }));
    if (newDate) {
      setExpandedDates(prev => ({
        ...prev,
        [`${newIcon}-${newDate}`]: true
      }));
    } else {
      setExpandedDates(prev => ({
        ...prev,
        [`${newIcon}-未定`]: true
      }));
    }
    setIsAdding(false);
    setNewCat('');
    setNewProvider('');
    setNewRef('');
    setNewLink('');
    setNewDetails('');
    setNewIcon('ticket');
    setNewTicketNumber('');
    setNewSeatNumber('');
    setNewDate('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="title">予約・チケット</h2>
          <p className="subtitle">すべての予約をここに</p>
        </div>
        <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => setIsAdding(true)}>
          <Plus size={16} /> 追加
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-panel mb-6 p-4">
          <div className="border-b border-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-slate-800">新しい予約を追加</h3>
            <p className="text-xs text-slate-500 mt-1">
              飛行機、ホテル、レンタカーなどの予約情報を登録しておくと、当日スムーズに確認できます。
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">種類（必須）</div>
              <input type="text" placeholder="例: 飛行機、ホテル、レンタカー、ツアー" className="input-field" style={{ marginBottom: 0 }} value={newCat} onChange={e => setNewCat(e.target.value)} required autoFocus />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">日付（任意）</div>
              <input type="date" className="input-field" style={{ marginBottom: 0 }} value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <div style={{ flex: '0 0 140px' }}>
                <div className="text-xs font-bold text-slate-700 mb-1">アイコン</div>
                <select 
                  value={newIcon} 
                  onChange={e => setNewIcon(e.target.value as IconType)}
                  style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white' }}
                >
                  <option value="plane">飛行機</option>
                  <option value="car">レンタカー</option>
                  <option value="home">一軒家・民宿</option>
                  <option value="building">ホテル</option>
                  <option value="ticket">チケット</option>
                  <option value="map-pin">スポット</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-xs font-bold text-slate-700 mb-1">会社名や便名・施設名（必須）</div>
                <input type="text" placeholder="例: ANA 051便、〇〇ホテル" className="input-field" style={{ marginBottom: 0 }} value={newProvider} onChange={e => setNewProvider(e.target.value)} required />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">
                {newIcon === 'plane' ? '予約番号' : '予約番号（あると便利！）'}
              </div>
              <input type="text" placeholder="例: AB123456" className="input-field" style={{ marginBottom: 0 }} value={newRef} onChange={e => setNewRef(e.target.value)} />
            </div>
            {newIcon === 'plane' && (
              <div className="flex gap-2">
                <div style={{ flex: 1 }}>
                  <div className="text-xs font-bold text-slate-700 mb-1">航空券番号</div>
                  <input type="text" placeholder="例: 2051234567890" className="input-field" style={{ marginBottom: 0 }} value={newTicketNumber} onChange={e => setNewTicketNumber(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-xs font-bold text-slate-700 mb-1">座席番号</div>
                  <input type="text" placeholder="例: 15A" className="input-field" style={{ marginBottom: 0 }} value={newSeatNumber} onChange={e => setNewSeatNumber(e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">詳細内容・メモ（任意）</div>
              <textarea placeholder="例: チェックイン15:00、朝食付き、ファミリールーム" className="input-field" style={{ marginBottom: 0, minHeight: '60px' }} value={newDetails} onChange={e => setNewDetails(e.target.value)} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">予約確認ページのURL（任意）</div>
              <input type="url" placeholder="例: https://..." className="input-field" style={{ marginBottom: 0 }} value={newLink} onChange={e => setNewLink(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary flex-1">保存する</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setIsAdding(false)}>キャンセル</button>
            </div>
          </div>
        </form>
      )}
      
      <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
        {bookings.length > 0 ? (
          Object.entries(groupedBookings).map(([iconKey, dateGroup]) => {
            const isOpen = expandedIcons[iconKey];
            const IconComponent = getIcon(iconKey as IconType);
            const label = iconLabels[iconKey as IconType] || 'その他';
            
            // アイコン配下のすべての予約件数
            const totalCount = Object.values(dateGroup).reduce((sum, list) => sum + list.length, 0);
            const color = Object.values(dateGroup)[0]?.[0]?.color || '#3b82f6';

            // 日付をソート（日付順、未定は最後に）
            const sortedDates = Object.keys(dateGroup).sort((a, b) => {
              if (a === '未定') return 1;
              if (b === '未定') return -1;
              return a.localeCompare(b);
            });

            return (
              <div key={iconKey} className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
                <button
                  onClick={() => toggleIcon(iconKey)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    width: '100%',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div style={{
                      background: `${color}15`,
                      color: color,
                      padding: '0.5rem',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{label}</span>
                      <span className="text-xs text-slate-400 ml-2">({totalCount}件)</span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-3 border-t border-slate-100/80 bg-slate-50/30 flex flex-col gap-2">
                    {sortedDates.map((dateKey) => {
                      const dateBookings = dateGroup[dateKey];
                      const dateAccordionKey = `${iconKey}-${dateKey}`;
                      const isDateOpen = !!expandedDates[dateAccordionKey];
                      
                      return (
                        <div key={dateKey} className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
                          <button
                            onClick={() => toggleDate(iconKey, dateKey)}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-100/50 transition-colors"
                            style={{
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              outline: 'none',
                              display: 'flex',
                              width: '100%',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {formatDate(dateKey)}
                              </span>
                              <span className="text-xs text-slate-400">({dateBookings.length}件)</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                              {isDateOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </button>

                          {isDateOpen && (
                            <div className="p-3 border-t border-slate-100/50 bg-white/20 flex flex-col gap-3">
                              {dateBookings.map((booking) => (
                                <BookingCard key={booking.id} booking={booking} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          !isAdding && (
            <div className="glass-panel p-6 text-center text-slate-500">
              <Ticket size={40} className="mx-auto mb-3 opacity-30 text-indigo-500" />
              <p className="font-bold text-slate-700 mb-1">予約情報がありません</p>
              <p className="text-sm">
                上の「追加」ボタンから、飛行機やホテルの予約情報を登録しましょう。<br />
                QRコードやスクショを保存しておくと、当日ネットが繋がらなくても安心です！
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
