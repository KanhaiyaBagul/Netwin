/*
 * Smart Parking Management System
 * Assignment Type 3 - Campus Hiring Assessment
 */

const TOTAL_SLOTS = 10;
const RATES = { Bike: 10, Car: 20, Truck: 40 };

let slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
  id: i + 1,
  code: `P-${String(i + 1).padStart(2, "0")}`,
  isOccupied: false,
  vehicle: null
}));

let totalRevenue = 0;
let parkingLogs = [];

function parseTimeToMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function parkVehicle(plate, type, entryTime) {
  const cleanPlate = String(plate || "").trim().toUpperCase();
  if (!cleanPlate) return { success: false, message: "Please enter license plate." };
  if (!entryTime) return { success: false, message: "Please enter entry time." };

  // Check if plate already active
  const alreadyParked = slots.some((s) => s.isOccupied && s.vehicle.plate === cleanPlate);
  if (alreadyParked) {
    return { success: false, message: `Vehicle ${cleanPlate} is already parked in the lot!` };
  }

  // Allocate first free slot (nearest to entrance)
  const freeSlot = slots.find((s) => !s.isOccupied);
  if (!freeSlot) {
    return { success: false, message: "PARKING FULL: No empty slots available!" };
  }

  freeSlot.isOccupied = true;
  freeSlot.vehicle = {
    plate: cleanPlate,
    type,
    entryTime,
    rate: RATES[type] || 20
  };

  return {
    success: true,
    message: `Allocated Slot ${freeSlot.code} to ${cleanPlate} (${type}).`
  };
}

function processExit(slotCode, exitTime) {
  const slot = slots.find((s) => s.code === slotCode);
  if (!slot || !slot.isOccupied) {
    return { success: false, message: "Please select an occupied slot." };
  }

  const { plate, type, entryTime, rate } = slot.vehicle;
  const inMins = parseTimeToMins(entryTime);
  const outMins = parseTimeToMins(exitTime);

  let durationMins = outMins - inMins;
  if (durationMins < 0) durationMins += 24 * 60; // Next-day exit

  if (durationMins <= 0) {
    return { success: false, message: "Exit time must be later than entry time." };
  }

  // Minimum 1 hour billing
  const billableHours = Math.max(1, Math.ceil(durationMins / 60));
  const fee = billableHours * rate;

  totalRevenue += fee;
  slot.isOccupied = false;
  slot.vehicle = null;

  return {
    success: true,
    message: `EXIT: [${plate}] freed from ${slotCode}. Duration: ${billableHours}h. Total Fee: $${fee.toFixed(2)}.`
  };
}

function renderUI() {
  const freeCount = slots.filter((s) => !s.isOccupied).length;
  const parkedCount = slots.length - freeCount;

  document.getElementById("statFree").textContent = freeCount;
  document.getElementById("statParked").textContent = parkedCount;
  document.getElementById("statRevenue").textContent = `$${totalRevenue.toFixed(2)}`;

  // Render Grid
  const grid = document.getElementById("slotsGrid");
  grid.innerHTML = "";
  slots.forEach((s) => {
    const box = document.createElement("div");
    box.className = `slot-box ${s.isOccupied ? "occupied" : "free"}`;
    box.innerHTML = `
      <div class="slot-code">${s.code}</div>
      <div class="slot-plate">${s.isOccupied ? s.vehicle.plate : "AVAILABLE"}</div>
      <div style="font-size: 11px;">${s.isOccupied ? `${s.vehicle.type} (${s.vehicle.entryTime})` : "Ready"}</div>
    `;
    grid.appendChild(box);
  });

  // Render Table & Select
  const tbody = document.getElementById("parkedBody");
  const exitSelect = document.getElementById("exitSelect");
  tbody.innerHTML = "";
  exitSelect.innerHTML = `<option value="">-- Select Parked Slot --</option>`;

  const active = slots.filter((s) => s.isOccupied);
  if (active.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">No vehicles parked.</td></tr>`;
  } else {
    active.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${s.code}</strong></td>
        <td><code>${s.vehicle.plate}</code></td>
        <td>${s.vehicle.type}</td>
        <td>${s.vehicle.entryTime}</td>
      `;
      tbody.appendChild(tr);

      const opt = document.createElement("option");
      opt.value = s.code;
      opt.textContent = `${s.code} - ${s.vehicle.plate} (${s.vehicle.type})`;
      exitSelect.appendChild(opt);
    });
  }

  // Render Logs
  const logBox = document.getElementById("logBox");
  logBox.innerHTML = "";
  if (parkingLogs.length === 0) {
    logBox.innerHTML = `<div style="padding: 10px; color: #888;">No activity yet.</div>`;
  } else {
    parkingLogs.forEach((l) => {
      const d = document.createElement("div");
      d.className = `log-item ${l.success ? "success" : "error"}`;
      d.textContent = `[${l.time}] ${l.message}`;
      logBox.appendChild(d);
    });
  }
}

function showBanner(res) {
  const banner = document.getElementById("alertBanner");
  banner.textContent = res.message;
  banner.className = `alert-banner ${res.success ? "success" : "error"}`;
  parkingLogs.unshift({ time: new Date().toLocaleTimeString(), ...res });
}

document.addEventListener("DOMContentLoaded", () => {
  // Set default entry time to current time
  const now = new Date();
  document.getElementById("timeInput").value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  renderUI();

  document.getElementById("parkForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const plate = document.getElementById("plateInput").value;
    const type = document.getElementById("typeInput").value;
    const time = document.getElementById("timeInput").value;

    const res = parkVehicle(plate, type, time);
    showBanner(res);
    if (res.success) {
      document.getElementById("plateInput").value = "";
    }
    renderUI();
  });

  document.getElementById("exitForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const code = document.getElementById("exitSelect").value;
    const time = document.getElementById("exitTimeInput").value;

    const res = processExit(code, time);
    showBanner(res);
    renderUI();
  });
});
