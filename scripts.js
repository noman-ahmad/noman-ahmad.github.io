/* ==========================================================================
   Noman Ahmad — portfolio behaviour
   Everything is event- or IntersectionObserver-driven; no geometry reads
   inside the scroll path.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Theme ------------------------------------------------------------ */

  var themeToggle = document.querySelector(".theme-toggle");

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {
        /* storage unavailable — the in-memory theme still applies */
      }
    }
    if (themeToggle) {
      var dark = theme === "dark";
      themeToggle.setAttribute("aria-pressed", String(dark));
      themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    }
  }

  applyTheme(root.getAttribute("data-theme") || "light", false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  }

  // Follow the OS only while the visitor has not made an explicit choice.
  var osDark = window.matchMedia("(prefers-color-scheme: dark)");
  osDark.addEventListener("change", function (e) {
    var stored = null;
    try {
      stored = localStorage.getItem("theme");
    } catch (err) {
      /* ignore */
    }
    if (!stored) applyTheme(e.matches ? "dark" : "light", false);
  });

  /* --- Mobile menu ------------------------------------------------------ */

  var menuToggle = document.querySelector(".menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");

  function setMenu(open) {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);

    if (open) {
      mobileMenu.hidden = false;
      // Next frame, so the transition has a starting state to animate from.
      requestAnimationFrame(function () {
        mobileMenu.classList.add("is-open");
      });
    } else {
      mobileMenu.classList.remove("is-open");
      if (reduceMotion) {
        mobileMenu.hidden = true;
      } else {
        window.setTimeout(function () {
          if (!mobileMenu.classList.contains("is-open")) mobileMenu.hidden = true;
        }, 280);
      }
    }
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuToggle.focus();
      }
    });

    window.matchMedia("(min-width: 861px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* --- Header state & scroll progress ----------------------------------- */

  var header = document.getElementById("site-header");
  var progress = document.querySelector(".scroll-progress span");
  var toTop = document.getElementById("to-top");
  var timeline = document.querySelector(".timeline");
  var maxScroll = 1;
  var ticking = false;

  function measure() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function onScrollFrame() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (progress) progress.style.transform = "scaleX(" + Math.min(1, y / maxScroll) + ")";
    if (toTop) toTop.classList.toggle("is-on", y > window.innerHeight * 0.9);

    if (timeline) {
      var r = timeline.getBoundingClientRect();
      // 0 when the rail's top reaches mid-viewport, 1 when its bottom does.
      var fill = (window.innerHeight * 0.55 - r.top) / r.height;
      timeline.style.setProperty("--fill", clamp(fill, 0, 1).toFixed(3));
    }

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", function () {
    measure();
    positionIndicator();
  });

  measure();
  onScrollFrame();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* --- Reveal on scroll -------------------------------------------------- */

  var revealTargets = document.querySelectorAll("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* --- Active section & sliding nav indicator ---------------------------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var indicator = document.querySelector(".nav-indicator");
  var activeLink = null;

  function positionIndicator() {
    if (!indicator) return;
    if (!activeLink || getComputedStyle(indicator).display === "none") {
      indicator.classList.remove("is-on");
      return;
    }
    indicator.style.left = activeLink.offsetLeft + "px";
    indicator.style.width = activeLink.offsetWidth + "px";
    indicator.classList.add("is-on");
  }

  function setActive(id) {
    var next = null;
    navLinks.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", match);
      if (match) next = link;
    });
    activeLink = next;
    positionIndicator();
  }

  var watched = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if (watched.length && "IntersectionObserver" in window) {
    var visible = new Map();

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        var best = "";
        var bestRatio = 0;
        visible.forEach(function (ratio, id) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        });

        setActive(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75], rootMargin: "-20% 0px -45% 0px" }
    );

    watched.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* --- Role typing effect ------------------------------------------------ */

  var typed = document.querySelector("[data-typed]");
  var roles = [
    "Senior Mobile Software Engineer",
    "React Native Developer",
    "Swift & SwiftUI Developer",
    "Full-Stack Engineer",
  ];

  if (typed && !reduceMotion) {
    var roleIndex = 0;
    var charIndex = roles[0].length;
    var deleting = true;

    var tick = function () {
      var role = roles[roleIndex];
      charIndex += deleting ? -1 : 1;
      typed.textContent = role.slice(0, charIndex);

      var delay = deleting ? 42 : 78;

      if (!deleting && charIndex === role.length) {
        deleting = true;
        delay = 2200;
      } else if (deleting && charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        delay = 420;
      }

      window.setTimeout(tick, delay);
    };

    window.setTimeout(tick, 2200);
  }

  /* --- Hero spotlight & photo tilt --------------------------------------- */

  var hero = document.querySelector(".hero");
  var heroPhoto = document.querySelector(".hero-photo");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (hero && finePointer && !reduceMotion) {
    var pending = null;

    var paint = function () {
      var e = pending;
      pending = null;
      if (!e) return;

      var hr = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - hr.left) / hr.width) * 100 + "%");
      hero.style.setProperty("--my", ((e.clientY - hr.top) / hr.height) * 100 + "%");

      if (heroPhoto) {
        var pr = heroPhoto.getBoundingClientRect();
        // Only tilt while the pointer is near the photo, so the card is not
        // permanently skewed towards a cursor parked across the page.
        var dx = (e.clientX - (pr.left + pr.width / 2)) / (pr.width / 2);
        var dy = (e.clientY - (pr.top + pr.height / 2)) / (pr.height / 2);
        var near = Math.abs(dx) < 2.2 && Math.abs(dy) < 2.2;

        heroPhoto.classList.toggle("is-tilting", near);
        var max = 7;
        heroPhoto.style.setProperty("--tx", (near ? clamp(dx, -1, 1) * max : 0) + "deg");
        heroPhoto.style.setProperty("--ty", (near ? clamp(-dy, -1, 1) * max : 0) + "deg");
      }
    };

    hero.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType !== "mouse") return;
        hero.classList.add("is-lit");
        if (!pending) requestAnimationFrame(paint);
        pending = e;
      },
      { passive: true }
    );

    hero.addEventListener("pointerleave", function () {
      hero.classList.remove("is-lit");
      if (heroPhoto) {
        heroPhoto.classList.remove("is-tilting");
        heroPhoto.style.setProperty("--tx", "0deg");
        heroPhoto.style.setProperty("--ty", "0deg");
      }
    });
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /* --- Stat count-up ------------------------------------------------------ */

  var stats = document.querySelectorAll(".stat-num[data-count]");

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
    var duration = 1100;
    var start = null;

    var step = function (now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      // easeOutCubic, so it decelerates into the final figure
      var eased = 1 - Math.pow(1 - t, 3);
      var v = target * eased;
      el.textContent = (decimals ? v.toFixed(decimals) : Math.round(v)) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  if (stats.length && !reduceMotion && "IntersectionObserver" in window) {
    var statObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            countUp(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    stats.forEach(function (el) {
      statObserver.observe(el);
    });
  }

  /* --- Filter by technology ---------------------------------------------- */

  var viewer = document.getElementById("resume-viewer");

  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-tech]"));
  var filterables = Array.prototype.slice.call(
    document.querySelectorAll(".tl-item, .bento .card")
  );
  var filterBar = document.getElementById("filter-bar");
  var filterCount = document.getElementById("filter-count");
  var filterClear = document.getElementById("filter-clear");
  var activeTech = null;

  // An item's technologies are just the chips it contains, so the two can
  // never drift apart.
  function techsOf(el) {
    var set = [];
    el.querySelectorAll(".chip[data-tech]").forEach(function (chip) {
      chip.getAttribute("data-tech").split(",").forEach(function (t) {
        t = t.trim();
        if (t && set.indexOf(t) === -1) set.push(t);
      });
    });
    return set;
  }

  function applyFilter(tech) {
    activeTech = tech;
    var matches = 0;
    var label = "";

    filterables.forEach(function (el) {
      if (!tech) {
        el.classList.remove("is-dim", "is-match");
        return;
      }
      var hit = techsOf(el).indexOf(tech) !== -1;
      el.classList.toggle("is-match", hit);
      el.classList.toggle("is-dim", !hit);
      if (hit) matches++;
    });

    chips.forEach(function (chip) {
      var own = chip.getAttribute("data-tech").split(",").map(function (t) {
        return t.trim();
      });
      var on = !!tech && own.indexOf(tech) !== -1;
      chip.setAttribute("aria-pressed", String(on));
      if (on && !label) label = chip.textContent.trim();
    });

    if (!filterBar) return;

    // The user just asked to see these, so bring the first one into view if
    // none of them are already on screen.
    if (tech && matches) {
      var first = filterables.filter(function (el) {
        return el.classList.contains("is-match");
      })[0];
      if (first) {
        var box = first.getBoundingClientRect();
        var onScreen = box.top < window.innerHeight * 0.8 && box.bottom > 90;
        if (!onScreen) {
          first.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "center",
          });
        }
      }
    }

    if (tech) {
      filterCount.innerHTML =
        matches === 0
          ? "No entries use <b>" + label + "</b>"
          : "<b>" + matches + "</b> " + (matches === 1 ? "entry uses" : "entries use") +
            " <b>" + label + "</b>";
      filterBar.hidden = false;
      requestAnimationFrame(function () {
        filterBar.classList.add("is-open");
      });
    } else {
      filterBar.classList.remove("is-open");
      window.setTimeout(function () {
        if (!filterBar.classList.contains("is-open")) filterBar.hidden = true;
      }, reduceMotion ? 0 : 300);
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var own = chip.getAttribute("data-tech").split(",")[0].trim();
      applyFilter(activeTech === own ? null : own);
    });
  });

  if (filterClear) {
    filterClear.addEventListener("click", function () {
      applyFilter(null);
    });
  }

  document.addEventListener("keydown", function (e) {
    // While the résumé dialog is open Escape belongs to it, not the filter.
    var dialogOpen = viewer && !viewer.hidden;
    if (e.key === "Escape" && activeTech && !dialogOpen) applyFilter(null);
  });

  /* --- Copy to clipboard -------------------------------------------------- */

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var label = btn.querySelector(".copy-label");
    var original = label ? label.textContent : "";
    var revert = null;

    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.classList.add("is-done");
        if (label) label.textContent = "Copied";
        window.clearTimeout(revert);
        revert = window.setTimeout(function () {
          btn.classList.remove("is-done");
          if (label) label.textContent = original;
        }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          window.prompt("Copy this address:", text);
        });
      } else {
        window.prompt("Copy this address:", text);
      }
    });
  });

  /* --- Résumé viewer ------------------------------------------------------ */

  var resumePages = document.getElementById("resume-pages");
  var resumeTriggers = document.querySelectorAll("[data-resume]");
  var lastFocused = null;
  var pagesLoaded = false;

  function loadResumePages() {
    if (pagesLoaded || !resumePages) return;
    pagesLoaded = true;
    resumePages.querySelectorAll("img[data-src]").forEach(function (img) {
      img.src = img.getAttribute("data-src");
      img.removeAttribute("data-src");
    });
  }

  function focusables() {
    return Array.prototype.slice
      .call(viewer.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]'))
      .filter(function (el) {
        return el.offsetParent !== null;
      });
  }

  function openResume() {
    if (!viewer) return;
    lastFocused = document.activeElement;
    loadResumePages();
    viewer.hidden = false;
    document.body.classList.add("viewer-open");
    requestAnimationFrame(function () {
      viewer.classList.add("is-open");
      var first = focusables()[0];
      if (first) first.focus();
    });
  }

  function closeResume() {
    if (!viewer || viewer.hidden) return;
    viewer.classList.remove("is-open");
    document.body.classList.remove("viewer-open");
    var finish = function () {
      if (!viewer.classList.contains("is-open")) viewer.hidden = true;
    };
    if (reduceMotion) finish();
    else window.setTimeout(finish, 280);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (viewer) {
    resumeTriggers.forEach(function (link) {
      link.addEventListener("click", function (e) {
        // Modifier-clicks and middle-clicks should still open the PDF itself.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openResume();
      });
    });

    viewer.addEventListener("click", function (e) {
      if (e.target.closest("[data-resume-close]")) closeResume();
    });

    document.addEventListener("keydown", function (e) {
      if (viewer.hidden) return;

      if (e.key === "Escape") {
        e.stopPropagation();
        closeResume();
        return;
      }

      // Keep tabbing inside the dialog while it is open.
      if (e.key === "Tab") {
        var items = focusables();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* --- Footer year ------------------------------------------------------- */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
