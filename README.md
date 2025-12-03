# 🔍 License & Dependency Health Visualizer

[![License Health](https://img.shields.io/badge/License%20Health-Analyzer-✅)](https://github.com/prady4the4bady/dep-health-visualizer)
[![Dependency Scan](https://img.shields.io/badge/Dependency-Scanner-blue)](https://github.com/prady4the4bady/dep-health-visualizer)
[![Health Score](https://img.shields.io/badge/Health-Score-orange)](https://github.com/prady4the4bady/dep-health-visualizer)

## 📌 Problem

Teams need comprehensive dependency audits for:

- 🔒 **License risk** assessment
- 📅 **Release health** monitoring
- ⚠️ **Abandoned packages** detection
- 🛡️ **Simple vulnerability signals**

## 🎯 Solution

A web tool that analyzes dependencies and provides:

- 📋 **Visual license/dependency scanning**
- 📊 **Health score generation**
- 📈 **Interactive dashboard**
- 📄 **Exportable audit reports**

## 🧠 MVP Features

- 🔍 Visual license/dependency scan interface
- 📤 Export summary reports
- 📊 Interactive health dashboard
- 🔗 GitHub repository integration

## 📦 Sample Output (audit.json)

```json
{
  "dependency": "express",
  "license": "MIT",
  "last_release": "2024-11-15",
  "health_score": 8.7,
  "vulnerabilities": [],
  "maintainers": 4,
  "stars": 62000
}
```

## ✅ Success Metrics

- 📈 **Legal visibility increased** for repositories
- 🔄 **Upgrade suggestions** provided
- 📊 **Health scores** generated for all dependencies
- 📋 **Audit reports** exported successfully

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/prady4the4bady/dep-health-visualizer.git
cd dep-health-visualizer

# Start the application
docker-compose up -d

# Open in browser
open http://localhost:3000
```

## 🏗️ Architecture

```
dep-health-visualizer/
├── frontend/              # React dashboard
├── backend/               # Node.js API server
├── docker-compose.yml     # Container orchestration
├── nginx.conf            # Reverse proxy config
└── README.md             # This file
```

## 🛠️ Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### Manual Setup

```bash
# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm start

# Database setup
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

## 📊 Dashboard Features

- 🔍 **Repository Analysis**: Input GitHub URL or upload package.json
- 📋 **License Overview**: Visual breakdown of all dependency licenses
- 📅 **Release Timeline**: Last release dates and update frequency
- ⚠️ **Risk Assessment**: Color-coded health scores
- 📤 **Export Reports**: JSON/CSV audit reports

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/license-scanner`)
3. Commit changes (`git commit -m 'Add license scanning'`)
4. Push branch (`git push origin feature/license-scanner`)
5. Open Pull Request

### Development Ideas

- [ ] Add GitHub API integration for repository analysis
- [ ] Implement license compatibility checking
- [ ] Create vulnerability database integration
- [ ] Add CI/CD pipeline scanning
- [ ] Build mobile-responsive dashboard

## 📈 API Endpoints

```
POST /api/analyze          # Analyze dependencies
GET  /api/reports/:id      # Get audit report
GET  /api/health/:package  # Package health info
POST /api/export           # Export audit data
```

## 🔧 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **Analysis**: npm audit, license-checker, GitHub API
- **Deployment**: Docker, nginx

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for secure and healthy open source ecosystems**</content>
<parameter name="filePath">c:\Users\prady\Desktop\Sideprojects\DepHealthVisualizer\README.md