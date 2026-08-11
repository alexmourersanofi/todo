# Todo — Specification

A single-page, keyboard-friendly nested todo list with a weekly and daily
commitment layer, carry-over pressure, three daily nudges, and a roadmap.

Status: **Pass 1 built (`index.html`). Pass 2 not started.**
Date: 2026-08-11

---

## 1. Why this exists

The existing tool is Microsoft To Do. Its specific failure: **it only nests two
levels** — List → Task → Step, and a Step cannot contain Steps. There is no way
to express *drawers within drawers* (sections → subsections → sub-subsections).

Everything else about this app is ordinary. The nesting is the reason it exists,
so nesting is the one non-negotiable requirement.

## 2. Non-goals

Deliberately excluded. Each of these was considered and rejected during design;
they are listed so they don't creep back in.

| Excluded | Why |
|---|---|
| Mobile, touch, swipe | Laptop only. "Swipe" in the original request meant click-and-drag. |
| Sync across devices / accounts | One laptop, one browser. No backend, no auth. |
| Search box, collapse-all | The list is ~5–10 top items × 2–3 sub-items. It fits on one screen. |
| Time tracking / stopwatch | Not wanted. Only *estimated* hours, and only for scheduled work. |
| Push notifications when the browser is closed | Impossible for a static page without a push backend. Accepted. |
| Recurring items ("check inbox" every day) | Explicitly deferred. May return later; see §12. |
| Due dates auto-populating the Today list | Rejected — it would make Today dishonest. Due dates surface on the roadmap instead. |
| Parent auto-completing when its children are done | Rejected. Completion is always a deliberate act. |
| Reading the user's real Outlook calendar | A static page cannot. Consequence accepted in §9. |

## 3. Platform and hosting

- **One `index.html`.** No build step, no framework, no package manager, no
  dependencies. Vanilla HTML/CSS/JS so it still works in five years.
- **Hosted on GitHub Pages** from this repo. The repo must be made **public** —
  GitHub Pages does not serve private repos on a free personal account.
  No task data is ever committed, so nothing personal becomes public.
- **Usage model: a pinned browser tab**, left open all day, Chrome or Edge on a
  Windows laptop. Paris time.

### Notification constraints (measured, not assumed)

| Situation | Behaviour |
|---|---|
| Tab open and focused | Notification fires on time. |
| Tab open but in the background | Fires, possibly up to ~1 min late — background tabs have their timers throttled to roughly once a minute. Irrelevant for these reminders. |
| Laptop asleep at reminder time | Timer did not run. On wake, the app fires the missed reminder once, late, labelled as missed. |
| Browser or laptop closed | Nothing fires. **Accepted.** The `.ics` calendar events (§8) are the backstop. |
| Windows Focus Assist / Do Not Disturb active | The OS may silently swallow the toast. Outside our control. |

Notifications require a one-time permission grant. GitHub Pages is HTTPS, so the
secure-context requirement is met. Note that opening `index.html` directly from
disk (`file://`) will *not* work — Chrome refuses notification permission for
`file://` origins. It must be served over HTTPS or from `localhost`.

## 4. Structure

```
BIG LIST  — the outline. Everything you might ever do. Unlimited nesting.
    │
    │  pull an item in
    ▼
WEEK LIST — what you've committed to this week. Each item gets an ETA in hours.
    │
    │  pull an item in
    ▼
TODAY LIST — what you're doing today.
                tick it → struck through everywhere at once

ROADMAP   — timeline of due dates, below the lists.
HISTORY   — collapsed panel of everything finished, grouped by day.
```

**There is exactly one copy of every item.** The Week and Today lists are
*views* over the same items, not duplicates. Ticking an item anywhere ticks it
everywhere. An item pulled into Today remains visible in the Big List until it
is done.

The original request described "copy/pasting items from the big list to the
today list, not deleting them." Single-item-with-membership-flags delivers that
behaviour without the divergence problems of real copies.

**ETA hours belong to the scheduling, not to the item.** Items in the Big List
have no ETA — that keeps typing into the outline fast. An ETA is only entered
when an item is pulled into the Week List, i.e. at the moment of commitment.

## 5. Data model

Flat array with parent pointers — cheaper to reorder and to query than a nested
tree.

```js
{
  version: 1,
  items: [
    {
      id:        "k3f9x1",        // stable, never reused
      parentId:  null,            // null = top-level section
      order:     0,               // sort key among siblings, manual drag order
      title:     "Contract review",
      collapsed: false,           // drawer open or shut
      due:       "2026-09-15",    // optional ISO date
      week:      "2026-W33",      // optional — membership of the Week List
      day:       "2026-08-11",    // optional — membership of the Today List
      etaHours:  1.5,             // optional, 0.5h granularity, only if week is set
      doneAt:    null,            // ISO timestamp when struck
      carries:   0,               // times this has been rolled over or pushed
      createdAt: "2026-08-11T09:02:11+02:00"
    }
  ],
  meta: {
    lastOpenedAt:    "2026-08-11T08:59:02+02:00",
    remindersFiredOn: { "2026-08-11": ["morning", "afterlunch"] },
    rolloverDoneFor:  "2026-08-11"
  }
}
```

