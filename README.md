# `todotools` README

The `todotools` extension adds some task list management shortcuts for TaskPaper documents.

## Features

** Thoughts **: 
The copy-to-Today could be optional; could also copy in place to the same project

**Copy Daily Tasks to Today**
: This task will copy any tasks in a "Daily" section into a "Today" section, unless they are already there. This allows you to create daily tasks (e.g. "Feed the cat") without having to re-type them,

## Current Development Path

Rather than using YAML, items will have various flags for creating their recurrence patterns.

```
Today:
- item 1 recur(2)
- item 2 @done(2020-01-03) @recur(2)

Future:
- item 3 @due(2020-01-04)
```

If today's date is 1/4/2020, then:

-   item 2 will be _copied_ to the Future section with the @done() removed and @due set to 1/5/2020
-   item 3 will be _moved_ to Today

So, TODO:

1. Any item that is @done and also has a recurrence tag (@recurAfter(2)?) will be regenerated into the Future project
   with the next @due date; also, the @recurAfter will be taken off the original one. For completeness, the tags
   @project, @lasted, @started, and @done will be removed.
2. Items that are in the Future project and also @due will be moved to the Today project.

## Extension Settings

None in the settings file. Each file has these possible settings in a YAML section at the end:

```
---
# todotools settings for this document
runOnOpen: True
runDaily: True
tasks:
  daily:
    - task one
    - task two
  2:
    - every other day task one
    - every other day task two
  11/1:
    - task for 1 November
---
```

**runOnOpen**
: True if the recurrence engine will check for new tasks when the file is opened.

**runDaily**
: True if the file continues to automatically check for new recurrence patterns as long as it's open. (Currently, this happens every 3 hours.)

**tasks**
:

## Development Pathway

-   Change command name to more generic name, like, updateRecurringTasks or something
-   add command to turn on autorun (by creating the YAML section)
-   Implement the "copy" using extension settings, something like this:

```
  todotools.schedules : [
    {
      fromFolder: 'Daily',
      toFolder: 'Today',
      allowDuplicates: false,
    },
    {
      fromFolder: 'Every Third Day',
      toFolder: 'Today',
      icsPattern: ' ',
      allowDuplicates: false,
    }
  ]
```

The `icsPattern` idea refers to the calendar standard, which has a recurrence pattern rule (`RRULE`) that might come in useful.

## Known Issues

### Sections

The document must have sections for "Daily" and "Today" in standard TaskPaper syntax (starting at column 0 and ending with a colon).

```
    Today:
      - Task 1

    Daily:
      - Task 2
      - Task 3
```
