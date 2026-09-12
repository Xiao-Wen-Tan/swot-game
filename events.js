/* Buc-ee's opportunity and threat card bank.
   Montevallo teaching demonstration, 17 September 2026.

   real:true  = an actual reported Buc-ee's event, cited in event-sources.
   real:false = written for this exercise. Disclosed to students out loud.

   Cards are built as MIRROR PAIRS. Each pair id carries one opportunity and one
   threat in the same domain, matched to within about two words of length and to
   the same level of numeric concreteness, so nobody can argue afterwards that
   the opportunity cards were simply written harder than the threat cards.

   Edit the wording here freely. Nothing in game.js depends on the text. */

const PAIRS = [
  // ---- Block 1, used by Round 1 -------------------------------------------
  { id: 1, domain: "Highway access",
    o: { t: "The state approves a new I-65 interchange 400 yards from your Athens store.", real: false },
    x: { t: "The state closes the I-65 exit ramp serving your Athens store for 14 months.", real: false } },

  { id: 2, domain: "Expansion and permitting",
    o: { t: "Nebraska approves your first store on I-80 in Gretna, an 18-month build.", real: true },
    x: { t: "A county board rejects your permit for a 75,000 square foot store.", real: false } },

  { id: 3, domain: "EV charging",
    o: { t: "Mercedes-Benz signs an agreement to put premium EV chargers at your locations.", real: true },
    x: { t: "A rival installs free EV fast charging at every Alabama highway location.", real: false } },

  { id: 4, domain: "Labor market",
    o: { t: "A nearby community college opens a retail management certificate, 200 students a year.", real: false },
    x: { t: "A new Amazon warehouse opens nearby, paying three dollars an hour more.", real: false } },

  { id: 5, domain: "Brand and social media",
    o: { t: "A video of your Beaver Nugget wall reaches 40 million views in a week.", real: false },
    x: { t: "A video of a dirty restroom at one store reaches 40 million views.", real: false } },

  { id: 6, domain: "Food input cost",
    o: { t: "Brisket wholesale prices fall 18 percent as ranchers rebuild their herds.", real: false },
    x: { t: "Brisket wholesale prices rise 18 percent after drought cuts herd size.", real: false } },

  // ---- Block 2, used by Round 2 -------------------------------------------
  { id: 7, domain: "Competitor moves",
    o: { t: "The largest rival travel-center chain closes 30 of its Southeast locations.", real: false },
    x: { t: "The largest rival travel-center chain opens 30 new Southeast locations.", real: false } },

  { id: 8, domain: "Regulation and fuel tax",
    o: { t: "Alabama offers a tax credit to travel centers that add EV charging bays.", real: false },
    x: { t: "Alabama raises the state fuel tax by 12 cents a gallon.", real: false } },

  { id: 9, domain: "Branded merchandise",
    o: { t: "Your branded apparel sells out nationally after a country artist wears it onstage.", real: false },
    x: { t: "Counterfeit versions of your branded apparel flood online marketplaces this quarter.", real: false } },

  { id: 10, domain: "Interstate real estate",
    o: { t: "A 40-acre interstate parcel in Tennessee comes to market below appraised value.", real: false },
    x: { t: "Interstate land prices across the Southeast rise 30 percent in one year.", real: false } },

  { id: 11, domain: "National press",
    o: { t: "A national magazine names your restrooms the best rest stop in America.", real: true },
    x: { t: "A national magazine runs an investigation into travel-center food safety failures.", real: false } },

  { id: 12, domain: "Highway traffic volume",
    o: { t: "Summer road-trip travel across the Southeast rises 9 percent over last year.", real: false },
    x: { t: "Remote work cuts Southeast highway traffic 9 percent below last year.", real: false } },

  // ---- Block 3, weighted into Part 2 --------------------------------------
  { id: 13, domain: "Fuel supply",
    o: { t: "A new pipeline terminal opens 30 miles away, cutting your fuel delivery cost.", real: false },
    x: { t: "A refinery outage raises your wholesale fuel cost 40 cents a gallon.", real: false } },

  { id: 14, domain: "Weather",
    o: { t: "A mild winter keeps Southeast interstates open every weekend this quarter.", real: false },
    x: { t: "A hurricane closes I-10 for nine days during your busiest month.", real: false } },

  { id: 15, domain: "Tourism draw",
    o: { t: "A new national park designation draws two million visitors to your corridor.", real: false },
    x: { t: "A major theme park near your corridor announces it will close permanently.", real: false } },

  { id: 16, domain: "Payments technology",
    o: { t: "A payments provider offers you zero-fee card processing for three years.", real: false },
    x: { t: "A data breach at your payments provider exposes customer card numbers.", real: false } },

  { id: 17, domain: "Corridor ownership",
    o: { t: "Two family-owned travel centers on your corridor offer to sell to you.", real: false },
    x: { t: "A private equity firm buys nine travel centers on your corridor.", real: false } },

  { id: 18, domain: "Snack category trend",
    o: { t: "Packaged jerky and protein snack sales grow 22 percent nationally this year.", real: false },
    x: { t: "Packaged snack sales fall 22 percent as travelers shift to fresh food.", real: false } }
];

/* Ambiguous cards. Never scored right or wrong. They record only which way the
   student jumped, and they are the reliable backup for the debrief when the
   scored opportunity-threat gap comes out flat in a small fast room.
   `why` is the line you read out on the projector after the hands go up. */

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
    why: "It proves the category is real and worth investing in, and it takes the corridor sites you wanted." },
  { id: "a7", t: "A grocery chain begins selling ready-to-eat barbecue at every store.",
    why: "It builds the habit of buying hot food away from a restaurant, and it sells the same thing closer to home." },
  { id: "a8", t: "A rival begins franchising travel centers across Alabama.",
    why: "They grow far faster than you can, and franchising is exactly what breaks the consistency you refuse to risk." }
];

/* Round definitions. Each single-card round draws one block of six pairs plus
   four ambiguous cards, so no card repeats inside Part 1. The three-at-once
   rounds draw across the whole bank. */

const ROUNDS = {
  r1: { pairs: [1, 2, 3, 4, 5, 6],       ambig: ["a1", "a2", "a3", "a4"] },
  r2: { pairs: [7, 8, 9, 10, 11, 12],    ambig: ["a5", "a6", "a7", "a8"] },
  r3: { pairs: [13, 14, 15, 16, 17, 18, 1, 3, 5, 7, 9, 11] },
  r4: { pairs: [13, 14, 15, 16, 17, 18, 2, 4, 6, 8, 10, 12] }
};

const ROUND_SECONDS = 60;
