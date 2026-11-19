// Leonida Trophy Atlas — an offline checklist for GTA VI's 55 PS5 trophies.
// Progress lives only in this browser (localStorage) unless the player exports it.
const KEY = 'leonida-trophy-atlas-v1';
const KIND_LABELS = {
  all: 'All', platinum: 'Platinum', story: 'Story', side: 'Side quests',
  collectible: 'Collectibles', activity: 'Activities', robbery: 'Robberies',
  completion: '100%', misc: 'Misc',
};
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

const grid = document.getElementById('trophyGrid');
const searchInput = document.getElementById('search');
const kindChips = document.getElementById('kindChips');
const gradeFilter = document.getElementById('gradeFilter');
const earnedOnly = document.getElementById('earnedOnly');
const missableOnly = document.getElementById('missableOnly');
const spoilerToggle = document.getElementById('spoilerToggle');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const progressFill = document.getElementById('progressFill');
const gradePills = document.getElementById('gradePills');
const resultCount = document.getElementById('resultCount');
const emptyMsg = document.getElementById('emptyMsg');
const listHeading = document.getElementById('listHeading');

let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { earned = new Set(); }
let doc = null;
let activeKind = 'all';
let openGuides = new Set();

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveSpoiler() {
  try { localStorage.setItem(KEY + ':spoilers', spoilerToggle.checked ? '1' : '0'); } catch { /* private mode */ }
}
try {
  if (localStorage.getItem(KEY + ':spoilers') === '0') spoilerToggle.checked = false;
} catch { /* private mode */ }

function trophyText(t) {
  return [t.name, t.description, t.guide, t.kind, t.grade, ...(t.steps ?? [])].join(' ').toLowerCase();
}

function visibleTrophies() {
  const q = searchInput.value.trim().toLowerCase();
  return doc.trophies.filter((t) => {
    if (activeKind !== 'all' && t.kind !== activeKind) return false;
    if (gradeFilter.value !== 'all' && t.grade !== gradeFilter.value) return false;
    if (earnedOnly.checked && !earned.has(t.id)) return false;
    if (missableOnly.checked && !t.missable) return false;
    if (q && !trophyText(t).includes(q)) return false;
    return true;
  });
}

function renderProgress() {
  const total = doc.trophies.length;
  const n = earned.size;
  const pct = Math.round((n / total) * 100);
  progressText.textContent = `${n} of ${total} earned`;
  progressPct.textContent = `${pct}% to platinum`;
  progressFill.style.width = `${pct}%`;
  const byGrade = {};
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = doc.trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => earned.has(t.id)).length;
    byGrade[g] = `${got}/${all.length}`;
  }
  gradePills.replaceChildren();
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const pill = document.createElement('span');
    pill.className = `grade-pill ${g}`;
    pill.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = byGrade[g];
    pill.append(b, document.createTextNode(` ${GRADE_LABELS[g]}`));
    gradePills.append(pill);
  }
}

function sourceLinks(t) {
  return (t.sources ?? []).map((key) => {
    const s = doc.sources[key];
    return s ? { name: s.name, url: s.url } : null;
  }).filter(Boolean);
}

