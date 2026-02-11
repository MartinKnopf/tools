// Spam deletion task - email sorting mini-game
// Outlook Express 98 style: all gameplay inside the email window

import { gameState, saveState } from '../engine/state.js';
import { randomChoice, randomSample, generateId } from '../engine/utils.js';
import { registerEffect, isEffectEnabled } from '../engine/effects.js';
import {
  drawEmailIcon,
  createFileIconCanvas,
  drawNetworkIcon,
  drawNetworkIconActive,
  drawShieldIcon,
  drawShieldIconActive
} from '../engine/icons.js';
import {
  clearDesktop,
  createWindow,
  updateScore
} from '../engine/ui.js';
import { registerTask, onWaveComplete } from '../engine/waves.js';

// ==================== COMBO TRACKING ====================

let comboCount = 0;

// ==================== EMAIL DATA POOLS ====================

const LEGIT_EMAILS = [
  { sender: 'mom@gmail.com', from: 'Mom', subject: 'Dinner Sunday?', preview: 'Hi sweetie, are we still on for dinner this weekend? Dad is making his famous lasagna.' },
  { sender: 'jsmith@company.com', from: 'John Smith', subject: 'Q3 Report attached', preview: 'Hi team, please find the Q3 report attached. Let me know if you have questions.' },
  { sender: 'noreply@amazon.com', from: 'Amazon', subject: 'Your order has shipped', preview: 'Your package #123-4567890 has shipped and will arrive by Thursday.' },
  { sender: 'boss@company.com', from: 'Sarah Chen', subject: 'Team meeting at 3pm', preview: 'Hi all, reminder that our weekly standup is at 3pm today in the main conference room.' },
  { sender: 'dave@gmail.com', from: 'Dave', subject: 'BBQ this Saturday?', preview: 'Hey! We\'re having a BBQ this Saturday around noon. You and the family should come!' },
  { sender: 'hr@company.com', from: 'HR Department', subject: 'Benefits enrollment reminder', preview: 'Open enrollment for health benefits ends Friday. Please review your options.' },
  { sender: 'noreply@netflix.com', from: 'Netflix', subject: 'New arrivals this week', preview: 'Check out what\'s new on Netflix this week, including the new season of...' },
  { sender: 'lisa@company.com', from: 'Lisa Park', subject: 'Lunch today?', preview: 'Hey, want to grab lunch at that new Thai place? I heard it\'s really good.' },
  { sender: 'noreply@github.com', from: 'GitHub', subject: 'Security alert for your repo', preview: 'We found a potential security vulnerability in one of your dependencies.' },
  { sender: 'dentist@smileclinic.com', from: 'Smile Clinic', subject: 'Appointment reminder', preview: 'This is a reminder of your dental appointment on Tuesday at 2:00 PM.' },
  { sender: 'noreply@bank.com', from: 'First National Bank', subject: 'Monthly statement ready', preview: 'Your January statement is now available. Log in to view your account activity.' },
  { sender: 'tom@gmail.com', from: 'Tom Wilson', subject: 'Photos from the trip', preview: 'Hey! Finally got around to uploading the photos from our hiking trip last month.' },
  { sender: 'noreply@spotify.com', from: 'Spotify', subject: 'Your weekly playlist is ready', preview: 'Discover Weekly has been updated with 30 fresh tracks picked just for you.' },
  { sender: 'teacher@school.edu', from: 'Ms. Rodriguez', subject: 'Parent-teacher conference', preview: 'Dear parents, please sign up for a conference slot using the link below.' },
  { sender: 'garage@autofix.com', from: 'AutoFix Garage', subject: 'Your car is ready', preview: 'Your vehicle service is complete. You can pick up your car anytime today.' },
  { sender: 'noreply@linkedin.com', from: 'LinkedIn', subject: '3 people viewed your profile', preview: 'See who viewed your profile this week and new job opportunities.' },
  { sender: 'karen@company.com', from: 'Karen Liu', subject: 'Updated project timeline', preview: 'Hi, I\'ve updated the project timeline based on our discussion. Please review.' },
  { sender: 'brother@yahoo.com', from: 'Mike', subject: 'Happy birthday!', preview: 'Happy birthday bro! Hope you have an awesome day. Let\'s catch up soon.' },
  { sender: 'noreply@steam.com', from: 'Steam', subject: 'Your wishlist item is on sale', preview: 'An item on your wishlist is now 50% off during the weekend sale.' },
  { sender: 'vet@pawsclinic.com', from: 'Paws Clinic', subject: 'Vaccination due for Max', preview: 'Max is due for his annual vaccinations. Please schedule an appointment.' }
];

