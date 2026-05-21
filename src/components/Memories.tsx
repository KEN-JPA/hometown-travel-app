import React, { useState, useEffect } from 'react';
import { useTravelStore } from '../store';
import { Image as ImageIcon, Upload, Camera } from 'lucide-react';
import { set, get, del } from 'idb-keyval';

export default function Memories() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  
  const addMemory = useTravelStore((state) => state.addMemory);
  const updateMemory = useTravelStore((state) => state.updateMemory);
  const deleteMemory = useTravelStore((state) => state.deleteMemory);

  const [images, setImages] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');

  useEffect(() => {
    if (!selectedTrip) return;
    const loadImages = async () => {
      const loaded: Record<string, string> = {};
      for (const mem of selectedTrip.memories || []) {
        if (mem.imageKey) {
          const data = await get(mem.imageKey);
          if (data) loaded[mem.id] = data as string;
        }
      }
      setImages(loaded);
    };
    loadImages();
  }, [selectedTrip]);

  if (!selectedTrip) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>旅行を選択してください</div>;
  }

  const memories = selectedTrip.memories || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const memId = Math.random().toString(36).substring(2, 9);
      const key = `memory-${memId}`;
      
      await set(key, base64String);
      
      // Prompt for caption optionally, but let's keep it simple and just add it
      addMemory({
        imageKey: key,
        caption: file.name
      });
      
      setImages(prev => ({ ...prev, [memId]: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string, key: string) => {
    if (confirm('この写真を削除しますか？')) {
      await del(key);
      deleteMemory(id);
      setImages(prev => {
        const newImgs = { ...prev };
        delete newImgs[id];
        return newImgs;
      });
    }
  };

  const startEditing = (mem: any) => {
    setEditingId(mem.id);
    setEditCaption(mem.caption || '');
    setEditDate(mem.date || '');
    setEditLocation(mem.location || '');
  };

  const saveEdit = (id: string) => {
    updateMemory(id, { caption: editCaption, date: editDate, location: editLocation });
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="title flex items-center gap-2"><Camera size={24} color="var(--accent-color)" /> 思い出・写真</h2>
          <p className="subtitle">旅行の記録を残そう</p>
        </div>
      </div>

      <label className="glass-panel flex flex-col items-center justify-center mb-8" style={{ padding: '2rem', cursor: 'pointer', border: '2px dashed var(--accent-color)', background: 'rgba(255, 140, 148, 0.05)' }}>
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
        <div style={{ background: 'var(--accent-color)', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 4px 12px var(--accent-glow)' }}>
          <Upload size={24} />
        </div>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>写真をアップロード</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
          旅行中の楽しかった思い出や、<br/>
          美味しかったご飯の写真を残しましょう！
        </span>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {memories.map(mem => (
          <div key={mem.id} className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: '120px', height: '120px' }}>
              {images[mem.id] ? (
                <img 
                  src={images[mem.id]} 
                  alt={mem.caption} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} 
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--glass-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={24} color="var(--text-secondary)" />
                </div>
              )}
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingId === mem.id ? (
                <div className="flex flex-col gap-2">
                  <input type="text" value={editCaption} onChange={(e) => setEditCaption(e.target.value)} placeholder="キャプション" className="input-field mb-0 text-sm py-1" />
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input-field mb-0 text-sm py-1" />
                  <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="場所" className="input-field mb-0 text-sm py-1" />
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => saveEdit(mem.id)} className="btn-primary py-1 px-3 text-xs">保存</button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary py-1 px-3 text-xs">キャンセル</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{mem.caption || 'タイトルなし'}</h3>
                    {mem.date && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{mem.date}</p>}
                    {mem.location && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>📍 {mem.location}</p>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => startEditing(mem)} className="btn-secondary py-1 px-3 text-xs" style={{ background: 'var(--glass-bg)' }}>編集</button>
                    <button onClick={() => handleDelete(mem.id, mem.imageKey)} className="btn-secondary py-1 px-3 text-xs" style={{ color: 'var(--danger)', background: 'var(--glass-bg)' }}>削除</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {memories.length === 0 && (
        <div className="glass-panel p-6 text-center text-slate-500 mt-6">
          <ImageIcon size={40} className="mx-auto mb-3 opacity-30 text-indigo-500" />
          <p className="font-bold text-slate-700 mb-1">まだ写真がありません</p>
          <p className="text-sm">
            上のボタンから、旅行の思い出を保存できます。<br />
            航空券の半券や、旅先の風景、家族の写真などを追加して、オリジナルのアルバムを作りましょう！
          </p>
        </div>
      )}
    </div>
  );
}
