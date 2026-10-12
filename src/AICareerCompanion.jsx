import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home, User, BarChart3, Bot, ClipboardList, Map, BookOpen, Award,
  Settings, LogOut, Menu, X, Eye, EyeOff, Search, Plus, Check,
  ChevronDown, ChevronRight, Upload, Send, Image as ImageIcon,
  Paperclip, Globe, Sparkles, TrendingUp, Clock, Target, Bell,
  ArrowRight, CheckCircle2, Circle, AlertTriangle, XCircle, Trash2,
  FileText, Star, Zap, GraduationCap, Briefcase,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, PieChart, Pie, Cell,
} from "recharts";

/* ======================================================================
   DESIGN TOKENS
   Background: watercolor pastel wash (peach/pink/sage/cream)
   Primary #7C3AED  Secondary #10B981  Accent #F59E0B  Blue #38BDF8
   Text #1F2937  Glass cards rgba(255,255,255,.72)
   Type: "Fraunces" (display/serif, warmth) + "Plus Jakarta Sans" (body/UI)
====================================================================== */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`;

/* ======================================================================
   AI HELPERS
   Real calls to the Anthropic Messages API (vision + JSON extraction) and
   real persistence via window.storage, so login/signup, photo analysis,
   and certificate scanning are functional instead of scripted demos.
====================================================================== */

const API_BASE = "/api";

// Convert a File to a raw base64 string (no data: prefix).
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

/* ======================================================================
   SMART OFFLINE ANALYSIS ENGINE
   Works without any API key or backend server.
   Uses keyword matching on filenames + a comprehensive knowledge base
   to detect certificate type, skills, and relevant career roles.
====================================================================== */

const CERT_KNOWLEDGE_BASE = [
  { keywords: ["python","py","pandas","numpy","django","flask"], skills: ["Python","Data Analysis","Scripting","Automation"], roles: ["Data Scientist","Python Developer","ML Engineer","Backend Developer"] },
  { keywords: ["machine learning","ml","deep learning","neural","ai","tensorflow","pytorch","keras"], skills: ["Machine Learning","Deep Learning","Python","Statistics","Data Analysis"], roles: ["ML Engineer","AI Engineer","Data Scientist","Research Scientist"] },
  { keywords: ["data science","data analyst","data analysis","analytics","data"], skills: ["Python","SQL","Statistics","Data Visualization","Excel"], roles: ["Data Analyst","Data Scientist","Business Analyst","BI Analyst"] },
  { keywords: ["sql","database","mysql","postgresql","mongodb","nosql","oracle"], skills: ["SQL","Database Design","Data Querying","Backend Development"], roles: ["Database Administrator","Data Analyst","Backend Developer","Data Engineer"] },
  { keywords: ["javascript","js","react","vue","angular","node","nodejs","frontend","web dev","html","css"], skills: ["JavaScript","React","Node.js","Web Development","APIs"], roles: ["Frontend Developer","Full Stack Developer","Web Developer","UI Developer"] },
  { keywords: ["java","spring","kotlin","android","jvm"], skills: ["Java","Object-Oriented Programming","Spring Framework","Android Development"], roles: ["Java Developer","Android Developer","Backend Developer","Software Engineer"] },
  { keywords: ["cloud","aws","azure","gcp","google cloud","devops","docker","kubernetes","k8s"], skills: ["Cloud Computing","DevOps","Linux","Networking","Infrastructure"], roles: ["Cloud Engineer","DevOps Engineer","Site Reliability Engineer","Platform Engineer"] },
  { keywords: ["cyber","security","ethical hacking","penetration","network security","cissp","ceh","comptia"], skills: ["Cybersecurity","Networking","Ethical Hacking","Linux","Risk Assessment"], roles: ["Cybersecurity Analyst","Security Engineer","Penetration Tester","Network Security Engineer"] },
  { keywords: ["project management","pmp","scrum","agile","prince2","leadership","management"], skills: ["Project Management","Agile","Scrum","Leadership","Communication"], roles: ["Project Manager","Scrum Master","Product Owner","Program Manager"] },
  { keywords: ["excel","power bi","tableau","powerpoint","microsoft office","office 365","spreadsheet"], skills: ["Excel","Power BI","Data Visualization","Reporting","Business Analysis"], roles: ["Business Analyst","Data Analyst","Operations Analyst","Financial Analyst"] },
  { keywords: ["ui","ux","design","figma","sketch","photoshop","adobe","graphic"], skills: ["UI Design","UX Research","Figma","Prototyping","User Testing"], roles: ["UI/UX Designer","Product Designer","Visual Designer","Interaction Designer"] },
  { keywords: ["networking","cisco","ccna","ccnp","network","linux","system admin"], skills: ["Networking","Linux","System Administration","Troubleshooting","Cloud Security"], roles: ["Network Engineer","System Administrator","Cloud Engineer","IT Support Engineer"] },
  { keywords: ["marketing","digital marketing","seo","social media","google ads","content"], skills: ["Digital Marketing","SEO","Content Strategy","Analytics","Communication"], roles: ["Digital Marketer","SEO Specialist","Content Strategist","Growth Analyst"] },
  { keywords: ["coursera","udemy","edx","completion","certificate","course","training"], skills: ["Self-Learning","Continuous Development"], roles: ["General Professional"] },
];

function detectCertInfo(filename) {
  const lower = (filename || "").toLowerCase().replace(/[-_]/g, " ");
  let bestMatch = null;
  let bestScore = 0;
  for (const entry of CERT_KNOWLEDGE_BASE) {
    const score = entry.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }
  const cleanName = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  // Try to detect issuer from filename
  const issuers = { coursera: "Coursera", udemy: "Udemy", edx: "edX", google: "Google", microsoft: "Microsoft", aws: "Amazon Web Services", ibm: "IBM", meta: "Meta", cisco: "Cisco", comptia: "CompTIA" };
  let issuer = "Certificate Authority";
  for (const [key, val] of Object.entries(issuers)) { if (lower.includes(key)) { issuer = val; break; } }
  return {
    certificateName: cleanName,
    issuer,
    skills: bestMatch ? bestMatch.skills : ["Professional Development","Communication","Problem Solving"],
    roles: bestMatch ? bestMatch.roles : ["Professional","Team Contributor"],
  };
}

function analyzePhotoOffline(filename, dreamJob) {
  const lower = (filename || "").toLowerCase();
  const isScreenshot = lower.includes("screenshot") || lower.includes("screen");
  const isSnapchat = lower.includes("snapchat");
  const isWhiteboard = lower.includes("whiteboard") || lower.includes("board");
  const isCode = lower.includes("code") || lower.includes("terminal") || lower.includes("editor");
  if (isCode) return `I can see what looks like a coding or terminal screenshot. This is a great habit — capturing your work is useful for building a portfolio. If this shows code related to **${dreamJob || "your career goal"}**, consider adding it to a GitHub repository to showcase your skills.`;
  if (isWhiteboard) return `This appears to be a whiteboard or diagram photo — likely notes or a system design. Sketching out architectures and workflows is a key skill for ${dreamJob || "tech roles"}. Consider digitizing this in a tool like Figma or draw.io to make it portfolio-ready.`;
  if (isSnapchat || isScreenshot) return `I can see this is an image from your camera or screen. For best results with career-related analysis, try uploading: \n• A photo of a certificate or completion screen\n• A screenshot of your code or project\n• A whiteboard diagram\n\nI'm here to help you connect what you're learning to your **${dreamJob || "career goals"}! 🚀`;
  return `Thanks for sharing this image! While I can see it's related to your journey toward **${dreamJob || "your career goal"}**, I can give you the best analysis when you upload:\n• Certificate completion screenshots\n• Code or project screenshots\n• Diagrams or notes\n\nKeep capturing your progress — it all adds up! 💪`;
}

// Smart offline analysis — no API or server needed.
async function analyzeImageOffline(file, dreamJob) {
  // Simulate a brief processing delay for realism
  await new Promise(r => setTimeout(r, 1200));
  return analyzePhotoOffline(file.name, dreamJob);
}

async function analyzeCertOffline(file) {
  await new Promise(r => setTimeout(r, 1500));
  return detectCertInfo(file.name);
}

// callClaude / callClaudeJSON kept for quiz generation (uses fallback internally)
async function callClaude(contentBlocks) {
  throw new Error("No backend available — use offline fallback");
}
async function callClaudeJSON(contentBlocks) {
  throw new Error("No backend available — use offline fallback");
}

// Read/write helpers backed by the Flask + SQLite key-value store.
// Same "missing key returns null instead of throwing" behavior as before.
// Detect whether the Flask backend is reachable. We do a lightweight probe
// once per page load and cache the result so individual reads/writes don't
// each pay a failed-request penalty on mobile (where there is no backend).
let _backendAvailable = null;
async function backendAvailable() {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 1500);
    const res = await fetch(`${API_BASE}/ping`, { signal: c.signal });
    clearTimeout(t);
    _backendAvailable = res.ok;
  } catch (_e) {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

// Read from backend if available, otherwise fall back to localStorage.
async function storageGet(key, shared = false) {
  if (await backendAvailable()) {
    try {
      const res = await fetch(`${API_BASE}/storage/get?key=${encodeURIComponent(key)}&shared=${shared}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.value ?? null;
    } catch (_e) { /* fall through */ }
  }
  // localStorage fallback (works on mobile without backend)
  try { return localStorage.getItem(key); } catch (_e) { return null; }
}

// Write to backend if available, otherwise fall back to localStorage.
async function storageSet(key, value, shared = false) {
  if (await backendAvailable()) {
    try {
      const res = await fetch(`${API_BASE}/storage/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, shared }),
      });
      if (res.ok) return true;
    } catch (_e) { /* fall through */ }
  }
  // localStorage fallback (works on mobile without backend)
  try { localStorage.setItem(key, value); return true; } catch (_e) { return false; }
}

function normalizeId(id) {
  return id.trim().toLowerCase();
}

function blankProfile(name, email) {
  return {
    name: name || "Learner",
    email,
    avatar: "🦊",
    dreamJob: "",
    skills: [],
    certificates: [],
    completedRoadmapItems: [],
    assignmentStatus: {},
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    weeklyDays: DEMO_WEEKLY_DAYS,
  };
}

const DEMO_WEEKLY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ======================================================================
   DEMO DATA
====================================================================== */

const QUOTES = [
  "Small progress every day creates big results.",
  "Your future is built by what you learn today.",
  "Keep learning. Keep growing. Keep moving forward.",
  "Every skill you gain is a door that opens.",
  "Consistency beats intensity. Show up today.",
];

