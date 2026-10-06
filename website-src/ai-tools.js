/* AI Tools vertical — /ai-tools hub + one page per tool (ai-tools-<slug>).
   Every fact below was researched from the tool's official pages or reputable
   news coverage; see each entry's `sources`. `lastChecked` is shown on-page.
   audience: "learners" | "institutes" */
module.exports = [
  /* ============================ LEARNERS ============================ */
  {
    slug: "google-gemini",
    name: "Google Gemini",
    audience: "learners",
    maker: "Google",
    url: "https://gemini.google.com/",
    tagline: "Free AI tutor from Google with step-by-step Guided Learning and full-length JEE Main mock tests.",
    priceChip: "Free",
    metaTitle: "Google Gemini for Students in India: JEE Mocks & Price",
    metaDescription: "How Indian students can use Google Gemini: Guided Learning, free JEE Main mock tests, quizzes from notes, prices in ₹ and the free AI Plus student offer.",
    quickAnswer: "Google Gemini is Google's AI assistant. For Indian students it works like a free, always-available tutor: it explains topics step by step (Guided Learning), makes quizzes and flashcards from your notes, and offers free full-length JEE Main mock tests built with content from PhysicsWallah and Careers360. The free plan is enough for most students; college students aged 18+ can claim Google AI Plus free for 12 months until 31 December 2026.",
    facts: [
      ["Made by", "Google"],
      ["Best for", "Concept learning, doubt clearing, JEE Main practice"],
      ["Price", "Free · AI Plus ₹399/month · AI Pro (student price) ₹489/month"],
      ["Student offer", "AI Plus free for 12 months for eligible college students (18+), claim by 31 Dec 2026"],
      ["Languages", "English, Hindi and many other languages (JEE mocks: English only)"],
      ["Works on", "Web, Android, iPhone"]
    ],
    whatIs: [
      "Gemini is Google's AI chat assistant, available at gemini.google.com and as a mobile app. You can type a question, speak to it, or upload a photo of a problem, a PDF of your notes or a textbook chapter, and it replies in plain language.",
      "For students, Google has added learning-specific features on top of the normal chat: <strong>Guided Learning</strong>, which teaches a topic step by step instead of just giving the answer, a <strong>student hub</strong> with study notebooks, flashcards and practice quizzes, and — specifically for India — <strong>full-length JEE Main practice tests</strong>, launched in January 2026 with content from PhysicsWallah and Careers360."
    ],
    benefits: [
      { title: "A patient tutor at any hour", body: "Stuck on a Physics derivation at 11 pm? Guided Learning breaks the topic into small steps, adds diagrams and videos, and checks that you understood before moving on. It is built to help you learn, not just copy answers." },
      { title: "Free JEE Main mock tests", body: "Type “I want to take a JEE Main mock test” and Gemini gives you a full-length practice paper based on vetted content from PhysicsWallah and Careers360. After the test you get feedback on weak areas and can ask it to explain any answer." },
      { title: "Turns your notes into practice", body: "Upload class notes or an NCERT chapter and ask for a quiz, flashcards or a one-page summary. This is a quick way to revise the night before a test." },
      { title: "Doubt solving from a photo", body: "Take a picture of a question from your book or DPP sheet and ask Gemini to solve it step by step — then ask “why” at any step." },
      { title: "Study in your own language", body: "You can chat in Hindi, Hinglish and many other languages, which helps when a concept is easier to understand in your mother tongue." },
      { title: "Costs nothing to start", body: "Everything above works on the free plan. College students get an extra year of the paid AI Plus plan free if they verify their student status." }
    ],
    features: [
      "Guided Learning mode — step-by-step teaching with quizzes after each part",
      "Full-length JEE Main practice tests (English) with feedback and explanations",
      "Student hub: study notebooks, flashcards and practice quizzes",
      "Photo, PDF and voice input (Gemini Live for spoken conversations)",
      "Deep Research for long assignments and projects",
      "Works across Google apps like Gmail, Drive and Docs"
    ],
    howTo: {
      heading: "How to use Gemini for exam preparation",
      steps: [
        "Open gemini.google.com or the Gemini app and sign in with your Google account.",
        "For a new topic, choose Guided Learning (or say “teach me step by step”) and name the chapter, e.g. “Rotational motion, JEE level”.",
        "Upload your notes or a chapter PDF and ask: “Make 15 MCQs from this at NEET level, with answers explained.”",
        "For JEE Main, type “I want to take a JEE Main mock test” and attempt it in one sitting.",
        "After the test, ask Gemini to list your weak chapters and make a 7-day revision plan.",
        "Always cross-check important formulas and answers with your textbook or teacher."
      ]
    },
    pricing: {
      rows: [
        ["Free", "₹0", "Chat, Guided Learning, quizzes, flashcards, JEE Main mock tests"],
        ["Google AI Plus", "₹399/month", "Higher usage limits, better models, more Gemini Notebook use, extra storage"],
        ["AI Plus — student offer", "Free for 12 months", "For eligible college students aged 18+, verified through SheerID; claim by 31 Dec 2026"],
        ["Google AI Pro (student price)", "₹489/month", "Discounted student pricing on the top consumer plan"]
      ],
      note: "Prices are as published by Google India and news reports at the time of writing and may change. Paid plans renew automatically after any free period unless cancelled."
    },
    limitations: [
      "The JEE Main mock tests are currently in English only.",
      "The free student AI Plus offer is only for college students aged 18+, so most school-level JEE/NEET aspirants will use the free plan.",
      "Like every AI tool, Gemini can make mistakes in calculations or facts — double-check important answers.",
      "It does not replace a structured course or a teacher who knows your syllabus and exam pattern."
    ],
    verdict: "Gemini is the best free starting point for most Indian students. Guided Learning is genuinely useful for understanding concepts, and the free JEE Main mock tests make it especially strong for engineering aspirants.",
    alternatives: ["chatgpt", "gemini-notebook", "pw-ai-guru"],
    faqs: [
      { q: "Is Google Gemini free for students in India?", a: "Yes. The free plan includes chat, Guided Learning, quizzes, flashcards and JEE Main mock tests. Eligible college students aged 18+ can also get Google AI Plus free for 12 months if they claim it by 31 December 2026." },
      { q: "Can Gemini help with JEE Main preparation?", a: "Yes. Since January 2026 Gemini offers full-length JEE Main practice tests built with content from PhysicsWallah and Careers360. Type “I want to take a JEE Main mock test” to start. The tests are in English." },
      { q: "Does Gemini work in Hindi?", a: "Yes, you can ask questions and get explanations in Hindi and many other languages. Some features, like the JEE Main mock tests, are English-only for now." },
      { q: "Is it okay to use Gemini for homework?", a: "Use it to understand, not to copy. Guided Learning is designed to walk you to the answer and check your understanding, which is far more useful for exams than a pasted answer." },
      { q: "How much does Google AI Plus cost in India?", a: "Google AI Plus is ₹399 per month in India. Students can get the AI Pro plan at a discounted ₹489 per month." }
    ],
    sources: [
      { label: "Google India — New AI tools to support India's next generation (Jan 2026)", url: "https://blog.google/intl/en-in/new-ai-tools-to-support-indias-next-generation/" },
      { label: "Google Workspace Updates — JEE Main practice tests in Gemini", url: "https://workspaceupdates.googleblog.com/2026/02/prepare-for-jee-main-with-gemini.html" },
      { label: "Google — How Guided Learning works", url: "https://blog.google/products-and-platforms/products/gemini/guided-learning-google-gemini/" },
      { label: "Google India — AI Plus now in India", url: "https://blog.google/intl/en-in/company-news/technology/do-more-with-ai-for-less-google-ai-plus-now-in-india/" },
      { label: "Business Today — Free AI Plus for university students (Sep 2026)", url: "https://www.businesstoday.in/amp/technology/news/story/google-offers-free-ai-plus-and-ai-pro-to-university-students-heres-how-to-claim-it-557112-2026-09-23" }
    ]
  },
  {
    slug: "gemini-notebook",
    name: "Gemini Notebook (NotebookLM)",
    shortName: "Gemini Notebook",
    audience: "learners",
    maker: "Google",
    url: "https://notebooklm.google/",
    tagline: "Upload NCERT chapters or your notes and get cited answers, flashcards, quizzes and audio lessons.",
    priceChip: "Free",
    metaTitle: "Gemini Notebook (NotebookLM) for Students: Guide & Limits",
    metaDescription: "Use Gemini Notebook (formerly NotebookLM) to revise NCERT and notes: cited answers, flashcards, quizzes, audio lessons in Indian languages, free limits.",
    quickAnswer: "Gemini Notebook (called NotebookLM until July 2026) is a free Google study tool that answers questions only from the material you upload — NCERT chapters, class notes, PDFs or YouTube lectures — and shows exactly where each answer came from. It can turn that material into flashcards, quizzes, mind maps, study guides and podcast-style audio lessons in Indian languages, which makes it one of the best free revision tools for Indian students.",
    facts: [
      ["Made by", "Google"],
      ["Best for", "Revision from your own notes, NCERT-based study, UPSC reading"],
      ["Price", "Free · higher limits with Google AI plans"],
      ["Free plan", "About 100 notebooks, 50 sources each, 50 questions a day"],
      ["Languages", "Audio Overviews in 50+ languages, Video Overviews in 80 languages"],
      ["Works on", "Web, Android, iPhone"]
    ],
    whatIs: [
      "Gemini Notebook is Google's AI research and study notebook. You create a notebook for a subject, add your sources — PDFs, Google Docs, website links, YouTube videos or pasted text — and then ask questions. Unlike a normal chatbot, it answers from <strong>your</strong> sources and adds citations so you can check the exact line in your book.",
      "The tool was called <strong>NotebookLM</strong> until Google renamed it on 16 July 2026. Features, limits and the free plan stayed the same, and old notebook links still work."
    ],
    benefits: [
      { title: "Answers you can trust and verify", body: "Because every answer is taken from the chapters you upload and comes with citations, it is far less likely to make things up than a general chatbot — ideal for NCERT-based exams like NEET and CBSE boards." },
      { title: "Revision material in minutes", body: "One click creates flashcards, quizzes, a study guide, a mind map or a timeline from a chapter. That saves hours of making notes by hand before exams." },
      { title: "Learn while travelling", body: "Audio Overviews turn a chapter into a podcast-style discussion you can listen to on the bus or metro. Video Overviews make a short narrated slide video." },
      { title: "Works in Indian languages", body: "Audio Overviews are available in 50+ languages and Video Overviews in 80, so Hindi-medium and regional-language students can revise in the language they think in." },
      { title: "Great for heavy reading exams", body: "UPSC, CLAT and CA students can upload long reports, Economic Survey chapters or bare acts and ask focused questions, with citations back to the page." },
      { title: "Free for everyday use", body: "The free plan is generous enough for daily study. You only need a Google account." }
    ],
    features: [
      "Chat with your own sources, with clickable citations",
      "Sources: PDFs, Google Docs/Slides, websites, YouTube videos, pasted text",
      "Studio tools: flashcards, quizzes, study guides, reports, mind maps, slide decks",
      "Audio Overviews (podcast style) and Video Overviews",
      "Deep Research to find and add new sources",
      "Syncs with the Gemini app"
    ],
    howTo: {
      heading: "How to use Gemini Notebook for revision",
      steps: [
        "Go to notebooklm.google and sign in with your Google account.",
        "Create one notebook per subject, e.g. “Class 12 Biology — NEET”.",
        "Add sources: NCERT chapter PDFs, your class notes, or a YouTube lecture link.",
        "Ask questions like “Explain the steps of DNA replication with the NCERT diagram references.”",
        "Open the Studio panel and generate flashcards and a quiz for the chapter.",
        "Create an Audio Overview in Hindi or English and listen to it during travel."
      ]
    },
    pricing: {
      rows: [
        ["Free", "₹0", "About 100 notebooks, 50 sources per notebook, 50 questions per day, all Studio tools with daily limits"],
        ["With Google AI plans (e.g. AI Plus ₹399/month)", "Included", "Higher limits on notebooks, sources and daily questions"]
      ],
      note: "Limits are as reported for 2026 and may change. College students who claim Google's free AI Plus student offer also get expanded Gemini Notebook limits."
    },
    limitations: [
      "It only knows what you upload — it will not add information from outside your sources unless you use Deep Research.",
      "The free plan has daily limits on questions and generated audio/video.",
      "Scanned or handwritten notes with poor image quality may not be read correctly.",
      "Interactive (talk-back) mode for Audio Overviews is English-only."
    ],
    verdict: "If you study from NCERT or fixed reading material, Gemini Notebook is the most reliable free AI tool for revision. The citations make it safer than a general chatbot, and the audio lessons are a real time-saver.",
    alternatives: ["google-gemini", "chatgpt", "perplexity"],
    faqs: [
      { q: "Is NotebookLM the same as Gemini Notebook?", a: "Yes. Google renamed NotebookLM to Gemini Notebook on 16 July 2026. It is the same tool with the same free plan, and old links redirect automatically." },
      { q: "Is Gemini Notebook free?", a: "Yes. The free plan allows around 100 notebooks, 50 sources per notebook and 50 questions a day, which is enough for most students." },
      { q: "Can I use it for NCERT and NEET preparation?", a: "Yes. Upload NCERT chapter PDFs and ask questions; every answer is cited to your source. You can also make flashcards and quizzes for each chapter." },
      { q: "Does it support Hindi and other Indian languages?", a: "Yes. Audio Overviews work in 50+ languages and Video Overviews in 80 languages, including major Indian languages." },
      { q: "How is it different from ChatGPT or Gemini chat?", a: "General chatbots answer from everything they were trained on. Gemini Notebook answers only from the sources you add and shows where each answer came from, so it is better for exam-syllabus revision." }
    ],
    sources: [
      { label: "Google — NotebookLM is now Gemini Notebook (Jul 2026)", url: "https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/" },
      { label: "Google Workspace Updates — rename details", url: "https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html" },
      { label: "Google — Video Overviews in 80 languages", url: "https://blog.google/innovation-and-ai/models-and-research/google-labs/notebook-lm-audio-video-overviews-more-languages-longer-content/" },
      { label: "Google — Audio Overviews in 50+ languages", url: "https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-audio-overviews-50-languages/" },
      { label: "Elephas — Gemini Notebook plans and limits (2026)", url: "https://elephas.app/blog/notebooklm-free-vs-plus" }
    ]
  },
  {
    slug: "chatgpt",
    name: "ChatGPT",
    audience: "learners",
    maker: "OpenAI",
    url: "https://chatgpt.com/",
    tagline: "The most widely used AI assistant, with a Study Mode that teaches you instead of giving answers away.",
    priceChip: "Free · Go ₹399/mo",
    metaTitle: "ChatGPT for Indian Students: Study Mode & Price (2026)",
    metaDescription: "How to use ChatGPT Study Mode for JEE, NEET, CUET and boards: features, ChatGPT Go at ₹399, Plus pricing, tips and limitations for Indian students.",
    quickAnswer: "ChatGPT is OpenAI's AI assistant and the most widely used AI tool among Indian students. Its free Study Mode works like a tutor: it asks what you already know, explains in layers and checks your understanding instead of just handing over answers. The free plan is enough to start; ChatGPT Go costs ₹399 a month in India (payable by UPI) for 10x higher limits.",
    facts: [
      ["Made by", "OpenAI"],
      ["Best for", "Explanations, practice questions, essays and writing help"],
      ["Price", "Free · Go ₹399/month · Plus ₹1,999/month"],
      ["Study Mode", "Available on all plans, including free"],
      ["Languages", "English, Hindi, Hinglish and many other languages"],
      ["Works on", "Web, Android, iPhone, Windows, Mac"]
    ],
    whatIs: [
      "ChatGPT is a general-purpose AI assistant. You can ask it to explain a concept, solve a problem step by step, create practice questions, check an essay, or read an uploaded PDF or photo.",
      "For learning, OpenAI added <strong>Study Mode</strong>. Instead of giving the final answer straight away, it asks what you already know, guides you with hints and questions, explains in simple layers and quizzes you to check understanding. It is available on every plan, including free."
    ],
    benefits: [
      { title: "Learns at your level", body: "Tell it “I'm in Class 11 preparing for JEE” and it adjusts the explanation. If it's too hard, ask for a simpler version; if it's too easy, ask for JEE Advanced-level depth." },
      { title: "Builds real understanding", body: "Study Mode stops you from copying answers. It walks you through the steps, which is exactly how you need to think in the exam hall." },
      { title: "Unlimited practice questions", body: "Ask for 20 MCQs on a chapter, assertion-reason questions, or a mixed test — then ask it to explain the ones you got wrong." },
      { title: "Help with writing", body: "Useful for board-exam answer writing, CUET English, SOPs for college applications and essays: it can suggest structure and point out weak arguments." },
      { title: "Affordable upgrade", body: "If the free limits feel tight during exam season, ChatGPT Go costs ₹399 a month in India with 10x more messages and file uploads than the free plan." }
    ],
    features: [
      "Study Mode — Socratic, step-by-step tutoring with comprehension checks",
      "Upload photos, PDFs and notes and ask questions about them",
      "Voice conversations for spoken practice and doubt clearing",
      "Memory, so it can remember your exam and weak topics",
      "Projects to keep each subject's chats and files together"
    ],
    howTo: {
      heading: "How to use ChatGPT Study Mode",
      steps: [
        "Open chatgpt.com or the app and sign in (a free account is enough).",
        "Turn on Study Mode: type @study in the message box, or tap + and choose Study. You can also go to chatgpt.com/studymode.",
        "Tell it your exam and level: “I'm preparing for NEET 2027. Teach me the human heart from NCERT.”",
        "Answer its questions honestly — that is how it finds your gaps.",
        "End each session with “Give me a 10-question quiz on what we covered.”",
        "Verify important facts and formulas with your textbook."
      ]
    },
    pricing: {
      rows: [
        ["Free", "₹0", "Study Mode, chat, limited messages and uploads"],
        ["ChatGPT Go", "₹399/month", "10x more messages, image generations and file uploads than free; longer memory; UPI payment"],
        ["ChatGPT Plus", "₹1,999/month", "Higher limits and access to more advanced models and tools"]
      ],
      note: "Prices are the Indian prices published by OpenAI at launch and may change. A limited free-year promotion for ChatGPT Go ran in India earlier; check chatgpt.com for any current offer."
    },
    limitations: [
      "It can be confidently wrong, especially in multi-step numericals — always check the final answer.",
      "It is not built around Indian exam patterns, so tell it your exam and syllabus clearly.",
      "Study Mode sometimes still gives the direct answer; ask it to guide you instead.",
      "Free plan limits can run out during long study sessions."
    ],
    verdict: "ChatGPT is a strong all-round study partner, and Study Mode makes it much better for learning than normal chat. The free plan is enough for most students; ChatGPT Go at ₹399 is good value if you use it daily.",
    alternatives: ["google-gemini", "perplexity", "gemini-notebook"],
    faqs: [
      { q: "Is ChatGPT Study Mode free?", a: "Yes. Study Mode is available on all ChatGPT plans, including the free plan, on web, Android and iPhone." },
      { q: "What is the price of ChatGPT Go in India?", a: "ChatGPT Go costs ₹399 per month in India and supports UPI payments. ChatGPT Plus costs ₹1,999 per month." },
      { q: "Can ChatGPT help with JEE and NEET?", a: "Yes, for explaining concepts, practice questions and doubt clearing. It is not tailored to Indian exam patterns by default, so mention your exam and level in your first message and double-check numerical answers." },
      { q: "How do I turn on Study Mode?", a: "Type @study in the message box on the web, or tap + and search for Study in the mobile app. You can also open chatgpt.com/studymode." },
      { q: "Can I ask questions in Hindi?", a: "Yes. ChatGPT understands and replies in Hindi, Hinglish and many other Indian languages." }
    ],
    sources: [
      { label: "OpenAI Help — Using study mode in ChatGPT", url: "https://help.openai.com/en/articles/11780217-chatgpt-study-mode-faq" },
      { label: "OpenAI — Introducing study mode", url: "https://openai.com/index/chatgpt-study-mode/" },
      { label: "TechCrunch — ChatGPT Go launched in India at ₹399", url: "https://techcrunch.com/2025/08/18/openai-launches-a-sub-5-chatgpt-plan-in-india" }
    ]
  },
  {
    slug: "pw-ai-guru",
    name: "PW AI Guru",
    audience: "learners",
    maker: "Physics Wallah (PW)",
    url: "https://www.pw.live/",
    tagline: "Physics Wallah's AI doubt-solver for JEE and NEET — ask by text, voice or photo, in Hindi, English or Hinglish.",
    priceChip: "Free with PW",
    metaTitle: "PW AI Guru: Physics Wallah's AI Doubt Solver for JEE/NEET",
    metaDescription: "PW AI Guru (formerly Gyan Guru) explained: 24/7 JEE and NEET doubt solving by text, voice or photo in Hindi and English, where to find it, cost and limits.",
    quickAnswer: "PW AI Guru is Physics Wallah's built-in AI tutor for JEE and NEET students. You can ask a doubt by typing, speaking or uploading a photo, in Hindi, English or Hinglish, and get an answer within seconds, 24/7. It is trained on PW's own library of questions, solutions and lectures, and comes at no extra cost for students enrolled in PW batches. It is also available inside the PW Books app, where NCERT books are free.",
    facts: [
      ["Made by", "Physics Wallah (PW), India"],
      ["Best for", "JEE and NEET doubt solving, NCERT concept help"],
      ["Price", "No extra cost for PW batch students; NCERT in PW Books app is free"],
      ["Languages", "Hindi, English, Hinglish"],
      ["Ask by", "Text, voice or photo"],
      ["Works on", "PW app (Android, iPhone, web), PW Books app (Android)"]
    ],
    whatIs: [
      "PW AI Guru (earlier called <strong>Gyan Guru</strong>) is the AI study companion inside Physics Wallah's learning platform. It answers academic doubts in Physics, Chemistry, Maths and Biology, and also helps with study planning and app-related questions.",
      "What makes it different from general chatbots is its knowledge base: according to Microsoft's case study, PW indexed its own content — over 1 million Q&As and more than 10 million solved doubts — so answers follow the way PW teachers explain JEE and NEET topics. The same AI Guru also sits inside the <strong>PW Books</strong> app, where you can highlight any line of an NCERT book and tap “Ask AI Guru” for an explanation."
    ],
    benefits: [
      { title: "Made for Indian entrance exams", body: "Because it is built on PW's JEE and NEET content, explanations match the exam pattern and level — not a generic, foreign-syllabus answer." },
      { title: "Doubts cleared in seconds, 24/7", body: "No waiting for a teacher's doubt session. Snap a photo of a question, speak your doubt, or type it, any time of day." },
      { title: "Learn in Hinglish", body: "Ask in Hindi, English or a mix — the way most students actually think and talk about problems." },
      { title: "Help right inside your NCERT book", body: "In the PW Books app, highlight a confusing line in an NCERT chapter and AI Guru explains it in simple words, with memory tips." },
      { title: "No extra fee", body: "PW does not charge extra for AI Guru — it comes with your PW batch, and NCERT books with AI help are free in PW Books." }
    ],
    features: [
      "Doubt solving by text, voice or photo",
      "Answers grounded in PW's own question bank and solved doubts",
      "Hindi, English and Hinglish support",
      "Inside PW Books: highlight text in NCERT books and tap “Ask AI Guru”",
      "Available 24/7 on app and web"
    ],
    howTo: {
      heading: "How to use PW AI Guru",
      steps: [
        "Install or update the Physics Wallah app and log in.",
        "Open your JEE or NEET batch (AI Guru is available to enrolled PW students).",
        "Tap the AI Guru icon at the bottom-right of the screen to open the chat.",
        "Type your doubt, record it by voice, or upload a photo of the question.",
        "Ask follow-ups like “explain step 3 again in Hindi” until it's clear.",
        "For NCERT reading, install the PW Books app, open a chapter, highlight a line and tap “Ask AI Guru”."
      ]
    },
    pricing: {
      rows: [
        ["AI Guru in PW app", "No extra cost", "Included for students enrolled in PW batches (PW offers both free and paid batches)"],
        ["PW Books app — NCERT & Exemplar", "Free", "NCERT books, video solutions and practice questions with AI Guru explanations"],
        ["PW Books — NEET Digital Star Pass", "₹2,000 (standard price)", "30–36 adaptive digital books for Physics, Chemistry and Biology"]
      ],
      note: "Batch fees and pass prices change often and PW runs frequent offers — check the PW app for current prices."
    },
    limitations: [
      "Focused on JEE, NEET and school science/maths — it is not built for UPSC, CAT or other exams.",
      "The full AI Guru experience in the main app needs a PW batch enrolment.",
      "The PW Books app is Android-only at the time of writing.",
      "As with any AI, check answers to tricky numericals with your teacher or solutions."
    ],
    verdict: "For JEE and NEET aspirants already studying with Physics Wallah, AI Guru is the most exam-relevant AI doubt solver available, and it costs nothing extra. Students outside PW can still use it for free via NCERT books in the PW Books app.",
    alternatives: ["google-gemini", "chatgpt", "gemini-notebook"],
    faqs: [
      { q: "What is PW AI Guru?", a: "It is Physics Wallah's AI doubt-solving assistant for JEE and NEET students. It answers questions by text, voice or photo, in Hindi, English or Hinglish, using PW's own content library." },
      { q: "Is PW AI Guru free?", a: "PW does not charge extra for AI Guru — it is included for students enrolled in PW batches. In the PW Books app, NCERT books with AI Guru explanations are free." },
      { q: "Is Gyan Guru the same as AI Guru?", a: "Yes. Gyan Guru was the earlier name of PW's AI study companion; it now appears as AI Guru in the PW apps." },
      { q: "Where do I find AI Guru in the PW app?", a: "Open your JEE or NEET batch in the Physics Wallah app and tap the AI Guru icon at the bottom-right of the screen." },
      { q: "Can non-PW students use AI Guru?", a: "Yes, through the PW Books app, where NCERT books and AI Guru explanations are free to use after logging in." }
    ],
    sources: [
      { label: "Microsoft — Physics Wallah Gyan Guru case study", url: "https://www.microsoft.com/en-in/aifirstmovers/physicswallah" },
      { label: "PW — PW Books app with AI doubt solving", url: "https://www.pw.live/news/pw-books-app-launch-digital-study-books-ai-doubt-solving" },
      { label: "PW — NEET Digital Star Pass and AI explanations", url: "https://www.pw.live/neet/exams/how-to-buy-neet-star-pass-and-enable-ai-explanations-on-pw-books" },
      { label: "PW Books", url: "https://books.pw.live/" }
    ]
  },
  {
    slug: "perplexity",
    name: "Perplexity",
    audience: "learners",
    maker: "Perplexity AI",
    url: "https://www.perplexity.ai/",
    tagline: "AI search that shows its sources — ideal for UPSC and competitive-exam current affairs.",
    priceChip: "Free",
    metaTitle: "Perplexity for UPSC & Current Affairs: Student Guide",
    metaDescription: "How to use Perplexity AI for UPSC, SSC and banking current affairs: answers with sources, Learn Mode, pricing and tips to use it safely.",
    quickAnswer: "Perplexity is an AI search engine that answers questions in plain language and lists the websites it used, so you can check every fact. That makes it especially useful for UPSC, SSC, banking and CLAT current affairs, where sources matter. The free plan gives unlimited basic searches with citations; verified students can get a discounted Education Pro plan and a Learn Mode with flashcards and quizzes.",
    facts: [
      ["Made by", "Perplexity AI"],
      ["Best for", "Current affairs, research, fact-checking with sources"],
      ["Price", "Free · Pro about US$20/month · Education Pro about US$10/month for verified students"],
      ["Student feature", "Learn Mode with flashcards and quizzes (verified students)"],
      ["Languages", "English, Hindi and other languages"],
      ["Works on", "Web, Android, iPhone, Comet browser"]
    ],
    whatIs: [
      "Perplexity combines a search engine with an AI assistant. When you ask a question, it searches the web, reads the results and writes a short answer with numbered citations linking to the original news articles, government pages or reports.",
      "For students, Perplexity offers <strong>Learn Mode</strong>, which explains topics step by step, asks questions to check understanding, and can create flashcards and quizzes. It is currently available to verified students on the web."
    ],
    benefits: [
      { title: "Current affairs with proof", body: "Ask “What were the key announcements in the latest RBI monetary policy?” and you get a summary with links to the sources — perfect for UPSC, SSC and banking preparation." },
      { title: "Faster research for essays and answers", body: "Use it to gather facts, data and multiple viewpoints for GS answers, essays, debates or college projects, with links you can cite." },
      { title: "Spot outdated or wrong information", body: "Because sources are shown, you can quickly check whether a claim comes from PIB, a ministry website or a reputable newspaper." },
      { title: "Learn Mode for revision", body: "Verified students can turn a topic into flashcards, multiple-choice quizzes and free-response practice." },
      { title: "Useful free plan", body: "Unlimited basic searches with citations are free, which covers daily current-affairs reading." }
    ],
    features: [
      "Answers with numbered citations to original sources",
      "Follow-up questions in the same thread",
      "Learn Mode: step-by-step explanations, flashcards and quizzes (verified students)",
      "Focus on academic sources for research-style questions",
      "Upload files and ask questions about them (paid plans have higher limits)",
      "Deep Research for long reports (limited on free plan)"
    ],
    howTo: {
      heading: "How to use Perplexity for current affairs",
      steps: [
        "Open perplexity.ai or the app — you can start without paying.",
        "Ask a specific question: “Summarise this week's important government schemes for UPSC Prelims, with sources.”",
        "Open two or three of the cited links to confirm the facts, especially dates and numbers.",
        "Ask follow-ups: “Link this to GS Paper 2 topics” or “Give me 5 MCQs on this.”",
        "Save useful threads into a collection for weekly revision.",
        "If you are a college student, verify your student status to unlock Learn Mode and the Education Pro discount."
      ]
    },
    pricing: {
      rows: [
        ["Free", "₹0", "Unlimited basic searches with citations, a few advanced (Pro) searches per day"],
        ["Pro", "About US$20/month (billed in local currency)", "Near-unlimited Pro searches, model choice, Deep Research, more file uploads"],
        ["Education Pro", "About US$10/month", "Full Pro at half price for verified students and educators"]
      ],
      note: "The free Perplexity Pro offer for Airtel customers closed to new users on 17 January 2026. Prices are as published in 2026 and may change."
    },
    limitations: [
      "Its answers are only as good as the websites it reads — prefer official sources (PIB, ministries, RBI) over blogs.",
      "Learn Mode currently needs student verification and is on the web app.",
      "The free plan has only a few advanced searches per day.",
      "Not designed for step-by-step maths or physics problem solving."
    ],
    verdict: "Perplexity is the best AI tool in this list for current affairs and research because every answer is backed by sources. Pair it with your newspaper and official websites, and it can save UPSC and government-exam aspirants a lot of time.",
    alternatives: ["google-gemini", "chatgpt", "gemini-notebook"],
    faqs: [
      { q: "Is Perplexity good for UPSC current affairs?", a: "Yes. It summarises news with links to the original sources, which makes it easy to verify facts. Always prefer official sources like PIB and ministry websites among the citations." },
      { q: "Is Perplexity free in India?", a: "Yes, the free plan offers unlimited basic searches with citations. Pro costs about US$20 a month, and verified students can get Education Pro for about US$10 a month." },
      { q: "Is the Airtel free Perplexity Pro offer still available?", a: "No. The Airtel offer closed to new users on 17 January 2026. People who activated it earlier keep their 12 months of Pro." },
      { q: "What is Perplexity Learn Mode?", a: "Learn Mode explains topics step by step, asks questions to check your understanding and creates flashcards and quizzes. It is currently for verified students on the web." },
      { q: "Can I trust Perplexity's answers?", a: "Treat them as a starting point. The benefit of Perplexity is that it shows its sources, so click through and check important facts before writing them in an exam." }
    ],
    sources: [
      { label: "Perplexity Help — What is Learn Mode?", url: "https://www.perplexity.ai/help-center/en/articles/12120542-what-is-learn-mode" },
      { label: "GeoToolbox — Perplexity pricing 2026", url: "https://geotoolbox.ai/blog/perplexity-pricing" },
      { label: "TelecomTalk — Airtel Perplexity Pro offer ended", url: "https://telecomtalk.info/airtels-perplexity-pro-ends-existing-12month-access/1004521/" }
    ]
  },

  /* ============================ INSTITUTES ============================ */
  {
    slug: "wayground",
    name: "Wayground (formerly Quizizz)",
    shortName: "Wayground",
    audience: "institutes",
    maker: "Wayground (formerly Quizizz)",
    url: "https://wayground.com/",
    tagline: "Create quizzes and practice tests from any PDF, chapter or video in minutes, with reports that show why students got it wrong.",
    priceChip: "Free plan",
    metaTitle: "Wayground (Quizizz) AI for Coaching Institutes in India",
    metaDescription: "How coaching institutes can use Wayground (formerly Quizizz) AI to turn PDFs into quizzes, run practice tests and find weak topics. Features, price, limits.",
    quickAnswer: "Wayground, the new name of Quizizz, is a quiz and practice platform that uses AI to turn a PDF, worksheet, chapter or video into a ready-to-use quiz in minutes. Teachers can run it live in class or as homework, and the reports show which questions students missed and why. There is a free basic plan, which makes it an easy first AI tool for coaching institutes.",
    facts: [
      ["Made by", "Wayground (formerly Quizizz), started by two Indian founders"],
      ["Best for", "Daily practice tests, homework quizzes, quick revision games"],
      ["Price", "Free Basic plan · paid Super, school and institute plans"],
      ["AI features", "Quiz from PDF/document/video, question rewrite, translation, reading support"],
      ["Languages", "Translation built in (Pro plan lists 180 languages)"],
      ["Works on", "Web, Android, iPhone; students can join without an account"]
    ],
    whatIs: [
      "Wayground is the new name for <strong>Quizizz</strong>, one of the world's most-used classroom quiz platforms, founded by college roommates Ankit Gupta and Deepak Cheenath. The company renamed itself because teachers now use it for much more than quizzes — lessons, interactive videos, flashcards and assessments.",
      "Its AI (Wayground AI) can read a PDF or document you upload and automatically create questions from it. Teachers can then edit, change question types, fix language, or generate similar replacement questions before sharing the quiz with a class code or link."
    ],
    benefits: [
      { title: "Save hours of test-making", body: "Upload your DPP sheet, a chapter PDF or notes, and get a draft quiz in minutes. Faculty spend time checking and improving questions instead of typing them." },
      { title: "More practice for every batch", body: "Because quizzes are quick to make, you can give daily chapter-wise tests, weekend revision quizzes and homework practice without extra staff." },
      { title: "See exactly where students struggle", body: "Reports show which questions and topics each student missed and suggest why — helping teachers plan remedial classes for weak areas." },
      { title: "Higher engagement", body: "Game-style modes with leaderboards and power-ups keep school and junior batches involved, both in live class and online." },
      { title: "Works for mixed-ability batches", body: "The AI can simplify language, add reading support and translate, so students who are weaker in English are not left behind." },
      { title: "Easy updates for parents", body: "Wayground can generate customised parent updates from quiz performance — useful for institutes that report progress to parents regularly." }
    ],
    features: [
      "AI quiz generation from PDFs, documents and videos",
      "Edit tools: change question type, fix grammar, generate similar questions",
      "Live (in class) and self-paced (homework) modes",
      "Question-level and student-level reports with remediation suggestions",
      "Accommodations such as read-aloud and extra time",
      "Library of 20 million+ teacher-created resources",
      "Company states that student data is not used to train AI"
    ],
    howTo: {
      heading: "How a coaching institute can start with Wayground",
      steps: [
        "Create a free teacher account at wayground.com.",
        "Click Create, choose a quiz, and upload a chapter PDF or your DPP sheet.",
        "Review the AI-generated questions: correct answers, adjust difficulty, and add your own exam-style questions.",
        "Share the join code or link with your batch — students can join from any phone.",
        "Run it live in class or assign it as homework with a deadline.",
        "Open the report after the test to find weak topics and plan the next class."
      ]
    },
    pricing: {
      rows: [
        ["Basic", "Free", "Individual teacher account, limited question types, store up to 20 resources"],
        ["Super (individual)", "Paid, price varies by country", "Premium question types, unlimited storage, full AI tools and reports"],
        ["School / institute plans", "Custom quote", "Multiple teachers, admin controls, integrations and analytics"]
      ],
      note: "Wayground shows local pricing when you sign in; check the pricing page for current rates in India."
    },
    limitations: [
      "AI-generated questions need a teacher's review, especially for JEE/NEET-level numericals.",
      "The free plan limits storage (20 resources) and some question types.",
      "Much of the ready-made library follows US/UK curricula, so Indian institutes will mostly create their own content.",
      "It is a practice and engagement tool, not a secure, proctored exam platform."
    ],
    verdict: "Wayground is the easiest way for a coaching institute to start using AI: free to try, quick to learn, and it immediately saves faculty time on creating practice tests. Pair it with a proper exam platform for high-stakes tests.",
    alternatives: ["eklavvya", "magicschool-ai", "khanmigo"],
    faqs: [
      { q: "Is Quizizz now called Wayground?", a: "Yes. Quizizz renamed itself Wayground because teachers use it for more than quizzes. Existing accounts and content carried over." },
      { q: "Is Wayground free for teachers?", a: "Yes, there is a free Basic plan for individual teachers, with a limit of 20 stored resources and fewer question types. Paid plans unlock more." },
      { q: "Can Wayground create a quiz from a PDF?", a: "Yes. Upload a PDF or document and Wayground AI automatically creates questions from it, which you can then edit." },
      { q: "Is Wayground good for JEE and NEET coaching?", a: "It is good for daily practice and chapter tests. Review AI questions carefully for accuracy and exam level, and use a proctored exam platform for full mock tests." },
      { q: "Do students need an account?", a: "No. Students can join a quiz with a code or link from any phone or computer." }
    ],
    sources: [
      { label: "Wayground AI — features", url: "https://wayground.com/quizizz-ai" },
      { label: "Wayground — From Quizizz to Wayground", url: "https://wayground.com/home/from-quizizz-to-wayground" },
      { label: "Wayground Help — Individual (Super) plan", url: "https://help.wayground.com/support/solutions/articles/158000404040-wayground-individual-super-plan" },
      { label: "SaaSworthy — Wayground pricing", url: "https://www.saasworthy.com/product/quizizz/pricing" }
    ]
  },
  {
    slug: "eklavvya",
    name: "Eklavvya",
    audience: "institutes",
    maker: "Splashgain Technology Solutions (Maharashtra, India)",
    url: "https://www.eklavvya.com/",
    tagline: "Indian AI exam platform: question papers, proctored online tests and AI checking of handwritten answer sheets.",
    priceChip: "Quote-based",
    metaTitle: "Eklavvya: AI Exams, Proctoring & Answer Sheet Checking",
    metaDescription: "Eklavvya for Indian institutes: AI question papers, proctored online exams and AI checking of handwritten answer sheets in 9 languages. Features and pricing.",
    quickAnswer: "Eklavvya is an Indian AI assessment platform by Splashgain, used by 500+ organisations including NMIMS. It helps institutes generate question papers with AI, run online exams with AI proctoring to prevent cheating, and check scanned handwritten answer sheets with AI in English and 8 Indian languages. Pricing is quote-based in INR, with a free demo.",
    facts: [
      ["Made by", "Splashgain Technology Solutions, Maharashtra, India"],
      ["Best for", "Mock tests at scale, secure online exams, faster answer-sheet checking"],
      ["Price", "Custom quote in INR (+18% GST); free demo"],
      ["AI features", "Question paper generator, AI proctoring, AI answer-sheet evaluation"],
      ["Languages", "Answer checking in English, Hindi, Marathi, Tamil, Telugu, Bengali, Kannada, Gujarati, Malayalam"],
      ["Scale", "500+ organisations; 1,00,000+ concurrent exam sessions supported"]
    ],
    whatIs: [
      "Eklavvya is an online examination and assessment platform built in India. It covers the whole exam cycle: creating the question paper, conducting the test online with AI-based proctoring, and evaluating answers — including descriptive, handwritten answer sheets.",
      "It is used by universities such as NMIMS, Sharda University and WeSchool, and by companies like EY and Zerodha for hiring tests. For coaching institutes, the most useful parts are the <strong>AI question paper generator</strong>, <strong>secure online mock tests</strong>, and <strong>AI answer-sheet checking</strong> for subjective papers."
    ],
    benefits: [
      { title: "Question papers in minutes", body: "Generate papers from your syllabus or study material with MCQs, fill in the blanks, short and long answers, case studies and diagram-based questions, with answer keys and difficulty mix." },
      { title: "Cheating-proof online mock tests", body: "AI proctoring monitors video, images and audio (including 360-degree options) and flags suspicious behaviour, so online tests are fair even when students write from home." },
      { title: "Check subjective answers much faster", body: "Scan handwritten answer sheets; OCR reads the handwriting and AI marks against your rubric. Independent research cited by Eklavvya found about a third less grading time per answer sheet." },
      { title: "Built for Indian languages", body: "Answer-sheet evaluation supports English, Hindi, Marathi, Tamil, Telugu, Bengali, Kannada, Gujarati and Malayalam — useful for regional-medium and UPSC mains-style answer writing." },
      { title: "Fair and consistent marking", body: "QR-based identity masking enables blind evaluation, with moderation and re-evaluation workflows, reducing teacher bias and disputes." },
      { title: "Handles large batches", body: "The platform supports 1,00,000+ concurrent sessions, so all-India test series can run on the same system." }
    ],
    features: [
      "AI question paper generator with multiple question types and answer keys",
      "Online objective, descriptive, coding and case-study tests",
      "AI remote proctoring (video, image, audio, 360-degree)",
      "AI answer-sheet checking with OCR and rubric-based scoring",
      "Onscreen marking with examiner, moderator and admin roles",
      "Analytics dashboards and detailed score explanations",
      "CERT-In certified for software security; ISO certified"
    ],
    howTo: {
      heading: "How an institute can adopt Eklavvya",
      steps: [
        "Book a free demo on eklavvya.com and share your batch size and test types.",
        "Start with one use case — for example, weekly online mock tests with proctoring.",
        "Upload your question bank or generate papers with the AI generator, then review them.",
        "Run a pilot test with one batch and check the proctoring and result reports.",
        "For descriptive papers, scan answer sheets and compare AI marks with a teacher's marks for a sample before scaling up.",
        "Roll out to more batches once your faculty is comfortable."
      ]
    },
    pricing: {
      rows: [
        ["All plans", "Custom quote (INR + 18% GST)", "Price depends on number of students, tests and modules chosen"],
        ["Demo", "Free", "Walkthrough of the platform for your use case"]
      ],
      note: "Eklavvya does not publish fixed prices; ask for a quote based on your student volume."
    },
    limitations: [
      "No public price list — small institutes need to request a quote.",
      "More set-up effort than simple quiz tools; best for institutes running regular formal tests.",
      "AI marking of subjective answers should be sample-checked by teachers, especially early on.",
      "Mainly built for colleges, universities and corporates, so some features may be more than a small coaching centre needs."
    ],
    verdict: "For institutes that run regular mock tests, test series or subjective answer-writing practice, Eklavvya is one of the strongest India-built AI exam platforms. Smaller coaching centres should start with a pilot to confirm the cost fits their batch size.",
    alternatives: ["wayground", "magicschool-ai", "interakt"],
    faqs: [
      { q: "What is Eklavvya?", a: "Eklavvya is an Indian AI-powered online examination platform by Splashgain. It offers AI question paper generation, AI-proctored online exams and AI evaluation of handwritten answer sheets." },
      { q: "Can Eklavvya check handwritten answer sheets?", a: "Yes. You scan the answer sheets; OCR converts the handwriting to text and AI evaluates it against your rubric, with teacher review and re-evaluation options." },
      { q: "Which languages does Eklavvya's answer checking support?", a: "English, Hindi, Marathi, Tamil, Telugu, Bengali, Kannada, Gujarati and Malayalam." },
      { q: "How much does Eklavvya cost?", a: "Pricing is quote-based in INR plus 18% GST and depends on your number of students and modules. A free demo is available." },
      { q: "Is Eklavvya suitable for coaching institutes?", a: "Yes, especially for institutes running online test series, mock tests or descriptive answer-writing practice. Very small centres may find simpler tools like Wayground enough to start." }
    ],
    sources: [
      { label: "Eklavvya — official site", url: "https://www.eklavvya.com/" },
      { label: "Eklavvya — AI answer sheet checking", url: "https://www.eklavvya.com/ai-answer-sheet-checking/" },
      { label: "Eklavvya — AI question paper generator", url: "https://www.eklavvya.com/blog/ai-question-paper-generator/" },
      { label: "Eklavvya — pricing", url: "https://www.eklavvya.com/pricing/" }
    ]
  },
  {
    slug: "magicschool-ai",
    name: "MagicSchool AI",
    audience: "institutes",
    maker: "MagicSchool",
    url: "https://www.magicschool.ai/",
    tagline: "80+ free AI tools for teachers — lesson plans, worksheets, quizzes, rubrics and presentations.",
    priceChip: "Free plan",
    metaTitle: "MagicSchool AI for Teachers & Coaching Institutes in India",
    metaDescription: "How coaching faculty can use MagicSchool AI's 80+ free tools for lesson plans, worksheets, MCQ quizzes and Hindi translation. Features, pricing, tips.",
    quickAnswer: "MagicSchool AI is a platform of 80+ AI tools made specifically for teachers. With a free account, a faculty member can create lesson plans, worksheets, multiple-choice quizzes, rubrics, presentations and report-card comments in minutes, and translate them into Hindi and 97 other languages. Any individual teacher can sign up, so it suits private coaching institutes as well as schools.",
    facts: [
      ["Made by", "MagicSchool"],
      ["Best for", "Faculty prep: lesson plans, worksheets, quizzes, presentations"],
      ["Price", "Free · Plus US$8.33/month (yearly) or US$12.99/month"],
      ["Tools", "80+ teacher tools, 50+ student tools, Raina AI assistant"],
      ["Languages", "Translates into 98 languages incl. Hindi; 24 interface languages"],
      ["Works on", "Web (any browser), Chrome extension"]
    ],
    whatIs: [
      "MagicSchool is an AI platform designed around teachers' daily work. Instead of one blank chat box, it gives ready-made tools — a Lesson Plan Generator, Worksheet Generator, Multiple Choice Quiz Maker, Rubric Generator, Presentation Generator and many more — where the teacher fills in a few details (grade, topic, standard) and gets a usable draft.",
      "It also has <strong>Raina</strong>, an AI teaching assistant for open-ended questions, and <strong>Student Rooms</strong>, where teachers can give students controlled access to AI tools. MagicSchool reports a community of more than 6 million educators and students, and says teacher and student data is not used to train AI models."
    ],
    benefits: [
      { title: "Cut preparation time", body: "Most teachers using MagicSchool report saving 7+ hours a week. For a coaching faculty, that means less time on worksheets and more time on teaching and doubt sessions." },
      { title: "Consistent material across teachers", body: "Institutes can use the same tools and formats for DPPs, worksheets and lesson plans, so material quality doesn't depend on one teacher's time." },
      { title: "Quick quizzes and question sets", body: "The Multiple Choice Quiz Maker and question generators create practice sets for any chapter and level — review and add your own exam-style questions." },
      { title: "Hindi and regional-language material", body: "Translate worksheets, notices and explanations into Hindi or other languages in seconds, helping bilingual batches." },
      { title: "Better presentations and hooks", body: "Generate class presentations, real-world examples and engaging starters that make tough topics easier to introduce." },
      { title: "Free to start for any teacher", body: "Unlike Google's classroom AI, which is limited to recognised schools, any individual educator — including coaching faculty and private tutors — can sign up free." }
    ],
    features: [
      "80+ teacher tools: lesson plans, worksheets, MCQ quizzes, rubrics, presentations, report comments",
      "Raina — AI assistant for teachers",
      "Text leveller to simplify or deepen content",
      "Translation into 98 languages, including Hindi",
      "Student Rooms for teacher-controlled student AI use",
      "Company states teacher and student data is not used to train AI"
    ],
    howTo: {
      heading: "How coaching faculty can use MagicSchool",
      steps: [
        "Sign up free at magicschool.ai with your email or Google account.",
        "Pick a tool, e.g. Worksheet Generator or Multiple Choice Quiz Maker.",
        "Be specific in the details: “Class 11, JEE Main level, Laws of Motion, 15 questions, include numericals with answers.”",
        "Review every question and answer — correct anything that doesn't match your syllabus or exam level.",
        "Use the translate option to create a Hindi version for bilingual batches.",
        "Save your best prompts so every faculty member produces material in the same format."
      ]
    },
    pricing: {
      rows: [
        ["Free", "US$0", "80+ teacher tools, Raina, quizzes and writing feedback, with standard usage limits"],
        ["Plus", "US$8.33/month billed yearly, or US$12.99 monthly", "Unlimited generations and history, 50+ student tools, advanced features"],
        ["Enterprise", "Custom quote", "Institute-wide accounts, SSO, admin dashboards and integrations"]
      ],
      note: "Prices are published in US dollars on MagicSchool's pricing page."
    },
    limitations: [
      "Built mainly for school (K–12) teachers, with US-style standards by default — mention Indian board or exam level in every request.",
      "AI-generated questions and answers must be checked, especially for JEE/NEET-level numericals.",
      "The free plan has usage limits; heavy daily use needs Plus.",
      "Prices are in US dollars, not rupees."
    ],
    verdict: "MagicSchool is the best all-in-one AI toolkit for teachers that any coaching faculty can sign up for today. It won't know your exact exam pattern unless you tell it, but it removes most of the repetitive work of making worksheets, quizzes and lesson plans.",
    alternatives: ["khanmigo", "wayground", "eklavvya"],
    faqs: [
      { q: "Is MagicSchool AI free?", a: "Yes. The free plan includes 80+ teacher tools, the Raina assistant, quizzes and writing feedback with standard usage limits. The Plus plan costs US$8.33 a month billed yearly." },
      { q: "Can coaching institute teachers in India use MagicSchool?", a: "Yes. Any individual educator can sign up for the free or Plus plan. Institutes wanting shared admin controls can ask for an Enterprise quote." },
      { q: "Does MagicSchool support Hindi?", a: "Yes. It can translate content into 98 languages, including Hindi, and the interface is available in 24 languages." },
      { q: "Can MagicSchool make JEE or NEET questions?", a: "It can draft questions at any level if you specify the exam and chapter, but a subject teacher must check accuracy and difficulty before use." },
      { q: "Why not Gemini in Google Classroom?", a: "Google's Classroom AI is only available to recognised schools and colleges on Google Workspace for Education; private coaching centres don't qualify. MagicSchool has no such restriction." }
    ],
    sources: [
      { label: "MagicSchool — pricing", url: "https://www.magicschool.ai/pricing" },
      { label: "MagicSchool — FAQ (languages, privacy)", url: "https://www.magicschool.ai/faq" },
      { label: "MagicSchool — teacher platform", url: "https://www.magicschool.ai/magicschool" },
      { label: "Google — Workspace for Education eligibility", url: "https://knowledge.workspace.google.com/admin/getting-started/editions/qualifications-for-google-workspace-for-education" }
    ]
  },
  {
    slug: "khanmigo",
    name: "Khanmigo for Teachers",
    audience: "institutes",
    maker: "Khan Academy",
    url: "https://www.khanmigo.ai/",
    tagline: "Khan Academy's free AI teaching assistant for Indian teachers — in English, Hindi, Marathi and Odia.",
    priceChip: "Free for teachers",
    metaTitle: "Khanmigo for Teachers in India: Free AI Teaching Assistant",
    metaDescription: "Khanmigo is free for all teachers in India: lesson plans, assessments and chapter summaries in English, Hindi, Marathi and Odia. Features, sign-up, limits.",
    quickAnswer: "Khanmigo for Teachers is Khan Academy's AI teaching assistant, and it has been free for all teachers in India since November 2024. It helps teachers prepare lessons, create assessments and rubrics, write chapter summaries and lesson hooks, and see summaries of students' work on Khan Academy. It works in English, Hindi, Marathi and Odia, and is backed by Microsoft.",
    facts: [
      ["Made by", "Khan Academy (non-profit), supported by Microsoft"],
      ["Best for", "Lesson planning, assessments, chapter summaries"],
      ["Price", "Free for teachers · learner plan US$4/month"],
      ["Languages", "English, Hindi, Marathi, Odia"],
      ["In India since", "14 November 2024"],
      ["Works on", "Web (Khan Academy account)"]
    ],
    whatIs: [
      "Khanmigo is the AI assistant built by Khan Academy, the non-profit known for its free video lessons and practice. The teacher version works as a planning and teaching assistant: it drafts lesson plans, assessments, rubrics, exit tickets and chapter summaries, and can refresh a teacher's own subject knowledge.",
      "Khan Academy made Khanmigo for Teachers free for every teacher in India on Children's Day 2024, with support from Microsoft. Since then it has added Hindi, Marathi and Odia, driven by feedback from Indian teachers — especially in government schools."
    ],
    benefits: [
      { title: "Completely free", body: "There is no cost for teachers, which makes it a zero-risk way for an institute's faculty to start using AI." },
      { title: "Teaches like a teacher", body: "Khan Academy designed Khanmigo around good teaching practice — it creates lesson hooks, learning objectives and exit tickets, not just blocks of text." },
      { title: "Indian-language support", body: "Teachers can work in Hindi, Marathi or Odia, which suits vernacular-medium coaching and school-level batches." },
      { title: "Faster assessment prep", body: "Generate chapter-wise assessments and rubrics and spend the saved time on doubt sessions and weaker students." },
      { title: "Track student practice", body: "If your students practise on Khan Academy (free for them), Khanmigo can summarise their work and show who needs support." },
      { title: "Trusted, ad-free platform", body: "Khan Academy is a non-profit with a long record in education, which matters when institutes choose tools for students." }
    ],
    features: [
      "Lesson plans aligned to Khan Academy's content library",
      "Assessments, rubrics, learning objectives and exit tickets",
      "Chapter summaries and lesson hooks",
      "Subject-matter refreshers for teachers",
      "Summaries of student work on Khan Academy",
      "Chat history saved in your account"
    ],
    howTo: {
      heading: "How to start with Khanmigo for Teachers",
      steps: [
        "Create a free teacher account on Khan Academy.",
        "Open Khanmigo and choose a teacher tool, e.g. lesson plan or assessment.",
        "Set your preferred language to English, Hindi, Marathi or Odia.",
        "Enter the class, subject and chapter, and ask for the output you need.",
        "Edit the draft to match your board, exam pattern and batch level.",
        "Optionally, set up a class on Khan Academy so students practise and you can see summaries of their work."
      ]
    },
    pricing: {
      rows: [
        ["Khanmigo for Teachers", "Free", "All teacher tools: lesson plans, assessments, rubrics, summaries, refreshers"],
        ["Khanmigo for learners/parents", "US$4/month or US$44/year", "Personal AI tutor for students"],
        ["Schools and districts", "On request", "Institution-level rollout"]
      ],
      note: "Prices as published on khanmigo.ai."
    },
    limitations: [
      "Works best with Khan Academy's own content library, which is strongest at school level (Class 1–12 basics) rather than JEE Advanced or NEET-level depth.",
      "Student-work summaries only cover practice done on Khan Academy.",
      "Indian-language support is currently limited to Hindi, Marathi and Odia besides English.",
      "All AI drafts need a teacher's review before use."
    ],
    verdict: "Khanmigo is the best completely free AI assistant for teachers in India, especially for school-level and foundation batches and for Hindi, Marathi or Odia medium teaching. For competitive-exam depth, combine it with MagicSchool or your own question bank.",
    alternatives: ["magicschool-ai", "wayground", "eklavvya"],
    faqs: [
      { q: "Is Khanmigo free for teachers in India?", a: "Yes. Khan Academy made Khanmigo for Teachers free for all teachers in India on 14 November 2024, with support from Microsoft." },
      { q: "Which Indian languages does Khanmigo support?", a: "Khanmigo works in English, Hindi, Marathi and Odia." },
      { q: "What can Khanmigo do for teachers?", a: "It drafts lesson plans, assessments, rubrics, learning objectives, exit tickets, chapter summaries and lesson hooks, and can summarise students' work on Khan Academy." },
      { q: "Can coaching institute teachers use Khanmigo?", a: "Yes, any teacher can create a free Khan Academy teacher account. Its content is strongest at school and foundation level, so JEE/NEET faculty will need to adapt outputs." },
      { q: "Is there a Khanmigo for students?", a: "Yes, a learner and parent version costs US$4 a month. For free student tools, see our learners' section." }
    ],
    sources: [
      { label: "ScooNews — Khanmigo launched for teachers in India", url: "https://scoonews.com/news/khan-academy-launches-khanmigo-ai-tool-for-teachers-in-india/" },
      { label: "Odisha Diary — Khanmigo in Odia (Dec 2025)", url: "https://orissadiary.com/khan-academy-launches-free-ai-teaching-assistant-khanmigo-in-odia-for-teachers-in-odisha/" },
      { label: "Khanmigo — pricing", url: "https://www.khanmigo.ai/pricing" }
    ]
  },
  {
    slug: "interakt",
    name: "Interakt",
    audience: "institutes",
    group: "communication",
    maker: "Jio Haptik",
    url: "https://www.interakt.shop/",
    tagline: "WhatsApp automation with AI agents that answer admission enquiries and send fee and class reminders 24/7.",
    priceChip: "14-day free trial",
    metaTitle: "Interakt WhatsApp AI for Coaching Institute Admissions",
    metaDescription: "How coaching institutes use Interakt (Jio Haptik) to answer admission enquiries on WhatsApp with AI and send fee and class reminders. Features and pricing.",
    quickAnswer: "Interakt is an Indian WhatsApp Business platform from Jio Haptik. Coaching institutes use it to answer admission enquiries automatically with an AI agent, share brochures and fee details, qualify leads, send class, exam and fee reminders, and broadcast updates to students and parents — in 22 Indian languages, with hand-off to a counsellor when needed. It has a 14-day free trial; paid plans are monthly, plus WhatsApp's own message charges.",
    facts: [
      ["Made by", "Jio Haptik (Reliance Jio group)"],
      ["Best for", "Admission enquiries, lead follow-up, fee and class reminders"],
      ["Price", "14-day free trial · monthly plans · AI agents from about ₹10,000 · plus WhatsApp message fees"],
      ["AI features", "Support agent, lead-qualification agent, appointment-booking agent"],
      ["Languages", "22 Indian languages"],
      ["Works with", "WhatsApp Business API, Instagram, Razorpay, CRMs"]
    ],
    whatIs: [
      "Interakt is a platform for running a business on the official WhatsApp Business API. It gives an institute a shared WhatsApp inbox for the whole team, no-code chatbots, broadcast campaigns, templates, analytics and integrations with payment gateways like Razorpay.",
      "It is powered by <strong>Jio Haptik's</strong> conversational AI — the same company that built the MyGov helpdesk that handled millions of citizen queries during COVID-19. Its AI agents can answer common questions, qualify leads and book appointments on their own, and pass the chat to a human counsellor with full context when needed."
    ],
    benefits: [
      { title: "Never miss an admission enquiry", body: "Parents and students message at all hours. The AI agent replies instantly with course details, batch timings, fees and brochures, even at midnight or on Sundays." },
      { title: "Better lead conversion", body: "The lead-qualification agent asks the right questions (class, exam, city, budget), scores leads and passes serious ones to your counsellors, so the team focuses on students most likely to join." },
      { title: "Automatic reminders", body: "Send class schedules, test reminders and fee-due reminders on WhatsApp — where students and parents actually read messages — with Razorpay payment links." },
      { title: "Regular parent updates", body: "Share attendance, test results and event updates with parents through WhatsApp templates, building trust and reducing phone calls." },
      { title: "Speak the family's language", body: "With 22 Indian languages, institutes can reply to parents in Hindi, Marathi, Tamil, Telugu and more." },
      { title: "One inbox for the whole team", body: "Counsellors, accounts and academic staff share one WhatsApp number and inbox, so no conversation gets lost on a personal phone." }
    ],
    features: [
      "Official WhatsApp Business API with a shared team inbox",
      "AI agents: support/FAQ, lead qualification, appointment booking",
      "Human hand-off with full chat context",
      "No-code chatbot flows and broadcast campaigns",
      "Razorpay payment links for fee collection",
      "Instagram DMs, CRM integrations and campaign analytics",
      "22 Indian languages"
    ],
    howTo: {
      heading: "How a coaching institute can set up Interakt",
      steps: [
        "Start the 14-day free trial at interakt.shop and connect your institute's WhatsApp Business number.",
        "Add your FAQs: courses, batch timings, fees, address, demo-class process.",
        "Set up an AI agent or chatbot flow for admission enquiries, with hand-off to a counsellor.",
        "Create message templates for class reminders, test alerts and fee reminders (WhatsApp needs templates to be approved).",
        "Import student and parent contacts who have opted in, and group them by batch.",
        "Track replies and conversions in the dashboard and refine your messages every month."
      ]
    },
    pricing: {
      rows: [
        ["Free trial", "₹0 for 14 days", "Test the inbox, chatbots and campaigns"],
        ["Monthly plans (Starter / Growth / Advanced)", "Roughly ₹999–₹3,799 per month depending on plan and billing period", "Shared inbox, automation, broadcasts; higher plans add advanced workflows and API access"],
        ["AI agents", "From about ₹10,000", "Premium add-on for AI support, lead qualification and booking agents"],
        ["WhatsApp message charges", "Per message, set by Meta", "Charged separately by conversation type (marketing, utility, authentication)"]
      ],
      note: "Interakt's plan prices vary by source and billing cycle and may exclude GST — confirm current pricing on interakt.shop before buying."
    },
    limitations: [
      "Total cost grows with message volume because WhatsApp charges per message on top of the plan.",
      "WhatsApp rules apply: contacts must opt in, and outbound messages need approved templates.",
      "AI agents are a separate, higher-priced add-on.",
      "It is a communication tool, not a teaching tool — it won't help with content or tests."
    ],
    verdict: "For coaching institutes that get most enquiries on WhatsApp, Interakt turns missed messages into admissions and removes the manual work of reminders. Start with the free trial and one simple enquiry flow before adding AI agents.",
    alternatives: ["eklavvya", "wayground", "magicschool-ai"],
    faqs: [
      { q: "What is Interakt?", a: "Interakt is an Indian WhatsApp Business API platform by Jio Haptik that offers a shared inbox, chatbots, broadcasts and AI agents for customer and student communication." },
      { q: "How can coaching institutes use Interakt?", a: "To answer admission enquiries automatically, share brochures and fees, qualify leads, send class, test and fee reminders, collect fees via Razorpay links, and send updates to parents." },
      { q: "How much does Interakt cost?", a: "There is a 14-day free trial. Paid plans are monthly (roughly ₹999–₹3,799 depending on plan), AI agents start around ₹10,000, and WhatsApp charges per message separately. Check interakt.shop for current prices." },
      { q: "Does Interakt support Hindi and regional languages?", a: "Yes, Interakt's AI agents support 22 Indian languages." },
      { q: "Can a human counsellor take over the chat?", a: "Yes. The AI agent hands the conversation to a human with the full chat history when a query needs a person." }
    ],
    sources: [
      { label: "Interakt — WhatsApp API in education", url: "https://www.interakt.shop/whatsapp-business-api/whatsapp-business-api-in-education/" },
      { label: "Interakt — AI employee on WhatsApp", url: "https://www.interakt.shop/whatsapp-ai-agents/ai-employee-on-whatsapp/" },
      { label: "respond.io — Interakt review 2026", url: "https://respond.io/blog/interakt-review" },
      { label: "Xobito — WATI vs Interakt 2026", url: "https://xobito.com/blog/wati-vs-interakt-complete-comparison-for-2026" }
    ]
  }
  ,
  /* ============ INSTITUTES — AI business phone & virtual numbers ============ */
  {
    slug: "myoperator",
    name: "MyOperator",
    audience: "institutes",
    group: "business-phone",
    lastChecked: "6 October 2026",
    lastCheckedIso: "2026-10-06",
    maker: "MyOperator (VoiceTree Technologies)",
    url: "https://myoperator.com/education",
    tagline: "Business number, IVR, WhatsApp and AI voice agents in one dashboard — already used by Aakash, DPS and PrepMed NEET.",
    priceChip: "From ₹5,000/month",
    metaTitle: "MyOperator for Coaching Institutes: AI Calls, IVR & Price",
    metaDescription: "How coaching institutes use MyOperator for admission calls: virtual number, IVR, WhatsApp, AI voice agents in Hindi and 9 Indian languages, and ₹ pricing.",
    quickAnswer: "MyOperator is an Indian cloud calling and WhatsApp platform used by 12,000+ businesses, including education brands like Aakash, Delhi Public School and PrepMed NEET. It gives an institute one professional number with IVR, call recording, WhatsApp Business API and — on its AI plan — voice agents that answer enquiry calls 24/7 in English, Hindi, Hinglish and 9 other Indian languages. Plans start at ₹5,000 a month (billed yearly, 10 users); AI agents are on custom pricing.",
    facts: [
      ["Made by", "MyOperator, India"],
      ["Best for", "Mid-size and multi-branch institutes that want calls and WhatsApp in one place"],
      ["Price", "Sedan ₹5,000/month · SUV ₹15,000/month · AI Team custom (all billed yearly, + GST)"],
      ["AI features", "AI voice and chat agents, smart handover, missed-call-to-WhatsApp"],
      ["Languages", "English, Hindi, Hinglish + 9 Indian languages (AI voice agent)"],
      ["Works with", "Web, Android, iPhone · Zoho CRM, LeadSquared, Freshdesk, Bigin, 100+ integrations"]
    ],
    whatIs: [
      "MyOperator is a cloud telephony company from India. Instead of buying phone lines and a call-centre setup, an institute gets a virtual business number that rings on counsellors' mobiles or laptops, with a menu (IVR), call recording and reports in one online dashboard.",
      "It also includes the <strong>official WhatsApp Business API</strong>, so calls and WhatsApp chats sit together. On its top plan, <strong>AI voice agents</strong> answer calls on their own, qualify the enquiry, and hand over to a human counsellor with the full conversation history. MyOperator has a dedicated education page and lists Aakash, Delhi Public School and PrepMed NEET among its users."
    ],
    benefits: [
      { title: "Every admission call is answered", body: "The AI voice agent picks up calls at any hour, answers questions about courses, batches and fees, and collects the student's details — so late-night and Sunday enquiries are not lost." },
      { title: "Calls and WhatsApp together", body: "A missed call can automatically trigger a WhatsApp message with your brochure. Counsellors see both calls and chats for the same parent in one place." },
      { title: "One number, many branches", body: "IVR and smart routing send callers to the right branch, course or counsellor ('Press 1 for JEE, 2 for NEET'), so a growing institute keeps one easy number." },
      { title: "Counsellors can't take leads with them", body: "Calls happen on the institute's number and are recorded in the dashboard, so the enquiry history stays with the institute even if a counsellor leaves." },
      { title: "Fee and exam reminders", body: "Use WhatsApp broadcasts and outbound calls for fee-due reminders, test schedules and result announcements." },
      { title: "Proof from education brands", body: "MyOperator reports that Aakash saw 18% higher conversions after using it — useful reassurance for a large institute choosing a vendor." }
    ],
    features: [
      "Virtual business number and 1800 toll-free number (add-on)",
      "Multi-level IVR, smart routing, call recording and live dashboards",
      "Official WhatsApp Business API with broadcasts and templates",
      "AI voice agents with 24/7 answering and context-aware human handover",
      "Missed-call recovery through automatic WhatsApp messages",
      "Mobile app for counsellors; auto-dialer add-on",
      "CRM integrations: Zoho CRM, LeadSquared, Freshdesk, Bigin and 100+ more"
    ],
    howTo: {
      heading: "How a coaching institute can set up MyOperator",
      steps: [
        "Book a demo or start the trial on myoperator.com and complete business KYC for your number.",
        "Pick a local or toll-free number and add your counsellors as users.",
        "Build a simple IVR: course or exam choice first, then branch, then counsellor.",
        "Connect WhatsApp and set a missed-call message with your brochure and fee details.",
        "Connect your CRM (for example LeadSquared or Zoho) so every call creates or updates a lead.",
        "Once basic calling works, ask for the AI Team plan to add a voice agent for after-hours enquiries."
      ]
    },
    pricing: {
      rows: [
        ["Sedan", "₹5,000/month (billed yearly)", "10 users, IVR, unlimited calling and WhatsApp, call recording, broadcasts, basic reports"],
        ["SUV", "₹15,000/month (billed yearly)", "Everything in Sedan + smart IVR, after-call automation, CRM and 100+ integrations, API, live dashboards"],
        ["AI Team", "Custom quote", "Everything in SUV + voice and chat AI agents, AI automations, dedicated onboarding and priority support"],
        ["Add-ons", "Toll-free from ₹500/month · auto-dialer ₹700/user/month", "WhatsApp messages charged per message (marketing ₹0.95)"]
      ],
      note: "Prices are from MyOperator's India pricing page, exclude GST and are billed yearly. Meta's WhatsApp charges are extra."
    },
    limitations: [
      "All plans are billed yearly, so the upfront cost is high for a small single-centre institute.",
      "AI voice agents are only on the custom-priced AI Team plan.",
      "WhatsApp messages cost extra per message on top of the plan.",
      "Setup of IVR, CRM and AI flows takes some planning — use the onboarding support."
    ],
    verdict: "MyOperator is the most complete choice for established and multi-branch institutes that want calling, WhatsApp and AI agents from one Indian vendor with education references. Very small institutes may find the yearly billing too heavy to start with.",
    alternatives: ["exotel", "talkeasy", "interakt"],
    relatedLinks: [{ lead: "Comparing options?", text: "See our guide to the best AI business phone tools for coaching institutes", href: "best-ai-business-phone-virtual-number-coaching-institutes-india.html" }],
    faqs: [
      { q: "What is MyOperator?", a: "MyOperator is an Indian cloud calling and WhatsApp platform that gives businesses a virtual number, IVR, call recording, WhatsApp Business API and AI voice agents in one dashboard." },
      { q: "How much does MyOperator cost?", a: "The Sedan plan is ₹5,000 a month and SUV is ₹15,000 a month, both for 10 users and billed yearly plus GST. The AI Team plan with AI agents has custom pricing." },
      { q: "Does MyOperator's AI agent speak Hindi?", a: "Yes. MyOperator's AI voice agent supports English, Hindi, Hinglish and 9 other Indian languages, and can switch language during a call." },
      { q: "Do coaching institutes use MyOperator?", a: "Yes. MyOperator lists education customers such as Aakash, Delhi Public School and PrepMed NEET on its education page." },
      { q: "Can MyOperator connect to LeadSquared?", a: "Yes. MyOperator integrates with CRMs including LeadSquared, Zoho CRM, Freshdesk and Bigin." }
    ],
    sources: [
      { label: "MyOperator — Education solutions", url: "https://myoperator.com/education" },
      { label: "MyOperator — India pricing", url: "https://myoperator.com/india-pricing" },
      { label: "MyOperator — AI voice agents", url: "https://myoperator.com/ai-voicebot-for-calls" }
    ]
  },
  {
    slug: "exotel",
    name: "Exotel",
    audience: "institutes",
    group: "business-phone",
    lastChecked: "6 October 2026",
    lastCheckedIso: "2026-10-06",
    maker: "Exotel Techcom",
    url: "https://exotel.com/",
    tagline: "Enterprise-grade cloud calling with AI voice agents, 150+ integrations and a 7-day free trial.",
    priceChip: "From ₹9,999 (5 months)",
    metaTitle: "Exotel for Coaching Institutes: AI Voice Agents & Pricing",
    metaDescription: "How coaching institutes use Exotel for admission calls: virtual numbers, IVR, AI voice agents, call analysis, 150+ integrations and ₹ pricing plans.",
    quickAnswer: "Exotel is one of India's largest cloud communication companies, handling 25 billion+ interactions a year for brands like Flipkart, HDFC Bank and Swiggy. For institutes it offers virtual numbers, multi-level IVR, call recording, an auto-dialer and AI voice agents that can resolve routine calls on their own, plus AI analysis of every call. Business phone plans start at ₹9,999 for 5 months (3 agents), with a 7-day free trial and 500 credits.",
    facts: [
      ["Made by", "Exotel, Bengaluru"],
      ["Best for", "Large institutes and edtechs with a counselling team and a CRM"],
      ["Price", "Dabbler ₹9,999 (5 months) · Believer ₹19,999 (11 months) · Influencer ₹49,499 (11 months)"],
      ["AI features", "AI voice and chat agents, AI Assist for counsellors, Conversation Quality Analysis"],
      ["Languages", "Indian-language support varies by product — confirm yours in the demo"],
      ["Works with", "Web, mobile · 150+ integrations incl. Zoho, Vtiger, Kapture, WebEngage · voice/SMS APIs"]
    ],
    whatIs: [
      "Exotel is a Bengaluru-founded cloud telephony and contact-centre company. It powers calls for some of India's biggest brands and offers a ready <strong>Business Phone System</strong> for smaller teams: virtual numbers, IVR, call recording, auto-dialer and live dashboards, paid through prepaid credits shared across calls, SMS and WhatsApp.",
      "On top of calling, Exotel has an AI layer: <strong>AI voice agents</strong> that handle routine calls (Exotel claims up to 75% containment), <strong>AI Assist</strong> that guides human agents during calls, and <strong>Conversation Quality Analysis</strong> that reviews every recorded call for quality and compliance."
    ],
    benefits: [
      { title: "Built for high call volume", body: "During admission season, hundreds of enquiry calls can arrive in a day. Exotel's infrastructure is built for that scale, with routing so no caller hears an endless ring." },
      { title: "AI answers routine questions", body: "An AI voice agent can answer repeat questions like batch timings, fees and address, and pass serious leads to a counsellor." },
      { title: "Coach your counsellors", body: "Conversation Quality Analysis checks every call, so a centre head can see which counsellors explain fees well and which miss follow-ups — without listening to hundreds of recordings." },
      { title: "Fits into your CRM", body: "With 150+ ready integrations and well-documented APIs, calls can log automatically in your CRM or student management system." },
      { title: "Number masking for privacy", body: "Students, parents and faculty can talk without seeing each other's personal numbers — useful for home tutors and mentor calls." },
      { title: "Try before you pay", body: "The 7-day free trial with 500 credits lets you test call flows with real calls before committing." }
    ],
    features: [
      "Virtual numbers (local and toll-free) with multi-level IVR",
      "Call recording, live dashboard, real-time analytics and auto-dialer",
      "AI voice agents and AI chat agents",
      "AI Assist (real-time guidance for agents) and Conversation Quality Analysis",
      "Number masking, SMS and WhatsApp on the same credits",
      "150+ integrations and voice/SMS APIs"
    ],
    howTo: {
      heading: "How a coaching institute can set up Exotel",
      steps: [
        "Start the 7-day free trial on exotel.com and complete KYC for your virtual number.",
        "Add counsellors as agents and build an IVR by course, exam or branch.",
        "Connect your CRM so every call creates a lead with its recording.",
        "Pick a plan by agent count: Dabbler for up to 3 counsellors, Believer for 6, Influencer for larger teams.",
        "Talk to Exotel's team about AI voice agents for after-hours and peak-season calls.",
        "Review call analytics weekly to spot missed calls and slow follow-ups."
      ]
    },
    pricing: {
      rows: [
        ["Free trial", "₹0 for 7 days", "500 free credits, fully functional"],
        ["Dabbler", "₹9,999 (5-month validity)", "1 virtual number, 3 agents, 5,000 credits, multi-level IVR"],
        ["Believer", "₹19,999 (11-month validity)", "2 virtual numbers, 6 agents, 9,500 credits"],
        ["Influencer", "₹49,499 (11-month validity)", "10 virtual numbers, unlimited agents, 39,000 credits"],
        ["Enterprise contact centre & AI agents", "Custom quote", "AI voice agents, AI Assist, Conversation Quality Analysis"]
      ],
      note: "Business Phone System prices from Exotel's pricing page; they include rental and credits and exclude GST. AI products are quoted separately."
    },
    limitations: [
      "Credit-based billing can be confusing — calls, SMS and WhatsApp all use the same credits.",
      "AI voice agents and call analysis are enterprise products with custom pricing.",
      "Some users report slow after-sales support and occasional call-quality issues.",
      "More than a small single-centre institute usually needs."
    ],
    verdict: "Exotel is the strongest pick for large institutes and edtech teams that need scale, deep CRM integration and enterprise AI. Smaller institutes will get a simpler, cheaper start elsewhere.",
    alternatives: ["myoperator", "tata-tele-smartflo", "knowlarity"],
    relatedLinks: [{ lead: "Comparing options?", text: "See our guide to the best AI business phone tools for coaching institutes", href: "best-ai-business-phone-virtual-number-coaching-institutes-india.html" }],
    faqs: [
      { q: "What is Exotel?", a: "Exotel is an Indian cloud communication company offering virtual numbers, IVR, contact-centre software, AI voice agents and communication APIs." },
      { q: "How much does Exotel cost?", a: "Exotel's Business Phone System starts at ₹9,999 for 5 months (Dabbler), with Believer at ₹19,999 and Influencer at ₹49,499 for 11 months. AI agents are priced on request." },
      { q: "Does Exotel have a free trial?", a: "Yes. Exotel offers a 7-day fully functional free trial with 500 credits." },
      { q: "Can Exotel's AI answer calls by itself?", a: "Yes. Exotel's AI voice agents can handle routine calls and transfer to a human agent when needed; Exotel says they can resolve up to 75% of calls." },
      { q: "Is Exotel good for small coaching institutes?", a: "It works, but it is built for scale. A small institute with one or two counsellors may find simpler tools such as TalkEasy easier and cheaper." }
    ],
    sources: [
      { label: "Exotel — Official website", url: "https://exotel.com/" },
      { label: "Exotel — Business phone system pricing", url: "https://exotel.com/pricing/business-phone-system/" },
      { label: "Prospeo — Exotel pricing, reviews, pros and cons", url: "https://prospeo.io/s/exotel-pricing-reviews-pros-and-cons" }
    ]
  },
  {
    slug: "knowlarity",
    name: "Knowlarity",
    audience: "institutes",
    group: "business-phone",
    lastChecked: "6 October 2026",
    lastCheckedIso: "2026-10-06",
    maker: "Knowlarity (a Gupshup company)",
    url: "https://www.knowlarity.com/",
    tagline: "Veteran Indian cloud telephony with IVR, voice bots, speech analytics and outbound calling to students and parents.",
    priceChip: "7-day free trial",
    metaTitle: "Knowlarity for Coaching Institutes: Virtual Number & AI",
    metaDescription: "How coaching institutes use Knowlarity: virtual numbers, IVR, voice bots, speech analytics, outbound calls to parents, free trial and ₹ pricing guide.",
    quickAnswer: "Knowlarity is a long-running Indian cloud telephony company, now part of Gupshup, used by 15,000+ organisations in 65 countries. Institutes use it for a virtual business number, IVR with regional-language greetings, call recording, missed-call solutions, automated outbound calls to students and parents, and AI speech analytics. There is a 7-day free trial; paid plans are quoted per agent (roughly ₹1,499–₹3,499 per agent per month) on yearly contracts.",
    facts: [
      ["Made by", "Knowlarity, acquired by Gupshup in 2022"],
      ["Best for", "Institutes with steady inbound calls and outbound calling to parents"],
      ["Price", "7-day free trial · about ₹1,499–₹3,499 per agent/month (yearly contract) · quote-based"],
      ["AI features", "Voice bots, AI speech recognition and analytics"],
      ["Languages", "Regional-language IVR greetings; AI language support on request"],
      ["Works with", "Web, mobile · CRM integration via API · SMS and WhatsApp through Gupshup"]
    ],
    whatIs: [
      "Knowlarity has offered cloud telephony in India for over a decade. Its products include virtual and toll-free numbers, IVR, call recording and tracking, click-to-call, missed-call services and hosted call-centre software. Its small-business number service is known as SuperReceptionist.",
      "Since <strong>Gupshup</strong> acquired it in 2022, Knowlarity sits alongside Gupshup's messaging platform, so voice, SMS and WhatsApp can come from one group. Its AI features include <strong>voice bots</strong> and <strong>speech recognition and analytics</strong> on recorded calls, and its education offering highlights automated outbound calls to students and parents."
    ],
    benefits: [
      { title: "Reach parents automatically", body: "Automated outbound calls can remind parents about fee dues, PTMs and exam dates, or run quick surveys — without counsellors dialling one by one." },
      { title: "Missed-call campaigns", body: "Put a missed-call number on posters and newspaper ads; every caller is captured as a lead and called back." },
      { title: "Local-language welcome", body: "Personalised IVR greetings can be recorded in the local language, so parents feel comfortable from the first second." },
      { title: "Insights from call recordings", body: "Speech analytics and keyword rules help spot which calls mention fees, scholarships or complaints, and push them into your CRM." },
      { title: "Proven at scale", body: "With 15,000+ organisations using it, the core calling system is mature and stable." }
    ],
    features: [
      "Virtual, local and toll-free numbers",
      "Multi-level IVR with personalised regional-language greetings",
      "Call recording, tracking and reports",
      "Missed-call and click-to-call solutions",
      "Automated outbound calling for students and parents",
      "Voice bots and AI speech analytics",
      "CRM integration through transcripts, keywords and APIs"
    ],
    howTo: {
      heading: "How a coaching institute can set up Knowlarity",
      steps: [
        "Start the 7-day free trial on knowlarity.com with your mobile number.",
        "Choose a local, toll-free or missed-call number for admissions.",
        "Record an IVR greeting in English plus your local language.",
        "Set up outbound call campaigns for fee and exam reminders to parents.",
        "Connect your CRM through Knowlarity's API so calls become leads.",
        "Ask about voice bots and speech analytics once call volumes grow."
      ]
    },
    pricing: {
      rows: [
        ["Free trial", "₹0 for 7 days", "Test a virtual number and IVR"],
        ["Cloud call-centre plans", "About ₹1,499–₹3,499 per agent per month", "Depending on features; yearly commitment, paid quarterly in advance"],
        ["Toll-free / prepaid number plans", "From about ₹16,800 per year", "Toll-free and prepaid number packages"],
        ["Voice bots & analytics", "Custom quote", "AI add-ons priced on request"]
      ],
      note: "Knowlarity does not publish a price list; figures above are from independent 2026 reviews and may change. Click-to-call outbound minutes may be charged extra."
    },
    limitations: [
      "No public price list, and contracts are usually yearly.",
      "Fewer ready-made CRM connectors than newer tools; integration often needs developer help.",
      "AI features are less advanced than AI-first tools.",
      "Some users mention slow support responses."
    ],
    verdict: "Knowlarity is a dependable, mature option for institutes that mainly need solid inbound numbers, missed-call campaigns and automated calls to parents. Institutes wanting the newest AI features should compare it with MyOperator, Exotel or TalkEasy.",
    alternatives: ["myoperator", "exotel", "talkeasy"],
    relatedLinks: [{ lead: "Comparing options?", text: "See our guide to the best AI business phone tools for coaching institutes", href: "best-ai-business-phone-virtual-number-coaching-institutes-india.html" }],
    faqs: [
      { q: "What is Knowlarity?", a: "Knowlarity is an Indian cloud telephony company, part of Gupshup since 2022, offering virtual numbers, IVR, call-centre software, voice bots and speech analytics." },
      { q: "Does Knowlarity have a free trial?", a: "Yes. Knowlarity offers a 7-day free trial that you can start with your mobile number." },
      { q: "How much does Knowlarity cost?", a: "Pricing is quote-based. Independent 2026 reviews report roughly ₹1,499–₹3,499 per agent per month on yearly contracts, with toll-free packages from about ₹16,800 a year." },
      { q: "How do institutes use Knowlarity?", a: "For admission enquiry numbers, missed-call campaigns, IVR in local languages, and automated outbound calls to students and parents for reminders and surveys." }
    ],
    sources: [
      { label: "Knowlarity — Official website", url: "https://www.knowlarity.com/" },
      { label: "Prospeo — Knowlarity pricing, reviews, pros and cons", url: "https://prospeo.io/s/knowlarity-pricing-reviews-pros-and-cons" },
      { label: "Business Wire — Gupshup acquires Knowlarity (2022)", url: "https://www.businesswire.com/news/home/20220202005136/pl" }
    ]
  },
  {
    slug: "talkeasy",
    name: "TalkEasy",
    shortName: "TalkEasy",
    audience: "institutes",
    group: "business-phone",
    lastChecked: "6 October 2026",
    lastCheckedIso: "2026-10-06",
    maker: "GrowEasy",
    url: "https://talk.groweasy.ai/",
    tagline: "AI-first business phone at ₹999/month: virtual number, AI call answering, summaries, built-in CRM and unlimited team members.",
    priceChip: "₹999/month + GST",
    metaTitle: "TalkEasy for Coaching Institutes: AI Business Phone ₹999",
    metaDescription: "How coaching institutes use TalkEasy by GrowEasy: virtual number, 24/7 AI call answering, AI call summaries, built-in CRM, Zoho integration and ₹999 pricing.",
    quickAnswer: "TalkEasy, by GrowEasy, is an AI-first business phone for Indian businesses, used by 2,500+ businesses. It gives an institute a virtual business number, AI that answers calls 24/7 and collects the caller's details, automatic call recording and AI summaries, missed-call follow-ups, IVR, WhatsApp, multi-language support and its own built-in CRM, with integrations such as Zoho CRM and LeadSquared. The Pro plan is ₹999 + GST a month with 3 hours of talk time a day and unlimited team members.",
    facts: [
      ["Made by", "GrowEasy, India"],
      ["Best for", "Small and growing institutes that want AI call handling at a low, fixed price"],
      ["Price", "Pro ₹999/month + GST (3 hrs talk time/day, extra ₹49/hr) · Enterprise custom"],
      ["AI features", "24/7 AI call answering, AI call summaries and insights, missed-call automation"],
      ["Languages", "Multiple Indian languages"],
      ["Works with", "Web, Android, iPhone · built-in CRM · Zoho CRM, LeadSquared, HubSpot, Salesforce, Freshsales and more"]
    ],
    whatIs: [
      "TalkEasy is the business-calling product from GrowEasy, an Indian company that builds AI marketing and sales tools for small businesses. It is designed to be set up in minutes: you get a professional business number that works on your team's phones and on the web, with no hardware.",
      "What makes it different is that it is <strong>AI-first and simply priced</strong>. AI answers calls when nobody is free, every call is recorded and summarised automatically, missed calls trigger follow-ups, and leads land in TalkEasy's <strong>own CRM</strong> or in tools like <strong>Zoho CRM</strong> and LeadSquared. It also supports IVR, WhatsApp and multiple Indian languages — all on a ₹999-a-month plan with unlimited users."
    ],
    benefits: [
      { title: "No more lost admission calls", body: "When counsellors are busy or the centre is closed, TalkEasy's AI answers the call, captures the student's name, course and city, and the missed-call automation makes sure a callback happens." },
      { title: "Know what every call was about", body: "AI call summaries tell the centre head what a parent asked and what was promised — without listening to recordings. TalkEasy's customers report saving 10+ hours a week on call reviews." },
      { title: "Affordable for single-centre institutes", body: "At ₹999 + GST a month with unlimited team members, a small institute can give every counsellor and faculty member the same professional number." },
      { title: "Leads stay with the institute", body: "Calls run through the institute's number and land in the built-in CRM, so a counsellor leaving doesn't take your enquiries with them." },
      { title: "Works with your existing CRM", body: "Already on Zoho CRM or LeadSquared? TalkEasy connects to them, so calls and summaries sync to the lead record." },
      { title: "Set up in minutes", body: "No hardware or long onboarding — TalkEasy says setup takes under 2 minutes, which suits owners who run the institute themselves." }
    ],
    features: [
      "Virtual business number on Android, iPhone and web",
      "24/7 AI call answering that collects caller details",
      "Automatic call recording, AI call summaries and insights",
      "Missed-call automation: callbacks, notifications and follow-ups",
      "IVR, WhatsApp and multi-language support",
      "Built-in CRM and shared business inbox",
      "Integrations: Zoho CRM, LeadSquared, HubSpot, Salesforce, Freshsales, Telecrm, Kylas, Neodove",
      "Unlimited team members with a central analytics dashboard"
    ],
    howTo: {
      heading: "How a coaching institute can set up TalkEasy",
      steps: [
        "Sign up at talk.groweasy.ai and pick a business number for admissions.",
        "Install the TalkEasy app on each counsellor's phone and add them to your team.",
        "Set an IVR menu and the AI answering script: courses, batch timings, fee range and centre address.",
        "Turn on missed-call automation so every missed enquiry gets a callback or message.",
        "Use the built-in CRM, or connect Zoho CRM or LeadSquared, so every call becomes a lead.",
        "Read AI call summaries each evening to check follow-ups and coach your team."
      ]
    },
    pricing: {
      rows: [
        ["Pro", "₹999/month + GST", "3 hours talk time per day, unlimited users and contacts, AI call assist, recording, analytics, team management"],
        ["Extra talk time", "₹49/hour + GST", "Beyond the daily 3 hours"],
        ["Enterprise", "Custom quote", "Unlimited talk time, customisation and CRM integrations"]
      ],
      note: "Prices are from TalkEasy's official website and exclude GST."
    },
    limitations: [
      "A newer product than MyOperator, Exotel or Knowlarity, with fewer independent reviews so far.",
      "The Pro plan's 3 hours of talk time a day may not be enough for a large counselling team in peak season; extra hours or Enterprise cost more.",
      "Very large institutes needing contact-centre features like skill-based routing may prefer an enterprise platform."
    ],
    verdict: "TalkEasy is the best-value AI business phone for small and growing coaching institutes: the core AI features institutes need — answering, summaries, missed-call follow-up and a CRM — at a fixed ₹999 a month with unlimited users. Large multi-branch chains should compare it with MyOperator and Exotel.",
    alternatives: ["myoperator", "knowlarity", "interakt"],
    relatedLinks: [
      { lead: "Want the full picture?", text: "Read our in-depth TalkEasy review", href: "review-talkeasy.html" },
      { lead: "Comparing options?", text: "See our guide to the best AI business phone tools for coaching institutes", href: "best-ai-business-phone-virtual-number-coaching-institutes-india.html" }
    ],
    faqs: [
      { q: "What is TalkEasy?", a: "TalkEasy is an AI business phone by GrowEasy that gives businesses a virtual number, 24/7 AI call answering, call recording, AI summaries, missed-call automation and a built-in CRM." },
      { q: "How much does TalkEasy cost?", a: "The Pro plan is ₹999 + GST a month with 3 hours of talk time a day and unlimited team members. Extra talk time is ₹49 + GST an hour, and Enterprise pricing is custom." },
      { q: "Does TalkEasy have a CRM?", a: "Yes. TalkEasy has its own built-in CRM and also integrates with Zoho CRM, LeadSquared, HubSpot, Salesforce, Freshsales and others." },
      { q: "Does TalkEasy support IVR and WhatsApp?", a: "Yes. TalkEasy supports IVR, WhatsApp and multiple Indian languages." },
      { q: "Is TalkEasy good for coaching institutes?", a: "Yes, especially for small and growing institutes. It answers enquiry calls with AI, summarises every call and follows up on missed calls at a fixed low monthly price." }
    ],
    sources: [
      { label: "TalkEasy — Official website", url: "https://talk.groweasy.ai/" },
      { label: "OffBuddy — Best AI business phone systems in India (2026)", url: "https://www.offbuddy.com/blog/best-ai-business-phone-india/" }
    ]
  },
  {
    slug: "tata-tele-smartflo",
    name: "Tata Tele Smartflo",
    shortName: "Smartflo",
    audience: "institutes",
    group: "business-phone",
    lastChecked: "6 October 2026",
    lastCheckedIso: "2026-10-06",
    maker: "Tata Tele Business Services",
    url: "https://www.tatatelebusiness.com/features/smartflo-call-center-solutions/",
    tagline: "Tata-backed cloud calling and contact centre with Smartflo AI voice bots for admissions and student support.",
    priceChip: "Quote-based",
    metaTitle: "Tata Tele Smartflo for Institutes: AI Voice Bot & Calling",
    metaDescription: "How coaching institutes and colleges use Tata Tele Smartflo: virtual numbers, IVR, AI voice bot for admissions, WhatsApp, CRM integration and pricing.",
    quickAnswer: "Smartflo is the cloud communication platform from Tata Tele Business Services (TTBS), part of the Tata group. It gives institutes virtual numbers, multi-level IVR, intelligent call routing, call recording and a full cloud contact centre, plus Smartflo AI voice bots that answer admission enquiries 24/7, qualify leads and work alongside WhatsApp. TTBS has published case studies with colleges, edtechs and training institutes. Pricing is quote-based; contact-centre licences are listed from about ₹950 per user per month.",
    facts: [
      ["Made by", "Tata Tele Business Services (Tata group)"],
      ["Best for", "Multi-campus institutes, colleges and edtechs wanting a telecom-grade provider"],
      ["Price", "Quote-based · contact-centre licences from about ₹950–₹1,250/user/month"],
      ["AI features", "Smartflo AI voice bot, lead qualification, intelligent routing"],
      ["Languages", "Multilingual support for regional engagement"],
      ["Works with", "Web, desktop, Android, iPhone · CRM integration · WhatsApp"]
    ],
    whatIs: [
      "Smartflo is the cloud telephony and contact-centre suite of <strong>Tata Tele Business Services</strong>, the business arm of Tata Teleservices. Because TTBS is itself a licensed telecom operator, the numbers, network and calling all come from one provider.",
      "For education, TTBS promotes <strong>Smartflo AI</strong>: voice bots that respond to admission enquiries 24/7, guide applicants on courses and eligibility, send fee and exam reminders, and route serious callers to counsellors with their history. TTBS has published education case studies, including an institution that improved enrolments with the Smartflo AI voice bot and a Pune higher-education institute that built a student helpline."
    ],
    benefits: [
      { title: "Telecom-grade reliability", body: "Numbers and network come from a Tata group telecom operator, which matters to large institutes for whom a calling outage in admission season is costly." },
      { title: "AI voice bot for admissions", body: "Smartflo AI answers enquiries instantly, qualifies leads and books counselling appointments, so peak-season call spikes don't overwhelm staff." },
      { title: "Right counsellor, first time", body: "Intelligent call routing sends callers to the right campus, course team or counsellor based on skills or priority, with past interaction history." },
      { title: "Full contact centre for big teams", body: "Live call monitoring, supervisor dashboards and remote agents let a central admissions team work from anywhere." },
      { title: "Across the student lifecycle", body: "Beyond admissions, the same system can handle fee reminders, exam notifications, placement updates and alumni outreach." }
    ],
    features: [
      "Virtual and toll-free numbers with multi-level IVR",
      "Intelligent, skill-based call routing",
      "Call recording, live monitoring and real-time analytics",
      "Smartflo AI voice bot for 24/7 enquiries and lead qualification",
      "Omnichannel: voice, WhatsApp, email and chat",
      "CRM integration and remote agent access"
    ],
    howTo: {
      heading: "How an institute can set up Tata Tele Smartflo",
      steps: [
        "Request a demo and quote from Tata Tele Business Services.",
        "Choose numbers and agent licences for your admissions and support teams.",
        "Design IVR and routing by campus, programme and language.",
        "Integrate Smartflo with your CRM or student information system.",
        "Add the Smartflo AI voice bot for after-hours and peak-season enquiries.",
        "Use dashboards and call recordings to train counsellors."
      ]
    },
    pricing: {
      rows: [
        ["Contact-centre agent licences", "About ₹950–₹1,250 per user per month", "As listed on TTBS's call-centre page, plus platform fees for larger setups"],
        ["Smartflo AI voice bot", "Custom quote", "AI voice bot, lead qualification and automation"],
        ["Business numbers and IVR", "Quote-based", "Virtual and toll-free numbers"]
      ],
      note: "TTBS does not publish a complete price list; ask for a quote that includes numbers, licences, minutes and AI."
    },
    limitations: [
      "No self-serve sign-up or published small-business price; you go through a sales process.",
      "Built for medium and large organisations — heavy for a single small centre.",
      "AI features and languages need to be confirmed in a demo."
    ],
    verdict: "Smartflo suits multi-campus institutes, colleges and edtechs that value a Tata-group telecom provider and want an AI voice bot plus a full contact centre. Small institutes will find TalkEasy or MyOperator faster to start.",
    alternatives: ["exotel", "myoperator", "knowlarity"],
    relatedLinks: [{ lead: "Comparing options?", text: "See our guide to the best AI business phone tools for coaching institutes", href: "best-ai-business-phone-virtual-number-coaching-institutes-india.html" }],
    faqs: [
      { q: "What is Tata Tele Smartflo?", a: "Smartflo is the cloud telephony and contact-centre platform of Tata Tele Business Services, with virtual numbers, IVR, call routing, analytics and Smartflo AI voice bots." },
      { q: "Does Smartflo have an AI voice bot for education?", a: "Yes. Tata Tele Business Services offers the Smartflo AI voice bot for admission enquiries and student support, and has published education case studies." },
      { q: "How much does Smartflo cost?", a: "Pricing is quote-based. TTBS lists contact-centre agent licences from about ₹950–₹1,250 per user per month; AI voice bots are priced on request." },
      { q: "Is Smartflo suitable for small coaching institutes?", a: "It can work, but it is designed for medium and large organisations. Small institutes usually start faster with simpler tools like TalkEasy." }
    ],
    sources: [
      { label: "TTBS — Smartflo call centre solutions", url: "https://www.tatatelebusiness.com/features/smartflo-call-center-solutions/" },
      { label: "TTBS — Educational institution improves enrolments with Smartflo AI voice bot", url: "https://www.tatatelebusiness.com/case-studies/educational-institution-improves-enrolments-with-smartflo-ai-voice-bot/" },
      { label: "TTBS — The intelligent campus: Smartflo AI in education", url: "https://www.tatatelebusiness.com/articles/intelligent-campus-smartflo-ai-student-engagement/" }
    ]
  }
];
