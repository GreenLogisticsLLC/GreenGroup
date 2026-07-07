import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const FILES = [
  "index.html",
  "about.html",
  "services.html",
  "contact.html",
  "blog.html",
  "terms.html",
  "option.html",
  "transit-calculator.html",
  "service-center-lookup.html",
  "help-center.html",
  "forms-library.html",
  "density-class-calculator.html",
  "login.html",
  "account.html",
  "blog/specialized-military-equipment-heavy-haul.html",
  "blog/secure-container-transportation-solutions.html",
  "blog/precision-flatbed-oversized-modular.html",
  "blog/heavy-haul-oversized-equipment-precision.html",
  "blog/heavy-equipment-dozer-hauling.html",
  "blog/efficient-commercial-industrial-equipment-transport.html",
];

const SOCIAL = `          <li class="nav-social-top" aria-label="Social media quick links">
                <a href="https://www.facebook.com/share/1BygbP16tG/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.2c0-.9.3-1.6 1.6-1.6h1.7V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.3V11H8v3h2.3v8h3.2z"/></svg>
                </a>
                <a href="https://www.instagram.com/green_logisticsllc?igsh=eGRlbHQ2ZGI5dXky&utm_source=qr" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.8 3h8.4A4.8 4.8 0 0 1 21 7.8v8.4a4.8 4.8 0 0 1-4.8 4.8H7.8A4.8 4.8 0 0 1 3 16.2V7.8A4.8 4.8 0 0 1 7.8 3Zm0 1.8A3 3 0 0 0 4.8 7.8v8.4a3 3 0 0 0 3 3h8.4a3 3 0 0 0 3-3V7.8a3 3 0 0 0-3-3H7.8Zm8.9 1.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7.6a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8Zm0 1.8a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/greengrouplogisticsllc/" target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.2 8.8a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4ZM4.7 10h3v9.3h-3V10Zm5 0h2.8v1.3h.1c.4-.8 1.4-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8v4.8h-3v-4.3c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.4h-3V10Z"/></svg>
                </a>
                <a href="https://wa.me/12677035313?text=Hello%20Green%20Logistics%2C%20I%20need%20a%20quote." target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 11.8A8.8 8.8 0 0 1 7 19.6L3 21l1.5-3.8A8.8 8.8 0 1 1 20 11.8Zm-8.8-7.1a7.1 7.1 0 0 0-6.2 10.6l.2.4-.9 2.2 2.3-.8.4.2A7.1 7.1 0 1 0 11.2 4.7Zm4.2 9c-.2-.1-1.2-.6-1.4-.6s-.3-.1-.4.1l-.6.7c-.1.2-.2.2-.4.1a5.8 5.8 0 0 1-1.7-1.1 6.4 6.4 0 0 1-1.2-1.5c-.1-.2 0-.3.1-.4l.3-.3.2-.3.1-.3c0-.1 0-.2-.1-.3l-.6-1.4c-.2-.4-.3-.4-.4-.4h-.4c-.1 0-.3.1-.4.2-.2.2-.7.7-.7 1.6 0 .9.7 1.9.8 2 .1.1 1.4 2.1 3.3 2.9.5.2.8.4 1.1.5.5.2 1 .2 1.3.1.4-.1 1.2-.5 1.4-.9.2-.4.2-.8.1-.9 0 0-.1-.1-.3-.2Z"/></svg>
                </a>
              </li>`;

