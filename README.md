<div align="center">

<img src="https://img.shields.io/badge/Google%20Solution%20Challenge-2026-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/Status-Live%20MVP-10B981?style=for-the-badge" />
<img src="https://img.shields.io/badge/Firebase-Deployed-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />

# 🤝 Needyfy
### AI-Powered Smart Volunteer Coordination Platform

**Connecting NGOs with the right volunteers at the right time — built for India.**

[🌐 Live App]([https://needyfy.web.app](https://needyfy-q1pk.vercel.app/
)<img width="482" height="62" alt="image" src="https://github.com/user-attachments/assets/c1046e19-1f47-4c04-aa1c-378b6fd4ddbf" />
) · [📽️ Demo Video]([#](https://www.youtube.com/watch?v=dODQbE6-Kto
)<img width="635" height="56" alt="image" src="https://github.com/user-attachments/assets/7e092d05-6307-45f1-bf72-c4d1a5ee53da" />
) · 

</div>

---

## 🚨 The Problem

NGOs in India struggle to coordinate volunteers efficiently:

- 📋 **Paper surveys never digitized** — community need data sits unprocessed
- ⏰ **4–6 hours of delay** — manual WhatsApp coordination is too slow for emergencies
- 🔍 **No real-time visibility** — volunteers don't know where help is needed
- ❌ **Wrong matches** — volunteers assigned randomly, not by skill or location

> **Needyfy reduces volunteer coordination time from 4–6 hours → under 30 minutes.**

---

## 💡 Solution

Needyfy is a full-stack web platform that uses **Gemini Vision AI** to extract structured data from paper surveys and PDFs, automatically identifies community needs, scores urgency, and matches the right volunteers — replacing fragmented WhatsApp groups with intelligent automation.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Survey Scanner** | Upload photo/PDF → Gemini extracts Location, Urgency, Category, Skills Needed |
| ⚡ **Smart Volunteer Matching** | AI matches volunteers by skills + location; instant notifications |
| 🗺️ **Real-Time Urgency Heatmap** | Google Maps with color-coded pins by category and urgency |
| 📊 **NGO Dashboard** | Live Firebase stats: Needs, Volunteers, Tasks Done, Urgent count |
| 📋 **Kanban Task Board** | Drag-and-drop: Open → Assigned → In Progress → Completed |
| 👤 **Volunteer Portal** | Browse tasks, accept, complete; tracks impact score & streak |
| 📈 **Analytics Dashboard** | Weekly charts, category breakdown, resolution rate, leaderboard |
| 🌐 **Multi-language OCR** | Works with Hindi, English, regional languages; handles blurry/handwritten photos |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND LAYER                             │
│   Next.js 16 + TypeScript  │  Firebase App Hosting      │
│   NGO Dashboard  │  Volunteer Portal  │  Auth Pages     │
└────────────────────┬────────────────────────────────────┘
                     │ API Calls ↕
┌────────────────────▼────────────────────────────────────┐
│              BACKEND / API LAYER                        │
│   Next.js API Routes  │  Firebase Auth (Role-based)     │
│   /api/extract → Gemini Vision AI processing            │
│   Firebase Firestore  │  Firebase Storage               │
└───────┬─────────────────────────┬───────────────────────┘
        │ Integrations ↕          │
┌───────▼──────────┐   ┌──────────▼──────────────────────┐
│  GOOGLE AI LAYER │   │       DATA LAYER                 │
│  Gemini 2.5 Flash│   │  Firestore: needs │ users        │
│  Multimodal AI   │   │  Firebase Storage: survey images │
│  Structured JSON │   │  Region: asia-southeast1         │
└──────────────────┘   └──────────────────────────────────┘
        │
┌───────▼──────────┐
│  GOOGLE MAPS     │
│  Heatmap Layer   │
│  Marker Pins     │
└──────────────────┘
```

---

## 🛠️ Tech Stack

### Google / AI Services
- **Gemini 2.5 Flash API** — Multimodal AI (Vision + Text extraction)
- **Google Maps JavaScript API** — Heatmap + location visualization
- **Firebase Authentication** — Role-based login (NGO / Volunteer)
- **Firebase Firestore** — Real-time NoSQL database
- **Firebase Storage** — Survey image/PDF storage
- **Firebase App Hosting** — Cloud Run deployment (Google Cloud)

### Frontend
- **Next.js 16.2** (App Router + Turbopack)
- **TypeScript** — Type-safe development
- **Tailwind CSS v4** — Utility-first styling
- **Framer Motion** — Animations
- **Lucide React** — Icons

### Libraries
- `@google/generative-ai` — Gemini SDK
- `@react-google-maps/api` — Maps integration
- `firebase v12` — Full Firebase SDK
- `react-hot-toast` — Notifications

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI
- Google Cloud project with Gemini API + Maps API enabled

### 1. Clone the repository
```bash
git clone https://github.com/SakshiHanwat/Needyfy.git
cd Needyfy
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Firebase
```bash
firebase login
firebase deploy
```

---

## 📱 How It Works

```
📷 NGO uploads survey photo/PDF
         ↓
🤖 Gemini Vision AI reads the image
   • Extracts: Location, Category, People Affected, Urgency Score
   • Supports: Hindi / English / Regional languages
   • Works with: Blurry, handwritten, angled photos
         ↓
📊 Structured JSON saved to Firebase
   • Auto-appears on Dashboard + Heatmap
   • Task created in Kanban board
         ↓
⚡ AI matches volunteers by skill + location
   • Push notifications sent instantly
         ↓
✅ Volunteer accepts & completes task
   • Impact tracked in Analytics Dashboard
```

---

## 💸 Cost Breakdown (MVP — Free Tier)

| Service | Usage | Cost |
|---|---|---|
| Firebase App Hosting | Spark Plan | ✅ Free |
| Firebase Firestore | 50K reads/day | ✅ Free |
| Firebase Storage | 5 GB | ✅ Free |
| Gemini 2.5 Flash API | Free tier | ✅ Free |
| Google Maps API | $200/month credit | ✅ Free |
| **Total MVP** | | **~$0/month** |

---

## 🗺️ Roadmap

**Phase 1 — Immediate (0–3 months)**
- [ ] Push Notifications (browser + email)
- [ ] WhatsApp Business API integration
- [ ] PWA Offline Mode

**Phase 2 — Growth (3–6 months)**
- [ ] Multi-city expansion (50+ Indian cities)
- [ ] AI Auto-Assignment (no NGO intervention needed)
- [ ] Aadhaar-based Volunteer Verification
- [ ] Full Hindi UI

**Phase 3 — Scale (6–12 months)**
- [ ] NDMA Government API integration
- [ ] NGO Network (shared volunteer pool)
- [ ] Auto-generated PDF Impact Reports
- [ ] React Native Mobile App

---

## 🎯 Social Impact Goal

> **500 NGOs · 50,000 Volunteers · 1 Million People Helped by 2026**

---

## 👩‍💻 Team

| Role | Name |
|---|---|
| Team Leader & Developer | **Sakshi Hanwat** |
| Institution | SKC Lakshmi Narain College of Technology and Science, Indore |
| Event | Google Solution Challenge 2026 |

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ for India · Google Solution Challenge 2026

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-needyfy.web.app-4285F4?style=flat-square)](https://needyfy.web.app)
[![GitHub](https://img.shields.io/badge/GitHub-SakshiHanwat-181717?style=flat-square&logo=github)](https://github.com/SakshiHanwat/Needyfy)

</div>
