# Scotland Data Architecture Advisor

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Opus_4.6-AWS_Bedrock-blue?style=for-the-badge" alt="Claude Opus 4.6" />
  <img src="https://img.shields.io/badge/TOGAF_9.2-Aligned-navy?style=for-the-badge" alt="TOGAF 9.2" />
  <img src="https://img.shields.io/badge/FAIR_Principles-DCAT--AP_3-teal?style=for-the-badge" alt="FAIR" />
  <img src="https://img.shields.io/badge/UK_GDS-Aligned-003399?style=for-the-badge" alt="UK GDS" />
</p>

> An **AI-powered enterprise data architecture platform** aligned to the Scottish Government design system. Assess data architecture maturity through an adaptive AI interview, analyse architecture diagrams for gaps, and generate consulting-grade reports — all powered by Claude Opus 4.6 via AWS Bedrock.

---

## Features

### AI Maturity Assessment
A structured interview conducted by an AI architect persona (TOGAF 9.2 + DAMA-DMBOK 2 + UK GDS certified). Covers **8 domains** and **19 dimensions** through 14–20 adaptive exchanges, producing a full consulting report with maturity scores, risk heatmap, roadmap, and recommendations.

- Adaptive follow-up questions based on your answers
- Typed interactions: sliders, yes/no, multiple choice, free text
- Live intelligence panel updating in real time (FAIR scores, domain coverage, insight feed, architecture patterns)
- Open-source first recommendations with AWS/Azure/GCP equivalents
- Aligned to DCAT-AP 3, FAIR Principles, Cyber Essentials Plus, ISO 27001, GDS service standards

### Data Architecture Gap Analysis
Upload an architecture diagram image and Claude Vision analyses it across **18 architectural categories**. Answer clarifying questions to refine the analysis, then generate a streaming consulting-grade report.

- Drag-and-drop diagram upload (PNG, JPG, GIF, WebP)
- Gaps classified by severity: Critical / High / Medium / Low
- FAIR scores and standards alignment updated after each answer
- Three-panel review: diagram + severity summary / gap cards + clarifying questions / FAIR & standards metrics
- Three-phase improvement roadmap (Foundations → Stabilise → Scale)
- Print / Save PDF export

### AWS Cost Designer
Interactive cost estimation tool for AWS data platform components.

---

## Architecture Domains Assessed

| Domain | What it covers |
|--------|----------------|
| **Business Goals** | Strategy, data vision, stakeholder needs, maturity ambition, KPIs |
| **Data Sources** | Source systems, data types, volumes, velocity, formats, quality at source |
| **Architecture** | Ingestion, processing, storage, integration patterns, current vs target |
| **Governance** | Policies, ownership, stewardship, classification, DCAT alignment |
| **Security** | RBAC, encryption, PII/GDPR/DPA 2018, audit, Cyber Essentials, ISO 27001 |
| **Analytics** | BI, self-service, ML/AI readiness, data products, consumption patterns |
| **Operations** | Monitoring, SLAs, reliability, CI/CD, environment management, incident |
| **Cost** | Attribution, cloud spend optimisation, lifecycle, budget governance |

## Maturity Dimensions (19)

Ingestion · Storage · Transformation · BI & Consumption · Catalogue & Metadata · Governance · Data Quality · Observability · Security & Compliance · Cost Efficiency · Lifecycle & Retention · Ownership Model · Data Contracts · CI/CD · Environments · Lineage · SLAs & Freshness · ML/AI Readiness · Cloud & Portability

## Gap Analysis Categories (18)

Ingestion · Storage · Transformation · Governance · Quality · Security · Lineage · Catalogue · Observability · CI/CD · Analytics · ML/AI · Cost · Interoperability · Cloud Portability · Data Contracts · Environments · Operating Model

---

## Standards Alignment

| Standard | Coverage |
|----------|----------|
| **TOGAF 9.2** | Architecture Vision, Business Architecture, Data Architecture, Technology Architecture (ADM phases) |
| **DAMA-DMBOK 2** | All 11 knowledge areas |
| **FAIR Principles** | Findable, Accessible, Interoperable, Reusable — scored 0–100 |
| **DCAT-AP 3** | Dataset/distribution registration, catalogue structure |
| **UK GDS / CDDO** | Service standard alignment, open standards |
| **Cyber Essentials Plus** | Security baseline checks |
| **ISO 27001** | Information security controls |

---

## Maturity Scale

| Score | Classification | Meaning |
|-------|---------------|---------|
| **< 2.0** | Ad hoc | Capability absent, manual, or undocumented |
| **2.0 – 2.9** | Developing | Inconsistent practices, person-dependent |
| **3.0 – 3.9** | Managed | Documented and used for key datasets |
| **4.0 – 4.5** | Advanced | Standardised, measured, embedded |
| **> 4.5** | Optimised | Automated, continuously improved |

