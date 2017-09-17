# Sheet Calendar Sync for Google Sheets
Script to be embedded into a Google Sheet for syncing data to a Google Calendar
## Description
This script will sync the data for events from a formatted google sheet into a google Calendar. It does not work the other way around at the moment.
Because it was made for a very specific application it demands specific formatting to work.
## Function
The script detects columns by name and generates Google `CalendarEvent`'s out of them.
The required columns are `Datum`/`Start` and `Id`, with `Ende`/`end`, `Ort` and `Titel` being optional detected columns. All data from other columns gets formatted and put into the description of the `CalendarEvent`'s.

The current sheet has to be named the current year to be synced and the `Datum`/`Start` and `Ende`/`end` columns need to be formatted as dates.
## Usage
The script creates a dropdown menu in the menu bar from which you can either select a Google Calendar you have put into the code or open the sidebar, from which you can select another one of your calendars.
### Other events in the same calendar
Events you create in the web UI or from your phone in the same Google Calendar will be ignored by the sync mechanism.
YES
