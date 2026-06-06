# MedicoAI Learn 🩺

> AI-powered medical education platform built exclusively for MBBS & BDS students.

[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://79936f76-94cb-491d-a125-cdcd1c34645b.lovableproject.com)
[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-purple)](https://lovable.dev)

## 🚀 Features

### Learn
- 🤖 **AI Summarizer** — paste any medical text, get instant summary
- 🎤 **Lecture Recorder** — record & auto-transcribe lectures
- 📝 **Topic Recap** — on-demand AI recap of any topic
- 💬 **Ask a Doubt** — instant AI answers to any medical question
- 📋 **Study Notes** — personal notes with AI assistance
- 📅 **Study Plan** — AI-generated personalized weekly schedule
- 💊 **Formula Sheet** — subject-wise formulas & mnemonics

### Practice
- 🧠 **Daily Quiz & Daily Challenge** — fresh AI-generated MCQs every day
- 📖 **PYQ Practice** — previous year questions with explanations
- 🏥 **Clinical Cases** — real-world case simulations
- ✅ **OSCE Checklists** — structured clinical station practice
- 🎙️ **Viva Practice** — AI oral exam simulator
- 🔬 **Diagram Quiz** — identify anatomical & clinical diagrams
- 📚 **Mock Exam** — full-length timed exams with analytics
- ⚠️ **Weak Area Drill** — AI targets your weakest topics

### Track
- 📓 **Mistake Journal** — logs every wrong answer for revision
- 🗂️ **Flashcards** — spaced repetition for high-yield facts
- 🏆 **XP & Gamification** — level up from Medical Fresher to Senior Resident
- 📊 **Analytics** — study heatmap, subject radar chart, progress tracking
- 🍅 **Pomodoro Timer** — built-in focus sessions
- 🎯 **Study Goals & Test Marks** — set targets, track real exam scores

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| UI Components | shadcn/ui + Tailwind CSS |
| Backend | Supabase Edge Functions |
| Database | Supabase (PostgreSQL) |
| AI Engine | Claude API (Anthropic) |
| Auth | Supabase Auth |
| Hosting | Lovable + Netlify |

## ⚙️ Setup

```bash
# Clone the repo
git clone https://github.com/ndp-coder/MedicoAI-Learn.git
cd MedicoAI-Learn

# Install dependencies
npm install

# Copy env file and fill in your keys
cp .env.example .env

# Run dev server
npm run dev
```

## 🔑 Environment Variables

See `.env.example` for required variables. You'll need:
- Supabase project URL and anon key
- Claude API key (set in Supabase Edge Function secrets)

## 📱 Supabase Edge Functions

All AI features run through Supabase Edge Functions:
- `generate-quiz` — daily quiz generation
- `generate-viva` — viva Q&A simulation  
- `generate-study-plan` — personalized schedule
- `generate-mock-exam` — full exam generation
- `generate-formula-sheet` — subject formulas
- `generate-recap` — topic recap
- `generate-drill` — weak area targeting
- `generate-case-study` — clinical cases
- `generate-diagram-quiz` — diagram identification
- `generate-pyq` — previous year questions
- `generate-recap-quiz` — revision quizzes
- `generate-progress-report` — analytics
- `generate-ocr` — image text extraction
- `chat` — doubt solver & AI summarizer

## 🏆 Built For

Google Hackathon 2026 — AI in Education track

---

Made with ❤️ for medical students across India
