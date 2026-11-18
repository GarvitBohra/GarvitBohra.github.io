const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

// Run a handler at most once per animation frame; cancel() drops a queued run
const perFrame = (fn) => {
  let id = 0, arg;
  const run = (e) => {
    arg = e;
    if (id) return;
    id = requestAnimationFrame(() => { id = 0; fn(arg); });
  };
  run.cancel = () => { cancelAnimationFrame(id); id = 0; };
  return run;
};

// Scroll progress (read once per frame so late layout shifts are picked up)
const bar = document.querySelector('.scroll-progress');
const root = document.documentElement;
const updateProgress = perFrame(() => {
  const max = Math.max(root.scrollHeight - root.clientHeight, 1);
  bar.style.transform = `scaleX(${Math.min(root.scrollTop / max, 1)})`;
});
addEventListener('scroll', updateProgress, { passive: true });
addEventListener('resize', updateProgress);

// Light / dark toggle (initial theme is set by an inline script in <head>)
const themeBtn = document.querySelector('.theme-toggle');
if (themeBtn) {
  const sync = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };
  sync();
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    sync();
  });
}

// Pause the cloud animation while the hero is off-screen
const hero = document.querySelector('.hero');
if (hero) {
  new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('hero-offscreen', !entry.isIntersecting);
  }).observe(hero);
}

// Seamless marquee: duplicate the items once, then start the loop
const track = document.querySelector('.marquee-track');
if (track) {
  track.append(...[...track.children].map((n) => n.cloneNode(true)));
  if (!reduceMotion) track.classList.add('is-running');
}

// Rotating role text (static text stays for no-JS / reduced motion)
const roleEl = document.getElementById('role-text');
const roles = ['AI/ML Engineer', 'Data Scientist', 'GenAI & RAG Builder', 'Hackathon Runner-Up'];
if (roleEl && !reduceMotion) {
  let r = 0, c = 0, del = false;
  (function tick() {
    if (document.hidden) return void setTimeout(tick, 1000);
    const word = roles[r];
    c += del ? -1 : 1;
    roleEl.textContent = word.slice(0, c);
    let t = del ? 35 : 70;
    if (!del && c === word.length) { del = true; t = 1400; }
    else if (del && c === 0) { del = false; r = (r + 1) % roles.length; t = 300; }
    setTimeout(tick, t);
  })();
}

// Card tilt via CSS variables (composes with the reveal transform)
if (matchMedia('(hover: hover)').matches && !reduceMotion) {
  document.querySelectorAll('.project').forEach((card) => {
    let box = null;
    const refresh = () => { box = null; };
    const move = perFrame((e) => {
      box ||= card.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width - .5;
      const y = (e.clientY - box.top) / box.height - .5;
      card.style.setProperty('--ry', `${x * 6}deg`);
      card.style.setProperty('--rx', `${-y * 6}deg`);
    });
    card.addEventListener('pointerenter', () => {
      refresh();
      addEventListener('scroll', refresh, { passive: true });
    });
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', () => {
      move.cancel();
      removeEventListener('scroll', refresh);
      card.style.removeProperty('--ry');
      card.style.removeProperty('--rx');
    });
  });
}
