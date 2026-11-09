import React from 'react';
import { Building, MapPin, ShieldCheck, IndianRupee, Key, Calendar, MessageSquare, Sparkles } from 'lucide-react';

export default function ProjectShowcase({ projects, selectedProject, onSelectProject, onBookVisit }) {
  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span>RERA Registered Developments</span>
            <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
              Ahmedabad West
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Select a project to ground the AI assistant and verify fact-sheets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((project) => {
          const isSelected = selectedProject?.id === project.id;

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className={`group relative rounded-2xl p-6 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 border-gold-500 ring-1 ring-gold-500/50 shadow-xl shadow-gold-950/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Header tags */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3" />
                    RERA Verified
                  </span>
                  <h3 className="text-lg font-bold text-white font-serif mt-1.5 group-hover:text-gold-400 transition-colors">
                    {project.name}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Price Range</div>
                  <div className="text-base font-bold text-gold-300">
                    {project.price_range}
                  </div>
                </div>
              </div>

              {/* Location & Config */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mb-3.5">
                <div className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-gold-400" />
                  <span>{project.location}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Key className="w-3.5 h-3.5 text-gold-400" />
                  <span>{project.configurations}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                {project.description}
              </p>

              {/* RERA footer pill */}
              <div className="text-[11px] font-mono text-slate-500 bg-slate-950/60 rounded px-2.5 py-1 mb-4 truncate border border-slate-800/80">
                RERA: {project.rera_number}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProject(project);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-gold-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isSelected ? 'Active in Chat' : 'Chat About Project'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookVisit(project);
                  }}
                  className="py-2 px-3 rounded-lg text-xs font-semibold bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/30 flex items-center gap-1.5 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Visit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

