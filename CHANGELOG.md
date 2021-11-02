# Change Log

All notable changes to the "todotools" extension will be documented in this file.
( Added, Changed, Deprecated, Removed, Fixed, Security)

## To Do:
### added
* remove dated "one time only" section, like "11/2/2021"

### fixed
* if `Today` section is empty, extension adds a blank line at the top of the section

## [0.1.1] - 2021-11-02
### added
* arbitrary future date items in the format `mm-dd` or `yyyy-mm-dd`

## [0.1.0] - 2021-10-25
### fixed:
* set date to GMT date 
* make sure update isn't happening twice (perhaps related to above) like when lastCheckDate appears to be in the future

## [0.0.9] - 2021-04-03 
### added:
* autosave when auto-running
* auto-rerun every hour if file is open

## [0.0.8] - 2021-02-20
### Fixed
* edits not being executed

## [0.0.7] - 2021-02-20
### Fixed
* day-of-week clears one too many lines, including the next section name if it's close enough

## [0.0.6] - 2021-02-01
### Added 
* opinionated day-of-week cues:
   - ```Weekday Name (singular): (e.g. "Sunday")``` for one-time tasks (e.g. "next Sunday")
   - ```Weekday Name (singular): (e.g. "Sundays")``` for recurring tasks (e.g. "every Sunday")

## [0.0.5]
### Added
* days-of-the-week cues

## [0.0.4]
### Added
* Added YAML property to prevent autorun more than once per day.

## [0.0.3]
### Added
* activationEvents call. 

## [0.0.2]
### Added
* a simple recurrence section: "Every Third Day" 

## [0.0.1]
### Added
* In-house release. 