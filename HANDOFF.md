# Portal design schedule — hand-off

**Date:** 20 August 2026
**Range:** 17 August 2026 through 31 December 2026
**Product:** Portal (ground segment) design + engineering releases

This repo is a living Gantt for portal design work: who is on what, which phase they are in, and which two-week sprint a date falls in. Use it in a browser. Edits stay on the local machine unless you commit an updated seed.

---

## Open the board

From this folder:

```bash
python3 -m http.server 5173
```

Then open [http://localhost:5173](http://localhost:5173). You can also double-click `index.html`.

In Cursor, there is a companion canvas (`release-schedule.canvas.tsx`) that shows the same seed as a people-first, week/sprint view. It is for scanning, not for editing. The HTML board is the editable source of truth.

---

## How the calendar works

- **Week:** Monday–Friday. The highlighted column is the current week.
- **Sprint:** Two consecutive weeks. The first sprint is **17–21 Aug** and **24–28 Aug**, labeled **Release 1.05**. Every two weeks the minor version ticks up (1.06, 1.07, …).
- **Release 1.06** lands 11 Sep. **Release 1.07** lands 18 Sep / 25 Sep depending on the item.
- The board runs through **31 Dec 2026**. Seeded bars currently end **16 Oct**. November and December are empty on purpose so later Q4 work can be placed.

Sprint math lives in `app.js`: epoch is 17 Aug 2026, first minor is `5`.

---

## Team

| Initial | Name  | Notes                                      |
| ------- | ----- | ------------------------------------------ |
| O       | Ollie | Marketplace (historical + blue-sky)        |
| B       | Benni | Future marketplace, analytics              |
| E       | Emily | Seats, search, Xenodata, CaaS, add to cart |
| J       | Jason | Collision Avoidance (ongoing)              |

Add or rename people with **Manage team**. Query Builder Results has **no assignee**.

---

## Current seed (what is on the board)

### Immediate priorities

| Work                              | Owner      | Design window     | Engineering / next     | Release        |
| --------------------------------- | ---------- | ----------------- | ---------------------- | -------------- |
| Historical Data Marketplace V2    | Ollie      | Handed off to Dev | Through 4 Sep          | 1.06 · 11 Sep  |
| Future Data Marketplace           | Benni      | 17–28 Aug         | 31 Aug–11 Sep          | 1.06 · 11 Sep  |
| 50% Annual Plan Discount          | Ollie      | 17–28 Aug         | 31 Aug–11 Sep          | 1.06 · 11 Sep  |
| Seat Reallocation                 | Emily      | 17–28 Aug         | 31 Aug–11 Sep          | 1.06 · 11 Sep  |
| Search Organization by Email      | Emily      | 24 Aug–4 Sep      | 7–18 Sep               | 1.07 · 18 Sep  |
| Xenodata Quarterly Report         | Emily      | 24 Aug–4 Sep      | 7–25 Sep               | 1.07 · 25 Sep  |
| More Analytics Charts             | Benni      | CAVE mock 17–21 Aug; design 24 Aug–4 Sep | 7–25 Sep | 1.07 · 25 Sep |
| Query Builder Results             | Unassigned | Research 17–28 Aug; design 31 Aug–11 Sep | 14–25 Sep | 1.07 · 25 Sep |

Tickets on the seed: Historical Marketplace `PR-1283 / Design-344`, Future Marketplace `PR-1272 / Design-304`, Seat Reallocation `PR-1213 / Design-227`.

### Explorations

| Work                                  | Owner | Window         | Follow-on                         |
| ------------------------------------- | ----- | -------------- | --------------------------------- |
| Analytics Suite Blue Sky Exploration  | Benni | 31 Aug–18 Sep  | Feeds Analytics Report Builder    |
| Marketplace Blue Sky Exploration      | Ollie | 7–25 Sep       | —                                 |
| Full Portal Blue Sky Exploration      | Emily | 14 Sep–2 Oct   | —                                 |

Two **HACKATHON??** stickies sit on the Explorations track (31 Aug and 14 Sep). Confirm or remove them.

### Q4 efforts

Design-creation windows; no engineering or release milestones on the seed yet.

| Work                                  | Owner | Window          | Notes                                              |
| ------------------------------------- | ----- | --------------- | -------------------------------------------------- |
| Collision Avoidance                   | Jason | 7 Sep–16 Oct    | Ongoing design                                     |
| Analytics Report Builder              | Benni | 21 Sep–16 Oct   | After Analytics Suite exploration                  |
| Conjunction Assessment as a Service   | Emily | 21 Sep–16 Oct   | —                                                  |
| Add to cart functionality             | Emily | 28 Sep–16 Oct   | Talk to Rich/Duncan before treating as roadmap     |

---

## How to edit

On the HTML board:

1. Click a row to change title, section, assignee, tickets, notes, phases, and milestones.
2. **Add work** for a new item.
3. Filter with the designer initials; **All** shows everyone.
4. **Manage team** for names, initials, and colors.

Edits save in the browser under `localStorage` key `portal-design-release-schedule-v1`. They do **not** write back to git.

**Reset to original** throws away local edits and reloads `data.js`.

To make a change the default for everyone:

1. Reset (or start from a clean browser profile) if you need the seed, not a personal draft.
2. Edit `data.js` (`window.SEED`: `designers`, `items`, `stickies`).
3. Dates are `YYYY-MM-DD`. Sections are `immediate`, `explorations`, or `q4`.
4. Phase `kind` values: `design`, `engineering`, `handed-off`, `research`, `exploration`.
5. Milestone `kind` values: `handoff`, `release`.
6. Commit `data.js`.

The Cursor canvas copies the seed inline. After you change `data.js`, update the canvas data to match if you still use that view.

---

## Files

| File         | Role                                              |
| ------------ | ------------------------------------------------- |
| `index.html` | Shell, drawer, team dialog                        |
| `app.js`     | Board, sprints, filters, localStorage             |
| `data.js`    | Seed schedule (commit this to share updates)      |
| `styles.css` | Dark board styling                                |
| `README.md`  | Short how-to                                      |

No build step. No dependencies.

---

## Open questions

- **Query Builder Results** needs an owner.
- **Add to cart** needs a conversation with Rich/Duncan before it is treated as committed roadmap.
- **Hackathon** dates on the Explorations track are still marked `HACKATHON??`.
- **Nov–Dec** have no items. Place remaining Q4 work there when it is dated.
- Several Q4 items have design windows only — add engineering phases and release milestones when known.
- Designer names in the seed are Ollie, Benni, Emily, and Jason. Initials stay on the filter chips.

---

## Suggested next edits

1. Assign Query Builder Results.
2. Confirm or delete the hackathon stickies.
3. After talking to Rich/Duncan, keep or drop add-to-cart.
4. Extend Q4 items past 16 Oct as dates firm up.
5. Commit an updated `data.js` so localStorage drafts are not the only copy.
