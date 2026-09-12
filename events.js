/* Buc-ee's opportunity and threat card bank.
   Montevallo teaching demonstration, 17 September 2026.

   real:true  = an actual reported Buc-ee's event, cited in event-sources.
   real:false = written for this exercise.

   Cards are MIRROR PAIRS. Each pair holds one opportunity and one threat in the
   same subject, matched to within about two words of length, so nobody can argue
   afterwards that the opportunity cards were simply written harder.

   `w` on each card is the reason it is categorized that way. It never appears in
   the game. It feeds the checking document and the printed answer key.

   Every card is an OUTSIDE event. Nothing here is something the company did to
   itself, because that would be a strength or a weakness, not an O or a T.

   Edit the wording freely. No game code depends on it. */

const PAIRS = [
  // ---- Block A, round 1 ---------------------------------------------------
  { id: 1, domain: "Highway exit",
    o: { t: "The state builds a new highway exit right next to your store.", real: false,
         w: "The state acts, not you. More cars can reach the store without trying." },
    x: { t: "The state closes the highway exit that leads to your store.", real: false,
         w: "The state acts, not you. The traffic the store lives on is cut off." } },

  { id: 2, domain: "Building new stores",
    o: { t: "Nebraska approves your first store there, opening in 18 months.", real: true,
         w: "A regulator outside the company opens a whole new state to you." },
    x: { t: "A county turns down your permit to build a new store.", real: false,
         w: "A regulator outside the company blocks growth you had planned." } },

  { id: 3, domain: "Electric car charging",
    o: { t: "Mercedes-Benz agrees to put fast EV chargers at your stores.", real: true,
         w: "Another company brings you equipment and customers you did not have." },
    x: { t: "A rival puts free EV chargers at every store in Alabama.", real: false,
         w: "A competitor gives drivers a reason to stop at their store instead." } },

  { id: 4, domain: "Hiring people",
    o: { t: "A local college starts training 200 retail workers a year.", real: false,
         w: "The local labor pool grows, so hiring gets easier and cheaper." },
    x: { t: "A new Amazon warehouse nearby pays three dollars more an hour.", real: false,
         w: "A new employer bids up wages and pulls your staff away." } },

  { id: 5, domain: "Social media",
    o: { t: "A travel influencer praises your snacks to 40 million viewers.", real: false,
         w: "An outsider hands you national attention you did not pay for." },
    x: { t: "A travel influencer trashes your restrooms to 40 million viewers.", real: false,
         w: "An outsider attacks the exact reputation the business is built on." } },

  { id: 6, domain: "Food costs",
    o: { t: "The price you pay for brisket drops 18 percent.", real: false,
         w: "A commodity market moves in your favor and widens the food margin." },
    x: { t: "The price you pay for brisket jumps 18 percent.", real: false,
         w: "A commodity market moves against you and squeezes the food margin." } },

  { id: 7, domain: "Competitors",
    o: { t: "Your biggest rival closes 30 stores in the Southeast.", real: false,
         w: "A competitor leaves, so their customers have to go somewhere." },
    x: { t: "Your biggest rival opens 30 stores in the Southeast.", real: false,
         w: "A competitor arrives and splits the same pool of highway drivers." } },

  { id: 8, domain: "Taxes",
    o: { t: "Alabama offers tax money to stores that add EV chargers.", real: false,
         w: "Government money pays for an upgrade you were going to fund yourself." },
    x: { t: "Alabama raises the gas tax by 12 cents a gallon.", real: false,
         w: "Government raises the pump price, which cuts the volume that draws people in." } },

  // ---- Block B, round 2 ---------------------------------------------------
  { id: 9, domain: "Branded clothing",
    o: { t: "A country singer wears your T-shirt and it sells out.", real: false,
         w: "An outsider creates demand for your highest-margin merchandise." },
    x: { t: "Fake copies of your T-shirts show up online for less.", real: false,
         w: "Outsiders take merchandise sales and put your name on bad product." } },

  { id: 10, domain: "Land",
    o: { t: "A big highway lot in Tennessee goes on sale cheap.", real: false,
         w: "The real estate market hands you a site at a price you can afford." },
    x: { t: "Highway land across the Southeast costs 30 percent more.", real: false,
         w: "The real estate market prices you out of the sites you need." } },

  { id: 11, domain: "News coverage",
    o: { t: "A national magazine calls your restrooms the best in America.", real: true,
         w: "Outside media confirms your reputation to people who never heard of you." },
    x: { t: "A national magazine investigates dirty food at highway stores.", real: false,
         w: "Outside media casts doubt on the whole category you sell in." } },

  { id: 12, domain: "How much people drive",
    o: { t: "Summer road trips in the Southeast are up 9 percent.", real: false,
         w: "More cars on the road means more people passing your door." },
    x: { t: "Highway traffic is down 9 percent as people work from home.", real: false,
         w: "Fewer cars on the road means fewer people passing your door." } },

  { id: 13, domain: "Fuel supply",
    o: { t: "A new fuel pipeline opens nearby and cuts your delivery cost.", real: false,
         w: "Infrastructure built by others lowers what you pay for every gallon." },
    x: { t: "A refinery shuts down and your fuel costs 40 cents more.", real: false,
         w: "A supply shock outside your control raises what you pay for every gallon." } },

  { id: 14, domain: "Weather",
    o: { t: "A mild winter keeps the highways open every weekend.", real: false,
         w: "Weather you do not control keeps your customers driving." },
    x: { t: "A hurricane closes your highway for nine days in peak season.", real: false,
         w: "Weather you do not control stops your customers reaching you." } },

  { id: 15, domain: "Nearby attractions",
    o: { t: "A new national park brings two million visitors to your highway.", real: false,
         w: "Someone else's attraction fills your road with travelers." },
    x: { t: "A big theme park near your highway announces it is closing.", real: false,
         w: "Someone else's attraction stops sending travelers down your road." } },

  { id: 16, domain: "Card payments",
    o: { t: "A card company offers you free payment processing for three years.", real: false,
         w: "A supplier cuts a cost that sits on every single transaction." },
    x: { t: "Hackers steal customer card numbers from your payment company.", real: false,
         w: "A supplier's failure exposes your customers and your name." } },

  // ---- Block C, weighted into the three-at-once rounds --------------------
  { id: 17, domain: "Buying other stores",
    o: { t: "Two family-owned stores on your highway offer to sell to you.", real: false,
         w: "Owners outside the company offer you sites already on the right road." },
    x: { t: "An investment firm buys nine stores along your highway.", real: false,
         w: "A well-funded owner takes the sites you wanted and will spend to compete." } },

  { id: 18, domain: "What people snack on",
    o: { t: "Jerky and protein snack sales are up 22 percent nationwide.", real: false,
         w: "A national taste shift moves toward what you already sell." },
    x: { t: "Packaged snack sales are down 22 percent as people buy fresh.", real: false,
         w: "A national taste shift moves away from what you already sell." } },

  { id: 19, domain: "State law",
    o: { t: "A new state law lets you sell beer and wine on Sundays.", real: false,
         w: "A law change opens a sales day and a product you could not sell before." },
    x: { t: "A new state law requires costly kitchen upgrades at food counters.", real: false,
         w: "A law change forces spending at every store with no new revenue." } },

  { id: 20, domain: "Borrowing money",
    o: { t: "Banks cut interest rates, making it cheaper to build stores.", real: false,
         w: "Cheaper money matters enormously when every store is self-funded." },
    x: { t: "Banks raise interest rates, making it costlier to build stores.", real: false,
         w: "Dearer money slows growth hard when every store is self-funded." } }
];

