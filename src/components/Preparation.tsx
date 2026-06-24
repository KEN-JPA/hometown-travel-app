import React, { useState, useEffect } from 'react';
import { useTravelStore, type PreparationTask } from '../store';
import { CalendarClock, CheckCircle, Circle, Play, Info, Sparkles, Plus, Trash2, Edit2, Camera, X } from 'lucide-react';
import { set, get } from 'idb-keyval';
import { Navigate } from 'react-router-dom';

function TaskItem({ 
  task, 
  overdue, 
  editingTaskId, 
  startEditing, 
  handleStatusToggle, 
  handleUpdateTask, 
  deletePreparationTask, 
  updatePreparationTask, 
  setEditingTaskId,
  editTaskTitle, setEditTaskTitle,
  editTaskDate, setEditTaskDate,
  editTaskNotes, setEditTaskNotes,
  editTaskUrls,
  handleAddUrlField, handleRemoveUrlField, handleUrlChange
}: { 
  task: PreparationTask, 
  overdue: boolean,
  editingTaskId: string | null,
  startEditing: (t: PreparationTask) => void,
  handleStatusToggle: (t: PreparationTask) => void,
  handleUpdateTask: (e: React.FormEvent, id: string) => void,
  deletePreparationTask: (id: string) => void,
  updatePreparationTask: (id: string, updates: any) => void,
  setEditingTaskId: (id: string | null) => void,
  editTaskTitle: string, setEditTaskTitle: (v: string) => void,
  editTaskDate: string, setEditTaskDate: (v: string) => void,
  editTaskNotes: string, setEditTaskNotes: (v: string) => void,
  editTaskUrls: string[],
  handleAddUrlField: (isEdit: boolean) => void,
  handleRemoveUrlField: (index: number, isEdit: boolean) => void,
  handleUrlChange: (index: number, value: string, isEdit: boolean) => void
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (task.imageKey) {
      get(task.imageKey).then((data) => {
        if (data) setImageUrl(data as string);
      });
    } else {
      setImageUrl(null);
    }
  }, [task.imageKey]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const key = `prep-task-img-${task.id}-${Date.now()}`;
      await set(key, base64String);
      updatePreparationTask(task.id, { imageKey: key });
      setImageUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = async () => {
    if (window.confirm('スクリーンショットを削除してもよろしいですか？')) {
      updatePreparationTask(task.id, { imageKey: undefined });
      setImageUrl(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-emerald-500" size={24} />;
      case 'in_progress': return <Play className="text-amber-500" size={24} />;
      default: return <Circle className="text-slate-300" size={24} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'in_progress': return '手配中';
      default: return '未着手';
    }
  };

  return (
    <>
      <div className={`glass-panel p-4 flex gap-4 items-start ${overdue ? 'border-2 border-rose-200 bg-rose-50/30' : ''}`}>
        <button 
          onClick={() => handleStatusToggle(task)}
          className="mt-1 shrink-0 transition-transform active:scale-90"
        >
          {getStatusIcon(task.status)}
        </button>
        
        <div className="flex-1 min-w-0">
          {editingTaskId === task.id ? (
            <form onSubmit={(e) => handleUpdateTask(e, task.id)} className="space-y-3">
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">やること（必須）</div>
                <input type="text" className="input-field" style={{ marginBottom: 0 }} value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} required />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">目標日・期限（任意）</div>
                <input type="date" className="input-field" style={{ marginBottom: 0 }} value={editTaskDate} onChange={e => setEditTaskDate(e.target.value)} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">関連URL・リンク（複数追加可）</div>
                <div className="space-y-2">
                  {editTaskUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="例: https://travel.rakuten.co.jp/"
                        className="input-field"
                        style={{ marginBottom: 0, flex: 1 }}
                        value={url}
                        onChange={e => handleUrlChange(idx, e.target.value, true)}
                      />
                      {editTaskUrls.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveUrlField(idx, true)}
                          className="btn-secondary" 
                          style={{ padding: '0.6rem 0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          title="削除"
                        >
                          ✕
                        </button>
                      )}
                      {idx === editTaskUrls.length - 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleAddUrlField(true)}
                          className="btn-primary" 
                          style={{ padding: '0.6rem 0.8rem' }}
                          title="追加"
                        >
                          ＋
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">メモ・詳細（任意）</div>
                <textarea className="input-field" style={{ marginBottom: 0, minHeight: '60px' }} value={editTaskNotes} onChange={e => setEditTaskNotes(e.target.value)} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">スクリーンショット（任意）</div>
                {imageUrl ? (
                  <div className="flex flex-col gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg" style={{ width: 'fit-content' }}>
                    <div style={{ position: 'relative', width: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                      <img src={imageUrl} alt="添付プレビュー" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      style={{ position: 'absolute', width: 0, height: 0, opacity: 0, zIndex: -1 }} 
                      onChange={handleImageUpload} 
                    />
                    <div className="flex gap-2 text-xs">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                      >
                        変更
                      </button>
                      <button type="button" onClick={handleImageRemove} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                        削除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'inline-block' }}>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      style={{ position: 'absolute', width: 0, height: 0, opacity: 0, zIndex: -1 }} 
                      onChange={handleImageUpload} 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 cursor-pointer text-xs transition-colors" 
                      style={{ display: 'inline-flex', padding: '0.4rem 0.8rem', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}
                    >
                      <Camera size={14} />
                      <span>スクリーンショット画像を添付</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn-primary flex-1 py-2 text-sm">保存</button>
                <button type="button" className="btn-secondary py-2 text-sm" onClick={() => setEditingTaskId(null)}>キャンセル</button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-bold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {task.title}
                </h3>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEditing(task)} className="text-slate-300 hover:text-indigo-400 p-1">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('このタスクを削除してもよろしいですか？')) {
                        deletePreparationTask(task.id);
                      }
                    }} 
                    className="text-slate-300 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'}`}>
                  {getStatusText(task.status)}
                </span>
                
                {task.targetDate && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${overdue ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-600'}`}>
                    {overdue ? '⚠️ 期限切れ: ' : '目安: '}
                    {new Date(task.targetDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {task.notes && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded whitespace-pre-wrap">
                  {task.notes}
                </p>
              )}

              {/* 関連URL表示 */}
              {((task.urls && task.urls.length > 0) || task.url) ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(task.urls || (task.url ? [task.url] : [])).map((url, uIdx) => (
                    <a 
                      key={uIdx}
                      href={url.startsWith('http') ? url : `https://${url}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors p-1.5 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100"
                    >
                      <span>🔗</span>
                      <span>関連リンク {uIdx + 1} を開く</span>
                    </a>
                  ))}
                </div>
              ) : null}

              {/* スクリーンショット添付 UI */}
              <div style={{ marginTop: '0.75rem' }}>
                {imageUrl ? (
                  <div className="flex flex-col gap-1">
                    <div style={{ position: 'relative', width: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => setShowModal(true)}>
                      <img src={imageUrl} alt="スクリーンショット" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="hover:opacity-100">
                        <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 'bold' }}>拡大表示</span>
                      </div>
                    </div>

                    {/* Googleドライブ保管の明示バッジ */}
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-bold" style={{ padding: '0.1rem 0.35rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '4px', display: 'inline-flex', width: 'fit-content' }}>
                      <span style={{ fontSize: '10px' }}>☁️</span>
                      <span>Googleドライブ同期・保管対象</span>
                    </div>

                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      style={{ position: 'absolute', width: 0, height: 0, opacity: 0, zIndex: -1 }} 
                      onChange={handleImageUpload} 
                    />
                    <div className="flex gap-2 text-xs" style={{ marginTop: '0.25rem' }}>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                      >
                        変更
                      </button>
                      <button 
                        type="button"
                        onClick={handleImageRemove} 
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'inline-block' }}>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      style={{ position: 'absolute', width: 0, height: 0, opacity: 0, zIndex: -1 }} 
                      onChange={handleImageUpload} 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 text-slate-400 hover:text-indigo-500 cursor-pointer text-xs transition-colors" 
                      style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.03)', border: 'none', borderRadius: '6px' }}
                    >
                      <Camera size={14} />
                      <span>スクショを追加</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 画像拡大表示用モーダル */}
      {showModal && imageUrl && (
        <div 
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <button 
            onClick={() => setShowModal(false)}
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'white', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#374151'
            }}
          >
            <X size={20} />
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{task.title}</h3>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>スクリーンショットプレビュー</p>
          </div>

          <div style={{ 
            width: '100%', maxWidth: '500px', 
            background: 'white', padding: '0.5rem',
            borderRadius: '12px', overflow: 'hidden'
          }}>
            <img 
              src={imageUrl} 
              alt="Screenshot Preview" 
              style={{ 
                width: '100%', height: 'auto', display: 'block', maxHeight: '70vh', objectFit: 'contain'
              }} 
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function Preparation() {
  const { trips, selectedTripId, generateAutoTasks, updatePreparationTask, deletePreparationTask, addPreparationTask } = useTravelStore();
  const currentTrip = trips.find(t => t.id === selectedTripId);
  const newTaskFileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskImage, setNewTaskImage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDate, setEditTaskDate] = useState('');
  const [editTaskNotes, setEditTaskNotes] = useState('');
  const [newTaskUrls, setNewTaskUrls] = useState<string[]>(['']);
  const [editTaskUrls, setEditTaskUrls] = useState<string[]>(['']);

  const handleAddUrlField = (isEdit: boolean) => {
    if (isEdit) {
      setEditTaskUrls([...editTaskUrls, '']);
    } else {
      setNewTaskUrls([...newTaskUrls, '']);
    }
  };

  const handleRemoveUrlField = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditTaskUrls(editTaskUrls.filter((_, i) => i !== index));
    } else {
      setNewTaskUrls(newTaskUrls.filter((_, i) => i !== index));
    }
  };

  const handleUrlChange = (index: number, value: string, isEdit: boolean) => {
    if (isEdit) {
      const updated = [...editTaskUrls];
      updated[index] = value;
      setEditTaskUrls(updated);
    } else {
      const updated = [...newTaskUrls];
      updated[index] = value;
      setNewTaskUrls(updated);
    }
  };

  if (!currentTrip) return <Navigate to="/" replace />;

  const tasks = currentTrip.preparationTasks || [];
  
  // ターゲット日でソート (日付が早い順)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  const isOverdue = (targetDate: string | null, status: string) => {
    if (!targetDate || status === 'completed') return false;
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return target < today;
  };

  const handleStatusToggle = (task: PreparationTask) => {
    const nextStatus = 
      task.status === 'pending' ? 'in_progress' : 
      task.status === 'in_progress' ? 'completed' : 'pending';
    updatePreparationTask(task.id, { status: nextStatus });
  };

  const handleNewTaskImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTaskImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    // 画像が添付されている場合はランダムキーを作成して IndexedDB へ保存
    let imageKey: string | undefined = undefined;
    if (newTaskImage) {
      imageKey = `prep-task-img-temp-${Math.random().toString(36).substring(2, 9)}`;
      await set(imageKey, newTaskImage);
    }

    const filteredUrls = newTaskUrls.map(u => u.trim()).filter(Boolean);

    addPreparationTask({
      title: newTaskTitle,
      category: 'その他',
      targetDate: newTaskDate || null,
      status: 'pending',
      notes: newTaskNotes,
      urls: filteredUrls,
      url: filteredUrls[0] || undefined,
      isAutoGenerated: false,
      imageKey
    });

    setNewTaskTitle('');
    setNewTaskDate('');
    setNewTaskNotes('');
    setNewTaskUrls(['']);
    setNewTaskImage(null);
    setShowAddForm(false);
  };

  const startEditing = (task: PreparationTask) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDate(task.targetDate || '');
    setEditTaskNotes(task.notes || '');
    if (task.urls && task.urls.length > 0) {
      setEditTaskUrls(task.urls);
    } else {
      setEditTaskUrls(task.url ? [task.url] : ['']);
    }
  };

  const handleUpdateTask = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    if (!editTaskTitle.trim()) return;
    const filteredUrls = editTaskUrls.map(u => u.trim()).filter(Boolean);
    updatePreparationTask(taskId, {
      title: editTaskTitle,
      targetDate: editTaskDate || null,
      notes: editTaskNotes,
      urls: filteredUrls,
      url: filteredUrls[0] || undefined
    });
    setEditingTaskId(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarClock className="text-indigo-500" />
          準備・予約タスク
        </h2>
        <button 
          onClick={generateAutoTasks}
          className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm"
        >
          <Sparkles size={16} />
          自動スケジュール生成
        </button>
      </div>

      <div className="glass-panel p-4 mb-6">
        <div className="flex gap-3 items-start text-sm text-slate-600">
          <Info className="text-indigo-400 shrink-0 mt-0.5" size={18} />
          <p>
            「自動スケジュール生成」を押すと、旅行日（{currentTrip.tripDate ? new Date(currentTrip.tripDate).toLocaleDateString() : '未定'}）から逆算して、飛行機やホテルの予約開始目安日を自動でタスクリストに追加します。
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <CalendarClock size={48} className="mx-auto mb-3 opacity-20" />
            <p>タスクがありません。</p>
            <p className="text-sm mt-1">「自動スケジュール生成」で標準項目を追加できます。</p>
          </div>
        ) : (
          sortedTasks.map(task => {
            const overdue = isOverdue(task.targetDate, task.status);
            return (
              <TaskItem 
                key={task.id}
                task={task}
                overdue={overdue}
                editingTaskId={editingTaskId}
                startEditing={startEditing}
                handleStatusToggle={handleStatusToggle}
                handleUpdateTask={handleUpdateTask}
                deletePreparationTask={deletePreparationTask}
                updatePreparationTask={updatePreparationTask}
                setEditingTaskId={setEditingTaskId}
                editTaskTitle={editTaskTitle}
                setEditTaskTitle={setEditTaskTitle}
                editTaskDate={editTaskDate}
                setEditTaskDate={setEditTaskDate}
                editTaskNotes={editTaskNotes}
                setEditTaskNotes={setEditTaskNotes}
                editTaskUrls={editTaskUrls}
                handleAddUrlField={handleAddUrlField}
                handleRemoveUrlField={handleRemoveUrlField}
                handleUrlChange={handleUrlChange}
              />
            );
          })
        )}
      </div>

      {showAddForm ? (
        <form onSubmit={handleAddTask} className="glass-panel p-4 space-y-3">
          <div className="border-b border-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-slate-800">新しいタスクを追加</h3>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-700 mb-1">やること（必須）</div>
            <input
              type="text"
              placeholder="例: レンタカーの予約"
              className="input-field"
              style={{ marginBottom: 0 }}
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-700 mb-1">目標日・期限（任意）</div>
            <input
              type="date"
              className="input-field"
              style={{ marginBottom: 0 }}
              value={newTaskDate}
              onChange={e => setNewTaskDate(e.target.value)}
            />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-700 mb-1">関連URL・リンク（複数追加可）</div>
            <div className="space-y-2">
              {newTaskUrls.map((url, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="例: https://travel.rakuten.co.jp/"
                    className="input-field"
                    style={{ marginBottom: 0, flex: 1 }}
                    value={url}
                    onChange={e => handleUrlChange(idx, e.target.value, false)}
                  />
                  {newTaskUrls.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveUrlField(idx, false)}
                      className="btn-secondary" 
                      style={{ padding: '0.6rem 0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      title="削除"
                    >
                      ✕
                    </button>
                  )}
                  {idx === newTaskUrls.length - 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleAddUrlField(false)}
                      className="btn-primary" 
                      style={{ padding: '0.6rem 0.8rem' }}
                      title="追加"
                    >
                      ＋
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-700 mb-1">メモ・詳細（任意）</div>
            <textarea
              placeholder="例: ファミリーカーを3日間借りる"
              className="input-field"
              style={{ marginBottom: 0, minHeight: '60px' }}
              value={newTaskNotes}
              onChange={e => setNewTaskNotes(e.target.value)}
            />
          </div>

          {/* 新規タスク追加フォームのスクショ添付 UI */}
          <div>
            <div className="text-sm font-bold text-slate-700 mb-1">スクリーンショット（任意）</div>
            {newTaskImage ? (
              <div className="flex flex-col gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg" style={{ width: 'fit-content' }}>
                <div style={{ position: 'relative', width: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  <img src={newTaskImage} alt="添付プレビュー" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                </div>
                <input 
                  ref={newTaskFileInputRef}
                  type="file" 
                  accept="image/*" 
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0, zIndex: -1 }} 
                  onChange={handleNewTaskImageUpload} 
                />
                <div className="flex gap-2 text-xs">
                  <button 
                    type="button"
                    onClick={() => newTaskFileInputRef.current?.click()}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                  >
                    変更
                  </button>
                  <button type="button" onClick={() => setNewTaskImage(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                    削除
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'inline-block' }}>
                <input 
                  ref={newTaskFileInputRef}
                  type="file" 
                  accept="image/*" 
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0, zIndex: -1 }} 
                  onChange={handleNewTaskImageUpload} 
                />
                <button 
                  type="button"
                  onClick={() => newTaskFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 cursor-pointer text-xs transition-colors" 
                  style={{ display: 'inline-flex', padding: '0.4rem 0.8rem', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}
                >
                  <Camera size={14} />
                  <span>スクリーンショット画像を添付</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">
              追加する
            </button>
            <button type="button" onClick={() => {
              setShowAddForm(false);
              setNewTaskTitle('');
              setNewTaskDate('');
              setNewTaskNotes('');
              setNewTaskUrls(['']);
              setNewTaskImage(null);
            }} className="btn-secondary flex-1">
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full glass-panel p-4 flex items-center justify-center gap-2 text-indigo-600 font-bold"
        >
          <Plus size={20} />
          カスタムタスクを追加
        </button>
      )}
    </div>
  );
}
