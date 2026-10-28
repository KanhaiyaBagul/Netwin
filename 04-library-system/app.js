/*
 * Library Issue & Return System
 * Assignment Type 4
 */

let catalog = [
  { isbn: "978-0132350884", title: "Clean Code", totalCopies: 3, availableCopies: 3 },
  { isbn: "978-0201633610", title: "Design Patterns", totalCopies: 2, availableCopies: 2 },
  { isbn: "978-0134685991", title: "Effective Java", totalCopies: 1, availableCopies: 1 }
];

let loans = [];
let logs = [];

function addBook(isbn, title, copies) {
  const cleanIsbn = String(isbn || "").trim();
  const cleanTitle = String(title || "").trim();
  const numCopies = parseInt(copies, 10);

  if (!cleanIsbn || !cleanTitle) return { success: false, message: "ISBN and Title are required." };
  if (isNaN(numCopies) || numCopies <= 0) return { success: false, message: "Copies must be a positive integer." };

  const existing = catalog.find((b) => b.isbn === cleanIsbn);
  if (existing) {
    return { success: false, message: `Book with ISBN "${cleanIsbn}" already exists.` };
  }

  catalog.push({
    isbn: cleanIsbn,
    title: cleanTitle,
    totalCopies: numCopies,
    availableCopies: numCopies
  });

  return { success: true, message: `Added "${cleanTitle}" (${numCopies} copies) to library.` };
}

function issueBook(member, isbn) {
  const cleanMember = String(member || "").trim();
  if (!cleanMember) return { success: false, message: "Member name is required." };

  const book = catalog.find((b) => b.isbn === isbn);
  if (!book) return { success: false, message: "Book not found." };

  // Availability check
  if (book.availableCopies <= 0) {
    return { success: false, message: `UNAVAILABLE: All copies of "${book.title}" are currently checked out!` };
  }

  // Prevent duplicate loan of same book by same member
  const alreadyHas = loans.some((l) => l.member.toLowerCase() === cleanMember.toLowerCase() && l.isbn === isbn);
  if (alreadyHas) {
    return { success: false, message: `${cleanMember} already has an active copy of this book!` };
  }

  book.availableCopies--;
  const loanId = `LN-${Date.now().toString().slice(-4)}`;
  loans.push({
    id: loanId,
    isbn: book.isbn,
    title: book.title,
    member: cleanMember,
    date: new Date().toLocaleDateString()
  });

  return { success: true, message: `ISSUED: "${book.title}" to ${cleanMember}.` };
}

function returnBook(loanId) {
  const index = loans.findIndex((l) => l.id === loanId);
  if (index === -1) return { success: false, message: "Loan record not found." };

  const loan = loans[index];
  const book = catalog.find((b) => b.isbn === loan.isbn);
  if (book) {
    book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
  }

  loans.splice(index, 1);
  return { success: true, message: `RETURNED: "${loan.title}" from ${loan.member}. Restocked.` };
}

function renderUI() {
  const totalAvailable = catalog.reduce((acc, b) => acc + b.availableCopies, 0);

  document.getElementById("statTitles").textContent = catalog.length;
  document.getElementById("statAvailable").textContent = totalAvailable;
  document.getElementById("statIssued").textContent = loans.length;

  // Catalog Table & Issue Select
  const tbody = document.getElementById("catalogBody");
  const bookSelect = document.getElementById("bookSelect");
  tbody.innerHTML = "";
  bookSelect.innerHTML = `<option value="">-- Choose Book --</option>`;

  catalog.forEach((b) => {
    const isAvail = b.availableCopies > 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${b.isbn}</code></td>
      <td><strong>${b.title}</strong></td>
      <td>${b.totalCopies}</td>
      <td>${b.availableCopies}</td>
      <td><span class="${isAvail ? "tag-available" : "tag-out"}">${isAvail ? "In Stock" : "Out of Stock"}</span></td>
    `;
    tbody.appendChild(tr);

    if (isAvail) {
      const opt = document.createElement("option");
      opt.value = b.isbn;
      opt.textContent = `${b.title} (${b.availableCopies} available)`;
      bookSelect.appendChild(opt);
    }
  });

  // Loans Table & Return Select
  const loansBody = document.getElementById("loansBody");
  const loanSelect = document.getElementById("loanSelect");
  loansBody.innerHTML = "";
  loanSelect.innerHTML = `<option value="">-- Choose Issued Book --</option>`;

  if (loans.length === 0) {
    loansBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">No active loans.</td></tr>`;
  } else {
    loans.forEach((l) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${l.id}</strong></td>
        <td>${l.member}</td>
        <td>${l.title}</td>
        <td>${l.date}</td>
      `;
      loansBody.appendChild(tr);

      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = `${l.id} - ${l.member} (${l.title})`;
      loanSelect.appendChild(opt);
    });
  }

  // Logs
  const logBox = document.getElementById("logBox");
  logBox.innerHTML = "";
  if (logs.length === 0) {
    logBox.innerHTML = `<div style="padding: 10px; color: #888;">No activity logged.</div>`;
  } else {
    logs.forEach((item) => {
      const d = document.createElement("div");
      d.className = `log-item ${item.success ? "success" : "error"}`;
      d.textContent = `[${item.time}] ${item.message}`;
      logBox.appendChild(d);
    });
  }
}

function showBanner(res) {
  const b = document.getElementById("statusBanner");
  b.textContent = res.message;
  b.className = `banner ${res.success ? "success" : "error"}`;
  logs.unshift({ time: new Date().toLocaleTimeString(), ...res });
}

document.addEventListener("DOMContentLoaded", () => {
  renderUI();

  document.getElementById("addBookForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const isbn = document.getElementById("isbn").value;
    const title = document.getElementById("title").value;
    const copies = document.getElementById("copies").value;

    const res = addBook(isbn, title, copies);
    showBanner(res);
    if (res.success) {
      document.getElementById("isbn").value = "";
      document.getElementById("title").value = "";
      document.getElementById("copies").value = "1";
    }
    renderUI();
  });

  document.getElementById("issueForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const member = document.getElementById("memberName").value;
    const isbn = document.getElementById("bookSelect").value;

    const res = issueBook(member, isbn);
    showBanner(res);
    if (res.success) {
      document.getElementById("memberName").value = "";
    }
    renderUI();
  });

  document.getElementById("returnForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const loanId = document.getElementById("loanSelect").value;

    const res = returnBook(loanId);
    showBanner(res);
    renderUI();
  });
});
