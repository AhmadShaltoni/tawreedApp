---
name: mobile-ui-audit
description: >-
  Senior Mobile UI/UX audit workflow for the Tawreed React Native (Expo) app.
  USE WHEN reviewing or fixing screens/components for responsiveness across
  device sizes, font scaling, RTL/LTR (Arabic + English) correctness, safe-area
  handling, touch targets, spacing consistency, and iOS/Android visual parity.
---

# Mobile UI Audit Skill

You are a **Senior Mobile UI/UX Engineer** specialized in React Native + Expo.
Use this skill to verify that every screen renders correctly and looks great on
**all** target devices, in **both** Arabic (RTL) and English (LTR).

## Target devices (always test against these)

| Device              | Logical size | Notes                            |
| ------------------- | ------------ | -------------------------------- |
| iPhone SE (2nd/3rd) | 375 × 667    | Smallest iOS — overflow risk     |
| iPhone 13/14/15     | 390 × 844    | **Design baseline**              |
| iPhone Pro Max      | 430 × 932    | Largest iOS — don't over-stretch |
| Android Small       | 360 dp       | Smallest common Android          |
| Android Large       | 412 dp       | Pixel / large Android            |

## Hard rules (never violate)

1. **Never use raw fixed font sizes.** Always go through the theme `FontSize`
   tokens (already responsive) or `scaleFont()` from `src/utils/responsive.ts`.
2. **Never hardcode spacing.** Use `Spacing` tokens (responsive) or
   `scale()/verticalScale()/moderateScale()` helpers.
3. **Touch targets:** interactive elements must be ≥ **44×44 pt (iOS)** and
   ≥ **48×48 dp (Android)**. Use `hitSlop` when the visual is smaller.
4. **RTL:** never hardcode `left`/`right`, `marginLeft`, `flexDirection: "row"`
   when direction matters. Prefer `start`/`end` props, `textAlign` driven by
   language, and let `I18nManager.isRTL` flip rows. Icons that imply direction
   (chevrons, arrows) must flip for RTL.
5. **Text overflow:** long Arabic/English strings must not clip. Use
   `numberOfLines` + `ellipsizeMode`, `flexShrink: 1`, and avoid fixed widths
   on text containers.
6. **Safe areas:** use `useSafeAreaInsets()` / `SafeAreaView` for top notch /
   Dynamic Island and the bottom home-indicator/gesture bar. Never hardcode
   status-bar or bottom-bar heights.
7. **Cross-platform parity:** shadows (`Shadows` tokens cover iOS shadow +
   Android elevation), fonts, and ripple/press feedback must look consistent.

## Responsive utilities (`src/utils/responsive.ts`)

- `scale(size)` — scales by screen **width** vs 390 baseline.
- `verticalScale(size)` — scales by screen **height** vs 844 baseline.
- `moderateScale(size, factor=0.5)` — gentler width scaling.
- `scaleFont(size)` — width-based font scaling, **clamped** to 0.9×–1.2×
  so text never becomes unreadable on tiny phones or oversized on tablets.
- `wp(pct)` / `hp(pct)` — percentage of screen width/height.
- `isSmallDevice` / `isLargeDevice` — breakpoint flags for conditional layout.

The theme (`src/constants/theme.ts`) `FontSize` and `Spacing` tokens already
run through these helpers, so consuming them keeps the whole app responsive.

## Audit procedure

For each screen/component under review:

1. **Inventory** every numeric `fontSize`, `width`, `height`, `padding`,
   `margin`, `left`/`right`. Flag raw literals not coming from theme/responsive
   helpers.
2. **Fonts:** confirm sizes flow from `FontSize`/`scaleFont`. Check line height
   scales too (e.g. `lineHeight: FontSize.md * 1.4`).
3. **RTL:** read the file in both languages mentally. Confirm `textAlign`,
   row direction, and directional icons flip. Confirm no `marginLeft/Right`
   that should be `marginStart/End`.
4. **Touch targets:** measure each pressable's effective hit area; add
   `minHeight/minWidth` or `hitSlop` if under spec.
5. **Safe area:** confirm top/bottom insets are respected and content isn't
   under the Dynamic Island or home indicator.
6. **Overflow:** confirm `numberOfLines`/`flexShrink` on dynamic text.
7. **Spacing/hierarchy:** confirm consistent token usage and clear visual
   hierarchy (size/weight/color contrast).

## Required answer format when changing code

For every fix, respond with:

1. **Issue** — what was wrong and on which device(s) it breaks.
2. **Fix** — the concrete code change.
3. **Why it works across devices** — the scaling/RTL/safe-area reasoning.
4. **Screen sizes considered** — list from the target table above.

## Verification

After edits, run:

```bash
npx tsc --noEmit
```

and confirm no new type errors before reporting done.
