(function () {
  "use strict";
  var el = function (i) { return document.getElementById(i); };
  var NS = "http://www.w3.org/2000/svg";
  function mk(t, a, x) {
    var n = document.createElementNS(NS, t);
    for (var k in a) n.setAttribute(k, a[k]);
    if (x != null) n.textContent = x;
    return n;
  }
  function pct(v) { return (Math.round(v * 10) / 10) + "%"; }
  function setCurrent(node, on) {
    if (on) node.setAttribute("aria-current", "true");
    else node.removeAttribute("aria-current");
  }

  /* Idaho market series is downsampled from shared/fixtures/replay-market.json.
     Evidence path is illustrative except the Aug 6 12:00 snapshot (social 86). */
  var MARKETS = [
    {
      id: "idaho",
      venue: "Polymarket · resolved Aug 11",
      vol: "$18,470",
      q: "What will be the top US Netflix show this week?",
      feedTitle: "Week of Aug 4 · Idaho Murders",
      focus: "The Idaho Murders: College Nightmare: Season 1",
      blurb: "At the Aug 6 noon cutoff the market still priced Idaho Murders at 48% against social evidence already at 86.",
      market:   [42.5, 44.5, 43, 44.5, 48, 72, 89.5, 92.5, 93.5, 94, 54, 95, 94.5, 97.5, 99.5],
      evidence: [48, 55, 62, 71, 86, 87, 88, 88, 89, 89, 88, 90, 90, 91, 92],
      times: ["Aug 6 02:00","Aug 6 06:00","Aug 6 08:00","Aug 6 10:00","Aug 6 12:00","Aug 6 14:00","Aug 6 16:00","Aug 6 20:00","Aug 7 00:00","Aug 7 12:00","Aug 7 14:00","Aug 7 18:00","Aug 8 12:00","Aug 9 12:00","Aug 11 20:00"],
      xTicks: [[0,"Aug 6"],[4,"Noon"],[6,"4pm"],[10,"Aug 7"],[14,"Aug 11"]],
      score: 78, confidence: 73, side: "YES", verdict: "Diverged", tone: "flag", flagAt: 4,
      ranks: [["The Idaho Murders: College Nightmare", 48]],
      explain: "At the Aug 6 noon cutoff the market still priced Idaho Murders at 48% while social evidence was already at 86 and rising. The rest of the field was not moving with it. Drift flagged the gap here — four hours later the CLOB had repriced to 90%.",
      reasons: [
        "Captured social score 86 vs market 48% at the Aug 6 12:00 cutoff.",
        "Evidence trend in that window is rising, not a one-hour spike.",
        "The CLOB then jumped 48 → 90 in four hours, which is the repricing the flag is for."
      ],
      counter: "A true-crime drop often spikes conversation before it spikes the Top 10, and 48% on a three-show field is a two-way book, not a sleeping market. The Aug 7 dip back to 54% is also in the tape — the first jump was not clean.",
      sources: [
        ["X · Evidence Scout", "ev", "College Nightmare is the only title people are finishing overnight."],
        ["Grok web / Tudum", "ev", "Social 86 · web 74 · trend rising as of Aug 6 12:00."],
        ["Polymarket CLOB", "mk", "Idaho Murders 0.48 at cutoff · 0.90 by 16:00 the same day."]
      ],
      outcomes: [["Idaho Murders","48%"],["Rest of field","52%"]],
      replay: [
        { at: 1,  score: 18, confidence: 40, side: "WATCH", verdict: "Aligned", tone: "calm", label: "Market still unsure", when: "Aug 6 2am",
          explain: "Idaho Murders is in the low forties. Public evidence is nearby. Nothing here needs a decision yet.",
          reasons: ["Market and evidence are within ten points.", "No sustained one-way move in either series."],
          counter: "Ten points is not zero. If evidence keeps climbing while the price holds, this becomes a flag within a day." },
        { at: 4,  score: 41, confidence: 55, side: "WATCH", verdict: "Watching", tone: "mute", label: "Evidence pulls ahead", when: "Aug 6 10am",
          explain: "Evidence has climbed into the seventies while the market is still at 44.5%. The gap is widening in one direction — the pattern that usually precedes a flag — but it is still morning.",
          reasons: ["Evidence up ~23 points since 2am.", "Price has not followed."],
          counter: "Morning social volume around a drop night is noisy. A single viral post produces this shape." },
        { at: 5,  score: 78, confidence: 73, side: "YES", verdict: "Diverged", tone: "flag", label: "Drift flags it", when: "Aug 6 noon",
          explain: "At the Aug 6 noon cutoff the market still priced Idaho Murders at 48% while social evidence was already at 86 and rising. The rest of the field was not moving with it. Drift flagged the gap here — four hours later the CLOB had repriced to 90%.",
          reasons: [
            "Captured social score 86 vs market 48% at the Aug 6 12:00 cutoff.",
            "Evidence trend in that window is rising, not a one-hour spike.",
            "The CLOB then jumped 48 → 90 in four hours, which is the repricing the flag is for."
          ],
          counter: "A true-crime drop often spikes conversation before it spikes the Top 10, and 48% on a three-show field is a two-way book, not a sleeping market. The Aug 7 dip back to 54% is also in the tape — the first jump was not clean." },
        { at: 7,  score: 22, confidence: 68, side: "WATCH", verdict: "Closing", tone: "mute", label: "Market reprices", when: "Aug 6 4pm",
          explain: "The market has moved from 48% to 89.5% in four hours and is now heading toward the evidence rather than away from it. The gap Drift flagged at noon is closing from the price side.",
          reasons: ["Price +41.5 points since the flag.", "Evidence still high, not reversing."],
          counter: "Catching up is not the same as being led. A press cycle both signals reacted to independently would look like this too." },
        { at: 15, score: 9, confidence: 82, side: "YES", verdict: "Resolved", tone: "calm", label: "Outcome revealed", when: "Aug 11",
          explain: "Idaho Murders resolved as the official #1. The market finished at 99.5%. The divergence Drift flagged at noon on Aug 6 no longer exists — the price got there first, the Top 10 confirmed it later.",
          reasons: ["Official Tudum rank: Idaho Murders #1 for the week of Aug 4.", "Settled near 1.00 on Polymarket."],
          counter: "One resolved week is not a track record. The honest read is that the signal appeared early here — not that it will every time." }
      ]
    },
    {
      id: "live",
      venue: "Polymarket · resolves Aug 18",
      vol: "$37,278",
      q: "What will be the top US Netflix show this week?",
      feedTitle: "This week · Walter Boys",
      focus: "My Life With the Walter Boys: Season 3",
      blurb: "Market prices Walter Boys at 93.7%, in line with public evidence. No flag.",
      market:   [88, 89, 90, 91, 91, 92, 92, 93, 93, 93.5, 94, 93.5, 94, 93.7, 93.7],
      evidence: [86, 87, 88, 89, 90, 90, 91, 91, 92, 92, 91, 92, 92, 91, 90],
      times: ["Aug 2","Aug 3","Aug 4","Aug 5","Aug 6","Aug 7","Aug 8","Aug 9","Aug 10","Aug 11","Aug 12","Aug 13","Aug 14","Aug 15","Aug 15"],
      xTicks: [[0,"Aug 2"],[4,"Aug 6"],[8,"Aug 10"],[14,"Now"]],
      score: 12, confidence: 81, side: "WATCH", verdict: "Aligned", tone: "calm", flagAt: null,
      ranks: [["My Life With the Walter Boys: Season 3", 93.7], ["Tires: Season 3", 6.2], ["Conversations with a Killer: The Charles Manson Tapes", 0.8]],
      explain: "Walter Boys is 93.7% on the CLOB and the public evidence is in the same band. Drift treats this as agreement — the market is already pricing the likely #1.",
      reasons: [
        "Leading show at 93.7% with Tires at 6.2% and Manson Tapes at 0.8%.",
        "Evidence score sits within twelve points of the market.",
        "No one-way gap opening over the current window."
      ],
      counter: "Agreement is not confirmation. Both signals could be following the same release-week cycle, which means they would also be wrong together.",
      sources: [
        ["Polymarket CLOB", "mk", "Walter Boys 0.937 · Tires 0.0615 · Manson Tapes 0.008."],
        ["Evidence Scout", "ev", "Public evidence tracking the leader, no breakout on the long shots."]
      ],
      outcomes: [["Walter Boys","93.7%"],["Tires","6.2%"],["Manson Tapes","0.8%"]]
    }
  ];

  var POSITIONS = [
    ["Idaho Murders · Netflix #1 week of Aug 4", "48%", "100%", "$100", "+$108.33"],
    ["Walter Boys · Netflix #1 this week", "93.7%", "93.7%", "$50", "$0.00"]
  ];

  function spark(m, e) {
    var W = 120, H = 38, n = m.length;
    var all = m.concat(e), lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var pad = Math.max(3, (hi - lo) * 0.12); lo -= pad; hi += pad;
    function X(i) { return (i / Math.max(1, n - 1)) * (W - 4) + 2; }
    function Y(v) { return H - 4 - ((v - lo) / (hi - lo)) * (H - 8); }
    function d(a) {
      var s = "";
      for (var i = 0; i < a.length; i++) s += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(a[i]).toFixed(1) + " ";
      return s;
    }
    var area = d(m);
    for (var j = e.length - 1; j >= 0; j--) area += "L" + X(j).toFixed(1) + " " + Y(e[j]).toFixed(1) + " ";
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">'
      + '<path d="' + area + 'Z" fill="var(--gap-fill)"/>'
      + '<path d="' + d(m) + '" fill="none" stroke="var(--market)" stroke-width="1.5" stroke-linecap="round"/>'
      + '<path d="' + d(e) + '" fill="none" stroke="var(--evidence)" stroke-width="1.5" stroke-linecap="round"/>'
      + '<circle cx="' + X(n - 1).toFixed(1) + '" cy="' + Y(e[n - 1]).toFixed(1) + '" r="2.4" fill="var(--evidence)"/>'
      + '<circle cx="' + X(n - 1).toFixed(1) + '" cy="' + Y(m[n - 1]).toFixed(1) + '" r="2.4" fill="var(--market)"/></svg>';
  }

  var filter = "all";
  function flaggedCount() { return MARKETS.filter(function (m) { return m.tone === "flag"; }).length; }
  function headline() {
    var n = flaggedCount();
    if (n === 0) return "Every tracked market agrees with the crowd.";
    if (n === 1) return "One market has stopped agreeing with the crowd.";
    return n + " markets have stopped agreeing with the crowd.";
  }

  function drawFeed() {
    var host = el("rows"); host.textContent = "";
    var shown = MARKETS.filter(function (m) {
      if (filter === "all") return true;
      if (filter === "flag") return m.tone === "flag";
      return m.tone === "calm";
    });
    shown.sort(function (a, b) { return b.score - a.score; });

    shown.forEach(function (m) {
      var fi = m.flagAt != null ? m.flagAt : m.market.length - 1;
      var sparkM = m.flagAt != null ? m.market.slice(0, m.flagAt + 1) : m.market;
      var sparkE = m.flagAt != null ? m.evidence.slice(0, m.flagAt + 1) : m.evidence;
      var b = document.createElement("button");
      b.className = "row"; b.type = "button";
      b.innerHTML =
        '<span class="q"><span class="q-t">' + (m.feedTitle || m.q) + '</span>'
        + '<span class="q-x">' + m.blurb + '</span>'
        + '<span class="q-m"><span>' + m.venue + '</span><span>' + m.focus + '</span><span>Vol ' + m.vol + '</span><span class="why-link">View Why</span></span></span>'
        + '<span class="hide-s">' + spark(sparkM, sparkE) + '</span>'
        + '<span class="num big r hide-s">' + pct(m.market[fi]) + '</span>'
        + '<span class="num r hide-s">' + m.evidence[fi] + '</span>'
        + '<span class="r"><span class="pill ' + m.tone + '"><i class="dot"></i>' + m.side + ' · ' + m.score + '</span></span>';
      b.addEventListener("click", function () { openDetail(m); });
      host.appendChild(b);
    });
    el("n-flagged").textContent = flaggedCount();
    el("feed-h").textContent = headline();
  }

  el("filter").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-f]"); if (!b) return;
    filter = b.dataset.f;
    this.querySelectorAll("button").forEach(function (x) {
      x.setAttribute("aria-pressed", x === b ? "true" : "false");
    });
    drawFeed();
  });

  var W = 760, H = 240, PL = 44, PR = 54, PT = 16, PB = 28, YMIN = 0, YMAX = 100;
  function X(i, n) { return PL + (i / Math.max(1, n - 1)) * (W - PL - PR); }
  function Y(v) { return PT + (1 - (v - YMIN) / (YMAX - YMIN)) * (H - PT - PB); }
  function lp(a, n) {
    var d = "";
    for (var i = 0; i < a.length; i++) d += (i ? "L" : "M") + X(i, n).toFixed(1) + " " + Y(a[i]).toFixed(1) + " ";
    return d.trim();
  }
  function ap(a, b, n) {
    var d = lp(a, n) + " ";
    for (var j = b.length - 1; j >= 0; j--) d += "L" + X(j, n).toFixed(1) + " " + Y(b[j]).toFixed(1) + " ";
    return d + "Z";
  }

  function drawGrid(m) {
    var g = el("g-grid"); g.textContent = "";
    [0, 25, 50, 75, 100].forEach(function (v) {
      g.appendChild(mk("line", { x1: PL, x2: W - PR, y1: Y(v), y2: Y(v), class: "grid-line" }));
      g.appendChild(mk("text", { x: PL - 10, y: Y(v) + 3.5, class: "axis-txt", "text-anchor": "end" }, String(v)));
    });
    var n = m.market.length;
    (m.xTicks || []).forEach(function (t) {
      g.appendChild(mk("text", { x: X(t[0], n), y: H - 7, class: "axis-txt", "text-anchor": "middle" }, t[1]));
    });
  }

  var CUR = null, CURSTOP = 0;

  function paint(upto, s) {
    var m = CUR.market.slice(0, upto), e = CUR.evidence.slice(0, upto), n = CUR.market.length;
    el("p-market").setAttribute("d", lp(m, n));
    el("p-evidence").setAttribute("d", lp(e, n));
    el("p-gap").setAttribute("d", ap(m, e, n));

    var ends = el("g-ends"); ends.textContent = "";
    var ex = X(upto - 1, n);
    [[m, "market", true], [e, "evidence", false]].forEach(function (p) {
      var v = p[0][p[0].length - 1], c = "var(--" + p[1] + ")";
      ends.appendChild(mk("circle", { cx: ex, cy: Y(v), r: 5.5, fill: "var(--card)", stroke: c, "stroke-width": 2.5 }));
      ends.appendChild(mk("text", { x: ex + 11, y: Y(v) + 4, class: "end-label", fill: c }, p[2] ? pct(v) : String(v)));
    });

    var fg = el("g-flag"); fg.textContent = "";
    var fd = CUR.flagAt;
    if (fd != null && upto - 1 >= fd) {
      var fx = X(fd, n);
      fg.appendChild(mk("line", { x1: fx, x2: fx, y1: PT, y2: H - PB, stroke: "var(--flag)", "stroke-width": 1, "stroke-dasharray": "3 4", opacity: ".55" }));
      fg.appendChild(mk("text", { x: fx + 6, y: PT + 11, class: "axis-txt", fill: "var(--flag)" }, "flagged"));
    }

    var sc = s || CUR;
    el("d-score").textContent = sc.score;
    el("d-score").style.color = sc.tone === "flag" ? "var(--flag)" : "var(--ink)";
    el("d-odds").textContent = pct(m[m.length - 1]);
    el("d-ev").textContent = e[e.length - 1];
    el("d-conf").textContent = sc.confidence + " confidence";
    el("d-explain").textContent = sc.explain;
    el("d-counter").textContent = sc.counter;
    var pill = el("d-pill");
    pill.className = "pill " + sc.tone;
    pill.lastElementChild.textContent = sc.side + " · " + sc.verdict;

    var rh = el("d-reasons"); rh.textContent = "";
    (sc.reasons || CUR.reasons).forEach(function (r) {
      var li = document.createElement("li"); li.textContent = r; rh.appendChild(li);
    });

    if (CUR.ranks && CUR.ranks.length) {
      var ranks = CUR.ranks.slice();
      ranks[0] = [ranks[0][0], m[m.length - 1]];
      renderRanks(ranks);
    }

    el("t-market").textContent = pct(m[m.length - 1]);
    el("t-ev").textContent = e[e.length - 1];
    el("t-tr").textContent = (e[e.length - 1] >= e[0] ? "+" : "") + Math.round(e[e.length - 1] - e[0]);
    el("t-cor").textContent = sc.score + " / 100";
    el("t-cor-dot").style.background = sc.tone === "flag" ? "var(--flag)" : "var(--calm)";
  }

  function renderRanks(ranks) {
    var host = el("d-ranks"); host.textContent = "";
    ranks.forEach(function (r, i) {
      var d = document.createElement("div");
      d.className = "rank" + (i === 0 ? " lead" : "");
      d.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="show">' + r[0] + '</span><span class="p">' + pct(r[1]) + '</span>';
      host.appendChild(d);
    });
  }

  function openDetail(m) {
    CUR = m;
    el("d-venue").textContent = m.venue;
    el("d-q").textContent = m.q;
    el("d-vol").textContent = m.vol;
    drawGrid(m);

    var sh = el("d-sources"); sh.textContent = "";
    m.sources.forEach(function (s) {
      var d = document.createElement("div");
      d.className = "src";
      d.innerHTML = '<div class="src-top"><i class="dot" style="background:var(--' + (s[1] === "mk" ? "market" : "evidence") + ')"></i>' + s[0] + '</div><q>' + s[2] + '</q>';
      sh.appendChild(d);
    });

    var host = el("stops"); host.textContent = "";
    if (m.replay) {
      el("stops").hidden = false; el("locked").hidden = true;
      m.replay.forEach(function (s, i) {
        var b = document.createElement("button");
        b.className = "stop"; b.type = "button";
        b.innerHTML = '<span class="stop-pin"></span><span class="stop-txt"><span class="stop-day">' + s.when + '</span><br>' + s.label + '</span>';
        b.addEventListener("click", function () { setStop(i); });
        host.appendChild(b);
      });
      setStop(2);
    } else {
      el("stops").hidden = true; el("locked").hidden = false;
      paint(m.market.length, null);
    }

    var oh = el("outcomes"); oh.textContent = ""; var chosen = 0;
    m.outcomes.forEach(function (o, i) {
      var b = document.createElement("button");
      b.className = "outcome"; b.type = "button";
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.innerHTML = o[0] + ' <span>' + o[1] + '</span>';
      b.addEventListener("click", function () {
        chosen = i;
        oh.querySelectorAll(".outcome").forEach(function (x, j) {
          x.setAttribute("aria-pressed", j === i ? "true" : "false");
        });
        el("place").disabled = false; el("place").textContent = "Log paper position";
        el("filled").classList.remove("on");
      });
      oh.appendChild(b);
    });
    el("place").disabled = false;
    el("place").textContent = "Log paper position";
    el("filled").classList.remove("on");
    el("place").onclick = function () {
      var o = m.outcomes[chosen];
      this.disabled = true; this.textContent = "Position logged";
      el("filled-txt").textContent = "$100 on " + o[0] + " at " + o[1] + " · paper only";
      el("filled").classList.add("on");
    };

    show("detail");
    window.scrollTo(0, 0);
  }

  function setStop(i) {
    CURSTOP = i;
    var s = CUR.replay[i];
    paint(s.at, s);
    document.querySelectorAll(".stop").forEach(function (b, j) { setCurrent(b, j === i); });
  }

  (function () {
    var svg = el("chart"), shell = svg.parentNode, tip = el("tip"), g = el("g-hover");
    shell.addEventListener("pointerleave", function () { g.textContent = ""; tip.classList.remove("on"); });
    shell.addEventListener("pointermove", function (ev) {
      if (!CUR) return;
      var r = svg.getBoundingClientRect(), n = CUR.market.length;
      var upto = CUR.replay ? CUR.replay[CURSTOP].at : n;
      var px = ((ev.clientX - r.left) / r.width) * W;
      var i = Math.round(((px - PL) / (W - PL - PR)) * (n - 1));
      i = Math.max(0, Math.min(upto - 1, i));
      g.textContent = "";
      var cx = X(i, n);
      g.appendChild(mk("line", { x1: cx, x2: cx, y1: PT, y2: H - PB, stroke: "var(--hairline-2)", "stroke-width": 1 }));
      g.appendChild(mk("circle", { cx: cx, cy: Y(CUR.market[i]), r: 4.5, fill: "var(--market)", stroke: "var(--card)", "stroke-width": 2 }));
      g.appendChild(mk("circle", { cx: cx, cy: Y(CUR.evidence[i]), r: 4.5, fill: "var(--evidence)", stroke: "var(--card)", "stroke-width": 2 }));
      el("tip-day").textContent = CUR.times[i];
      el("tip-m").textContent = pct(CUR.market[i]);
      el("tip-e").textContent = CUR.evidence[i];
      el("tip-g").textContent = Math.round((CUR.evidence[i] - CUR.market[i]) * 10) / 10 + " pts";
      tip.classList.add("on");
      var left = (cx / W) * r.width + 18;
      if (left > r.width - 174) left = (cx / W) * r.width - 174;
      tip.style.left = Math.max(0, left) + "px";
      tip.style.top = Math.max(0, (Y(Math.max(CUR.market[i], CUR.evidence[i])) / H) * r.height - 12) + "px";
    });
  })();

  (function () {
    var host = el("pos-rows");
    POSITIONS.forEach(function (p) {
      var up = p[4].charAt(0) === "+";
      var flat = p[4].charAt(0) === "$";
      var d = document.createElement("div");
      d.className = "pos-row";
      d.innerHTML = '<span class="q-t">' + p[0] + '</span>'
        + '<span class="num hide-s">' + p[1] + '</span>'
        + '<span class="num r hide-s">' + p[2] + '</span>'
        + '<span class="num r">' + p[3] + '</span>'
        + '<span class="num r ' + (flat ? "" : up ? "up" : "down") + '">' + p[4] + '</span>';
      host.appendChild(d);
    });
  })();

  function show(v) {
    ["feed", "detail", "positions"].forEach(function (k) { el("v-" + k).hidden = k !== v; });
    document.querySelectorAll(".nav button[data-go]").forEach(function (b) {
      setCurrent(b, b.dataset.go === v || (v === "detail" && b.dataset.go === "feed"));
    });
  }
  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () { show(b.dataset.go); window.scrollTo(0, 0); });
  });

  var modal = el("watch-modal");
  function closeWatch() { modal.hidden = true; el("watch-input").value = ""; }
  el("watch-open").addEventListener("click", function () { modal.hidden = false; el("watch-input").focus(); });
  el("watch-cancel").addEventListener("click", closeWatch);
  modal.addEventListener("click", function (ev) { if (ev.target === modal) closeWatch(); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !modal.hidden) closeWatch(); });
  el("watch-add").addEventListener("click", function () {
    var q = el("watch-input").value.trim();
    if (!q) { el("watch-input").focus(); return; }
    MARKETS.push({
      id: "watch-" + Date.now(),
      venue: "Watching · no market yet",
      vol: "—",
      q: q,
      feedTitle: q,
      focus: q,
      blurb: "Pinned. Drift will score this once a market and an evidence window exist.",
      market: [50,50,50,50,50,50,50,50,50,50,50,50,50,50,50],
      evidence: [50,50,50,50,50,50,50,50,50,50,50,50,50,50,50],
      times: ["—","—","—","—","—","—","—","—","—","—","—","—","—","—","—"],
      xTicks: [[0,"—"],[14,"—"]],
      score: 0, confidence: 0, side: "WATCH", verdict: "Watching", tone: "mute", flagAt: null,
      ranks: [[q, 50]],
      explain: "This topic is watched, not scored. Add a Polymarket market and an evidence window before Drift will take a side.",
      reasons: ["No CLOB price yet.", "No evidence window yet."],
      counter: "A watched topic with no market is a reminder, not a signal.",
      sources: [],
      outcomes: [[q, "—"]]
    });
    closeWatch();
    filter = "all";
    el("filter").querySelectorAll("button").forEach(function (x) {
      x.setAttribute("aria-pressed", x.dataset.f === "all" ? "true" : "false");
    });
    drawFeed();
    show("feed");
  });

  drawFeed();
  show("feed");
})();
