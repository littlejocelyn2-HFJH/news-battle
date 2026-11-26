/**
 * 全校讀報連線爭霸戰：排行榜＋全校展示牆後端（Google 試算表 + 雲端硬碟 + Apps Script）
 *
 * 部署：試算表 → 擴充功能 → Apps Script → 貼上本檔 → 改第 10 行密碼
 *      → 部署 → 新增部署作業 → 網頁應用程式（執行身分：我；存取：所有人）
 *      → 把 /exec 網址填進 config.js 的 sheetApi
 * 第一次部署時 Google 會要求授權「試算表」與「雲端硬碟」：展示牆的照片存在你雲端硬碟的「讀報展示牆」資料夾，
 * 檔案不公開分享，由本程式讀出給展示牆顯示。
 */
const PASSWORD = 'change-me';      // ← 改成 10 字以上、英數混合的老師密碼
const CLASSES = [];                // 可限定班級，例如 ['701','702','801']；空白＝不限
const MAX_CELLS = 25, MAX_LINES = 12, MAX_PRIZES = 5, MAX_POINTS = 300;   // 支援 3×3、4×4、5×5
const SHEET = '排行榜';
const HEAD = ['場次', '班級', '完成格數', '連線數', '大獎數', '達成時間', '最後更新', '總分', '牌面存檔'];
const MAX_STATE = 4000;
const WALL = '展示牆';
const WALL_HEAD = ['編號', '場次', '班級', '任務編號', '任務', '文字', '照片檔案', '上傳時間', '隱藏'];
const FOLDER = '讀報展示牆';
const MAX_PHOTOS = 3, MAX_PHOTO_B64 = 2500000, MAX_TEXT = 300, POSTS_PER_10MIN = 20;

function doGet() {
  return out({ ok: true, app: '全校讀報連線爭霸戰', time: new Date().toISOString() });
}

function doPost(e) {
  let req = {};
  try { req = JSON.parse(e.postData.contents || '{}'); } catch (err) { return out({ ok: false, error: 'bad json' }); }
  const round = clean(req.round, 40) || '預設';
  try {
    if (req.action === 'save') return out(save(round, req));
    if (req.action === 'list') return out({ ok: true, rows: list(round), now: Date.now() });
    if (req.action === 'load') return out(loadState(round, req.cls));
    if (req.action === 'clear') return out(clearRound(round, req.password));
    if (req.action === 'post') return out(post(round, req));
    if (req.action === 'wall') return out(wall(round, req.password));
    if (req.action === 'file') return out(file(req.id, req.password));
    if (req.action === 'hide') return out(hide(req.id, !!req.hidden, req.password));
    if (req.action === 'login') { const pw = checkPw(req.password); return out(pw === true ? { ok: true } : pw); }
    return out({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function save(round, req) {
  const cls = clean(req.cls, 6);
  if (!/^[0-9A-Za-z一-鿿]{1,6}$/.test(cls)) return { ok: false, error: 'bad class' };
  if (CLASSES.length && CLASSES.indexOf(cls) < 0) return { ok: false, error: 'class not allowed' };
  const done = clampInt(req.done, MAX_CELLS), lines = clampInt(req.lines, MAX_LINES), prizes = clampInt(req.prizes, MAX_PRIZES), points = clampInt(req.points, MAX_POINTS);
  let st = '';                                       // 牌面存檔（換電腦也能接著玩）
  if (req.state) { try { st = JSON.stringify(req.state); } catch (e) { st = ''; } if (st.length > MAX_STATE) st = ''; }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = sheet(), data = sh.getDataRange().getValues(), now = new Date();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === round && String(data[i][1]) === cls) {
        const oldKey = (Number(data[i][7]) || 0) * 1e6 + Number(data[i][3]) * 1000 + Number(data[i][2]);
        const newKey = points * 1e6 + lines * 1000 + done;
        const reached = newKey > oldKey ? now : (data[i][5] || now);
        sh.getRange(i + 1, 3, 1, 7).setValues([[done, lines, prizes, reached, now, points, st || data[i][8] || '']]);
        return { ok: true };
      }
    }
    sh.appendRow([safe(round), safe(cls), done, lines, prizes, now, now, points, st]);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function list(round) {
  const data = sheet().getDataRange().getValues(), rows = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).replace(/^'/, '') !== round) continue;
    rows.push({
      cls: String(data[i][1]).replace(/^'/, ''), done: Number(data[i][2]) || 0, lines: Number(data[i][3]) || 0,
      prizes: Number(data[i][4]) || 0, reachedAt: time(data[i][5]), updatedAt: time(data[i][6]), points: Number(data[i][7]) || 0
    });
  }
  return rows;
}

// 密碼檢查：錯 5 次鎖 10 分鐘；預設密碼 change-me 一律視為錯誤
function checkPw(password) {
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('fails') || 0);
  if (fails >= 5) return { ok: false, error: '密碼錯太多次，請 10 分鐘後再試' };
  if (PASSWORD === 'change-me' || String(password || '') !== PASSWORD) {
    cache.put('fails', String(fails + 1), 600);
    return { ok: false, error: '密碼錯誤' };
  }
  cache.remove('fails');
  return true;
}

function loadState(round, cls) {
  cls = clean(cls, 6);
  const data = sheet().getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (unq(data[i][0]) === round && unq(data[i][1]) === cls) {
      let st = null; try { st = JSON.parse(String(data[i][8] || '')); } catch (e) {}
      return { ok: true, state: st };
    }
  }
  return { ok: true, state: null };
}

function clearRound(round, password) {
  const pw = checkPw(password); if (pw !== true) return pw;
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = sheet(), data = sh.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][0]).replace(/^'/, '') === round) sh.deleteRow(i + 1);
    }
    return { ok: true };
  } finally { lock.releaseLock(); }
}