Target posture: **4.2** across all dimensions.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI components |
| **TypeScript 5** | Type safety |
| **Vite 7** | Build tooling |
| **Tailwind CSS 3** | Scottish Government design system colours |
| **Recharts** | Maturity radar, bar charts, risk heatmap |
| **Lucide React** | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 20 / Express** | API server |
| **AWS Bedrock** | Claude Opus 4.6 (`anthropic.claude-opus-4-6-v1`, eu-west-2) |
| **AWS SDK v3** | `ConverseCommand` (structured JSON) + `ConverseStreamCommand` (SSE) |
| **Server-Sent Events** | Real-time streaming for chat and report generation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Multi-stage builds for frontend and backend |
| **Nginx** | Static file serving + reverse proxy to backend API |
| **AWS EC2** | Hosting in eu-west-2 |
| **IAM Instance Role** | Bedrock authentication — no hard-coded credentials |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/assess/message` | AI assessment turn (structured JSON) |
| `POST` | `/api/narrative` | Generate executive narrative (streaming SSE) |
| `POST` | `/api/roadmap` | Generate three-phase roadmap |
| `POST` | `/api/chat` | Post-assessment chat (streaming SSE) |
| `POST` | `/api/gap/analyse` | Claude Vision diagram analysis |
| `POST` | `/api/gap/refine` | Update gap analysis after clarifying answer |
| `POST` | `/api/gap/report` | Generate full gap report (streaming SSE) |

---

## Run Locally

### Prerequisites
- Node.js 20+
- AWS credentials with Bedrock access in `eu-west-2`
- Model access enabled: `anthropic.claude-opus-4-6-v1`

### Frontend
```bash
git clone https://github.com/masoodalam/data-architecture-advisor.git
cd data-architecture-advisor
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
AWS_REGION=eu-west-2 BEDROCK_MODEL_ID=anthropic.claude-opus-4-6-v1 node server.js
```

---

## Deploy with Docker

```bash
# Create bridge network so nginx can resolve the backend hostname
docker network create advisor-net

# Build and run backend
docker build -t advisor-backend ./backend
docker run -d --name backend --network advisor-net \
  -e AWS_REGION=eu-west-2 \
  -e BEDROCK_MODEL_ID=anthropic.claude-opus-4-6-v1 \
  advisor-backend

# Build and run frontend
docker build -t advisor-frontend .
docker run -d --name advisor-frontend --network advisor-net \
  -p 80:80 advisor-frontend
```

Or use the included `deploy.sh` for the full build-and-restart sequence on EC2.

---

## IAM Permissions Required

The EC2 instance role needs:

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": "arn:aws:bedrock:eu-west-2::foundation-model/anthropic.claude-opus-4-6-v1"
}
```

---

## Repository Structure

```text
├── backend/
│   ├── routes/
│   │   ├── ai.js               # Narrative, roadmap, post-assessment chat
│   │   ├── assessmentChat.js   # AI assessment interview (TOGAF/FAIR/DCAT persona)
│   │   └── gapAnalysis.js      # Vision analysis, refine, streaming report
│   └── server.js               # Express app
├── src/
│   ├── components/             # Shared UI, charts, heatmap
│   ├── data/                   # Question bank, tool mappings
│   ├── logic/                  # Scoring, recommendations, maturity model
│   ├── pages/
│   │   ├── LandingPage.tsx         # Scottish Gov hero + nav
│   │   ├── AssessmentChatPage.tsx  # Three-panel AI interview
│   │   ├── GapAnalysisPage.tsx     # Diagram upload + gap review + report
│   │   ├── ReportPage.tsx          # Full maturity report
│   │   └── AwsCostDesignerPage.tsx
│   ├── services/
│   │   ├── aiService.ts        # Assessment + chat API calls + types
│   │   └── gapService.ts       # Gap analysis API calls + types
│   └── types/                  # Shared TypeScript types
├── Dockerfile                  # Multi-stage frontend build (node builder + nginx)
├── nginx.conf                  # Static files + /api proxy to backend container
└── deploy.sh                   # EC2 Docker deployment script
```

---

## Limitations

- **Self-assessed maturity**: Scores reflect answers provided, not an independent audit.
- **Point-in-time**: Report reflects current state at time of assessment.
- **AWS Bedrock region**: Configured for `eu-west-2`. Cross-region inference profiles may be blocked by organisational SCPs.
- **Image size**: Gap analysis supports images up to ~8 MB (10 MB body limit).
- **Vision accuracy**: Diagram analysis quality depends on image clarity and label legibility.
