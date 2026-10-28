/*
 * Movie Seat Booking System
 * Problem Statement 1 (Set C)
 * Author: Student Submission
 */

// Global Cinema State
let numRows = 3;
let seatsPerRow = 5;
let nextBookingNumber = 1;

// grid: { 'A': [{ seat: 'A1', bookingId: null }, ...], 'B': ... }
let cinemaGrid = {};
// activeBookings: Map { 1 => { id: 1, seats: ['A1', 'A2', 'A3'] } }
let activeBookings = new Map();
// auditLog: Array of strings
let auditLog = [];

// Initialize or reset the cinema seats
function initCinema(rows, seats) {
  numRows = parseInt(rows, 10);
  seatsPerRow = parseInt(seats, 10);
  nextBookingNumber = 1;
  activeBookings.clear();
  auditLog = [];
  cinemaGrid = {};

  for (let r = 0; r < numRows; r++) {
    const rowLetter = String.fromCharCode(65 + r); // A, B, C...
    cinemaGrid[rowLetter] = [];
    for (let s = 1; s <= seatsPerRow; s++) {
      cinemaGrid[rowLetter].push({
        seat: `${rowLetter}${s}`,
        row: rowLetter,
        col: s,
        bookingId: null
      });
    }
  }
}

// Validation helper: checks if input is a valid positive whole number
function isValidPositiveInteger(val) {
  if (val === null || val === undefined) return false;
  const str = String(val).trim();
  if (str === "") return false;
  const num = Number(str);
  return Number.isInteger(num) && num > 0;
}

// Logic: Book K seats
function bookSeats(seatCountInput) {
  // Check 1: INVALID COUNT (blank, zero, negative, or not a whole number)
  if (!isValidPositiveInteger(seatCountInput)) {
    return { success: false, message: "INVALID COUNT" };
  }

  const k = Number(seatCountInput);

  // Check 2: A number bigger than one full row can never fit -> NO SEATS TOGETHER
  if (k > seatsPerRow) {
    return { success: false, message: "NO SEATS TOGETHER" };
  }

  // Check 3: Search rows in order: A first, then B, then C...
  let chosenRow = null;
  let chosenStartIndex = -1;

  for (let r = 0; r < numRows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    const rowSeats = cinemaGrid[rowLetter];

    // Look for leftmost block of K empty seats next to each other
    for (let i = 0; i <= seatsPerRow - k; i++) {
      let consecutiveEmpty = true;
      for (let j = 0; j < k; j++) {
        if (rowSeats[i + j].bookingId !== null) {
          consecutiveEmpty = false;
          break;
        }
      }

      if (consecutiveEmpty) {
        chosenRow = rowLetter;
        chosenStartIndex = i;
        break; // Leftmost block in this row found
      }
    }

    if (chosenRow !== null) {
      break; // First row in alphabetical order found
    }
  }

  // If no single row has K empty seats together
  if (chosenRow === null) {
    return { success: false, message: "NO SEATS TOGETHER" };
  }

  // Assign the booking
  const bookingId = nextBookingNumber++;
  const allocatedSeats = [];
  const rowSeats = cinemaGrid[chosenRow];

  for (let j = 0; j < k; j++) {
    const seatObj = rowSeats[chosenStartIndex + j];
    seatObj.bookingId = bookingId;
    allocatedSeats.push(seatObj.seat);
  }

  activeBookings.set(bookingId, {
    id: bookingId,
    seats: allocatedSeats,
    row: chosenRow
  });

  const seatStr = allocatedSeats.join(" ");
  return {
    success: true,
    message: `BOOKED ${bookingId}: ${seatStr}`
  };
}

// Logic: Cancel booking
function cancelBooking(bookingIdInput) {
  // Check 1: INVALID BOOKING (blank, zero, negative, or not a whole number)
  if (!isValidPositiveInteger(bookingIdInput)) {
    return { success: false, message: "INVALID BOOKING" };
  }

  const bookingId = Number(bookingIdInput);

  // Check 2: BOOKING NOT FOUND (if no active booking exists with that number)
  if (!activeBookings.has(bookingId)) {
    return { success: false, message: "BOOKING NOT FOUND" };
  }

  // Check 3: Free seats and remove booking
  const booking = activeBookings.get(bookingId);
  const freedSeats = [...booking.seats];

  for (const seatCode of freedSeats) {
    const rowLetter = seatCode.charAt(0);
    const seatObj = cinemaGrid[rowLetter].find((s) => s.seat === seatCode);
    if (seatObj) {
      seatObj.bookingId = null;
    }
  }

  activeBookings.delete(bookingId);
  const seatStr = freedSeats.join(" ");
  return {
    success: true,
    message: `CANCELLED ${bookingId}: ${seatStr}`
  };
}

// DOM Rendering Functions
function updateStats() {
  let empty = 0;
  for (let r = 0; r < numRows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    for (const s of cinemaGrid[rowLetter]) {
      if (s.bookingId === null) empty++;
    }
  }
  const booked = (numRows * seatsPerRow) - empty;

  document.getElementById("statEmpty").textContent = empty;
  document.getElementById("statBooked").textContent = booked;
  document.getElementById("statActive").textContent = activeBookings.size;
}

