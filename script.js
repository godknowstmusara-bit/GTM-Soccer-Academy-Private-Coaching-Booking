/* =========================================================
   GTM SOCCER ACADEMY
   WEBSITE BOOKING SYSTEM
   GOOGLE APPS SCRIPT CONNECTION
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT URL
========================================================= */

const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxuJG9zxr5LB-RU0G1-mQX4VMx3BUetwLQG6Ur8dYysNX1mYe7M8rO1LDjFMgtKZPPk/exec";


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const bookingForm =
    document.getElementById("bookingForm");

const dateInput =
    document.getElementById("date");

const timeSelect =
    document.getElementById("time");

const selectedSession =
    document.getElementById("selectedSession");

const selectedPrice =
    document.getElementById("selectedPrice");

const menuToggle =
    document.getElementById("menuToggle");

const nav =
    document.getElementById("nav");

const successModal =
    document.getElementById("successModal");

const closeModal =
    document.getElementById("closeModal");

const modalDone =
    document.getElementById("modalDone");

const confirmationDetails =
    document.getElementById("confirmationDetails");


/* =========================================================
   CURRENT YEAR
========================================================= */

const yearElement =
    document.getElementById("year");

if (yearElement) {

    yearElement.textContent =
        new Date().getFullYear();

}


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

if (menuToggle) {

    menuToggle.addEventListener(
        "click",
        function () {

            nav.classList.toggle("active");

        }
    );

}


/* Close mobile menu after clicking a link */

if (nav) {

    const navLinks =
        nav.querySelectorAll("a");

    navLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    nav.classList.remove("active");

                }
            );

        }
    );

}


/* =========================================================
   TRAINING PACKAGE BUTTONS
========================================================= */

const packageButtons =
    document.querySelectorAll(
        ".package-btn"
    );


packageButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const packageName =
                    button.dataset.package;

                const packagePrice =
                    button.dataset.price;


                /*
                   Select the matching
                   radio button.
                */

                const radio =
                    document.querySelector(
                        `input[name="session"][value="${packageName}"]`
                    );


                if (radio) {

                    radio.checked = true;

                }


                /*
                   Update summary.
                */

                updateSessionSummary();


                /*
                   Scroll to booking.
                */

                const bookingSection =
                    document.getElementById(
                        "booking"
                    );


                if (bookingSection) {

                    bookingSection.scrollIntoView({

                        behavior: "smooth"

                    });

                }

            }
        );

    }
);


/* =========================================================
   SESSION SELECTION
========================================================= */

const sessionRadios =
    document.querySelectorAll(
        'input[name="session"]'
    );


sessionRadios.forEach(
    function (radio) {

        radio.addEventListener(
            "change",
            function () {

                updateSessionSummary();

                /*
                   Refresh available times
                   because different sessions
                   have different durations.
                */

                loadAvailableTimes();

            }
        );

    }
);


/* =========================================================
   UPDATE SESSION SUMMARY
========================================================= */

function updateSessionSummary() {

    const selected =
        document.querySelector(
            'input[name="session"]:checked'
        );


    if (!selected) {

        selectedSession.textContent =
            "Please select a session";

        selectedPrice.textContent =
            "R0";

        return;

    }


    selectedSession.textContent =
        selected.value;


    selectedPrice.textContent =
        "R" +
        selected.dataset.price;

}


/* =========================================================
   SET MINIMUM BOOKING DATE
========================================================= */

function setMinimumDate() {

    if (!dateInput) {

        return;

    }


    /*
       Get today's date.
    */

    const today =
        new Date();


    /*
       Convert to YYYY-MM-DD.
    */

    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        )
        .padStart(2, "0");


    const day =
        String(
            today.getDate()
        )
        .padStart(2, "0");


    const todayString =
        `${year}-${month}-${day}`;


    dateInput.min =
        todayString;

}


setMinimumDate();


/* =========================================================
   DATE CHANGE
========================================================= */

if (dateInput) {

    dateInput.addEventListener(
        "change",
        function () {

            loadAvailableTimes();

        }
    );

}


/* =========================================================
   CREATE TIME SLOTS
========================================================= */

function createTimeSlots() {

    const slots = [];

    /*
       Training hours:
       08:00 - 18:00

       We create slots every 30 minutes.
    */

    for (
        let minutes = 480;
        minutes <= 1050;
        minutes += 30
    ) {

        const hours =
            Math.floor(
                minutes / 60
            );


        const mins =
            minutes % 60;


        const time =
            String(hours)
                .padStart(2, "0")
            +
            ":"
            +
            String(mins)
                .padStart(2, "0");


        slots.push({

            time: time,

            minutes: minutes

        });

    }


    return slots;

}


/* =========================================================
   GET SESSION DURATION
========================================================= */

