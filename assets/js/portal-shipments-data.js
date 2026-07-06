/**
 * Customer shipment history — managed by Green Logistics.
 * Add one object per load; use the same email the customer registered with.
 *
 * Fields:
 *   ownerEmail   — customer portal login email (required)
 *   ref          — load / PRO number
 *   date         — ISO date or "YYYY-MM-DD"
 *   originCity, originState, destCity, destState
 *   miles        — number
 *   commodity    — what was hauled
 *   cost         — total rate in USD (number)
 *   status       — e.g. Delivered, In transit, Booked
 */
window.GL_PORTAL_SHIPMENTS_DATA = [
  {
    ownerEmail: "demo@greengrouplogistics.com",
    ref: "GL-24018",
    date: "2025-11-14",
    originCity: "Houston",
    originState: "TX",
    destCity: "Atlanta",
    destState: "GA",
    miles: 789,
    commodity: "Caterpillar D6 dozer (heavy haul)",
    cost: 4850,
    status: "Delivered"
  },
  {
    ownerEmail: "demo@greengrouplogistics.com",
    ref: "GL-24102",
    date: "2026-01-22",
    originCity: "Churchville",
    originState: "PA",
    destCity: "Nashville",
    destState: "TN",
    miles: 742,
    commodity: "2022 Ford F-350 (car haul)",
    cost: 1295,
    status: "Delivered"
  },
  {
    ownerEmail: "demo@greengrouplogistics.com",
    ref: "GL-25007",
    date: "2026-03-08",
    originCity: "Miami",
    originState: "FL",
    destCity: "Charlotte",
    destState: "NC",
    miles: 650,
    commodity: "42 ft Sea Ray boat on trailer",
    cost: 3200,
    status: "In transit"
  }
];
