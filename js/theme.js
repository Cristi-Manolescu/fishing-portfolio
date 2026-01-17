import { state } from "./state.js";

export const THEME = {
  "Acasa":       { hex: "#ff6701", barFilter: "bar-shadow-acasa",   contactFilter: "contact-shadow-acasa" },
  "Despre mine": { hex: "#367101", barFilter: "bar-shadow-despre",  contactFilter: "contact-shadow-despre" },
  "Lacuri":      { hex: "#efac45", barFilter: "bar-shadow-lacuri",  contactFilter: "contact-shadow-lacuri" },
  "Partide":     { hex: "#6b1c10", barFilter: "bar-shadow-partide", contactFilter: "contact-shadow-partide" },
  "Contact":     { hex: "#3891fb", barFilter: "bar-shadow-contact", contactFilter: "contact-shadow-contact" },
  "_normal":     { hex: "#8e8e8e", barFilter: "bar-shadow-grey",    contactFilter: "contact-shadow-grey" }
};

export const LABELS_LTR = ["Acasa", "Despre mine", "Lacuri", "Partide", "Contact"];
export const DRAW_ORDER = ["Contact", "Partide", "Lacuri", "Despre mine", "Acasa"];

export function resolveStyle(label) {
  if (state.activeLabel === label) return THEME[label];
  if (state.hoverLabel === label) return THEME[label];
  return THEME._normal;
}
