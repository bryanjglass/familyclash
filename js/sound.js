/* Family Clash — tiny synthesized sound effects (no audio files needed). */
(function () {
  'use strict';
  const S = (window.FC.Sound = {});
  let ctx = null;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    return ctx;
  }

  S.unlock = () => {
    const c = ac();
    if (c && c.state !== 'running') c.resume().catch(() => {});
  };
  S.ready = () => !!ac() && ctx.state === 'running';

  function tone(freq, start, dur, opts) {
    const o = Object.assign({ type: 'sine', gain: 0.25, slideTo: null }, opts);
    const c = ac();
    if (!c || c.state !== 'running') return;
    const t0 = c.currentTime + start;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  S.reveal = () => {
    tone(987.8, 0, 0.45, { gain: 0.3 });
    tone(1318.5, 0.1, 0.8, { gain: 0.3 });
    tone(2637, 0.1, 0.5, { gain: 0.05 });
  };
  S.soft = () => tone(880, 0, 0.3, { gain: 0.12 });
  S.strike = () => {
    tone(130, 0, 0.75, { type: 'sawtooth', gain: 0.22 });
    tone(138, 0, 0.75, { type: 'square', gain: 0.1 });
  };
  S.award = () =>
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.45, { type: 'triangle', gain: 0.25 }));
  S.round = () => {
    tone(392, 0, 0.25, { type: 'triangle', gain: 0.2 });
    tone(587.3, 0.13, 0.45, { type: 'triangle', gain: 0.2 });
  };
  S.fanfare = () =>
    [523.3, 659.3, 784, 659.3, 784, 1046.5].forEach((f, i) =>
      tone(f, i * 0.14, i === 5 ? 1.2 : 0.3, { type: 'triangle', gain: 0.25 })
    );
})();