/* Two-sided cards. Never scored right or wrong. The game records only which way
   the student jumped. These are the reliable backup for the debrief, because the
   room's default on a genuinely two-sided event shows up even when the scored
   gap does not. Four are used in play and all eight are available on the
   projector page. */

const AMBIGUOUS = [
  { id: "a1", t: "Gas prices drop to a five-year low.",
    why: "More people take road trips, and you make less on every gallon you sell." },
  { id: "a2", t: "Electric cars reach 30 percent of new car sales nearby.",
    why: "A charging stop is twenty minutes of shopping instead of four, and gas sales fall." },
  { id: "a3", t: "Customers now stay 22 minutes instead of 14.",
    why: "Each visit is worth more, and fewer people get through the building per hour." },
  { id: "a4", t: "Most new cars come with an app that picks the route.",
    why: "It can send drivers straight to you, or straight past you, and you do not choose." },
  { id: "a5", t: "The government pays to upgrade every rest stop on the highway.",
    why: "Better roads carry more traffic, and a clean free rest stop competes with you." },
  { id: "a6", t: "A national chain announces 40 new stores just like yours.",
    why: "It proves people want this, and it takes the highway spots you wanted." },
  { id: "a7", t: "A grocery chain starts selling hot barbecue at every store.",
    why: "More people get used to buying hot food to go, and they can buy it closer to home." },
  { id: "a8", t: "A rival starts letting other people franchise its stores.",
    why: "They grow far faster than you can, and franchising breaks the sameness you protect." }
];

/* Round definitions.

   Each single-card round is 8 mirror pairs, so exactly half the scored cards are
   a YES, plus 2 two-sided cards that have no right answer. That is 18 cards, of
   which 8 are a definite yes, 8 a definite no, and 2 could be either. */

const ROUNDS = {
  r1: { pairs: [1, 2, 3, 4, 5, 6, 7, 8],           ambig: ["a1", "a2"] },
  r2: { pairs: [9, 10, 11, 12, 13, 14, 15, 16],    ambig: ["a3", "a4"] },
  r3: { pairs: [17, 18, 19, 20, 1, 3, 5, 7, 9, 11, 13, 15] },
  r4: { pairs: [17, 18, 19, 20, 2, 4, 6, 8, 10, 12, 14, 16] }
};

const ROUND_SECONDS = 90;
