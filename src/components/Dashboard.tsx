import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, X, GripVertical, Download, Upload, Settings, Trash2, Pencil, Check } from 'lucide-react';
import { useTravelStore } from '../store';
import { get, set, del } from 'idb-keyval';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DRIVE_BACKUP_FILE_NAME = 'TRIP_BASE_BACKUP.json';

const createDriveArchiveName = (label: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `TRIP_BASE_BACKUP_ARCHIVE_${timestamp}_${label}.json`;
};

const createDriveJsonFile = async (token: string, name: string, body: string) => {
  const createMetaRes = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/json'
      })
    }
  );
  if (!createMetaRes.ok) throw new Error('Failed to create Google Drive backup metadata');
  const fileMeta = await createMetaRes.json();
  const fileId = fileMeta.id;

  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body
    }
  );
  if (!uploadRes.ok) throw new Error('Failed to upload Google Drive backup archive');

  return fileId;
};

const archiveDrivePayload = async (token: string, body: string, label: string) => {
  return createDriveJsonFile(token, createDriveArchiveName(label), body);
};

const archiveExistingDriveBackup = async (token: string, fileId: string) => {
  const downloadRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!downloadRes.ok) throw new Error('Failed to download existing Google Drive backup for archive');
  const existingBackup = await downloadRes.text();
  await archiveDrivePayload(token, existingBackup, 'before-overwrite');
};

