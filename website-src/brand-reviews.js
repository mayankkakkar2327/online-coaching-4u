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
  },
  {
    slug: "rodha",
    metaTitle: "Rodha Review 2026: Why It's a Top CAT Coaching Choice",
    metaDescription: "Rodha has helped hundreds of CAT aspirants hit 99+ percentile and convert IIMs, XLRI, FMS and more. Here's what makes the program work.",
    headline: "Rodha Review: A Track Record Built on Real Toppers",
    subheadline: "40+ students at 99.50+ percentile, 210+ BLACKI converts, and named admits into IIM Ahmedabad, XLRI, and FMS — Rodha's CAT 2025 results speak for themselves.",
    verdictRating: 4.7,
    verdictSummary: "Rodha backs its promise with what most CAT coaching marketing doesn't: named toppers, exact percentiles, and the specific B-school each one converted — published at scale, not as a handful of cherry-picked examples. Combined with founder-led teaching and pricing well below traditional offline institutes, it's one of the stronger-documented options for CAT 2026 aspirants.",
    ratingsBreakdown: [
      { factor: "Teaching quality", rating: 4.6, why: "Founder-led, concept-first teaching from a verified 99.86-percentiler, backed by a named faculty team" },
      { factor: "Results & track record", rating: 4.9, why: "40+ students at 99.50+ percentile in CAT 2025, 210+ BLACKI converts, and dozens of named toppers admitted to IIM Ahmedabad, IIM Calcutta, XLRI, FMS Delhi, and more" },
      { factor: "Value for money", rating: 4.5, why: "Comprehensive CAT 2026 batches at ₹24,999 (down from ₹40,000), with a fast-track crash course at ₹19,999 — both well below offline institute pricing" },
      { factor: "Student satisfaction", rating: 4.7, why: "Detailed, named testimonials consistently credit specific faculty (Ravi Sir, Tarun Sir, Swapnil Sir, KD Sir) and the GDPI program for their conversions" }
    ],
    bestFor: "CAT/OMET aspirants who want founder-led, concept-first teaching, a large volume of practice material, and a program with a public, verifiable track record of top percentiles and B-school admits.",
    whatIs: [
      "Rodha (rodha.co.in) is an online coaching platform for CAT and other MBA entrance exams — SNAP, XAT, NMAT, CMAT, MH-CET (OMETs) — plus IPMAT, built around live and recorded classes, mock tests, and study material. It's described on-site as \"India's most trusted CAT and MBA online coaching,\" and its numbers back that positioning: 10,000+ selections and a base of 5,00,000+ CAT aspirants who've engaged with the brand.",
      "The brand was founded by Ravi Prakash, a 99.86-percentiler in CAT himself and formerly the top-rated Quant & LRDI educator at Unacademy CAT, where he trained 35,000+ students. He built Rodha (Sanskrit for \"bridge\") to make high-quality CAT coaching affordable and accessible online — a mission still reflected in current testimonials, several of which mention Ravi Prakash by name for his hands-on, personal involvement even at scale."
    ],
    resultsSection: {
      heading: "Results That Inspire — CAT 2025",
      intro: "This is where Rodha stands out. Rather than vague claims, the results are specific, named, and published at real volume:",
      bullets: [
        "40+ students scored 99.50+ percentile in CAT 2025",
        "210+ BLACKI converts (admits into IIMs Bodh Gaya, Lucknow, Amritsar, Calcutta, Kashipur, Indore, and other Baby IIMs)"
      ],
      tableIntro: "The site's topper wall names individual students batch by batch, with their exact percentile and the B-school they were admitted to. A representative sample:",
      tableHeaders: ["Topper", "CAT 2025 Percentile", "B-School Admit", "Batch"],
      tableRows: [
        ["Siddhant Misra", "99.97%", "IIM Ahmedabad", "R1"],
        ["Rishabh Jain", "99.91%", "MDI Gurgaon", "R3"],
        ["Rohit Kumar Jha", "99.8%", "IIM Ahmedabad", "R3"],
        ["Bhupesh Bansal", "99.8%", "IIM Calcutta", "R2"],
        ["Varul Sharma", "99.65%", "IIM Ahmedabad", "R1"],
        ["Aditi Pandey", "99.63%", "IIM Bangalore", "R3"],
        ["Prithvi Shetty", "99.39%", "SPJIMR", "R8"],
        ["Adyatan Mishra", "99.39%", "MDI Gurgaon", "R3"],
        ["Manan Jain", "99.35%", "IIM Lucknow", "R5"],
        ["Manav Pathak", "99.32%", "XLRI", "R3"],
        ["Shriya Yadav", "99.18%", "IIM Ahmedabad", "R3"],
        ["Dhananjay Tanwar", "99.1%", "FMS Delhi", "R6"],
        ["Zarish Khan", "98.98%", "IIM Indore", "R3"],
        ["Vansh Batra", "98.94%", "XLRI", "R7"],
        ["Ujjwal Singhal", "98.92%", "IIM Kozhikode", "R3"],
        ["Amrit Singh", "98.92%", "SPJIMR", "R5"],
        ["Nitin Sharma", "98.91%", "SCMHRD", "R1"],
        ["Varun Kumar", "98.81%", "IIM Calcutta", "R1"]
      ],
      closingNote: "That's 18 named toppers spanning nearly every top B-school in the country — IIM Ahmedabad, Calcutta, Bangalore, Lucknow, Indore, and Kozhikode, plus XLRI, FMS Delhi, MDI Gurgaon, SPJIMR, and SCMHRD — a genuinely wide spread rather than results concentrated in one or two institutes."
    },
    pricingTable: [
      { program: "CAT 2026 R7 (Hinglish) Comprehensive Batch", included: "21 courses — full Quant, LRDI, VARC coverage, booklets, test series, boosters, OMETs prep, syllabus complete by Sep. 2026", investment: "₹24,999 → ₹21,499 (14% off)" },
      { program: "CAT 2026 Crash Course Complete Package", included: "12 courses — Quant, LRDI, VARC end-to-end plus OMETs (XAT, SNAP, NMAT) prep; built for a fast-track full syllabus run", investment: "₹21,999 → ₹19,999 (9% off)" },
      { program: "Rodha CAT Accelerator", included: "Practice-first add-on focused on paper-setter-style thinking, examination and consistency", investment: "₹8,999 → ₹6,999 (22% off)" },
      { program: "Zero to Zenith VARC (R3/R4, English)", included: "5 courses — full English-medium VARC track, 400+ RCs, doorstep booklets, boosters and workshops", investment: "₹15,000 → ₹13,499 (10% off)" },
      { program: "Free Study Material", included: "Sample sessions, PDFs, previous papers", investment: "Free" }
    ],
    placementNote: "This puts Rodha's flagship comprehensive batch at roughly a third of what offline institutes typically charge (₹40,000–₹60,000+), while still including doorstep-delivered practice booklets, live boosters, and OMET prep bundled in.",
    testimonials: [
      { quote: "I just wanted to take a moment to thank the entire Rodha team for their role in my CAT and GDPI journey. What really stood out for me was the amount of practice material and the strong focus on problem-solving... The GDPI sessions were on point; I felt confident enough to drive my interviews the way I wanted and it led me to a b-school where I truly belong.", author: "Aditya Giri Goswami, IIT Bombay background, R3/Comprehensive Batch" },
      { quote: "For my 2025 attempt I joined Rodha's R-7 batch, and it was truly a game changer. The mocks and daily live classes fueled my stamina for the D-Day and it actually worked. All I want to say is thank you to the whole team, especially Swapnil Sir and KD Sir.", author: "Vansh Batra, admitted to XLRI, R7/Comprehensive Batch" },
      { quote: "Rodha has always been a bit personal to me because of Ravi sir. I always loved the teaching style of all the faculties, especially Tarun sir — he wasn't teaching mainly in my batch, but watching all his video solutions felt like I had attended all his classes too.", author: "Akshat Tiwari, admitted to MDI Gurgaon, R1/Comprehensive Batch" },
      { quote: "Despite being an engineer, quants was an Achilles heel for me. However, through Rodha's course and under the guidance of Ravi sir, I was able to develop the speed and conceptual clarity required to score well, and this helped me ace the CAT exam along with other entrance exams like XAT, SNAP and NMAT.", author: "Mohammad Arham Afaque, admitted to SPJIMR, R3/QA" }
    ],
    archiveNote: "What stands out across these stories is how often specific faculty are named — Ravi Sir, Tarun Sir, Swapnil Sir, KD Sir, and Divya (GDPI mentor) — a sign of a program where mentorship is felt individually, not just delivered as generic video content, even at a scale of 10,000+ selections.",
    faqs: [
      { q: "Is Rodha good for CAT preparation?", a: "Yes — its CAT 2025 results include 40+ students at 99.50+ percentile and 210+ BLACKI converts, with named toppers admitted across nearly every top B-school: IIM Ahmedabad, Calcutta, Bangalore, Lucknow, Indore, Kozhikode, XLRI, FMS Delhi, MDI Gurgaon, and SPJIMR." },
      { q: "How much does Rodha cost?", a: "The CAT 2026 comprehensive batch (R2, Hinglish) is priced at ₹24,999 (down from ₹40,000). A fast-track Crash Course Complete Package is ₹19,999, and standalone VARC modules run ₹7,499–₹13,499. Free study material is available to try first." },
      { q: "Who teaches at Rodha?", a: "Founder Ravi Prakash, a 99.86-percentiler in CAT and former top-rated Quant & LRDI educator at Unacademy CAT, leads teaching alongside a named faculty team — students specifically credit Tarun Sir, Swapnil Sir, KD Sir, and GDPI mentor Divya in their testimonials." },
      { q: "Do Rodha's students actually get into top B-schools?", a: "Yes — the results wall documents named students by percentile and specific B-school admit, not just percentile alone, including a run of 18+ toppers across IIMs, XLRI, FMS, MDI, and SPJIMR for CAT 2025 alone." },
      { q: "Is there a free way to try Rodha before paying?", a: "Yes — free study material and sample sessions are available, a good way to evaluate teaching style before enrolling in a paid batch." }
    ],
    bottomLine: "Rodha's CAT 2025 results make a strong, specific case: 40+ students at 99.50+ percentile, 210+ BLACKI converts, and a topper wall that names real students against real B-school admits — Ahmedabad, Calcutta, Bangalore, Lucknow, Indore, Kozhikode, XLRI, FMS, MDI, SPJIMR. Combined with founder-led teaching from a verified 99.86-percentiler, a named faculty team students consistently credit by name, and comprehensive batches priced at roughly a third of offline institutes, Rodha is a genuinely strong, well-documented choice for CAT 2026 aspirants.",
    backlinks: [
      { label: "Official website", url: "https://www.rodha.co.in", icon: "↗" },
      { label: "YouTube channel", url: "https://www.youtube.com/c/Rodha", icon: "▶" },
      { label: "Instagram", url: "https://www.instagram.com/rodhaplanet/?hl=en", icon: "◎" }
    ]
  }
];
