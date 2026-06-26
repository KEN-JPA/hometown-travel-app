import { useEffect, useState } from 'react';
import { ArrowLeft, History, RefreshCw, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type TripBackupSummary = {
  id: string;
  createdAt: string;
  source?: string;
  tripCount: number;
  deletedTripCount: number;
  tripNames: string[];
};

const formatBackupDate = (value?: string) => {
  if (!value) return '日時不明';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

export default function Backups() {
  const navigate = useNavigate();
  const [backups, setBackups] = useState<TripBackupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null);
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const loadBackups = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/get-trip-backups?limit=50');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'バックアップ履歴を取得できませんでした');
      }
      setBackups(Array.isArray(data.backups) ? data.backups : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'バックアップ履歴を取得できませんでした');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBackups();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const createBackup = async () => {
    setIsCreating(true);
    setStatus('');
    setError('');
    try {
      const response = await fetch('/api/create-trip-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual-backup-page' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'バックアップを作成できませんでした');
      }
      setStatus(`${formatBackupDate(data.backup?.createdAt)} のバックアップを作成しました`);
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'バックアップを作成できませんでした');
    } finally {
      setIsCreating(false);
    }
  };

  const restoreBackup = async (backup: TripBackupSummary) => {
    const label = formatBackupDate(backup.createdAt);
    const tripNames = backup.tripNames.length > 0 ? backup.tripNames.join('、') : '旅行なし';
    if (!window.confirm(`${label} の状態に復元しますか？\n\n復元対象: ${tripNames}\n\n現在の状態も復元前バックアップとして保存されます。`)) {
      return;
    }

    setRestoringBackupId(backup.id);
    setStatus('');
    setError('');
    try {
      const response = await fetch('/api/restore-trip-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: backup.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'バックアップを復元できませんでした');
      }
      setStatus(`${label} の状態に復元しました。画面を更新すると反映されます。`);
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'バックアップを復元できませんでした');
    } finally {
      setRestoringBackupId(null);
    }
  };

  const deleteBackup = async (backup: TripBackupSummary) => {
    const label = formatBackupDate(backup.createdAt);
    if (!window.confirm(`${label} のバックアップを削除しますか？\n現在入力されている旅行データは削除されません。`)) {
      return;
    }

    setDeletingBackupId(backup.id);
    setStatus('');
    setError('');
    try {
      const response = await fetch('/api/delete-trip-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: backup.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'バックアップを削除できませんでした');
      }
      setStatus(`${label} のバックアップを削除しました`);
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'バックアップを削除できませんでした');
    } finally {
      setDeletingBackupId(null);
    }
  };

  return (
    <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={16} /> ホームへ戻る
      </button>

      <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.04)', borderColor: 'rgba(16, 185, 129, 0.18)' }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="title" style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>バックアップ</h2>
            <p className="subtitle" style={{ fontSize: '0.8rem' }}>旅行データの保存履歴</p>
          </div>
          <div style={{ background: 'var(--accent-glow)', color: 'var(--accent-color)', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <History size={22} />
          </div>
        </div>

        <p className="text-slate-500 mb-4" style={{ fontSize: '0.78rem', lineHeight: 1.55 }}>
          現在サーバーに保存されている旅行データを、日時付きの履歴として保存します。履歴カードを押すと、その時点の状態に復元できます。
        </p>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={createBackup}
            disabled={isCreating || isLoading}
            className="btn-primary flex-1 justify-center flex items-center gap-2"
            style={{
              padding: '0.7rem 0.75rem',
              background: (isCreating || isLoading) ? '#e2e8f0' : 'var(--accent-color)',
              color: (isCreating || isLoading) ? '#94a3b8' : 'white',
              cursor: (isCreating || isLoading) ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={16} />
            {isCreating ? 'バックアップ中...' : '今の状態をバックアップ'}
          </button>
          <button
            type="button"
            onClick={loadBackups}
            disabled={isLoading || isCreating}
            className="btn-secondary flex items-center justify-center"
            style={{ padding: '0.7rem 0.85rem' }}
            title="履歴を更新"
            aria-label="履歴を更新"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {status && (
          <div className="mb-3 p-3 rounded-lg text-xs" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.18)', color: '#047857', lineHeight: 1.4 }}>
            {status}
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 rounded-lg text-xs" style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.16)', color: '#dc2626', lineHeight: 1.4 }}>
            {error}
          </div>
        )}
      </div>

      <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? (
          <div className="glass-panel p-4 text-center text-slate-500 text-sm">履歴を読み込み中...</div>
        ) : backups.length === 0 ? (
          <div className="glass-panel p-4 text-center text-slate-500 text-sm">まだバックアップ履歴はありません。</div>
        ) : (
          backups.map((backup) => (
            <div
              key={backup.id}
              className="glass-card flex items-center justify-between gap-3"
              onClick={() => {
                void restoreBackup(backup);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void restoreBackup(backup);
                }
              }}
              style={{ padding: '1rem', cursor: restoringBackupId === backup.id ? 'wait' : 'pointer' }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="font-bold text-slate-800" style={{ fontSize: '0.9rem' }}>
                  {formatBackupDate(backup.createdAt)}
                </div>
                <div className="text-xs text-slate-500 mt-1" style={{ lineHeight: 1.35 }}>
                  旅行 {backup.tripCount}件 / ゴミ箱 {backup.deletedTripCount}件
                </div>
                {backup.tripNames.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>
                    {backup.tripNames.join('、')}
                  </div>
                )}
                <div className="text-xs mt-2" style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                  <RotateCcw size={13} />
                  {restoringBackupId === backup.id ? '復元中...' : '押してこの状態に復元'}
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteBackup(backup);
                }}
                disabled={deletingBackupId === backup.id}
                className="btn-secondary flex items-center justify-center"
                style={{
                  width: 38,
                  height: 38,
                  padding: 0,
                  color: 'var(--danger)',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  flexShrink: 0,
                }}
                title="このバックアップを削除"
                aria-label="このバックアップを削除"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
