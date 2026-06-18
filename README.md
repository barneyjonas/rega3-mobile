# Rega

A Hebrew-language chat app with short summaries and language support.

---

## What It Is

Rega is a mobile app built for Hebrew speakers. It supports short conversation summaries, language correction, and a simple, useful communication flow.

---

## Status

Early development — active. Currently has a known loading issue in ExpoGo (white screen on startup).

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React Native 0.81.5 | Mobile UI framework |
| Expo ^54.0.0 | Build and dev tooling |
| React 19.1.0 | UI rendering |
| TypeScript ~5.9.2 | Type safety |
| Zustand v5 | State management |
| expo-av | Audio playback and recording |
| expo-file-system | File access and storage |
| AsyncStorage | Local persistent storage |
| react-native-gesture-handler | Gesture support |
| react-native-safe-area-context | Safe area layout |

---

## Important: Expo Has Changed

> **Before writing or modifying any Expo-related code, read the exact versioned docs:**
> https://docs.expo.dev/versions/v56.0.0/
>
> Do not assume previous Expo API behavior still applies.

See also: [`AGENTS.md`](./AGENTS.md)

---

## Project Structure

```
App.tsx          # Root component
index.ts         # Entry point
src/             # App source code
assets/          # Images, fonts, and static files
public/          # Public web assets
docs/            # Web build output (Expo web / PWA)
scripts/         # Build and utility scripts
app.json         # Expo configuration
eas.json         # EAS build configuration
tsconfig.json    # TypeScript configuration
```

---

## Getting Started

```bash
npm install
npx expo start
```

Run on specific platform:
```bash
npx expo start --android
npx expo start --ios
npx expo start --web
```

Build web / PWA:
```bash
npm run build:web
```

---

## Key Files

| File | Purpose |
|---|---|
| `App.tsx` | Root component and app entry |
| `index.ts` | Expo entry point registration |
| `src/` | All app source code |
| `app.json` | Expo app config (SDK version, plugins, scheme) |
| `eas.json` | EAS build profiles |
| `AGENTS.md` | Instructions for AI coding agents |

---

## Current Known Issues

- White screen / loading failure when running in ExpoGo — under investigation
- Firebase Storage planned but not yet implemented
- AI model integration planned but not yet implemented

---

## Not Yet Implemented

- Firebase Storage
- AI model integration (options under consideration: Gemini, OpenAI, Claude, DeepSeek)
- User authentication
- Backend / server

---

## Platforms

Runs on iOS, Android, and web (PWA). Developed and tested primarily via ExpoGo.
