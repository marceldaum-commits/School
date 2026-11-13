'use strict';
/* =====================================================================
   Rechenblitz – Menü (schwebender Button) und alle Panels:
   Melden, Einstellungen, Profile, Abzeichen, Einmaleins-Übersicht,
   Wochenbericht, Lehrkräfte (Auftrag, Ergebnis, Arbeitsblatt), Einstufung
   ===================================================================== */
const Sheet = { open: false, stack: [] };
let installPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// Links zur Website mit Kennung, damit man in der Statistik sieht, dass Besucher aus der App kommen
const siteLink = (url, place) => { if (!CONFIG.utm) return url; try { const u = new URL(url); u.searchParams.set('utm_source', 'rechenblitz'); u.searchParams.set('utm_medium', 'app'); u.searchParams.set('utm_campaign', place); return u.toString(); } catch { return url; } };
const mi = (go, icon, title, sub, extra = '') => `<button class="mi ${extra}" data-go="${go}"><div class="ico">${icon}</div><div><b>${title}</b><span>${sub}</span></div><span class="chev">›</span></button>`;
const miLink = (href, icon, title, sub, extra = '') => `<a class="mi ${extra}" href="${esc(href)}" target="_blank" rel="noopener"><div class="ico">${icon}</div><div><b>${title}</b><span>${sub}</span></div><span class="chev">↗</span></a>`;
const topicOptions = sel => Object.entries(TOPICS).map(([k, o]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${o.name}</option>`).join('');
const levelOptions = sel => [0, 1, 2, 3, 4].map(i => `<option value="${i}" ${i === sel ? 'selected' : ''}>Stufe ${i + 1}</option>`).join('');

function contextNow() {
  if (G && currentScreen() === 'game' && G.task && !G.locked)
    return { task: taskText(G.task) + (G.task.noEq ? '' : ' = ?'), given: G.input.replace('-', '−'), expected: showAns(G.task.a), correct: null, topic: TOPICS[G.task.topic].name, level: G.task.lvl + 1, mode: G.mode, _task: G.task };
  return lastAnswered;
}

const PANELS = {
  menu() {
    const n = ROOT.outbox.length;
    return { title: 'Wie können wir helfen?', html: `<div class="menu">
      ${mi('report', '🐞', 'Fehler melden', 'Falsche Lösung oder Problem in der App', 'accent')}
      ${mi('idea', '💡', 'Idee oder Feedback', 'Was sollen wir verbessern?')}
      ${miLink(siteLink(CONFIG.websiteUrl, 'menu'), '🌐', 'Zu Nachhilfe – online', 'Online-Nachhilfe 1:1 in Mathe & mehr', 'accent')}
      ${miLink(siteLink(CONFIG.trialUrl, 'menu-probestunde'), '🎓', 'Kostenlose Probestunde', 'Unverbindlich ausprobieren')}
      ${CONFIG.lernraumUrl ? `<a class="mi" href="${esc(siteLink(CONFIG.lernraumUrl, 'menu-lernraum'))}"><div class="ico">📚</div><div><b>Zurück zum Lernraum</b><span>Weitere Lernspiele und Übungen</span></div><span class="chev">←</span></a>` : ''}
      ${mi('invite', '💌', 'Freunde einladen', 'Rechenblitz ist kostenlos – teile es!')}
      ${adventPhase() !== 'off' ? mi('advent', '🎄', 'Rechen-Adventskalender', 'Jeden Tag ein Türchen') : ''}
      ${CONFIG.classApi ? mi('klasse', '🏫', 'Klassen-Challenge', S.klasse ? 'Rangliste deiner Klasse' : 'Mit Klassencode beitreten') : ''}
      <div class="mlabel">Mein Fortschritt</div>
      ${mi('badges', '🏅', 'Abzeichen', `${Object.keys(S.badges).length} von ${BADGES.length} gesammelt`)}
      ${mi('facts', '✖️', 'Einmaleins-Übersicht', 'Welche Reihen sitzen – und welche noch nicht')}
      ${mi('week', '📊', 'Wochenbericht', 'Für Eltern: was geübt wurde, wo es hakt')}
      <div class="mlabel">Mehr</div>
      ${mi('profiles', profile().emoji, 'Wer übt?', 'Profile für Geschwister & Freunde')}
      ${mi('teacher', '👩‍🏫', 'Für Lehrkräfte', 'Aufträge verschicken, Arbeitsblätter drucken')}
      ${mi('settings', '⚙️', 'Einstellungen', 'Ton, Vorlesen, Klassenstufe, Design')}
      ${!isStandalone() && (installPrompt || isIOS()) ? mi('install', '📱', 'Als App installieren', 'Auf den Startbildschirm – läuft auch offline') : ''}
      </div><p class="small muted" style="text-align:center;margin:14px 0 0">Rechenblitz ${APP_VERSION}${n ? ` · ${n} Meldung${n > 1 ? 'en' : ''} wartet auf Versand` : ''}</p>` };
  },

  /* ---------- Fehler melden / Idee ---------- */
  idea() { return PANELS.report({ type: 'idee' }); },
  report(o = {}) {
    const type = o.type || 'aufgabe', ctx = o.ctx !== undefined ? o.ctx : contextNow();
    Sheet.report = { type, ctx };
    const ctxLine = ctx ? `${esc(ctx.task)}${ctx.given ? ` · deine Antwort: <b>${esc(ctx.given)}</b>` : ''} · Lösung der App: <b>${esc(ctx.expected)}</b>` : '';
    return { title: type === 'idee' ? 'Idee oder Feedback' : 'Fehler melden', html: `<form class="form" id="rForm" novalidate>
      <div class="seg" id="rType">${[['aufgabe', 'Aufgabe'], ['app', 'App-Problem'], ['idee', 'Idee']].map(([v, l]) => `<button type="button" data-v="${v}" class="${v === type ? 'sel' : ''}">${l}</button>`).join('')}</div>
      ${ctx ? `<label class="attach"><input type="checkbox" id="rAttach" ${type === 'idee' ? '' : 'checked'}><div><b>Aufgabe anhängen</b><span>${ctxLine}</span></div></label>` : ''}
      <label class="field"><span id="rMsgLabel"></span><textarea id="rMsg" rows="4" maxlength="2000" required></textarea></label>
      <p class="small muted" style="margin:0">Name und E-Mail sind <b>freiwillig</b> und werden nur für Rückfragen zu deiner Meldung genutzt. Ein echter Name ist nicht nötig – ein Spitzname reicht.</p>
      <label class="field"><span>Name oder Spitzname (freiwillig)</span><input id="rName" maxlength="80" autocomplete="name" value="${esc(ROOT.reporter.name)}"></label>
      <label class="field"><span>E-Mail für Rückfragen (freiwillig)</span><input id="rMail" type="email" maxlength="120" autocomplete="email" inputmode="email" value="${esc(ROOT.reporter.email)}"></label>
      <input id="rHp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="small muted" style="margin:0">Mitgeschickt werden deine Nachricht, ggf. die Aufgabe und technische Angaben (App-Version, Browser, Bildschirmgröße). <a href="${esc(CONFIG.privacyUrl)}" target="_blank" rel="noopener">Datenschutz</a></p>
      <button class="btn primary block" id="rSend" type="submit">Meldung senden</button>
      <div class="status" id="rStatus" role="status"></div></form>`, init: initReport, focus: 'rMsg' };
  },

  /* ---------- Einstellungen ---------- */
  settings() {
    const sw = (id, on, t, d) => `<button class="setrow" data-set="${id}" role="switch" aria-checked="${on}"><div><b>${t}</b><span>${d}</span></div><span class="switch ${on ? 'on' : ''}"></span></button>`;
    return { title: 'Einstellungen', html: `<div class="menu">
      ${sw('sound', S.settings.sound, 'Ton', 'Klänge bei richtig, falsch und Serien')}
      ${sw('speech', S.settings.speech, 'Aufgaben vorlesen', 'Der Browser liest jede Aufgabe vor')}
      ${sw('auto', S.settings.auto, 'Automatisch prüfen', 'Prüfen, sobald genug Stellen eingegeben sind')}
      <div class="setrow col"><div><b>Klassenstufe</b><span>Zeigt passende Themen und schlägt Stufen vor</span></div>
        <div class="chips" id="klSeg">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<button data-v="${k}" class="${S.settings.klasse === k ? 'sel' : ''}">${k || 'Alle'}</button>`).join('')}</div></div>
      <div class="setrow col"><div><b>Design</b><span>Hell, dunkel oder wie das Gerät</span></div>
        <div class="seg" id="themeSeg">${[['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([v, l]) => `<button data-v="${v}" class="${S.settings.theme === v ? 'sel' : ''}">${l}</button>`).join('')}</div></div>
      <button class="mi" id="btnReset"><div class="ico">↺</div><div><b>Fortschritt zurücksetzen</b><span>Punkte, Rekorde, Abzeichen und Fehlerkiste dieses Profils löschen</span></div></button>
      </div>`, init: initSettings };
  },

  /* ---------- Profile ---------- */
  profiles() {
    const list = Object.values(ROOT.profiles);
    return { title: 'Wer übt?', html: `<div class="menu">
      ${list.map(p => `<button class="mi ${p.id === ROOT.cur ? 'cur' : ''}" data-prof="${p.id}"><div class="ico big">${p.emoji}</div><div><b>${esc(p.name)}</b><span>Stufe ${levelFromXp(p.data.xp || 0)} · ${p.data.total || 0} gelöst</span></div><span class="chev">${p.id === ROOT.cur ? '✓' : '›'}</span></button>`).join('')}
      <form class="card form" id="profForm" style="box-shadow:none">
        <b id="profFormTitle">Neues Profil</b>
        <label class="field"><span>Name</span><input id="profName" maxlength="20" required placeholder="z. B. Lena"></label>
        <div class="emojis" id="profEmoji">${EMOJIS.map((e, i) => `<button type="button" data-e="${e}" class="${i === 1 ? 'sel' : ''}">${e}</button>`).join('')}</div>
        <div class="row2"><button class="btn primary" type="submit" id="profSave">Anlegen</button><button class="btn" type="button" id="profEdit">Aktuelles bearbeiten</button></div>
        ${list.length > 1 ? '<button class="linkbtn danger" type="button" id="profDel">Aktuelles Profil löschen</button>' : ''}
      </form></div>`, init: initProfiles };
  },

  /* ---------- Abzeichen ---------- */
  badges() {
    const n = Object.keys(S.badges).length;
    return { title: `Abzeichen ${n}/${BADGES.length}`, html: `${n ? '<p class="small muted" style="margin:0 0 10px">Tippe auf ein Abzeichen, um eine Urkunde zu bekommen.</p>' : ''}<div class="badgegrid">${BADGES.map(b => { const d = S.badges[b.id]; return `<${d ? `button data-cert="${b.id}"` : 'div'} class="badge ${d ? 'on' : ''}" title="${esc(b.desc)}"><span>${b.icon}</span><b>${esc(b.name)}</b><small>${d ? fmtDay(d) + ' · Urkunde' : esc(b.desc)}</small></${d ? 'button' : 'div'}>`; }).join('')}</div>` };
  },

  /* ---------- Einmaleins-Übersicht ---------- */
  facts() {
    const cell = (a, b) => { const s = factStatus(`${Math.min(a, b)}x${Math.max(a, b)}`); return `<td class="f${s}" title="${a} · ${b} = ${a * b}">${a * b}</td>`; };
    const rows = [];
    for (let a = 1; a <= 10; a++) rows.push(`<tr><th><button class="rowbtn" data-row="${a}" title="${a}er-Reihe üben">${a}</button></th>${Array.from({ length: 10 }, (_, j) => cell(a, j + 1)).join('')}</tr>`);
    const rowScore = a => { let s = 0; for (let b = 1; b <= 10; b++) s += [0, 0, 1, 2][factStatus(`${Math.min(a, b)}x${Math.max(a, b)}`)]; return s / 20; };
    const weakest = [3, 4, 6, 7, 8, 9].map(a => [a, rowScore(a)]).sort((x, y) => x[1] - y[1])[0];
    return { title: 'Einmaleins-Übersicht', html: `<p class="small muted" style="margin:0 0 10px">Jede Aufgabe aus Mal, Geteilt und Lücken zählt mit. Tippe auf eine Zahl links, um die Reihe gezielt zu üben.</p>
      <div class="facts-wrap"><table class="facts"><tr><th>·</th>${Array.from({ length: 10 }, (_, j) => `<th>${j + 1}</th>`).join('')}</tr>${rows.join('')}</table></div>
      <div class="legend"><span class="f3">sicher</span><span class="f2">fast</span><span class="f1">üben</span><span class="f0">noch offen</span></div>
      <button class="btn primary block" data-row="${weakest[0]}" style="margin-top:12px">${weakest[0]}er-Reihe üben</button>
      <button class="btn block" id="mixWeak" style="margin-top:8px">Unsichere Aufgaben gemischt üben</button>`, init: initFacts };
  },

  /* ---------- Wochenbericht ---------- */
  week() {
    const w = weekData(0), prev = weekData(1);
    const trend = prev.n ? Math.round((w.n - prev.n) / prev.n * 100) : null;
    const days = Array.from({ length: 7 }, (_, i) => dayStr(6 - i)).map(d => { const h = S.hist[d]; return `<div class="wday ${h ? 'on' : ''}"><i style="height:${h ? Math.max(8, Math.min(100, h.n * 2)) : 4}%"></i><span>${new Date(d + 'T12:00').toLocaleDateString('de-DE', { weekday: 'narrow' })}</span></div>`; }).join('');
    const tl = arr => arr.map(([tp, s]) => `<li><b>${TOPICS[tp].name}</b> – ${Math.round(s.acc * 100)} % richtig (${s.n} Aufgaben)</li>`).join('');
    const newB = BADGES.filter(b => S.badges[b.id] && S.badges[b.id] >= dayStr(6));
    return { title: `Wochenbericht · ${esc(profile().name)}`, html: `<div class="report" id="weekReport">
      <div class="wgrid"><div class="stat"><b>${w.days}/7</b><span>Tage geübt</span></div><div class="stat"><b>${w.n}</b><span>Aufgaben</span></div><div class="stat"><b>${w.n ? Math.round(w.ok / w.n * 100) : 0} %</b><span>richtig</span></div><div class="stat"><b>${Math.round(w.ms / 60000)} min</b><span>Übungszeit</span></div></div>
      <div class="wbars">${days}</div>
      ${trend != null ? `<p class="small">${trend >= 0 ? '📈' : '📉'} ${Math.abs(trend)} % ${trend >= 0 ? 'mehr' : 'weniger'} Aufgaben als in der Vorwoche.</p>` : ''}
      ${w.strong.length ? `<h4>Läuft gut</h4><ul>${tl(w.strong)}</ul>` : ''}
      ${w.weak.length ? `<h4>Hier lohnt sich Üben</h4><ul>${tl(w.weak)}</ul>` : ''}
      ${newB.length ? `<h4>Neue Abzeichen</h4><p>${newB.map(b => `${b.icon} ${esc(b.name)}`).join(' · ')}</p>` : ''}
      ${!w.n ? '<p class="muted">Diese Woche wurde noch nicht geübt.</p>' : ''}
      <a class="cta-inline" href="${esc(siteLink(CONFIG.trialUrl, 'wochenbericht'))}" target="_blank" rel="noopener">🎓 Hakt es irgendwo? Kostenlose Probestunde bei Nachhilfe – online</a>
      </div><div class="row2" style="margin-top:12px"><button class="btn primary" id="wkShare">Teilen</button><button class="btn" id="wkPrint">Drucken</button></div>`, init: () => {
        $('wkShare').onclick = () => shareText(weekText(w), 'Rechenblitz Wochenbericht');
        $('wkPrint').onclick = () => printHtml(`<h1>Wochenbericht · ${esc(profile().name)}</h1><p>${fmtDay(dayStr(6))} bis ${fmtDay(dayStr(0))}</p>${$('weekReport').innerHTML}`);
      } };
  },

  /* ---------- Lehrkräfte ---------- */
  teacher() {
    return { title: 'Für Lehrkräfte', html: `<p class="small muted" style="margin:0 0 12px">Alles funktioniert über Links – ohne Anmeldung. Die Schüler brauchen nur Rechenblitz im Browser.</p><div class="menu">
      ${mi('assignCreate', '📝', 'Auftrag erstellen', 'Übung festlegen und als Link verschicken', 'accent')}
      ${mi('resultView', '📥', 'Ergebnis ansehen', 'Link oder Code eines Schülers öffnen')}
      ${mi('worksheet', '🖨️', 'Arbeitsblatt drucken', 'Zufällige Aufgaben mit Lösungsblatt')}
      ${mi('flyer', '📣', 'Flyer & Poster', 'Mit QR-Code zum Aushängen und Verteilen')}
      ${CONFIG.classApi ? mi('classCreate', '🏫', 'Klassen-Challenge anlegen', 'Eine Woche Wettrechnen mit Rangliste') : ''}
      ${mi('facts', '✖️', 'Einmaleins-Übersicht', 'Stand dieses Geräts')}</div>` };
  },
  assignCreate() {
    return { title: 'Auftrag erstellen', html: `<form class="form" id="acForm">
      <label class="field"><span>Titel (optional)</span><input id="acTitle" maxlength="60" placeholder="z. B. Hausaufgabe Bruchrechnung"></label>
      <label class="field"><span>Dein Name (wird angezeigt)</span><input id="acBy" maxlength="40" placeholder="z. B. Frau Müller" value="${esc(localStorage.getItem('rb-teacher') || '')}"></label>
      <div class="row2"><label class="field"><span>Thema</span><select id="acOp">${topicOptions(S.sel.op)}</select></label><label class="field"><span>Stufe</span><select id="acLvl">${levelOptions(currentLevel(S.sel.op))}</select></label></div>
      <p class="small muted" id="acDesc" style="margin:-4px 0 0"></p>
      <div class="row2"><label class="field"><span>Modus</span><select id="acMode"><option value="training">Training (20 Aufgaben)</option><option value="blitz">Blitzrunde (60 s)</option></select></label><label class="field"><span>Wie oft?</span><select id="acRuns">${[1, 2, 3, 4, 5].map(n => `<option ${n === 3 ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
      <div class="row2"><label class="field"><span>Mindestens richtig</span><select id="acMin"><option value="0">egal</option><option value="60">60 %</option><option value="80" selected>80 %</option><option value="90">90 %</option></select></label><label class="field"><span>Bis (optional)</span><input id="acDue" type="date"></label></div>
      <label class="attach"><input type="checkbox" id="acSeed" checked><div><b>Gleiche Aufgaben für alle</b><span>Alle Schüler bekommen dieselben Aufgaben (gut zum Besprechen).</span></div></label>
      <button class="btn primary block" type="submit">Link erstellen</button>
      <div id="acOut"></div></form>`, init: initAssignCreate };
  },
  resultView(o = {}) {
    if (o.data) return { title: 'Ergebnis', html: resultHtml(o.data) };
    return { title: 'Ergebnis ansehen', html: `<form class="form" id="rvForm"><label class="field"><span>Link oder Code einfügen</span><textarea id="rvIn" rows="3" placeholder="https://…#ergebnis=…"></textarea></label><button class="btn primary block">Anzeigen</button><div class="status err" id="rvErr"></div></form>`,
      init() { $('rvForm').onsubmit = e => { e.preventDefault(); const m = $('rvIn').value.trim().match(/ergebnis=([\w-]+)/) || [0, $('rvIn').value.trim()]; try { showPanel('resultView', { data: b64d(m[1]) }, true); } catch { $('rvErr').textContent = 'Der Code konnte nicht gelesen werden.'; } }; } };
  },
  worksheet() {
    return { title: 'Arbeitsblatt drucken', html: `<form class="form" id="wsForm">
      <label class="field"><span>Überschrift</span><input id="wsTitle" maxlength="60" value="Kopfrechnen"></label>
      <div class="row2"><label class="field"><span>Thema</span><select id="wsOp">${topicOptions(S.sel.op)}</select></label><label class="field"><span>Stufe</span><select id="wsLvl">${levelOptions(currentLevel(S.sel.op))}</select></label></div>
      <div class="row2"><label class="field"><span>Anzahl</span><select id="wsN">${[12, 20, 30, 40].map(n => `<option ${n === 20 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="attach" style="align-self:end"><input type="checkbox" id="wsSol" checked><div><b>Lösungsblatt</b></div></label></div>
      <button class="btn primary block" type="submit">Drucken / als PDF speichern</button></form>`, init: initWorksheet };
  },

  /* ---------- Einstufungstest ---------- */
  testStart() {
    return { title: 'Einstufungstest', html: `<p style="margin:0 0 12px">In welche Klasse gehst du? Danach bekommst du etwa 18 Aufgaben aus den wichtigsten Themen deiner Klassenstufe – ohne Zeitdruck. Am Ende siehst du, was schon sitzt und welche Stufe zu dir passt.</p>
      <div class="chips big" id="tsK">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<button data-v="${k}" class="${S.settings.klasse === k ? 'sel' : ''}">${k}</button>`).join('')}</div>`,
      init() { $('tsK').onclick = e => { const b = e.target.closest('button'); if (!b) return; closeSheet(); startTest(+b.dataset.v); }; } };
  },

  install() {
    return { title: 'Als App installieren', html: installPrompt
      ? '<p>Installiere Rechenblitz auf deinem Gerät. Dann startet es wie eine App vom Startbildschirm und funktioniert auch ohne Internet.</p><button class="btn primary block" id="btnInstall">Jetzt installieren</button>'
      : '<p>So kommt Rechenblitz auf deinen Startbildschirm:</p><ol style="padding-left:20px;line-height:1.8"><li>Tippe in Safari unten auf <b>Teilen</b> (□↑).</li><li>Wähle <b>Zum Home-Bildschirm</b>.</li><li>Tippe auf <b>Hinzufügen</b>.</li></ol>',
      init() { const b = $('btnInstall'); if (b) b.onclick = async () => { installPrompt.prompt(); await installPrompt.userChoice.catch(() => {}); installPrompt = null; closeSheet(); }; } };
  },
  shareBox(o) {
    return { title: 'Teilen', html: `<p class="small muted" style="margin:0 0 8px">Kopiere den Text und schicke ihn z. B. per WhatsApp oder E-Mail.</p><textarea class="sharebox" readonly rows="6">${esc(o.text)}</textarea>`, init() { const t = $('sheetBody').querySelector('textarea'); t.focus(); t.select(); } };
  },
};

/* ---------- Sheet-Steuerung ---------- */
function openSheet(panel = 'menu', opts) {
  Sound.init();
  if (!Sheet.open) { Sheet.open = true; $('sheetBg').hidden = false; pauseGame(true); Sheet.lastFocus = document.activeElement; Sheet.stack = []; }
  showPanel(panel, opts, true);
}
function showPanel(panel, opts, push) {
  if (push) Sheet.stack.push([panel, opts]);
  const p = PANELS[panel](opts);
  $('sheetTitle').innerHTML = p.title;
  $('sheetBody').innerHTML = p.html;
  $('sheetBack').hidden = Sheet.stack.length < 2;
  $('sheetBody').scrollTop = 0; $('sheetBody').parentElement.scrollTop = 0;
  p.init && p.init();
  (p.focus ? $(p.focus) : $('sheetClose')).focus({ preventScroll: true });
}
function closeSheet() { Sheet.open = false; $('sheetBg').hidden = true; pauseGame(false); Sheet.lastFocus?.focus?.(); }
$('fab').onclick = () => { Sound.click(); Sheet.open ? closeSheet() : openSheet('menu'); };
$('sheetClose').onclick = closeSheet;
$('sheetBack').onclick = () => { Sheet.stack.pop(); const [p, o] = Sheet.stack[Sheet.stack.length - 1] || ['menu']; showPanel(p, o); };
$('sheetBg').addEventListener('click', e => { if (e.target === $('sheetBg')) closeSheet(); });
$('sheetBody').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) showPanel(b.dataset.go, {}, true); });
document.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openSheet(b.dataset.open); });

/* ---------- Einstellungen ---------- */
function initSettings() {
  $('sheetBody').querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    const k = b.dataset.set; S.settings[k] = !S.settings[k]; save(); Sound.init(); Sound.click();
    b.setAttribute('aria-checked', S.settings[k]); b.querySelector('.switch').classList.toggle('on', S.settings[k]);
    if (k === 'speech' && S.settings.speech) speak('3 mal 4');
    renderHome();
  });
  $('klSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.klasse = +b.dataset.v; homeShowAll = false; save(); $('klSeg').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); renderHome(); };
  $('themeSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.theme = b.dataset.v; save(); applyTheme(); $('themeSeg').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); };
  $('btnReset').onclick = () => {
    if (!confirm(`Wirklich den gesamten Fortschritt von „${profile().name}“ löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    const keep = { settings: S.settings, sel: S.sel };
    ROOT.profiles[ROOT.cur].data = Object.assign(PROFILE_DEFAULT(), keep); useProfile(ROOT.cur);
    save(); renderHome(); closeSheet(); toast('Fortschritt zurückgesetzt');
  };
}

/* ---------- Profile ---------- */
function initProfiles() {
  let emoji = EMOJIS[1], editing = false;
  $('profEmoji').onclick = e => { const b = e.target.closest('button'); if (!b) return; emoji = b.dataset.e; $('profEmoji').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); };
  $('sheetBody').querySelectorAll('[data-prof]').forEach(b => b.onclick = () => { useProfile(b.dataset.prof); save(); applyTheme(); renderHome(); closeSheet(); toast(`Hallo ${esc(profile().name)}! ${profile().emoji}`); });
  $('profEdit').onclick = () => {
    editing = true; const p = profile(); $('profFormTitle').textContent = 'Profil bearbeiten'; $('profName').value = p.name; $('profSave').textContent = 'Speichern';
    emoji = p.emoji; $('profEmoji').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x.dataset.e === emoji)); $('profName').focus();
  };
  $('profForm').onsubmit = e => {
    e.preventDefault(); const name = $('profName').value.trim(); if (!name) return $('profName').focus();
    if (editing) Object.assign(profile(), { name, emoji });
    else { const id = 'p' + Date.now().toString(36); ROOT.profiles[id] = { id, name, emoji, data: PROFILE_DEFAULT() }; useProfile(id); }
    save(); applyTheme(); renderHome(); closeSheet(); toast(`${emoji} ${esc(name)}`);
  };
  $('profDel') && ($('profDel').onclick = () => {
    if (!confirm(`Profil „${profile().name}“ mit allen Daten löschen?`)) return;
    delete ROOT.profiles[ROOT.cur]; useProfile(Object.keys(ROOT.profiles)[0]); save(); applyTheme(); renderHome(); showPanel('profiles');
  });
}

