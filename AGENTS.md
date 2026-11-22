# Steady Fitness

Personal fitness tracker. Guided kettlebell workouts are the first feature. Gym visit logging is planned, not implemented.

## Product requirements

- Support LG TV browser + remote, desktop, and mobile touch.
- Keep whole-session progress prominent alongside the current interval timer.
- Each strength exercise uses exactly one minute including its rest; finishing reps early never adds a second rest interval.
- Default to low beginner repetition targets, with manually chosen progression levels.
- Match illustrations to the exact movement and equipment, including unloaded warm-up steps.
- Author exercise names, cues, images, order, timings, and levels in workout-config.json. Validate before starting.
- Preserve existing browser-local settings and history. Do not clear, truncate, or fabricate dates during migrations.
- Do not publish workout or activity data, add analytics, or introduce cloud synchronization without a user request.

## Implementation

Dependency-free HTML/CSS/JavaScript and a Node static server. Keep activity storage in activities.js, separate from workout timing in workout.js and playback UI in app.js. Use activityType to distinguish kettlebell, future gym sessions, and other activities. No gym UI is needed until requested.

Run npm test for changes to timing, configuration, activity storage or playback. Use npm start for the LAN preview on port 8080. The server must allow only public website assets, never repository metadata or user data files. Browser history belongs to each browser origin, not the repository.
