# `todotools` README

The `todotools` extension adds some task list management shortcuts for TaskPaper documents.

## Features

** Thoughts **:
The copy-to-Today could be optional; could also copy in place to the same project

**Copy Daily Tasks to Today**
: This task will copy any completed tasks with certain tags back into the "Today" section, unless they are already there. This allows you to create daily, monthly, or annual tasks (e.g. "Feed the cat") without having to re-type them.

## Current Development Path

Rather than using YAML, items will have various flags for creating their recurrence patterns.

```
Today:
- item 1 recur(2)
- item 2 @done(2020-01-03) @recur(2)

Future:
- item 3 @due(2020-01-04)
- item 4 @annual(11/1)
```

If today's date is 1/4/2020, then:

-   item 2 will be _copied_ to the Future section with the @done() removed and @due set to 1/5/2020
-   item 3 will be _moved_ to Today
-   item 4 will have a due date of the next 11/1 set

So, TODO:

1. Any item that is @done and also has a recurrence tag will be regenerated into the Future project
   with the next @due date; also, the @recur will be taken off the original one. For completeness, the tags
   @project, @lasted, @started, and @done will be removed.
2. Items that are in the Future project and also @due will be moved to the Today project.

## Extension Settings

None in the settings file at the moment.

## Development Pathway

-   Change command name to more generic name, like, updateRecurringTasks or something
-   Add archiving @done items.
