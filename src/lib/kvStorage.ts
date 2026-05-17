import type { StateStorage } from 'zustand/middleware';

// カスタムストレージ: クラウド（Vercel KV）とローカルストレージを同期する
export const kvStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/get-trips');
      if (response.ok) {
        const data = await response.json();
        // データが存在し、有効なZustandフォーマット（stateを含む）の場合
        if (data && data.state) {
          return JSON.stringify(data);
        }
      }
    } catch (error) {
      console.error('KV getItem error:', error);
    }
    // KVから取得失敗時、または初回起動時はローカルストレージをフォールバックとして使用
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // ローカルにも保存しておく（オフライン時のキャッシュ用）
    localStorage.setItem(name, value); 
    try {
      await fetch('/api/save-trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Zustandの { state: {...}, version: 0 } というオブジェクトをそのままJSONとして送信
        body: JSON.stringify(JSON.parse(value)),
      });
    } catch (error) {
      console.error('KV setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name);
    try {
      await fetch('/api/save-trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    } catch (error) {}
  },
};