// Spam emails organized by difficulty tier
const SPAM_EMAILS = {
  obvious: [
    { sender: 'winner@freelotto.ru', from: 'FREE LOTTO', subject: 'YOU WON $5,000,000!!!', preview: 'CLICK HERE NOW TO CLAIM YOUR PRIZE!!! ACT FAST BEFORE IT EXPIRES!!!' },
    { sender: 'prince@nigeria.ng', from: 'Prince Abubakar', subject: 'URGENT BUSINESS PROPOSAL!!!', preview: 'I AM PRINCE ABUBAKAR AND I NEED YOUR HELP TO TRANSFER $15 MILLION USD' },
    { sender: 'sexy@hotchicks.xxx', from: 'Hot Singles', subject: '18+ HOT SINGLES IN YOUR AREA', preview: 'LONELY WOMEN WANT TO MEET YOU TONIGHT! CLICK HERE FOR FREE' },
    { sender: 'pills@cheapmeds.cn', from: 'Discount Pharmacy', subject: 'V1AGRA 90% OFF!!!', preview: 'BUY CHEAP MEDS NO PRESCRIPTION NEEDED!!! OVERNIGHT SHIPPING!!!' },
    { sender: 'winner@euromill.tk', from: 'EURO MILLIONS', subject: 'CONGRATULATIONS YOU WON!!!', preview: 'YOUR EMAIL WAS SELECTED IN OUR RANDOM DRAWING! SEND YOUR DETAILS TO CLAIM' },
    { sender: 'free@iphone15.win', from: 'Apple Promo', subject: 'FREE iPHONE 15! CLICK NOW!', preview: 'YOU HAVE BEEN CHOSEN TO RECEIVE A FREE IPHONE! JUST PAY SHIPPING $1.99' },
    { sender: 'money@fastcash.biz', from: 'Fast Cash Now', subject: 'MAKE $5000/DAY FROM HOME!!!', preview: 'DISCOVER THE SECRET MILLIONAIRES DON\'T WANT YOU TO KNOW!!!' },
    { sender: 'diet@miraclepill.ru', from: 'Weight Loss', subject: 'LOSE 30 LBS IN 30 DAYS!!!', preview: 'DOCTORS HATE THIS ONE WEIRD TRICK! NO EXERCISE NEEDED!!!' }
  ],
  moderate: [
    { sender: 'security@paypa1.com', from: 'PayPal Security', subject: 'Account verification required', preview: 'We detected unusual activity on your account. Please verify your identity.' },
    { sender: 'support@micros0ft.com', from: 'Microsoft Support', subject: 'Your account has been locked', preview: 'Your Microsoft account was accessed from an unknown location. Click to verify.' },
    { sender: 'shipping@fedx.com', from: 'FedEx Delivery', subject: 'Package delivery failed', preview: 'We were unable to deliver your package. Click here to reschedule delivery.' },
    { sender: 'noreply@app1e.com', from: 'Apple ID', subject: 'Your Apple ID was used to sign in', preview: 'If you did not sign in on a new device, your account may be compromised.' },
    { sender: 'refund@irs-gov.org', from: 'IRS Tax Refund', subject: 'Tax refund pending - action needed', preview: 'Your federal tax refund of $3,247.00 is pending. Confirm your bank details.' },
    { sender: 'alert@chasebank.info', from: 'Chase Alert', subject: 'Suspicious transaction detected', preview: 'A transaction of $892.50 was flagged. If this was not you, click here.' },
    { sender: 'noreply@dropb0x.com', from: 'Dropbox Team', subject: 'Someone shared a file with you', preview: 'Click to view the shared document. The link will expire in 24 hours.' },
    { sender: 'billing@netf1ix.com', from: 'Netflix Billing', subject: 'Payment declined - update needed', preview: 'We were unable to process your monthly payment. Update your billing info.' }
  ],
  subtle: [
    { sender: 'billing@arnazon.com', from: 'Amazon Billing', subject: 'Problem with your recent order', preview: 'Dear valued customer, there was an issue processing your order #789-012.' },
    { sender: 'noreply@linkedln.com', from: 'LinkedIn', subject: 'You have 5 new connection requests', preview: 'Review your pending connection requests and grow your professional network.' },
    { sender: 'support@goggle.com', from: 'Google Support', subject: 'Storage almost full', preview: 'Your Google account storage is 98% full. Upgrade now to avoid losing files.' },
    { sender: 'service@spotlfy.com', from: 'Spotify', subject: 'Your premium subscription expired', preview: 'Your Spotify Premium subscription has expired. Renew now to keep your playlists.' },
    { sender: 'noreply@arnazon.co', from: 'Amazon', subject: 'Delivery attempted - not home', preview: 'We attempted to deliver your package today. Schedule a new delivery window.' },
    { sender: 'admin@company-hr.net', from: 'IT Department', subject: 'Password expires in 24 hours', preview: 'Your network password will expire soon. Click here to reset it now.' },
    { sender: 'noreply@githuub.com', from: 'GitHub', subject: 'New sign-in from Chrome on Windows', preview: 'A new sign-in was detected on your account. Review your active sessions.' },
    { sender: 'help@stearn.com', from: 'Steam Support', subject: 'Trade offer requires confirmation', preview: 'You have a pending trade offer. Confirm or decline within 7 days.' }
  ],
  expert: [
    { sender: 'cfo@company.net.cn', from: 'David Brown (CFO)', subject: 'Wire transfer needed ASAP', preview: 'Hi, I need you to process an urgent wire transfer of $42,000 today.' },
    { sender: 'noreply@arnazon.com', from: 'Amazon', subject: 'Your order #402-8891 has shipped', preview: 'Track your package delivery. Estimated arrival: 2 business days.' },
    { sender: 'it-admin@cornpany.com', from: 'IT Admin', subject: 'Mandatory security update', preview: 'Please install the attached security patch immediately. Required by EOD.' },
    { sender: 'sarah.chen@company.co', from: 'Sarah Chen', subject: 'Re: Budget meeting follow-up', preview: 'Thanks for the update. Can you send over the revised numbers by tomorrow?' },
    { sender: 'billing@amazom.com', from: 'Amazon Prime', subject: 'Your Prime membership renewal', preview: 'Your Amazon Prime membership will auto-renew on 02/15. Manage your subscription.' },
    { sender: 'accounts@bankofamerrica.com', from: 'Bank of America', subject: 'New secure message available', preview: 'You have a new secure message in your inbox. Log in to read it.' },
    { sender: 'ceo@company-group.com', from: 'Michael Torres (CEO)', subject: 'Confidential - need your help', preview: 'I need a favor. Can you purchase some gift cards for a client? Will reimburse.' },
    { sender: 'invoices@quickb00ks.com', from: 'QuickBooks', subject: 'Invoice #1094 payment received', preview: 'Payment of $1,250.00 was received for invoice #1094. View receipt.' }
  ]
};

