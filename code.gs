/**
 * @author Simon Keil
 * @version 1.1 sidebar
 * Script to sync the contents of a GoogleCalender with those of a GoogleSpreadsheet. It has to be formatted as follows: the first three columns are the starttime, endtime and title of a given event.
 * The starttime and endtime should be formatted in compliance with the standard defined by the parseDate() function in this script.
 * The title may be any well-defined String.
 *
 * All events in the spreadsheet will be included and updated in the calendar - CalendarEvents not to be found in the spreadsheet will be deleted.
 *
**/

/**
 * onOpen() is automatically executed on opening of the host sheet of the script (in desktop web browser).
 * It creates a dropdown-menu on the right end of the menu bar.
 * The menu items link to the functions in the script to sync to specific calendars or open the sidebar.
**/
function onOpen(){
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Sync to Calendar')
      .addItem('neuton', 'neutonSync')
      .addItem('Open Sidebar','showSyncSidebar')
      .addToUi();
}

/**
 * Helpfunction to trigger the main calendarSync() function with a specific parameter to sync to a specific calendar.
**/
function neutonSync(){
  calendarSync(-1);
}

/**
 * The function CalendarSync() is the main logic of the script.
 */
function calendarSync(calendarNumber) {
  if(calendarNumber == -1){
    var currentCal = CalendarApp.getCalendarById(YOUR CALENDAR ID);
  } else {
    var allCals = CalendarApp.getAllCalendars();
    var currentCal = allCals[calendarNumber];
  }
  var yearSheets = getAllSheets();

  for(var x = 0; x<yearSheets.length; x++){

    var sheet1 = SpreadsheetApp.getActiveSheet();
    var IdColumn = 12;
    var startColumn = 0;
    var endColumn = 1;
    var titleColumn = 2;
    var locationColumn = 3;

    var activeYear = sheet1.getName();

    var yearStart = new Date(Date.parse("January 1, "+activeYear));
    var yearEnd = new Date(Date.parse("December 31, "+activeYear));

    var now = new Date();
    var fivehundredDaysAgo = new Date(now.getTime() - (500*24*60*60*1000));
    var fivehundredDaysFromNow = new Date(now.getTime() + (500*24*60*60*1000));

    //getting the data from the spreadsheet
    var data = sheet1.getDataRange().getValues();
    var headrow = [];
    //getting the column index for starttime, endtime, title and ID
    for(var a = 0;a<data[0].length; a++){
      headrow[a] = data[0][a];
      var currentField = data[0][a];
      if(currentField =="Id"){
        IdColumn = a;
      }
      if(currentField == "Datum" || currentField == "Start"){
        startColumn = a;
      }
      if(currentField == "Ende" || currentField == "End") {
        endColumn = a;
      }
      if(currentField == "Titel"){
        titleColumn = a;
      }
      if(currentField == "Ort") {
        locationColumn = a;
      }
    }
    sheet1.hideColumns(IdColumn+1);
    var calenderEvents = currentCal.getEvents(yearStart, yearEnd, {search: "This event was generated by the CalendarSync script"});

    var importantColumns = [IdColumn, startColumn, endColumn, titleColumn, locationColumn];
    var importantData = [];
    //initializing some variables for efficiency
    var details = "";
    var currentId = null;

    //make array corresponding to importantColumns Array with the relevant data

    //Updating the calendar with all the new Events from the Spreadsheet as well as updating already existing ones, should new information exist.
    for(var i = 1; i < data.length; i++){
      currentId = data[i][IdColumn];
      Logger.log(currentId+"    "+currentId.length);
      details = parseEventDescription(i, data, importantColumns);
      var start = new Date(data[i][startColumn]);
      var end = new Date(data[i][endColumn]);
      var title = data[i][titleColumn];
      var location = data[i][locationColumn];
      importantData = [currentId, start, end, title, location, details, i];
      var eventFound = false;
      if(currentId.length>1){
        for(var j = 0; j < calenderEvents.length; j++){
          var currentEvent = calenderEvents[j];
          var currentCalenderEventId = currentEvent.getId();
          if(currentCalenderEventId == currentId){
            eventFound = true;
            Logger.log("event found!");
            // updateCalendarEvent(start, end, title, location, i, details, data, currentEvent);
            updateCalenderEventArray(importantData, currentEvent);
            break;
          }
        }
      }
      if(eventFound == false){ //check for start time if event is old @override
        Logger.log("trying to create event!!");
        var newCalEvent = currentCal.createEvent(title, start, end, {location: location});
        sheet1.getRange(i+1, IdColumn+1).setValue(newCalEvent.getId());  // @override need to change the column selection for inserting the new Ids
        newCalEvent.setDescription(details);
        newCalEvent.setTag("booking", "true");
      }
      eventFound = false;
    }

    //Deleting all CalenderEvents that are not found in the Spreadsheet anymore
    var backwardsCheckId = null;
    for(var l = 0;l<calenderEvents.length;l++){
      var currentEvent_Delete = calenderEvents[l];
      var currentCalenderEventId_Delete = currentEvent_Delete.getId();
      var currentCalenderEventInSheet = false;
      for(var k = 0; k < data.length; k++) {
        backwardsCheckId = data[k][IdColumn];
        if(backwardsCheckId == currentCalenderEventId_Delete) {
          currentCalenderEventInSheet = true;
          Logger.log("Event found in Sheet!!");
          break;
        }
      }
      if(!currentCalenderEventInSheet){
        currentEvent_Delete.deleteEvent();
        Logger.log("Deleted Event!");
      }
    }
    sheet1.sort(1, true);
  }
  return getAllCalendars()[calendarNumber];
}

