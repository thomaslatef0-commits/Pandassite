/* ============================================================
   quiz.js — محرّك الأسئلة (يستخدم في الدروس والاختبار الشامل)
   ============================================================ */
window.Quiz = (function () {
  'use strict';

  const LETTERS = ['1', '2', '3', '4', '5'];

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = array[i];
      array[i] = array[j];
      array[j] = tmp;
    }
    return array;
  }

  /* نُعيد ترتيب الخيارات في كل محاولة حتى لا يتحول الحل إلى
     "اختر الأول دائمًا". نحتفظ بنص الإجابة الصحيحة ثم نجد موضعها الجديد. */
  function shuffleQuestion(q) {
    const items = q.options.map(function (text, i) {
      return { text: text, correct: i === q.answer };
    });
    shuffle(items);
    const answer = items.findIndex(function (it) { return it.correct; });
    return Object.assign({}, q, {
      options: items.map(function (it) { return it.text; }),
      answer: answer
    });
  }

  function reveal(el) {
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function Quiz(opts) {
    this.questions = opts.questions.map(shuffleQuestion);
    this.mode = opts.mode || 'lesson';
    this.lessonId = opts.lessonId || null;
    this.container = opts.container;
    this.onFinish = opts.onFinish || function () {};
    this.lessonTitles = opts.lessonTitles || {};
    this.prevBest = Math.max(0, opts.prevBest || 0);
    this.index = 0;
    this.picks = [];
    this.score = 0;
    this.answered = false;
    this.done = false;
    this.bind();
    this.render();
  }

  Quiz.prototype.bind = function () {
    const self = this;
    this.container.addEventListener('click', function (e) {
      const opt = e.target.closest('[data-opt]');
      if (opt && !self.answered) {
        self.choose(parseInt(opt.getAttribute('data-opt'), 10));
        return;
      }
      if (e.target.closest('[data-next]')) {
        self.next();
        return;
      }
      if (e.target.closest('[data-retry]')) {
        self.restart();
      }
    });
    this.container.addEventListener('keydown', function (e) {
      if (self.done) return;
      if (/^[1-5]$/.test(e.key) && !self.answered) {
        const i = parseInt(e.key, 10) - 1;
        if (i < self.currentOptions().length) self.choose(i);
      }
      if (e.key === 'Enter' && self.answered) {
        e.preventDefault();
        self.next();
      }
    });
  };

  Quiz.prototype.current = function () {
    return this.questions[this.index];
  };

  Quiz.prototype.currentOptions = function () {
    return this.current().options || [];
  };

  Quiz.prototype.choose = function (i) {
    if (this.answered) return;
    this.answered = true;
    const q = this.current();
    const ok = i === q.answer;
    this.picks[this.index] = i;
    if (ok) this.score += 1;
    if (window.Gamify) Gamify.sfx(ok ? 'correct' : 'wrong');
    this.renderFeedback();
    this.paintChoices();
    this.paintMeta();
    const nextBtn = this.container.querySelector('[data-next]');
    if (nextBtn) {
      nextBtn.hidden = false;
      nextBtn.focus({ preventScroll: true });
    }
  };

  Quiz.prototype.paintMeta = function () {
    const score = this.container.querySelector('.quiz-score');
    if (score) score.textContent = '✓ ' + this.score;
    const dot = this.container.querySelectorAll('.qdot')[this.index];
    if (!dot) return;
    const ok = this.picks[this.index] === this.current().answer;
    dot.classList.toggle('is-ok', ok);
    dot.classList.toggle('is-bad', !ok);
  };

  Quiz.prototype.next = function () {
    if (!this.answered) return;
    if (this.index < this.questions.length - 1) {
      this.index += 1;
      this.answered = false;
      this.render();
    } else {
      this.finish();
    }
  };

  Quiz.prototype.finish = function () {
    this.done = true;
    this.renderResult();
    reveal(this.container.querySelector('.quiz-result'));
    this.onFinish(this.score, this.questions.length, this.picks.slice());
    this.prevBest = Math.max(this.prevBest, this.score);
  };

  Quiz.prototype.restart = function () {
    this.index = 0;
    this.picks = [];
    this.score = 0;
    this.answered = false;
    this.done = false;
    this.questions = this.questions.map(shuffleQuestion);
    this.render();
    reveal(this.container.querySelector('.quiz-card'));
  };

  Quiz.prototype.paintChoices = function () {
    const q = this.current();
    const picked = this.picks[this.index];
    const nodes = this.container.querySelectorAll('[data-opt]');
    nodes.forEach(function (node) {
      const i = parseInt(node.getAttribute('data-opt'), 10);
      node.classList.add('is-locked');
      if (i === q.answer) node.classList.add('is-correct');
      if (i === picked && i !== q.answer) node.classList.add('is-wrong');
      node.setAttribute('aria-disabled', 'true');
    });
  };

  Quiz.prototype.renderFeedback = function () {
    const q = this.current();
    const picked = this.picks[this.index];
    const ok = picked === q.answer;
    const box = this.container.querySelector('.q-feedback');
    if (!box) return;
    box.hidden = false;
    box.className = 'q-feedback ' + (ok ? 'good' : 'bad');
    box.innerHTML =
      '<div class="fb-top">' +
      '<span class="fb-icon">' + (ok ? '✓' : '✕') + '</span>' +
      '<strong>' + (ok ? 'إجابة صحيحة' : 'ليست الإجابة الصحيحة') + '</strong>' +
      (q.tag ? '<span class="fb-tag">' + Render.esc(q.tag) + '</span>' : '') +
      '</div>' +
      '<p>' + Render.esc(q.explain) + '</p>';
  };

  Quiz.prototype.render = function () {
    const q = this.current();
    const total = this.questions.length;
    const n = this.index + 1;

    let html = '';
    html += '<div class="quiz-card' + (this.mode === 'exam' ? ' quiz-exam' : '') + '">';
    html += '<div class="quiz-top">';
    html += '<div class="quiz-count"><span class="quiz-n">' + n + '</span><span class="quiz-of">من ' + total + '</span></div>';
    html += '<div class="quiz-dots" aria-hidden="true">';
    for (let i = 0; i < total; i++) {
      let cls = 'qdot';
      if (i === this.index) cls += ' is-now';
      else if (this.picks[i] !== undefined) cls += this.picks[i] === this.questions[i].answer ? ' is-ok' : ' is-bad';
      html += '<span class="' + cls + '"></span>';
    }
    html += '</div>';
    html += '<span class="quiz-score" title="الإجابات الصحيحة حتى الآن">✓ ' + this.score + '</span>';
    html += q.tag ? '<span class="quiz-tag">' + Render.esc(q.tag) + '</span>' : '';
    html += '</div>';

    html += '<div class="quiz-body" tabindex="0">';
    html += '<p class="q-text">' + Render.esc(q.q) + '</p>';
    if (q.code) {
      html += '<pre class="q-code"><code>' + Render.highlightPython(q.code) + '</code></pre>';
    }
    html += '<div class="q-options" role="group" aria-label="خيارات الإجابة">';
    q.options.forEach(function (opt, i) {
      html += '<button type="button" class="q-opt" data-opt="' + i + '">' +
        '<span class="opt-letter">' + LETTERS[i] + '</span>' +
        '<span class="opt-text">' + Render.esc(opt) + '</span>' +
        '<span class="opt-mark" aria-hidden="true"></span></button>';
    });
    html += '</div>';
    html += '<div class="q-feedback" hidden></div>';
    html += '</div>';

    html += '<div class="quiz-foot">';
    html += '<span class="quiz-hint">اختر إجابة واحدة · استخدم أرقام لوحة المفاتيح</span>';
    html += '<button type="button" class="btn btn-primary" data-next hidden>' + (n === total ? 'عرض النتيجة' : 'السؤال التالي') + '</button>';
    html += '</div>';
    html += '</div>';

    this.container.innerHTML = html;
  };

  Quiz.prototype.renderResult = function () {
    const total = this.questions.length;
    const score = this.score;
    const pct = Math.round((score / total) * 100);
    let verdict = 'أعد الدرس ثم حاول مرة أخرى';
    let sub = 'الفهم يحتاج جولة ثانية — وهذا طبيعي.';
    if (pct === 100) {
      verdict = 'إتقان كامل';
      sub = this.mode === 'exam'
        ? 'أجبت على كل الأسئلة بشكل صحيح. هذه أفضل نتيجة ممكنة في الاختبار الشامل.'
        : 'أجبت على كل الأسئلة بشكل صحيح. انتقل للتحدي العملي التالي.';
    } else if (pct >= 80) {
      verdict = 'فهم قوي';
      sub = 'أساسك متين. راجع الأسئلة التي أخطأت فيها لتثبيت الفكرة.';
    } else if (pct >= 60) {
      verdict = 'أساس جيد';
      sub = 'اجتزت الحد الأدنى. الأخطاء هنا هي أهم مادة للمراجعة.';
    }

    const wrong = [];
    this.questions.forEach(function (q, i) {
      if (this.picks[i] !== q.answer) {
        wrong.push({ q: q, pick: this.picks[i], i: i });
      }
    }, this);

    let html = '';
    html += '<div class="quiz-result' + (this.mode === 'exam' ? ' quiz-result-exam' : '') + '">';
    html += '<div class="result-hero">';
    html += Render.progressRing(pct, 118, 9);
    html += '<div class="result-copy"><span class="result-kicker">' +
      (this.mode === 'exam' ? 'نتيجة الاختبار الشامل' : 'نتيجة الاختبار') + '</span>';
    html += '<h3>' + verdict + '</h3><p>' + sub + '</p>';
    html += '<p class="result-score">' + score + ' من ' + total + ' إجابة صحيحة</p>';
    html += '</div></div>';

    if (window.Gamify) html += Gamify.rewardHTML(score, total, this.mode, this.prevBest);

    if (this.mode === 'exam') {
      const byTopic = {};
      this.questions.forEach(function (q, i) {
        const key = q.lessonId || 'other';
        if (!byTopic[key]) byTopic[key] = { ok: 0, total: 0 };
        byTopic[key].total += 1;
        if (this.picks[i] === q.answer) byTopic[key].ok += 1;
      }, this);
      html += '<div class="topic-grid">';
      const topicOrder = Object.keys(this.lessonTitles).filter(function (key) {
        return byTopic[key];
      });
      Object.keys(byTopic).forEach(function (key) {
        if (topicOrder.indexOf(key) === -1) topicOrder.push(key);
      });
      topicOrder.forEach(function (key) {
        const t = byTopic[key];
        const p = Math.round((t.ok / t.total) * 100);
        const cls = p >= 80 ? 'ok' : p >= 50 ? 'mid' : 'low';
        html += '<div class="topic-row ' + cls + '"><span class="topic-name">' +
          Render.esc(this.lessonTitles[key] || key) + '</span>' +
          '<span class="topic-bar"><i style="width:' + p + '%"></i></span>' +
          '<span class="topic-num">' + t.ok + '/' + t.total + '</span></div>';
      }, this);
      html += '</div>';
    }

    if (wrong.length) {
      html += '<div class="review"><h4>مراجعة الأخطاء <span>(' + wrong.length + ')</span></h4>';
      wrong.forEach(function (w) {
        html += '<details class="review-item"><summary>' +
          '<span class="ri-num">' + (w.i + 1) + '</span>' +
          '<span class="ri-q">' + Render.esc(w.q.q) + '</span>' +
          '<span class="ri-badge">راجع</span></summary>';
        html += '<div class="ri-body">';
        if (w.q.code) html += '<pre class="q-code"><code>' + Render.highlightPython(w.q.code) + '</code></pre>';
        html += '<p class="ri-wrong"><strong>إجابتك:</strong> ' + Render.esc(w.q.options[w.pick] || 'لم تُجب') + '</p>';
        html += '<p class="ri-right"><strong>الصحيح:</strong> ' + Render.esc(w.q.options[w.q.answer]) + '</p>';
        html += '<p class="ri-exp">' + Render.esc(w.q.explain) + '</p>';
        html += '</div></details>';
      });
      html += '</div>';
    } else if (this.mode === 'exam') {
      html += '<p class="perfect-note">لا أخطاء للمراجعة. أنهيت الاختبار الشامل بعلامة كاملة — راجع ورقة المقارنات لتثبيت الفروق.</p>';
    } else {
      html += '<p class="perfect-note">لا أخطاء للمراجعة. جرّب الاختبار الشامل لتحدٍّ أوسع.</p>';
    }

    html += '<div class="result-actions">';
    html += '<button type="button" class="btn btn-primary" data-retry>إعادة المحاولة</button>';
    if (this.mode === 'lesson') {
      html += '<a class="btn btn-ghost" href="#/exam">إلى الاختبار الشامل</a>';
    } else {
      html += '<a class="btn btn-ghost" href="#/cheatsheet">مراجعة المقارنات</a>';
    }
    html += '</div></div>';

    this.container.innerHTML = html;
  };

  return Quiz;
})();
