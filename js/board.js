/* Family Clash — the big screen. Purely a renderer of the host's state. */
(function () {
  'use strict';
  const { esc, load, save } = FC;
  const $ = (id) => document.getElementById(id);

  const params = new URLSearchParams(location.search);
  let room = (params.get('room') || load('fc.boardRoom', '') || '').toUpperCase() || null;
  if (params.get('room')) save('fc.boardRoom', room);
  const receiver = navigator.presentation && navigator.presentation.receiver;

  const sync = FC.Sync('board', room);
  let state = null;
  let gameId = null;
  let lastFx = -1;
  let builtKey = null;
  let heardHost = false;
  let clockOffset = 0;
  const shown = [0, 0]; // scores currently displayed (for count-up animation)

  // ------------------------------------------------------------ connection
  sync.on((msg) => {
    if (msg.type !== 'state') return;
    heardHost = true;
    // The host stamps each update with its clock; the difference to ours covers clock drift
    // between devices (and network delay), so the countdown ends when the host's does.
    clockOffset = msg.sentAt ? Date.now() - msg.sentAt : 0;
    apply(msg.state);
  });
  sync.onConnect = () => sync.send({ type: 'hello' });
  sync.send({ type: 'hello' });
  setInterval(() => sync.send({ type: 'ping' }), 4000);

  if (receiver) {
    receiver.connectionList.then((list) => {
      list.connections.forEach((c) => sync.addConnection(c));
      list.addEventListener('connectionavailable', (e) => sync.addConnection(e.connection));
    });
  }

  sync.netAvailable.then((net) => {
    if (!net || receiver) return;
    const form = $('room-form');
    const input = $('room-input');
    if (room) input.value = room;
    form.hidden = false;
    $('wait-help').innerHTML = 'Enter the room code shown on the host under <b>📺 Connect TV</b>.';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!code) return;
      room = code;
      save('fc.boardRoom', room);
      history.replaceState(null, '', '?room=' + room);
      sync.setRoom(room);
      sync.send({ type: 'hello' });
      $('wait-msg').textContent = 'Looking for room ' + room + '…';
      input.blur();
    });
  });

  // ------------------------------------------------------------ rendering
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'scr-' + name));
  }

  function apply(s) {
    if (!s || !s.teams) {
      state = null;
      showScreen('waiting');
      $('scorebar').hidden = true;
      $('wait-msg').textContent = heardHost ? 'Connected ✓  Waiting for the host to start a game…' : 'Waiting for the host…';
      return;
    }
    if (s.id !== gameId) {
      const firstLoad = gameId === null;
      gameId = s.id;
      builtKey = null;
      lastFx = firstLoad && s.fx ? s.fx.id : -1;
      s.teams.forEach((t, i) => (shown[i] = firstLoad ? t.score : 0));
    }
    state = s;
    render();
    if (s.fx && s.fx.id > lastFx) {
      lastFx = s.fx.id;
      playFx(s.fx);
    } else if (s.fx && s.fx.id < lastFx) {
      lastFx = s.fx.id;
    }
  }

  function render() {
    const s = state;
    const root = document.documentElement.style;
    s.teams.forEach((t, i) => root.setProperty('--team' + i, t.color));
    showScreen(s.screen);

    if (s.screen === 'title') {
      $('title-name').textContent = s.title;
      s.teams.forEach((t, i) => ($('vs-' + i).textContent = t.name));
    } else if (s.screen === 'round') {
      renderRound();
    } else if (s.screen === 'over') {
      const [a, b] = s.teams;
      const w = a.score === b.score ? null : a.score > b.score ? 0 : 1;
      $('winner').innerHTML =
        w === null ? "It's a tie!" : `<span style="color:var(--team${w})">${esc(s.teams[w].name)}</span> win!`;
    }

    const bar = $('scorebar');
    bar.hidden = false;
    bar.classList.toggle('no-bank', s.screen !== 'round');
    s.teams.forEach((t, i) => {
      const el = $('team-' + i);
      el.querySelector('.t-name').textContent = t.name;
      el.classList.toggle('active', s.screen === 'round' && s.control === i);
      el.classList.toggle('winner', s.screen === 'over' && t.score > s.teams[1 - i].score);
      animateScore(i, t.score);
    });
    $('bank-val').textContent = s.awarded === null ? s.bank : 0;
    renderTimer();
  }

  function renderRound() {
    const s = state;
    const r = s.rounds[s.round];
    const pill = $('round-pill');
    pill.textContent = `Round ${s.round + 1}` + (r.multiplier > 1 ? ` · ${r.multiplier === 2 ? 'Double' : 'Triple'} points` : '');
    pill.classList.toggle('mult', r.multiplier > 1);
    const q = $('question');
    q.textContent = r.question;
    q.classList.toggle('hidden-q', !s.showQuestion || !r.question);

    const tiles = $('tiles');
    const key = s.id + ':' + s.round;
    if (builtKey !== key) {
      builtKey = key;
      const n = r.answers.length;
      const two = n > 4;
      const rows = two ? Math.ceil(n / 2) : n;
      tiles.classList.toggle('two-col', two);
      tiles.style.setProperty('--rows', Math.max(rows, 1));
      const slots = two ? rows * 2 : n;
      let html = '';
      for (let i = 0; i < slots; i++) {
        const a = r.answers[i];
        if (!a) {
          html += `<div class="tile empty"><div class="tile-inner"><div class="face front"></div></div></div>`;
          continue;
        }
        const len = a.text.length;
        const size = len > 26 ? 'xs' : len > 18 ? 'sm' : '';
        html += `<div class="tile" data-i="${i}"><div class="tile-inner">
            <div class="face front"><span class="num">${i + 1}</span></div>
            <div class="face back"><span class="ans ${size}">${esc(a.text)}</span><span class="pts">${a.points}</span></div>
          </div></div>`;
      }
      tiles.classList.add('no-anim');
      tiles.innerHTML = html;
      requestAnimationFrame(() => requestAnimationFrame(() => tiles.classList.remove('no-anim')));
    }
    tiles.querySelectorAll('.tile[data-i]').forEach((t) => t.classList.toggle('revealed', !!s.revealed[Number(t.dataset.i)]));
  }

  // ------------------------------------------------------------ guess timer
  let timerRaf = null;
  let lastTickSec = null;
  function renderTimer() {
    const t = state && state.screen === 'round' ? state.timer : null;
    const el = $('timer');
    const running = !!(t && t.running);
    document.body.classList.toggle('timer-on', running);
    el.hidden = !running;
    cancelAnimationFrame(timerRaf);
    if (!running) return;
    const endsAt = t.endsAt + clockOffset;
    const total = t.duration * 1000;
    lastTickSec = null;
    const frame = () => {
      const left = Math.max(0, endsAt - Date.now());
      const sec = Math.ceil(left / 1000);
      $('timer-num').textContent = sec;
      el.style.setProperty('--p', Math.min(1, left / total));
      el.classList.toggle('low', left <= 3000);
      el.classList.toggle('warn', left <= 5000);
      if (sec !== lastTickSec) {
        if (lastTickSec !== null && sec > 0 && sec <= 5) FC.Sound.tick(sec <= 3);
        lastTickSec = sec;
      }
      if (left > 0) timerRaf = requestAnimationFrame(frame);
    };
    frame();
  }

  const scoreAnims = [null, null];
  function animateScore(i, to) {
    const el = $('team-' + i).querySelector('.t-score');
    const from = shown[i];
    if (from === to) {
      el.textContent = to;
      return;
    }
    cancelAnimationFrame(scoreAnims[i]);
    const start = performance.now();
    const dur = Math.min(1400, 300 + Math.abs(to - from) * 8);
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (to - from) * eased);
      el.textContent = v;
      shown[i] = v;
      if (p < 1) scoreAnims[i] = requestAnimationFrame(step);
      else shown[i] = to;
    };
    scoreAnims[i] = requestAnimationFrame(step);
  }

  // --------------------------------------------------------------- effects
  let strikeTimer = null;
  function showStrikes(count) {
    const o = $('strikes');
    o.innerHTML = Array.from({ length: count }, () => '<span class="big-x">✕</span>').join('');
    o.hidden = false;
    clearTimeout(strikeTimer);
    strikeTimer = setTimeout(() => (o.hidden = true), 1500);
  }

  let bannerTimer = null;
  function banner(html, color) {
    const b = $('banner');
    b.innerHTML = html;
    b.style.setProperty('--c', color || 'var(--gold)');
    b.hidden = false;
    b.classList.remove('go');
    void b.offsetWidth;
    b.classList.add('go');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => (b.hidden = true), 2600);
  }

  function confetti(colors) {
    const c = $('confetti');
    c.innerHTML = '';
    for (let i = 0; i < 120; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 1.8 + 's';
      p.style.animationDuration = 2.4 + Math.random() * 2 + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      c.appendChild(p);
    }
    setTimeout(() => (c.innerHTML = ''), 7000);
  }

  function playFx(fx) {
    const s = state;
    switch (fx.kind) {
      case 'reveal': {
        FC.Sound.reveal();
        const t = document.querySelector(`.tile[data-i="${fx.index}"]`);
        if (t) {
          t.classList.remove('flash');
          void t.offsetWidth;
          t.classList.add('flash');
        }
        break;
      }
      case 'revealAll':
        FC.Sound.soft();
        break;
      case 'strike':
        FC.Sound.strike();
        showStrikes(fx.count || 1);
        break;
      case 'award': {
        const t = s.teams[fx.team];
        FC.Sound.award();
        if (t) banner(`<b>+${fx.amount}</b> ${esc(t.name)}`, t.color);
        break;
      }
      case 'round':
        FC.Sound.round();
        break;
      case 'timeup':
        FC.Sound.timeUp();
        if (fx.strike) showStrikes(fx.count || 1);
        else banner("⏱ Time's up!", '#ff4d6a');
        break;
      case 'over':
        FC.Sound.fanfare();
        confetti(s.teams.map((t) => t.color).concat(['#ffc94a', '#ffffff']));
        break;
    }
  }

  // ---------------------------------------------------- sound, fullscreen, cursor
  const pill = $('sound-pill');
  const unlock = () => {
    FC.Sound.unlock();
    setTimeout(() => (pill.hidden = FC.Sound.ready()), 150);
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
  setTimeout(() => {
    FC.Sound.unlock();
    setTimeout(() => (pill.hidden = FC.Sound.ready() || !!receiver), 300);
  }, 800);

  document.addEventListener('dblclick', toggleFullscreen);
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'f' || e.key === 'F') && !e.target.closest('input')) toggleFullscreen();
  });
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  }

  let idleTimer = null;
  document.addEventListener('mousemove', () => {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('idle'), 2500);
  });
})();
