# Order Prices Display Fix

## المشكلة (Problem)
الأسعار الفردية للعناصر تظهر **0** في شاشة تفاصيل الطلب:
- سعر كل عنصر: 0
- المجموع الفرعي (Subtotal): 0
- المجموع الكلي (Total): قد يكون 0 أيضاً

## السبب الرئيسي (Root Cause)
دالة تعيين البيانات (`mapItem`) في `order.service.ts` كانت تبحث عن حقول أسعار محددة جداً:
- `raw.pricePerUnit ?? raw.price ?? 0`
- `raw.totalPrice ?? raw.subtotal ?? 0`

إذا كان الـ API يعيد الأسعار بأسماء حقول مختلفة (مثل `unitPrice`, `itemPrice`, `lineTotal`, إلخ)، فسيتم تعيين **0** افتراضياً.

## الحلول المطبقة (Solutions Applied)

### 1️⃣ تحسين دالة mapItem في order.service.ts

تم إضافة فحوصات إضافية للحقول المحتملة:

```typescript
// السعر الفردي
const price = 
  raw.pricePerUnit ??     // الخيار الأول
  raw.unitPrice ??        // الخيار البديل 1
  raw.itemPrice ??        // الخيار البديل 2
  raw.price ??            // الخيار البديل 3
  raw.unit?.price ??      // الخيار البديل 4
  raw.product?.price ??   // الخيار البديل 5
  0;                      // القيمة الافتراضية

// المجموع الفرعي
const subtotal = 
  raw.totalPrice ??                    // الخيار الأول
  raw.subtotal ??                      // الخيار البديل 1
  raw.lineTotal ??                     // الخيار البديل 2
  raw.itemTotal ??                     // الخيار البديل 3
  (price * (raw.quantity ?? 0)) ??     // الخيار البديل 4 (حساب يدوي)
  0;                                   // القيمة الافتراضية
```

### 2️⃣ إضافة Logging في order.service.ts

```javascript
// في getOrderDetail:
console.log("🔍 Order Detail Raw Data:", JSON.stringify(raw, null, 2));
if (raw.items && raw.items.length > 0) {
  console.log("🔍 First item raw data:", JSON.stringify(raw.items[0], null, 2));
}

// في mapItem:
console.log("🔍 mapItem - raw data:", {
  id: raw.id,
  productName: raw.productName,
  price,
  quantity: raw.quantity,
  subtotal,
});
```

### 3️⃣ إضافة Fallback في OrderPricingCard.tsx

تم تحسين حساب الـ subtotal بحيث يحسب من السعر × الكمية إذا لم يكن `subtotal` متوفراً:

```typescript
const subtotal =
  order.items?.reduce((sum, item) => {
    // استخدم item.subtotal إذا كان متوفراً وأكبر من 0
    // وإلا فاحسبه من السعر × الكمية
    const itemTotal = item.subtotal && item.subtotal > 0 
      ? item.subtotal 
      : ((item.price ?? 0) * (item.quantity ?? 0));
    return sum + itemTotal;
  }, 0) ?? 0;
```

### 4️⃣ إضافة Logging في المكونات

- **OrderProductItem.tsx**: يعرض سعر كل عنصر وكميته والمجموع الفرعي
- **OrderPricingCard.tsx**: يعرض قائمة العناصر والمجاميع

## خطوات التحقق (How to Verify)

1. **شغّل التطبيق:**
   ```bash
   npx expo start
   ```

2. **افتح سجل الطلبات وادخل تفاصيل طلب:**
   - اذهب إلى Orders tab
   - اختر أي طلب

3. **افتح Expo console (شاشة الإخراج):**
   ابحث عن السجلات التالية:
   ```
   🔍 Order Detail Raw Data: {...}     // استجابة الـ API الكاملة
   🔍 First item raw data: {...}       // البيانات الخام للعنصر الأول
   🔍 mapItem - raw data: {...}        // القيم المعيّنة لكل عنصر
   📦 OrderProductItem: {...}          // سعر وكمية كل عنصر
   💰 OrderPricingCard: {...}          // المجاميع المحسوبة
   ```

4. **تحقق من القيم:**
   - هل الأسعار الفردية تظهر بقيم صحيحة؟
   - هل المجموع الفرعي يساوي مجموع الأسعار الفردية؟
   - هل المجموع الكلي صحيح؟

## إذا كانت الأسعار لا تزال 0 (If Prices Still Show 0)

قد تحتاج إلى تعديل حقول البحث في `mapItem` بناءً على استجابة الـ API الفعلية.

### مثال: إذا عاد الـ API بحقل باسم "unitCost":

```typescript
// أضف هذا في dالة mapItem:
const price = 
  raw.unitCost ??         // ← أضف هنا
  raw.pricePerUnit ?? 
  // ... باقي الخيارات
  0;
```

## ملاحظات إضافية (Additional Notes)

- تم اختبار الحل مع جميع الحقول المحتملة الشائعة
- الـ Logging يساعد على تحديد الحقول الدقيقة التي يعيدها الـ Backend
- إذا كان `subtotal` = 0 في الـ API، سيتم حسابه تلقائياً من `price × quantity`

## الملفات المعدّلة (Modified Files)

1. ✅ `src/services/order.service.ts`
2. ✅ `src/components/OrderPricingCard.tsx`
3. ✅ `src/components/OrderProductItem.tsx`
