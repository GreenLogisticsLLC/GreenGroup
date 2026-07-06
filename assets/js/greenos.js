(function () {
  "use strict";

  var SESS_KEY = "gl_greenos_session";

  function normEmail(v) {
    return String(v || "")
      .trim()
      .toLowerCase();
  }

  function getConfig() {
    var cfg = window.GL_GREENOS_CONFIG || {};
    return {
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

  var GLGreenOS = {
    getSession: function () {
      try {
        var raw = localStorage.getItem(SESS_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    login: function (email, password) {
      var user = findUser(email, password);
      if (!user) return null;
      var session = {
        email: normEmail(user.email),
        name: String(user.name || user.email || "").trim() || normEmail(user.email),
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
      return getConfig().users.length > 0;
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
    if (GLGreenOS.getSession()) {
      if (GLGreenOS.getAppUrl()) {
        window.location.replace(GLGreenOS.getAppUrl());
      } else {
        window.location.replace(prefix + "greenos-dashboard.html");
      }
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
      var sess = GLGreenOS.login(fd.get("email"), fd.get("password"));
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
