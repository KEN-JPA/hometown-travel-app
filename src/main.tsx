import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// PWAの自動更新ロジック: 新しいバージョンがデプロイされたら自動で検知してリロードする
if ('serviceWorker' in navigator) {
  // 新しいService Workerがアクティブになったらページを強制リロード
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
