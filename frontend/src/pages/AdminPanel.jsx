import React, { useState, useEffect } from 'react';
import { 
  Building2, Database, Calendar, BarChart3, Plus, Trash2, Edit3, 
  CheckCircle2, X, AlertCircle, RefreshCw, Clock, Users, ArrowUpRight 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel({ onNavigate }) {
  const { token, currentUser, logout, isSalesHead } = useAuth();

  const [activeTab, setActiveTab] = useState('factsheets'); // 'factsheets' | 'visits' | 'analytics'
  const [projects, setProjects] = useState([]);
  const [factSheets, setFactSheets] = useState([]);
  const [visits, setVisits] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [sources, setSources] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [executives, setExecutives] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fact Sheet Form Modal State
  const [isFactSheetModalOpen, setIsFactSheetModalOpen] = useState(false);
  const [editingFactSheet, setEditingFactSheet] = useState(null);
  const [category, setCategory] = useState('Pricing');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [factSheetProjectId, setFactSheetProjectId] = useState(1);
  const [savingFactSheet, setSavingFactSheet] = useState(false);

  // Filter state for fact sheets
  const [factSheetProjectFilter, setFactSheetProjectFilter] = useState('ALL');

  const loadAllAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pData, fsData, vData, aData, sData, fData, eData] = await Promise.all([
        api.getProjects(),
        api.getFactSheets(token),
        api.getVisits(token),
        api.getAnalyticsOverview(token),
        api.getLeadSourcesAnalytics(token),
        api.getConversionFunnel(token),
        api.getExecutives(token),
      ]);
      setProjects(pData || []);
      setFactSheets(fsData || []);
      setVisits(vData || []);
      setAnalytics(aData || null);
      setSources(sData || []);
      setFunnel(fData || []);
      setExecutives(eData || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAllAdminData();
    }
  }, [token]);

  // Open modal for new fact sheet
  const handleOpenNewFactSheet = () => {
    setEditingFactSheet(null);
    setCategory('Pricing');
    setQuestion('');
    setAnswer('');
    setFactSheetProjectId(projects[0]?.id || 1);
    setIsFactSheetModalOpen(true);
  };

  // Open modal for editing fact sheet
  const handleOpenEditFactSheet = (fs) => {
    setEditingFactSheet(fs);
    setCategory(fs.category);
    setQuestion(fs.question);
    setAnswer(fs.answer);
    setFactSheetProjectId(fs.project_id);
    setIsFactSheetModalOpen(true);
  };

  // Save fact sheet
  const handleSaveFactSheet = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setSavingFactSheet(true);
    try {
      if (editingFactSheet) {
        const updated = await api.updateFactSheet(
          editingFactSheet.id,
          {
            category,
            question: question.trim(),
            answer: answer.trim(),
            project_id: Number(factSheetProjectId),
          },
          token
        );
        setFactSheets((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } else {
        const created = await api.createFactSheet(
          {
            category,
            question: question.trim(),
            answer: answer.trim(),
            project_id: Number(factSheetProjectId),
          },
          token
        );
        setFactSheets((prev) => [...prev, created]);
      }
      setIsFactSheetModalOpen(false);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSavingFactSheet(false);
    }
  };

  // Delete fact sheet
  const handleDeleteFactSheet = async (id) => {
    if (!confirm('Are you sure you want to delete this fact sheet entry? AI responses will immediately lose this grounded context.')) {
      return;
    }
    try {
      await api.deleteFactSheet(id, token);
      setFactSheets((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Update visit status
  const handleUpdateVisitStatus = async (visitId, newStatus) => {
    try {
      const updated = await api.updateVisit(visitId, { status: newStatus }, token);
      setVisits((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v))
      );
    } catch (err) {
      alert(`Visit update failed: ${err.message}`);
    }
  };

  // Filtered fact sheets
  const filteredFactSheets = factSheets.filter((fs) => {
    return factSheetProjectFilter === 'ALL' || String(fs.project_id) === String(factSheetProjectFilter);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gold-500 text-slate-950 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm text-white">
                AHMEDABAD REALTY <span className="text-gold-400">ADMIN</span>
              </span>
              <span className="hidden sm:inline-block text-slate-500 text-xs ml-2">| Sales Head Control Center</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs text-right hidden sm:block">
              <div className="font-semibold text-white">{currentUser?.name}</div>
              <div className="text-[11px] text-gold-400 font-mono">SALES HEAD</div>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Sales Dashboard
            </button>

            <button
              onClick={() => onNavigate('buyer')}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Buyer Portal
            </button>

            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('factsheets')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'factsheets'
                  ? 'bg-gold-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>AI Fact Sheet Editor ({factSheets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('visits')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'visits'
                  ? 'bg-gold-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Site Visit Operations ({visits.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gold-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Pipeline & Conversion Funnel</span>
            </button>
          </div>

          <button
            onClick={loadAllAdminData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh All"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* TAB 1: Fact Sheet Knowledge Base Editor */}
        {activeTab === 'factsheets' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-white">
                  Grounding Knowledge Base & RERA FAQ Editor
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adding or editing entries here immediately updates the AI Chatbot's responses to buyer questions.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Project Filter */}
                <select
                  value={factSheetProjectFilter}
                  onChange={(e) => setFactSheetProjectFilter(e.target.value)}
                  className="bg-slate-850 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gold-500"
                >
                  <option value="ALL">All Properties</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <button
                  onClick={handleOpenNewFactSheet}
                  className="px-3.5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-gold-500/10 active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Knowledge Entry</span>
                </button>
              </div>
            </div>

            {/* Fact Sheets Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-850/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Buyer Question / Intent</th>
                      <th className="py-3 px-4">Official Grounded Answer</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredFactSheets.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-white">
                          {item.project_name || `Project #${item.project_id}`}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gold-950/60 text-gold-300 border border-gold-800/40">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs font-medium text-slate-200">
                          {item.question}
                        </td>
                        <td className="py-3 px-4 max-w-sm text-slate-300 text-[11px] leading-relaxed">
                          {item.answer}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleOpenEditFactSheet(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFactSheet(item.id)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Site Visit Operations */}
        {activeTab === 'visits' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-white">
                  Site Visit Appointments & Executive Assignments
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time conflict-free appointments across Ahmedabad West developments.
                </p>
              </div>

              <div className="text-xs text-gold-300 bg-gold-950/60 border border-gold-800/40 px-3 py-1.5 rounded-lg font-mono">
                {visits.filter((v) => v.status === 'Booked').length} Active Appointments
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-850/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Ref #</th>
                      <th className="py-3 px-4">Buyer Lead</th>
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4">Date & Time (IST)</th>
                      <th className="py-3 px-4">Assigned Executive</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {visits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gold-400">
                          #SV-{visit.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {visit.lead_name || `Lead #${visit.lead_id}`}
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          {visit.project_name || `Project #${visit.project_id}`}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {new Date(visit.visit_datetime).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(visit.visit_datetime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-slate-200 font-medium">
                          {visit.executive_name || `Exec #${visit.executive_id}`}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              visit.status === 'Booked'
                                ? 'bg-gold-950 text-gold-300 border-gold-800'
                                : visit.status === 'Completed'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                            }`}
                          >
                            {visit.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={visit.status}
                            onChange={(e) => handleUpdateVisitStatus(visit.id, e.target.value)}
                            className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-gold-500 cursor-pointer"
                          >
                            <option value="Booked">Booked</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Pipeline & Conversion Funnel */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top Stats */}
            {analytics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Total Leads Captured</div>
                  <div className="text-3xl font-serif font-bold text-white mt-1">{analytics.total_leads}</div>
                </div>
                <div className="bg-slate-900 border border-gold-500/30 rounded-xl p-4 bg-gradient-to-br from-slate-900 to-gold-950/20">
                  <div className="text-xs text-gold-400">Site Visits Booked</div>
                  <div className="text-3xl font-serif font-bold text-gold-300 mt-1">{analytics.booked_visits}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-emerald-400">Completed Walk-Throughs</div>
                  <div className="text-3xl font-serif font-bold text-emerald-400 mt-1">{analytics.completed_visits}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-sky-400">Pipeline Conversion</div>
                  <div className="text-3xl font-serif font-bold text-sky-300 mt-1">{analytics.conversion_rate}</div>
                </div>
              </div>
            )}

            {/* Split row: Sources & Funnel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lead Sources */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="font-serif font-bold text-sm text-white">
                  Acquisition Channel Distribution
                </h4>
                <div className="space-y-3">
                  {sources.map((src) => (
                    <div key={src.source} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300 uppercase">{src.source.replace('_', ' ')}</span>
                        <span className="text-gold-400 font-mono">{src.count} leads ({src.percentage})</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gold-500 h-full rounded-full transition-all duration-500"
                          style={{ width: src.percentage }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="font-serif font-bold text-sm text-white">
                  Lead Conversion Pipeline Funnel
                </h4>
                <div className="space-y-3">
                  {funnel.map((stage, idx) => (
                    <div
                      key={stage.stage}
                      className="p-3 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-white">{stage.stage}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-gold-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                        {stage.count} leads
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fact Sheet Add / Edit Modal */}
      {isFactSheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white">
                {editingFactSheet ? 'Edit Fact Sheet Entry' : 'Add New Fact Sheet Entry'}
              </h3>
              <button
                onClick={() => setIsFactSheetModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFactSheet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Property
                </label>
                <select
                  value={factSheetProjectId}
                  onChange={(e) => setFactSheetProjectId(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-gold-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-gold-500"
                >
                  <option value="Pricing">Pricing</option>
                  <option value="Amenities">Amenities</option>
                  <option value="RERA">RERA</option>
                  <option value="Location">Location</option>
                  <option value="Possession">Possession</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Buyer Question / Trigger
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What is the carpet area of a 3 BHK?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Official Grounded Answer
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Accurate answer provided to buyer. Remember: do not quote unapproved discounts."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFactSheetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFactSheet}
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {savingFactSheet ? 'Saving...' : 'Save Knowledge Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

