import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Ticket, Wallet, Package, Gift, CalendarClock } from 'lucide-react';
import { useTravelStore } from '../store';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: 'Itinerary' | 'Booking' | 'Expense' | 'Packing' | 'Shopping' | 'Task' | 'Wishlist';
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ReactNode;
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const trips = useTravelStore(state => state.trips);
  const selectedTripId = useTravelStore(state => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim() || !selectedTrip) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const newResults: SearchResult[] = [];

    // 1. Itinerary (Schedules)
    selectedTrip.itineraryCategories.forEach(cat => {
      cat.schedules.forEach(day => {
        day.events.forEach(event => {
          if (event.title.toLowerCase().includes(lowerQuery) || event.location.toLowerCase().includes(lowerQuery)) {
            newResults.push({
              type: 'Itinerary', id: event.id, title: event.title, subtitle: `${day.date} - ${event.time} @ ${event.location}`, path: '/itinerary', icon: <MapPin size={16} />
            });
          }
        });
      });
    });

    // 2. Bookings
    selectedTrip.bookings.forEach(b => {
      if (b.category.toLowerCase().includes(lowerQuery) || b.provider.toLowerCase().includes(lowerQuery) || b.reference.toLowerCase().includes(lowerQuery)) {
        newResults.push({
          type: 'Booking', id: b.id, title: `${b.category}: ${b.provider}`, subtitle: `予約番号: ${b.reference}`, path: '/bookings', icon: <Ticket size={16} />
        });
      }
    });

    // 3. Expenses
    selectedTrip.expenses.forEach(e => {
      if (e.category.toLowerCase().includes(lowerQuery)) {
        newResults.push({
          type: 'Expense', id: e.id, title: e.category, subtitle: `¥${e.amount.toLocaleString()}`, path: '/budget', icon: <Wallet size={16} />
        });
      }
    });

    // 4. Packing
    selectedTrip.packingList?.forEach(p => {
      if (p.name.toLowerCase().includes(lowerQuery)) {
        newResults.push({
          type: 'Packing', id: p.id, title: p.name, subtitle: `担当: ${p.assignee || '未設定'}`, path: '/packing', icon: <Package size={16} />
        });
      }
    });

    // 5. Shopping
    selectedTrip.shoppingList?.forEach(s => {
      if (s.name.toLowerCase().includes(lowerQuery) || (s.recipient && s.recipient.toLowerCase().includes(lowerQuery))) {
        newResults.push({
          type: 'Shopping', id: s.id, title: s.name, subtitle: `渡す人: ${s.recipient || '未設定'}`, path: '/shopping', icon: <Gift size={16} />
        });
      }
    });

    // 6. Tasks
    selectedTrip.preparationTasks?.forEach(t => {
      if (t.title.toLowerCase().includes(lowerQuery) || t.notes.toLowerCase().includes(lowerQuery)) {
        newResults.push({
          type: 'Task', id: t.id, title: t.title, subtitle: t.category, path: '/preparation', icon: <CalendarClock size={16} />
        });
      }
    });

    // 7. Wishlist
    selectedTrip.wishlist?.forEach(w => {
      if (w.name.toLowerCase().includes(lowerQuery)) {
        newResults.push({
          type: 'Wishlist', id: w.id, title: w.name, path: '/', icon: <MapPin size={16} />
        });
      }
    });

    setResults(newResults);
  }, [query, selectedTrip]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, padding: '1rem', alignItems: 'flex-start' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ marginTop: '2rem', padding: '1rem' }}>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <Search size={20} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none outline-none text-lg"
            placeholder="予定、持ち物、予約番号などを検索..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-slate-400 p-1"><X size={20} /></button>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {query.trim() === '' ? (
            <div className="text-center text-slate-400 py-8 text-sm">
              検索キーワードを入力してください
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-2">
              {results.map((res, i) => (
                <div 
                  key={`${res.type}-${res.id}-${i}`} 
                  className="p-3 rounded-lg flex items-center gap-3 cursor-pointer"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                  onClick={() => handleSelect(res.path)}
                >
                  <div style={{ color: 'var(--accent-color)' }}>
                    {res.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-800">{res.title}</div>
                    {res.subtitle && <div className="text-xs text-slate-500 mt-0.5">{res.subtitle}</div>}
                  </div>
                  <div className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">
                    {res.type}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8 text-sm">
              「{query}」に一致する情報は見つかりませんでした。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
