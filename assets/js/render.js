/* ============================================================
   render.js — تحويل بيانات الدروس إلى HTML
   ============================================================ */
window.Render = (function () {
  'use strict';

  /* ---------------------------------------------------------- escape */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------------------------------------------------------- icons */
  const ICONS = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3l9.4-9.4a4 4 0 0 0-2-2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
    table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 3"/><path d="M17 6h3a3 3 0 0 1-3 3"/></svg>',
    panda: '<svg viewBox="0 0 140 152" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="70" cy="145" rx="38" ry="5.5" fill="#191b2e" opacity=".13"/>' +
      '<ellipse cx="70" cy="106" rx="37" ry="34" fill="#fffdf7" stroke="#191b2e" stroke-width="3"/>' +
      '<ellipse cx="34" cy="111" rx="10.5" ry="22" transform="rotate(16 34 111)" fill="#191b2e"/>' +
      '<ellipse cx="106" cy="111" rx="10.5" ry="22" transform="rotate(-16 106 111)" fill="#191b2e"/>' +
      '<ellipse cx="54" cy="135" rx="12" ry="6.5" fill="#191b2e"/>' +
      '<ellipse cx="86" cy="135" rx="12" ry="6.5" fill="#191b2e"/>' +
      '<circle cx="29" cy="34" r="16" fill="#191b2e"/>' +
      '<circle cx="111" cy="34" r="16" fill="#191b2e"/>' +
      '<circle cx="70" cy="55" r="42" fill="#fffdf7" stroke="#191b2e" stroke-width="3"/>' +
      '<ellipse cx="54" cy="51" rx="12" ry="15" transform="rotate(-16 54 51)" fill="#191b2e"/>' +
      '<ellipse cx="86" cy="51" rx="12" ry="15" transform="rotate(16 86 51)" fill="#191b2e"/>' +
      '<circle cx="57" cy="49" r="4" fill="#fffdf7"/><circle cx="83" cy="49" r="4" fill="#fffdf7"/>' +
      '<circle cx="58" cy="50" r="2" fill="#191b2e"/><circle cx="82" cy="50" r="2" fill="#191b2e"/>' +
      '<ellipse cx="70" cy="67" rx="6" ry="4.2" fill="#191b2e"/>' +
      '<path d="M70 71.4v4.2m0 0c-2.8 0-4.8 1.4-5.8 3.4m5.8-3.4c2.8 0 4.8 1.4 5.8 3.4" stroke="#191b2e" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="39" cy="68" r="5" fill="#ff8fb1" opacity=".55"/><circle cx="101" cy="68" r="5" fill="#ff8fb1" opacity=".55"/>' +
      '<g transform="translate(48 96)">' +
      '<rect width="44" height="32" rx="5" fill="#fffdf7" stroke="#191b2e" stroke-width="2.6"/>' +
      '<rect x="8" y="17" width="5" height="9" rx="1.5" fill="#5b4bff"/>' +
      '<rect x="17" y="12" width="5" height="14" rx="1.5" fill="#0b8d72"/>' +
      '<rect x="26" y="7" width="5" height="19" rx="1.5" fill="#ffc531"/>' +
      '<path d="M34 18.5l3.4 3.2 5.2-7.2" stroke="#f2545b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</g>' +
      '</svg>'
  };

  /* ---------------------------------------------------------- python highlight */
  const KEYWORDS = new Set(
    ('import as from if elif else for while in not and or is None True False def return ' +
      'lambda with try except finally pass raise class del yield global assert break continue ' +
      'nonlocal async await').split(' ')
  );
  const BUILTINS = new Set(
    ('print len range str int float bool list dict set tuple type isinstance abs sum min max ' +
      'round enumerate sorted zip open map filter repr format hasattr getattr').split(' ')
  );

  function highlightPython(code) {
    let out = '';
    const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_])/g;
    let m;
    let prevSignificant = '';
    while ((m = re.exec(code)) !== null) {
      if (m[1]) {
        out += '<span class="tok-cm">' + esc(m[1]) + '</span>';
      } else if (m[2]) {
        out += '<span class="tok-str">' + esc(m[2]) + '</span>';
      } else if (m[3]) {
        out += '<span class="tok-num">' + esc(m[3]) + '</span>';
      } else if (m[4]) {
        const word = m[4];
        const rest = code.slice(re.lastIndex);
        const isCall = /^\s*\(/.test(rest);
        let cls = 'tok-var';
        if (KEYWORDS.has(word)) cls = 'tok-kw';
        else if (prevSignificant === '.') cls = 'tok-attr';
        else if (BUILTINS.has(word)) cls = 'tok-bi';
        else if (isCall) cls = 'tok-fn';
        else if (/^[A-Z]/.test(word)) cls = 'tok-cls';
        out += '<span class="' + cls + '">' + esc(word) + '</span>';
      } else if (m[5]) {
        out += m[5];
      } else if (m[6]) {
        const ch = m[6];
        if (/[+\-*/%=<>!&|^~]/.test(ch)) out += '<span class="tok-op">' + esc(ch) + '</span>';
        else out += esc(ch);
      }
      const last = m[0];
      if (!/^\s+$/.test(last)) prevSignificant = last.slice(-1);
    }
    return out;
  }

  /* ---------------------------------------------------------- outputs */
  function fmt(v) {
    if (v === null || v === undefined) return '<span class="nan">NaN</span>';
    if (typeof v === 'boolean') return '<span class="bool">' + (v ? 'True' : 'False') + '</span>';
    if (typeof v === 'number') {
      const s = Number.isInteger(v) ? String(v) : String(Number(v.toFixed(6)));
      return '<span class="num">' + esc(s) + '</span>';
    }
    return esc(v);
  }

  function dfTable(o) {
    let html = '<div class="dataframe-wrap"><div class="df-scroll"><table class="df-table">';
    html += '<thead><tr><th class="idx-head">index</th>';
    o.columns.forEach(function (c) {
      html += '<th>' + esc(c) + '</th>';
    });
    html += '</tr></thead><tbody>';
    for (let i = 0; i < o.rows.length; i++) {
      html += '<tr><th class="idx-cell">' + esc(o.index[i]) + '</th>';
      o.rows[i].forEach(function (v) {
        html += '<td>' + fmt(v) + '</td>';
      });
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    html += '<div class="df-meta">DataFrame · ' + o.rows.length + ' صفوف × ' + o.columns.length + ' أعمدة</div></div>';
    return html;
  }

  function seriesTable(o) {
    let html = '<div class="dataframe-wrap"><div class="df-scroll"><table class="df-table df-series">';
    html += '<thead><tr><th class="idx-head">index</th><th>' + esc(o.name || 'value') + '</th></tr></thead><tbody>';
    for (let i = 0; i < o.values.length; i++) {
      html += '<tr><th class="idx-cell">' + esc(o.index[i]) + '</th><td>' + fmt(o.values[i]) + '</td></tr>';
    }
    html += '</tbody></table></div><div class="df-meta">Series · dtype: ' + esc(o.dtype) + '</div></div>';
    return html;
  }

  function renderOutput(o) {
    if (!o) return '';
    if (o.type === 'df') return dfTable(o);
    if (o.type === 'series') return seriesTable(o);
    if (o.type === 'text') return '<pre class="term">' + esc(o.text) + '</pre>';
    return '<pre class="term">' + esc(String(o)) + '</pre>';
  }

  /** يحوّل ناتج Pyodide الحقيقي إلى نفس الشكل */
  function fromLive(r) {
    if (!r) return '';
    if (r.kind === 'df') {
      return dfTable({ columns: r.columns, index: r.index, rows: r.rows });
    }
    if (r.kind === 'series') {
      return seriesTable({ name: r.name, values: r.values, index: r.index, dtype: r.dtype });
    }
    if (r.kind === 'repr') {
      return '<pre class="term">' + esc(r.text) + '</pre>';
    }
    return '';
  }

  /* ---------------------------------------------------------- code block */
  let codeSeq = 0;
  function codeShell(code, opts) {
    opts = opts || {};
    const id = 'code-' + ++codeSeq;
    let html = '<div class="code-shell" data-code-id="' + id + '"' +
      (opts.setup ? ' data-setup="' + esc(opts.setup) + '"' : '') + '>';
    html += '<div class="code-top"><div class="code-dots"><i></i><i></i><i></i></div>';
    html += '<span class="code-lang">' + (opts.lang || 'Python') + '</span>';
    if (opts.label) html += '<span class="code-label">' + esc(opts.label) + '</span>';
    html += '<div class="code-tools">';
    html += '<button class="mini-btn" type="button" data-copy title="نسخ الكود">' + ICONS.copy + '<span>نسخ</span></button>';
    if (opts.runnable !== false) {
      html += '<button class="mini-btn mini-run" type="button" data-run>' + ICONS.play + '<span>شغّل</span></button>';
    }
    html += '</div></div>';
    html += '<pre class="code-body"><code>' + highlightPython(code) + '</code></pre>';
    if (opts.output) {
      html += '<div class="output-panel"><div class="output-head"><span>الناتج</span><span class="out-hint">متوقّع</span></div>' + renderOutput(opts.output) + '</div>';
    }
    html += '<div class="live-slot" hidden></div>';
    if (opts.caption) html += '<p class="caption">' + esc(opts.caption) + '</p>';
    html += '</div>';
    return html;
  }

  /* ---------------------------------------------------------- section */
  function blockHead(kicker, title, icon) {
    return (
      '<div class="block-head">' +
      '<span class="kicker">' + (icon || '') + esc(kicker) + '</span>' +
      (title ? '<h2 class="block-title">' + esc(title) + '</h2>' : '') +
      '</div>'
    );
  }

  function section(s, lessonId, idx) {
    const sid = 's-' + lessonId + '-' + idx;
    if (s.type === 'lead') {
      return '<p class="lesson-lead">' + esc(s.text) + '</p>';
    }

    if (s.type === 'concept') {
      let html = '<section class="block block-concept" id="' + sid + '">';
      html += blockHead('المفهوم', s.title, ICONS.layers);
      html += '<p class="block-body">' + esc(s.body) + '</p>';
      if (s.points && s.points.length) {
        html += '<ul class="points">';
        s.points.forEach(function (p) {
          html += '<li>' + esc(p) + '</li>';
        });
        html += '</ul>';
      }
      if (s.code) html += codeShell(s.code, {
        output: s.output,
        caption: s.caption,
        setup: s.setup,
        runnable: s.noRun ? false : undefined
      });
      html += '</section>';
      return html;
    }

    if (s.type === 'code') {
      let html = '<section class="block block-code" id="' + sid + '">';
      html += '<div class="block-head"><span class="kicker">' + ICONS.code + 'كود</span>';
      if (s.title) html += '<h2 class="block-title">' + esc(s.title) + '</h2>';
      html += '</div>';
      html += codeShell(s.code, {
        output: s.output,
        caption: s.caption,
        setup: s.setup,
        runnable: s.noRun ? false : undefined
      });
      html += '</section>';
      return html;
    }

    if (s.type === 'note') {
      const toneMap = {
        tip: { icon: ICONS.bulb, label: 'نصيحة عملية' },
        info: { icon: ICONS.spark, label: 'معلومة' },
        warn: { icon: ICONS.alert, label: 'انتبه' },
        success: { icon: ICONS.check, label: 'تأكيد' }
      };
      const t = toneMap[s.tone] || toneMap.info;
      return (
        '<aside class="block note note-' + s.tone + '" id="' + sid + '">' +
        '<div class="note-icon">' + t.icon + '</div>' +
        '<div class="note-content"><span class="note-label">' + t.label + ' · ' + esc(s.title) + '</span>' +
        '<p>' + esc(s.body) + '</p></div></aside>'
      );
    }

    if (s.type === 'compare') {
      let html = '<section class="block block-compare" id="' + sid + '">';
      html += blockHead('مقارنة', s.title, ICONS.table);
      html += '<div class="cmp-scroll"><table class="cmp-table"><thead><tr>';
      s.head.forEach(function (h, i) {
        html += '<th' + (i === 0 ? ' class="cmp-rowhead"' : '') + '>' + esc(h) + '</th>';
      });
      html += '</tr></thead><tbody>';
      s.rows.forEach(function (row) {
        html += '<tr>';
        row.forEach(function (cell, i) {
          html += i === 0
            ? '<th scope="row" class="cmp-rowhead">' + esc(cell) + '</th>'
            : '<td>' + esc(cell) + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      if (s.verdict) html += '<p class="verdict">' + esc(s.verdict) + '</p>';
      html += '</section>';
      return html;
    }

    if (s.type === 'pitfall') {
      let html = '<section class="block block-pitfall" id="' + sid + '">';
      html += blockHead('خطأ شائع', s.title, ICONS.alert);
      html += '<p class="block-body">' + esc(s.body) + '</p>';
      html += '<div class="pair">';
      html += '<div class="pair-col pair-wrong"><div class="pair-label">✕ خطأ</div><pre><code>' + highlightPython(s.wrong) + '</code></pre></div>';
      html += '<div class="pair-col pair-right"><div class="pair-label">✓ صحيح</div><pre><code>' + highlightPython(s.right) + '</code></pre></div>';
      html += '</div></section>';
      return html;
    }

    if (s.type === 'under') {
      let html = '<section class="block block-under" id="' + sid + '">';
      html += blockHead('تحت الغطاء', s.title, ICONS.spark);
      html += '<p class="block-body">' + esc(s.body) + '</p>';
      if (s.points && s.points.length) {
        html += '<ul class="points points-muted">';
        s.points.forEach(function (p) { html += '<li>' + esc(p) + '</li>'; });
        html += '</ul>';
      }
      if (s.code) html += codeShell(s.code, {
        output: s.output,
        caption: s.caption,
        setup: s.setup,
        runnable: s.noRun ? false : undefined
      });
      html += '</section>';
      return html;
    }

    if (s.type === 'steps') {
      let html = '<section class="block block-steps" id="' + sid + '">';
      html += blockHead('خطوات', s.title, ICONS.layers);
      html += '<ol class="steps">';
      s.items.forEach(function (it) {
        html += '<li><span class="step-title">' + esc(it.t) + '</span><span class="step-desc">' + esc(it.d) + '</span></li>';
      });
      html += '</ol></section>';
      return html;
    }

    if (s.type === 'checklist') {
      let html = '<section class="block block-checklist" id="' + sid + '">';
      html += blockHead('خلاصة', s.title, ICONS.check);
      html += '<ul class="checklist">';
      s.items.forEach(function (it) {
        html += '<li><span class="chk">' + ICONS.check + '</span><span>' + esc(it) + '</span></li>';
      });
      html += '</ul></section>';
      return html;
    }

    if (s.type === 'exercise') {
      return '<div data-exercise="' + esc(s.id) + '"></div>';
    }

    return '';
  }

  /* ---------------------------------------------------------- exercise */
  function exercise(ex, index) {
    const id = ex.id;
    return (
      '<section class="block block-exercise" id="' + id + '">' +
      '<div class="ex-head"><span class="kicker">' + ICONS.target + 'تمرين ' + index + '</span>' +
      '<h2 class="block-title">' + esc(ex.title) + '</h2>' +
      '<span class="ex-xp" title="مكافأة إنجاز التمرين">+' + (window.Gamify ? window.Gamify.exerciseXP : 40) + ' XP</span></div>' +
      '<p class="ex-prompt">' + esc(ex.prompt) + '</p>' +
      '<div class="editor-shell">' +
      '<div class="editor-top"><span class="editor-lang">Python</span>' +
      '<div class="editor-tools">' +
      '<button class="ghost-btn" type="button" data-ex-hint>تلميح</button>' +
      '<button class="ghost-btn" type="button" data-ex-solution>الحل</button>' +
      '<button class="mini-btn mini-run" type="button" data-ex-run>' + ICONS.play + '<span>تحقق</span></button>' +
      '</div></div>' +
      '<textarea class="code-editor" spellcheck="false" dir="ltr" aria-label="محرر الكود">' + esc(ex.starter) + '</textarea>' +
      '</div>' +
      '<div class="ex-hint" hidden><strong>تلميح:</strong> ' + esc(ex.hint) + '</div>' +
      '<div class="ex-result" hidden></div>' +
      '<div class="ex-checks"><span class="ex-checks-title">معايير النجاح</span><ul>' +
      ex.tests.map(function (t) {
        return '<li data-check="' + esc(t[0]) + '"><span class="chk-dot"></span>' + esc(t[0]) + '</li>';
      }).join('') +
      '</ul></div>' +
      '</section>'
    );
  }

  /* ---------------------------------------------------------- roadmap bits */
  function progressRing(pct, size, stroke) {
    size = size || 54;
    stroke = stroke || 4;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c - (pct / 100) * c;
    return (
      '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle class="ring-bg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
      '<circle class="ring-fg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      '<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" class="ring-text">' + Math.round(pct) + '%</text>' +
      '</svg>'
    );
  }

  return {
    esc: esc,
    ICONS: ICONS,
    highlightPython: highlightPython,
    renderOutput: renderOutput,
    fromLive: fromLive,
    codeShell: codeShell,
    section: section,
    exercise: exercise,
    progressRing: progressRing,
    fmt: fmt
  };
})();
