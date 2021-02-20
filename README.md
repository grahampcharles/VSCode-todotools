# `todotools` README

The `todotools` extension adds some task list management shortcuts for TaskPaper documents.

## Features

**Copy Daily Tasks to Today**
: This task will copy any tasks in a "Daily" section into a "Today" section, unless they are already there. This allows you to create daily tasks (e.g. "Feed the cat") without having to re-type them,

## Extension Settings

None. 

## Development Pathway

* Change command name to more generic name, like, updateRecurringTasks or something
* add recurrence: "after n days" pattern
* add command to turn on autorun (by creating the YAML section)
* Implement the "copy" using extension settings, something like this:

````
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
````

The `icsPattern` idea refers to the calendar standard, which has a recurrence pattern rule (`RRULE`) that might come in useful.

## Known Issues

The document must have sections for "Daily" and "Today" in standard TaskPaper syntax (starting at column 0 and ending with a colon).

````
    Today:
      - Task 1

    Daily:
      - Task 2
      - Task 3
````

