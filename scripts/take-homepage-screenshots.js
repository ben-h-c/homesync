#!/usr/bin/env node
/**
 * Take homepage screenshots with demo data.
 * Hides: sidebar user section (bottom-left), admin "View As" tier switcher (top-right).
 */
const puppeteer = require('puppeteer');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'client', 'public', 'screenshots');
const BASE = 'http://localhost:5173';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Go to login page and log in via form
  console.log('Logging in via form...');
  await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle0', timeout: 15000 });
  await page.type('input[type="email"]', 'benjaminharriscody@gmail.com');
  await page.type('input[type="password"]', 'Fentoozler1!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // Verify we're logged in
  const url = page.url();
  console.log('  Current URL:', url);
  if (url.includes('/login')) {
    console.error('Login failed — still on login page');
    await browser.close();
    process.exit(1);
  }

  // Helper: hide sidebar user section and admin tier switcher
  const hideUI = async () => {
    await page.evaluate(() => {
      // Hide sidebar user/logout section at bottom
      document.querySelectorAll('aside .border-t').forEach(el => {
        el.style.display = 'none';
      });

      // Hide admin "View As" tier switcher — find all elements in the top bar
      // that have multiple small buttons (the tier switcher has 4 buttons)
      document.querySelectorAll('div.shrink-0').forEach(el => {
        const buttons = el.querySelectorAll('button');
        if (buttons.length >= 3) {
          el.style.display = 'none';
        }
      });
    });
  };

  const shots = [
    { name: 'dashboard', url: `${BASE}/#/dashboard`, wait: 2000 },
    { name: 'leads-map', url: `${BASE}/#/opportunities`, wait: 4000 },
    { name: 'pipeline', url: `${BASE}/#/leads`, wait: 2000 },
    { name: 'subdivision', url: `${BASE}/#/jobs`, wait: 2000 },
    { name: 'invoice-detail', url: `${BASE}/#/invoices`, wait: 2000 },
    { name: 'marketing', url: `${BASE}/#/email/compose`, wait: 2000 },
  ];

  for (const shot of shots) {
    console.log(`  Capturing: ${shot.name}...`);
    await page.goto(shot.url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, shot.wait || 2000));
    await hideUI();
    await new Promise(r => setTimeout(r, 300));

    const filePath = path.join(OUTPUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: filePath, type: 'png' });
    console.log(`    Saved: ${filePath}`);
  }

  await browser.close();
  console.log('\nAll screenshots captured!');
}

main().catch(err => { console.error(err); process.exit(1); });