/* ---------- Einmaleins ---------- */
function initFacts() {
  $('sheetBody').querySelectorAll('[data-row]').forEach(b => b.onclick = () => {
    const r = +b.dataset.row; closeSheet();
    startGame('row', { op: 'mul', lvl: 1, title: `${r}er-Reihe`, gen: () => { const x = rnd(1, 10), t = coin() ? GEN.mul(1) : GEN.div(1); const mul = t.e[1].v === '·'; const e = mul ? (coin() ? [N(x), O('·'), N(r)] : [N(r), O('·'), N(x)]) : [N(x * r), O(':'), N(r)]; return { e, a: I(mul ? x * r : x), w: mul ? mulW(x, r) : divW(x * r, r), fact: factKey(x, r), topic: mul ? 'mul' : 'div', lvl: 1 }; } });
  });
  $('mixWeak').onclick = () => {
    if (!ENGINE.weakFact()) { toast('Noch keine unsicheren Aufgaben – erst etwas üben!'); return; }
    closeSheet();
    startGame('row', { op: 'mul', lvl: 1, title: 'Unsichere Aufgaben', gen: () => { const [a, b] = ENGINE.weakFact() || MUL[1](); return coin() ? { e: [N(a), O('·'), N(b)], a: I(a * b), w: mulW(a, b), fact: factKey(a, b), topic: 'mul', lvl: 1 } : { e: [N(a * b), O(':'), N(b)], a: I(a), w: divW(a * b, b), fact: factKey(a, b), topic: 'div', lvl: 1 }; } });
  };
}