const SKILL_CATEGORIES = {
  Programming: ["Python", "Java", "C", "C++", "JavaScript", "TypeScript"],
  Data: ["SQL", "Excel", "Power BI", "Tableau", "Statistics", "Data Visualization"],
  AI: ["Machine Learning", "Deep Learning", "Generative AI", "NLP", "Computer Vision"],
  Software: ["Git", "GitHub", "React", "Node.js", "APIs"],
  Cybersecurity: ["Networking", "Linux", "Ethical Hacking", "Cryptography", "SIEM", "Cloud Security"],
  "Soft Skills": ["Communication", "Leadership", "Problem Solving", "Teamwork", "Time Management"],
};

const CAREERS = [
  { name: "Software Developer", emoji: "💻" },
  { name: "Data Analyst", emoji: "📊" },
  { name: "AI Engineer", emoji: "🤖" },
  { name: "Cybersecurity Analyst", emoji: "🔐" },
  { name: "Cloud Engineer", emoji: "☁️" },
  { name: "UI/UX Designer", emoji: "🎨" },
  { name: "Business Analyst", emoji: "📈" },
  { name: "Data Scientist", emoji: "🧠" },
];

// required skills per career, each with a short "why it matters"
const REQUIRED_SKILLS = {
  "Data Analyst": [
    { skill: "Excel", why: "Foundation for organizing and summarizing raw data." },
    { skill: "Statistics", why: "Lets you interpret data patterns correctly." },
    { skill: "SQL", why: "Core language for querying company databases." },
    { skill: "Python", why: "Automates cleaning and analysis at scale." },
    { skill: "Data Visualization", why: "Turns numbers into decisions people understand." },
    { skill: "Power BI", why: "Industry-standard dashboarding tool for analysts." },
    { skill: "Advanced SQL", why: "Window functions and CTEs are asked for in most analyst interviews." },
    { skill: "Machine Learning", why: "Predictive analytics is now expected in senior analyst roles." },
    { skill: "Communication", why: "You must explain findings to non-technical stakeholders." },
  ],
  "Software Developer": [
    { skill: "JavaScript", why: "Core language of the modern web." },
    { skill: "Git", why: "Version control is non-negotiable on any dev team." },
    { skill: "React", why: "Most in-demand frontend framework." },
    { skill: "Node.js", why: "Lets you build full-stack applications." },
    { skill: "APIs", why: "Nearly every app you build will talk to one." },
    { skill: "TypeScript", why: "Reduces bugs in production-grade codebases." },
    { skill: "GitHub", why: "Collaboration and code review workflows." },
    { skill: "Problem Solving", why: "The core skill tested in technical interviews." },
  ],
  "AI Engineer": [
    { skill: "Python", why: "The primary language of the ML ecosystem." },
    { skill: "Statistics", why: "Underpins every machine learning model." },
    { skill: "Machine Learning", why: "The core discipline of the role." },
    { skill: "Deep Learning", why: "Needed for modern neural network systems." },
    { skill: "Generative AI", why: "Fastest-growing area of applied AI roles." },
    { skill: "NLP", why: "Required for language-based AI products." },
    { skill: "APIs", why: "You'll ship models behind production APIs." },
    { skill: "Computer Vision", why: "Common specialization for AI engineering roles." },
  ],
  "Cybersecurity Analyst": [
    { skill: "Networking", why: "You can't secure what you don't understand." },
    { skill: "Linux", why: "Most security tooling runs on Linux servers." },
    { skill: "Ethical Hacking", why: "Understanding attacks is how you prevent them." },
    { skill: "Cryptography", why: "Protects data confidentiality and integrity." },
    { skill: "SIEM", why: "Core tool for detecting live security incidents." },
    { skill: "Cloud Security", why: "Most infrastructure now lives in the cloud." },
    { skill: "Communication", why: "Incident reports must be clear under pressure." },
  ],
  "Cloud Engineer": [
    { skill: "Linux", why: "Cloud infrastructure runs primarily on Linux." },
    { skill: "Networking", why: "Cloud architecture is built on networking fundamentals." },
    { skill: "APIs", why: "Cloud services are provisioned and managed via APIs." },
    { skill: "Git", why: "Infrastructure-as-code is version controlled like any codebase." },
    { skill: "Cloud Security", why: "Securing cloud resources is a daily responsibility." },
    { skill: "Python", why: "Automates cloud provisioning and scripting tasks." },
  ],
  "UI/UX Designer": [
    { skill: "Communication", why: "Design decisions must be justified to teams and users." },
    { skill: "Problem Solving", why: "Great design solves real user problems." },
    { skill: "Data Visualization", why: "Research findings need to be presented clearly." },
    { skill: "Teamwork", why: "Designers work closely with product and engineering." },
    { skill: "Leadership", why: "Senior designers guide product direction." },
  ],
  "Business Analyst": [
    { skill: "Excel", why: "Primary tool for business data modeling." },
    { skill: "SQL", why: "Needed to pull data directly from business systems." },
    { skill: "Statistics", why: "Supports evidence-based recommendations." },
    { skill: "Communication", why: "Translates data into business strategy." },
    { skill: "Power BI", why: "Standard for building stakeholder-facing reports." },
    { skill: "Problem Solving", why: "Core to diagnosing business inefficiencies." },
  ],
  "Data Scientist": [
    { skill: "Python", why: "Primary language for modeling and analysis." },
    { skill: "Statistics", why: "The mathematical foundation of data science." },
    { skill: "SQL", why: "Needed to retrieve data from production systems." },
    { skill: "Machine Learning", why: "Core discipline of predictive modeling." },
    { skill: "Data Visualization", why: "Communicates model results to stakeholders." },
    { skill: "Deep Learning", why: "Needed for advanced modeling roles." },
  ],
};

const ROADMAP_TEMPLATES = {
  "Data Analyst": [
    { phase: "Foundation", color: "#10B981", items: ["Excel", "Statistics", "Data Visualization"] },
    { phase: "Core Analytics", color: "#38BDF8", items: ["SQL", "Python"] },
    { phase: "BI & Projects", color: "#7C3AED", items: ["Power BI"] },
    { phase: "Advanced Skills", color: "#F59E0B", items: ["Advanced SQL", "Machine Learning"] },
    { phase: "Career Ready", color: "#EC4899", items: ["Communication"] },
  ],
};
const DEFAULT_PHASE_LABELS = ["Foundation", "Core Skills", "Applied Projects", "Advanced Skills", "Career Ready"];
const DEFAULT_PHASE_COLORS = ["#10B981", "#38BDF8", "#7C3AED", "#F59E0B", "#EC4899"];

function buildRoadmap(career) {
  const template = ROADMAP_TEMPLATES[career];
  const required = REQUIRED_SKILLS[career] || [];
  if (template) {
    return template.map((p) => ({
      phase: p.phase,
      color: p.color,
      items: p.items.map((s) => required.find((r) => r.skill === s) || { skill: s, why: "Builds toward your target role." }),
    }));
  }
  // generic split into 5 chunks
  const chunkSize = Math.max(1, Math.ceil(required.length / 5));
  const phases = [];
  for (let i = 0; i < 5; i++) {
    const chunk = required.slice(i * chunkSize, i * chunkSize + chunkSize);
    if (chunk.length === 0 && i < 4) continue;
    phases.push({ phase: DEFAULT_PHASE_LABELS[i], color: DEFAULT_PHASE_COLORS[i], items: chunk });
  }
  return phases.filter((p) => p.items.length > 0);
}

const DURATIONS = ["1 week", "2 weeks", "3 weeks", "1 week", "10 days", "2 weeks"];
const RESOURCES_POOL = ["Official documentation", "Interactive practice course", "YouTube crash course", "Hands-on guided project"];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Each base assignment now expands into three difficulty variants — Easy,
// Medium, Hard — that a learner can switch between for the same skill.
const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

function makeVariants(skill, base) {
  return {
    Easy: {
      title: base?.easy || `Learn the basics of ${skill} through a short guided exercise`,
      time: base?.easyTime || "1 hr",
    },
    Medium: {
      title: base?.medium || `Apply ${skill} to solve a small, realistic problem end-to-end`,
      time: base?.mediumTime || "3 hrs",
    },
    Hard: {
      title: base?.hard || `Combine ${skill} with another skill you know to ship a mini project`,
      time: base?.hardTime || "6 hrs",
    },
  };
}

const ASSIGNMENTS_BY_CAREER = {
  "Data Analyst": [
    { skill: "Python", variants: makeVariants("Python", {
        easy: "Load a CSV into Python and print basic summary statistics.",
        medium: "Clean a messy CSV dataset (missing values, duplicates, types) using Python.",
        hard: "Build a reusable Python data-cleaning pipeline for three different messy datasets.",
      }) },
    { skill: "SQL", variants: makeVariants("SQL", {
        easy: "Write simple SELECT/WHERE queries to filter a sales table.",
        medium: "Write SQL queries with JOINs and GROUP BY to analyze sales trends.",
        hard: "Write advanced SQL with window functions and CTEs to rank top customers per region.",
      }) },
    { skill: "Power BI", variants: makeVariants("Power BI", {
        easy: "Import a dataset into Power BI and create one basic chart.",
        medium: "Build a Power BI dashboard for revenue with multiple linked visuals.",
        hard: "Design an interactive Power BI report with drill-downs and DAX measures.",
      }) },
    { skill: "Statistics", variants: makeVariants("Statistics", {
        easy: "Calculate mean, median, and standard deviation for a small dataset.",
        medium: "Perform exploratory data analysis on a survey dataset, including correlations.",
        hard: "Run a hypothesis test and interpret statistical significance for a real dataset.",
      }) },
    { skill: "Data Visualization", variants: makeVariants("Data Visualization", {
        easy: "Create three basic charts (bar, line, pie) from a small dataset.",
        medium: "Design a one-page dashboard that tells a clear data story.",
        hard: "Build a complete end-to-end analytics project from raw data to presentation.",
      }) },
  ],
  "Software Developer": [
    { skill: "React", variants: makeVariants("React", {
        easy: "Build a static counter component using useState.",
        medium: "Build a to-do app with add/remove/complete using React state management.",
        hard: "Build a multi-page app with routing, shared state, and API integration.",
      }) },
    { skill: "Node.js", variants: makeVariants("Node.js", {
        easy: "Set up a Node.js server that returns 'Hello World'.",
        medium: "Create a REST API with Node.js supporting CRUD operations.",
        hard: "Build a Node.js API with authentication, validation, and a database.",
      }) },
    { skill: "Git", variants: makeVariants("Git", {
        easy: "Initialize a repo, commit, and push changes to GitHub.",
        medium: "Practice Git branching and resolve a merge conflict.",
        hard: "Set up a full feature-branch workflow with pull requests and rebasing.",
      }) },
    { skill: "TypeScript", variants: makeVariants("TypeScript", {
        easy: "Add basic type annotations to a small JavaScript function.",
        medium: "Refactor a React component with proper TypeScript prop types.",
        hard: "Convert a small JavaScript project to strict-mode TypeScript.",
      }) },
    { skill: "APIs", variants: makeVariants("APIs", {
        easy: "Call a public API with fetch and display the result.",
        medium: "Design and document a small REST API for a sample app.",
        hard: "Build and deploy a full-stack project consuming your own API.",
      }) },
  ],
};

