(function () {
  "use strict";

  /** Client-side portal (localStorage). Not a substitute for server auth. */
  var GLPortal = (function () {
    var ACC = "gl_portal_accounts_v1";
    var SESS = "gl_portal_session";
    var SHIP = "gl_portal_shipments_v1";

    function normEmail(s) {
      return String(s || "").trim().toLowerCase();
    }

    function readJson(key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
      } catch (_e) {
        return fallback;
      }
    }

    function writeJson(key, val) {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch (_e) {}
    }

    function accountMap() {
      var m = readJson(ACC, {});
      return m && typeof m === "object" ? m : {};
    }

    function shipmentList() {
      var list = readJson(SHIP, []);
      return Array.isArray(list) ? list : [];
    }

    return {
      normEmail: normEmail,
      getAccount: function (email) {
        var m = accountMap();
        return m[normEmail(email)] || null;
      },
      saveRegisteredUser: function (role, fd) {
        var email = normEmail(fd.get("email"));
        var password = String(fd.get("portalPassword") || "");
        if (!email || password.length < 8) return;
        var m = accountMap();
        var profile =
          role === "CUSTOMER"
            ? {
                firstName: String(fd.get("firstName") || ""),
                lastName: String(fd.get("lastName") || ""),
                company: String(fd.get("company") || ""),
                phone: String(fd.get("phone") || ""),
              }
            : {
                firstName: String(fd.get("firstName") || ""),
                lastName: String(fd.get("lastName") || ""),
                company: String(fd.get("company") || ""),
                phone: String(fd.get("phone") || ""),
                mc: String(fd.get("mc") || ""),
                dot: String(fd.get("dot") || ""),
                trucks: String(fd.get("trucks") || ""),
              };
        m[email] = {
          role: role,
          password: password,
          profile: profile,
          createdAt: new Date().toISOString(),
        };
        writeJson(ACC, m);
      },
      login: function (email, password) {
        email = normEmail(email);
        var acc = this.getAccount(email);
        if (!acc || acc.password !== String(password || "")) return null;
        var sess = { email: email, role: acc.role, profile: acc.profile };
        writeJson(SESS, sess);
        return sess;
      },
      logout: function () {
        localStorage.removeItem(SESS);
      },
      getSession: function () {
        return readJson(SESS, null);
      },
      listShipments: function (email) {
        email = normEmail(email);
        var fromStore = shipmentList().filter(function (row) {
          return normEmail(row.ownerEmail) === email;
        });
        var fromConfig = [];
        var cfg = window.GL_PORTAL_SHIPMENTS_DATA;
        if (Array.isArray(cfg)) {
          fromConfig = cfg.filter(function (row) {
            return normEmail(row.ownerEmail) === email;
          });
        }
        var seen = {};
        var merged = [];
        fromConfig.concat(fromStore).forEach(function (row) {
          var key = String(row.ref || row.id || "") + "|" + String(row.date || row.createdAt || "");
          if (seen[key]) return;
          seen[key] = true;
          merged.push(row);
        });
        return merged.sort(function (a, b) {
          var da = String(a.date || a.createdAt || "");
          var db = String(b.date || b.createdAt || "");
          return db.localeCompare(da);
        });
      },
      addShipmentFromQuote: function (email, messageText) {
        email = normEmail(email);
        if (!email) return;
        var acc = this.getAccount(email);
        var role = acc ? acc.role : "CUSTOMER";
        var list = shipmentList();
        list.push({
          id: "gl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
          ownerEmail: email,
          role: role,
          ref: "WEB-" + String(Date.now()).slice(-8),
          origin: "—",
          destination: "—",
          equipment: "TBD",
          status: "Quote requested",
          note: String(messageText || "").slice(0, 600),
          createdAt: new Date().toISOString(),
          source: "contact",
        });
        writeJson(SHIP, list);
      },
    };
  })();

  var header = document.querySelector("[data-header]");
  var nav = document.querySelector("[data-nav]");
  var toggle = document.querySelector("[data-nav-toggle]");
  var mobileNavMq = window.matchMedia("(max-width: 768px)");

  function isMobileNavLayout() {
    return mobileNavMq.matches;
  }

  function setupMobileHeaderSocial() {
    var inner = header && header.querySelector(".header-inner");
    var source = document.querySelector(".nav-social-top");
    if (!inner || !source || !toggle || inner.querySelector(".header-social-bar")) return;
    var bar = document.createElement("nav");
    bar.className = "header-social-bar";
    bar.setAttribute("aria-label", "Social media");
    bar.innerHTML = source.innerHTML;
    inner.insertBefore(bar, toggle);
  }

  setupMobileHeaderSocial();
  var yearEls = document.querySelectorAll("[data-year]");
  var form = document.querySelector("[data-contact-form]");
  var formStatus = document.querySelector("[data-form-status]");

  var y = new Date().getFullYear();
  yearEls.forEach(function (el) {
    el.textContent = String(y);
  });

  function setScrolled() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  setScrolled();
  window.addEventListener("scroll", setScrolled, { passive: true });

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    if (header) header.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.body.classList.remove("mobile-nav-open");
  }

  function openNav() {
    if (!nav || !toggle) return;
    nav.classList.add("is-open");
    if (header) header.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    if (isMobileNavLayout()) {
      document.body.classList.add("mobile-nav-open");
      document.body.style.overflow = "";
    } else {
      document.body.style.overflow = "hidden";
    }
  }

  document.querySelectorAll("[data-team-lead-toggle]").forEach(function (teamLeadToggle) {
    teamLeadToggle.addEventListener("click", function () {
      var teamLeadCard = teamLeadToggle.closest("[data-team-lead-card]");
      var bioId = teamLeadToggle.getAttribute("aria-controls");
      var teamLeadBio = bioId ? document.getElementById(bioId) : null;
      if (!teamLeadBio || !teamLeadCard) return;
      var isOpen = teamLeadCard.classList.contains("is-expanded");
      if (isOpen) {
        teamLeadBio.setAttribute("hidden", "");
        teamLeadToggle.setAttribute("aria-expanded", "false");
        teamLeadCard.classList.remove("is-expanded");
      } else {
        teamLeadBio.removeAttribute("hidden");
        teamLeadToggle.setAttribute("aria-expanded", "true");
        teamLeadCard.classList.add("is-expanded");
      }
    });
  });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) closeNav();
      else openNav();
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  var dropdownToggles = document.querySelectorAll("[data-dropdown-toggle]");
  var dropdownMq = window.matchMedia("(max-width: 768px)");

  if (dropdownToggles.length) {
    function closeDropdowns() {
      dropdownToggles.forEach(function (btn) {
        btn.setAttribute("aria-expanded", "false");
        var item = btn.closest(".nav-item");
        if (item) item.classList.remove("is-open");
      });
    }

    function isDropdownClickMode() {
      return dropdownMq.matches;
    }

    dropdownToggles.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (!isDropdownClickMode()) return;
        e.preventDefault();
        var item = btn.closest(".nav-item");
        var open = item && item.classList.contains("is-open");
        closeDropdowns();
        if (!open && item) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    document.addEventListener("click", function (e) {
      if (!isDropdownClickMode()) return;
      if (!e.target.closest(".nav-item.has-dropdown")) closeDropdowns();
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDropdowns();
    });

    dropdownMq.addEventListener("change", function () {
      if (!dropdownMq.matches) closeDropdowns();
    });
  }

  if (form && formStatus) {
    var CONTACT_EMAIL = "info@greengrouplogistics.com";
    var CONTACT_ENDPOINT = "https://formsubmit.co/ajax/" + CONTACT_EMAIL;

    function contactMailtoFallback(fd) {
      var lines = [
        "New website contact message",
        "",
        "First name: " + (fd.get("name") || ""),
        "Last name: " + (fd.get("surname") || ""),
        "Email: " + (fd.get("email") || ""),
        "Phone: " + (fd.get("phone") || ""),
        "",
        "Message:",
        fd.get("message") || "",
        "",
        "Page: " + window.location.href,
      ];
      window.location.href =
        "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent("Website contact message - Green Logistics") +
        "&body=" + encodeURIComponent(lines.join("\n"));
    }

    function contactShowThankYou() {
      var dialog = document.getElementById("contact-thank-you-modal");

      if (!dialog) {
        dialog = document.createElement("dialog");
        dialog.id = "contact-thank-you-modal";
        dialog.className = "register-modal contact-thank-you-modal";
        dialog.setAttribute("aria-labelledby", "contact-thank-you-title");
        dialog.innerHTML =
          '<div class="register-modal__panel">' +
          '<button type="button" class="register-modal__close" data-contact-thanks-close aria-label="Close">&times;</button>' +
          '<h2 class="register-modal__title" id="contact-thank-you-title">Thank you</h2>' +
          '<p class="register-modal__hint">Your message was sent successfully. Our team will contact you soon.</p>' +
          '<button type="button" class="register-modal__submit" data-contact-thanks-close>Close</button>' +
          "</div>";
        document.body.appendChild(dialog);

        dialog.addEventListener("click", function (e) {
          if (e.target === dialog || (e.target.closest && e.target.closest("[data-contact-thanks-close]"))) {
            if (typeof dialog.close === "function") dialog.close();
            else dialog.removeAttribute("open");
          }
        });
      }

      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }

    function sendContactMessage(fd) {
      var payload = new FormData();
      payload.append("_subject", "Website contact message - Green Logistics");
      payload.append("_template", "table");
      payload.append("_captcha", "false");
      payload.append("First name", fd.get("name") || "");
      payload.append("Last name", fd.get("surname") || "");
      payload.append("Email", fd.get("email") || "");
      payload.append("Phone", fd.get("phone") || "");
      payload.append("Message", fd.get("message") || "");
      payload.append("Privacy accepted", fd.get("privacy") || "");
      payload.append("Page", window.location.href);
      payload.append("Submitted at", new Date().toISOString());

      return fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: payload,
      }).then(function (res) {
        if (!res.ok) throw new Error("request failed");
        return res.json().then(function (data) {
          if (data && String(data.success).toLowerCase() === "false") {
            throw new Error(data.message || "FormSubmit rejected the message");
          }
          return data;
        });
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"]');
      var fd = new FormData(form);

      formStatus.textContent = "Sending your message...";
      formStatus.classList.remove("is-error");
      if (submitBtn) submitBtn.disabled = true;

      sendContactMessage(fd).then(
        function () {
          var quoteEmail = GLPortal.normEmail(fd.get("email"));
          if (quoteEmail && GLPortal.getAccount(quoteEmail)) {
            GLPortal.addShipmentFromQuote(quoteEmail, fd.get("message") || "");
          }
          form.reset();
          formStatus.textContent = "";
          contactShowThankYou();
        },
        function () {
          formStatus.textContent = "Auto-send failed. Opening your email app as backup.";
          formStatus.classList.add("is-error");
          contactMailtoFallback(fd);
        }
      ).finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  var serviceCenterTool = document.querySelector("[data-service-center-tool]");
  if (serviceCenterTool) {
    var serviceCenterForm = serviceCenterTool.querySelector("[data-service-center-form]");
    var serviceCenterSummary = serviceCenterTool.querySelector("[data-service-center-summary]");
    var serviceCenterResults = serviceCenterTool.querySelector("[data-service-center-results]");
    var serviceCenterMap = serviceCenterTool.querySelector("[data-service-center-map]");
    var serviceCenterStateNames = {
      AL: "Alabama",
      AK: "Alaska",
      AZ: "Arizona",
      AR: "Arkansas",
      CA: "California",
      CO: "Colorado",
      CT: "Connecticut",
      DE: "Delaware",
      FL: "Florida",
      GA: "Georgia",
      IL: "Illinois",
      IN: "Indiana",
      IA: "Iowa",
      KS: "Kansas",
      KY: "Kentucky",
      LA: "Louisiana",
      MD: "Maryland",
      MA: "Massachusetts",
      MI: "Michigan",
      MN: "Minnesota",
      MO: "Missouri",
      NC: "North Carolina",
      NJ: "New Jersey",
      NM: "New Mexico",
      NV: "Nevada",
      NY: "New York",
      OH: "Ohio",
      OK: "Oklahoma",
      OR: "Oregon",
      PA: "Pennsylvania",
      SC: "South Carolina",
      TN: "Tennessee",
      TX: "Texas",
      UT: "Utah",
      VA: "Virginia",
      WA: "Washington",
      WI: "Wisconsin",
    };
    var serviceCenterSearches = [
      {
        title: "Truck service centers",
        query: "truck service center",
        services: ["Truck repair", "Fleet service", "Roadside support"],
        note: "Best general search for shops that service commercial trucks and fleet equipment.",
      },
      {
        title: "Diesel repair shops",
        query: "diesel truck repair",
        services: ["Diesel diagnostics", "Engine repair", "Preventive maintenance"],
        note: "Use this for engine, drivetrain, diagnostics and heavy-duty diesel repair options.",
      },
      {
        title: "Truck tire service",
        query: "semi truck tire service",
        services: ["Tire repair", "Tire replacement", "Emergency tire support"],
        note: "Find commercial tire shops and mobile tire support near the selected location.",
      },
      {
        title: "Trailer repair centers",
        query: "semi trailer repair",
        services: ["Trailer repair", "Door repair", "Brakes and lights"],
        note: "Use this for trailer, dry van, reefer, flatbed and DOT repair searches.",
      },
      {
        title: "Truck stops with service",
        query: "truck stop service center",
        services: ["Truck stop", "Maintenance bay", "Driver support"],
        note: "Find truck stops that may offer service bays, inspections, tires or maintenance.",
      },
    ];

    function serviceCenterEscape(value) {
      return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[ch];
      });
    }

    function serviceCenterLocationLabel(zip, state) {
      if (zip) return zip;
      if (state) return serviceCenterStateNames[state] || state;
      return "18966";
    }

    function serviceCenterQuery(search, zip, state) {
      return search.query + " near " + serviceCenterLocationLabel(zip, state);
    }

    function serviceCenterMapsUrl(query) {
      return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
    }

    function serviceCenterEmbedUrl(query) {
      return "https://www.google.com/maps?q=" + encodeURIComponent(query) + "&output=embed";
    }

    function renderServiceCenters(zip, state) {
      var locationLabel = serviceCenterLocationLabel(zip, state);
      var primaryQuery = serviceCenterQuery(serviceCenterSearches[0], zip, state);
      if (serviceCenterSummary) {
        serviceCenterSummary.textContent =
          "Showing Google Maps searches for real truck service centers near " + locationLabel + ". Open any result on the map to see current phone, hours, reviews and directions.";
      }
      if (serviceCenterMap) {
        serviceCenterMap.src = serviceCenterEmbedUrl(primaryQuery);
      }
      if (!serviceCenterResults) return;

      serviceCenterResults.innerHTML = serviceCenterSearches.map(function (search, index) {
        var query = serviceCenterQuery(search, zip, state);
        var services = search.services.map(function (service) {
          return '<span class="service-center-pill">' + serviceCenterEscape(service) + "</span>";
        }).join("");

        return (
          '<article class="service-center-card' + (index === 0 ? " is-primary" : "") + '">' +
          "<h3>" + serviceCenterEscape(search.title) + "</h3>" +
          '<p><strong>Search area:</strong> ' + serviceCenterEscape(locationLabel) + "</p>" +
          '<p><strong>Google Maps query:</strong> ' + serviceCenterEscape(query) + "</p>" +
          '<p>' + serviceCenterEscape(search.note) + "</p>" +
          '<div class="service-center-services" aria-label="Services">' + services + "</div>" +
          '<div class="service-center-actions">' +
          '<a class="btn btn-primary" href="' + serviceCenterMapsUrl(query) + '" target="_blank" rel="noopener noreferrer">Open real results in Google Maps</a>' +
          '<button class="btn btn-ghost" type="button" data-service-center-map-query="' + serviceCenterEscape(query) + '">Show on map</button>' +
          "</div>" +
          "</article>"
        );
      }).join("");

      serviceCenterResults.querySelectorAll("[data-service-center-map-query]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (serviceCenterMap) serviceCenterMap.src = serviceCenterEmbedUrl(btn.getAttribute("data-service-center-map-query"));
        });
      });
    }

    if (serviceCenterForm) {
      serviceCenterForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(serviceCenterForm);
        var zip = String(fd.get("zip") || "").replace(/\D/g, "").slice(0, 5);
        var state = String(fd.get("state") || "").toUpperCase();
        renderServiceCenters(zip, state);
      });
    }

    renderServiceCenters("", "PA");
  }

  var root = document.querySelector("[data-carousel]");
  if (root) {
    var slides = root.querySelectorAll("[data-carousel-slide]");
    var dotsWrap = root.querySelector("[data-carousel-dots]");
    var prev = root.querySelector("[data-carousel-prev]");
    var next = root.querySelector("[data-carousel-next]");
    var i = 0;
    var n = slides.length;

    function show(idx) {
      i = (idx + n) % n;
      slides.forEach(function (s, j) {
        s.classList.toggle("is-active", j === i);
      });
      if (dotsWrap) {
        dotsWrap.querySelectorAll("button").forEach(function (b, j) {
          b.setAttribute("aria-selected", j === i ? "true" : "false");
        });
      }
    }

    if (dotsWrap) {
      if (dotsWrap.children.length === 0) {
        for (var d = 0; d < n; d++) {
          (function (di) {
            var b = document.createElement("button");
            b.type = "button";
            b.setAttribute("aria-label", "Slide " + (di + 1));
            b.addEventListener("click", function () {
              show(di);
            });
            dotsWrap.appendChild(b);
          })(d);
        }
      } else {
        dotsWrap.querySelectorAll("button").forEach(function (b, j) {
          b.addEventListener("click", function () { show(j); });
        });
      }
    }

    if (prev) prev.addEventListener("click", function () { show(i - 1); });
    if (next) next.addEventListener("click", function () { show(i + 1); });

    var t = setInterval(function () { show(i + 1); }, 7000);
    root.addEventListener("mouseenter", function () { clearInterval(t); });
    root.addEventListener("mouseleave", function () {
      t = setInterval(function () { show(i + 1); }, 7000);
    });

    show(0);
  }

  var transitForm = document.querySelector("[data-transit-form]");
  if (transitForm) {
    transitForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var distance = parseFloat(transitForm.querySelector("[name='distance']").value || "0");
      var mode = transitForm.querySelector("[name='mode']").value;
      var status = transitForm.querySelector("[data-transit-result]");
      var speed = mode === "expedited" ? 780 : mode === "ltl" ? 430 : 620;
      var days = Math.max(1, Math.ceil(distance / speed));
      var eta = new Date();
      eta.setDate(eta.getDate() + days);
      if (status) {
        status.textContent = "Estimated transit: " + days + " day(s). Estimated delivery: " + eta.toLocaleDateString();
      }
    });
  }

  var densityForm = document.querySelector("[data-density-form]");
  if (densityForm) {
    densityForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var weight = parseFloat(densityForm.querySelector("[name='weight']").value || "0");
      var length = parseFloat(densityForm.querySelector("[name='length']").value || "0");
      var width = parseFloat(densityForm.querySelector("[name='width']").value || "0");
      var height = parseFloat(densityForm.querySelector("[name='height']").value || "0");
      var result = densityForm.querySelector("[data-density-result]");
      var cubicFeet = (length * width * height) / 1728;
      var density = cubicFeet > 0 ? weight / cubicFeet : 0;
      var freightClass = "175";
      if (density >= 50) freightClass = "50";
      else if (density >= 35) freightClass = "55";
      else if (density >= 30) freightClass = "60";
      else if (density >= 22.5) freightClass = "65";
      else if (density >= 15) freightClass = "70";
      else if (density >= 13.5) freightClass = "77.5";
      else if (density >= 12) freightClass = "85";
      else if (density >= 10.5) freightClass = "92.5";
      else if (density >= 9) freightClass = "100";
      else if (density >= 8) freightClass = "110";
      else if (density >= 7) freightClass = "125";
      else if (density >= 6) freightClass = "150";
      if (result) {
        result.textContent = "Density: " + density.toFixed(2) + " lb/ft³. Estimated NMFC class: " + freightClass + ".";
      }
    });
  }

  var reviewsRoots = document.querySelectorAll("[data-reviews-root]");
  if (reviewsRoots.length) {
    var reviewsJsonUrl = "assets/data/google-reviews.json";
    var reviewsFetchPromise = null;

    function fetchReviewsJson() {
      if (!reviewsFetchPromise) {
        if (typeof window.__GOOGLE_REVIEWS_DATA__ === "object" && window.__GOOGLE_REVIEWS_DATA__ !== null) {
          reviewsFetchPromise = Promise.resolve(window.__GOOGLE_REVIEWS_DATA__);
        } else {
          reviewsFetchPromise = fetch(reviewsJsonUrl, { credentials: "same-origin" }).then(function (res) {
            if (!res.ok) throw new Error("reviews json " + res.status);
            return res.json();
          });
        }
      }
      return reviewsFetchPromise;
    }

    function starChars(count) {
      var n = Math.max(0, Math.min(5, Math.round(Number(count) || 0)));
      var s = "";
      for (var i = 0; i < n; i++) s += "\u2605";
      return s;
    }

    function appendAggregateStars(container, rating) {
      var r = Math.max(0, Math.min(5, Number(rating) || 0));
      container.className = "reviews-stars reviews-stars--aggregate";
      container.setAttribute("aria-label", "Overall rating: " + r + " out of 5 stars");
      container.textContent = "";
      for (var si = 0; si < 5; si++) {
        var fill = Math.min(1, Math.max(0, r - si));
        var cell = document.createElement("span");
        cell.className = "reviews-aggregate-star-cell";
        var ghost = document.createElement("span");
        ghost.className = "reviews-aggregate-star-ghost";
        ghost.textContent = "\u2605";
        ghost.setAttribute("aria-hidden", "true");
        cell.appendChild(ghost);
        if (fill > 0.001) {
          var fg = document.createElement("span");
          fg.className = "reviews-aggregate-star-fill";
          fg.textContent = "\u2605";
          fg.style.width = Math.round(fill * 100) + "%";
          fg.setAttribute("aria-hidden", "true");
          cell.appendChild(fg);
        }
        container.appendChild(cell);
      }
    }

    function addGoogleWordmark(span) {
      span.className = "google-logo-word";
      span.setAttribute("aria-hidden", "true");
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 272 92");
      svg.setAttribute("focusable", "false");
      var paths = [
        ["#EA4335", "M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"],
        ["#FBBC05", "M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"],
        ["#4285F4", "M209.75 26.34v39.82c0 16.38-9.66 23.16-21.08 23.16-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.38 21.25-22.38 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"],
        ["#34A853", "M225 3v65h-9.5V3h9.5z"],
        ["#EA4335", "M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98c-1.51 2.44-2.27 5.63-2.27 8.82v1.01l18.06-7.56c-.92-2.35-3.7-6.63-10.33-6.63-6.21 0-11.09 4.12-12.46 4.36z"],
        ["#4285F4", "M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"]
      ];
      for (var pi = 0; pi < paths.length; pi++) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", paths[pi][0]);
        path.setAttribute("d", paths[pi][1]);
        svg.appendChild(path);
      }
      span.appendChild(svg);
    }

    function addGoogleGMark(wrap, markClass) {
      wrap.className = markClass || "review-google-mark";
      wrap.setAttribute("aria-hidden", "true");
      wrap.setAttribute("title", "Google review");
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("focusable", "false");
      var paths = [
        ["#4285F4", "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"],
        ["#34A853", "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"],
        ["#FBBC05", "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"],
        ["#EA4335", "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"]
      ];
      for (var gi = 0; gi < paths.length; gi++) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", paths[gi][0]);
        path.setAttribute("d", paths[gi][1]);
        svg.appendChild(path);
      }
      wrap.appendChild(svg);
    }

    function addVerifiedIcon(wrap) {
      wrap.className = "review-verified";
      wrap.setAttribute("aria-label", "Verified review");
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("focusable", "false");
      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "12");
      circle.setAttribute("fill", "#1a73e8");
      var tick = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tick.setAttribute("fill", "#fff");
      tick.setAttribute("d", "M10.2 16.4 6.8 13l1.1-1.2 2.2 2.2 5.8-5.8 1.2 1.1-6.9 6.9z");
      svg.appendChild(circle);
      svg.appendChild(tick);
      wrap.appendChild(svg);
    }

    function appendStarRowVisual(wrap, rating) {
      var n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
      wrap.className = "reviews-rich-stars";
      wrap.setAttribute("aria-label", "Rating: " + n + " out of 5 stars");
      for (var si = 0; si < 5; si++) {
        var bit = document.createElement("span");
        bit.className = "reviews-rich-star" + (si < n ? " reviews-rich-star--on" : " reviews-rich-star--off");
        bit.textContent = "\u2605";
        bit.setAttribute("aria-hidden", "true");
        wrap.appendChild(bit);
      }
    }

    function normalizeReviewsCards(raw) {
      if (!Array.isArray(raw)) return [];
      var out = [];
      for (var i = 0; i < raw.length; i++) {
        var c = raw[i];
        if (c && typeof c === "object" && c.avatarImage && c.text) {
          out.push({
            name: c.name != null ? String(c.name) : "Customer",
            stars: c.stars != null ? Number(c.stars) : 5,
            dateLabel: c.dateLabel != null ? String(c.dateLabel) : "",
            profileMeta: c.profileMeta != null ? String(c.profileMeta) : "",
            avatarImage: String(c.avatarImage),
            avatarPosition: c.avatarPosition != null ? String(c.avatarPosition) : "15% 14%",
            text: String(c.text),
            photo: c.photo != null ? String(c.photo) : ""
          });
        }
      }
      return out;
    }

    function buildRichReviewCard(c, eagerLoad) {
      var article = document.createElement("article");
      article.className = "reviews-rich-card";

      var menuDots = document.createElement("button");
      menuDots.type = "button";
      menuDots.className = "reviews-rich-menu";
      menuDots.setAttribute("aria-label", "Review options");
      menuDots.textContent = "\u22EE";
      article.appendChild(menuDots);

      var top = document.createElement("div");
      top.className = "reviews-rich-top";

      var av = document.createElement("div");
      av.className = "reviews-rich-avatar";
      av.style.setProperty("--avatar-pos", c.avatarPosition || "15% 14%");
      var fallbackInitial = document.createElement("span");
      fallbackInitial.className = "reviews-rich-avatar-fallback";
      fallbackInitial.textContent = c.name && String(c.name).length ? String(c.name).charAt(0).toUpperCase() : "?";
      av.appendChild(fallbackInitial);
      var avImg = document.createElement("img");
      avImg.src = c.avatarImage;
      avImg.alt = "";
      avImg.loading = eagerLoad ? "eager" : "lazy";
      avImg.decoding = "async";
      avImg.addEventListener("error", function () {
        av.classList.add("reviews-rich-avatar--fallback");
      }, { once: true });
      avImg.addEventListener("load", function () {
        av.classList.remove("reviews-rich-avatar--fallback");
      });
      av.appendChild(avImg);
      top.appendChild(av);

      var col = document.createElement("div");
      col.className = "reviews-rich-meta";
      var h = document.createElement("h3");
      h.className = "reviews-rich-name";
      h.textContent = c.name;
      col.appendChild(h);
      if (c.profileMeta) {
        var metaTop = document.createElement("p");
        metaTop.className = "reviews-rich-profile-meta";
        metaTop.textContent = c.profileMeta;
        col.appendChild(metaTop);
      }

      var row = document.createElement("div");
      row.className = "reviews-rich-rating-row";
      var starsWrap = document.createElement("span");
      appendStarRowVisual(starsWrap, c.stars);
      row.appendChild(starsWrap);
      var timeEl = document.createElement("span");
      timeEl.className = "reviews-rich-date";
      timeEl.textContent = c.dateLabel;
      row.appendChild(timeEl);
      col.appendChild(row);
      top.appendChild(col);
      article.appendChild(top);

      var body = document.createElement("p");
      body.className = "reviews-rich-body";
      body.textContent = c.text;
      article.appendChild(body);

      if (c.photo) {
        var media = document.createElement("div");
        media.className = "reviews-rich-media";
        var mediaImg = document.createElement("img");
        mediaImg.src = String(c.photo);
        mediaImg.alt = "Photo from customer review";
        mediaImg.loading = "lazy";
        mediaImg.decoding = "async";
        media.appendChild(mediaImg);
        article.appendChild(media);
      }

      return article;
    }

    function buildReviewsRichSlideGrid(chunk, eager) {
      var inner = document.createElement("div");
      inner.className = "reviews-rich-slide-grid";
      for (var i = 0; i < chunk.length; i++) {
        inner.appendChild(buildRichReviewCard(chunk[i], eager && i < 3));
      }
      return inner;
    }

    function initReviewsRichCarousel(wrap, slideCount) {
      var track = wrap.querySelector(".reviews-rich-carousel-track");
      var prev = wrap.querySelector(".reviews-rich-carousel-btn--prev");
      var next = wrap.querySelector(".reviews-rich-carousel-btn--next");
      var dots = wrap.querySelectorAll(".reviews-rich-carousel-dot");
      if (!track || slideCount < 2) {
        if (prev) prev.hidden = true;
        if (next) next.hidden = true;
        var dotsRow = wrap.querySelector(".reviews-rich-carousel-dots");
        if (dotsRow) dotsRow.hidden = true;
        return;
      }

      var idx = 0;
      var reducedMotion =
        typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var autoplayMs = reducedMotion ? 0 : 7800;
      var timer = null;

      function apply() {
        track.style.transform = "translate3d(" + -idx * 100 + "%,0,0)";
        for (var di = 0; di < dots.length; di++) {
          dots[di].classList.toggle("reviews-rich-carousel-dot--active", di === idx);
          dots[di].setAttribute("aria-current", di === idx ? "true" : "false");
        }
      }

      function go(delta) {
        idx = (idx + delta + slideCount) % slideCount;
        apply();
        restartAutoplay();
      }

      function goTo(i) {
        idx = Math.max(0, Math.min(slideCount - 1, i));
        apply();
        restartAutoplay();
      }

      function restartAutoplay() {
        if (timer) clearInterval(timer);
        timer = null;
        if (autoplayMs > 0) {
          timer = window.setInterval(function () {
            go(1);
          }, autoplayMs);
        }
      }

      prev.addEventListener("click", function () {
        go(-1);
      });
      next.addEventListener("click", function () {
        go(1);
      });
      for (var d = 0; d < dots.length; d++) {
        (function (i) {
          dots[i].addEventListener("click", function () {
            goTo(i);
          });
        })(d);
      }

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          if (timer) clearInterval(timer);
          timer = null;
        } else restartAutoplay();
      });

      apply();
      restartAutoplay();
    }

    function buildReviewsRichCarousel(cards) {
      var wrap = document.createElement("div");
      wrap.className = "reviews-rich-feed";
      wrap.setAttribute("role", "region");
      wrap.setAttribute("aria-label", "Google reviews");
      for (var i = 0; i < cards.length; i++) {
        wrap.appendChild(buildRichReviewCard(cards[i], i < 2));
      }
      return wrap;
    }

    function renderReviewsInto(root, data) {
      root.textContent = "";
      root.classList.remove("reviews-widget--pending", "reviews-widget--slides", "reviews-widget--rich", "reviews-widget--feed");
      var agg = data.aggregate || {};
      var ratingVal = agg.ratingValue != null ? Number(agg.ratingValue) : 0;
      var reviewCount = agg.reviewCount != null ? Number(agg.reviewCount) : 0;
      var headline = agg.headline != null ? String(agg.headline) : "Excellent";
      var writeUrl = data.writeReviewUrl ? String(data.writeReviewUrl) : "#";

      var head = document.createElement("div");
      head.className = "reviews-head";
      var titleRow = document.createElement("div");
      titleRow.className = "reviews-title-row";

      var logoSpan = document.createElement("span");
      addGoogleWordmark(logoSpan);
      titleRow.appendChild(logoSpan);

      var hl = document.createElement("span");
      hl.className = "reviews-headline";
      var strong = document.createElement("strong");
      strong.textContent = headline;
      hl.appendChild(strong);
      titleRow.appendChild(hl);

      var starsTop = document.createElement("span");
      appendAggregateStars(starsTop, ratingVal);
      titleRow.appendChild(starsTop);

      var meta = document.createElement("span");
      meta.className = "reviews-meta";
      var ratingDisplay = parseFloat(Number(ratingVal).toFixed(1));
      meta.textContent = ratingDisplay + " \u00b7 " + reviewCount + " reviews";
      titleRow.appendChild(meta);

      head.appendChild(titleRow);

      var btn = document.createElement("a");
      btn.className = "reviews-btn";
      btn.href = writeUrl;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.title = "Leave a review on Google (sign in with your Google account)";
      btn.textContent = "Write a review";
      head.appendChild(btn);

      var richCards = normalizeReviewsCards(data.reviewsCards);
      if (richCards.length) {
        root.classList.add("reviews-widget--slides", "reviews-widget--rich", "reviews-widget--feed");
        root.appendChild(buildReviewsRichCarousel(richCards));
        return;
      }

      root.appendChild(head);

      var grid = document.createElement("div");
      grid.className = "reviews-grid";

      var list = Array.isArray(data.reviews) ? data.reviews : [];
      for (var ri = 0; ri < list.length; ri++) {
        var rev = list[ri] || {};
        var card = document.createElement("article");
        card.className = "review-card";

        var gWrap = document.createElement("div");
        addGoogleGMark(gWrap);
        card.appendChild(gWrap);

        var top = document.createElement("div");
        top.className = "review-card-top";

        var av = document.createElement("div");
        av.className = "review-avatar";
        av.setAttribute("aria-hidden", "true");
        av.textContent = rev.initial != null && String(rev.initial).length ? String(rev.initial).charAt(0) : (rev.name ? String(rev.name).charAt(0) : "?");
        top.appendChild(av);

        var who = document.createElement("div");
        who.className = "review-who";
        var h3 = document.createElement("h3");
        h3.textContent = rev.name != null ? String(rev.name) : "";
        who.appendChild(h3);
        var dateP = document.createElement("p");
        dateP.className = "review-date";
        dateP.textContent = rev.date != null ? String(rev.date) : "";
        who.appendChild(dateP);
        top.appendChild(who);
        card.appendChild(top);

        var starRow = document.createElement("p");
        starRow.className = "review-stars-row";
        var rs = document.createElement("span");
        rs.className = "review-stars";
        rs.setAttribute("aria-hidden", "true");
        rs.textContent = starChars(rev.stars != null ? rev.stars : 5);
        starRow.appendChild(rs);
        var ver = document.createElement("span");
        addVerifiedIcon(ver);
        starRow.appendChild(ver);
        card.appendChild(starRow);

        var txt = document.createElement("p");
        txt.className = "review-text";
        txt.textContent = rev.text != null ? String(rev.text) : "";
        card.appendChild(txt);

        if (rev.photo) {
          var media = document.createElement("div");
          media.className = "review-media";
          var img = document.createElement("img");
          img.src = String(rev.photo);
          img.width = 120;
          img.height = 72;
          img.alt = "Photo from customer review";
          media.appendChild(img);
          card.appendChild(media);
        }

        grid.appendChild(card);
      }

      root.appendChild(grid);
    }

    function showReviewsError(root) {
      root.classList.remove("reviews-widget--pending");
      root.textContent = "";
      var p = document.createElement("p");
      p.className = "reviews-fallback-msg";
      p.appendChild(document.createTextNode("Could not load reviews from "));
      var a = document.createElement("a");
      a.href = "https://g.page/r/CYnYasDBg-hSEAE";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Google";
      p.appendChild(a);
      p.appendChild(document.createTextNode(". Add "));
      var c1 = document.createElement("code");
      c1.textContent = "assets/data/google-reviews.js";
      p.appendChild(c1);
      p.appendChild(document.createTextNode(" before main.js, or open via a local server so "));
      var c2 = document.createElement("code");
      c2.textContent = "google-reviews.json";
      p.appendChild(c2);
      p.appendChild(document.createTextNode(" can load."));
      root.appendChild(p);
    }

    fetchReviewsJson().then(
      function (data) {
        reviewsRoots.forEach(function (root) {
          renderReviewsInto(root, data);
        });
      },
      function () {
        reviewsRoots.forEach(showReviewsError);
      }
    );
  }

  var reviewsMarquee = document.querySelector("[data-reviews-marquee]");
  if (reviewsMarquee) {
    var marqueeTrack = reviewsMarquee.querySelector(".home-reviews-marquee-track");
    var marqueeGroup = reviewsMarquee.querySelector(".home-reviews-marquee-group");
    if (
      marqueeTrack &&
      marqueeGroup &&
      !marqueeTrack.querySelector("[data-marquee-clone]")
    ) {
      var marqueeClone = marqueeGroup.cloneNode(true);
      marqueeClone.setAttribute("data-marquee-clone", "");
      marqueeClone.setAttribute("aria-hidden", "true");
      marqueeClone.querySelectorAll("a").forEach(function (a) {
        a.setAttribute("tabindex", "-1");
      });
      marqueeTrack.appendChild(marqueeClone);
    }
  }

  var plexusRoot = document.querySelector("[data-plexus]");
  var plexusCanvas = document.querySelector("[data-plexus-canvas]");
  if (
    plexusRoot &&
    plexusCanvas &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    var plexusCtx = plexusCanvas.getContext("2d");
    var plexusPoints = [];
    var plexusN = 56;
    var plexusMaxDist = 118;
    var plexusRaf = 0;
    var plexusW = 0;
    var plexusH = 0;

    function plexusResize() {
      var rect = plexusRoot.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(rect.width));
      var h = Math.max(1, Math.floor(rect.height));
      if (w === plexusW && h === plexusH && plexusPoints.length) return;
      plexusW = w;
      plexusH = h;
      plexusCanvas.width = Math.floor(w * dpr);
      plexusCanvas.height = Math.floor(h * dpr);
      plexusCanvas.style.width = w + "px";
      plexusCanvas.style.height = h + "px";
      plexusCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      plexusPoints = [];
      var i;
      for (i = 0; i < plexusN; i++) {
        plexusPoints.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.38,
          vy: (Math.random() - 0.5) * 0.38,
        });
      }
    }

    function plexusStep() {
      var i;
      var j;
      var dx;
      var dy;
      var d;
      var a;
      var w = plexusW;
      var h = plexusH;
      if (!w || !h || !plexusPoints.length) return;
      for (i = 0; i < plexusPoints.length; i++) {
        var p = plexusPoints[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= w) p.vx *= -1;
        if (p.y <= 0 || p.y >= h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }
      plexusCtx.clearRect(0, 0, w, h);
      for (i = 0; i < plexusPoints.length; i++) {
        for (j = i + 1; j < plexusPoints.length; j++) {
          dx = plexusPoints[i].x - plexusPoints[j].x;
          dy = plexusPoints[i].y - plexusPoints[j].y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < plexusMaxDist) {
            a = 0.14 * (1 - d / plexusMaxDist);
            plexusCtx.strokeStyle = "rgba(160, 210, 255, " + a.toFixed(3) + ")";
            plexusCtx.lineWidth = 0.6;
            plexusCtx.beginPath();
            plexusCtx.moveTo(plexusPoints[i].x, plexusPoints[i].y);
            plexusCtx.lineTo(plexusPoints[j].x, plexusPoints[j].y);
            plexusCtx.stroke();
          }
        }
      }
      plexusCtx.fillStyle = "rgba(200, 230, 255, 0.55)";
      for (i = 0; i < plexusPoints.length; i++) {
        plexusCtx.beginPath();
        plexusCtx.arc(plexusPoints[i].x, plexusPoints[i].y, 1.35, 0, Math.PI * 2);
        plexusCtx.fill();
      }
    }

    function plexusLoop() {
      plexusStep();
      plexusRaf = window.requestAnimationFrame(plexusLoop);
    }

    var plexusResizeTimer = 0;
    function plexusOnResize() {
      window.clearTimeout(plexusResizeTimer);
      plexusResizeTimer = window.setTimeout(function () {
        plexusResize();
      }, 120);
    }

    function plexusBoot() {
      plexusResize();
      if (plexusW < 2 || plexusH < 2) {
        window.requestAnimationFrame(plexusBoot);
        return;
      }
      plexusRaf = window.requestAnimationFrame(plexusLoop);
    }

    plexusBoot();
    window.addEventListener("resize", plexusOnResize, { passive: true });
  }

  var flagsMarquee = document.querySelector("[data-flags-marquee]");
  if (flagsMarquee) {
    var flagsTrack = flagsMarquee.querySelector(".home-flags-track");
    var flagsGroup = flagsMarquee.querySelector(".home-flags-group");
    if (
      flagsTrack &&
      flagsGroup &&
      !flagsTrack.querySelector("[data-flags-marquee-clone]")
    ) {
      var flagsClone = flagsGroup.cloneNode(true);
      flagsClone.setAttribute("data-flags-marquee-clone", "");
      flagsClone.setAttribute("aria-hidden", "true");
      flagsClone.querySelectorAll("a").forEach(function (a) {
        a.setAttribute("tabindex", "-1");
      });
      flagsTrack.appendChild(flagsClone);
    }
  }

  var registerTriggers = document.querySelectorAll("[data-register-modal]");
  if (registerTriggers.length) {
    var REG_EMAIL = "info@greengrouplogistics.com";
    var REG_ENDPOINT = "https://formsubmit.co/ajax/" + REG_EMAIL;
    var FORM_SUBMIT_ENABLED = true;
    // Paste your Google Apps Script Web App URL here to log registrations into Google Sheets.
    var SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwQpM8pb4MzkfiA20v8FOjFIBKmxAOKmYokVAce9us-mIsV6PZhnTv5EpuvyVbicXF8WQ/exec";
    var registerDialog = document.getElementById("register-modal");

    if (!registerDialog) {
      registerDialog = document.createElement("dialog");
      registerDialog.id = "register-modal";
      registerDialog.className = "register-modal";
      registerDialog.setAttribute("aria-labelledby", "register-modal-title");
      registerDialog.innerHTML =
        '<div class="register-modal__panel">' +
        '<button type="button" class="register-modal__close" data-register-close aria-label="Close">&times;</button>' +
        '<h2 class="register-modal__title" id="register-modal-title">Register</h2>' +
        '<div class="register-modal__step" data-register-step="pick">' +
        '<p class="register-modal__hint">Choose how you work with us:</p>' +
        '<div class="register-modal__choices">' +
        '<button type="button" class="register-modal__choice" data-register-go="customer">CUSTOMER</button>' +
        '<button type="button" class="register-modal__choice register-modal__choice--secondary" data-register-go="carrier">CARRIER</button>' +
        "</div></div>" +
        '<div class="register-modal__step" data-register-step="customer" hidden>' +
        '<button type="button" class="register-modal__back" data-register-go="pick">&larr; Back</button>' +
        '<form class="register-modal__form" id="register-form-customer">' +
        '<label class="register-modal__hp" aria-hidden="true">Leave empty<input name="_honey" type="text" tabindex="-1" autocomplete="off"></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">First name</span><input name="firstName" type="text" autocomplete="given-name" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Last name</span><input name="lastName" type="text" autocomplete="family-name" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Company name <span class="register-modal__opt">(optional)</span></span><input name="company" type="text" autocomplete="organization"></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Email (for portal login)</span><input name="email" type="email" autocomplete="email" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Create password</span><input name="portalPassword" type="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters"></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Phone number</span><input name="phone" type="tel" autocomplete="tel" required></label>' +
        '<p class="register-modal__mailnote">After confirm, your registration is sent directly to <strong>' +
        REG_EMAIL +
        "</strong>.</p>" +
        '<p class="register-modal__status" data-register-status="customer" hidden></p>' +
        '<button type="submit" class="register-modal__submit">Confirm</button>' +
        "</form></div>" +
        '<div class="register-modal__step" data-register-step="carrier" hidden>' +
        '<button type="button" class="register-modal__back" data-register-go="pick">&larr; Back</button>' +
        '<form class="register-modal__form" id="register-form-carrier">' +
        '<label class="register-modal__hp" aria-hidden="true">Leave empty<input name="_honey" type="text" tabindex="-1" autocomplete="off"></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">First name</span><input name="firstName" type="text" autocomplete="given-name" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Last name</span><input name="lastName" type="text" autocomplete="family-name" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Company name</span><input name="company" type="text" autocomplete="organization" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">MC#</span><input name="mc" type="text" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">DOT#</span><input name="dot" type="text" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Email (for portal login)</span><input name="email" type="email" autocomplete="email" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Create password</span><input name="portalPassword" type="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters"></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">Phone number</span><input name="phone" type="tel" autocomplete="tel" required></label>' +
        '<label class="register-modal__field"><span class="register-modal__label">How many trucks do you have?</span><input name="trucks" type="text" required></label>' +
        '<p class="register-modal__mailnote">After confirm, your registration is sent directly to <strong>' +
        REG_EMAIL +
        "</strong>.</p>" +
        '<p class="register-modal__status" data-register-status="carrier" hidden></p>' +
        '<button type="submit" class="register-modal__submit">Confirm</button>' +
        "</form></div></div>";
      document.body.appendChild(registerDialog);
    }

    function registerShowStep(step) {
      registerDialog.querySelectorAll("[data-register-step]").forEach(function (el) {
        el.hidden = el.getAttribute("data-register-step") !== step;
      });
    }

    function registerResetForms() {
      var fc = document.getElementById("register-form-customer");
      var fca = document.getElementById("register-form-carrier");
      if (fc) fc.reset();
      if (fca) fca.reset();
      registerDialog.querySelectorAll("[data-register-status]").forEach(function (el) {
        el.hidden = true;
        el.textContent = "";
        el.classList.remove("is-error");
      });
    }

    function registerSetStatus(kind, message, isError) {
      var status = registerDialog.querySelector('[data-register-status="' + kind + '"]');
      if (!status) return;
      status.hidden = false;
      status.textContent = message;
      status.classList.toggle("is-error", !!isError);
    }

    function registerMailtoFallback(subjectLine, lines) {
      var subject = encodeURIComponent(subjectLine);
      var body = encodeURIComponent(lines.join("\n"));
      window.location.href = "mailto:" + REG_EMAIL + "?subject=" + subject + "&body=" + body;
    }

    function sendRegistration(payload) {
      if (!FORM_SUBMIT_ENABLED) return Promise.resolve(false);

      return fetch(REG_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }).then(function (res) {
        if (!res.ok) throw new Error("request failed");
        return res.json().then(function (data) {
          if (data && String(data.success).toLowerCase() === "false") {
            throw new Error(data.message || "FormSubmit rejected the request");
          }
          return data;
        });
      });
    }

    function sendRegistrationToSheets(payload) {
      if (
        !SHEETS_ENDPOINT ||
        typeof SHEETS_ENDPOINT !== "string" ||
        !/^https?:\/\//i.test(SHEETS_ENDPOINT)
      ) {
        return Promise.resolve();
      }

      return new Promise(function (resolve) {
        var iframeName = "gl-sheets-submit-" + Date.now();
        var iframe = document.createElement("iframe");
        var form = document.createElement("form");
        var settled = false;
        var timeoutId;

        function cleanup(result) {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          window.setTimeout(function () {
            if (form.parentNode) form.parentNode.removeChild(form);
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          }, 100);
          resolve(result);
        }

        iframe.name = iframeName;
        iframe.style.display = "none";
        iframe.addEventListener("load", function () {
          cleanup(true);
        });

        form.method = "POST";
        form.action = SHEETS_ENDPOINT;
        form.target = iframeName;
        form.style.display = "none";

        Object.keys(payload).forEach(function (key) {
          var input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = payload[key] == null ? "" : String(payload[key]);
          form.appendChild(input);
        });

        var rawInput = document.createElement("input");
        rawInput.type = "hidden";
        rawInput.name = "rawPayload";
        rawInput.value = JSON.stringify(payload);
        form.appendChild(rawInput);

        timeoutId = window.setTimeout(function () {
          cleanup(false);
        }, 3000);

        document.body.appendChild(iframe);
        document.body.appendChild(form);
        form.submit();
      });
    }

    function finishRegistration(kind, fd) {
      registerSetStatus(kind, "Thanks! Opening your account…", false);
      window.setTimeout(function () {
        registerCloseModal();
        var prefix = "";
        var home = document.querySelector(".logo__home");
        if (home) {
          var h = home.getAttribute("href") || "";
          if (h.indexOf("../") === 0) prefix = "../";
        }
        if (fd && fd.get("email") && fd.get("portalPassword")) {
          GLPortal.login(fd.get("email"), fd.get("portalPassword"));
          window.location.href = prefix + "account.html";
          return;
        }
        window.location.href = prefix + "login.html";
      }, 700);
    }

    function registerRateLimitState() {
      var key = "gl_register_attempts";
      var now = Date.now();
      var attempts = [];
      try {
        attempts = JSON.parse(localStorage.getItem(key) || "[]");
      } catch (_e) {
        attempts = [];
      }
      attempts = attempts.filter(function (t) {
        return now - Number(t) < 10 * 60 * 1000;
      });
      return { key: key, now: now, attempts: attempts };
    }

    function registerIsRateLimited() {
      var state = registerRateLimitState();
      return state.attempts.length >= 3;
    }

    function registerMarkAttempt() {
      var state = registerRateLimitState();
      state.attempts.push(state.now);
      localStorage.setItem(state.key, JSON.stringify(state.attempts));
    }

    function registerOpenModal() {
      registerResetForms();
      registerShowStep("pick");
      if (typeof registerDialog.showModal === "function") {
        registerDialog.showModal();
      } else {
        registerDialog.setAttribute("open", "");
      }
    }

    function registerCloseModal() {
      if (typeof registerDialog.close === "function") {
        registerDialog.close();
      } else {
        registerDialog.removeAttribute("open");
      }
      registerResetForms();
      registerShowStep("pick");
    }

    registerTriggers.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        closeNav();
        registerOpenModal();
      });
    });

    registerDialog.addEventListener("click", function (e) {
      if (e.target === registerDialog) registerCloseModal();
      if (e.target.closest && e.target.closest("[data-register-close]")) {
        e.preventDefault();
        registerCloseModal();
      }
      var goBtn = e.target.closest && e.target.closest("[data-register-go]");
      if (goBtn && registerDialog.contains(goBtn)) {
        registerShowStep(goBtn.getAttribute("data-register-go"));
      }
    });

    var regFormCustomer = document.getElementById("register-form-customer");
    if (regFormCustomer) {
      regFormCustomer.addEventListener("submit", function (e) {
        e.preventDefault();
        var submitBtn = regFormCustomer.querySelector(".register-modal__submit");
        if (submitBtn) submitBtn.disabled = true;
        var fd = new FormData(regFormCustomer);
        if (fd.get("_honey")) {
          registerSetStatus("customer", "Submission blocked.", true);
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        if (registerIsRateLimited()) {
          registerSetStatus("customer", "Too many attempts. Please wait 10 minutes.", true);
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        var lines = [
          "Registration type: CUSTOMER",
          "First name: " + fd.get("firstName"),
          "Last name: " + fd.get("lastName"),
          "Company name: " + (fd.get("company") || ""),
          "Email: " + fd.get("email"),
          "Phone: " + fd.get("phone"),
        ];
        var payload = {
          _subject: "Customer registration - Green Logistics",
          registrationType: "CUSTOMER",
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          company: fd.get("company") || "",
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: lines.join("\n"),
        };
        sendRegistrationToSheets({
          submittedAt: new Date().toISOString(),
          page: window.location.href,
          _subject: payload._subject,
          registrationType: "CUSTOMER",
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          company: fd.get("company") || "",
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: payload.message,
        }).then(
          function () {
            registerMarkAttempt();
            GLPortal.saveRegisteredUser("CUSTOMER", fd);
            return sendRegistration(payload).catch(function () {
              return false;
            }).then(function () {
              finishRegistration("customer", fd);
            });
          },
          function () {
            registerSetStatus("customer", "Auto-send failed. Opening your email app as backup.", true);
            registerMailtoFallback("Customer registration - Green Logistics", lines);
          }
        ).finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
      });
    }

    var regFormCarrier = document.getElementById("register-form-carrier");
    if (regFormCarrier) {
      regFormCarrier.addEventListener("submit", function (e) {
        e.preventDefault();
        var submitBtn = regFormCarrier.querySelector(".register-modal__submit");
        if (submitBtn) submitBtn.disabled = true;
        var fd = new FormData(regFormCarrier);
        if (fd.get("_honey")) {
          registerSetStatus("carrier", "Submission blocked.", true);
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        if (registerIsRateLimited()) {
          registerSetStatus("carrier", "Too many attempts. Please wait 10 minutes.", true);
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        var lines = [
          "Registration type: CARRIER",
          "First name: " + fd.get("firstName"),
          "Last name: " + fd.get("lastName"),
          "Company name: " + fd.get("company"),
          "MC#: " + fd.get("mc"),
          "DOT#: " + fd.get("dot"),
          "Email: " + fd.get("email"),
          "Phone: " + fd.get("phone"),
          "How many trucks do you have: " + fd.get("trucks"),
        ];
        var payload = {
          _subject: "Carrier registration - Green Logistics",
          registrationType: "CARRIER",
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          company: fd.get("company"),
          mc: fd.get("mc"),
          dot: fd.get("dot"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          trucks: fd.get("trucks"),
          message: lines.join("\n"),
        };
        sendRegistrationToSheets({
          submittedAt: new Date().toISOString(),
          page: window.location.href,
          _subject: payload._subject,
          registrationType: "CARRIER",
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          company: fd.get("company"),
          mc: fd.get("mc"),
          dot: fd.get("dot"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          trucks: fd.get("trucks"),
          message: payload.message,
        }).then(
          function () {
            registerMarkAttempt();
            GLPortal.saveRegisteredUser("CARRIER", fd);
            return sendRegistration(payload).catch(function () {
              return false;
            }).then(function () {
              finishRegistration("carrier", fd);
            });
          },
          function () {
            registerSetStatus("carrier", "Auto-send failed. Opening your email app as backup.", true);
            registerMailtoFallback("Carrier registration - Green Logistics", lines);
          }
        ).finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
      });
    }
  }

  function portalNavPref() {
    var home = document.querySelector(".logo__home");
    if (home) {
      var h = home.getAttribute("href") || "";
      if (h.indexOf("../") === 0) return "../";
    }
    return "";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function portalUpdateAuthLinks() {
    var prefix = portalNavPref();
    var links = document.querySelectorAll("[data-login-link]");
    if (!links.length) return;
    var session = GLPortal.getSession();
    links.forEach(function (a) {
      if (session) {
        a.setAttribute("href", prefix + "account.html");
        a.textContent = "MY SHIPMENTS";
      } else {
        a.setAttribute("href", prefix + "login.html");
        a.textContent = "LOG IN";
      }
    });
  }
  portalUpdateAuthLinks();

  var portalPage = document.body && document.body.getAttribute("data-portal-page");
  if (portalPage === "login") {
    (function () {
      var prefix = portalNavPref();
      if (GLPortal.getSession()) {
        window.location.replace(prefix + "account.html");
        return;
      }
      var form = document.getElementById("portal-login-form");
      var err = document.getElementById("portal-login-error");
      if (!form) return;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (err) {
          err.hidden = true;
          err.textContent = "";
        }
        var fd = new FormData(form);
        var sess = GLPortal.login(fd.get("email"), fd.get("portalPassword"));
        if (sess) {
          window.location.href = prefix + "account.html";
        } else if (err) {
          err.hidden = false;
          err.textContent = "Invalid email or password. Use the same email and password you set at registration.";
        }
      });
    })();
  }

  if (portalPage === "account") {
    (function () {
      var prefix = portalNavPref();
      var session = GLPortal.getSession();
      if (!session) {
        window.location.replace(prefix + "login.html?next=account.html");
        return;
      }
      var roleLabel = session.role === "CARRIER" ? "Carrier" : "Customer";
      var nameEl = document.getElementById("portal-account-name");
      var roleEl = document.getElementById("portal-account-role");
      var emailEl = document.getElementById("portal-account-email");
      var listEl = document.getElementById("portal-shipments-list");
      var emptyEl = document.getElementById("portal-shipments-empty");
      var statLoads = document.getElementById("portal-stat-loads");
      var statMiles = document.getElementById("portal-stat-miles");
      var statSpend = document.getElementById("portal-stat-spend");
      var prof = session.profile || {};
      var displayName = [prof.firstName, prof.lastName].filter(Boolean).join(" ").trim() || session.email;
      if (nameEl) nameEl.textContent = displayName;
      if (roleEl) {
        roleEl.textContent = roleLabel;
        roleEl.classList.toggle("is-carrier", session.role === "CARRIER");
      }
      if (emailEl) emailEl.textContent = session.email;

      function formatMoney(n) {
        var num = Number(n);
        if (!isFinite(num) || num <= 0) return "—";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
      }

      function formatDate(row) {
        var raw = row.date || row.createdAt;
        if (!raw) return "—";
        var dt = new Date(raw);
        return dt && !isNaN(dt.getTime())
          ? dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
          : String(raw);
      }

      function routeLabel(row) {
        if (row.originCity || row.originState || row.destCity || row.destState) {
          var oCity = row.originCity || "";
          var oSt = row.originState || "";
          var dCity = row.destCity || "";
          var dSt = row.destState || "";
          var from = [oCity, oSt].filter(Boolean).join(", ") || row.origin || "—";
          var to = [dCity, dSt].filter(Boolean).join(", ") || row.destination || "—";
          return { from: from, to: to, states: (oSt || "—") + " → " + (dSt || "—") };
        }
        var parts = String(row.origin || "—") + " → " + String(row.destination || "—");
        return { from: row.origin || "—", to: row.destination || "—", states: parts };
      }

      function statusClass(status) {
        var s = String(status || "").toLowerCase();
        if (s.indexOf("deliver") >= 0) return "is-delivered";
        if (s.indexOf("transit") >= 0 || s.indexOf("progress") >= 0) return "is-transit";
        if (s.indexOf("quote") >= 0 || s.indexOf("book") >= 0) return "is-booked";
        return "is-default";
      }

      var rows = GLPortal.listShipments(session.email);
      var totalMiles = 0;
      var totalSpend = 0;

      rows.forEach(function (r) {
        var mi = Number(r.miles);
        if (isFinite(mi) && mi > 0) totalMiles += mi;
        var co = Number(r.cost);
        if (isFinite(co) && co > 0) totalSpend += co;
      });

      if (statLoads) statLoads.textContent = String(rows.length);
      if (statMiles) statMiles.textContent = totalMiles ? totalMiles.toLocaleString() + " mi" : "—";
      if (statSpend) statSpend.textContent = totalSpend ? formatMoney(totalSpend) : "—";

      if (listEl) {
        listEl.innerHTML = "";
        rows.forEach(function (r) {
          var route = routeLabel(r);
          var card = document.createElement("article");
          card.className = "portal-shipment-card";
          var commodity = r.commodity || r.equipment || r.note || "—";
          var milesStr = r.miles && isFinite(Number(r.miles)) ? Number(r.miles).toLocaleString() + " mi" : "—";
          var costStr = r.cost != null ? formatMoney(r.cost) : "—";
          card.innerHTML =
            '<header class="portal-shipment-card__head">' +
            '<div><p class="portal-shipment-card__ref">' + escapeHtml(r.ref || "—") + '</p>' +
            '<p class="portal-shipment-card__date">' + escapeHtml(formatDate(r)) + '</p></div>' +
            '<span class="portal-shipment-card__status ' + statusClass(r.status) + '">' + escapeHtml(r.status || "—") + '</span>' +
            '</header>' +
            '<div class="portal-shipment-card__route">' +
            '<div class="portal-shipment-card__city"><span class="portal-shipment-card__label">From</span><strong>' + escapeHtml(route.from) + '</strong><span class="portal-shipment-card__state">' + escapeHtml(row.originState || "") + '</span></div>' +
            '<div class="portal-shipment-card__arrow" aria-hidden="true">→</div>' +
            '<div class="portal-shipment-card__city"><span class="portal-shipment-card__label">To</span><strong>' + escapeHtml(route.to) + '</strong><span class="portal-shipment-card__state">' + escapeHtml(row.destState || "") + '</span></div>' +
            '</div>' +
            '<dl class="portal-shipment-card__meta">' +
            '<div><dt>States</dt><dd>' + escapeHtml(route.states) + '</dd></div>' +
            '<div><dt>Miles</dt><dd>' + escapeHtml(milesStr) + '</dd></div>' +
            '<div><dt>Commodity</dt><dd>' + escapeHtml(commodity) + '</dd></div>' +
            '<div><dt>Cost</dt><dd class="portal-shipment-card__cost">' + escapeHtml(costStr) + '</dd></div>' +
            '</dl>';
          listEl.appendChild(card);
        });
      }

      if (emptyEl) emptyEl.hidden = rows.length > 0;
      if (listEl) listEl.hidden = rows.length === 0;

      var out = document.getElementById("portal-logout");
      if (out) {
        out.addEventListener("click", function (e) {
          e.preventDefault();
          GLPortal.logout();
          window.location.href = prefix + "login.html";
        });
      }
    })();
  }
})();