/* ---------- Wochenbericht ---------- */
function weekData(back) {
  const r = { n: 0, ok: 0, ms: 0, days: 0, tp: {} };
  for (let i = 0; i < 7; i++) {
    const h = S.hist[dayStr(back * 7 + i)]; if (!h) continue;
    r.days++; r.n += h.n; r.ok += h.ok; r.ms += h.ms;
    for (const [tp, [ok, bad]] of Object.entries(h.tp)) { const x = r.tp[tp] || (r.tp[tp] = { ok: 0, n: 0 }); x.ok += ok; x.n += ok + bad; }
  }
  const list = Object.entries(r.tp).filter(([, s]) => s.n >= 5).map(([tp, s]) => [tp, { ...s, acc: s.ok / s.n }]).sort((a, b) => b[1].acc - a[1].acc);
  r.strong = list.filter(([, s]) => s.acc >= .85).slice(0, 3);
  r.weak = list.filter(([, s]) => s.acc < .75).reverse().slice(0, 3);
  return r;
}
const weekText = w => `Rechenblitz – Wochenbericht für ${profile().name}\n${fmtDay(dayStr(6))} bis ${fmtDay(dayStr(0))}\n\n• ${w.days} von 7 Tagen geübt\n• ${w.n} Aufgaben, ${w.n ? Math.round(w.ok / w.n * 100) : 0} % richtig\n• ${Math.round(w.ms / 60000)} Minuten Übungszeit`
  + (w.strong.length ? `\n\nLäuft gut: ${w.strong.map(([t]) => TOPICS[t].name).join(', ')}` : '') + (w.weak.length ? `\nHier lohnt sich Üben: ${w.weak.map(([t]) => TOPICS[t].name).join(', ')}` : '')
  + `\n\nKostenlose Probestunde: ${siteLink(CONFIG.trialUrl, 'wochenbericht-geteilt')}`;

