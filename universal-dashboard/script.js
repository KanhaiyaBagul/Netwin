/*
 * Simple Management System
 * Universal Starter Script
 */

// Initial Data
let records = [
  { id: "101", name: "Project Report Submission", category: "General", value: 1, status: "Active" },
  { id: "102", name: "System Database Backup", category: "Priority", value: 2, status: "Pending" },
  { id: "103", name: "Network Router Update", category: "Emergency", value: 1, status: "Completed" }
];

// Load saved data if present
function loadData() {
  const saved = localStorage.getItem("my_management_data");
  if (saved) {
    try {
      records = JSON.parse(saved);
    } catch (e) {
      console.log("Error loading storage");
    }
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem("my_management_data", JSON.stringify(records));
}

// Show alert message banner
function showMessage(text, isError = false) {
  const msgBox = document.getElementById("statusMsg");
  msgBox.textContent = text;
  msgBox.className = "msg-box " + (isError ? "error" : "success");

  // Auto hide after 4 seconds
  setTimeout(() => {
    msgBox.className = "msg-box";
  }, 4000);
}

// Render data table and counts
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const search = document.getElementById("searchBox").value.trim().toLowerCase();
  const filter = document.getElementById("filterDropdown").value;

  tbody.innerHTML = "";

  // Filter records
  const filtered = records.filter((item) => {
    const matchSearch =
      !search ||
      item.id.toLowerCase().includes(search) ||
      item.name.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search);

    const matchFilter = filter === "ALL" || item.status === filter;

    return matchSearch && matchFilter;
  });

  // Update total count label
  document.getElementById("totalCountText").textContent = `Showing: ${filtered.length} of ${records.length}`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888;">No records found.</td></tr>`;
    return;
  }

  filtered.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.id}</strong></td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.value}</td>
      <td><span class="badge-status ${item.status}">${item.status}</span></td>
      <td>
        <button class="btn-action" onclick="toggleStatus('${item.id}')">Change Status</button>
        <button class="btn-action btn-delete" onclick="deleteRecord('${item.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Add new record
function handleAddRecord(e) {
  e.preventDefault();

  const id = document.getElementById("recordId").value.trim();
  const name = document.getElementById("recordName").value.trim();
  const category = document.getElementById("recordCategory").value;
  const value = parseInt(document.getElementById("recordValue").value, 10);
  const status = document.getElementById("recordStatus").value;

  // Validation Check 1: Empty inputs
  if (!id || !name) {
    showMessage("Please fill in both ID and Name.", true);
    return;
  }

  // Validation Check 2: Value must be positive
  if (isNaN(value) || value <= 0) {
    showMessage("Value must be a positive number.", true);
    return;
  }

  // Validation Check 3: Check duplicate ID
  const duplicate = records.some((r) => r.id.toLowerCase() === id.toLowerCase());
  if (duplicate) {
    showMessage(`Record ID "${id}" already exists. Use a unique ID.`, true);
    return;
  }

  // Add record to array
  const newRecord = { id, name, category, value, status };
  records.push(newRecord);
  saveData();

  showMessage(`Record "${name}" (ID: ${id}) added successfully!`, false);

  // Clear inputs
  document.getElementById("recordId").value = "";
  document.getElementById("recordName").value = "";
  document.getElementById("recordValue").value = "1";
  document.getElementById("recordId").focus();

  renderTable();
}

// Toggle record status: Pending -> Active -> Completed -> Pending
function toggleStatus(id) {
  const item = records.find((r) => r.id === id);
  if (!item) return;

  if (item.status === "Pending") item.status = "Active";
  else if (item.status === "Active") item.status = "Completed";
  else item.status = "Pending";

  saveData();
  showMessage(`Status for ID ${id} changed to ${item.status}.`, false);
  renderTable();
}

// Delete record
function deleteRecord(id) {
  if (confirm(`Are you sure you want to delete record ${id}?`)) {
    records = records.filter((r) => r.id !== id);
    saveData();
    showMessage(`Record ${id} deleted.`, false);
    renderTable();
  }
}

// Setup Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  renderTable();

  // Form submit
  document.getElementById("mainForm").addEventListener("submit", handleAddRecord);

  // Clear button
  document.getElementById("btnResetAll").addEventListener("click", () => {
    document.getElementById("mainForm").reset();
  });

  // Search & filter
  document.getElementById("searchBox").addEventListener("input", renderTable);
  document.getElementById("filterDropdown").addEventListener("change", renderTable);
});