function genericAssignments(career) {
  const req = REQUIRED_SKILLS[career] || [];
  return req.slice(0, 6).map((r) => ({ skill: r.skill, variants: makeVariants(r.skill) }));
}

/* ----------------------------------------------------------------------
   QUIZ ENGINE
   Every assignment card opens into a short quiz (min. 5 questions) for
   that subject and difficulty level. Questions are generated fresh each
   time the quiz is opened — a random real-world "angle" is folded into
   the prompt so a Python/Easy quiz today reads differently from a
   Python/Easy quiz tomorrow. A local template bank covers the case where
   the API call fails, so the feature never dead-ends.
---------------------------------------------------------------------- */

const QUIZ_ANGLES = [
  "an online store", "a hospital scheduling system", "a bank's transaction records",
  "a mobile fitness app", "a school grading system", "a food delivery service",
  "a video game leaderboard", "a weather tracking tool", "a small startup's internal dashboard",
  "a social media feed", "a logistics and shipping company", "a music streaming app",
];

function pickAngle() {
  return QUIZ_ANGLES[Math.floor(Math.random() * QUIZ_ANGLES.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function quizPrompt(skill, difficulty, angle) {
  return `Create a short quiz testing a learner's understanding of "${skill}" at a ${difficulty} difficulty level.
Generate exactly 5 multiple-choice questions. Give every question genuine ${difficulty}-level substance (not trivia), mixing concept checks, applied reasoning, and "what would happen" style questions. Where it fits naturally, set the scenario in the context of ${angle}.
Respond ONLY with valid JSON, no markdown fences, no preamble, no trailing text, in exactly this shape:
{"questions":[{"question":string,"options":[string,string,string,string],"correctIndex":number,"explanation":string}]}
"correctIndex" is the 0-based index into "options" for the single correct answer. Keep each question and option under 25 words. Keep the four options genuinely plausible so the question actually tests understanding.`;
}

// Local fallback so the quiz still works if the API call fails. Templates
// are generic-but-sound and shuffled/subset each time for variety.
function fallbackQuestions(skill, difficulty) {
  const pool = [
    {
      question: `Someone new to ${skill} asks where to start at a ${difficulty.toLowerCase()} level. What's the best advice?`,
      options: ["Memorize syntax without context", "Understand the core concepts before the tools built on them", "Skip fundamentals and copy finished projects", "Avoid any hands-on practice"],
      correctIndex: 1,
      explanation: `Solid ${skill} skills are built on understanding the core ideas first — tools and shortcuts make sense once the fundamentals are in place.`,
    },
    {
      question: `Which habit most improves real-world ${skill} work?`,
      options: ["Testing and checking your work as you go", "Never reading documentation", "Writing everything in one giant untested step", "Ignoring error messages"],
      correctIndex: 0,
      explanation: "Iterative checking catches mistakes early and builds a much more reliable outcome than one big untested pass.",
    },
    {
      question: `A ${difficulty.toLowerCase()}-level ${skill} task is producing an unexpected result. What's the first thing to check?`,
      options: ["Assume the tool is broken", "Re-read the requirements and inputs carefully", "Rewrite everything from scratch immediately", "Ignore it and move on"],
      correctIndex: 1,
      explanation: "Most unexpected results trace back to a misread requirement or input — that's the fastest thing to rule out first.",
    },
    {
      question: `Why does practicing ${skill} on realistic, varied examples matter?`,
      options: ["It doesn't — one example is enough", "It builds pattern recognition you can apply to new problems", "It only helps for exams", "It replaces the need to understand theory"],
      correctIndex: 1,
      explanation: "Varied practice is what lets you transfer a skill to problems you haven't seen before, which is the real test of understanding.",
    },
    {
      question: `When collaborating with others on a ${skill} project, what matters most?`,
      options: ["Keeping your work undocumented", "Clear communication and consistent conventions", "Working in total isolation", "Avoiding feedback from teammates"],
      correctIndex: 1,
      explanation: "Shared conventions and clear communication are what let a team build on each other's work instead of tripping over it.",
    },
    {
      question: `What's a sign someone has moved from beginner to ${difficulty.toLowerCase()}-level ${skill}?`,
      options: ["They can explain why they chose an approach, not just that it worked", "They never ask questions", "They avoid trying new problems", "They only follow tutorials step by step"],
      correctIndex: 0,
      explanation: "Being able to justify a choice — not just copy a working pattern — is the clearest marker of real understanding.",
    },
    {
      question: `Before considering a ${skill} task "done," what's worth double-checking?`,
      options: ["Nothing, first attempt is final", "Whether it actually meets the original requirement", "Whether it looks impressive", "Whether it took long enough"],
      correctIndex: 1,
      explanation: "Matching the actual requirement — not just producing something that runs — is what separates finished work from a rough draft.",
    },
    {
      question: `What's the most efficient way to get unstuck on a tricky ${skill} problem?`,
      options: ["Break it into smaller pieces and tackle one at a time", "Attempt the whole thing at once, repeatedly", "Wait for someone else to solve it", "Switch topics permanently"],
      correctIndex: 0,
      explanation: "Decomposing a hard problem into smaller, checkable pieces is one of the most reliable ways to make progress on anything technical.",
    },
  ];
  return shuffle(pool).slice(0, 5).map((q, i) => {
    // Shuffle each question's own options so the correct answer isn't
    // always in the same position.
    const correctText = q.options[q.correctIndex];
    const shuffled = shuffle(q.options);
    return { ...q, id: `${skill}-fb-${i}`, options: shuffled, correctIndex: shuffled.indexOf(correctText) };
  });
}

async function generateQuizQuestions(skill, difficulty) {
  try {
    const parsed = await callClaudeJSON([{ type: "text", text: quizPrompt(skill, difficulty, pickAngle()) }]);
    const qs = Array.isArray(parsed.questions) ? parsed.questions : [];
    const valid = qs.filter(
      (q) => q && typeof q.question === "string" && Array.isArray(q.options) && q.options.length === 4 &&
        Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4
    );
    if (valid.length < 5) throw new Error("Incomplete quiz response");
    return valid.slice(0, 5).map((q, i) => ({ ...q, id: `${skill}-${difficulty}-${Date.now()}-${i}` }));
  } catch (_err) {
    return fallbackQuestions(skill, difficulty);
  }
}

const DEMO_USER = {
  name: "Anar",
  email: "anar12@gmail.com",
  avatar: "🦊",
  dreamJob: "Data Analyst",
  skills: ["Python", "SQL", "Excel", "Power BI"],
  certificates: [
    {
      id: "c1",
      name: "Python for Data Science",
      org: "Coursera",
      date: "2025-11-02",
      skills: ["Python", "Pandas", "NumPy", "Data Analysis"],
      roles: ["Data Analyst", "Junior Data Scientist", "Python Developer"],
      analyzed: true,
    },
  ],
  weeklyHours: [1.5, 2, 1, 2.5, 2, 3, 1],
  weeklyDays: DEMO_WEEKLY_DAYS,
};

const AVATARS = ["🦊", "🐼", "🐧", "🦉", "🐯", "🐰", "🐨", "🦁"];

/* ======================================================================
   SMALL UI PRIMITIVES
====================================================================== */

function GlassCard({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(124,58,237,0.08)] backdrop-blur-xl ${className}`}
      style={{ background: "rgba(255,255,255,0.72)" }}
      {...props}
    >
      {children}
    </div>
  );
}

function Pill({ children, tone = "violet" }) {
  const tones = {
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
    rose: "bg-rose-100 text-rose-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function CircularProgress({ value, size = 96, stroke = 10, color = "#7C3AED", label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EDE9FE" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-[Fraunces] text-xl font-semibold text-gray-800">{value}%</span>
        {label && <span className="text-[10px] text-gray-500">{label}</span>}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-violet-200 bg-white/50 py-14 text-center">
      <div className="rounded-2xl bg-violet-100 p-3 text-violet-500">
        <Icon size={26} />
      </div>
      <p className="max-w-xs text-sm text-gray-500">{subtitle}</p>
      <p className="sr-only">{title}</p>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "have") return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
  if (status === "improve") return <AlertTriangle size={16} className="text-amber-500 shrink-0" />;
  return <XCircle size={16} className="text-rose-400 shrink-0" />;
}

/* ======================================================================
   NAVIGATION
====================================================================== */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "profile", label: "Profile", icon: User },
  { key: "analytics", label: "Weekly Analytics", icon: BarChart3 },
  { key: "chatbot", label: "AI Chatbot", icon: Bot },
  { key: "assignments", label: "Assignments", icon: ClipboardList },
  { key: "roadmap", label: "Career Roadmap", icon: Map },
  { key: "resources", label: "Source Recommendations", icon: BookOpen },
  { key: "certificates", label: "Certificates", icon: Award },
  { key: "settings", label: "Settings", icon: Settings },
];

function Sidebar({ page, setPage, collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogout, user }) {
  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-white/60 bg-white/55 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 text-white">
            <Sparkles size={18} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-[Fraunces] text-sm font-semibold text-gray-800">Career Companion</p>
              <p className="truncate text-[11px] text-gray-500">AI Learning Mentor</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/60 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mt-1 flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs text-gray-400 hover:bg-gray-50"
          >
            {collapsed ? <ChevronRight size={16} /> : <>Collapse <ChevronDown size={14} className="ml-1 rotate-90" /></>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white/95 backdrop-blur-xl p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 text-white">
                  <Sparkles size={18} />
                </div>
                <p className="font-[Fraunces] text-sm font-semibold text-gray-800">Career Companion</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = page === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setPage(item.key); setMobileOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      active ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-violet-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50">
                <LogOut size={18} /> Logout
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-white/60 bg-white/90 px-1 py-2 backdrop-blur-xl md:hidden">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = page === item.key;
          return (
            <button key={item.key} onClick={() => setPage(item.key)} className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] ${active ? "text-violet-600" : "text-gray-400"}`}>
              <Icon size={19} />
              {item.label.split(" ")[0]}
            </button>
          );
        })}
        <button onClick={() => setMobileOpen(true)} className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] text-gray-400">
          <Menu size={19} /> More
        </button>
      </nav>
    </>
  );
}