/* ---------- Auftrag erstellen ---------- */
function initAssignCreate() {
  const desc = () => { $('acDesc').textContent = LEVEL_DESC[$('acOp').value][+$('acLvl').value]; };
  $('acOp').onchange = desc; $('acLvl').onchange = desc; desc();
  $('acForm').onsubmit = e => {
    e.preventDefault();
    const by = $('acBy').value.trim(); try { localStorage.setItem('rb-teacher', by); } catch {}
    const a = { i: Date.now().toString(36), t: $('acTitle').value.trim(), by, op: $('acOp').value, l: +$('acLvl').value, m: $('acMode').value, r: +$('acRuns').value, min: +$('acMin').value, due: $('acDue').value || '', s: $('acSeed').checked ? Math.floor(Math.random() * 1e9) : 0 };
    const url = `${appUrl()}#auftrag=${b64e(a)}`;
    const txt = `${a.t || 'Rechenblitz-Auftrag'}${a.by ? ' von ' + a.by : ''}: ${TOPICS[a.op].name}, Stufe ${a.l + 1}, ${a.r}× ${a.m === 'blitz' ? 'Blitzrunde' : 'Training'}${a.due ? ', bis ' + fmtDay(a.due) : ''}.\nÖffnen: ${url}`;
    $('acOut').innerHTML = `<div class="card" style="box-shadow:none"><b>Link für die Schüler</b><textarea class="sharebox" readonly rows="3">${esc(url)}</textarea><div class="row2"><button type="button" class="btn primary" id="acShare">Teilen</button><button type="button" class="btn" id="acCopy">Kopieren</button></div><p class="small muted" style="margin:8px 0 0">Wenn alle Runden geschafft sind, schicken die Schüler dir ein Ergebnis-Link zurück. Den öffnest du einfach – oder unter „Ergebnis ansehen“.</p></div>`;
    $('acShare').onclick = () => shareText(txt, 'Rechenblitz-Auftrag');
    $('acCopy').onclick = async () => { try { await navigator.clipboard.writeText(url); toast('Link kopiert ✓'); } catch { $('acOut').querySelector('textarea').select(); } };
    $('acOut').scrollIntoView({ behavior: 'smooth' });
  };
}
function resultHtml(d) {
  const done = d.runs.filter(r => r.ok).length;
  return `<div class="report"><p style="margin:0"><b>${esc(d.n || 'Unbekannt')}</b> · ${esc(d.t || TOPICS[d.op]?.name + ' Stufe ' + (d.l + 1))}</p>
    <p class="muted small" style="margin:2px 0 10px">${esc(TOPICS[d.op]?.name || d.op)} · Stufe ${d.l + 1} · ${d.m === 'blitz' ? 'Blitzrunde' : 'Training'}${d.min ? ` · mind. ${d.min} %` : ''}${d.by ? ` · Auftrag von ${esc(d.by)}` : ''}</p>
    <div class="wgrid"><div class="stat"><b>${done}/${d.r}</b><span>geschafft</span></div><div class="stat"><b>${d.runs.length}</b><span>Versuche</span></div><div class="stat"><b>${d.runs.length ? Math.round(d.runs.reduce((s, r) => s + r.c, 0) / Math.max(1, d.runs.reduce((s, r) => s + r.c + r.w, 0)) * 100) : 0} %</b><span>richtig</span></div></div>
    <table class="rtable"><tr><th>Datum</th><th>Richtig</th><th>Zeit/Aufg.</th><th>Punkte</th></tr>${d.runs.map(r => `<tr class="${r.ok ? '' : 'no'}"><td>${fmtDay(r.d)}</td><td>${r.c}/${r.c + r.w}${r.ok ? ' ✓' : ''}</td><td>${r.ms ? fmtSec(r.ms) : '–'}</td><td>${r.sc}</td></tr>`).join('')}</table>
    ${d.runs.some(r => r.mi.length) ? `<h4>Fehler</h4><ul>${d.runs.flatMap(r => r.mi).slice(0, 20).map(([t, g, e]) => `<li>${esc(t)} → <b>${esc(e)}</b> <span class="muted">(gegeben: ${esc(g)})</span></li>`).join('')}</ul>` : ''}
    <p class="small muted">Hinweis: Ergebnis-Links werden auf dem Gerät des Schülers erzeugt und sind nicht fälschungssicher.</p></div>`;
}

