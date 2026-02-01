import { startMobileAcasa } from "./sections/acasa.js";

export async function bootMobile({ navigate } = {}) {
  document.documentElement.classList.add("is-mobile");
  document.body.classList.add("is-mobile");

  if (!document.querySelector("#m-root")) {
    throw new Error("bootMobile: missing #m-root (create it in mobileHolder.js)");
  }

  return await startMobileAcasa({ navigate });
}
