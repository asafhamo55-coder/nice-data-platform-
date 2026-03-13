"use client";

import { Building2, ArrowRight, Layers, Database, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryData } from "./category-detail";

interface NiceContextProps {
  category: CategoryData;
  color: string;
}

// Medallion layer mapping per category
const MEDALLION_MAP: Record<
  string,
  {
    layers: { name: string; role: string; highlight: boolean }[];
    context: string;
    fit: string;
  }
> = {
  "cloud-data-warehouses": {
    layers: [
      { name: "Bronze", role: "Raw ingestion landing zone", highlight: false },
      { name: "Silver", role: "Cleansed & conformed data", highlight: false },
      { name: "Gold", role: "Business-ready analytical layer", highlight: true },
    ],
    context: "Cloud data warehouses serve as the primary Gold layer in our Medallion Architecture, providing the business-ready analytical layer that powers dashboards, reports, and self-service analytics across NICE.",
    fit: "These platforms store curated, aggregated data that has been validated through Bronze and Silver processing, enabling fast queries for operational and strategic decision-making.",
  },
  "etl-data-integration": {
    layers: [
      { name: "Bronze", role: "Raw data extraction & landing", highlight: true },
      { name: "Silver", role: "Transformation & cleansing", highlight: true },
      { name: "Gold", role: "Delivery to analytical systems", highlight: false },
    ],
    context: "ETL & data integration tools are the backbone of data movement across all Medallion layers, handling extraction into Bronze and transformation into Silver.",
    fit: "These platforms orchestrate the flow of data from 200+ source systems through quality checks and transformations, ensuring data arrives clean and consistent at each layer.",
  },
  "bi-analytics": {
    layers: [
      { name: "Bronze", role: "Source system visibility", highlight: false },
      { name: "Silver", role: "Operational dashboards", highlight: false },
      { name: "Gold", role: "Strategic analytics & reporting", highlight: true },
    ],
    context: "BI & analytics tools sit at the top of the Medallion Architecture, consuming Gold-layer data to deliver insights to business stakeholders across NICE.",
    fit: "These platforms connect to our Gold layer to power executive dashboards, self-service exploration, and embedded analytics within NICE products.",
  },
  "data-governance": {
    layers: [
      { name: "Bronze", role: "Data classification & cataloging", highlight: true },
      { name: "Silver", role: "Lineage tracking & quality rules", highlight: true },
      { name: "Gold", role: "Access control & compliance", highlight: true },
    ],
    context: "Data governance spans all three Medallion layers, providing the metadata management, lineage, and access control that ensures data trustworthiness across the entire platform.",
    fit: "Governance tools enforce policies at every layer — from classifying raw data in Bronze to tracking transformations in Silver and controlling access to sensitive Gold-layer datasets.",
  },
  "ai-ml-platforms": {
    layers: [
      { name: "Bronze", role: "Feature extraction sources", highlight: false },
      { name: "Silver", role: "Feature engineering & training data", highlight: true },
      { name: "Gold", role: "Model serving & predictions", highlight: true },
    ],
    context: "AI/ML platforms consume Silver-layer data for model training and feature engineering, then serve predictions that feed back into Gold-layer reporting and NICE products.",
    fit: "These platforms power our AI-driven capabilities including interaction analytics, workforce optimization, and predictive quality scoring.",
  },
  "data-quality": {
    layers: [
      { name: "Bronze", role: "Ingestion validation", highlight: true },
      { name: "Silver", role: "Transformation quality checks", highlight: true },
      { name: "Gold", role: "Business rule validation", highlight: true },
    ],
    context: "Data quality tools monitor every Medallion layer, detecting anomalies at ingestion, validating transformations, and ensuring business rules are met before data reaches consumers.",
    fit: "Quality gates at each layer transition prevent bad data from propagating downstream, protecting the integrity of analytics and ML models that power NICE products.",
  },
  "stream-processing": {
    layers: [
      { name: "Bronze", role: "Real-time event ingestion", highlight: true },
      { name: "Silver", role: "Stream enrichment & filtering", highlight: true },
      { name: "Gold", role: "Real-time analytics & alerts", highlight: false },
    ],
    context: "Stream processing platforms handle real-time data flows that bypass traditional batch Bronze ingestion, enabling sub-second event processing for NICE's real-time interaction analytics.",
    fit: "These tools power live interaction monitoring, real-time agent assistance, and event-driven architectures that complement our batch Medallion pipelines.",
  },
  "data-lakes": {
    layers: [
      { name: "Bronze", role: "Raw data lake storage", highlight: true },
      { name: "Silver", role: "Curated lake tables", highlight: true },
      { name: "Gold", role: "Lakehouse analytical layer", highlight: false },
    ],
    context: "Data lakes and lakehouse platforms form the storage foundation of our Bronze and Silver layers, providing cost-effective storage for massive volumes of structured and unstructured data.",
    fit: "These platforms store raw interaction recordings, logs, and telemetry in Bronze format, with curated Delta/Iceberg tables serving as Silver-layer assets.",
  },
  "api-management": {
    layers: [
      { name: "Bronze", role: "API-sourced data ingestion", highlight: false },
      { name: "Silver", role: "API data normalization", highlight: false },
      { name: "Gold", role: "Data serving via APIs", highlight: true },
    ],
    context: "API management platforms enable Gold-layer data to be securely served to internal applications, partners, and NICE products through governed, rate-limited APIs.",
    fit: "These tools power the data serving layer that exposes curated datasets and ML predictions as APIs consumed by NICE CXone, WFM, and other products.",
  },
  "data-security": {
    layers: [
      { name: "Bronze", role: "Encryption at rest & in transit", highlight: true },
      { name: "Silver", role: "Dynamic masking & tokenization", highlight: true },
      { name: "Gold", role: "Row/column-level access control", highlight: true },
    ],
    context: "Data security platforms protect sensitive customer data at every Medallion layer, critical for NICE's compliance with GDPR, CCPA, PCI-DSS, and HIPAA regulations.",
    fit: "Security tools enforce encryption, masking, and fine-grained access controls that protect PII and sensitive interaction data flowing through all layers of our platform.",
  },
  "cloud-platforms": {
    layers: [
      { name: "Bronze", role: "Infrastructure for raw storage", highlight: true },
      { name: "Silver", role: "Compute for transformations", highlight: true },
      { name: "Gold", role: "Services for analytics & AI", highlight: true },
    ],
    context: "Cloud platforms provide the foundational infrastructure for the entire Medallion Architecture — from object storage for Bronze to managed compute for Silver transformations to analytical services for Gold.",
    fit: "NICE's multi-cloud strategy leverages these platforms for infrastructure, ensuring global availability, compliance across regions, and cost optimization.",
  },
  "reverse-etl": {
    layers: [
      { name: "Bronze", role: "N/A", highlight: false },
      { name: "Silver", role: "N/A", highlight: false },
      { name: "Gold", role: "Data activation & sync-back", highlight: true },
    ],
    context: "Reverse ETL tools activate Gold-layer insights by syncing curated data back to operational tools like CRM, marketing platforms, and NICE's own products.",
    fit: "These platforms close the data loop by pushing analytical insights, segments, and scores from the warehouse back into the tools teams use daily.",
  },
};