- `week` uses ISO week numbering (`YYYY-Www`), weeks start Monday.
- Today List = items where `day === today` and `doneAt === null`.
- Week List = items where `week === current week` and `doneAt === null`.
- Setting `day` on an item also sets `week` to that day's week — you cannot be
  doing something today that you haven't committed to this week.

## 6. Interaction

Keyboard-first, mouse for reordering.

| Action | Input |
|---|---|
| New item below current | `Enter` |
| Indent (make it a child of the item above) | `Tab` |
| Outdent | `Shift` + `Tab` |
| Move item up / down among siblings | `Alt` + `↑` / `↓` |
| Move the cursor between items | `↑` / `↓` |
| Toggle done | `Ctrl` + `Enter`, or the circle at the left of the row |
| Open / shut the drawer | click the bullet |
| Reorder, including across parents | drag the handle — top/bottom edge of a row inserts as a sibling, the middle makes it a child |
| Pull into Today | drag onto the Today pane, or `Alt` + `T` |
| Set a due date | `Alt` + `D`, or the `due` button on the row |
| Delete an empty item | `Backspace` |

Three points where the build had to differ from the first draft of this
section, for reasons that only became clear once it existed:

- **`Alt+T` / `Alt+D`, not bare `T` / `D`.** An item's title is a live text
  field, so a bare letter would just type into it.
- **Done is the circle on the left, not a click on the text.** Clicking the
  text has to place the caret for editing. The circle is unambiguous.
- **`Enter` on an item whose drawer is open and has children creates its first
  child**, not a sibling — the standard outliner behaviour, and what the hand
  expects. Otherwise `Enter` creates a sibling below.

Indenting an item takes its descendants with it. Deleting is only available from
a right-click menu, with a confirm — the whole point of this list is that things
don't quietly vanish.

### Pulling an item into Week or Today

- **Descendants come with it.** Pull "Contract review" and its 3 sub-items and
  they are all committed for that day. This was an explicit decision: the
  sub-items are the work.
- **Ancestors come as context only** — rendered as a greyed breadcrumb
  (`Project X › Contract › Reply to Dupont`) so an item is never orphaned from
  its meaning. Ancestors are not themselves members and cannot be ticked from
  the Today List.
- **Siblings do not come.**
- **A child added later joins automatically.** If you add a 5th sub-item while
  its parent is in Today, the new item inherits the parent's `day` and `week`.

### Completion

Clicking an item strikes it through in place. It stays visible, struck, for the
rest of the day — you should get to see what you did. At the next day's rollover
it leaves the active lists and appears only in History.

Striking a parent that still has open children raises a confirm:
*"3 sub-items are still open — strike those too, or leave them?"*

- **Strike those too** → the whole subtree is done and archives together.
- **Leave them** → the parent shows struck but stays visible in the outline
  until its children are resolved. Nothing is hidden while work remains under it.

## 7. Carry-over and escalation

On the first open of each calendar day, before anything else, any item with
`day` set to an earlier date and `doneAt === null` triggers the **rollover
prompt**:

> **3 items left from yesterday**
> `Reply to Dupont` — keep today · push to… · drop
> …

- **Keep** → `day = today`, `carries += 1`
- **Push to…** → pick a date, `day = that date`, `carries += 1`
  *A deliberate push still counts. Pushing is a dodge.*
- **Drop** → `day` and `week` cleared, back to the Big List only. `carries` is
  retained on the item but stops incrementing while it is unscheduled — the
  record of past dodges is not erased by dropping it.

Nothing rolls over silently. This is the anti-rot mechanism: the prompt forces a
decision every morning.

**Escalation display.** A carried item shows a `×N` counter badge and its colour
ramps from green (`×1`) to red (`×5`) across five carries. Carried items sort to
the top of the Today List.

At `carries >= 5` the item shows a blocking warning and will not accept another
plain "keep":

> **This has moved 5 times.** Break it into sub-items, give it a real date, or drop it.

## 8. Reminders

Three per weekday, Europe/Paris. Each has a distinct job — three identical
"look at your list" pings would be ignored within a week.

| Time | Job |
|---|---|
| **09:00** | Rollover prompt, then build the Today List from the Week List. |
| **13:30** | What's still open. Reorder if the afternoon looks different. |
| **17:00** | Strike off what's done, note anything for tomorrow. |