// ==================== WAVE CONFIGURATIONS ====================

const WAVE_CONFIGS = [
  { wave: 1, emailCount: 4, spamCount: 2, difficulty: ['obvious'], hint: 'Drag spam to Spam, file real mail into Work or Private' },
  { wave: 2, emailCount: 5, spamCount: 2, difficulty: ['obvious'], hint: 'Check for ALL CAPS and strange senders' },
  { wave: 3, emailCount: 6, spamCount: 3, difficulty: ['moderate'], hint: 'Check sender domains carefully' },
  { wave: 4, emailCount: 7, spamCount: 3, difficulty: ['moderate'], hint: 'Fake shipping and password reset emails' },
  { wave: 5, emailCount: 8, spamCount: 4, difficulty: ['subtle'], hint: 'Look for small typos in company names' },
  { wave: 6, emailCount: 9, spamCount: 5, difficulty: ['subtle'], hint: 'Not everything from a known company is real' },
  { wave: 7, emailCount: 10, spamCount: 5, difficulty: ['expert'], hint: 'Verify sender addresses match company names' },
  { wave: 8, emailCount: 11, spamCount: 6, difficulty: ['expert'], hint: 'Trust nothing — check every detail' }
];

function getWaveConfig(waveNumber) {
  if (waveNumber <= WAVE_CONFIGS.length) {
    return WAVE_CONFIGS[waveNumber - 1];
  }
  const emailCount = Math.min(16, 8 + Math.floor(waveNumber / 2));
  const spamCount = Math.ceil(emailCount * 0.5);
  return {
    wave: waveNumber,
    emailCount: emailCount,
    spamCount: spamCount,
    difficulty: ['moderate', 'subtle', 'expert'],
    hint: 'Sort carefully — spam gets trickier every wave!'
  };
}

