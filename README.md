# Steady Fitness

A standalone personal fitness tracker for TV, phone, and computer. Guided kettlebell training is the first activity; gym visits are planned as a later feature. No install, external fonts, framework, account, or internet connection is needed. Requires Node.js on the serving Mac.

## Run

From this directory:

```sh
npm start
```

Open http://localhost:8080 on the Mac. On the TV or phone, use the Network address printed by the server (for example http://192.168.1.14:8080). All devices must be on a network that permits connections between them. Allow incoming connections for Node if macOS asks. Keep the Mac awake and the server running. Bookmark the address on the TV. The Mac's address may change after reconnecting to Wi-Fi.

The server serves only the website files from this directory, not the personal vault. Stop with Ctrl+C. If port 8080 is occupied, choose another with `PORT=8081 npm start`.

## Controls

- Start opens a 10-second setup countdown, then begins the selected workout.
- The large blue bar shows progress through the whole workout. The large clock and smaller interval bar track the current exercise/rest period.
- Pause freezes both timers. Switching tabs or locking the phone pauses automatically; resume explicitly when back.
- Next/Previous skip intervals and move the workout progress accordingly. The completion screen reports actual active time separately from the planned timeline.
- Touch or click any control. Tab or arrow keys move focus; Enter/TV OK selects. Space pauses/resumes. TV Back (when forwarded by the browser) pauses and offers to end.
- Sound is enabled through a user interaction; muted/unsupported devices still show visual countdowns. Test the sound on your TV.
- Full screen and screen wake lock are best effort. TV browser behaviour varies. Wake lock may be unavailable on a plain HTTP LAN address. A full-screen browser and the Mac's power settings remain device-controlled.
- Session settings and a small training history stay in browser-local storage on each device. No data is sent elsewhere.

## Workout

40/50/60 minutes, with 2–4 strength rounds. Warm-up: 8 minutes; strength: 6 minutes per round; cool-down: 5 minutes. Walking fills the remaining time. Default 40 minutes uses two rounds; 50/60 minutes default to four, which can be reduced before starting. Five strength movements, with separate left/right rowing and suitcase holds. Warm-up illustrations show unloaded marching, hip hinges, chair sit-to-stand, and shoulder rolls. Shoulder rolls and easy wall push-ups each have their own 30-second interval. Illustrations are AI generated; read the technique notes before lifting. The 12 kg bell is a starting equipment preference, not a prescribed load for every movement.

## Verification

```sh
npm test
```

Tests cover exact plan timing, both sides, interval boundaries, pause/resume, navigation, auto-pause, active-time recording and completion. Desktop/mobile/TV visual and remote/audio QA should be completed on the intended devices.

## JSON configuration

Edit `workout-config.json` and refresh the website. No build or framework is needed. The player fetches this file on each page load, validates it, and generates the workout timeline. Invalid configuration disables Start and displays a loading error instead of starting a partial workout.

- `defaults`: initial duration, rounds, and rep level. Saved browser preferences take precedence when still valid.
- `sessions` and `roundOptions`: the duration choices, default round counts, and available round choices.
- `levels`: repetition counts per exercise, plus suitcase-hold seconds per hand. Start easy is 4 deadlifts, 3 squats, 4 rows per arm, 4 wall push-ups, and 10 seconds per hand. Build up and Steady increase these targets manually between sessions, not automatically within a workout.
- `moves` / `warmupMoves`: names, cues, technique notes, local illustration paths, and image crops. `frame` optionally selects a smaller illustration region. Current sheets are 1024 × 1536.
- `warmup` / `cooldown`: ordered steps with durations in seconds and illustration references.
- `strengthOrder`: the exercise minutes in each round. Left and right rows occupy separate minutes. A hold slot includes both hands, the changeover, and rest.
- `minuteSeconds`: 60. Each strength slot includes all exercise and rest time, with no second rest interval. Do the target reps at a controlled pace, then rest until 00:00. The optional Reps done button changes the display to rest without restarting, shortening, or extending the timer.
- `holdSwitchSeconds`: the set-down/changeover time between hands. `minimumRestSeconds` validates that hold targets leave recovery time; for repetition exercises, use the on-screen recovery guidance and reduce reps if needed.
- `countdownSeconds`: preparation countdown before the workout clock starts.
- Walking fills the remaining session time after warm-up, strength rounds, and cool-down, so changing rounds preserves the selected total duration.

For example, change `levels[0].deadlift` from `4` to `5` to adjust the easiest deadlift target. Refresh; the selected level's exercise cards and workout prompts update together. Increase only when form and recovery feel good. Leave at least 20 seconds to recover and change position, or pause for longer.

## Project structure and activity history

- `workout-config.json`: authored exercise and workout content.
- `workout.js`: validation and timeline generation.
- `app.js`: responsive workout player and device controls.
- `activities.js`: activity records, separate from playback; future gym entries can use `activityType: "gym"`.
- `server.cjs`: serves only allowlisted web assets over the home network.
- `ROADMAP.md`: current scope and possible gym tracking features.
- `AGENTS.md`: project-specific development instructions.

Records include an ID, activity type, duration, completion status, source, timestamps when known, and activity-specific details. Existing `steady-history` entries are normalized when read; old dates and original records are retained. Newly saved activity records no longer discard history after 100 entries. The repository contains no personal training history: it remains in each browser's local storage. Keeping the same URL and port preserves that browser origin when the project directory moves. `localhost` and the LAN address are separate origins, as are different devices.

Gym logging and a history dashboard are future features, not part of the initial player. See the roadmap before expanding scope.
