# Data Architecture Advisor

<p align="center">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64" width="120" height="80" role="img" aria-label="Data Architecture Advisor logo">
    <rect width="96" height="64" rx="8" fill="#111827"/>
    <path d="M18 18h18v12H18zM60 18h18v12H60zM39 40h18v12H39z" fill="#0f766e"/>
    <path d="M36 24h24M48 30v10" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
  </svg>
</p>

> A **free, open-source, browser-based** enterprise tool for assessing data architecture maturity and generating practical recommendations across open source tooling, AWS services, governance, data quality, security, cost, operating model, and roadmap improvements. No assessment data leaves your browser.

[![React](https://img.shields.io/badge/React-19-blue.svg)](#tech-stack)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](#tech-stack)
[![Client-side only](https://img.shields.io/badge/backend-none-lightgrey.svg)](#privacy)
[![No tracking](https://img.shields.io/badge/tracking-none-green.svg)](#privacy)

---

## Try it now

**[-> Launch Data Architecture Advisor](https://masoodalam.github.io/data-architecture-advisor/)**

The tool works entirely in your browser. No login, no account, no server-side data collection.

---

## What it assesses

The assessment scores your organisation across **19 data architecture maturity dimensions**, each on a 1-5 maturity scale:

| Dimension | What it covers |
|-----------|----------------|
| **Ingestion** | Source inventory, ingestion automation, batch and streaming patterns |
| **Storage** | Raw, curated, and consumption layers; warehouse and lake architecture |
| **Transformation** | Reusable transformation standards, testing, dbt and AWS Glue suitability |
| **BI and consumption** | Trusted reporting datasets, governed self-service analytics |
| **Catalogue and metadata** | DataHub adoption, dataset discovery, ownership, metadata completeness |
| **Governance** | Naming standards, schema standards, business glossary, MetaWorks usage |
| **Data quality** | Great Expectations checks, validation visibility, advanced quality rules |
| **Observability** | Pipeline alerts, freshness, completeness, accuracy, and timeliness monitoring |
| **Security and compliance** | Access controls, audit trails, sensitive data, GDPR readiness |
| **Cost efficiency** | Cost optimisation, serverless fit, managed service efficiency |
| **Lifecycle and retention** | Retention, archival, deletion, and lifecycle automation |
| **Ownership model** | Business owners, stewards, escalation paths, operating model clarity |
| **Data contracts** | Producer-consumer contracts, schema evolution, breaking change control |
| **CI/CD** | Version control, automated tests, release promotion for data pipelines |
| **Environment management** | Dev, test, staging, production separation and controlled promotion |
| **Lineage** | Source-to-dashboard lineage and column-level impact analysis |
| **SLAs and freshness** | Critical dataset SLAs, SLIs, freshness targets, and visibility |
| **ML/AI readiness** | Governed training data, feature readiness, AI-ready curated zones |
| **Cloud and portability** | AWS adoption readiness, vendor lock-in risk, open formats, portability |

---

## How it works

1. **Organisation context** - captures the organisation or programme name and preferred recommendation mode: open source heavy, hybrid, or AWS managed.
2. **Assessment sections** - guides users through 24 sections covering architecture, governance, quality, security, cost, delivery, ownership, lifecycle, AI readiness, and cloud posture.
3. **Maturity scoring** - scores responses from 1.0 to 5.0 across each dimension and calculates an overall maturity score.
4. **Recommendation engine** - maps low-scoring dimensions to practical actions and tool recommendations including DataHub, Great Expectations, MetaWorks, Amazon S3, Amazon Redshift, AWS Glue, AWS Lambda, Step Functions, Amazon Kinesis, Apache Airflow, dbt, Superset or Metabase, Prometheus and Grafana, ClickHouse, and Airbyte.
5. **Consulting report** - generates an in-browser report with executive summary, maturity classification, radar chart, bar chart, risk heatmap, current vs target architecture, open source vs AWS comparison, priority matrix, roadmap, and cost vs complexity view.
6. **Print/export** - use the browser print action to export the report as PDF.

---

## Privacy

- **All computation happens in your browser.** Answers, scores, and report content are not transmitted to an application server.
- The only persistence used by the app is **`localStorage`**, local to your browser.
- You can clear saved answers at any time using the **Restart** action.
- There are **no cookies, no analytics, no tracking pixels**, and no backend API.
- The production app is a static GitHub Pages deployment.

---

## Methodology

The tool uses a pragmatic 1-5 maturity scale:

| Score | Level | Meaning |
|-------|-------|---------|
| **1** | Not in place | Capability is absent, manual, or undocumented |
| **2** | Informal | Some practices exist but are inconsistent or person-dependent |
| **3** | Defined | Practices are documented and used for key datasets or workflows |
| **4** | Standardised | Practices are standardised, measured, and embedded into delivery |
| **5** | Optimised | Capability is automated, continuously improved, and widely adopted |

Overall maturity is classified as:

| Score range | Classification |
|-------------|----------------|
| **1.0 to 1.9** | Ad hoc |
| **2.0 to 2.9** | Developing |
| **3.0 to 3.9** | Managed |
| **4.0 to 4.5** | Advanced |
| **4.6 to 5.0** | Optimised |

Recommendations are generated by comparing current maturity against a target posture, then mapping gaps to actions, governance controls, tooling options, AWS services, and a three-phase roadmap.

---

## Tech stack

| Technology | Purpose |
|------------|---------|
| **React** | Browser application UI |
| **Vite** | Build and development tooling |
| **TypeScript** | Typed business logic and components |
| **Tailwind CSS** | Responsive visual design |
| **Recharts** | Radar chart, bar chart, and matrix visualisations |
| **Lucide React** | UI icons |
| **GitHub Pages** | Static hosting |
| **GitHub Actions** | Automated deployment |

---

## Run locally

```bash
git clone https://github.com/masoodalam/data-architecture-advisor.git
cd data-architecture-advisor
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

To create a production build:

```bash
npm run build
npm run preview
```

---

## Deploy your own copy

### GitHub Pages

1. Fork this repository.
2. Go to **Settings -> Pages**.
3. Set Source to **GitHub Actions**.
4. Push to `main`.
5. The workflow builds the Vite app and publishes the `dist` artifact.

Your fork will be live at:

```text
https://<your-username>.github.io/data-architecture-advisor/
```

### Any static host

Run `npm run build` and upload the generated `dist/` directory to any static host such as Netlify, Vercel, Cloudflare Pages, S3 + CloudFront, or an internal web server.

---

## Customise for your context

Most business content is separated from UI components and lives in `src/data` and `src/logic`.

| File | What to edit |
|------|--------------|
| `src/data/questionBank.ts` | Assessment sections, questions, options, and scoring dimensions |
| `src/data/toolMappings.ts` | Required tools, AWS services, and architecture mode guidance |
| `src/logic/scoringEngine.ts` | Dimension aggregation, overall scoring, and risk heatmap logic |
| `src/logic/recommendationEngine.ts` | Recommendation rules, actions, priorities, and tool mappings |
| `src/logic/maturityModel.ts` | Dimension labels, classification, and maturity narrative |
| `src/logic/reportBuilder.ts` | Executive summary, architecture comparison, and report helper content |

---

## Repository structure

```text
src/
  components/       Shared UI, charts, diagrams, heatmap
  data/             Question bank and tool mappings
  logic/            Scoring, recommendations, maturity model, report builder
  pages/            Landing, assessment, and report pages
  types/            Shared TypeScript types
  utils/            Browser storage helpers
```

---

## Contributing

Contributions are welcome. Useful areas include:

- Additional assessment questions
- More detailed recommendation rules
- Sector-specific scoring guidance
- Accessibility improvements
- More export formats
- Additional architecture modes
- Better examples for AWS, open source, and hybrid target architectures

---

## Roadmap

### v1 (current)

- 24-section assessment flow
- 19 maturity dimensions
- Open source heavy, hybrid, and AWS managed recommendation modes
- DataHub, Great Expectations, and MetaWorks focused recommendations
- AWS service recommendations for S3, Redshift, Glue, Lambda, Step Functions, and Kinesis
- Radar chart, bar chart, risk heatmap, priority matrix, roadmap, and architecture diagram
- Print-friendly report export
- localStorage persistence
- GitHub Pages deployment

### Planned for v1.1

- Markdown or JSON report export
- Previous assessment comparison mode
- Weighted scoring by organisation context
- Sector-specific templates
- Expanded tool catalogue
- Accessibility audit and keyboard flow improvements

---

## Limitations

- **Self-assessed:** Scores reflect the answers provided by users, not an independent audit.
- **Point-in-time snapshot:** The report reflects current state at the time the assessment is completed.
- **Simplified scoring:** The maturity model is intentionally practical and should be calibrated for regulated or highly complex environments.
- **Browser storage only:** Saved answers are tied to the local browser and device.
- **No LLM generation:** Recommendations are generated from deterministic rules, not dynamic AI output.

---

## Acknowledgements

- **DataHub** for open metadata and catalogue patterns.
- **Great Expectations** for executable data quality checks.
- **MetaWorks** for standards catalogue thinking.
- **AWS** services including Amazon S3, Amazon Redshift, AWS Glue, AWS Lambda, Step Functions, and Amazon Kinesis.
- **Apache Airflow**, **dbt**, **Apache Superset**, **Metabase**, **Prometheus**, **Grafana**, **ClickHouse**, and **Airbyte** for portable data platform capabilities.
- **React**, **Vite**, **Tailwind CSS**, and **Recharts** for the browser app foundation.
