# 🏆 The Universal 120-Minute Technical Assessment Cheat Sheet

> **Guide for Campus & Off-Campus Hiring Hackathons / Development Tests**  
> Covers: Core Programming Logic, Edge Cases, Data State, DOM UI, and Clean Code.

---

## 1. How Evaluators Grade Your Code (100 Marks Breakdown)

| Evaluation Area | Weight | What Evaluators Check | Common Mistakes That Lose Marks |
|---|---|---|---|
| **Core Functionality** | 30% | All forms work, CRUD actions succeed, state updates properly. | Form submit reloads page because `e.preventDefault()` was forgotten. |
| **Business Logic & Edge Cases** | 30–40% | Exact boundary conditions (e.g. touching times `13:00` vs `13:00`, consecutive seats). | Treating touching times as conflicts, joining seats across rows. |
| **Order of Checks & Validation** | 15–20% | Correct precedence of error messages (e.g. `INVALID COUNT` before `NO SEATS TOGETHER`). | Returning "Out of seats" when the user typed `-5` or empty string. |
| **Code Structure & Tidy Code** | 15–20% | Logic separated into a Model class/object apart from the DOM. | 300 lines of spaghetti code nested inside click event handlers. |
| **State & UI Sync** | 10% | Tables, maps, stats, and logs update on EVERY action. | State changes internally, but UI requires manual refresh to see updates. |

---

## 2. Recommended 120-Minute Exam Time Budget

- **00 – 15 Min (Read & Architect)**:
  - Read problem statement twice.
  - Identify all entities (e.g. `Employee`, `Shift`, `Assignment`).
  - Write down the exact error messages and their required check order.
- **15 – 45 Min (Core Logic / Model)**:
  - Write the pure JavaScript Model class without any DOM references.
  - Test model methods directly in the browser console.
- **45 – 80 Min (DOM UI & Event Wiring)**:
  - Build clean HTML forms with proper input types and labels.
  - Attach form submit listeners, call Model methods, and update DOM.
- **80 – 105 Min (Edge Cases & Validation Polishing)**:
  - Test negative numbers, 0, blank strings, non-integers, duplicate IDs.
  - Test boundary touching conditions (e.g. `09:00-13:00` vs `13:00-16:00`).
- **105 – 120 Min (Final Polish & Submission Naming)**:
  - Verify filename matches company instructions:  
    `FirstName_LastName_Branch_PS1/PS2` (e.g. `Sneha_Mandlik_Computers_PS1`).
  - Add quick comments explaining the logic approach.

---

## 3. The 4 Essential Core Algorithms to Memorize

### Algorithm 1: Time Interval Overlap Detection (Scheduling, Appointments)
Two intervals $[S_1, E_1)$ and $[S_2, E_2)$ overlap if and only if:
$$\text{Overlap} \iff S_1 < E_2 \land E_1 > S_2$$

```javascript
// Time string "HH:MM" to minutes
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Conflict check:
// Shift 1: 09:00 - 13:00  =>  S1=540, E1=780
// Shift 2: 13:00 - 16:00  =>  S2=780, E2=960
// (540 < 960) is TRUE, BUT (780 > 780) is FALSE!
// => Overlap = FALSE. Allowed!
function doIntervalsOverlap(s1, e1, s2, e2) {
  return s1 < e2 && e1 > s2;
}
```

---

### Algorithm 2: Leftmost Contiguous Seat Allocation (Cinema, Train, Hotels)
```javascript
function findLeftmostContiguousBlock(rowSeats, K) {
  // rowSeats is an array of seat objects: [{ id: 'A1', isBooked: false }, ...]
  for (let i = 0; i <= rowSeats.length - K; i++) {
    let isBlockFree = true;
    for (let j = 0; j < K; j++) {
      if (rowSeats[i + j].isBooked) {
        isBlockFree = false;
        break;
      }
    }
    if (isBlockFree) {
      return i; // Found starting index of leftmost contiguous block
    }
  }
  return -1; // No contiguous block of size K found in this row
}
```

---

### Algorithm 3: Resource Deduction Guard (Inventory, Library, Stock)
```javascript
function validateDeduction(currentStock, requestedQty) {
  // 1. Validate Input
  const qty = Number(requestedQty);
  if (!Number.isInteger(qty) || qty <= 0) {
    return { ok: false, message: "INVALID QUANTITY" };
  }
  // 2. Prevent Negative Stock
  if (qty > currentStock) {
    return { ok: false, message: `INSUFFICIENT STOCK: Only ${currentStock} available` };
  }
  return { ok: true, remaining: currentStock - qty };
}
```

---

### Algorithm 4: Priority Queue Token Serving (Queues, Customer Service)
```javascript
function dequeueNext(queue) {
  if (queue.length === 0) return null;
  // VIPs get served first (FIFO among VIPs)
  let idx = queue.findIndex(item => item.priority === "VIP");
  if (idx === -1) {
    idx = 0; // Standard FIFO
  }
  return queue.splice(idx, 1)[0];
}
```

---

## 4. The Universal 3-Tier Code Template

When starting any problem, write this clean scaffold:

```javascript
// ==========================================
// TIER 1: Model (Pure Logic & State)
// ==========================================
class DomainModel {
  constructor() {
    this.items = [];
    this.counter = 1;
  }

  // Pure method with structured return: { success: boolean, message: string, data?: any }
  executeAction(input) {
    // 1. Format / type validation
    if (!this.isValid(input)) {
      return { success: false, message: "INVALID INPUT" };
    }
    // 2. Business constraint validation
    if (this.hasConflict(input)) {
      return { success: false, message: "CONFLICT DETECTED" };
    }
    // 3. Mutate state
    const record = { id: this.counter++, ...input };
    this.items.push(record);
    return { success: true, message: `SUCCESS #${record.id}`, data: record };
  }
}

// ==========================================
// TIER 2: UI Controller & Event Listeners
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const model = new DomainModel();

  const form = document.getElementById("actionForm");
  const alertBox = document.getElementById("alertBox");
  const tableBody = document.getElementById("tableBody");

  function render() {
    tableBody.innerHTML = model.items.map(item => `
      <tr>
        <td>#${item.id}</td>
        <td>${item.title}</td>
      </tr>
    `).join("");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const result = model.executeAction({ /* values */ });
    alertBox.textContent = result.message;
    alertBox.className = result.success ? "alert-success" : "alert-error";
    if (result.success) form.reset();
    render();
  });

  render();
});
```

---

## 5. Submission Checklist (Avoid Zero-Mark Mistakes!)
1. **Never use `alert()` or `prompt()`** unless asked: Use in-page HTML banners / status divs.
2. **Always call `event.preventDefault()`** on form submission.
3. **Never allow NaN, undefined, or empty strings** to enter data tables.
4. **Follow the exact file naming instructions** from the exam paper (e.g. `Sneha_Mandlik_Computers_PS1`).
