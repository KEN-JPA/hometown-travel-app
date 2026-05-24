import fs from 'fs';
import puppeteer from 'puppeteer-core';

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
  console.error('❌ Chrome not found.');
  process.exit(1);
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // コンソールエラーをキャッチ
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ [BROWSER CONSOLE ERROR]:`, msg.text());
    } else {
      console.log(`[BROWSER CONSOLE]:`, msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('❌❌❌ RUNTIME EXCEPTION DETECTED:');
    console.log(err.toString());
  });

  // ネットワークリクエストのエラーを監視
  page.on('requestfailed', request => {
    console.log(`❌ [REQUEST FAILED]: ${request.url()} - ${request.failure() ? request.failure().errorText : 'Unknown'}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`❌ [HTTP ERROR RESPONSE]: ${response.url()} - Status: ${response.status()}`);
    }
  });

  console.log('1. Navigating to app...');
  await page.goto('https://hometown-travel-app.vercel.app', {
    waitUntil: 'networkidle2'
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'step1-auth-screen.png' });
  console.log('✔ Auth screen loaded and screenshot saved to step1-auth-screen.png');

  // パスワードを入力してログイン
  console.log('2. Entering password and logging in...');
  await page.evaluate(() => {
    const passwordInput = document.querySelector('input[type="password"]');
    const loginForm = document.querySelector('form');
    if (passwordInput && loginForm) {
      passwordInput.value = '0702';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
      loginForm.dispatchEvent(new Event('submit', { bubbles: true }));
    } else {
      console.error('Password input or login form not found');
    }
  });

  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'step2-logged-in-dashboard.png' });
  console.log('✔ Logged in and dashboard loaded. Saved screenshot to step2-logged-in-dashboard.png');

  // サンプルの旅行計画を選択するために、旅行プランアイテムをクリック
  console.log('3. Selecting a trip...');
  const clicked = await page.evaluate(() => {
    // タイトルに「北海道」が含まれるプランをクリック
    const divs = Array.from(document.querySelectorAll('div'));
    const tripItem = divs.find(d => d.textContent.includes('北海道') && d.outerHTML.includes('cursor: pointer'));
    if (tripItem) {
      tripItem.click();
      return true;
    }
    
    // なければ、一番最初の旅行計画と思われる要素をクリック
    const anyTripLink = document.querySelector('div[style*="cursor: pointer"]');
    if (anyTripLink) {
      anyTripLink.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    console.error('❌ Could not find a trip item to click.');
  }

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'step3-trip-detail.png' });
  console.log('✔ Trip selected and screenshot saved to step3-trip-detail.png');

  // 「準備」タブをクリック
  console.log('4. Clicking "準備" tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const prepTab = buttons.find(b => b.textContent.includes('準備'));
    if (prepTab) {
      prepTab.click();
    } else {
      console.error('Preparation tab not found');
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'step4-prep-tab.png' });
  console.log('✔ Preparation tab opened and screenshot saved to step4-prep-tab.png');

  // 「カスタムタスクを追加」ボタンをクリックしてフォームを開く
  console.log('5. Opening custom task form...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('カスタムタスクを追加'));
    if (addBtn) {
      addBtn.click();
    } else {
      console.error('Add custom task button not found');
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'step5-task-form.png' });
  console.log('✔ Add task form opened and screenshot saved to step5-task-form.png');

  // 設定ボタンをクリックして設定モーダルのGoogleドライブタブを確認
  console.log('6. Opening settings and Google Drive tab...');
  // ホームに戻る
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const homeBtn = buttons.find(b => b.textContent.includes('ホーム'));
    if (homeBtn) homeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 設定を開く
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const settingsBtn = buttons.find(b => b.innerHTML.includes('svg') && (b.outerHTML.includes('Settings') || b.outerHTML.includes('settings')));
    if (settingsBtn) settingsBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Google ドライブタブを選択
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const googleTab = buttons.find(b => b.textContent.includes('Googleドライブ'));
    if (googleTab) googleTab.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'step6-drive-settings.png' });
  console.log('✔ Google Drive settings tab verified and screenshot saved to step6-drive-settings.png');

  await browser.close();
  console.log('🎉 Verification completed!');
}

run().catch(console.error);
