#!/usr/bin/env node
// Take screenshots of each page for the pitch video
const puppeteer = require('puppeteer');
const path = require('path');

const FRAMES_DIR = '/Users/bencody/Downloads/homesync-video-frames';
const BASE = 'http://localhost:5173/#';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--window-size=1920,1080'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const shots = [
    { name: '01-dashboard-top', url: `${BASE}/`, scroll: 0 },
    { name: '02-dashboard-charts', url: `${BASE}/`, scroll: 500 },
    { name: '03-map-full', url: `${BASE}/map`, scroll: 0, wait: 3000 },
    { name: '04-subdivision-detail', url: `${BASE}/subdivisions/136`, scroll: 0, wait: 1000 },
    { name: '05-maintenance-bars', url: `${BASE}/subdivisions/136`, scroll: 500, wait: 500 },
    { name: '06-top-opportunity', url: `${BASE}/subdivisions/136`, scroll: 1100, wait: 500 },
    { name: '07-pipeline', url: `${BASE}/pipeline`, scroll: 0, wait: 1000 },
    { name: '08-contractors', url: `${BASE}/contractors`, scroll: 0, wait: 1000 },
    { name: '09-email', url: `${BASE}/email/compose`, scroll: 0, wait: 1000 },
    { name: '10-settings', url: `${BASE}/settings`, scroll: 0, wait: 1000 },
    { name: '11-dashboard-close', url: `${BASE}/`, scroll: 0, wait: 1000 },
  ];

  for (const shot of shots) {
    await page.goto(shot.url, { waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    if (shot.wait) await new Promise(r => setTimeout(r, shot.wait));
    if (shot.scroll) await page.evaluate((y) => window.scrollTo(0, y), shot.scroll);
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(FRAMES_DIR, `${shot.name}.png`), type: 'png' });
    console.log(`  Captured: ${shot.name}`);
  }

  await browser.close();
  console.log('\nDone! All screenshots saved.');
}

main().catch(console.error);