// ==================== EMAIL GENERATION ====================

function generateEmails(config) {
  const legitCount = config.emailCount - config.spamCount;
  const legitEmails = randomSample(LEGIT_EMAILS, legitCount).map(e => ({
    ...e, isSpam: false, id: generateId()
  }));
  const allAvailableSpam = config.difficulty.flatMap(tier => SPAM_EMAILS[tier] || []);
  const spamEmails = randomSample(allAvailableSpam, config.spamCount).map(e => ({
    ...e, isSpam: true, id: generateId()
  }));
  const all = [...legitEmails, ...spamEmails];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

// ==================== EMAIL PREVIEW ====================

function openEmailPreview(emailData) {
  const icon = createFileIconCanvas(drawEmailIcon);
  icon.width = 16;
  icon.height = 16;

  const div = document.createElement('div');
  div.style.fontFamily = "'Courier New', monospace";
  div.style.fontSize = '12px';
  div.style.lineHeight = '1.6';
  div.style.whiteSpace = 'pre-wrap';

  const fakeDate = new Date(1998, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  const dateStr = fakeDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  div.textContent =
    'From:    ' + emailData.sender + '\n' +
    'To:      you@company.com\n' +
    'Date:    ' + dateStr + '\n' +
    'Subject: ' + emailData.subject + '\n' +
    '\u2500'.repeat(40) + '\n\n' +
    emailData.preview;

  createWindow({
    title: emailData.subject,
    icon: icon,
    content: div
  });
}

// ==================== EFFECTS ====================

function createParticleBurst(x, y) {
  const colors = ['#ffd700', '#32cd32', '#ffffff', '#ffff00'];
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const angle = (i / 8) * Math.PI * 2;
    const distance = 40 + Math.random() * 20;
    particle.style.setProperty('--px', Math.cos(angle) * distance + 'px');
    particle.style.setProperty('--py', Math.sin(angle) * distance + 'px');
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

function screenShake() {
  document.body.classList.add('screen-shake');
  setTimeout(() => document.body.classList.remove('screen-shake'), 300);
}

function triggerCRTFlicker() {
  if (!isEffectEnabled('crtFlicker')) return;
  document.body.classList.add('crt-flicker');
  setTimeout(() => document.body.classList.remove('crt-flicker'), 100);
}

const SPAM_ERROR_MESSAGES = [
  'That was real mail!',
  'Not spam!',
  'Check the sender!',
  'Wrong bin!',
  'Legitimate email!',
  'Read more carefully!',
  'Oops \u2014 real mail!',
  'That was spam!'
];

function showWrongDropText(folderEl, isSpamToInbox) {
  if (!isEffectEnabled('wrongDropText')) return;
  const rect = folderEl.getBoundingClientRect();
  const text = document.createElement('div');
  text.className = 'wrong-drop-text';
  text.textContent = isSpamToInbox ? 'That was spam!' : randomChoice(SPAM_ERROR_MESSAGES.slice(0, 7));
  text.style.position = 'fixed';
  text.style.left = (rect.left + rect.width / 2) + 'px';
  text.style.top = (rect.top - 20) + 'px';
  document.body.appendChild(text);
  setTimeout(() => text.remove(), 800);
}

function triggerFolderGulp(folderEl) {
  if (!isEffectEnabled('folderGulp')) return;
  folderEl.classList.add('gulp');
  setTimeout(() => folderEl.classList.remove('gulp'), 400);
}

let networkActivityInterval = null;
function triggerNetworkActivity() {
  if (!isEffectEnabled('networkActivity')) return;
  const canvas = document.getElementById('tray-network');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let flickerCount = 0;
  if (networkActivityInterval) clearInterval(networkActivityInterval);
  networkActivityInterval = setInterval(() => {
    ctx.clearRect(0, 0, 16, 16);
    if (flickerCount % 2 === 0) drawNetworkIconActive(ctx);
    else drawNetworkIcon(ctx);
    flickerCount++;
    if (flickerCount > 8) {
      clearInterval(networkActivityInterval);
      networkActivityInterval = null;
      ctx.clearRect(0, 0, 16, 16);
      drawNetworkIcon(ctx);
    }
  }, 250);
}

function updateShieldState(combo) {
  if (!isEffectEnabled('shieldPulse')) return;
  const shield = document.getElementById('tray-shield');
  if (!shield) return;
  const ctx = shield.getContext('2d');
  if (combo >= 3) {
    ctx.clearRect(0, 0, 16, 16);
    drawShieldIconActive(ctx);
    shield.classList.add('shield-pulse');
  } else {
    ctx.clearRect(0, 0, 16, 16);
    drawShieldIcon(ctx);
    shield.classList.remove('shield-pulse');
  }
}

function showComboPopupSlam(x, y, comboLevel) {
  const popup = document.createElement('div');
  popup.className = 'combo-popup';
  const text = 'Combo x' + comboLevel + '!';
  if (isEffectEnabled('comboSlam')) {
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.className = 'combo-char';
      span.textContent = text[i] === ' ' ? '\u00a0' : text[i];
      span.style.animationDelay = (i * 30) + 'ms';
      popup.appendChild(span);
    }
  } else {
    popup.textContent = text;
  }
  popup.style.left = x + 'px';
  popup.style.top = y + 'px';
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1000);
}

// ==================== IN-WINDOW DRAG STATE ====================

let selectedEmailIds = new Set();
let emailDataMap = {};          // id -> email data object
let emailRowMap = {};           // id -> <tr> element
let sidebarFolderEls = {};      // folderName -> element
let folderBadgeCounts = {};     // folderName -> count
let statusBarEl = null;
let emailWindowEl = null;

// Drag state
let dragState = null; // { ids: [], ghostEl, startX, startY, active }

// Sidebar folder definitions
const SIDEBAR_FOLDERS = ['Inbox', 'Work', 'Private', 'Spam'];

// ==================== BUILD EMAIL WINDOW ====================

function createEmailClientWindow(emails) {
  const icon = createFileIconCanvas(drawEmailIcon);
  icon.width = 16;
  icon.height = 16;

  const container = document.createElement('div');
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.height = '100%';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'email-toolbar';
  ['New Mail', 'Reply', 'Delete', 'Send/Recv'].forEach(label => {
    const btn = document.createElement('button');
    btn.className = 'email-toolbar-btn';
    btn.textContent = label;
    toolbar.appendChild(btn);
  });
  container.appendChild(toolbar);

  // Main area: sidebar + email list
  const main = document.createElement('div');
  main.className = 'email-client';

  // --- Sidebar ---
  const sidebar = document.createElement('div');
  sidebar.className = 'email-sidebar';
  sidebarFolderEls = {};
  folderBadgeCounts = {};

  SIDEBAR_FOLDERS.forEach(name => {
    const folder = document.createElement('div');
    folder.className = 'email-sidebar-folder';
    folder.dataset.folderName = name;

    // Inbox starts as the active/selected folder
    if (name === 'Inbox') {
      folder.classList.add('email-sidebar-folder-active');
    }

    const iconSpan = document.createElement('span');
    iconSpan.className = 'folder-icon';
    iconSpan.textContent = name === 'Inbox' ? '\uD83D\uDCC2' : '\uD83D\uDCC1'; // 📂 open for Inbox, 📁 closed otherwise
    folder.appendChild(iconSpan);

    const label = document.createElement('span');
    label.className = 'folder-label-text';
    label.textContent = name;
    folder.appendChild(label);

    const badge = document.createElement('span');
    badge.className = 'email-folder-badge';
    // Inbox badge shows the starting email count
    if (name === 'Inbox') {
      badge.textContent = emails.length;
      badge.style.display = '';
    } else {
      badge.textContent = '0';
      badge.style.display = 'none';
    }
    folder.appendChild(badge);

    sidebar.appendChild(folder);
    sidebarFolderEls[name] = folder;
    folderBadgeCounts[name] = name === 'Inbox' ? emails.length : 0;
  });

  main.appendChild(sidebar);

  // --- Email list ---
  const listArea = document.createElement('div');
  listArea.className = 'email-list-area';

  const table = document.createElement('table');
  table.className = 'email-list-table';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th style="width:24px;"></th><th>From</th><th>Subject</th><th style="width:60px;">Date</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  emailRowMap = {};
  emailDataMap = {};
  selectedEmailIds = new Set();

  emails.forEach(email => {
    emailDataMap[email.id] = email;
    const tr = document.createElement('tr');
    tr.className = 'email-row';
    tr.dataset.emailId = email.id;

    // Checkbox
    const tdCheck = document.createElement('td');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleEmailSelection(email.id, cb.checked);
    });
    cb.addEventListener('mousedown', (e) => e.stopPropagation());
    cb.addEventListener('touchstart', (e) => e.stopPropagation());
    tdCheck.appendChild(cb);
    tr.appendChild(tdCheck);

    // From
    const tdFrom = document.createElement('td');
    tdFrom.textContent = email.from || email.sender;
    tdFrom.style.fontWeight = 'bold';
    tr.appendChild(tdFrom);

    // Subject
    const tdSubject = document.createElement('td');
    tdSubject.textContent = email.subject;
    tr.appendChild(tdSubject);

    // Date
    const tdDate = document.createElement('td');
    const fakeMonth = Math.floor(Math.random() * 12) + 1;
    const fakeDay = Math.floor(Math.random() * 28) + 1;
    tdDate.textContent = fakeMonth + '/' + fakeDay;
    tdDate.style.fontSize = '10px';
    tr.appendChild(tdDate);

    // Drag initiation on row (not on checkbox)
    tr.addEventListener('mousedown', (e) => onRowMouseDown(e, email.id));
    tr.addEventListener('touchstart', (e) => onRowTouchStart(e, email.id), { passive: false });

    // Double-click to preview
    tr.addEventListener('dblclick', () => openEmailPreview(email));
    let lastTap = 0;
    tr.addEventListener('touchend', (e) => {
      if (dragState && dragState.active) return;
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
        openEmailPreview(email);
      }
      lastTap = now;
    });

    tbody.appendChild(tr);
    emailRowMap[email.id] = tr;
  });

  table.appendChild(tbody);
  listArea.appendChild(table);
  main.appendChild(listArea);
  container.appendChild(main);

  // Create the window
  emailWindowEl = createWindow({
    title: 'Internet Mail',
    icon: icon,
    content: container
  });

  // Size the window larger and center it
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 768;
  if (isMobile) {
    emailWindowEl.classList.add('maximized');
  } else {
    const ww = Math.min(700, vw - 40);
    const wh = Math.min(500, vh - 100);
    emailWindowEl.style.width = ww + 'px';
    emailWindowEl.style.height = wh + 'px';
    emailWindowEl.style.left = ((vw - ww) / 2) + 'px';
    emailWindowEl.style.top = ((vh - 40 - wh) / 2) + 'px';
  }

  // Style the window content
  const contentEl = emailWindowEl.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.background = '#fff';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';

  // Status bar
  statusBarEl = emailWindowEl.querySelector('.window-statusbar');
  updateStatusBar(emails.length);

  return emailWindowEl;
}

