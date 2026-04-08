# Frontend Developer - Notices Implementation Summary

## Overview

Added animated notice banner feature to Tawreed mobile app. Notices are admin-managed announcements that rotate every 10 seconds on the Home screen.

---

## What Was Implemented

### 1. Type Definitions
**File**: `src/types/index.ts`

```typescript
export interface Notice {
  id: string;
  text: string;
  backgroundColor: string; // Hex color, default: #FFA500
  textColor: string; // Hex color, default: #FFFFFF
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNotice {
  id: string;
  text: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNoticesResponse {
  notices: ApiNotice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}
```

---

### 2. API Endpoints
**File**: `src/constants/api.ts`

Added to `API_ENDPOINTS`:
```typescript
NOTICES: {
  LIST: "/api/v1/notices",
}
```

---

### 3. Service Layer
**File**: `src/services/notice.service.ts`

Handles API calls and data transformation:
- `getNotices()` - Fetches active notices
- Maps API response to app types
- Applies default colors (#FFA500 bg, #FFFFFF text)
- Filters only active notices

---

### 4. Redux State Management
**File**: `src/store/slices/notices.slice.ts`

State shape:
```typescript
interface NoticesState {
  items: Notice[];        // All active notices
  currentIndex: number;   // Current notice being displayed (0-based)
  loading: boolean;
  error: string | null;
}
```

**Actions**:
- `fetchNotices()` - Async thunk to fetch from API
- `nextNotice()` - Reducer to increment currentIndex with wrap-around

**Integration**: Registered in `src/store/index.ts`

---

### 5. UI Components

#### NoticeCard (`src/components/NoticeCard.tsx`)
Displays a single notice with fade animation.

**Props**:
```typescript
interface NoticeCardProps {
  notice: Notice;
  opacity: Animated.Value; // Controls fade in/out
}
```

**Features**:
- Full width banner with padding
- Uses notice backgroundColor and textColor
- Text is centered and medium weight (14px)
- Animated opacity for smooth transitions

#### NoticeCarousel (`src/components/NoticeCarousel.tsx`)
Manages rotation and animation logic.

**Props**:
```typescript
interface NoticeCarouselProps {
  notices: Notice[];    // Array of all notices
  currentIndex: number; // Current index from Redux
  onNextNotice: () => void; // Callback to dispatch nextNotice action
}
```

**Features**:
- Auto-rotates every 10 seconds
- Fade out (300ms) → rotate index → fade in (300ms)
- Cleans up timer on unmount
- Returns null if no notices
- Wraps around to first notice after last

---

### 6. Home Screen Integration
**File**: `src/screens/home/HomeScreen.tsx`

**Changes**:
1. Import `NoticeCarousel`, `fetchNotices`, `nextNotice`
2. Extract `notices` and `currentIndex` from Redux state
3. Dispatch `fetchNotices` on screen focus (via `useFocusEffect`)
4. Dispatch `fetchNotices` on pull-to-refresh
5. Render `<NoticeCarousel />` at top of Home screen

**Placement**: The notice banner appears above the Welcome Header

---

## Data Flow

```
1. User navigates to/focuses on Home screen
                ↓
2. HomeScreen dispatches fetchNotices() 
                ↓
3. notice.service.getNotices() calls GET /api/v1/notices
                ↓
4. Redux slice stores notices array and sets currentIndex=0
                ↓
5. NoticeCarousel renders NoticeCard for notices[currentIndex]
                ↓
6. Every 10 seconds: fade out → increment index → fade in
                ↓
7. When index reaches end, wraps back to 0 (circular)
```

---

## Styling & Design

**Colors**:
- Default background: #FFA500 (warning/info orange)
- Default text: #FFFFFF (white)
- Customizable per notice

**Layout**:
- Full width of screen
- Padding: 12px horizontal, 8px vertical
- Text: 14px, medium weight, centered
- Line height: 20px

**Animation**:
- Duration: 300ms fade in/out
- Uses native driver for performance
- Smooth transitions between notices

---

## File Structure

Additions/changes:
```
src/
├── components/
│   ├── NoticeCard.tsx (NEW)
│   └── NoticeCarousel.tsx (NEW)
├── constants/
│   └── api.ts (MODIFIED - added NOTICES endpoint)
├── services/
│   └── notice.service.ts (NEW)
├── store/
│   ├── index.ts (MODIFIED - registered notices reducer)
│   └── slices/
│       └── notices.slice.ts (NEW)
├── types/
│   └── index.ts (MODIFIED - added Notice interfaces)
└── screens/
    └── home/
        └── HomeScreen.tsx (MODIFIED - integrated NoticeCarousel)
```

---

## Dependencies Used

- `react` hooks: `useEffect`, `useRef`
- `react-redux`: `useAppDispatch`, `useAppSelector`
- `redux-toolkit`: `createSlice`, `createAsyncThunk`
- `react-native`: `Animated`, `Text`, `View`
- `axios`: via `apiClient` (no new packages)

---

## Next Steps

1. ✅ Backend developer implements API endpoints (see BACKEND_NOTICES_API.md)
2. ✅ Test API responses match expected schema
3. Test in iOS/Android:
   - Notice banner appears at top of Home
   - Rotates every 10 seconds
   - Fade animation is smooth
   - No notices → banner hidden
4. Try editing notices in admin dashboard
5. Pull-to-refresh updates notices list
6. Force refresh (developer control): `dispatch(fetchNotices())`

---

## Debugging

### Check Redux State
In React Native Debugger or Redux DevTools:
```
store.notices = {
  items: [Notice[], ...],
  currentIndex: 0,
  loading: false,
  error: null
}
```

### Manual API Testing
```bash
curl http://localhost:3000/api/v1/notices
```

Should return:
```json
{
  "notices": [...],
  "pagination": { "total": X, "page": 1, "limit": 50 }
}
```

### Check Logs
- `Notice carousel mounted` - Component rendered
- `Timer set: rotating every 10000ms` - Timer active
- `nextNotice: index X → X+1` - Rotation happening

---

## Performance Considerations

- **Timer cleanup**: Properly clears intervals on unmount to prevent memory leaks
- **Animated value reuse**: Single opacity value for all notices (not recreated on each rotation)
- **No re-renders on animation**: Uses `useNativeDriver: true` for 60fps
- **Lazy fetch**: Only fetches on focus or pull-to-refresh (not constantly)
- **Cache opportunity**: Could add 5-min TTL cache in future (currently no caching)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Banner not appearing | Check Redux state: `notices.items` should have data |
| Not rotating | Verify timer is set; check browser console for errors |
| Animation janky | Ensure `useNativeDriver: true` (already configured) |
| Colors not showing | Check hex format in backend response (should be #HHHHH) |
| Notices always same one | Check `currentIndex` incrementing in Redux state |

---

## Future Enhancements

1. Add caching with TTL to reduce API calls
2. Add click handler to notices (deep linking)
3. Add priority/ordering (featured notices first)
4. Add scheduled notices (active after date X)
5. Add impression/click analytics
6. Add touch gesture to skip to next notice manually
