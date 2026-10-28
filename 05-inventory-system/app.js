/*
 * Inventory Stock Management System
 * Assignment Type 5
 */

let products = [
  { sku: "SKU-101", name: "Mechanical Keyboard", stock: 8, threshold: 3 },
  { sku: "SKU-102", name: "Optical Gaming Mouse", stock: 2, threshold: 5 },
  { sku: "SKU-103", name: "USB-C Fast Cable", stock: 0, threshold: 4 }
];

let transactionLogs = [];

function addProduct(sku, name, stock, threshold) {
  const cleanSku = String(sku || "").trim().toUpperCase();
  const cleanName = String(name || "").trim();
  const numStock = parseInt(stock, 10);
  const numThreshold = parseInt(threshold, 10);

  if (!cleanSku || !cleanName) return { success: false, message: "SKU and Name are required." };
  if (isNaN(numStock) || numStock < 0) return { success: false, message: "Stock must be 0 or positive." };

  const exists = products.some((p) => p.sku === cleanSku);
  if (exists) return { success: false, message: `SKU "${cleanSku}" already exists.` };

  products.push({
    sku: cleanSku,
    name: cleanName,
    stock: numStock,
    threshold: isNaN(numThreshold) ? 5 : numThreshold
  });

  return { success: true, message: `Added product [${cleanSku}] ${cleanName}.` };
}

function sellProduct(sku, qtyInput) {
  const qty = parseInt(qtyInput, 10);
  if (isNaN(qty) || qty <= 0) return { success: false, message: "Quantity must be a positive number." };

  const item = products.find((p) => p.sku === sku);
  if (!item) return { success: false, message: "Product not found." };

  // Core Rule: Prevent negative stock
  if (item.stock < qty) {
    return {
      success: false,
      message: `INSUFFICIENT STOCK: Cannot sell ${qty} units. Only ${item.stock} left for "${item.name}".`
    };
  }

  item.stock -= qty;
  let note = "";
  if (item.stock === 0) note = " (OUT OF STOCK)";
  else if (item.stock <= item.threshold) note = " (LOW STOCK WARNING)";

  return {
    success: true,
    message: `Sold ${qty} unit(s) of "${item.name}". Remaining: ${item.stock}${note}`
  };
}

function restockProduct(sku, qtyInput) {
  const qty = parseInt(qtyInput, 10);
  if (isNaN(qty) || qty <= 0) return { success: false, message: "Restock quantity must be positive." };

  const item = products.find((p) => p.sku === sku);
  if (!item) return { success: false, message: "Product not found." };

  item.stock += qty;
  return {
    success: true,
    message: `Restocked ${qty} units for "${item.name}". Total stock: ${item.stock}.`
  };
}

function renderUI() {
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const lowCount = products.filter((p) => p.stock <= p.threshold).length;

  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("statUnits").textContent = totalUnits;
  document.getElementById("statAlerts").textContent = lowCount;

  // Dropdowns
  const sellSelect = document.getElementById("sellSelect");
  const restockSelect = document.getElementById("restockSelect");
  sellSelect.innerHTML = `<option value="">-- Choose Product --</option>`;
  restockSelect.innerHTML = `<option value="">-- Choose Product --</option>`;

  products.forEach((p) => {
    const opt1 = document.createElement("option");
    opt1.value = p.sku;
    opt1.textContent = `${p.name} (${p.stock} in stock)`;
    sellSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = p.sku;
    opt2.textContent = `${p.name} (${p.stock} in stock)`;
    restockSelect.appendChild(opt2);
  });

  // Table
  const tbody = document.getElementById("inventoryBody");
  tbody.innerHTML = "";

  products.forEach((p) => {
    let badgeClass = "badge-ok";
    let badgeText = "Normal";

    if (p.stock === 0) {
      badgeClass = "badge-out";
      badgeText = "Out of Stock";
    } else if (p.stock <= p.threshold) {
      badgeClass = "badge-low";
      badgeText = "Low Stock";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${p.sku}</code></td>
      <td><strong>${p.name}</strong></td>
      <td><strong>${p.stock}</strong></td>
      <td>${p.threshold}</td>
      <td><span class="badge ${badgeClass}">${badgeText}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Logs
  const logBox = document.getElementById("logBox");
  logBox.innerHTML = "";
  if (transactionLogs.length === 0) {
    logBox.innerHTML = `<div style="padding: 10px; color: #888;">No transactions recorded.</div>`;
  } else {
    transactionLogs.forEach((l) => {
      const d = document.createElement("div");
      d.className = `log-item ${l.success ? "success" : "error"}`;
      d.textContent = `[${l.time}] ${l.message}`;
      logBox.appendChild(d);
    });
  }
}

function showBanner(res) {
  const b = document.getElementById("alertBanner");
  b.textContent = res.message;
  b.className = `alert-banner ${res.success ? "success" : "error"}`;
  transactionLogs.unshift({ time: new Date().toLocaleTimeString(), ...res });
}

document.addEventListener("DOMContentLoaded", () => {
  renderUI();

  document.getElementById("addForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const sku = document.getElementById("sku").value;
    const name = document.getElementById("name").value;
    const stock = document.getElementById("stock").value;
    const thresh = document.getElementById("threshold").value;

    const res = addProduct(sku, name, stock, thresh);
    showBanner(res);
    if (res.success) {
      document.getElementById("sku").value = "";
      document.getElementById("name").value = "";
      document.getElementById("stock").value = "10";
    }
    renderUI();
  });

  document.getElementById("sellForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const sku = document.getElementById("sellSelect").value;
    const qty = document.getElementById("sellQty").value;

    const res = sellProduct(sku, qty);
    showBanner(res);
    if (res.success) {
      document.getElementById("sellQty").value = "";
    }
    renderUI();
  });

  document.getElementById("restockForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const sku = document.getElementById("restockSelect").value;
    const qty = document.getElementById("restockQty").value;

    const res = restockProduct(sku, qty);
    showBanner(res);
    if (res.success) {
      document.getElementById("restockQty").value = "";
    }
    renderUI();
  });
});