function cardFor(t) {
  const isEarned = earned.has(t.id);
  const spoilerHidden = spoilerToggle.checked && t.hidden && !isEarned;
  const article = document.createElement('article');
  article.className = `card ${t.grade}${isEarned ? ' earned' : ''}${spoilerHidden ? ' spoiler-hidden' : ''}`;
  article.id = `trophy-${t.id}`;

  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'earn-box';
  box.checked = isEarned;
  box.setAttribute('aria-label', `Mark ${spoilerHidden ? 'this hidden story trophy' : t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id);
    else earned.delete(t.id);
    save();
    render();
  });
  const titleWrap = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'trophy-name';
  name.textContent = spoilerHidden ? 'Hidden story trophy' : t.name;
  titleWrap.append(name);

  const badges = document.createElement('div');
  badges.className = 'badges';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge ${t.grade}`;
  gradeBadge.textContent = GRADE_LABELS[t.grade];
  badges.append(gradeBadge);
  const kindBadge = document.createElement('span');
  kindBadge.className = 'badge kind';
  kindBadge.textContent = KIND_LABELS[t.kind] ?? t.kind;
  badges.append(kindBadge);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'badge missable';
    m.textContent = 'Missable';
    badges.append(m);
  }
  if (t.guide.includes('NOT YET CONFIRMED')) {
    const u = document.createElement('span');
    u.className = 'badge unconfirmed';
    u.textContent = 'Unconfirmed';
    badges.append(u);
  }
  titleWrap.append(badges);
  head.append(box, titleWrap);
  article.append(head);

  const official = document.createElement('p');
  official.className = 'official';
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = 'Official description';
  official.append(label);
  official.append(document.createTextNode(
    spoilerHidden ? 'Hidden until earned — turn off “Hide story spoilers” to reveal it, or earn it in the game.' : t.description,
  ));
  article.append(official);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  const open = openGuides.has(t.id);
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.textContent = open ? 'Hide guide ▲' : 'Read the guide ▼';
  if (spoilerHidden) {
    // A hidden story trophy's guide names its mission too, so it stays hidden as well.
    toggle.disabled = true;
    toggle.textContent = 'Guide hidden — earn it or turn spoilers off';
    toggle.setAttribute('aria-expanded', 'false');
  }
  article.append(toggle);

  const guide = document.createElement('div');
  guide.className = `guide${open && !spoilerHidden ? ' open' : ''}`;
  if (spoilerHidden) {
    const hiddenNote = document.createElement('p');
    hiddenNote.textContent = 'This guide stays hidden while spoilers are on, because it names the mission. Earn the trophy in the game, or turn off “Hide story spoilers” above.';
    guide.append(hiddenNote);
    article.append(guide);
    return article;
  }
  const guideText = document.createElement('p');
  guideText.textContent = t.guide;
  guide.append(guideText);
  if (t.steps?.length) {
    const h = document.createElement('h4');
    h.textContent = 'How to get it';
    guide.append(h);
    const ol = document.createElement('ol');
    for (const step of t.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      ol.append(li);
    }
    guide.append(ol);
  }
  const links = sourceLinks(t);
  if (links.length) {
    const src = document.createElement('p');
    src.className = 'src';
    src.append(document.createTextNode('Sources: '));
    links.forEach((s, i) => {
      if (i) src.append(document.createTextNode(' · '));
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      src.append(a);
    });
    guide.append(src);
  }
  article.append(guide);

  toggle.addEventListener('click', () => {
    if (openGuides.has(t.id)) openGuides.delete(t.id);
    else openGuides.add(t.id);
    const isOpen = openGuides.has(t.id);
    guide.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.textContent = isOpen ? 'Hide guide ▲' : 'Read the guide ▼';
  });
  return article;
}

function render() {
  const list = visibleTrophies();
  grid.replaceChildren(...list.map(cardFor));
  emptyMsg.hidden = list.length > 0;
  const kindName = activeKind === 'all' ? 'All 55 trophies' : `${KIND_LABELS[activeKind]} trophies`;
  listHeading.textContent = kindName;
  resultCount.textContent = `Showing ${list.length} of ${doc.trophies.length} trophies · ${earned.size} earned`;
  renderProgress();
}

function renderChips() {
  kindChips.replaceChildren();
  for (const kind of ['all', 'story', 'side', 'collectible', 'activity', 'robbery', 'completion', 'misc']) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.setAttribute('aria-pressed', activeKind === kind ? 'true' : 'false');
    const count = kind === 'all'
      ? doc.trophies.length
      : doc.trophies.filter((t) => t.kind === kind).length;
    btn.textContent = `${KIND_LABELS[kind]} (${count})`;
    btn.addEventListener('click', () => {
      activeKind = kind;
      renderChips();
      render();
    });
    kindChips.append(btn);
  }
}

function renderSources() {
  const ul = document.getElementById('sourceList');
  ul.replaceChildren();
  for (const s of Object.values(doc.sources)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    ul.append(li);
  }
}

searchInput.addEventListener('input', render);
gradeFilter.addEventListener('change', render);
earnedOnly.addEventListener('change', render);
missableOnly.addEventListener('change', render);
spoilerToggle.addEventListener('change', () => { saveSpoiler(); render(); });

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: doc.game, earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    const valid = new Set(doc.trophies.map((t) => t.id));
    earned = new Set(ids.filter((id) => valid.has(id)));
    save();
    render();
  } catch {
    alert('That file could not be read as trophy progress.');
  }
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear every earned tick? This only affects this browser.')) {
    earned = new Set();
    save();
    render();
  }
});

doc = await (await fetch('data/trophies.json')).json();
renderChips();
renderSources();
render();

// Deep links: #trophy-28 opens that trophy's guide, #roadmap jumps to the roadmap.
// Runs on load and on hash changes (same-document navigation does not reload the page).
function handleHash() {
  const hash = location.hash;
  if (hash.startsWith('#trophy-')) {
    const id = Number(hash.slice('#trophy-'.length));
    const t = doc.trophies.find((x) => x.id === id);
    if (t) {
      openGuides.add(id);
      render();
      document.getElementById(`trophy-${id}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  } else if (hash === '#roadmap') {
    document.getElementById('roadmap')?.scrollIntoView();
  }
}
window.addEventListener('hashchange', handleHash);
handleHash();
