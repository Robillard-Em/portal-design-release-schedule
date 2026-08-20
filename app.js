(() => {
  const STORAGE_KEY = "portal-design-release-schedule-v1";
  const WEEK_PX = 84;
  const LABEL_W = 228;
  const SECTIONS = [
    { id: "immediate", label: "Immediate Priorities" },
    { id: "explorations", label: "Explorations" },
    { id: "q4", label: "Q4 Efforts" },
  ];
  const TIMELINE_START = "2026-08-17";
  const TIMELINE_END = "2026-12-31";
  const SPRINT_EPOCH = parseDate(TIMELINE_START);
  const FIRST_MINOR = 5;
  const Q4_START = parseDate("2026-10-01");

  const els = {
    board: document.getElementById("board"),
    nowCard: document.getElementById("now-card"),
    designerFilter: document.getElementById("designer-filter"),
    drawer: document.getElementById("drawer"),
    backdrop: document.getElementById("drawer-backdrop"),
    form: document.getElementById("work-form"),
    drawerTitle: document.getElementById("drawer-title"),
    assigneeSelect: document.getElementById("assignee-select"),
    barsEditor: document.getElementById("bars-editor"),
    milestonesEditor: document.getElementById("milestones-editor"),
    deleteWork: document.getElementById("delete-work"),
    teamDialog: document.getElementById("team-dialog"),
    teamList: document.getElementById("team-list"),
  };

  let state = loadState();
  let filterDesigner = "";
  let selectedId = "";
  let editingId = null;
  let draftBars = [];
  let draftMilestones = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* use seed */
    }
    return clone(window.SEED);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function parseDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatIso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function startOfWeek(date) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    return copy;
  }

  function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function monthDay(date) {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }

  function shortMonthDay(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatWeekLabel(monday) {
    const friday = addDays(monday, 4);
    if (monday.getMonth() === friday.getMonth()) {
      return `${shortMonthDay(monday)}–${friday.getDate()}`;
    }
    return `${shortMonthDay(monday)}–${shortMonthDay(friday)}`;
  }

  function sprintForWeek(monday) {
    const weeks = Math.round((monday - SPRINT_EPOCH) / (7 * 24 * 60 * 60 * 1000));
    const minor = FIRST_MINOR + Math.floor(weeks / 2);
    return `Release 1.${String(minor).padStart(2, "0")}`;
  }

  function quarterInfo(date) {
    const q = Math.floor(date.getMonth() / 3) + 1;
    return { q, year: date.getFullYear() };
  }

  function weeksUntil(from, to) {
    return Math.ceil((startOfWeek(to) - startOfWeek(from)) / (7 * 24 * 60 * 60 * 1000));
  }

  function allDates() {
    const dates = [parseDate(TIMELINE_START), parseDate(TIMELINE_END)];
    for (const item of state.items) {
      for (const bar of item.bars || []) {
        dates.push(parseDate(bar.start), parseDate(bar.end));
      }
      for (const mark of item.milestones || []) {
        dates.push(parseDate(mark.date));
      }
    }
    for (const sticky of state.stickies || []) {
      dates.push(parseDate(sticky.date));
    }
    return dates;
  }

  function buildWeeks() {
    const weeks = [];
    for (let cursor = parseDate(TIMELINE_START); cursor < parseDate("2027-01-01"); cursor = addDays(cursor, 7)) {
      weeks.push(new Date(cursor));
    }
    return weeks;
  }

  function buildBands(weeks) {
    const bands = [];
    for (let i = 0; i < weeks.length; i += 2) {
      const span = Math.min(2, weeks.length - i);
      const minor = FIRST_MINOR + i / 2;
      bands.push({
        label: `Release 1.${String(minor).padStart(2, "0")}`,
        span,
      });
    }
    return bands;
  }

  function timelineRange(weeks) {
    const start = weeks[0];
    const end = addDays(weeks[weeks.length - 1], 7);
    return { start, end, ms: end - start };
  }

  function pct(iso, range) {
    const date = parseDate(iso);
    return ((date - range.start) / range.ms) * 100;
  }

  function pctAfter(iso, range) {
    return ((addDays(parseDate(iso), 1) - range.start) / range.ms) * 100;
  }

  function sprintEndPct(iso, range) {
    return ((addDays(startOfWeek(parseDate(iso)), 7) - range.start) / range.ms) * 100;
  }

  function itemSpan(item) {
    const dates = [
      ...(item.bars || []).flatMap((bar) => [bar.start, bar.end]),
      ...(item.milestones || []).map((mark) => mark.date),
    ];
    if (!dates.length) return { start: TIMELINE_START, end: TIMELINE_START };
    return {
      start: dates.reduce((min, date) => (date < min ? date : min)),
      end: dates.reduce((max, date) => (date > max ? date : max)),
    };
  }

  function today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function overlapsToday(item, now) {
    return (item.bars || []).some((bar) => {
      const start = parseDate(bar.start);
      const end = parseDate(bar.end);
      return now >= start && now <= end;
    });
  }

  function designerById(id) {
    return state.designers.find((d) => d.id === id);
  }

  function assigneeName(item) {
    return designerById(item.assigneeId)?.name || "Unassigned";
  }

  function visibleItems() {
    if (!filterDesigner) return state.items;
    if (filterDesigner === "unassigned") return state.items.filter((item) => !item.assigneeId);
    return state.items.filter((item) => item.assigneeId === filterDesigner);
  }

  function avatarHtml(id, extraClass = "") {
    const person = designerById(id);
    if (!person) return `<span class="unassigned ${extraClass}" title="Unassigned"></span>`;
    return `<span class="avatar ${extraClass}" style="background:${person.color}" title="${escapeHtml(person.name)}">${escapeHtml(person.initial)}</span>`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderNow() {
    const now = today();
    const weekStart = startOfWeek(now);
    const sprint = sprintForWeek(weekStart);
    const active = visibleItems().filter((item) => overlapsToday(item, now)).length;

    els.nowCard.innerHTML = `
      <div class="now-stat">
        <div class="k">${escapeHtml(sprint)}</div>
        <div class="v">${active} active this week</div>
      </div>
    `;
  }

  function renderDesignerFilter() {
    const pill = (id, label, leading = "") => {
      const active = filterDesigner === id ? "active" : "";
      return `<button type="button" class="name-filter ${active}" data-filter="${id}">${leading}${escapeHtml(label)}</button>`;
    };
    els.designerFilter.innerHTML =
      pill("", "Everyone") +
      state.designers
        .map((person) =>
          pill(person.id, person.name, `<i class="dot" style="background:${person.color}"></i>`)
        )
        .join("") +
      pill("unassigned", "Unassigned");
  }

  function renderBoard() {
    const weeks = buildWeeks();
    const bands = buildBands(weeks);
    const range = timelineRange(weeks);
    const now = today();
    const currentMonday = startOfWeek(now);
    const currentIndex = weeks.findIndex((week) => formatIso(week) === formatIso(currentMonday));
    const items = visibleItems();

    let col = 2;
    const sprintCells = bands
      .map((band) => {
        const html = `<div class="sprint-head" style="grid-column:${col} / span ${band.span}; grid-row:1">
          <strong>${escapeHtml(band.label)}</strong>
        </div>`;
        col += band.span;
        return html;
      })
      .join("");

    const weekCells = weeks
      .map((week, i) => {
        const current = i === currentIndex ? "current" : "";
        return `<div class="week-head ${current}" style="grid-column:${i + 2}; grid-row:2">${formatWeekLabel(week)}${current ? `<span class="today-label">Today</span>` : ""}</div>`;
      })
      .join("");

    let row = 3;
    let body = "";
    items.forEach((item) => {
      const selected = item.id === selectedId ? "selected" : "";
      const person = designerById(item.assigneeId);
      const { start, end } = itemSpan(item);
      const dot = person
        ? `<i class="dot" style="background:${person.color}"></i>`
        : `<i class="dot unassigned-dot"></i>`;
      body += `<div class="item-label ${selected}" data-item="${item.id}" style="grid-column:1; grid-row:${row}">
        <div class="item-copy">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="item-meta">${dot}${escapeHtml(assigneeName(item))} · ${shortMonthDay(parseDate(start))} – ${shortMonthDay(parseDate(end))}</span>
        </div>
      </div>`;

      const bars = (item.bars || [])
        .map((bar) => {
          const left = pct(bar.start, range);
          const width = Math.max(pctAfter(bar.end, range) - left, 1.2);
          return `<div class="bar ${bar.kind}" style="left:${left}%; width:${width}%" title="${escapeHtml(bar.label)} · ${shortMonthDay(parseDate(bar.start))} – ${shortMonthDay(parseDate(bar.end))}"></div>`;
        })
        .join("");

      const marks = (item.milestones || [])
        .map((mark) => {
          const left = mark.kind === "release" ? sprintEndPct(mark.date, range) : pctAfter(mark.date, range);
          const shape = mark.kind === "release" ? "release-mark" : "diamond";
          const shift = mark.kind === "release" ? "release" : "handoff";
          return `<div class="marker ${shift}" style="left:${left}%" title="${escapeHtml(mark.label)} · ${shortMonthDay(parseDate(mark.date))}">
            <i class="${shape}"></i>
          </div>`;
        })
        .join("");

      body += `<div class="item-track ${selected}" data-item="${item.id}" style="grid-column:2 / span ${weeks.length}; grid-row:${row}">${bars}${marks}</div>`;
      row += 1;
    });

    const todayCol =
      currentIndex >= 0
        ? `<div class="today-col" style="grid-column:${currentIndex + 2}; grid-row:3 / span ${Math.max(items.length, 1)}"></div>`
        : "";

    els.board.style.gridTemplateColumns = `${LABEL_W}px repeat(${weeks.length}, ${WEEK_PX}px)`;
    els.board.innerHTML = `
      <div class="corner" style="grid-column:1; grid-row:1 / span 2"></div>
      ${sprintCells}
      ${weekCells}
      ${body}
      ${todayCol}
    `;
  }

  function render() {
    renderNow();
    renderDesignerFilter();
    renderBoard();
    fillAssigneeSelect();
  }

  function fillAssigneeSelect() {
    els.assigneeSelect.innerHTML =
      `<option value="">Unassigned</option>` +
      state.designers
        .map((person) => `<option value="${person.id}">${escapeHtml(person.name)} (${escapeHtml(person.initial)})</option>`)
        .join("");
  }

  function openDrawer(itemId) {
    editingId = itemId;
    const item = itemId ? state.items.find((entry) => entry.id === itemId) : null;
    selectedId = itemId || "";
    els.drawer.hidden = false;
    els.backdrop.hidden = false;
    els.drawerTitle.textContent = item ? item.title : "New work";
    els.form.title.value = item?.title || "";
    els.form.section.value = item?.section || "immediate";
    els.form.assigneeId.value = item?.assigneeId || "";
    els.form.tickets.value = item?.tickets || "";
    els.form.notes.value = item?.notes || "";
    draftBars = clone(item?.bars || defaultBars());
    draftMilestones = clone(item?.milestones || []);
    els.deleteWork.hidden = !item;
    renderDraftEditors();
    renderBoard();
    els.form.title.focus();
  }

  function defaultBars() {
    const start = startOfWeek(today());
    return [
      {
        kind: "design",
        label: "Design Creation and Approval",
        start: formatIso(start),
        end: formatIso(addDays(start, 11)),
      },
    ];
  }

  function closeDrawer() {
    els.drawer.hidden = true;
    els.backdrop.hidden = true;
    editingId = null;
  }

  function renderDraftEditors() {
    els.barsEditor.innerHTML = draftBars
      .map(
        (bar, i) => `
        <div class="phase-row" data-bar="${i}">
          <label>Phase
            <select data-field="kind">
              ${["design", "engineering", "handed-off", "research", "exploration"]
                .map((kind) => `<option value="${kind}" ${bar.kind === kind ? "selected" : ""}>${kind}</option>`)
                .join("")}
            </select>
          </label>
          <label>Label
            <input data-field="label" value="${escapeHtml(bar.label)}" />
          </label>
          <label>Start
            <input type="date" data-field="start" value="${bar.start}" />
          </label>
          <label>End
            <input type="date" data-field="end" value="${bar.end}" />
          </label>
          <button type="button" class="btn ghost small" data-remove-bar="${i}">Remove</button>
        </div>`
      )
      .join("");

    els.milestonesEditor.innerHTML = draftMilestones
      .map(
        (mark, i) => `
        <div class="phase-row" data-milestone="${i}">
          <label>Type
            <select data-field="kind">
              <option value="handoff" ${mark.kind === "handoff" ? "selected" : ""}>Handoff to Dev</option>
              <option value="release" ${mark.kind === "release" ? "selected" : ""}>Release</option>
            </select>
          </label>
          <label>Label
            <input data-field="label" value="${escapeHtml(mark.label)}" />
          </label>
          <label>Date
            <input type="date" data-field="date" value="${mark.date}" />
          </label>
          <button type="button" class="btn ghost small" data-remove-milestone="${i}">Remove</button>
        </div>`
      )
      .join("");
  }

  function readDraftFromEditors() {
    els.barsEditor.querySelectorAll("[data-bar]").forEach((row) => {
      const i = Number(row.dataset.bar);
      row.querySelectorAll("[data-field]").forEach((field) => {
        draftBars[i][field.dataset.field] = field.value;
      });
    });
    els.milestonesEditor.querySelectorAll("[data-milestone]").forEach((row) => {
      const i = Number(row.dataset.milestone);
      row.querySelectorAll("[data-field]").forEach((field) => {
        draftMilestones[i][field.dataset.field] = field.value;
      });
    });
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function focusItem(id) {
    selectedId = id;
    renderBoard();
    const node = els.board.querySelector(`[data-item="${id}"]`);
    node?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }

  function renderTeamList() {
    els.teamList.innerHTML = state.designers
      .map(
        (person) => `
        <div class="team-row" data-designer="${person.id}">
          <label>Initial
            <input data-field="initial" maxlength="2" value="${escapeHtml(person.initial)}" />
          </label>
          <label>Color
            <input type="color" data-field="color" value="${person.color}" />
          </label>
          <label>Name
            <input data-field="name" value="${escapeHtml(person.name)}" />
          </label>
          <button type="button" class="btn ghost small" data-remove-designer="${person.id}">Remove</button>
        </div>`
      )
      .join("");
  }

  function readTeam() {
    els.teamList.querySelectorAll("[data-designer]").forEach((row) => {
      const person = designerById(row.dataset.designer);
      if (!person) return;
      row.querySelectorAll("[data-field]").forEach((field) => {
        person[field.dataset.field] = field.value;
      });
    });
  }

  document.getElementById("add-work").addEventListener("click", () => openDrawer(null));
  document.getElementById("close-drawer").addEventListener("click", closeDrawer);
  els.backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });

  document.getElementById("add-bar").addEventListener("click", () => {
    readDraftFromEditors();
    const start = startOfWeek(today());
    draftBars.push({
      kind: "engineering",
      label: "Engineering",
      start: formatIso(start),
      end: formatIso(addDays(start, 11)),
    });
    renderDraftEditors();
  });

  document.getElementById("add-milestone").addEventListener("click", () => {
    readDraftFromEditors();
    draftMilestones.push({
      kind: "handoff",
      label: "Handoff to Dev",
      date: formatIso(today()),
    });
    renderDraftEditors();
  });

  els.barsEditor.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-bar]");
    if (!button) return;
    readDraftFromEditors();
    draftBars.splice(Number(button.dataset.removeBar), 1);
    renderDraftEditors();
  });

  els.milestonesEditor.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-milestone]");
    if (!button) return;
    readDraftFromEditors();
    draftMilestones.splice(Number(button.dataset.removeMilestone), 1);
    renderDraftEditors();
  });

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    readDraftFromEditors();
    const payload = {
      id: editingId || uid("work"),
      title: els.form.title.value.trim(),
      tickets: els.form.tickets.value.trim(),
      section: els.form.section.value,
      assigneeId: els.form.assigneeId.value,
      notes: els.form.notes.value.trim(),
      bars: draftBars,
      milestones: draftMilestones,
    };
    if (!payload.title) return;
    const index = state.items.findIndex((item) => item.id === payload.id);
    if (index >= 0) state.items[index] = { ...state.items[index], ...payload };
    else state.items.push(payload);
    selectedId = payload.id;
    saveState();
    closeDrawer();
    render();
  });

  els.deleteWork.addEventListener("click", () => {
    if (!editingId) return;
    state.items = state.items.filter((item) => item.id !== editingId);
    saveState();
    closeDrawer();
    selectedId = "";
    render();
  });

  els.board.addEventListener("click", (event) => {
    const row = event.target.closest("[data-item]");
    if (row) openDrawer(row.dataset.item);
  });

  els.designerFilter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    filterDesigner = button.dataset.filter;
    render();
  });

  document.getElementById("reset-schedule").addEventListener("click", () => {
    if (!confirm("Replace your edits with the original screenshot schedule?")) return;
    state = clone(window.SEED);
    saveState();
    selectedId = "";
    filterDesigner = "";
    closeDrawer();
    render();
  });

  document.getElementById("manage-team").addEventListener("click", () => {
    renderTeamList();
    els.teamDialog.showModal();
  });

  document.getElementById("add-designer").addEventListener("click", () => {
    readTeam();
    state.designers.push({
      id: uid("designer"),
      initial: "N",
      name: "New designer",
      color: "#5a7d9a",
    });
    saveState();
    renderTeamList();
    render();
  });

  els.teamList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-designer]");
    if (!button) return;
    readTeam();
    const id = button.dataset.removeDesigner;
    state.designers = state.designers.filter((person) => person.id !== id);
    saveState();
    renderTeamList();
    render();
  });

  els.teamList.addEventListener("change", () => {
    readTeam();
    saveState();
    renderNow();
    renderDesignerFilter();
    renderBoard();
    fillAssigneeSelect();
  });

  els.teamDialog.addEventListener("close", () => {
    readTeam();
    saveState();
    render();
  });

  render();
})();
