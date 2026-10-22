# Pinky

> Inclusive, safety-minded dating connections for the LGBTQ+ community.

![Pinky](./docs/logos.png)

Pinky is an Expo and React Native mobile application that helps LGBTQ+ people
discover compatible connections through profile-based browsing, mutual likes,
conversation starters, and chat assistance.

## Contents

- [Problem and solution](#problem-and-solution)
- [User journey](#user-journey)
- [Architecture](#architecture)
- [AI and suggestion paths](#ai-and-suggestion-paths)
- [Project status](#project-status)
- [Technology choices](#technology-choices)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Problem and solution

Starting a respectful conversation on a dating app can be difficult,
especially when a profile provides only a few details. Pinky gives LGBTQ+
users a welcoming, low-pressure way to browse profiles, express interest, and
start meaningful conversations without requiring users to write the perfect
opening message.

The application uses profile details and conversation history to provide
short, specific suggestions. AI-generated content is constrained to supplied
data, while curated fallback suggestions keep the experience usable when a
local model or remote AI service is unavailable.

## User journey

1. **Browse** profile cards in Discover.
2. **Pass** or send a **Violet** (like).
3. Receive a simulated **mutual match** when the profile is configured with
   `mutualLike: true`.
4. Open the match from Chat and receive opening or follow-up suggestions.
5. Select a suggestion or type a message in the conversation.
6. Optionally enable AI rewrite mode and choose a warm, playful, or flirty
   style before sending.

## Architecture

![Pinky system architecture](./docs/diagram.png)

```mermaid
flowchart TD
    User[User] --> Expo[Expo React Native app]
    Expo --> Router[Expo Router screens]
    Router --> Session[DemoSessionProvider]
    Session --> Storage[AsyncStorage]
    Session --> Profiles[Local profile data]
    Router --> Suggestions[/api/suggestions]
    Router --> Rewrite[/api/rewrite]
    Router --> Opener[/api/opener]
    Suggestions --> Ollama[Local Ollama qwen3:4b]
    Rewrite --> Ollama
    Opener --> OpenRouter[OpenRouter chat API]
    Suggestions --> Fallback[Curated fallback suggestions]
    Opener --> FallbackOpener[Curated fallback opener]
```

### Component responsibilities

| Component | Responsibility |
| --- | --- |
| Expo / React Native | Cross-platform mobile application runtime. |
| Expo Router | File-based navigation for Discover, Chat, Violets, profiles, and conversations. |
| `DemoSessionProvider` | Holds decisions, matches, messages, suggestions, and rewrite settings. |
| AsyncStorage | Persists the local demo session between launches. |
| Local JSON data | Supplies the demo profiles and profile metadata. |
| `/api/suggestions` | Generates three opening or follow-up suggestions with Ollama, or curated fallbacks. |
| `/api/rewrite` | Requests a safer rewrite of a drafted message through local Ollama. |
| `/api/opener` | Generates one inclusive profile opener through OpenRouter, or a curated fallback. |
| Ollama | Optional local model runtime for conversation suggestions and rewrites. |
| OpenRouter | Optional remote model gateway for the profile opener. |

There is currently **no local WebSocket server**. The app uses Expo API routes
and HTTP `fetch` requests.

## AI and suggestion paths

### Conversation suggestions

`/api/suggestions` sends only the profile name, bio, interests, and recent
conversation history to local Ollama using the `qwen3:4b` model. The response
must contain three distinct suggestions. If Ollama is unavailable, the route
returns curated suggestions based on the profile or latest conversation.

### AI rewrite

`/api/rewrite` can rewrite a draft in a selected style: warm, playful, or
flirty. The user keeps control of the draft and can send the original when a
rewrite fails or is not accepted.

### Profile opener

`/api/opener` sends only `name`, `bio`, and `interests` to OpenRouter. Its
prompt requires one warm, specific, inclusive, non-presumptive opener and
prohibits invented facts, sensitive-trait inference, compatibility scores, and
harmful language. If the key, provider, or response is unavailable, a
profile-aware curated opener is returned.

## Project status

### Implemented

- Expo mobile UI with Discover, Chat, and Violets tabs.
- Profile browsing with pass and Violet actions.
- Demo mutual-match behavior.
- Local session persistence with AsyncStorage.
- Chat screen with seeded demo conversation support.
- Curated opening and follow-up suggestions.
- Optional Ollama suggestions and rewrite paths.
- Optional OpenRouter profile opener with fallback behavior.
- Local demo data and local image assets.

### Demo simulation

- Matches are local and simulated; there is no production account, backend
  database, or server-side matching service.
- Profile data is local demo data.
- The `Demo: open a seeded conversation` control is development-only.
- The current session is stored on the device/browser using AsyncStorage.

### Planned work

- Production authentication, profiles, matching, and cloud persistence.
- Real-time messaging and notifications.
- Production moderation, reporting, blocking, and abuse-response workflows.
- Production model hosting, monitoring, cost controls, and privacy controls.
- Expanded automated end-to-end coverage.

## Technology choices

- **Expo + React Native:** one codebase for iOS, Android, and web during
  development.
- **Expo Router:** predictable file-based navigation that maps directly to
  user journeys.
- **TypeScript:** catches incorrect data shapes across profiles, sessions, and
  API responses.
- **AsyncStorage:** lightweight local persistence appropriate for the current
  offline demo.
- **Ollama:** enables local AI experimentation without requiring conversation
  data to leave the developer machine.
- **OpenRouter:** provides a simple model gateway for the profile opener with a
  deterministic fallback.
- **NativeWind:** keeps mobile UI styling close to component markup.

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- Expo CLI through the project scripts
- Expo Go, an iOS simulator, Android emulator, or a web browser
- Optional: Ollama with the `qwen3:4b` model
- Optional: an OpenRouter API key for AI profile openers

### Install

```bash
npm install
```

### Configure environment variables

Create `.env.local` in the project root. Never commit real credentials.

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODELS=your_provider/model_name
```

Ollama is expected locally at `http://127.0.0.1:11434` and the suggestions
route uses `qwen3:4b`.

### Run

```bash
npm start
```

Useful targets:

```bash
npm run web
npm run ios
npm run android
```

## Testing

Run the type checker and linter:

```bash
npx tsc --noEmit
npm run lint
```

Manual smoke-test path:

1. Launch the app.
2. Browse a profile and press Pass or Violet.
3. Like a profile configured with `mutualLike: true`.
4. Open Chat and select the new match.
5. Confirm three suggestions appear.
6. Send a suggestion or draft a message.
7. Enable AI rewrite mode and verify the selected style.
8. To test the opener route directly:

```bash
curl -X POST http://localhost:8081/api/opener \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","bio":"I enjoy photography","interests":["photography","music"]}'
```

The response includes `"source":"ai"` when OpenRouter succeeds and
`"source":"fallback"` when the curated fallback is used.

## Troubleshooting

- **Missing dependency:** run `npm install` before starting Expo.
- **Environment changes are ignored:** stop and restart the Expo server after
  changing `.env.local`.
- **Opener returns `fallback`:** check the API key, model name, network access,
  and Expo terminal logs. The fallback is expected without a working provider.
- **Suggestions fail:** start Ollama and make sure `qwen3:4b` is available.
- **Stale demo state:** clear the app/browser storage, then relaunch.
- **Port already in use:** start Expo on another port, for example
  `npx expo start --web --port 8082`.

## License

Pinky is distributed under the [MIT License](./LICENSE).