function navUl(p) {
  const b = p.includes(`${path.sep}blog${path.sep}`) && !p.endsWith("blog.html");
  const h = (u) => (b ? `../${u}` : u);
  return `<ul class="nav-list">
          <li><a href="${h("index.html")}">Home</a></li>
          <li class="nav-item has-dropdown">
            <button class="nav-link-btn" type="button" data-dropdown-toggle aria-expanded="false">Option</button>
            <div class="dropdown-menu mega-menu">
              <a href="${h("option.html")}">Overview</a>
              <a href="${h("contact.html")}">Request a freight quote</a>
              <a href="${h("help-center.html")}">Help center</a>
              <a href="${h("service-center-lookup.html")}">Service center lookup</a>
              <a href="${h("forms-library.html")}">Forms library</a>
              <a href="${h("transit-calculator.html")}">Transit time calculator</a>
              <a href="${h("density-class-calculator.html")}">Density and class calculator</a>
            </div>
          </li>
          <li class="nav-item has-dropdown">
            <button class="nav-link-btn" type="button" data-dropdown-toggle aria-expanded="false">Services</button>
            <div class="dropdown-menu mega-menu mega-menu--services">
              <a href="${h("services.html")}">Overview</a>
              <a href="${h("services.html#heavy")}">Heavy hauling</a>
              <a href="${h("services.html#car")}">Car hauling</a>
              <a href="${h("services.html#boat")}">Boat hauling</a>
              <a href="${h("services.html#freight")}">Freight</a>
            </div>
          </li>
          <li class="nav-item has-dropdown">
            <button class="nav-link-btn" type="button" data-dropdown-toggle aria-expanded="false">Company</button>
            <div class="dropdown-menu">
              <a href="${h("about.html")}">About us</a>
              <a href="${h("contact.html")}">Contact</a>
              <a href="https://g.page/r/CYnYasDBg-hSEAE" target="_blank" rel="noopener noreferrer">Google Business</a>
            </div>
          </li>
          <li class="nav-item has-dropdown">
            <button class="nav-link-btn" type="button" data-dropdown-toggle aria-expanded="false">Blog</button>
            <div class="dropdown-menu mega-menu mega-menu--blog">
              <a href="${h("blog.html")}">Blog overview</a>
              <a href="${h("blog/precision-flatbed-oversized-modular.html")}">Flatbed &amp; modular structures</a>
              <a href="${h("blog/heavy-haul-oversized-equipment-precision.html")}">Heavy haul precision</a>
              <a href="${h("blog/efficient-commercial-industrial-equipment-transport.html")}">Commercial equipment</a>
              <a href="${h("blog/specialized-military-equipment-heavy-haul.html")}">Military-style heavy haul</a>
              <a href="${h("blog/secure-container-transportation-solutions.html")}">Container transport</a>
              <a href="${h("blog/heavy-equipment-dozer-hauling.html")}">Heavy equipment &amp; dozer</a>
            </div>
          </li>
          <li class="nav-item has-dropdown">
            <button class="nav-link-btn" type="button" data-dropdown-toggle aria-expanded="false" aria-label="Terms and Conditions">Terms</button>
            <div class="dropdown-menu">
              <p class="dropdown-menu__title">Terms and Conditions</p>
              <a href="${h("terms.html")}">Full terms</a>
              <a href="${h("terms.html#agreement-to-terms")}">Agreement to terms</a>
              <a href="${h("terms.html#payment-terms")}">Payment terms</a>
              <a href="${h("terms.html#sms-terms")}">SMS terms</a>
              <a href="${h("contact.html")}">Legal / billing questions</a>
            </div>
          </li>
          <li class="nav-phones">
            <a href="tel:+18883086865" class="nav-phone" aria-label="Call toll-free (888) 308-6865">(888) 308-6865</a>
            <a href="tel:+12677035313" class="nav-phone" aria-label="Call (267) 703-5313">(267) 703-5313</a>
          </li>
          <li class="nav-auth">
            <button type="button" class="nav-auth-btn nav-auth-btn--outline" data-register-modal>REGISTER</button>
            <a href="${h("login.html")}" class="nav-auth-btn nav-auth-btn--primary" data-login-link>LOG IN</a>
          </li>
${SOCIAL}
        </ul>
      `;
}

const RE = /<ul class="nav-list">[\s\S]*?<\/ul>\s*(?=<\/nav>)/;

for (const rel of FILES) {
  const fp = path.join(ROOT, rel);
  let raw = fs.readFileSync(fp, "utf8");
  if (!RE.test(raw)) {
    console.warn("skip (no nav match):", rel);
    continue;
  }
  raw = raw.replace(RE, navUl(fp));
  fs.writeFileSync(fp, raw, "utf8");
  console.log("patched", rel);
}
