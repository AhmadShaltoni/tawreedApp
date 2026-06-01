# نظام الولاء (Loyalty System) - التوثيق الشامل

## 📋 نظرة عامة

نظام الولاء موجود بشكل كامل في الكود لكن **لم يتم دمجه بعد في التطبيق الرئيسي**. النظام معد للعمل لكنه حالياً في صيغة prototype ويمكن الوصول إليه عبر:

- الرابط المباشر: `/loyalty-prototype`
- أو من خلال إضافة tab جديد في التطبيق

---

## 🏗️ البنية التحتية للنظام

### 1. **ملفات النظام الأساسية**

#### أ) ملفات النوع (Types) - `src/types/loyalty.ts`

يحتوي على جميع واجهات البيانات والـ Enums:

**الـ Enums:**

- `TransactionType` - أنواع المعاملات (اكسب من طلب، اكسب من الترحيب، اكسب من إحالة، استبدال، إلخ)
- `RewardType` - أنواع المكافآت (خصم ثابت، خصم نسبي، توصيل مجاني، مخصص)
- `RewardRarity` - درجات ندرة المكافآت (عادي، نادر، ملحمي، أسطوري)
- `CouponStatus` - حالات الكوبون (نشط، مستخدم، منتهي الصلاحية)

**الواجهات الرئيسية:**

```typescript
// رصيد الولاء
LoyaltyBalance {
  currentBalance: number          // الرصيد الحالي
  totalEarned: number             // إجمالي النقاط المكتسبة
  totalRedeemed: number           // إجمالي النقاط المستبدلة
  recentTransactions: []          // آخر المعاملات
}

// المعاملات
LoyaltyTransaction {
  id: string
  type: TransactionType
  amount: number                  // موجب للاكتساب، سالب للاستبدال
  description: string
  descriptionAr/En: string        // دعم ثنائي اللغة
  createdAt: string
  relatedOrderId?: string
  relatedRewardId?: string
}

// المكافآت
Reward {
  id: string
  name/nameAr/nameEn: string
  description/descriptionAr/En: string
  type: RewardType
  rarity: RewardRarity
  pointsCost: number
  discountValue?: number
  discountPercentage?: number
  image?: string
  isActive: boolean
  expiryDays?: number
  minOrderAmount?: number
}

// الكوبونات
Coupon {
  id: string
  code: string
  rewardId: string
  status: CouponStatus
  discountValue?: number
  discountPercentage?: number
  redeemedAt: string
  expiresAt?: string
  usedAt?: string
}

// الحملات
Campaign {
  id: string
  name/nameAr/nameEn: string
  type: "ORDER_COUNT" | "TOTAL_SPENT" | "PRODUCT_PURCHASE"
  status: CampaignStatus
  targetValue: number             // مثل: 5 طلبات أو 500 دينار
  rewardPoints: number
  progress?: CampaignProgress
}

// الإحالات
ReferralInfo {
  referralCode: string
  referralLink: string
  totalInvited: number
  successfulReferrals: number
  totalEarned: number
}
```

#### ب) خدمة API - `src/services/loyalty.service.ts`

**الوظائف الرئيسية:**

```typescript
getBalance(); // الحصول على الرصيد الحالي
getTransactions(page, limit); // سجل المعاملات (مع pagination)
getRewards(); // دليل المكافآت
redeemReward(payload); // استبدال المكافآت بكوبونات
getCoupons(); // كوبونات المستخدم
validateCoupon(payload); // التحقق من صحة الكوبون
getCampaigns(); // الحملات النشطة
getReferralInfo(); // معلومات الإحالة
applyReferralCode(code); // تطبيق كود إحالة
```

#### ج) Redux State Management - `src/store/slices/loyalty.slice.ts`

**حالة Redux:**

