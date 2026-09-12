/* Shared game engine for the Buc-ee's opportunity and threat exercise.

   A page defines window.PAGE before loading this file, for example:

     PAGE = {
       title: "Part 1",
       rounds: [ {key:"r1", mode:"single", hunt:"o"},
                 {key:"r2", mode:"single", hunt:"x"} ],
       finalSummary: false
     };

   hunt "o" means the student is hunting opportunities, hunt "x" means threats.
   Everything is kept in localStorage, which is shared across the three pages
   because they sit on one origin. Nothing is sent anywhere. */

(function () {
  "use strict";

  var app = document.getElementById("app");
  var KEY = "swot2026.";

  // ---- storage ----------------------------------------------------------

  function save(k, v) {
    try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* private mode */ }
  }
  function load(k) {
    try { var s = localStorage.getItem(KEY + k); return s ? JSON.parse(s) : null; }
    catch (e) { return null; }
  }

  // ---- helpers ----------------------------------------------------------

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pairById(id) {
    for (var i = 0; i < PAIRS.length; i++) if (PAIRS[i].id === id) return PAIRS[i];
    return null;
  }
  function ambById(id) {
    for (var i = 0; i < AMBIGUOUS.length; i++) if (AMBIGUOUS[i].id === id) return AMBIGUOUS[i];
    return null;
  }
  function median(ns) {
    if (!ns.length) return null;
    var s = ns.slice().sort(function (a, b) { return a - b; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
  }
  function pct(n, d) { return d ? Math.round((n / d) * 100) : null; }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function huntWord(h) { return h === "o" ? "OPPORTUNITY" : "THREAT"; }

  // ---- deck building ----------------------------------------------------

  // Single-card round: six mirror pairs (both sides) plus four ambiguous cards.
  function buildSingleDeck(spec) {
    var deck = [];
    spec.pairs.forEach(function (pid) {
      var p = pairById(pid);
      deck.push({ kind: "o", pair: pid, text: p.o.t });
      deck.push({ kind: "x", pair: pid, text: p.x.t });
    });
    (spec.ambig || []).forEach(function (aid) {
      var a = ambById(aid);
      deck.push({ kind: "amb", id: aid, text: a.t });
    });
    return shuffle(deck);
  }

  // Three-at-once round: each trial is one target plus two of the opposite
  // valence, never drawn from the same mirror pair as the target.
  function buildTripleDeck(spec, hunt) {
    var other = hunt === "o" ? "x" : "o";
    var targets = shuffle(spec.pairs).map(function (pid) {
      var p = pairById(pid);
      return { kind: hunt, pair: pid, text: p[hunt].t };
    });
    var trials = [];
    targets.forEach(function (tgt) {
      var pool = shuffle(spec.pairs.filter(function (pid) { return pid !== tgt.pair; }));
      var d1 = pairById(pool[0]), d2 = pairById(pool[1]);
      var cards = [
        tgt,
        { kind: other, pair: d1.id, text: d1[other].t },
        { kind: other, pair: d2.id, text: d2[other].t }
      ];
      trials.push(shuffle(cards));
    });
    return trials;
  }

  // ---- screens ----------------------------------------------------------

  function clear() { app.innerHTML = ""; }

  function screenIntro(round, idx, total, onGo) {
    clear();
    var h = huntWord(round.hunt);
    var tone = round.hunt === "o" ? "var(--green)" : "var(--red)";
    var wrap = el("div");

    wrap.appendChild(el("p", "small dim", PAGE.title + " &middot; round " + (idx + 1) + " of " + total));
    wrap.appendChild(el("h1", null, "You run Buc-ee&rsquo;s."));

    if (round.mode === "single") {
      wrap.appendChild(el("p", null,
        "One event at a time. Your only question is:"));
      wrap.appendChild(el("h2", null,
        "Is this <span style='color:" + tone + "'>" + (round.hunt === "o" ? "an OPPORTUNITY" : "a THREAT") + "</span>?"));
      wrap.appendChild(el("p", null, "Answer <b>YES</b> or <b>NO</b> as fast as you can."));
    } else {
      wrap.appendChild(el("p", null, "Three events land at the same time."));
      wrap.appendChild(el("h2", null,
        "Tap the <span style='color:" + tone + "'>" + h + "</span>."));
      wrap.appendChild(el("p", null, "Exactly one of the three is the right answer."));
    }

    wrap.appendChild(el("p", "small dim",
      ROUND_SECONDS + " seconds. There are more cards than you can finish, which is deliberate."));

    var sp = el("div", "spacer"); wrap.appendChild(sp);

    if (idx === 0 && PAGE.disclose !== false) {
      wrap.appendChild(el("p", "tiny dim",
        "Some of these events are real Buc-ee&rsquo;s news and some were written for this class. " +
        "Your instructor will tell you which is which afterwards."));
    }

    var go = el("button", "btn", "Start round " + (idx + 1));
    go.onclick = onGo;
    wrap.appendChild(go);
    app.appendChild(wrap);
  }

  function screenPlay(round, deck, onDone) {
    clear();
    var log = [], i = 0, locked = false, shownAt = 0, ended = false;

    var bar = el("div"); bar.id = "bar";
    var prompt = el("div", null,
      round.mode === "single"
        ? "Is this <span class='hunt-" + round.hunt + "'>" + (round.hunt === "o" ? "an OPPORTUNITY" : "a THREAT") + "</span>?"
        : "Tap the <span class='hunt-" + round.hunt + "'>" + huntWord(round.hunt) + "</span>");
    prompt.id = "prompt";
    var clock = el("div", null, ROUND_SECONDS); clock.id = "clock";
    bar.appendChild(prompt); bar.appendChild(clock);

    var stage = el("div"); stage.id = "stage";
    app.appendChild(bar); app.appendChild(stage);

    var answers = null;
    if (round.mode === "single") {
      answers = el("div"); answers.id = "answers";
      var yes = el("button", "btn yes", "YES");
      var no = el("button", "btn no", "NO");
      yes.onclick = function () { respond(true); };
      no.onclick = function () { respond(false); };
      answers.appendChild(yes); answers.appendChild(no);
      app.appendChild(answers);
    }

    // timer
    var t0 = Date.now();
    var tick = setInterval(function () {
      var left = ROUND_SECONDS - Math.floor((Date.now() - t0) / 1000);
      if (left <= 0) { clock.textContent = "0"; finish(); return; }
      clock.textContent = left;
      if (left <= 10) clock.classList.add("low");
    }, 200);

    function finish() {
      if (ended) return;
      ended = true;
      clearInterval(tick);
      onDone({ log: log, reached: i, deckSize: deck.length, seconds: ROUND_SECONDS });
    }

    function next() {
      if (ended) return;
      if (i >= deck.length) { finish(); return; }
      stage.innerHTML = "";
      locked = false;
      shownAt = Date.now();

      if (round.mode === "single") {
        var c = deck[i];
        var card = el("div", "evt", c.text);
        card.id = "current";
        stage.appendChild(card);
      } else {
        deck[i].forEach(function (c, k) {
          var card = el("div", "evt tap", c.text);
          card.onclick = function () { pick(k); };
          stage.appendChild(card);
        });
      }
    }

    function flash(node, cls, ms, after) {
      node.classList.add(cls);
      setTimeout(function () { if (!ended) after(); }, ms);
    }

    function respond(said) {
      if (locked || ended) return;
      locked = true;
      var c = deck[i], ms = Date.now() - shownAt;
      var card = document.getElementById("current");

      if (c.kind === "amb") {
        // No right answer. "Yes" in an opportunity round means they read it as an
        // opportunity; "yes" in a threat round means they read it as a threat.
        var leanedThreat = (round.hunt === "o") ? !said : said;
        log.push({ kind: "amb", id: c.id, leanedThreat: leanedThreat, ms: ms });
        flash(card, "neut", 260, function () { i++; next(); });
        return;
      }

      var correct = (said === (c.kind === round.hunt));
      log.push({ kind: c.kind, pair: c.pair, said: said, correct: correct, ms: ms });
      flash(card, correct ? "ok" : "bad", correct ? 240 : 800, function () { i++; next(); });
    }

    function pick(k) {
      if (locked || ended) return;
      locked = true;
      var cards = deck[i], c = cards[k], ms = Date.now() - shownAt;
      var correct = (c.kind === round.hunt);
      log.push({ kind: c.kind, pair: c.pair, correct: correct, ms: ms, trial: true });
      var nodes = stage.children;
      flash(nodes[k], correct ? "ok" : "bad", correct ? 260 : 800, function () { i++; next(); });
    }

    next();
  }

  // ---- scoring ----------------------------------------------------------

  function scoreSingle(round, res) {
    var seen = res.log.filter(function (r) { return r.kind !== "amb"; });
    var hunt = round.hunt, other = hunt === "o" ? "x" : "o";

    var hits = seen.filter(function (r) { return r.kind === hunt && r.said; }).length;
    var wavedThrough = seen.filter(function (r) { return r.kind === hunt && !r.said; }).length;
    var falsePos = seen.filter(function (r) { return r.kind === other && r.said; }).length;

    // Cards of the hunted kind that the clock never let them reach.
    var neverReached = res.targetsTotal - hits - wavedThrough;
    if (neverReached < 0) neverReached = 0;

    var amb = res.log.filter(function (r) { return r.kind === "amb"; });
    var leanedThreat = amb.filter(function (r) { return r.leanedThreat; }).length;

    return {
      mode: "single", hunt: hunt,
      hits: hits, wavedThrough: wavedThrough, neverReached: neverReached,
      totalMissed: wavedThrough + neverReached,
      falsePos: falsePos,
      targetsTotal: res.targetsTotal,
      decisions: res.log.length,
      eventsScanned: res.log.length,
      accuracy: pct(seen.filter(function (r) { return r.correct; }).length, seen.length),
      medianMs: median(seen.map(function (r) { return r.ms; })),
      ambSeen: amb.length, ambLeanedThreat: leanedThreat
    };
  }

  function scoreTriple(round, res) {
    var trials = res.log;
    var hits = trials.filter(function (r) { return r.correct; }).length;
    var wrong = trials.length - hits;
    var neverReached = res.deckSize - trials.length;
    return {
      mode: "triple", hunt: round.hunt,
      hits: hits, wavedThrough: wrong, neverReached: neverReached,
      totalMissed: wrong + neverReached,
      falsePos: wrong,
      targetsTotal: res.deckSize,
      decisions: trials.length,
      eventsScanned: trials.length * 3,
      accuracy: pct(hits, trials.length),
      medianMs: median(trials.map(function (r) { return r.ms; })),
      ambSeen: 0, ambLeanedThreat: 0
    };
  }

  // ---- round result screen ---------------------------------------------

  function stat(cls, n, lab, sub) {
    var s = el("div", "stat " + (cls || ""));
    s.appendChild(el("div", "n", String(n)));
    s.appendChild(el("div", "lab", lab));
    if (sub) s.appendChild(el("div", "sub", sub));
    return s;
  }

  function screenRoundResult(round, sc, isLast, onNext) {
    clear();
    var wrap = el("div");
    var opp = round.hunt === "o";

    wrap.appendChild(el("h1", null, opp ? "Opportunities" : "Threats"));
    wrap.appendChild(el("p", "small dim",
      round.mode === "single" ? "One event at a time." : "Three events at once."));

    if (opp) {
      // Opportunity rounds are scored on volume, with a penalty for chasing a mirage.
      wrap.appendChild(stat("headline good", sc.hits,
        "opportunities you found",
        "In this half of a SWOT, volume is the point. You cannot exploit what you never put on the list."));
      wrap.appendChild(stat("bad", sc.falsePos,
        sc.falsePos === 1 ? "mirage you chased" : "mirages you chased",
        "You called something an opportunity when it was not one. That is the one error that actually costs money here."));
      wrap.appendChild(stat("", sc.totalMissed,
        "opportunities that never made your list",
        sc.wavedThrough + " you looked at and passed over, " + sc.neverReached + " you never reached before the clock ran out."));
    } else {
      // Threat rounds are scored on coverage. The miss leads.
      wrap.appendChild(stat("headline bad", sc.totalMissed,
        "threats that got past you",
        sc.wavedThrough + " you looked at and waved through, " + sc.neverReached + " you never reached before the clock ran out. Both count. The clock is not an excuse a board accepts."));
      wrap.appendChild(stat("good", sc.hits, "threats you caught", ""));
      if (sc.mode === "single") {
        wrap.appendChild(stat("", sc.falsePos,
          sc.falsePos === 1 ? "false alarm" : "false alarms",
          "You called something a threat when it was not. Cheap, compared with the number at the top."));
      }
    }

    wrap.appendChild(el("hr", "rule"));
    var pills = el("div");
    pills.appendChild(el("span", "pill", "accuracy " + (sc.accuracy == null ? "n/a" : sc.accuracy + "%")));
    pills.appendChild(el("span", "pill", "median " + (sc.medianMs == null ? "n/a" : (sc.medianMs / 1000).toFixed(1) + "s")));
    pills.appendChild(el("span", "pill", sc.eventsScanned + " events scanned"));
    wrap.appendChild(pills);

    if (sc.ambSeen) {
      wrap.appendChild(el("p", "tiny dim",
        "You also saw " + sc.ambSeen + " events with no right answer. You read " +
        sc.ambLeanedThreat + " of them as a threat. Hold on to that number."));
    }

    wrap.appendChild(el("div", "spacer"));
    var b = el("button", "btn", isLast ? "See your results" : "Next round");
    b.onclick = onNext;
    wrap.appendChild(b);
    app.appendChild(wrap);
  }

  // ---- final summary ----------------------------------------------------

  function leanLabel(d) {
    if (d >= 20) return ["strongly opportunity-oriented", "var(--green)"];
    if (d >= 8)  return ["opportunity-leaning", "var(--green)"];
    if (d > -8)  return ["balanced", "var(--gold)"];
    if (d > -20) return ["threat-leaning", "var(--red)"];
    return ["strongly threat-oriented", "var(--red)"];
  }

  function screenFinal() {
    clear();
    var r = {};
    ["r1", "r2", "r3", "r4"].forEach(function (k) { r[k] = load(k); });
    var have = ["r1", "r2", "r3", "r4"].filter(function (k) { return r[k]; });

    var wrap = el("div");
    wrap.appendChild(el("h1", null, "Your four numbers"));

    if (have.length < 4) {
      wrap.appendChild(el("p", "small dim",
        "You have finished " + have.length + " of the 4 rounds on this phone. " +
        "What follows uses only what you played."));
    }

    // 1 and 2. Opportunity side versus threat side.
    var oAcc = avgAcc([r.r1, r.r3]), xAcc = avgAcc([r.r2, r.r4]);
    if (oAcc != null && xAcc != null) {
      var gap = oAcc - xAcc;
      var lab = leanLabel(gap);
      wrap.appendChild(stat("headline", oAcc + "% vs " + xAcc + "%",
        "spotting opportunities, versus spotting threats",
        "A gap of " + (gap > 0 ? "+" : "") + gap + " points."));
      var s = el("div", "stat");
      s.innerHTML = "<div class='lab'>On this one game, today, you came out</div>" +
        "<div class='n' style='font-size:1.5rem;margin-top:8px;color:" + lab[1] + "'>" + lab[0] + "</div>" +
        "<div class='sub'>This is a classroom demonstration, not a validated instrument. " +
        "It measures how you answered two minutes of cards about a travel-center chain, and nothing more.</div>";
      wrap.appendChild(s);
    }

    // 3. Speed.
    var oMs = medOf([r.r1, r.r3]), xMs = medOf([r.r2, r.r4]);
    if (oMs && xMs) {
      wrap.appendChild(stat("", (oMs / 1000).toFixed(1) + "s vs " + (xMs / 1000).toFixed(1) + "s",
        "how long you took per decision, opportunities versus threats", ""));
    }

    // 4. One at a time versus three at once.
    var single = [r.r1, r.r2].filter(Boolean), triple = [r.r3, r.r4].filter(Boolean);
    if (single.length && triple.length) {
      var sScan = sum(single, "eventsScanned"), tScan = sum(triple, "eventsScanned");
      var sAcc = avgAcc(single), tAcc = avgAcc(triple);
      wrap.appendChild(stat("", sScan + " vs " + tScan,
        "events you scanned, one at a time versus three at once",
        "Accuracy " + sAcc + "% one at a time, " + tAcc + "% three at once."));
    }

    // 5. The two-sided events.
    var ambSeen = sum(single, "ambSeen"), ambT = sum(single, "ambLeanedThreat");
    if (ambSeen) {
      wrap.appendChild(stat("", ambT + " of " + ambSeen,
        "two-sided events you read as a threat",
        "Those events had no right answer. Both readings were defensible."));
    }

    wrap.appendChild(el("hr", "rule"));
    wrap.appendChild(el("p", "tiny dim",
      "Keep this screen open. Nothing here was sent anywhere, it lives only on your phone."));

    var again = el("button", "btn ghost", "Play again");
    again.onclick = function () { location.reload(); };
    wrap.appendChild(again);
    app.appendChild(wrap);
  }

  function sum(list, f) {
    return list.reduce(function (a, x) { return a + (x && x[f] ? x[f] : 0); }, 0);
  }
  function avgAcc(list) {
    var v = list.filter(function (x) { return x && x.accuracy != null; });
    if (!v.length) return null;
    return Math.round(v.reduce(function (a, x) { return a + x.accuracy; }, 0) / v.length);
  }
  function medOf(list) {
    var v = list.filter(function (x) { return x && x.medianMs != null; });
    if (!v.length) return null;
    return Math.round(v.reduce(function (a, x) { return a + x.medianMs; }, 0) / v.length);
  }

  // ---- runner -----------------------------------------------------------

  var cur = 0;

  function runRound() {
    var round = PAGE.rounds[cur];
    var spec = ROUNDS[round.key];
    var isLast = cur === PAGE.rounds.length - 1;

    screenIntro(round, cur, PAGE.rounds.length, function () {
      var deck, targetsTotal;
      if (round.mode === "single") {
        deck = buildSingleDeck(spec);
        targetsTotal = spec.pairs.length; // one target card per pair
      } else {
        deck = buildTripleDeck(spec, round.hunt);
        targetsTotal = deck.length;
      }
      screenPlay(round, deck, function (res) {
        res.targetsTotal = targetsTotal;
        var sc = (round.mode === "single") ? scoreSingle(round, res) : scoreTriple(round, res);
        save(round.key, sc);
        screenRoundResult(round, sc, isLast, function () {
          cur++;
          if (cur < PAGE.rounds.length) runRound();
          else if (PAGE.finalSummary) screenFinal();
          else screenHandoff();
        });
      });
    });
  }

  function screenHandoff() {
    clear();
    var wrap = el("div");
    wrap.appendChild(el("h1", null, "Done with " + PAGE.title + "."));
    wrap.appendChild(el("p", null, PAGE.nextText || "Wait for the next QR code on the screen."));
    wrap.appendChild(el("p", "tiny dim",
      "Do not close this tab. Your numbers are saved on this phone and the last round will add them up."));
    wrap.appendChild(el("div", "spacer"));
    var again = el("button", "btn ghost", "Replay this part");
    again.onclick = function () { location.reload(); };
    wrap.appendChild(again);
    app.appendChild(wrap);
  }

  window.addEventListener("load", runRound);
})();
