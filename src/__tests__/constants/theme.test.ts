/**
 * Theme Constants Tests
 * Tests: color values, spacing consistency, design system integrity
 */
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";

describe("Theme Constants", () => {
  // ─── Colors ───
  describe("Colors", () => {
    it("should have valid hex color values", () => {
      const hexRegex = /^#[0-9a-fA-F]{6}$/;
      const colorEntries = Object.entries(Colors).filter(
        ([key]) => key !== "overlay",
      );

      for (const [key, value] of colorEntries) {
        expect(value).toMatch(hexRegex);
      }
    });

    it("should have overlay as rgba", () => {
      expect(Colors.overlay).toMatch(/^rgba\(/);
    });

    it("should have all required design colors", () => {
      expect(Colors.primary).toBeDefined();
      expect(Colors.secondary).toBeDefined();
      expect(Colors.background).toBeDefined();
      expect(Colors.surface).toBeDefined();
      expect(Colors.text).toBeDefined();
      expect(Colors.error).toBeDefined();
      expect(Colors.success).toBeDefined();
      expect(Colors.warning).toBeDefined();
      expect(Colors.info).toBeDefined();
    });

    it("should have distinct status colors", () => {
      const statusColors = [
        Colors.error,
        Colors.success,
        Colors.warning,
        Colors.info,
      ];
      const unique = new Set(statusColors);
      expect(unique.size).toBe(4);
    });
  });

  // ─── Spacing ───
  describe("Spacing", () => {
    it("should have ascending spacing values", () => {
      expect(Spacing.xs).toBeLessThan(Spacing.sm);
      expect(Spacing.sm).toBeLessThan(Spacing.md);
      expect(Spacing.md).toBeLessThan(Spacing.lg);
      expect(Spacing.lg).toBeLessThan(Spacing.xl);
      expect(Spacing.xl).toBeLessThan(Spacing.xxl);
      expect(Spacing.xxl).toBeLessThan(Spacing.xxxl);
      expect(Spacing.xxxl).toBeLessThan(Spacing.xxxxl);
    });

    it("should have positive integer values", () => {
      for (const [, value] of Object.entries(Spacing)) {
        expect(value).toBeGreaterThan(0);
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  // ─── Font Sizes ───
  describe("FontSize", () => {
    it("should have ascending font sizes", () => {
      expect(FontSize.xxs).toBeLessThan(FontSize.xs);
      expect(FontSize.xs).toBeLessThan(FontSize.sm);
      expect(FontSize.sm).toBeLessThan(FontSize.md);
      expect(FontSize.md).toBeLessThan(FontSize.lg);
      expect(FontSize.lg).toBeLessThan(FontSize.xl);
      expect(FontSize.xl).toBeLessThan(FontSize.xxl);
      expect(FontSize.xxl).toBeLessThan(FontSize.xxxl);
    });

    it("should have readable font sizes (>= 10)", () => {
      for (const [, value] of Object.entries(FontSize)) {
        expect(value).toBeGreaterThanOrEqual(10);
      }
    });
  });

  // ─── Border Radius ───
  describe("BorderRadius", () => {
    it("should have ascending border radius", () => {
      expect(BorderRadius.sm).toBeLessThan(BorderRadius.md);
      expect(BorderRadius.md).toBeLessThan(BorderRadius.lg);
      expect(BorderRadius.lg).toBeLessThan(BorderRadius.xl);
    });

    it("should have full as 9999 (pill shape)", () => {
      expect(BorderRadius.full).toBe(9999);
    });
  });

  // ─── Shadows ───
  describe("Shadows", () => {
    it("should have ascending shadow intensity", () => {
      expect(Shadows.sm.shadowOpacity).toBeLessThan(Shadows.md.shadowOpacity);
      expect(Shadows.md.shadowOpacity).toBeLessThan(Shadows.lg.shadowOpacity);
    });

    it("should have ascending elevation for Android", () => {
      expect(Shadows.sm.elevation).toBeLessThan(Shadows.md.elevation);
      expect(Shadows.md.elevation).toBeLessThan(Shadows.lg.elevation);
    });

    it("should have black shadow color", () => {
      expect(Shadows.sm.shadowColor).toBe("#000");
      expect(Shadows.md.shadowColor).toBe("#000");
      expect(Shadows.lg.shadowColor).toBe("#000");
    });
  });
});