function getSessionDuration() {

    const selected =
        document.querySelector(
            'input[name="session"]:checked'
        );


    if (!selected) {

        return 60;

    }


    const session =
        selected.value;


    if (
        session.includes(
            "1 Hour 30"
        )
    ) {

        return 90;

    }


    if (
        session.includes(
            "2 Hours"
        )
    ) {

        return 120;

    }


    return 60;

}


/* =========================================================
   CONVERT TIME TO MINUTES
========================================================= */

function convertTimeToMinutes(
    time
) {

    const parts =
        time.split(":");


    return (
        parseInt(parts[0], 10) * 60
        +
        parseInt(parts[1], 10)
    );

}


/* =========================================================
   LOAD AVAILABLE TIMES
========================================================= */

async function loadAvailableTimes() {

    if (!dateInput || !timeSelect) {

        return;

    }


    const selectedDate =
        dateInput.value;


    if (!selectedDate) {

        timeSelect.innerHTML = `

            <option value="">
                Select a date first
            </option>

        `;

        return;

    }


    /*
       Make sure a session
       has been selected.
    */

    const selectedSessionRadio =
        document.querySelector(
            'input[name="session"]:checked'
        );


    if (!selectedSessionRadio) {

        timeSelect.innerHTML = `

            <option value="">
                Select a training session first
            </option>

        `;

        return;

    }


    /*
       Show loading message.
    */

    timeSelect.innerHTML = `

        <option value="">
            Checking available times...
        </option>

    `;


    try {

        const url =
            SCRIPT_URL
            +
            "?action=availability&date="
            +
            encodeURIComponent(
                selectedDate
            );


        const response =
            await fetch(url);


        const result =
            await response.json();


        if (
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Could not load availability."
            );

        }


        const bookings =
            result.bookings || [];


        const duration =
            getSessionDuration();


        const slots =
            createTimeSlots();


        /*
           Clear time selector.
        */

        timeSelect.innerHTML = `

            <option value="">
                Select available time
            </option>

        `;


        let availableCount =
            0;


        slots.forEach(
            function (slot) {

                const start =
                    slot.minutes;


                const end =
                    start + duration;


                /*
                   Training cannot finish
                   after 18:00.
                */

                if (
                    end > 1080
                ) {

                    return;

                }


                /*
                   Check existing bookings.
                */

                const conflict =
                    bookings.some(
                        function (booking) {

                            return (

                                start <
                                booking.end

                                &&

                                end >
                                booking.start

                            );

                        }
                    );


                if (!conflict) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        slot.time;


                    option.textContent =
                        formatDisplayTime(
                            slot.time
                        );


                    timeSelect.appendChild(
                        option
                    );


                    availableCount++;

                }

            }
        );


        if (
            availableCount === 0
        ) {

            timeSelect.innerHTML = `

                <option value="">
                    No available times for this date
                </option>

            `;

        }

    } catch (error) {

        console.error(
            "Availability error:",
            error
        );


        timeSelect.innerHTML = `

            <option value="">
                Unable to load times
            </option>

        `;

    }

}


/* =========================================================
   FORMAT TIME FOR DISPLAY
========================================================= */

function formatDisplayTime(
    time
) {

    const parts =
        time.split(":");


    let hours =
        parseInt(
            parts[0],
            10
        );


    const minutes =
        parts[1];


    const period =
        hours >= 12
            ? "PM"
            : "AM";


    if (hours === 0) {

        hours = 12;

    } else if (hours > 12) {

        hours -= 12;

    }


    return (
        hours
        +
        ":"
        +
        minutes
        +
        " "
        +
        period
    );

}


/* =========================================================
   FORM SUBMISSION
========================================================= */