// ==================== STATUS BAR ====================

function updateStatusBar(totalCount) {
  if (!statusBarEl) return;
  const selCount = selectedEmailIds.size;
  const selText = selCount > 0 ? ', ' + selCount + ' selected' : '';
  statusBarEl.innerHTML = '<span>' + totalCount + ' message(s)' + selText + '</span><span>Inbox</span>';
}

// ==================== CHECKBOX SELECTION ====================

function toggleEmailSelection(emailId, checked) {
  if (checked) {
    selectedEmailIds.add(emailId);
  } else {
    selectedEmailIds.delete(emailId);
  }
  updateRowHighlights();
  updateStatusBar(gameState.activeFiles.length);
}

function updateRowHighlights() {
  Object.entries(emailRowMap).forEach(([id, tr]) => {
    if (selectedEmailIds.has(id)) {
      tr.classList.add('email-row-selected');
    } else {
      tr.classList.remove('email-row-selected');
    }
  });
}

// ==================== CUSTOM DRAG SYSTEM ====================

function onRowMouseDown(e, emailId) {
  // Skip if clicking on checkbox
  if (e.target.tagName === 'INPUT') return;
  e.preventDefault();

  const startX = e.clientX;
  const startY = e.clientY;

  // Determine which emails to drag
  const ids = selectedEmailIds.has(emailId) && selectedEmailIds.size > 0
    ? [...selectedEmailIds]
    : [emailId];

  dragState = { ids, ghostEl: null, startX, startY, active: false };

  // Attach document-level handlers
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
}