/* ---------- Arbeitsblatt ---------- */
function initWorksheet() {
  $('wsForm').onsubmit = e => {
    e.preventDefault();
    const op = $('wsOp').value, lvl = +$('wsLvl').value, n = +$('wsN').value, title = $('wsTitle').value.trim() || 'Kopfrechnen';
    const seen = new Set(), tasks = [];
    for (let tries = 0; tasks.length < n && tries < n * 30; tries++) { const t = makeTask(op, lvl), k = keyOf(t); if (seen.has(k) && tries < n * 25) continue; seen.add(k); tasks.push(t); }
    const story = tasks.some(t => t.story);
    const item = (t, i, sol) => `<li><span class="wn">${i + 1}.</span><span class="wt">${t.e.map(tokHtml).join('')}${t.noEq ? '' : `<span class="eq">${t.eqSign || '='}</span>`}${t.hint && !sol ? `<small> (${esc(t.hint)})</small>` : ''}</span><span class="wl">${sol ? `<b>${esc(showAns(t.a))}</b>` : ''}${t.unit ? ' ' + esc(t.unit) : ''}</span></li>`;
    const head = `<div class="ws-head"><div><h1>${esc(title)}</h1><p>${esc(TOPICS[op].name)} · Stufe ${lvl + 1}: ${esc(LEVEL_DESC[op][lvl])}</p></div><div class="ws-name">Name: ______________________<br>Datum: ____________</div></div>`;
    let html = `${head}<ol class="ws ${story ? 'one' : ''}">${tasks.map((t, i) => item(t, i, false)).join('')}</ol>`;
    if ($('wsSol').checked) html += `<div class="ws-page"><h2>Lösungen – ${esc(title)}</h2><ol class="ws sol ${story ? 'one' : ''}">${tasks.map((t, i) => item(t, i, true)).join('')}</ol></div>`;
    printHtml(html);
  };
}
function printHtml(html) {
  $('print').innerHTML = `<div class="print-brand"><img src="icons/logo.svg" alt=""> Rechenblitz · Nachhilfe – online · mathenachhilfe-online.com</div>${html}`;
  document.body.classList.add('printing');
  setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing'), 500); }, 100);
}

