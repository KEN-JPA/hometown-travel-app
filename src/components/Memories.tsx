import React, { useState, useEffect } from 'react';
import { useTravelStore } from '../store';
import { Image as ImageIcon, Upload, Trash2, Camera } from 'lucide-react';
import { set, get, del } from 'idb-keyval';

export default function Memories() {
  const trips = useTravelStore((state) => state.trips);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  
  const addMemory = useTravelStore((state) => state.addMemory);
  const deleteMemory = useTravelStore((state) => state.deleteMemory);

  const [images, setImages] = useState<Record<string, string>>({});

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
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>スマホのカメラロールから選べます</span>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
        {memories.map(mem => (
          <div key={mem.id} className="glass-card" style={{ padding: '0.5rem', position: 'relative', overflow: 'hidden' }}>
            {images[mem.id] ? (
              <img 
                src={images[mem.id]} 
                alt={mem.caption} 
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px' }} 
              />
            ) : (
              <div style={{ width: '100%', height: '150px', background: 'var(--glass-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={24} color="var(--text-secondary)" />
              </div>
            )}
            <button 
              onClick={() => handleDelete(mem.id, mem.imageKey)}
              style={{ 
                position: 'absolute', top: '0.75rem', right: '0.75rem', 
                background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', 
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--danger)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      
      {memories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          まだ写真がありません。
        </div>
      )}
    </div>
  );
}
