/* ============================================================
   progress.js — حفظ التقدم محليًا (localStorage)
   ============================================================ */
window.Progress = (function () {
  'use strict';

  const KEY = 'pdx-progress-v1';
  const EX_KEY = 'pdx-ex-code-';

  const empty = {
    read: {},
    quiz: {},
    exercises: {},
    exam: { best: 0, total: 0, attempts: 0, at: null },
    theme: null
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(empty));
      const parsed = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(empty)), parsed, {
        read: parsed.read || {},
        quiz: parsed.quiz || {},
        exercises: parsed.exercises || {},
        exam: Object.assign({ best: 0, total: 0, attempts: 0, at: null }, parsed.exam || {})
      });
    } catch (e) {
      return JSON.parse(JSON.stringify(empty));
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* التخزين قد يكون معطّلًا — الموقع يبقى صالحًا للاستخدام */
    }
  }

  function markRead(id) {
    state.read[id] = true;
    save();
  }

  function isRead(id) {
    return !!state.read[id];
  }

  function saveQuiz(lessonId, score, total) {
    const prev = state.quiz[lessonId] || { best: 0, total: total, attempts: 0 };
    state.quiz[lessonId] = {
      best: Math.max(prev.best, score),
      total: total,
      attempts: (prev.attempts || 0) + 1,
      last: score,
      at: Date.now()
    };
    save();
  }

  function quizInfo(lessonId) {
    return state.quiz[lessonId] || null;
  }

  function isQuizPassed(lessonId) {
    const q = state.quiz[lessonId];
    return !!q && q.total > 0 && q.best / q.total >= 0.6;
  }

  function isLessonDone(lessonId) {
    return isRead(lessonId) || isQuizPassed(lessonId);
  }

  function markExercise(id) {
    state.exercises[id] = true;
    save();
  }

  function isExerciseDone(id) {
    return !!state.exercises[id];
  }

  function saveExam(score, total) {
    state.exam = {
      best: Math.max(state.exam.best, score),
      total: total,
      attempts: (state.exam.attempts || 0) + 1,
      last: score,
      at: Date.now()
    };
    save();
  }

  function saveDraft(id, code) {
    try {
      sessionStorage.setItem(EX_KEY + id, code);
    } catch (e) {}
  }

  function getDraft(id) {
    try {
      return sessionStorage.getItem(EX_KEY + id);
    } catch (e) {
      return null;
    }
  }

  function setTheme(v) {
    state.theme = v;
    save();
  }

  function getTheme() {
    return state.theme;
  }

  function completedCount(lessons) {
    return lessons.filter(function (l) { return isLessonDone(l.id); }).length;
  }

  function overall(lessons) {
    const done = completedCount(lessons);
    const total = lessons.length || 1;
    return {
      done: done,
      total: lessons.length,
      pct: Math.round((done / total) * 100),
      quizzes: Object.keys(state.quiz).length,
      exercises: Object.keys(state.exercises).length,
      examBest: state.exam.best,
      examTotal: state.exam.total
    };
  }

  function reset() {
    state = JSON.parse(JSON.stringify(empty));
    save();
  }

  return {
    markRead: markRead,
    isRead: isRead,
    saveQuiz: saveQuiz,
    quizInfo: quizInfo,
    isQuizPassed: isQuizPassed,
    isLessonDone: isLessonDone,
    markExercise: markExercise,
    isExerciseDone: isExerciseDone,
    saveExam: saveExam,
    saveDraft: saveDraft,
    getDraft: getDraft,
    setTheme: setTheme,
    getTheme: getTheme,
    overall: overall,
    reset: reset,
    state: function () { return state; }
  };
})();
