'use strict';
/* =====================================================================
   Rechenblitz – Menü (schwebender Button) und alle Panels:
   Melden, Einstellungen, Profile, Abzeichen, Einmaleins-Übersicht,
   Wochenbericht, Lehrkräfte (Auftrag, Ergebnis, Arbeitsblatt), Einstufung
   ===================================================================== */
const Sheet = { open: false, stack: [] };
let installPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; renderInstall(); });
// „App installieren“ (Leitstand 18.11.: nur noch Web-App/PWA): gut sichtbar auf der Startseite und in den Einstellungen,
// nur solange die App nicht installiert ist. Android/Chrome/Edge: Installationsdialog des Browsers, iPhone/iPad: kurze Anleitung.
const canInstall = () => !isStandalone() && (!!installPrompt || isIOS());
async function doInstall() {
  if (!installPrompt) return openSheet('install');
  installPrompt.prompt(); const r = await installPrompt.userChoice.catch(() => null); installPrompt = null; renderInstall();
  if (r && r.outcome === 'accepted') toast('📱 Zahlensprint wird installiert');
}
function renderInstall() { const b = $('installCta'); if (b) b.hidden = !canInstall(); }
addEventListener('appinstalled', () => { installPrompt = null; renderInstall(); });
document.addEventListener('click', e => { if (e.target.closest('#installCta, [data-install]')) { Sound.init(); Sound.click(); closeSheet(); doInstall(); } });
const isStandalone = () => IS_NATIVE || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// Links zur Website mit Kennung, damit man in der Statistik sieht, dass Besucher aus der App kommen
const siteLink = (url, place) => { if (!CONFIG.utm) return url; try { const u = new URL(url); u.searchParams.set('utm_source', 'rechenblitz'); u.searchParams.set('utm_medium', 'app'); u.searchParams.set('utm_campaign', place); return u.toString(); } catch { return url; } };
const mi = (go, icon, title, sub, extra = '') => `<button class="mi ${extra}" data-go="${go}"><div class="ico">${icon}</div><div><b>${title}</b><span>${sub}</span></div><span class="chev">›</span></button>`;
const miLink = (href, icon, title, sub, extra = '') => `<a class="mi ${extra}" href="${esc(href)}" target="_blank" rel="noopener"><div class="ico">${icon}</div><div><b>${title}</b><span>${sub}</span></div><span class="chev">↗</span></a>`;
const topicOptions = sel => Object.entries(TOPICS).map(([k, o]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${o.name}</option>`).join('');
const levelOptions = sel => [0, 1, 2, 3, 4, 5].map(i => `<option value="${i}" ${i === sel ? 'selected' : ''} ${i === 5 && !hasPro() ? 'disabled' : ''}>${lvlName(i)}${i === 5 && !hasPro() ? ' 🔒' : ''}</option>`).join('');

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
      ${mi('theorie', '📖', 'Theorie', 'Regeln und Beispiele zu allen Themen')}
      ${mi('idea', '💡', 'Idee oder Feedback', 'Was sollen wir verbessern?')}
      ${miLink(siteLink(CONFIG.websiteUrl, 'menu'), '🌐', 'Zu Nachhilfe – online', 'Online-Nachhilfe 1:1 in Mathe & mehr', 'accent')}
      ${CONFIG.lernraumUrl ? `<a class="mi" href="${esc(siteLink(CONFIG.lernraumUrl, 'menu-lernraum'))}"><div class="ico">📚</div><div><b>Zurück zum Lernraum</b><span>Weitere Lernspiele und Übungen</span></div><span class="chev">←</span></a>` : ''}
      ${mi('news', '🆕', 'Was ist neu?', `Version ${versionLabel()}`)}
      ${mi('invite', '💌', 'Freunde einladen', 'Zahlensprint ist kostenlos – teile es!')}
      ${adventPhase() !== 'off' ? mi('advent', '🎄', 'Rechen-Adventskalender', 'Jeden Tag ein Türchen') : ''}
      ${CONFIG.classApi ? mi('klasse', '🏫', 'Klassen-Challenge', S.klasse ? 'Rangliste deiner Klasse' : 'Mit Klassencode beitreten') : ''}
      <div class="mlabel">Mein Fortschritt</div>
      ${mi('reise', '🗺️', 'Rechen-Reise', `${reiseTotalStars()} Sterne gesammelt`)}
      ${mi('merk', '🧠', 'Merk-Training', `${merkSolidAll()} Aufgaben sitzen fest`)}
      ${mi('badges', '🏅', 'Abzeichen', `${Object.keys(S.badges).length} von ${BADGES.length} gesammelt`)}
      ${mi('facts', '✖️', 'Einmaleins-Übersicht', 'Welche Reihen sitzen – und welche noch nicht')}
      <div class="mlabel">Mehr</div>
      ${mi('eltern', '👪', 'Elternbereich', 'Berichte, Lern-Geschenk, Einstellungen für Eltern')}
      ${mi('profiles', profile().emoji, 'Wer übt?', 'Profile für Geschwister & Freunde')}
      ${mi('teacher', '👩‍🏫', 'Für Lehrkräfte', 'Aufträge verschicken, Arbeitsblätter drucken')}
      ${proLocks() || RBPRO.ok ? mi('pro', '⭐', RBPRO.ok ? 'Zahlensprint Pro <span class="pro-on static">Pro aktiv</span>' : 'Zahlensprint Pro', RBPRO.ok ? 'Gilt in der Web-App auf diesem Gerät – für alle Profile' : 'Profi-Stufe, mehr Profile, Elternbericht', RBPRO.ok ? 'pro-active' : '') : ''}
      ${mi('settings', '⚙️', 'Einstellungen', 'Ton, Erinnerung, Klassenstufe, Design')}
      ${!isStandalone() && (installPrompt || isIOS()) ? mi('install', '📱', 'App installieren', 'Auf den Startbildschirm – läuft auch offline') : ''}
      </div><p class="small muted" style="text-align:center;margin:14px 0 0">Zahlensprint ${versionLabel()}${frueherAn() ? ' · früher Rechenblitz' : ''}${n ? ` · ${n} Meldung${n > 1 ? 'en' : ''} wartet auf Versand` : ''}</p>` };
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

  whatsnew(o = {}) {
    const items = CHANGELOG.filter(([v]) => verNum(v) > verNum(o.since || '0')).slice(0, 4);
    return { title: 'Neu in Zahlensprint', html: `<div class="wn">${bzOn() ? blitzSay('wave', 'Schau mal, was es Neues gibt!', 64) : ''}
      ${frueherAn() ? '<p class="small muted" style="margin:0">Zahlensprint ist der neue Name von Rechenblitz</p>' : ''}
      ${items.map(([v, d, its]) => `<div class="wn-v"><span translate="no">Version ${v}</span> · ${fmtDateShort(d)}</div><ul class="wn-list">${its.map(i => `<li><span class="wn-i">✨</span><span>${esc(i)}</span></li>`).join('')}</ul>`).join('')}
      <button class="btn primary block" id="wnGo">Los geht’s!</button><button class="linkbtn" data-go="news" style="align-self:center">Alle Neuerungen ansehen</button></div>`,
      init() { $('wnGo').onclick = closeSheet; } };
  },
  welcome() {
    return { title: 'Willkommen!', html: `<div class="wn">${blitzSay('wave', '<b>Hallo, ich bin Blitz!</b> Ich helfe dir beim Kopfrechnen – mit Tricks, Bildern und ganz viel Jubel.', 72)}
      <ul class="wn-list"><li><span class="wn-i">1️⃣</span><span>Wähle ein Thema – oder lass die App die Stufe finden.</span></li>
      <li><span class="wn-i">2️⃣</span><span>Drück „Los geht’s“ und rechne so schnell du kannst.</span></li>
      <li><span class="wn-i">🧠</span><span>Im Merk-Training wird jede gemerkte Aufgabe ein Stern an deinem Himmel.</span></li></ul>
      <button class="btn primary block" id="wnGo">Los geht’s!</button></div>`, init() { $('wnGo').onclick = closeSheet; } };
  },
  news() {
    return { title: 'Was ist neu?', html: `<div class="news">${CHANGELOG.map(([v, d, items]) => `<div class="nv"><div class="nv-head"><b translate="no">Version ${v}</b><span>${fmtDateShort(d)}</span></div><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>` };
  },

  /* ---------- Einstellungen ---------- */
  settings() {
    const sw = (id, on, t, d) => `<button class="setrow" data-set="${id}" role="switch" aria-checked="${on}"><div><b>${t}</b><span>${d}</span></div><span class="switch ${on ? 'on' : ''}"></span></button>`;
    return { title: 'Einstellungen', html: `<div class="menu">
      ${canInstall() ? '<button class="btn primary block" data-install>📱 App installieren</button>' : ''}
      ${sw('music', musicOn(), 'Musik', 'Eigene Blitz-Melodien im Menü und im Spiel')}
      <label class="setrow col vol"><span><b>Lautstärke Musik</b></span><input type="range" id="volMusic" min="0" max="100" step="5" value="${S.settings.musicVol ?? 50}"></label>
      ${sw('sound', S.settings.sound, 'Effekte', 'Klänge bei richtig, falsch, Serien und Sternen')}
      <label class="setrow col vol"><span><b>Lautstärke Effekte</b></span><input type="range" id="volSfx" min="0" max="100" step="5" value="${S.settings.sfxVol ?? 70}"></label>
      <p class="small muted setnote">Bei Aufträgen von Lehrkräften und im Einstufungstest bleibt die Musik aus. Alles, was ein Ton sagt, steht auch auf dem Bildschirm.</p>
      ${!VORLESEN() ? '' : sw('speech', S.settings.speech, 'Vorlesen', 'Aufgaben, Lösungswege, Theorie und Blitz')}
      ${!VORLESEN() ? '' : Voice.available() ? `<div class="setrow col voicebox"><div class="vrow"><b>Stimme</b><span class="vname">🤖 KI-generiert (synthetische Stimme)</span></div>
        <div class="vrow"><b>Sprechtempo</b><div class="chips" id="rateSeg" role="group" aria-label="Sprechtempo">${RATES.map(r => `<button data-v="${r}" class="${speechRate() === r ? 'sel' : ''}" aria-pressed="${speechRate() === r}" translate="no">${String(r).replace('.', ',')}×</button>`).join('')}</div></div>
        <button class="btn" id="voiceTest">▶ Probe hören</button>
        </div>` : (IS_NATIVE ? '<p class="small muted setnote">Vorlesen kommt bald mit unseren eigenen Stimmen.</p>' : '<p class="small muted setnote">Auf diesem Gerät gibt es keine Vorlese-Stimme.</p>')}
      ${sw('auto', S.settings.auto, 'Automatisch prüfen', 'Prüfen, sobald genug Stellen eingegeben sind')}
      ${sw('blitz', S.settings.blitz !== false, 'Maskottchen Blitz', 'Blitz der Fuchs feuert dich an und erklärt Tricks')}
      ${Reminder.supported() || isIOS() ? reminderHtml() : ''}
      <div class="setrow col"><div><b>Klassenstufe</b><span>Zeigt passende Themen und schlägt Stufen vor</span></div>
        <div class="chips" id="klSeg">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<button data-v="${k}" class="${S.settings.klasse === k ? 'sel' : ''}">${k || 'Alle'}</button>`).join('')}</div></div>
      <div class="setrow col"><div><b>Sprache</b><span>Folgt der Sprache des Geräts – oder fest einstellen</span></div>
        <div class="chips" id="langSeg"><button data-v="auto" class="${(ROOT.lang || 'auto') === 'auto' ? 'sel' : ''}">Automatisch</button>${Object.entries(I18N.langs).map(([k, n]) => `<button data-v="${k}" translate="no" class="${ROOT.lang === k ? 'sel' : ''}">${n}</button>`).join('')}</div></div>
      <div class="setrow col"><div><b>Design</b><span>Hell, dunkel oder wie das Gerät</span></div>
        <div class="seg" id="themeSeg">${[['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([v, l]) => `<button data-v="${v}" class="${S.settings.theme === v ? 'sel' : ''}">${l}</button>`).join('')}</div></div>
      ${mi('settingsEltern', '🔒', 'Für Eltern', 'Zahlensprint Pro, Zurücksetzen, App-Update')}
      </div>`, init: initSettings };
  },

  settingsEltern() {
    return { title: '🔒 Einstellungen für Eltern', html: `<div class="menu">
      ${proLocks() || RBPRO.ok ? mi('pro', '⭐', RBPRO.ok ? 'Zahlensprint Pro <span class="pro-on static">Pro aktiv</span>' : 'Zahlensprint Pro', RBPRO.ok ? 'Gilt in der Web-App auf diesem Gerät – für alle Profile' : 'Was Pro enthält · Code einlösen', RBPRO.ok ? 'pro-active' : '') : ''}
      ${IS_NATIVE ? `<div class="mi" style="cursor:default"><div class="ico">✨</div><div><b>Aktualisiert sich automatisch</b><span>Installiert: Version <span translate="no">${versionLabel()}</span></span><span id="updInfo" style="display:block;font-size:12px"></span></div></div>` : ''}
      <div class="mlabel">Zurücksetzen</div>
      <button class="mi" data-reset="reise"><div class="ico">🗺️</div><div><b>Rechen-Reise neu starten</b><span>Sterne, Sticker und Klassenwahl der Reise löschen</span></div></button>
      <button class="mi" data-reset="merk"><div class="ico">🧠</div><div><b>Merk-Training zurücksetzen</b><span>Merkstärken, Sternenhimmel und Sternbilder löschen</span></div></button>
      <button class="mi" data-reset="badges"><div class="ico">🏅</div><div><b>Abzeichen zurücksetzen</b><span>Alle Abzeichen dieses Profils löschen</span></div></button>
      <button class="mi" data-reset="box"><div class="ico">📦</div><div><b>Fehlerkiste leeren</b><span>Gesammelte Fehler-Aufgaben löschen</span></div></button>
      <button class="mi" id="btnReset"><div class="ico">↺</div><div><b>Alles zurücksetzen</b><span>Punkte, Rekorde, Abzeichen, Fehlerkiste, Merk-Training, Reise, Funken, Garderobe und Rätsel dieses Profils löschen – Auftrag der Lehrkraft, Adventskalender und Klasse bleiben</span></div></button>
      </div>`, init: initSettingsEltern };
  },


  /* ---------- Profile ---------- */
  profiles() {
    const list = Object.values(ROOT.profiles);
    return { title: 'Wer übt?', html: `<div class="menu">
      ${list.map(p => `<div class="prof-row"><button class="mi ${p.id === ROOT.cur ? 'cur' : ''}" data-prof="${p.id}"><div class="ico big">${p.emoji}</div><div><b translate="no">${esc(p.name)}</b><span>Stufe ${levelFromXp(p.data.xp || 0)} · ${p.data.total || 0} gelöst</span></div><span class="chev">${p.id === ROOT.cur ? '✓' : '›'}</span></button><button class="prof-del" type="button" data-del="${p.id}" aria-label="Profil löschen" title="Profil löschen">🗑️</button></div>`).join('')}
      <form class="card form" id="profForm" style="box-shadow:none">
        <b id="profFormTitle">Neues Profil</b>
        <label class="field"><span>Name</span><input id="profName" maxlength="20" required placeholder="z. B. Lena"></label>
        <div class="emojis" id="profEmoji">${EMOJIS.map((e, i) => `<button type="button" data-e="${e}" class="${i === 1 ? 'sel' : ''}">${e}</button>`).join('')}</div>
        <div class="row2"><button class="btn primary" type="submit" id="profSave">Anlegen</button><button class="btn" type="button" id="profEdit">Aktuelles bearbeiten</button></div>
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
  // Elternbereich (Leitstand 18.11.): Berichte, Lern-Geschenk, anonyme Nutzungszählung
  eltern() {
    const on = zaehlungAn();
    return { title: '👪 Elternbereich', html: `<div class="menu">
      ${nachhilfeHinweis()}
      ${mi('week', '📊', 'Wochenbericht', 'Was geübt wurde, wo es hakt')}
      ${mi('elternbericht', '📈', 'Elternbericht' + proBadge(), 'Verlauf über 10 Wochen, Stärken und Schwächen je Thema')}
      ${typeof PANELS.koppeln === 'function' && window.crypto && crypto.subtle ? mi('koppeln', '📲', 'Eltern-Handy koppeln' + (kopplung() ? ' <span class="pro-on static">gekoppelt</span>' : ''), 'Lernstand auf dem Eltern-Handy – ohne Konto, verschlüsselt') : ''}
      ${typeof PANELS.wiederherstellen === 'function' && window.crypto && crypto.subtle ? mi('wiederherstellen', '♻️', 'Fortschritt wiederherstellen', 'Neues Gerät? Mit dem Kopplungs-Link den Lernstand zurückholen') : ''}
      ${CONFIG.geschenkUrl ? miLink(CONFIG.geschenkUrl, '🎁', 'Lern-Geschenk verschenken', 'Nachhilfe-Stunden oder Lernpaket als Gutschein') : ''}
      <button class="setrow" id="nhSw" role="switch" aria-checked="${!!ROOT.hinweisAus}"><div><b>Hinweise auf Nachhilfe ausblenden</b><span>Dann zeigt die App keine Hinweise auf die kostenlose Probestunde mehr</span></div><span class="switch ${ROOT.hinweisAus ? 'on' : ''}"></span></button>
      ${CONFIG.zaehler ? `<button class="setrow" id="zaehlSw" role="switch" aria-checked="${on}"><div><b>Anonyme Nutzungszählung</b><span>Beim Start meldet die App nur „Zahlensprint wurde geöffnet“ und die Version, nach einem Umzug auf die neue Adresse außerdem einmal „Umzug geklappt“ und wenn der Link zur Probestunde angetippt wird – ohne Namen, Kennungen oder Cookies. Hilft uns zu sehen, ob Zahlensprint genutzt wird.</span></div><span class="switch ${on ? 'on' : ''}"></span></button>` : ''}
    </div>`, init() {
      bindNachhilfeHinweis();
      const nh = $('nhSw'); if (nh) nh.onclick = () => { ROOT.hinweisAus = !ROOT.hinweisAus; save(); Sound.click(); nh.setAttribute('aria-checked', !!ROOT.hinweisAus); nh.querySelector('.switch').classList.toggle('on', !!ROOT.hinweisAus); };
      const b = $('zaehlSw'); if (b) b.onclick = () => { ROOT.zaehlung = !zaehlungAn(); save(); Sound.click(); b.setAttribute('aria-checked', ROOT.zaehlung); b.querySelector('.switch').classList.toggle('on', ROOT.zaehlung); };
    } };
  },
  week() {
    const w = weekData(0), prev = weekData(1);
    const trend = prev.n ? Math.round((w.n - prev.n) / prev.n * 100) : null;
    const days = Array.from({ length: 7 }, (_, i) => dayStr(6 - i)).map(d => { const h = S.hist[d]; return `<div class="wday ${h ? 'on' : ''}"><i style="height:${h ? Math.max(8, Math.min(100, h.n * 2)) : 4}%"></i><span>${new Date(d + 'T12:00').toLocaleDateString(locale(), { weekday: 'narrow' })}</span></div>`; }).join('');
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
        $('wkShare').onclick = () => shareText(weekText(w), 'Zahlensprint Wochenbericht');
        $('wkPrint').onclick = () => printHtml(`<h1>Wochenbericht · ${esc(profile().name)}</h1><p>${fmtDay(dayStr(6))} bis ${fmtDay(dayStr(0))}</p>${$('weekReport').innerHTML}`);
      } };
  },

  /* ---------- Lehrkräfte ---------- */
  teacher() {
    return { title: 'Für Lehrkräfte', html: `<p class="small muted" style="margin:0 0 12px">Alles funktioniert über Links – ohne Anmeldung. Die Schüler brauchen nur Zahlensprint im Browser.</p><div class="menu">
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
    return { title: 'App installieren', html: installPrompt
      ? '<p>Installiere Zahlensprint auf deinem Gerät. Dann startet es wie eine App vom Startbildschirm und funktioniert auch ohne Internet.</p><button class="btn primary block" id="btnInstall">Jetzt installieren</button>'
      : '<p>So kommt Zahlensprint auf deinen Startbildschirm:</p><ol style="padding-left:20px;line-height:1.8"><li>Tippe in Safari unten auf <b>Teilen</b> (□↑).</li><li>Wähle <b>Zum Home-Bildschirm</b>.</li><li>Tippe auf <b>Hinzufügen</b>.</li></ol>',
      init() { const b = $('btnInstall'); if (b) b.onclick = () => { closeSheet(); doInstall(); }; } };
  },
  shareBox(o) {
    return { title: 'Teilen', html: `<p class="small muted" style="margin:0 0 8px">Kopiere den Text und schicke ihn z. B. per WhatsApp oder E-Mail.</p><textarea class="sharebox" readonly rows="6">${esc(o.text)}</textarea>`, init() { const t = $('sheetBody').querySelector('textarea'); t.focus(); t.select(); } };
  },
};

/* ---------- Sheet-Steuerung ---------- */
function openSheet(panel = 'menu', opts) {
  Sound.init();
  armBack();
  if (!Sheet.open) { Sheet.open = true; $('sheetBg').hidden = false; pauseGame(true); Sheet.lastFocus = document.activeElement; Sheet.stack = []; }
  showPanel(panel, opts, true);
}
// Bereiche hinter dem Eltern-Tor (Standard der AppZentrale): Elternbereich, Eltern-Einstellungen, Kopplung, Klassen-Code, Einladen/Flyer
const TOR_BEREICHE = new Set(['eltern', 'settingsEltern', 'koppeln', 'wiederherstellen', 'invite', 'flyer', 'classCreate']);
const brauchtTor = (panel, opts) => (TOR_BEREICHE.has(panel) || (panel === 'klasse' && !S.klasse)) && !elternFrei();
function showPanel(panel, opts, push) {
  if (brauchtTor(panel, opts)) { opts = { next: [panel, opts || {}] }; panel = 'elternGate'; }
  if (push) Sheet.stack.push([panel, opts]);
  const p = PANELS[panel](opts);
  $('sheetTitle').innerHTML = p.title;
  $('sheetBody').innerHTML = p.html;
  $('sheetBack').hidden = Sheet.stack.length < 2;
  $('sheetBody').scrollTop = 0; $('sheetBody').parentElement.scrollTop = 0;
  p.init && p.init();
  (p.focus ? $(p.focus) : $('sheetClose')).focus({ preventScroll: true });
}
/* ---------- Zurück-Taste (Android-App und Browser): schließt Fenster bzw. beendet die Runde, statt die App zu verlassen ---------- */
let navGuard = false;
function armBack() { if (navGuard) return; navGuard = true; try { history.pushState({ rb: 1 }, '', location.pathname + location.search); } catch { navGuard = false; } }
addEventListener('popstate', () => {
  if (!navGuard || location.hash.length > 1) return;   // Links mit #… (Klassen-Code usw.) laufen über hashchange
  navGuard = false;
  if (Sheet.open) { if (Sheet.stack.length > 1) $('sheetBack').click(); else closeSheet(); }
  else {
    const scr = currentScreen();
    if (scr === 'game') quitGame(); else if (scr === 'result') $('btnMenu')?.click(); else if (scr === 'duel') { DU = null; goHome(); }
  }
  if (Sheet.open || currentScreen() !== 'home') armBack();
});
function closeSheet() { Sheet.open = false; $('sheetBg').hidden = true; pauseGame(false); Sheet.lastFocus?.focus?.(); }
$('fab').onclick = () => { Sound.click(); Sheet.open ? closeSheet() : openSheet('menu'); };
$('sheetClose').onclick = closeSheet;
$('sheetBack').onclick = () => { Sheet.stack.pop(); const [p, o] = Sheet.stack[Sheet.stack.length - 1] || ['menu']; showPanel(p, o); };
$('sheetBg').addEventListener('click', e => { if (e.target === $('sheetBg')) closeSheet(); });
$('sheetBody').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) showPanel(b.dataset.go, {}, true); });
document.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openSheet(b.dataset.open); });

