/* ============================================================
   py.js — محرّك بايثون حقيقي داخل المتصفح (Pyodide + pandas)
   لا شيء يُرسل إلى أي خادم: كل الكود يُنفَّذ على جهازك.
   ============================================================ */
window.PyLab = (function () {
  'use strict';

  const VERSION = 'v0.27.2';
  const BASE = 'https://cdn.jsdelivr.net/pyodide/' + VERSION + '/full/';

  let pyodide = null;
  let loadingPromise = null;
  let ready = false;
  let statusHandler = null;
  let status = 'idle';
  let lastError = null;

  function setStatus(next, message) {
    status = next;
    if (typeof statusHandler === 'function') statusHandler(next, message || '');
  }

  const PY_SETUP = [
    'import json as _json',
    'import sys as _sys',
    'import io as _io',
    'import ast as _ast',
    'import traceback as _tb',
    'import pandas as _pd',
    '',
    '_pdx_ns = {"pd": _pd, "__name__": "__main__"}',
    '',
    'def _pdx_reset():',
    '    global _pdx_ns',
    '    _pdx_ns = {"pd": _pd, "__name__": "__main__"}',
    '    return True',
    '',
    'def _pdx_cell(v):',
    '    if v is None:',
    '        return None',
    '    try:',
    '        miss = _pd.isna(v)',
    '        if isinstance(miss, bool) and miss:',
    '            return None',
    '    except (TypeError, ValueError):',
    '        pass',
    '    if isinstance(v, bool):',
    '        return bool(v)',
    '    if isinstance(v, (int, float, str)):',
    '        return v',
    '    return str(v)',
    '',
    'def _pdx_render(val):',
    '    try:',
    '        if isinstance(val, _pd.DataFrame):',
    '            return {',
    '                "kind": "df",',
    '                "columns": [str(c) for c in val.columns],',
    '                "index": [str(i) for i in val.index],',
    '                "rows": [[_pdx_cell(v) for v in row] for row in val.itertuples(index=False, name=None)],',
    '                "shape": [int(val.shape[0]), int(val.shape[1])],',
    '                "dtypes": [str(t) for t in val.dtypes]',
    '            }',
    '        if isinstance(val, _pd.Series):',
    '            return {',
    '                "kind": "series",',
    '                "name": "" if val.name is None else str(val.name),',
    '                "index": [str(i) for i in val.index],',
    '                "values": [_pdx_cell(v) for v in val.tolist()],',
    '                "dtype": str(val.dtype)',
    '            }',
    '    except Exception:',
    '        pass',
    '    try:',
    '        if hasattr(val, "item"):',
    '            val = val.item()',
    '    except Exception:',
    '        pass',
    '    return {"kind": "repr", "text": repr(val), "type": type(val).__name__}',
    '',
    'def _pdx_exec(code, ns):',
    '    tree = _ast.parse(code, "<cell>", "exec")',
    '    tail = None',
    '    if len(tree.body) > 0 and isinstance(tree.body[-1], _ast.Expr):',
    '        tail = _ast.Expression(tree.body.pop().value)',
    '    exec(compile(tree, "<cell>", "exec"), ns)',
    '    if tail is not None:',
    '        return eval(compile(tail, "<cell>", "eval"), ns)',
    '    return None',
    '',
    'def _pdx_run(code):',
    '    buf = _io.StringIO()',
    '    old = _sys.stdout',
    '    _sys.stdout = buf',
    '    err = None',
    '    result = None',
    '    try:',
    '        result = _pdx_exec(code, _pdx_ns)',
    '    except Exception:',
    '        err = _tb.format_exc(limit=4)',
    '    finally:',
    '        _sys.stdout = old',
    '    rendered = None',
    '    if result is not None:',
    '        try:',
    '            rendered = _pdx_render(result)',
    '        except Exception:',
    '            rendered = {"kind": "repr", "text": str(result), "type": type(result).__name__}',
    '    return _json.dumps({"stdout": buf.getvalue(), "result": rendered, "error": err})',
    '',
    'def _pdx_run_fresh(setup, code, tests_json):',
    '    ns = {"pd": _pd, "__name__": "__main__"}',
    '    tests = _json.loads(tests_json)',
    '    buf = _io.StringIO()',
    '    old = _sys.stdout',
    '    _sys.stdout = buf',
    '    err = None',
    '    result = None',
    '    try:',
    '        exec(compile(setup, "<setup>", "exec"), ns)',
    '        result = _pdx_exec(code, ns)',
    '    except Exception:',
    '        err = _tb.format_exc(limit=4)',
    '    finally:',
    '        _sys.stdout = old',
    '    checks = []',
    '    for item in tests:',
    '        label = item[0]',
    '        expr = item[1]',
    '        if err:',
    '            checks.append({"label": label, "ok": False, "msg": "لم يُتحقق بسبب خطأ في الكود"})',
    '            continue',
    '        try:',
    '            ok = bool(eval(expr, ns))',
    '            checks.append({"label": label, "ok": ok, "msg": "" if ok else "الشرط لم يتحقق"})',
    '        except Exception as e:',
    '            checks.append({"label": label, "ok": False, "msg": "تعذّر التقييم: " + str(e)})',
    '    rendered = None',
    '    if result is not None:',
    '        try:',
    '            rendered = _pdx_render(result)',
    '        except Exception:',
    '            rendered = None',
    '    return _json.dumps({',
    '        "stdout": buf.getvalue(),',
    '        "result": rendered,',
    '        "error": err,',
    '        "checks": checks',
    '    })',
    '',
    'def _pdx_version():',
    '    return str(_pd.__version__)'
  ].join('\n');

  function load() {
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async function () {
      setStatus('loading', 'جارٍ تحميل محرّك بايثون…');
      if (typeof window.loadPyodide !== 'function') {
        await new Promise(function (resolve, reject) {
          const s = document.createElement('script');
          s.src = BASE + 'pyodide.js';
          s.onload = resolve;
          s.onerror = function () {
            reject(new Error('تعذّر تحميل Pyodide من الشبكة'));
          };
          document.head.appendChild(s);
        });
      }
      setStatus('loading', 'جارٍ تشغيل بايثون…');
      pyodide = await window.loadPyodide({ indexURL: BASE });
      setStatus('loading', 'جارٍ تحميل pandas… (قد يستغرق بعض الوقت في أول مرة)');
      await pyodide.loadPackage('pandas');
      pyodide.runPython(PY_SETUP);
      ready = true;
      setStatus('ready', 'بايثون ' + pyodide.runPython('_sys.version.split()[0]') + ' · pandas ' + pyodide.runPython('_pdx_version()'));
      return pyodide;
    })();

    loadingPromise.catch(function (err) {
      lastError = err;
      setStatus('error', err && err.message ? err.message : 'تعذّر تشغيل محرّك بايثون');
    });

    return loadingPromise;
  }

  function isReady() {
    return ready;
  }

  function getStatus() {
    return { status: status, ready: ready, error: lastError };
  }

  function onStatus(fn) {
    statusHandler = fn;
    if (status !== 'idle') fn(status, '');
  }

  async function run(code) {
    await load();
    const fn = pyodide.globals.get('_pdx_run');
    try {
      const raw = fn(code);
      return JSON.parse(raw);
    } finally {
      if (fn && fn.destroy) fn.destroy();
    }
  }

  async function runExercise(setup, code, tests) {
    await load();
    const fn = pyodide.globals.get('_pdx_run_fresh');
    try {
      const raw = fn(setup, code, JSON.stringify(tests));
      return JSON.parse(raw);
    } finally {
      if (fn && fn.destroy) fn.destroy();
    }
  }

  async function reset() {
    if (!ready) return;
    pyodide.runPython('_pdx_reset()');
  }

  function friendlyError(text) {
    if (!text) return '';
    const last = text.trim().split('\n').filter(function (l) { return l.trim(); }).pop();
    return last || text;
  }

  return {
    load: load,
    run: run,
    runExercise: runExercise,
    reset: reset,
    isReady: isReady,
    getStatus: getStatus,
    onStatus: onStatus,
    friendlyError: friendlyError,
    BASE: BASE
  };
})();