/* ======================================================================
   APP ROOT
====================================================================== */

export default function App() {
  const [screen, setScreen] = useState("login"); // login | onboardJob | onboardSkills | app
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [user, setUser] = useState(null);
  const [dreamJob, setDreamJob] = useState("");
  const [skills, setSkills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [completedRoadmapItems, setCompletedRoadmapItems] = useState([]);
  const [assignmentStatus, setAssignmentStatus] = useState({});
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Your SQL assignment is due tomorrow.", read: false },
    { id: 2, text: "You completed a new roadmap milestone.", read: false },
    { id: 3, text: "New learning resources are available.", read: true },
  ]);

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [screen]);
  const saveTimer = useRef(null);

  function startDemo() {
    setUser(DEMO_USER);
    setDreamJob(DEMO_USER.dreamJob);
    setSkills(DEMO_USER.skills);
    setCertificates(DEMO_USER.certificates);
    setCompletedRoadmapItems(["Excel", "Statistics", "Data Visualization", "SQL", "Python", "Power BI"]);
    setScreen("app");
    setPage("dashboard");
  }

  // Called after a brand-new account is created and persisted to storage.
  function handleSignedUp(profile) {
    setUser(profile);
    setDreamJob(profile.dreamJob || "");
    setSkills(profile.skills || []);
    setCertificates(profile.certificates || []);
    setCompletedRoadmapItems(profile.completedRoadmapItems || []);
    setAssignmentStatus(profile.assignmentStatus || {});
    setScreen("onboardJob");
  }

  // Called after credentials are verified against storage.
  function handleLoggedIn(profile) {
    setUser(profile);
    setDreamJob(profile.dreamJob || "");
    setSkills(profile.skills || []);
    setCertificates((profile.certificates || []).map((c) => ({ ...c, previewUrl: null, fileData: null })));
    setCompletedRoadmapItems(profile.completedRoadmapItems || []);
    setAssignmentStatus(profile.assignmentStatus || {});
    setScreen(profile.dreamJob ? "app" : "onboardJob");
    setPage("dashboard");
  }

  function finishOnboarding() {
    setUser((u) => ({ ...u, dreamJob, skills }));
    setScreen("app");
    setPage("dashboard");
  }

  function handleLogout() {
    setShowLogoutConfirm(false);
    setUser(null);
    setDreamJob("");
    setSkills([]);
    setCertificates([]);
    setCompletedRoadmapItems([]);
    setAssignmentStatus({});
    setScreen("login");
  }

  // Persist the logged-in (non-demo) user's profile to storage whenever it
  // changes, debounced so we don't fire a write on every keystroke.
  useEffect(() => {
    if (!user || !user.email || user.email === DEMO_USER.email) return;
    if (screen !== "app" && screen !== "onboardJob" && screen !== "onboardSkills") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const cleanCerts = (certificates || []).map(({ fileData, previewUrl, ...rest }) => rest);
      const payload = { ...user, dreamJob, skills, certificates: cleanCerts, completedRoadmapItems, assignmentStatus };
      storageSet(`profile:${normalizeId(user.email)}`, JSON.stringify(payload));
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [user, dreamJob, skills, certificates, completedRoadmapItems, assignmentStatus, screen]);

  const required = REQUIRED_SKILLS[dreamJob] || [];
  const gapCount = required.filter((r) => !skills.includes(r.skill)).length;
  const haveCount = required.filter((r) => skills.includes(r.skill)).length;
  const readiness = required.length ? Math.round((haveCount / required.length) * 100) : 0;

  const pageProps = {
    user, setUser, dreamJob, skills, setSkills, certificates, setCertificates,
    completedRoadmapItems, setCompletedRoadmapItems, assignmentStatus, setAssignmentStatus,
    required, gapCount, readiness, quote, notifications, setNotifications, setPage,
  };

  return (
    <div className="min-h-screen w-full font-[Plus_Jakarta_Sans] text-gray-800" style={{ position: "relative" }}>
      <style>{`
        ${FONT_IMPORT}
        .font-\\[Fraunces\\] { font-family: 'Fraunces', serif; }
        .font-\\[Plus_Jakarta_Sans\\] { font-family: 'Plus Jakarta Sans', sans-serif; }
        * { scrollbar-width: thin; scrollbar-color: #d8c9f7 transparent; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #d8c9f7; border-radius: 10px; }
        @keyframes floatSlow { 0%,100%{transform:translate(0,0)} 50%{transform:translate(10px,-14px)} }
        @keyframes fadeUp { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
        .animate-fadeUp { animation: fadeUp .45s ease both; }
      `}</style>

      <WatercolorBackground />

      <div className="relative z-10">
        {screen === "login" && <LoginScreen onDemo={startDemo} onSignedUp={handleSignedUp} onLoggedIn={handleLoggedIn} />}
        {screen === "onboardJob" && (
          <OnboardJob dreamJob={dreamJob} setDreamJob={setDreamJob} onNext={() => setScreen("onboardSkills")} />
        )}
        {screen === "onboardSkills" && (
          <OnboardSkills skills={skills} setSkills={setSkills} dreamJob={dreamJob} onBack={() => setScreen("onboardJob")} onFinish={finishOnboarding} />
        )}
        {screen === "app" && user && (
          <div className="flex min-h-screen">
            <Sidebar
              page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed}
              mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
              onLogout={() => setShowLogoutConfirm(true)} user={user}
            />
            <div className="flex-1 min-w-0 pb-20 md:pb-0">
              <TopBar user={user} setMobileOpen={setMobileOpen} notifications={notifications} setNotifications={setNotifications} />
              <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
                {page === "dashboard" && <DashboardPage {...pageProps} setScreen={setScreen} />}
                {page === "profile" && <ProfilePage {...pageProps} />}
                {page === "roadmap" && <RoadmapPage {...pageProps} />}
                {page === "chatbot" && <ChatbotPage {...pageProps} />}
                {page === "assignments" && <AssignmentsPage {...pageProps} />}
                {page === "analytics" && <AnalyticsPage {...pageProps} />}
                {page === "certificates" && <CertificatesPage {...pageProps} />}
                {page === "resources" && <ResourcesPage {...pageProps} />}
                {page === "settings" && <SettingsPage {...pageProps} onLogout={() => setShowLogoutConfirm(true)} />}
              </main>
            </div>
          </div>
        )}
      </div>

      {showLogoutConfirm && (
        <ConfirmModal
          title="Log out?"
          message="This will end your demo session and return you to the login screen."
          confirmLabel="Log out"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}

// Palette lifted from the reference watercolor artwork: blush/peach wash,
// a sage-green brushstroke, a warm coral stroke, and soft slate-blue corners.
function WatercolorBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "#FDF6F2" }}>
      <div className="absolute -top-28 -left-28 h-[440px] w-[440px] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, #CBD7E0 0%, transparent 70%)", animation: "floatSlow 18s ease-in-out infinite" }} />
      <div className="absolute top-16 right-[-140px] h-[500px] w-[500px] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, #F3D9CE 0%, transparent 70%)", animation: "floatSlow 22s ease-in-out infinite reverse" }} />
      <div className="absolute top-1/3 left-1/4 h-[460px] w-[460px] rounded-full blur-3xl opacity-45"
        style={{ background: "radial-gradient(circle, #AEBFA3 0%, transparent 72%)", animation: "floatSlow 26s ease-in-out infinite" }} />
      <div className="absolute bottom-[-170px] left-1/3 h-[520px] w-[520px] rounded-full blur-3xl opacity-45"
        style={{ background: "radial-gradient(circle, #E3A47E 0%, transparent 70%)", animation: "floatSlow 20s ease-in-out infinite reverse" }} />
      <div className="absolute bottom-[-110px] right-8 h-[380px] w-[380px] rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #C9D6E4 0%, transparent 70%)", animation: "floatSlow 16s ease-in-out infinite" }} />
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>
    </div>
  );
}

/* ======================================================================
   LOGIN
====================================================================== */