/* ---------- Einstellungen ---------- */
function initSettings() {
  renderReminder();
  $('sheetBody').querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    const k = b.dataset.set; S.settings[k] = k === 'blitz' ? S.settings.blitz === false : k === 'music' ? !musicOn() : !S.settings[k]; save(); Sound.init(); Sound.click();
    if (k === 'music' || k === 'sound') { renderSoundIcons(); Music.update(); }
    b.setAttribute('aria-checked', S.settings[k]); b.querySelector('.switch').classList.toggle('on', S.settings[k]);
    if (k === 'speech' && S.settings.speech) Voice.say('3/4 + 1/4 = 1');
    renderHome();
  });
  if ($('voiceTest')) {
    $('rateSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.rate = +b.dataset.v; save();
      $('rateSeg').querySelectorAll('button').forEach(x => { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', x === b); }); Voice.say('3/4 + 1/4 = 1', { force: true }); };
    $('voiceTest').onclick = () => Voice.speakParts([mathSpeak(tr('Hallo, ich bin Blitz!')), joinSay(['3/4 + 1/4 = 1', '12² = 144', '2,5 km = 2500 m'].map(x => mathSpeak(shownText(x))))], { force: true });
  }
  $('volMusic').oninput = e => { S.settings.musicVol = +e.target.value; Sound.init(); Sound.setVolumes(); };
  $('volSfx').oninput = e => { S.settings.sfxVol = +e.target.value; Sound.init(); Sound.setVolumes(); };
  $('volMusic').onchange = $('volSfx').onchange = e => { save(); if (e.target.id === 'volSfx') Sound.correct(1); };
  $('klSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.klasse = +b.dataset.v; homeShowAll = false; save(); $('klSeg').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); renderHome(); };
  $('langSeg').onclick = e => { const b = e.target.closest('button'); if (b) setLanguage(b.dataset.v); };
  $('themeSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.theme = b.dataset.v; save(); applyTheme(); $('themeSeg').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); };
}

// Eltern-Einstellungen (hinter dem Eltern-Tor): Update-Info und Zurücksetzen
function initSettingsEltern() {
  if (RbUpd()) RbUpd().status().then(u => {   // App: woher der laufende Stand kommt (zur Kontrolle der Selbst-Aktualisierung)
    const el = $('updInfo'); if (!el || !u) return;
    const src = u.version && u.version !== u.bundled ? (u.source === 'server' ? 'Server' : 'GitHub') : 'App-Paket';
    el.innerHTML = `<span>Geladen von:</span> <span translate="no">${esc(src)}</span> · <span>Kanal</span> <span translate="no">${esc(u.channel === 'live' ? 'Live' : 'Test')}</span> · <span>Hülle</span> <span translate="no">${esc(String(u.shell))}</span>`;
  }).catch(() => {});
  $('sheetBody').querySelectorAll('[data-reset]').forEach(b => b.onclick = () => resetPart(b.dataset.reset));
  $('btnReset').onclick = () => {
    if (!confirm(tr(`Wirklich den gesamten Fortschritt von „${profile().name}“ löschen? Das kann nicht rückgängig gemacht werden.`))) return;
    if (G && !G.over) quitGame(true);
    const keep = { settings: S.settings, sel: S.sel, assign: S.assign, advent: S.advent, klasse: S.klasse, klassePending: S.klassePending };
    ROOT.profiles[ROOT.cur].data = Object.assign(PROFILE_DEFAULT(), keep); useProfile(ROOT.cur);
    save(); renderHome(); closeSheet(); toast('Fortschritt zurückgesetzt');
  };
}

/* ---------- Profile ---------- */
function initProfiles() {
  let emoji = EMOJIS[1], editing = false;
  $('profEmoji').onclick = e => { const b = e.target.closest('button'); if (!b) return; emoji = b.dataset.e; $('profEmoji').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); };
  $('sheetBody').querySelectorAll('[data-prof]').forEach(b => b.onclick = () => { if (G && !G.over) quitGame(true); useProfile(b.dataset.prof); save(); applyTheme(); renderHome(); closeSheet(); toast(`Hallo ${esc(profile().name)}! ${profile().emoji}`); });
  $('profEdit').onclick = () => {
    editing = true; const p = profile(); $('profFormTitle').textContent = 'Profil bearbeiten'; $('profName').value = p.name; $('profSave').textContent = 'Speichern';
    emoji = p.emoji; $('profEmoji').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x.dataset.e === emoji)); $('profName').focus();
  };
  $('profForm').onsubmit = e => {
    e.preventDefault(); const name = $('profName').value.trim(); if (!name) return $('profName').focus();
    if (editing) Object.assign(profile(), { name, emoji });
    else { if (Object.keys(ROOT.profiles).length >= RBPRO.freeProfiles && !needPro('profile')) return;   // vorhandene Profile bleiben (Bestandsschutz)
      if (G && !G.over) quitGame(true); const id = 'p' + Date.now().toString(36); ROOT.profiles[id] = { id, name, emoji, data: PROFILE_DEFAULT() }; useProfile(id); }
    save(); applyTheme(); renderHome(); closeSheet(); toast(`${emoji} ${esc(name)}`);
  };
  $('sheetBody').querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteProfile(b.dataset.del));
}
/** Spielprofil löschen (Marcel 16.11.): jedes Profil, auch das letzte (dann gibt es ein frisches „Ich“).
    War das Profil in einer Klassen-Challenge, wird sein Eintrag in der Rangliste mit gelöscht. */
