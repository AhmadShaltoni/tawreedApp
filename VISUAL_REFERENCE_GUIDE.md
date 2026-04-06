# 🎨 Tawreed Modern Design System — Visual Reference

## Color Palette

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIMARY - DEEP BLUE                      │
│                 Trust & Professionalism                     │
├─────────────────────────────────────────────────────────────┤
│  Main:      #1e3a8a  ██████████  Navigation, Headers
│  Hover:     #1e40af  ██████████  Interactive States
│  Light:     #eff6ff  ██████████  Backgrounds
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   ACCENT - ORANGE                           │
│                    Action & Urgency                         │
├─────────────────────────────────────────────────────────────┤
│  Main:      #f97316  ██████████  CTAs, Urgency, Badges
│  Dark:      #ea580c  ██████████  Hover State
│  Light:     #fef3c7  ██████████  Highlights
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   NEUTRAL - GRAYS                           │
│               Structure & Readability                       │
├─────────────────────────────────────────────────────────────┤
│  Background: #f9fafb  ██████████  App Background
│  Surface:    #ffffff  ██████████  Cards
│  Text:       #111827  ██████████  Primary Text
│  Secondary:  #6b7280  ██████████  Descriptions
│  Light:      #9ca3af  ██████████  Disabled, Hints
│  Border:     #e5e7eb  ██████████  Dividers
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   SEMANTIC - STATUS                         │
│                    System Feedback                          │
├─────────────────────────────────────────────────────────────┤
│  Success:    #10b981  ██████████  Confirmed, Delivered
│  Warning:    #f59e0b  ██████████  Processing, Pending
│  Error:      #ef4444  ██████████  Failed, Validation
│  Info:       #0ea5e9  ██████████  New, Promotions
└─────────────────────────────────────────────────────────────┘
```

---

## Typography Hierarchy

```
DISPLAY (32px)          ─────────────────────────────────
Hero Title, App Title      Font: Zain (Logo only)
Line Height: 1.2           Weight: Bold (700)
                           Usage: One per screen, max

HEADING 1 (24px)        ─────────────────────────────────
Screen Titles              Font: Rubik / Geist Sans
Line Height: 1.3           Weight: SemiBold (600)
                           Usage: Page headers

HEADING 2 (20px)        ─────────────────────────────────
Section Headers            Font: Rubik / Geist Sans
Line Height: 1.3           Weight: SemiBold (600)
                           Usage: Section titles

HEADING 3 (18px)        ─────────────────────────────────
Card Titles                Font: Rubik / Geist Sans
Line Height: 1.3           Weight: Medium (500)
                           Usage: Product names, cards

BODY LARGE (16px)       ─────────────────────────────────
Main Copy                  Font: Rubik / Geist Sans
Line Height: 1.5           Weight: Regular (400)
                           Usage: Descriptions, main text

BODY REGULAR (14px)     ─────────────────────────────────
Secondary Text             Font: Rubik / Geist Sans
Line Height: 1.5           Weight: Regular (400)
                           Usage: Details, secondary info

CAPTION (12px)          ─────────────────────────────────
Meta Info                  Font: Rubik / Geist Sans
Line Height: 1.4           Weight: Regular (400)
                           Usage: Prices, timestamps

LABEL (11px)            ─────────────────────────────────
Badges, Labels             Font: Rubik / Geist Sans
Line Height: 1.2           Weight: SemiBold (600)
                           Usage: Badges, status
