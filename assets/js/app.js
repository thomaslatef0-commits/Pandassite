/* ============================================================
   app.js — التوجيه، الواجهات، والتفاعلات
   ============================================================ */
(function () {
  'use strict';

  const L = window.PDX.lessons;
  const Q = window.PDX.quizzes;
  const EX = window.PDX.exercises;
  const EXAM = window.PDX.exam;
  const CS = window.PDX.cheatsheet;
  const ICON = Render.ICONS;

  const STAGES = [
    { key: 'التأسيس', label: 'المرحلة 01', title: 'التأسيس', desc: 'ما هي بانداس، كيف تُبنى البيانات، وكيف تفحصها قبل أي تحليل.' },
    { key: 'الاختيار', label: 'المرحلة 02', title: 'الاختيار والتعديل', desc: 'loc وiloc والتعديل الآمن — أكثر منطقة تُخطئ فيها.' },
    { key: 'التنظيف', label: 'المرحلة 03', title: 'التنظيف', desc: 'القيم المفقودة والمكررة وحذف ما لا يخدم التحليل.' },
    { key: 'التحليل', label: 'المرحلة 04', title: 'التحليل', desc: 'التصفية والفرز والإحصاء والتجميع: من البيانات إلى إجابة.' },
    { key: 'الإدخال والإخراج', label: 'المرحلة 05', title: 'الإدخال والإخراج', desc: 'كيف تدخل البيانات وكيف تخرج دون أخطاء صامتة.' }
  ];

  const view = document.getElementById('view');
  const header = document.getElementById('header');
  const scrollBar = document.getElementById('scrollProgress');
  let pyMessage = '';
  let pyState = 'idle';

  /* ---------------------------------------------------------- utils */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  const LRI = '\u2066';
  const PDI = '\u2069';
  function xpText(n) { return LRI + '+' + n + ' XP' + PDI; }

  function toast(text, kind) {
    const el = document.getElementById('toast');
    el.textContent = text;
    el.className = 'toast show' + (kind ? ' toast-' + kind : '');
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.className = 'toast';
    }, 3200);
  }

  function lessonById(id) {
    return L.find(function (l) { return l.id === id; });
  }

  function lessonTitles() {
    const map = {};
    L.forEach(function (l) { map[l.id] = l.title; });
    return map;
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  /* ---------------------------------------------------------- theme */
  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    const btn = document.getElementById('themeBtn');
    if (btn) {
      btn.innerHTML = mode === 'dark'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
      btn.setAttribute('aria-label', mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن');
    }
  }

  function initTheme() {
    const saved = Progress.getTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    Progress.setTheme(next);
  }

  /* ---------------------------------------------------------- chrome */
  function updateChrome() {
    const stats = Progress.overall(L);
    const sr = document.getElementById('sidebarProgress');
    if (sr) sr.innerHTML = sidebarBody();
    if (window.Gamify) Gamify.refreshHUD();
  }

  function sidebarBody() {
    const stats = Progress.overall(L);
    let html = '<div class="aside-progress">' + Render.progressRing(stats.pct, 58, 5) +
      '<div><strong>' + stats.done + ' من ' + stats.total + '</strong><span>موضوعًا مكتملًا</span></div></div>';
    html += '<ol class="aside-list">';
    L.forEach(function (l) {
      const done = Progress.isLessonDone(l.id);
      const active = l.id === currentLessonId;
      html += '<li class="' + (active ? 'active ' : '') + (done ? 'done' : '') + '">' +
        '<a href="#/lesson/' + l.id + '"><span class="al-num">' + pad(l.num) + '</span>' +
        '<span class="al-title">' + Render.esc(l.short) + '</span>' +
        (done ? '<span class="al-check">' + ICON.check + '</span>' : '') + '</a></li>';
    });
    html += '</ol>';
    html += '<a class="aside-link" href="#/cheatsheet">' + ICON.table + ' ورقة المقارنات</a>';
    return html;
  }

  function setActiveNav(route) {
    qsa('.main-nav a, .mobile-nav a').forEach(function (a) {
      const target = a.getAttribute('data-route');
      a.classList.toggle('active', target === route);
    });
  }

  /* ---------------------------------------------------------- py status */
  function pyPill() {
    const map = {
      idle: { cls: 'idle', text: 'بايثون لم يُشغّل بعد' },
      loading: { cls: 'loading', text: pyMessage || 'جارٍ تحميل بايثون…' },
      ready: { cls: 'ready', text: pyMessage || 'بايثون جاهز' },
      error: { cls: 'error', text: 'تعذّر تشغيل بايثون' }
    };
    const s = map[pyState] || map.idle;
    return '<span class="py-pill ' + s.cls + '"><i class="dot"></i>' + Render.esc(s.text) + '</span>';
  }

  function refreshPyPills() {
    qsa('[data-py-status]').forEach(function (el) {
      el.innerHTML = pyPill();
    });
  }

  function updatePyStatus(state, message) {
    pyState = state;
    if (message) pyMessage = message;
    refreshPyPills();
    if (state === 'error') {
      toast('تعذّر تحميل محرّك بايثون. تحقّق من الاتصال بالإنترنت.', 'error');
    }
    if (state === 'ready') {
      const lab = document.getElementById('labRun');
      if (lab) lab.disabled = false;
    }
  }

  async function withBusy(btn, label, fn) {
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('is-busy');
    btn.innerHTML = '<span class="spinner"></span><span>' + label + '</span>';
    try {
      return await fn();
    } finally {
      btn.disabled = false;
      btn.classList.remove('is-busy');
      btn.innerHTML = original;
    }
  }

  /* ---------------------------------------------------------- router */
  let currentLessonId = null;

  function route() {
    const raw = location.hash.replace(/^#\/?/, '');
    const parts = raw.split('/');
    const path = parts[0] || 'home';

    qsa('.lesson-aside').forEach(function (n) { n.remove(); });
    currentLessonId = null;
    closeMobileNav();

    if (path === 'lesson' && parts[1]) {
      const lesson = lessonById(parts[1]);
      if (!lesson) return renderNotFound();
      currentLessonId = lesson.id;
      document.title = lesson.title + ' · مختبر بانداس';
      renderLesson(lesson);
      setActiveNav('lesson');
      window.scrollTo({ top: 0, behavior: 'auto' });
      updateChrome();
      return;
    }

    document.title = 'مختبر بانداس · تعلّم pandas بالفهم';
    if (path === 'home' || raw === '') {
      renderHome();
      setActiveNav('home');
    } else if (path === 'cheatsheet') {
      renderCheatsheet();
      setActiveNav('cheatsheet');
    } else if (path === 'exam') {
      renderExam();
      setActiveNav('exam');
    } else if (path === 'lab') {
      renderLab();
      setActiveNav('lab');
    } else {
      renderNotFound();
      setActiveNav('');
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    updateChrome();
    observeReveals();
  }

  /* ---------------------------------------------------------- home */
  function renderHome() {
    const stats = Progress.overall(L);
    const nextLesson = L.find(function (l) { return !Progress.isLessonDone(l.id); }) || L[0];
    const ctaLabel = stats.done === 0 ? 'ابدأ المسار' : stats.done === L.length ? 'أعد المسار' : 'أكمل من حيث توقفت';

    let html = '';

    /* hero */
    html += '<section class="hero">';
    html += '<div class="hero-grid-bg" aria-hidden="true"></div>';
    html += '<div class="wrap hero-grid">';
    html += '<div class="hero-copy">';
    html += '<span class="eyebrow"><i class="pulse"></i> مختبر تفاعلي · بايثون حقيقي يعمل في متصفحك</span>';
    html += '<h1>تعلّم <span class="hl">pandas</span> بالفهم،<br><span class="h1-sub">لا بالحفظ.</span></h1>';
    html += '<p class="hero-sub">مسار واضح، شرح يشرح <em>لماذا</em> يحدث ما يحدث، مقارنات تكشف الفروق الدقيقة، وتمارين تُصحّح كودك فعليًا. كل ذلك بالعربية وبدون إعداد.</p>';
    html += '<div class="hero-player" id="heroPlayer"></div>';
    html += '<div class="hero-cta">';
    html += '<a class="btn btn-primary btn-lg" href="#/lesson/' + nextLesson.id + '">' + ctaLabel + '<span class="btn-arr">' + ICON.arrow + '</span></a>';
    html += '<a class="btn btn-ghost btn-lg" href="#/lab">' + ICON.play + ' جرّب الكود الآن</a>';
    html += '</div>';
    html += '<div class="hero-stats">';
    html += '<div class="hs"><strong>' + L.length + '</strong><span>موضوعًا منظّمًا</span></div>';
    html += '<div class="hs"><strong>' + Q.length + '</strong><span>سؤالًا تفاعليًا</span></div>';
    html += '<div class="hs"><strong>' + EX.list.length + '</strong><span>تمرينًا يُصحّح تلقائيًا</span></div>';
    html += '<div class="hs"><strong>' + EXAM.length + '</strong><span>سؤالًا في الاختبار الشامل</span></div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="hero-visual" aria-hidden="true">';
    html += '<div class="hero-sticker">مكافأة كل موضوع <b>+25 XP</b></div>';
    html += '<div class="hv-window">';
    html += '<div class="hv-bar"><i></i><i></i><i></i><span class="hv-file">lesson.py</span></div>';
    html += '<pre class="hv-code"><code>' +
      '<span class="tok-kw">import</span> pandas <span class="tok-kw">as</span> <span class="tok-var">pd</span>\n' +
      'df <span class="tok-op">=</span> pd.<span class="tok-fn">DataFrame</span>(di)\n' +
      'df.<span class="tok-attr">loc</span>[<span class="tok-num">0</span>:<span class="tok-num">2</span>, <span class="tok-str">"Age"</span>]' +
      '</code></pre>';
    html += '<div class="hv-out"><div class="hv-out-head"><span>Out[3]</span><span class="hv-type">Series</span></div>';
    html += '<table class="hv-table"><tbody>' +
      '<tr><th>0</th><td>7</td></tr>' +
      '<tr><th>1</th><td>8</td></tr>' +
      '<tr><th>2</th><td>14</td></tr>' +
      '</tbody></table><div class="hv-meta">dtype: int64</div></div>';
    html += '</div>';
    html += '<div class="float-chip chip-a"><span class="fc-k">loc</span> يشمل نهاية الشريحة</div>';
    html += '<div class="float-chip chip-b"><span class="fc-k">iloc</span> لا يشملها</div>';
    html += '<div class="hero-panda">' + ICON.panda + '<span class="panda-bubble">جاهز للمهمة؟</span></div>';
    html += '</div>';
    html += '<span class="hero-deco hero-deco-star"></span><span class="hero-deco hero-deco-ring"></span><span class="hero-deco hero-deco-dot"></span>';
    html += '</div></section>';

    /* daily challenge */
    html += '<section class="section daily-section"><div class="wrap"><div id="dailyChallenge"></div></div></section>';

    /* method */
    html += '<section class="section method"><div class="wrap">';
    html += '<div class="sec-head"><span class="sec-kicker">طريقة العمل</span><h2>أربع خطوات تتكرّر في كل موضوع</h2><p>الهدف ليس أن تتذكّر الدالة، بل أن تتوقّع نتيجتها قبل تنفيذها.</p></div>';
    html += '<div class="method-grid">';
    const steps = [
      { n: '01', t: 'افهم الفكرة', d: 'كل درس يبدأ بالمشكلة قبل الحل: ما الذي نحاول فعله، ولماذا وُجدت هذه الدالة.', icon: ICON.bulb },
      { n: '02', t: 'جرّب بنفسك', d: 'بايثون يعمل داخل الصفحة. عدّل الكود، شغّله، وقارن ناتجك بالناتج المتوقع.', icon: ICON.play },
      { n: '03', t: 'قارن الفروق', d: 'جداول مقارنة صريحة بين loc وiloc، count وsize، inplace وإعادة الإسناد.', icon: ICON.table },
      { n: '04', t: 'اختبر الفهم', d: 'أسئلة تختبر التوقّع والتشخيص، وتمرين يُصحّح كودك باختبارات حقيقية.', icon: ICON.target }
    ];
    steps.forEach(function (s) {
      html += '<div class="method-card reveal"><span class="mc-num">' + s.n + '</span><span class="mc-icon">' + s.icon + '</span>' +
        '<h3>' + s.t + '</h3><p>' + s.d + '</p></div>';
    });
    html += '</div></div></section>';

    /* roadmap */
    html += '<section class="section roadmap" id="roadmap"><div class="wrap">';
    html += '<div class="sec-head"><span class="sec-kicker">الخريطة</span><h2>المسار الكامل</h2><p>' + L.length + ' موضوعًا مرتّبة من الأساس إلى التطبيق. يمكنك البدء من أي نقطة، لكن الترتيب مقصود.</p></div>';

    STAGES.forEach(function (stage, si) {
      const lessons = L.filter(function (l) { return l.stage === stage.key; });
      if (!lessons.length) return;
      const doneInStage = lessons.filter(function (l) { return Progress.isLessonDone(l.id); }).length;
      html += '<div class="stage reveal" data-world="' + (si + 1) + '">';
      html += '<div class="stage-head"><span class="stage-num">' + pad(si + 1) + '</span>' +
        '<div class="stage-copy"><h3 data-world-label="' + pad(si + 1) + '">' + stage.title + '</h3><p>' + stage.desc + '</p></div>' +
        '<span class="stage-count">' + doneInStage + '/' + lessons.length + '</span></div>';
      html += '<div class="lesson-grid' + (lessons.length === 2 ? ' count-2' : lessons.length === 1 ? ' count-1' : '') + '">';
      lessons.forEach(function (l) {
        const done = Progress.isLessonDone(l.id);
        const qi = Progress.quizInfo(l.id);
        const stars = Gamify.starsFor(l.id);
        const status = done ? 'مكتمل' : qi ? 'قيد التقدم' : 'لم يبدأ';
        const statusCls = done ? 'is-done' : qi ? 'is-progress' : '';
        html += '<a class="lesson-card reveal ' + (done ? 'is-done' : '') + '" href="#/lesson/' + l.id + '">';
        html += '<div class="lc-top"><span class="lc-level">' + pad(l.num) + '</span>';
        html += '<span class="lc-status ' + statusCls + '">' + (done ? '✓ ' : '') + status + '</span></div>';
        html += '<h4>' + Render.esc(l.title) + '</h4>';
        html += '<p>' + Render.esc(l.tagline) + '</p>';
        html += '<div class="lc-stars">' + Gamify.starsHTML(stars) + '<span>' + (stars ? stars + ' من 3' : 'ابدأ المهمة') + '</span></div>';
        html += '<div class="lc-meta"><span>' + ICON.clock + l.minutes + ' دقيقة</span><span>' + l.level + '</span>' +
          '<span class="xp-mini" title="مكافأة إتمام الموضوع">+' + Gamify.lessonXP + ' XP</span></div>';
        html += '</a>';
      });
      html += '</div></div>';
    });
    html += '</div></section>';

    /* why */
    html += '<section class="section features"><div class="wrap">';
    html += '<div class="feature-band">';
    html += '<div class="fb-copy"><span class="sec-kicker">لماذا هذا المختبر؟</span><h2>مبني على الفهم، لا على قائمة أوامر</h2>';
    html += '<p>المكتبة لا تُتعلَّم بحفظ الأسماء. تُتعلَّم ببناء نموذج ذهني: ما هو الجدول؟ ما هو الفهرس؟ متى تُعاد نسخة ومتى يُعدَّل الأصل؟ كل موضوع هنا يربط الأوامر بهذا النموذج.</p>';
    html += '<div class="fb-points">';
    html += '<div class="fbp">' + ICON.layers + '<div><strong>خرائط ذهنية قبل التفاصيل</strong><span>تبدأ من «لماذا» وتنتهي بالكود.</span></div></div>';
    html += '<div class="fbp">' + ICON.alert + '<div><strong>أخطاء حقيقية موضّحة</strong><span>كل خطأ شائع مع الصيغة الخاطئة والصحيحة جنبًا إلى جنب.</span></div></div>';
    html += '<div class="fbp">' + ICON.table + '<div><strong>مقارنات تُفرّق بين المتشابهات</strong><span>لأن الخلط هو المشكلة، لا الجهل.</span></div></div>';
    html += '<div class="fbp">' + ICON.target + '<div><strong>تصحيح آلي لتمارينك</strong><span>اختبارات بايثون حقيقية تفحص ناتج كودك.</span></div></div>';
    html += '</div></div>';
    html += '<div class="fb-visual" aria-hidden="true"><div class="mini-compare"><div class="mcc-head"><span>loc</span><span>iloc</span></div><div class="mcc-row"><span>بالاسم</span><span>بالموقع</span></div><div class="mcc-row"><span>يشمل النهاية</span><span>لا يشملها</span></div><div class="mcc-row"><span>df.loc[0:3] → 4</span><span>df.iloc[0:3] → 3</span></div></div></div>';
    html += '</div></div></section>';

    /* final */
    html += '<section class="section final"><div class="wrap"><div class="final-card reveal">';
    html += '<span class="sec-kicker">جاهز؟</span><h2>أول سطر هو الأصعب، وبعده يتضح كل شيء.</h2>';
    html += '<p>ابدأ بموضوع «لماذا pandas» — سبع دقائق تعطيك النموذج الذهني الذي سيخدمك في كل ما بعده.</p>';
    html += '<div class="final-actions"><a class="btn btn-primary btn-lg" href="#/lesson/why-pandas">ابدأ الآن<span class="btn-arr">' + ICON.arrow + '</span></a>';
    html += '<a class="btn btn-ghost" href="#/cheatsheet">تصفّح المقارنات</a></div>';
    html += '<p class="credit">مبني على دفتر <strong>pandas للمبتدئين</strong> للأستاذ قصي البطوش، مع إعادة بناء المحتوى وتوسيعه للفهم والتفاعل.</p>';
    html += '</div></div></section>';

    view.innerHTML = html;
    if (window.Gamify) Gamify.renderDaily();
    bindHome();
    observeReveals();
  }

  function bindHome() {
    qsa('.lesson-card').forEach(function (card) {
      card.addEventListener('mouseenter', function () { card.classList.add('hover'); });
      card.addEventListener('mouseleave', function () { card.classList.remove('hover'); });
    });
  }

  /* ---------------------------------------------------------- lesson */
  function renderLesson(lesson) {
    const idx = L.indexOf(lesson);
    const prev = L[idx - 1];
    const next = L[idx + 1];
    const questions = Q.filter(function (q) { return q.lessonId === lesson.id; });
    const exId = (lesson.sections.find(function (s) { return s.type === 'exercise'; }) || {}).id;
    const ex = exId ? EX.byId[exId] : null;
    const qi = Progress.quizInfo(lesson.id);

    let toc = '';
    let tocCount = 0;
    lesson.sections.forEach(function (s, i) {
      if (!s.title) return;
      const labelMap = {
        concept: 'مفهوم', code: 'كود', note: 'ملاحظة', compare: 'مقارنة',
        pitfall: 'خطأ شائع', under: 'تحت الغطاء', steps: 'خطوات',
        checklist: 'خلاصة'
      };
      if (labelMap[s.type]) {
        tocCount += 1;
        toc += '<a href="#s-' + lesson.id + '-' + i + '" class="toc-item toc-' + s.type + '" data-anchor="s-' + lesson.id + '-' + i + '">' +
          '<span class="toc-type">' + labelMap[s.type] + '</span>' + Render.esc(s.title) + '</a>';
      }
    });
    if (ex) {
      tocCount += 1;
      toc += '<a href="#' + ex.id + '" class="toc-item toc-exercise" data-anchor="' + ex.id + '"><span class="toc-type">تمرين</span>' + Render.esc(ex.title) + '</a>';
    }
    tocCount += 1;
    toc += '<a href="#lessonQuiz" class="toc-item toc-quiz" data-anchor="lessonQuiz"><span class="toc-type">اختبار</span>اختبر فهمك</a>';

    let html = '<div class="lesson-page"><div class="wrap">';
    html += '<nav class="crumbs"><a href="#/">الرئيسية</a><span class="sep">/</span><span>المسار</span><span class="sep">/</span><span class="current">' + Render.esc(lesson.short) + '</span></nav>';

    html += '<div class="lesson-layout">';
    html += '<aside class="lesson-aside"><div class="aside-inner"><div class="aside-card" id="sidebarProgress">' + sidebarBody() + '</div></div></aside>';

    html += '<article class="lesson-main">';
    html += '<header class="lesson-head">';
    html += '<div class="lesson-topline"><span class="lesson-num">الموضوع ' + pad(lesson.num) + '</span><span class="lesson-stage">' + Render.esc(lesson.stage) + '</span>' +
      '<span class="lesson-xp" title="مكافأة إتمام الموضوع">+' + Gamify.lessonXP + ' XP</span>' +
      '<span data-lesson-stars>' + Gamify.starsHTML(Gamify.starsFor(lesson.id)) + '</span></div>';
    html += '<h1>' + Render.esc(lesson.title) + '</h1>';
    html += '<p class="lesson-tagline">' + Render.esc(lesson.tagline) + '</p>';
    html += '<div class="lesson-meta"><span class="chip">' + ICON.clock + lesson.minutes + ' دقيقة</span><span class="chip">' + lesson.level + '</span><span class="chip">' + questions.length + ' أسئلة</span>' + (ex ? '<span class="chip">تمرين عملي</span>' : '') + (qi ? '<span class="chip">أفضل نتيجة ' + qi.best + '/' + qi.total + '</span>' : '') + '</div>';
    html += '<div class="goal-card"><span class="goal-label">' + ICON.target + 'هدف الدرس</span><p>' + Render.esc(lesson.goal) + '</p></div>';
    html += '</header>';

    html += '<nav class="toc" aria-label="محتويات الدرس"><div class="toc-head"><span class="toc-title">مهمات هذا الموضوع</span><span class="toc-count">' + tocCount + ' ' + (tocCount >= 3 && tocCount <= 10 ? 'خطوات' : 'خطوة') + '</span></div><div class="toc-list">' + toc + '</div></nav>';

    html += '<div class="lesson-content">';
    lesson.sections.forEach(function (s, i) {
      if (s.type === 'exercise') return;
      html += Render.section(s, lesson.id, i);
    });
    html += '</div>';

    if (ex) {
      html += '<div class="exercise-zone">';
      html += '<div class="zone-head"><span class="sec-kicker">تطبيق</span><h2>جرّب بيدك الآن</h2><p>اكتب الكود، ثم اضغط «تحقق». المحرّك يشغّل بايثون حقيقيًا ويختبر ناتجك.</p></div>';
      html += '<div data-exercise="' + ex.id + '"></div>';
      html += '</div>';
    }

    html += '<div class="done-bar">';
    html += '<div class="done-copy"><strong>أنجزت المهمة؟</strong><span>علّمها كمكتملة لتُضاف نقاطها إلى ملف اللاعب.</span></div>';
    html += '<div class="done-actions"><span class="done-xp">+' + Gamify.lessonXP + ' XP</span>' +
      '<button class="btn ' + (Progress.isRead(lesson.id) ? 'btn-soft' : 'btn-primary') + '" type="button" data-mark-read="' + lesson.id + '">' +
      (Progress.isRead(lesson.id) ? ICON.check + ' مكتمل' : 'علّم كمكتمل') + '</button></div>';
    html += '</div>';

    html += '<section class="quiz-section" id="lessonQuiz">';
    html += '<div class="zone-head"><span class="sec-kicker">اختبار</span><h2>اختبر فهمك</h2>';
    html += '<p>' + (qi ? 'أفضل نتيجة لك: <strong>' + qi.best + ' من ' + qi.total + '</strong> · ' + qi.attempts + ' محاولة.' : 'أسئلة تقيس التوقّع والتشخيص، لا الحفظ. النجاح من 60%.') + '</p></div>';
    html += '<div id="lessonQuizBox"></div>';
    html += '</section>';

    html += '<nav class="lesson-nav">';
    if (prev) html += '<a class="ln-link ln-prev" href="#/lesson/' + prev.id + '"><span class="ln-dir">' + ICON.arrow + 'السابق</span><strong>' + Render.esc(prev.short) + '</strong></a>';
    else html += '<span></span>';
    if (next) html += '<a class="ln-link ln-next" href="#/lesson/' + next.id + '"><span class="ln-dir">التالي' + ICON.arrow + '</span><strong>' + Render.esc(next.short) + '</strong></a>';
    else html += '<a class="ln-link ln-next" href="#/exam"><span class="ln-dir">التالي' + ICON.arrow + '</span><strong>الاختبار الشامل</strong></a>';
    html += '</nav>';

    html += '</article></div></div></div>';

    view.innerHTML = html;

    /* exercise */
    if (ex) {
      const slot = qs('[data-exercise="' + ex.id + '"]');
      if (slot) initExercise(slot, ex);
    }

    /* quiz */
    const quizBox = document.getElementById('lessonQuizBox');
    if (quizBox && questions.length) {
      new Quiz({
        container: quizBox,
        questions: questions,
        mode: 'lesson',
        lessonId: lesson.id,
        prevBest: (Progress.state().quiz[lesson.id] || {}).best || 0,
        onFinish: function (score, total) {
          const prev = (Progress.state().quiz[lesson.id] || {}).best || 0;
          Progress.saveQuiz(lesson.id, score, total);
          updateChrome();
          const starsEl = qs('[data-lesson-stars]');
          if (starsEl) starsEl.innerHTML = Gamify.starsHTML(Gamify.starsFor(lesson.id));
          Gamify.refresh();
          const pct = Math.round((score / total) * 100);
          if (pct === 100) Gamify.celebrate('perfect');
          else if (pct >= 60) Gamify.sfx('win');
          toast(pct >= 60 ? 'أحسنت — سُجّلت نتيجتك ' + score + '/' + total + (score > prev ? ' · ' + xpText((score - prev) * Gamify.quizXP) : '') : 'سُجّلت النتيجة ' + score + '/' + total + ' — راجع الأخطاء', pct >= 60 ? 'good' : 'warn');
        }
      });
    }

    bindLesson(lesson);
    observeReveals();
  }

  function bindLesson(lesson) {
    qsa('.toc-item').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        const id = a.getAttribute('data-anchor');
        const target = document.getElementById(id);
        if (target) {
          const y = target.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });

    const mark = qs('[data-mark-read]');
    if (mark) {
      mark.addEventListener('click', function () {
        if (Progress.isRead(lesson.id)) {
          toast('هذا الموضوع مكتمل بالفعل.');
          return;
        }
        Progress.markRead(lesson.id);
        mark.className = 'btn btn-soft';
        mark.innerHTML = ICON.check + ' مكتمل';
        const starsEl = qs('[data-lesson-stars]');
        if (starsEl) starsEl.innerHTML = Gamify.starsHTML(Gamify.starsFor(lesson.id));
        updateChrome();
        Gamify.refresh();
        Gamify.celebrate('done');
        toast('مهمة مكتملة ✓  ' + xpText(Gamify.lessonXP), 'good');
      });
    }
  }

  /* ---------------------------------------------------------- exercise */
  function initExercise(slot, ex) {
    const index = EX.list.indexOf(ex) + 1;
    slot.innerHTML = Render.exercise(ex, index);
    const textarea = qs('.code-editor', slot);
    const hint = qs('.ex-hint', slot);
    const result = qs('.ex-result', slot);
    const runBtn = qs('[data-ex-run]', slot);
    const draft = Progress.getDraft(ex.id);

    if (draft) textarea.value = draft;
    textarea.addEventListener('input', function () {
      Progress.saveDraft(ex.id, textarea.value);
    });
    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.slice(0, start) + '    ' + textarea.value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runBtn.click();
      }
    });

    qs('[data-ex-hint]', slot).addEventListener('click', function () {
      hint.hidden = !hint.hidden;
    });

    qs('[data-ex-solution]', slot).addEventListener('click', function () {
      const existing = qs('.ex-solution', slot);
      if (existing) {
        existing.remove();
        return;
      }
      const div = document.createElement('div');
      div.className = 'ex-solution';
      div.innerHTML = '<div class="sol-head">الحل المرجعي <span>جرّب أولًا ثم قارن</span></div>' +
        '<pre class="code-body"><code>' + Render.highlightPython(ex.solution) + '</code></pre>' +
        '<button type="button" class="ghost-btn" data-use-solution>استخدم هذا الحل في المحرر</button>';
      result.parentNode.insertBefore(div, result);
      qs('[data-use-solution]', div).addEventListener('click', function () {
        textarea.value = ex.solution;
        Progress.saveDraft(ex.id, textarea.value);
        textarea.focus();
      });
    });

    runBtn.addEventListener('click', function () {
      const code = textarea.value;
      if (!code.trim()) {
        toast('اكتب كودًا أولًا.', 'warn');
        return;
      }
      withBusy(runBtn, 'يعمل…', async function () {
        try {
          const res = await PyLab.runExercise(ex.setup, code, ex.tests);
          showExerciseResult(res, slot, ex);
        } catch (err) {
          result.hidden = false;
          result.className = 'ex-result is-error';
          result.innerHTML = '<div class="ex-result-head">تعذّر تشغيل المحرّك</div><p>' +
            Render.esc(PyLab.getStatus().error ? 'تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.' : String(err)) + '</p>';
        }
      });
    });
  }

  function showExerciseResult(res, slot, ex) {
    const result = qs('.ex-result', slot);
    result.hidden = false;

    const checks = res.checks || [];
    const passed = checks.filter(function (c) { return c.ok; }).length;
    const all = passed === checks.length && checks.length > 0 && !res.error;

    qsa('.ex-checks li', slot).forEach(function (li) {
      const label = li.getAttribute('data-check');
      const match = checks.find(function (c) { return c.label === label; });
      li.classList.toggle('ok', !!(match && match.ok));
      li.classList.toggle('fail', !!(match && !match.ok));
    });

    let html = '';
    html += '<div class="ex-result-head ' + (all ? 'ok' : 'fail') + '">' +
      (all ? '✓ نجح التمرين — ' : 'نتيجة التحقق — ') + passed + ' من ' + checks.length + ' معايير' +
      '</div>';

    if (res.error) {
      html += '<pre class="term err">' + Render.esc(PyLab.friendlyError(res.error)) + '</pre>';
      html += '<details class="trace"><summary>تتبّع الخطأ الكامل</summary><pre class="term">' + Render.esc(res.error) + '</pre></details>';
    } else {
      const failed = checks.filter(function (c) { return !c.ok; });
      if (failed.length) {
        html += '<ul class="fail-list">';
        failed.forEach(function (c) {
          html += '<li>' + Render.esc(c.label) + (c.msg ? ' <span>' + Render.esc(c.msg) + '</span>' : '') + '</li>';
        });
        html += '</ul>';
      }
      if (res.stdout) html += '<div class="mini-out-label">الطباعة</div><pre class="term">' + Render.esc(res.stdout) + '</pre>';
      if (res.result) {
        html += '<div class="mini-out-label">آخر تعبير</div>' + Render.fromLive(res.result);
      }
      if (!res.stdout && !res.result && !failed.length) {
        html += '<p class="muted-note">الكود صحيح لكنه لا يطبع شيئًا. أضف تعبيرًا في آخره أو استخدم print لمشاهدة الناتج.</p>';
      }
    }

    result.className = 'ex-result ' + (all ? 'is-ok' : 'is-fail');
    result.innerHTML = html;

    if (all) {
      const wasDone = !!(Progress.state().exercises || {})[ex.id];
      Progress.markExercise(ex.id);
      updateChrome();
      if (!wasDone) {
        Gamify.refresh();
        Gamify.celebrate('exercise');
        toast('تمرين مكتمل ✓  ' + xpText(Gamify.exerciseXP), 'good');
      } else {
        toast('تمرين مكتمل ✓ — أعدت التحقق بنجاح.', 'good');
      }
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /* ---------------------------------------------------------- cheatsheet */
  function renderCheatsheet() {
    let html = '<section class="page-head"><div class="wrap">';
    html += '<span class="sec-kicker">ورقة مرجعية</span><h1>الفروق التي تُربك الجميع</h1>';
    html += '<p>ليست قائمة دوال، بل مقارنات صريحة بين الأشياء المتشابهة. اقرأ العمود الثالث دائمًا: متى تستخدم هذا بدل ذاك.</p>';
    html += '</div></section>';

    html += '<div class="wrap cs-body">';
    html += '<div class="cs-index">';
    CS.comparisons.forEach(function (c, i) {
      html += '<a href="#cmp-' + c.id + '"><span>' + pad(i + 1) + '</span>' + Render.esc(c.title) + '</a>';
    });
    html += '<a href="#rules"><span>★</span>القواعد الذهبية</a>';
    html += '<a href="#reference"><span>⌘</span>المرجع السريع</a>';
    html += '</div>';

    html += '<div class="compare-grid">';
    CS.comparisons.forEach(function (c) {
      html += '<article class="cmp-card reveal" id="cmp-' + c.id + '">';
      html += '<div class="cmp-card-head"><h2>' + Render.esc(c.title) + '</h2><p>' + Render.esc(c.hint) + '</p></div>';
      html += '<div class="cmp-scroll"><table class="cmp-table"><thead><tr>';
      c.head.forEach(function (h, i) {
        html += '<th' + (i === 0 ? ' class="cmp-rowhead"' : '') + '>' + Render.esc(h) + '</th>';
      });
      html += '</tr></thead><tbody>';
      c.rows.forEach(function (row) {
        html += '<tr>';
        row.forEach(function (cell, i) {
          html += i === 0
            ? '<th scope="row" class="cmp-rowhead">' + Render.esc(cell) + '</th>'
            : '<td>' + Render.esc(cell) + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      html += '<p class="cmp-verdict">' + Render.esc(c.verdict) + '</p>';
      html += '</article>';
    });
    html += '</div>';

    html += '<section class="rules-section" id="rules">';
    html += '<div class="zone-head"><span class="sec-kicker">عشر قواعد</span><h2>القواعد الذهبية</h2><p>لو نسيت كل شيء، أبقِ هذه في ذهنك.</p></div>';
    html += '<div class="rules-grid">';
    CS.rules.forEach(function (r) {
      html += '<div class="rule-card reveal"><span class="rule-n">' + r.n + '</span><h3>' + Render.esc(r.t) + '</h3><p>' + Render.esc(r.d) + '</p></div>';
    });
    html += '</div></section>';

    html += '<section class="ref-section" id="reference">';
    html += '<div class="zone-head ref-head"><div><span class="sec-kicker">مرجع</span><h2>البحث السريع عن دالة</h2><p>' + CS.reference.reduce(function (a, g) { return a + g.items.length; }, 0) + ' دالة أساسية مع نوع ناتجها.</p></div>';
    html += '<div class="ref-search">' + ICON.search + '<input type="search" id="refFilter" placeholder="ابحث: groupby، fillna، loc…" aria-label="بحث في الدوال"></div></div>';
    html += '<div class="ref-groups" id="refGroups">';
    CS.reference.forEach(function (g) {
      html += '<div class="ref-group" data-group>';
      html += '<h3>' + Render.esc(g.group) + '</h3>';
      html += '<div class="ref-table-wrap"><table class="ref-table"><thead><tr><th>الدالة</th><th>ماذا تفعل</th><th>نوع الناتج</th></tr></thead><tbody>';
      g.items.forEach(function (it) {
        html += '<tr data-search="' + Render.esc((it.fn + ' ' + it.d + ' ' + it.out).toLowerCase()) + '">' +
          '<td><code>' + Render.esc(it.fn) + '</code></td>' +
          '<td>' + Render.esc(it.d) + '</td>' +
          '<td><span class="ret">' + Render.esc(it.out) + '</span></td></tr>';
      });
      html += '</tbody></table></div></div>';
    });
    html += '</div>';
    html += '<p class="ref-empty" id="refEmpty" hidden>لا توجد دالة تطابق بحثك. جرّب كلمة أبسط.</p>';
    html += '</section></div>';

    view.innerHTML = html;
    bindCheatsheet();
    observeReveals();
  }

  function bindCheatsheet() {
    const input = document.getElementById('refFilter');
    if (!input) return;
    input.addEventListener('input', function () {
      const term = input.value.trim().toLowerCase();
      let visible = 0;
      qsa('.ref-group').forEach(function (group) {
        let groupVisible = 0;
        qsa('.ref-table tbody tr', group).forEach(function (tr) {
          const match = !term || (tr.getAttribute('data-search') || '').indexOf(term) !== -1;
          tr.hidden = !match;
          if (match) groupVisible += 1;
        });
        group.hidden = groupVisible === 0;
        visible += groupVisible;
      });
      document.getElementById('refEmpty').hidden = visible !== 0;
    });
  }

  /* ---------------------------------------------------------- exam */
  function renderExam() {
    const examState = Progress.state().exam;
    let html = '<section class="page-head"><div class="wrap">';
    html += '<span class="sec-kicker">التحدي النهائي</span><h1>الاختبار الشامل</h1>';
    html += '<p>' + EXAM.length + ' سؤالًا تغطي الموضوعات كلها. الهدف ليس الدرجة، بل اكتشاف الفكرة التي لم تتضح بعد.</p>';
    html += '</div></section><div class="wrap narrow">';

    html += '<div class="exam-intro" id="examIntro">';
    html += '<div class="boss-strip"><span class="boss-face" aria-hidden="true">👾</span><div class="boss-copy"><strong>وحش البيانات</strong><span>' + EXAM.length + ' سؤالًا من كل العوالم. اجمع 60% لتفتح وسام التحدي الشامل.</span></div><span class="boss-cup" aria-hidden="true">🏆</span></div>';
    html += '<div class="exam-stats">';
    html += '<div class="es"><strong>' + EXAM.length + '</strong><span>سؤالًا</span></div>';
    html += '<div class="es"><strong>' + L.length + '</strong><span>موضوعًا</span></div>';
    html += '<div class="es"><strong>60%</strong><span>حد النجاح</span></div>';
    html += '<div class="es"><strong>' + (examState.best || '—') + '</strong><span>أفضل نتيجة' + (examState.total ? ' من ' + examState.total : '') + '</span></div>';
    html += '</div>';
    html += '<div class="exam-rules"><h3>قبل أن تبدأ</h3><ul>';
    html += '<li>الأسئلة والخيارات تُرتَّب عشوائيًا في كل محاولة.</li>';
    html += '<li>لكل سؤال إجابة واحدة، ويظهر الشرح فور اختيارك.</li>';
    html += '<li>لا مؤقّت. خذ وقتك — الهدف الفهم لا السرعة.</li>';
    html += '<li>في النهاية ستحصل على تحليل لكل موضوع ومراجعة للأخطاء.</li>';
    html += '</ul></div>';
    html += '<button type="button" class="btn btn-primary btn-lg" data-start-exam>ابدأ الاختبار<span class="btn-arr">' + ICON.arrow + '</span></button>';
    html += '</div>';

    html += '<div id="examStage"></div>';
    html += '</div>';

    view.innerHTML = html;
    bindExam();
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function bindExam() {
    const start = qs('[data-start-exam]');
    if (!start) return;
    start.addEventListener('click', function () {
      const intro = document.getElementById('examIntro');
      if (intro) intro.hidden = true;
      const stage = document.getElementById('examStage');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      new Quiz({
        container: stage,
        questions: shuffle(EXAM),
        mode: 'exam',
        lessonTitles: lessonTitles(),
        prevBest: Progress.state().exam.best || 0,
        onFinish: function (score, total) {
          const before = Progress.state().exam.best;
          Progress.saveExam(score, total);
          updateChrome();
          Gamify.refresh();
          const pct = score / total;
          if (pct >= 0.6) {
            if (score > before) Gamify.celebrate('exam');
            else Gamify.sfx('win');
          }
          if (score > before) toast('نتيجة جديدة: ' + score + ' من ' + total + ' · ' + xpText((score - before) * Gamify.examXP), pct >= 0.6 ? 'good' : 'warn');
          else toast('انتهى الاختبار: ' + score + ' من ' + total, pct >= 0.6 ? 'good' : 'warn');
        }
      });
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------------------------------------------------------- lab */
  function renderLab() {
    const initial = 'import pandas as pd\n\n' +
      'df = pd.DataFrame({\n' +
      '    "Name": ["Ali", "Sahra", "Ahmad", "Mouhammed"],\n' +
      '    "Age": [7, 8, 14, 20],\n' +
      '    "Mark": ["A", "A", "B", "A"]\n' +
      '})\n\n' +
      'df.groupby("Mark")["Age"].mean()\n';

    let html = '<section class="page-head"><div class="wrap">';
    html += '<span class="sec-kicker">المختبر</span><h1>بايثون حقيقي، في متصفحك</h1>';
    html += '<p>اكتب أي كود pandas وجرّبه فورًا. لا شيء يُرسل إلى خادم: المحرّك يعمل داخل صفحتك، ويمكنك تعديل كل شيء.</p>';
    html += '</div></section>';

    html += '<div class="wrap">';
    html += '<div class="lab-shell">';
    html += '<div class="lab-top"><div data-py-status>' + pyPill() + '</div>';
    html += '<div class="lab-snippets">';
    window.PDX.data.SNIPPETS.forEach(function (s, i) {
      html += '<button type="button" class="snip" data-snippet="' + i + '">' + Render.esc(s.label) + '</button>';
    });
    html += '</div></div>';

    html += '<div class="lab-grid">';
    html += '<div class="lab-editor">';
    html += '<div class="editor-top"><span class="editor-lang">main.py</span><div class="editor-tools">';
    html += '<button type="button" class="ghost-btn" data-lab-reset>إعادة تعيين</button>';
    html += '<button type="button" class="mini-btn mini-run" id="labRun" data-lab-run>' + ICON.play + '<span>شغّل</span></button>';
    html += '</div></div>';
    html += '<textarea class="code-editor lab-code" id="labCode" spellcheck="false" dir="ltr" aria-label="محرر بايثون">' + Render.esc(initial) + '</textarea>';
    html += '<div class="editor-foot"><span>Ctrl / Cmd + Enter للتشغيل</span><span class="muted">آخر تعبير يُعرض تلقائيًا</span></div>';
    html += '</div>';

    html += '<div class="lab-output" id="labOut">';
    html += '<div class="lab-out-empty">' + ICON.code + '<p>اضغط «شغّل» لترى الناتج هنا.</p><span>أول تشغيل قد يستغرق بعض الوقت لتحميل pandas.</span></div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="lab-notes">';
    html += '<div class="ln-item">' + ICON.bulb + '<div><strong>جرّب الأسئلة الصغيرة</strong><span>غيّر رقمًا، أضف صفًا، احذف عمودًا. الهدف رؤية أثر كل تعديل.</span></div></div>';
    html += '<div class="ln-item">' + ICON.alert + '<div><strong>الذاكرة مشتركة بين التشغيلات</strong><span>كل ما تعرّفه يبقى. استخدم «إعادة تعيين» لبداية نظيفة.</span></div></div>';
    html += '<div class="ln-item">' + ICON.target + '<div><strong>أخطاء واضحة</strong><span>رسالة الخطأ الأخيرة تظهر أولًا، والتتبّع الكامل عند الطلب.</span></div></div>';
    html += '</div>';
    html += '</div></div>';

    view.innerHTML = html;

    const code = document.getElementById('labCode');
    const saved = Progress.getDraft('__lab__');
    if (saved) code.value = saved;
    code.addEventListener('input', function () { Progress.saveDraft('__lab__', code.value); });
    code.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = code.selectionStart, t = code.selectionEnd;
        code.value = code.value.slice(0, s) + '    ' + code.value.slice(t);
        code.selectionStart = code.selectionEnd = s + 4;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runLab();
      }
    });

    qsa('[data-snippet]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const i = parseInt(btn.getAttribute('data-snippet'), 10);
        code.value = window.PDX.data.SNIPPETS[i].code;
        Progress.saveDraft('__lab__', code.value);
        code.focus();
        toast('تم تحميل المثال: ' + window.PDX.data.SNIPPETS[i].label);
      });
    });

    document.getElementById('labRun').addEventListener('click', runLab);
    qs('[data-lab-reset]').addEventListener('click', async function () {
      if (PyLab.isReady()) {
        await PyLab.reset();
        toast('تم تفريغ ذاكرة بايثون.');
      } else {
        toast('المحرّك لم يُشغّل بعد.');
      }
      document.getElementById('labOut').innerHTML =
        '<div class="lab-out-empty">' + ICON.code + '<p>ذاكرة نظيفة. اكتب كودك ثم شغّله.</p></div>';
    });

    refreshPyPills();
  }

  async function runLab() {
    const btn = document.getElementById('labRun');
    const code = document.getElementById('labCode').value;
    const out = document.getElementById('labOut');
    if (!code.trim()) {
      toast('اكتب كودًا أولًا.', 'warn');
      return;
    }
    await withBusy(btn, 'يعمل…', async function () {
      out.innerHTML = '<div class="lab-loading"><span class="spinner big"></span><p>جارٍ تشغيل الكود…</p></div>';
      try {
        const res = await PyLab.run(code);
        out.innerHTML = renderLabOutput(res);
      } catch (err) {
        out.innerHTML = '<div class="lab-out-empty err">' + ICON.alert +
          '<p>تعذّر تشغيل المحرّك.</p><span>تأكد من اتصال الإنترنت في أول تشغيل فقط.</span></div>';
      }
    });
  }

  function renderLabOutput(res) {
    let html = '<div class="out-block"><div class="out-block-head"><span>الناتج</span>' +
      (res.result && res.result.kind ? '<span class="out-type">' + Render.esc(res.result.kind === 'df' ? 'DataFrame' : res.result.kind === 'series' ? 'Series' : 'repr') + '</span>' : '') +
      '</div>';
    if (res.error) {
      html += '<pre class="term err">' + Render.esc(PyLab.friendlyError(res.error)) + '</pre>';
      html += '<details class="trace"><summary>تتبّع الخطأ الكامل</summary><pre class="term">' + Render.esc(res.error) + '</pre></details>';
    } else {
      if (res.stdout) html += '<pre class="term">' + Render.esc(res.stdout) + '</pre>';
      if (res.result) html += Render.fromLive(res.result);
      if (!res.stdout && !res.result) html += '<p class="muted-note">تم التنفيذ بلا مخرجات. أضف تعبيرًا في آخر الكود لعرض ناتجه.</p>';
    }
    html += '</div>';
    return html;
  }

  /* ---------------------------------------------------------- 404 */
  function renderNotFound() {
    view.innerHTML = '<div class="wrap notfound"><span class="sec-kicker">404</span><h1>هذه الصفحة غير موجودة</h1>' +
      '<p>ربما تغيّر الرابط أو أن الموضوع لم يُضف بعد.</p>' +
      '<a class="btn btn-primary" href="#/">العودة إلى المسار</a></div>';
  }

  /* ---------------------------------------------------------- live code */
  function initLiveCode() {
    document.addEventListener('click', async function (e) {
      const copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        const shell = copyBtn.closest('.code-shell');
        const code = qs('.code-body', shell).textContent;
        try {
          await navigator.clipboard.writeText(code);
          toast('تم نسخ الكود.');
        } catch (err) {
          const ta = document.createElement('textarea');
          ta.value = code;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          toast('تم نسخ الكود.');
        }
        return;
      }

      const runBtn = e.target.closest('[data-run]');
      if (runBtn) {
        const shell = runBtn.closest('.code-shell');
        const code = qs('.code-body', shell).textContent;
        const setup = shell.getAttribute('data-setup') || '';
        const slot = qs('.live-slot', shell);
        slot.hidden = false;
        slot.innerHTML = '<div class="live-loading"><span class="spinner"></span>جارٍ تشغيل الكود…</div>';
        await withBusy(runBtn, 'يعمل…', async function () {
          try {
            const res = await PyLab.run(withSetup((setup ? setup + '\n\n' : '') + code));
            let html = '<div class="live-out"><div class="live-head"><span>الناتج الفعلي</span><button type="button" class="mini-close" data-live-close>إخفاء</button></div>';
            if (res.error) {
              html += '<pre class="term err">' + Render.esc(PyLab.friendlyError(res.error)) + '</pre>';
              html += '<details class="trace"><summary>تتبّع الخطأ الكامل</summary><pre class="term">' + Render.esc(res.error) + '</pre></details>';
            } else {
              if (res.stdout) html += '<pre class="term">' + Render.esc(res.stdout) + '</pre>';
              if (res.result) html += Render.fromLive(res.result);
              if (!res.stdout && !res.result) html += '<p class="muted-note">تم التنفيذ بلا مخرجات.</p>';
            }
            html += '</div>';
            slot.innerHTML = html;
          } catch (err) {
            slot.innerHTML = '<div class="live-out"><p class="muted-note err">تعذّر تحميل محرّك بايثون. تحقّق من الاتصال ثم أعد المحاولة.</p></div>';
          }
        });
        return;
      }

      if (e.target.closest('[data-live-close]')) {
        const live = e.target.closest('.live-slot');
        if (live) {
          live.hidden = true;
          live.innerHTML = '';
        }
      }
    });
  }

  function withSetup(code) {
    const setup =
      'import pandas as pd\n\n' +
      'names = ["Ali", "Sahra", "Ahmad"]\n' +
      'ages = [7, 8, 14]\n' +
      'marks = ["A", "A", "B"]\n\n' +
      'di = {"Name": ["Ali", "Sahra", "Ahmad", "Mouhammed", "Ali", "Sahra", "Ali"],\n' +
      '      "Age": [7, 8, 14, 20, 7, 6, 11],\n' +
      '      "Mark": ["A", "A", "B", "A", "A", "D", "A"]}\n' +
      'df = pd.DataFrame(di)\n\n';
    return setup + code;
  }

  /* ---------------------------------------------------------- search */
  function buildSearchIndex() {
    const items = [];
    L.forEach(function (l) {
      items.push({
        title: l.title,
        sub: l.tagline,
        href: '#/lesson/' + l.id,
        kind: 'موضوع',
        hay: (l.title + ' ' + l.short + ' ' + l.tagline + ' ' + l.keywords.join(' ')).toLowerCase()
      });
    });
    CS.comparisons.forEach(function (c) {
      items.push({
        title: c.title,
        sub: c.hint,
        href: '#/cheatsheet',
        kind: 'مقارنة',
        hay: (c.title + ' ' + c.hint + ' ' + c.verdict).toLowerCase()
      });
    });
    items.push({ title: 'الاختبار الشامل', sub: EXAM.length + ' سؤالًا من كل الموضوعات', href: '#/exam', kind: 'صفحة', hay: 'اختبار امتحان شامل' });
    items.push({ title: 'المختبر', sub: 'شغّل كود pandas في المتصفح', href: '#/lab', kind: 'صفحة', hay: 'مختبر تجربة كود بايثون' });
    items.push({ title: 'القواعد الذهبية', sub: 'عشر قواعد تحمي تحليلك', href: '#/cheatsheet', kind: 'صفحة', hay: 'قواعد ذهبية' });
    return items;
  }

  function initSearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const index = buildSearchIndex();

    function open() {
      overlay.hidden = false;
      document.body.classList.add('no-scroll');
      setTimeout(function () { input.focus(); }, 30);
      render('');
    }

    function close() {
      overlay.hidden = true;
      document.body.classList.remove('no-scroll');
      input.value = '';
    }

    function render(term) {
      const t = term.trim().toLowerCase();
      let list = index;
      if (t) {
        list = index.filter(function (it) { return it.hay.indexOf(t) !== -1; });
      } else {
        list = index.filter(function (it) { return it.kind !== 'مقارنة'; }).slice(0, 8);
      }
      if (!list.length) {
        results.innerHTML = '<p class="search-empty">لا نتائج. جرّب «groupby» أو «loc» أو «مفقودة».</p>';
        return;
      }
      results.innerHTML = list.slice(0, 10).map(function (it) {
        return '<a class="search-item" href="' + it.href + '"><span class="si-kind">' + it.kind + '</span>' +
          '<span class="si-copy"><strong>' + Render.esc(it.title) + '</strong><span>' + Render.esc(it.sub || '') + '</span></span>' +
          '<span class="si-arr">' + ICON.arrow + '</span></a>';
      }).join('');
    }

    document.getElementById('searchBtn').addEventListener('click', open);
    qsa('[data-close-search]').forEach(function (b) { b.addEventListener('click', close); });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const first = results.querySelector('.search-item');
        if (first) {
          location.hash = first.getAttribute('href');
          close();
        }
      }
      if (e.key === 'Escape') close();
    });
    results.addEventListener('click', function (e) {
      if (e.target.closest('.search-item')) close();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        overlay.hidden ? open() : close();
      }
      if (e.key === 'Escape' && !overlay.hidden) close();
    });
  }

  /* ---------------------------------------------------------- misc */
  function closeMobileNav() {
    const nav = document.getElementById('mobileNav');
    if (nav) nav.hidden = true;
    const btn = document.getElementById('menuBtn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function observeReveals() {
    const els = qsa('.reveal:not(.in)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  function bindChrome() {
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    document.getElementById('menuBtn').addEventListener('click', function () {
      const nav = document.getElementById('mobileNav');
      const open = nav.hidden;
      nav.hidden = !open;
      this.setAttribute('aria-expanded', String(open));
    });
    qsa('.mobile-nav a').forEach(function (a) {
      a.addEventListener('click', closeMobileNav);
    });

    let ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? (window.scrollY / h) * 100 : 0;
        scrollBar.style.width = p + '%';
        header.classList.toggle('scrolled', window.scrollY > 10);
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------- init */
  function init() {
    initTheme();
    bindChrome();
    initSearch();
    initLiveCode();
    if (window.Gamify) Gamify.init();
    PyLab.onStatus(updatePyStatus);
    window.addEventListener('hashchange', route);
    updateChrome();
    if (!location.hash) location.replace('#/');
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
