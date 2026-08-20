# Portal design release schedule

Interactive Gantt-style board for portal design and engineering releases. It starts from the existing static schedule and stays editable as new work comes in.

## Open it

Live board: [https://robillard-em.github.io/portal-design-release-schedule/](https://robillard-em.github.io/portal-design-release-schedule/)

Or double-click `index.html`, or from this folder:

```bash
python3 -m http.server 5173
```

Then visit [http://localhost:5173](http://localhost:5173).

## What you can see

The header always shows:

- **Today**
- **Current week** (Monday–Friday)
- **Sprint / release** for that week
- **Quarter**, including weeks remaining until Q4
- **In-progress work** overlapping this week, with the assigned designer

The red column on the board is the current week.

## Edit the schedule

- Click a row to open it. Change title, section, designer, dates, phases, and milestones.
- Use **Add work** for a new item. Assign it to a designer in the same panel.
- Click a designer circle in the toolbar to filter the board; **All** shows everyone.
- **Manage team** adds or renames designers and changes their colors.
- Edits save in the browser (`localStorage`). **Reset to original** restores the screenshot schedule.