function onRowTouchStart(e, emailId) {
  if (e.target.tagName === 'INPUT') return;

  const touch = e.touches[0];
  const startX = touch.clientX;
  const startY = touch.clientY;

  const ids = selectedEmailIds.has(emailId) && selectedEmailIds.size > 0
    ? [...selectedEmailIds]
    : [emailId];

  dragState = { ids, ghostEl: null, startX, startY, active: false };

  document.addEventListener('touchmove', onTouchDragMove, { passive: false });
  document.addEventListener('touchend', onTouchDragEnd);
}

function onDragMove(e) {
  if (!dragState) return;
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;

  if (!dragState.active && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    dragState.active = true;
    dragState.ghostEl = createDragGhost(dragState.ids);
  }

  if (dragState.active) {
    dragState.ghostEl.style.left = (e.clientX + 12) + 'px';
    dragState.ghostEl.style.top = (e.clientY + 12) + 'px';
    highlightFolderUnderCursor(e.clientX, e.clientY);
  }
}

function onTouchDragMove(e) {
  if (!dragState) return;
  const touch = e.touches[0];
  const dx = touch.clientX - dragState.startX;
  const dy = touch.clientY - dragState.startY;

  if (!dragState.active && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    dragState.active = true;
    dragState.ghostEl = createDragGhost(dragState.ids);
    e.preventDefault();
  }

  if (dragState.active) {
    e.preventDefault();
    dragState.ghostEl.style.left = (touch.clientX + 12) + 'px';
    dragState.ghostEl.style.top = (touch.clientY + 12) + 'px';
    highlightFolderUnderCursor(touch.clientX, touch.clientY);
  }
}

