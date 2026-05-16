import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Ticket, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useTravelStore, type Booking } from '../store';
import { get } from 'idb-keyval';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  bookingData?: Booking;
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'こんにちは！TRIP BASE AIアシスタントです。「チケットを出して」「今日の予定は？」など、何でも聞いてください。' }
  ]);
  const [context, setContext] = useState<string | null>(null);
  
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const newUserMsg: Message = { id: Math.random().toString(), sender: 'user', text: userText };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');

    // Simulate AI thinking and logic
    setTimeout(() => {
      processCommand(userText);
    }, 600);
  };

  const processCommand = (text: string) => {
    if (!selectedTrip) {
      reply('旅行計画が選択されていません。まずはホーム画面から旅行を選択してください。');
      return;
    }

    const lower = text.toLowerCase();

    // Context handling
    if (context === 'WAITING_TICKET_TYPE') {
      searchTicket(text);
      setContext(null);
      return;
    }

    if (lower.includes('チケット') && (lower.includes('出して') || lower.includes('見せて') || lower.includes('どこ'))) {
      if (lower.includes('飛行機') || lower.includes('航空券')) {
        searchTicket('飛行機');
      } else if (lower.includes('ホテル') || lower.includes('宿')) {
        searchTicket('ホテル');
      } else if (lower.includes('野球') || lower.includes('スポーツ')) {
        searchTicket('野球');
      } else {
        reply('何のチケットですか？（例：航空券、ホテル、レンタカー、野球 など）');
        setContext('WAITING_TICKET_TYPE');
      }
      return;
    }

    if (lower.includes('チケット')) {
       reply('何のチケットですか？（例：航空券、ホテル、野球 など）');
       setContext('WAITING_TICKET_TYPE');
       return;
    }

    reply('すみません、まだその質問には答えられません。「飛行機のチケット出して」のようにチケットを探す機能をお試しください！');
  };

  const searchTicket = (keyword: string) => {
    if (!selectedTrip) return;
    
    const bookings = selectedTrip.bookings || [];
    const match = bookings.find(b => 
      b.category.includes(keyword) || 
      b.provider.includes(keyword) || 
      b.details.includes(keyword)
    );

    if (match) {
      reply(`「${match.category}」のチケットを見つけました！こちらです：`, match);
    } else {
      reply(`すみません、「${keyword}」に関するチケットは見つかりませんでした。`);
    }
  };

  const reply = (text: string, bookingData?: Booking) => {
    const newBotMsg: Message = { id: Math.random().toString(), sender: 'bot', text, bookingData };
    setMessages(prev => [...prev, newBotMsg]);
  };

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '80px', right: '20px', zIndex: 1000,
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--accent-color)', color: 'white',
            border: 'none', boxShadow: '0 4px 16px var(--accent-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'transform 0.2s'
          }}
          className="hover:scale-110"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '20px', zIndex: 1000,
          width: 'calc(100vw - 40px)', maxWidth: '380px', height: '500px', maxHeight: '70vh',
          background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '2px solid var(--glass-border)', borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '1rem', background: 'var(--accent-color)', color: 'white', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}>
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span style={{ fontWeight: 700, fontFamily: 'M PLUS Rounded 1c' }}>AI アシスタント</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '0.75rem 1rem', borderRadius: '16px',
                  background: msg.sender === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.8)',
                  color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                  border: msg.sender === 'bot' ? '1px solid var(--glass-border)' : 'none',
                  fontSize: '0.9rem', lineHeight: '1.4'
                }}>
                  {msg.text}
                </div>
                
                {/* Rich UI for Booking Data */}
                {msg.bookingData && (
                  <div style={{ marginTop: '0.5rem', width: '100%', maxWidth: '280px' }}>
                    <MiniBookingCard booking={msg.bookingData} />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '0.75rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.5)' }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="何を聞きたいですか？"
              style={{ 
                flex: 1, padding: '0.75rem 1rem', borderRadius: '99px', 
                border: '1px solid var(--glass-border)', outline: 'none',
                background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)'
              }}
            />
            <button type="submit" style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'var(--accent-color)', color: 'white', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <Send size={18} style={{ transform: 'translateX(-1px) translateY(1px)' }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// Mini version of BookingCard for the chat UI
function MiniBookingCard({ booking }: { booking: Booking }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (booking.imageKey) {
      get(booking.imageKey).then((data) => {
        if (data) setImageUrl(data as string);
      });
    }
  }, [booking.imageKey]);

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Ticket size={16} color={booking.color} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{booking.provider}</span>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
        {booking.details}
      </div>
      
      {booking.reference && (
        <div style={{ background: 'var(--bg-gradient-start)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '1px' }}>
          {booking.reference}
        </div>
      )}

      {booking.link && (
        <a href={booking.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--accent-color)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <ExternalLink size={14} /> デジタルチケット
        </a>
      )}

      {imageUrl && (
        <div style={{ borderRadius: '8px', overflow: 'hidden', marginTop: '0.5rem', border: '1px solid var(--glass-border)' }}>
          <img src={imageUrl} alt="予約画像" style={{ width: '100%', display: 'block' }} />
        </div>
      )}
      {!imageUrl && !booking.link && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          <ImageIcon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          画像・リンク未登録
        </div>
      )}
    </div>
  );
}
