# Assignment 1: Movie Seat Booking Problem (Set C)

> **Expected Time:** 120 minutes | **Total Marks:** 100  
> **Evaluation Breakdown:**  
> - Messages & Order of Checks: 20%  
> - Core Logic (Contiguous Leftmost Allocation): 40%  
> - State Management & Data Accuracy: 20%  
> - Code Tidiness & Architecture: 20%  

---

## 1. Problem Summary & Rules
1. Cinema has rows `A, B, C...` and seats `1, 2, 3...`. Seats are designated like `A1`, `B4`.
2. When booking `K` seats:
   - Must be contiguous in a **single row** (never split across rows).
   - Rows evaluated in alphabetical order (`A`, then `B`, then `C`).
   - Pick the **leftmost** block of `K` empty seats.
   - Assign incrementing booking ID `1, 2, 3...` (IDs never reset on cancellation).
3. **Strict Order of Checks for Booking**:
   1. `INVALID COUNT` if input is blank, zero, negative, or not a whole number.
   2. `NO SEATS TOGETHER` if requested count exceeds row capacity or no single row has `K` contiguous empty seats.
   3. `BOOKED <id>: <seat1> <seat2>...` on success.
4. **Strict Order of Checks for Cancellation**:
   1. `INVALID BOOKING` if input is blank, zero, negative, or not a whole number.
   2. `BOOKING NOT FOUND` if no active booking exists with that ID.
   3. `CANCELLED <id>: <seat1> <seat2>...` on success.

---

## 2. Walkthrough Validation Table (Exact Exam Test Cases)

Starting setup: 3 rows (`A, B, C`), 5 seats per row (total 15 seats).

| Step | Action | What Happens | Output Message | Free Seats |
|---|---|---|---|---|
| 1 | Book 3 | Row A is empty, takes leftmost 3 (`A1 A2 A3`) | `BOOKED 1: A1 A2 A3` | 12 |
| 2 | Book 3 | Row A has only 2 left (`A4 A5`), moves to Row B | `BOOKED 2: B1 B2 B3` | 9 |
| 3 | Book 2 | Row A has `A4 A5` together, fits Row A | `BOOKED 3: A4 A5` | 7 |
| 4 | Book 4 | Row A is full, Row B has only 2 left, fits Row C | `BOOKED 4: C1 C2 C3 C4` | 3 |
| 5 | Book 3 | 3 seats free but scattered across rows (B has 2, C has 1) | `NO SEATS TOGETHER` | 3 |
| 6 | Cancel 2 | Frees seats `B1 B2 B3` | `CANCELLED 2: B1 B2 B3` | 6 |
| 7 | Book 3 | Row B has 3 free again, takes leftmost | `BOOKED 5: B1 B2 B3` | 3 |

---

## 3. Architecture Highlights
- **`CinemaModel` Class**: Completely decoupled from the screen. Contains pure state, search algorithms, and validation checks.
- **UI Controller**: Listens to form events, triggers model methods, and updates DOM (Seat map, tables, stat counters, and audit log).
- **Error Guarantee**: If any check fails, state is completely untouched.
