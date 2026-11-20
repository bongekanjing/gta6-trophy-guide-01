'use strict';

/* Leonida Trophy Guide — tracker state, rendering, filters, import/export.
   Data ships with the app in data/trophies.json; nothing is fetched from the
   network. Progress lives in localStorage under STORAGE_KEY. */

var STORAGE_KEY = 'gta6-trophy-guide-v1';
var DATA_URL = 'data/trophies.json';
var GRADE_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
var GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

var trophies = [];
var roadmap = [];
var allSources = [];
var state = {
  earned: new Set(),
  spoiler: false,
  filter: 'all',
  grade: 'all',
  sort: 'default',
  query: '',
  detailId: null
};

function $(id) { return document.getElementById(id); }

function loadStoredState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    var saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) {
      saved.earned.forEach(function (id) { state.earned.add(id); });
    }
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  } catch (err) { /* a corrupt save is ignored; the list still renders */ }
}

function saveStoredState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: Array.from(state.earned).sort(function (a, b) { return a - b; }),
      spoiler: state.spoiler
    }));
  } catch (err) { /* private mode or full storage: progress is session-only */ }
}

function trophyById(id) {
  for (var i = 0; i < trophies.length; i++) {
    if (trophies[i].id === id) return trophies[i];
  }
  return null;
}

function isEarned(trophy) { return state.earned.has(trophy.id); }

function isSpoilerHidden(trophy) {
  return state.spoiler && trophy.kind === 'story' && !isEarned(trophy);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function formatCount(trophy) {
  if (typeof trophy.count !== 'number') return '';
  return 'Target: ' + trophy.count.toLocaleString('en-US');
}

function pointsOf(trophy) { return GRADE_POINTS[trophy.grade] || 0; }

function totalPoints() {
  var total = 0;
  trophies.forEach(function (t) { total += pointsOf(t); });
  return total;
}

function earnedPoints() {
  var total = 0;
  trophies.forEach(function (t) { if (isEarned(t)) total += pointsOf(t); });
  return total;
}

function renderProgress() {
  var earned = state.earned.size;
  var total = trophies.length;
  var pct = total === 0 ? 0 : Math.round((earned / total) * 100);
  $('progress-fill').style.width = pct + '%';
  $('progress-text').textContent = earned + ' of ' + total + ' trophies earned · ' +
    earnedPoints() + ' of ' + totalPoints() + ' points · ' + pct + '%';
  var parts = ['platinum', 'gold', 'silver', 'bronze'].map(function (grade) {
    var ofGrade = trophies.filter(function (t) { return t.grade === grade; });
    var got = ofGrade.filter(function (t) { return isEarned(t); }).length;
    return gradeLabel(grade) + ' ' + got + '/' + ofGrade.length;
  });
  $('grade-counts').textContent = parts.join(' · ');
}

function renderRoadmap() {
  var list = $('roadmap-steps');
  list.innerHTML = '';
  roadmap.forEach(function (stage) {
    var item = document.createElement('li');
    var head = document.createElement('h3');
    head.textContent = 'Step ' + stage.stage + ': ' + stage.title + ' (' + stage.hours + ' hours)';
    var body = document.createElement('p');
    body.textContent = stage.text;
    var cites = document.createElement('p');
    cites.className = 'step-sources';
    cites.textContent = 'Sources: ' + stage.sources.join('; ');
    item.appendChild(head);
    item.appendChild(body);
    item.appendChild(cites);
    list.appendChild(item);
  });
  var names = [];
  allSources.forEach(function (s) { names.push(s.name); });
  $('roadmap-sources').textContent = 'Guide sources used across this page: ' + names.join(' · ') + '.';
}

function trophyMatchesFilter(trophy) {
  if (state.filter === 'story' && trophy.kind !== 'story') return false;
  if (state.filter === 'missable' && !trophy.missable) return false;
  if (state.filter === 'collectible' && trophy.kind !== 'collectible') return false;
  if (state.filter === 'activity' && trophy.kind !== 'activity') return false;
  if (state.filter === 'online') return false;
  if (state.filter === 'earned' && !isEarned(trophy)) return false;
  if (state.filter === 'remaining' && isEarned(trophy)) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.query) {
    var hay = isSpoilerHidden(trophy) ? '' : (trophy.name + ' ' + trophy.description).toLowerCase();
    if (hay.indexOf(state.query) === -1) return false;
  }
  return true;
}

