/**
 * ============================================================================
 * UNIVERSAL HIRING ASSESSMENT ENGINE PATTERN (Vanilla JS)
 * ============================================================================
 * 
 * This module provides clean, battle-tested utilities used across all 
 * technical assessment problems (Seat Booking, Shift Scheduling, Parking,
 * Library, Inventory, etc.).
 *
 * It enforces the Golden Rules of Hiring Hackathons:
 * 1. Separation of Concerns: Core Logic !== UI rendering.
 * 2. Strict Validation Order: Check inputs -> Check domain rules -> Mutate state.
 * 3. Immutable/Predictable State: Single Source of Truth.
 * 4. Audit Trail: Keep a log of every attempted action.
 */

// -----------------------------------------------------------------------------
// 1. Storage & State Store
// -----------------------------------------------------------------------------
class StateStore {
  constructor(storageKey, defaultState) {
    this.storageKey = storageKey;
    this.defaultState = defaultState;
    this.state = this.load();
    this.listeners = [];
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Storage read failed, using memory state", e);
    }
    return JSON.parse(JSON.stringify(this.defaultState));
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Storage write failed", e);
    }
    this.notify();
  }

  reset() {
    this.state = JSON.parse(JSON.stringify(this.defaultState));
    this.save();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error("Listener error:", err);
      }
    });
  }
}

// -----------------------------------------------------------------------------
// 2. Time & Interval Utilities (Critical for Scheduling, Appointments, Parking)
// -----------------------------------------------------------------------------
const TimeUtils = {
  /**
   * Converts "HH:MM" (24-hour) string to minutes from midnight.
   * e.g., "09:30" -> 570
   */
  timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return null;
    const parts = timeStr.trim().split(":");
    if (parts.length < 2) return null;
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(mins)) return null;
    return hours * 60 + mins;
  },

  /**
   * Converts minutes from midnight to "HH:MM" string.
   */
  minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  },

  /**
   * Checks if two time intervals overlap.
   * Important Assessment Edge Case:
   * [9:00, 13:00] and [13:00, 16:00] DO NOT OVERLAP because the first ends exactly
   * when the second starts.
   * Overlap occurs ONLY if: StartA < EndB && EndA > StartB.
   */
  doIntervalsOverlap(startA, endA, startB, endB) {
    const sA = typeof startA === "string" ? TimeUtils.timeToMinutes(startA) : startA;
    const eA = typeof endA === "string" ? TimeUtils.timeToMinutes(endA) : endA;
    const sB = typeof startB === "string" ? TimeUtils.timeToMinutes(startB) : startB;
    const eB = typeof endB === "string" ? TimeUtils.timeToMinutes(endB) : endB;

    if (sA === null || eA === null || sB === null || eB === null) return false;

    // Normal same-day shift: start < end
    return sA < eB && eA > sB;
  },

  /**
   * Validates that endTime is strictly greater than startTime for same-day shifts.
   */
  isEndAfterStart(startTime, endTime) {
    const s = TimeUtils.timeToMinutes(startTime);
    const e = TimeUtils.timeToMinutes(endTime);
    if (s === null || e === null) return false;
    return e > s;
  }
};

// -----------------------------------------------------------------------------
// 3. Validation Helpers (Handles tricky inputs & order of checks)
// -----------------------------------------------------------------------------
const Validator = {
  isPositiveInteger(val) {
    if (val === null || val === undefined || String(val).trim() === "") return false;
    const num = Number(val);
    return Number.isInteger(num) && num > 0;
  },

  isNonEmptyString(val) {
    return typeof val === "string" && val.trim().length > 0;
  },

  sanitize(str) {
    if (typeof str !== "string") return "";
    return str.replace(/[&<>"']/g, (m) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[m];
    });
  }
};

// -----------------------------------------------------------------------------
// 4. Action Result Model
// -----------------------------------------------------------------------------
class ActionResult {
  constructor(success, message, data = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toLocaleTimeString();
  }

  static ok(message, data = null) {
    return new ActionResult(true, message, data);
  }

  static fail(message, data = null) {
    return new ActionResult(false, message, data);
  }
}

// -----------------------------------------------------------------------------
// 5. Activity Audit Logger
// -----------------------------------------------------------------------------
class ActionLog {
  constructor(maxItems = 30) {
    this.logs = [];
    this.maxItems = maxItems;
  }

  add(actionResult, actionName = "") {
    const entry = {
      action: actionName,
      message: actionResult.message,
      success: actionResult.success,
      time: actionResult.timestamp || new Date().toLocaleTimeString()
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxItems) {
      this.logs.pop();
    }
    return entry;
  }

  getAll() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }
}

// Export for browser global use
window.UniversalKit = {
  StateStore,
  TimeUtils,
  Validator,
  ActionResult,
  ActionLog
};