// ================= 全校展示牆 =================
function post(round, req) {
  const cls = clean(req.cls, 6);
  if (!/^[0-9A-Za-z一-鿿]{1,6}$/.test(cls)) return { ok: false, error: '班級格式不對' };
  if (CLASSES.length && CLASSES.indexOf(cls) < 0) return { ok: false, error: '這個班級不在名單上' };
  const taskId = clampInt(req.taskId, 99), title = clean(req.title, 30), text = clean(req.text, MAX_TEXT);
  const photos = Array.isArray(req.photos) ? req.photos.slice(0, MAX_PHOTOS) : [];
  if (!text && !photos.length) return { ok: false, error: '請拍照或寫字再上傳' };
  // 限制上傳頻率：同一班 10 分鐘最多 POSTS_PER_10MIN 則
  const cache = CacheService.getScriptCache(), ck = 'p_' + round + '_' + cls, n = Number(cache.get(ck) || 0);
  if (n >= POSTS_PER_10MIN) return { ok: false, error: '上傳太頻繁，請稍後再試' };
  cache.put(ck, String(n + 1), 600);

  const ids = [];
  if (photos.length) {
    const folder = wallFolder(round);
    photos.forEach((ph, k) => {
      const mime = String(ph && ph.mime || '');
      const data = String(ph && ph.data || '');
      if (!/^image\/(jpeg|png|webp)$/.test(mime) || !data || data.length > MAX_PHOTO_B64) return;
      const blob = Utilities.newBlob(Utilities.base64Decode(data), mime, cls + '_' + taskId + '_' + Date.now() + '_' + k + '.jpg');
      ids.push(folder.createFile(blob).getId());     // 不公開分享，只由本程式讀出
    });
    if (!ids.length && !text) return { ok: false, error: '照片格式不對或太大' };
  }
  const id = Utilities.getUuid().slice(0, 8);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    wallSheet().appendRow([id, safe(round), safe(cls), taskId, safe(title), safe(text), ids.join(','), new Date(), false]);
  } finally { lock.releaseLock(); }
  return { ok: true, id: id };
}

function wall(round, password) {
  const teacher = password ? checkPw(password) === true : false;
  const data = wallSheet().getDataRange().getValues(), posts = [];
  for (let i = 1; i < data.length; i++) {
    if (unq(data[i][1]) !== round) continue;
    const hidden = data[i][8] === true || String(data[i][8]).toUpperCase() === 'TRUE';
    if (hidden && !teacher) continue;
    posts.push({ id: String(data[i][0]), cls: unq(data[i][2]), taskId: Number(data[i][3]) || 0, title: unq(data[i][4]),
      text: unq(data[i][5]), photos: String(data[i][6] || '').split(',').filter(String), time: time(data[i][7]), hidden: hidden });
  }
  return { ok: true, posts: posts, teacher: teacher };
}

// 只讀出「展示牆有登記、且未隱藏」的照片，不能拿來讀雲端硬碟其他檔案
function file(id, password) {
  id = clean(id, 100);
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) return { ok: false, error: 'bad id' };
  const data = wallSheet().getDataRange().getValues();
  let row = null;
  for (let i = 1; i < data.length; i++) { if (String(data[i][6] || '').split(',').indexOf(id) >= 0) { row = data[i]; break; } }
  if (!row) return { ok: false, error: 'not found' };
  const hidden = row[8] === true || String(row[8]).toUpperCase() === 'TRUE';
  if (hidden && checkPw(password) !== true) return { ok: false, error: 'hidden' };
  const blob = DriveApp.getFileById(id).getBlob();
  return { ok: true, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

function hide(id, hidden, password) {
  const pw = checkPw(password); if (pw !== true) return pw;
  const sh = wallSheet(), data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sh.getRange(i + 1, 9).setValue(hidden); return { ok: true }; }
  }
  return { ok: false, error: 'not found' };
}

function wallSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(WALL);
  if (!sh) { sh = ss.insertSheet(WALL); sh.appendRow(WALL_HEAD); sh.setFrozenRows(1); }
  return sh;
}
function wallFolder(round) {
  const it = DriveApp.getFoldersByName(FOLDER);
  const root = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER);
  const name = String(round).replace(/[\\/:*?"<>|]/g, '_');
  const sub = root.getFoldersByName(name);
  return sub.hasNext() ? sub.next() : root.createFolder(name);
}
function unq(v) { return String(v == null ? '' : v).replace(/^'/, ''); }

// ---- 工具 ----
function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEAD); sh.setFrozenRows(1); }
  else if (sh.getLastColumn() < HEAD.length) sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]);
  return sh;
}
function clean(v, n) { return String(v == null ? '' : v).trim().slice(0, n); }
function safe(v) { v = String(v); return /^[=+\-@]/.test(v) ? "'" + v : v; }   // 防試算表公式注入
function clampInt(v, max) { v = Math.floor(Number(v) || 0); return Math.max(0, Math.min(max, v)); }
function time(v) { return v instanceof Date ? v.getTime() : (Number(new Date(v)) || 0); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