function visibleTrophies() {
  var list = trophies.filter(trophyMatchesFilter);
  if (state.sort === 'grade') {
    list.sort(function (a, b) {
      var byGrade = GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade];
      if (byGrade !== 0) return byGrade;
      return a.name.localeCompare(b.name);
    });
  } else if (state.sort === 'name') {
    list.sort(function (a, b) { return a.name.localeCompare(b.name); });
  } else {
    list.sort(function (a, b) { return a.id - b.id; });
  }
  return list;
}

function buildTrophyRow(trophy) {
  var row = document.createElement('article');
  row.className = 'trophy-row' + (isEarned(trophy) ? ' is-earned' : '');
  row.dataset.trophyId = String(trophy.id);

  var check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = isEarned(trophy);
  check.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
  check.addEventListener('click', function (event) {
    event.stopPropagation();
    toggleEarned(trophy.id, check.checked);
  });

  var badge = document.createElement('span');
  badge.className = 'grade-badge grade-' + trophy.grade;
  badge.textContent = gradeLabel(trophy.grade);

  var text = document.createElement('div');
  text.className = 'trophy-text';
  var name = document.createElement('h3');
  var desc = document.createElement('p');
  if (isSpoilerHidden(trophy)) {
    name.textContent = 'Hidden story trophy';
    desc.textContent = 'Complete the story to reveal this trophy.';
    name.className = 'spoiler-name';
  } else {
    name.textContent = trophy.name;
    desc.textContent = trophy.description;
  }
  text.appendChild(name);
  text.appendChild(desc);

  var meta = document.createElement('p');
  meta.className = 'trophy-meta';
  var bits = [];
  if (trophy.missable) bits.push('MISSABLE');
  if (trophy.hidden) bits.push('Hidden on PlayStation');
  if (trophy.kind === 'story') bits.push('Story');
  if (trophy.kind === 'collectible') bits.push('Collectible');
  if (trophy.kind === 'activity') bits.push('Activity');
  if (formatCount(trophy)) bits.push(formatCount(trophy));
  meta.textContent = bits.join(' · ');
  text.appendChild(meta);

  row.appendChild(check);
  row.appendChild(badge);
  row.appendChild(text);
  row.addEventListener('click', function () { openDetail(trophy.id); });
  return row;
}

function renderList() {
  var list = $('trophy-list');
  list.innerHTML = '';
  var shown = visibleTrophies();
  if (state.filter === 'online') {
    var note = document.createElement('p');
    note.className = 'empty-note';
    note.textContent = 'There are no online trophies in GTA VI: all 55 are single-player, per PowerPyx. Nothing to track here.';
    list.appendChild(note);
  }
  if (shown.length === 0 && state.filter !== 'online') {
    var empty = document.createElement('p');
    empty.className = 'empty-note';
    empty.textContent = 'No trophies match this filter.';
    list.appendChild(empty);
  }
  shown.forEach(function (trophy) { list.appendChild(buildTrophyRow(trophy)); });
  $('result-count').textContent = shown.length + ' of ' + trophies.length + ' trophies shown';
  renderProgress();
}

function toggleEarned(id, earned) {
  if (earned) state.earned.add(id); else state.earned.delete(id);
  saveStoredState();
  renderList();
  if (state.detailId === id) openDetail(id);
}

