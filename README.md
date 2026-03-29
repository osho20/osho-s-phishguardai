# 🛡️ PhishGuard AI

An AI-powered web phishing and vulnerability detector.

**Live Demo:** https://osho20.github.io/osho-s-phishguardai

---

## 🚀 Features

### 🔍 Vulnerability Detection
- SQL Injection Detection
- XSS (Cross-Site Scripting) Detection
- Command Injection Detection
- Directory Traversal Detection
- LFI/RFI Detection
- Open Redirect Detection
- Security Header Analysis
- Sensitive Data Exposure Detection

### 🌐 Target Discovery
- Full Website Crawler
- Form & Parameter Detection
- JavaScript Endpoint Discovery
- Subdomain Discovery
- DNS Record Enumeration
- Open Port Detection
- Technology Stack Detection
- robots.txt & sitemap.xml Parsing

### 📊 Analysis & Reporting
- AI-Powered Analysis (Google Gemini)
- Risk Scoring (0-100)
- Threat Severity Levels (Critical/High/Medium/Low)
- PDF Report Export
- 📧 Email Report Feature
- Compare Two URLs Side by Side
- Persistent Scan History
- Scan Statistics Dashboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python Flask |
| AI | Google Gemini API |
| Email | EmailJS |
| Deployment | GitHub Pages + Render |
| PDF | ReportLab |

---

## ⚙️ How It Works

1. User enters a URL
2. Frontend sends it to Flask backend
3. Backend runs 15+ security checks
4. Gemini AI analyses all data
5. Risk score + severity returned
6. User can download PDF or email report

---

## 👨‍💻 Built By

**Osho** — B.Tech 3rd Year  
Crafted with 💙 using React + Python
```

Save **Ctrl+S** then:
```
git add .
git commit -m "Updated README with all features"
git push