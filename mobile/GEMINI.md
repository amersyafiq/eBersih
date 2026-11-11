# eBersih Mobile

Expo React Native app for eBersih, a cleaning management system for UiTM Shah Alam with GA-based workforce optimization (UiTM final year project). Cleaners open the app to see the tasks the GA assigned them today, scan a space's QR code, then start and complete each task. Supervisors (Penyelia) rate the cleanliness of completed tasks.

This file is the mobile app's memory: it holds every decision that is still true. Plans in `prompts/` are history. The app lives in `mobile/` of the monorepo (`backend/`, `web/`, `mobile/`). Run commands from `mobile/`.

## Commands

~~~bash
npx expo install <package>  # ALWAYS use instead of npm install: resolves SDK-compatible versions
npx expo start              # dev server (press i for the iOS simulator, a for Android)
npx expo lint               # lint
npx tsc --noEmit            # type check
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
npx eas-cli@latest <cmd>    # EAS builds, submits, and updates (use instead of bare `eas`)
~~~

## Expo

- Expo ships breaking changes every SDK release, so don't trust memory. Before touching an Expo, EAS, or React Native API, check the `expo` major version in `package.json` and read `https://docs.expo.dev/versions/v<major>.0.0/`. For anything else, start from https://docs.expo.dev/llms.txt and follow its links.
- Routes live in `src/app/`: every file is a screen and `_layout.tsx` files define navigators. Keep components, hooks, and utils outside `src/app/`. The app has no API routes; the backend is FastAPI.
- `ios/` and `android/` are generated. Never create or edit them by hand; configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, switch to a development build (`npx expo run:ios` or `npx expo run:android`).

## Who owns what

Each tool has one job. Ask before moving a responsibility to a different tool. This app is a client only: it never touches the database, Redis, or the GA.

- **Backend:** FastAPI (Python) is the only backend. It owns all data, auth, business rules, and the GA. The app talks to it over HTTPS REST and nothing else. Do not add a second backend, BaaS, or direct database access.
- **Database and cache:** SQL Server Express and Redis sit behind FastAPI. The app never knows about them.
- **GA scheduling:** runs on the backend (APScheduler, 6:00 AM). The app only displays the resulting `Assignment` rows. It never computes, reorders, or reassigns tasks.
- **Auth:** JWT + RBAC issued by FastAPI. The app has its own login screen, stores the token in `expo-secure-store`, and sends it on every request. No third-party auth provider.
- **API access:** all `fetch()` calls live in `src/lib/api/`, one file per FastAPI router (e.g. `tasks.ts` ↔ the tasks router). Screens never call `fetch` directly. Use one shared client that attaches the token and handles 401 by signing the user out.
- **API types:** `src/types/` mirrors the backend Pydantic response schemas. Prefer generating them from the FastAPI `/openapi.json`; otherwise mirror by hand and keep names identical to the backend.
- **QR scanning:** `expo-camera` (barcode scanning). Check the current docs for the SDK version.
- **Server state:** one data-fetching approach for the whole app, chosen in the first feature plan and recorded here.

## Domain

- **Roles** (`User.Role`): `Cleaner`, `Contractor`, `Facility Admin`. Only `Cleaner` users use this app. Contractors and admins use the Next.js web dashboard, so the app must refuse their logins with a clear message.
- **Cleaner categories** (`User.Category`): `Pekerja Am` and `Operator Mesin` do tasks. `Penyelia` (supervisor) rates completed tasks. The category decides which screens a user sees.
- **Assignment** is one task done in one space by one cleaner on one GA schedule day: `AssignID`, `Status`, `StartTime`, `EndTime`, `CleanRating`, `EstimatedDuration`, `SpaceID`, `TaskID`, `ScheduleID`, `CleanerID`, `SupervisorID`, `WorkOrderID`.
- **Workflow:** cleaner scans the space's `Space.QRCode` → app checks it matches the assignment's space → Start (records `StartTime`) → Complete (records `EndTime`). Completed durations feed the GA's next run, so timestamps must be accurate.
- **Rating:** `CleanRating` is an integer 1 to 3 (database check constraint), set by a supervisor on a completed assignment.
- **Task types:** `General`, `Washroom`, `Specialized`. **Required category:** `Pekerja Am`, `Operator Mesin`. Show these backend values as-is.
- **Malay terms** (Pekerja Am, Operator Mesin, Penyelia, task names like "Sapu & Bersih Lantai") are data. Never translate or rewrite them.
- **Work orders** come from the UiTM eAduan system and can be linked to an assignment (`WorkOrderID`).
- `StartTime`/`EndTime` are SQL Server `Time` columns with no date. Do not invent dates for them on the client; show what the API returns.

## Rules