const renderWishlistText = (name: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const lines = name.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  return lines.map((line, lineIndex) => {
    const parts = line.split(urlRegex);
    return (
      <div
        key={`${line}-${lineIndex}`}
        style={{
          fontWeight: lineIndex === 0 ? 700 : 500,
          marginTop: lineIndex === 0 ? 0 : '0.35rem',
          lineHeight: 1.45,
        }}
      >
        {parts.map((part, partIndex) => (
          part.match(urlRegex) ? (
            <a
              key={`${part}-${partIndex}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-color)', textDecoration: 'underline', wordBreak: 'break-all' }}
              onClick={event => event.stopPropagation()}
            >
              {part}
            </a>
          ) : (
            <span key={`${part}-${partIndex}`}>{part}</span>
          )
        ))}
      </div>
    );
  });
};

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
      style={{ ...style, cursor: 'pointer' }} 
      className="glass-card" 
      onClick={() => onSelect(trip.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            {...attributes} 
            {...listeners} 
            style={{ color: 'var(--text-secondary)', cursor: 'grab', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
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
  const deletedTrips = useTravelStore((state) => state.deletedTrips || []);
  const selectedTripId = useTravelStore((state) => state.selectedTripId);
  const selectTrip = useTravelStore((state) => state.selectTrip);
  const addTrip = useTravelStore((state) => state.addTrip);
  const updateTrip = useTravelStore((state) => state.updateTrip);
  const deleteTrip = useTravelStore((state) => state.deleteTrip);
  const restoreTrip = useTravelStore((state) => state.restoreTrip);
  const permanentlyDeleteTrip = useTravelStore((state) => state.permanentlyDeleteTrip);
  const reorderTrips = useTravelStore((state) => state.reorderTrips);
  const addWishlistItem = useTravelStore((state) => state.addWishlistItem);
  const updateWishlistItem = useTravelStore((state) => state.updateWishlistItem);
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
  const [googleClientId, setGoogleClientId] = useState(localStorage.getItem('google_drive_client_id') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<'local' | 'google'>('local');
  const [editingWishlistId, setEditingWishlistId] = useState<string | null>(null);
  const [editingWishlistName, setEditingWishlistName] = useState('');

  const startWishlistEdit = (item: { id: string; name: string }) => {
    setEditingWishlistId(item.id);
    setEditingWishlistName(item.name);
  };

  const saveWishlistEdit = () => {
    if (!editingWishlistId || !editingWishlistName.trim()) return;
    updateWishlistItem(editingWishlistId, editingWishlistName.trim());
    setEditingWishlistId(null);
    setEditingWishlistName('');
  };

  const cancelWishlistEdit = () => {
    setEditingWishlistId(null);
    setEditingWishlistName('');
  };

  const handleGoogleDriveSync = () => {
    const cleanClientId = googleClientId.trim();
    if (!cleanClientId) {
      alert('Google API クライアントIDを設定してください。');
      return;
    }
    
    if (typeof (window as any).google === 'undefined') {
      alert('Google APIのロードに失敗しました。ページをリロードしてもう一度お試しください。');
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: cleanClientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.error) {
            console.error('OAuth Error:', response);
            alert('ログインに失敗しました: ' + response.error);
            return;
          }

          setIsSyncing(true);
          try {
            const accessToken = response.access_token;
            setDriveToken(accessToken);
            await performDriveSync(accessToken);
          } finally {
            setIsSyncing(false);
          }
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      console.error(err);
      alert('同期処理の開始に失敗しました: ' + err.message);
    }
  };

  const performDriveSync = async (token: string) => {
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_BACKUP_FILE_NAME}' and trashed=false&fields=files(id,name,modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!searchRes.ok) throw new Error('ドライブの検索に失敗しました');
      const searchData = await searchRes.json();
      const existingFile = searchData.files?.[0];

      // Google ドライブにアップロードするためのマージデータを非同期で収集
      const currentTrips = useTravelStore.getState().trips;
      const deletedTrips = useTravelStore.getState().deletedTrips || [];

      // 全旅行データから imageKey をスキャンして収集
      const imageKeys = new Set<string>();
      const allTrips = [...currentTrips, ...deletedTrips];
      for (const trip of allTrips) {
        if (trip.preparationTasks) {
          for (const task of trip.preparationTasks) {
            if (task.imageKey) imageKeys.add(task.imageKey);
          }
        }
        if (trip.bookings) {
          for (const booking of trip.bookings) {
            if (booking.imageKey) imageKeys.add(booking.imageKey);
          }
        }
        if (trip.memories) {
          for (const memory of trip.memories) {
            if (memory.imageKey) imageKeys.add(memory.imageKey);
          }
        }
      }

      // IndexedDB (idb-keyval) から画像データ本体を一括取得
      const images: Record<string, string> = {};
      for (const key of imageKeys) {
        const data = await get(key);
        if (data) {
          images[key] = data as string;
        }
      }

      // trips, deletedTrips, images を丸ごと含めた完全なバックアップデータを作成
      const backupData = JSON.stringify({ trips: currentTrips, deletedTrips, images }, null, 2);

      if (existingFile) {
        const fileId = existingFile.id;
        const confirmRestore = window.confirm(
          `Googleドライブ上にバックアップが見つかりました。\n\n[OK] -> ドライブからデータを復元（画像やゴミ箱、現在のデータはすべて上書きされます）\n[キャンセル] -> 現在の全データ（画像やゴミ箱含む）をドライブへバックアップ`
        );

        if (confirmRestore) {
          await archiveDrivePayload(token, backupData, 'before-restore');
          const downloadRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          if (!downloadRes.ok) throw new Error('バックアップデータのダウンロードに失敗しました');
          const data = await downloadRes.json();
          
          if (data && data.trips && Array.isArray(data.trips)) {
            // 画像データを IndexedDB (idb-keyval) へ一括書き戻し（復元）
            if (data.images) {
              for (const [key, value] of Object.entries(data.images)) {
                await set(key, value as string);
              }
            }
            // ストア（trips, deletedTrips）を復元
            useTravelStore.setState({ 
              trips: data.trips, 
              deletedTrips: data.deletedTrips || [], 
              selectedTripId: null 
            });
            alert('🎉 Google ドライブから旅行データ・ゴミ箱・すべての画像を正常に復元しました！');
            setShowSettings(false);
          } else {
            alert('無効なデータ形式です。復元できませんでした。');
          }
        } else {
          await archiveExistingDriveBackup(token, fileId);
          const updateRes = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: backupData
            }
          );
          if (!updateRes.ok) throw new Error('データのバックアップアップロードに失敗しました');
          alert('💾 Google ドライブへ画像・ゴミ箱を含む完全バックアップを保存しました！');
          setShowSettings(false);
        }
      } else {
        alert('Google ドライブ上にバックアップファイルが見つかりません。新規作成して保存します。');
        
        const createMetaRes = await fetch(
          'https://www.googleapis.com/drive/v3/files',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: DRIVE_BACKUP_FILE_NAME,
              mimeType: 'application/json'
            })
          }
        );
        if (!createMetaRes.ok) throw new Error('メタデータの作成に失敗しました');
        const fileMeta = await createMetaRes.json();
        const fileId = fileMeta.id;

        const uploadRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: backupData
          }
        );
        if (!uploadRes.ok) throw new Error('データのアップロードに失敗しました');
        alert('💾 Google ドライブへ画像・ゴミ箱を含む新しい完全バックアップを作成・保存しました！');
        setShowSettings(false);
      }
    } catch (err: any) {
      console.error(err);
      alert('エラーが発生しました: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePermanentlyDelete = async (trip: any) => {
    if (!window.confirm(`「${trip.tripName}」を完全に削除しますか？\nこの操作は取り消せず、バックアップデータや画像データからもすべて抹消されます。`)) {
      return;
    }

    try {
      // 1. ローカル IndexedDB から関連画像を削除
      const imageKeys: string[] = [];
      if (trip.preparationTasks) {
        for (const task of trip.preparationTasks) {
          if (task.imageKey) imageKeys.push(task.imageKey);
        }
      }
      if (trip.bookings) {
        for (const booking of trip.bookings) {
          if (booking.imageKey) imageKeys.push(booking.imageKey);
        }
      }
      if (trip.memories) {
        for (const memory of trip.memories) {
          if (memory.imageKey) imageKeys.push(memory.imageKey);
        }
      }

      for (const key of imageKeys) {
        await del(key);
      }

      // 2. Zustand ストア（および Redis）から完全削除
      permanentlyDeleteTrip(trip.id);

      // 3. Google ドライブ上のバックアップからの完全抹消（ログイン済みの場合）
      if (driveToken) {
        console.log('Google ドライブ上のバックアップからもこの旅行を完全抹消中...');
        
        // ドライブ上の既存のバックアップファイルを検索
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_BACKUP_FILE_NAME}' and trashed=false&fields=files(id,name)`,
          {
            headers: { Authorization: `Bearer ${driveToken}` }
          }
        );
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const fileId = searchData.files?.[0]?.id;
          if (fileId) {
            // 最新の trips と deletedTrips を取得
            const currentTrips = useTravelStore.getState().trips;
            // すでにZustandからは削除されているので、現在のdeletedTripsにはもう含まれていません
            const deletedTrips = useTravelStore.getState().deletedTrips || [];

            // まだ残っているすべての旅行プランから画像キーをスキャンして収集
            const activeImageKeys = new Set<string>();
            const remainingTrips = [...currentTrips, ...deletedTrips];
            for (const t of remainingTrips) {
              if (t.preparationTasks) {
                for (const task of t.preparationTasks) {
                  if (task.imageKey) activeImageKeys.add(task.imageKey);
                }
              }
              if (t.bookings) {
                for (const booking of t.bookings) {
                  if (booking.imageKey) activeImageKeys.add(booking.imageKey);
                }
              }
              if (t.memories) {
                for (const memory of t.memories) {
                  if (memory.imageKey) activeImageKeys.add(memory.imageKey);
                }
              }
            }

            // まだアクティブな画像のみを IndexedDB から再ロード
            const images: Record<string, string> = {};
            for (const key of activeImageKeys) {
              const imgData = await get(key);
              if (imgData) {
                images[key] = imgData as string;
              }
            }

            // ドライブのファイルを上書き更新（完全抹消版）
            const backupData = JSON.stringify({ trips: currentTrips, deletedTrips, images }, null, 2);
            await archiveExistingDriveBackup(driveToken, fileId);
            await fetch(
              `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
              {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${driveToken}`,
                  'Content-Type': 'application/json'
                },
                body: backupData
              }
            );
            console.log('Google ドライブバックアップからの抹消完了。');
          }
        }
      }
      alert(`🎉 「${trip.tripName || '無題の旅行'}」の全データ・画像・クラウドバックアップからの完全抹消が完了しました！`);
    } catch (err: any) {
      console.error('完全削除中のエラー:', err);
      alert(`完全削除中にエラーが発生しました: ${err.message}`);
    }
  };

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
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h3 className="flex items-center gap-2" style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>
                  <Settings size={18} color="var(--accent-color)" /> データ保存・設定
                </h3>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* 美しいタブ切り替えコントロール */}
              <div className="flex gap-2 mb-4 p-1 rounded-xl bg-slate-100/80" style={{ border: '1px solid rgba(0,0,0,0.03)' }}>
                <button 
                  onClick={() => setSettingsTab('local')}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
                  style={{
                    background: settingsTab === 'local' ? 'white' : 'transparent',
                    backgroundColor: settingsTab === 'local' ? 'white' : 'transparent',
                    color: settingsTab === 'local' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: settingsTab === 'local' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  💾 ローカル保存
                </button>
                <button 
                  onClick={() => setSettingsTab('google')}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
                  style={{
                    background: settingsTab === 'google' ? 'white' : 'transparent',
                    backgroundColor: settingsTab === 'google' ? 'white' : 'transparent',
                    color: settingsTab === 'google' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: settingsTab === 'google' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ☁️ Googleドライブ
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                {settingsTab === 'local' ? (
                  <>
                    <div className="glass-panel p-4" style={{ borderRadius: '16px' }}>
                      <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2" style={{ fontSize: '0.85rem' }}><Download size={14} /> データのバックアップ (書き出し)</h4>
                      <p className="text-slate-500 mb-3" style={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
                        現在の旅行データをJSONファイルとしてダウンロードします。家族に共有したり、バックアップとして保存できます。（※画像データは一部含まれない場合があります）
                      </p>
                      <button onClick={handleExport} className="btn-primary w-full justify-center py-2 text-xs">データをダウンロード</button>
                    </div>

                    <div className="glass-panel p-4" style={{ borderRadius: '16px' }}>
                      <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2" style={{ fontSize: '0.85rem' }}><Upload size={14} /> データの復元 (読み込み)</h4>
                      <p className="mb-3 text-red-500 font-medium" style={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
                        ⚠️ バックアップファイルを読み込みます。現在のデータはすべて上書きされ、元に戻せません。
                      </p>
                      <label className="btn-secondary w-full justify-center cursor-pointer text-center block py-2 text-xs">
                        <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                        データファイルを読み込む
                      </label>
                    </div>
                  </>
                ) : (
                  /* Google ドライブ同期セクション */
                  <div className="glass-panel p-4" style={{ background: 'rgba(59, 130, 246, 0.03)', borderColor: 'rgba(59, 130, 246, 0.15)', borderRadius: '16px' }}>
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2" style={{ fontSize: '0.85rem' }}>
                      <span style={{ fontSize: '14px' }}>☁️</span> Google ドライブ自動同期
                    </h4>
                    <p className="text-slate-500 mb-3" style={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
                      Google ドライブに旅行データ、ゴミ箱の履歴、および添付されたスクリーンショット画像を丸ごと暗号化して自動同期・復元します。
                    </p>
                    
                    <div className="mb-3">
                      <label className="font-bold text-slate-700 mb-1 block" style={{ fontSize: '0.75rem' }}>Google OAuth クライアントID</label>
                      <input 
                        type="text" 
                        placeholder="OAuth 2.0 クライアント ID を入力" 
                        className="input-field" 
                        style={{ marginBottom: 0, fontSize: '0.75rem', padding: '0.4rem' }}
                        value={googleClientId}
                        onChange={e => {
                          setGoogleClientId(e.target.value);
                          localStorage.setItem('google_drive_client_id', e.target.value);
                        }}
                      />
                    </div>

                    {!googleClientId.trim() && (
                      <div className="mb-3 p-2.5 rounded-lg text-xs" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', lineHeight: 1.4 }}>
                        ⚠️ 同期を開始するには、Google OAuth クライアントIDを入力する必要があります。
                      </div>
                    )}

                    <button 
                      onClick={handleGoogleDriveSync} 
                      className="btn-primary w-full justify-center flex items-center gap-2 py-2.5 text-xs" 
                      style={{ 
                        background: (!googleClientId.trim() || isSyncing) ? '#e2e8f0' : '#3b82f6', 
                        color: (!googleClientId.trim() || isSyncing) ? '#94a3b8' : 'white',
                        cursor: (!googleClientId.trim() || isSyncing) ? 'not-allowed' : 'pointer',
                        boxShadow: (!googleClientId.trim() || isSyncing) ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.2)'
                      }}
                      disabled={!googleClientId.trim() || isSyncing}
                    >
                      {isSyncing ? '同期処理中...' : 'Google ドライブと同期する'}
                    </button>

                    <details className="mt-3 text-slate-500" style={{ fontSize: '0.7rem' }}>
                      <summary className="cursor-pointer font-bold hover:text-slate-700" style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>💡</span> OAuth クライアントIDの取得手順
                      </summary>
                      <div className="mt-2 pl-2 border-l-2 border-slate-200 flex flex-col gap-1.5" style={{ lineHeight: 1.4 }}>
                        <p>1. <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Google Cloud Console</a> にログインします。</p>
                        <p>2. プロジェクトを作成し、<strong>「APIs & Services」 &gt; 「OAuth consent screen」</strong>で外部アプリとして同意画面を設定します。</p>
                        <p>3. <strong>「Credentials」</strong>画面で、<strong>「Create Credentials」 &gt; 「OAuth client ID」</strong>を選択し、アプリケーションの種類を「ウェブ アプリケーション」にします。</p>
                        <p>4. <strong>「承認済みの JavaScript 生成元」</strong>に <code>https://hometown-travel-app.vercel.app</code> (ローカル開発時は <code>http://localhost:5173</code> も) を追加します。</p>
                        <p>5. 発行されたクライアントID（<code>.apps.googleusercontent.com</code> で終わるもの）をコピーして、上の入力欄に貼り付けてください。</p>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ゴミ箱（最近削除した旅行計画）セクション */}
        {deletedTrips.length > 0 && (
          <div className="glass-panel" style={{ marginTop: '2rem', background: 'rgba(239, 68, 68, 0.02)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
            <h3 className="flex items-center gap-2 mb-2 text-slate-700 font-bold" style={{ fontSize: '0.95rem' }}>
              <span>🗑️</span> 最近削除した旅行（ゴミ箱）
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              削除された旅行計画はここに一時保存されます。ワンクリックで復元することができます。
            </p>
            <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              {deletedTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white/60">
                  <div>
                    <h4 className="font-bold text-slate-800" style={{ fontSize: '0.9rem' }}>{trip.tripName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📅 {trip.tripDate ? new Date(trip.tripDate).toLocaleDateString('ja-JP') : '日付未定'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => restoreTrip(trip.id)} 
                      className="btn-primary" 
                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      🔄 復元する
                    </button>
                     <button 
                      onClick={() => handlePermanentlyDelete(trip)} 
                      className="btn-secondary" 
                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
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
          <div className="flex items-center justify-between mb-1 gap-2">
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>旅行まであと...</h2>
            <div className="flex gap-2" style={{ flexShrink: 0 }}>
              <button 
                onClick={openEdit} 
                title="編集する"
                style={{ 
                  background: 'var(--glass-bg)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--accent-color)'
                }}
              >
                ✎
              </button>
              <button 
                onClick={handleDeleteTrip} 
                title="削除する"
                style={{ 
                  background: 'var(--glass-bg)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: 'var(--danger)'
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
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
              
              <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  更新する
                </button>
                <button type="button" onClick={handleDeleteTrip} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <X size={16} /> 旅行計画を削除
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
            const isEditing = editingWishlistId === item.id;

            return (
              <div key={item.id} className="flex items-center justify-between" style={{ background: 'var(--glass-bg)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', gap: '0.5rem' }}>
                {isEditing ? (
                  <textarea
                    className="input-field"
                    value={editingWishlistName}
                    onChange={event => setEditingWishlistName(event.target.value)}
                    rows={3}
                    style={{ flex: 1, marginBottom: 0, resize: 'vertical', minHeight: '78px' }}
                    autoFocus
                  />
                ) : (
                  <div style={{ wordBreak: 'break-word', flex: 1, marginRight: '0.5rem' }}>
                    {renderWishlistText(item.name)}
                  </div>
                )}
                <div className="flex" style={{ gap: '0.25rem', alignItems: 'center' }}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveWishlistEdit}
                        title="保存"
                        aria-label="保存"
                        style={{ background: 'var(--accent-color)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.45rem', borderRadius: '8px' }}
                      >
                        <Check size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelWishlistEdit}
                        title="キャンセル"
                        aria-label="キャンセル"
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.45rem' }}
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startWishlistEdit(item)}
                        title="編集"
                        aria-label="編集"
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('このメモを削除しますか？')) {
                            deleteWishlistItem(item.id);
                          }
                        }}
                        title="削除"
                        aria-label="削除"
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                </div>
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
