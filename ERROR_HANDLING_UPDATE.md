# نظام معالجة الأخطاء - تحديث شامل

## المشكلة الأصلية
رسائل الخطأ من الـ API كانت غير واضحة للمستخدم. مثلاً:
- `Request failed with status code 409`
- بدل عرض الرسالة الفعلية من الـ Backend: `"هذا الهاتف مسجل بالفعل"`

## الحل المطبّق

### 1. **دالة استخراج الأخطاء** (`src/utils/errorHandler.ts`)

تم إنشاء دالتان مساعدتان:

#### `extractErrorMessage(error)`
تستخرج رسالة الخطأ من صيغ متعددة:
```javascript
// صيغة 1: { error: "message" }
// صيغة 2: { message: "message" }
// صيغة 3: { errors: { field: "message" } }
// صيغة 4: Network errors
```

#### `getErrorMessage(error)`
تُرجع رسالة الخطأ مع fallback إلى رسائل قياسية حسب HTTP status codes:
```
- 409 → "هناك تضارب في البيانات..."
- 401 → "جلسة منتهية..."
- 500 → "خطأ في الخادم..."
```

### 2. **تحديث Redux Slices**

تم تحديث جميع `async thunks` في الـ Redux لاستخدام `getErrorMessage`:

**الملفات المحدثة:**
- ✅ `src/store/slices/auth.slice.ts` - login, register
- ✅ `src/store/slices/cart.slice.ts` - fetchCart, addToCart, updateCart, removeCart
- ✅ `src/store/slices/orders.slice.ts` - fetchOrders, fetchOrderDetail, createOrder
- ✅ `src/store/slices/products.slice.ts` - fetchProducts, fetchFeaturedProducts, fetchProductDetail
- ✅ `src/store/slices/categories.slice.ts` - fetchCategories
- ✅ `src/store/slices/notifications.slice.ts` - fetchNotifications, markAsRead, markAllAsRead
- ✅ `src/store/slices/notices.slice.ts` - fetchNotices

**قبل:**
```typescript
catch (error: any) {
  const message = error.response?.data?.message ?? "Failed to load products";
  return rejectWithValue(message);
}
```

**بعد:**
```typescript
catch (error: any) {
  return rejectWithValue(getErrorMessage(error));
}
```

### 3. **مكون ErrorAlert الجديد**

تم إنشاء `src/components/ui/ErrorAlert.tsx` - مكون جميل لعرض الأخطاء:

**المميزات:**
- 🎨 تصميم جميل برسالة خطأ وأيقونة
- ⏰ يختفي تلقائياً بعد 5 ثوان
- 📱 يدعم النصوص الطويلة (3 سطور)
- 🎯 يدعم العربية والإنجليزية

**الاستخدام:**
```typescript
import ErrorAlert from "@/src/components/ui/ErrorAlert";

{error && (
  <ErrorAlert
    message={error}
    onClose={() => dispatch(clearError())}
  />
)}
```

### 4. **تحديث شاشات المصادقة**

تم تحديث:
- ✅ `src/screens/auth/LoginScreen.tsx`
- ✅ `src/screens/auth/RegisterScreen.tsx`

**التحسينات:**
- استبدال النصوص البسيطة برسائل خطأ واضحة
- استخدام `ErrorAlert` component بدل `Alert.alert()`
- رسائل خطأ مفصولة عن form validation errors

## أمثلة الاستخدام

### مثال 1: تسجيل بـ رقم مستخدم مكرر
```
رسالة الخطأ من Backend: { error: "هذا الهاتف مسجل بالفعل" }
↓
يظهر للمستخدم: "هذا الهاتف مسجل بالفعل" ✅
```

### مثال 2: خطأ اتصال بالإنترنت
```
رسالة الخطأ: Network timeout
↓
يظهر للمستخدم: "انتهت مهلة الانتظار. حاول مرة أخرى." ✅
```

### مثال 3: خطأ 409 Conflict
```
HTTP Status: 409
↓
يظهر للمستخدم: "هناك تضارب في البيانات. يرجى التحقق والمحاولة مرة أخرى." ✅
```

## رسائل الأخطاء الافتراضية (Fallbacks)

عند عدم وجود رسالة محددة، يتم عرض رسالة افتراضية حسب HTTP status:

| HTTP Status | الرسالة |
|---|---|
| 400 | طلب غير صحيح |
| 401 | جلسة منتهية. يرجى تسجيل الدخول مرة أخرى. |
| 403 | لا تملك صلاحيات كافية |
| 404 | الموارد المطلوبة غير موجودة |
| 409 | هناك تضارب في البيانات |
| 422 | بيانات غير صحيحة |
| 429 | عدد محاولات كثيرة. حاول لاحقاً. |
| 500+ | خطأ في الخادم. حاول لاحقاً. |

## Localization

جميع الرسائل الافتراضية مكتوبة بالعربية.

للترجمة إلى لغات أخرى، قم بتحديث `statusCodeMessages` في `src/utils/errorHandler.ts`.

## الشاشات المدعومة حالياً

✅ الشاشات التي تعرض رسائل الأخطاء بشكل صحيح:
- LoginScreen
- RegisterScreen
- CartScreen (يستخدم errorBanner مختلف)
- CheckoutScreen
- جميع الشاشات التي تستخدم Redux

## التطوير المستقبلي

📝 العمل الإضافي المقترح:
1. إنشاء `SuccessAlert` مشابه لـ `ErrorAlert` للرسائل الناجحة
2. إضافة retry logic للأخطاء القابلة للمحاولة (مثل timeouts)
3. دعم error reporting للخادم (Sentry / LogRocket)
4. إنشاء custom hooks للأخطاء الشائعة
