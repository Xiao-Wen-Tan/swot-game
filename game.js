/* Game engine for the Buc-ee's opportunity and threat exercise.
   Montevallo teaching demonstration, 17 September 2026.

   Version 3. The exercise is now two rounds, both one event at a time, on a
   single page behind a single QR code. Round 1 hunts opportunities, round 2
   hunts threats, and the page ends on a full results screen. The three-at-once
   rounds and the two extra pages they needed are gone.

   A page defines window.PAGE before loading this file:

     PAGE = { rounds: [ {key:"r1", hunt:"o"}, {key:"r2", hunt:"x"} ] };

   hunt "o" means the student is hunting opportunities, hunt "x" means threats.
   Round scores are kept in localStorage so a reload during the debrief does not
   lose them. Nothing is sent anywhere.

   Only cards the student actually saw are ever counted. Cards the clock never
   reached are not reported, because running out of time is not a finding. */

(function () {
  "use strict";

  var app = document.getElementById("app");
  var KEY = "swot2026.";
  var ROUND_KEYS = ["r1", "r2"];

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
      ROUND_KEYS.forEach(function (k) { localStorage.removeItem(KEY + k); });
      // Left over from the four-round version, in case a phone still holds it.
      ["r3", "r4"].forEach(function (k) { localStorage.removeItem(KEY + k); });
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
  function mean(ns) {
    if (!ns.length) return null;
    var s = 0;
    for (var i = 0; i < ns.length; i++) s += ns[i];
    return Math.round(s / ns.length);
  }
  function pct(n, d) { return d ? Math.round((n / d) * 100) : null; }
  function secs(ms) { return ms == null ? "n/a" : (ms / 1000).toFixed(1) + "s"; }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function Words(h) { return h === "o" ? "Opportunities" : "Threats"; }
  function plural(n, one, many) { return n === 1 ? one : many; }

  // ---- deck building ----------------------------------------------------

  // One card from each pair, never both halves. `target` pairs give the side the
  // student is hunting, `decoy` pairs give the opposite side, and the two lists
  // are the same length, so exactly half the scored cards are a yes.
  function buildDeck(spec, hunt) {
    var other = hunt === "o" ? "x" : "o";
    var deck = [];
    spec.target.forEach(function (pid) {
      deck.push({ kind: hunt, pair: pid, text: pairById(pid)[hunt].t });
    });
    spec.decoy.forEach(function (pid) {
      deck.push({ kind: other, pair: pid, text: pairById(pid)[other].t });
    });
    (spec.ambig || []).forEach(function (aid) {
      deck.push({ kind: "amb", id: aid, text: ambById(aid).t });
    });
    return shuffle(deck);
  }

  function deckSize(spec) {
    return spec.target.length + spec.decoy.length + (spec.ambig || []).length;
  }

  // ---- screens ----------------------------------------------------------

  function clear() { app.innerHTML = ""; }

  function screenIntro(round, idx, total, onGo, cards) {
    clear();
    var opp = round.hunt === "o";
    var tone = opp ? "var(--green)" : "var(--red)";
    var wrap = el("div", "intro");

    // Three spacers, so the screen falls into three bands: who you are at the
    // top, the question in the middle, the terms of the round below it, and the
    // button at the foot. `.intro` is the flex column that makes them grow.
    wrap.appendChild(el("p", "dim", "Round " + (idx + 1) + " of " + total));
    wrap.appendChild(el("h1", null, "You run Buc-ee&rsquo;s."));
    wrap.appendChild(el("div", "spacer"));
    wrap.appendChild(el("p", "q", "Is this <span style='color:" + tone + "'>" +
      (opp ? "an OPPORTUNITY" : "a THREAT") + "</span>?"));
    wrap.appendChild(el("p", null, "Tap <b>YES</b> or <b>NO</b> as fast as you can."));
    wrap.appendChild(el("div", "spacer"));
    wrap.appendChild(el("p", "dim",
      cards + " cards. Most people reach the end, so read each one rather than racing the clock."));
    wrap.appendChild(el("p", "dim", ROUND_SECONDS + " seconds on the clock."));
    wrap.appendChild(el("div", "spacer"));

    if (idx === 0) {
      wrap.appendChild(el("p", "tiny dim",
        "Some of these events are real Buc-ee&rsquo;s news. Others were written for this class."));
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
      "Is this <span class='hunt-" + round.hunt + "'>" +
      (round.hunt === "o" ? "an OPPORTUNITY" : "a THREAT") + "</span>?");
    prompt.id = "prompt";
    var clock = el("div", null, ROUND_SECONDS); clock.id = "clock";
    bar.appendChild(prompt); bar.appendChild(clock);

    var stage = el("div"); stage.id = "stage";
    app.appendChild(bar); app.appendChild(stage);

    var answers = el("div"); answers.id = "answers";
    var yes = el("button", "btn yes", "YES");
    var no  = el("button", "btn no",  "NO");
    yes.onclick = function () { respond(true); };
    no.onclick  = function () { respond(false); };
    answers.appendChild(yes); answers.appendChild(no);
    app.appendChild(answers);

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
      var card = el("div", "evt", deck[i].text);
      card.id = "current";
      stage.appendChild(card);
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

    next();
  }

  // ---- scoring ----------------------------------------------------------
  // Everything below counts only what the student actually saw.

  function scoreRound(round, res) {
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
      hunt: hunt,
      hits: got.length, missed: missed.length, falsePos: falsePos.length,
      targets: got.length + missed.length,
      seen: seen.length, eventsScanned: res.log.length,
      accuracy: pct(seen.filter(function (r) { return r.correct; }).length, seen.length),
      avgMs: mean(seen.map(function (r) { return r.ms; })),
      ambSeen: amb.length,
      ambLeanedThreat: amb.filter(function (r) { return hunt === "o" ? !r.said : r.said; }).length,
      review: [
        { title: Words(hunt) + " you caught", cls: hunt,
          items: got.map(function (r) { return { text: r.text }; }) },
        { title: hunt === "o" ? "Opportunities that never made your list" : "Threats that got past you",
          cls: hunt,
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
    window.scrollTo(0, 0);
    var wrap = el("div");
    var opp = round.hunt === "o";

    wrap.appendChild(el("h1", null, opp ? "Opportunities" : "Threats"));
    wrap.appendChild(el("p", "small dim", "Round " + (opp ? "1" : "2") + ", one event at a time."));

    if (opp) {
      // Opportunity rounds are scored on volume, with a penalty for a false one.
      wrap.appendChild(stat("headline good", sc.hits,
        "opportunities you found",
        "In this half of a SWOT, volume is the point. You cannot exploit what you never put on the list."));
      if (sc.falsePos) {
        wrap.appendChild(stat("bad", sc.falsePos,
          plural(sc.falsePos, "mirage you chased", "mirages you chased"),
          "You called something an opportunity when it was not one. That is the one error that actually costs money here.",
          true));
      }
      if (sc.missed) {
        wrap.appendChild(stat("", sc.missed,
          plural(sc.missed, "opportunity that never made your list",
                            "opportunities that never made your list"), "", true));
      }
    } else {
      // Threat rounds are scored on coverage. The miss leads.
      wrap.appendChild(stat("headline bad", sc.missed,
        plural(sc.missed, "threat got past you", "threats got past you"),
        "You looked straight at it and waved it through. In this half of a SWOT, one miss is the one that gets you, and the clock is not an excuse a board accepts."));
      wrap.appendChild(stat("good", sc.hits, "threats you caught", "", true));
      if (sc.falsePos) {
        wrap.appendChild(stat("", sc.falsePos,
          plural(sc.falsePos, "false alarm", "false alarms"),
          "Cheap, compared with the number at the top.", true));
      }
    }

    wrap.appendChild(el("hr", "rule"));
    wrap.appendChild(el("h2", null, "See every card"));
    wrap.appendChild(reviewBlock(sc.review, true));

    wrap.appendChild(el("hr", "rule"));
    var pills = el("div");
    pills.appendChild(el("span", "pill", "accuracy " + (sc.accuracy == null ? "n/a" : sc.accuracy + "%")));
    pills.appendChild(el("span", "pill", "average " + secs(sc.avgMs) + " per card"));
    pills.appendChild(el("span", "pill", sc.eventsScanned + " events scanned"));
    wrap.appendChild(pills);

    wrap.appendChild(el("div", "spacer"));

    var b = el("button", "btn", isLast ? "See my results" : "Next round");
    b.onclick = onNext;
    wrap.appendChild(b);
    app.appendChild(wrap);
  }

  // ---- final results ----------------------------------------------------

  /* Regulatory focus, in the sense Higgins uses it. A promotion focus works
     toward gains, a prevention focus works against losses. The gap between the
     two accuracy numbers is the only thing this game can speak to, and the
     caption says so in as many words. */
  function focusLabel(gap) {
    if (gap >= 8) {
      return {
        name: "promotion-focused",
        color: "var(--green)",
        why: "A promotion focus works toward gains. It asks what there is to be won, and it will " +
             "put up with a few false alarms rather than let a good thing go past. Today you read " +
             "the opportunity cards more accurately than the threat cards, which is that pattern."
      };
    }
    if (gap <= -8) {
      return {
        name: "prevention-focused",
        color: "var(--red)",
        why: "A prevention focus works against losses. It asks what could go wrong, and it treats " +
             "a threat that slips through as the expensive mistake. Today you read the threat " +
             "cards more accurately than the opportunity cards, which is that pattern."
      };
    }
    return {
      name: "balanced between the two",
      color: "var(--gold)",
      why: "A promotion focus works toward gains and asks what there is to be won. A prevention " +
           "focus works against losses and asks what could go wrong. Your two accuracy numbers " +
           "came out close enough together that this game cannot separate them."
    };
  }

  function screenFinal() {
    clear();
    window.scrollTo(0, 0);

    var o = load("r1"), x = load("r2");
    var wrap = el("div");
    wrap.appendChild(el("h1", null, "Your results"));

    if (!o || !x) {
      wrap.appendChild(el("p", "small dim",
        "You finished only one of the two rounds on this phone, so the comparison below is missing a side."));
    }

    // a. accuracy, opportunities against threats
    if (o && x && o.accuracy != null && x.accuracy != null) {
      var gap = o.accuracy - x.accuracy;
      wrap.appendChild(stat("headline", o.accuracy + "% vs " + x.accuracy + "%",
        "accuracy spotting opportunities, versus spotting threats",
        "A gap of " + (gap > 0 ? "+" : "") + gap + " points toward " +
        (gap === 0 ? "neither side" : (gap > 0 ? "opportunities" : "threats")) + ".", true));
    }

    // b. total identified, opportunities against threats
    if (o && x) {
      wrap.appendChild(stat("", o.hits + " vs " + x.hits,
        "opportunities identified, versus threats identified",
        "You reached " + o.targets + plural(o.targets, " opportunity card", " opportunity cards") +
        " and " + x.targets + plural(x.targets, " threat card", " threat cards") +
        " before the clock ran out.", true));
    }

    // c. promotion or prevention focus, with the explanation
    if (o && x && o.accuracy != null && x.accuracy != null) {
      var f = focusLabel(o.accuracy - x.accuracy);
      var s = el("div", "stat");
      s.innerHTML =
        "<div class='lab'>On this one game, today, you came out</div>" +
        "<div class='n sm' style='margin-top:8px;color:" + f.color + "'>" + f.name + "</div>" +
        "<div class='sub'>" + f.why + "</div>" +
        "<div class='sub'>This is a classroom demonstration, not a validated instrument. It " +
        "measures how you answered a few minutes of cards about a highway store, and nothing more.</div>";
      wrap.appendChild(s);
    }

    // d0. average time per decision on each side
    if (o && x && o.avgMs != null && x.avgMs != null) {
      wrap.appendChild(stat("", secs(o.avgMs) + " vs " + secs(x.avgMs),
        "average time per decision, opportunities versus threats",
        "Speed is not the same thing as accuracy. Compare this pair with the pair at the top.", true));
    }

    // d. opportunities missed
    if (o) {
      wrap.appendChild(stat("", o.missed,
        plural(o.missed, "opportunity you looked at and passed over",
                         "opportunities you looked at and passed over"),
        "Each one was on the screen in front of you and did not make your list.", true));
    }

    // e. threats missed
    if (x) {
      wrap.appendChild(stat("bad", x.missed,
        plural(x.missed, "threat you looked at and waved through",
                         "threats you looked at and waved through"),
        "You caught " + x.hits + ".", true));
    }

    // The two-sided events, which have no right answer at all.
    var ambSeen = (o ? o.ambSeen : 0) + (x ? x.ambSeen : 0);
    if (ambSeen) {
      var lean = (o ? o.ambLeanedThreat : 0) + (x ? x.ambLeanedThreat : 0);
      wrap.appendChild(stat("", lean + " of " + ambSeen,
        "two-sided events you read as a threat",
        "Those had no right answer. Both readings were defensible.", true));
    }

    // Every card from both rounds, for the discussion. Groups sharing a title
    // are merged, and a card that appeared twice is listed once.
    var all = [], byTitle = {};
    [o, x].forEach(function (r) {
      if (!r || !r.review) return;
      r.review.forEach(function (g) {
        if (!g.items.length) return;
        if (byTitle[g.title]) {
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
    var saveBtn = el("button", "btn ghost noprint", "Save these results");
    saveBtn.onclick = function () { window.print(); };
    wrap.appendChild(saveBtn);
    wrap.appendChild(el("p", "tiny dim noprint",
      "Opens your phone&rsquo;s print dialog. Choose Save as PDF to keep a copy. " +
      "Nothing here was sent anywhere, it lives only on this phone."));

    app.appendChild(wrap);
  }

  // ---- runner -----------------------------------------------------------

  var cur = 0;

  function runRound() {
    var round = PAGE.rounds[cur];
    var spec = ROUNDS[round.key];
    var isLast = cur === PAGE.rounds.length - 1;

    screenIntro(round, cur, PAGE.rounds.length, function () {
      screenPlay(round, buildDeck(spec, round.hunt), function (res) {
        var sc = scoreRound(round, res);
        save(round.key, sc);
        screenRoundResult(round, sc, isLast, function () {
          cur++;
          if (cur < PAGE.rounds.length) runRound();
          else screenFinal();
        });
      });
    }, deckSize(spec));
  }

  window.addEventListener("load", function () {
    wipeAll();
    runRound();
  });
})();
