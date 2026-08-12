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

## Getting items in without touching the app

Click **Inbox key** once and hand over the public key it shows. After that, a
batch of items can be encrypted to this browser, committed to `inbox.json`, and
it lands in your list on its own the next time the tab loads or regains focus
(it also re-checks every 5 minutes). No file to download, no clicks.

Why encrypted: this repo is public, so `inbox.json` is world-readable. Only your
browser holds the private key, so all anyone else sees is noise. The private key
never leaves the browser and is deliberately **not** in an Export — if you clear
storage or switch browser, a fresh key is generated and you hand over the new
one.

To send a batch: `node tools/inbox-encrypt.js <public-key.json> <batch.json>`,
then commit `inbox.json`. The batch file itself is plaintext — `.gitignore`
keeps it out of the repo.

## Backups — read this once

Everything lives in this browser's `localStorage`. **It is not in GitHub, not
synced, and not backed up.** Clearing browser data or resetting the profile
wipes the list and its history with no recovery.

Hit **Export** now and then and keep the JSON somewhere private. The app nags
you if it's been more than 30 days.

**Import** has two modes:

- **Merge in** — adds the file's items to what you already have. If its
  top-level section has the same name as one of yours, the items are hung under
  your existing section instead of making a second one. Use this to log a batch
  of work in from outside the app.
- **Replace everything** — restoring a backup. Wipes the current list first.

⚠️ **This repo is public** — it has to be for Pages to serve the page. The page
holds no data, but an exported backup or a work log is your content in a plain
file. `.gitignore` blocks `*.json` here so you can't commit one by accident.
Keep them somewhere private.

## What it deliberately does not do

No mobile, no sync, no search, no time tracking, no recurring items. Reminders
cannot fire when the browser is closed — that's what the Outlook events are
for. See §2 and §3 of [`SPEC.md`](SPEC.md) for the full list and why.

Still to build (Pass 2): week list with hour estimates, auto-packed calendar
export, roadmap timeline.
