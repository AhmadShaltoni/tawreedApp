# 📋 عقد الـ API بين الفرونت اند والباك اند — نظام الأصناف

> هذا الملف يوضح بالضبط ماذا يتوقع الفرونت اند من الباك اند وكيف يعرض البيانات.

---

## 1. الطلبات التي يرسلها الفرونت اند

### طلب ①: جلب الأصناف الجذرية (عند فتح شاشة الأقسام)

```
GET /api/v1/categories
```

بدون أي parameters → يجب أن يرجع **الأصناف الجذرية فقط** (parentId === null).

---

### طلب ②: جلب أبناء صنف معين (عند الضغط على صنف أب)

```
GET /api/v1/categories?parentId=cm1abc...
```

يرسل `parentId` كـ query parameter → يجب أن يرجع **الأبناء المباشرين** لهذا الصنف + **مصفوفة breadcrumb**.

---

### طلب ③: جلب منتجات صنف (عند الوصول لصنف نهائي)

```
GET /api/v1/products?categoryId=cm5mno...
```

---

### طلب ④: جلب كل منتجات صنف مع الفروع

```
GET /api/v1/products?categoryId=cm1abc...&includeDescendants=true
```

---

## 2. شكل الاستجابة المتوقع بالضبط

### استجابة الأصناف الجذرية: `GET /api/v1/categories`

```json
{
  "categories": [
    {
      "id": "cm1abc...",
      "name": "مواد تموينية",
      "nameEn": "Grocery Supplies",
      "slug": "grocery-supplies",
      "parentId": null,
      "depth": 0,
      "hasChildren": true,
      "childrenCount": 5,
      "productsCount": 3,
      "sortOrder": 1,
      "isActive": true,
      "image": {
        "url": "/uploads/categories/grocery.jpg",
        "alt": "مواد تموينية"
      }
    },
    {
      "id": "cm2def...",
      "name": "أخرى",
      "nameEn": "Other",
      "slug": "other",
      "parentId": null,
      "depth": 0,
      "hasChildren": false,
      "childrenCount": 0,
      "productsCount": 15,
      "sortOrder": 2,
      "isActive": true,
      "image": null
    }
  ],
  "breadcrumb": []
}
```

**ملاحظات:**
- `breadcrumb` يكون **مصفوفة فارغة** `[]` عند جلب الأصناف الجذرية
- `hasChildren`: الفرونت اند يقرر بناءً عليها:
  - `true` → عند الضغط يجلب الأبناء
  - `false` → عند الضغط ينتقل لصفحة المنتجات
- `productsCount`: عدد المنتجات **المباشرة** في هذا الصنف (ليس الأبناء)
- `childrenCount`: عدد الأصناف الفرعية المباشرة

---

### استجابة أبناء صنف: `GET /api/v1/categories?parentId=cm1abc...`

```json
{
  "categories": [
    {
      "id": "cm3ghi...",
      "name": "سكر",
      "nameEn": "Sugar",
      "slug": "sugar",
      "parentId": "cm1abc...",
      "depth": 1,
      "hasChildren": false,
      "childrenCount": 0,
      "productsCount": 8,
      "sortOrder": 1,
      "isActive": true,
      "image": null
    },
    {
      "id": "cm4jkl...",
      "name": "أرز",
      "nameEn": "Rice",
      "slug": "rice",
      "parentId": "cm1abc...",
      "depth": 1,
      "hasChildren": true,
      "childrenCount": 2,
      "productsCount": 0,
      "sortOrder": 2,
      "isActive": true,
      "image": null
    }
  ],
  "breadcrumb": [
    {
      "id": "cm1abc...",
      "name": "مواد تموينية",
      "nameEn": "Grocery Supplies",
      "slug": "grocery-supplies",
      "image": null,
      "depth": 0,
      "hasChildren": true,
      "childrenCount": 5,
      "productsCount": 3
    }
  ]
}
```

---

### استجابة مستوى ثالث: `GET /api/v1/categories?parentId=cm4jkl...`

