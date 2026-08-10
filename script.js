/* =========================================================
   GTM SOCCER ACADEMY
   PRIVATE SOCCER COACHING BOOKING SYSTEM
   GOOGLE APPS SCRIPT BACKEND
   ========================================================= */


/* =========================================================
   GTM SETTINGS
   ========================================================= */

const SHEET_NAME = "Bookings";

const OWNER_EMAIL =
  "godknowstmusara@gmail.com";

const OWNER_PHONE =
  "+27622422996";


/*
   Training hours:
   08:00 - 18:00
*/

const OPENING_TIME = "08:00";
const CLOSING_TIME = "18:00";


/* =========================================================
   GET REQUEST
   Used by the website to check available times.
   ========================================================= */

function doGet(e) {

  try {

    const action =
      e && e.parameter
        ? e.parameter.action
        : "";


    /*
       Availability request
    */

    if (
      action === "availability"
    ) {

      const date =
        e.parameter.date;


      return jsonResponse(
        getAvailability(date)
      );

    }


    /*
       Test the booking system
    */

    return jsonResponse({

      success: true,

      message:
        "GTM Soccer Academy Booking System is working.",

      email:
        OWNER_EMAIL,

      phone:
        OWNER_PHONE

    });


  } catch (error) {

    return jsonResponse({

      success: false,

      message:
        error.message

    });

  }

}


/* =========================================================
   POST REQUEST
   Used by the website to create a booking.
   ========================================================= */

function doPost(e) {

  const lock =
    LockService.getScriptLock();


  try {

    /*
       Prevent two people from booking
       the same slot simultaneously.
    */

    lock.waitLock(30000);


    if (
      !e ||
      !e.postData ||
      !e.postData.contents
    ) {

      throw new Error(
        "No booking information was received."
      );

    }


    const data =
      JSON.parse(
        e.postData.contents
      );


    const result =
      createBooking(data);


    return jsonResponse(
      result
    );


  } catch (error) {

    return jsonResponse({

      success: false,

      message:
        error.message

    });


  } finally {

    lock.releaseLock();

  }

}


/* =========================================================
   CREATE NEW BOOKING
   ========================================================= */

function createBooking(data) {

  /*
     Required booking fields
  */

  const requiredFields = [

    "parentName",
    "phone",
    "playerName",
    "age",
    "session",
    "price",
    "date",
    "startTime",
    "location"

  ];


  requiredFields.forEach(
    function(field) {

      if (
        !data[field] ||
        String(data[field]).trim() === ""
      ) {

        throw new Error(
          "Please complete the " +
          field +
          " field."
        );

      }

    }
  );


  /*
     Get spreadsheet
  */

  const spreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    spreadsheet
      .getSheetByName(
        SHEET_NAME
      );


  if (!sheet) {

    throw new Error(
      'The sheet "' +
      SHEET_NAME +
      '" could not be found.'
    );

  }


  /*
     Get session duration
  */

  const duration =
    getDuration(
      data.session
    );


  /*
     Convert requested start time
     into minutes.
  */

  const startMinutes =
    timeToMinutes(
      data.startTime
    );


  /*
     Calculate end time.
  */

  const endMinutes =
    startMinutes +
    duration;


  /*
     Training hours.
  */

  const openingMinutes =
    timeToMinutes(
      OPENING_TIME
    );


  const closingMinutes =
    timeToMinutes(
      CLOSING_TIME
    );


  /*
     Make sure booking is within
     GTM Soccer Academy's hours.
  */

  if (
    startMinutes <
    openingMinutes
  ) {

    throw new Error(
      "The selected time is before the academy's opening time."
    );

  }


  if (
    endMinutes >
    closingMinutes
  ) {

    throw new Error(
      "The selected session would finish after the academy's closing time."
    );

  }


  /*
     Check for overlapping bookings.
  */

  const alreadyBooked =
    isTimeBooked(

      data.date,

      startMinutes,

      endMinutes

    );


  if (alreadyBooked) {

    throw new Error(
      "Sorry, this time slot has already been booked. Please select another available time."
    );

  }


  /*
     Generate booking reference.
  */

  const bookingId =
    generateBookingId();


  /*
     Calculate end time.
  */

  const endTime =
    minutesToTime(
      endMinutes
    );


  /*
     Current timestamp.
  */

  const timestamp =
    new Date();


  /*
     Add booking to Google Sheet.
  */

  sheet.appendRow([

    bookingId,

    timestamp,

    data.parentName,

    data.phone,

    data.playerName,

    data.age,

    data.session,

    "R" + data.price,

    data.date,

    data.startTime,

    endTime,

    data.location,

    data.message || "",

    "Confirmed"

  ]);


  /*
     Send email notification.
  */

  sendBookingEmail(

    data,

    bookingId,

    endTime

  );


  /*
     Return successful result.
  */

  return {

    success: true,

    bookingId:
      bookingId,

    endTime:
      endTime,

    message:
      "GTM Soccer Academy booking confirmed successfully."

  };

}


