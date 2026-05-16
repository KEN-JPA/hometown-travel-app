import React, { useState, useEffect } from 'react';
import { Plane, Car, Building2, Ticket, Copy, ExternalLink, MapPin, Home, Upload, X, Plus } from 'lucide-react';
import { useTravelStore, type IconType, type Booking } from '../store';
import { set, get } from 'idb-keyval';

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (booking.imageKey) {
      get(booking.imageKey).then((data) => {
        if (data) setImageUrl(data as string);
      });
    }
  }, [booking.imageKey]);

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
      const key = `booking-img-${booking.id}`;
      await set(key, base64String);
      updateBookingImage(booking.id, key);
      setImageUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const deleteBooking = useTravelStore((state) => state.deleteBooking);
  const Icon = getIcon(booking.icon);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={20} color={booking.color} />
          <span style={{ fontWeight: 600 }}>{booking.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1" style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.875rem', cursor: 'pointer' }}>
            詳細 <ExternalLink size={14} />
          </button>
          <button onClick={() => deleteBooking(booking.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        {booking.provider}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        {booking.details}
      </div>
      
      <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>予約番号</div>
          <div style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '1px' }}>{booking.reference}</div>
        </div>
        <button onClick={() => handleCopy(booking.reference)} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <Copy size={16} />
        </button>
      </div>

        {booking.link && (
          <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <a href={booking.link} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ width: '100%', textDecoration: 'none' }}>
              <ExternalLink size={16} /> デジタルチケットを開く
            </a>
          </div>
        )}

      {/* Image / Screenshot Section */}
      {imageUrl ? (
        <div style={{ marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          <img src={imageUrl} alt="予約の画像" style={{ width: '100%', height: 'auto', display: 'block' }} />
          <label style={{ display: 'block', padding: '0.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            画像を変更する
          </label>
        </div>
      ) : (
        <label className="glass-card flex items-center justify-center gap-2" style={{ width: '100%', cursor: 'pointer', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', border: '1px dashed var(--accent-glow)' }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          <Upload size={16} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>スクショ・画像を保存</span>
        </label>
      )}
    </div>
  );
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

  if (!selectedTrip) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>旅行を選択してください</div>;
  }

  const bookings = selectedTrip.bookings;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat || !newProvider) return;
    addBooking({
      category: newCat,
      provider: newProvider,
      reference: newRef,
      link: newLink,
      details: '手動追加',
      icon: 'ticket',
      color: '#3b82f6'
    });
    setIsAdding(false);
    setNewCat('');
    setNewProvider('');
    setNewRef('');
    setNewLink('');
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
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="カテゴリ (例: 飛行機)" className="input-field" value={newCat} onChange={e => setNewCat(e.target.value)} required />
            <input type="text" placeholder="会社名・便名 (例: ANA 051便)" className="input-field" value={newProvider} onChange={e => setNewProvider(e.target.value)} required />
            <input type="text" placeholder="予約番号" className="input-field" value={newRef} onChange={e => setNewRef(e.target.value)} />
            <input type="url" placeholder="チケットURL (任意)" className="input-field" value={newLink} onChange={e => setNewLink(e.target.value)} />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">保存</button>
              <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>キャンセル</button>
            </div>
          </div>
        </form>
      )}
      
      <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
}