```json
{
  "categories": [
    {
      "id": "cm5mno...",
      "name": "أرز مصري",
      "nameEn": "Egyptian Rice",
      "slug": "egyptian-rice",
      "parentId": "cm4jkl...",
      "depth": 2,
      "hasChildren": false,
      "childrenCount": 0,
      "productsCount": 3,
      "sortOrder": 1,
      "isActive": true,
      "image": null
    },
    {
      "id": "cm6pqr...",
      "name": "أرز بسمتي",
      "nameEn": "Basmati Rice",
      "slug": "basmati-rice",
      "parentId": "cm4jkl...",
      "depth": 2,
      "hasChildren": false,
      "childrenCount": 0,
      "productsCount": 5,
      "sortOrder": 2,
      "isActive": true,
      "image": null
    }
  ],
  "breadcrumb": [
    {
      "id": "cm1abc...",
      "name": "مواد تموينية",
      "nameEn": "Grocery Supplies",
      "slug": "grocery-supplies",
      "image": null,
      "depth": 0,
      "hasChildren": true,
      "childrenCount": 5,
      "productsCount": 3
    },
    {
      "id": "cm4jkl...",
      "name": "أرز",
      "nameEn": "Rice",
      "slug": "rice",
      "image": null,
      "depth": 1,
      "hasChildren": true,
      "childrenCount": 2,
      "productsCount": 0
    }
  ]
}
```

---

## 3. شكل الـ Breadcrumb بالتفصيل

### القاعدة:
- `breadcrumb` هي مصفوفة تحتوي **كل الأجداد من الجذر حتى الأب المباشر** (بدون الصنف الحالي)
- مرتبة من الأقدم (root) إلى الأحدث (الأب المباشر)
- عند جلب الأصناف الجذرية → `breadcrumb: []`

### شكل كل عنصر في الـ breadcrumb:

```typescript
{
  id: string;          // ✅ مطلوب — معرف الصنف
  name: string;        // ✅ مطلوب — الاسم بالعربية
  nameEn?: string;     // ✅ مطلوب — الاسم بالانجليزية
  slug: string;        // ✅ مطلوب
  image?: object|null; // اختياري
  depth?: number;      // ✅ مطلوب — مستوى العمق
  hasChildren?: boolean;   // ✅ مطلوب — الفرونت اند يستخدمه عند الضغط على عنصر breadcrumb
  childrenCount?: number;  // ✅ مطلوب
  productsCount?: number;  // ✅ مطلوب — يظهر زر "عرض المنتجات" إذا > 0
}
```

### ⚠️ مهم جداً: `productsCount` في الـ breadcrumb
الفرونت اند يستخدم `productsCount` من الـ breadcrumb لعرض أزرار:
- **"عرض المنتجات (3)"** — إذا الصنف الأب له منتجات مباشرة
- **"عرض كل المنتجات مع الفروع"** — includeDescendants

إذا `productsCount` غير موجود أو = 0 → لا تظهر هذه الأزرار.

---

## 4. كيف يتخذ الفرونت اند القرارات

```
المستخدم يضغط على صنف:
│
├─ hasChildren === true?
│  ├─ نعم → GET /api/v1/categories?parentId={id}
│  │        → عرض الأبناء كشبكة بطاقات
│  │        → إذا productsCount > 0 → عرض أزرار المنتجات
│  │
│  └─ لا  → router.push("/products?categoryId={id}")
│           → صفحة المنتجات مباشرة
│
المستخدم يضغط على عنصر breadcrumb:
│
├─ "الرئيسية" → GET /api/v1/categories (بدون parentId)
├─ أي عنصر آخر → GET /api/v1/categories?parentId={crumb.id}
```

---

## 5. الحقول المطلوبة في كل كائن صنف

| الحقل | النوع | مطلوب؟ | كيف يستخدمه الفرونت اند |
|-------|-------|--------|------------------------|
| `id` | `string` | ✅ | معرف فريد |
| `name` | `string` | ✅ | الاسم المعروض (عربي) |
| `nameEn` | `string` | ✅ | الاسم المعروض (انجليزي) |
| `slug` | `string` | ✅ | — |
| `parentId` | `string \| null` | ✅ | null = صنف جذري |
| `depth` | `number` | ✅ | 0=root, 1=child, 2=grandchild... |
| `hasChildren` | `boolean` | ✅ | **يقرر هل نعرض أبناء أم منتجات** |
| `childrenCount` | `number` | ✅ | يعرض بجانب سهم التنقل |
| `productsCount` | `number` | ✅ | عدد المنتجات المباشرة — badge + أزرار |
| `sortOrder` | `number` | ✅ | ترتيب العرض |
| `isActive` | `boolean` | ✅ | — |
| `image` | `{url, alt} \| null` | اختياري | صورة الصنف |