/**
 * Function to retrive all sheets that have year numbers as names.
 * @return yearSheets       array of all the sheets with year numbers as names
 */
function getAllSheets(){
  ss = SpreadsheetApp.getActiveSpreadsheet()
  s = ss.getSheets();
  var yearSheets = ss.getSheets();
  for(var i = 0; i < s.length; i++){
    if(isNaN(s[i].getName())){
      a = yearSheets.splice(i, 1);
      Logger.log("YEAR: "+s[i]);
    }
  }
  return yearSheets;
}

/**
 * function to parse Dates from a "DD.MM.YYYY HH:MM" format. Spacing errors in between the space and time fractions of the date are being caught.
 * @param date
 * @returns Date Object of the given date
 */
function parseDate(date){
  //catching format errors around spacing
  if(date.charAt(10).equals(' ')){
	  date = date.split(" ");
  } else {
	  date = [date.slice(0,10), date.slice(10, date.length+1)];
	  Logger.log(date[0]+"        "+date[1]);
  }
  dateDays = date[0].split(".");
  var thisismyDate = dateDays[2]+"-"+dateDays[1]+"-"+dateDays[0]+"T"+date[1]+":00.000Z";
  //calculating for time zone differences
  var currentTimezoneOffset = new Date().getTimezoneOffset()*60*1000;
  var returnDate = Date.parse(thisismyDate);
  returnDate = returnDate + currentTimezoneOffset;
  Logger.log(thisismyDate);
  return new Date(returnDate);
}

/**
 * The function parseEventDesciption(row, data) returns all the corresponding information to a specific calendarEvent in a concatenated string.
 * Starttime, endtime and the title are not included in the String.
 * @param row			the row of the spreadsheet where the relevant information can be found
 * @param data			the whole spreadsheet data
 *
 * @returns				a concatenated string of all the event details to be used as the CalendarEvent.Description
 */
function parseEventDescription(row, data, columns){
  var alreadyUsedColumn = false;
  // var details = data[0][3]+": \n\n"+data[row][3]+"\n\n";
  var details = "";
  for(var i = 0; i<data[0].length; i++){
    for(var j = 0; j<columns.length; j++){
      if(i == columns[j]){
        alreadyUsedColumn = true;
      }
    }
    if(alreadyUsedColumn == false){
      details = details.concat(data[0][i]+": \n"+data[row][i]+"\n\n");
    }
    alreadyUsedColumn = false;
  }
  details = details.concat("This event was generated by the CalendarSync script");
  return details;
}

/**
 * [currentId, start, end, title, location, details, i]
 */
function updateCalenderEventArray(eventData, event){
  event.setTime(eventData[1], eventData[2]);
  event.setTitle(eventData[3]);
  event.setLocation(eventData[4]);
  details = eventData[5];
  var inSheet = details.split("\n");
  var inCalendar = event.getDescription().split("\n");
  for(var m = 0;m < inSheet.length; m++){
    if(inSheet[m] != inCalendar[m]){
      inCalendar[m] = inSheet[m];
    }
  }
  var newDetails = inSheet[0];
  for(var n = 1;n < inSheet.length; n++){
    newDetails = newDetails.concat(inSheet[n]+"\n");
  }
  event.setDescription(newDetails);
  event.setTag("booking", "true");
}

/**
 * function to open the sidebar interface
 */
function showSyncSidebar(){
  var html = HtmlService.createHtmlOutputFromFile('page')
                .setTitle('Sync to Calendar')
                .setWidth(500);
  SpreadsheetApp.getUi().showSidebar(html);
}


/**
 * function to get all the calendars of the user by name
 *
 * @return calendarNames     an array filled by the names of the user's calendars
 */
function getAllCalendars(){
  var calendars = CalendarApp.getAllCalendars();
  var calendarNames = [];
  for(var i = 0; i < calendars.length; i++){
    calendarNames = calendarNames.concat(calendars[i].getName());
  }
  return calendarNames;
}