```typescript
LoyaltyState {
  balance: LoyaltyBalance | null
  balanceLoading: boolean

  transactions: {
    items: LoyaltyTransaction[]
    page: number
    hasMore: boolean
    loading: boolean
  }

  rewards: {
    items: Reward[]
    loading: boolean
  }

  coupons: {
    items: Coupon[]
    loading: boolean
  }

  campaigns: {
    items: Campaign[]
    loading: boolean
  }

  referral: {
    info: ReferralInfo | null
    loading: boolean
  }

  redemption: RedemptionState
  pointsEarned: PointsEarnedAnimation

  loading: boolean
  error: string | null
}
```

**الـ Async Thunks:**

- `fetchBalance` - جلب الرصيد
- `fetchTransactions` - جلب المعاملات
- `fetchRewards` - جلب المكافآت
- `redeemReward` - استبدال المكافآت
- `fetchCoupons` - جلب الكوبونات
- `validateCoupon` - التحقق من الكوبون
- `fetchCampaigns` - جلب الحملات
- `fetchReferralInfo` - معلومات الإحالة
- `applyReferralCode` - تطبيق كود الإحالة

#### د) نظام الثيم والألوان - `src/constants/loyaltyTheme.ts`

**نظام ندرة المكافآت بالألوان:**

```typescript
COMMON      → رمادي (#6b7280)
RARE        → أزرق (#3b82f6)
EPIC        → بنفسجي (#8b5cf6)
LEGENDARY   → ذهبي (#f59e0b)
```

**التدرجات اللونية (Gradients):**

- ذهبي للبطاقة الرئيسية
- أزرق للتقدم والنجاح
- أخضر للحالات الناجحة

**الظلال والارتفاعات (Shadows):**

- مخصصة للأداء العالي على أجهزة Android ذات الموارد المحدودة

---

### 2. **مكونات UI - `src/components/loyalty/`**

#### المكونات المتقدمة:

**PointsBalanceHero.tsx** - بطاقة الرصيد الرئيسية

- تدرج لوني ذهبي متحرك
- عداد مضحك للنقاط
- عرض إحصائيات (مكتسب، مستبدل)
- تأثيرات فيزيائية (haptics)

**AnimatedCounter.tsx** - عداد مضحك للأرقام

- حركة سلسة للأرقام
- دعم الأرقام الكبيرة
- تجربة بصرية متقدمة

**AnimatedProgressBar.tsx** - شريط التقدم المتحرك

- تدرج لوني ديناميكي
- تأثير نبض عند القرب من الاكتمال (near-completion)
- دعم الحركات المخصصة

**RewardRevealScreen.tsx** - شاشة الكشف عن المكافآت

- تأثيرات احتفالية عند استبدال المكافآت
- عرض الكوبون الجديد
- نسخ كود الكوبون بسهولة

**FeatureGate.tsx** - بوابة التحكم في الميزات

- إظهار/إخفاء أجزاء من النظام
- مفيد للاختبار والتطوير

---

### 3. **شاشات النظام**

#### LoyaltyPrototypeScreen - `src/screens/loyalty/LoyaltyPrototypeScreen.tsx`

**الوظيفة:** شاشة اختبار شاملة لجميع المكونات

- عرض بطاقة الرصيد
- تجربة أشرطة التقدم
- محاكاة الأحداث والحركات
- اختبار الاحتفالات والتنبيهات

**الاستخدام:**

```
يمكن الوصول إلى الشاشة عبر: /loyalty-prototype
```

---

## 📡 نقاط نهاية API (API Endpoints)

جميع النقاط محفوظة في `src/constants/api.ts`:

```typescript
LOYALTY: {
  BALANCE: "/api/v1/loyalty/balance";
  TRANSACTIONS: "/api/v1/loyalty/transactions";
  REWARDS: "/api/v1/loyalty/rewards";
  REDEEM: "/api/v1/loyalty/rewards/redeem";
  COUPONS: "/api/v1/loyalty/coupons";
  VALIDATE_COUPON: "/api/v1/loyalty/coupons/validate";
  CAMPAIGNS: "/api/v1/loyalty/campaigns";
  REFERRAL: "/api/v1/loyalty/referral";
  REFERRAL_APPLY: "/api/v1/loyalty/referral/apply";
}
```

