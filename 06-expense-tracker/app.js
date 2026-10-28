/*
 * Expense Tracker & Filter
 * Assignment Type 6
 */

const MONTHLY_BUDGET = 1500;

let expenses = [
  { id: "EXP-1", title: "Domain & Hosting", amount: 120.0, category: "Software", date: "2026-10-25" },
  { id: "EXP-2", title: "Team Lunch", amount: 85.5, category: "Food & Dining", date: "2026-10-26" },
  { id: "EXP-3", title: "Metro Rail Pass", amount: 45.0, category: "Travel", date: "2026-10-27" }
];

function addExpense(title, amount, category, date) {
  const cleanTitle = String(title || "").trim();
  const numAmount = parseFloat(amount);

  if (!cleanTitle) return { success: false, message: "Please provide a title." };
  if (isNaN(numAmount) || numAmount <= 0) return { success: false, message: "Amount must be a positive number." };
  if (!category) return { success: false, message: "Please select category." };
  if (!date) return { success: false, message: "Please select date." };

  const newExp = {
    id: `EXP-${Date.now().toString().slice(-4)}`,
    title: cleanTitle,
    amount: numAmount,
    category,
    date
  };

  expenses.unshift(newExp);

  const total = expenses.reduce((acc, e) => acc + e.amount, 0);
  let warning = "";
  if (total > MONTHLY_BUDGET) {
    warning = ` (ALERT: Monthly budget of $${MONTHLY_BUDGET} exceeded!)`;
  }

  return { success: true, message: `Recorded $${numAmount.toFixed(2)} for ${cleanTitle}.${warning}` };
}

function deleteExpense(id) {
  expenses = expenses.filter((e) => e.id !== id);
  return { success: true, message: "Expense deleted." };
}

function renderUI() {
  const catFilter = document.getElementById("filterCat").value;
  const dateFilter = document.getElementById("filterDate").value;

  const filtered = expenses.filter((e) => {
    const matchCat = !catFilter || e.category === catFilter;
    const matchDate = !dateFilter || e.date === dateFilter;
    return matchCat && matchDate;
  });

  const totalSpent = filtered.reduce((acc, e) => acc + e.amount, 0);

  document.getElementById("statSpent").textContent = `$${totalSpent.toFixed(2)}`;
  document.getElementById("statCount").textContent = filtered.length;

  // Breakdown
  const breakdown = {};
  filtered.forEach((e) => {
    breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
  });

  const breakdownBox = document.getElementById("breakdownContainer");
  const cats = Object.keys(breakdown);
  if (cats.length === 0) {
    breakdownBox.innerHTML = `<span style="color: #888;">No expenses.</span>`;
  } else {
    breakdownBox.innerHTML = cats
      .map(
        (c) => `
        <div style="display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px solid #edf2f7;">
          <span>${c}</span>
          <strong>$${breakdown[c].toFixed(2)}</strong>
        </div>
      `
      )
      .join("");
  }

  // Table
  const tbody = document.getElementById("expenseBody");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">No transactions found.</td></tr>`;
    return;
  }

  filtered.forEach((e) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.date}</td>
      <td><strong>${e.title}</strong></td>
      <td><span class="category-tag">${e.category}</span></td>
      <td><strong>$${e.amount.toFixed(2)}</strong></td>
      <td><button class="btn-del" onclick="onDelete('${e.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function showBanner(res) {
  const b = document.getElementById("alertBox");
  b.textContent = res.message;
  b.className = `alert-box ${res.success ? "success" : "error"}`;
}

function onDelete(id) {
  const res = deleteExpense(id);
  showBanner(res);
  renderUI();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
  renderUI();

  document.getElementById("expForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const amount = document.getElementById("amount").value;
    const cat = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    const res = addExpense(title, amount, cat, date);
    showBanner(res);
    if (res.success) {
      document.getElementById("title").value = "";
      document.getElementById("amount").value = "";
    }
    renderUI();
  });

  document.getElementById("filterCat").addEventListener("change", renderUI);
  document.getElementById("filterDate").addEventListener("change", renderUI);
  document.getElementById("btnResetFilter").addEventListener("click", () => {
    document.getElementById("filterCat").value = "";
    document.getElementById("filterDate").value = "";
    renderUI();
  });
});