/* ---------- Melden: Versand ---------- */
const MSG_LABEL = { aufgabe: ['Was stimmt nicht?', 'z. B. „Bei 3/4 + 1/8 müsste 7/8 herauskommen.“'], app: ['Was ist passiert?', 'z. B. „Auf meinem iPad kommt kein Ton.“'], idee: ['Deine Idee', 'Was würdest du dir wünschen?'] };
function initReport() {
  const setType = v => {
    Sheet.report.type = v;
    $('rType').querySelectorAll('button').forEach(b => b.classList.toggle('sel', b.dataset.v === v));
    $('rMsgLabel').textContent = MSG_LABEL[v][0]; $('rMsg').placeholder = MSG_LABEL[v][1];
    $('sheetTitle').textContent = v === 'idee' ? 'Idee oder Feedback' : 'Fehler melden';
  };
  setType(Sheet.report.type);
  $('rType').onclick = e => { const b = e.target.closest('button'); if (b) setType(b.dataset.v); };
  $('rForm').onsubmit = async e => {
    e.preventDefault();
    const msg = $('rMsg').value.trim(), st = $('rStatus');
    if (msg.length < 3) { st.className = 'status err'; st.textContent = 'Bitte beschreibe kurz, worum es geht.'; $('rMsg').focus(); return; }
    const mail = $('rMail').value.trim();
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { st.className = 'status err'; st.textContent = 'Die E-Mail-Adresse sieht nicht richtig aus.'; return; }
    if (Date.now() - (ROOT.lastReportAt || 0) < 15000) { st.className = 'status err'; st.textContent = 'Bitte warte einen Moment, bevor du noch etwas sendest.'; return; }
    ROOT.reporter = { name: $('rName').value.trim(), email: mail };
    const payload = fitSize(buildReport(Sheet.report.type, msg, $('rAttach')?.checked ? Sheet.report.ctx : null));
    $('rSend').disabled = true; st.className = 'status'; st.textContent = 'Wird gesendet …';
    if ($('rHp').value) { reportDone('sent'); return; }       // Spam-Falle
    ROOT.lastReportAt = Date.now(); save();
    reportDone(await deliver(payload), payload);
  };
}
function buildReport(type, message, ctx) {
  let task = null;
  if (ctx) { const { _task, ...rest } = ctx; task = rest; if (_task) task.raw = { topic: _task.topic, level: _task.lvl + 1, expr: _task.e, answer: _task.a, steps: _task.w }; }
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(), type, message, name: ROOT.reporter.name, email: ROOT.reporter.email, task,
    app: { name: 'Rechenblitz', version: APP_VERSION, url: location.href.split('#')[0], screen: currentScreen(), standalone: isStandalone(), userAgent: navigator.userAgent,
      language: navigator.language, viewport: `${innerWidth}x${innerHeight}`, theme: isDark() ? 'dark' : 'light',
      settings: { ...S.settings }, selection: { topic: S.sel.op, level: S.sel.lvl === 'auto' ? 'auto' : S.sel.lvl + 1 } },
  };
}
async function postReport(p) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(CONFIG.reportEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p), signal: ctl.signal });
    if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
  } finally { clearTimeout(to); }
}
async function deliver(p) {   // klappt der Versand nicht, bleibt die Meldung im Postausgang
  if (!CONFIG.reportEndpoint) { ROOT.outbox.push(p); save(); return 'noendpoint'; }
  try { await postReport(p); return 'sent'; }
  catch (e) {
    if (e.status === 400) return 'invalid';                    // vom Server abgelehnt – nicht erneut senden
    ROOT.outbox.push(p); save();
    return e.status === 429 ? 'ratelimit' : 'queued';
  }
}
async function flushOutbox() {
  if (!CONFIG.reportEndpoint || !ROOT.outbox.length || !navigator.onLine) return;
  const queue = ROOT.outbox.slice(), rest = [];
  for (let i = 0; i < queue.length; i++) {
    try { await postReport(queue[i]); }
    catch (e) {
      if (e.status === 400) continue;                          // abgelehnt → verwerfen
      if (e.status === 429) { rest.push(...queue.slice(i)); break; }   // Ratenbremse → später weiter
      rest.push(queue[i]);
    }
  }
  ROOT.outbox = rest; save();
}
// Meldungen dürfen höchstens 16 KB groß sein – zur Not die Rohdaten der Aufgabe weglassen
function fitSize(p) { if (JSON.stringify(p).length > 15000 && p.task) delete p.task.raw; if (JSON.stringify(p).length > 15000) p.app.userAgent = p.app.userAgent.slice(0, 200); return p; }
function reportDone(res, payload) {
  const box = (icon, color, title, text, extra = '') => `<div class="thanks"><div class="ok" ${color ? `style="color:var(--orange-d);background:rgba(255,116,24,.12)"` : ''}>${icon}</div><h3>${title}</h3><p class="muted">${text}</p>${extra}<button class="btn ${extra ? '' : 'dark'} block" id="thxClose" style="margin-top:8px">${extra ? 'Schließen' : 'Weiter'}</button></div>`;
  if (res === 'sent') $('sheetBody').innerHTML = box('✓', false, 'Danke für deine Meldung!', `Wir schauen sie uns an${ROOT.reporter.email ? ' und melden uns bei Bedarf per E-Mail' : ''}.`);
  else if (res === 'ratelimit') $('sheetBody').innerHTML = box('⏳', true, 'Gespeichert', 'Gerade wurden sehr viele Meldungen gesendet. Deine Meldung ist gespeichert und wird später automatisch übertragen.');
  else if (res === 'invalid') $('sheetBody').innerHTML = box('⚠️', true, 'Das hat nicht geklappt', 'Die Meldung konnte nicht angenommen werden. Bitte versuche es noch einmal mit einer etwas ausführlicheren Beschreibung.');
  else if (res === 'queued') $('sheetBody').innerHTML = box('⏳', true, 'Gespeichert', 'Gerade gibt es keine Verbindung. Deine Meldung wird automatisch gesendet, sobald du wieder online bist.');
  else {
    const body = `${payload.message}\n\n${payload.task ? `Aufgabe: ${payload.task.task}\nAntwort: ${payload.task.given || '–'}\nLösung der App: ${payload.task.expected}\n` : ''}\nRechenblitz ${APP_VERSION} · ${navigator.userAgent}`;
    const href = `mailto:${CONFIG.fallbackMail}?subject=${encodeURIComponent('Rechenblitz: ' + (payload.type === 'idee' ? 'Idee' : 'Fehlermeldung'))}&body=${encodeURIComponent(body)}`;
    $('sheetBody').innerHTML = box('✉️', true, 'Fast geschafft', 'Der direkte Versand ist hier noch nicht eingerichtet. Deine Meldung ist gespeichert und wird später automatisch übertragen – oder du schickst sie gleich per E-Mail.', `<a class="btn primary block" href="${href}">Per E-Mail senden</a>`);
  }
  $('thxClose').onclick = closeSheet;
}
addEventListener('online', flushOutbox);