---

## 🌍 الترجمات المتعددة اللغات

**الملفات:**

- `src/localization/ar.json` - العربية (الافتراضية)
- `src/localization/en.json` - الإنجليزية

**شاملة لـ:**

- عناوين وتسميات
- رسائل النجاح والخطأ
- وصفات المكافآت والحملات
- تعليمات الإحالة
- أسماء أنواع المعاملات

**الترجمات الرئيسية (ar.json):**

```json
{
  "loyalty": {
    "title": "المكافآت",
    "points": "نقطة",
    "currentBalance": "رصيدك الحالي",
    "redeemRewards": "استبدل النقاط",
    "inviteFriends": "ادع أصدقاءك",
    "activeCampaigns": "الحملات النشطة",
    "recentTransactions": "المعاملات الأخيرة",
    "common": "عادي",
    "rare": "نادر",
    "epic": "ملحمي",
    "legendary": "أسطوري",
    ...
  }
}
```

---

## 🎯 الميزات الرئيسية للنظام

### 1. **نظام النقاط (Points System)**

- اكتساب النقاط من الطلبات
- اكتساب مكافآت الترحيب للمستخدمين الجدد
- إحالات الأصدقاء
- حملات خاصة
- صلاحية انتهاء النقاط

### 2. **المكافآت (Rewards)**

- خصومات ثابتة (مثل: 50 دينار)
- خصومات نسبية (مثل: 10%)
- توصيل مجاني
- مكافآت مخصصة
- نظام ندرة بـ 4 مستويات مع ألوان مختلفة

### 3. **الكوبونات (Coupons)**

- إنشاء كوبونات عند استبدال النقاط
- حد أدنى للطلب
- صلاحية محددة
- نسخ الكود بسهولة
- استخدام عند الدفع

### 4. **الحملات (Campaigns)**

- حملات مبنية على عدد الطلبات
- حملات مبنية على إجمالي الإنفاق
- حملات مبنية على شراء منتجات محددة
- مراحل محورية (Milestones) مع نقاط
- متابعة التقدم بصرياً

### 5. **نظام الإحالات (Referral System)**

- كود إحالة فريد لكل مستخدم
- مكافآت للمحيل والمحال
- تتبع الإحالات الناجحة
- إحصائيات إجمالية
- مشاركة الرابط بسهولة

### 6. **سجل المعاملات (Transaction History)**

- تاريخ كامل للنقاط
- مرشحات حسب النوع
- معلومات تفصيلية لكل معاملة
- Pagination للأداء العالي

---

## 🚀 الحالة الحالية

### ✅ مما تم إكماله:

- ✓ Redux state management كامل
- ✓ جميع خدمات API
- ✓ نوع TypeScript شامل
- ✓ مكونات UI متقدمة مع حركات
- ✓ نظام ثيم متطور
- ✓ ترجمات كاملة (عربي + إنجليزي)
- ✓ شاشة prototype للاختبار
- ✓ نظام الألوان ونظام ندرة المكافآت

### ❌ ما لم يتم إكماله:

- ❌ **عدم دمج النظام في التطبيق الرئيسي**
  - لا يوجد tab للولاء في القائمة السفلية
  - لا يوجد رابط من الشاشات الأخرى
  - لا يوجد نقاط عرض في الشاشة الرئيسية
- ❌ لا توجد شاشات فردية معدة للإنتاج (فقط prototype)
- ❌ لا توجد معالجة خطأ متقدمة
- ❌ لا توجد سعة تخزين مؤقت (caching)

---

## 📝 أماكن الملفات المهمة

