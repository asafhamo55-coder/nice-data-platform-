import { ClipboardCheck, Plus } from "lucide-react";

export default function EvaluationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Evaluation Tool</h1>
          <p className="mt-1 text-navy-400">
            Create and manage vendor evaluations
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          <Plus size={16} />
          New Evaluation
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-navy-100 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-navy">0</p>
          <p className="text-sm text-navy-400">Active</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-navy">0</p>
          <p className="text-sm text-navy-400">Completed</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-navy">0</p>
          <p className="text-sm text-navy-400">Draft</p>
        </div>
      </div>

      <div className="rounded-xl border border-navy-100 bg-white p-8 text-center shadow-sm">
        <ClipboardCheck className="mx-auto h-12 w-12 text-navy-200" />
        <h3 className="mt-4 font-semibold text-navy">No Evaluations Yet</h3>
        <p className="mt-2 text-sm text-navy-400">
          Create your first vendor evaluation to get started.
        </p>
      </div>
    </div>
  );
}