function renderSeatMap() {
  const container = document.getElementById("seatMap");
  container.innerHTML = "";

  for (let r = 0; r < numRows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    const rowSeats = cinemaGrid[rowLetter];

    const rowDiv = document.createElement("div");
    rowDiv.className = "seat-row";

    const labelDiv = document.createElement("div");
    labelDiv.className = "row-name";
    labelDiv.textContent = rowLetter;
    rowDiv.appendChild(labelDiv);

    const seatsDiv = document.createElement("div");
    seatsDiv.className = "seats-list";

    rowSeats.forEach((seatObj) => {
      const seatBox = document.createElement("div");
      const isBooked = seatObj.bookingId !== null;

      // Green if booked, grey if empty
      seatBox.className = `seat ${isBooked ? "booked" : "empty"}`;

      let seatText = `<span>${seatObj.seat}</span>`;
      if (isBooked) {
        seatText += `<span class="seat-bkg-tag">#${seatObj.bookingId}</span>`;
      }
      seatBox.innerHTML = seatText;
      seatsDiv.appendChild(seatBox);
    });

    rowDiv.appendChild(seatsDiv);
    container.appendChild(rowDiv);
  }
}

function renderBookingsTable() {
  const tbody = document.getElementById("bookingsTableBody");
  tbody.innerHTML = "";

  if (activeBookings.size === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #888;">No active bookings</td></tr>`;
    return;
  }

  activeBookings.forEach((b) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${b.id}</strong></td>
      <td><span class="badge-tag">${b.seats.join(" ")}</span></td>
      <td><button class="btn-small-cancel" onclick="onQuickCancel(${b.id})">Cancel</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAuditLog() {
  const logBox = document.getElementById("logContainer");
  logBox.innerHTML = "";

  if (auditLog.length === 0) {
    logBox.innerHTML = `<div style="padding: 10px; color: #888; font-size: 12px;">No actions recorded yet.</div>`;
    return;
  }

  auditLog.forEach((item) => {
    const row = document.createElement("div");
    row.className = `log-row ${item.success ? "success" : "error"}`;
    row.textContent = `[${item.action}] -> ${item.message}`;
    logBox.appendChild(row);
  });
}

function showStatusBanner(result) {
  const banner = document.getElementById("statusMessage");
  banner.textContent = result.message;
  banner.className = `message-banner ${result.success ? "success" : "error"}`;
}

function refreshUI() {
  updateStats();
  renderSeatMap();
  renderBookingsTable();
  renderAuditLog();
}

// User Actions
function onBookSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("seatCount");
  const result = bookSeats(input.value);

  showStatusBanner(result);
  auditLog.unshift({ action: `Book ${input.value}`, ...result });
  input.value = "";
  input.focus();
  refreshUI();
}

function onCancelSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("bookingId");
  const result = cancelBooking(input.value);

  showStatusBanner(result);
  auditLog.unshift({ action: `Cancel #${input.value}`, ...result });
  input.value = "";
  input.focus();
  refreshUI();
}

function onQuickCancel(id) {
  const result = cancelBooking(id);
  showStatusBanner(result);
  auditLog.unshift({ action: `Cancel #${id}`, ...result });
  refreshUI();
}

function onSetupSubmit(e) {
  e.preventDefault();
  const rows = document.getElementById("numRows").value;
  const seats = document.getElementById("seatsPerRow").value;
  initCinema(rows, seats);

  const res = { success: true, message: `Cinema initialized with ${rows} rows and ${seats} seats per row.` };
  showStatusBanner(res);
  refreshUI();
}

// Automated 7-Step Walkthrough from the Question Paper
async function runExamWalkthrough() {
  initCinema(3, 5);
  refreshUI();

  const testSteps = [
    { type: "book", val: 3 },
    { type: "book", val: 3 },
    { type: "book", val: 2 },
    { type: "book", val: 4 },
    { type: "book", val: 3 },
    { type: "cancel", val: 2 },
    { type: "book", val: 3 }
  ];

  for (const step of testSteps) {
    let res;
    if (step.type === "book") {
      res = bookSeats(step.val);
      auditLog.unshift({ action: `Book ${step.val}`, ...res });
    } else {
      res = cancelBooking(step.val);
      auditLog.unshift({ action: `Cancel #${step.val}`, ...res });
    }
    showStatusBanner(res);
    refreshUI();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// Window Initialization
document.addEventListener("DOMContentLoaded", () => {
  initCinema(3, 5);
  refreshUI();

  document.getElementById("setupForm").addEventListener("submit", onSetupSubmit);
  document.getElementById("bookForm").addEventListener("submit", onBookSubmit);
  document.getElementById("cancelForm").addEventListener("submit", onCancelSubmit);
  document.getElementById("btnRunTest").addEventListener("click", runExamWalkthrough);
  document.getElementById("btnReset").addEventListener("click", () => {
    initCinema(3, 5);
    const res = { success: true, message: "Cinema reset to 3 rows of 5 seats." };
    showStatusBanner(res);
    refreshUI();
  });
});