```
tawreedApp/
├── app/
│   └── loyalty-prototype.tsx              ← الراوت للنموذج
│
├── src/
│   ├── components/loyalty/                ← مكونات UI
│   │   ├── AnimatedCounter.tsx
│   │   ├── AnimatedProgressBar.tsx
│   │   ├── PointsBalanceHero.tsx
│   │   ├── FeatureGate.tsx
│   │   └── celebrations/
│   │       └── RewardRevealScreen.tsx
│   │
│   ├── constants/
│   │   ├── api.ts                         ← نقاط API
│   │   └── loyaltyTheme.ts                ← نظام الثيم
│   │
│   ├── localization/
│   │   ├── ar.json                        ← الترجمات العربية
│   │   └── en.json                        ← الترجمات الإنجليزية
│   │
│   ├── screens/loyalty/
│   │   └── LoyaltyPrototypeScreen.tsx    ← شاشة الاختبار
│   │
│   ├── services/
│   │   └── loyalty.service.ts            ← خدمة API
│   │
│   ├── store/slices/
│   │   └── loyalty.slice.ts              ← Redux state
│   │
│   └── types/
│       └── loyalty.ts                    ← جميع الأنواع
```

---

## 🔗 الروابط السريعة للملفات

- [نوع البيانات](../../src/types/loyalty.ts)
- [خدمة API](../../src/services/loyalty.service.ts)
- [Redux Slice](../../src/store/slices/loyalty.slice.ts)
- [نظام الثيم](../../src/constants/loyaltyTheme.ts)
- [ترجمات عربية](../../src/localization/ar.json)
- [مكونات UI](../../src/components/loyalty/)
- [شاشة البروتوتايب](../../src/screens/loyalty/LoyaltyPrototypeScreen.tsx)

---

## 🎓 كيفية الاستفادة من النظام

### 1. **الوصول للشاشة الحالية:**

```
انتقل إلى: /loyalty-prototype
```

### 2. **دمج النظام في التطبيق:**

ستحتاج إلى:

- إضافة tab جديد في `app/(tabs)/_layout.tsx`
- إنشاء شاشات منتجة (غير prototype)
- دمج نقاط الولاء في شاشة الطلب (عند النجاح)
- إضافة شارة نقاط في الشاشة الرئيسية

### 3. **التعديل والتطوير:**

- استخدم `@/src/store/useAppDispatch` و `useAppSelector` للوصول للبيانات
- استخدم `@/src/store/slices/loyalty.slice` للـ actions
- استخدم `@/src/services/loyalty.service` لاستدعاءات API

---

## 📊 مثال على التكامل

```typescript
// في أي مكون
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchBalance, redeemReward } from "@/src/store/slices/loyalty.slice";

export default function MyComponent() {
  const dispatch = useAppDispatch();
  const { balance, loading, error } = useAppSelector(state => state.loyalty);

  useEffect(() => {
    dispatch(fetchBalance());
  }, []);

  return (
    <View>
      <Text>{balance?.currentBalance} نقطة</Text>
    </View>
  );
}
```

---

## ⚠️ ملاحظات مهمة

1. **النظام في حالة جيدة من الناحية الفنية** لكنه غير مرئي للمستخدمين
2. **جميع الترجمات موجودة** بالعربية والإنجليزية
3. **الحركات والتأثيرات مُحسّنة** للأداء على الأجهزة الضعيفة
4. **نقاط الـ API معدة** لكن قد تحتاج للتحقق من توافق الباكند
5. **النظام جاهز للتوسع** لإضافة ميزات جديدة

---

## 🎯 الخطوات المقترحة للتكامل الكامل

1. ✅ **فهم البنية الحالية** (تم الآن!)
2. ⏳ **إنشاء شاشات منتجة** (غير prototype)
3. ⏳ **إضافة tab في القائمة السفلية**
4. ⏳ **دمج في عملية الدفع** (لعرض النقاط المكتسبة)
5. ⏳ **اختبار شامل**
6. ⏳ **التحقق من توافق الباكند**

---

**آخر تحديث:** يوني 2026
