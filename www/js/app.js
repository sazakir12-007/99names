(function () {
  "use strict";

  var NAMES = window.NAMES, THEMES = window.THEMES, JJK = window.JJK;
  var SETTINGS_KEY = "99names.settings";
  var FAVS_KEY = "99names.favs";

  var DEFAULTS = {
    theme: "auto", layout: "list", display: "meaning",
    showArabic: true, showTranslit: true, showNumber: true, showTag: false,
    scheme: "theme", grouped: false, filter: "all",
    arFont: "Amiri", txFont: "sans", arScale: 1, txScale: 1,
    speed: 40, interval: 6, loop: true, wakeLock: true
  };

  var THEME_LIST = [
    { id: "auto",     label: "Auto",     bg: "linear-gradient(135deg,#f6f2e9 50%,#0f1416 50%)", accent: "#0f6b4f" },
    { id: "ivory",    label: "Ivory",    bg: "#f6f2e9", accent: "#0f6b4f" },
    { id: "night",    label: "Night",    bg: "#0f1416", accent: "#4cc497" },
    { id: "sepia",    label: "Sepia",    bg: "#efe4cb", accent: "#8a5a2b" },
    { id: "emerald",  label: "Emerald",  bg: "#0a3a2c", accent: "#e5c171" },
    { id: "midnight", label: "Midnight", bg: "#0b1130", accent: "#d9b65c" },
    { id: "rose",     label: "Rose",     bg: "#fbefef", accent: "#b0466a" },
    { id: "ocean",    label: "Ocean",    bg: "#e9f2f6", accent: "#1d6e93" },
    { id: "black",    label: "Black",    bg: "#000000", accent: "#c9a85b" }
  ];

  var AR_FONTS = [
    { id: "Amiri", label: "Amiri" },
    { id: "Scheherazade New", label: "Scheherazade" },
    { id: "Noto Naskh Arabic", label: "Noto Naskh" },
    { id: "Lateef", label: "Lateef" },
    { id: "Reem Kufi", label: "Kufi" },
    { id: "Aref Ruqaa", label: "Ruqaa" }
  ];

  var TX_FONTS = {
    sans: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    serif: '"Lora", Georgia, "Times New Roman", serif',
    system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  };

  var DISPLAY_ORDER = ["name", "meaning", "benefit"];
  var DISPLAY_LABEL = { name: "Name", meaning: "Meaning", benefit: "Benefits" };

  var HEART = '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 5.6 5 5 0 0 1 21.2 11C19 15.6 12 20 12 20z"/></svg>';

  // ---------- Storage ----------
  function load(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  var settings = Object.assign({}, DEFAULTS, load(SETTINGS_KEY, {}));
  if (settings.layout === "recite") settings.layout = "list";
  var favs = new Set(load(FAVS_KEY, []));
  var query = "";
  var cardIndex = 0;

  function persist() { save(SETTINGS_KEY, settings); }

  // ---------- DOM ----------
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var body = document.body;
  var content = $("content");
  var chips = $("chips");

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---------- Classification & filtering ----------
  function categories() { return settings.scheme === "jjk" ? JJK : THEMES; }
  function catOf(n) { return settings.scheme === "jjk" ? n.jjk : n.theme; }

  function normalize(s) {
    return s.toLowerCase()
      .replace(/[ً-ٰٟـ]/g, "")   // Arabic diacritics and tatweel
      .replace(/[أإآٱ]/g, "ا")
      .replace(/['’`\-\s]/g, "");
  }
  NAMES.forEach(function (n) { n._search = normalize(n.tr + "|" + n.en + "|" + n.ar + "|" + n.n); });

  function visibleNames() {
    var f = settings.filter, q = normalize(query);
    return NAMES.filter(function (n) {
      if (f === "fav" && !favs.has(n.n)) return false;
      if (f !== "all" && f !== "fav" && catOf(n) !== f) return false;
      return !q || n._search.indexOf(q) !== -1;
    });
  }

  // Returns [{ key, items }]; one unnamed group unless grouping applies.
  function grouped(list) {
    var cats = categories();
    if (!settings.grouped || cats[settings.filter]) return [{ key: null, items: list }];
    return Object.keys(cats).map(function (k) {
      return { key: k, items: list.filter(function (n) { return catOf(n) === k; }) };
    }).filter(function (g) { return g.items.length; });
  }

  function sectionTitle(key) {
    var c = categories()[key];
    return '<h2 class="section-title">' + c.icon + " " + esc(c.label) + "</h2>";
  }

  // ---------- Rendering ----------
  function renderChips() {
    var cats = categories();
    var counts = {};
    NAMES.forEach(function (n) { counts[catOf(n)] = (counts[catOf(n)] || 0) + 1; });
    var items = [{ id: "all", label: "All", count: NAMES.length },
                 { id: "fav", label: "♥ Favourites", count: favs.size }];
    Object.keys(cats).forEach(function (k) {
      items.push({ id: k, label: cats[k].icon + " " + cats[k].label, count: counts[k] || 0 });
    });
    chips.innerHTML = items.map(function (c) {
      return '<button class="chip' + (settings.filter === c.id ? " active" : "") + '" data-filter="' + c.id + '">' +
        esc(c.label) + ' <span class="count">' + c.count + "</span></button>";
    }).join("");
    var active = chips.querySelector(".active");
    if (active) active.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function tagLabel(n) { return categories()[catOf(n)].label; }

  function favBtn(n) {
    return '<button class="fav' + (favs.has(n.n) ? " on" : "") + '" data-fav="' + n.n + '" aria-label="Favourite">' + HEART + "</button>";
  }

  function itemHTML(n) {
    return '<article class="name" data-n="' + n.n + '">' +
      '<span class="num"><span>' + n.n + "</span></span>" +
      '<div class="meta"><div class="tr">' + esc(n.tr) + '</div><div class="en">' + esc(n.en) + "</div></div>" +
      '<div class="ar" lang="ar">' + n.ar + "</div>" +
      '<p class="benefit">' + esc(n.benefit) + "</p>" +
      '<span class="tag">' + esc(tagLabel(n)) + "</span>" +
      favBtn(n) + "</article>";
  }

  function cardHTML(n) {
    return '<div class="slide"><article class="name" data-n="' + n.n + '">' +
      '<span class="num"><span>' + n.n + "</span></span>" +
      '<div class="ar" lang="ar">' + n.ar + "</div>" +
      '<div class="ornament">۞</div>' +
      '<div class="tr">' + esc(n.tr) + "</div>" +
      '<div class="en">' + esc(n.en) + "</div>" +
      '<p class="benefit">' + esc(n.benefit) + "</p>" +
      '<span class="tag">' + esc(tagLabel(n)) + "</span>" +
      favBtn(n) + "</article></div>";
  }

  function reciteHTML(n) {
    return '<div class="r-item" data-n="' + n.n + '">' +
      '<div class="num">' + n.n + "</div>" +
      '<div class="ar" lang="ar">' + n.ar + "</div>" +
      '<div class="tr">' + esc(n.tr) + "</div>" +
      '<div class="en">' + esc(n.en) + "</div>" +
      '<p class="benefit">' + esc(n.benefit) + "</p></div>";
  }

  function render() {
    var list = visibleNames();
    var layout = settings.layout;
    content.className = "content layout-" + layout;
    $("cardsNav").hidden = layout !== "cards" || !list.length;

    if (!list.length) {
      content.innerHTML = '<div class="empty">' +
        (settings.filter === "fav" && !query ? "No favourites yet.<br>Tap ♥ on any name to add it here." : "No names match your search.") +
        "</div>";
      return;
    }

    var groups = grouped(list);
    var html = "";

    if (layout === "list") {
      groups.forEach(function (g) {
        if (g.key) html += sectionTitle(g.key);
        html += g.items.map(itemHTML).join("");
      });
    } else if (layout === "grid") {
      html = '<div class="grid">';
      groups.forEach(function (g) {
        if (g.key) html += sectionTitle(g.key);
        html += g.items.map(itemHTML).join("");
      });
      html += "</div>";
    } else if (layout === "cards") {
      var ordered = [];
      groups.forEach(function (g) { ordered = ordered.concat(g.items); });
      html = '<div class="track" id="track">' + ordered.map(cardHTML).join("") + "</div>";
    } else {
      html = '<div class="spacer"></div>';
      groups.forEach(function (g) {
        if (g.key) html += sectionTitle(g.key);
        html += g.items.map(reciteHTML).join('<div class="r-sep">۞</div>');
      });
      html += '<div class="spacer"></div>';
    }
    content.innerHTML = html;

    if (layout === "cards") setupCards();
  }

  // Names in on-screen order (respecting grouping), used for detail navigation.
  function orderedNames() {
    var out = [];
    grouped(visibleNames()).forEach(function (g) { out = out.concat(g.items); });
    return out;
  }

  // ---------- Cards ----------
  function track() { return $("track"); }
  function cardCount() { var t = track(); return t ? t.children.length : 0; }

  function setupCards() {
    var t = track();
    cardIndex = Math.min(cardIndex, cardCount() - 1);
    requestAnimationFrame(function () { t.scrollLeft = cardIndex * t.clientWidth; updateCounter(); });
    var ticking = false;
    t.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        cardIndex = Math.round(t.scrollLeft / t.clientWidth);
        updateCounter();
      });
    }, { passive: true });
  }

  function updateCounter() { $("cardCounter").textContent = (cardIndex + 1) + " / " + cardCount(); }

  function goCard(i, smooth) {
    var t = track();
    if (!t) return;
    var count = cardCount();
    if (i >= count) i = settings.loop ? 0 : count - 1;
    if (i < 0) i = 0;
    cardIndex = i;
    t.scrollTo({ left: i * t.clientWidth, behavior: smooth === false ? "auto" : "smooth" });
    updateCounter();
  }

  // ---------- Auto scroll ----------
  var playing = false, rafId = 0, lastT = null, pos = 0, touching = false, cardTimer = 0, wakeLock = null;

  function startPlay() {
    if (playing) return;
    playing = true;
    body.classList.add("playing");
    if (settings.layout === "cards") {
      cardTimer = setInterval(function () {
        if (!settings.loop && cardIndex >= cardCount() - 1) return stopPlay();
        goCard(cardIndex + 1);
      }, settings.interval * 1000);
    } else {
      pos = content.scrollTop;
      lastT = null;
      rafId = requestAnimationFrame(step);
    }
    requestWakeLock();
  }

  function stopPlay() {
    if (!playing) return;
    playing = false;
    body.classList.remove("playing");
    cancelAnimationFrame(rafId);
    clearInterval(cardTimer);
    releaseWakeLock();
    showReciteControls();
  }

  function togglePlay() { playing ? stopPlay() : startPlay(); }

  function restartIfPlaying() { if (playing) { stopPlay(); startPlay(); } }

  function step(t) {
    if (!playing) return;
    if (lastT !== null && !touching) {
      var dt = Math.min((t - lastT) / 1000, 0.1);
      var max = content.scrollHeight - content.clientHeight;
      pos += settings.speed * dt;
      if (pos >= max) {
        if (settings.loop) { pos = 0; }
        else { content.scrollTop = max; stopPlay(); return; }
      }
      content.scrollTop = pos;
    }
    lastT = t;
    rafId = requestAnimationFrame(step);
  }

  // Keep our float position in sync when the user scrolls manually.
  content.addEventListener("scroll", function () {
    if (Math.abs(content.scrollTop - pos) > 3) pos = content.scrollTop;
  }, { passive: true });
  content.addEventListener("touchstart", function () { touching = true; }, { passive: true });
  content.addEventListener("touchend", function () { touching = false; pos = content.scrollTop; }, { passive: true });
  content.addEventListener("touchcancel", function () { touching = false; }, { passive: true });

  function requestWakeLock() {
    if (!settings.wakeLock || !("wakeLock" in navigator) || wakeLock) return;
    navigator.wakeLock.request("screen").then(function (l) {
      wakeLock = l;
      l.addEventListener("release", function () { wakeLock = null; });
    }).catch(function () {});
  }
  function releaseWakeLock() { if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; } }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && playing) requestWakeLock();
  });

  function speedText() { return (settings.speed / 40).toFixed(2).replace(/0$/, "") + "×"; }

  // ---------- Recite controls ----------
  var hideTimer = 0;
  function showReciteControls() {
    body.classList.remove("controls-hidden");
    clearTimeout(hideTimer);
    if (settings.layout === "recite" && playing) {
      hideTimer = setTimeout(function () { body.classList.add("controls-hidden"); }, 3000);
    }
  }

  // ---------- Applying settings ----------
  var darkMQ = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function applyTheme() {
    root.dataset.theme = settings.theme;
    root.classList.toggle("sys-dark", !!(darkMQ && darkMQ.matches));
    var bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute("content", bg);
  }
  if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener("change", applyTheme);

  function applyAppearance() {
    applyTheme();
    root.style.setProperty("--font-ar", '"' + settings.arFont + '", "Amiri", serif');
    root.style.setProperty("--font-tx", TX_FONTS[settings.txFont] || TX_FONTS.sans);
    root.style.setProperty("--ar-scale", settings.arScale);
    root.style.setProperty("--tx-scale", settings.txScale);

    body.classList.toggle("show-meaning", settings.display !== "name");
    body.classList.toggle("show-benefit", settings.display === "benefit");
    body.classList.toggle("hide-ar", !settings.showArabic);
    body.classList.toggle("hide-tr", !settings.showTranslit);
    body.classList.toggle("hide-num", !settings.showNumber);
    body.classList.toggle("show-tag", settings.showTag);
    ["list", "grid", "cards", "recite"].forEach(function (l) {
      body.classList.toggle("layout-" + l, settings.layout === l);
    });

    $("modeLabel").textContent = DISPLAY_LABEL[settings.display];
    $("speedLabel").textContent = speedText();
    $("outSpeed").textContent = speedText();
    $("outInterval").textContent = settings.interval + "s";
    document.querySelectorAll("#tabbar [data-layout]").forEach(function (b) {
      b.classList.toggle("active", b.dataset.layout === settings.layout);
    });
    syncSettingsForm();
  }

  function setLayout(layout) {
    if (layout === settings.layout) return;
    var wasPlaying = playing;
    stopPlay();
    if (layout === "recite") {
      settings.prevLayout = settings.layout;
      pushOverlay("recite");
    }
    settings.layout = layout;
    persist();
    applyAppearance();
    render();
    content.scrollTop = 0;
    if (layout === "recite" || wasPlaying) startPlay();
    showReciteControls();
  }

  function exitRecite() {
    if (settings.layout !== "recite") return;
    setLayout(settings.prevLayout || "list");
  }

  // ---------- Settings sheet ----------
  function buildSettingsUI() {
    $("themeSwatches").innerHTML = THEME_LIST.map(function (t) {
      return '<button class="swatch" data-theme="' + t.id + '"><i style="background:' + t.bg + ";--sw-accent:" + t.accent + '"></i>' + t.label + "</button>";
    }).join("");
    $("arFontPicker").innerHTML = AR_FONTS.map(function (f) {
      return '<button class="font-opt" data-font="' + f.id + '"><span class="sample" lang="ar" style="font-family:\'' + f.id + '\'">الرَّحْمَٰنُ</span><small>' + f.label + "</small></button>";
    }).join("");
  }

  function syncSettingsForm() {
    document.querySelectorAll(".segmented[data-setting]").forEach(function (seg) {
      var v = String(settings[seg.dataset.setting]);
      seg.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", b.dataset.value === v); });
    });
    document.querySelectorAll("input[data-setting]").forEach(function (inp) {
      var v = settings[inp.dataset.setting];
      if (inp.type === "checkbox") inp.checked = !!v; else inp.value = v;
    });
    document.querySelectorAll(".swatch").forEach(function (s) { s.classList.toggle("active", s.dataset.theme === settings.theme); });
    document.querySelectorAll(".font-opt").forEach(function (f) { f.classList.toggle("active", f.dataset.font === settings.arFont); });
  }

  // Settings that change markup need a re-render; others only restyle.
  var RERENDER = { scheme: 1, grouped: 1, showTag: 1 };

  function setSetting(key, value) {
    settings[key] = value;
    // Never hide both the Arabic and the transliteration.
    if (key === "showArabic" && !value && !settings.showTranslit) settings.showTranslit = true;
    if (key === "showTranslit" && !value && !settings.showArabic) settings.showArabic = true;
    if (key === "scheme") { settings.filter = "all"; renderChips(); }
    persist();
    applyAppearance();
    if (RERENDER[key]) render();
    if (key === "interval") restartIfPlaying();
  }

  document.querySelectorAll(".segmented[data-setting]").forEach(function (seg) {
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) setSetting(seg.dataset.setting, b.dataset.value);
    });
  });
  document.querySelectorAll("input[data-setting]").forEach(function (inp) {
    inp.addEventListener("input", function () {
      setSetting(inp.dataset.setting, inp.type === "checkbox" ? inp.checked : parseFloat(inp.value));
    });
  });
  $("themeSwatches").addEventListener("click", function (e) {
    var b = e.target.closest(".swatch");
    if (b) setSetting("theme", b.dataset.theme);
  });
  $("arFontPicker").addEventListener("click", function (e) {
    var b = e.target.closest(".font-opt");
    if (b) setSetting("arFont", b.dataset.font);
  });
  $("btnReset").addEventListener("click", function () {
    if (!confirm("Reset all settings to their defaults? Favourites are kept.")) return;
    settings = Object.assign({}, DEFAULTS);
    persist();
    applyAppearance();
    renderChips();
    render();
  });

  // ---------- Sheets & history (Android back button closes overlays) ----------
  var overlays = [];
  var scrim = $("scrim");
  var resumeAfterSheet = false;

  function pushOverlay(id) {
    overlays.push(id);
    try { history.pushState({ overlay: id }, ""); } catch (e) {}
  }

  function openSheet(sheet) {
    if (!sheet.hidden) return;
    if (!overlays.some(isSheet)) { resumeAfterSheet = playing; stopPlay(); }
    pushOverlay(sheet.id);
    scrim.hidden = false;
    sheet.hidden = false;
    sheet.style.transform = "";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { scrim.classList.add("open"); sheet.classList.add("open"); });
    });
  }

  function isSheet(id) { return id !== "recite"; }

  function hideSheet(sheet) {
    sheet.classList.remove("open");
    sheet.style.transform = "";
    if (!overlays.some(isSheet)) scrim.classList.remove("open");
    setTimeout(function () {
      if (!sheet.classList.contains("open")) sheet.hidden = true;
      if (!overlays.some(isSheet)) {
        scrim.hidden = true;
        if (resumeAfterSheet) { resumeAfterSheet = false; startPlay(); }
      }
    }, 280);
  }

  // UI-initiated close goes through history so the back stack stays consistent.
  function closeTop() { if (overlays.length) history.back(); }

  window.addEventListener("popstate", function () {
    var id = overlays.pop();
    if (!id) return;
    if (id === "recite") exitRecite();
    else hideSheet($(id));
  });

  scrim.addEventListener("click", closeTop);
  document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeTop); });

  // Drag a sheet down by its handle or header to dismiss it.
  document.querySelectorAll(".sheet").forEach(function (sheet) {
    var startY = null, dy = 0;
    sheet.addEventListener("touchstart", function (e) {
      var body = sheet.querySelector(".sheet-body");
      if (!e.target.closest(".sheet-handle, .sheet-head") && body.scrollTop > 0) return;
      if (e.target.closest("input, button")) return;
      startY = e.touches[0].clientY; dy = 0;
    }, { passive: true });
    sheet.addEventListener("touchmove", function (e) {
      if (startY === null) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      if (dy > 0) sheet.style.transform = "translateY(" + dy + "px)";
    }, { passive: true });
    sheet.addEventListener("touchend", function () {
      if (startY === null) return;
      startY = null;
      if (dy > 110) closeTop(); else sheet.style.transform = "";
    });
  });

  // ---------- Detail sheet ----------
  var detailN = null;

  function renderDetail() {
    var list = orderedNames();
    var n = NAMES[detailN - 1];
    var idx = list.indexOf(n);
    $("detailBody").innerHTML =
      '<div class="detail">' +
        '<div class="d-num">' + n.n + " / 99</div>" +
        '<div class="d-ar" lang="ar">' + n.ar + "</div>" +
        '<div class="d-tr">' + esc(n.tr) + "</div>" +
        '<div class="d-en">' + esc(n.en) + "</div>" +
        '<div class="d-tags"><span>' + THEMES[n.theme].icon + " " + esc(THEMES[n.theme].label) + "</span><span>" +
          JJK[n.jjk].icon + " " + esc(JJK[n.jjk].label) + "</span></div>" +
        '<div class="d-benefit"><b>Benefit of reciting</b>' + esc(n.benefit) + "</div>" +
        '<div class="d-actions">' +
          '<button class="icon-btn" data-act="prev" aria-label="Previous"' + (idx <= 0 ? " disabled style=\"opacity:.3\"" : "") + '><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></button>' +
          '<div class="mid">' +
            '<button class="icon-btn' + (favs.has(n.n) ? " on" : "") + '" data-act="fav" aria-label="Favourite">' + HEART + "</button>" +
            '<button class="icon-btn" data-act="share" aria-label="Share"><svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg></button>' +
          "</div>" +
          '<button class="icon-btn" data-act="next" aria-label="Next"' + (idx === -1 || idx >= list.length - 1 ? " disabled style=\"opacity:.3\"" : "") + '><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></button>' +
        "</div>" +
      "</div>";
  }

  function openDetail(num) {
    detailN = num;
    renderDetail();
    openSheet($("detailSheet"));
  }

  $("detailBody").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    var list = orderedNames();
    var idx = list.indexOf(NAMES[detailN - 1]);
    var act = b.dataset.act;
    if (act === "prev" && idx > 0) { detailN = list[idx - 1].n; renderDetail(); }
    if (act === "next" && idx < list.length - 1) { detailN = list[idx + 1].n; renderDetail(); }
    if (act === "fav") { toggleFav(detailN); renderDetail(); }
    if (act === "share") shareName(NAMES[detailN - 1]);
  });

  function shareName(n) {
    var text = n.ar + "\n" + n.tr + " — " + n.en + "\n\n" + n.benefit;
    if (navigator.share) {
      navigator.share({ title: n.tr, text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast("Copied to clipboard"); }, function () {});
    }
  }

  // ---------- Favourites ----------
  function toggleFav(num) {
    if (favs.has(num)) favs.delete(num); else favs.add(num);
    save(FAVS_KEY, Array.from(favs));
    document.querySelectorAll('.fav[data-fav="' + num + '"]').forEach(function (b) {
      b.classList.toggle("on", favs.has(num));
    });
    renderChips();
    if (settings.filter === "fav") render();
  }

  // ---------- Toast ----------
  var toastEl = null, toastTimer = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  // ---------- Events ----------
  chips.addEventListener("click", function (e) {
    var c = e.target.closest(".chip");
    if (!c) return;
    settings.filter = c.dataset.filter;
    persist();
    cardIndex = 0;
    renderChips();
    render();
    content.scrollTop = 0;
  });

  content.addEventListener("click", function (e) {
    var fav = e.target.closest(".fav");
    if (fav) { toggleFav(+fav.dataset.fav); return; }
    if (settings.layout === "recite") {
      if (body.classList.contains("controls-hidden")) showReciteControls();
      else togglePlay();
      return;
    }
    if (settings.layout === "cards") return;
    var item = e.target.closest(".name");
    if (item) openDetail(+item.dataset.n);
  });

  $("tabbar").addEventListener("click", function (e) {
    var b = e.target.closest("[data-layout]");
    if (b) setLayout(b.dataset.layout);
  });

  $("btnMode").addEventListener("click", function () {
    var i = DISPLAY_ORDER.indexOf(settings.display);
    setSetting("display", DISPLAY_ORDER[(i + 1) % DISPLAY_ORDER.length]);
    toast("Showing: " + { name: "name only", meaning: "name & meaning", benefit: "meaning & benefits" }[settings.display]);
  });

  $("btnSettings").addEventListener("click", function () { openSheet($("settingsSheet")); });
  $("btnAbout").addEventListener("click", function () { openSheet($("aboutSheet")); });

  $("btnSearch").addEventListener("click", function () {
    $("searchbar").hidden = false;
    $("searchInput").focus();
  });
  $("searchInput").addEventListener("input", function (e) {
    query = e.target.value;
    cardIndex = 0;
    render();
  });
  $("btnSearchClose").addEventListener("click", function () {
    $("searchInput").value = "";
    query = "";
    $("searchbar").hidden = true;
    render();
  });

  $("btnPlay").addEventListener("click", togglePlay);
  $("btnRecitePlay").addEventListener("click", function () { togglePlay(); showReciteControls(); });
  $("btnExitRecite").addEventListener("click", closeTop);
  $("btnSlower").addEventListener("click", function () { setSetting("speed", Math.max(10, settings.speed - 10)); showReciteControls(); });
  $("btnFaster").addEventListener("click", function () { setSetting("speed", Math.min(200, settings.speed + 10)); showReciteControls(); });
  $("btnPrev").addEventListener("click", function () { goCard(cardIndex - 1); restartIfPlaying(); });
  $("btnNext").addEventListener("click", function () { goCard(cardIndex + 1); restartIfPlaying(); });

  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input")) return;
    if (e.key === " ") { e.preventDefault(); togglePlay(); showReciteControls(); }
    else if (e.key === "Escape") closeTop();
    else if (settings.layout === "cards" && e.key === "ArrowRight") goCard(cardIndex + 1);
    else if (settings.layout === "cards" && e.key === "ArrowLeft") goCard(cardIndex - 1);
  });

  window.addEventListener("resize", function () {
    if (settings.layout === "cards") goCard(cardIndex, false);
  });

  // ---------- Init ----------
  buildSettingsUI();
  applyAppearance();
  renderChips();
  render();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !window.Capacitor) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