/* =========================================================
   GET AVAILABLE BOOKINGS FOR A DATE
   ========================================================= */

function getAvailability(date) {

  if (!date) {

    return {

      success: false,

      message:
        "Please select a date."

    };

  }


  /*
     Get spreadsheet.
  */

  const spreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    spreadsheet
      .getSheetByName(
        SHEET_NAME
      );


  if (!sheet) {

    return {

      success: false,

      message:
        'The sheet "' +
        SHEET_NAME +
        '" could not be found.'

    };

  }


  /*
     Get number of rows.
  */

  const lastRow =
    sheet.getLastRow();


  /*
     No bookings yet.
  */

  if (
    lastRow <= 1
  ) {

    return {

      success: true,

      date:
        date,

      bookings: []

    };

  }


  /*
     Read booking rows.
  */

  const rows =
    sheet
      .getRange(

        2,

        1,

        lastRow - 1,

        14

      )
      .getValues();


  const bookings = [];


  /*
     Check every booking.
  */

  rows.forEach(
    function(row) {

      /*
         Column I = Date
      */

      const bookingDate =
        formatDate(
          row[8]
        );


      /*
         Column N = Status
      */

      const status =
        String(
          row[13]
        ).trim()
        .toLowerCase();


      /*
         Ignore cancelled bookings.
      */

      if (
        bookingDate === date &&
        status !== "cancelled"
      ) {

        /*
           Column J = Start Time
        */

        const start =
          timeToMinutes(
            formatTime(
              row[9]
            )
          );


        /*
           Column K = End Time
        */

        const end =
          timeToMinutes(
            formatTime(
              row[10]
            )
          );


        bookings.push({

          start:
            start,

          end:
            end

        });

      }

    }
  );


  return {

    success: true,

    date:
      date,

    bookings:
      bookings

  };

}


/* =========================================================
   CHECK FOR OVERLAPPING BOOKINGS
   ========================================================= */

function isTimeBooked(

  date,

  requestedStart,

  requestedEnd

) {

  const spreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    spreadsheet
      .getSheetByName(
        SHEET_NAME
      );


  if (!sheet) {

    throw new Error(
      'The sheet "' +
      SHEET_NAME +
      '" could not be found.'
    );

  }


  const lastRow =
    sheet.getLastRow();


  /*
     No bookings.
  */

  if (
    lastRow <= 1
  ) {

    return false;

  }


  /*
     Read all bookings.
  */

  const rows =
    sheet
      .getRange(

        2,

        1,

        lastRow - 1,

        14

      )
      .getValues();


  /*
     Check every booking.
  */

  for (
    let i = 0;

    i < rows.length;

    i++
  ) {

    const row =
      rows[i];


    /*
       Date is column I.
    */

    const bookingDate =
      formatDate(
        row[8]
      );


    /*
       Status is column N.
    */

    const status =
      String(
        row[13]
      )
      .trim()
      .toLowerCase();


    /*
       Ignore different dates
       and cancelled bookings.
    */

    if (
      bookingDate !== date ||
      status === "cancelled"
    ) {

      continue;

    }


    /*
       Start time is column J.
    */

    const existingStart =
      timeToMinutes(
        formatTime(
          row[9]
        )
      );


    /*
       End time is column K.
    */

    const existingEnd =
      timeToMinutes(
        formatTime(
          row[10]
        )
      );


    /*
       OVERLAP TEST

       Example:

       Existing:
       14:00 - 15:30

       New:
       15:00 - 16:00

       Result:
       BLOCKED

       New:
       15:30 - 16:30

       Result:
       AVAILABLE
    */

    if (

      requestedStart <
      existingEnd

      &&

      requestedEnd >
      existingStart

    ) {

      return true;

    }

  }


  return false;

}