function onDragEnd(e) {
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);

  if (dragState && dragState.active) {
    const folder = getFolderUnderCursor(e.clientX, e.clientY);
    if (folder) {
      handleEmailDrop(dragState.ids, folder);
    }
  }
  cleanupDrag();
}

function onTouchDragEnd(e) {
  document.removeEventListener('touchmove', onTouchDragMove);
  document.removeEventListener('touchend', onTouchDragEnd);

  if (dragState && dragState.active) {
    const touch = e.changedTouches[0];
    const folder = getFolderUnderCursor(touch.clientX, touch.clientY);
    if (folder) {
      handleEmailDrop(dragState.ids, folder);
    }
  }
  cleanupDrag();
}

function cleanupDrag() {
  if (dragState && dragState.ghostEl) {
    dragState.ghostEl.remove();
  }
  // Clear all folder hover states
  Object.values(sidebarFolderEls).forEach(el => {
    el.classList.remove('email-folder-hover');
    const icon = el.querySelector('.folder-icon');
    if (icon) icon.textContent = '\uD83D\uDCC1';
  });
  dragState = null;
}

function createDragGhost(ids) {
  const ghost = document.createElement('div');
  ghost.className = 'email-drag-ghost';

  if (ids.length === 1) {
    const data = emailDataMap[ids[0]];
    ghost.textContent = '\u2709 ' + (data ? data.from : 'Email');
  } else {
    ghost.textContent = '\u2709 ' + ids.length + ' message(s)';
  }

  document.body.appendChild(ghost);
  return ghost;
}

function highlightFolderUnderCursor(cx, cy) {
  Object.values(sidebarFolderEls).forEach(el => {
    const rect = el.getBoundingClientRect();
    if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
      el.classList.add('email-folder-hover');
      const icon = el.querySelector('.folder-icon');
      if (icon) icon.textContent = '\uD83D\uDCC2'; // 📂 open
    } else {
      el.classList.remove('email-folder-hover');
      const icon = el.querySelector('.folder-icon');
      if (icon) icon.textContent = '\uD83D\uDCC1'; // 📁 closed
    }
  });
}

function getFolderUnderCursor(cx, cy) {
  for (const [name, el] of Object.entries(sidebarFolderEls)) {
    const rect = el.getBoundingClientRect();
    if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
      return name;
    }
  }
  return null;
}