```

---

## Spacing Scale

```
xs:     4px    ┌─┐         (between icon + text)
sm:     8px    └─┘         (small gaps)
md:    12px    └────┘      (card padding)
lg:    16px    └────────┘  (section margins)
xl:    20px    └──────────┘ (large spacing)
xxl:   24px    └────────────┘ (section gaps)
xxxl:  32px    └──────────────┘ (between sections)
xxxxl: 40px    └────────────────┘ (major gaps)
```

---

## Border Radius

```
sm:   6px     ┌──────┐      (small: tags, badges)
md:  10px     ┌────────┐    (medium: cards, buttons)
lg:  14px     ┌──────────┐  (large: sections)
xl:  20px     ┌────────────┐ (extra large: modals)
full: 9999px  ⭕           (perfect circle: avatars)
```

---

## Component Usage Guide

### ModernButton Variants

```
ACCENT (Orange - CTAs)
┌──────────────────────┐
│  Add to Cart  ➕      │  ← Use for high-value actions
└──────────────────────┘
  Color: #f97316
  Usage: "Add to Cart", "Proceed", "Shop Now"

PRIMARY (Blue - Navigation)
┌──────────────────────┐
│  Continue             │  ← Use for primary navigation
└──────────────────────┘
  Color: #1e3a8a
  Usage: "Next", "Save", "Submit"

SECONDARY (White - Alternative)
┌──────────────────────┐
│  Cancel               │  ← Use for secondary actions
└──────────────────────┘
  Color: #ffffff
  Border: #e5e7eb
  Usage: "Cancel", "Skip", "Back"

GHOST (Transparent - Text)
┌──────────────────────┐
│  Learn More           │  ← Use for tertiary actions
└──────────────────────┘
  Color: transparent
  Usage: "Learn More", "View Details"
```

---

## Badge System

```
PRIMARY        ███  Blue badge     | Section headers, categories
ACCENT         ███  Orange badge   | Promotions, bestsellers
SUCCESS        ███  Green badge    | Completed, delivered
WARNING        ███  Yellow badge   | Processing, pending
ERROR          ███  Red badge      | Failed, attention needed
INFO           ███  Cyan badge     | New products, announcements
```

---

## Shadow Elevation

```
SOFT (Cards)
  ├─ Y Offset: 2px
  ├─ Blur: 8px
  ├─ Opacity: 5%
  └─ Usage: Cards, list items

MEDIUM (Interactive)
  ├─ Y Offset: 4px
  ├─ Blur: 12px
  ├─ Opacity: 8%
  └─ Usage: Buttons on press, floating elements

STRONG (Modals)
  ├─ Y Offset: 8px
  ├─ Blur: 16px
  ├─ Opacity: 15%
  └─ Usage: Modals, overlays, popovers
```

---

## Animation Timing

```
FAST (100ms)
└─► Button press feedback (scale down)
└─► Toast notification appear

NORMAL (300ms)
└─► Page transitions
└─► List item animations
└─► Modal slide-in

SLOW (600ms)
└─► Navigation stack changes
└─► Skeleton loading shimmer
└─► Carousel auto-scroll
```

---

## Screen Layout Templates

### Home Screen Layout

```
┌─────────────────────────────┐
│   Search  🔔 (notification) │  ← Sticky header
├─────────────────────────────┤
│                             │
│    ┌─────────────────────┐  │
│    │   Hero Banner       │  │  ← Full width image
│    │   (Carousel)        │  │
│    └─────────────────────┘  │
│                             │
│  [Category] [Sales] [My Ord]│  ← Quick action tiles
│                             │
│  Featured Products          │
│  ┌────────┐ ┌────────┐      │
│  │Product │ │Product │      │  ← Horizontal scroll
│  └────────┘ └────────┘      │
│                             │
│  Shop by Category           │
│  ┌────────┐ ┌────────┐      │
│  │Category│ │Category│      │  ← 2x2 grid
│  └────────┘ └────────┘      │
│                             │
│  What Customers Say         │
│  ┌─────────────────────┐    │
│  │ ⭐⭐⭐⭐⭐ Review  │    │  ← Social proof
│  │ "Great products!" - │    │
│  │ Customer Name       │    │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

### Product Detail Layout