/* ---------- Werbung für die Website ---------- */
const PROMOS = [
  ['🎓', 'Kostenlose Probestunde', 'Persönliche Online-Nachhilfe 1:1 – die erste Stunde ist gratis.', 'probestunde', () => CONFIG.trialUrl],
  ['⭐', '5,0 Sterne bei Google', 'Über 600 Familien bewerten Nachhilfe – online mit 5 Sternen.', 'bewertungen', () => CONFIG.websiteUrl],
  ['👩‍🏫', 'Feste Lehrkraft, die passt', 'Mathe, Deutsch, Englisch, Physik & mehr – von der Grundschule bis zum Abschluss.', 'faecher', () => CONFIG.websiteUrl],
  ['📈', 'Bessere Noten, weniger Stress', 'Gezielte Hilfe genau bei den Themen, die noch haken.', 'noten', () => CONFIG.websiteUrl],
];
function renderPromo() {
  const i = Math.floor(Date.now() / 864e5 + Math.random() * 4) % PROMOS.length, [icon, title, text, place, url] = PROMOS[i];
  $('promo').innerHTML = `<div class="pr-ico">${icon}</div><div class="pr-txt"><span class="eyebrow">Nachhilfe – online</span><b>${title}</b><p>${text}</p></div><a class="btn primary small" href="${esc(siteLink(url(), 'promo-' + place))}" target="_blank" rel="noopener">Zur Website ↗</a>`;
}

