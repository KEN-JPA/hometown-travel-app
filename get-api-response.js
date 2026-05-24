import puppeteer from 'puppeteer-core';
import fs from 'fs';

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

async function run() {
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://hometown-travel-app.vercel.app');
  
  const resData = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/get-trips');
      const text = await res.text();
      return { status: res.status, body: text };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('API RESPONSE STATUS:', resData.status);
  console.log('API RESPONSE BODY:', resData.body);
  await browser.close();
}
run();
