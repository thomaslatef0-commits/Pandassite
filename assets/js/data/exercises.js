/* ============================================================
   exercises.js — تمارين عملية تُصحَّح تلقائيًا داخل المتصفح
   كل تمرين: كود إعداد + كود البداية + اختبارات (تعبيرات بايثون)
   ============================================================ */
window.PDX.exercises = (function () {
  'use strict';

  const DATA =
    'import pandas as pd\n\n' +
    'df = pd.DataFrame({\n' +
    '    "Name": ["Ali", "Sahra", "Ahmad", "Mouhammed", "Ali", "Sahra", "Ali"],\n' +
    '    "Age": [7, 8, 14, 20, 7, 6, 11],\n' +
    '    "Mark": ["A", "A", "B", "A", "A", "D", "A"]\n' +
    '})\n';

  const list = [
    {
      id: 'ex-intro',
      lessonId: 'why-pandas',
      title: 'من ثلاث قوائم إلى إجابة',
      prompt:
        'أمامك ثلاث قوائم منفصلة. أنشئ جدولًا باسم df، ثم احسب متوسط أعمار أصحاب العلامة A واحفظه في متغير اسمه avg_a.',
      setup:
        'names = ["Ali", "Sahra", "Ahmad", "Mona"]\n' +
        'ages  = [7, 8, 14, 9]\n' +
        'marks = ["A", "A", "B", "A"]\n',
      starter: '# 1) أنشئ df من القوائم الثلاث\n\n\n# 2) احسب متوسط أعمار أصحاب A في avg_a\n',
      tests: [
        ['أنشأت DataFrame باسم df', 'isinstance(df, pd.DataFrame)'],
        ['الأعمدة Name وAge وMark بالترتيب', 'list(df.columns) == ["Name", "Age", "Mark"]'],
        ['عدد الصفوف يساوي 4', 'len(df) == 4'],
        ['avg_a تساوي 8.0', 'abs(avg_a - 8.0) < 1e-9']
      ],
      hint:
        'ابنِ الجدول بـ pd.DataFrame({"Name": names, ...}). ثم استخدم قناعًا منطقيًا داخل loc لاختيار عمود Age، وبعده mean().',
      solution:
        'df = pd.DataFrame({"Name": names, "Age": ages, "Mark": marks})\n' +
        'avg_a = df.loc[df["Mark"] == "A", "Age"].mean()'
    },
    {
      id: 'ex-build',
      lessonId: 'build',
      title: 'رتّب الأعمدة وأضف عمودًا محسوبًا',
      prompt:
        'القاموس di مرتّب بشكل غير مناسب. أنشئ df منه، ثم أعد ترتيب أعمدته لتصبح Name ثم Age ثم Mark، وأضف عمودًا اسمه NextAge يساوي العمر + 1.',
      setup:
        'import pandas as pd\n\n' +
        'di = {"Mark": ["A", "B", "A"],\n' +
        '      "Name": ["Ali", "Ahmad", "Sahra"],\n' +
        '      "Age": [7, 14, 8]}\n',
      starter: '# 1) أنشئ df\n\n# 2) أعد ترتيب الأعمدة\n\n# 3) أضف NextAge\n',
      tests: [
        ['أنشأت DataFrame باسم df', 'isinstance(df, pd.DataFrame)'],
        ['ترتيب الأعمدة صحيح', 'list(df.columns) == ["Name", "Age", "Mark", "NextAge"]'],
        ['قيم NextAge صحيحة', 'list(df["NextAge"]) == [8, 15, 9]'],
        ['الفهرس ما زال 0,1,2', 'list(df.index) == [0, 1, 2]']
      ],
      hint:
        'اختيار عدة أعمدة بقائمة داخل الأقواس يعيد نسخة بذلك الترتيب: df[["Name", "Age", "Mark"]]. ثم أضف العمود الجديد بإسناد مباشر.',
      solution:
        'df = pd.DataFrame(di)\n' +
        'df = df[["Name", "Age", "Mark"]]\n' +
        'df["NextAge"] = df["Age"] + 1'
    },
    {
      id: 'ex-inspect',
      lessonId: 'inspect',
      title: 'تقرير فحص في أربعة أرقام',
      prompt:
        'افحص الجدول الموجود واستخرج: عدد الصفوف في rows، وعدد الأعمدة في cols، ومجموع القيم المفقودة في العمودين في missing، وأسماء الأعمدة الرقمية التي يعرضها describe في num_cols.',
      setup:
        'import pandas as pd\n\n' +
        'df = pd.DataFrame({\n' +
        '    "Name": ["Ali", "Sahra", "Ahmad", "Mouhammed"],\n' +
        '    "Age": [7, None, 14, 20],\n' +
        '    "Mark": ["A", "A", "B", None]\n' +
        '})\n',
      starter: 'rows = ...\ncols = ...\nmissing = ...\nnum_cols = ...\n',
      tests: [
        ['rows تساوي 4', 'rows == 4'],
        ['cols تساوي 3', 'cols == 3'],
        ['missing تساوي 2', 'missing == 2'],
        ['describe تعرض Age فقط', 'list(num_cols) == ["Age"]']
      ],
      hint:
        'shape تعيد (rows, cols). لجمع القيم المفقودة استخدم df.isnull().sum().sum(). وللأعمدة الرقمية انظر إلى df.describe().columns.',
      solution:
        'rows = df.shape[0]\n' +
        'cols = df.shape[1]\n' +
        'missing = df.isnull().sum().sum()\n' +
        'num_cols = list(df.describe().columns)'
    },
    {
      id: 'ex-selection',
      lessonId: 'selection',
      title: 'loc و iloc على نفس البيانات',
      prompt:
        'من الجدول df: استخرج أول ثلاثة صفوف بالموقع في first_three، واستخرج الصفوف من الاسم 0 إلى الاسم 3 مع العمودين Name وAge في labeled، وقيمة عمر Ahmad في ahmad_age.',
      setup: DATA,
      starter:
        'first_three = ...\n' +
        'labeled = ...\n' +
        'ahmad_age = ...\n',
      tests: [
        ['first_three فيه 3 صفوف', 'len(first_three) == 3'],
        ['labeled فيه 4 صفوف (لأن loc يشمل النهاية)', 'len(labeled) == 4'],
        ['أعمدة labeled هي Name وAge', 'list(labeled.columns) == ["Name", "Age"]'],
        ['ahmad_age تساوي 14', 'ahmad_age == 14']
      ],
      hint:
        'iloc[0:3] يعطي ثلاثة صفوف. loc[0:3, ["Name", "Age"]] يعطي أربعة. لاحظ الفرق قبل أن تضغط «تحقق».',
      solution:
        'first_three = df.iloc[0:3]\n' +
        'labeled = df.loc[0:3, ["Name", "Age"]]\n' +
        'ahmad_age = df.loc[df["Name"] == "Ahmad", "Age"].iloc[0]'
    },
    {
      id: 'ex-modify',
      lessonId: 'modify',
      title: 'عدّل بأمان',
      prompt:
        'غيّر عمر الصف صاحب الفهرس 3 إلى 30 باستخدام loc، ثم أضف عمودًا منطقيًا اسمه Passed يساوي Age >= 10.',
      setup: DATA,
      starter: '# 1) عدّل العمر\n\n# 2) أضف عمود Passed\n',
      tests: [
        ['عمر الصف 3 أصبح 30', 'df.loc[3, "Age"] == 30'],
        ['العمود Passed موجود', '"Passed" in df.columns'],
        ['نوع Passed منطقي (bool)', 'df["Passed"].dtype == bool'],
        ['الصف 0 لم يجتز', 'df.loc[0, "Passed"] == False'],
        ['الصف 6 اجتاز', 'df.loc[6, "Passed"] == True']
      ],
      hint:
        'التعديل الآمن: df.loc[3, "Age"] = 30. ثم df["Passed"] = df["Age"] >= 10. لا تستخدم سلسلة اختيار مثل df[...][...] = ...',
      solution:
        'df.loc[3, "Age"] = 30\n' +
        'df["Passed"] = df["Age"] >= 10'
    },
    {
      id: 'ex-missing',
      lessonId: 'missing',
      title: 'افحص ثم عالج',
      prompt:
        'احسب مجموع القيم المفقودة في missing. أنشئ cleaned بحذف الصفوف التي فيها أي قيمة مفقودة. ثم أنشئ filled بتعبئة Age بالصفر وMark بكلمة "unknown" (بدون تعديل df الأصلي).',
      setup:
        'import pandas as pd\n\n' +
        'df = pd.DataFrame({\n' +
        '    "Name": ["Ali", "Sahra", "Ahmad", "Mouhammed"],\n' +
        '    "Age": [7, None, 14, None],\n' +
        '    "Mark": ["A", "A", None, "A"]\n' +
        '})\n',
      starter: 'missing = ...\ncleaned = ...\nfilled = ...\n',
      tests: [
        ['عدد المفقودات 3', 'missing == 3'],
        ['cleaned فيه صف واحد', 'len(cleaned) == 1'],
        ['cleaned بلا قيم مفقودة', 'int(cleaned.isnull().sum().sum()) == 0'],
        ['filled بلا قيم مفقودة', 'int(filled.isnull().sum().sum()) == 0'],
        ['df الأصلي لم يتغيّر', 'int(df.isnull().sum().sum()) == 3']
      ],
      hint:
        'dropna وfillna تعيدان نسخة جديدة، لذلك df الأصلي يبقى كما هو تلقائيًا ما دمت لا تسند الناتج إليه.',
      solution:
        'missing = int(df.isnull().sum().sum())\n' +
        'cleaned = df.dropna()\n' +
        'filled = df.fillna({"Age": 0, "Mark": "unknown"})'
    },
    {
      id: 'ex-drop',
      lessonId: 'drop',
      title: 'احذف بثلاث طرق',
      prompt:
        'أنشئ no_name بحذف عمود Name. أنشئ trimmed بحذف الصفين صاحبَي الفهرس 0 و1. ثم احذف عمود Mark من df نفسه باستخدام inplace=True.',
      setup: DATA,
      starter:
        'no_name = ...\n' +
        'trimmed = ...\n' +
        '# ثم احذف Mark من df نفسه\n',
      tests: [
        ['no_name بلا عمود Name', 'list(no_name.columns) == ["Age", "Mark"]'],
        ['trimmed فيه 5 صفوف', 'len(trimmed) == 5'],
        ['فهرس trimmed يبدأ من 2', 'list(trimmed.index) == [2, 3, 4, 5, 6]'],
        ['Mark حُذف من df نفسه', '"Mark" not in df.columns'],
        ['df ما زال يحتوي Age', '"Age" in df.columns']
      ],
      hint:
        'drop(columns=...) للأعمدة، وdrop(index=[...]) للصفوف. للحذف من الكائن نفسه استخدم inplace=True بدون إسناد.',
      solution:
        'no_name = df.drop(columns="Name")\n' +
        'trimmed = df.drop(index=[0, 1])\n' +
        'df.drop(columns="Mark", inplace=True)'
    },
    {
      id: 'ex-filter',
      lessonId: 'filter',
      title: 'صفِّ ورتّب',
      prompt:
        'أنشئ older بالصفوف التي Age > 10. أنشئ combo بالصفوف التي Age > 8 وMark تساوي A معًا. أنشئ sorted_df مرتّبًا تنازليًا حسب Age. وأنشئ young بالصفوف التي عمرها بين 6 و8 شاملًا الطرفين.',
      setup: DATA,
      starter:
        'older = ...\n' +
        'combo = ...\n' +
        'sorted_df = ...\n' +
        'young = ...\n',
      tests: [
        ['older فيه 3 صفوف', 'len(older) == 3'],
        ['combo فيه صفان', 'len(combo) == 2'],
        ['combo لا يحتوي أي علامة غير A', 'set(combo["Mark"]) == {"A"}'],
        ['أول صف في sorted_df هو Mouhammed', 'sorted_df.iloc[0]["Name"] == "Mouhammed"'],
        ['young فيه 4 صفوف', 'len(young) == 4']
      ],
      hint:
        'استخدم & بين الشرطين مع قوسين حول كل شرط، و~ للنفي. between(6, 8) تشمل الطرفين.',
      solution:
        'older = df[df["Age"] > 10]\n' +
        'combo = df[(df["Age"] > 8) & (df["Mark"] == "A")]\n' +
        'sorted_df = df.sort_values("Age", ascending=False)\n' +
        'young = df[df["Age"].between(6, 8)]'
    },
    {
      id: 'ex-stats',
      lessonId: 'stats',
      title: 'اقرأ التوزيع لا الرقم فقط',
      prompt:
        'احسب المتوسط في avg والوسيط في med. احسب عدد الطلاب الذين عمرهم أكبر من 10 في over_10 باستخدام جمع القناع المنطقي. واحسب تكرار كل علامة في marks (استخدم value_counts).',
      setup: DATA,
      starter: 'avg = ...\nmed = ...\nover_10 = ...\nmarks = ...\n',
      tests: [
        ['avg تساوي 10.428571 تقريبًا', 'abs(avg - 73/7) < 1e-6'],
        ['med تساوي 8', 'med == 8'],
        ['over_10 تساوي 3', 'over_10 == 3'],
        ['تكرار A يساوي 5', 'marks["A"] == 5']
      ],
      hint:
        'المتوسط والوسيط دالتان على Series. عدد المحققين للشرط = (Series > قيمة).sum().',
      solution:
        'avg = df["Age"].mean()\n' +
        'med = df["Age"].median()\n' +
        'over_10 = (df["Age"] > 10).sum()\n' +
        'marks = df["Mark"].value_counts()'
    },
    {
      id: 'ex-groupby',
      lessonId: 'groupby',
      title: 'تجميع بثلاث مخرجات',
      prompt:
        'احسب متوسط العمر لكل علامة في by_mark. أنشئ summary يحتوي count وmax لكل علامة. وأنشئ as_table حيث Mark عمود عادي وليس فهرسًا.',
      setup: DATA,
      starter: 'by_mark = ...\nsummary = ...\nas_table = ...\n',
      tests: [
        ['فهرس by_mark هو A, B, D', 'list(by_mark.index) == ["A", "B", "D"]'],
        ['متوسط A يساوي 10.6', 'abs(by_mark["A"] - 10.6) < 1e-6'],
        ['summary فيه العمودان count وmax', 'list(summary.columns) == ["count", "max"]'],
        ['count للعلامة A يساوي 5', 'summary.loc["A", "count"] == 5'],
        ['as_table أعمده Mark وAge', 'list(as_table.columns) == ["Mark", "Age"]']
      ],
      hint:
        'افصل بين المفتاح والعمود والدالة: df.groupby("Mark")["Age"].mean(). ثم جرّب agg(["count","max"]) و as_index=False.',
      solution:
        'by_mark = df.groupby("Mark")["Age"].mean()\n' +
        'summary = df.groupby("Mark")["Age"].agg(["count", "max"])\n' +
        'as_table = df.groupby("Mark", as_index=False)["Age"].mean()'
    },
    {
      id: 'ex-io',
      lessonId: 'io',
      title: 'اقرأ، صفِّ، صدّر',
      prompt:
        'اقرأ النص csv_text إلى جدول df_in. أنشئ adults بالصفوف التي Age >= 18. ثم أنشئ نص CSV في out عبر to_csv(index=False) وتأكد أن السطر الأول هو رؤوس الأعمدة بلا عمود فهرس.',
      setup:
        'import pandas as pd\n' +
        'from io import StringIO\n\n' +
        'csv_text = """Name,Age,Mark\n' +
        'Ali,7,A\n' +
        'Sahra,8,A\n' +
        'Mouhammed,20,B\n' +
        'Rana,22,A"""\n',
      starter:
        'df_in = ...\n' +
        'adults = ...\n' +
        'out = ...\n',
      tests: [
        ['df_in فيه 4 صفوف و3 أعمدة', 'df_in.shape == (4, 3)'],
        ['adults فيه صفان', 'len(adults) == 2'],
        ['أول سطر في out هو الرؤوس', 'out.splitlines()[0] == "Name,Age,Mark"'],
        ['لا يوجد عمود فهرس في النص', 'out.splitlines()[1].startswith("Ali,")']
      ],
      hint:
        'pd.read_csv(StringIO(csv_text)). ثم فلترة عادية. وأخيرًا df_in.to_csv(index=False) تعيد نصًا.',
      solution:
        'df_in = pd.read_csv(StringIO(csv_text))\n' +
        'adults = df_in[df_in["Age"] >= 18]\n' +
        'out = df_in.to_csv(index=False)'
    }
  ];

  const byId = {};
  list.forEach(function (ex) {
    byId[ex.id] = ex;
  });

  return { list: list, byId: byId };
})();
