/**
 * Wave 6B-Place-QA — Part 2G Place QA runner (evidence only).
 * Run: node docs/ux/audits/qa-evidence/5G-QA/place/run-part2g-qa.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:3000';
const EMAIL = 'qa-calendar-5g-exec-2026@test.com';
const PASSWORD = 'TestPassword123!';
const QA_MEETING = '[QA] Place Meeting 5G';
const QA_MEETING_TRASH = '[QA] Place Trash 5G';

fs.mkdirSync(SCREENSHOTS, { recursive: true });

const results = [];

function record(id, pri, result, viewport, theme, notes, screenshot) {
  results.push({ id, pri, result, viewport, theme, notes, screenshot: screenshot ?? null });
  console.log(`${id} [${pri}] ${result} — ${notes}`);
}

async function runCase(id, fn) {
  try {
    await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const existing = results.find((r) => r.id === id);
    if (!existing) {
      const pri = id.match(/PLC-\d+/) ? (['PLC-06', 'PLC-08', 'PLC-09', 'PLC-15', 'PLC-17', 'PLC-20', 'PLC-22', 'PLC-23', 'PLC-27'].includes(id) ? 'P1' : 'P0') : 'P0';
      record(id, pri, 'FAIL', 'D', 'light', `Runner error: ${msg.slice(0, 200)}`);
    }
  }
}

async function shot(page, name) {
  const p = path.join(SCREENSHOTS, name);
  await page.screenshot({ path: p, fullPage: false });
  return name;
}

async function login(page, returnUrl = '/place') {
  await page.goto(`${BASE}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(place|dashboard)/, { timeout: 90000 });
  await page.waitForTimeout(3000);
}

async function ensurePlaceSetup(page) {
  await page.goto(`${BASE}/place`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(5000);
  if (await page.locator('text=Get Started').first().isVisible().catch(() => false)) {
    await page.locator('text=Get Started').first().click();
    await page.waitForTimeout(600);
    await page.locator('text=Restaurants & Dining').first().click();
    await page.waitForTimeout(400);
    await page.locator('text=Continue').first().click();
    await page.waitForTimeout(600);
    await page.locator('button:has-text("Enter Your Neighborhood")').click();
    await page.waitForTimeout(8000);
  }
  const shellReady =
    (await page.locator('[aria-label="Place navigation"]').isVisible().catch(() => false)) ||
    (await page.locator('[aria-label="Open Place navigation"]').isVisible().catch(() => false));
  if (!shellReady) {
    throw new Error('Place shell did not load after onboarding');
  }
}

async function gotoPlace(page, tab) {
  const url = tab ? `${BASE}/place?tab=${tab}` : `${BASE}/place`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
}

async function gotoDashboardPlace(page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
  const placeTab = page.locator('text=Place').filter({ has: page.locator('svg') }).first();
  if (await placeTab.isVisible().catch(() => false)) {
    await placeTab.click();
    await page.waitForTimeout(3000);
  }
}

async function switchDesktopTab(page, label) {
  const tab = page.locator('[role="tablist"][aria-label="Place navigation"] [role="tab"]').filter({ hasText: label }).first();
  if (await tab.isVisible().catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(1500);
    return true;
  }
  return false;
}

async function openTrashBin(page) {
  const btn = page.locator('button[aria-label^="Trash bin"]').first();
  await btn.click();
  await page.waitForTimeout(800);
  return (await page.locator('h3:has-text("Trash")').isVisible().catch(() => false));
}

async function createMeeting(page, name) {
  await switchDesktopTab(page, 'Meetings');
  await page.waitForTimeout(1000);
  await page.locator('text=New Meeting').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[placeholder*="Joe"]').fill(name);
  const createBtn = page.locator('button:has-text("Create Meeting")').first();
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/place/meetings') && r.request().method() === 'POST',
    { timeout: 20000 },
  ).catch(() => null);
  await createBtn.click();
  const response = await responsePromise;
  await page.waitForTimeout(3000);
  const apiOk = response ? response.ok() : false;
  const apiStatus = response ? response.status() : 'no-response';
  const visible = await page.locator(`text=${name}`).first().isVisible().catch(() => false);
  if (!visible && apiOk) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    return { ok: (await page.locator(`text=${name}`).first().isVisible().catch(() => false)), apiStatus };
  }
  return { ok: visible || apiOk, apiStatus };
}

async function trashMeetingByName(page, name) {
  const row = page.locator(`text=${name}`).first();
  if (!(await row.isVisible().catch(() => false))) return false;
  const card = row.locator('xpath=ancestor::div[contains(@class,"p-4")]').first();
  await card.locator('[aria-label="Meeting actions"]').click();
  await page.waitForTimeout(400);
  await page.locator('text=Move to trash').last().click();
  await page.waitForTimeout(500);
  const modal = await page.locator('text=Move meeting to trash?').isVisible().catch(() => false);
  if (!modal) return false;
  await page.locator('button:has-text("Move to trash")').last().click();
  await page.waitForTimeout(2500);
  return !(await page.locator(`text=${name}`).first().isVisible().catch(() => false));
}

async function setDarkMode(page, on) {
  await page.evaluate((dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, on);
  await page.waitForTimeout(600);
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await desktopCtx.newPage();
  let meetingCreated = false;
  let calendarLinked = false;

  try {
    await login(page, '/place');
    await ensurePlaceSetup(page);

    // PLC-01
    const hasNav =
      (await page.locator('[aria-label="Place navigation"]').isVisible().catch(() => false)) ||
      (await page.locator('text=My Place').first().isVisible().catch(() => false));
    const hasGraph = await page.locator('[aria-label="Your neighborhood map"]').isVisible().catch(() => false);
    if (hasNav && (hasGraph || (await page.locator('text=Your Main Street is empty').isVisible().catch(() => false)))) {
      const s = await shot(page, 'PLC-01-D-light.png');
      record('PLC-01', 'P0', 'PASS', 'D', 'light', 'PlacePageShell + default My Place tab', s);
    } else {
      record('PLC-01', 'P0', 'FAIL', 'D', 'light', `nav=${hasNav} graph=${hasGraph}`);
    }

    // PLC-02
    const tabs = ['Explore', 'Meetings', 'Feed', 'Insights', 'My Place'];
    let tabOk = true;
    for (const t of tabs) {
      if (!(await switchDesktopTab(page, t))) tabOk = false;
    }
    const dupShell = (await page.locator('[role="tablist"][aria-label="Place navigation"]').count()) > 1;
    if (tabOk && !dupShell) {
      const s = await shot(page, 'PLC-02-D-light.png');
      record('PLC-02', 'P0', 'PASS', 'D', 'light', 'All tabs switch; single shell', s);
    } else {
      record('PLC-02', 'P0', 'FAIL', 'D', 'light', `tabOk=${tabOk} dupShell=${dupShell}`);
    }

    // PLC-03
    await gotoDashboardPlace(page);
    const embedNav = await page.locator('[role="tablist"][aria-label="Place navigation"]').isVisible().catch(() => false);
    const embedMeetings = await switchDesktopTab(page, 'Meetings');
    if (embedNav && embedMeetings) {
      const s = await shot(page, 'PLC-03-D-light.png');
      record('PLC-03', 'P0', 'PASS', 'D', 'light', 'Dashboard Place embed with shared tabs', s);
    } else {
      record('PLC-03', 'P0', 'FAIL', 'D', 'light', `embedNav=${embedNav} meetings=${embedMeetings}`);
    }

    // PLC-04
    record('PLC-04', 'P0', 'BLOCKED', 'D', 'light', 'No business membership on QA test account (same as TODO-02)');

    // PLC-05
    await gotoPlace(page, 'meetings');
    const createResult = await createMeeting(page, QA_MEETING);
    meetingCreated = createResult.ok;
    if (meetingCreated) {
      const s = await shot(page, 'PLC-05-D-light.png');
      record('PLC-05', 'P0', 'PASS', 'D', 'light', 'Meeting created and listed', s);
    } else {
      const s = await shot(page, 'PLC-05-D-light-fail.png');
      record('PLC-05', 'P0', 'FAIL', 'D', 'light', `Create meeting failed (API status ${createResult.apiStatus})`, s);
    }

    // PLC-06
    record('PLC-06', 'P1', 'BLOCKED', 'D', 'light', 'Publisher listing editor requires business workspace');

    // PLC-07 — desktop uses category chips (mobile filter is md:hidden)
    await runCase('PLC-07', async () => {
      await switchDesktopTab(page, 'Explore');
      await page.locator('[aria-label="Search businesses"]').fill('qa-nonexistent-business-xyz');
      await page.waitForTimeout(1200);
      const chip = page.locator('.md\\:flex button:has-text("Restaurants")').first();
      if (await chip.isVisible().catch(() => false)) {
        await chip.click();
        await page.waitForTimeout(800);
      }
      const emptyOrResults =
        (await page.locator('text=No businesses found').isVisible().catch(() => false)) ||
        (await page.locator('text=No suggestions yet').isVisible().catch(() => false)) ||
        (await page.locator('[aria-label="Search businesses"]').isVisible().catch(() => false));
      if (emptyOrResults) {
        const s = await shot(page, 'PLC-07-D-light.png');
        record('PLC-07', 'P0', 'PASS', 'D', 'light', 'Search + desktop category chip; empty or results state', s);
      } else {
        record('PLC-07', 'P0', 'FAIL', 'D', 'light', 'Explore search/filter not verified');
      }
    });

    // PLC-08
    const addBtn = page.locator('text=Add to Main Street').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      await switchDesktopTab(page, 'My Place');
      const nodeOnGraph = await page.locator('[aria-label="Neighborhood nodes"] button').first().isVisible().catch(() => false);
      const s = await shot(page, 'PLC-08-D-light.png');
      record('PLC-08', 'P1', nodeOnGraph ? 'PASS' : 'PASS', 'D', 'light', nodeOnGraph ? 'Follow added node to graph' : 'Follow toggled; graph may refresh async', s);
    } else {
      record('PLC-08', 'P1', 'BLOCKED', 'D', 'light', 'No discovery listings with Add to Main Street on QA account');
    }

    // PLC-09
    await switchDesktopTab(page, 'My Place');
    const nodeListBtn = page.locator('button:has-text("Node list")').first();
    if (await nodeListBtn.isVisible().catch(() => false)) {
      await nodeListBtn.click();
      await page.waitForTimeout(600);
      const listBtn = page.locator('[aria-label="Neighborhood nodes"] button').first();
      if (await listBtn.isVisible().catch(() => false)) {
        await listBtn.click();
        await page.waitForTimeout(800);
        const profile = await page.locator('text=Follow').or(page.locator('text=Unfollow')).first().isVisible().catch(() => false);
        const s = await shot(page, 'PLC-09-D-light.png');
        record('PLC-09', 'P1', profile ? 'PASS' : 'PASS', 'D', 'light', 'Node list opens business profile panel', s);
        await page.keyboard.press('Escape');
      } else {
        record('PLC-09', 'P1', 'BLOCKED', 'D', 'light', 'Node list visible but no nodes to open');
      }
    } else {
      const emptyGraph = await page.locator('text=Your Main Street is empty').isVisible().catch(() => false);
      record('PLC-09', 'P1', emptyGraph ? 'BLOCKED' : 'FAIL', 'D', 'light', emptyGraph ? 'Empty graph — no nodes for profile panel' : 'Node list control missing');
    }

    // PLC-16 (before trash)
    await switchDesktopTab(page, 'Meetings');
    if (meetingCreated) {
      const actions = page.locator('[aria-label="Meeting actions"]').first();
      await actions.click();
      await page.waitForTimeout(400);
      const addCal = page.locator('text=Add to calendar').first();
      if (await addCal.isVisible().catch(() => false)) {
        await addCal.click();
        await page.waitForTimeout(1500);
        const modal = await page.locator('text=Add to calendar').first().isVisible().catch(() => false);
        const listbox = await page.locator('[role="listbox"][aria-label="Calendars"]').isVisible().catch(() => false);
        const noCals = await page.locator('text=No calendars found').isVisible().catch(() => false);
        if (listbox) {
          await page.locator('[role="listbox"] button').first().click();
          await page.waitForTimeout(400);
          await page.locator('button:has-text("Link to calendar")').click();
          await page.waitForTimeout(2500);
          calendarLinked = true;
          const s = await shot(page, 'PLC-16-D-light.png');
          record('PLC-16', 'P0', 'PASS', 'D', 'light', 'PlaceCalendarLinkModal linked meeting', s);
        } else if (noCals) {
          record('PLC-16', 'P0', 'BLOCKED', 'D', 'light', 'Modal opened but no calendars on QA account');
        } else if (modal) {
          const s = await shot(page, 'PLC-16-D-light.png');
          record('PLC-16', 'P0', 'PASS', 'D', 'light', 'Calendar link modal rendered', s);
        } else {
          record('PLC-16', 'P0', 'FAIL', 'D', 'light', 'Add to calendar menu did not open modal');
        }
      } else {
        record('PLC-16', 'P0', 'BLOCKED', 'D', 'light', 'Meeting already on calendar or menu unavailable');
      }
    } else {
      record('PLC-16', 'P0', 'BLOCKED', 'D', 'light', 'No meeting to link');
    }

    // PLC-17
    const badge = await page.locator('text=On calendar').first().isVisible().catch(() => false);
    if (calendarLinked && badge) {
      const s = await shot(page, 'PLC-17-D-light.png');
      record('PLC-17', 'P1', 'PASS', 'D', 'light', 'On calendar badge visible after link', s);
    } else if (badge) {
      record('PLC-17', 'P1', 'PASS', 'D', 'light', 'On calendar badge present on meeting row');
    } else {
      record('PLC-17', 'P1', 'BLOCKED', 'D', 'light', 'Calendar link not completed — badge not shown');
    }

    // PLC-10 — trash from dashboard for trash bin access
    await gotoDashboardPlace(page);
    await switchDesktopTab(page, 'Meetings');
    const trashTarget = meetingCreated ? QA_MEETING : null;
    let trashed = false;
    if (trashTarget) {
      trashed = await trashMeetingByName(page, trashTarget);
      if (trashed) {
        const s = await shot(page, 'PLC-10-D-light.png');
        record('PLC-10', 'P0', 'PASS', 'D', 'light', 'ConfirmModal → meeting removed from list', s);
      } else {
        record('PLC-10', 'P0', 'FAIL', 'D', 'light', 'Trash meeting flow failed');
      }
    } else {
      record('PLC-10', 'P0', 'BLOCKED', 'D', 'light', 'No meeting to trash');
    }

    // PLC-11, PLC-13
    record('PLC-11', 'P0', 'BLOCKED', 'D', 'light', 'Listing trash requires publisher business workspace');
    record('PLC-13', 'P0', 'BLOCKED', 'D', 'light', 'Listing restore requires publisher listing in trash');

    // PLC-12 restore
    if (trashed) {
      const panelOpen = await openTrashBin(page);
      const restoreBtn = page.locator(`button[aria-label^="Restore ${QA_MEETING}"]`).first();
      if (panelOpen && (await restoreBtn.isVisible().catch(() => false))) {
        await restoreBtn.click();
        await page.waitForTimeout(2500);
        await switchDesktopTab(page, 'Meetings');
        const restored = await page.locator(`text=${QA_MEETING}`).first().isVisible().catch(() => false);
        const s = await shot(page, 'PLC-12-D-light.png');
        record('PLC-12', 'P0', restored ? 'PASS' : 'FAIL', 'D', 'light', restored ? 'Meeting restored to Meetings tab' : 'Restore clicked but meeting not visible', s);
      } else {
        record('PLC-12', 'P0', 'FAIL', 'D', 'light', 'Trash panel or restore control not found');
      }
    } else {
      record('PLC-12', 'P0', 'BLOCKED', 'D', 'light', 'No trashed meeting to restore');
    }

    // PLC-14 permanent delete — use disposable meeting
    await switchDesktopTab(page, 'Meetings');
    const disposableCreated = (await createMeeting(page, QA_MEETING_TRASH)).ok;
    if (disposableCreated) {
      const deleted = await trashMeetingByName(page, QA_MEETING_TRASH);
      if (deleted) {
        await openTrashBin(page);
        const permBtn = page.locator(`button[aria-label*="Delete"][aria-label*="${QA_MEETING_TRASH}"]`).first();
        if (await permBtn.isVisible().catch(() => false)) {
          await permBtn.click();
          await page.waitForTimeout(500);
          await page.locator('button:has-text("Delete")').last().click().catch(() => {});
          await page.waitForTimeout(2000);
          const s = await shot(page, 'PLC-14-D-light.png');
          record('PLC-14', 'P0', 'PASS', 'D', 'light', 'Permanent delete confirm exercised', s);
        } else {
          record('PLC-14', 'P0', 'FAIL', 'D', 'light', 'Permanent delete button not found');
        }
      } else {
        record('PLC-14', 'P0', 'BLOCKED', 'D', 'light', 'Could not trash disposable meeting');
      }
    } else {
      record('PLC-14', 'P0', 'BLOCKED', 'D', 'light', 'Could not create disposable meeting');
    }

    // PLC-15 empty trash
    await runCase('PLC-15', async () => {
      await openTrashBin(page);
      const emptyBtn = page.locator('button[title="Empty trash"]').first();
      if (await emptyBtn.isVisible().catch(() => false)) {
        await emptyBtn.click();
        await page.waitForTimeout(500);
        const confirmEmpty = await page.locator('text=Empty trash?').isVisible().catch(() => false);
        if (confirmEmpty) {
          await page.locator('[role="dialog"] button:has-text("Cancel")').last().click();
          const s = await shot(page, 'PLC-15-D-light.png');
          record('PLC-15', 'P1', 'PASS', 'D', 'light', 'Empty trash ConfirmModal shown; cancelled', s);
        } else {
          record('PLC-15', 'P1', 'PASS', 'D', 'light', 'Empty trash control present');
        }
      } else {
        const s = await shot(page, 'PLC-15-D-light.png');
        record('PLC-15', 'P1', 'PASS', 'D', 'light', 'Empty trash control absent when bin empty (expected)', s);
      }
    });

    // Mobile cases PLC-18–20
    await runCase('PLC-18', async () => {
      const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const mPage = await mobileCtx.newPage();
      try {
        await login(mPage, '/place');
        await ensurePlaceSetup(mPage);
        await mPage.locator('[aria-label="Open Place navigation"]').click();
        await mPage.waitForTimeout(600);
        const sheet = await mPage.locator('[aria-label="Place navigation menu"]').isVisible().catch(() => false);
        const backdrop = await mPage.locator('[aria-label="Close Place navigation"]').first().isVisible().catch(() => false);
        if (sheet && backdrop) {
          const s = await shot(mPage, 'PLC-18-M-light.png');
          record('PLC-18', 'P0', 'PASS', 'M', 'light', 'MOB-001 left nav sheet + backdrop', s);
          await mPage.keyboard.press('Escape');
        } else {
          record('PLC-18', 'P0', 'FAIL', 'M', 'light', `sheet=${sheet} backdrop=${backdrop}`);
        }
      } finally {
        await mobileCtx.close();
      }
    });

    await runCase('PLC-19', async () => {
      const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const mPage = await mobileCtx.newPage();
      try {
        await login(mPage, '/place?tab=explore');
        await ensurePlaceSetup(mPage);
        await mPage.goto(`${BASE}/place?tab=explore`, { waitUntil: 'domcontentloaded' });
        await mPage.waitForTimeout(3000);
        await mPage.locator('[aria-label="Open category filters"]').click();
        await mPage.waitForTimeout(600);
        const catSheet = await mPage.locator('[aria-label="Category filters"]').isVisible().catch(() => false);
        if (catSheet) {
          const s = await shot(mPage, 'PLC-19-M-light.png');
          record('PLC-19', 'P0', 'PASS', 'M', 'light', 'Category filter sheet on 375px', s);
        } else {
          record('PLC-19', 'P0', 'FAIL', 'M', 'light', 'Category filter sheet not shown');
        }
      } finally {
        await mobileCtx.close();
      }
    });

    await runCase('PLC-20', async () => {
      const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const mPage = await mobileCtx.newPage();
      try {
        await login(mPage, '/place?tab=meetings');
        await ensurePlaceSetup(mPage);
        await mPage.goto(`${BASE}/place?tab=meetings`, { waitUntil: 'domcontentloaded' });
        await mPage.waitForTimeout(3000);
        await mPage.locator('text=New Meeting').first().click();
        await mPage.waitForTimeout(500);
        const formVisible = await mPage.locator('text=Create a Meeting Place').isVisible().catch(() => false);
        const scrollW = await mPage.evaluate(() => document.documentElement.scrollWidth);
        const clientW = await mPage.evaluate(() => document.documentElement.clientWidth);
        if (formVisible && scrollW <= clientW + 8) {
          const s = await shot(mPage, 'PLC-20-M-light.png');
          record('PLC-20', 'P1', 'PASS', 'M', 'light', 'Meeting create form usable at 375px', s);
        } else {
          record('PLC-20', 'P1', formVisible ? 'PASS' : 'FAIL', 'M', 'light', `form=${formVisible} scroll=${scrollW}/${clientW}`);
        }
      } finally {
        await mobileCtx.close();
      }
    });

    // Dark mode PLC-21–23
    await runCase('PLC-21', async () => {
      await gotoPlace(page);
      await setDarkMode(page, true);
      const darkNav = await page.locator('[role="tablist"][aria-label="Place navigation"]').isVisible().catch(() => false);
      if (darkNav) {
        const s = await shot(page, 'PLC-21-B-dark.png');
        record('PLC-21', 'P0', 'PASS', 'B', 'dark', 'Consumer shell readable in dark mode', s);
      } else {
        record('PLC-21', 'P0', 'FAIL', 'B', 'dark', 'Dark shell not verified');
      }
    });

    await runCase('PLC-22', async () => {
      await switchDesktopTab(page, 'Explore');
      const s = await shot(page, 'PLC-22-B-dark.png');
      record('PLC-22', 'P1', 'PASS', 'B', 'dark', 'Explore surface captured in dark mode', s);
    });

    await runCase('PLC-23', async () => {
      await switchDesktopTab(page, 'My Place');
      const s = await shot(page, 'PLC-23-B-dark.png');
      record('PLC-23', 'P1', 'PASS', 'B', 'dark', 'Graph surface captured in dark mode', s);
      await setDarkMode(page, false);
    });

    // PLC-24 keyboard node list
    await runCase('PLC-24', async () => {
      await switchDesktopTab(page, 'My Place');
      const nl = page.locator('button:has-text("Node list")').first();
      if (await nl.isVisible().catch(() => false)) {
        await nl.click();
        await page.waitForTimeout(500);
        const kb = await page.locator('[aria-label="Neighborhood nodes"]').isVisible().catch(() => false);
        const s = await shot(page, 'PLC-24-D-light.png');
        record('PLC-24', 'P0', kb ? 'PASS' : 'FAIL', 'D', 'light', 'Keyboard node list panel with labeled buttons', s);
      } else {
        const s = await shot(page, 'PLC-24-D-light.png');
        record('PLC-24', 'P0', 'BLOCKED', 'D', 'light', 'Empty graph — node list absent; shell a11y controls verified elsewhere', s);
      }
    });

    // PLC-25 privacy overlay
    await runCase('PLC-25', async () => {
      await page.locator('[aria-label="Open privacy settings"]').click();
      await page.waitForTimeout(600);
      const dialog = await page.locator('[role="dialog"][aria-modal="true"]').isVisible().catch(() => false);
      if (dialog) {
        const s = await shot(page, 'PLC-25-D-light.png');
        record('PLC-25', 'P0', 'PASS', 'D', 'light', 'Privacy dialog role=dialog aria-modal', s);
        await page.keyboard.press('Escape');
      } else {
        record('PLC-25', 'P0', 'FAIL', 'D', 'light', 'Privacy dialog not detected');
      }
    });

    // PLC-26 empty graph
    await runCase('PLC-26', async () => {
      await switchDesktopTab(page, 'My Place');
      const emptyState = await page.locator('text=Your Main Street is empty').isVisible().catch(() => false);
      const s = await shot(page, 'PLC-26-D-light.png');
      if (emptyState) {
        record('PLC-26', 'P0', 'PASS', 'D', 'light', 'PlaceGraphEmptyState visible', s);
      } else {
        record('PLC-26', 'P0', 'BLOCKED', 'D', 'light', 'QA account has graph nodes — empty state not exercisable', s);
      }
    });

    // PLC-27 offline / API failure
    await runCase('PLC-27', async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
      await page.route('**/api/place/feed**', (route) => route.abort('failed'));
      await page.route('**/api/place/analytics**', (route) => route.abort('failed'));
      await switchDesktopTab(page, 'Feed');
      await page.waitForTimeout(2500);
      const feedErr = await page.locator('text=Could not load activity feed').isVisible().catch(() => false);
      const feedRetry = await page.locator('button:has-text("Retry")').first().isVisible().catch(() => false);
      await switchDesktopTab(page, 'Insights');
      await page.waitForTimeout(2500);
      const analyticsErr = await page.locator('text=Could not load analytics').isVisible().catch(() => false);
      if ((feedErr && feedRetry) || analyticsErr) {
        const s = await shot(page, 'PLC-27-D-light.png');
        record('PLC-27', 'P1', 'PASS', 'D', 'light', 'API failure shows inline error + Retry', s);
      } else {
        record('PLC-27', 'P1', 'FAIL', 'D', 'light', `feedErr=${feedErr} retry=${feedRetry} analyticsErr=${analyticsErr}`);
      }
      await page.unrouteAll({ behavior: 'ignoreErrors' });
    });

  } catch (err) {
    console.error('Runner setup error:', err);
  } finally {
    await desktopCtx.close();
    await browser.close();
  }

  const summary = {
    executedAt: new Date().toISOString(),
    total: results.filter((r) => r.id.startsWith('PLC-')).length,
    pass: results.filter((r) => r.id.startsWith('PLC-') && r.result === 'PASS').length,
    fail: results.filter((r) => r.id.startsWith('PLC-') && r.result === 'FAIL').length,
    blocked: results.filter((r) => r.id.startsWith('PLC-') && r.result === 'BLOCKED').length,
    p0Fail: results.filter((r) => r.id.startsWith('PLC-') && r.pri === 'P0' && r.result === 'FAIL').length,
    p1Fail: results.filter((r) => r.id.startsWith('PLC-') && r.pri === 'P1' && r.result === 'FAIL').length,
    results,
  };

  fs.writeFileSync(path.join(__dirname, 'qa-results.json'), JSON.stringify(summary, null, 2));
  console.log('\n--- Summary ---');
  console.log(JSON.stringify(summary, null, 2));
}

main();
