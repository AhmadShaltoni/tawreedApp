import { Colors, FontSize, Spacing } from "@/src/constants/theme";
import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Section {
  title: string;
  body: string;
}

const SECTIONS_AR: Section[] = [
  {
    title: "١. التعريف بالتطبيق",
    body: "تطبيق توريد هو منصة إلكترونية تعمل كوسيط بين مجموعة من الموردين المعتمدين والمختارين بعناية وبين أصحاب المحلات التجارية والدكاكين، بهدف تسهيل عملية طلب وتوريد المنتجات المختلفة بطريقة إلكترونية آمنة وسهلة.\n\nولا يعتبر تطبيق توريد مالكاً أو مصنعاً للمنتجات المعروضة، وإنما يوفر منصة تربط بين الأطراف المشاركة في عملية البيع والتوريد.",
  },
  {
    title: "٢. شرط العمر",
    body: "يجب أن يكون مستخدم التطبيق قد أتم الثامنة عشرة (18) من عمره أو أكثر، ويعتبر استخدام التطبيق إقراراً من المستخدم بأنه مستوفٍ لهذا الشرط ويتحمل كامل المسؤولية القانونية عن صحة المعلومات المقدمة.",
  },
  {
    title: "٣. إنشاء الحساب",
    body: "يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة عند إنشاء الحساب، ويتحمل مسؤولية المحافظة على سرية بيانات الدخول وعدم مشاركتها مع أي طرف آخر.\n\nويحق لتطبيق توريد تعليق أو إلغاء أي حساب في حال ثبوت تقديم معلومات غير صحيحة أو استخدام التطبيق بشكل مخالف لهذه الشروط.",
  },
  {
    title: "٤. الطلبات والأسعار",
    body: "تخضع الأسعار والكميات المتوفرة للتغيير من قبل الموردين دون إشعار مسبق، ويحتفظ التطبيق بحق تعديل أو إلغاء أي طلب في حال وجود خطأ في الأسعار أو عدم توفر المنتجات.",
  },
  {
    title: "٥. مسؤولية التوريد والمنتجات",
    body: "يتحمل المورد المسؤولية الكاملة عن جودة المنتجات وصلاحيتها ومطابقتها للمواصفات المعروضة، بينما يقتصر دور تطبيق توريد على تسهيل وتنظيم عملية التواصل والطلب بين الموردين وأصحاب المحلات التجارية.",
  },
  {
    title: "٦. الاستخدام المسموح",
    body: "يوافق المستخدم على عدم استخدام التطبيق لأي غرض غير قانوني أو أي نشاط قد يضر بالتطبيق أو بالمستخدمين الآخرين، بما في ذلك:\n\n• تقديم معلومات أو بيانات غير صحيحة.\n• إساءة استخدام العروض أو الخصومات.\n• محاولة اختراق أو تعطيل أنظمة التطبيق.\n• استخدام التطبيق بطريقة مخالفة للقوانين والأنظمة المعمول بها في المملكة الأردنية الهاشمية.",
  },
  {
    title: "٧. الخصوصية وحماية البيانات",
    body: "يلتزم تطبيق توريد بحماية بيانات المستخدمين واستخدامها فقط للأغراض المتعلقة بتقديم الخدمات وتحسين تجربة الاستخدام، وذلك وفقاً لسياسة الخصوصية الخاصة بالتطبيق.",
  },
  {
    title: "٨. تعديل الشروط والأحكام",
    body: "يحتفظ تطبيق توريد بالحق في تعديل أو تحديث هذه الشروط والأحكام في أي وقت، ويعتبر استمرار المستخدم في استخدام التطبيق بعد نشر التعديلات موافقةً ضمنية عليها.",
  },
  {
    title: "٩. القانون المعمول به",
    body: "تخضع هذه الشروط والأحكام وتفسر وفقاً للقوانين والأنظمة النافذة في المملكة الأردنية الهاشمية.",
  },
  {
    title: "١٠. التواصل معنا",
    body: "في حال وجود أي استفسارات أو ملاحظات حول هذه الشروط والأحكام، يمكنكم التواصل معنا من خلال وسائل التواصل المعتمدة داخل التطبيق.",
  },
];

export default function TermsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const align = i18n.language === "ar" ? "right" : "left";
  const dir = i18n.language === "ar" ? "rtl" : "ltr";

  return (
    <>
      <Stack.Screen
        options={{
          title: t("menu.terms"),
          headerShown: true,
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: Colors.white },
          headerTitleStyle: { fontWeight: "700", color: Colors.text },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[styles.intro, { textAlign: align, writingDirection: dir }]}
        >
          مرحباً بك في تطبيق توريد. باستخدامك للتطبيق فإنك توافق على الالتزام
          بالشروط والأحكام التالية، وفي حال عدم موافقتك على أي من هذه الشروط،
          يرجى عدم استخدام التطبيق.
        </Text>
        {SECTIONS_AR.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text
              style={[
                styles.title,
                { textAlign: align, writingDirection: dir },
              ]}
            >
              {s.title}
            </Text>
            <Text
              style={[styles.body, { textAlign: align, writingDirection: dir }]}
            >
              {s.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  intro: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },
  section: { marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
});
