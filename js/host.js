/* Family Clash — host / admin app: game library, editor, team setup and live controls. */
(function () {
  'use strict';
  const { esc, load, save, clone, uid } = FC;
  const app = document.getElementById('app');

  // ---------------------------------------------------------------- state
  let games = load('fc.games', null);
  let seeded = load('fc.seeded', null); // starter game ids already offered to this device
  if (!Array.isArray(games)) {
    games = [];
    seeded = [];
  } else if (!Array.isArray(seeded)) {
    // Installed before starter packs existed: they already got (a copy of) the sample game.
    seeded = [FC.SAMPLE_ID];
  }
  games = games.map(FC.normalizeGame);
  seedStarters(false);

  // Adds starter games this device hasn't seen yet. Deleted starters stay deleted
  // unless `restore` is true (the "Restore starter games" link).
  function seedStarters(restore) {
    const added = FC.starterGames().filter(
      (g) =>
        (restore || !seeded.includes(g.id)) && !games.some((x) => x.id === g.id || x.title.trim() === g.title)
    );
    games.push(...added);
    seeded = Array.from(new Set(seeded.concat(FC.starterGames().map((g) => g.id))));
    save('fc.games', games);
    save('fc.seeded', seeded);
    return added.length;
  }

  let teamsPref = load('fc.teams', null) || FC.defaultTeams();
  // Guess timer: seconds (0 = off), auto-start for each new guess, count running out as a wrong answer.
  const TIMER_PRESETS = [0, 5, 10, 15, 20, 30, 45, 60];
  let timerPrefs = Object.assign({ seconds: 15, autoNext: true, autoStrike: true }, load('fc.timerPrefs', {}));
  let room = load('fc.room', null);
  if (!room) {
    room = FC.roomCode();
    save('fc.room', room);
  }
  let live = load('fc.live', null); // the game being played right now
  let history = load('fc.history', []); // undo stack (JSON snapshots of `live`)
  let view = 'home';
  let viewArg = null;
  let setup = null; // team setup draft

  // ------------------------------------------------------------ syncing
  const sync = FC.Sync('host', room);
  let boardSeenAt = 0;
  sync.on((msg) => {
    if (msg.type === 'hello' || msg.type === 'ping') {
      const was = boardConnected();
      boardSeenAt = Date.now();
      if (msg.type === 'hello') pushState();
      if (!was) updateChip();
    }
  });
  sync.onConnect = () => pushState();
  setInterval(updateChip, 3000);

  function boardConnected() {
    return Date.now() - boardSeenAt < 10000;
  }
  function pushState() {
    sync.send({ type: 'state', state: live, sentAt: Date.now() });
    scheduleTimeUp();
  }
  function boardUrl() {
    return new URL('board.html?room=' + room, location.href).href;
  }

  // Reconnect to a board we were casting before this page was reloaded.
  try {
    const pid = sessionStorage.getItem('fc.presentationId');
    if (pid && 'PresentationRequest' in window) {
      new PresentationRequest([boardUrl()])
        .reconnect(pid)
        .then((c) => sync.addConnection(c))
        .catch(() => sessionStorage.removeItem('fc.presentationId'));
    }
  } catch (e) {}

  // ----------------------------------------------------------- persistence
  let saveTimer = null;
  function saveGames(now) {
    clearTimeout(saveTimer);
    const write = () => save('fc.games', games);
    if (now) write();
    else saveTimer = setTimeout(write, 250);
  }
  window.addEventListener('pagehide', () => saveGames(true));

  function persistLive() {
    save('fc.live', live);
    save('fc.history', history.slice(-30));
  }

  // ---------------------------------------------------------------- router
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    view = parts[0] || 'home';
    viewArg = parts[1] ? decodeURIComponent(parts[1]) : null;
    if (view === 'play' && !live) return go('#/');
    if ((view === 'edit' || view === 'setup') && !games.find((g) => g.id === viewArg)) {
      if (view === 'setup' && games.length) viewArg = games[0].id;
      else return go('#/');
    }
    render();
    window.scrollTo(0, 0);
  }
  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }
  window.addEventListener('hashchange', route);

  function render() {
    const fn = { home: viewHome, edit: viewEdit, setup: viewSetup, play: viewPlay }[view] || viewHome;
    app.innerHTML = fn();
    app.dataset.view = view;
    updateChip();
  }

  const curGame = () => games.find((g) => g.id === viewArg);

  // ------------------------------------------------------------- UI helpers
  let toastTimer = null;
  function toast(text) {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  function modal(inner, cls) {
    const d = document.createElement('dialog');
    d.className = 'modal ' + (cls || '');
    d.innerHTML = inner;
    document.body.appendChild(d);
    d.addEventListener('close', () => d.remove());
    d.addEventListener('click', (e) => {
      if (e.target === d) d.close();
      if (e.target.closest('[data-close]')) d.close();
    });
    d.showModal();
    const f = d.querySelector('[autofocus]');
    if (f) f.focus();
    return d;
  }

  function confirmDialog(text, okLabel, onOk, danger) {
    const d = modal(`<h2>${esc(text)}</h2>
      <div class="row end"><button class="btn ghost" data-close>Cancel</button>
      <button class="btn ${danger ? 'danger' : 'primary'}" id="confirm-ok">${esc(okLabel)}</button></div>`);
    d.querySelector('#confirm-ok').addEventListener('click', () => {
      d.close();
      onOk();
    });
  }

  function updateChip() {
    const on = boardConnected() || sync.hasCast();
    const c = document.getElementById('board-chip');
    if (c) {
      c.className = 'chip ' + (on ? 'ok' : 'warn');
      c.innerHTML = on ? '📺 TV connected' : '📺 Connect TV';
    }
    const n = document.getElementById('tv-nudge');
    if (n) n.hidden = on;
  }

  const brand = `<div class="brand">Family <span>Clash</span></div>`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  // ================================================================== HOME
  function viewHome() {
    const resume =
      live && live.screen !== 'over'
        ? `<section class="card resume">
            <div><div class="eyebrow">Game in progress</div><h3>${esc(live.title)}</h3>
            <p class="muted">${live.teams.map((t) => `<b style="color:${t.color}">${esc(t.name)}</b> ${t.score}`).join(' · ')}</p></div>
            <button class="btn primary big-inline" data-act="resume">Resume ▶</button>
          </section>`
        : '';
    const list = games
      .map((g) => {
        const ok = FC.playableRounds(g).length;
        return `<li class="game-card card">
          <div class="game-info"><h3>${esc(g.title || 'Untitled game')}</h3>
            <p class="muted">${plural(g.rounds.length, 'round')}${ok < g.rounds.length ? ` · <span class="warn-text">${g.rounds.length - ok} incomplete</span>` : ''}</p></div>
          <div class="game-actions">
            <button class="btn primary" data-act="setup" data-id="${g.id}">▶ Play</button>
            <button class="btn" data-act="edit" data-id="${g.id}">✎ Edit</button>
            <button class="btn icon ghost" data-act="gameMenu" data-id="${g.id}" aria-label="More options">⋯</button>
          </div></li>`;
      })
      .join('');
    return `<header class="topbar">${brand}<div class="spacer"></div>
        <button class="btn ghost" data-act="import">⤓ Import</button></header>
      <main class="wrap">
        ${resume}
        <div class="section-head"><h2>Your games</h2>
          <button class="btn primary" data-act="newGame">＋ New game</button></div>
        <ul class="game-list">${list || '<li class="empty card">No games yet — tap <b>＋ New game</b> to write your first one.</li>'}</ul>
        <section class="card help">
          <h3>How it works</h3>
          <ol>
            <li><b>Write a game</b> — a question for each round plus the top answers and their points.</li>
            <li><b>Press Play</b>, name the two teams and pick their colours.</li>
            <li><b>Tap 📺 Connect TV</b> to put the big board on your Google TV, then run the game from this screen.</li>
          </ol>
          <p class="muted small">Deleted one of the starter games? <a href="#" data-act="restoreStarters">Bring them back</a></p>
        </section>
      </main>`;
  }

  function newGame() {
    const g = FC.newGame();
    games.unshift(g);
    saveGames(true);
    go('#/edit/' + g.id);
    setTimeout(() => {
      const t = app.querySelector('[data-field="title"]');
      if (t) t.focus();
    }, 50);
  }

  function gameMenu(id) {
    const g = games.find((x) => x.id === id);
    const d = modal(`<h2>${esc(g.title || 'Untitled game')}</h2>
      <div class="menu-list">
        <button class="btn" data-m="dup">⧉ Duplicate</button>
        <button class="btn" data-m="export">⤒ Export (to share or back up)</button>
        <button class="btn danger" data-m="del">🗑 Delete</button>
      </div>
      <div class="row end"><button class="btn ghost" data-close>Close</button></div>`);
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      d.close();
      if (b.dataset.m === 'dup') {
        const c = clone(g);
        c.id = uid();
        c.title = (g.title || 'Untitled game') + ' (copy)';
        games.splice(games.indexOf(g) + 1, 0, c);
        saveGames(true);
        render();
        toast('Game duplicated');
      } else if (b.dataset.m === 'export') {
        exportGame(g);
      } else if (b.dataset.m === 'del') {
        confirmDialog(`Delete “${g.title || 'Untitled game'}”?`, 'Delete', () => {
          games = games.filter((x) => x !== g);
          saveGames(true);
          render();
          toast('Game deleted');
        }, true);
      }
    });
  }

  function exportGame(g) {
    const blob = new Blob([JSON.stringify({ familyclash: 1, game: g }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (g.title || 'family-clash-game').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }

  const importInput = document.getElementById('import-file');
  importInput.addEventListener('change', async () => {
    const file = importInput.files[0];
    importInput.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : data.games || [data.game || data];
      const added = list.filter((g) => g && Array.isArray(g.rounds)).map(FC.normalizeGame);
      if (!added.length) throw new Error('no games');
      added.forEach((g) => {
        if (games.some((x) => x.id === g.id)) g.id = uid();
      });
      games.unshift(...added);
      saveGames(true);
      render();
      toast(`Imported ${plural(added.length, 'game')}`);
    } catch (e) {
      toast("That file doesn't look like a Family Clash game");
    }
  });

  // ================================================================ EDITOR
  function viewEdit() {
    const g = curGame();
    return `<header class="topbar">
        <button class="btn ghost" data-act="home">‹ Games</button><div class="spacer"></div>
        <span class="muted saved" id="saved">✓ Saved</span>
        <button class="btn primary" data-act="setup" data-id="${g.id}">▶ Play</button></header>
      <main class="wrap narrow">
        <label class="field"><span>Game title</span>
          <input data-field="title" value="${esc(g.title)}" placeholder="e.g. Thanksgiving 2026" enterkeyhint="next"></label>
        ${g.rounds.map((r, i) => roundEditor(r, i, g.rounds.length)).join('')}
        <button class="btn add-round" data-act="addRound">＋ Add round</button>
        <p class="muted center small">Everything saves automatically. Answers are shown highest-points-first on the board.</p>
      </main>`;
  }

  function roundTotal(r) {
    return r.answers.reduce((s, a) => s + (Number(a.points) || 0), 0);
  }

  function roundEditor(r, i, n) {
    const rows = r.answers
      .map(
        (a, j) => `<li>
          <span class="num">${j + 1}</span>
          <input class="a-text" data-field="text" data-r="${i}" data-a="${j}" value="${esc(a.text)}" placeholder="Answer" enterkeyhint="next" aria-label="Answer ${j + 1}">
          <input class="a-pts" type="number" inputmode="numeric" min="0" max="999" data-field="points" data-r="${i}" data-a="${j}" value="${esc(a.points)}" placeholder="pts" enterkeyhint="next" aria-label="Points for answer ${j + 1}">
          <button class="btn icon ghost" data-act="delAnswer" data-r="${i}" data-a="${j}" aria-label="Remove answer ${j + 1}">✕</button>
        </li>`
      )
      .join('');
    return `<section class="card round-ed">
        <div class="round-head">
          <h3>Round ${i + 1}</h3>
          <select data-field="multiplier" data-r="${i}" aria-label="Points for round ${i + 1}">
            ${[1, 2, 3].map((m) => `<option value="${m}" ${r.multiplier === m ? 'selected' : ''}>${FC.multLabel(m)}</option>`).join('')}
          </select>
          <div class="spacer"></div>
          <button class="btn icon ghost" data-act="moveRound" data-r="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move round up">↑</button>
          <button class="btn icon ghost" data-act="moveRound" data-r="${i}" data-dir="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Move round down">↓</button>
          <button class="btn icon ghost" data-act="delRound" data-r="${i}" aria-label="Delete round">🗑</button>
        </div>
        <label class="field"><span>Question</span>
          <textarea rows="2" data-field="question" data-r="${i}" placeholder="Name something you…">${esc(r.question)}</textarea></label>
        <div class="answers-head"><span>Answers & points</span><span class="muted">Total <b id="total-${i}">${roundTotal(r)}</b></span></div>
        <ol class="answer-rows">${rows}</ol>
        <div class="row gap">
          ${r.answers.length < FC.MAX_ANSWERS ? `<button class="btn" data-act="addAnswer" data-r="${i}">＋ Answer</button>` : `<span class="muted small">8 answers max</span>`}
          <button class="btn ghost" data-act="pasteAnswers" data-r="${i}">📋 Paste a list</button>
        </div>
      </section>`;
  }

  function editChanged() {
    const g = curGame();
    g.updated = Date.now();
    saveGames();
    const s = document.getElementById('saved');
    if (s) {
      s.classList.remove('pulse');
      void s.offsetWidth;
      s.classList.add('pulse');
    }
  }

  function focusAnswer(r, a, which) {
    const el = app.querySelector(`[data-r="${r}"][data-a="${a}"][data-field="${which || 'text'}"]`);
    if (el) el.focus();
  }

  function addAnswer(ri) {
    const r = curGame().rounds[ri];
    if (r.answers.length >= FC.MAX_ANSWERS) return;
    r.answers.push({ text: '', points: '' });
    editChanged();
    render();
    focusAnswer(ri, r.answers.length - 1);
  }

  function pasteDialog(ri) {
    const d = modal(`<h2>Paste a list of answers</h2>
      <p class="muted">One answer per line with its points at the end — e.g. <code>Pizza 32</code>. Copy straight from a spreadsheet or notes app.</p>
      <textarea id="paste-box" rows="8" placeholder="Pizza 32&#10;Tacos 20&#10;Burgers 15" autofocus></textarea>
      <label class="check"><input type="checkbox" id="paste-replace" checked> Replace the answers already in this round</label>
      <div class="row end"><button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="paste-ok">Add answers</button></div>`);
    d.querySelector('#paste-ok').addEventListener('click', () => {
      const parsed = FC.parseAnswerLines(d.querySelector('#paste-box').value);
      if (!parsed.length) return toast('Nothing to add');
      const r = curGame().rounds[ri];
      const keep = d.querySelector('#paste-replace').checked ? [] : r.answers.filter((a) => a.text.trim());
      r.answers = keep.concat(parsed).slice(0, FC.MAX_ANSWERS);
      d.close();
      editChanged();
      render();
      toast(`Added ${plural(parsed.length, 'answer')}`);
    });
  }

  // ================================================================= SETUP
  function viewSetup() {
    const g = curGame();
    if (!setup || setup.gameId !== g.id) setup = { gameId: g.id, teams: clone(teamsPref) };
    const rounds = FC.playableRounds(g);
    const teamCard = (t, i) => `<div class="card team-setup" style="--team:${t.color}">
        <label class="field"><span>Team ${i + 1}</span>
          <input data-field="teamName" data-t="${i}" value="${esc(t.name)}" placeholder="Team ${i + 1}" maxlength="24"></label>
        <div class="swatches" role="radiogroup" aria-label="Team ${i + 1} colour">
          ${FC.TEAM_COLORS.map(
            (c) => `<button class="swatch ${c === t.color ? 'on' : ''}" style="background:${c}" data-act="teamColor" data-t="${i}" data-color="${c}" role="radio" aria-checked="${c === t.color}" aria-label="Colour ${c}"></button>`
          ).join('')}
        </div></div>`;
    return `<header class="topbar"><button class="btn ghost" data-act="home">‹ Games</button><div class="spacer"></div>${brand}<div class="spacer"></div><span class="topbar-pad"></span></header>
      <main class="wrap narrow">
        <h2>Who's playing?</h2>
        <label class="field"><span>Game</span>
          <select data-field="game">${games.map((x) => `<option value="${x.id}" ${x.id === g.id ? 'selected' : ''}>${esc(x.title || 'Untitled game')}</option>`).join('')}</select></label>
        <p class="muted small">${rounds.length ? `${plural(rounds.length, 'round')} ready to play` : '<span class="warn-text">This game has no rounds with answers yet.</span>'}
          ${rounds.length < g.rounds.length && rounds.length ? ` · ${g.rounds.length - rounds.length} empty round(s) will be skipped` : ''}
          · <a href="#/edit/${g.id}">Edit questions</a></p>
        <div class="team-grid">${setup.teams.map(teamCard).join('')}</div>
        <section class="card timer-setup">
          <h3>⏱ Guess timer</h3>
          <p class="muted small">How long each player gets to answer.</p>
          ${timerControls(timerPrefs)}
        </section>
        <button class="btn primary huge full" data-act="startGame" ${rounds.length ? '' : 'disabled'}>Let's play ▶</button>
      </main>`;
  }

  function startGame() {
    const g = curGame();
    const rounds = FC.playableRounds(g);
    if (!rounds.length) return toast('Add at least one question with answers first');
    const begin = () => {
      teamsPref = setup.teams.map((t, i) => ({ name: t.name.trim() || `Team ${i + 1}`, color: t.color }));
      save('fc.teams', teamsPref);
      live = {
        id: uid(),
        room,
        title: g.title.trim() || 'Family Clash',
        gameId: g.id,
        rounds,
        teams: teamsPref.map((t) => ({ name: t.name, color: t.color, score: 0 })),
        round: -1,
        screen: 'title',
        revealed: [],
        strikes: 0,
        bank: 0,
        awarded: null,
        awardedAmount: 0,
        control: null,
        showQuestion: true,
        timerCfg: Object.assign({}, timerPrefs),
        timer: null,
        seq: 0,
        fx: null,
      };
      history = [];
      persistLive();
      pushState();
      go('#/play');
    };
    if (live && live.screen !== 'over') confirmDialog('Replace the game in progress?', 'Start new game', begin);
    else begin();
  }

  // ============================================================ LIVE GAME
  function commit(mutate, fx) {
    history.push(JSON.stringify(live));
    if (history.length > 60) history.shift();
    quiet(mutate, fx);
  }

  // A state change that isn't worth an undo step (starting/stopping the timer, settings).
  function quiet(mutate, fx) {
    mutate(live);
    if (live.screen !== 'round') timerOff(live);
    live.seq++;
    if (fx) live.fx = Object.assign({ id: live.seq }, fx);
    persistLive();
    pushState();
    render();
  }

  function undo() {
    if (!history.length) return;
    const seq = live.seq;
    live = JSON.parse(history.pop());
    timerOff(live); // never resurrect a clock that has already run down
    live.seq = seq + 1;
    live.fx = { id: live.seq, kind: 'undo' };
    persistLive();
    pushState();
    render();
    toast('Undone');
  }

  // ---------------------------------------------------------- guess timer
  const tcfg = () => (live && live.timerCfg) || { seconds: 0, autoNext: false, autoStrike: false };
  const timerRunning = () => !!(live && live.timer && live.timer.running);

  function timerOn(s) {
    const secs = tcfg().seconds;
    if (!secs) return timerOff(s);
    s.timer = { running: true, duration: secs, endsAt: Date.now() + secs * 1000 };
  }
  function timerOff(s) {
    if (s.timer) s.timer.running = false;
  }
  // After a guess: start the clock for the next player if that's switched on and the round is still live.
  function nextGuessTimer(s) {
    const c = tcfg();
    if (c.seconds && c.autoNext && s.screen === 'round' && s.awarded === null && s.strikes < 3 && s.revealed.some((v) => !v)) timerOn(s);
    else timerOff(s);
  }

  let timeUpTimer = null;
  function scheduleTimeUp() {
    clearTimeout(timeUpTimer);
    if (!timerRunning()) return;
    timeUpTimer = setTimeout(timeUp, Math.max(0, live.timer.endsAt - Date.now()));
  }
  function timeUp() {
    if (!timerRunning()) return;
    if (Date.now() < live.timer.endsAt - 30) return scheduleTimeUp();
    if (tcfg().autoStrike && live.screen === 'round' && live.awarded === null) {
      const count = live.strikes >= 3 ? 1 : live.strikes + 1;
      commit(
        (s) => {
          timerOff(s);
          s.strikes = Math.min(3, s.strikes + 1);
          nextGuessTimer(s);
        },
        { kind: 'timeup', strike: true, count }
      );
    } else {
      quiet((s) => timerOff(s), { kind: 'timeup' });
    }
  }

  function toggleTimer() {
    if (!tcfg().seconds) return timerDialog();
    quiet((s) => (timerRunning() ? timerOff(s) : timerOn(s)));
  }

  function timerControls(c) {
    return `<div class="seg" role="radiogroup" aria-label="Seconds per guess">
        ${TIMER_PRESETS.map(
          (v) => `<button class="seg-btn ${c.seconds === v ? 'on' : ''}" data-act="timerSecs" data-secs="${v}" role="radio" aria-checked="${c.seconds === v}">${v ? v + 's' : 'Off'}</button>`
        ).join('')}
      </div>
      <label class="check ${c.seconds ? '' : 'dim'}"><input type="checkbox" data-topt="autoNext" ${c.autoNext ? 'checked' : ''} ${c.seconds ? '' : 'disabled'}> Start the clock automatically for each new guess</label>
      <label class="check ${c.seconds ? '' : 'dim'}"><input type="checkbox" data-topt="autoStrike" ${c.autoStrike ? 'checked' : ''} ${c.seconds ? '' : 'disabled'}> Running out of time counts as a wrong answer</label>`;
  }

  // Applies a timer setting change — to the setup screen's defaults, or to the game being played.
  function setTimerOpt(key, value) {
    timerPrefs = Object.assign({}, timerPrefs, { [key]: value });
    save('fc.timerPrefs', timerPrefs);
    if (view === 'play' && live) {
      quiet((s) => {
        s.timerCfg = Object.assign({}, tcfg(), { [key]: value });
        if (key === 'seconds') timerOff(s);
      });
      const d = document.querySelector('dialog.timer-dlg');
      if (d) d.querySelector('.timer-ctl').innerHTML = timerControls(tcfg());
    } else if (view === 'setup') {
      render();
    }
  }

  function timerDialog() {
    modal(`<h2>⏱ Guess timer</h2>
      <p class="muted">How long each player gets to answer. Changes apply straight away.</p>
      <div class="timer-ctl">${timerControls(tcfg())}</div>
      <div class="row end"><button class="btn primary" data-close>Done</button></div>`, 'timer-dlg');
  }

  // Keep the host's countdown display ticking without re-rendering the page.
  setInterval(() => {
    const num = document.getElementById('timer-num');
    if (!num || !live || !live.timer) return;
    const t = live.timer;
    const left = t.running ? Math.max(0, t.endsAt - Date.now()) : 0;
    num.textContent = t.running ? Math.ceil(left / 1000) : '–';
    const bar = document.getElementById('timer-bar');
    if (bar) bar.style.width = (t.running ? (left / (t.duration * 1000)) * 100 : 0) + '%';
    const card = document.getElementById('timer-card');
    if (card) card.classList.toggle('low', t.running && left <= 3000);
  }, 100);

  const curRound = () => live.rounds[live.round];
  const mult = () => (curRound() ? curRound().multiplier : 1);

  function startRound(i) {
    commit(
      (s) => {
        s.round = i;
        s.screen = 'round';
        s.revealed = s.rounds[i].answers.map(() => 0);
        s.strikes = 0;
        s.bank = 0;
        s.awarded = null;
        s.awardedAmount = 0;
        s.control = null;
        s.showQuestion = true;
        s.timer = null;
      },
      { kind: 'round' }
    );
  }

  // revealed[i]: 0 = hidden, 1 = guessed (counts toward the bank), 2 = shown after the round was won
  function reveal(i) {
    const r = curRound();
    if (!r || i >= r.answers.length) return;
    if (live.revealed[i]) return toast('Already on the board — use Undo if that was a mistake');
    const pts = r.answers[i].points * mult();
    commit(
      (s) => {
        if (s.awarded === null) {
          s.revealed[i] = 1;
          s.bank += pts;
        } else s.revealed[i] = 2;
        nextGuessTimer(s);
      },
      { kind: 'reveal', index: i }
    );
  }

  function strike() {
    const count = live.strikes >= 3 ? 1 : live.strikes + 1;
    commit(
      (s) => {
        s.strikes = Math.min(3, s.strikes + 1);
        nextGuessTimer(s);
      },
      { kind: 'strike', count }
    );
  }

  function award(t) {
    if (live.awarded !== null) return;
    const amount = live.bank;
    commit(
      (s) => {
        s.teams[t].score += amount;
        s.awarded = t;
        s.awardedAmount = amount;
        s.bank = 0;
        s.control = t;
        timerOff(s);
      },
      { kind: 'award', team: t, amount }
    );
  }

  function nextRound() {
    const goNext = () => {
      if (live.round < live.rounds.length - 1) startRound(live.round + 1);
      else commit((s) => (s.screen = 'over'), { kind: 'over' });
    };
    if (live.awarded === null && live.bank > 0)
      confirmDialog(`${live.bank} points in the bank haven't been given to a team. Move on anyway?`, 'Move on', goNext);
    else goNext();
  }

  function adjustDialog(t) {
    const team = live.teams[t];
    const d = modal(`<h2>Adjust score</h2>
      <p><b style="color:${team.color}">${esc(team.name)}</b></p>
      <input type="number" inputmode="numeric" id="adj-val" class="big-input" value="${team.score}">
      <div class="row gap wrap-row">${[-10, -5, -1, 1, 5, 10].map((v) => `<button class="btn" data-adj="${v}">${v > 0 ? '+' : '−'}${Math.abs(v)}</button>`).join('')}</div>
      <div class="row end"><button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="adj-ok">Save</button></div>`);
    const input = d.querySelector('#adj-val');
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-adj]');
      if (b) input.value = (Math.round(Number(input.value)) || 0) + Number(b.dataset.adj);
    });
    const ok = () => {
      const v = Math.round(Number(input.value)) || 0;
      d.close();
      if (v !== team.score) commit((s) => (s.teams[t].score = v), { kind: 'score' });
    };
    d.querySelector('#adj-ok').addEventListener('click', ok);
    input.addEventListener('keydown', (e) => e.key === 'Enter' && ok());
  }

  function playMenu() {
    const d = modal(`<h2>Game options</h2>
      <div class="menu-list">
        ${live.screen === 'round' ? `<button class="btn" data-m="restart">↺ Restart this round</button>` : ''}
        ${live.screen === 'round' ? `<button class="btn" data-m="toggleQ">${live.showQuestion ? '🙈 Hide' : '👁 Show'} the question on the TV</button>` : ''}
        <button class="btn" data-m="tv">📺 Connect the TV</button>
        <button class="btn" data-m="timer">⏱ Guess timer: ${tcfg().seconds ? tcfg().seconds + ' seconds' : 'off'}</button>
        ${live.screen !== 'over' ? `<button class="btn" data-m="end">🏁 End game & show the winner</button>` : ''}
        <button class="btn" data-m="new">✚ Start a different game</button>
      </div>
      <p class="muted small">Netbook shortcuts: <kbd>1</kbd>–<kbd>8</kbd> reveal · <kbd>X</kbd> wrong answer · <kbd>←</kbd>/<kbd>→</kbd> who's playing · <kbd>Q</kbd> show/hide question · <kbd>T</kbd> start/stop timer · <kbd>Ctrl</kbd>+<kbd>Z</kbd> undo</p>
      <div class="row end"><button class="btn ghost" data-close>Close</button></div>`);
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      d.close();
      const m = b.dataset.m;
      if (m === 'restart') startRound(live.round);
      else if (m === 'toggleQ') commit((s) => (s.showQuestion = !s.showQuestion));
      else if (m === 'tv') tvDialog();
      else if (m === 'timer') timerDialog();
      else if (m === 'end') confirmDialog('End the game now?', 'End game', () => commit((s) => (s.screen = 'over'), { kind: 'over' }));
      else if (m === 'new') go('#/');
    });
  }

  async function tvDialog() {
    const net = await sync.netAvailable;
    const canCast = 'PresentationRequest' in window && window.isSecureContext;
    const origin = location.origin + location.pathname.replace(/[^/]*$/, '');
    modal(
      `<h2>Put the board on the TV</h2>
      <div class="tv-opts">
        ${canCast ? `<div class="tv-opt">
          <h3>① Cast straight to your Google TV</h3>
          <p>From Chrome on this laptop / netbook. Pick your TV from the list and the board appears on it — keep running the game from here.</p>
          <button class="btn primary" data-act="castBoard">📡 Cast the board</button></div>` : ''}
        <div class="tv-opt">
          <h3>${canCast ? '②' : '①'} Open the board in a tab, then cast that tab</h3>
          <p>Opens the board in a new tab. In that tab use Chrome's <b>⋮ menu → Cast…</b> and choose your TV, then come back to this tab to run the game. (Or just drag the tab onto a second monitor.)</p>
          <button class="btn" data-act="openBoard">↗ Open the board</button></div>
        ${
          net
            ? `<div class="tv-opt">
          <h3>${canCast ? '③' : '②'} Show the board on another device</h3>
          <p>On the laptop, TV browser or second tablet, open:</p>
          <p class="big-url">${esc(origin)}board</p>
          <p>…and enter room code <span class="code">${room}</span></p>
          <p class="muted small">Tip: cast that device's board tab to the TV and use this tablet as a remote.</p></div>`
            : `<div class="tv-opt muted">
          <h3>Want to use a tablet as the remote?</h3>
          <p>Run <code>node server.js</code> on a laptop and open the address it prints on both devices. The tablet then controls the board wherever it's shown.</p></div>`
        }
      </div>
      <div class="row end"><button class="btn" data-close>Done</button></div>`,
      'wide'
    );
  }

  async function castBoard(btn) {
    try {
      const req = new PresentationRequest([boardUrl()]);
      const conn = await req.start();
      try {
        sessionStorage.setItem('fc.presentationId', conn.id);
      } catch (e) {}
      sync.addConnection(conn);
      const d = btn && btn.closest('dialog');
      if (d) d.close();
      toast('Casting the board 📺');
    } catch (e) {
      if (e && e.name === 'NotAllowedError') return; // user closed the picker
      toast("Couldn't cast directly — try “Open the board” and cast that tab");
    }
  }

  // ---------------------------------------------------------- play view
  function teamsBar() {
    const playing = live.screen === 'round';
    return `<div class="teams-bar">${live.teams
      .map(
        (t, i) => `<div class="team-card ${live.control === i && playing ? 'active' : ''}" style="--team:${t.color}">
          <button class="team-main" data-act="control" data-t="${i}" ${playing ? '' : 'disabled'} aria-pressed="${live.control === i}">
            <span class="team-name">${esc(t.name)}</span>
            ${playing ? `<span class="team-state">${live.control === i ? '● Playing now' : 'Tap when they play'}</span>` : ''}
          </button>
          <button class="team-score" data-act="adjust" data-t="${i}" aria-label="Adjust ${esc(t.name)} score">${t.score}</button>
        </div>`
      )
      .join('')}</div>`;
  }

  function timerCard() {
    const c = tcfg();
    if (!c.seconds)
      return `<button class="btn ghost timer-add" data-act="timerSettings">⏱ Add a guess timer</button>`;
    const t = live.timer;
    const on = timerRunning();
    const left = on ? Math.max(0, t.endsAt - Date.now()) : 0;
    return `<div class="card timer-card ${on ? 'running' : ''}" id="timer-card">
        <div class="timer-top">
          <span class="timer-num" id="timer-num">${on ? Math.ceil(left / 1000) : '–'}</span>
          <span class="timer-meta"><b>Guess timer</b><span class="muted small">${c.seconds}s per guess${c.autoNext ? ' · auto-starts' : ''}${c.autoStrike ? ' · wrong when time runs out' : ''}</span></span>
          <button class="btn icon ghost" data-act="timerSettings" aria-label="Timer settings">⚙</button>
        </div>
        <div class="timer-track"><i id="timer-bar" style="width:${on ? (left / (t.duration * 1000)) * 100 : 0}%"></i></div>
        <button class="btn ${on ? '' : 'primary'} big" data-act="timerToggle">${on ? '■ Stop the clock' : `▶ Start ${c.seconds}s clock`}</button>
      </div>`;
  }

  function viewPlay() {
    const s = live;
    const n = s.rounds.length;
    const sub =
      s.screen === 'round'
        ? `Round ${s.round + 1} of ${n}${mult() > 1 ? ` · <b class="gold">${mult()}× points</b>` : ''}`
        : s.screen === 'title'
        ? 'Ready to start'
        : 'Game over';
    const head = `<header class="topbar play-top">
        <button class="btn icon ghost" data-act="home" aria-label="Back to games">‹</button>
        <div class="play-title"><b>${esc(s.title)}</b><span class="muted">${sub}</span></div>
        <div class="spacer"></div>
        <button id="board-chip" class="chip warn" data-act="tv">📺 Connect TV</button>
        <button class="btn" data-act="undo" ${history.length ? '' : 'disabled'} aria-label="Undo">↶<span class="hide-sm"> Undo</span></button>
        <button class="btn icon" data-act="playMenu" aria-label="More options">⋯</button>
      </header>`;
    const nudge = `<div id="tv-nudge" class="nudge">📺 The TV board isn't connected yet.
        <button class="btn small primary" data-act="tv">Connect TV</button></div>`;

    let body;
    if (s.screen === 'title') {
      body = `${nudge}<section class="card center hero">
          <div class="eyebrow">${plural(n, 'round')}</div>
          <h1>${esc(s.title)}</h1>
          <p class="vs">${s.teams.map((t) => `<b style="color:${t.color}">${esc(t.name)}</b>`).join(' <span class="muted">vs</span> ')}</p>
          <button class="btn primary huge" data-act="startRound">Start round 1 ▶</button>
        </section>`;
    } else if (s.screen === 'over') {
      const [a, b] = s.teams;
      const winner = a.score === b.score ? null : a.score > b.score ? a : b;
      body = `<section class="card center hero">
          <div class="trophy">🏆</div>
          <h1>${winner ? `<span style="color:${winner.color}">${esc(winner.name)}</span> win!` : "It's a tie!"}</h1>
          <p class="vs">${s.teams.map((t) => `<b style="color:${t.color}">${esc(t.name)}</b> ${t.score}`).join(' <span class="muted">·</span> ')}</p>
          <div class="row gap center-row">
            <button class="btn primary huge" data-act="playAgain">Play again</button>
            <button class="btn huge" data-act="home">Back to games</button>
          </div></section>`;
    } else {
      const r = curRound();
      const anyHidden = s.revealed.some((v) => !v);
      const last = s.round === n - 1;
      const awardedTeam = s.awarded !== null ? s.teams[s.awarded] : null;
      body = `${nudge}
        <section class="card question-card">
          <p class="q">${esc(r.question) || '<span class="muted">(No question text — read it out loud)</span>'}</p>
          <button class="btn small ghost" data-act="toggleQ">${s.showQuestion ? '👁 Showing on TV' : '🙈 Hidden on TV'}</button>
        </section>
        <div class="play-grid">
          <section>
            <ol class="ans-list">${r.answers
              .map((a, i) => {
                const st = s.revealed[i];
                return `<li><button class="ans ${st ? 'on' : ''} ${st === 2 ? 'shown' : ''}" data-act="reveal" data-i="${i}" ${st ? 'aria-pressed="true"' : ''}>
                  <span class="ans-num">${i + 1}</span><span class="ans-text">${esc(a.text)}</span>
                  <span class="ans-pts">${a.points}${mult() > 1 ? `<small>×${mult()}</small>` : ''}</span>
                  <span class="ans-state">${st ? '✓ on board' : 'Tap to reveal'}</span></button></li>`;
              })
              .join('')}</ol>
          </section>
          <section class="ctrl-col">
            ${timerCard()}
            <div class="card strike-card">
              <div class="strikes" aria-label="${s.strikes} strikes">${[0, 1, 2].map((i) => `<span class="x ${i < s.strikes ? 'on' : ''}">✕</span>`).join('')}</div>
              <button class="btn danger big" data-act="strike">✕ Wrong answer</button>
              ${s.strikes ? `<button class="btn ghost small" data-act="clearStrikes">Clear strikes</button>` : ''}
            </div>
            <div class="card bank-card">
              ${
                awardedTeam
                  ? `<p class="awarded">✓ <b>${s.awardedAmount}</b> points went to <b style="color:${awardedTeam.color}">${esc(awardedTeam.name)}</b></p>`
                  : `<div class="bank-label">Points in the bank</div><div class="bank-val">${s.bank}</div>
                     <div class="award-btns">${s.teams
                       .map((t, i) => `<button class="btn award" style="--team:${t.color}" data-act="award" data-t="${i}" ${s.bank ? '' : 'disabled'}>Give to ${esc(t.name)}</button>`)
                       .join('')}</div>`
              }
            </div>
            <div class="card next-card">
              ${anyHidden ? `<button class="btn" data-act="revealAll">Reveal the rest</button>` : ''}
              <button class="btn primary big" data-act="next">${last ? 'Finish game 🏁' : 'Next round ▶'}</button>
            </div>
          </section>
        </div>`;
    }
    return `${head}<main class="wrap play">${teamsBar()}${body}</main>`;
  }

  // ============================================================== ACTIONS
  const actions = {
    home: () => go('#/'),
    resume: () => go('#/play'),
    newGame,
    import: () => importInput.click(),
    edit: (el) => go('#/edit/' + el.dataset.id),
    setup: (el) => {
      saveGames(true);
      go('#/setup/' + el.dataset.id);
    },
    gameMenu: (el) => gameMenu(el.dataset.id),
    restoreStarters: () => {
      const n = seedStarters(true);
      render();
      toast(n ? `Restored ${plural(n, 'starter game')}` : 'All the starter games are already here');
    },

    addRound: () => {
      const g = curGame();
      g.rounds.push(FC.newRound(g.rounds.length >= 3 ? 2 : 1));
      editChanged();
      render();
      const qs = app.querySelectorAll('[data-field="question"]');
      qs[qs.length - 1].focus();
    },
    delRound: (el) => {
      const g = curGame();
      const i = Number(el.dataset.r);
      const r = g.rounds[i];
      const doIt = () => {
        g.rounds.splice(i, 1);
        if (!g.rounds.length) g.rounds.push(FC.newRound());
        editChanged();
        render();
      };
      if (r.question.trim() || r.answers.some((a) => a.text.trim())) confirmDialog(`Delete round ${i + 1}?`, 'Delete', doIt, true);
      else doIt();
    },
    moveRound: (el) => {
      const g = curGame();
      const i = Number(el.dataset.r);
      const j = i + Number(el.dataset.dir);
      if (j < 0 || j >= g.rounds.length) return;
      [g.rounds[i], g.rounds[j]] = [g.rounds[j], g.rounds[i]];
      editChanged();
      render();
    },
    addAnswer: (el) => addAnswer(Number(el.dataset.r)),
    delAnswer: (el) => {
      const r = curGame().rounds[Number(el.dataset.r)];
      r.answers.splice(Number(el.dataset.a), 1);
      editChanged();
      render();
    },
    pasteAnswers: (el) => pasteDialog(Number(el.dataset.r)),

    teamColor: (el) => {
      setup.teams[Number(el.dataset.t)].color = el.dataset.color;
      render();
    },
    startGame,

    tv: tvDialog,
    castBoard: (el) => castBoard(el),
    openBoard: (el) => {
      window.open(boardUrl(), 'familyclash-board');
      const d = el.closest('dialog');
      if (d) d.close();
    },
    undo,
    playMenu,
    startRound: () => startRound(0),
    reveal: (el) => reveal(Number(el.dataset.i)),
    strike,
    clearStrikes: () => commit((s) => (s.strikes = 0)),
    award: (el) => award(Number(el.dataset.t)),
    control: (el) => {
      const t = Number(el.dataset.t);
      commit((s) => (s.control = s.control === t ? null : t));
    },
    adjust: (el) => adjustDialog(Number(el.dataset.t)),
    toggleQ: () => commit((s) => (s.showQuestion = !s.showQuestion)),
    revealAll: () =>
      commit(
        (s) => {
          s.revealed = s.revealed.map((v) => v || 2);
          timerOff(s);
        },
        { kind: 'revealAll' }
      ),
    timerToggle: toggleTimer,
    timerSettings: timerDialog,
    timerSecs: (el) => setTimerOpt('seconds', Number(el.dataset.secs)),
    next: nextRound,
    playAgain: () => {
      const g = games.find((x) => x.id === live.gameId);
      setup = { gameId: g ? g.id : games[0].id, teams: live.teams.map((t) => ({ name: t.name, color: t.color })) };
      viewArg = setup.gameId;
      if (g) startGame();
      else go('#/');
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = actions[el.dataset.act];
    if (fn) {
      e.preventDefault();
      fn(el, e);
    }
  });

  app.addEventListener('input', (e) => {
    const el = e.target;
    const f = el.dataset.field;
    if (!f) return;
    if (view === 'edit') {
      const g = curGame();
      const r = el.dataset.r != null ? g.rounds[Number(el.dataset.r)] : null;
      if (f === 'title') g.title = el.value;
      else if (f === 'question') r.question = el.value;
      else if (f === 'multiplier') r.multiplier = Number(el.value);
      else if (f === 'text') r.answers[Number(el.dataset.a)].text = el.value;
      else if (f === 'points') {
        r.answers[Number(el.dataset.a)].points = el.value === '' ? '' : Math.max(0, Math.round(Number(el.value)) || 0);
        const tot = document.getElementById('total-' + el.dataset.r);
        if (tot) tot.textContent = roundTotal(r);
      }
      editChanged();
    } else if (view === 'setup') {
      if (f === 'teamName') {
        setup.teams[Number(el.dataset.t)].name = el.value;
      } else if (f === 'game') go('#/setup/' + el.value);
    }
  });

  document.addEventListener('change', (e) => {
    const k = e.target.dataset && e.target.dataset.topt;
    if (k) setTimerOpt(k, e.target.checked);
  });

  // Enter moves to the next box while typing answers (and adds a row at the end).
  app.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || view !== 'edit') return;
    const el = e.target;
    const f = el.dataset.field;
    if (f === 'title') {
      e.preventDefault();
      const q = app.querySelector('[data-field="question"]');
      if (q) q.focus();
    } else if (f === 'question') {
      e.preventDefault();
      focusAnswer(el.dataset.r, 0);
    } else if (f === 'text') {
      e.preventDefault();
      focusAnswer(el.dataset.r, el.dataset.a, 'points');
    } else if (f === 'points') {
      e.preventDefault();
      const ri = Number(el.dataset.r);
      const ai = Number(el.dataset.a);
      const r = curGame().rounds[ri];
      if (ai < r.answers.length - 1) focusAnswer(ri, ai + 1);
      else if (r.answers.length < FC.MAX_ANSWERS) addAnswer(ri);
    }
  });

  // Keyboard shortcuts while running a game (handy on a netbook).
  document.addEventListener('keydown', (e) => {
    if (view !== 'play' || !live || e.altKey || e.metaKey) return;
    if (e.target.closest('input, textarea, select') || document.querySelector('dialog[open]')) return;
    if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      return undo();
    }
    if (e.ctrlKey || live.screen !== 'round') return;
    const k = e.key.toLowerCase();
    if (/^[1-8]$/.test(k)) reveal(Number(k) - 1);
    else if (k === 'x') strike();
    else if (k === 'q') actions.toggleQ();
    else if (k === 't') toggleTimer();
    else if (k === 'arrowleft') commit((s) => (s.control = 0));
    else if (k === 'arrowright') commit((s) => (s.control = 1));
    else return;
    e.preventDefault();
  });

  route();
  scheduleTimeUp(); // a clock may have been running when the page was reloaded
})();