- No secrets in the app bundle. Anything under `EXPO_PUBLIC_` is public, so it may only hold the API base URL. Never commit `.env`. Keep variable names, without values, in `.env.example`.
- Tokens go in `expo-secure-store`, never `AsyncStorage`, never logged.
- The backend is the source of truth. The app never decides who may do what (RBAC is enforced by FastAPI); it only hides screens the role can't use. A 403 from the API is shown as an error, not worked around.
- Assignment status changes (start, complete, rate) are done by calling FastAPI. Update the screen from the API response, not from a local guess. Prefer server-stamped `StartTime`/`EndTime`; confirm with the backend which side stamps them before building the start/complete flow.
- Never send or compute fitness, workload variance, or duration estimates in the app. Display `EstimatedDuration` as returned.
- Dates and times shown to users use the device's local time zone (Malaysia). Don't parse backend date strings by hand when a library call exists.
- Ask before adding a dependency or service, changing the backend contract the app depends on, or deleting data. Prefer Expo modules over third-party libraries.
- Backend gaps: the FastAPI routers for auth, tasks, and reports are not built yet (only `ga` exists). If the app needs an endpoint that doesn't exist, don't mock it silently. Write the endpoint contract (method, path, request, response) in the plan, and ask the user whether to build against a stub or wait for the backend.
- Whenever you need input from the user, ask through your tool's built-in question panel so they pick from options instead of typing. Give two to four clear options with the recommended one first. Fall back to plain text only if no such panel exists.

## How we build features

For a new feature or a change across several files. Small fixes and questions skip this.

1. **Understand.** Read the code involved. Open an earlier plan only if this feature builds directly on it (pick by file name). Read the current Expo docs for the APIs you'll use, and load a matching skill if one exists. Read the matching FastAPI router or `/openapi.json` so the types are real, not guessed. Don't write version-specific APIs from memory.
2. **Ask.** If a real decision is unclear (scope, visible behavior, data shape, which role sees it), ask in the question panel, batching questions into one round and following up only if the answers raise new ones. Pick defaults for the rest and list them. If a decision in this file looks wrong, raise it instead of changing it.
3. **Plan.** Copy `prompts/TEMPLATE.md` to `prompts/NN-feature-name.md` (next number) and fill it in. The plan must be self-contained, so a fresh session can build it from this file plus the plan alone.
4. **IMPORTANT: stop and wait.** Write no app code until the user approves the plan. Ask for approval in the question panel (approve, or request changes). If they request changes, update the plan and ask again. On approval, set `Status: approved`.
5. **Build** step by step, checking each one. If a step turns out wrong, stop and explain instead of redesigning.
6. **Close out.**
   - Run the plan's Verification and give the report described under Reporting.
   - Add a short `## Result` to the plan and set `Status: done`.
   - Update this file: put each lasting decision in the section it belongs to. Replace or remove rules that are no longer true instead of appending. Keep this file under 150 lines.

## Building from designs

Wireframes and designs are attached in the chat. Screens must match them exactly: layout, spacing, sizes, colors, type, radii, icons, and copy.

- Icons, fonts, and brand images come from `assets/` or the chosen icon library, never recreated from a screenshot. If an asset is missing, use a marked placeholder and list it.
- Map every color, font, spacing value, and radius to a design-system token. List values with no token in the plan as proposed new tokens instead of hardcoding them. When creating the design system itself, derive the tokens from the designs.
- UI plans describe the design (elements, states, tokens, assets) well enough to build without the image. If building in a new session, ask for the design to be attached again.
- After building, open the screen in the iOS simulator (deep link with `xcrun simctl openurl booted <url>` when it isn't the first screen; the scheme is in `app.json`), take a screenshot (`xcrun simctl io booted screenshot <path>`), and compare it with the design. List every difference, fix, and repeat. Report which values were estimated from an image.
- QR scanning needs a real camera. Say plainly when it was only tested with a simulated or pasted code.

## Reporting

End every piece of work that changes code (features and fixes, not answers to questions) with this report. Use these headings in this order, and leave out any section that would be empty.

- **Done:** one line on the outcome, then the files changed and what changed in each.
- **Verified:** each check with ✅ or ❌ and its evidence (command output, screenshot). List what wasn't checked as ❌ with the reason. Never mark something ✅ without running it.
- **You need to:** numbered actions only the user can take, such as backend endpoints to build, test accounts to create, env values to set, or assets to provide.
- **Test it yourself:** numbered steps to reproduce the result from a fresh start (including which backend must be running and which test user to log in as), ending with `Expected:` and what the user should see.
- **Notes:** defaults picked, trade-offs, and anything left for later.

## Checks

- Lint and type check pass before any task is called done.
- Screens that load data handle loading, error, and empty states. "No tasks assigned today" is a normal state, not an error.
- Network failures (weak signal inside buildings, backend down, expired token) show a clear message and a retry. A failed start or complete is never shown as success.
- Try each flow as every cleaner category (`Pekerja Am`, `Operator Mesin`, `Penyelia`) and confirm a non-`Cleaner` role is turned away.
- Scanning a QR for the wrong space must be rejected with a clear message.