function openDetail(id) {
  var trophy = trophyById(id);
  if (!trophy) return;
  state.detailId = id;
  var body = $('detail-body');
  body.innerHTML = '';
  var title = document.createElement('h3');
  var desc = document.createElement('p');
  desc.className = 'detail-desc';
  if (isSpoilerHidden(trophy)) {
    title.textContent = 'Hidden story trophy';
    desc.textContent = 'This is a story trophy. Turn off the spoiler setting or earn it in-game to see its name, description and guide.';
    body.appendChild(title);
    body.appendChild(desc);
  } else {
    title.textContent = trophy.name + ' — ' + gradeLabel(trophy.grade);
    desc.textContent = trophy.description;
    body.appendChild(title);
    body.appendChild(desc);
    if (trophy.missable) {
      var warn = document.createElement('p');
      warn.className = 'detail-missable';
      warn.textContent = 'Missable: see the guide below before you pass Chapter 1.';
      body.appendChild(warn);
    }
    var guide = document.createElement('p');
    guide.className = 'detail-guide';
    guide.textContent = trophy.guide;
    body.appendChild(guide);
    var srcTitle = document.createElement('p');
    srcTitle.className = 'detail-sources-title';
    srcTitle.textContent = 'Sources for this guide:';
    body.appendChild(srcTitle);
    var srcList = document.createElement('ul');
    srcList.className = 'detail-sources';
    (trophy.sources || []).forEach(function (source) {
      var item = document.createElement('li');
      if (source.url) {
        var link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = source.name;
        item.appendChild(link);
      } else {
        item.textContent = source.name;
      }
      srcList.appendChild(item);
    });
    body.appendChild(srcList);
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = isEarned(trophy) ? 'Mark as not earned' : 'Mark as earned';
    toggle.addEventListener('click', function () { toggleEarned(trophy.id, !isEarned(trophy)); });
    body.appendChild(toggle);
  }
  $('detail').hidden = false;
  $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeDetail() {
  state.detailId = null;
  $('detail').hidden = true;
}

function exportProgress() {
  var payload = {
    app: 'gta6-trophy-guide',
    exportedAt: new Date().toISOString(),
    earned: Array.from(state.earned).sort(function (a, b) { return a - b; })
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'gta6-trophy-progress.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function importProgressFile(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(String(reader.result));
      var ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('bad file');
      var next = new Set();
      ids.forEach(function (id) {
        var n = Number(id);
        if (Number.isInteger(n) && n >= 1 && n <= trophies.length) next.add(n);
      });
      state.earned = next;
      saveStoredState();
      renderList();
    } catch (err) {
      window.alert('That file is not a progress export from this guide.');
    }
  };
  reader.readAsText(file);
}

function readUrlParams() {
  var params = new URLSearchParams(window.location.search);
  var filter = params.get('filter');
  if (filter && ['all', 'story', 'missable', 'collectible', 'activity', 'online', 'earned', 'remaining'].indexOf(filter) !== -1) {
    state.filter = filter;
  }
  var grade = params.get('grade');
  if (grade && ['all', 'platinum', 'gold', 'silver', 'bronze'].indexOf(grade) !== -1) {
    state.grade = grade;
  }
  if (params.get('spoiler') === 'on') state.spoiler = true;
  var detail = params.get('detail');
  if (detail) state.detailId = Number(detail);
}

function syncToolbar() {
  document.querySelectorAll('#filter-chips .chip').forEach(function (chip) {
    chip.classList.toggle('is-active', chip.dataset.filter === state.filter);
  });
  $('grade-select').value = state.grade;
  $('sort-select').value = state.sort;
  $('spoiler-toggle').checked = state.spoiler;
}

function bindToolbar() {
  document.querySelectorAll('#filter-chips .chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.filter = chip.dataset.filter;
      syncToolbar();
      renderList();
    });
  });
  $('grade-select').addEventListener('change', function (event) {
    state.grade = event.target.value;
    renderList();
  });
  $('sort-select').addEventListener('change', function (event) {
    state.sort = event.target.value;
    renderList();
  });
  $('search-input').addEventListener('input', function (event) {
    state.query = event.target.value.trim().toLowerCase();
    renderList();
  });
  $('spoiler-toggle').addEventListener('change', function (event) {
    state.spoiler = event.target.checked;
    saveStoredState();
    renderList();
    if (state.detailId !== null) openDetail(state.detailId);
  });
  $('export-button').addEventListener('click', exportProgress);
  $('import-button').addEventListener('click', function () { $('import-file').click(); });
  $('import-file').addEventListener('change', function (event) {
    if (event.target.files && event.target.files[0]) importProgressFile(event.target.files[0]);
    event.target.value = '';
  });
  $('reset-button').addEventListener('click', function () {
    if (window.confirm('Clear all earned trophies and the spoiler setting?')) {
      state.earned = new Set();
      state.spoiler = false;
      saveStoredState();
      syncToolbar();
      renderList();
      closeDetail();
    }
  });
  $('detail-close').addEventListener('click', closeDetail);
}

function init() {
  loadStoredState();
  readUrlParams();
  bindToolbar();
  fetch(DATA_URL)
    .then(function (response) {
      if (!response.ok) throw new Error('trophy data failed to load');
      return response.json();
    })
    .then(function (data) {
      trophies = data.trophies || data;
      roadmap = data.roadmap || [];
      allSources = data.sources || [];
      var loading = $('loading-note');
      if (loading) loading.remove();
      syncToolbar();
      renderRoadmap();
      renderList();
      if (state.detailId !== null) openDetail(state.detailId);
    })
    .catch(function () {
      var loading = $('loading-note');
      if (loading) loading.textContent = 'The trophy list could not be loaded. Serve this folder over HTTP and reload.';
    });
}

document.addEventListener('DOMContentLoaded', init);
