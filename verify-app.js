import fs from 'fs';
import puppeteer from 'puppeteer-core';

// Windows の Chrome の標準的なパスの候補
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\kj101\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
];

let executablePath = null;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    executablePath = p;
    break;
  }
}

if (!executablePath) {
  console.error('❌ Google Chrome executable not found in standard Windows paths.');
  process.exit(1);
}

console.log('Using Chrome executable:', executablePath);

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // コンソールログをキャッチ
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // 未処理の例外（Runtime Error）をキャッチ
  page.on('pageerror', err => {
    console.log('\n❌❌❌ BROWSER RUNTIME EXCEPTION DETECTED:');
    console.log(err.toString());
    console.log('Stack trace:', err.stack);
  });

  // ネットワークリクエストエラーをキャッチ
  page.on('requestfailed', request => {
    console.log(`[NETWORK ERROR] ${request.method()} ${request.url()} failed: ${request.failure()?.errorText}`);
  });

  console.log('\nNavigating to production app: https://hometown-travel-app.vercel.app ...');
  
  try {
    await page.goto('https://hometown-travel-app.vercel.app', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('\nApp loaded. Waiting 3 seconds for potential hydration/async issues...');
    await new Promise(r => setTimeout(r, 3000));
    
    // 画面のスクリーンショットを撮影して保存（確認用）
    const screenshotPath = 'verification-screenshot.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`\n📸 Screenshot saved to: ${screenshotPath}`);

  } catch (err) {
    console.error('Navigation or page error:', err);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

run().catch(console.error);
