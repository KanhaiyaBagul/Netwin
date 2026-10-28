/*
 * Queue Management System
 * Assignment Type 7
 */

let tokenSequence = 100;
let queue = [
  { id: "REG-101", name: "Sarah Connor", priority: "Regular", time: "10:15 AM" },
  { id: "VIP-102", name: "Bruce Wayne", priority: "VIP", time: "10:18 AM" }
];

let counter1 = null;
let counter2 = null;

function generateToken(name, priority) {
  const cleanName = String(name || "").trim();
  if (!cleanName) return { success: false, message: "Please enter customer name." };

  tokenSequence++;
  const prefix = priority === "VIP" ? "VIP" : "REG";
  const tokenId = `${prefix}-${tokenSequence}`;

  const token = {
    id: tokenId,
    name: cleanName,
    priority: priority || "Regular",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };

  queue.push(token);
  return { success: true, message: `Issued Token [${tokenId}] for ${cleanName} (${priority}).` };
}

function serveNextCustomer(counterNum) {
  if (queue.length === 0) {
    return { success: false, message: "Queue is empty. No customers waiting." };
  }

  // Priority algorithm: VIP customers are served first, in FIFO order among VIPs
  let index = queue.findIndex((t) => t.priority === "VIP");
  if (index === -1) {
    index = 0; // Serve oldest regular customer
  }

  const served = queue.splice(index, 1)[0];

  if (counterNum === 1) counter1 = served;
  else counter2 = served;

  return { success: true, message: `Counter ${counterNum} now serving [${served.id}] ${served.name}.` };
}

function renderUI() {
  // Update Counters
  const c1Token = document.getElementById("counter1Token");
  const c1Status = document.getElementById("counter1Status");
  const c2Token = document.getElementById("counter2Token");
  const c2Status = document.getElementById("counter2Status");

  c1Token.textContent = counter1 ? counter1.id : "--";
  c1Status.textContent = counter1 ? `${counter1.name} (${counter1.priority})` : "Available";

  c2Token.textContent = counter2 ? counter2.id : "--";
  c2Status.textContent = counter2 ? `${counter2.name} (${counter2.priority})` : "Available";

  // Update Queue Table
  document.getElementById("waitingCount").textContent = queue.length;
  const tbody = document.getElementById("queueBody");
  tbody.innerHTML = "";

  if (queue.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">No customers in queue.</td></tr>`;
    return;
  }

  queue.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${t.id}</strong></td>
      <td>${t.name}</td>
      <td><span class="${t.priority === "VIP" ? "badge-vip" : "badge-reg"}">${t.priority}</span></td>
      <td>${t.time}</td>
    `;
    tbody.appendChild(tr);
  });
}

function showBanner(res) {
  const b = document.getElementById("alertBanner");
  b.textContent = res.message;
  b.className = `alert-banner ${res.success ? "success" : "error"}`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderUI();

  document.getElementById("tokenForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("custName").value;
    const priority = document.getElementById("priority").value;

    const res = generateToken(name, priority);
    showBanner(res);
    if (res.success) {
      document.getElementById("custName").value = "";
    }
    renderUI();
  });

  document.getElementById("btnServe1").addEventListener("click", () => {
    const res = serveNextCustomer(1);
    showBanner(res);
    renderUI();
  });

  document.getElementById("btnServe2").addEventListener("click", () => {
    const res = serveNextCustomer(2);
    showBanner(res);
    renderUI();
  });
});