Delivered two ways, deliberately redundant:

1. **In the pinned tab** — an OS notification plus the relevant panel opening in
   the page. Each reminder fires at most once per day, tracked in
   `meta.remindersFiredOn`. If one was missed because the laptop slept, it fires
   once on wake, marked as late.
2. **`reminders.ics`** — a generated file, imported into Outlook once. Three
   events with `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`, 15 minutes long, each
   with a `VALARM` at start. This is what reaches you on the days the browser
   was closed.

## 9. Calendar export (`.ics`)

A **"Export this week"** button generates one `.ics` containing a timed event
for every Today-List-assigned item that has an `etaHours`, so the work is
blocked out in Outlook.

**Auto-packing.** Blocks are packed into working hours — 09:00–12:00 and
14:00–17:30, 30-minute granularity, **6.5h capacity per day** — in Today-List
order.

**The known flaw, accepted:** a static page cannot read the real Outlook
calendar, so it does not know about existing meetings and *will* double-book.
Clashes get dragged around in Outlook by hand after import. This was chosen over
typing a start time for every item.

If a day's ETAs exceed 6.5h the app refuses to emit the overflow and says so:

> **Tuesday is over-committed by 1.5h.** 2 items were not exported.

**A second trap worth knowing:** re-importing a corrected `.ics` into Outlook
generally creates **duplicate** events rather than updating the originals, even
with stable `UID`s and an incremented `SEQUENCE`. So weekly export is treated as
**one-shot**: plan the week, export once, and make later changes directly in
Outlook. The app warns on a second export for the same week.

Events carry `TZID=Europe/Paris` with a `VTIMEZONE` block.

## 10. Roadmap

A horizontal timeline below the lists.

- **Window:** today through **31 December of the current year**, horizontally
  scrollable. With a floor of 8 weeks, so the view doesn't collapse to nothing
  each December (from ~November it extends into the following year).
- **Rows:** top-level sections of the Big List.
- **Bars:** an item that is both scheduled and has a due date draws a bar from
  its planned day to its `due`. No extra field needed — scheduling already
  supplies the start.
- **Markers:** an item with a `due` but never scheduled shows as a single
  diamond on its due date. Nothing scheduled and nothing due doesn't appear.
- **A vertical "today" line.** Bars whose `due` is past and which aren't done
  are red.

## 11. Storage and data loss

`localStorage`, keyed to the Pages origin. No backup, no sync — this risk was
raised and explicitly accepted.

What that means concretely: clearing browser data, resetting the browser
profile, or switching browser wipes the list **and its history**, with no
recovery.

Three cheap mitigations, all included because they cost almost nothing:

- An **Export** button — downloads the whole state as JSON. Commit the file to
  this repo whenever you care.
- An **Import** button. Not in the first draft of this spec, and added because an
  export you cannot restore from is not a backup.
- A prompt on open if the last export is more than 30 days old, or if there has
  never been one.

`localStorage` gives ~5MB. At ~40 active items plus history this is not a
constraint for many years.

## 12. Build order

Both passes are agreed. Pass 1 ships and gets used before Pass 2 starts.

**Pass 1 — the daily habit** — *built, in `index.html`*
- [x] Big List: unlimited nesting, drawers, drag-reorder, fast keyboard entry
- [x] Today List with breadcrumb context and descendant pull-in
- [x] Rollover prompt, carry counter, green→red escalation, the `×5` warning
- [x] Three in-page reminders + `reminders.ics`
- [x] Due dates on items
- [x] History panel
- [x] Export / Import JSON

Verified by driving the real page in Chromium: 44 checks covering four-level
nesting, indent/outdent, drawers, descendant pull-in, later-child inheritance,
cross-pane completion, the open-children confirm, due dates, reload
persistence, the rollover prompt including the `×5` hard stop, `.ics` structure
(3 events, weekday `RRULE`, `VTIMEZONE`, `VALARM`, CRLF), backup round-trip,
keyboard shortcuts, and drag-to-reparent.

**Pass 2 — the planning layer**
- Week List with ETA hours
- Auto-packed weekly `.ics` export with over-commitment warnings
- Roadmap bars

Rationale: Pass 1 is what gets opened every morning and is the whole of the
original request. Pass 2 pays off only once the habit is real, and it holds all
the fiddly work — ICS generation, timezones, Outlook's duplicate-on-reimport
behaviour.

Possible later, deliberately not now: recurring items (§2).

## 13. Open questions

None blocking. Two things to revisit after two weeks of real use:

1. **Does the 17:00 reminder earn its slot?** If it's dismissed unread every
   day, cut it.
2. **Is the `×5` hard warning too aggressive?** It's intentionally harsh; it may
   need to be `×7`.
