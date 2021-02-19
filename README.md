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

## Release Notes

### 0.0.7

* bugfix: day-of-week clears one too many lines, including the next section name if it's close enough

### 0.0.6

Added new opinionated day-of-week cues:

```Weekday Name (singular): (e.g. "Sunday")```
  - item will be added to today once and then removed 

```Weekday Name (singular): (e.g. "Sundays")```
  - item will be added to today but retained

### 0.0.5

* Added days-of-the-week cues

### 0.0.4

* Added YAML property to prevent autorun more than once per day.

### 0.0.3

* Added activationEvents call. 

### 0.0.2

* Added a simple second recurrence section: "Every Third Day" 

### 0.0.1

In-house release. 