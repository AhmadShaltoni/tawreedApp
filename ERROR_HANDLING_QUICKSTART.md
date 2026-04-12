# شرح نظام معالجة الأخطاء الجديد

## 🚀 كيفية العمل

### الخطوة 1: استخراج رسالة الخطأ من API

```
Backend Response: { error: "هذا الهاتف مسجل بالفعل" }
↓
getErrorMessage(error) 
↓
يُرجع: "هذا الهاتف مسجل بالفعل" ✅
```

### الخطوة 2: تخزين الرسالة في Redux State

```typescript
// في auth.slice.ts
export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const response = await authService.register(payload);
    return response;
  } catch (error: any) {
    // ✅ استخدام getErrorMessage
    return rejectWithValue(getErrorMessage(error));
  }
});
```

### الخطوة 3: عرض الرسالة للمستخدم

```typescript
// في RegisterScreen.tsx
import ErrorAlert from "@/src/components/ui/ErrorAlert";

export default function RegisterScreen() {
  const { error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  return (
    <View>
      {/* ✅ عرض رسالة الخطأ بشكل جميل */}
      {error && (
        <ErrorAlert
          message={error}
          onClose={() => dispatch(clearError())}
        />
      )}
      {/* باقي الـ form */}
    </View>
  );
}
```

## 📋 صيغ الأخطاء المدعومة

### صيغة 1: الخطأ البسيط
```json
{
  "error": "هذا الهاتف مسجل بالفعل"
}
```
✅ سيظهر للمستخدم: `هذا الهاتف مسجل بالفعل`

### صيغة 2: رسالة (message)
```json
{
  "message": "Failed to create order"
}
```
✅ سيظهر للمستخدم: `Failed to create order`

### صيغة 3: تفاصيل الحقول
```json
{
  "errors": {
    "email": "Email is invalid",
    "password": "Password too short"
  }
}
```
✅ سيظهر للمستخدم: `Email is invalid` (أول error)

### صيغة 4: أخطاء الشبكة
```
Network timeout / Connection refused
```
✅ سيظهر للمستخدم: `انتهت مهلة الانتظار. حاول مرة أخرى.`

## 🔄 الملفات المحدثة

### Redux Slices (7 ملفات):
```
✅ src/store/slices/auth.slice.ts
✅ src/store/slices/cart.slice.ts
✅ src/store/slices/orders.slice.ts
✅ src/store/slices/products.slice.ts
✅ src/store/slices/categories.slice.ts
✅ src/store/slices/notifications.slice.ts
✅ src/store/slices/notices.slice.ts
```

### Screens (تم تحديث):
```
✅ src/screens/auth/LoginScreen.tsx
✅ src/screens/auth/RegisterScreen.tsx
```

### ملفات جديدة:
```
✨ src/utils/errorHandler.ts        (دالتا المساعد)
✨ src/components/ui/ErrorAlert.tsx (مكون عرض الأخطاء)
```

## 💡 أمثلة واقعية

### مثال 1: تسجيل بـ رقم مستخدم موجود

**الطلب:**
```
POST /api/v1/auth
{ phone: "0790123456", ... }
```

**الرد:**
```json
Status: 409
{
  "error": "هذا الهاتف مسجل بالفعل"
}
```

**ما يرى المستخدم:**
```
┌─────────────────────────────────────┐
│ ⚠️  هذا الهاتف مسجل بالفعل           │
└─────────────────────────────────────┘
(يختفي تلقائياً بعد 5 ثوان)
```

### مثال 2: عدم الاتصال بالإنترنت

**الخطأ:**
```
Network Error: timeout
```

**ما يرى المستخدم:**
```
┌─────────────────────────────────────┐
│ ⚠️  انتهت مهلة الانتظار. حاول مرة    │
│    أخرى.                            │
└─────────────────────────────────────┘
```

### مثال 3: خطأ الخادم

**الرد:**
```
Status: 500
{}
```

**ما يرى المستخدم:**
```
┌─────────────────────────────────────┐
│ ⚠️  خطأ في الخادم. حاول لاحقاً.     │
└─────────────────────────────────────┘
```

## 🎨 مميزات ErrorAlert

✅ **التصميم:**
- أيقونة تحذير حمراء
- خلفية وردية فاتحة
- خط أحمر على اليسار

✅ **السلوك:**
- اختفاء تلقائي بعد 5 ثوان
- يمكن إغلاقه يدوياً
- يدعم النصوص الطويلة (3 سطور)

✅ **اللغات:**
- العربية (RTL)
- الإنجليزية (LTR)

## 🔗 كيفية الاستخدام في شاشة جديدة

```typescript
import ErrorAlert from "@/src/components/ui/ErrorAlert";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { clearError } from "@/src/store/slices/your.slice";

export default function YourScreen() {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.your);

  return (
    <View>
      {error && (
        <ErrorAlert
          message={error}
          onClose={() => dispatch(clearError())}
        />
      )}
      {/* باقي الـ UI */}
    </View>
  );
}
```

## 📊 المقارنة قبل وبعد

### قبل ❌
- رسالة عامة وغير واضحة: "Failed to register"
- لا يعرف المستخدم السبب الفعلي
- رسائل في Alert بدل الـ UI

### بعد ✅
- رسالة محددة وواضحة: "هذا الهاتف مسجل بالفعل"
- رسائل الأخطاء من الـ Backend تظهر مباشرة
- تصميم جميل في الـ UI
- اختفاء تلقائي بعد 5 ثوان
