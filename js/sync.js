/*
 * Family Clash — host <-> board messaging.
 *
 * Every message goes out over every transport that is available, and the
 * receiver de-duplicates by message id, so the two screens stay in sync no
 * matter how they're connected:
 *
 *   local  – BroadcastChannel + localStorage events: two windows/tabs in the
 *            same browser (e.g. netbook: controls in one tab, board tab cast
 *            to the TV).
 *   cast   – Presentation API connection: Chrome renders the board and casts
 *            it straight to a Google TV / Chromecast.
 *   net    – the optional zero-dependency LAN server (server.js): tablet as
 *            the remote, any other browser as the board. Paired by room code.
 */
(function () {
  'use strict';
  const FC = window.FC;

  FC.Sync = function (role, room) {
    const other = role === 'host' ? 'board' : 'host';
    const handlers = [];
    const conns = new Set();
    const seen = [];
    let bc = null;
    let es = null;
    let netOk = false;

    const api = {
      room: room || null,
      onConnect: null,
      on(fn) {
        handlers.push(fn);
      },
      send(msg) {
        const full = Object.assign({ from: role, room: api.room, mid: FC.uid() }, msg);
        remember(full.mid);
        const json = JSON.stringify(full);
        if (bc) {
          try {
            bc.postMessage(full);
          } catch (e) {}
        }
        try {
          localStorage.setItem('fc.msg.' + role, json);
        } catch (e) {}
        conns.forEach((c) => {
          try {
            if (c.state === 'connected') c.send(json);
          } catch (e) {}
        });
        if (netOk && api.room) {
          fetch('api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: api.room, to: other, msg: full }),
          }).catch(() => {});
        }
      },
      setRoom(code) {
        api.room = code || null;
        connectNet();
      },
      addConnection(c) {
        if (conns.has(c)) return;
        conns.add(c);
        c.addEventListener('message', (e) => {
          try {
            emit(JSON.parse(e.data), 'cast');
          } catch (err) {}
        });
        const drop = () => conns.delete(c);
        c.addEventListener('close', drop);
        c.addEventListener('terminate', drop);
        const opened = () => api.onConnect && api.onConnect('cast');
        if (c.state === 'connected') setTimeout(opened, 0);
        else c.addEventListener('connect', opened);
      },
      hasCast: () => [...conns].some((c) => c.state === 'connected'),
      // Resolves to true when the LAN server (server.js) is serving this page.
      netAvailable: null,
    };

    function remember(mid) {
      seen.push(mid);
      if (seen.length > 300) seen.shift();
    }

    function emit(msg, via) {
      if (!msg || typeof msg !== 'object' || msg.from === role) return;
      if (msg.mid) {
        if (seen.includes(msg.mid)) return;
        remember(msg.mid);
      }
      handlers.forEach((h) => h(msg, via));
    }

    // --- local transports -------------------------------------------------
    try {
      bc = new BroadcastChannel('familyclash');
      bc.onmessage = (e) => emit(e.data, 'local');
    } catch (e) {
      bc = null;
    }
    window.addEventListener('storage', (e) => {
      if (e.key !== 'fc.msg.' + other || !e.newValue) return;
      try {
        emit(JSON.parse(e.newValue), 'local');
      } catch (err) {}
    });

    // --- LAN server transport ----------------------------------------------
    api.netAvailable = (async () => {
      if (!/^https?:$/.test(location.protocol)) return false;
      try {
        const r = await fetch('api/ping', { cache: 'no-store' });
        if (!r.ok) return false;
        const j = await r.json();
        netOk = !!(j && j.app === 'familyclash');
      } catch (e) {
        netOk = false;
      }
      return netOk;
    })();

    async function connectNet() {
      await api.netAvailable;
      if (es) {
        es.close();
        es = null;
      }
      if (!netOk || !api.room) return;
      es = new EventSource('api/events?room=' + encodeURIComponent(api.room) + '&role=' + role);
      es.onmessage = (e) => {
        try {
          emit(JSON.parse(e.data), 'net');
        } catch (err) {}
      };
      es.onopen = () => api.onConnect && api.onConnect('net');
    }
    connectNet();

    return api;
  };
})();