if (bookingForm) {

    bookingForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /*
               Find submit button.
            */

            const submitButton =
                bookingForm.querySelector(
                    ".submit-btn"
                );


            /*
               Make sure a session
               is selected.
            */

            const selectedSessionRadio =
                document.querySelector(
                    'input[name="session"]:checked'
                );


            if (!selectedSessionRadio) {

                alert(
                    "Please select a training session."
                );

                return;

            }


            /*
               Make sure time is selected.
            */

            if (
                !timeSelect.value
            ) {

                alert(
                    "Please select an available training time."
                );

                return;

            }


            /*
               Get price.
            */

            const price =
                selectedSessionRadio.dataset.price;


            /*
               Prevent duplicate clicks.
            */

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.innerHTML = `

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Sending Booking...

                `;

            }


            /*
               Build booking data.
            */

            const bookingData = {

                /* Parent */

                parentName:
                    document
                        .getElementById(
                            "parentName"
                        )
                        .value
                        .trim(),

                phone:
                    document
                        .getElementById(
                            "phone"
                        )
                        .value
                        .trim(),


                /* Player */

                playerName:
                    document
                        .getElementById(
                            "playerName"
                        )
                        .value
                        .trim(),

                age:
                    document
                        .getElementById(
                            "age"
                        )
                        .value,


                /* Session */

                session:
                    selectedSessionRadio.value,

                price:
                    price,


                /* Appointment */

                date:
                    dateInput.value,

                startTime:
                    timeSelect.value,

                location:
                    document
                        .getElementById(
                            "location"
                        )
                        .value,


                /* Goals */

                message:
                    document
                        .getElementById(
                            "message"
                        )
                        .value
                        .trim(),


                /* =================================================
                   HEALTH & WELLBEING
                ================================================= */

                wellbeing:
                    document
                        .getElementById(
                            "wellbeing"
                        )
                        .value,


                injury:
                    document
                        .getElementById(
                            "injury"
                        )
                        .value,


                injuryDetails:
                    document
                        .getElementById(
                            "injuryDetails"
                        )
                        .value
                        .trim(),


                recentActivity:
                    document
                        .getElementById(
                            "recentActivity"
                        )
                        .value,


                importantInfo:
                    document
                        .getElementById(
                            "importantInfo"
                        )
                        .value
                        .trim(),


                allergies:
                    document
                        .getElementById(
                            "allergies"
                        )
                        .value
                        .trim(),


                /* Emergency contact */

                emergencyName:
                    document
                        .getElementById(
                            "emergencyName"
                        )
                        .value
                        .trim(),


                emergencyPhone:
                    document
                        .getElementById(
                            "emergencyPhone"
                        )
                        .value
                        .trim(),


                relationship:
                    document
                        .getElementById(
                            "relationship"
                        )
                        .value

            };


            try {

                /*
                   Send booking to
                   Google Apps Script.
                */

                const response =
                    await fetch(
                        SCRIPT_URL,
                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    bookingData
                                )

                        }
                    );


                const result =
                    await response.json();


                /*
                   Booking failed.
                */

                if (
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Booking could not be completed."
                    );

                }


                /*
                   Show confirmation.
                */

                showConfirmation(

                    bookingData,

                    result

                );


                /*
                   Reset form.
                */

                bookingForm.reset();


                /*
                   Reset summary.
                */

                updateSessionSummary();


                /*
                   Reset time selector.
                */

                timeSelect.innerHTML = `

                    <option value="">
                        Select a date first
                    </option>

                `;


            } catch (error) {

                console.error(
                    "Booking error:",
                    error
                );


                alert(
                    "Sorry, your booking could not be submitted.\n\n"
                    +
                    error.message
                    +
                    "\n\nPlease contact GTM Soccer Academy on +27 62 242 2996."
                );


            } finally {

                /*
                   Restore button.
                */

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML = `

                        <i class="fa-solid fa-calendar-check"></i>

                        Request Booking

                    `;

                }

            }

        }
    );

}


/* =========================================================
   SHOW CONFIRMATION
========================================================= */

function showConfirmation(
    bookingData,
    result
) {

    if (!successModal) {

        return;

    }


    confirmationDetails.innerHTML = `

        <div class="confirmation-row">

            <span>
                Booking Reference
            </span>

            <strong>
                ${escapeHTML(
                    result.bookingId
                )}
            </strong>

        </div>


        <div class="confirmation-row">

            <span>
                Player
            </span>

            <strong>
                ${escapeHTML(
                    bookingData.playerName
                )}
            </strong>

        </div>


        <div class="confirmation-row">

            <span>
                Session
            </span>

            <strong>
                ${escapeHTML(
                    bookingData.session
                )}
            </strong>

        </div>


        <div class="confirmation-row">

            <span>
                Date
            </span>

            <strong>
                ${escapeHTML(
                    bookingData.date
                )}
            </strong>

        </div>


        <div class="confirmation-row">

            <span>
                Time
            </span>

            <strong>
                ${escapeHTML(
                    formatDisplayTime(
                        bookingData.startTime
                    )
                    +
                    " - "
                    +
                    formatDisplayTime(
                        result.endTime
                    )
                )}
            </strong>

        </div>


        <div class="confirmation-row">

            <span>
                Location
            </span>

            <strong>
                ${escapeHTML(
                    bookingData.location
                )}
            </strong>

        </div>


        <div class="confirmation-row">

            <span>
                Price
            </span>

            <strong>
                R${escapeHTML(
                    bookingData.price
                )}
            </strong>

        </div>


        <p class="confirmation-message">

            Your booking request has been received.
            GTM Soccer Academy will contact you if
            further confirmation is required.

        </p>

    `;


    successModal.classList.add(
        "active"
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;

}


/* =========================================================
   CLOSE SUCCESS MODAL
========================================================= */

function closeSuccessModal() {

    if (successModal) {

        successModal.classList.remove(
            "active"
        );

    }

}


if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeSuccessModal
    );

}


if (modalDone) {

    modalDone.addEventListener(
        "click",
        closeSuccessModal
    );

}


/* Close modal when clicking outside */

if (successModal) {

    successModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                successModal
            ) {

                closeSuccessModal();

            }

        }
    );

}


/* =========================================================
   INITIALISE
========================================================= */

updateSessionSummary();