```
┌─────────────────────────────┐
│  ◀  Product Title        × │  ← Sticky header
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐   │
│  │    Image Gallery    │   │  ← Main product image
│  │  (swipeable)        │   │  ← 20% OFF badge
│  └─────────────────────┘   │
│  [•] [○] [○] [○]           │  ← Thumbnails
│                             │
│  ┌─────────────────────┐   │
│  │ ⭐4.8 (2,347) 🔥    │   │  ← Rating + Bestseller
│  │                     │   │
│  │ JD 45 ~~60~~ Save15 │   │  ← Price breakdown
│  │                     │   │
│  │ ✓ In Stock (5 left) │   │  ← Stock status
│  │ 🎉 You save JD 15   │   │  ← Savings highlight
│  └─────────────────────┘   │
│                             │
│  Quantity: [−] 50 [+]       │  ← Quantity selector
│                             │
│  [━━━━━━━━━━━━━━━━━━━━━━]   │  ← Sticky "Add to Cart"
│  │ + Add to Cart       │   │
│  [━━━━━━━━━━━━━━━━━━━━━━]   │
│                             │
│ Product Details             │  ← Expandable sections
│ Specifications              │
│ Reviews & Ratings           │
│ Recommended Products        │
│                             │
└─────────────────────────────┘
```

### Cart Screen Layout

```
┌─────────────────────────────┐
│          Cart (3 items)     │
├─────────────────────────────┤
│                             │
│ ┌──────────┐                │
│ │          │ Product Name   │  ← Cart item
│ │ Image    │ JD 45 × 50     │
│ │          │ [−] 50 [+
]     │
│ └──────────┘ Total: JD 2250 │
│                  🗑️ Remove   │
│                             │
│ ┌──────────────────────┐   │
│ │ Subtotal: JD 2,250   │   │  ← Pricing card
│ │ Discount: − JD 225   │   │
│ │ Shipping: JD 25      │   │
│ │ ─────────────────    │   │
│ │ Total:   JD 2,050    │   │
│ └──────────────────────┘   │
│                             │
│ 💰 You save JD 225! 🎉      │  ← Savings highlight
│                             │
│ [━━━━━━━━━━━━━━━━━━━━━━]   │  ← Smart nudge
│ Add JD 50 more for FREE    │
│ SHIPPING                    │
│ [Suggested Items]           │
│ [━━━━━━━━━━━━━━━━━━━━━━]   │
│                             │
│ [Promo Code: Apply ➜]       │  ← Promo code
│                             │
│ [━━━━━━━━━━━━━━━━━━━━━━]   │
│ │  Proceed to Checkout │   │
│ │ Continue Shopping    │   │
│ [━━━━━━━━━━━━━━━━━━━━━━]   │
│                             │
│ 🔒 100% Authentic          │  ← Trust signals
│ 30-day Return Guarantee    │
│                             │
└─────────────────────────────┘
```

---

## Color Formula Examples

### Discount Badge (FOMO)

```
Background: #f97316 (Accent - Orange)  ← Creates urgency
Text:       #ffffff (White)             ← High contrast, readable
Position:   Top-right corner            ← Immediately visible
Animation:  Scale pulse on view         ← Draws attention
Text:       "-20%" or "SALE"            ← Short, punchy
```

### Success Message (Positive Reinforcement)

```
Background: rgba(16, 185, 129, 0.1)    ← Success color, subtle
Left Border: #10b981 (Green)            ← Visual emphasis left
Text:       #10b981 (Green)             ← Matches border
Icon:       ✓ Checkmark                 ← Universal success symbol
Message:    "3 items added ✓"           ← Confirms action
```

### Stock Warning (Scarcity)

```
Background: #ef4444 (Red)               ← Signals danger/urgency
Text:       #ffffff (White)             ← High contrast
Position:   Bottom-left of image        ← Visible corner
Message:    "Only 5 left"               ← Concrete number (FOMO)
Timing:     Permanent until out         ← Always visible if true
```

---

## State Variations

### Button States

