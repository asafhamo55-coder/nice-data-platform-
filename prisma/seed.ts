import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pastDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

// ─── Categories ───────────────────────────────────────────────

const categoriesData = [
  {
    name: "Cloud Data Warehouses",
    slug: "cloud-data-warehouses",
    description: "Scalable, cloud-native analytical data storage and query engines for enterprise workloads.",
    icon: "Database",
    color: "#2E75B6",
    sortOrder: 1,
    criteria: [
      { name: "Query Performance", key: "query-performance", weight: 1.5 },
      { name: "Scalability", key: "scalability", weight: 1.3 },
      { name: "Cost Efficiency", key: "cost-efficiency", weight: 1.2 },
      { name: "Ecosystem Integration", key: "ecosystem-integration", weight: 1.0 },
      { name: "Security & Compliance", key: "security-compliance", weight: 1.1 },
      { name: "Ease of Use", key: "ease-of-use", weight: 0.9 },
    ],
    benchmarks: [
      { name: "TPC-DS 1TB Query Time", key: "tpcds-1tb", unit: "seconds", higherIsBetter: false },
      { name: "Concurrent Query Throughput", key: "concurrent-throughput", unit: "qps", higherIsBetter: true },
    ],
    vendors: [
      { name: "Snowflake", tier: "leader", founded: 2012, hq: "Bozeman, MT", emp: "5000-10000", website: "https://snowflake.com", desc: "Cloud-native data platform with separation of storage and compute, enabling near-unlimited scalability.", products: [{ name: "Snowflake Data Cloud", caps: ["auto-scaling", "time-travel", "data-sharing", "semi-structured-data"] }, { name: "Snowpark", caps: ["python-support", "ml-pipelines", "udf-support"] }] },
      { name: "Google BigQuery", tier: "leader", founded: 2010, hq: "Mountain View, CA", emp: "10000+", website: "https://cloud.google.com/bigquery", desc: "Serverless, highly scalable multi-cloud data warehouse with built-in ML and BI engine.", products: [{ name: "BigQuery", caps: ["serverless", "ml-built-in", "geospatial", "streaming-ingest"] }, { name: "BigQuery Omni", caps: ["multi-cloud", "cross-cloud-analytics"] }] },
      { name: "Amazon Redshift", tier: "leader", founded: 2012, hq: "Seattle, WA", emp: "10000+", website: "https://aws.amazon.com/redshift", desc: "Fully managed petabyte-scale data warehouse with Redshift Serverless and ML integration.", products: [{ name: "Redshift Serverless", caps: ["auto-scaling", "pay-per-use", "ml-integration"] }, { name: "Redshift Spectrum", caps: ["s3-querying", "data-lake-integration", "federated-query"] }] },
      { name: "Databricks SQL", tier: "leader", founded: 2013, hq: "San Francisco, CA", emp: "5000-10000", website: "https://databricks.com", desc: "Lakehouse platform unifying data warehousing and AI with Delta Lake foundation.", products: [{ name: "Databricks SQL Warehouse", caps: ["lakehouse", "photon-engine", "unity-catalog"] }, { name: "Delta Lake", caps: ["acid-transactions", "schema-evolution", "time-travel"] }] },
      { name: "Microsoft Fabric", tier: "challenger", founded: 2023, hq: "Redmond, WA", emp: "10000+", website: "https://microsoft.com/fabric", desc: "Unified analytics platform integrating data warehousing, engineering, and science in one SaaS.", products: [{ name: "Fabric Warehouse", caps: ["onelake", "direct-lake", "copilot-integration"] }, { name: "Fabric Lakehouse", caps: ["spark-integration", "delta-parquet", "shortcuts"] }] },
      { name: "Firebolt", tier: "challenger", founded: 2019, hq: "Tel Aviv, Israel", emp: "100-500", website: "https://firebolt.io", desc: "Cloud data warehouse engineered for sub-second analytics on large datasets.", products: [{ name: "Firebolt Engine", caps: ["sub-second-queries", "sparse-indexes", "aggregating-indexes"] }, { name: "Firebolt Serverless", caps: ["auto-suspend", "pay-per-query"] }] },
      { name: "ClickHouse", tier: "challenger", founded: 2016, hq: "San Francisco, CA", emp: "500-1000", website: "https://clickhouse.com", desc: "Open-source columnar DBMS for real-time analytical queries at petabyte scale.", products: [{ name: "ClickHouse Cloud", caps: ["real-time-analytics", "columnar-storage", "materialized-views"] }, { name: "ClickHouse OSS", caps: ["self-hosted", "community-driven", "custom-deployment"] }] },
      { name: "Teradata Vantage", tier: "niche", founded: 1979, hq: "San Diego, CA", emp: "5000-10000", website: "https://teradata.com", desc: "Enterprise analytics platform with decades of experience in large-scale data warehousing.", products: [{ name: "Vantage ClearScape", caps: ["advanced-analytics", "in-database-ml", "multi-cloud"] }, { name: "Vantage Cloud Lake", caps: ["object-storage", "elastic-compute", "data-mesh-support"] }] },
      { name: "Dremio", tier: "emerging", founded: 2015, hq: "Santa Clara, CA", emp: "500-1000", website: "https://dremio.com", desc: "Open lakehouse platform with Apache Iceberg-native architecture for high-performance SQL.", products: [{ name: "Dremio Sonar", caps: ["iceberg-native", "data-reflections", "sql-on-data-lake"] }, { name: "Dremio Arctic", caps: ["catalog-management", "branching", "versioning"] }] },
    ],
  },
  {
    name: "ETL & Data Integration",
    slug: "etl-data-integration",
    description: "Tools for extracting, transforming, loading, and orchestrating data across systems.",
    icon: "Workflow",
    color: "#00B4D8",
    sortOrder: 2,
    criteria: [
      { name: "Connector Ecosystem", key: "connector-ecosystem", weight: 1.4 },
      { name: "Transformation Capability", key: "transformation-capability", weight: 1.3 },
      { name: "Scalability", key: "scalability", weight: 1.1 },
      { name: "Ease of Use", key: "ease-of-use", weight: 1.0 },
      { name: "Monitoring & Observability", key: "monitoring", weight: 0.9 },
      { name: "Cost", key: "cost", weight: 1.0 },
    ],
    benchmarks: [
      { name: "Rows Processed Per Second", key: "etl-throughput", unit: "rows/s", higherIsBetter: true },
      { name: "Connector Count", key: "connector-count", unit: "connectors", higherIsBetter: true },
    ],
    vendors: [
      { name: "Fivetran", tier: "leader", founded: 2012, hq: "Oakland, CA", emp: "1000-5000", website: "https://fivetran.com", desc: "Automated ELT platform with 500+ pre-built connectors and zero-maintenance pipelines.", products: [{ name: "Fivetran ELT", caps: ["auto-schema-migration", "incremental-sync", "log-based-cdc"] }, { name: "Fivetran Transformations", caps: ["dbt-integration", "sql-transforms", "scheduling"] }] },
      { name: "dbt Labs", tier: "leader", founded: 2016, hq: "Philadelphia, PA", emp: "500-1000", website: "https://getdbt.com", desc: "Analytics engineering platform enabling SQL-based transformations with version control and testing.", products: [{ name: "dbt Cloud", caps: ["ci-cd", "ide", "job-scheduling", "data-docs"] }, { name: "dbt Core", caps: ["open-source", "jinja-templating", "test-framework"] }] },
      { name: "Airbyte", tier: "challenger", founded: 2020, hq: "San Francisco, CA", emp: "100-500", website: "https://airbyte.com", desc: "Open-source data integration platform with 300+ connectors and custom connector SDK.", products: [{ name: "Airbyte Cloud", caps: ["managed-connectors", "cdc", "incremental-sync"] }, { name: "Airbyte OSS", caps: ["self-hosted", "connector-builder", "community-connectors"] }] },
      { name: "Informatica", tier: "leader", founded: 1993, hq: "Redwood City, CA", emp: "5000-10000", website: "https://informatica.com", desc: "Enterprise-grade data integration and governance with AI-powered automation.", products: [{ name: "Intelligent Data Management Cloud", caps: ["ai-matching", "data-quality", "mdm"] }, { name: "PowerCenter", caps: ["enterprise-etl", "complex-transforms", "legacy-integration"] }] },
      { name: "Talend", tier: "challenger", founded: 2005, hq: "Redwood City, CA", emp: "1000-5000", website: "https://talend.com", desc: "Data integration and integrity platform with open-source heritage.", products: [{ name: "Talend Data Fabric", caps: ["data-quality", "big-data-integration", "api-services"] }, { name: "Stitch Data", caps: ["simple-elt", "developer-friendly", "fast-setup"] }] },
      { name: "Apache Airflow", tier: "challenger", founded: 2014, hq: "Open Source", emp: "N/A", website: "https://airflow.apache.org", desc: "Programmatic workflow orchestration platform for complex data pipeline scheduling.", products: [{ name: "Apache Airflow", caps: ["dag-based-workflows", "extensible-operators", "python-native"] }, { name: "Astronomer", caps: ["managed-airflow", "monitoring", "enterprise-support"] }] },
      { name: "Matillion", tier: "emerging", founded: 2011, hq: "Manchester, UK", emp: "500-1000", website: "https://matillion.com", desc: "Cloud-native data integration for loading and transforming data in cloud warehouses.", products: [{ name: "Matillion ETL", caps: ["push-down-processing", "visual-designer", "git-integration"] }, { name: "Matillion Data Productivity Cloud", caps: ["low-code", "collaboration", "lineage"] }] },
      { name: "Prefect", tier: "emerging", founded: 2018, hq: "Washington, DC", emp: "100-500", website: "https://prefect.io", desc: "Modern workflow orchestration with Python-native task management and observability.", products: [{ name: "Prefect Cloud", caps: ["flow-orchestration", "automations", "work-pools"] }, { name: "Prefect OSS", caps: ["python-native", "retry-logic", "caching"] }] },
    ],
  },
  {
    name: "BI & Analytics",
    slug: "bi-analytics",
    description: "Business intelligence platforms for data visualization, dashboarding, and self-service analytics.",
    icon: "BarChart3",
    color: "#1B2A4A",
    sortOrder: 3,
    criteria: [
      { name: "Visualization Capabilities", key: "visualization", weight: 1.4 },
      { name: "Self-Service Analytics", key: "self-service", weight: 1.2 },
      { name: "Embedded Analytics", key: "embedded-analytics", weight: 1.0 },
      { name: "Performance", key: "performance", weight: 1.1 },
      { name: "Governance", key: "governance", weight: 1.0 },
      { name: "AI/ML Integration", key: "ai-ml-integration", weight: 0.9 },
    ],
    benchmarks: [
      { name: "Dashboard Load Time", key: "dashboard-load", unit: "ms", higherIsBetter: false },
      { name: "Concurrent Users Supported", key: "concurrent-users", unit: "users", higherIsBetter: true },
    ],
    vendors: [
      { name: "Tableau", tier: "leader", founded: 2003, hq: "Seattle, WA", emp: "5000-10000", website: "https://tableau.com", desc: "Industry-leading visual analytics platform with powerful drag-and-drop data exploration.", products: [{ name: "Tableau Cloud", caps: ["visual-analytics", "ask-data", "data-stories"] }, { name: "Tableau Pulse", caps: ["ai-insights", "personalized-metrics", "natural-language"] }] },
      { name: "Power BI", tier: "leader", founded: 2015, hq: "Redmond, WA", emp: "10000+", website: "https://powerbi.microsoft.com", desc: "Microsoft's self-service BI tool with deep Office 365 and Azure integration.", products: [{ name: "Power BI Pro", caps: ["report-builder", "dataflows", "paginated-reports"] }, { name: "Power BI Premium", caps: ["large-datasets", "deployment-pipelines", "ai-insights"] }] },
      { name: "Looker", tier: "leader", founded: 2012, hq: "Santa Cruz, CA", emp: "1000-5000", website: "https://cloud.google.com/looker", desc: "Semantic layer-driven BI platform with LookML modeling and embedded analytics.", products: [{ name: "Looker", caps: ["lookml-modeling", "embedded-analytics", "data-actions"] }, { name: "Looker Studio", caps: ["free-dashboards", "google-integration", "community-connectors"] }] },
      { name: "Metabase", tier: "challenger", founded: 2014, hq: "San Francisco, CA", emp: "100-500", website: "https://metabase.com", desc: "Open-source BI tool focused on simplicity and fast time-to-insight for all users.", products: [{ name: "Metabase Cloud", caps: ["no-code-queries", "interactive-dashboards", "embedding"] }, { name: "Metabase OSS", caps: ["self-hosted", "community-drivers", "simple-setup"] }] },
      { name: "ThoughtSpot", tier: "challenger", founded: 2012, hq: "Sunnyvale, CA", emp: "1000-5000", website: "https://thoughtspot.com", desc: "AI-powered analytics platform with natural language search and SpotIQ insights.", products: [{ name: "ThoughtSpot", caps: ["search-analytics", "spotiq-ai", "liveboards"] }, { name: "ThoughtSpot Everywhere", caps: ["embedded-analytics", "rest-api", "custom-actions"] }] },
      { name: "Sigma Computing", tier: "emerging", founded: 2014, hq: "San Francisco, CA", emp: "500-1000", website: "https://sigmacomputing.com", desc: "Cloud-native analytics with familiar spreadsheet interface directly on cloud warehouse.", products: [{ name: "Sigma", caps: ["spreadsheet-ui", "live-warehouse-queries", "collaboration"] }, { name: "Sigma Embedding", caps: ["embedded-analytics", "white-label", "row-level-security"] }] },
      { name: "Apache Superset", tier: "emerging", founded: 2015, hq: "Open Source", emp: "N/A", website: "https://superset.apache.org", desc: "Open-source modern data exploration and visualization platform.", products: [{ name: "Apache Superset", caps: ["sql-lab", "chart-plugins", "dashboard-templates"] }, { name: "Preset Cloud", caps: ["managed-superset", "enterprise-support", "sso"] }] },
      { name: "Qlik Sense", tier: "challenger", founded: 1993, hq: "King of Prussia, PA", emp: "1000-5000", website: "https://qlik.com", desc: "Augmented analytics platform with associative engine for unlimited data exploration.", products: [{ name: "Qlik Sense", caps: ["associative-engine", "augmented-analytics", "qlik-automl"] }, { name: "Qlik Cloud", caps: ["saas-analytics", "data-integration", "alerting"] }] },
      { name: "Mode Analytics", tier: "niche", founded: 2013, hq: "San Francisco, CA", emp: "100-500", website: "https://mode.com", desc: "Collaborative analytics platform combining SQL, Python, and visual exploration.", products: [{ name: "Mode", caps: ["sql-editor", "python-notebooks", "report-builder"] }, { name: "Mode Embedded", caps: ["embedded-reports", "api-access", "white-label"] }] },
    ],
  },
  {
    name: "Data Governance & Catalogs",
    slug: "data-governance",
    description: "Metadata management, data cataloging, lineage tracking, and governance frameworks.",
    icon: "Shield",
    color: "#6C63FF",
    sortOrder: 4,
    criteria: [
      { name: "Metadata Management", key: "metadata-management", weight: 1.3 },
      { name: "Data Lineage", key: "data-lineage", weight: 1.4 },
      { name: "Access Controls", key: "access-controls", weight: 1.2 },
      { name: "Automation", key: "automation", weight: 1.0 },
      { name: "Integration Breadth", key: "integration-breadth", weight: 1.1 },
      { name: "Usability", key: "usability", weight: 0.9 },
    ],
    benchmarks: [
      { name: "Metadata Scan Time", key: "metadata-scan", unit: "minutes", higherIsBetter: false },
      { name: "Lineage Depth", key: "lineage-depth", unit: "levels", higherIsBetter: true },
    ],
    vendors: [
      { name: "Alation", tier: "leader", founded: 2012, hq: "Redwood City, CA", emp: "500-1000", website: "https://alation.com", desc: "AI-driven data catalog and governance platform trusted by Fortune 500 companies.", products: [{ name: "Alation Data Catalog", caps: ["ai-curation", "data-stewardship", "trust-flags"] }, { name: "Alation Governance", caps: ["policy-center", "access-governance", "classification"] }] },
      { name: "Collibra", tier: "leader", founded: 2008, hq: "New York, NY", emp: "1000-5000", website: "https://collibra.com", desc: "End-to-end data governance platform with business glossary and data marketplace.", products: [{ name: "Collibra Data Intelligence", caps: ["business-glossary", "data-marketplace", "workflow-engine"] }, { name: "Collibra Lineage", caps: ["automated-lineage", "impact-analysis", "column-level-lineage"] }] },
      { name: "Atlan", tier: "challenger", founded: 2019, hq: "New York, NY", emp: "500-1000", website: "https://atlan.com", desc: "Active metadata platform with collaboration-first approach to data governance.", products: [{ name: "Atlan", caps: ["active-metadata", "playbooks", "slack-integration"] }, { name: "Atlan Lineage", caps: ["automated-lineage", "custom-lineage", "api-first"] }] },
      { name: "DataHub", tier: "emerging", founded: 2020, hq: "Open Source (Acryl Data)", emp: "100-500", website: "https://datahubproject.io", desc: "Open-source metadata platform originated at LinkedIn for data discovery and governance.", products: [{ name: "DataHub OSS", caps: ["metadata-ingestion", "data-discovery", "graphql-api"] }, { name: "Acryl DataHub", caps: ["managed-service", "enterprise-features", "sso"] }] },
      { name: "Informatica Axon", tier: "leader", founded: 1993, hq: "Redwood City, CA", emp: "5000-10000", website: "https://informatica.com", desc: "Enterprise data governance within the Informatica intelligent data management ecosystem.", products: [{ name: "Axon Data Governance", caps: ["business-glossary", "data-marketplace", "policy-management"] }, { name: "Enterprise Data Catalog", caps: ["ai-powered-discovery", "lineage-visualization", "profiling"] }] },
      { name: "Apache Atlas", tier: "niche", founded: 2015, hq: "Open Source", emp: "N/A", website: "https://atlas.apache.org", desc: "Open-source metadata management and governance for Hadoop ecosystem.", products: [{ name: "Apache Atlas", caps: ["type-system", "classification", "lineage-tracking"] }] },
      { name: "Secoda", tier: "emerging", founded: 2020, hq: "Toronto, Canada", emp: "50-100", website: "https://secoda.co", desc: "AI-powered data management platform for data teams to catalog and document data.", products: [{ name: "Secoda", caps: ["ai-documentation", "data-dictionary", "lineage"] }, { name: "Secoda AI Assistant", caps: ["natural-language-search", "auto-documentation", "slack-bot"] }] },
      { name: "Select Star", tier: "emerging", founded: 2019, hq: "San Francisco, CA", emp: "50-100", website: "https://selectstar.com", desc: "Automated data discovery and lineage platform with popularity-based insights.", products: [{ name: "Select Star", caps: ["auto-lineage", "popularity-analytics", "column-level-lineage"] }] },
    ],
  },
  {
    name: "AI & ML Platforms",
    slug: "ai-ml-platforms",
    description: "End-to-end machine learning platforms for model development, training, deployment, and monitoring.",
    icon: "Brain",
    color: "#E63946",
    sortOrder: 5,
    criteria: [
      { name: "Model Development", key: "model-development", weight: 1.3 },
      { name: "MLOps & Deployment", key: "mlops-deployment", weight: 1.4 },
      { name: "GPU/Compute Infrastructure", key: "compute-infra", weight: 1.2 },
      { name: "Experiment Tracking", key: "experiment-tracking", weight: 1.0 },
      { name: "Model Registry", key: "model-registry", weight: 1.0 },
      { name: "LLM/GenAI Support", key: "llm-genai-support", weight: 1.3 },
    ],
    benchmarks: [
      { name: "Model Training Time (ResNet-50)", key: "resnet50-train", unit: "minutes", higherIsBetter: false },
      { name: "Inference Latency (p99)", key: "inference-p99", unit: "ms", higherIsBetter: false },
    ],
    vendors: [
      { name: "Databricks ML", tier: "leader", founded: 2013, hq: "San Francisco, CA", emp: "5000-10000", website: "https://databricks.com", desc: "Unified data and AI platform with MLflow, Feature Store, and Model Serving built-in.", products: [{ name: "Mosaic AI", caps: ["foundation-model-training", "rag-tools", "model-serving"] }, { name: "MLflow", caps: ["experiment-tracking", "model-registry", "deployment"] }] },
      { name: "AWS SageMaker", tier: "leader", founded: 2017, hq: "Seattle, WA", emp: "10000+", website: "https://aws.amazon.com/sagemaker", desc: "Fully managed ML service for building, training, and deploying models at scale.", products: [{ name: "SageMaker Studio", caps: ["notebooks", "autopilot", "model-monitor"] }, { name: "SageMaker JumpStart", caps: ["foundation-models", "pre-trained-models", "fine-tuning"] }] },
      { name: "Google Vertex AI", tier: "leader", founded: 2021, hq: "Mountain View, CA", emp: "10000+", website: "https://cloud.google.com/vertex-ai", desc: "Google Cloud's unified ML platform with AutoML, custom training, and Gemini integration.", products: [{ name: "Vertex AI", caps: ["automl", "custom-training", "model-garden"] }, { name: "Vertex AI Agent Builder", caps: ["rag", "grounding", "orchestration"] }] },
      { name: "Azure ML", tier: "leader", founded: 2018, hq: "Redmond, WA", emp: "10000+", website: "https://azure.microsoft.com/products/machine-learning", desc: "Enterprise ML platform with responsible AI tooling and Azure OpenAI integration.", products: [{ name: "Azure ML Studio", caps: ["designer", "automated-ml", "pipeline-orchestration"] }, { name: "Azure OpenAI Service", caps: ["gpt-models", "fine-tuning", "content-filtering"] }] },
      { name: "Weights & Biases", tier: "challenger", founded: 2017, hq: "San Francisco, CA", emp: "500-1000", website: "https://wandb.ai", desc: "Developer-first ML platform for experiment tracking, dataset versioning, and model evaluation.", products: [{ name: "W&B Platform", caps: ["experiment-tracking", "sweeps", "artifacts"] }, { name: "W&B Weave", caps: ["llm-evaluation", "tracing", "monitoring"] }] },
      { name: "Hugging Face", tier: "challenger", founded: 2016, hq: "New York, NY", emp: "500-1000", website: "https://huggingface.co", desc: "Open-source AI community hub with model hosting, datasets, and inference APIs.", products: [{ name: "Hugging Face Hub", caps: ["model-hosting", "datasets", "spaces"] }, { name: "Inference Endpoints", caps: ["model-serving", "auto-scaling", "gpu-optimization"] }] },
      { name: "MLflow (OSS)", tier: "emerging", founded: 2018, hq: "Open Source", emp: "N/A", website: "https://mlflow.org", desc: "Open-source platform for ML lifecycle management including tracking, packaging, and deployment.", products: [{ name: "MLflow", caps: ["tracking", "projects", "models", "registry"] }] },
      { name: "Neptune.ai", tier: "niche", founded: 2017, hq: "Warsaw, Poland", emp: "50-100", website: "https://neptune.ai", desc: "Experiment tracking and model registry for ML teams running many experiments.", products: [{ name: "Neptune", caps: ["experiment-tracking", "model-registry", "comparison-tools"] }] },
    ],
  },
  {
    name: "Data Quality & Observability",
    slug: "data-quality",
    description: "Tools for monitoring data quality, detecting anomalies, and ensuring data reliability.",
    icon: "Zap",
    color: "#F4A261",
    sortOrder: 6,
    criteria: [
      { name: "Anomaly Detection", key: "anomaly-detection", weight: 1.4 },
      { name: "Data Profiling", key: "data-profiling", weight: 1.2 },
      { name: "Root Cause Analysis", key: "root-cause", weight: 1.1 },
      { name: "Integration Coverage", key: "integration-coverage", weight: 1.0 },
      { name: "Alerting", key: "alerting", weight: 1.0 },
      { name: "Incident Management", key: "incident-management", weight: 0.9 },
    ],
    benchmarks: [
      { name: "Anomaly Detection Accuracy", key: "anomaly-accuracy", unit: "%", higherIsBetter: true },
      { name: "Time to Alert", key: "time-to-alert", unit: "minutes", higherIsBetter: false },
    ],
    vendors: [
      { name: "Monte Carlo", tier: "leader", founded: 2019, hq: "San Francisco, CA", emp: "100-500", website: "https://montecarlodata.com", desc: "End-to-end data observability platform for automated monitoring and root cause analysis.", products: [{ name: "Monte Carlo", caps: ["automated-monitoring", "lineage-powered-rca", "circuit-breakers"] }, { name: "Monte Carlo Impact", caps: ["freshness-monitoring", "volume-monitoring", "schema-tracking"] }] },
      { name: "Great Expectations", tier: "challenger", founded: 2018, hq: "Minneapolis, MN", emp: "100-500", website: "https://greatexpectations.io", desc: "Open-source data quality framework with declarative data validation and testing.", products: [{ name: "GX Cloud", caps: ["expectation-suites", "data-docs", "checkpoint-scheduling"] }, { name: "GX OSS", caps: ["python-api", "custom-expectations", "ci-cd-integration"] }] },
      { name: "Soda", tier: "challenger", founded: 2020, hq: "Brussels, Belgium", emp: "50-100", website: "https://soda.io", desc: "Data quality platform with SodaCL language for writing human-readable data checks.", products: [{ name: "Soda Cloud", caps: ["sodacl", "automated-monitoring", "incident-management"] }, { name: "Soda Core", caps: ["open-source", "cli-tool", "ci-cd-integration"] }] },
      { name: "Bigeye", tier: "emerging", founded: 2019, hq: "San Francisco, CA", emp: "50-100", website: "https://bigeye.com", desc: "Automated data quality monitoring with ML-powered threshold setting.", products: [{ name: "Bigeye", caps: ["auto-thresholds", "freshness-monitoring", "custom-metrics"] }] },
      { name: "Anomalo", tier: "emerging", founded: 2018, hq: "Palo Alto, CA", emp: "50-100", website: "https://anomalo.com", desc: "AI-powered data quality platform that automatically detects data issues.", products: [{ name: "Anomalo", caps: ["unsupervised-detection", "root-cause-analysis", "auto-validation"] }] },
      { name: "dbt Tests", tier: "niche", founded: 2016, hq: "Philadelphia, PA", emp: "500-1000", website: "https://getdbt.com", desc: "Built-in testing framework within dbt for schema tests and custom data validations.", products: [{ name: "dbt Tests", caps: ["schema-tests", "custom-tests", "freshness-checks"] }] },
      { name: "Lightup", tier: "niche", founded: 2019, hq: "Palo Alto, CA", emp: "50-100", website: "https://lightup.ai", desc: "Data quality monitoring with configurable rules and multi-warehouse support.", products: [{ name: "Lightup", caps: ["rule-based-monitoring", "ml-anomaly-detection", "multi-warehouse"] }] },
      { name: "Databand (IBM)", tier: "niche", founded: 2018, hq: "Tel Aviv, Israel", emp: "50-100", website: "https://databand.ai", desc: "Pipeline observability and data quality monitoring acquired by IBM.", products: [{ name: "Databand", caps: ["pipeline-monitoring", "alerting", "integration-hooks"] }] },
    ],
  },
  {
    name: "Stream Processing",
    slug: "stream-processing",
    description: "Real-time data streaming, event processing, and message queue platforms.",
    icon: "Cpu",
    color: "#2A9D8F",
    sortOrder: 7,
    criteria: [
      { name: "Throughput", key: "throughput", weight: 1.5 },
      { name: "Latency", key: "latency", weight: 1.4 },
      { name: "Exactly-Once Semantics", key: "exactly-once", weight: 1.2 },
      { name: "Ecosystem", key: "ecosystem", weight: 1.0 },
      { name: "Operability", key: "operability", weight: 0.9 },
      { name: "Cost Efficiency", key: "cost-efficiency", weight: 1.0 },
    ],
    benchmarks: [
      { name: "Messages Per Second", key: "stream-mps", unit: "msg/s", higherIsBetter: true },
      { name: "End-to-End Latency", key: "stream-latency", unit: "ms", higherIsBetter: false },
    ],
    vendors: [
      { name: "Apache Kafka", tier: "leader", founded: 2011, hq: "Open Source", emp: "N/A", website: "https://kafka.apache.org", desc: "Distributed event streaming platform for high-throughput, fault-tolerant data pipelines.", products: [{ name: "Apache Kafka", caps: ["pub-sub", "exactly-once", "log-compaction"] }, { name: "Kafka Connect", caps: ["source-connectors", "sink-connectors", "transforms"] }] },
      { name: "Confluent", tier: "leader", founded: 2014, hq: "Mountain View, CA", emp: "1000-5000", website: "https://confluent.io", desc: "Enterprise Kafka platform with fully managed cloud, Schema Registry, and ksqlDB.", products: [{ name: "Confluent Cloud", caps: ["managed-kafka", "schema-registry", "stream-governance"] }, { name: "ksqlDB", caps: ["stream-processing", "sql-interface", "materialized-views"] }] },
      { name: "Apache Flink", tier: "leader", founded: 2014, hq: "Open Source", emp: "N/A", website: "https://flink.apache.org", desc: "Stateful stream processing framework for distributed, high-performance computations.", products: [{ name: "Apache Flink", caps: ["stateful-processing", "event-time", "checkpointing"] }, { name: "Flink SQL", caps: ["sql-streaming", "temporal-joins", "windowing"] }] },
      { name: "Amazon Kinesis", tier: "challenger", founded: 2013, hq: "Seattle, WA", emp: "10000+", website: "https://aws.amazon.com/kinesis", desc: "AWS managed service for real-time data streaming and analytics.", products: [{ name: "Kinesis Data Streams", caps: ["shard-management", "enhanced-fan-out", "on-demand"] }, { name: "Kinesis Data Firehose", caps: ["auto-delivery", "format-conversion", "s3-delivery"] }] },
      { name: "Redpanda", tier: "challenger", founded: 2019, hq: "San Francisco, CA", emp: "100-500", website: "https://redpanda.com", desc: "Kafka-compatible streaming platform built in C++ for extreme performance.", products: [{ name: "Redpanda", caps: ["kafka-compatible", "no-zookeeper", "wasm-transforms"] }, { name: "Redpanda Cloud", caps: ["managed-service", "byoc", "auto-scaling"] }] },
      { name: "Apache Pulsar", tier: "emerging", founded: 2016, hq: "Open Source", emp: "N/A", website: "https://pulsar.apache.org", desc: "Multi-tenant distributed messaging and streaming with tiered storage.", products: [{ name: "Apache Pulsar", caps: ["multi-tenancy", "tiered-storage", "geo-replication"] }, { name: "StreamNative", caps: ["managed-pulsar", "enterprise-support", "ursa-engine"] }] },
      { name: "Google Pub/Sub", tier: "challenger", founded: 2015, hq: "Mountain View, CA", emp: "10000+", website: "https://cloud.google.com/pubsub", desc: "Serverless messaging service for event-driven architectures on Google Cloud.", products: [{ name: "Cloud Pub/Sub", caps: ["serverless", "global-delivery", "dead-letter"] }, { name: "Pub/Sub Lite", caps: ["zonal-storage", "cost-optimized", "partitioned-topics"] }] },
      { name: "RisingWave", tier: "emerging", founded: 2021, hq: "San Francisco, CA", emp: "50-100", website: "https://risingwave.com", desc: "Postgres-compatible streaming database for real-time materialized views.", products: [{ name: "RisingWave", caps: ["streaming-sql", "materialized-views", "postgres-compatible"] }] },
    ],
  },
  {
    name: "Data Lakes & Lakehouse",
    slug: "data-lakes",
    description: "Scalable storage platforms for structured and unstructured data with analytical capabilities.",
    icon: "Server",
    color: "#264653",
    sortOrder: 8,
    criteria: [
      { name: "Storage Scalability", key: "storage-scalability", weight: 1.3 },
      { name: "Query Engine", key: "query-engine", weight: 1.2 },
      { name: "Table Format Support", key: "table-format", weight: 1.4 },
      { name: "Cost Optimization", key: "cost-optimization", weight: 1.1 },
      { name: "Governance", key: "governance", weight: 1.0 },
      { name: "Ecosystem", key: "ecosystem", weight: 1.0 },
    ],
    benchmarks: [
      { name: "TPC-H 100GB Scan", key: "tpch-100gb", unit: "seconds", higherIsBetter: false },
      { name: "Storage Cost per TB/month", key: "storage-cost", unit: "$/TB", higherIsBetter: false },
    ],
    vendors: [
      { name: "Databricks Lakehouse", tier: "leader", founded: 2013, hq: "San Francisco, CA", emp: "5000-10000", website: "https://databricks.com", desc: "Pioneering lakehouse platform combining data lake flexibility with warehouse performance.", products: [{ name: "Delta Lake", caps: ["acid-transactions", "schema-enforcement", "time-travel"] }, { name: "Unity Catalog", caps: ["unified-governance", "data-sharing", "lineage"] }] },
      { name: "Apache Iceberg", tier: "leader", founded: 2017, hq: "Open Source", emp: "N/A", website: "https://iceberg.apache.org", desc: "Open table format for huge analytic datasets with full schema evolution.", products: [{ name: "Apache Iceberg", caps: ["schema-evolution", "partition-evolution", "time-travel"] }] },
      { name: "Apache Hudi", tier: "challenger", founded: 2016, hq: "Open Source (Onehouse)", emp: "50-100", website: "https://hudi.apache.org", desc: "Open-source data lake framework for incremental data processing and record-level updates.", products: [{ name: "Apache Hudi", caps: ["upserts", "incremental-processing", "compaction"] }, { name: "Onehouse", caps: ["managed-hudi", "auto-optimization", "interop"] }] },
      { name: "AWS Lake Formation", tier: "challenger", founded: 2019, hq: "Seattle, WA", emp: "10000+", website: "https://aws.amazon.com/lake-formation", desc: "Managed data lake service simplifying security, governance, and access control on AWS.", products: [{ name: "Lake Formation", caps: ["fine-grained-access", "cross-account-sharing", "governed-tables"] }] },
      { name: "Azure Data Lake", tier: "challenger", founded: 2018, hq: "Redmond, WA", emp: "10000+", website: "https://azure.microsoft.com/products/data-lake-analytics", desc: "Scalable data lake storage integrated with Azure analytics and ML services.", products: [{ name: "ADLS Gen2", caps: ["hierarchical-namespace", "blob-integration", "azure-rbac"] }] },
      { name: "MinIO", tier: "emerging", founded: 2014, hq: "Palo Alto, CA", emp: "100-500", website: "https://min.io", desc: "High-performance S3-compatible object storage for private cloud data lakes.", products: [{ name: "MinIO", caps: ["s3-compatible", "erasure-coding", "kubernetes-native"] }] },
      { name: "Google Cloud Storage", tier: "challenger", founded: 2010, hq: "Mountain View, CA", emp: "10000+", website: "https://cloud.google.com/storage", desc: "Multi-class object storage with integrated analytics through BigLake.", products: [{ name: "Cloud Storage", caps: ["multi-class", "lifecycle-management", "biglake-integration"] }, { name: "BigLake", caps: ["unified-access", "iceberg-support", "fine-grained-security"] }] },
      { name: "Tabular", tier: "emerging", founded: 2021, hq: "San Jose, CA", emp: "50-100", website: "https://tabular.io", desc: "Managed Iceberg service from the creators of Apache Iceberg for enterprise lakehouses.", products: [{ name: "Tabular", caps: ["managed-iceberg", "auto-compaction", "role-based-access"] }] },
    ],
  },
  {
    name: "API Management",
    slug: "api-management",
    description: "Platforms for designing, deploying, securing, and monitoring APIs at scale.",
    icon: "Globe",
    color: "#E76F51",
    sortOrder: 9,
    criteria: [
      { name: "Gateway Performance", key: "gateway-performance", weight: 1.3 },
      { name: "Developer Portal", key: "developer-portal", weight: 1.1 },
      { name: "Security", key: "security", weight: 1.4 },
      { name: "Analytics", key: "analytics", weight: 1.0 },
      { name: "Multi-Cloud", key: "multi-cloud", weight: 0.9 },
      { name: "Ease of Use", key: "ease-of-use", weight: 1.0 },
    ],
    benchmarks: [
      { name: "Requests Per Second", key: "api-rps", unit: "req/s", higherIsBetter: true },
      { name: "P99 Latency", key: "api-p99", unit: "ms", higherIsBetter: false },
    ],
    vendors: [
      { name: "Kong", tier: "leader", founded: 2017, hq: "San Francisco, CA", emp: "500-1000", website: "https://konghq.com", desc: "Cloud-native API gateway and service mesh built on NGINX/OpenResty.", products: [{ name: "Kong Gateway", caps: ["rate-limiting", "authentication", "plugin-ecosystem"] }, { name: "Kong Konnect", caps: ["saas-management", "dev-portal", "analytics"] }] },
      { name: "Apigee (Google)", tier: "leader", founded: 2004, hq: "Mountain View, CA", emp: "10000+", website: "https://cloud.google.com/apigee", desc: "Enterprise API management platform with analytics, monetization, and security.", products: [{ name: "Apigee X", caps: ["api-gateway", "monetization", "threat-protection"] }, { name: "Apigee Hybrid", caps: ["multi-cloud", "on-prem", "kubernetes"] }] },
      { name: "AWS API Gateway", tier: "leader", founded: 2015, hq: "Seattle, WA", emp: "10000+", website: "https://aws.amazon.com/api-gateway", desc: "Managed service for creating, publishing, and managing REST, HTTP, and WebSocket APIs.", products: [{ name: "API Gateway REST", caps: ["lambda-integration", "caching", "throttling"] }, { name: "API Gateway HTTP", caps: ["low-latency", "oidc-auth", "vpc-link"] }] },
      { name: "MuleSoft", tier: "leader", founded: 2006, hq: "San Francisco, CA", emp: "5000-10000", website: "https://mulesoft.com", desc: "Salesforce-owned integration and API management platform for enterprise connectivity.", products: [{ name: "Anypoint Platform", caps: ["api-designer", "runtime-manager", "exchange"] }, { name: "MuleSoft Composer", caps: ["no-code-integration", "connectors", "automation"] }] },
      { name: "Azure API Management", tier: "challenger", founded: 2014, hq: "Redmond, WA", emp: "10000+", website: "https://azure.microsoft.com/products/api-management", desc: "Hybrid, multi-cloud API gateway for managing APIs across all environments.", products: [{ name: "APIM", caps: ["policy-engine", "dev-portal", "versioning"] }] },
      { name: "Postman", tier: "challenger", founded: 2014, hq: "San Francisco, CA", emp: "500-1000", website: "https://postman.com", desc: "API platform for building, testing, and collaborating on APIs with team workspaces.", products: [{ name: "Postman", caps: ["api-testing", "mock-servers", "documentation"] }, { name: "Postman Flows", caps: ["visual-workflows", "api-chaining", "data-visualization"] }] },
      { name: "Tyk", tier: "emerging", founded: 2014, hq: "London, UK", emp: "100-500", website: "https://tyk.io", desc: "Open-source API gateway and management platform with GraphQL support.", products: [{ name: "Tyk Gateway", caps: ["open-source", "graphql-support", "grpc-proxy"] }, { name: "Tyk Cloud", caps: ["managed-gateway", "dashboard", "developer-portal"] }] },
      { name: "Gravitee", tier: "emerging", founded: 2015, hq: "Lille, France", emp: "100-500", website: "https://gravitee.io", desc: "Open-source API management platform with event-native API capabilities.", products: [{ name: "Gravitee APIM", caps: ["api-gateway", "design-studio", "policy-engine"] }, { name: "Gravitee Access Management", caps: ["identity-provider", "mfa", "social-login"] }] },
    ],
  },
  {
    name: "Data Security & Privacy",
    slug: "data-security",
    description: "Data encryption, masking, access control, and privacy compliance platforms.",
    icon: "Lock",
    color: "#D62828",
    sortOrder: 10,
    criteria: [
      { name: "Encryption & Key Management", key: "encryption", weight: 1.4 },
      { name: "Access Control Granularity", key: "access-control", weight: 1.3 },
      { name: "Data Masking", key: "data-masking", weight: 1.2 },
      { name: "Compliance Coverage", key: "compliance", weight: 1.3 },
      { name: "Audit & Logging", key: "audit-logging", weight: 1.0 },
      { name: "Performance Impact", key: "performance-impact", weight: 0.9 },
    ],
    benchmarks: [
      { name: "Encryption Overhead", key: "encryption-overhead", unit: "%", higherIsBetter: false },
      { name: "Compliance Frameworks", key: "compliance-frameworks", unit: "count", higherIsBetter: true },
    ],
    vendors: [
      { name: "Immuta", tier: "leader", founded: 2015, hq: "Boston, MA", emp: "100-500", website: "https://immuta.com", desc: "Automated data governance with attribute-based access controls and dynamic masking.", products: [{ name: "Immuta", caps: ["abac-policies", "dynamic-masking", "purpose-based-access"] }, { name: "Immuta Detect", caps: ["sensitive-data-detection", "classification", "risk-scoring"] }] },
      { name: "Privacera", tier: "leader", founded: 2016, hq: "Fremont, CA", emp: "100-500", website: "https://privacera.com", desc: "Unified data security governance across multi-cloud data platforms.", products: [{ name: "Privacera Platform", caps: ["centralized-access-control", "data-masking", "encryption"] }, { name: "Privacera Discovery", caps: ["pii-detection", "data-classification", "risk-analysis"] }] },
      { name: "BigID", tier: "leader", founded: 2016, hq: "New York, NY", emp: "500-1000", website: "https://bigid.com", desc: "Data intelligence platform for privacy, security, and governance at enterprise scale.", products: [{ name: "BigID", caps: ["data-discovery", "classification", "privacy-management"] }, { name: "BigID Data Remediation", caps: ["deletion", "minimization", "retention-management"] }] },
      { name: "OneTrust", tier: "challenger", founded: 2016, hq: "Atlanta, GA", emp: "1000-5000", website: "https://onetrust.com", desc: "Trust intelligence platform for privacy, security, and ethics compliance.", products: [{ name: "OneTrust Privacy", caps: ["consent-management", "dsar-automation", "cookie-compliance"] }, { name: "OneTrust DataGovernance", caps: ["data-mapping", "risk-assessment", "vendor-management"] }] },
      { name: "Protegrity", tier: "niche", founded: 1996, hq: "Stamford, CT", emp: "500-1000", website: "https://protegrity.com", desc: "Enterprise data security with tokenization, encryption, and masking at scale.", products: [{ name: "Protegrity", caps: ["tokenization", "format-preserving-encryption", "vault-less"] }] },
      { name: "HashiCorp Vault", tier: "challenger", founded: 2012, hq: "San Francisco, CA", emp: "1000-5000", website: "https://hashicorp.com/products/vault", desc: "Secrets management and data protection with identity-based access.", products: [{ name: "Vault", caps: ["secret-management", "encryption-as-service", "dynamic-credentials"] }, { name: "Vault Enterprise", caps: ["namespaces", "sentinel-policies", "replication"] }] },
      { name: "Skyflow", tier: "emerging", founded: 2019, hq: "Palo Alto, CA", emp: "100-500", website: "https://skyflow.com", desc: "Data privacy vault API for isolating and protecting sensitive data.", products: [{ name: "Skyflow", caps: ["privacy-vault", "tokenization-api", "polymorphic-encryption"] }] },
      { name: "Baffle", tier: "niche", founded: 2015, hq: "Santa Clara, CA", emp: "50-100", website: "https://baffle.io", desc: "No-code data protection with encryption and masking for databases and files.", products: [{ name: "Baffle", caps: ["no-code-encryption", "format-preserving", "database-proxy"] }] },
    ],
  },
  {
    name: "Cloud Platforms",
    slug: "cloud-platforms",
    description: "Major cloud infrastructure providers offering compute, storage, and managed data services.",
    icon: "Cloud",
    color: "#457B9D",
    sortOrder: 11,
    criteria: [
      { name: "Data Service Breadth", key: "service-breadth", weight: 1.3 },
      { name: "Global Infrastructure", key: "global-infra", weight: 1.2 },
      { name: "Pricing Competitiveness", key: "pricing", weight: 1.1 },
      { name: "Enterprise Features", key: "enterprise-features", weight: 1.0 },
      { name: "Ecosystem & Marketplace", key: "ecosystem", weight: 1.0 },
      { name: "Innovation Pace", key: "innovation", weight: 1.1 },
    ],
    benchmarks: [
      { name: "Regions Available", key: "cloud-regions", unit: "regions", higherIsBetter: true },
      { name: "Data Services Count", key: "data-services", unit: "services", higherIsBetter: true },
    ],
    vendors: [
      { name: "Amazon Web Services", tier: "leader", founded: 2006, hq: "Seattle, WA", emp: "10000+", website: "https://aws.amazon.com", desc: "World's most comprehensive cloud platform with 200+ services and broadest global footprint.", products: [{ name: "AWS Data Analytics", caps: ["redshift", "emr", "glue", "athena"] }, { name: "AWS AI/ML", caps: ["sagemaker", "bedrock", "comprehend"] }, { name: "AWS Compute", caps: ["ec2", "lambda", "ecs", "eks"] }] },
      { name: "Microsoft Azure", tier: "leader", founded: 2010, hq: "Redmond, WA", emp: "10000+", website: "https://azure.microsoft.com", desc: "Enterprise cloud platform with deep Microsoft ecosystem integration and hybrid capabilities.", products: [{ name: "Azure Data", caps: ["synapse", "data-factory", "cosmos-db"] }, { name: "Azure AI", caps: ["openai-service", "cognitive-services", "ml-studio"] }] },
      { name: "Google Cloud", tier: "leader", founded: 2008, hq: "Mountain View, CA", emp: "10000+", website: "https://cloud.google.com", desc: "Innovation-focused cloud with leadership in data analytics, AI/ML, and Kubernetes.", products: [{ name: "GCP Data", caps: ["bigquery", "dataflow", "dataproc"] }, { name: "GCP AI", caps: ["vertex-ai", "gemini", "document-ai"] }] },
      { name: "Oracle Cloud", tier: "challenger", founded: 2016, hq: "Austin, TX", emp: "10000+", website: "https://oracle.com/cloud", desc: "Enterprise cloud with autonomous database and strong Oracle workload migration support.", products: [{ name: "OCI Data", caps: ["autonomous-database", "data-integration", "goldengate"] }, { name: "OCI Compute", caps: ["bare-metal", "gpu-instances", "arm-compute"] }] },
      { name: "IBM Cloud", tier: "niche", founded: 2013, hq: "Armonk, NY", emp: "10000+", website: "https://ibm.com/cloud", desc: "Enterprise hybrid cloud with watsonx AI platform and industry-specific solutions.", products: [{ name: "IBM watsonx", caps: ["foundation-models", "data-store", "ai-governance"] }, { name: "IBM Cloud Pak", caps: ["data-integration", "automation", "security"] }] },
      { name: "Alibaba Cloud", tier: "challenger", founded: 2009, hq: "Hangzhou, China", emp: "10000+", website: "https://alibabacloud.com", desc: "Leading cloud in Asia-Pacific with comprehensive data and AI services.", products: [{ name: "Alibaba Data", caps: ["maxcompute", "analyticdb", "dataworks"] }] },
      { name: "DigitalOcean", tier: "niche", founded: 2011, hq: "New York, NY", emp: "1000-5000", website: "https://digitalocean.com", desc: "Developer-friendly cloud platform with simple pricing and managed databases.", products: [{ name: "DO Managed Databases", caps: ["postgres", "mysql", "redis", "mongodb"] }, { name: "DO App Platform", caps: ["paas", "auto-scaling", "container-registry"] }] },
      { name: "Vultr", tier: "niche", founded: 2014, hq: "Matawan, NJ", emp: "100-500", website: "https://vultr.com", desc: "High-performance cloud infrastructure with global coverage and GPU instances.", products: [{ name: "Vultr Cloud", caps: ["bare-metal", "gpu-cloud", "kubernetes-engine"] }] },
    ],
  },
  {
    name: "Reverse ETL & Data Activation",
    slug: "reverse-etl",
    description: "Tools for syncing data warehouse insights back to operational tools and SaaS applications.",
    icon: "Layers",
    color: "#8338EC",
    sortOrder: 12,
    criteria: [
      { name: "Destination Coverage", key: "destination-coverage", weight: 1.4 },
      { name: "Sync Reliability", key: "sync-reliability", weight: 1.3 },
      { name: "Audience Building", key: "audience-building", weight: 1.1 },
      { name: "Speed & Freshness", key: "speed-freshness", weight: 1.2 },
      { name: "Warehouse-Native", key: "warehouse-native", weight: 1.0 },
      { name: "Ease of Use", key: "ease-of-use", weight: 0.9 },
    ],
    benchmarks: [
      { name: "Sync Latency", key: "retl-latency", unit: "minutes", higherIsBetter: false },
      { name: "Destination Count", key: "retl-destinations", unit: "destinations", higherIsBetter: true },
    ],
    vendors: [
      { name: "Hightouch", tier: "leader", founded: 2020, hq: "San Francisco, CA", emp: "100-500", website: "https://hightouch.com", desc: "Composable CDP and reverse ETL platform for activating warehouse data in 200+ destinations.", products: [{ name: "Hightouch Reverse ETL", caps: ["warehouse-native", "audience-builder", "match-booster"] }, { name: "Hightouch Customer Studio", caps: ["visual-audience-builder", "journey-orchestration", "experimentation"] }] },
      { name: "Census", tier: "leader", founded: 2018, hq: "San Francisco, CA", emp: "100-500", website: "https://getcensus.com", desc: "Operational analytics platform for syncing warehouse data to business tools.", products: [{ name: "Census", caps: ["live-syncs", "segment-builder", "dbt-integration"] }, { name: "Census Embedded", caps: ["white-label", "api-access", "custom-destinations"] }] },
      { name: "RudderStack", tier: "challenger", founded: 2019, hq: "San Francisco, CA", emp: "100-500", website: "https://rudderstack.com", desc: "Customer data platform with warehouse-native architecture for event streaming and reverse ETL.", products: [{ name: "RudderStack CDP", caps: ["event-streaming", "warehouse-actions", "identity-resolution"] }, { name: "RudderStack Profiles", caps: ["identity-graph", "feature-computation", "ml-features"] }] },
      { name: "Polytomic", tier: "emerging", founded: 2020, hq: "San Francisco, CA", emp: "50-100", website: "https://polytomic.com", desc: "No-code data sync platform for connecting databases and APIs bidirectionally.", products: [{ name: "Polytomic", caps: ["bidirectional-sync", "field-mapping", "bulk-operations"] }] },
      { name: "Omnata", tier: "niche", founded: 2020, hq: "Sydney, Australia", emp: "10-50", website: "https://omnata.com", desc: "Native Snowflake reverse ETL using Snowflake's external functions.", products: [{ name: "Omnata", caps: ["snowflake-native", "push-connector", "real-time-sync"] }] },
      { name: "GrowthLoop", tier: "emerging", founded: 2021, hq: "San Francisco, CA", emp: "50-100", website: "https://growthloop.com", desc: "Composable CDP for marketing teams built on the cloud data warehouse.", products: [{ name: "GrowthLoop", caps: ["audience-builder", "journey-orchestration", "ai-recommendations"] }] },
      { name: "Segment (Twilio)", tier: "challenger", founded: 2011, hq: "San Francisco, CA", emp: "1000-5000", website: "https://segment.com", desc: "Customer data platform with event collection, unification, and activation.", products: [{ name: "Segment CDP", caps: ["event-tracking", "identity-resolution", "warehouses-destinations"] }, { name: "Segment Reverse ETL", caps: ["warehouse-syncs", "computed-traits", "audiences"] }] },
      { name: "Grouparoo (airbyte)", tier: "niche", founded: 2020, hq: "Acquired by Airbyte", emp: "N/A", website: "https://airbyte.com", desc: "Open-source reverse ETL now integrated into Airbyte's data movement platform.", products: [{ name: "Airbyte Reverse ETL", caps: ["open-source", "warehouse-to-saas", "custom-connectors"] }] },
    ],
  },
];

