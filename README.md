# `todotools` README

The `todotools` extension adds some task list management shortcuts for TaskPaper documents.

## Features

**Copy Daily Tasks to Today**
: This task will copy any tasks in a "Daily" section into a "Today" section, unless they are already there. This allows you to create daily tasks (e.g. "Feed the cat") without having to re-type them,

## Extension Settings

None in the settings file. Each file has these possible settings in a YAML section at the end:

```
---
# todotools settings for this document
runOnOpen: True
runDaily: True
---
```

**runOnOpen**
: True if the recurrence engine will check for new tasks when the file is opened.

**runDaily**
: True if the file continues to automatically check for new recurrence patterns as long as it's open. (Currently, this happens every 3 hours.)

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
