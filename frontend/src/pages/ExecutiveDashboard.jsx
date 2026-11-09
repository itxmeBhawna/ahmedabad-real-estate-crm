import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Sparkles, Building2, Calendar, Phone, ArrowUpRight, CheckCircle2, RefreshCw, Eye } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LeadHandoffModal from '../components/LeadHandoffModal';

export default function ExecutiveDashboard({ onNavigate }) {
  const { token, currentUser, logout } = useAuth();

  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Modal State
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsData, projectsData] = await Promise.all([
        api.getLeads(token),
        api.getProjects(),
      ]);
      setLeads(leadsData || []);
      setProjects(projectsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Handle lead updated from modal or inline
  const handleLeadUpdated = (updatedLead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
    if (selectedLead?.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
  };

  const handleInlineStatusChange = async (leadId, newStatus) => {
    try {
      const updated = await api.updateLead(leadId, { status: newStatus }, token);
      handleLeadUpdated(updated);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const openHandoffModal = (lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.project_name && lead.project_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || lead.source === sourceFilter;
    const matchesProject = projectFilter === 'ALL' || String(lead.project_id) === String(projectFilter);

    return matchesSearch && matchesStatus && matchesSource && matchesProject;
  });

  // Calculate Metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'New').length;
  const visitBooked = leads.filter((l) => l.status === 'Visit Booked').length;
  const visitedLeads = leads.filter((l) => l.status === 'Visited').length;

  const formatBudget = (val) => {
    if (!val) return '—';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    return `₹${(num / 100000).toFixed(0)} L`;
  };

  const getSourceBadge = (source) => {
    const map = {
      portal: { text: 'Portal', class: 'bg-blue-950/80 text-blue-300 border-blue-800/40' },
      social_ad: { text: 'Social Ad', class: 'bg-purple-950/80 text-purple-300 border-purple-800/40' },
      hoarding: { text: 'Hoarding', class: 'bg-amber-950/80 text-amber-300 border-amber-800/40' },
    };
    const c = map[source] || { text: source, class: 'bg-slate-800 text-slate-300 border-slate-700' };
    return <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${c.class}`}>{c.text}</span>;
  };

  const getStatusBadge = (status) => {
    const map = {
      'New': 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
      'Contacted': 'bg-sky-950/80 text-sky-300 border-sky-800/50',
      'Visit Booked': 'bg-gold-950/80 text-gold-300 border-gold-700/50 font-bold',
      'Visited': 'bg-emerald-900/60 text-emerald-200 border-emerald-700/60',
    };
    return map[status] || 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gold-500 text-slate-950 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm text-white">
                AHMEDABAD REALTY <span className="text-gold-400">CRM</span>
              </span>
              <span className="hidden sm:inline-block text-slate-500 text-xs ml-2">| Sales Lead Dashboard</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs text-right hidden sm:block">
              <div className="font-semibold text-white">{currentUser?.name}</div>
              <div className="text-[11px] text-gold-400 font-mono capitalize">{currentUser?.role.replace('_', ' ')}</div>
            </div>

            <button
              onClick={() => onNavigate('buyer')}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Buyer Portal
            </button>

            {currentUser?.role === 'sales_head' && (
              <button
                onClick={() => onNavigate('admin')}
                className="text-xs px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/30 hover:bg-gold-500/30 transition-colors font-medium"
              >
                Admin Panel
              </button>
            )}

            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* KPI Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium">Total Assigned Leads</div>
            <div className="text-2xl font-bold font-serif text-white mt-1">{totalLeads}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across assigned properties</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-emerald-400 font-medium">New Leads (Pending Call)</div>
            <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">{newLeads}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">&lt; 15 min response target</div>
          </div>

          <div className="bg-slate-900 border border-gold-500/40 rounded-xl p-4 bg-gradient-to-br from-slate-900 to-gold-950/20">
            <div className="text-xs text-gold-400 font-medium">Site Visits Booked</div>
            <div className="text-2xl font-bold font-serif text-gold-300 mt-1">{visitBooked}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Upcoming verified walk-throughs</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-sky-400 font-medium">Completed Visits</div>
            <div className="text-2xl font-bold font-serif text-sky-300 mt-1">{visitedLeads}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ready for closing negotiation</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by buyer name, phone, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-850 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gold-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Visit Booked">Visit Booked</option>
              <option value="Visited">Visited</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-slate-850 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gold-500"
            >
              <option value="ALL">All Sources</option>
              <option value="portal">Property Portal</option>
              <option value="social_ad">Social Ad</option>
              <option value="hoarding">Road Hoarding</option>
            </select>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-slate-850 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gold-500"
            >
              <option value="ALL">All Properties</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh leads"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Leads Table Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-400" />
              <span>Assigned Real Estate Leads ({filteredLeads.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              DPDP compliant phone masking applied
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mb-2"></div>
              <div>Retrieving lead intelligence...</div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-300">
              {error}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No leads match your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-850/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Lead / Buyer</th>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Budget</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">AI Intelligence</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Name & Phone */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{lead.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {lead.phone}
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">
                          {lead.project_name || `Project #${lead.project_id}`}
                        </div>
                        <div className="text-[11px] text-slate-500">Ahmedabad</div>
                      </td>

                      {/* Budget */}
                      <td className="py-3 px-4 font-semibold text-gold-300">
                        {formatBudget(lead.budget)}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        {getSourceBadge(lead.source)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleInlineStatusChange(lead.id, e.target.value)}
                          className={`text-xs rounded-md px-2 py-1 font-semibold border focus:outline-none focus:ring-1 focus:ring-gold-500 cursor-pointer ${getStatusBadge(
                            lead.status
                          )}`}
                        >
                          <option value="New" className="bg-slate-900 text-slate-100">New</option>
                          <option value="Contacted" className="bg-slate-900 text-slate-100">Contacted</option>
                          <option value="Visit Booked" className="bg-slate-900 text-slate-100">Visit Booked</option>
                          <option value="Visited" className="bg-slate-900 text-slate-100">Visited</option>
                        </select>
                      </td>

                      {/* AI Briefing preview */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="line-clamp-2 text-[11px] text-slate-300 italic">
                          {lead.ai_summary || 'Inquired about unit configurations and site availability.'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openHandoffModal(lead)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/30 text-xs font-semibold transition-all shadow-sm active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                          <span>Handoff Briefing</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Lead Handoff Modal */}
      <LeadHandoffModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLeadUpdated={handleLeadUpdated}
        token={token}
      />
    </div>
  );
}