/* ---------- Links (#auftrag=… / #ergebnis=…) ---------- */
function handleHash() {
  const h = location.hash;
  const m = h.match(/^#(auftrag|ergebnis)=([\w-]+)/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  let data; try { data = b64d(m[2]); } catch { toast('Der Link ist leider beschädigt.'); return; }
  if (m[1] === 'ergebnis') { openSheet('resultView', { data }); return; }
  if (!data.op || !TOPICS[data.op]) return;
  if (S.assign && S.assign.i === data.i) { toast('Diesen Auftrag hast du schon.'); return; }
  S.assign = { ...data, runs: [] }; save();
  if (['game', 'duel'].includes(currentScreen())) { toast('📝 Neuer Auftrag gespeichert – du findest ihn auf der Startseite.', 2600); return; }
  if (Sheet.open) closeSheet();
  goHome();
  toast('📝 Neuer Auftrag gespeichert!', 2200);
  scrollTo({ top: 0, behavior: 'smooth' });
}
addEventListener('hashchange', handleHash);

/* ================= Start ================= */
function init() {
  loadRoot(); applyTheme();
  for (const [id, url, place] of [['lnkSite', CONFIG.websiteUrl, 'footer'], ['lnkImp', CONFIG.imprintUrl], ['lnkPriv', CONFIG.privacyUrl], ['btnSite', CONFIG.websiteUrl, 'header'], ['resultSite', CONFIG.websiteUrl, 'result']]) { const el = $(id); if (el) el.href = place ? siteLink(url, place) : url; }
  $('verText').textContent = 'Version ' + APP_VERSION;
  if (CONFIG.lernraumUrl) { $('btnLernraum').href = siteLink(CONFIG.lernraumUrl, 'lernraum'); $('btnLernraum').hidden = false; $('topbarText').hidden = true; }
  $('btnProfile').onclick = () => openSheet('profiles');
  renderPromo(); renderHome(); handleHash(); handleParams(); flushOutbox(); submitClassPoints();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
