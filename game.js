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
   because they sit on one origin. Nothing is sent anywhere.

   Only cards the student actually saw are ever counted. Cards the clock never
   reached are not reported, because running out of time is not a finding. */

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
  function wipeAll() {
    try {
      ["r1", "r2", "r3", "r4"].forEach(function (k) { localStorage.removeItem(KEY + k); });
    } catch (e) { /* private mode */ }
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
  function word(h) { return h === "o" ? "OPPORTUNITY" : "THREAT"; }
  function Words(h) { return h === "o" ? "Opportunities" : "Threats"; }
  function plural(n, one, many) { return n === 1 ? one : many; }

  // ---- deck building ----------------------------------------------------

  // Single-card round: eight mirror pairs, both sides, plus two two-sided cards.
  // Exactly half the scored cards are a yes.
  function buildSingleDeck(spec) {
    var deck = [];
    spec.pairs.forEach(function (pid) {
      var p = pairById(pid);
      deck.push({ kind: "o", pair: pid, text: p.o.t });
      deck.push({ kind: "x", pair: pid, text: p.x.t });
    });
    (spec.ambig || []).forEach(function (aid) {
      deck.push({ kind: "amb", id: aid, text: ambById(aid).t });
    });
    return shuffle(deck);
  }

  // Three-at-once round: one target plus two of the opposite valence, never drawn
  // from the same mirror pair as the target.
  function buildTripleDeck(spec, hunt) {
    var other = hunt === "o" ? "x" : "o";
    return shuffle(spec.pairs).map(function (pid) {
      var p = pairById(pid);
      var pool = shuffle(spec.pairs.filter(function (q) { return q !== pid; }));
      var d1 = pairById(pool[0]), d2 = pairById(pool[1]);
      return shuffle([
        { kind: hunt,  pair: pid,   text: p[hunt].t },
        { kind: other, pair: d1.id, text: d1[other].t },
        { kind: other, pair: d2.id, text: d2[other].t }
      ]);
    });
  }

  // ---- screens ----------------------------------------------------------

  function clear() { app.innerHTML = ""; }

  function screenIntro(round, idx, total, onGo) {
    clear();
    var tone = round.hunt === "o" ? "var(--green)" : "var(--red)";
    var wrap = el("div");

    wrap.appendChild(el("p", "small dim", PAGE.title + " &middot; round " + (idx + 1) + " of " + total));
    wrap.appendChild(el("h1", null, "You run Buc-ee&rsquo;s."));

    if (round.mode === "single") {
      wrap.appendChild(el("p", null, "One event at a time. Your only question is:"));
      wrap.appendChild(el("h2", null,
        "Is this <span style='color:" + tone + "'>" +
        (round.hunt === "o" ? "an OPPORTUNITY" : "a THREAT") + "</span>?"));
      wrap.appendChild(el("p", null, round.hunt === "o"
        ? "Tap <b>YES</b> or <b>NO</b>. Find as many as you can."
        : "Tap <b>YES</b> or <b>NO</b>. Identify all threats."));
    } else {
      wrap.appendChild(el("p", null, "Three events land at the same time."));
      wrap.appendChild(el("h2", null,
        "Tap the <span style='color:" + tone + "'>" + word(round.hunt) + "</span>."));
      wrap.appendChild(el("p", null, round.hunt === "o"
        ? "Exactly one of the three is an opportunity. Find as many as you can."
        : "Exactly one of the three is a threat. Identify all threats."));
    }

    wrap.appendChild(el("p", "small dim", ROUND_SECONDS + " seconds on the clock."));
    wrap.appendChild(el("div", "spacer"));

    if (idx === 0 && PAGE.disclose !== false) {
      wrap.appendChild(el("p", "tiny dim",
        "Some of these events are real Buc-ee&rsquo;s news and some were written for this class."));
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
        ? "Is this <span class='hunt-" + round.hunt + "'>" +
          (round.hunt === "o" ? "an OPPORTUNITY" : "a THREAT") + "</span>?"
        : "Tap the <span class='hunt-" + round.hunt + "'>" + word(round.hunt) + "</span>");
    prompt.id = "prompt";
    var clock = el("div", null, ROUND_SECONDS); clock.id = "clock";
    bar.appendChild(prompt); bar.appendChild(clock);

    var stage = el("div"); stage.id = "stage";
    app.appendChild(bar); app.appendChild(stage);

    if (round.mode === "single") {
      var answers = el("div"); answers.id = "answers";
      var yes = el("button", "btn yes", "YES");
      var no  = el("button", "btn no",  "NO");
      yes.onclick = function () { respond(true); };
      no.onclick  = function () { respond(false); };
      answers.appendChild(yes); answers.appendChild(no);
      app.appendChild(answers);
    }

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
      onDone({ log: log, deckSize: deck.length });
    }

    function next() {
      if (ended) return;
      if (i >= deck.length) { finish(); return; }
      stage.innerHTML = "";
      locked = false;
      shownAt = Date.now();

      if (round.mode === "single") {
        var card = el("div", "evt", deck[i].text);
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

    function flash(node, cls, ms) {
      node.classList.add(cls);
      setTimeout(function () { if (!ended) { i++; next(); } }, ms);
    }

    function respond(said) {
      if (locked || ended) return;
      locked = true;
      var c = deck[i], ms = Date.now() - shownAt;
      var card = document.getElementById("current");

      if (c.kind === "amb") {
        // No right answer. Record only which way they went.
        log.push({ kind: "amb", id: c.id, text: c.text, said: said, ms: ms });
        flash(card, "neut", 300);
        return;
      }
      var correct = (said === (c.kind === round.hunt));
      log.push({ kind: c.kind, pair: c.pair, text: c.text, said: said, correct: correct, ms: ms });
      flash(card, correct ? "ok" : "bad", correct ? 280 : 850);
    }

    function pick(k) {
      if (locked || ended) return;
      locked = true;
      var cards = deck[i], c = cards[k], ms = Date.now() - shownAt;
      var correct = (c.kind === round.hunt);
      var target = cards.filter(function (z) { return z.kind === round.hunt; })[0];
      log.push({
        trial: true, correct: correct, ms: ms,
        targetText: target.text, pickedText: c.text
      });
      flash(stage.children[k], correct ? "ok" : "bad", correct ? 300 : 850);
    }

    next();
  }

  // ---- scoring ----------------------------------------------------------
  // Everything below counts only what the student actually saw.

  function scoreSingle(round, res) {
    var hunt = round.hunt, other = hunt === "o" ? "x" : "o";
    var seen = res.log.filter(function (r) { return r.kind !== "amb"; });
    var amb  = res.log.filter(function (r) { return r.kind === "amb"; });

    var got      = seen.filter(function (r) { return r.kind === hunt  && r.said; });
    var missed   = seen.filter(function (r) { return r.kind === hunt  && !r.said; });
    var falsePos = seen.filter(function (r) { return r.kind === other && r.said; });

    var wasLab = other === "o" ? "an opportunity" : "a threat";
    var notLab = hunt  === "o" ? "an opportunity" : "a threat";
    var yesLab = hunt === "o" ? "You called it an opportunity." : "You called it a threat.";
    var noLab  = "You said it was not.";

    return {
      mode: "single", hunt: hunt,
      hits: got.length, missed: missed.length, falsePos: falsePos.length,
      seen: seen.length, decisions: res.log.length, eventsScanned: res.log.length,
      accuracy: pct(seen.filter(function (r) { return r.correct; }).length, seen.length),
      medianMs: median(seen.map(function (r) { return r.ms; })),
      ambSeen: amb.length,
      ambLeanedThreat: amb.filter(function (r) { return hunt === "o" ? !r.said : r.said; }).length,
      review: [
        { title: Words(hunt) + " you caught", cls: hunt,
          items: got.map(function (r) { return { text: r.text }; }) },
        { title: Words(hunt) + " you let through", cls: hunt,
          items: missed.map(function (r) { return { text: r.text }; }) },
        { title: hunt === "o" ? "Mirages you chased" : "False alarms you raised", cls: other,
          items: falsePos.map(function (r) {
            return { text: r.text, tag: "This was " + wasLab + ", not " + notLab + "." };
          }) },
        { title: "Two-sided events, no right answer", cls: "amb",
          items: amb.map(function (r) { return { text: r.text, tag: r.said ? yesLab : noLab }; }) }
      ]
    };
  }

  function scoreTriple(round, res) {
    var hunt = round.hunt;
    var trials = res.log;
    var got    = trials.filter(function (r) { return r.correct; });
    var missed = trials.filter(function (r) { return !r.correct; });

    return {
      mode: "triple", hunt: hunt,
      hits: got.length, missed: missed.length, falsePos: missed.length,
      seen: trials.length, decisions: trials.length, eventsScanned: trials.length * 3,
      accuracy: pct(got.length, trials.length),
      medianMs: median(trials.map(function (r) { return r.ms; })),
      ambSeen: 0, ambLeanedThreat: 0,
      review: [
        { title: Words(hunt) + " you caught", cls: hunt,
          items: got.map(function (r) { return { text: r.targetText }; }) },
        { title: Words(hunt) + " you let through", cls: hunt,
          items: missed.map(function (r) {
            return { text: r.targetText, tag: "You tapped this instead. " + r.pickedText };
          }) }
      ]
    };
  }

  // ---- result pieces ----------------------------------------------------

  function stat(cls, n, lab, sub, small) {
    var s = el("div", "stat " + (cls || ""));
    s.appendChild(el("div", "n" + (small ? " sm" : ""), String(n)));
    s.appendChild(el("div", "lab", lab));
    if (sub) s.appendChild(el("div", "sub", sub));
    return s;
  }

  function reviewBlock(groups, openFirst) {
    var wrap = el("div");
    var shown = 0;
    groups.forEach(function (g) {
      if (!g.items.length) return;
      var d = el("details", "rev");
      if (openFirst && shown === 0) d.setAttribute("open", "open");
      shown++;

      var sum = el("summary");
      var dotCls = g.cls === "o" ? "g" : (g.cls === "x" ? "r" : "y");
      sum.appendChild(el("span", "dot " + dotCls));
      sum.appendChild(el("span", null, g.title + " (" + g.items.length + ")"));
      sum.appendChild(el("span", "cue", "tap to open"));
      d.appendChild(sum);

      var body = el("div", "body");
      g.items.forEach(function (it) {
        var row = el("div", "item " + (g.cls === "amb" ? "" : g.cls));
        row.appendChild(el("span", null, it.text));
        if (it.tag) row.appendChild(el("span", "tag", it.tag));
        body.appendChild(row);
      });
      d.appendChild(body);
      wrap.appendChild(d);
    });
    return wrap;
  }

  function screenRoundResult(round, sc, isLast, onNext) {
    clear();
    var wrap = el("div");
    var opp = round.hunt === "o";

    wrap.appendChild(el("h1", null, opp ? "Opportunities" : "Threats"));
    wrap.appendChild(el("p", "small dim",
      round.mode === "single" ? "One event at a time." : "Three events at once."));

    if (opp) {
      // Opportunity rounds are scored on volume, with a penalty for a false one.
      wrap.appendChild(stat("headline good", sc.hits,
        "opportunities you found",
        "On this side of a SWOT, volume is the point. You cannot act on what you never put on the list."));
      if (sc.falsePos) {
        wrap.appendChild(stat("bad", sc.falsePos,
          plural(sc.falsePos, "mirage you chased", "mirages you chased"),
          "You called something an opportunity when it was not one. That is the error that costs real money here.",
          true));
      }
      if (sc.missed) {
        wrap.appendChild(stat("", sc.missed, "you looked at and passed over", "", true));
      }
    } else {
      // Threat rounds are scored on coverage. The miss leads.
      wrap.appendChild(stat("headline bad", sc.missed,
        plural(sc.missed, "threat got past you", "threats got past you"),
        "You looked straight at it and waved it through. On this side of a SWOT, one miss is the one that gets you."));
      wrap.appendChild(stat("good", sc.hits, "threats you caught", "", true));
      if (sc.falsePos && sc.mode === "single") {
        wrap.appendChild(stat("", sc.falsePos,
          plural(sc.falsePos, "false alarm", "false alarms"),
          "You called something a threat when it was not. Cheap, next to the number at the top.", true));
      }
    }

    wrap.appendChild(el("hr", "rule"));
    wrap.appendChild(el("h2", null, "See every card"));
    wrap.appendChild(reviewBlock(sc.review, true));

    wrap.appendChild(el("hr", "rule"));
    var pills = el("div");
    pills.appendChild(el("span", "pill", "accuracy " + (sc.accuracy == null ? "n/a" : sc.accuracy + "%")));
    pills.appendChild(el("span", "pill", "median " + (sc.medianMs == null ? "n/a" : (sc.medianMs / 1000).toFixed(1) + "s")));
    pills.appendChild(el("span", "pill", sc.eventsScanned + " events scanned"));
    wrap.appendChild(pills);

    wrap.appendChild(el("div", "spacer"));

    if (isLast && !PAGE.finalSummary) {
      // No handoff screen. The round result is the last thing this page shows.
      wrap.appendChild(el("p", "small dim",
        PAGE.nextText || "Look up at the screen and scan the next QR code."));
    } else {
      var b = el("button", "btn", isLast ? "See my results" : "Next round");
      b.onclick = onNext;
      wrap.appendChild(b);
    }
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
  function sum(list, f) {
    return list.reduce(function (a, x) { return a + (x && x[f] ? x[f] : 0); }, 0);
  }
  function avgAcc(list) {
    var v = list.filter(function (x) { return x && x.accuracy != null; });
    if (!v.length) return null;
    return Math.round(v.reduce(function (a, x) { return a + x.accuracy; }, 0) / v.length);
  }
  function avgMs(list) {
    var v = list.filter(function (x) { return x && x.medianMs != null; });
    if (!v.length) return null;
    return Math.round(v.reduce(function (a, x) { return a + x.medianMs; }, 0) / v.length);
  }

  function screenFinal() {
    clear();
    window.scrollTo(0, 0);

    var r = {};
    ["r1", "r2", "r3", "r4"].forEach(function (k) { r[k] = load(k); });
    var have = ["r1", "r2", "r3", "r4"].filter(function (k) { return r[k]; });

    var end = PAGE.lastPage === true;

    var wrap = el("div");
    wrap.appendChild(el("h1", null, end ? "Your results" : "Your first two rounds"));

    if (end && have.length < 4) {
      wrap.appendChild(el("p", "small dim",
        "You finished " + have.length + " of the 4 rounds on this phone, so this uses only what you played."));
    } else if (!end) {
      wrap.appendChild(el("p", "small dim",
        "Halfway. Two more rounds to come, and these numbers will be added to at the end."));
    }

    var oSide = [r.r1, r.r3].filter(Boolean), xSide = [r.r2, r.r4].filter(Boolean);
    var oAcc = avgAcc(oSide), xAcc = avgAcc(xSide);

    if (oAcc != null && xAcc != null) {
      var gap = oAcc - xAcc;
      var lab = leanLabel(gap);
      wrap.appendChild(stat("headline", oAcc + "% vs " + xAcc + "%",
        "spotting opportunities, versus spotting threats",
        "A gap of " + (gap > 0 ? "+" : "") + gap + " points.", true));

      var s = el("div", "stat");
      s.innerHTML =
        "<div class='lab'>On this one game, today, you came out</div>" +
        "<div class='n sm' style='margin-top:8px;color:" + lab[1] + "'>" + lab[0] + "</div>" +
        "<div class='sub'>This is a classroom demonstration, not a validated instrument. " +
        "It measures how you answered a few minutes of cards about a highway store, and nothing more.</div>";
      wrap.appendChild(s);
    }

    if (oSide.length) {
      wrap.appendChild(stat("good", sum(oSide, "hits"), "opportunities you found in total",
        sum(oSide, "falsePos") + " times you called something an opportunity when it was not.", true));
    }
    if (xSide.length) {
      wrap.appendChild(stat("bad", sum(xSide, "missed"), "threats you looked at and let through",
        "You caught " + sum(xSide, "hits") + ".", true));
    }

    var oMs = avgMs(oSide), xMs = avgMs(xSide);
    if (oMs && xMs) {
      wrap.appendChild(stat("", (oMs / 1000).toFixed(1) + "s vs " + (xMs / 1000).toFixed(1) + "s",
        "time per decision, opportunities versus threats", "", true));
    }

    var single = [r.r1, r.r2].filter(Boolean), triple = [r.r3, r.r4].filter(Boolean);
    if (single.length && triple.length) {
      wrap.appendChild(stat("", sum(single, "eventsScanned") + " vs " + sum(triple, "eventsScanned"),
        "events you scanned, one at a time versus three at once",
        "Accuracy " + avgAcc(single) + "% one at a time, " + avgAcc(triple) + "% three at once.", true));
    }

    var ambSeen = sum(single, "ambSeen");
    if (ambSeen) {
      wrap.appendChild(stat("", sum(single, "ambLeanedThreat") + " of " + ambSeen,
        "two-sided events you read as a threat",
        "Those had no right answer. Both readings were defensible.", true));
    }

    // Every card from every round, for the discussion. Groups with the same
    // title are merged so the page shows four clean lists, not eight.
    var all = [], byTitle = {};
    ["r1", "r2", "r3", "r4"].forEach(function (k) {
      if (!r[k] || !r[k].review) return;
      r[k].review.forEach(function (g) {
        if (!g.items.length) return;
        if (byTitle[g.title]) {
          // The same card can appear in two rounds. Inside one group that reads
          // as a duplicate, so keep only the first.
          var have = {};
          byTitle[g.title].items.forEach(function (it) { have[it.text] = 1; });
          g.items.forEach(function (it) {
            if (!have[it.text]) { have[it.text] = 1; byTitle[g.title].items.push(it); }
          });
        } else {
          byTitle[g.title] = { title: g.title, cls: g.cls, items: g.items.slice() };
          all.push(byTitle[g.title]);
        }
      });
    });
    if (all.length) {
      wrap.appendChild(el("hr", "rule"));
      wrap.appendChild(el("h2", null, "Every card you saw"));
      wrap.appendChild(reviewBlock(all, false));
    }

    wrap.appendChild(el("hr", "rule"));

    if (end) {
      var saveBtn = el("button", "btn ghost noprint", "Save these results");
      saveBtn.onclick = function () { window.print(); };
      wrap.appendChild(saveBtn);
      wrap.appendChild(el("p", "tiny dim noprint",
        "Opens your phone&rsquo;s print dialog. Choose Save as PDF to keep a copy. " +
        "Nothing here was sent anywhere, it lives only on this phone."));
    } else {
      wrap.appendChild(el("p", "small dim",
        PAGE.nextText || "Look up at the screen and scan the next QR code."));
    }

    app.appendChild(wrap);
  }

  // ---- runner -----------------------------------------------------------

  var cur = 0;

  function runRound() {
    var round = PAGE.rounds[cur];
    var spec = ROUNDS[round.key];
    var isLast = cur === PAGE.rounds.length - 1;

    screenIntro(round, cur, PAGE.rounds.length, function () {
      var deck = round.mode === "single"
        ? buildSingleDeck(spec)
        : buildTripleDeck(spec, round.hunt);

      screenPlay(round, deck, function (res) {
        var sc = round.mode === "single" ? scoreSingle(round, res) : scoreTriple(round, res);
        save(round.key, sc);
        screenRoundResult(round, sc, isLast, function () {
          cur++;
          if (cur < PAGE.rounds.length) runRound();
          else if (PAGE.finalSummary) screenFinal();
        });
      });
    });
  }

  window.addEventListener("load", function () {
    // Part 1 is the start of the exercise, so clear anything left over from a
    // previous run. Otherwise a replay would fold old Part 2 numbers into the
    // halfway results page.
    if (PAGE.resetsAll) wipeAll();
    runRound();
  });
})();