```
NORMAL:     Scale 1.0, Shadow: soft
PRESSED:    Scale 0.96, Shadow: medium, Haptic: feedback
HOVER:      Opacity 0.9, Shadow: medium (on desktop)
DISABLED:   Opacity 0.5, bg: #9ca3af, no interaction
LOADING:    Show spinner, text fades out, disable interactions
```

### Card States

```
DEFAULT:    Background: white, Shadow: soft, Border: none
PRESSED:    Scale: 0.98, Shadow: medium
HOVER:      Background: #f9fafb, Shadow: medium (desktop)
SELECTED:   Border: 2px #1e3a8a, Shadow: medium
LOADING:    Skeleton shimmer, disable interactions
```

### Input States

```
NORMAL:     Border: #e5e7eb, bg: #f3f4f6, placeholder: #9ca3af
FOCUSED:    Border: #1e3a8a (2px), bg: #ffffff, shadow: soft
ERROR:      Border: #ef4444 (2px), bg: #fff5f5, text: #ef4444
DISABLED:   Border: #e5e7eb, bg: #f9fafb, opacity: 0.5
FILLED:     Border: #1e3a8a, bg: #ffffff, text: #111827
```

---

## Animation Sequences

### Add to Cart Flow

```
1. User taps "Add to Cart" button
   └─► Scale: 1.0 → 0.96 (100ms)
   └─► Haptic: Impact feedback
   └─► Color: Hold

2. Button animates back to normal
   └─► Scale: 0.96 → 1.0 (150ms)

3. Toast notification appears
   └─► Slide up from bottom (300ms)
   └─► Text: "✓ Added to cart"

4. Cart badge updates
   └─► Count: 3 → 4
   └─► Scale pulse animation

5. Auto-dismiss notification
   └─► After 3 seconds
   └─► Slide down (300ms)
```

### Page Transition

```
1. User taps product card
   └─► Component scale: 0.98 (immediate)

2. Navigate to product detail
   └─► Current page: Fade out (300ms)
   └─► New page: Slide from right (300ms)

3. Product detail loads
   └─► Image appears with fade
   └─► Skeleton loaders for content
   └─► Shimmer animation (once loaded)

4. Content fills in
   └─► Skeleton → Real content (smooth)
```

---

## Dark Mode Support (Optional)

```
If implementing dark mode, swap:

LIGHT MODE          →  DARK MODE
#ffffff (surface)   →  #1e293b (surface)
#f9fafb (bg)        →  #0f172a (bg)
#111827 (text)      →  #f1f5f9 (text)
#6b7280 (secondary) →  #cbd5e1 (secondary)

Keep brand colors the same:
#1e3a8a (primary)   →  #1e3a8a (primary)
#f97316 (accent)    →  #f97316 (accent)

Use system detection:
useColorScheme() hook automatically switches
based on device settings
```

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

```
Color Contrast:
├─ Text on background: 4.5:1 minimum
├─ Large text: 3:1 minimum
├─ UI components: 3:1 minimum
└─ Non-text: 3:1 minimum

Interactive Elements:
├─ Minimum size: 44×44 points
├─ Keyboard navigation: Full support
├─ Focus indicators: Visible outlines
└─ Touch targets: Adequate spacing

Text:
├─ Font size: Minimum 12pt
├─ Line height: 1.5 minimum
├─ Letter spacing: Readable
└─ Color not only indicator: Icons + text both

Organization:
├─ Semantic HTML/structure
├─ Proper heading hierarchy
├─ Meaningful link text
└─ Form labels with clear purpose
```

---

## Performance Targets

```
Page Load:        < 2 seconds
Scroll Smoothness: 60 FPS (no jank)
Animation Frames: 60 FPS
Button Tap:       < 300ms response
Image Load:       Lazy + cached
Skeleton Load:    Immediate (0ms)
```

---

**Version**: 1.0 — Visual Reference Guide  
**Last Updated**: April 5, 2026  
**Status**: Complete & Ready for Implementation
