/* ============================================================
   gamify.js — طبقة اللعب: XP، المستويات، الأوسمة، السلسلة،
   الاحتفالات، والأصوات. تعتمد على Progress وRender فقط.
   ============================================================ */
window.Gamify = (function () {
  'use strict';

  const KEY = 'pdx-game-v1';
  const LESSONS = window.PDX.lessons;
  const QUIZZES = window.PDX.quizzes;
  const EXAM = window.PDX.exam;
  const EX = window.PDX.exercises;
  const ICON = window.Render.ICONS;
  const esc = window.Render.esc;

  const XP = { read: 25, quiz: 4, exercise: 40, exam: 5, daily: 10 };
  const LEVELS = [
    { n: 1, at: 0, title: 'مبتدئ البيانات', icon: '🌱' },
    { n: 2, at: 120, title: 'مستكشف', icon: '🧭' },
    { n: 3, at: 300, title: 'محلل صاعد', icon: '📊' },
    { n: 4, at: 540, title: 'مهندس بيانات', icon: '🛠️' },
    { n: 5, at: 820, title: 'خبير pandas', icon: '🐼' },
    { n: 6, at: 1100, title: 'أسطورة البيانات', icon: '👑' }
  ];

  const BADGES = [
    { id: 'first-step', name: 'أول خطوة', icon: '🚀', desc: 'أكملت أول موضوع في المسار', test: function (s) { return s.done >= 1; } },
    { id: 'first-code', name: 'أول كود', icon: '💻', desc: 'أنجزت أول تمرين برمجي', test: function (s) { return s.exercises >= 1; } },
    { id: 'five-lessons', name: 'نصف الخريطة', icon: '🧭', desc: 'أكملت خمسة مواضيع', test: function (s) { return s.done >= 5; } },
    { id: 'all-lessons', name: 'فاتح الخريطة', icon: '🗺️', desc: 'أكملت كل مواضيع المسار', test: function (s) { return s.done >= s.lessonTotal; } },
    { id: 'quiz-ace', name: 'علامة كاملة', icon: '💯', desc: 'حصلت على 100% في اختبار موضوع', test: function (s) { return s.perfectQuizzes >= 1; } },
    { id: 'perfect-five', name: 'خمس إتقانات', icon: '🌟', desc: 'حصلت على 100% في خمسة اختبارات', test: function (s) { return s.perfectQuizzes >= 5; } },
    { id: 'code-master', name: 'محترف الكود', icon: '🛠️', desc: 'أنجزت كل التمارين البرمجية', test: function (s) { return s.exercises >= s.exerciseTotal; } },
    { id: 'exam-pass', name: 'الاختبار الشامل', icon: '🏅', desc: 'اجتزت الاختبار الشامل بنسبة 60% أو أكثر', test: function (s) { return s.examBest >= Math.ceil(s.examTotal * 0.6); } },
    { id: 'exam-perfect', name: 'الإتقان', icon: '👑', desc: 'أجبت على كل أسئلة الاختبار الشامل', test: function (s) { return s.examBest === s.examTotal && s.examTotal > 0; } },
    { id: 'streak-3', name: 'مثابر', icon: '🔥', desc: 'تعلّمت ثلاثة أيام متتالية', test: function (s) { return s.streak >= 3; } },
    { id: 'star-20', name: 'جامع النجوم', icon: '⭐', desc: 'جمعت عشرين نجمة', test: function (s) { return s.stars >= 20; } },
    { id: 'all-stars', name: 'سماء كاملة', icon: '🌌', desc: 'جمعت كل نجوم المسار', test: function (s) { return s.stars >= s.lessonTotal * 3; } }
  ];

  let state = load();
  let lastXP = null;
  let audioCtx = null;
  let celebrateLock = 0;

  /* ---------------------------------------------------------- storage */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const p = raw ? JSON.parse(raw) : {};
      return {
        days: p.days || {},
        sound: p.sound !== false,
        seenBadges: Array.isArray(p.seenBadges) ? p.seenBadges : null,
        seenLevel: typeof p.seenLevel === 'number' ? p.seenLevel : null,
        bonusXP: p.bonusXP || 0,
        daily: p.daily || null
      };
    } catch (e) {
      return { days: {}, sound: true, seenBadges: null, seenLevel: null, bonusXP: 0, daily: null };
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ---------------------------------------------------------- dates */
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function currentStreak(days) {
    const d = new Date();
    let key = dayKey(d);
    if (!days[key]) {
      d.setDate(d.getDate() - 1);
      key = dayKey(d);
      if (!days[key]) return 0;
    }
    let n = 0;
    while (days[key]) {
      n += 1;
      d.setDate(d.getDate() - 1);
      key = dayKey(d);
    }
    return n;
  }

  function touch() {
    const k = dayKey();
    if (!state.days[k]) {
      state.days[k] = true;
      save();
    }
  }

  /* ---------------------------------------------------------- scoring */
  function starsForScore(score, total) {
    if (!total) return 0;
    const pct = (score / total) * 100;
    if (pct >= 100) return 3;
    if (pct >= 80) return 2;
    if (pct >= 60) return 1;
    return 0;
  }

  function starsFor(id, p) {
    p = p || Progress.state();
    const q = p.quiz[id];
    if (q && q.total) return starsForScore(q.best, q.total);
    if (p.read[id]) return 1;
    return 0;
  }

  function starsHTML(n, extraClass) {
    let out = '<span class="stars ' + (extraClass || '') + '" aria-label="' + n + ' من 3 نجوم">';
    for (let i = 0; i < 3; i++) {
      out += '<span class="star ' + (i < n ? 'on' : 'off') + '" aria-hidden="true">★</span>';
    }
    return out + '</span>';
  }

  function derivedXP(p) {
    let xp = 0;
    LESSONS.forEach(function (l) {
      if (p.read[l.id]) xp += XP.read;
    });
    Object.keys(p.quiz || {}).forEach(function (id) {
      const q = p.quiz[id];
      if (q && q.total) xp += Math.min(q.best || 0, q.total) * XP.quiz;
    });
    Object.keys(p.exercises || {}).forEach(function (id) {
      if (p.exercises[id] && EX.byId[id]) xp += XP.exercise;
    });
    const examTotal = p.exam.total || EXAM.length;
    xp += Math.min(p.exam.best || 0, examTotal) * XP.exam;
    xp += state.bonusXP || 0;
    return xp;
  }

  function summary() {
    const p = Progress.state();
    const done = LESSONS.filter(function (l) { return Progress.isLessonDone(l.id); }).length;
    const quizIds = Object.keys(p.quiz || {});
    const perfectQuizzes = quizIds.filter(function (id) {
      const q = p.quiz[id];
      return q && q.total && q.best === q.total;
    }).length;
    const exercises = Object.keys(p.exercises || {}).filter(function (id) { return p.exercises[id]; }).length;
    const examBest = p.exam.best || 0;
    const examTotal = p.exam.total || EXAM.length;
    const streak = currentStreak(state.days);
    const stars = LESSONS.reduce(function (a, l) { return a + starsFor(l.id, p); }, 0);
    const xp = derivedXP(p);
    let li = 0;
    for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].at) li = i;
    const level = LEVELS[li];
    const next = LEVELS[li + 1] || null;
    const pct = next ? Math.max(0, Math.min(100, Math.round(((xp - level.at) / (next.at - level.at)) * 100))) : 100;
    const context = {
      done: done, lessonTotal: LESSONS.length, perfectQuizzes: perfectQuizzes,
      exercises: exercises, exerciseTotal: EX.list.length, examBest: examBest,
      examTotal: examTotal, streak: streak, stars: stars
    };
    const badges = BADGES.map(function (b) {
      return { id: b.id, name: b.name, icon: b.icon, desc: b.desc, earned: !!b.test(context) };
    });
    const nextLesson = LESSONS.find(function (l) { return !Progress.isLessonDone(l.id); }) || LESSONS[0];
    return {
      xp: xp, level: level, next: next, pct: pct, streak: streak, stars: stars,
      done: done, lessonTotal: LESSONS.length, exercises: exercises, exerciseTotal: EX.list.length,
      perfectQuizzes: perfectQuizzes, examBest: examBest, examTotal: examTotal,
      badges: badges, earnedBadges: badges.filter(function (b) { return b.earned; }).length,
      nextLesson: nextLesson, activeToday: !!state.days[dayKey()], sound: state.sound
    };
  }

  /* ---------------------------------------------------------- HUD */
  function soundIcon(on) {
    return on
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><line x1="16" y1="9" x2="21" y2="15"/><line x1="21" y1="9" x2="16" y2="15"/></svg>';
  }

  function updateHUD() {
    const s = summary();
    const set = function (id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set('hudLevel', s.level.n);
    set('hudTitle', s.level.title);
    set('hudXp', s.next ? s.xp + ' / ' + s.next.at + ' XP' : s.xp + ' XP');
    set('streakCount', s.streak);
    const fill = document.getElementById('hudXpFill');
    if (fill) fill.style.width = s.pct + '%';
    const ring = document.getElementById('hudRing');
    if (ring) ring.style.setProperty('--p', s.pct + '%');
    const hud = document.getElementById('hudBtn');
    if (hud) hud.title = 'المستوى ' + s.level.n + ' — ' + s.level.title + ' · ' + s.xp + ' XP' + (s.next ? ' · التالي عند ' + s.next.at : '');
    const streak = document.getElementById('streakChip');
    if (streak) {
      streak.title = s.activeToday ? 'سلسلة ' + s.streak + ' يوم — نشط اليوم' : 'سلسلة ' + s.streak + ' يوم — ابدأ اليوم';
      streak.classList.toggle('is-cold', !s.activeToday);
    }
    const sound = document.getElementById('soundBtn');
    if (sound) {
      sound.innerHTML = soundIcon(state.sound);
      sound.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
      sound.setAttribute('aria-label', state.sound ? 'إيقاف الأصوات' : 'تشغيل الأصوات');
      sound.classList.toggle('is-off', !state.sound);
    }
    renderHeroPlayer(s);
    const modalSound = document.getElementById('modalSoundBtn');
    if (modalSound) {
      modalSound.className = 'switch' + (state.sound ? ' on' : '');
      modalSound.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
      modalSound.innerHTML = '<i></i><span>' + (state.sound ? 'مفعّلة' : 'مطفأة') + '</span>';
    }
  }

  function renderHeroPlayer(s) {
    const root = document.getElementById('heroPlayer');
    if (!root) return;
    const next = s.next;
    const allDone = s.done >= s.lessonTotal;
    root.innerHTML =
      '<div class="hp-avatar" style="--p:' + s.pct + '%">' +
        '<span class="hp-avatar-in"><b>' + s.level.n + '</b><small>LV</small></span>' +
      '</div>' +
      '<div class="hp-body">' +
        '<div class="hp-head"><strong>' + esc(s.level.title) + '</strong><span>ملف اللاعب</span></div>' +
        '<div class="hp-bar"><i style="width:' + s.pct + '%"></i></div>' +
        '<div class="hp-foot">' +
          '<span class="hp-xp">' + (next ? s.xp + ' / ' + next.at + ' XP' : s.xp + ' XP') + '</span>' +
          '<span title="سلسلة الأيام">🔥 <b>' + s.streak + '</b></span>' +
          '<span title="الأوسمة">🏆 <b>' + s.earnedBadges + '</b></span>' +
          '<span title="النجوم">⭐ <b>' + s.stars + '</b></span>' +
          '<span title="المهام المكتملة">✓ <b>' + s.done + '</b>/' + s.lessonTotal + '</span>' +
        '</div>' +
      '</div>' +
      '<a class="hp-next" href="#/lesson/' + s.nextLesson.id + '">' +
        '<span>' + (allDone ? 'أعد المسار' : 'المهمة التالية') + '</span>' +
        '<strong>' + esc(s.nextLesson.short) + '</strong>' + ICON.arrow +
      '</a>';
  }

  /* ---------------------------------------------------------- XP pop */
  function xpPop(delta) {
    if (delta <= 0) return;
    const el = document.createElement('div');
    el.className = 'xp-pop';
    el.textContent = '+' + delta + ' XP';
    const hud = document.getElementById('hudBtn');
    const r = hud ? hud.getBoundingClientRect() : null;
    el.style.visibility = 'hidden';
    document.body.appendChild(el);
    const w = el.offsetWidth;
    el.style.left = r
      ? Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px'
      : 'auto';
    el.style.right = r ? 'auto' : '18px';
    el.style.top = r ? r.bottom + 8 + 'px' : '84px';
    el.style.visibility = '';
    setTimeout(function () { el.remove(); }, 1250);
  }

  /* ---------------------------------------------------------- sounds */
  function ctx() {
    if (!state.sound) return null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }

  function beep(freq, start, dur, type, vol) {
    const c = ctx();
    if (!c) return;
    const t = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol || 0.035, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function sfx(kind) {
    if (!state.sound) return;
    if (kind === 'click') beep(520, 0, 0.05, 'triangle', 0.02);
    else if (kind === 'correct') { beep(660, 0, 0.09, 'sine', 0.035); beep(880, 0.08, 0.13, 'sine', 0.03); }
    else if (kind === 'wrong') { beep(200, 0, 0.16, 'sawtooth', 0.022); beep(160, 0.1, 0.18, 'sawtooth', 0.018); }
    else if (kind === 'win') { beep(523, 0, 0.1, 'sine', 0.03); beep(659, 0.09, 0.1, 'sine', 0.03); beep(784, 0.18, 0.18, 'sine', 0.03); }
    else if (kind === 'level') { beep(523, 0, 0.1, 'triangle', 0.04); beep(659, 0.1, 0.1, 'triangle', 0.04); beep(784, 0.2, 0.1, 'triangle', 0.04); beep(1046, 0.3, 0.28, 'triangle', 0.04); }
  }

  function toggleSound() {
    state.sound = !state.sound;
    save();
    updateHUD();
    if (state.sound) sfx('correct');
  }

  /* ---------------------------------------------------------- confetti */
  function confetti(opts) {
    opts = opts || {};
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const count = opts.count || 90;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const c = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#5b4bff', '#ffc531', '#0fa37f', '#ff5a5f', '#4cc9f0', '#ff8fb1', '#fffdf8'];
    const originX = opts.x != null ? opts.x : W / 2;
    const originY = opts.y != null ? opts.y : H * 0.34;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 8;
      parts.push({
        x: originX, y: originY,
        vx: Math.cos(angle) * speed * (0.7 + Math.random()),
        vy: Math.sin(angle) * speed - 4 - Math.random() * 5,
        w: 4 + Math.random() * 7,
        h: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        color: colors[i % colors.length],
        round: Math.random() < 0.35
      });
    }
    const start = performance.now();
    function frame(t) {
      const dt = 1;
      c.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.vy += 0.16 * dt;
        p.vx *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = p.color;
        if (p.round) {
          c.beginPath();
          c.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          c.fill();
        } else {
          c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        c.restore();
      });
      if (t - start < 1900) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  function celebrate(kind) {
    const now = Date.now();
    if (now - celebrateLock < 500) return;
    celebrateLock = now;
    if (kind === 'done') { confetti({ count: 70 }); sfx('win'); }
    else if (kind === 'exercise') { confetti({ count: 110, y: window.innerHeight * 0.45 }); sfx('win'); }
    else if (kind === 'exam') { confetti({ count: 190, y: window.innerHeight * 0.3 }); sfx('win'); }
    else if (kind === 'perfect') { confetti({ count: 150 }); sfx('win'); }
  }

  /* ---------------------------------------------------------- modals */
  function modalHTML() {
    return '' +
      '<div class="game-modal" id="badgesModal" hidden>' +
        '<div class="gm-backdrop" data-close-modal></div>' +
        '<div class="gm-card badges-card" role="dialog" aria-modal="true" aria-labelledby="badgesTitle">' +
          '<div id="badgesBody"></div>' +
        '</div>' +
      '</div>' +
      '<div class="game-modal level-modal" id="levelUpModal" hidden>' +
        '<div class="gm-backdrop" data-close-modal></div>' +
        '<div class="gm-card level-card" role="dialog" aria-modal="true" aria-labelledby="levelUpTitle">' +
          '<button class="gm-close" type="button" data-close-modal aria-label="إغلاق">✕</button>' +
          '<div class="level-rays" aria-hidden="true"></div>' +
          '<div class="level-icon" id="levelUpIcon">🌱</div>' +
          '<span class="gm-kicker">ارتقاء في المستوى</span>' +
          '<h2 id="levelUpTitle">المستوى 2</h2>' +
          '<p class="level-name" id="levelUpName">مستكشف</p>' +
          '<p class="level-note">كل مهمة تمنحك XP. واصل الجمع لتفتح الرتبة التالية.</p>' +
          '<button class="btn btn-primary" type="button" data-close-modal>واصل المهمة</button>' +
        '</div>' +
      '</div>' +
      '<div class="badge-pops" id="badgePops" aria-live="polite"></div>';
  }

  function injectModals() {
    if (document.getElementById('badgesModal')) return;
    const div = document.createElement('div');
    div.id = 'gameModalRoot';
    div.innerHTML = modalHTML();
    document.body.appendChild(div);
    document.addEventListener('click', function (e) {
      if (e.target.closest('#hudBtn')) { openBadges(); return; }
      if (e.target.closest('#soundBtn')) { toggleSound(); return; }
      if (e.target.closest('#modalSoundBtn')) { toggleSound(); return; }
      if (e.target.closest('[data-close-modal]')) closeModals();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModals();
    });
  }

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    document.body.classList.add('no-scroll');
    const focusable = m.querySelector('[data-close-modal], button');
    if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 30);
  }

  function closeModals() {
    document.querySelectorAll('.game-modal').forEach(function (m) { m.hidden = true; });
    document.body.classList.remove('no-scroll');
  }

  function badgeCardHTML(b) {
    return '<div class="badge-card ' + (b.earned ? 'is-earned' : 'is-locked') + '">' +
      '<span class="badge-ic" aria-hidden="true">' + (b.earned ? b.icon : '🔒') + '</span>' +
      '<strong>' + esc(b.name) + '</strong>' +
      '<span>' + esc(b.desc) + '</span>' +
      '<em>' + (b.earned ? 'مفتوح' : 'مغلق') + '</em>' +
    '</div>';
  }

  function openBadges() {
    const s = summary();
    const body = document.getElementById('badgesBody');
    if (!body) return;
    body.innerHTML =
      '<div class="bm-head">' +
        '<div><span class="gm-kicker">ملف اللاعب</span><h2 id="badgesTitle">خزانة الأوسمة</h2>' +
        '<p>كل مهمة تمنحك XP، وكل إنجاز يضيف وسامًا إلى الخزانة.</p></div>' +
        '<button class="gm-close" type="button" data-close-modal aria-label="إغلاق">✕</button>' +
      '</div>' +
      '<div class="bm-stats">' +
        '<div class="bm-stat bm-stat-level"><span>المستوى</span><strong>' + s.level.n + '</strong><small>' + esc(s.level.title) + '</small></div>' +
        '<div class="bm-stat"><span>XP</span><strong>' + s.xp + '</strong><small>' + (s.next ? 'التالي عند ' + s.next.at : 'أعلى رتبة') + '</small></div>' +
        '<div class="bm-stat"><span>السلسلة</span><strong>' + s.streak + ' 🔥</strong><small>' + (s.activeToday ? 'نشط اليوم' : 'ابدأ اليوم') + '</small></div>' +
        '<div class="bm-stat"><span>النجوم</span><strong>' + s.stars + ' ⭐</strong><small>من ' + (s.lessonTotal * 3) + '</small></div>' +
      '</div>' +
      '<div class="bm-xp"><strong>من أين تأتي XP؟</strong>' +
        '<span>+25 موضوع مكتمل</span><span>+4 لكل إجابة صحيحة</span><span>+40 تمرين</span><span>+5 لكل سؤال شامل</span><span>+10 تحدي اليوم</span>' +
      '</div>' +
      '<div class="badge-grid">' + s.badges.map(badgeCardHTML).join('') + '</div>' +
      '<div class="bm-foot"><span>الأصوات التفاعلية</span>' +
        '<button class="switch' + (state.sound ? ' on' : '') + '" id="modalSoundBtn" type="button" aria-pressed="' + (state.sound ? 'true' : 'false') + '"><i></i><span>' + (state.sound ? 'مفعّلة' : 'مطفأة') + '</span></button>' +
      '</div>';
    openModal('badgesModal');
  }

  function openLevelUp(level) {
    const icon = document.getElementById('levelUpIcon');
    const num = document.getElementById('levelUpTitle');
    const name = document.getElementById('levelUpName');
    if (!icon || !num || !name) return;
    icon.textContent = level.icon;
    num.textContent = 'المستوى ' + level.n;
    name.textContent = level.title;
    openModal('levelUpModal');
    confetti({ count: 170, y: window.innerHeight * 0.32 });
    sfx('level');
  }

  function badgeToast(b) {
    const wrap = document.getElementById('badgePops');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'badge-pop';
    el.innerHTML = '<span class="bp-ic">' + b.icon + '</span><div><small>وسام جديد</small><strong>' + esc(b.name) + '</strong><span>' + esc(b.desc) + '</span></div>';
    wrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () {
      el.classList.remove('in');
      setTimeout(function () { el.remove(); }, 320);
    }, 4300);
  }

  /* ---------------------------------------------------------- daily */
  function pickQuestionId(exclude) {
    const pool = QUIZZES.filter(function (q) { return q.id !== exclude; });
    return pool[Math.floor(Math.random() * pool.length)].id;
  }

  function dailyInfo() {
    const k = dayKey();
    if (!state.daily || state.daily.date !== k) {
      state.daily = { date: k, qid: pickQuestionId(null), done: false, correct: false, pick: null, rewarded: false };
      save();
    }
    return state.daily;
  }

  function dailyQuestion() {
    const info = dailyInfo();
    const base = QUIZZES.find(function (q) { return q.id === info.qid; }) || QUIZZES[0];
    if (!Array.isArray(info.order) || info.orderQid !== base.id || info.order.length !== base.options.length) {
      info.order = base.options.map(function (_, i) { return i; });
      for (let i = info.order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = info.order[i];
        info.order[i] = info.order[j];
        info.order[j] = tmp;
      }
      info.orderQid = base.id;
      save();
    }
    const options = info.order.map(function (i) { return base.options[i]; });
    return Object.assign({}, base, {
      options: options,
      answer: info.order.indexOf(base.answer)
    });
  }

  function renderDaily() {
    const root = document.getElementById('dailyChallenge');
    if (!root) return;
    const info = dailyInfo();
    const q = dailyQuestion();
    const done = info.done;
    let html = '<div class="daily-shell">';
    html += '<div class="daily-head"><span class="daily-kicker">🎯 تحدي اليوم</span>' +
      '<span class="daily-reward">' + (info.rewarded ? 'تدريب حر' : '+' + XP.daily + ' XP') + '</span></div>';
    html += '<div class="daily-main"><p class="daily-q">' + esc(q.q) + '</p>';
    if (q.code) html += '<pre class="daily-code"><code>' + window.Render.highlightPython(q.code) + '</code></pre>';
    html += '<div class="daily-opts" role="group" aria-label="خيارات تحدي اليوم">';
    q.options.forEach(function (opt, i) {
      const cls = done ? (i === q.answer ? 'is-correct' : (i === info.pick ? 'is-wrong' : '')) : '';
      html += '<button type="button" class="daily-opt ' + cls + '" data-daily-opt="' + i + '"' + (done ? ' disabled' : '') + '>' +
        '<span class="daily-letter">' + (i + 1) + '</span><span>' + esc(opt) + '</span></button>';
    });
    html += '</div>';
    if (done) {
      html += '<div class="daily-feedback ' + (info.correct ? 'ok' : 'bad') + '">' +
        '<strong>' + (info.correct ? '✓ إجابة صحيحة' : '✕ ليست الإجابة الصحيحة') + '</strong>' +
        '<span>' + esc(q.explain) + '</span>' +
        (info.correct && !info.rewarded ? '' : '') +
      '</div>';
    }
    html += '<div class="daily-foot"><span class="daily-tag">' + esc(q.tag || 'مراجعة') + '</span>' +
      '<span class="daily-hint">' + (done ? 'عد غدًا لتحدٍّ جديد' : 'اختر إجابة واحدة') + '</span>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-daily-new>' + (done ? 'سؤال آخر' : 'تخطَّ السؤال') + '</button></div></div>';
    html += '</div>';
    root.innerHTML = html;
  }

  function bindDaily() {
    document.addEventListener('click', function (e) {
      const opt = e.target.closest('[data-daily-opt]');
      if (opt) {
        const info = dailyInfo();
        if (info.done) return;
        const q = dailyQuestion();
        const pick = parseInt(opt.getAttribute('data-daily-opt'), 10);
        info.done = true;
        info.correct = pick === q.answer;
        info.pick = pick;
        if (info.correct && !info.rewarded) {
          info.rewarded = true;
          state.bonusXP = (state.bonusXP || 0) + XP.daily;
        }
        save();
        touch();
        renderDaily();
        refresh({});
        if (info.correct) { celebrate('perfect'); } else { sfx('wrong'); }
        return;
      }
      const next = e.target.closest('[data-daily-new]');
      if (next) {
        const info = dailyInfo();
        info.qid = pickQuestionId(info.qid);
        info.done = false;
        info.correct = false;
        info.pick = null;
        save();
        renderDaily();
      }
    });
  }

  /* ---------------------------------------------------------- refresh */
  function refresh(opts) {
    opts = opts || {};
    if (opts.touch) touch();
    const s = summary();
    if (lastXP === null) lastXP = s.xp;
    if (!Array.isArray(state.seenBadges)) {
      state.seenBadges = s.badges.filter(function (b) { return b.earned; }).map(function (b) { return b.id; });
      save();
    }
    if (state.seenLevel === null) state.seenLevel = s.level.n;

    const newBadges = [];
    if (!opts.initial) {
      s.badges.forEach(function (b) {
        if (b.earned && state.seenBadges.indexOf(b.id) === -1) {
          state.seenBadges.push(b.id);
          newBadges.push(b);
        }
      });
      if (newBadges.length) save();
    }

    const leveled = !opts.initial && s.level.n > state.seenLevel;
    if (s.level.n > state.seenLevel) { state.seenLevel = s.level.n; save(); }
    if (s.level.n < state.seenLevel) { state.seenLevel = s.level.n; save(); }

    const delta = opts.initial ? 0 : Math.max(0, s.xp - lastXP);
    lastXP = s.xp;
    updateHUD();

    if (!opts.initial) {
      if (delta > 0) xpPop(delta);
      newBadges.forEach(function (b, i) {
        setTimeout(function () { badgeToast(b); sfx('correct'); }, 420 + i * 620);
      });
      if (leveled) setTimeout(function () { openLevelUp(s.level); }, 700 + newBadges.length * 620);
    }
    return s;
  }

  function refreshHUD() {
    updateHUD();
  }

  /* ---------------------------------------------------------- rewards */
  /* المكافأة تُحسب على التحسّن عن أفضل نتيجة سابقة فقط، لأن XP
     مشتقة من أفضل نتيجة محفوظة. إعادة المحاولة بنفس النتيجة لا تمنح XP. */
  function rewardHTML(score, total, mode, prevBest) {
    const stars = starsForScore(score, total);
    const rate = mode === 'exam' ? XP.exam : XP.quiz;
    const best = Math.max(0, Math.min(prevBest || 0, total));
    const capped = Math.min(score, total);
    const gained = Math.max(0, capped - best) * rate;
    const label = stars === 3 ? 'إتقان كامل' : stars === 2 ? 'فهم قوي' : stars === 1 ? 'أساس جيد' : 'راجع وحاول';
    const xpLabel = gained > 0
      ? (best > 0 ? 'مكافأة التحسّن' : 'مكافأة هذه المحاولة')
      : (best > 0 ? 'أفضل نتيجة محفوظة' : 'لا مكافأة هذه المرة');
    return '<div class="result-rewards">' +
      '<div class="rr-stars">' + starsHTML(stars) + '<span>' + label + '</span></div>' +
      '<div class="rr-xp" title="تُحسب المكافأة على تحسّن أفضل نتيجة فقط"><span>' + xpLabel + '</span><b>' +
        (gained > 0 ? '+' : '') + gained + ' XP</b></div>' +
    '</div>';
  }

  function init() {
    touch();
    injectModals();
    bindDaily();
    refresh({ initial: true });
    renderDaily();
  }

  return {
    init: init,
    refresh: refresh,
    refreshHUD: refreshHUD,
    updateHUD: updateHUD,
    summary: summary,
    starsFor: starsFor,
    starsForScore: starsForScore,
    starsHTML: starsHTML,
    rewardHTML: rewardHTML,
    lessonXP: XP.read,
    quizXP: XP.quiz,
    exerciseXP: XP.exercise,
    examXP: XP.exam,
    celebrate: celebrate,
    confetti: confetti,
    sfx: sfx,
    openBadges: openBadges,
    renderDaily: renderDaily,
    daily: dailyInfo,
    dailyQuestion: dailyQuestion,
    toggleSound: toggleSound
  };
})();
