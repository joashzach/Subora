# 💳 Subora

A clean, modern subscription tracking web app that helps users **monitor, analyze, and optimize recurring expenses**. Built with a focus on **minimal UI, clarity, and actionable insights**.

---

## ✨ Features

### 📊 Dashboard (Instant Clarity)
- Total monthly spend (primary metric)
- % change vs last month
- Total active subscriptions
- Upcoming payments (next 3–5 charges with due indicators)
- Spending signals (detect unusual changes)

---

### 🧾 Subscriptions (Control & Management)
- View all subscriptions with:
  - Logo (via API integration)
  - Name, cost, billing cycle, next charge
- Add / edit / manage subscriptions
- Consistent card-based UI with shared design system
- Search and filter support

---

### 📈 Analytics (Insights & Optimization)
- Spending trend (line chart)
- Category breakdown (donut chart)
- Category spend summary
- Annual projection & average spend insights
- Top expenses (highest-cost subscriptions)
- Optimization insights:
  - Cancel to save ₹X
  - Downgrade suggestions
  - Duplicate detection
- Filters (time range + category)

---

### 👤 Profile & Personalization
- Avatar support (auto-fetch from email/OAuth if available)
- Fallback to initials if no image
- Theme preferences (light/dark)
- Notification & currency settings

---

## 🎨 Design Principles

- Minimal, professional UI (non “AI-generated” look)
- Strong visual hierarchy
- Consistent typography (Inter / SF Pro)
- Card-based layout with soft shadows
- Strict spacing system (8px grid)
- Logo-first subscription recognition

---

## 🛠 Tech Stack (Suggested)

- **Frontend:** React / Next.js  
- **Styling:** Tailwind CSS  
- **Backend:** Node.js (Express / NestJS)  
- **Database:** PostgreSQL  
- **Auth:** JWT + OAuth (Google, Apple)  
- **APIs:** Subscription logo API, financial integrations (optional)  

---

## 🔐 Authentication

- Email + password login  
- OAuth support (Google, Apple)  
- JWT-based authentication  
- Multi-device session support  

---

## 📦 Installation

```bash
git clone https://github.com/your-username/subscription-tracker.git
cd subscription-tracker
npm install
npm run dev
