/* Buc-ee's opportunity and threat card bank.
   Montevallo teaching demonstration, 17 September 2026.

   Version 3. The card wording is back in the concrete register of the first
   draft, not the plain rewrite. Six pairs and all eight two-sided events are
   the original sentences verbatim, quoted out of `deck-handoff 2026-09-12.md`.
   The remaining fourteen pairs are written to match that register, because the
   original file was overwritten before it was ever committed.

   real:true  = an actual reported Buc-ee's event, cited in event-sources.
   real:false = written for this exercise.

   Cards are MIRROR PAIRS. Each pair holds one opportunity and one threat in the
   same domain, matched to within about two words of length and to the same level
   of numeric concreteness, so nobody can argue afterwards that the opportunity
   cards were simply written harder.

   `w` on each card is the reason it is categorized that way. It never appears in
   the game. It feeds the checking document and the printed answer key.

   Every card is an OUTSIDE event. Nothing here is something the company did to
   itself, because that would be a strength or a weakness, not an O or a T.

   Edit the wording freely. No game code depends on it. */

const PAIRS = [
  // ---- Block A, round 1 ---------------------------------------------------
  { id: 1, domain: "Highway access",
    o: { t: "The state approves a new I-65 interchange 400 yards from your Athens store.", real: false,
         w: "The state acts, not you. More cars can reach the store without trying." },
    x: { t: "The state closes the I-65 exit ramp serving your Athens store for 14 months.", real: false,
         w: "The state acts, not you. The traffic the store lives on is cut off." } },

  { id: 2, domain: "Expansion",
    o: { t: "Nebraska approves your first store on I-80 in Gretna, an 18-month build.", real: true,
         w: "A regulator outside the company opens a whole new state to you." },
    x: { t: "A county board rejects your permit for a 75,000 square foot store.", real: false,
         w: "A regulator outside the company blocks growth you had planned." } },

  { id: 3, domain: "EV charging",
    o: { t: "Mercedes-Benz signs an agreement to put premium EV chargers at your locations.", real: true,
         w: "Another company brings you equipment and customers you did not have." },
    x: { t: "A rival installs free EV fast charging at every Alabama highway location.", real: false,
         w: "A competitor gives drivers a reason to stop at their store instead." } },

  { id: 4, domain: "Labor supply",
    o: { t: "A community college opens a 200-seat retail training program in your county.", real: false,
         w: "The local labor pool grows, so hiring gets easier and cheaper." },
    x: { t: "An Amazon fulfillment center opens nearby paying three dollars more an hour.", real: false,
         w: "A new employer bids up wages and pulls your staff away." } },

  { id: 5, domain: "Brand",
    o: { t: "A video of your Beaver Nugget wall reaches 40 million views in a week.", real: false,
         w: "An outsider hands you national attention you did not pay for." },
    x: { t: "A video of a dirty restroom at one store reaches 40 million views.", real: false,
         w: "An outsider attacks the exact reputation the business is built on." } },

  { id: 6, domain: "Food input cost",
    o: { t: "Brisket wholesale prices fall 18 percent as ranchers rebuild their herds.", real: false,
         w: "A commodity market moves in your favor and widens the food margin." },
    x: { t: "Brisket wholesale prices rise 18 percent after drought cuts herd size.", real: false,
         w: "A commodity market moves against you and squeezes the food margin." } },

  { id: 7, domain: "Rival footprint",
    o: { t: "Your largest competitor announces it is closing 30 stores across the Southeast.", real: false,
         w: "A competitor leaves, so their customers have to go somewhere." },
    x: { t: "Your largest competitor announces it is opening 30 stores across the Southeast.", real: false,
         w: "A competitor arrives and splits the same pool of highway drivers." } },

  { id: 8, domain: "State fiscal policy",
    o: { t: "Alabama offers a tax credit covering half the cost of new EV chargers.", real: false,
         w: "Government money pays for an upgrade you were going to fund yourself." },
    x: { t: "Alabama raises the state gasoline tax by 12 cents a gallon.", real: false,
         w: "Government raises the pump price, which cuts the volume that draws people in." } },

  // ---- Block B, round 2 ---------------------------------------------------
  { id: 9, domain: "Merchandise",
    o: { t: "A country singer wears your logo shirt on stage and the run sells out.", real: false,
         w: "An outsider creates demand for your highest-margin merchandise." },
    x: { t: "Counterfeit versions of your logo shirts flood overseas resale sites for half the price.", real: false,
         w: "Outsiders take merchandise sales and put your name on bad product." } },

  { id: 10, domain: "Real estate",
    o: { t: "A 40-acre parcel at a Tennessee interchange comes to market below appraisal.", real: false,
         w: "The real estate market hands you a site at a price you can afford." },
    x: { t: "Highway frontage land across the Southeast is appraising 30 percent higher.", real: false,
         w: "The real estate market prices you out of the sites you need." } },

  { id: 11, domain: "National press",
    o: { t: "A national magazine names your restrooms the best rest stop in America.", real: true,
         w: "Outside media confirms your reputation to people who never heard of you." },
    x: { t: "A national magazine runs an investigation into travel-center food safety failures.", real: false,
         w: "Outside media casts doubt on the whole category you sell in." } },

  { id: 12, domain: "Traffic volume",
    o: { t: "Southeast summer road-trip travel is forecast up 9 percent this year.", real: false,
         w: "More cars on the road means more people passing your door." },
    x: { t: "Southeast highway traffic is down 9 percent as remote work holds.", real: false,
         w: "Fewer cars on the road means fewer people passing your door." } },

  { id: 13, domain: "Fuel supply",
    o: { t: "A new products pipeline opens and cuts 12 cents from your delivered fuel cost.", real: false,
         w: "Infrastructure built by others lowers what you pay for every gallon." },
    x: { t: "A Gulf Coast refinery fire adds 40 cents to your delivered fuel cost.", real: false,
         w: "A supply shock outside your control raises what you pay for every gallon." } },

  { id: 14, domain: "Weather",
    o: { t: "A mild winter keeps the Southeast interstates clear every weekend through February.", real: false,
         w: "Weather you do not control keeps your customers driving." },
    x: { t: "A hurricane closes your interstate for nine days in peak travel season.", real: false,
         w: "Weather you do not control stops your customers reaching you." } },

  { id: 15, domain: "Nearby attractions",
    o: { t: "A new national park opens and draws two million visitors to your corridor.", real: false,
         w: "Someone else's attraction fills your road with travelers." },
    x: { t: "A theme park on your corridor announces it will close next season.", real: false,
         w: "Someone else's attraction stops sending travelers down your road." } },

  { id: 16, domain: "Payments",
    o: { t: "A card network waives your processing fees for three years to win the account.", real: false,
         w: "A supplier cuts a cost that sits on every single transaction." },
    x: { t: "Your payment processor is breached and 60,000 customer card numbers are exposed.", real: false,
         w: "A supplier's failure exposes your customers and your name." } },

  // ---- Block C, spares. Not dealt into rounds 1 or 2. ----------------------
  { id: 17, domain: "Acquisition",
    o: { t: "Two family-owned travel centers on your corridor offer to sell to you.", real: false,
         w: "Owners outside the company offer you sites already on the right road." },
    x: { t: "A private equity firm buys nine travel centers on your corridor.", real: false,
         w: "A well-funded owner takes the sites you wanted and will spend to compete." } },

  { id: 18, domain: "Consumer taste",
    o: { t: "Jerky and protein snack sales are up 22 percent nationwide this year.", real: false,
         w: "A national taste shift moves toward what you already sell." },
    x: { t: "Packaged snack sales are down 22 percent as shoppers move to fresh.", real: false,
         w: "A national taste shift moves away from what you already sell." } },

  { id: 19, domain: "State law",
    o: { t: "A new state law permits Sunday beer and wine sales at travel centers.", real: false,
         w: "A law change opens a sales day and a product you could not sell before." },
    x: { t: "A new state law requires costly kitchen retrofits at every food counter.", real: false,
         w: "A law change forces spending at every store with no new revenue." } },

  { id: 20, domain: "Cost of capital",
    o: { t: "The Federal Reserve cuts rates and your cost of building a store falls.", real: false,
         w: "Cheaper money matters enormously when every store is self-funded." },
    x: { t: "The Federal Reserve raises rates and your cost of building a store rises.", real: false,
         w: "Dearer money slows growth hard when every store is self-funded." } }
];

