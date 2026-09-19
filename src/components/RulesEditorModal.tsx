import React, { useState } from 'react';
import { X, Plus, RotateCcw, Check, SlidersHorizontal } from 'lucide-react';
import { ExpectedDeliverable, PhaseId } from '../types';
import { WATERFALL_PHASES } from '../data/waterfallTemplate';

interface RulesEditorModalProps {
  deliverables: ExpectedDeliverable[];
  onSave: (deliverables: ExpectedDeliverable[]) => void;
  onReset: () => void;
  onClose: () => void;
}

export const RulesEditorModal: React.FC<RulesEditorModalProps> = ({
  deliverables,
  onSave,
  onReset,
  onClose,
}) => {
  const [items, setItems] = useState<ExpectedDeliverable[]>([...deliverables]);
  const [showAddForm, setShowAddForm] = useState(false);

  // New item form state
  const [newPhase, setNewPhase] = useState<PhaseId>('requirements');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPatterns, setNewPatterns] = useState('');
  const [newMandatory, setNewMandatory] = useState(true);
  const [newMaxAge, setNewMaxAge] = useState(60);

  const handleToggleMandatory = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isMandatory: !item.isMandatory } : item))
    );
  };

  const handleAgeChange = (id: string, days: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, maxAgeDays: Math.max(1, days) } : item))
    );
  };

  const handleAddDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    const patternsArr = newPatterns
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const newDel: ExpectedDeliverable = {
      id: `custom-${Date.now()}`,
      phaseId: newPhase,
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      description: newDesc.trim() || 'Custom project deliverable',
      patterns: patternsArr.length > 0 ? patternsArr : [newName.toLowerCase().trim()],
      isMandatory: newMandatory,
      maxAgeDays: newMaxAge,
    };

    setItems((prev) => [...prev, newDel]);
    setShowAddForm(false);
    // Reset form
    setNewCode('');
    setNewName('');
    setNewDesc('');
    setNewPatterns('');
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApply = () => {
    onSave(items);
    onClose();
  };

  return (
    <div
      id="rules-editor-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="rules-editor-modal-content"
        className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-stone-700" />
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                Waterfall Deliverables & Freshness Rules
              </h3>
              <p className="text-xs text-stone-500">
                Customize gate requirements, max age thresholds, and naming patterns
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-2.5 bg-stone-100/60 border-b border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Cancel Add' : 'Add Custom Deliverable'}
          </button>

          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium border border-stone-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            Restore Defaults
          </button>
        </div>

        {/* Add Form (Collapsible) */}
        {showAddForm && (
          <form onSubmit={handleAddDeliverable} className="p-4 bg-stone-50 border-b border-stone-200 text-xs">
            <div className="font-semibold text-stone-800 mb-2">New Deliverable Requirement</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-stone-600 mb-1">Target Phase</label>
                <select
                  value={newPhase}
                  onChange={(e) => setNewPhase(e.target.value as PhaseId)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  {WATERFALL_PHASES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Code (e.g. SEC-01)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEC-01"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Max Age Threshold (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={newMaxAge}
                  onChange={(e) => setNewMaxAge(parseInt(e.target.value, 10) || 30)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-stone-600 mb-1">Deliverable Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Security Vulnerability Assessment"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Filename Patterns (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. security_audit, pentest, vulnerability"
                  value={newPatterns}
                  onChange={(e) => setNewPatterns(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={newMandatory}
                  onChange={(e) => setNewMandatory(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <span>Mandatory Gate Deliverable (Blocks phase if missing)</span>
              </label>

              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium text-xs transition-colors"
              >
                Save Deliverable
              </button>
            </div>
          </form>
        )}

        {/* List of deliverables */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                    {item.code}
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {item.phaseId.toUpperCase()}
                  </span>
                </div>
                <div className="font-semibold text-stone-900">{item.name}</div>
                <div className="text-[11px] text-stone-500 mt-0.5 truncate">
                  Patterns: {item.patterns.map((p) => `*${p}*`).join(', ')}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Max Age Input */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500">Max age:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={item.maxAgeDays || 60}
                    onChange={(e) => handleAgeChange(item.id, parseInt(e.target.value, 10) || 60)}
                    className="w-14 px-1.5 py-1 text-center bg-stone-50 border border-stone-300 rounded text-xs"
                  />
                  <span className="text-[11px] text-stone-400">days</span>
                </div>

                {/* Mandatory Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleMandatory(item.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    item.isMandatory
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {item.isMandatory ? 'Mandatory' : 'Optional'}
                </button>

                {item.id.startsWith('custom-') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-stone-400 hover:text-rose-600 p-1"
                    title="Delete custom deliverable"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            Apply Audit Rules
          </button>
        </div>
      </div>
    </div>
  );
};
