/* ============================================================
   dataset.js — البيانات المشتركة وأدوات بناء النتائج
   كل الأمثلة في الموقع تستخدم نفس مجموعة البيانات حتى ترى
   نفس الأرقام في كل درس (وهذا مقصود: التكرار يبني الفهم).
   ============================================================ */
window.PDX = window.PDX || {};

window.PDX.data = (function () {
  'use strict';

  const COLUMNS = ['Name', 'Age', 'Mark'];

  const ROWS = [
    ['Ali', 7, 'A'],
    ['Sahra', 8, 'A'],
    ['Ahmad', 14, 'B'],
    ['Mouhammed', 20, 'A'],
    ['Ali', 7, 'A'],
    ['Sahra', 6, 'D'],
    ['Ali', 11, 'A']
  ];

  /** جدول بمؤشر افتراضي 0..n-1 */
  function D(rows, columns) {
    const cols = columns || COLUMNS;
    return {
      type: 'df',
      columns: cols,
      index: rows.map((_, i) => i),
      rows: rows
    };
  }

  /** جدول بمؤشر مخصّص (بعد فلترة أو حذف مثلًا) */
  function DI(rows, columns, index) {
    return { type: 'df', columns: columns || COLUMNS, index: index, rows: rows };
  }

  /** Series: عمود واحد */
  function S(name, values, index, dtype) {
    return {
      type: 'series',
      name: name,
      values: values,
      index: index || values.map((_, i) => i),
      dtype: dtype || 'int64'
    };
  }

  /** مخرجات نصية (print / repr) */
  function T(text) {
    return { type: 'text', text: String(text) };
  }

  /** جدول إحصاءات (describe) */
  function STATS(columns, index, rows) {
    return { type: 'df', columns: columns, index: index, rows: rows };
  }

  const STUDENTS = {
    python: [
      'di = {"Name": ["Ali", "Sahra", "Ahmad", "Mouhammed", "Ali", "Sahra", "Ali"],',
      '      "Age": [7, 8, 14, 20, 7, 6, 11],',
      '      "Mark": ["A", "A", "B", "A", "A", "D", "A"]}'
    ].join('\n')
  };

  const SNIPPETS = [
    {
      label: 'البيانات الأساسية',
      code:
        'import pandas as pd\n\n' +
        'di = {"Name": ["Ali", "Sahra", "Ahmad", "Mouhammed", "Ali", "Sahra", "Ali"],\n' +
        '      "Age": [7, 8, 14, 20, 7, 6, 11],\n' +
        '      "Mark": ["A", "A", "B", "A", "A", "D", "A"]}\n\n' +
        'df = pd.DataFrame(di)\n' +
        'df'
    },
    {
      label: 'loc مقابل iloc',
      code:
        'import pandas as pd\n\n' +
        'di = {"Name": ["Ali", "Sahra", "Ahmad", "Mouhammed", "Ali", "Sahra", "Ali"],\n' +
        '      "Age": [7, 8, 14, 20, 7, 6, 11],\n' +
        '      "Mark": ["A", "A", "B", "A", "A", "D", "A"]}\n' +
        'df = pd.DataFrame(di)\n\n' +
        'print("loc يشمل النهاية:")\n' +
        'print(df.loc[0:2, ["Name", "Age"]])\n\n' +
        'print("iloc لا يشمل النهاية:")\n' +
        'print(df.iloc[0:2, 0:2])'
    },
    {
      label: 'قيم مفقودة',
      code:
        'import pandas as pd\n\n' +
        'df = pd.DataFrame({\n' +
        '    "Name": ["Ali", "Sahra", "Ahmad", "Mouhammed"],\n' +
        '    "Age": [7, None, 14, 20],\n' +
        '    "Mark": ["A", "A", "B", None]\n' +
        '})\n\n' +
        'print(df.isnull().sum())\n' +
        'print(df["Age"].dtype)\n' +
        'df.fillna({"Age": df["Age"].mean(), "Mark": "غير محدد"})'
    },
    {
      label: 'groupby',
      code:
        'import pandas as pd\n\n' +
        'df = pd.DataFrame({\n' +
        '    "Name": ["Ali", "Sahra", "Ahmad", "Mouhammed", "Ali", "Sahra", "Ali"],\n' +
        '    "Age": [7, 8, 14, 20, 7, 6, 11],\n' +
        '    "Mark": ["A", "A", "B", "A", "A", "D", "A"]\n' +
        '})\n\n' +
        'df.groupby("Mark")["Age"].agg(["count", "mean", "max"])'
    }
  ];

  return {
    COLUMNS: COLUMNS,
    ROWS: ROWS,
    STUDENTS: STUDENTS,
    SNIPPETS: SNIPPETS,
    D: D,
    DI: DI,
    S: S,
    T: T,
    STATS: STATS
  };
})();