/* =========================================================
   SEND EMAIL NOTIFICATION
   ========================================================= */

function sendBookingEmail(

  data,

  bookingId,

  endTime

) {

  /*
     Email subject.
  */

  const subject =
    "⚽ New GTM Soccer Academy Booking - " +
    bookingId;


  /*
     Email message.
  */

  const body = `

GTM SOCCER ACADEMY
PRIVATE SOCCER COACHING

================================

NEW BOOKING

Booking Reference:
${bookingId}

================================

PLAYER INFORMATION

Player Name:
${data.playerName}

Age:
${data.age}

================================

PARENT / GUARDIAN

Name:
${data.parentName}

Phone:
${data.phone}

================================

TRAINING SESSION

Session:
${data.session}

Price:
R${data.price}

================================

APPOINTMENT

Date:
${data.date}

Time:
${data.startTime} - ${endTime}

Location:
${data.location}

================================

PLAYER GOALS / NOTES

${data.message || "No additional notes provided."}

================================

GTM SOCCER ACADEMY

Phone:
${OWNER_PHONE}

Email:
${OWNER_EMAIL}

Please contact the parent/guardian to confirm the training session.

Thank you.

GTM Soccer Academy
`;


  /*
     Send email.
  */

  MailApp.sendEmail({

    to:
      OWNER_EMAIL,

    subject:
      subject,

    body:
      body

  });

}


/* =========================================================
   GET SESSION DURATION
   ========================================================= */

function getDuration(
  session
) {

  const sessionText =
    String(
      session
    )
    .toLowerCase();


  /*
     1 Hour 30 Minutes
  */

  if (
    sessionText.includes(
      "1 hour 30"
    )
  ) {

    return 90;

  }


  /*
     2 Hours
  */

  if (
    sessionText.includes(
      "2 hour"
    )
  ) {

    return 120;

  }


  /*
     Default:
     1 Hour
  */

  return 60;

}


/* =========================================================
   CONVERT TIME TO MINUTES
   ========================================================= */

function timeToMinutes(
  time
) {

  if (!time) {

    throw new Error(
      "Invalid time."
    );

  }


  const parts =
    String(time)
      .split(":");


  if (
    parts.length < 2
  ) {

    throw new Error(
      "Invalid time format: " +
      time
    );

  }


  const hours =
    parseInt(
      parts[0],
      10
    );


  const minutes =
    parseInt(
      parts[1],
      10
    );


  return (
    hours * 60 +
    minutes
  );

}


/* =========================================================
   CONVERT MINUTES TO TIME
   ========================================================= */

function minutesToTime(
  minutes
) {

  const hours =
    Math.floor(
      minutes / 60
    );


  const mins =
    minutes % 60;


  return (

    String(hours)
      .padStart(2, "0")

    +

    ":"

    +

    String(mins)
      .padStart(2, "0")

  );

}


/* =========================================================
   FORMAT TIME FROM GOOGLE SHEETS
   ========================================================= */

function formatTime(
  value
) {

  /*
     Google Sheets may return
     a Date object.
  */

  if (
    value instanceof Date
  ) {

    return Utilities.formatDate(

      value,

      Session.getScriptTimeZone(),

      "HH:mm"

    );

  }


  /*
     Otherwise return text.
  */

  return String(
    value
  );

}


/* =========================================================
   FORMAT DATE FROM GOOGLE SHEETS
   ========================================================= */

function formatDate(
  value
) {

  /*
     Google Sheets may return
     a Date object.
  */

  if (
    value instanceof Date
  ) {

    return Utilities.formatDate(

      value,

      Session.getScriptTimeZone(),

      "yyyy-MM-dd"

    );

  }


  /*
     Otherwise return text.
  */

  return String(
    value
  );

}


/* =========================================================
   GENERATE BOOKING REFERENCE
   ========================================================= */

function generateBookingId() {

  const randomNumber =
    Math.floor(

      100000 +

      Math.random() *
      900000

    );


  return (
    "GTM-" +
    randomNumber
  );

}


/* =========================================================
   RETURN JSON RESPONSE
   ========================================================= */

function jsonResponse(
  data
) {

  return ContentService

    .createTextOutput(

      JSON.stringify(
        data
      )

    )

    .setMimeType(

      ContentService.MimeType.JSON

    );

}
