# Assignment 2: Employee Shift Scheduling System

> **Expected Time:** 120 minutes | **Total Marks:** 100  
> **Evaluation Criteria:**  
> - Core Functionality: 30 Marks  
> - Shift-conflict Validation & Logical Approach: 30 Marks  
> - Code Quality & Tidy Code: 15 Marks  
> - UI & Usability: 10 Marks  
> - Edge Cases & Bonus: 15 Marks  

---

## 1. Problem Description & Requirements
Organizations need to schedule employees across work shifts without human error.
The application provides:
1. **Employee Management**: Add and list employees by Employee ID and Name.
2. **Shift Management**: Create shifts with Date, Start Time, and End Time.
3. **Employee Assignment**: Assign an employee to a shift with **strict conflict prevention**.
4. **Validation Rules**:
   - For same-day shifts, End Time must be later than Start Time.
   - An employee **cannot have two overlapping shifts**.
   - Multiple employees can be assigned to the same shift.
   - An employee can work multiple non-overlapping shifts.

---

## 2. Shift Conflict Detection Logic (Core 30 Marks)

### Mathematical Overlap Condition:
Two time intervals $[S_1, E_1)$ and $[S_2, E_2)$ overlap if and only if:
$$\text{Overlap} \iff (S_1 < E_2) \land (E_1 > S_2)$$

### Critical Edge Cases Checked:
1. **Touching Shifts (Allowed)**:
   - Shift 1: `09:00 - 13:00` ($S_1=9, E_1=13$)
   - Shift 2: `13:00 - 16:00` ($S_2=13, E_2=16$)
   - Check: $S_1 < E_2 \implies 9 < 16$ (True), but $E_1 > S_2 \implies 13 > 13$ (False!).
   - Result: **NO OVERLAP**. The system allows this assignment!
2. **Overlapping Shifts (Rejected)**:
   - Shift 1: `09:00 - 13:00` ($S_1=9, E_1=13$)
   - Shift 3: `12:00 - 15:00` ($S_3=12, E_3=15$)
   - Check: $S_1 < E_3 \implies 9 < 15$ (True), and $E_1 > S_3 \implies 13 > 12$ (True).
   - Result: **OVERLAP DETECTED**. The system blocks the assignment and displays an explicit conflict alert.
3. **Overnight Shifts (Bonus Feature)**:
   - Shift crossing midnight (e.g., `22:00` to `06:00` next day).
   - Computed using absolute epoch timestamps (`Date.getTime()`) to ensure mathematical correctness across midnight boundaries.

---

## 3. Bonus Features Implemented
- **Date Filtering**: Real-time filtering of shifts by calendar date.
- **Total Shifts Metric**: Live count of assigned shifts per employee in the Employee Directory.
- **Local Persistence**: All employees, shifts, and assignments persist across page refreshes via `localStorage`.
- **Benchmark Runner**: One-click demo button that runs the exact benchmark from the test rubric.