/* Two-sided cards. Never scored right or wrong. The game records only which way
   the student jumped. These are the reliable backup for the debrief, because the
   room's default on a genuinely two-sided event shows up even when the scored
   gap does not. All eight sentences are the original wording. Six are dealt into
   play, three per round, and all eight are available on the projector page. */

const AMBIGUOUS = [
  { id: "a1", t: "Gas prices fall to a five-year low nationwide.",
    why: "More people take road trips, and you earn a thinner margin on every gallon you sell." },
  { id: "a2", t: "Electric vehicles reach 30 percent of new car sales in the Southeast.",
    why: "A charging stop is twenty minutes of shopping instead of four, and it is also the end of fuel volume as you know it." },
  { id: "a3", t: "Your average customer now stays 22 minutes, up from 14.",
    why: "More spend per visit, and fewer visits per hour through the same building." },
  { id: "a4", t: "An AI route planner becomes the default in 60 percent of new vehicles.",
    why: "It can route drivers straight to you, or straight past you, and you do not control which." },
  { id: "a5", t: "Congress funds rest-area upgrades at every interstate exit in Alabama.",
    why: "Better roads carry more traffic, and a clean free rest area competes with the thing you are famous for." },
  { id: "a6", t: "A national chain announces 40 new Southeast stores, each with 60 EV chargers.",
    why: "It proves the category is real, and it takes the corridor sites you wanted." },
  { id: "a7", t: "A grocery chain begins selling ready-to-eat barbecue at every store.",
    why: "It builds the habit of buying hot food away from a restaurant, and it sells the same thing closer to home." },
  { id: "a8", t: "A rival begins franchising travel centers across Alabama.",
    why: "They grow far faster than you can, and franchising is exactly what breaks the consistency you refuse to risk." }
];

/* Round definitions.

   The game is now two rounds, both one event at a time. Each round is 8 mirror
   pairs, so exactly half the scored cards are a YES, plus 3 two-sided cards that
   have no right answer. That is 19 cards per round, of which 8 are a definite
   yes, 8 a definite no, and 3 could be argued either way. */

const ROUNDS = {
  r1: { pairs: [1, 2, 3, 4, 5, 6, 7, 8],        ambig: ["a1", "a2", "a5"] },
  r2: { pairs: [9, 10, 11, 12, 13, 14, 15, 16], ambig: ["a3", "a4", "a6"] }
};

const ROUND_SECONDS = 90;
