import React, { useState } from 'react';
import {
  ListChecks,
  Plus,
  FileText,
  CheckCircle,
  AlertCircle,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ClearanceStageKey, Requirement } from '../types';
import { INITIAL_STAGES } from '../services/seedData';
import { StatusBadge } from '../components/common/StatusBadge';

export const RequirementsView: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { requirements, setRequirements, stages } = useData();

  const [selectedStageId, setSelectedStageId] = useState<ClearanceStageKey>('admission');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for new requirement
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState(true);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(5);
  const [fileFormats, setFileFormats] = useState('PDF, JPG, PNG');

  const stageRequirements = requirements.filter((r) => r.stageId === selectedStageId);
  const selectedStage = INITIAL_STAGES.find((s) => s.id === selectedStageId);

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newReq: Requirement = {
      id: `req_${Date.now()}`,
      stageId: selectedStageId,
      name,
      description,
      required,
      allowedFileTypes: fileFormats.split(',').map((f) => f.trim().toLowerCase()),
      maxFileSize: maxFileSizeMB,
      active: true,
    };

    setRequirements((prev) => [...prev, newReq]);
    setIsAddModalOpen(false);
    setName('');
    setDescription('');
  };

  const toggleReqActive = (reqId: string) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, active: !r.active } : r))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - Frosted Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ListChecks className="w-6 h-6 text-blue-600" />
              Stage Document Requirements Policy
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-800 text-xs font-bold border border-blue-500/30">
              SUPER ADMIN
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure institutional clearance documentation requirements, file formats, and upload rules.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold transition shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Requirement</span>
        </button>
      </div>

      {/* Stage Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {INITIAL_STAGES.map((st) => {
          const isSelected = selectedStageId === st.id;
          const count = requirements.filter((r) => r.stageId === st.id).length;

          return (
            <button
              key={st.id}
              onClick={() => setSelectedStageId(st.id)}
              className={`p-3 rounded-xl border text-center transition cursor-pointer backdrop-blur-sm ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30 font-bold'
                  : 'bg-white/70 text-slate-700 border-white/80 hover:bg-white'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase block ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                Stage {st.order}
              </span>
              <p className="text-xs font-extrabold truncate">{st.name}</p>
              <span className={`text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.2 rounded ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'}`}>
                {count} Docs
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Requirements List - Frosted Glass */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {selectedStage?.name} Clearance Requirements
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedStage?.description}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {stageRequirements.length} active requirement criteria
          </span>
        </div>

        <div className="space-y-3">
          {stageRequirements.map((req) => (
            <div
              key={req.id}
              className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                req.active ? 'bg-white/70 border-white/80' : 'bg-slate-100/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">{req.name}</h3>
                  {req.required ? (
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50/80 px-1.5 py-0.5 rounded border border-rose-100">
                      Mandatory
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{req.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                  <span>Formats: {req.allowedFileTypes.join(', ').toUpperCase()}</span>
                  <span>•</span>
                  <span>Max size: {req.maxFileSize}MB</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleReqActive(req.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    req.active
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                  }`}
                >
                  {req.active ? 'Deactivate' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Requirement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/60">
            <h3 className="text-lg font-bold text-slate-900">
              Add Requirement to {selectedStage?.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the document students must upload to pass this departmental stage.
            </p>

            <form onSubmit={handleAddRequirement} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Requirement Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Departmental Dues Receipt"
                  className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Instructions for Students
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Upload stamped bank teller or Remita payment printout."
                  className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Allowed Formats
                  </label>
                  <input
                    type="text"
                    value={fileFormats}
                    onChange={(e) => setFileFormats(e.target.value)}
                    className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={maxFileSizeMB}
                    onChange={(e) => setMaxFileSizeMB(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="reqMandatory"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="reqMandatory" className="font-semibold text-slate-800">
                  Mandatory requirement (Clearance blocked if unapproved)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100/70 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