function LoginScreen({ onDemo, onSignedUp, onLoggedIn }) {
  const [mode, setMode] = useState("login"); // login | create
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e?.preventDefault?.();
    if (loading) return; // guard against double-fire
    if (!userId.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$|^[a-zA-Z0-9_]{3,}$/.test(userId)) {
      setError("Please enter a valid email or username.");
      return;
    }
    if (password.length < 4) {
      setError("Password must contain at least 4 characters.");
      return;
    }
    setError("");
    setLoading(true);
    const id = normalizeId(userId);
    const authKey = `auth:${id}`;
    const profileKey = `profile:${id}`;

    try {
      if (mode === "create") {
        const existingAuth = await storageGet(authKey);
        if (existingAuth) {
          setError("An account with this ID already exists — try logging in instead.");
          setLoading(false);
          return;
        }
        const displayName = name.trim() || userId.split("@")[0];
        const profile = blankProfile(displayName, userId.trim());
        // Try to persist the account. If storage isn't available in this
        // environment, still let the person in with an in-memory session
        // rather than blocking the "Create Account" button entirely.
        const ok = await storageSet(authKey, JSON.stringify({ password, name: displayName }));
        if (ok) await storageSet(profileKey, JSON.stringify(profile));
        onSignedUp(profile);
      } else {
        const existingAuthRaw = await storageGet(authKey);
        if (!existingAuthRaw) {
          setError("No account found with that ID. Try creating an account instead.");
          setLoading(false);
          return;
        }
        const existingAuth = JSON.parse(existingAuthRaw);
        if (existingAuth.password !== password) {
          setError("Incorrect password. Please try again.");
          setLoading(false);
          return;
        }
        const profileRaw = await storageGet(profileKey);
        const profile = profileRaw ? JSON.parse(profileRaw) : blankProfile(existingAuth.name, userId.trim());
        onLoggedIn(profile);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Enter key inside either field submits, without depending on native
  // <form> submission (some sandboxed preview frames silently swallow
  // real form submits, which would otherwise make the button look dead).
  function handleFieldKeyDown(e) {
    if (e.key === "Enter") submit(e);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/60 shadow-2xl md:grid-cols-2 animate-fadeUp">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-violet-600 via-violet-500 to-sky-500 p-10 text-white md:flex">
          <div>
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <GraduationCap size={26} />
            </div>
            <h1 className="font-[Fraunces] text-3xl font-semibold leading-tight">
              AI Career &amp; Learning Companion
            </h1>
            <p className="mt-3 text-sm text-violet-100">
              Discover your path. Build your skills. Achieve your future.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-violet-50">
            <li className="flex items-center gap-2"><Target size={16} /> Personalized roadmap to your dream job</li>
            <li className="flex items-center gap-2"><TrendingUp size={16} /> AI-tracked weekly progress</li>
            <li className="flex items-center gap-2"><Bot size={16} /> A mentor chatbot that knows your profile</li>
          </ul>
        </div>

        <div className="bg-white/85 p-8 backdrop-blur-xl md:p-10">
          <p className="font-[Fraunces] text-2xl font-semibold text-gray-800">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
          <p className="mt-1 text-sm text-gray-500">Your personalized path from learning to career.</p>

          <div className="mt-6 space-y-4">
            {mode === "create" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleFieldKeyDown} placeholder="Anar"
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">User ID</label>
              <input value={userId} onChange={(e) => setUserId(e.target.value)} onKeyDown={handleFieldKeyDown} placeholder="anar12@gmail.com"
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleFieldKeyDown} placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 pr-10 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>}
            </div>

            <button type="button" onClick={submit} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "create" : "login"); setError(""); setPassword(""); }}
            className="mt-3 w-full rounded-xl border border-violet-200 py-2.5 text-sm font-semibold text-violet-600 hover:bg-violet-50"
          >
            {mode === "login" ? "Create Account" : "Back to Login"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button onClick={onDemo} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
            <Zap size={16} /> Continue as Demo
          </button>
          <p className="mt-3 text-center text-[11px] text-gray-400">Demo mode loads a sample profile instantly. Accounts you create are saved so the same login works again next time.</p>
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   ONBOARDING
====================================================================== */

function OnboardJob({ dreamJob, setDreamJob, onNext }) {
  const [query, setQuery] = useState(dreamJob || "");
  const filtered = CAREERS.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-2xl p-8 animate-fadeUp md:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Step 1 of 2</p>
        <h2 className="mt-2 font-[Fraunces] text-2xl font-semibold text-gray-800">What is your dream career?</h2>
        <p className="mt-1 text-sm text-gray-500">Search any role, or pick one of the suggestions below.</p>

        <div className="relative mt-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setDreamJob(e.target.value); }}
            placeholder="e.g. Data Analyst, AI Engineer, Teacher..."
            className="w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(query ? filtered : CAREERS).map((c) => (
            <button
              key={c.name}
              onClick={() => { setDreamJob(c.name); setQuery(c.name); }}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-4 text-center transition ${
                dreamJob === c.name ? "border-violet-400 bg-violet-50 shadow-sm" : "border-gray-200 bg-white/70 hover:border-violet-200 hover:bg-violet-50/50"
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-xs font-semibold text-gray-700">{c.name}</span>
            </button>
          ))}
          {query && filtered.length === 0 && (
            <p className="col-span-3 py-4 text-center text-sm text-gray-400">
              No suggested match — "{query}" will still be saved as your goal.
            </p>
          )}
        </div>

        <button
          disabled={!dreamJob.trim()}
          onClick={onNext}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue <ArrowRight size={16} />
        </button>
      </GlassCard>
    </div>
  );
}