---

## 6. استجابة المنتجات (للتأكيد)

### `GET /api/v1/products?categoryId=xxx`

```json
{
  "products": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

### `GET /api/v1/products?categoryId=xxx&includeDescendants=true`

نفس الشكل — لكن يرجع منتجات الصنف **+ كل أبنائه وأحفاده**.

---

## 7. سيناريو كامل خطوة بخطوة

### الخطوة 1: فتح شاشة الأقسام
```
→ GET /api/v1/categories
← {
    categories: [مواد تموينية, مشروبات, منظفات, أخرى],
    breadcrumb: []
  }
→ عرض: شبكة 4 أصناف
```

### الخطوة 2: ضغط على "مواد تموينية" (hasChildren=true, productsCount=3)
```
→ GET /api/v1/categories?parentId=cm1abc
← {
    categories: [سكر, أرز, زيت, طحين, بهارات],
    breadcrumb: [{id:"cm1abc", name:"مواد تموينية", productsCount:3, hasChildren:true, ...}]
  }
→ عرض:
  [Breadcrumb]: الرئيسية > مواد تموينية
  [زر]: "عرض المنتجات (3)"        ← لأن productsCount=3 > 0
  [زر]: "عرض كل المنتجات مع الفروع"
  [شبكة]: سكر | أرز | زيت | طحين | بهارات
```

### الخطوة 3: ضغط على "أرز" (hasChildren=true, productsCount=0)
```
→ GET /api/v1/categories?parentId=cm4jkl
← {
    categories: [أرز مصري, أرز بسمتي],
    breadcrumb: [
      {id:"cm1abc", name:"مواد تموينية", productsCount:3, ...},
      {id:"cm4jkl", name:"أرز", productsCount:0, ...}
    ]
  }
→ عرض:
  [Breadcrumb]: الرئيسية > مواد تموينية > أرز
  [لا أزرار منتجات]  ← لأن productsCount=0
  [شبكة]: أرز مصري | أرز بسمتي
```

### الخطوة 4: ضغط على "أرز مصري" (hasChildren=false)
```
→ لا نجلب أصناف — ننتقل لصفحة المنتجات
→ GET /api/v1/products?categoryId=cm5mno
← { products: [...], pagination: {...} }
```

### الخطوة 5: رجوع عبر breadcrumb — ضغط على "مواد تموينية"
```
→ GET /api/v1/categories?parentId=cm1abc
← نفس استجابة الخطوة 2
```

### الخطوة 6: ضغط على "الرئيسية" في breadcrumb
```
→ GET /api/v1/categories (بدون parentId)
← نفس استجابة الخطوة 1
```

---

## 8. ✅ قائمة التحقق للباك اند

- [ ] `GET /api/v1/categories` بدون params → يرجع الأصناف الجذرية فقط (parentId === null)
- [ ] `GET /api/v1/categories?parentId=xxx` → يرجع الأبناء المباشرين + breadcrumb
- [ ] كل صنف يحتوي على: `hasChildren`, `childrenCount`, `productsCount`
- [ ] `breadcrumb` مصفوفة من الجذر للأب المباشر (بدون الصنف الحالي)
- [ ] كل عنصر breadcrumb يحتوي على: `productsCount`, `hasChildren`, `childrenCount`
- [ ] `productsCount` = عدد المنتجات **المباشرة** في هذا الصنف (ليس الأحفاد)
- [ ] `hasChildren` = true إذا عدد الأبناء > 0
- [ ] الأصناف مرتبة بـ `sortOrder` تصاعدياً
- [ ] `image` يرجع `null` إذا لا توجد صورة (ليس undefined أو string فارغ)
- [ ] `GET /api/v1/products?categoryId=xxx` → منتجات الصنف المباشرة فقط
- [ ] `GET /api/v1/products?categoryId=xxx&includeDescendants=true` → منتجات الصنف + كل الفروع
