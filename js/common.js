/* Family Clash — shared helpers, data model and sample content. */
(function () {
  'use strict';
  const FC = (window.FC = window.FC || {});

  FC.MAX_ANSWERS = 8;

  FC.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  FC.clone = (o) => JSON.parse(JSON.stringify(o));

  FC.load = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  };
  FC.save = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage full or blocked — the game still works in memory */
    }
  };

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  FC.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

  FC.TEAM_COLORS = ['#ff6b6b', '#2ec4b6', '#ffbf3f', '#9b5de5', '#4cc9f0', '#80ed99', '#f15bb5', '#ff9f1c'];

  FC.defaultTeams = () => [
    { name: "Mom's Side", color: FC.TEAM_COLORS[0] },
    { name: "Dad's Side", color: FC.TEAM_COLORS[1] },
  ];

  // Short, unambiguous code used to pair a board with a host over the LAN server.
  FC.roomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };

  FC.multLabel = (m) => (m === 3 ? 'Triple points' : m === 2 ? 'Double points' : 'Normal points');

  FC.newRound = (multiplier) => ({
    question: '',
    multiplier: multiplier || 1,
    answers: [0, 1, 2, 3].map(() => ({ text: '', points: '' })),
  });

  FC.newGame = () => ({ id: FC.uid(), title: '', updated: Date.now(), rounds: [FC.newRound()] });

  // Clean a game (possibly imported / hand-edited) into the canonical shape.
  FC.normalizeGame = (g) => {
    g = g && typeof g === 'object' ? g : {};
    const rounds = Array.isArray(g.rounds) ? g.rounds : [];
    return {
      id: typeof g.id === 'string' && g.id ? g.id : FC.uid(),
      title: String(g.title || ''),
      updated: Number(g.updated) || Date.now(),
      rounds: rounds.map((r) => ({
        question: String((r && r.question) || ''),
        multiplier: [1, 2, 3].includes(Number(r && r.multiplier)) ? Number(r.multiplier) : 1,
        answers: (Array.isArray(r && r.answers) ? r.answers : []).slice(0, FC.MAX_ANSWERS).map((a) => ({
          text: String((a && a.text) || ''),
          points: a && a.points !== '' && a.points != null ? Math.max(0, Math.round(Number(a.points)) || 0) : '',
        })),
      })),
    };
  };

  // The rounds that can actually be played: blank answers dropped, highest points first.
  FC.playableRounds = (g) =>
    (g.rounds || [])
      .map((r) => ({
        question: String(r.question || '').trim(),
        multiplier: [1, 2, 3].includes(Number(r.multiplier)) ? Number(r.multiplier) : 1,
        answers: (r.answers || [])
          .filter((a) => String(a.text || '').trim())
          .map((a) => ({ text: String(a.text).trim(), points: Math.max(0, Math.round(Number(a.points)) || 0) }))
          .sort((a, b) => b.points - a.points)
          .slice(0, FC.MAX_ANSWERS),
      }))
      .filter((r) => r.answers.length);

  // "Pizza 32", "Pizza, 32", "2. Pizza - 32", "Pizza\t32" -> { text: 'Pizza', points: 32 }
  FC.parseAnswerLines = (text) =>
    String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        line = line.replace(/^\d{1,2}\s*[.)]\s+/, '');
        const m = line.match(/^(.*?)[\s,;:|\-–—=]*?(\d{1,3})\s*(?:pts?|points?)?\s*$/i);
        if (m && m[1].trim()) return { text: m[1].replace(/[\s,;:|\-–—=]+$/, '').trim(), points: Number(m[2]) };
        return { text: line, points: '' };
      })
      .slice(0, FC.MAX_ANSWERS);

  FC.sampleGame = () =>
    FC.normalizeGame({
      id: 'sample-' + FC.uid(),
      title: 'Sample game — Family Night',
      rounds: [
        {
          question: 'Name something people do right after waking up',
          multiplier: 1,
          answers: [
            { text: 'Check their phone', points: 34 },
            { text: 'Use the bathroom', points: 22 },
            { text: 'Brush teeth', points: 14 },
            { text: 'Make coffee', points: 12 },
            { text: 'Shower', points: 8 },
            { text: 'Stretch', points: 5 },
            { text: 'Hit snooze', points: 3 },
          ],
        },
        {
          question: "Name a food that's messy to eat",
          multiplier: 1,
          answers: [
            { text: 'Ribs', points: 30 },
            { text: 'Spaghetti', points: 24 },
            { text: 'Tacos', points: 16 },
            { text: 'Chicken wings', points: 11 },
            { text: 'Corn on the cob', points: 7 },
            { text: 'Ice cream cone', points: 6 },
          ],
        },
        {
          question: 'Name something you bring to a picnic',
          multiplier: 1,
          answers: [
            { text: 'Blanket', points: 36 },
            { text: 'Sandwiches', points: 21 },
            { text: 'Cooler', points: 15 },
            { text: 'Basket', points: 10 },
            { text: 'Sunscreen', points: 7 },
            { text: 'Frisbee', points: 5 },
            { text: 'Bug spray', points: 4 },
          ],
        },
        {
          question: 'Name a reason a family road trip gets delayed',
          multiplier: 2,
          answers: [
            { text: 'Bathroom stop', points: 38 },
            { text: 'Traffic', points: 22 },
            { text: 'Forgot something', points: 15 },
            { text: 'Flat tire', points: 10 },
            { text: 'Got lost', points: 8 },
            { text: 'Car sickness', points: 5 },
          ],
        },
        {
          question: 'Name something grandparents always say',
          multiplier: 3,
          answers: [
            { text: 'Back in my day…', points: 40 },
            { text: "You've grown so much!", points: 25 },
            { text: 'Are you eating enough?', points: 15 },
            { text: 'Put a sweater on', points: 10 },
            { text: 'When are you getting married?', points: 6 },
          ],
        },
      ],
    });
})();
