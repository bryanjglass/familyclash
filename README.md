# Family Clash

A survey-style family game show. One person (the **host**) runs the game from a tablet or netbook, and the **board** with the answer tiles shows on the TV.

- No install, no accounts, no build step. Plain HTML/CSS/JS.
- Games are saved on the host device (in the browser's `localStorage`).
- Works offline once loaded. The optional LAN server needs only Node.js.

## Quick start

| Setup | What to do |
| --- | --- |
| **Netbook/laptop + Google TV** (simplest) | Open `index.html` in Chrome → **Play** → **📺 Connect TV** → **Cast the board** and pick your TV. Run the game from the laptop. |
| **Tablet as the remote** | On a laptop on the same Wi-Fi run `node server.js`. Open the printed address on the tablet (host) and `http://<laptop-ip>:8080/board` on the laptop. Enter the room code, then cast the laptop's board tab to the TV. |
| **No casting at all** | Open the board on any big screen's browser (TV browser app, a laptop on HDMI) using the server as above. |

> **Casting tip:** "Cast the board" uses Chrome's Presentation API, which needs `https://` or `http://localhost`. You get that from `node server.js` or any static host such as GitHub Pages. If it isn't offered, use **Open the board** and then Chrome's **⋮ → Cast… → Cast tab**.

## Features

- **Game library:** create, edit, duplicate, delete, import and export (JSON) games. It comes with **21 ready-to-play games** written for families with middle-schoolers (see below).
- **Editor:** one card per round with a question, up to 8 answers with points, and a normal/double/triple points setting.
  - Everything autosaves.
  - Pressing Enter jumps to the next box and adds a new answer row at the end.
  - **📋 Paste a list** takes lines like `Pizza 32`.
  - Answers are automatically sorted highest-first when you play.
- **Teams:** set names and colours. The last-used teams are remembered.
- **Live controls:**
  - Tap an answer to flip it on the board.
  - **✕ Wrong answer** shows big X's on the TV.
  - The bank adds up the points (with the round's multiplier).
  - **Give to [team]** banks the points to that team.
  - **Reveal the rest** shows the remaining answers without scoring them.
  - Tap a team to mark who's playing.
  - Tap a score to adjust it by hand.
  - Hide or show the question on the TV.
- **Guess timer** (optional): choose Off or 5–60 seconds per guess on the setup screen, or mid-game from **⚙** or the **⋯** menu.
  - A countdown ring shows on the TV, with ticks in the last 5 seconds and a buzzer at zero.
  - The clock can start automatically for each new guess (after a reveal or a wrong answer), or you start it with **▶ Start clock** or the `T` key.
  - Running out of time can count as a wrong answer, or just sound the buzzer.
  - Auto-start pauses once a team has 3 strikes, so you start the clock yourself for the steal attempt.
  - The host's clock decides when time is up, and the board corrects for clock differences between devices.
- **Undo** for every action, so a mis-tap is never a problem.
- **Resume:** a game in progress survives a page reload.
- **Board:**
  - Scales to any screen (1080p/4K TV, tablet, netbook) with overscan-safe margins.
  - Flip animations, strike overlay, points banner, score count-up, and confetti for the winner.
  - Synthesised sound effects (no audio files).
  - Double-click or press `F` for fullscreen. The cursor auto-hides.
- **Netbook keyboard shortcuts:**
  - `1`–`8` reveal an answer.
  - `X` marks a wrong answer.
  - `←`/`→` set who's playing.
  - `Q` hides or shows the question.
  - `T` starts or stops the guess timer.
  - `Ctrl+Z` undoes the last action.

## How it fits together

```
 index.html (host)  ──state snapshots──▶  board.html (TV)
        ▲                                      │
        └──────────── hello / ping ◀───────────┘
```

The host owns the whole game state. After every action it sends a full snapshot to the board. The board just draws it, which means a reloaded or late-joining board is always correct. Each message goes over every transport available, and duplicates are dropped (`js/sync.js`):

1. **local:** `BroadcastChannel` plus `localStorage` events, for two tabs or windows in the same browser.
2. **cast:** a Presentation API connection when casting straight to a Chromecast or Google TV.
3. **net:** `server.js`, a zero-dependency Node relay using Server-Sent Events and POST. Devices are paired by a 4-letter room code, and the server remembers the last state so the board shows it instantly.

```
index.html     host app (game list, editor, team setup, live controls)
board.html     TV board
js/common.js   data model, sample game, helpers
js/starter-games.js  the starter game pack
js/sync.js     host <-> board messaging
js/host.js     host UI
js/board.js    board rendering + effects
js/sound.js    WebAudio sound effects
server.js      optional LAN server (node server.js, PORT env var to change port)
```

## Starter games

Every game has 5 rounds. Rounds 1–3 are normal points, round 4 is double and round 5 is triple.

| Game | Theme |
| --- | --- |
| Sample game — Family Night | Mornings, messy food, picnics, road trips, grandparents |
| School Daze | Backpacks, homework excuses, the last day of school |
| Food Fight | Pizza toppings, foods kids won't eat, party desserts |
| Screen Time | Phones, video games, online videos |
| Game Day | Sports, coaches, the Olympics |
| Animal Kingdom | Zoo animals, pets, ocean life |
| Holiday Hoopla | Halloween, Thanksgiving, winter holidays, New Year's |
| Summer Break | The beach, ice cream, amusement parks, camping |
| Home Sweet Home | Chores, things that go missing, things parents always say |
| Wild Imagination | Superpowers, wizards, desert islands, dream jobs |
| Brain Busters | Planets, landmarks, science, world food |
| Movie Night | Movie snacks, kinds of movies, theater pet peeves, superheroes |
| Snack Attack | Crunchy snacks, trick-or-treat candy, dips, fast food, midnight snacks |
| Music Mania | Instruments, singing, kinds of music, concerts, songs everyone knows |
| Winter Wonderland | Snow fun, cold-weather clothes, warm drinks, snow days |
| Going Places | Packing, airports, car-ride questions, souvenirs |
| Birthday Bash | Party places, party games, wishes, presents |
| Spooky Stuff | Fears, monsters, haunted houses, sleepovers |
| Weekend Fun | Saturday mornings, sleepovers, the mall, board games |
| Once Upon a Time | Fairy tales, castles, superheroes, magical creatures |
| Totally Gross | Cafeteria horrors, bad smells, slimy things, stepping on a LEGO |

New starter games show up in each player's library the next time they open the app. A starter game someone deletes stays deleted. **Bring them back** on the home screen restores any missing ones. To add more, append to `js/starter-games.js` and give each game a new, stable `id`.

### Game file format (import/export)

```json
{ "familyclash": 1,
  "game": { "title": "Thanksgiving", "rounds": [
    { "question": "Name a pie flavor", "multiplier": 1,
      "answers": [ { "text": "Pumpkin", "points": 41 }, { "text": "Apple", "points": 30 } ] } ] } }
```
