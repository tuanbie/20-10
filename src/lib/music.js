// Nhạc hộp nhạc tự tổng hợp bằng Web Audio, không cần file mp3.
let ac = null;
let master = null;
let on = false;
let timer = null;
let step = 0;
let next = 0;

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MEL = [76, 79, 84, 83, 81, 79, 76, 79, 77, 81, 86, 84, 83, 79, 74, 0,
             76, 79, 84, 86, 88, 86, 84, 81, 77, 81, 84, 86, 83, 86, 84, 0];
const BASS = [48, 45, 41, 43, 48, 45, 41, 43];
const BEAT = 0.32;

function init() {
  if (ac) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ac = new AC();
  master = ac.createGain();
  master.gain.value = 0.55;
  const delay = ac.createDelay(1);
  delay.delayTime.value = 0.27;
  const feedback = ac.createGain();
  feedback.gain.value = 0.28;
  const wet = ac.createGain();
  wet.gain.value = 0.22;
  master.connect(ac.destination);
  master.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(ac.destination);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) ac.suspend();
    else if (on) ac.resume();
  });
  return true;
}

function pluck(m, t, vol = 0.1, dur = 1.6) {
  const g = ac.createGain();
  g.connect(master);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  for (const [mul, amp] of [[1, 1], [2.003, 0.22], [3.99, 0.06]]) {
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.type = "sine";
    o.frequency.value = hz(m) * mul;
    og.gain.value = amp;
    o.connect(og);
    og.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

function schedule() {
  while (next < ac.currentTime + 0.25) {
    const n = MEL[step % MEL.length];
    if (n) pluck(n, next, 0.09);
    if (step % 4 === 0) pluck(BASS[(step / 4) % BASS.length], next, 0.06, 2.4);
    next += BEAT;
    step++;
  }
}

export const Music = {
  get on() {
    return on;
  },
  start() {
    if (!init()) return false;
    if (ac.state === "suspended") ac.resume();
    if (on) return true;
    on = true;
    step = 0;
    next = ac.currentTime + 0.08;
    schedule();
    timer = setInterval(schedule, 60);
    return true;
  },
  stop() {
    on = false;
    clearInterval(timer);
    timer = null;
  },
  ding(m = 84) {
    if (on && ac) pluck(m, ac.currentTime + 0.01, 0.12, 1.2);
  },
  chord(notes) {
    if (on && ac) notes.forEach((m, i) => pluck(m, ac.currentTime + 0.02 + i * 0.09, 0.11, 2));
  },
};
