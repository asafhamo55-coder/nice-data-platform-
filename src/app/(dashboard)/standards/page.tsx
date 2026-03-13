import { BookOpen, FileText, Download } from "lucide-react";

const standards = [
  {
    title: "Data Platform Selection Playbook",
    type: "Playbook",
    version: "2.0",
    description: "Step-by-step guide for selecting the right data platform vendor.",
  },
  {
    title: "Vendor Evaluation Framework",
    type: "Standard",
    version: "1.5",
    description: "Standardized criteria and methodology for evaluating vendors.",
  },
  {
    title: "Data Governance Guidelines",
    type: "Standard",
    version: "3.0",
    description: "Best practices for data governance and compliance.",
  },
  {
    title: "Integration Architecture Patterns",
    type: "Playbook",
    version: "1.0",
    description: "Common integration patterns for data platform architectures.",
  },
];

export default function StandardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">Standards & Playbooks</h1>
        <p className="mt-1 text-navy-400">
          Reference materials, evaluation standards, and best practices
        </p>
      </div>

      <div className="space-y-4">
        {standards.map((standard) => (
          <div
            key={standard.title}
            className="flex items-start justify-between rounded-xl border border-navy-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-50 p-2">
                {standard.type === "Playbook" ? (
                  <BookOpen className="h-5 w-5 text-blue" />
                ) : (
                  <FileText className="h-5 w-5 text-blue" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-navy">{standard.title}</h3>
                <p className="mt-1 text-sm text-navy-400">
                  {standard.description}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-400">
                    {standard.type}
                  </span>
                  <span className="text-xs text-navy-300">
                    v{standard.version}
                  </span>
                </div>
              </div>
            </div>
            <button className="rounded-lg p-2 text-navy-300 hover:bg-navy-50 hover:text-navy">
              <Download size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