function deleteProfile(id) {
  const p = ROOT.profiles[id]; if (!p) return;
  if (!confirm(`${tr('Profil wirklich löschen?')}\n„${p.name}“\n${tr('Alle Punkte, Abzeichen, Reise und Garten dieses Profils werden gelöscht. Das kann nicht rückgängig gemacht werden.')}`)) return;
  if (id === ROOT.cur && G && !G.over) quitGame(true);
  const kl = p.data && p.data.klasse;
  if (kl && kl.code && kl.spieler && CONFIG.classApi) classApi('/klasse/verlassen', { code: kl.code, spieler: kl.spieler }).catch(() => {});   // Ranglisten-Eintrag mit löschen
  delete ROOT.profiles[id];
  if (!Object.keys(ROOT.profiles).length) { const nid = 'p' + Date.now().toString(36); ROOT.profiles[nid] = { id: nid, name: 'Ich', emoji: EMOJIS[0], data: PROFILE_DEFAULT() }; }
  if (!ROOT.profiles[ROOT.cur]) useProfile(Object.keys(ROOT.profiles)[0]);
  save(); applyTheme(); renderHome(); showPanel('profiles');
  toast(`<span>🗑️</span> <span>Profil gelöscht</span>`);
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
const weekText = w => `Zahlensprint – Wochenbericht für ${profile().name}\n${fmtDay(dayStr(6))} bis ${fmtDay(dayStr(0))}\n\n• ${w.days} von 7 Tagen geübt\n• ${w.n} Aufgaben, ${w.n ? Math.round(w.ok / w.n * 100) : 0} % richtig\n• ${Math.round(w.ms / 60000)} Minuten Übungszeit`
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
    const txt = `${a.t || 'Zahlensprint-Auftrag'}${a.by ? ' von ' + a.by : ''}: ${TOPICS[a.op].name}, Stufe ${a.l + 1}, ${a.r}× ${a.m === 'blitz' ? 'Blitzrunde' : 'Training'}${a.due ? ', bis ' + fmtDay(a.due) : ''}.\nÖffnen: ${url}`;
    $('acOut').innerHTML = `<div class="card" style="box-shadow:none"><b>Link für die Schüler</b><textarea class="sharebox" readonly rows="3">${esc(url)}</textarea><div class="row2"><button type="button" class="btn primary" id="acShare">Teilen</button><button type="button" class="btn" id="acCopy">Kopieren</button></div><p class="small muted" style="margin:8px 0 0">Wenn alle Runden geschafft sind, schicken die Schüler dir ein Ergebnis-Link zurück. Den öffnest du einfach – oder unter „Ergebnis ansehen“.</p></div>`;
    $('acShare').onclick = () => shareText(txt, 'Zahlensprint-Auftrag');
    $('acCopy').onclick = async () => { try { await navigator.clipboard.writeText(url); toast('Link kopiert ✓'); } catch { $('acOut').querySelector('textarea').select(); } };
    $('acOut').scrollIntoView({ behavior: 'smooth' });
  };
}
function resultHtml(d) {
  d = cleanResult(d);
  if (!d) return '<p>Dieser Ergebnis-Link ist leider beschädigt.</p>';
  const done = d.runs.filter(r => r.ok).length;
  return `<div class="report"><p style="margin:0"><b>${esc(d.n || 'Unbekannt')}</b> · ${esc(d.t || TOPICS[d.op]?.name + ' Stufe ' + (d.l + 1))}</p>
    <p class="muted small" style="margin:2px 0 10px">${esc(TOPICS[d.op]?.name || d.op)} · Stufe ${d.l + 1} · ${d.m === 'blitz' ? 'Blitzrunde' : 'Training'}${d.min ? ` · mind. ${d.min} %` : ''}${d.by ? ` · Auftrag von <span translate="no">${esc(d.by)}</span>` : ''}</p>
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
  $('print').innerHTML = `<div class="print-brand"><img src="icons/logo.svg" alt=""> Zahlensprint · Nachhilfe – online · mathenachhilfe-online.com</div>${html}`;
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
    app: { name: 'Rechenblitz', version: APP_VERSION, versionDate: APP_DATE, url: location.href.split('#')[0], screen: currentScreen(), standalone: isStandalone(), userAgent: navigator.userAgent,
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
let flushing = false;
async function flushOutbox() {
  if (flushing || !CONFIG.reportEndpoint || !ROOT.outbox.length || !navigator.onLine) return;
  flushing = true;
  const queue = ROOT.outbox.slice(), drop = new Set();
  try {
    for (let i = 0; i < queue.length; i++) {
      try { await postReport(queue[i]); drop.add(queue[i]); }
      catch (e) {
        if (e.status === 400) { drop.add(queue[i]); continue; }   // abgelehnt → verwerfen
        if (e.status === 429) break;                               // Ratenbremse → später weiter
      }
    }
  } finally {
    ROOT.outbox = ROOT.outbox.filter(p => !drop.has(p)); save();   // währenddessen neu hinzugekommene Meldungen bleiben erhalten
    flushing = false;
  }
}
// Meldungen dürfen höchstens 16 KB groß sein – zur Not die Rohdaten der Aufgabe weglassen
function fitSize(p) { if (JSON.stringify(p).length > 15000 && p.task) delete p.task.raw; if (JSON.stringify(p).length > 15000) p.app.userAgent = p.app.userAgent.slice(0, 200); return p; }
function reportDone(res, payload) {
  if (!Sheet.open || !$('rForm')) { if (res === 'sent') toast('Danke für deine Meldung! ✓'); return; }   // Panel inzwischen gewechselt/geschlossen
  const box = (icon, color, title, text, extra = '') => `<div class="thanks"><div class="ok" ${color ? `style="color:var(--orange-d);background:rgba(255,116,24,.12)"` : ''}>${icon}</div><h3>${title}</h3><p class="muted">${text}</p>${extra}<button class="btn ${extra ? '' : 'dark'} block" id="thxClose" style="margin-top:8px">${extra ? 'Schließen' : 'Weiter'}</button></div>`;
  if (res === 'sent') $('sheetBody').innerHTML = box('✓', false, 'Danke für deine Meldung!', `Wir schauen sie uns an${ROOT.reporter.email ? ' und melden uns bei Bedarf per E-Mail' : ''}.`);
  else if (res === 'ratelimit') $('sheetBody').innerHTML = box('⏳', true, 'Gespeichert', 'Gerade wurden sehr viele Meldungen gesendet. Deine Meldung ist gespeichert und wird später automatisch übertragen.');
  else if (res === 'invalid') $('sheetBody').innerHTML = box('⚠️', true, 'Das hat nicht geklappt', 'Die Meldung konnte nicht angenommen werden. Bitte versuche es noch einmal mit einer etwas ausführlicheren Beschreibung.');
  else if (res === 'queued') $('sheetBody').innerHTML = box('⏳', true, 'Gespeichert', 'Gerade gibt es keine Verbindung. Deine Meldung wird automatisch gesendet, sobald du wieder online bist.');
  else {
    const body = `${payload.message}\n\n${payload.task ? `Aufgabe: ${payload.task.task}\nAntwort: ${payload.task.given || '–'}\nLösung der App: ${payload.task.expected}\n` : ''}\nZahlensprint ${APP_VERSION} · ${navigator.userAgent}`;
    const href = `mailto:${CONFIG.fallbackMail}?subject=${encodeURIComponent('Zahlensprint: ' + (payload.type === 'idee' ? 'Idee' : 'Fehlermeldung'))}&body=${encodeURIComponent(body)}`;
    $('sheetBody').innerHTML = box('✉️', true, 'Fast geschafft', 'Der direkte Versand ist hier noch nicht eingerichtet. Deine Meldung ist gespeichert und wird später automatisch übertragen – oder du schickst sie gleich per E-Mail.', `<a class="btn primary block" href="${href}">Per E-Mail senden</a>`);
  }
  $('thxClose').onclick = closeSheet;
}
addEventListener('online', flushOutbox);

/* ---------- Tipp für Klasse 9–10 (V15): ohne Tor, sachlich, höchstens einmal pro Woche; die frühere Werbekarte ist weg (Kinderansicht ohne Werbung) ---------- */
function renderPromo() {
  const el = $('promo'); if (!el) return;
  const t = tippKlasse(); el.innerHTML = t; el.hidden = !t; bindTipp();
}

/* ---------- Links (#auftrag=… / #ergebnis=…) ---------- */
// Link-Daten kommen von außen: nur bekannte Werte in gültigen Bereichen übernehmen (Schutz vor Schadcode und Abstürzen)
const clampInt = (v, lo, hi, d) => { v = Math.round(+v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
const cleanStr = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
const cleanDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
function cleanAssign(d) {
  if (!d || typeof d !== 'object' || typeof d.op !== 'string' || !TOPICS[d.op]) return null;
  const s = Math.round(+d.s);
  return { i: cleanStr(d.i, 40), t: cleanStr(d.t, 80), by: cleanStr(d.by, 60), op: d.op, l: clampInt(d.l, 0, 5, 0), m: d.m === 'blitz' ? 'blitz' : 'training',
    r: clampInt(d.r, 1, 10, 1), min: clampInt(d.min, 0, 100, 0), due: cleanDate(d.due), s: Number.isFinite(s) ? s : 0 };
}
function cleanRuns(runs) {
  return (Array.isArray(runs) ? runs : []).slice(0, 60).filter(r => r && typeof r === 'object').map(r => ({ d: cleanDate(r.d), sc: clampInt(r.sc, 0, 1e7, 0), c: clampInt(r.c, 0, 9999, 0),
    w: clampInt(r.w, 0, 9999, 0), ms: clampInt(r.ms, 0, 1e7, 0), ok: !!r.ok, mi: (Array.isArray(r.mi) ? r.mi : []).slice(0, 20).map(x => (Array.isArray(x) ? x : []).slice(0, 3).map(y => cleanStr(String(y ?? ''), 120))) }));
}
function cleanResult(d) { const a = cleanAssign(d); if (!a) return null; a.n = cleanStr(d.n, 60); a.runs = cleanRuns(d.runs); return a; }

function handleHash() {
  const h = location.hash;
  const w = h.match(/^#wunsch=([\w-]+)/);
  if (w) { history.replaceState(null, '', location.pathname + location.search); if (typeof wunschFromHash === 'function') wunschFromHash(w[1]); return; }
  const m = h.match(/^#(auftrag|ergebnis)=([\w-]+)/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  let data; try { data = b64d(m[2]); } catch { toast('Der Link ist leider beschädigt.'); return; }
  if (m[1] === 'ergebnis') { const r = cleanResult(data); if (r) openSheet('resultView', { data: r }); else toast('Der Link ist leider beschädigt.'); return; }
  const a = cleanAssign(data);
  if (!a) { toast('Der Link ist leider beschädigt.'); return; }
  if (S.assign && S.assign.i === a.i) { toast('Diesen Auftrag hast du schon.'); return; }
  S.assign = { ...a, runs: [] }; save();
  if (['game', 'duel'].includes(currentScreen())) { toast('📝 Neuer Auftrag gespeichert – du findest ihn auf der Startseite.', 2600); return; }
  if (Sheet.open) closeSheet();
  goHome();
  toast('📝 Neuer Auftrag gespeichert!', 2200);
  scrollTo({ top: 0, behavior: 'smooth' });
}
addEventListener('hashchange', handleHash);

/* ---------- „← Alle Apps“ oben auf dem Start (Marcel 18.11.): zurück zur App-Auswahl der Website ----------
   Browser: selber Tab. Installierte Web-App (Home-Bildschirm): normaler Browser (neuer Tab). Test-Stufe → staging. */
const ALLE_APPS = st => (st === 'test' ? 'https://staging.' : 'https://www.') + 'mathenachhilfe-online.com/lern-apps/?src=rechenblitz-kopf';
function alleAppsLink() {
  const a = $('btnAlleApps'); if (!a) return;
  a.href = ALLE_APPS(typeof KOPPLUNG === 'object' ? KOPPLUNG.stufe() : 'live');
  let standalone = false; try { standalone = IS_NATIVE || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch {}
  if (standalone) { a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); a.removeAttribute('rel'); }
}

/* ================= Start ================= */
function init() {
  I18N.lang = detectLang();
  loadRoot(); applyTheme();
  for (const [id, url, place] of [['lnkSite', CONFIG.websiteUrl, 'footer'], ['lnkImp', CONFIG.imprintUrl], ['lnkPriv', CONFIG.privacyUrl], ['btnSite', CONFIG.websiteUrl, 'header'], ['resultSite', CONFIG.websiteUrl, 'result']]) { const el = $(id); if (el) el.href = place ? siteLink(url, place) : url; }
  $('verText').innerHTML = `<button class="linkbtn" data-open="news">${esc(tr('Version'))} ${versionLabel()}</button>`; $('verText').setAttribute('translate', 'no');
  $('brandLink').href = siteLink(CONFIG.websiteUrl, 'logo');
  alleAppsLink();
  if (CONFIG.lernraumUrl) { $('btnLernraum').href = siteLink(CONFIG.lernraumUrl, 'lernraum'); $('btnLernraum').hidden = false; $('topbarText').hidden = true; }
  $('btnProfile').onclick = () => openSheet('profiles');
  // Nach einem Update einmal „Was ist neu?“ mit Blitz; ganz neue Nutzer begrüßt Blitz
  const seen = ROOT.seenVersion, onHome = () => !Sheet.open && !$('home').hidden && !window.__noWelcome;
  if (seen && verNum(seen) < verNum(APP_VERSION)) setTimeout(() => onHome() && openSheet('whatsnew', { since: seen }), 900);
  else if (!seen && !S.total) setTimeout(() => onHome() && openSheet('welcome'), 900);
  ROOT.seenVersion = APP_VERSION; save();
  if (window.__umzugOk) setTimeout(() => toast('✅ Dein Lernstand ist mit umgezogen – Zahlensprint hat jetzt eine neue Adresse.', 4200), 600);
  renderPromo(); renderHome(); handleHash(); handleParams(); proStartup(); flushOutbox(); submitClassPoints(); if (S.advent && S.advent.voucherPending) fetchVoucher();
  if (IS_NATIVE) { Reminder.startup().catch(() => {}); apkUpdateCheck(); }   // APK: alle Dateien liegen im Paket, kein Service Worker nötig
  else if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').then(() => Reminder.startup()).catch(() => {});
}

/* ---------- Nach Updates suchen (Menü + Einstellungen; Marcel 15.11.) ----------
   Android-App (Hülle 2+): neuen Stand von GitHub/Server laden und von selbst einspielen; ältere Hülle: GitHub-Release-Seite.
   Web-App: aktuelle Version vom Server lesen; ist sie neuer, Service Worker aktualisieren und neu laden. */
let updChecking = false;
async function checkForUpdate() {
  if (updChecking) return;
  if (!navigator.onLine) { toast('Gerade keine Verbindung – bitte später nochmal'); return; }
  updChecking = true; toast('Suche nach Updates …', 1200);
  try {
    if (IS_NATIVE && RbUpd()) {
      const st = await liveUpdateCheck(true);
      if (!st || st.result === 'offline' || st.result === 'error') toast('Gerade keine Verbindung – bitte später nochmal');
      else if (st.result === 'downloaded' || (st.pending && st.pending !== APP_VERSION)) { closeSheet(); goHome(); toast(`Version ${esc(st.pending)} ist geladen`); }
      else if (st.needShell) { closeSheet(); goHome(); toast('Für das nächste Update bitte die App neu installieren'); }
      else toast('Du hast die neueste Version ✓');
      return;
    }
    if (IS_NATIVE) {
      const st = await apkUpdateCheck(true);
      if (!st) toast('Gerade keine Verbindung – bitte später nochmal');
      else if (apkNewer(st.ver) && st.url) { closeSheet(); goHome(); toast(`Neue Version ${esc(st.ver)} gefunden`); }
      else toast('Du hast die neueste Version ✓');
      return;
    }
    const r = await fetch('js/changelog.js?u=' + Date.now(), { cache: 'no-store' });
    const v = r.ok ? ((await r.text()).match(/APP_VERSION = '([\d.]+)'/) || [])[1] : null;
    if (!v) { toast('Gerade keine Verbindung – bitte später nochmal'); return; }
    if (verNum(v) > verNum(APP_VERSION)) {
      toast(`Neue Version ${esc(v)} wird geladen …`, 2500);
      try { const reg = await navigator.serviceWorker?.getRegistration(); await reg?.update(); } catch {}
      setTimeout(() => location.reload(), 1400);
    } else toast('Du hast die neueste Version ✓');
  } catch { toast('Gerade keine Verbindung – bitte später nochmal'); }
  finally { updChecking = false; }
}
document.addEventListener('click', e => { if (e.target.closest('[data-upd]')) { Sound.click(); checkForUpdate(); } });

/* ---------- Web-App: aktualisiert sich selbst, ohne Knopf (Marcel 15.11.) ----------
   Beim Start, bei jeder Rückkehr in die App (Tab sichtbar / Fenster im Fokus, höchstens 1× pro Minute) und spätestens alle 30 Min.
   still die Version auf dem Server prüfen (Leitstand 18.11.).
   Ist sie neuer: Service Worker aktualisieren und neu laden, sobald man auf der Startseite ist (nie mitten in einer Runde).
   Danach zeigt Blitz „Was ist neu?“. */
let webUpd = { at: 0, ver: null };
async function webAutoUpdate() {
  if (IS_NATIVE || !location.protocol.startsWith('http') || !navigator.onLine || document.hidden) return;
  if (webUpd.ver || Date.now() - webUpd.at < 60000) return;
  webUpd.at = Date.now();
  try {
    const r = await fetch('js/changelog.js?u=' + Date.now(), { cache: 'no-store' });
    const v = r.ok ? ((await r.text()).match(/APP_VERSION = '([\d.]+)'/) || [])[1] : null;
    if (!v || verNum(v) <= verNum(APP_VERSION)) return;
    let tried = null; try { tried = sessionStorage.getItem('rbAutoUpd'); } catch {}
    if (tried === v) return;   // schon einmal versucht (z. B. Cache hängt) → keine Neulade-Schleife; beim nächsten Öffnen neu
    try {   // neuen Service Worker holen und abwarten, bis er aktiv ist – sonst käme beim Neuladen noch die alte Fassung aus dem Speicher
      const reg = await navigator.serviceWorker?.getRegistration(); await reg?.update();
      const sw = reg && (reg.installing || reg.waiting);
      if (sw) await new Promise(res => { const t = setTimeout(res, 15000); sw.addEventListener('statechange', () => { if (sw.state === 'activated' || sw.state === 'redundant') { clearTimeout(t); res(); } }); });
    } catch {}
    webUpd.ver = v; webUpdReload();
  } catch {}
}
function webUpdReload() {
  if (!webUpd.ver) return;
  if (currentScreen() !== 'home' || Sheet.open || document.hidden) return setTimeout(webUpdReload, 4000);   // erst wenn nichts läuft
  try { sessionStorage.setItem('rbAutoUpd', webUpd.ver); } catch {}
  save(); location.reload();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) webAutoUpdate(); });
addEventListener('focus', () => webAutoUpdate());
setInterval(() => { webUpd.at = 0; webAutoUpdate(); }, 30 * 60000);
setTimeout(webAutoUpdate, 5000);
// nach dem automatischen Neuladen: kurzer Hinweis „Neue Version … geladen“
(() => { let v = null; try { v = sessionStorage.getItem('rbAutoUpd'); } catch {}
  if (v && v === APP_VERSION) { try { sessionStorage.setItem('rbAutoUpd', v + ':ok'); } catch {} setTimeout(() => toast(`Neue Version ${esc(v)} geladen ✓`, 2600), 1200); } })();

/* ---------- Einzelne Bereiche zurücksetzen (Marcel 15.11.) ---------- */
const RESET_ASK = {
  reise: 'Rechen-Reise wirklich neu starten? Alle Sterne und Sticker der Reise werden gelöscht.',
  merk: 'Merk-Training wirklich zurücksetzen? Merkstärken, Sternenhimmel und Sternbilder werden gelöscht.',
  badges: 'Wirklich alle Abzeichen dieses Profils löschen?',
  box: 'Fehlerkiste wirklich leeren?',
};
function resetPart(what, after) {
  if (!RESET_ASK[what] || !confirm(tr(RESET_ASK[what]))) return;
  if (G && !G.over && G.mode === { reise: 'reise', merk: 'merk', box: 'fehler' }[what]) quitGame(true);   // andere laufende Runden bleiben unberührt
  if (what === 'reise') { S.reise = null; G_REISE = null; }
  if (what === 'merk') { S.merk = null; G_MERK = null; }
  if (what === 'badges') S.badges = {};
  if (what === 'box') S.box = {};
  save(); renderHome();
  toast({ reise: '🗺️ Rechen-Reise neu gestartet', merk: '🧠 Merk-Training zurückgesetzt', badges: '🏅 Abzeichen zurückgesetzt', box: '📦 Fehlerkiste geleert' }[what]);
  if (after) after(); else closeSheet();
}

/* ---------- Anonyme Nutzungszählung (Leitstand 18.11.): einmal je Start {app, v, e:{start:1}} als text/plain ----------
   Keine Namen, keine Kennungen, keine Cookies; im Elternbereich abschaltbar (Standard: an). Nicht auf localhost/Datei.
   Ziel (Marcel 27.11.: „Zählung an den eigenen Host der App“; die Stufe test/live bestimmt der Trainer-Dienst aus dem Host):
   · lernen(-test).… und rechenblitz(-test).mathenachhilfe-online.com → gleicher Origin /zaehler/v1/e
   · Android-App → CONFIG.zaehler (lernen.mathenachhilfe-online.com, die App hat keinen eigenen Host)
   · alles andere (localhost, fremde Adressen) → keine Zählung, nie an eine fremde Stufe */
const zaehlungAn = () => ROOT.zaehlung !== false;
function zaehlZiel(host = location.hostname, native = IS_NATIVE, proto = location.protocol, origin = location.origin) {
  if (!CONFIG.zaehler) return '';
  if (native) return CONFIG.zaehler;                       // APK: eigener Ursprung (localhost/capacitor)
  if (!/^https?:$/.test(proto)) return '';
  if (/^(lernen|rechenblitz)(-test)?\.mathenachhilfe-online\.com$/.test(host)) return origin + '/zaehler/v1/e';
  return '';
}
function zaehlSenden(body) {
  const ziel = zaehlZiel(); if (!ziel || !zaehlungAn()) return;
  fetch(ziel, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), credentials: 'omit', keepalive: true, cache: 'no-store' }).catch(() => {});
}
function zaehlStart() {
  try {
    zaehlSenden({ app: 'rechenblitz', v: APP_VERSION, e: { start: 1 } });
    // Umzug auf die gemeinsame Adresse (Recht 24.11.): einmal, in dem Start, in dem die Übernahme abgeschlossen wurde; kein eigener Merker, nur bei eingeschalteter Zählung
    if (window.__umzugOk) zaehlSenden({ app: 'rechenblitz', ev: 'umzug', v: APP_VERSION });
  } catch {}
}
setTimeout(zaehlStart, 3000);
