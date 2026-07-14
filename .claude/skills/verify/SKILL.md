---
name: verify
description: How to launch and drive the tawreedApp (Expo/RN) on the iOS simulator to verify changes — no accessibility permissions on this Mac
---

# Verifying tawreedApp changes

No tap/keyboard injection on this Mac (cliclick/osascript lack accessibility perms; no idb). Everything is driven via Metro's Hermes CDP + simctl. The app hits the **production API** (`.env.local` overrides `.env.development`), and the sim is logged in as test buyer `0798336958` — avoid server writes beyond what that test account would do itself.

## Launch
- Metro: check `curl http://localhost:8081/json` — usually already running (else `npx expo start`).
- Open app / navigate: `xcrun simctl openurl booted "exp://127.0.0.1:8081/--/<route>"` (always 127.0.0.1; LAN IP hangs). Routes: `/notifications`, `/products`, `/product/<id>`, `/marketing-section/<slug>`.
- Screenshot (device-level, no perms needed): `xcrun simctl io booted screenshot out.png`.
- **Expo Go dev-menu intro sheet** ("This is the developer menu… Continue") reappears on every `openurl` and covers the bottom half of every screenshot. Couldn't dismiss it: no tap injection, Metro `/message` socket `sendDevMenu` doesn't close it, and `EXDevMenuIsOnboardingFinished` in the app plist is not the right key. Live with it — the top half of the screen is enough evidence. (Fix if it matters: find the right key via Expo Go source, or press its Continue via CDP target 0's fibers — that target hides the devtools hook though.)

## Drive via CDP
- Targets at `http://localhost:8081/json`; the **app** runtime has `__expo_dev_resetErrors` global and a working `__REACT_DEVTOOLS_GLOBAL_HOOK__`; the Expo-Go-home runtime has `__expo_hide_from_inspector__`. Connect with `ws` from tawreedApp/node_modules, `Runtime.evaluate` with `returnByValue: true`. Pass code via file, not shell args (Arabic strings break quoting).
- **Find Redux store**: walk fibers from `[...hook.getFiberRoots(1)][0].current` looking for `memoizedProps.store.getState`; stash on `globalThis.__store` (~80 fibers deep).
- **Simulate tapping a list row**: find the fiber whose `memoizedProps.children === '<visible text>'`, walk `.return` up to the nearest `memoizedProps.onPress`, call it. This runs the real handler (navigation, thunks).
- **Inject test notifications without server writes**: `store.dispatch({type:'notifications/addIncomingNotification', payload:{id:'v-x', title:'V-X', type:'system', read:true, data:{targetType:'PRODUCT', targetId:'<id>'}, linkUrl:'...', createdAt:...}})` — `read:true` prevents the markAsRead PATCH on press. Note: any screen refocus refetches and wipes injected items — re-inject after each `openurl`.
- Real ids for targets come from the public API: `curl localhost:3000/api/v1/products?limit=1`, `/categories`, `/brands`, `/marketing-sections`.

## Known limits
- Firebase Messaging doesn't run in Expo Go (RNFBAppModule RedBox is expected) — push delivery/tap can only be verified in a dev build on a device.
