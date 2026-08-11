# Todo

A nested daily todo list. One file, no dependencies, no backend.
Design and reasoning: [`SPEC.md`](SPEC.md).

## Setting it up (once)

1. **Turn on GitHub Pages** — repo *Settings → Pages → Source: Deploy from a
   branch*, branch `claude/todo-list-spec-a5tjy8`, folder `/ (root)`, Save.
   After a minute it's live at
   `https://alexmourersanofi.github.io/todo/`
2. **Open it and pin the tab.** Right-click the tab → *Pin*. It has to stay open
   for the reminders to pop up.
3. **Click "Enable pop-ups"** and allow notifications when Chrome/Edge asks.
4. **Click "Reminders .ics"** and import the downloaded file into Outlook, once.
   That's the backstop for days the browser is closed. Don't import it twice —
   Outlook will make duplicates.

## Using it

Left pane is the **big list** — everything, nested as deep as you like.
Right pane is **today** — drag things across, or `Alt+T`.

| | |
|---|---|
| `Enter` | new item |
| `Tab` / `Shift+Tab` | indent / outdent |
| `Alt` + `↑` `↓` | move an item among its siblings |
| `↑` `↓` | move the cursor |
| `Alt+T` | put in / take out of Today |
| `Alt+D` | due date |
| `Ctrl+Enter` | done |
| `Backspace` | delete an empty item |

Click a bullet to shut a drawer. Drag the handle to reorder — the top or bottom
edge of a row drops it as a sibling, the middle makes it a child.

Pulling an item into Today brings its sub-items with it. Its parents come along
as a grey breadcrumb so you can see where it belongs. Ticking anything ticks it
in both panes at once — there's only ever one copy of an item.

## Every morning

You get a prompt for anything unfinished from before: **keep today**, **push
to a date**, or **drop**. Nothing carries over silently. Each carry bumps a
counter that runs green → red, and at `×5` the item stops accepting "keep" —
break it down, date it, or drop it.

## Backups — read this once

Everything lives in this browser's `localStorage`. **It is not in GitHub, not
synced, and not backed up.** Clearing browser data or resetting the profile
wipes the list and its history with no recovery.

Hit **Export** now and then and commit the JSON somewhere. **Import** puts it
back. The app nags you if it's been more than 30 days.

## What it deliberately does not do

No mobile, no sync, no search, no time tracking, no recurring items. Reminders
cannot fire when the browser is closed — that's what the Outlook events are
for. See §2 and §3 of [`SPEC.md`](SPEC.md) for the full list and why.

Still to build (Pass 2): week list with hour estimates, auto-packed calendar
export, roadmap timeline.
