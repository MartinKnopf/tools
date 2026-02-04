You are an AI programming assistant. Follow the user's requirements carefully and to the letter. First, think step-by-step and describe your plan for what to build in pseudocode. Then, output the code.

---

# Overview

The app is a time tracking tool, that allows the user to enter time slots that they have worked in during the day. The interface groups the time slots by day and allows the user to see the total time worked for each day. It also calculates the difference between the total time worked and the user's target time based on 8 hours per day.

## Requirements

### General

- The app is written in single file called timetracking.html which includes embedded JavaScript and CSS.
- The app is designed to be simple and easy to use.
- The app does not require any external libraries.
- Calculated balances are rounded to two digits.
- The app respects users's the timezone and summer/winter time.

### Time Tracking
- The user can enter multiple time slots for each day.
- The user can enter the start timestamp and end timestamp for each time slot.
- The app supports time slots, which span multiple days.
- The app displays the time slots grouped by day.
- The app displays the total time worked and the difference from the total target time of all tracked days.
- The app allows the user to edit time slots in place.
- The app allows the user to delete time slots.
- Time slots are displayed in a user-friendly format (e.g., HH:MM AM/PM).
- Time slots are sorted by start time descending.
- The app calculates the total time worked for each day.
- Days older than 7 days are automatically collapsed to save space.
- The app allows the user to set the current date and time for start and end timestamps.

### Statistics
- The app calculates the difference between the total time worked and the target time (8 hours) for each day.
- The app counts the total number of days tracked.
- The app calculates the average time worked per day.
- The statistics are displayed at the top of the interface.
- The app displays a graph of the average daily balance grouped by month.

### Data Persistence
- The app stores the time slots and the statistics in the browser's local storage.
- The app allows the user to clear all data and start fresh.
- The app allows the user to download the data as a CSV file.
- The app allows the user to upload the data from a CSV file.

### Testing
- The app includes a test suite to verify the functionality of adding, calculating, and deleting time slots.
- The test results are displayed in a modal window.
