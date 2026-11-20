(function () {
  "use strict";

  var SESS_KEY = "gl_greenos_session";
  var LOGIN_ATTEMPTS = 4;
  var LOGIN_RETRY_MS = 2500;

  function normEmail(v) {
    return String(v || "")
      .trim()
      .toLowerCase();
  }

  function getConfig() {
    var cfg = window.GL_GREENOS_CONFIG || {};
    return {
      apiBaseUrl: String(cfg.apiBaseUrl || "").trim().replace(/\/$/, ""),
      appUrl: String(cfg.appUrl || "").trim(),
      users: Array.isArray(cfg.users) ? cfg.users : []
    };
  }

  function findUser(email, password) {
    var cfg = getConfig();
    var needle = normEmail(email);
    var pass = String(password || "");
    for (var i = 0; i < cfg.users.length; i++) {
      var u = cfg.users[i];
      if (normEmail(u.email) === needle && String(u.password || "") === pass) {
        return u;
      }
    }
    return null;
  }

  function redirectToApp(token) {
    var cfg = getConfig();
    var base = cfg.appUrl || "";
    if (!base) return false;
    var sep = base.indexOf("?") >= 0 ? "&" : "?";
    window.location.href = base + (token ? sep + "token=" + encodeURIComponent(token) : "");
    return true;
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function parseLoginPayload(res, text) {
    var trimmed = String(text || "").trim();
    if (!trimmed) {
      return {
        ok: false,
        network: true,
        message:
          "GreenOS returned an empty response (HTTP " +
          res.status +
          "). The server may be restarting — try again in a moment."
      };
    }
    try {
      var data = JSON.parse(trimmed);
      return { ok: true, data: data, status: res.status, httpOk: res.ok };
    } catch (e) {
      var looksHtml = /<!doctype html|<html|bad gateway|502|504/i.test(trimmed);
      return {
        ok: false,
        network: true,
        retryable: looksHtml || res.status >= 500 || res.status === 0,
        message: looksHtml
          ? "GreenOS is temporarily unavailable (server restarting). Retrying…"
          : "GreenOS returned a non-JSON response (HTTP " +
            res.status +
            "). Try again shortly."
      };
    }
  }

  function postLogin(apiBaseUrl, email, password) {
    return fetch(apiBaseUrl + "/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        username: String(email || "").trim(),
        email: String(email || "").trim(),
        password: String(password || "")
      })
    }).then(function (res) {
      return res.text().then(function (text) {
        return { res: res, parsed: parseLoginPayload(res, text) };
      });
    });
  }

  function loginViaApi(email, password, role, onSuccess, onError, onStatus) {
    var cfg = getConfig();
    if (!cfg.apiBaseUrl) {
      onError("API not configured");
      return;
    }

    var attempt = 0;

    function failHard(message) {
      var app = cfg.appUrl || "https://os.greengrouplogistics.com/";
      onError(
        message +
          " Or open GreenOS directly: " +
          app.replace(/\/$/, "") +
          " — then use Sign Up / Sign in there."
      );
    }

    function next() {
      attempt += 1;
      if (onStatus && attempt > 1) {
        onStatus(
          "GreenOS is waking up (attempt " +
            attempt +
            "/" +
            LOGIN_ATTEMPTS +
            ")…"
        );
      }

      postLogin(cfg.apiBaseUrl, email, password)
        .then(function (result) {
          var parsed = result.parsed;
          if (!parsed.ok) {
            if (parsed.retryable !== false && attempt < LOGIN_ATTEMPTS) {
              if (onStatus) onStatus(parsed.message || "Retrying…");
              return sleep(LOGIN_RETRY_MS).then(next);
            }
            failHard(
              parsed.message ||
                "Could not reach GreenOS server. Try again later or contact your administrator."
            );
            return;
          }

          var data = parsed.data;
          if (!parsed.httpOk || !data || !data.success) {
            onError(
              (data && data.message) ||
                "Invalid email or password. Contact your administrator if you need access."
            );
            return;
          }

          var token = data.data && data.data.token;
          var user = data.data && data.data.user;
          var session = {
            email: normEmail(user && user.username ? user.username : email),
            name: user
              ? String(user.firstName || "") + " " + String(user.lastName || "")
              : normEmail(email),
            role: String((user && user.role) || role || "").trim(),
            loggedInAt: new Date().toISOString()
          };
          try {
            localStorage.setItem(SESS_KEY, JSON.stringify(session));
          } catch (e) {
            /* private mode — still redirect with token */
          }
          if (token && redirectToApp(token)) {
            onSuccess(session);
            return;
          }
          if (cfg.appUrl) {
            window.location.href = cfg.appUrl;
            onSuccess(session);
            return;
          }
          onError("GreenOS app URL is not configured.");
        })
        .catch(function (err) {
          if (attempt < LOGIN_ATTEMPTS) {
            if (onStatus) {
              onStatus(
                "Could not reach GreenOS (network). Retrying " +
                  attempt +
                  "/" +
                  LOGIN_ATTEMPTS +
                  "…"
              );
            }
            return sleep(LOGIN_RETRY_MS).then(next);
          }
          failHard(
            "Could not reach GreenOS server" +
              (err && err.message ? " (" + err.message + ")" : "") +
              ". Try again later or contact your administrator."
          );
        });
    }

    next();
  }

  var GLGreenOS = {
    getSession: function () {
      try {
        var raw = localStorage.getItem(SESS_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    login: function (email, password, role) {
      var user = findUser(email, password);
      if (!user) return null;
      var session = {
        email: normEmail(user.email),
        name: String(user.name || user.email || "").trim() || normEmail(user.email),
        role: String(role || user.role || "").trim().toLowerCase(),
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem(SESS_KEY, JSON.stringify(session));
      return session;
    },
    logout: function () {
      localStorage.removeItem(SESS_KEY);
    },
    getAppUrl: function () {
      return getConfig().appUrl;
    },
    hasUsers: function () {
      var cfg = getConfig();
      return cfg.users.length > 0 || !!cfg.apiBaseUrl;
    },
    usesApi: function () {
      return !!getConfig().apiBaseUrl;
    }
  };

  window.GLGreenOS = GLGreenOS;

  function navPrefix() {
    var home = document.querySelector(".logo__home");
    if (home) {
      var h = home.getAttribute("href") || "";
      if (h.indexOf("../") === 0) return "../";
    }
    return "";
  }

  var page = document.body && document.body.getAttribute("data-greenos-page");
  if (!page) return;

  var prefix = navPrefix();

  if (page === "login") {
    if (GLGreenOS.getSession() && GLGreenOS.getAppUrl()) {
      window.location.replace(GLGreenOS.getAppUrl());
      return;
    }

    var form = document.getElementById("greenos-login-form");
    var err = document.getElementById("greenos-login-error");
    var notice = document.getElementById("greenos-setup-notice");

    if (notice && !GLGreenOS.hasUsers()) {
      notice.hidden = false;
    }

    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      var fd = new FormData(form);
      var role = fd.get("role");
      if (!role) {
        if (err) {
          err.hidden = false;
          err.textContent = "Please select your position (Owner, Accounting, Broker, or Manager).";
        }
        return;
      }

      var email = fd.get("email");
      var password = fd.get("password");
      var submitBtn = form.querySelector(".greenos-submit-btn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Signing in…";
      }

      function resetBtn() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign in to GreenOS";
        }
      }

      function showErr(message) {
        resetBtn();
        if (err) {
          err.hidden = false;
          err.textContent = message;
        }
      }

      function showStatus(message) {
        if (err) {
          err.hidden = false;
          err.textContent = message;
        }
      }

      if (GLGreenOS.usesApi()) {
        loginViaApi(
          email,
          password,
          role,
          function () {
            resetBtn();
          },
          showErr,
          showStatus
        );
        return;
      }

      var sess = GLGreenOS.login(email, password, role);
      resetBtn();
      if (sess) {
        var appUrl = GLGreenOS.getAppUrl();
        window.location.href = appUrl || prefix + "greenos-dashboard.html";
        return;
      }
      if (err) {
        err.hidden = false;
        err.textContent = GLGreenOS.hasUsers()
          ? "Invalid email or password. Contact your administrator if you need access."
          : "GreenOS access is not configured yet. Your administrator will enable employee logins soon.";
      }
    });
  }

  if (page === "dashboard") {
    var session = GLGreenOS.getSession();
    if (!session) {
      window.location.replace(prefix + "greenos.html");
      return;
    }

    var appUrl = GLGreenOS.getAppUrl();
    if (appUrl) {
      window.location.replace(appUrl);
      return;
    }

    var nameEl = document.getElementById("greenos-user-name");
    if (nameEl) nameEl.textContent = session.name || session.email;

    var roleEl = document.getElementById("greenos-user-role");
    if (roleEl && session.role) {
      var roleLabels = {
        owner: "Owner",
        Owner: "Owner",
        accounting: "Accounting",
        broker: "Broker",
        manager: "Manager",
        Manager: "Manager",
        Administrator: "Administrator"
      };
      roleEl.textContent = roleLabels[session.role] || session.role;
    }

    var logout = document.getElementById("greenos-logout");
    if (logout) {
      logout.addEventListener("click", function (e) {
        e.preventDefault();
        GLGreenOS.logout();
        window.location.href = prefix + "greenos.html";
      });
    }
  }
})();
