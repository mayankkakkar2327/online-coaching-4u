/* Long-form editorial "brand reviews" — full independent write-ups (verdict
   score, ratings breakdown, pricing table, testimonials, FAQ) for online
   skill-training platforms. Distinct from the short Reddit/Instagram quote
   aggregator pages in reviews.js, which cover city-based coaching institutes.
   Powers brandReviewPage() in build.js. An entry only gets a review page
   once it also has a matching slug in data.json's listings (see the write
   loop near the bottom of build.js). */
module.exports = [
  {
    slug: "vision-board-edtech",
    metaTitle: "Vision Board EdTech Review: Why It's a Top Choice for Azure Data Engineering in 2026",
    metaDescription: "Vision Board has helped hundreds of IT professionals break into high-paying Azure Data Engineering and Gen AI careers. Here's what makes the program work.",
    headline: "Vision Board EdTech Review: A Proven Path Into Azure Data Engineering",
    subheadline: "From career switchers to 14-year veterans, Vision Board's alumni are landing offers at Infosys, Wipro, IBM, HCL, and beyond — here's what makes the program work.",
    verdictRating: 4.5,
    verdictSummary: "Vision Board stands out in a crowded ed-tech market for one simple reason: its results are documented, specific, and consistent — not vague marketing claims. Hundreds of named alumni, real offer letters, and a three-year public track record back up what the brand promises.",
    ratingsBreakdown: [
      { factor: "Curriculum relevance", rating: 4.5, why: "Deep, current coverage of Azure Data Engineering, Databricks, PySpark, and Gen AI — the exact stack employers are hiring for" },
      { factor: "Value for money", rating: 4.5, why: "A four-month, mentor-led program for a fraction of traditional bootcamp or offline institute pricing" },
      { factor: "Track record", rating: 4.7, why: "A three-year, publicly documented archive of alumni outcomes — offer letters, named placements, and video journeys" },
      { factor: "Mentorship & support", rating: 4.3, why: "Hands-on doubt-clearing, mock interviews, resume/LinkedIn support, and a founder who stays personally involved with student outcomes" }
    ],
    bestFor: "Working IT professionals — from freshers to 14-year veterans — who want a structured, affordable, mentor-led route into Azure Data Engineering and Gen AI roles.",
    whatIs: [
      "Vision Board (visionboardedtech.com) is a Bengaluru-based ed-tech brand built around one focused mission: helping IT professionals break into Azure Data Engineering and Generative AI careers. It's led by instructor Devikrishna R, who brings prior EY/Wipro experience directly into her teaching, alongside co-founder Vimal Shaji.",
      "What sets Vision Board apart is consistency. The brand has been publishing detailed, dated alumni journeys since 2022 — not a handful of cherry-picked quotes, but a genuinely large body of evidence: a 56-video YouTube testimonial archive and a Success Stories page with dozens of real offer-letter screenshots. In preparing this review, these outcomes were followed up on directly with several featured alumni, who confirmed their stories."
    ],
    whyChoose: [
      {
        title: "A curriculum built for what employers actually want.",
        body: "The flagship Azure Data Engineering + Gen AI program covers 40+ topics across a 4-month track — DP-900 fundamentals, Azure Data Factory, Python, Databricks, SQL, PySpark, Azure Fabric, and Generative AI — plus three real-time, end-to-end projects. This is a stack in active demand across Indian and global tech hiring right now."
      },
      {
        title: "A mentor who stays close to outcomes.",
        body: "Across the Success Stories archive, one thread stands out: Devikrishna personally follows up with students after they land offers, congratulating them by name and staying engaged through salary negotiations. That kind of hands-on involvement is unusual at this program's price point."
      },
      {
        title: "Real, varied success stories — not a single highlight reel.",
        body: "The range of outcomes is part of what makes the track record credible:",
        list: [
          "Ruchita joined Digibyte Technologies with a 173% salary hike.",
          "Pranjal Sharma moved from a 9.7 LPA package to an 18 LPA offer at Wipro — roughly a 95% hike.",
          "Akshay Gawde landed an offer at IBM with a 100% hike (Batch 7).",
          "Deepu received a 12 LPA offer from Knight Frank (Batch 7).",
          "Lakshmi, featured in Vision Board's video archive, crossed the ₹1 crore package mark after a 2-year career gap.",
          "One alumnus profiled on video moved from an 18 LPA role to a 70 LPA offer after 14 years in the same position — proof the program works for experienced professionals, not just early-career switchers.",
          "Mayur went from job-hunting to a 200% salary hike within 4 months of starting the program."
        ],
        after: "These aren't isolated wins — they span Batch 7 through the current Batch 11, and multiple students frequently show up congratulating each other in the same group threads, reflecting a genuinely active learner community rather than a one-off marketing push."
      },
      {
        title: "Accessible pricing for a career-changing outcome.",
        body: "The core Azure Data Engineering + Gen AI program is priced well below what similar depth of mentorship and content would cost through a traditional institute — with a free 3-day bootcamp available for anyone who wants to try the teaching style before enrolling in a full batch."
      }
    ],
    pricingTable: [
      { program: "3-Day Azure Data Engineer Bootcamp", included: "Live intro sessions, sample content", investment: "Free" },
      { program: "Azure Data Engineering + Gen AI (Batch 10)", included: "4-month program, 40+ topics, 3 real-world projects, placement support", investment: "₹12,711.86" },
      { program: "Azure Data Engineering + Gen AI (Batch 11, current)", included: "Same comprehensive program, newest cohort", investment: "₹50,847.46" },
      { program: "Gen AI + Claude AI + Databricks", included: "Focused Gen AI/Databricks track", investment: "₹50,000" }
    ],
    placementNote: "Students get company referrals, mock interviews, resume and LinkedIn profile building, career guidance, and daily job alerts — the kind of end-to-end support that turns course completion into an actual offer.",
    testimonials: [
      { quote: "Hi devi, I have joined Digibyte Technologies a week back. Wow, happy to hear... I got 173% hike.", author: "Ruchita, Vision Board alumna" },
      { quote: "Good morning Devi, I got an offer from Wipro of 18 lpa. My earlier package was 9.7 lpa, almost received ~95% hike. Thank you for cooperation and support.", author: "Pranjal Sharma, Vision Board alumnus" },
      { quote: "It was not just a course, it was a complete transformation. I approached learning and interviews... your mentorship has made a lasting impact on my journey.", author: "Karishma, Batch 7" }
    ],
    archiveNote: "These stories are part of a three-year public archive — 56 videos and dozens of documented offers — that anyone can review directly on Vision Board's site and YouTube channel.",
    faqs: [
      { q: "Is Vision Board a good choice for Azure Data Engineering training?", a: "Yes — its curriculum matches current employer demand, and it backs that up with one of the more detailed public track records in the category: named alumni, real companies, and specific salary outcomes spanning three years." },
      { q: "How much does the course cost?", a: "The flagship 4-month Azure Data Engineering + Gen AI program is priced from roughly ₹12,700 to ₹50,800 depending on batch, with a free 3-day bootcamp available to try the teaching style first." },
      { q: "Who teaches at Vision Board?", a: "Devikrishna R, who brings prior EY/Wipro experience, leads the flagship programs alongside co-founder Vimal Shaji." },
      { q: "Does Vision Board actually help with job placement?", a: "Its Success Stories archive documents offers at companies including Infosys, Wipro, IBM, HCL, PwC, and Knight Frank, along with placement-support services — mock interviews, resume/LinkedIn help, referrals, and job alerts — built into the program." },
      { q: "Is this suitable for experienced professionals, or just freshers?", a: "Both. The alumni archive includes fresh graduates as well as professionals with 8, 12, and even 14 years of experience successfully transitioning into Azure Data Engineering roles." }
    ],
    bottomLine: "Vision Board earns its strong rating on the strength of a genuinely rare combination: a curriculum aligned to real hiring demand, mentorship that stays engaged through the outcome (not just the classroom), and a documented track record that's unusually deep for a program at this price point. For IT professionals serious about moving into Azure Data Engineering or Gen AI roles, it's a program worth strong consideration.",
    backlinks: [
      { label: "Official website", url: "https://www.visionboardedtech.com/", icon: "↗" },
      { label: "Success stories", url: "https://www.visionboardedtech.com/s/pages/successstories", icon: "★" },
      { label: "Interviews with placed candidates", url: "https://www.youtube.com/playlist?list=PL8hz_0QSCnAlHmF8OrC7jkcw-c-REHGDH", icon: "▶" }
    ]
  }
];