// ─── News Items ───────────────────────────────────────────────

const newsItems = [
  { title: "Snowflake Announces Cortex AI Generally Available", summary: "Snowflake launches Cortex AI, bringing LLM capabilities directly into the Data Cloud with fine-tuning and RAG support.", source: "TechCrunch", url: "https://techcrunch.com/snowflake-cortex-ai", tags: ["ai", "snowflake", "llm"], daysAgo: 2, sentiment: "positive", catSlug: "cloud-data-warehouses" },
  { title: "Databricks Acquires Tabular for $2B", summary: "Databricks acquires Tabular, the company behind Apache Iceberg, to strengthen its open lakehouse vision.", source: "Bloomberg", url: "https://bloomberg.com/databricks-tabular", tags: ["acquisition", "lakehouse", "iceberg"], daysAgo: 5, sentiment: "positive", catSlug: "data-lakes" },
  { title: "Fivetran Reaches 500 Connector Milestone", summary: "Fivetran surpasses 500 pre-built connectors, solidifying its position as the leading ELT platform.", source: "VentureBeat", url: "https://venturebeat.com/fivetran-500-connectors", tags: ["etl", "connectors", "milestone"], daysAgo: 3, sentiment: "positive", catSlug: "etl-data-integration" },
  { title: "Monte Carlo Launches Data Reliability Dashboard", summary: "Monte Carlo introduces a unified data reliability dashboard with SLA tracking and cost-of-downtime metrics.", source: "Data Engineering Weekly", url: "https://dataengineeringweekly.com/monte-carlo-dashboard", tags: ["observability", "data-quality"], daysAgo: 7, sentiment: "positive", catSlug: "data-quality" },
  { title: "Google BigQuery Adds Multi-Cloud Capabilities", summary: "BigQuery Omni expands to support Azure and AWS data analysis without data movement.", source: "Google Cloud Blog", url: "https://cloud.google.com/blog/bigquery-multi-cloud", tags: ["bigquery", "multi-cloud"], daysAgo: 10, sentiment: "positive", catSlug: "cloud-data-warehouses" },
  { title: "Apache Kafka 4.0 Released Without ZooKeeper", summary: "Kafka 4.0 ships with KRaft as the only consensus mechanism, fully removing ZooKeeper dependency.", source: "InfoQ", url: "https://infoq.com/kafka-4-kraft", tags: ["kafka", "streaming", "open-source"], daysAgo: 14, sentiment: "positive", catSlug: "stream-processing" },
  { title: "Hightouch Raises $80M Series C", summary: "Hightouch raises $80M to expand its composable CDP and reverse ETL platform globally.", source: "Forbes", url: "https://forbes.com/hightouch-series-c", tags: ["funding", "reverse-etl", "cdp"], daysAgo: 8, sentiment: "positive", catSlug: "reverse-etl" },
  { title: "Immuta Named Leader in Data Security by Forrester", summary: "Forrester Wave recognizes Immuta as a leader in data security platforms for automated governance.", source: "Forrester", url: "https://forrester.com/immuta-leader", tags: ["security", "governance", "analyst-report"], daysAgo: 12, sentiment: "positive", catSlug: "data-security" },
  { title: "dbt 1.8 Introduces Microbatch Incremental Strategy", summary: "dbt Labs releases version 1.8 with microbatch processing for more efficient incremental models.", source: "dbt Blog", url: "https://getdbt.com/blog/dbt-1-8", tags: ["dbt", "analytics-engineering"], daysAgo: 6, sentiment: "positive", catSlug: "etl-data-integration" },
  { title: "AWS SageMaker Unified Studio Launches", summary: "AWS consolidates SageMaker tools into Unified Studio for a streamlined ML development experience.", source: "AWS Blog", url: "https://aws.amazon.com/blogs/sagemaker-unified", tags: ["aws", "ml", "studio"], daysAgo: 4, sentiment: "positive", catSlug: "ai-ml-platforms" },
  { title: "Collibra and Databricks Announce Deep Integration", summary: "Collibra integrates with Databricks Unity Catalog for end-to-end governance across the lakehouse.", source: "SiliconANGLE", url: "https://siliconangle.com/collibra-databricks", tags: ["governance", "lakehouse", "partnership"], daysAgo: 9, sentiment: "positive", catSlug: "data-governance" },
  { title: "Confluent Cloud Achieves SOC 2 Type II for Stream Governance", summary: "Confluent attains SOC 2 compliance for its stream governance features including Schema Registry.", source: "Confluent Blog", url: "https://confluent.io/blog/soc2-stream-governance", tags: ["streaming", "compliance", "security"], daysAgo: 11, sentiment: "positive", catSlug: "stream-processing" },
  { title: "Power BI Copilot Moves to General Availability", summary: "Microsoft releases Power BI Copilot GA with natural language report generation and data Q&A.", source: "Microsoft Blog", url: "https://microsoft.com/blog/power-bi-copilot-ga", tags: ["bi", "ai", "copilot"], daysAgo: 1, sentiment: "positive", catSlug: "bi-analytics" },
  { title: "Redpanda Benchmark Shows 10x Kafka Throughput", summary: "Independent benchmark shows Redpanda achieving 10x higher throughput than Apache Kafka on equivalent hardware.", source: "The New Stack", url: "https://thenewstack.io/redpanda-benchmark", tags: ["streaming", "performance", "benchmark"], daysAgo: 15, sentiment: "positive", catSlug: "stream-processing" },
  { title: "Kong Gateway 4.0 with AI Gateway Capabilities", summary: "Kong releases Gateway 4.0 with built-in AI gateway features for LLM traffic management and rate limiting.", source: "API World", url: "https://apiworld.com/kong-4-ai-gateway", tags: ["api", "ai", "gateway"], daysAgo: 13, sentiment: "positive", catSlug: "api-management" },
  { title: "Gartner Magic Quadrant for Cloud DBMS Published", summary: "Gartner positions Snowflake, Databricks, and Google as Leaders in the 2025 Cloud Database MQ.", source: "Gartner", url: "https://gartner.com/cloud-dbms-mq-2025", tags: ["analyst-report", "cloud-database"], daysAgo: 18, sentiment: "neutral", catSlug: "cloud-data-warehouses" },
  { title: "Hugging Face Reaches 1 Million Models on Hub", summary: "The Hugging Face model hub surpasses 1 million open-source models, becoming the GitHub of AI.", source: "Wired", url: "https://wired.com/hugging-face-million-models", tags: ["ai", "open-source", "models"], daysAgo: 20, sentiment: "positive", catSlug: "ai-ml-platforms" },
  { title: "BigID Launches AI-Powered Data Classification", summary: "BigID introduces ML-powered data classification that automatically identifies PII across 100+ data sources.", source: "CSO Online", url: "https://csoonline.com/bigid-ai-classification", tags: ["security", "privacy", "ai"], daysAgo: 16, sentiment: "positive", catSlug: "data-security" },
  { title: "Oracle Cloud Infrastructure Cuts GPU Pricing 30%", summary: "OCI reduces GPU instance pricing by 30%, aiming to compete with AWS and Azure for AI workloads.", source: "Reuters", url: "https://reuters.com/oci-gpu-pricing", tags: ["cloud", "gpu", "pricing"], daysAgo: 19, sentiment: "positive", catSlug: "cloud-platforms" },
  { title: "Great Expectations 1.0 Released After 5 Years", summary: "GX 1.0 marks the first stable release with a redesigned API and Fluent datasource connections.", source: "GX Blog", url: "https://greatexpectations.io/blog/gx-1-0", tags: ["data-quality", "open-source", "release"], daysAgo: 22, sentiment: "positive", catSlug: "data-quality" },
];