// Decrement the Inbox badge when an email is sorted out
function decrementInboxBadge() {
  const inboxEl = sidebarFolderEls['Inbox'];
  if (!inboxEl) return;
  folderBadgeCounts['Inbox'] = Math.max(0, (folderBadgeCounts['Inbox'] || 0) - 1);
  const badge = inboxEl.querySelector('.email-folder-badge');
  if (badge) {
    badge.textContent = folderBadgeCounts['Inbox'];
    if (folderBadgeCounts['Inbox'] === 0) badge.style.display = 'none';
  }
}

// ==================== DROP HANDLER ====================

function handleEmailDrop(emailIds, folderName) {
  const folderEl = sidebarFolderEls[folderName];
  const folderRect = folderEl.getBoundingClientRect();
  const fx = folderRect.left + folderRect.width / 2;
  const fy = folderRect.top + folderRect.height / 2;

  emailIds.forEach(emailId => {
    const emailData = emailDataMap[emailId];
    if (!emailData) return;

    // Correct: spam -> Spam, legit -> Work or Private
    const isCorrect = (emailData.isSpam && folderName === 'Spam') ||
                      (!emailData.isSpam && (folderName === 'Work' || folderName === 'Private'));

    if (isCorrect) {
      comboCount++;
      let score = 10 * gameState.wave;

      if (comboCount >= 3) {
        const comboBonus = 5 * Math.floor(comboCount / 3);
        score += comboBonus;
        showComboPopupSlam(fx, fy - 30, comboCount);
      }

      gameState.score += score;
      updateScore();

      createParticleBurst(fx, fy);
      triggerFolderGulp(folderEl);
      triggerNetworkActivity();
      updateShieldState(comboCount);

      // Increment badge
      folderBadgeCounts[folderName] = (folderBadgeCounts[folderName] || 0) + 1;
      const badge = folderEl.querySelector('.email-folder-badge');
      if (badge) {
        badge.textContent = folderBadgeCounts[folderName];
        badge.style.display = '';
      }

      gameState.totalFilesSorted = (gameState.totalFilesSorted || 0) + 1;

      // Decrement Inbox badge (email leaving inbox)
      decrementInboxBadge();
    } else {
      // Wrong placement
      comboCount = 0;
      updateShieldState(0);

      gameState.score = Math.max(0, gameState.score - 5);
      updateScore();

      screenShake();
      triggerCRTFlicker();
      // Show "That was spam!" if spam was filed into a non-Spam folder
      const isSpamToGoodFolder = emailData.isSpam && folderName !== 'Spam';
      showWrongDropText(folderEl, isSpamToGoodFolder);
    }

    // Animate row removal (correct or wrong-but-moved)
    if (isCorrect) {
      removeEmailRow(emailId);
    }
  });
}

function removeEmailRow(emailId) {
  const tr = emailRowMap[emailId];
  if (tr) {
    tr.classList.add('email-row-removing');
    setTimeout(() => {
      tr.remove();
      delete emailRowMap[emailId];
      delete emailDataMap[emailId];
      selectedEmailIds.delete(emailId);
      gameState.activeFiles = gameState.activeFiles.filter(f => f.id !== emailId);
      updateStatusBar(gameState.activeFiles.length);

      if (gameState.activeFiles.length === 0) {
        comboCount = 0;
        updateShieldState(0);
        emailWindowEl = null;
        statusBarEl = null;
        onWaveComplete();
      }
    }, 350);
  }
}

// ==================== TASK REGISTRATION ====================

registerTask('spam-delete', {
  getWaveConfig(waveNumber) {
    return getWaveConfig(waveNumber);
  },

  getCriteriaText(criteria) {
    return 'Sort your Inbox: spam \u2192 Spam, real mail \u2192 Work/Private';
  },

  spawnItems(config) {
    clearDesktop();

    // Generate emails
    const emails = generateEmails(config);

    // Store in activeFiles for wave tracking
    emails.forEach(email => {
      gameState.activeFiles.push({
        id: email.id,
        name: email.from || email.sender,
        isSpam: email.isSpam,
        sender: email.sender,
        from: email.from,
        subject: email.subject,
        preview: email.preview
      });
    });

    // Build the in-window email client
    createEmailClientWindow(emails);
    saveState();
  }
});
