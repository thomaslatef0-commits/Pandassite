/* ============================================================
   exam.js — الاختبار الشامل (24 سؤالًا من كل الموضوعات)
   ============================================================ */
(function () {
  'use strict';

  const exam = [
    {
      id: 'e01',
      lessonId: 'selection',
      tag: 'loc',
      q: 'لدينا df بفهرس افتراضي 0..6. كم صفًا يعيد df.loc[1:4]؟',
      options: ['4 صفوف', '3 صفوف', '5 صفوف', 'صف واحد'],
      answer: 0,
      explain: 'loc يشمل نهاية الشريحة: 1, 2, 3, 4 → أربعة صفوف.'
    },
    {
      id: 'e02',
      lessonId: 'selection',
      tag: 'iloc',
      q: 'ما ناتج df.iloc[-1, -1]؟',
      options: [
        'قيمة الخلية في آخر صف وآخر عمود',
        'خطأ لأن iloc لا يقبل الأرقام السالبة',
        'قيمة الخلية في أول صف وأول عمود',
        'Series بآخر صف'
      ],
      answer: 0,
      explain: 'الأرقام السالبة في iloc تعني العدّ من النهاية: -1 آخر عنصر.'
    },
    {
      id: 'e03',
      lessonId: 'selection',
      tag: 'النوع',
      q: 'أي تعبير يعيد DataFrame وليس Series؟',
      options: ['df[["Name", "Age"]]', 'df["Name"]', 'df.loc[0]', 'df.iloc[:, 0]'],
      answer: 0,
      explain:
        'قائمة أعمدة داخل [] تعيد DataFrame. أما العمود المفرد أو الصف المفرد فيعيدان Series.'
    },
    {
      id: 'e04',
      lessonId: 'modify',
      tag: 'mutation',
      q: 'نفّذت df.loc[2, "Age"] = 99. ما الذي تغيّر؟',
      options: [
        'خلية واحدة في df نفسه، وكل التحليلات اللاحقة ترى 99',
        'نسخة جديدة فقط، وdf كما هو',
        'نوع العمود Age',
        'الفهرس أصبح 99'
      ],
      answer: 0,
      explain: 'الإسناد عبر loc يعدّل الكائن الأصلي. ولهذا يجب الانتباه إلى ترتيب التعديلات.'
    },
    {
      id: 'e05',
      lessonId: 'modify',
      tag: 'inplace',
      q: 'أي عبارة تعيد None؟',
      options: [
        'df.dropna(inplace=True)',
        'df.dropna()',
        'df.copy()',
        'df.reset_index(drop=True)'
      ],
      answer: 0,
      explain: 'inplace=True دائمًا تعيد None. والثلاث الأخرى تعيد كائنات جديدة.'
    },
    {
      id: 'e06',
      lessonId: 'missing',
      tag: 'NaN',
      q: 'لماذا يتحول عمود int64 إلى float64 عند إضافة None؟',
      options: [
        'لأن NaN من نوع float، ولا يوجد تمثيل لـ«فراغ» داخل int64',
        'لأن pandas تحوّل كل الأعمدة إلى float عند التعديل',
        'لأن None نص وليس رقمًا',
        'لأن العمود أصبح فهرسًا'
      ],
      answer: 0,
      explain:
        'هذا قيد من NumPy. الحل الحديث هو النوع Int64 القابل للفراغ، أو تعبئة القيم قبل الحساب.'
    },
    {
      id: 'e07',
      lessonId: 'missing',
      tag: 'العدّ',
      q: 'جدول فيه 100 صف، وisnull().sum() أعطى: Name=0, Age=12, Mark=3. ما الاستنتاج؟',
      options: [
        'هناك 12 قيمة مفقودة في Age و3 في Mark، وقد تتقاطع في صفوف واحدة',
        'هناك 15 صفًا مفقودًا بالضرورة',
        'الجدول فيه 15 صفًا فقط',
        'Age وMark من نوع نصي'
      ],
      answer: 0,
      explain:
        'الأعداد لكل عمود على حدة. لا يمكن جمعها لمعرفة عدد الصفوف المتأثرة لأن الصف نفسه قد يحمل أكثر من قيمة مفقودة.'
    },
    {
      id: 'e08',
      lessonId: 'missing',
      tag: 'التكرار',
      q: 'ما الفرق بين duplicated() وdrop_duplicates()؟',
      options: [
        'الأولى تعلّم الصفوف المكررة بـ True، والثانية تعيد جدولًا بلا هذه الصفوف',
        'لا فرق، الثانية اختصار للأولى',
        'الأولى تحذف والأخرى تعلّم',
        'الثانية تعمل على الأعمدة فقط'
      ],
      answer: 0,
      explain:
        'duplicated تشخيص (قناع منطقي)، وdrop_duplicates علاج (جدول جديد). تشخيص ثم قرار.'
    },
    {
      id: 'e09',
      lessonId: 'drop',
      tag: 'axis',
      q: 'ما التكافؤ الصحيح؟',
      options: [
        'df.drop(columns="x") تساوي df.drop("x", axis=1)',
        'df.drop(columns="x") تساوي df.drop("x", axis=0)',
        'df.drop(index="x") تساوي df.drop("x", axis=1)',
        'لا يوجد تكافؤ بين الصيغتين'
      ],
      answer: 0,
      explain: 'columns هي صيغة أوضح لـ axis=1. وindex هي صيغة أوضح لـ axis=0.'
    },
    {
      id: 'e10',
      lessonId: 'drop',
      tag: 'الحذف',
      q: 'كيف تحذف الصفوف التي Age فيها أقل من 10 مع الحفاظ على بقية البيانات؟',
      options: [
        'df = df[df["Age"] >= 10]',
        'df = df.drop("Age")',
        'df = df.dropna()',
        'df = df.fillna(10)'
      ],
      answer: 0,
      explain: 'الفلترة بالقناع تحذف الصفوف غير المرغوبة. drop("Age") تحذف العمود كله.'
    },
    {
      id: 'e11',
      lessonId: 'filter',
      tag: 'قناع',
      q: 'ما عدد الصفوف الناتجة؟',
      code: 'df[(df["Age"] >= 7) & (df["Mark"] != "D")]',
      options: ['6', '7', '5', '4'],
      answer: 0,
      explain:
        'كل الصفوف أعمارها >= 7 ما عدا الصف 5 (6 سنوات)؛ ومن الباقي ستة، صف واحد فقط علامته D وهو الصف 5 المحذوف أصلًا. إذن 6.'
    },
    {
      id: 'e12',
      lessonId: 'filter',
      tag: 'أخطاء',
      q: 'لماذا يفشل التعبير df[df["Age"] > 5 and df["Mark"] == "A"]؟',
      options: [
        'لأن and تحتاج قيمة منطقية واحدة، وSeries كاملة لا يمكن تحويلها إلى True/False',
        'لأن الأقواس ناقصة فقط',
        'لأن Age وMark من نوعين مختلفين',
        'لأن القناع يجب أن يكون نصًا'
      ],
      answer: 0,
      explain:
        'هذا خطأ truth value is ambiguous. الحل استخدام & مع قوسين حول كل شرط.'
    },
    {
      id: 'e13',
      lessonId: 'filter',
      tag: 'الفهرس',
      q: 'بعد فلترة أعطت صفوفًا بفهرس [1, 4, 6]، أردت فهرسًا جديدًا 0,1,2 وحذف القديم تمامًا. ما الصيغة؟',
      options: [
        'df.reset_index(drop=True)',
        'df.reset_index()',
        'df.reindex([0, 1, 2])',
        'df.index = [0, 1, 2]'
      ],
      answer: 0,
      explain:
        'drop=True يمنع تحويل الفهرس القديم إلى عمود. reset_index() بدونها يضيف عمود index ويُبقي المعلومة.'
    },
    {
      id: 'e14',
      lessonId: 'inspect',
      tag: 'الفحص',
      q: 'أي مجموعة أوامر تعطيك أسرع صورة عن جودة البيانات؟',
      options: [
        'df.info() ثم df.describe() ثم df.head()',
        'df.to_csv() ثم df.head()',
        'df.groupby() ثم df.sort_values()',
        'df.plot() فقط'
      ],
      answer: 0,
      explain:
        'info تكشف الأنواع والقيم المفقودة، describe تعطي النطاق والتوزيع، head تريك معنى الصف. هذا هو روتين الفحص.'
    },
    {
      id: 'e15',
      lessonId: 'inspect',
      tag: 'describe',
      q: 'ما الذي لا تعرضه df.describe() افتراضيًا؟',
      options: [
        'الأعمدة النصية',
        'الوسيط',
        'الربيع الأول والثالث',
        'القيمة الصغرى والعظمى'
      ],
      answer: 0,
      explain:
        'describe تحسب الإحصاءات الرقمية فقط. لرؤية النصوص أيضًا: describe(include="all") أو include="object".'
    },
    {
      id: 'e16',
      lessonId: 'stats',
      tag: 'متوسط/وسيط',
      q: 'بيانات رواتب فيها قيمة واحدة ضخمة جدًا. أي مقياس يصف «الراتب النموذجي» بشكل أفضل؟',
      options: ['الوسيط', 'المتوسط', 'المجموع', 'الانحراف المعياري'],
      answer: 0,
      explain:
        'القيمة الضخمة تسحب المتوسط، بينما الوسيط يعتمد على موقع القيمة الوسطى ولا يتأثر بها.'
    },
    {
      id: 'e17',
      lessonId: 'stats',
      tag: 'NaN',
      q: 'إذا كانت 3 من 10 قيم في عمود مفقودة، فعلى كم قيمة يُحسب mean افتراضيًا؟',
      options: ['7', '10', '3', 'لا يمكن حسابه'],
      answer: 0,
      explain: 'skipna=True يتجاهل المفقود، فيُحسب على 7 قيم. استخدم count() للتأكد من العدد.'
    },
    {
      id: 'e18',
      lessonId: 'stats',
      tag: 'count/size',
      q: 'أي زوج من الدوال يعطي نفس الناتج دائمًا على Series بلا قيم مفقودة؟',
      options: [
        'count() وsize',
        'sum() وmean()',
        'max() وmedian()',
        'unique() وnunique()'
      ],
      answer: 0,
      explain:
        'بدون NaN، كل العناصر غير مفقودة، فيتساوى عدّاد count مع طول size. أما مع NaN فيختلفان.'
    },
    {
      id: 'e19',
      lessonId: 'groupby',
      tag: 'groupby',
      q: 'ما ناتج df.groupby("Mark").size() لبياناتنا؟',
      options: [
        'A=5, B=1, D=1',
        'A=3, B=1, D=1',
        'A=5, B=1, D=2',
        'قيمة واحدة تساوي 7'
      ],
      answer: 0,
      explain: 'العلامة A تكررت 5 مرات، وB مرة، وD مرة → مجموع 7 صفوف.'
    },
    {
      id: 'e20',
      lessonId: 'groupby',
      tag: 'agg',
      q: 'أي تعبير يعطي المتوسط والعظمى لكل علامة في جدول واحد بأعمدة mean وmax؟',
      options: [
        'df.groupby("Mark")["Age"].agg(["mean", "max"])',
        'df.groupby("Mark")["Age"].mean().max()',
        'df.groupby("Mark").agg("Age")',
        'df.groupby("Age")["Mark"].agg(["mean", "max"])'
      ],
      answer: 0,
      explain:
        'قائمة دوال داخل agg تنتج أعمدة متعددة. أما mean().max() فتعطي رقمًا واحدًا (عظمى المتوسطات)، وgroupby على العمود الخطأ يجمّع حسب القيم بدل العلامات.'
    },
    {
      id: 'e21',
      lessonId: 'groupby',
      tag: 'as_index',
      q: 'متى تحتاج as_index=False أو reset_index()؟',
      options: [
        'عندما تريد عمود المفتاح عمودًا عاديًا للرسم أو التصدير',
        'عندما تريد حذف الصفوف المكررة',
        'عندما تريد تحويل النصوص إلى أرقام',
        'عندما تريد قراءة CSV'
      ],
      answer: 0,
      explain:
        'نتيجة groupby مفهرسة بالمفاتيح. الأدوات التي تتعامل مع أعمدة (رسم، تصدير، دمج) تحتاج المفتاح عمودًا.'
    },
    {
      id: 'e22',
      lessonId: 'io',
      tag: 'الاستيراد',
      q: 'ما الذي يحدث عند pd.read_csv(path) ثم تعديل df ثم إغلاق البرنامج؟',
      options: [
        'لا يتغيّر الملف؛ التعديل في الذاكرة فقط',
        'يُحفظ التعديل تلقائيًا في الملف',
        'يُحفظ التعديل في ملف مؤقت دائم',
        'يتلف الملف الأصلي'
      ],
      answer: 0,
      explain: 'القراءة لا تفتح الملف للكتابة. الحفظ يحتاج to_csv صراحةً.'
    },
    {
      id: 'e23',
      lessonId: 'io',
      tag: 'التصدير',
      q: 'أي سطر يصدّر جدولًا بلا عمود فهرس؟',
      options: [
        'df.to_csv("out.csv", index=False)',
        'df.to_csv("out.csv")',
        'df.to_csv("out.csv", header=False)',
        'df.to_csv("out.csv", columns=False)'
      ],
      answer: 0,
      explain:
        'index=False يمنع كتابة الفهرس. header=False يحذف أسماء الأعمدة وهو شيء مختلف تمامًا.'
    },
    {
      id: 'e24',
      lessonId: 'build',
      tag: 'المحاذاة',
      q: 'df["New"] = pd.Series([1, 2], index=[5, 6]) على جدول فهرسه 0..6. ما النتيجة؟',
      options: [
        'قيم 1 و2 تظهر في الصفين 5 و6، وباقي الصفوف NaN',
        '1 و2 تُكرَّر على كل الصفوف',
        'خطأ لأن الطولين مختلفان',
        'يُعاد بناء الجدول بصفين فقط'
      ],
      answer: 0,
      explain:
        'المحاذاة بالاسم: الصفوف 5 و6 وجدت قيمًا، والباقي لم يجد فحصل على NaN. الطول لا يهم هنا، بل تطابق التسميات.'
    }
  ];

  window.PDX.exam = exam;
})();