// ─── Main Seed Function ───────────────────────────────────────

async function main() {
  console.log("Clearing existing data...");
  await prisma.benchmarkResult.deleteMany();
  await prisma.benchmark.deleteMany();
  await prisma.capability.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vendorScore.deleteMany();
  await prisma.criterion.deleteMany();
  await prisma.newsItem.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.vendorCategory.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.standard.deleteMany();

  console.log("Seeding categories, vendors, products, and scores...");

  const categoryMap: Record<string, string> = {};
  let totalVendors = 0;
  let totalProducts = 0;
  let totalCapabilities = 0;
  let totalScores = 0;
  let totalBenchmarks = 0;

  for (const catData of categoriesData) {
    // Create category
    const category = await prisma.category.create({
      data: {
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        icon: catData.icon,
        color: catData.color,
        sortOrder: catData.sortOrder,
      },
    });
    categoryMap[catData.slug] = category.id;

    // Create criteria for this category
    const criteriaMap: Record<string, string> = {};
    for (const crit of catData.criteria) {
      const criterion = await prisma.criterion.create({
        data: {
          name: crit.name,
          key: crit.key,
          weight: crit.weight,
          categoryId: category.id,
        },
      });
      criteriaMap[crit.key] = criterion.id;
    }

    // Create benchmarks for this category
    const benchmarkMap: Record<string, { id: string; higherIsBetter: boolean }> = {};
    for (const bm of catData.benchmarks) {
      const benchmark = await prisma.benchmark.create({
        data: {
          name: bm.name,
          key: bm.key,
          unit: bm.unit,
          higherIsBetter: bm.higherIsBetter,
          categoryId: category.id,
        },
      });
      benchmarkMap[bm.key] = { id: benchmark.id, higherIsBetter: bm.higherIsBetter };
    }

    // Create vendors for this category
    for (const vData of catData.vendors) {
      const vendorSlug = slug(vData.name);

      // Upsert vendor (some vendors appear in multiple categories)
      let vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
      if (!vendor) {
        vendor = await prisma.vendor.create({
          data: {
            name: vData.name,
            slug: vendorSlug,
            description: vData.desc,
            website: vData.website,
            founded: vData.founded,
            hqLocation: vData.hq,
            employeeRange: vData.emp,
            tier: vData.tier,
          },
        });
        totalVendors++;
      }

      // Link vendor to category
      await prisma.vendorCategory.create({
        data: {
          vendorId: vendor.id,
          categoryId: category.id,
          isPrimary: true,
        },
      });

      // Create products and capabilities
      for (const prod of vData.products) {
        const productSlug = slug(prod.name);
        const existingProduct = await prisma.product.findUnique({
          where: { vendorId_slug: { vendorId: vendor.id, slug: productSlug } },
        });

        if (!existingProduct) {
          const product = await prisma.product.create({
            data: {
              name: prod.name,
              slug: productSlug,
              vendorId: vendor.id,
              description: `${prod.name} - part of ${vData.name}'s product suite.`,
              pricingModel: vData.tier === "leader" ? "enterprise" : "usage-based",
            },
          });
          totalProducts++;

          // Create capabilities
          for (const cap of prod.caps) {
            await prisma.capability.create({
              data: {
                name: cap.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
                key: cap,
                productId: product.id,
                maturity: Math.random() > 0.3 ? "ga" : Math.random() > 0.5 ? "mature" : "preview",
                rating: rand(6, 10),
              },
            });
            totalCapabilities++;
          }
        }
      }

      // Generate realistic scores based on tier
      const tierBaseScores: Record<string, [number, number]> = {
        leader: [7.5, 9.8],
        challenger: [6.5, 8.8],
        emerging: [5.5, 8.0],
        niche: [5.0, 7.5],
      };
      const [minScore, maxScore] = tierBaseScores[vData.tier] || [5, 8];

      for (const [criterionKey, criterionId] of Object.entries(criteriaMap)) {
        const score = rand(minScore, maxScore);
        const confidence = rand(0.6, 0.95);
        await prisma.vendorScore.create({
          data: {
            vendorId: vendor.id,
            criterionId: criterionId,
            score,
            confidence,
            source: "initial-assessment",
          },
        });
        totalScores++;
      }

      // Generate benchmark results
      for (const [bmKey, bmInfo] of Object.entries(benchmarkMap)) {
        let value: number;
        if (bmInfo.higherIsBetter) {
          const tierMultipliers: Record<string, number> = { leader: 1.0, challenger: 0.75, emerging: 0.5, niche: 0.35 };
          const mult = tierMultipliers[vData.tier] || 0.5;
          value = rand(100, 10000) * mult;
        } else {
          const tierMultipliers: Record<string, number> = { leader: 1.0, challenger: 1.3, emerging: 1.8, niche: 2.2 };
          const mult = tierMultipliers[vData.tier] || 1.5;
          value = rand(10, 500) * mult;
        }

        await prisma.benchmarkResult.create({
          data: {
            benchmarkId: bmInfo.id,
            vendorId: vendor.id,
            value: Math.round(value * 10) / 10,
            environment: "standardized-test-env",
          },
        });
        totalBenchmarks++;
      }
    }

    console.log(`  ✓ ${catData.name}: ${catData.vendors.length} vendors`);
  }

  // ─── Seed News Items ────────────────────────────────────────

  console.log("Seeding news items...");
  for (const news of newsItems) {
    const catId = categoryMap[news.catSlug] || null;

    // Try to find vendor mentioned in title
    let vendorId: string | null = null;
    const allVendors = await prisma.vendor.findMany({ select: { id: true, name: true } });
    for (const v of allVendors) {
      if (news.title.toLowerCase().includes(v.name.toLowerCase().split(" ")[0])) {
        vendorId = v.id;
        break;
      }
    }

    await prisma.newsItem.create({
      data: {
        title: news.title,
        summary: news.summary,
        url: news.url,
        source: news.source,
        sentiment: news.sentiment,
        publishedAt: pastDate(news.daysAgo),
        vendorId,
        categoryId: catId,
        tags: news.tags,
      },
    });
  }
  console.log(`  ✓ ${newsItems.length} news items`);

  // ─── Seed Standards ─────────────────────────────────────────

  console.log("Seeding standards & playbooks...");
  const standards = [
    { title: "Data Platform Vendor Selection Playbook", slug: "vendor-selection-playbook", type: "playbook", content: "Step-by-step guide for evaluating and selecting data platform vendors. Includes scoring matrices, POC templates, and decision frameworks." },
    { title: "Vendor Evaluation Criteria Standard", slug: "vendor-evaluation-criteria", type: "standard", content: "Standardized criteria and weighting methodology for consistent vendor evaluation across all categories." },
    { title: "Data Governance Best Practices", slug: "data-governance-best-practices", type: "standard", content: "Enterprise data governance guidelines covering data quality, lineage, access control, and compliance." },
    { title: "Cloud Migration Checklist", slug: "cloud-migration-checklist", type: "checklist", content: "Comprehensive checklist for migrating data workloads to cloud platforms including security, testing, and rollback plans." },
    { title: "API Security Standards", slug: "api-security-standards", type: "standard", content: "Security standards for API design and deployment including authentication, rate limiting, and input validation." },
  ];

  for (const std of standards) {
    await prisma.standard.create({ data: std });
  }
  console.log(`  ✓ ${standards.length} standards`);

  // ─── Summary ────────────────────────────────────────────────

  console.log("\n=== Seed Complete ===");
  console.log(`Categories:    ${categoriesData.length}`);
  console.log(`Vendors:       ${totalVendors}`);
  console.log(`Products:      ${totalProducts}`);
  console.log(`Capabilities:  ${totalCapabilities}`);
  console.log(`Scores:        ${totalScores}`);
  console.log(`Benchmarks:    ${totalBenchmarks}`);
  console.log(`News Items:    ${newsItems.length}`);
  console.log(`Standards:     ${standards.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
