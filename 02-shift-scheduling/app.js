/*
 * Employee Shift Scheduling System
 * Problem Statement 2 - Campus Hiring Hackathon
 * Author: Student Submission
 */

// Application State
let employees = [];
let shifts = [];
let assignments = [];
let actionLogs = [];

// Convert "HH:MM" 24-hr time to minutes from midnight
function timeToMinutes(tStr) {
  if (!tStr) return null;
  const parts = tStr.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

// LocalStorage helpers
function loadFromStorage() {
  try {
    const savedEmp = localStorage.getItem("sched_employees");
    const savedShifts = localStorage.getItem("sched_shifts");
    const savedAsg = localStorage.getItem("sched_assignments");

    if (savedEmp) employees = JSON.parse(savedEmp);
    if (savedShifts) shifts = JSON.parse(savedShifts);
    if (savedAsg) assignments = JSON.parse(savedAsg);
  } catch (e) {
    console.warn("Storage load error:", e);
  }
}

function saveToStorage() {
  try {
    localStorage.setItem("sched_employees", JSON.stringify(employees));
    localStorage.setItem("sched_shifts", JSON.stringify(shifts));
    localStorage.setItem("sched_assignments", JSON.stringify(assignments));
  } catch (e) {
    console.warn("Storage save error:", e);
  }
}

// --- 1. Employee Management ---
function addEmployee(id, name) {
  const cleanId = String(id || "").trim().toUpperCase();
  const cleanName = String(name || "").trim();

  if (!cleanId) return { success: false, message: "Employee ID is required." };
  if (!cleanName) return { success: false, message: "Employee Name is required." };

  const exists = employees.some((e) => e.id === cleanId);
  if (exists) {
    return { success: false, message: `Employee ID "${cleanId}" already exists.` };
  }

  const emp = { id: cleanId, name: cleanName };
  employees.push(emp);
  saveToStorage();
  return { success: true, message: `Added employee: ${cleanName} (${cleanId})` };
}

function deleteEmployee(empId) {
  employees = employees.filter((e) => e.id !== empId);
  assignments = assignments.filter((a) => a.empId !== empId);
  saveToStorage();
  return { success: true, message: `Employee ${empId} deleted.` };
}

// --- 2. Shift Management ---
function createShift(date, startTime, endTime, isOvernight) {
  if (!date) return { success: false, message: "Shift date is required." };
  if (!startTime || !endTime) return { success: false, message: "Start and end times are required." };

  const sMins = timeToMinutes(startTime);
  const eMins = timeToMinutes(endTime);

  // Business Rule: For same-day shifts, end time must be later than start time
  if (!isOvernight && eMins <= sMins) {
    return {
      success: false,
      message: "For a same-day shift, the End Time must be later than the Start Time."
    };
  }

  const shiftId = `SH-${Date.now().toString().slice(-4)}`;
  const shift = {
    id: shiftId,
    date,
    startTime,
    endTime,
    isOvernight: !!isOvernight
  };

  shifts.push(shift);
  saveToStorage();
  return {
    success: true,
    message: `Created shift ${shiftId}: ${date} [${startTime} - ${endTime}]`
  };
}

function deleteShift(shiftId) {
  shifts = shifts.filter((s) => s.id !== shiftId);
  assignments = assignments.filter((a) => a.shiftId !== shiftId);
  saveToStorage();
  return { success: true, message: `Shift ${shiftId} deleted.` };
}

// --- 3. Shift Conflict Detection Logic ---
/**
 * Calculates start and end timestamps in milliseconds.
 * Accurately models overnight shifts crossing midnight into next day.
 */
function getShiftEpochRange(shift) {
  const startMs = new Date(`${shift.date}T${shift.startTime}:00`).getTime();
  let endMs;

  if (shift.isOvernight) {
    const nextDay = new Date(shift.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDate = nextDay.toISOString().split("T")[0];
    endMs = new Date(`${nextDate}T${shift.endTime}:00`).getTime();
  } else {
    endMs = new Date(`${shift.date}T${shift.endTime}:00`).getTime();
  }

  return { startMs, endMs };
}

/**
 * Core Overlap Condition:
 * Two shifts overlap IF AND ONLY IF:
 * (startA < endB) && (endA > startB)
 * 
 * Crucial Note:
 * If Shift A is 9:00 to 13:00 and Shift B is 13:00 to 16:00:
 * endA === startB (13:00 === 13:00).
 * Thus, (endA > startB) is FALSE.
 * Therefore, they touch at 13:00 but DO NOT OVERLAP (Allowed!).
 */
function checkShiftOverlap(empId, targetShift) {
  // Find all shifts already assigned to this employee
  const assignedShiftIds = assignments
    .filter((a) => a.empId === empId)
    .map((a) => a.shiftId);

  const targetRange = getShiftEpochRange(targetShift);

  for (const sId of assignedShiftIds) {
    const existing = shifts.find((s) => s.id === sId);
    if (!existing) continue;

    // Already on this exact shift?
    if (existing.id === targetShift.id) {
      return { conflict: true, reason: "Already assigned to this shift", shift: existing };
    }

    const existingRange = getShiftEpochRange(existing);

    // Overlap test
    const hasOverlap = targetRange.startMs < existingRange.endMs && targetRange.endMs > existingRange.startMs;
    if (hasOverlap) {
      return { conflict: true, reason: "Timing overlap", shift: existing };
    }
  }

  return { conflict: false };
}

function assignEmployee(empId, shiftId) {
  const emp = employees.find((e) => e.id === empId);
  const shift = shifts.find((s) => s.id === shiftId);

  if (!emp) return { success: false, message: "Please select an employee." };
  if (!shift) return { success: false, message: "Please select a shift." };

  // Run overlap check
  const check = checkShiftOverlap(empId, shift);
  if (check.conflict) {
    const conf = check.shift;
    return {
      success: false,
      message: `SCHEDULING CONFLICT: ${emp.name} is already assigned to Shift [${conf.id}] on ${conf.date} (${conf.startTime}-${conf.endTime}), which overlaps with ${shift.date} (${shift.startTime}-${shift.endTime}).`
    };
  }

  // Record assignment
  assignments.push({
    id: `ASG-${Date.now().toString().slice(-4)}`,
    empId,
    shiftId
  });

  saveToStorage();
  return {
    success: true,
    message: `Assigned ${emp.name} (${emp.id}) to Shift ${shift.date} [${shift.startTime} - ${shift.endTime}].`
  };
}

function unassignEmployee(empId, shiftId) {
  assignments = assignments.filter((a) => !(a.empId === empId && a.shiftId === shiftId));
  saveToStorage();
  return { success: true, message: `Removed employee ${empId} from shift ${shiftId}.` };
}

// --- DOM Rendering ---
function renderUI() {
  renderSelectOptions();
  renderShiftsTable();
  renderEmployeesTable();
  renderLogs();

  document.getElementById("statShiftsCount").textContent = shifts.length;
  document.getElementById("statAssignCount").textContent = assignments.length;
}

function renderSelectOptions() {
  const empSelect = document.getElementById("selectEmp");
  const shiftSelect = document.getElementById("selectShift");

  const prevEmp = empSelect.value;
  const prevShift = shiftSelect.value;

  empSelect.innerHTML = `<option value="">-- Choose Employee --</option>`;
  employees.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e.id;
    opt.textContent = `${e.name} (${e.id})`;
    empSelect.appendChild(opt);
  });
  empSelect.value = prevEmp || "";

  shiftSelect.innerHTML = `<option value="">-- Choose Shift --</option>`;
  shifts.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.date} [${s.startTime} - ${s.endTime}] ${s.isOvernight ? "(Overnight)" : ""}`;
    shiftSelect.appendChild(opt);
  });
  shiftSelect.value = prevShift || "";
}

function renderShiftsTable() {
  const tbody = document.getElementById("shiftsTableBody");
  const filterDate = document.getElementById("filterDate").value;
  tbody.innerHTML = "";

  let list = shifts;
  if (filterDate) {
    list = shifts.filter((s) => s.date === filterDate);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888;">No shifts found.</td></tr>`;
    return;
  }

  list.forEach((s) => {
    const assignedIds = assignments.filter((a) => a.shiftId === s.id).map((a) => a.empId);
    const assignedEmps = employees.filter((e) => assignedIds.includes(e.id));

    let assignedHtml = "";
    if (assignedEmps.length === 0) {
      assignedHtml = `<span style="color: #999; font-style: italic; font-size: 11px;">None assigned</span>`;
    } else {
      assignedHtml = assignedEmps.map((e) => `
        <span class="employee-tag">
          ${e.name} (${e.id})
          <button class="remove-tag-btn" onclick="onRemoveAssignment('${e.id}', '${s.id}')">&times;</button>
        </span>
      `).join("");
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${s.id}</strong></td>
      <td>${s.date}</td>
      <td><code>${s.startTime} - ${s.endTime}</code></td>
      <td><span class="badge ${s.isOvernight ? "badge-overnight" : "badge-day"}">${s.isOvernight ? "Overnight 🌙" : "Day"}</span></td>
      <td>${assignedHtml}</td>
      <td><button class="btn-table-delete" onclick="onDeleteShift('${s.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderEmployeesTable() {
  const tbody = document.getElementById("employeesTableBody");
  tbody.innerHTML = "";

  if (employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">No employees added yet.</td></tr>`;
    return;
  }

  employees.forEach((e) => {
    const count = assignments.filter((a) => a.empId === e.id).length;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${e.id}</strong></td>
      <td>${e.name}</td>
      <td><strong>${count}</strong> shift(s)</td>
      <td><button class="btn-table-delete" onclick="onDeleteEmployee('${e.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderLogs() {
  const box = document.getElementById("logBox");
  box.innerHTML = "";

  if (actionLogs.length === 0) {
    box.innerHTML = `<div style="padding: 10px; color: #888;">No activity logged.</div>`;
    return;
  }

  actionLogs.forEach((l) => {
    const div = document.createElement("div");
    div.className = `log-entry ${l.success ? "success" : "conflict"}`;
    div.textContent = `[${l.time}] ${l.message}`;
    box.appendChild(div);
  });
}

function showBanner(res) {
  const alertEl = document.getElementById("statusAlert");
  alertEl.textContent = res.message;
  alertEl.className = `alert-box ${res.success ? "success" : "error"}`;

  const timeStr = new Date().toLocaleTimeString();
  actionLogs.unshift({ time: timeStr, ...res });
}

// User Action Handlers
function onRemoveAssignment(empId, shiftId) {
  const res = unassignEmployee(empId, shiftId);
  showBanner(res);
  renderUI();
}

function onDeleteShift(shiftId) {
  if (confirm(`Delete Shift ${shiftId}?`)) {
    const res = deleteShift(shiftId);
    showBanner(res);
    renderUI();
  }
}

function onDeleteEmployee(empId) {
  if (confirm(`Delete Employee ${empId}?`)) {
    const res = deleteEmployee(empId);
    showBanner(res);
    renderUI();
  }
}

// Exam Benchmark Test Runner (Exact Question Paper Scenario)
function runExamBenchmark() {
  employees = [];
  shifts = [];
  assignments = [];
  actionLogs = [];

  const testDate = "2026-11-01";

  // 1. Add Employee Sneha
  addEmployee("EMP01", "Sneha Mandlik");

  // 2. Create the 3 benchmark shifts
  createShift(testDate, "09:00", "13:00", false);
  createShift(testDate, "13:00", "16:00", false);
  createShift(testDate, "12:00", "15:00", false);

  const [s1, s2, s3] = shifts;

  // 3. Assign Shift 1 (09:00 - 13:00) -> Allowed
  const r1 = assignEmployee("EMP01", s1.id);
  showBanner(r1);

  // 4. Assign Shift 2 (13:00 - 16:00) -> Touching boundary -> Allowed!
  const r2 = assignEmployee("EMP01", s2.id);
  showBanner(r2);

  // 5. Assign Shift 3 (12:00 - 15:00) -> Overlaps with Shift 1 -> Must fail with conflict alert!
  const r3 = assignEmployee("EMP01", s3.id);
  showBanner(r3);

  renderUI();
}

document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();

  // If empty on first load, seed with demo employee
  if (employees.length === 0) {
    addEmployee("EMP101", "Sneha Mandlik");
    addEmployee("EMP102", "Rahul Sharma");
  }

  renderUI();

  // Form Submissions
  document.getElementById("empForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("empId").value;
    const name = document.getElementById("empName").value;
    const res = addEmployee(id, name);
    showBanner(res);
    if (res.success) {
      document.getElementById("empId").value = "";
      document.getElementById("empName").value = "";
    }
    renderUI();
  });

  document.getElementById("shiftForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = document.getElementById("shiftDate").value;
    const s = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;
    const ov = document.getElementById("isOvernight").checked;

    const res = createShift(d, s, end, ov);
    showBanner(res);
    if (res.success) {
      document.getElementById("isOvernight").checked = false;
    }
    renderUI();
  });

  document.getElementById("assignForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const empId = document.getElementById("selectEmp").value;
    const shiftId = document.getElementById("selectShift").value;

    const res = assignEmployee(empId, shiftId);
    showBanner(res);
    renderUI();
  });

  document.getElementById("filterDate").addEventListener("change", renderShiftsTable);
  document.getElementById("btnClearFilter").addEventListener("click", () => {
    document.getElementById("filterDate").value = "";
    renderShiftsTable();
  });

  document.getElementById("btnRunExam").addEventListener("click", runExamBenchmark);

  document.getElementById("btnResetAll").addEventListener("click", () => {
    if (confirm("Reset all shift and employee data?")) {
      employees = [];
      shifts = [];
      assignments = [];
      actionLogs = [];
      saveToStorage();
      const res = { success: true, message: "All data cleared." };
      showBanner(res);
      renderUI();
    }
  });

  // Set default date to today
  document.getElementById("shiftDate").value = new Date().toISOString().split("T")[0];
});
