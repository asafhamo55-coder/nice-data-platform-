"use client";

import { useState, type ReactNode } from "react";
import {
  Layers,
  GitBranch,
  Plug,
  ShieldCheck,
  Scale,
  FileText,
  ChevronDown,
  ChevronRight,
  Clock,
  Tag,
  ArrowRight,
  ArrowDown,
  Database,
  Workflow,
  BarChart3,
  Shield,
  Brain,
  Zap,
  Cpu,
  Server,
  Globe,
  Lock,
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface DocumentSection {
  id: string;
  title: string;
  icon: LucideIcon;
  version: string;
  lastUpdated: string;
  status: "active" | "draft" | "deprecated";
  changelog: { version: string; date: string; changes: string[] }[];
  content: ReactNode;
}

// ─── All 6 standards documents ──────────────────────────────────

const DOCUMENTS: DocumentSection[] = [
  // ─── 1. Data Platform Architecture ─────────────────────────
  {
    id: "architecture",
    title: "Data Platform Architecture",
    icon: Layers,
    version: "3.2",
    lastUpdated: "2026-03-01",
    status: "active",
    changelog: [
      {
        version: "3.2",
        date: "2026-03-01",
        changes: [
          "Added Unity Catalog as recommended governance layer",
          "Updated streaming tier to include Flink alongside Kafka",
          "Added cost optimization guidelines for cold storage",
        ],
      },
      {
        version: "3.1",
        date: "2026-01-15",
        changes: [
          "Introduced real-time serving layer for ML features",
          "Updated medallion architecture to include platinum layer for ML features",
        ],
      },
      {
        version: "3.0",
        date: "2025-11-01",
        changes: [
          "Major rewrite: migrated from Lambda to Medallion architecture",
          "Added data mesh principles for domain-oriented ownership",
        ],
      },
    ],
    content: <ArchitectureOverview />,
  },

  // ─── 2. Vendor Selection Decision Framework ───────────────
  {
    id: "vendor-selection",
    title: "Vendor Selection Decision Framework",
    icon: GitBranch,
    version: "2.1",
    lastUpdated: "2026-02-20",
    status: "active",
    changelog: [
      {
        version: "2.1",
        date: "2026-02-20",
        changes: [
          "Added security compliance gate (SOC2/GDPR/HIPAA)",
          "Updated total cost threshold from $500K to $750K",
          "Added multi-tenant isolation as mandatory requirement",
        ],
      },
      {
        version: "2.0",
        date: "2025-12-01",
        changes: [
          "Redesigned as flowchart-based decision tree",
          "Added build vs buy initial triage",
          "Introduced vendor tier classification",
        ],
      },
      {
        version: "1.0",
        date: "2025-06-15",
        changes: ["Initial vendor selection checklist"],
      },
    ],
    content: <VendorSelectionFramework />,
  },

  // ─── 3. Integration Standards ─────────────────────────────
  {
    id: "integration",
    title: "Integration Standards",
    icon: Plug,
    version: "2.0",
    lastUpdated: "2026-02-10",
    status: "active",
    changelog: [
      {
        version: "2.0",
        date: "2026-02-10",
        changes: [
          "Added GraphQL federation patterns",
          "Updated auth to require OAuth 2.1 over 2.0",
          "Added structured error response standard (RFC 9457)",
          "New: circuit breaker and retry policies",
        ],
      },
      {
        version: "1.5",
        date: "2025-09-01",
        changes: [
          "Added webhook delivery standards",
          "Updated rate limiting to token bucket algorithm",
        ],
      },
      {
        version: "1.0",
        date: "2025-04-01",
        changes: ["Initial REST API and authentication standards"],
      },
    ],
    content: <IntegrationStandards />,
  },

  // ─── 4. Quality Gates ─────────────────────────────────────
  {
    id: "quality-gates",
    title: "Quality Gates per Category",
    icon: ShieldCheck,
    version: "1.3",
    lastUpdated: "2026-03-10",
    status: "active",
    changelog: [
      {
        version: "1.3",
        date: "2026-03-10",
        changes: [
          "Added Reverse ETL quality gates",
          "Raised Data Quality minimum from 6.0 to 7.0",
          "Added latency SLA for Stream Processing",
        ],
      },
      {
        version: "1.2",
        date: "2026-01-20",
        changes: [
          "Added API Management and Data Security categories",
          "Introduced confidence threshold (0.6 minimum)",
        ],
      },
      {
        version: "1.0",
        date: "2025-08-01",
        changes: ["Initial quality gates for 8 core categories"],
      },
    ],
    content: <QualityGates />,
  },

  // ─── 5. Build vs Buy Decision Matrix ─────────────────────
  {
    id: "build-vs-buy",
    title: "Build vs Buy Decision Matrix",
    icon: Scale,
    version: "1.2",
    lastUpdated: "2026-02-28",
    status: "active",
    changelog: [
      {
        version: "1.2",
        date: "2026-02-28",
        changes: [
          "Added total cost of ownership model (3-year horizon)",
          "Updated scoring weights for operational burden",
          "Added hybrid option (build+buy) decision path",
        ],
      },
      {
        version: "1.1",
        date: "2025-11-15",
        changes: [
          "Added risk assessment dimensions",
          "Updated talent availability scoring",
        ],
      },
      {
        version: "1.0",
        date: "2025-07-01",
        changes: ["Initial build vs buy framework with 8 dimensions"],
      },
    ],
    content: <BuildVsBuyMatrix />,
  },

  // ─── 6. Document Changelog ────────────────────────────────
  {
    id: "changelog",
    title: "Version History & Changelog",
    icon: FileText,
    version: "—",
    lastUpdated: "2026-03-10",
    status: "active",
    changelog: [],
    content: null, // rendered inline from all documents
  },
];

// ─── Main Component ─────────────────────────────────────────────

export function StandardsHub() {
  const [activeDoc, setActiveDoc] = useState("architecture");

  const current = DOCUMENTS.find((d) => d.id === activeDoc);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-navy">Standards & Playbooks</h1>
        <p className="mt-1 text-navy-400">
          Versioned reference documents for NICE Data Platform architecture, vendor
          selection, integration patterns, and quality standards
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {DOCUMENTS.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setActiveDoc(doc.id)}
            className={cn(
              "nav-transition flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
              activeDoc === doc.id
                ? "bg-navy text-white shadow-sm"
                : "bg-white text-navy-500 border border-navy-100 hover:border-blue/20 hover:text-blue"
            )}
          >
            <doc.icon size={14} />
            <span className="hidden sm:inline">{doc.title}</span>
            <span className="sm:hidden">{doc.title.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Active document */}
      {current && (
        <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
          {/* Document header */}
          <div className="flex flex-col gap-4 border-b border-navy-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5">
                <current.icon className="h-5 w-5 text-blue" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">{current.title}</h2>
                <div className="mt-1 flex items-center gap-3">
                  {current.version !== "—" && (
                    <span className="flex items-center gap-1 text-[11px] text-navy-400">
                      <Tag size={10} />
                      v{current.version}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px] text-navy-400">
                    <Clock size={10} />
                    Updated {current.lastUpdated}
                  </span>
                  <StatusBadge status={current.status} />
                </div>
              </div>
            </div>

            {/* Changelog toggle for non-changelog docs */}
            {current.id !== "changelog" && current.changelog.length > 0 && (
              <ChangelogDropdown changelog={current.changelog} />
            )}
          </div>

          {/* Document body */}
          <div className="p-6">
            {current.id === "changelog" ? (
              <MasterChangelog />
            ) : (
              current.content
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-600",
    draft: "bg-amber-50 text-amber-600",
    deprecated: "bg-red-50 text-red-600",
  }[status] ?? "bg-navy-50 text-navy-400";

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", styles)}>
      {status}
    </span>
  );
}

function ChangelogDropdown({
  changelog,
}: {
  changelog: { version: string; date: string; changes: string[] }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="nav-transition flex items-center gap-1.5 rounded-lg border border-navy-100 px-3 py-1.5 text-[11px] font-medium text-navy-500 hover:border-blue/20 hover:text-blue"
      >
        <Clock size={12} />
        Changelog
        <ChevronDown size={12} className={cn("nav-transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-navy-100 bg-white p-4 shadow-lg">
          <div className="max-h-64 space-y-4 overflow-y-auto">
            {changelog.map((entry) => (
              <div key={entry.version}>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue">
                    v{entry.version}
                  </span>
                  <span className="text-[10px] text-navy-300">{entry.date}</span>
                </div>
                <ul className="mt-1.5 space-y-0.5">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-navy-500">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-navy-300" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-sm font-bold text-navy">{children}</h3>;
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-sm leading-relaxed text-navy-500">{children}</p>;
}

// ─── 1. Architecture Overview (Medallion) ───────────────────────

function ArchitectureOverview() {
  return (
    <div className="space-y-8">
      <Paragraph>
        NICE&apos;s data platform follows the Medallion Architecture pattern,
        organizing data into progressive layers of refinement. Each layer
        serves a distinct purpose and has specific quality expectations.
      </Paragraph>

      {/* Medallion Stack Visual */}
      <div className="space-y-3">
        <SectionTitle>Medallion Architecture Stack</SectionTitle>
        <div className="space-y-2">
          <MedallionLayer
            name="Platinum"
            subtitle="ML Feature Store & Serving"
            color="from-fuchsia-500 to-violet-600"
            description="Curated ML features, embeddings, and real-time serving vectors. Fed by gold layer, optimized for model inference."
            tools="Feast, Tecton, Databricks Feature Store"
            sla="< 50ms p99 for online serving"
          />
          <div className="flex justify-center"><ArrowDown size={16} className="text-navy-200 rotate-180" /></div>
          <MedallionLayer
            name="Gold"
            subtitle="Business-Ready / Semantic"
            color="from-amber-400 to-amber-600"
            description="Conformed dimensions, fact tables, business metrics. Single source of truth for BI and analytics. Schema-on-read with strong contracts."
            tools="dbt, Cube, AtScale, LookML"
            sla="< 4 hour refresh, 99.9% availability"
          />
          <div className="flex justify-center"><ArrowDown size={16} className="text-navy-200 rotate-180" /></div>
          <MedallionLayer
            name="Silver"
            subtitle="Cleansed & Conformed"
            color="from-slate-300 to-slate-500"
            description="Deduplicated, validated, and schema-enforced data. Type casting, null handling, PII masking, and referential integrity applied."
            tools="Spark, dbt, Great Expectations, Soda"
            sla="< 2 hour processing window"
          />
          <div className="flex justify-center"><ArrowDown size={16} className="text-navy-200 rotate-180" /></div>
          <MedallionLayer
            name="Bronze"
            subtitle="Raw Ingestion"
            color="from-orange-600 to-orange-800"
            description="Raw data as-is from source systems. Append-only, immutable, full history preserved. Schema-on-read with metadata tagging."
            tools="Fivetran, Airbyte, Kafka Connect, AWS DMS"
            sla="< 15 min ingestion latency"
          />
        </div>
      </div>

      {/* Cross-cutting concerns */}
      <div>
        <SectionTitle>Cross-Cutting Layers</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <CrossCuttingCard
            title="Data Governance"
            items={["Unity Catalog / Apache Atlas", "Column-level lineage", "PII classification & masking", "Access policies per domain"]}
          />
          <CrossCuttingCard
            title="Orchestration"
            items={["Airflow / Dagster for batch", "Flink / Kafka Streams for real-time", "dbt Cloud for transformation DAGs", "SLA monitoring and alerting"]}
          />
          <CrossCuttingCard
            title="Quality & Observability"
            items={["Great Expectations / Soda at each layer", "Anomaly detection on row counts / freshness", "Data contracts between producers & consumers", "Monte Carlo / Bigeye for automated monitoring"]}
          />
          <CrossCuttingCard
            title="Security & Compliance"
            items={["Encryption at rest (AES-256) and in transit (TLS 1.3)", "Row-level security for multi-tenant isolation", "SOC2 Type II, GDPR, HIPAA compliance", "Audit logging on all data access"]}
          />
        </div>
      </div>

      {/* Storage strategy */}
      <div>
        <SectionTitle>Storage Strategy</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-navy-100 text-left">
                <th className="pb-2 pr-4 font-semibold text-navy">Layer</th>
                <th className="pb-2 pr-4 font-semibold text-navy">Format</th>
                <th className="pb-2 pr-4 font-semibold text-navy">Storage</th>
                <th className="pb-2 pr-4 font-semibold text-navy">Retention</th>
                <th className="pb-2 font-semibold text-navy">Partitioning</th>
              </tr>
            </thead>
            <tbody className="text-navy-500">
              <tr className="border-b border-navy-50">
                <td className="py-2 pr-4 font-medium">Bronze</td>
                <td className="py-2 pr-4">Parquet / JSON</td>
                <td className="py-2 pr-4">S3 (Standard)</td>
                <td className="py-2 pr-4">Indefinite</td>
                <td className="py-2">date / source_system</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 pr-4 font-medium">Silver</td>
                <td className="py-2 pr-4">Delta / Iceberg</td>
                <td className="py-2 pr-4">S3 (Standard)</td>
                <td className="py-2 pr-4">3 years</td>
                <td className="py-2">date / tenant_id</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 pr-4 font-medium">Gold</td>
                <td className="py-2 pr-4">Delta / Iceberg</td>
                <td className="py-2 pr-4">S3 + Snowflake</td>
                <td className="py-2 pr-4">Active</td>
                <td className="py-2">business_unit / date</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Platinum</td>
                <td className="py-2 pr-4">Feature Store</td>
                <td className="py-2 pr-4">Redis + S3</td>
                <td className="py-2 pr-4">Model-dependent</td>
                <td className="py-2">feature_group / entity</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MedallionLayer({
  name,
  subtitle,
  color,
  description,
  tools,
  sla,
}: {
  name: string;
  subtitle: string;
  color: string;
  description: string;
  tools: string;
  sla: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-navy-100">
      <div className="flex items-stretch">
        <div className={cn("flex w-28 flex-shrink-0 flex-col items-center justify-center bg-gradient-to-br p-4 text-white", color)}>
          <span className="text-sm font-bold">{name}</span>
          <span className="mt-0.5 text-[9px] uppercase tracking-wide opacity-80">{subtitle}</span>
        </div>
        <div className="flex-1 p-4">
          <p className="text-xs leading-relaxed text-navy-500">{description}</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            <span className="text-[10px] text-navy-400">
              <span className="font-semibold text-navy">Tools:</span> {tools}
            </span>
            <span className="text-[10px] text-navy-400">
              <span className="font-semibold text-navy">SLA:</span> {sla}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CrossCuttingCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-navy-50 bg-navy-50/30 p-4">
      <h4 className="mb-2 text-xs font-bold text-navy">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-navy-500">
            <CheckCircle2 size={10} className="mt-0.5 flex-shrink-0 text-emerald-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── 2. Vendor Selection Decision Framework ─────────────────────

function VendorSelectionFramework() {
  return (
    <div className="space-y-8">
      <Paragraph>
        A structured decision tree for evaluating and selecting data platform
        vendors. Start at the top and follow the decision path based on your
        requirements.
      </Paragraph>

      {/* Decision Flowchart */}
      <div className="space-y-4">
        <SectionTitle>Decision Flowchart</SectionTitle>

        <FlowNode
          type="start"
          label="New Platform Need Identified"
          description="A team or project requires a data platform capability"
        />
        <FlowArrow />
        <FlowNode
          type="decision"
          label="Can an existing vendor cover this?"
          description="Check if current stack already provides this capability"
          yes="Extend existing contract — evaluate upgrade path"
          no="Proceed to build vs buy triage"
        />
        <FlowArrow label="No" />
        <FlowNode
          type="decision"
          label="Is this a core differentiator for NICE?"
          description="Would building this in-house create competitive advantage?"
          yes="Evaluate Build path (see Build vs Buy matrix)"
          no="Proceed to vendor evaluation"
        />
        <FlowArrow label="No" />
        <FlowNode
          type="process"
          label="Define Requirements"
          description="Functional requirements, non-functional requirements, integration needs, compliance, budget"
        />
        <FlowArrow />
        <FlowNode
          type="decision"
          label="Estimated annual cost > $200K?"
          description="Total cost of ownership including licenses, infra, and personnel"
          yes="Full RFP process with procurement"
          no="Simplified evaluation (DP-CoE led)"
        />
        <FlowArrow />
        <FlowNode
          type="process"
          label="Score Against Category Quality Gates"
          description="Apply minimum thresholds from Quality Gates standard (Section 4)"
        />
        <FlowArrow />
        <FlowNode
          type="gate"
          label="Security & Compliance Gate"
          description="Mandatory: SOC2 Type II, GDPR compliance, multi-tenant data isolation, encryption at rest & in transit"
        />
        <FlowArrow />
        <FlowNode
          type="process"
          label="POC / Technical Evaluation"
          description="30-day proof of concept with real NICE data (anonymized). Evaluate against 6 scoring criteria."
        />
        <FlowArrow />
        <FlowNode
          type="decision"
          label="POC score ≥ 7.0 with confidence ≥ 0.7?"
          description="Minimum viable score on the DP-CoE evaluation framework"
          yes="Proceed to contract negotiation"
          no="Reject or re-evaluate alternative vendors"
        />
        <FlowArrow label="Yes" />
        <FlowNode
          type="end"
          label="Vendor Approved & Onboarded"
          description="Added to NICE DP-CoE vendor registry with ongoing monitoring"
        />
      </div>

      {/* Evaluation Criteria Weights */}
      <div>
        <SectionTitle>Evaluation Scoring Weights</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { criterion: "Functional Fit", weight: 25, desc: "Feature coverage for use case" },
            { criterion: "Performance & Scale", weight: 20, desc: "Benchmarks, concurrency, latency" },
            { criterion: "Security & Compliance", weight: 20, desc: "SOC2, GDPR, isolation, encryption" },
            { criterion: "Total Cost of Ownership", weight: 15, desc: "License + infra + personnel (3yr)" },
            { criterion: "Integration & Ecosystem", weight: 10, desc: "APIs, connectors, community" },
            { criterion: "Vendor Viability", weight: 10, desc: "Funding, growth, support, roadmap" },
          ].map((c) => (
            <div key={c.criterion} className="rounded-lg border border-navy-50 bg-navy-50/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-navy">{c.criterion}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue">
                  {c.weight}%
                </span>
              </div>
              <p className="mt-1 text-[10px] text-navy-400">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowNode({
  type,
  label,
  description,
  yes,
  no,
}: {
  type: "start" | "end" | "decision" | "process" | "gate";
  label: string;
  description: string;
  yes?: string;
  no?: string;
}) {
  const styles = {
    start: "border-blue bg-blue-50",
    end: "border-emerald-400 bg-emerald-50",
    decision: "border-amber-400 bg-amber-50/50",
    process: "border-navy-200 bg-white",
    gate: "border-red-300 bg-red-50/50",
  }[type];

  const iconEl = {
    start: <div className="h-3 w-3 rounded-full bg-blue" />,
    end: <CheckCircle2 size={14} className="text-emerald-500" />,
    decision: <GitBranch size={14} className="text-amber-600" />,
    process: <ChevronRight size={14} className="text-navy-400" />,
    gate: <ShieldCheck size={14} className="text-red-500" />,
  }[type];

  return (
    <div className={cn("rounded-lg border-2 p-4", styles)}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0">{iconEl}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{label}</p>
          <p className="mt-0.5 text-[11px] text-navy-500">{description}</p>
          {(yes || no) && (
            <div className="mt-2 flex flex-wrap gap-3">
              {yes && (
                <span className="flex items-center gap-1 text-[10px]">
                  <CheckCircle2 size={10} className="text-emerald-500" />
                  <span className="font-medium text-emerald-700">Yes:</span>
                  <span className="text-navy-500">{yes}</span>
                </span>
              )}
              {no && (
                <span className="flex items-center gap-1 text-[10px]">
                  <XCircle size={10} className="text-red-400" />
                  <span className="font-medium text-red-600">No:</span>
                  <span className="text-navy-500">{no}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-0.5">
      <ArrowDown size={16} className="text-navy-200" />
      {label && <span className="text-[10px] font-medium text-navy-300">{label}</span>}
    </div>
  );
}

// ─── 3. Integration Standards ───────────────────────────────────

function IntegrationStandards() {
  return (
    <div className="space-y-8">
      <Paragraph>
        All data platform integrations at NICE must follow these standards to
        ensure consistency, security, and maintainability across the stack.
      </Paragraph>

      {/* API Patterns */}
      <div>
        <SectionTitle>API Design Patterns</SectionTitle>
        <div className="space-y-3">
          <StandardRule
            status="required"
            title="REST API Versioning"
            detail="All APIs must use URI versioning (e.g. /api/v2/vendors). Header versioning is not permitted."
          />
          <StandardRule
            status="required"
            title="Response Envelope"
            detail='Standard envelope: { "data": ..., "meta": { "page", "total", "requestId" }, "errors": [] }. Never return raw arrays.'
          />
          <StandardRule
            status="required"
            title="Pagination"
            detail="Cursor-based pagination for large datasets. Offset pagination acceptable for < 10K records. Default page size: 25, max: 100."
          />
          <StandardRule
            status="recommended"
            title="GraphQL Federation"
            detail="Use Apollo Federation v2 for cross-service queries. Each service owns its subgraph. Gateway handles composition."
          />
          <StandardRule
            status="required"
            title="Idempotency"
            detail="All write operations must accept an Idempotency-Key header. Duplicate requests within 24h must return the original response."
          />
        </div>
      </div>

      {/* Authentication */}
      <div>
        <SectionTitle>Authentication & Authorization</SectionTitle>
        <div className="space-y-3">
          <StandardRule
            status="required"
            title="OAuth 2.1 with PKCE"
            detail="All user-facing APIs must use OAuth 2.1 with PKCE flow. Client credentials for service-to-service. No implicit grants."
          />
          <StandardRule
            status="required"
            title="JWT Token Structure"
            detail='Tokens must include: sub, tenant_id, roles[], exp, iss. Max lifetime: access=15min, refresh=7days. Use RS256 signing.'
          />
          <StandardRule
            status="required"
            title="API Key Management"
            detail="API keys for external integrations only. Hash with SHA-256 before storage. Auto-rotate every 90 days. Prefix with environment (nice_prod_, nice_dev_)."
          />
          <StandardRule
            status="required"
            title="Multi-Tenant Isolation"
            detail="Every request must include tenant context. Row-level security enforced at database layer. Cross-tenant access is never permitted."
          />
        </div>
      </div>

      {/* Error Handling */}
      <div>
        <SectionTitle>Error Handling</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-navy-100 text-left">
                <th className="pb-2 pr-4 font-semibold text-navy">Status</th>
                <th className="pb-2 pr-4 font-semibold text-navy">When to Use</th>
                <th className="pb-2 pr-4 font-semibold text-navy">Error Code</th>
                <th className="pb-2 font-semibold text-navy">Example</th>
              </tr>
            </thead>
            <tbody className="text-navy-500">
              {[
                { status: "400", when: "Invalid request body / params", code: "VALIDATION_ERROR", example: "Missing required field: name" },
                { status: "401", when: "Missing or invalid token", code: "AUTHENTICATION_ERROR", example: "JWT token expired" },
                { status: "403", when: "Insufficient permissions", code: "AUTHORIZATION_ERROR", example: "User lacks admin role" },
                { status: "404", when: "Resource not found", code: "NOT_FOUND", example: "Vendor cm1234 not found" },
                { status: "409", when: "Conflict with current state", code: "CONFLICT", example: "Vendor slug already exists" },
                { status: "422", when: "Valid syntax, invalid semantics", code: "UNPROCESSABLE", example: "Score must be 0-10" },
                { status: "429", when: "Rate limit exceeded", code: "RATE_LIMITED", example: "Retry after 30 seconds" },
                { status: "500", when: "Unexpected server error", code: "INTERNAL_ERROR", example: "Database connection failed" },
              ].map((row) => (
                <tr key={row.status} className="border-b border-navy-50">
                  <td className="py-2 pr-4"><code className="rounded bg-navy-50 px-1 py-0.5 text-[10px] font-mono font-bold text-navy">{row.status}</code></td>
                  <td className="py-2 pr-4">{row.when}</td>
                  <td className="py-2 pr-4"><code className="text-[10px] font-mono text-blue">{row.code}</code></td>
                  <td className="py-2 text-navy-400">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <StandardRule
            status="required"
            title="Error Response Format (RFC 9457)"
            detail='All errors must return: { "type": "https://nice.com/errors/VALIDATION_ERROR", "title": "Validation Error", "status": 400, "detail": "...", "instance": "/api/v2/vendors", "requestId": "req_..." }'
          />
          <div className="mt-3" />
          <StandardRule
            status="required"
            title="Circuit Breaker"
            detail="All external service calls must use circuit breaker pattern. Open after 5 failures in 60s. Half-open retry after 30s. Exponential backoff: 1s, 2s, 4s, max 3 retries."
          />
        </div>
      </div>
    </div>
  );
}

function StandardRule({
  status,
  title,
  detail,
}: {
  status: "required" | "recommended" | "optional";
  title: string;
  detail: string;
}) {
  const badge = {
    required: "bg-red-50 text-red-600",
    recommended: "bg-amber-50 text-amber-600",
    optional: "bg-navy-50 text-navy-400",
  }[status];

  return (
    <div className="rounded-lg border border-navy-50 p-3">
      <div className="flex items-center gap-2">
        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase", badge)}>
          {status}
        </span>
        <span className="text-xs font-semibold text-navy">{title}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-navy-500">{detail}</p>
    </div>
  );
}

// ─── 4. Quality Gates ───────────────────────────────────────────

const QUALITY_GATES: {
  slug: string;
  category: string;
  icon: LucideIcon;
  minScore: number;
  minConfidence: number;
  mandatoryCriteria: string[];
  sla: string;
}[] = [
  {
    slug: "cloud-data-warehouses",
    category: "Cloud Data Warehouses",
    icon: Database,
    minScore: 7.0,
    minConfidence: 0.7,
    mandatoryCriteria: ["Query performance < 5s for 1TB", "Auto-scaling", "SOC2 certified", "Multi-tenant isolation"],
    sla: "99.95% uptime, < 4h recovery",
  },
  {
    slug: "etl-data-integration",
    category: "ETL & Data Integration",
    icon: Workflow,
    minScore: 6.5,
    minConfidence: 0.6,
    mandatoryCriteria: ["200+ pre-built connectors", "CDC support", "Schema evolution", "Error handling & dead letter"],
    sla: "< 15 min ingestion latency",
  },
  {
    slug: "bi-analytics",
    category: "BI & Analytics",
    icon: BarChart3,
    minScore: 6.5,
    minConfidence: 0.6,
    mandatoryCriteria: ["Embedded analytics API", "Row-level security", "Mobile support", "Semantic layer integration"],
    sla: "< 3s dashboard load time",
  },
  {
    slug: "data-governance",
    category: "Data Governance",
    icon: Shield,
    minScore: 7.5,
    minConfidence: 0.7,
    mandatoryCriteria: ["Automated PII detection", "Column-level lineage", "Policy engine", "GDPR compliance toolkit"],
    sla: "< 1h lineage propagation",
  },
  {
    slug: "ai-ml-platforms",
    category: "AI & ML Platforms",
    icon: Brain,
    minScore: 6.0,
    minConfidence: 0.6,
    mandatoryCriteria: ["Model registry", "Experiment tracking", "GPU autoscaling", "Model monitoring"],
    sla: "99.9% serving uptime",
  },
  {
    slug: "data-quality",
    category: "Data Quality",
    icon: Zap,
    minScore: 7.0,
    minConfidence: 0.7,
    mandatoryCriteria: ["Anomaly detection", "Schema validation", "Freshness monitoring", "Custom rule engine"],
    sla: "< 5 min detection latency",
  },
  {
    slug: "stream-processing",
    category: "Stream Processing",
    icon: Cpu,
    minScore: 6.5,
    minConfidence: 0.6,
    mandatoryCriteria: ["Exactly-once semantics", "Windowing support", "Backpressure handling", "State management"],
    sla: "< 500ms end-to-end latency",
  },
  {
    slug: "data-lakes",
    category: "Data Lakes & Lakehouse",
    icon: Server,
    minScore: 7.0,
    minConfidence: 0.7,
    mandatoryCriteria: ["ACID transactions", "Time travel / versioning", "Open format (Iceberg/Delta)", "Partition evolution"],
    sla: "99.9% availability, < 2h compaction",
  },
  {
    slug: "api-management",
    category: "API Management",
    icon: Globe,
    minScore: 6.0,
    minConfidence: 0.6,
    mandatoryCriteria: ["Rate limiting", "API versioning", "Developer portal", "OAuth 2.1 support"],
    sla: "< 50ms gateway overhead",
  },
  {
    slug: "data-security",
    category: "Data Security",
    icon: Lock,
    minScore: 8.0,
    minConfidence: 0.8,
    mandatoryCriteria: ["Encryption at rest & transit", "Dynamic data masking", "Audit logging", "Key rotation"],
    sla: "Zero-breach tolerance",
  },
  {
    slug: "cloud-platforms",
    category: "Cloud Platforms",
    icon: Cloud,
    minScore: 7.0,
    minConfidence: 0.7,
    mandatoryCriteria: ["Multi-region support", "IAM integration", "Cost management tools", "SLA guarantees"],
    sla: "99.99% core service uptime",
  },
  {
    slug: "reverse-etl",
    category: "Reverse ETL",
    icon: Layers,
    minScore: 6.0,
    minConfidence: 0.6,
    mandatoryCriteria: ["Warehouse-native sync", "Audience builder", "Real-time sync option", "GDPR consent sync"],
    sla: "< 30 min sync frequency",
  },
];

function QualityGates() {
  return (
    <div className="space-y-6">
      <Paragraph>
        Every vendor must meet these minimum thresholds for their respective
        category before being approved. Vendors failing any mandatory criterion
        are automatically disqualified regardless of overall score.
      </Paragraph>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-navy-100 text-left">
              <th className="pb-3 pr-3 font-semibold text-navy">Category</th>
              <th className="pb-3 pr-3 font-semibold text-navy text-center">Min Score</th>
              <th className="pb-3 pr-3 font-semibold text-navy text-center">Min Confidence</th>
              <th className="pb-3 pr-3 font-semibold text-navy">Mandatory Criteria</th>
              <th className="pb-3 font-semibold text-navy">SLA Requirement</th>
            </tr>
          </thead>
          <tbody>
            {QUALITY_GATES.map((gate) => (
              <tr key={gate.slug} className="border-b border-navy-50">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <gate.icon size={14} className="flex-shrink-0 text-blue" />
                    <span className="font-medium text-navy">{gate.category}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-center">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    gate.minScore >= 7.5 ? "bg-red-50 text-red-600" :
                    gate.minScore >= 7.0 ? "bg-amber-50 text-amber-600" :
                    "bg-emerald-50 text-emerald-600"
                  )}>
                    ≥ {gate.minScore}
                  </span>
                </td>
                <td className="py-3 pr-3 text-center">
                  <span className="text-navy-500">≥ {gate.minConfidence}</span>
                </td>
                <td className="py-3 pr-3">
                  <ul className="space-y-0.5">
                    {gate.mandatoryCriteria.map((c, i) => (
                      <li key={i} className="flex items-center gap-1 text-navy-500">
                        <CheckCircle2 size={9} className="flex-shrink-0 text-emerald-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="py-3 text-navy-400">{gate.sla}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 rounded-lg bg-navy-50/50 p-3">
        <span className="flex items-center gap-1.5 text-[10px] text-navy-500">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Score ≥ 7.5 — stringent (security, governance)
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-navy-500">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Score ≥ 7.0 — standard threshold
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-navy-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Score ≥ 6.0-6.5 — baseline
        </span>
      </div>
    </div>
  );
}

// ─── 5. Build vs Buy Decision Matrix ────────────────────────────

const BUILD_BUY_DIMENSIONS = [
  {
    dimension: "Strategic Importance",
    buildWeight: 5,
    buyWeight: 1,
    buildSignal: "Core differentiator, unique to NICE",
    buySignal: "Commodity capability, industry-standard",
    question: "Does this create competitive advantage?",
  },
  {
    dimension: "Time to Market",
    buildWeight: 1,
    buyWeight: 5,
    buildSignal: "Can afford 6-12 month build cycle",
    buySignal: "Need within 1-3 months",
    question: "How urgently is this needed?",
  },
  {
    dimension: "Team Expertise",
    buildWeight: 4,
    buyWeight: 2,
    buildSignal: "Deep in-house expertise exists",
    buySignal: "Would need to hire specialists",
    question: "Do we have the talent to build and maintain?",
  },
  {
    dimension: "Maintenance Burden",
    buildWeight: 1,
    buyWeight: 5,
    buildSignal: "Simple, stable requirements",
    buySignal: "Complex, evolving requirements",
    question: "How much ongoing engineering is needed?",
  },
  {
    dimension: "Integration Complexity",
    buildWeight: 3,
    buyWeight: 3,
    buildSignal: "Tight coupling with internal systems",
    buySignal: "Standard protocols, well-documented APIs",
    question: "How deeply does it integrate with our stack?",
  },
  {
    dimension: "Total Cost (3yr)",
    buildWeight: 3,
    buyWeight: 3,
    buildSignal: "Build cost < 60% of vendor TCO",
    buySignal: "Vendor TCO < build cost + maintenance",
    question: "What's the 3-year total cost of ownership?",
  },
  {
    dimension: "Vendor Lock-in Risk",
    buildWeight: 4,
    buyWeight: 2,
    buildSignal: "Proprietary formats, high switching cost",
    buySignal: "Open standards, portable data",
    question: "How difficult is it to switch later?",
  },
  {
    dimension: "Compliance & Security",
    buildWeight: 2,
    buyWeight: 4,
    buildSignal: "Unique compliance needs (custom audit)",
    buySignal: "SOC2/GDPR handled by vendor",
    question: "Do compliance needs favor internal control?",
  },
];

function BuildVsBuyMatrix() {
  return (
    <div className="space-y-8">
      <Paragraph>
        Score each dimension 1-5 for both Build and Buy options. The option
        with the higher weighted total is recommended. A score difference
        of &lt;10% suggests a hybrid approach may be optimal.
      </Paragraph>

      {/* Scoring Matrix */}
      <div>
        <SectionTitle>Decision Dimensions</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-navy-100 text-left">
                <th className="pb-3 pr-3 font-semibold text-navy">Dimension</th>
                <th className="pb-3 pr-3 font-semibold text-navy text-center">Build Favors</th>
                <th className="pb-3 pr-3 font-semibold text-navy text-center">Buy Favors</th>
                <th className="pb-3 pr-3 font-semibold text-navy">Build Signal</th>
                <th className="pb-3 font-semibold text-navy">Buy Signal</th>
              </tr>
            </thead>
            <tbody>
              {BUILD_BUY_DIMENSIONS.map((dim) => (
                <tr key={dim.dimension} className="border-b border-navy-50">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-navy">{dim.dimension}</p>
                    <p className="mt-0.5 text-[10px] text-navy-400 italic">{dim.question}</p>
                  </td>
                  <td className="py-3 pr-3 text-center">
                    <ScoreBar value={dim.buildWeight} color="blue" />
                  </td>
                  <td className="py-3 pr-3 text-center">
                    <ScoreBar value={dim.buyWeight} color="accent" />
                  </td>
                  <td className="py-3 pr-3 text-navy-500">{dim.buildSignal}</td>
                  <td className="py-3 text-navy-500">{dim.buySignal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision thresholds */}
      <div>
        <SectionTitle>Decision Thresholds</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border-2 border-blue/20 bg-blue-50/30 p-4 text-center">
            <p className="text-lg font-bold text-blue">BUILD</p>
            <p className="mt-1 text-[11px] text-navy-500">
              Build score &gt; Buy score by ≥ 10%
            </p>
            <p className="mt-2 text-[10px] text-navy-400">
              Invest in internal development. Assign dedicated team. Plan 6-12 month timeline.
            </p>
          </div>
          <div className="rounded-lg border-2 border-amber-300/40 bg-amber-50/30 p-4 text-center">
            <p className="text-lg font-bold text-amber-600">HYBRID</p>
            <p className="mt-1 text-[11px] text-navy-500">
              Score difference &lt; 10%
            </p>
            <p className="mt-2 text-[10px] text-navy-400">
              Buy the platform, build custom extensions. API-first vendor required.
            </p>
          </div>
          <div className="rounded-lg border-2 border-accent/20 bg-accent-50/30 p-4 text-center">
            <p className="text-lg font-bold text-accent-600">BUY</p>
            <p className="mt-1 text-[11px] text-navy-500">
              Buy score &gt; Build score by ≥ 10%
            </p>
            <p className="mt-2 text-[10px] text-navy-400">
              Proceed with vendor selection. Follow Vendor Selection Framework.
            </p>
          </div>
        </div>
      </div>

      {/* TCO Model */}
      <div>
        <SectionTitle>TCO Comparison Model (3-Year Horizon)</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-blue/20 bg-blue-50/20 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-blue">
              <span className="rounded bg-blue px-1.5 py-0.5 text-[9px] text-white">BUILD</span>
              Cost Components
            </h4>
            <ul className="space-y-1.5 text-[11px] text-navy-500">
              {[
                "Engineering salaries (FTE × 3 years)",
                "Infrastructure costs (compute, storage, networking)",
                "DevOps / SRE overhead (20% of eng cost)",
                "Opportunity cost (delayed feature delivery)",
                "Training & onboarding",
                "Technical debt maintenance (15-25% annual)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-blue" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-accent/20 bg-accent-50/20 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-accent-700">
              <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] text-white">BUY</span>
              Cost Components
            </h4>
            <ul className="space-y-1.5 text-[11px] text-navy-500">
              {[
                "License / subscription fees (annual)",
                "Implementation & customization",
                "Integration development",
                "Training & change management",
                "Premium support tier",
                "Potential price increases (10-15% YoY)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ value, color }: { value: number; color: "blue" | "accent" }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-2 rounded-sm",
            i < value
              ? color === "blue" ? "bg-blue" : "bg-accent"
              : "bg-navy-100"
          )}
        />
      ))}
      <span className="ml-1 text-[10px] font-medium text-navy-400">{value}/5</span>
    </div>
  );
}

// ─── 6. Master Changelog ────────────────────────────────────────

function MasterChangelog() {
  // Aggregate all changelogs from all documents
  const allEntries: {
    docTitle: string;
    docId: string;
    version: string;
    date: string;
    changes: string[];
  }[] = [];

  for (const doc of DOCUMENTS) {
    for (const entry of doc.changelog) {
      allEntries.push({
        docTitle: doc.title,
        docId: doc.id,
        version: entry.version,
        date: entry.date,
        changes: entry.changes,
      });
    }
  }

  // Sort by date descending
  allEntries.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <Paragraph>
        Complete version history across all standards documents. Each entry
        shows the document, version number, date, and list of changes.
      </Paragraph>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-navy-100" />

        <div className="space-y-6">
          {allEntries.map((entry, i) => (
            <div key={`${entry.docId}-${entry.version}`} className="relative pl-7">
              {/* Timeline dot */}
              <div className={cn(
                "absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-2 border-white",
                i === 0 ? "bg-blue" : "bg-navy-200"
              )} />

              <div className="rounded-lg border border-navy-50 bg-navy-50/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue">
                    v{entry.version}
                  </span>
                  <span className="text-xs font-semibold text-navy">
                    {entry.docTitle}
                  </span>
                  <span className="text-[10px] text-navy-300">{entry.date}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {entry.changes.map((change, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-1.5 text-[11px] text-navy-500"
                    >
                      <ArrowRight size={9} className="mt-0.5 flex-shrink-0 text-navy-300" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
