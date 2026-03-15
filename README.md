# 🛡️ PhishGuard AI

An AI-powered web phishing and vulnerability detector built with React and Python Flask.

**Live Demo:** https://osho20.github.io/osho-s-phishguardai

---

## 🚀 Features

- 🤖 **AI Analysis** — Uses Google Gemini AI to detect phishing patterns
- 🔐 **SSL/HTTPS Check** — Detects unencrypted connections
- 🌐 **Domain Age Check** — Flags newly registered suspicious domains
- 🚨 **XSS Detection** — Identifies cross-site scripting patterns
- 💉 **SQL Injection Detection** — Detects SQL injection indicators
- 📊 **Risk Scoring** — 0-100 risk score with color-coded results
- 📄 **PDF Reports** — Download detailed scan reports
- 📈 **Scan Statistics** — Track your scanning history
- 📱 **Mobile Friendly** — Works on all devices

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python Flask |
| AI | Google Gemini API |
| Deployment | GitHub Pages + Render |
| PDF Generation | ReportLab |

---

## 🏗️ Project Structure
```
phishguard-ai/          ← React Frontend
phishguard-backend/     ← Python Flask Backend
```

---

## ⚙️ How It Works

1. User enters a URL
2. Frontend sends it to Flask backend via API
3. Backend checks HTTPS, domain age, page content, XSS, SQL injection
4. Gemini AI analyses all collected data
5. Risk score + detailed report returned to frontend
6. User can download a PDF report

---

## 👨‍💻 Built By

**Osho** — B.Tech 3rd Year  
Crafted with 💙 using React + Python