const LAYER_COLORS = {
  Bronze: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  Silver: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-500" },
  Gold: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", dot: "bg-yellow-500" },
};

export function NiceContext({ category, color }: NiceContextProps) {
  const mapping = MEDALLION_MAP[category.slug];

  if (!mapping) {
    return null;
  }

  return (
    <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-navy-100 px-6 py-4">
        <Building2 size={18} style={{ color }} />
        <h2 className="text-lg font-semibold text-navy">NICE Context</h2>
        <span className="ml-2 rounded-full bg-navy-50 px-2.5 py-0.5 text-[10px] font-medium text-navy-400">
          Medallion Architecture
        </span>
      </div>

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Medallion layers diagram */}
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
              Architecture Layer Fit
            </h3>
            <div className="space-y-3">
              {mapping.layers.map((layer) => {
                const colors = LAYER_COLORS[layer.name as keyof typeof LAYER_COLORS];
                return (
                  <div
                    key={layer.name}
                    className={cn(
                      "rounded-lg border p-3 nav-transition",
                      layer.highlight
                        ? `${colors.bg} ${colors.border} shadow-sm`
                        : "border-navy-50 bg-navy-50/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", layer.highlight ? colors.dot : "bg-navy-200")} />
                      <span className={cn(
                        "text-sm font-semibold",
                        layer.highlight ? colors.text : "text-navy-300"
                      )}>
                        {layer.name} Layer
                      </span>
                      {layer.highlight && (
                        <span
                          className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "mt-1 text-xs",
                      layer.highlight ? colors.text : "text-navy-300"
                    )}>
                      {layer.role}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Flow arrows */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-navy-300">
              <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-700">Bronze</span>
              <ArrowRight size={12} className="text-navy-200" />
              <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-600">Silver</span>
              <ArrowRight size={12} className="text-navy-200" />
              <span className="rounded bg-yellow-100 px-2 py-0.5 font-medium text-yellow-700">Gold</span>
            </div>
          </div>

          {/* Context description */}
          <div className="lg:col-span-3">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
              How {category.name} Fits
            </h3>
            <div className="rounded-lg border border-navy-50 bg-navy-50/20 p-5">
              <p className="text-sm leading-relaxed text-navy">{mapping.context}</p>
              <div className="mt-4 rounded-lg bg-white p-4">
                <p className="text-xs font-semibold text-navy-400">NICE DP-CoE Perspective</p>
                <p className="mt-1 text-sm leading-relaxed text-navy-500">{mapping.fit}</p>
              </div>
            </div>

            {/* Key architecture principles */}
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <ArchPrinciple
                icon={Database}
                title="Single Source of Truth"
                desc="Curated in the Gold layer"
              />
              <ArchPrinciple
                icon={Layers}
                title="Progressive Refinement"
                desc="Raw → Cleansed → Business"
              />
              <ArchPrinciple
                icon={Zap}
                title="Quality at Every Layer"
                desc="Validated before promotion"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchPrinciple({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Database;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-navy-50 p-3">
      <Icon size={14} className="text-navy-400" />
      <p className="mt-1 text-xs font-semibold text-navy">{title}</p>
      <p className="text-[10px] text-navy-300">{desc}</p>
    </div>
  );
}
