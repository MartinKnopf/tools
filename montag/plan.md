# Montag - Future Task Ideas

Additional computer-use mini-tasks beyond the current file-sorting mechanic.

## 1. Close the Pop-ups

Pop-up windows spawn rapidly across the desktop. Player must click the X button on each before the screen fills up. Windows get smaller and spawn faster over waves.

## 2. Delete the Spam ✅

An inbox fills with emails. Player must drag spam to the trash and leave legitimate emails. Deleting a real email is a penalty. Spam gets more convincing over waves.

## 3. Defrag the Drive ✅

A grid of colored/numbered blocks is shuffled. Player swaps adjacent blocks to arrange them in order (like a sliding puzzle). Fewer moves = higher score.

## 4. Batch Jobs (Data Pipeline) ✅

Process files through multi-step data pipelines by dragging them to the correct program in sequence. Each program opens an interactive window where the player performs a task (run a query, apply a formula, pick a server, etc.).

### Use Case Overview

**Goal**: Files appear on the desktop alongside a Work Queue that shows which pipeline steps each file must go through. The player drags each file to the correct program icon, interacts inside the program window, and repeats until all pipelines are complete.

**Core Loop**:
1. Work Queue shows active jobs and their next required program
2. Player drags a file to the matching program icon (drop target at bottom)
3. A program window opens with interactive content (table, grid, log, etc.)
4. Player performs the correct action (select a filter, click a function, choose a directory)
5. On success: window closes, file transforms (new name + icon) and reappears on desktop
6. Player drags the transformed file to the next program in the pipeline
7. Terminal programs (Printer, FTP) consume the file — it disappears
8. All jobs complete → wave complete, next wave starts

### Six Interactive Programs

| Program | Window | Interaction | Terminal? |
|---|---|---|---|
| SQL Query Tool | Data table + query bar with dropdowns | Pick correct column + value, click Run Query, then Export | No |
| Spreadsheet | Number grid with function buttons (SUM, AVG, SORT, PIVOT) | Click correct function, then Save | No |
| Log Viewer | Colored log lines + action buttons (Strip Errors, Extract, Format, Dedup) | Click correct action, then Save | No |
| Printer | Print dialog → progress bar with optional paper jam | Click OK, handle paper jam if it occurs | Yes |
| FTP Client | Two-pane (Local/Remote) with directory list | Select correct remote directory, click Upload | Yes |
| WinZip | Compression method radio buttons | Select correct method, click Add to Archive | No |

### Wave Progression

Waves 1-2 start with 1-2 jobs and only 3 programs (Spreadsheet, Log Viewer, Printer). New programs unlock: Database at wave 3, FTP at wave 5, Archive at wave 7. By wave 8+ all 6 programs are available with up to 5-6 concurrent jobs.

### Implementation Details

| Aspect | Location |
|---|---|
| **Task file** | `montag/tasks/data-pipeline.js` |
| **Pipeline templates** (16 predefined) | `PIPELINE_TEMPLATES` array — each defines filename + ordered steps with program + config |
| **Wave configs** (8 predefined + procedural) | `WAVE_CONFIGS` array — controls job count, max steps, available programs per wave |
| **Program windows** | `openDatabaseWindow()`, `openSpreadsheetWindow()`, `openLogViewerWindow()`, `openPrinterWindow()`, `openFtpWindow()`, `openArchiveWindow()` — each builds DOM, handles interaction, calls `onComplete` callback |
| **Program icon drawing** (48×48 drop targets) | `drawDatabaseProgramIcon()`, `drawSpreadsheetProgramIcon()`, etc. |
| **File icon drawing** (32×32 desktop files) | `drawDatabaseFileIcon()`, `drawLogFileIcon()`, etc. — change as files progress through pipeline |
| **Fake data generators** | `generateTableData()` (for SQL), `generateLogLines()` (for Log Viewer), `generateSpreadsheetData()` (for Spreadsheet) |
| **Work Queue window** | `createWorkQueueWindow()` + `updateWorkQueue()` — shows job status, clickable rows highlight files |
| **Drop handler** | `checkPipelineDrop()` — validates correct program, opens window or bounces with penalty |
| **File transformation** | Inside `checkPipelineDrop`'s `onComplete` callback — swaps canvas icon + label text on the DOM element |
| **Scoring** | Correct program completion: `10 × wave`, combo bonus at 3+, pipeline completion: `+15 × wave`, wrong target: `-5` |
| **Paint window** | `openPaintWindow()` — 4 tool buttons (Rotate, Flip, Crop, Resize), seeded canvas art, correct tool animates transform then Save |
| **Notepad window** | `openNotepadWindow()` — find/replace dropdowns from FIND_REPLACE_POOL, monospace text with embedded find values, highlights then swaps |
| **Outlook Express window** | `openEmailWindow()` — dual mode: download (inbox table, preview pane, Save Attachment) or send (compose form, recipient dropdown, SMTP progress) |
| **Dial-Up window** | `openDialupWindow()` — phone number dropdown, modem terminal animation (ATZ→CONNECT), ASCII transfer progress bar |
| **New program icons** (48×48) | `drawPaintProgramIcon()`, `drawNotepadProgramIcon()`, `drawEmailProgramIcon()`, `drawDialupProgramIcon()` |
| **New file icons** (32×32) | `drawPaintFileIcon()`, `drawNotepadFileIcon()`, `drawEmailFileIcon()` |
| **New data generators** | `generateCanvasArt(seed)`, `generateTextContent(findValue)`, `generateInboxEmails(attachment)` |
| **New pipeline templates** (14) | Email (4), Paint (3), Notepad (4), Dial-Up (3) — see `PIPELINE_TEMPLATES` |
| **Extended waves** (9-14) | Paint at 9, Notepad at 11, Outlook Express at 13, Dial-Up at 14; wave 15+ uses all 10 programs |
| **CSS styles** | `index.html` `<style>` block — `.work-queue-table`, `.program-toolbar`, `.pipeline-btn`, `.data-table`, `.log-line`, `.query-bar`, `.ftp-pane`, `.program-progress` |
| **Menu entry** | `index.html` — `#task-data-pipeline` in programs submenu |
| **Main.js wiring** | Import + click handler for `task-data-pipeline` |
| **Service worker** | `sw.js` — added to `PRECACHE_URLS`, cache bumped to v18 |

## 5. Connect the Cables

Ports appear on the left, devices on the right. Player draws lines to match the correct cable type (USB, serial, parallel, VGA, PS/2) to the right port. Wrong pairings spark.

## 5. Empty the Print Queue

Print jobs pile up with priorities and statuses (stuck, printing, waiting). Player must cancel stuck jobs, reorder by priority, and keep the queue flowing.

## 6. Scan for Viruses

Files appear with subtle visual "infection" hints (slightly wrong icon, suspicious name). Player must select infected files and quarantine them without flagging clean files.

## 7. Unzip the Archive

Files tumble out of a zip archive. Player must catch/click the correct files to extract while ignoring junk files (like .dll, readme.txt, toolbar installers).
