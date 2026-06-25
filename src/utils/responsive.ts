import { Dimensions, PixelRatio, Platform } from "react-native";

/**
 * Responsive scaling utilities for the Tawreed app.
 *
 * All sizing in the app should flow through these helpers (directly or via the
 * theme `FontSize` / `Spacing` tokens) so the UI adapts cleanly across:
 *   - iPhone SE          375 x 667
 *   - iPhone 13/14/15    390 x 844  (design baseline)
 *   - iPhone Pro Max     430 x 932
 *   - Android Small      360 dp
 *   - Android Large      412 dp
 *
 * The math is based on the React Native core `Dimensions` + `PixelRatio` APIs,
 * so there is no extra dependency to install.
 */

const { width, height } = Dimensions.get("window");

// Design baseline = iPhone 13/14/15 logical resolution.
const GUIDELINE_BASE_WIDTH = 390;
const GUIDELINE_BASE_HEIGHT = 844;

// Use the short/long edges so the math is orientation-agnostic.
const shortDimension = Math.min(width, height);
const longDimension = Math.max(width, height);

/** Raw screen width in logical pixels (dp). */
export const deviceWidth = width;
/** Raw screen height in logical pixels (dp). */
export const deviceHeight = height;

/** Phones at/under iPhone SE width or Android 360dp need tighter layouts. */
export const isSmallDevice = shortDimension <= 375;
/** Pro Max / large Android / tablets — avoid over-stretching content. */
export const isLargeDevice = shortDimension >= 414;

/**
 * Scale a size proportionally to screen **width** vs the 390pt baseline,
 * rounded to the nearest physical pixel to avoid blurry sub-pixel edges.
 */
export function scale(size: number): number {
  return PixelRatio.roundToNearestPixel(
    (shortDimension / GUIDELINE_BASE_WIDTH) * size,
  );
}

/**
 * Scale a size proportionally to screen **height** vs the 844pt baseline.
 * Use for vertical rhythm (heights, vertical paddings) where height matters.
 */
export function verticalScale(size: number): number {
  return PixelRatio.roundToNearestPixel(
    (longDimension / GUIDELINE_BASE_HEIGHT) * size,
  );
}

/**
 * Gentler width scaling: interpolates between the raw size and the fully
 * width-scaled size by `factor` (0 = no scaling, 1 = full `scale`).
 * Good for paddings/margins/radii that should grow, but not aggressively.
 */
export function moderateScale(size: number, factor = 0.5): number {
  return PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor);
}

/**
 * Font scaling. Width-based but **clamped** to 0.9x–1.2x of the base size so
 * text never becomes unreadable on tiny phones or oversized on big devices.
 */
export function scaleFont(size: number): number {
  const scaled = moderateScale(size, 0.3);
  const min = size * 0.9;
  const max = size * 1.2;
  const clamped = Math.min(Math.max(scaled, min), max);
  return Math.round(clamped);
}

/** Percentage of screen width (e.g. `wp(50)` = half the screen width). */
export function wp(percent: number): number {
  return PixelRatio.roundToNearestPixel((width * percent) / 100);
}

/** Percentage of screen height. */
export function hp(percent: number): number {
  return PixelRatio.roundToNearestPixel((height * percent) / 100);
}

/**
 * Minimum platform-correct touch target: 44pt on iOS, 48dp on Android.
 * Use as `minHeight`/`minWidth` (or to compute `hitSlop`) on small pressables.
 */
export const MIN_TOUCH_TARGET = Platform.OS === "ios" ? 44 : 48;