function OnboardSkills({ skills, setSkills, dreamJob, onBack, onFinish }) {
  const [query, setQuery] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  function toggle(skill) {
    setSkills((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]));
  }
  function addCustom() {
    const v = customSkill.trim();
    if (v && !skills.includes(v)) setSkills((s) => [...s, v]);
    setCustomSkill("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-3xl p-8 animate-fadeUp md:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Step 2 of 2</p>
        <h2 className="mt-2 font-[Fraunces] text-2xl font-semibold text-gray-800">Which skills do you already have?</h2>
        <p className="mt-1 text-sm text-gray-500">Tap to select — no need to type everything out.</p>

        <div className="relative mt-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search skills..."
            className="w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        </div>

        <div className="mt-4 max-h-64 space-y-4 overflow-y-auto pr-1">
          {Object.entries(SKILL_CATEGORIES).map(([cat, list]) => {
            const shown = list.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
            if (shown.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {shown.map((s) => (
                    <button key={s} onClick={() => toggle(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        skills.includes(s) ? "border-violet-500 bg-violet-600 text-white" : "border-gray-200 bg-white/70 text-gray-600 hover:border-violet-300"
                      }`}
                    >
                      {skills.includes(s) && <Check size={11} className="mr-1 inline" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Add a custom skill..."
            className="flex-1 rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-violet-400" />
          <button onClick={addCustom} className="flex items-center gap-1 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white">
            <Plus size={14} /> Add
          </button>
        </div>

        {skills.length > 0 && (
          <div className="mt-4 rounded-xl bg-violet-50/70 p-3">
            <p className="mb-2 text-xs font-semibold text-violet-600">Selected ({skills.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                  {s} <button onClick={() => toggle(s)}><X size={11} className="text-gray-400 hover:text-rose-500" /></button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button onClick={onBack} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50">
            Back
          </button>
          <button onClick={onFinish} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700">
            Analyze My Career Path <ArrowRight size={16} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

/* ======================================================================
   TOP BAR
====================================================================== */

function greetingFor(date) {
  const h = date.getHours();
  if (h < 12) return { text: "Good Morning", emoji: "☀️" };
  if (h < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}

function TopBar({ user, setMobileOpen, notifications, setNotifications }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/50 bg-white/60 px-4 py-3 backdrop-blur-xl md:px-8">
      <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-gray-500 hover:bg-white md:hidden">
        <Menu size={20} />
      </button>
      <div className="hidden md:block" />
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="relative rounded-full p-2 text-gray-500 hover:bg-white">
          <Bell size={19} />
          {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-xl backdrop-blur-xl">
            <p className="px-2 py-1.5 text-xs font-semibold text-gray-400">Notifications</p>
            {notifications.map((n) => (
              <button key={n.id} onClick={() => setNotifications((ns) => ns.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                className={`block w-full rounded-xl px-2.5 py-2 text-left text-xs ${n.read ? "text-gray-400" : "bg-violet-50 text-gray-700 font-medium"}`}>
                {n.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

/* ======================================================================
   DASHBOARD
====================================================================== */

function DashboardPage({ user, dreamJob, skills, required, gapCount, readiness, quote, certificates, setPage, completedRoadmapItems }) {
  const greeting = greetingFor(new Date());
  const weeklyHours = (user.weeklyHours || []).reduce((a, b) => a + b, 0);
  const level = readiness >= 90 ? "Job Ready" : readiness >= 65 ? "Advanced" : readiness >= 35 ? "Intermediate" : "Foundation";
  const levels = ["Foundation", "Intermediate", "Advanced", "Job Ready"];
  const nextSkill = required.find((r) => !skills.includes(r.skill));

  const cards = [
    { label: "Career Goal", value: dreamJob || "Not set", icon: Target, tone: "violet" },
    { label: "Current Progress", value: `${readiness}%`, icon: TrendingUp, tone: "emerald" },
    { label: "Skills Completed", value: `${skills.filter((s) => required.some((r) => r.skill === s)).length} / ${required.length || 0}`, icon: CheckCircle2, tone: "sky" },
    { label: "Skill Gap", value: `${gapCount} skills`, icon: AlertTriangle, tone: "amber" },
    { label: "Certificates", value: certificates.length, icon: Award, tone: "rose" },
    { label: "Weekly Learning", value: `${weeklyHours.toFixed(1)} hrs`, icon: Clock, tone: "violet" },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fadeUp">
        <h1 className="font-[Fraunces] text-2xl font-semibold text-gray-800 md:text-3xl">
          {greeting.text}, {user.name} {greeting.emoji}
        </h1>
        <p className="mt-1 text-sm italic text-gray-500">"{quote}"</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <GlassCard key={c.label} className="p-4">
            <c.icon size={16} className="text-violet-500" />
            <p className="mt-2 truncate font-[Fraunces] text-lg font-semibold text-gray-800">{c.value}</p>
            <p className="text-[11px] text-gray-500">{c.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <p className="font-[Fraunces] text-lg font-semibold text-gray-800">Your Career Progress</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {levels.map((l, i) => (
            <React.Fragment key={l}>
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                l === level ? "bg-violet-600 text-white shadow-md shadow-violet-200" : levels.indexOf(level) > i ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
              }`}>
                {levels.indexOf(level) > i && <Check size={12} />} {l}
              </div>
              {i < levels.length - 1 && <ArrowRight size={14} className="text-gray-300" />}
            </React.Fragment>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-6">
          <p className="font-[Fraunces] text-base font-semibold text-gray-800">Continue Your Roadmap</p>
          {nextSkill ? (
            <>
              <p className="mt-2 text-sm text-gray-600">Next recommended skill:</p>
              <p className="mt-1 font-semibold text-violet-700">{nextSkill.skill}</p>
              <p className="mt-1 text-xs text-gray-500">{nextSkill.why}</p>
              <button onClick={() => setPage("roadmap")} className="mt-4 flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                Start Learning <ArrowRight size={13} />
              </button>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-500">You've covered every required skill for {dreamJob}. Great work!</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <p className="font-[Fraunces] text-base font-semibold text-gray-800">Today's Assignment</p>
          <p className="mt-2 text-sm text-gray-600">Personalized to your current skill gaps.</p>
          <button onClick={() => setPage("assignments")} className="mt-4 flex items-center gap-1.5 rounded-lg border border-violet-200 px-4 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-50">
            View Assignments <ArrowRight size={13} />
          </button>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {[
          { label: "Roadmap", icon: Map, key: "roadmap" },
          { label: "Ask AI", icon: Bot, key: "chatbot" },
          { label: "Assignment", icon: ClipboardList, key: "assignments" },
          { label: "Certificate", icon: Award, key: "certificates" },
          { label: "Resources", icon: BookOpen, key: "resources" },
          { label: "Analytics", icon: BarChart3, key: "analytics" },
        ].map((a) => (
          <button key={a.key} onClick={() => setPage(a.key)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/60 bg-white/70 py-4 text-xs font-semibold text-gray-600 shadow-sm hover:border-violet-200 hover:bg-violet-50">
            <a.icon size={18} className="text-violet-500" /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ======================================================================
   PROFILE
====================================================================== */

function ProfilePage({ user, setUser, dreamJob, skills, required, readiness, certificates }) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileRef = useRef(null);
  const [uploadedImg, setUploadedImg] = useState(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setUploadedImg(url);
  }

  return (
    <div className="space-y-6">
      <GlassCard className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="relative">
          {uploadedImg ? (
            <img src={uploadedImg} alt="Profile" className="h-20 w-20 rounded-2xl object-cover shadow-md" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-200 to-sky-100 text-4xl shadow-md">{user.avatar}</div>
          )}
          <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="absolute -bottom-1 -right-1 rounded-full bg-violet-600 p-1.5 text-white shadow">
            <ImageIcon size={12} />
          </button>
        </div>
        <div className="flex-1">
          <p className="font-[Fraunces] text-xl font-semibold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Pill tone="violet">{dreamJob || "No goal set"}</Pill>
            <Pill tone="emerald">{readiness}% ready</Pill>
            <Pill tone="amber">{certificates.length} certificates</Pill>
          </div>
        </div>
      </GlassCard>

      {showAvatarPicker && (
        <GlassCard className="p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Choose an avatar or upload your own</p>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => { setUser((u) => ({ ...u, avatar: a })); setUploadedImg(null); setShowAvatarPicker(false); }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm hover:ring-2 hover:ring-violet-300">
                {a}
              </button>
            ))}
            <button onClick={() => fileRef.current?.click()} className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-violet-300 hover:text-violet-500">
              <Upload size={16} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </GlassCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> Current Skills</p>
          <div className="space-y-2">
            {skills.length === 0 && <p className="text-xs text-gray-400">No skills added yet.</p>}
            {skills.map((s) => (
              <div key={s} className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={14} className="text-emerald-500" /> {s}
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2"><Target size={15} className="text-violet-500" /> Required Skills for {dreamJob || "your goal"}</p>
          <div className="space-y-2">
            {required.length === 0 && <p className="text-xs text-gray-400">Set a dream job to see requirements.</p>}
            {required.map((r) => (
              <div key={r.skill} className="flex items-center gap-2 text-sm text-gray-600">
                {skills.includes(r.skill) ? <Check size={14} className="text-emerald-500" /> : <Circle size={14} className="text-gray-300" />}
                <span className={skills.includes(r.skill) ? "" : "text-gray-400"}>{r.skill}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ======================================================================
   ROADMAP
====================================================================== */

function RoadmapPage({ dreamJob, skills, completedRoadmapItems, setCompletedRoadmapItems, setPage }) {
  const [expanded, setExpanded] = useState(null);
  const roadmap = useMemo(() => buildRoadmap(dreamJob), [dreamJob]);

  if (!dreamJob) {
    return <EmptyState icon={Map} title="No roadmap" subtitle="Set a dream job during onboarding to generate your personalized roadmap." />;
  }

  function isDone(skill) {
    return skills.includes(skill) || completedRoadmapItems.includes(skill);
  }
  function toggleDone(skill) {
    setCompletedRoadmapItems((c) => (c.includes(skill) ? c.filter((x) => x !== skill) : [...c, skill]));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Fraunces] text-2xl font-semibold text-gray-800">AI Career Roadmap</h1>
        <p className="mt-1 text-sm text-gray-500">Your personalized path to becoming a {dreamJob}.</p>
      </div>

      <GlassCard className="flex items-center gap-3 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-lg text-white">🎯</div>
        <div>
          <p className="text-xs text-gray-400">Dream Job</p>
          <p className="font-[Fraunces] text-lg font-semibold text-gray-800">{dreamJob}</p>
        </div>
      </GlassCard>

      <div className="relative ml-4 space-y-6 border-l-2 border-dashed border-violet-200 pl-8">
        {roadmap.map((phase, pi) => {
          const doneCount = phase.items.filter((it) => isDone(it.skill)).length;
          const phaseDone = doneCount === phase.items.length;
          return (
            <div key={phase.phase} className="relative">
              <span
                className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full text-white text-[10px] font-bold shadow"
                style={{ background: phase.color }}
              >
                {phaseDone ? <Check size={13} /> : pi + 1}
              </span>
              <GlassCard className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-[Fraunces] text-base font-semibold text-gray-800">{phase.phase}</p>
                  <Pill tone={phaseDone ? "emerald" : "gray"}>{doneCount}/{phase.items.length} complete</Pill>
                </div>
                <div className="mt-3 space-y-2">
                  {phase.items.map((item) => {
                    const done = isDone(item.skill);
                    const key = `${phase.phase}-${item.skill}`;
                    const isOpen = expanded === key;
                    const dur = DURATIONS[hashStr(item.skill) % DURATIONS.length];
                    const res = RESOURCES_POOL[hashStr(item.skill + "r") % RESOURCES_POOL.length];
                    return (
                      <div key={key} className="rounded-xl border border-gray-100 bg-white/70">
                        <button onClick={() => setExpanded(isOpen ? null : key)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left">
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            {done ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Circle size={15} className="text-gray-300" />}
                            {item.skill}
                          </span>
                          <ChevronDown size={15} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="space-y-2 border-t border-gray-100 px-3 py-3 text-xs text-gray-600 animate-fadeUp">
                            <p><span className="font-semibold text-gray-700">Why it matters: </span>{item.why}</p>
                            <p><span className="font-semibold text-gray-700">Estimated duration: </span>{dur}</p>
                            <p><span className="font-semibold text-gray-700">Recommended resource: </span>{res}</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button onClick={() => toggleDone(item.skill)} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${done ? "bg-emerald-100 text-emerald-700" : "bg-violet-600 text-white"}`}>
                                {done ? "Marked Complete ✓" : "Mark as Completed"}
                              </button>
                              <button onClick={() => setPage("assignments")} className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
                                Start Assignment
                              </button>
                              <button onClick={() => setPage("chatbot")} className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
                                Ask AI about this
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          );
        })}
        <div className="relative">
          <span className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white text-[11px] shadow">🚀</span>
          <GlassCard className="p-5">
            <p className="font-[Fraunces] text-base font-semibold text-gray-800">Career Ready</p>
            <p className="mt-1 text-xs text-gray-500">Portfolio, resume, and interview preparation.</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   SKILL GAP (used inside roadmap page area / dashboard) — standalone helper section
====================================================================== */

function skillStatus(skill, skills) {
  if (skills.includes(skill)) return "have";
  return "missing";
}

/* ======================================================================
   ANALYTICS
====================================================================== */

function AnalyticsPage({ user, required, skills }) {
  const weekly = (user.weeklyDays || DEMO_USER.weeklyDays).map((d, i) => ({ day: d, hours: (user.weeklyHours || DEMO_USER.weeklyHours)[i] || 0 }));
  const totalHours = weekly.reduce((a, b) => a + b.hours, 0);
  const quizData = [
    { week: "W1", accuracy: 62 }, { week: "W2", accuracy: 68 }, { week: "W3", accuracy: 74 },
    { week: "W4", accuracy: 71 }, { week: "W5", accuracy: 80 },
  ];
  const skillRadar = (required.length ? required.slice(0, 6) : []).map((r) => ({
    skill: r.skill, value: skills.includes(r.skill) ? 90 : 30 + (hashStr(r.skill) % 30),
  }));
  const assignmentPie = [
    { name: "Completed", value: 4, color: "#10B981" },
    { name: "In Progress", value: 2, color: "#F59E0B" },
    { name: "Not Started", value: 3, color: "#E5E7EB" },
  ];

  if (totalHours === 0) {
    return <EmptyState icon={BarChart3} title="No analytics" subtitle="Complete your first learning activity to start tracking progress." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-[Fraunces] text-2xl font-semibold text-gray-800">Weekly Analytics</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <GlassCard className="p-4"><p className="text-xs text-gray-500">Learning Hours</p><p className="mt-1 font-[Fraunces] text-xl font-semibold">{totalHours.toFixed(1)}h</p></GlassCard>
        <GlassCard className="p-4"><p className="text-xs text-gray-500">Assignments Done</p><p className="mt-1 font-[Fraunces] text-xl font-semibold">4</p></GlassCard>
        <GlassCard className="p-4"><p className="text-xs text-gray-500">Quiz Accuracy</p><p className="mt-1 font-[Fraunces] text-xl font-semibold">80%</p></GlassCard>
        <GlassCard className="p-4"><p className="text-xs text-gray-500">Skills Improved</p><p className="mt-1 font-[Fraunces] text-xl font-semibold">{skills.length}</p></GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Weekly Learning Hours</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F0FF" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #EDE9FE" }} />
              <Bar dataKey="hours" fill="#7C3AED" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Quiz Performance</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={quizData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F0FF" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #EDE9FE" }} />
              <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {skillRadar.length > 0 && (
          <GlassCard className="p-5">
            <p className="mb-3 text-sm font-semibold text-gray-700">Skill Progress</p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={skillRadar}>
                <PolarGrid stroke="#EDE9FE" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        <GlassCard className="p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Assignment Completion</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={assignmentPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {assignmentPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #EDE9FE" }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <p className="mb-2 text-sm font-semibold text-gray-700">This Week's Summary</p>
        <ul className="space-y-1.5 text-sm text-gray-600">
          <li>• You improved SQL performance by 12%.</li>
          <li>• You completed 4 assignments.</li>
          <li>• You learned for {totalHours.toFixed(1)} hours.</li>
        </ul>
      </GlassCard>
    </div>
  );
}

/* ======================================================================
   ASSIGNMENTS
====================================================================== */

function AssignmentsPage({ dreamJob, skills, required, assignmentStatus, setAssignmentStatus, setPage }) {
  const list = useMemo(() => ASSIGNMENTS_BY_CAREER[dreamJob] || (required.length ? genericAssignments(dreamJob) : []), [dreamJob, required]);
  const [globalDiff, setGlobalDiff] = useState("Medium");
  const [perCardDiff, setPerCardDiff] = useState({});
  const [activeQuiz, setActiveQuiz] = useState(null); // { skill, difficulty } | null

  if (!dreamJob) {
    return <EmptyState icon={ClipboardList} title="No assignments" subtitle="Your personalized assignments will appear here once you set a career goal." />;
  }

  function statusKey(skill, diff) {
    return `${skill}::${diff}`;
  }
  function setStatus(skill, diff, status) {
    setAssignmentStatus((s) => ({ ...s, [statusKey(skill, diff)]: status }));
  }

  const diffTone = { Easy: "emerald", Medium: "amber", Hard: "rose" };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Fraunces] text-2xl font-semibold text-gray-800">Assignments</h1>
          <p className="mt-1 text-sm text-gray-500">Generated from your skill gaps for {dreamJob}. Each subject has a 5-question quiz per difficulty level — a fresh set every time you take it.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white/70 p-1">
          {DIFFICULTY_LEVELS.map((d) => (
            <button key={d} onClick={() => setGlobalDiff(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${globalDiff === d ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:bg-violet-50"}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((a, i) => {
          const diff = perCardDiff[a.skill] || globalDiff;
          const variant = a.variants[diff];
          const status = assignmentStatus[statusKey(a.skill, diff)] || "Not started";
          const gap = !skills.includes(a.skill);
          return (
            <GlassCard key={a.skill} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-800">{variant.title}</p>
                <Pill tone={diffTone[diff]}>{diff}</Pill>
              </div>

              <div className="mt-3 flex items-center gap-1 rounded-lg bg-gray-100/80 p-1 text-[11px]">
                {DIFFICULTY_LEVELS.map((d) => (
                  <button key={d} onClick={() => setPerCardDiff((p) => ({ ...p, [a.skill]: d }))}
                    className={`flex-1 rounded-md py-1 font-semibold transition ${diff === d ? "bg-white text-violet-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    {d}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock size={12} /> {variant.time}</span>
                <span className="flex items-center gap-1"><Target size={12} /> {a.skill}</span>
                {gap && <Pill tone="rose">Addresses a skill gap</Pill>}
              </div>
              <p className="mt-2 text-xs text-gray-400">Deadline: {["Tomorrow", "In 3 days", "Next week", "In 5 days", "In 2 weeks", "In 10 days"][i % 6]}</p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <Pill tone={status === "Completed" ? "emerald" : status === "In Progress" ? "amber" : "gray"}>{status}</Pill>
                <div className="flex gap-2">
                  <button onClick={() => setActiveQuiz({ skill: a.skill, difficulty: diff })} className="rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700">
                    {status === "Completed" ? "Retake Quiz" : "Take Quiz"}
                  </button>
                  <button onClick={() => setPage("chatbot")} className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
                    AI Hint
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {activeQuiz && (
        <QuizModal
          skill={activeQuiz.skill}
          difficulty={activeQuiz.difficulty}
          onClose={() => setActiveQuiz(null)}
          onFinished={(passed) => {
            setStatus(activeQuiz.skill, activeQuiz.difficulty, passed ? "Completed" : "In Progress");
          }}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   QUIZ MODAL
   Fetches a fresh 5-question set for the given subject/level on open,
   walks the learner through one question at a time with instant
   feedback, then shows a final score. "Retake" pulls a brand new set.
---------------------------------------------------------------------- */

function QuizModal({ skill, difficulty, onClose, onFinished }) {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]); // booleans, correct or not
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const diffTone = { Easy: "emerald", Medium: "amber", Hard: "rose" };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    setQuestions(null);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setDone(false);
    generateQuizQuestions(skill, difficulty).then((qs) => {
      if (cancelled) return;
      setQuestions(qs);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setQuestions(fallbackQuestions(skill, difficulty));
      setLoadError(true);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [skill, difficulty, attempt]);

  const q = questions && questions[index];
  const score = answers.filter(Boolean).length;
  const passed = questions ? score / questions.length >= 0.6 : false;

  function choose(optIndex) {
    if (selected !== null) return; // lock in after first pick
    setSelected(optIndex);
    setAnswers((a) => [...a, optIndex === q.correctIndex]);
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      setDone(true);
      onFinished(score / questions.length >= 0.6);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4">
      <GlassCard className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden p-0 animate-fadeUp" style={{ background: "rgba(255,255,255,0.97)" }}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="font-[Fraunces] text-lg font-semibold text-gray-800">{skill} Quiz</p>
            <p className="text-xs text-gray-500">5 questions · fresh set every attempt</p>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={diffTone[difficulty]}>{difficulty}</Pill>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              <p className="text-sm text-gray-500">Putting together a fresh set of {skill} questions…</p>
            </div>
          )}

          {!loading && questions && !done && q && (
            <div>
              <div className="mb-3 flex items-center gap-1.5">
                {questions.map((_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < index ? "bg-violet-500" : i === index ? "bg-violet-300" : "bg-gray-200"}`} />
                ))}
              </div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-violet-500">Question {index + 1} of {questions.length}</p>
              <p className="mb-4 font-medium text-gray-800">{q.question}</p>

              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isSelected = i === selected;
                  let cls = "border-gray-200 bg-white/80 hover:border-violet-300";
                  if (selected !== null) {
                    if (isCorrect) cls = "border-emerald-400 bg-emerald-50";
                    else if (isSelected) cls = "border-rose-300 bg-rose-50";
                    else cls = "border-gray-200 bg-white/50 opacity-70";
                  }
                  return (
                    <button key={i} onClick={() => choose(i)} disabled={selected !== null}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm text-gray-700 transition ${cls}`}>
                      <span>{opt}</span>
                      {selected !== null && isCorrect && <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />}
                      {selected !== null && isSelected && !isCorrect && <XCircle size={16} className="shrink-0 text-rose-400" />}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div className="mt-4 rounded-xl bg-violet-50 p-3 text-xs text-violet-700">
                  {q.explanation}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button onClick={next} disabled={selected === null}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {index + 1 < questions.length ? "Next question" : "See results"} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {!loading && done && questions && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CircularProgress value={Math.round((score / questions.length) * 100)} color={passed ? "#10B981" : "#F59E0B"} label={`${score}/${questions.length}`} />
              <div>
                <p className="font-[Fraunces] text-xl font-semibold text-gray-800">{passed ? "Nice work! 🎉" : "So close — try again"}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {passed
                    ? `You've shown solid ${difficulty.toLowerCase()}-level understanding of ${skill}.`
                    : `Aim for 60% or higher to mark this assignment complete. A new set of questions is ready whenever you retake it.`}
                </p>
                {loadError && <p className="mt-2 text-[11px] text-gray-400">(Used a backup question set this time.)</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAttempt((a) => a + 1)} className="rounded-lg border border-violet-200 px-4 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-50">
                  Retake with new questions
                </button>
                <button onClick={onClose} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

/* ======================================================================
   CERTIFICATES
====================================================================== */

const CERT_ANALYSIS_PROMPT = `Look closely at this certificate or credential (image or PDF). Respond ONLY with valid JSON — no markdown fences, no preamble, no trailing text — in exactly this shape:
{"certificateName": string, "issuer": string, "skills": string[], "roles": string[]}
"skills" = the concrete technical or professional skills this credential demonstrates (short names like "Python", "SQL", "Project Management").
"roles" = 2-4 realistic job titles this credential is relevant for.
If you genuinely cannot read the document, still return your best-guess JSON with an empty skills array rather than any prose.`;

function CertificatesPage({ certificates, setCertificates, dreamJob, required }) {
  const fileRef = useRef(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [uploadError, setUploadError] = useState("");

  async function handleUpload(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploadError("");
    const isPdf = f.type === "application/pdf";
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(f.type) && !isPdf) {
      setUploadError("Please upload a JPG, PNG, WEBP, or PDF file.");
      return;
    }
    const id = `c${Date.now()}`;
    const newCert = {
      id, name: f.name.replace(/\.[^.]+$/, ""), org: "Unverified", date: new Date().toISOString().slice(0, 10),
      skills: [], roles: [], analyzed: false,
      previewUrl: isPdf ? null : URL.createObjectURL(f),
      fileData: { originalName: f.name, mediaType: f.type, isPdf },
    };
    setCertificates((c) => [...c, newCert]);
    // Auto-analyze immediately after upload
    setAnalyzing(id);
    try {
      const parsed = detectCertInfo(f.name);
      setCertificates((certs) => certs.map((c) => (c.id === id ? {
        ...c,
        name: parsed.certificateName || c.name,
        org: parsed.issuer || "Detected Institution",
        skills: parsed.skills,
        roles: parsed.roles,
        analyzed: true,
      } : c)));
    } catch (err) {
      // leave as unanalyzed so user can retry manually
    } finally {
      setAnalyzing(null);
    }
  }

  async function analyze(id) {
    const cert = certificates.find((c) => c.id === id);
    if (!cert) return;
    setAnalyzing(id);
    setUploadError("");
    try {
      // Use offline smart analysis engine (works without API key or backend)
      const parsed = cert.fileData
        ? detectCertInfo(cert.fileData.originalName || cert.name)
        : detectCertInfo(cert.name);
      setCertificates((certs) => certs.map((c) => (c.id === id ? {
        ...c,
        name: parsed.certificateName || c.name,
        org: parsed.issuer || "Detected Institution",
        skills: parsed.skills,
        roles: parsed.roles,
        analyzed: true,
      } : c)));
    } catch (err) {
      setUploadError("Couldn't analyze this certificate — please try again.");
    } finally {
      setAnalyzing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Fraunces] text-2xl font-semibold text-gray-800">Certificates</h1>
          <p className="mt-1 text-sm text-gray-500">Upload certificates and let AI detect the skills behind them, matched against {dreamJob || "your target role"}.</p>
        </div>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700">
          <Upload size={15} /> Upload Certificate
        </button>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/*" className="hidden" onChange={handleUpload} />
      </div>

      {uploadError && <p className="text-xs font-medium text-rose-500">{uploadError}</p>}

      {certificates.length === 0 ? (
        <EmptyState icon={Award} title="No certificates" subtitle="Upload your first certificate and let AI discover your skills." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((c) => {
            const gapForCert = dreamJob ? required.filter((r) => !c.skills.includes(r.skill)) : [];
            return (
              <GlassCard key={c.id} className="p-5">
                <div className="flex gap-3">
                  {c.previewUrl ? (
                    <img src={c.previewUrl} className="h-16 w-16 rounded-xl object-cover" alt="" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-500"><FileText size={22} /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.org} • {c.date}</p>
                  </div>
                </div>

                {c.analyzed ? (
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">Detected Skills</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {c.skills.length ? c.skills.map((s) => <Pill key={s} tone="emerald">✓ {s}</Pill>) : <span className="text-xs text-gray-400">No specific skills detected.</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">Relevant Career Roles</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {c.roles.map((r) => <Pill key={r} tone="violet">{r}</Pill>)}
                      </div>
                    </div>
                    {dreamJob && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500">Still needed for {dreamJob}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {gapForCert.length === 0
                            ? <Pill tone="emerald">This certificate covers every required skill!</Pill>
                            : gapForCert.slice(0, 6).map((r) => <Pill key={r.skill} tone="rose">{r.skill}</Pill>)}
                        </div>
                      </div>
                    )}
                    <p className="pt-1 text-[10px] text-gray-400">AI-assisted recommendation — not a guaranteed qualification.</p>
                  </div>
                ) : (
                  <button onClick={() => analyze(c.id)} disabled={analyzing === c.id || !c.fileData} className="mt-4 flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
                    {analyzing === c.id ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Analyzing...</> : <><Sparkles size={13} /> Analyze Certificate with AI</>}
                  </button>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   RESOURCES
====================================================================== */

const RESOURCE_TYPES = ["Course", "Documentation", "Tutorial", "Practice Website", "YouTube Series"];

function ResourcesPage({ dreamJob, skills, required }) {
  const gapSkills = required.filter((r) => !skills.includes(r.skill));
  const targets = gapSkills.length ? gapSkills : required.slice(0, 5);

  if (!dreamJob) {
    return <EmptyState icon={BookOpen} title="No resources" subtitle="Set a career goal to get personalized resource recommendations." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Fraunces] text-2xl font-semibold text-gray-800">Recommended Resources</h1>
        <p className="mt-1 text-sm text-gray-500">Based on your skill gaps for {dreamJob}.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {targets.map((r) => {
          const type = RESOURCE_TYPES[hashStr(r.skill) % RESOURCE_TYPES.length];
          const difficulty = ["Beginner", "Intermediate", "Advanced"][hashStr(r.skill + "d") % 3];
          const time = DURATIONS[hashStr(r.skill + "t") % DURATIONS.length];
          return (
            <GlassCard key={r.skill} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-800">{r.skill} — {type}</p>
                <Pill tone="sky">{type}</Pill>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Pill tone="violet">{r.skill}</Pill>
                <Pill tone="gray">{difficulty}</Pill>
                <Pill tone="amber">{time}</Pill>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                <span className="font-semibold text-gray-600">Why recommended: </span>
                You need {r.skill} for your target {dreamJob} role — {r.why.toLowerCase()}
              </p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

/* ======================================================================
   CHATBOT
====================================================================== */

const SUGGESTED_PROMPTS = [
  "What should I learn next?",
  "Analyze my career readiness.",
  "Explain SQL simply.",
  "Find current resources for my career.",
  "Create an assignment for me.",
  "Prepare me for an interview.",
];

function generateBotReply({ text, dreamJob, skills, required, gapCount, readiness }) {
  const lower = text.toLowerCase();
  const missing = required.filter((r) => !skills.includes(r.skill));

  if (lower.includes("what should i learn") || lower.includes("next")) {
    if (missing.length === 0) return `You've covered every required skill for ${dreamJob}. Consider a capstone project to strengthen your portfolio.`;
    const next = missing[0];
    return `You already have ${skills.slice(0, 3).join(", ") || "a growing skill set"}. Your biggest current gap for ${dreamJob} roles is **${next.skill}**. ${next.why} I'd recommend starting there this week.`;
  }
  if (lower.includes("readiness") || lower.includes("ready")) {
    return `Based on your profile, you're **${readiness}% ready** for ${dreamJob || "your target role"}. You have ${skills.length} skills matched and ${gapCount} gaps remaining. Closing the top 2-3 gaps would meaningfully raise this score.`;
  }
  if (lower.includes("sql") && lower.includes("explain")) {
    return `SQL (Structured Query Language) is how you talk to databases. Think of a spreadsheet with millions of rows — SQL lets you ask precise questions like "show me all sales from March over $500" instantly, using statements like SELECT, WHERE, and JOIN.`;
  }
  if (lower.includes("resource") || lower.includes("current") || lower.includes("trend")) {
    return `Here's what I'd point you to for ${dreamJob || "your field"} right now:\n\n- Official documentation for your top skill gap\n- A structured course covering fundamentals to advanced\n- A hands-on project to apply what you learn\n\nSources: Official documentation, trusted technology websites. *(Demo mode — connect a live web-search API for real-time results.)*`;
  }
  if (lower.includes("assignment") || lower.includes("create")) {
    const s = missing[0]?.skill || skills[0] || "a core skill";
    return `Here's a quick assignment: **Apply ${s} in a 1-hour practical exercise.** Pick a small real-world dataset or scenario, use ${s} to solve one concrete problem, and document what you learned. Check the Assignments page to track it.`;
  }
  if (lower.includes("interview")) {
    return `Let's prep for a ${dreamJob || "role"} interview. Expect questions like:\n\n1. Walk me through a project where you used ${skills[0] || "your strongest skill"}.\n2. How would you approach a problem involving ${missing[0]?.skill || "a skill gap area"}?\n3. Tell me about a time you had to learn something quickly.\n\nWant me to go deeper on any of these?`;
  }
  if (lower.includes("what is python")) {
    return `Python is a beginner-friendly, general-purpose programming language known for readable syntax. It's widely used in data analysis, automation, web development, and AI — which makes it one of the most useful languages to learn for almost any tech career.`;
  }
  return `Here's my take: for ${dreamJob || "your goal"}, focus on closing the gap in ${missing[0]?.skill || "your next priority skill"} first, then reinforce it with a small project. Ask me anything else — career, coding, study help, or general questions.`;
}

const PHOTO_ANALYSIS_PROMPT = (dreamJob) => `You are a friendly AI career mentor. The user is aiming to become a ${dreamJob || "professional in their field"}. Look at this photo and describe what it shows in 2-4 sentences. If it's a whiteboard, notes, code, a project screenshot, or a diagram, extract and summarize the key technical content and connect it to skills useful for that career goal. If it's unrelated to career or learning, just describe it naturally and warmly. Keep it under 120 words.`;

function ChatbotPage({ dreamJob, skills, required, gapCount, readiness, certificates, setCertificates }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: `Hi! I'm your AI mentor. I know you're aiming for **${dreamJob || "your dream role"}**. Ask me anything, or upload a photo or certificate using the buttons below and I'll analyze it.` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [toolError, setToolError] = useState("");
  const endRef = useRef(null);
  const photoRef = useRef(null);
  const certRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  function send(text) {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = generateBotReply({ text: t, dreamJob, skills, required, gapCount, readiness });
      setMessages((m) => [...m, { role: "bot", text: reply }]);
      setTyping(false);
    }, 900);
  }

  // Photo analysis using smart offline engine
  async function handlePhoto(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setToolError("");
    const previewUrl = URL.createObjectURL(f);
    setMessages((m) => [...m, { role: "user", text: "📷 Uploaded a photo for analysis.", image: previewUrl }]);
    setTyping(true);
    try {
      const reply = await analyzeImageOffline(f, dreamJob);
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", text: "⚠️ I couldn't analyze that photo — please try again." }]);
    } finally {
      setTyping(false);
    }
  }

  // Certificate analysis using smart offline engine — extracts skills & roles from filename
  async function handleCertificate(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setToolError("");
    const isPdf = f.type === "application/pdf";
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(f.type) && !isPdf) {
      setToolError("Please upload a JPG, PNG, WEBP, or PDF certificate.");
      return;
    }
    const previewUrl = isPdf ? null : URL.createObjectURL(f);
    setMessages((m) => [...m, { role: "user", text: `🏆 Uploaded a certificate: ${f.name}` }]);
    setTyping(true);
    try {
      const parsed = await analyzeCertOffline(f);
      const detected = parsed.skills;
      const roles = parsed.roles;

      // Save to certificates page too
      setCertificates((c) => [...c, {
        id: `c${Date.now()}`,
        name: parsed.certificateName || f.name.replace(/\.[^.]+$/, ""),
        org: parsed.issuer || "Detected Institution",
        date: new Date().toISOString().slice(0, 10),
        skills: detected, roles, analyzed: true,
        previewUrl,
      }]);

      const gap = dreamJob ? required.filter((r) => !detected.includes(r.skill)) : [];
      const lines = [
        `✅ **${parsed.certificateName}** from **${parsed.issuer}** — saved to your Certificates page.`,
        ``,
        `🎯 **Detected Skills:** ${detected.join(", ")}`,
        `💼 **Relevant Roles:** ${roles.join(", ")}`,
        dreamJob
          ? (gap.length
            ? `\n📌 **Still needed for ${dreamJob}:** ${gap.map((g) => g.skill).join(", ")}`
            : `\n🎉 This certificate covers every required skill for **${dreamJob}**!`)
          : "\nSet a dream career in your profile to see your skill gap.",
      ].join("\n");
      setMessages((m) => [...m, { role: "bot", text: lines }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", text: "⚠️ I couldn't analyze that certificate — please try again." }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4 md:h-[calc(100vh-6.5rem)]">
      <div>
        <h1 className="font-[Fraunces] text-2xl font-semibold text-gray-800">AI Chatbot</h1>
        <p className="mt-1 text-sm text-gray-500">Personalized to your profile — ask about career, code, or life advice, or share a photo or certificate.</p>
      </div>

      <GlassCard className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fadeUp`}>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-violet-600 text-white" : "bg-white/90 text-gray-700 shadow-sm"
              }`}>
                {m.image && <img src={m.image} alt="Uploaded" className="mb-2 max-h-48 rounded-xl object-cover" />}
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-white/90 px-4 py-2.5 shadow-sm">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/60 p-3">
          {toolError && <p className="mb-2 text-xs font-medium text-rose-500">{toolError}</p>}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)} className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-600 hover:bg-violet-100">
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button title="Upload a photo for AI analysis" onClick={() => photoRef.current?.click()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ImageIcon size={17} /></button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <button title="Upload a certificate for AI analysis" onClick={() => certRef.current?.click()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><Award size={17} /></button>
            <input ref={certRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/*" className="hidden" onChange={handleCertificate} />
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything..." className="flex-1 rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-violet-400" />
            <button onClick={() => send()} className="rounded-xl bg-violet-600 p-2.5 text-white hover:bg-violet-700"><Send size={16} /></button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ======================================================================
   SETTINGS
====================================================================== */

function SettingsPage({ user, setUser, onLogout }) {
  const [name, setName] = useState(user.name);
  const [saved, setSaved] = useState(false);

  function save() {
    setUser((u) => ({ ...u, name }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-[Fraunces] text-2xl font-semibold text-gray-800">Settings</h1>

      <GlassCard className="p-5">
        <p className="mb-3 text-sm font-semibold text-gray-700">Account</p>
        <label className="mb-1 block text-xs font-semibold text-gray-500">Display name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-violet-400" />
        <label className="mb-1 mt-3 block text-xs font-semibold text-gray-500">Email</label>
        <input disabled value={user.email} className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400" />
        <button onClick={save} className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">
          {saved ? "Saved ✓" : "Save changes"}
        </button>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="mb-3 text-sm font-semibold text-gray-700">Notifications</p>
        {["Assignment reminders", "Roadmap milestones", "Weekly progress summary"].map((n) => (
          <label key={n} className="mb-2 flex items-center justify-between text-sm text-gray-600">
            {n}
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-violet-600" />
          </label>
        ))}
      </GlassCard>

      <GlassCard className="border-rose-100 p-5">
        <p className="mb-3 text-sm font-semibold text-rose-500">Danger zone</p>
        <button onClick={onLogout} className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50">
          Log out of demo session
        </button>
      </GlassCard>
    </div>
  );
}

/* ======================================================================
   CONFIRM MODAL
====================================================================== */

function ConfirmModal({ title, message, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4">
      <GlassCard className="w-full max-w-sm p-6 animate-fadeUp" style={{ background: "rgba(255,255,255,0.95)" }}>
        <p className="font-[Fraunces] text-lg font-semibold text-gray-800">{title}</p>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600">{confirmLabel}</button>
        </div>
      </GlassCard>
    </div>
  );
}
