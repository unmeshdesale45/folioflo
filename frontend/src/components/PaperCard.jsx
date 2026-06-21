import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Users, Calendar, Award, Bookmark, ArrowRight, X, FileText, CheckCircle, Crosshair, Cpu, Lightbulb, AlertCircle, TrendingUp, FolderPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../lib/axios';

const PaperCard = ({ paper, index, queryId, isSaved, onToggleSave, topic }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState(null);

  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [userProjects, setUserProjects] = useState([]);
  const menuRef = useRef(null);

  const getPubLink = () => {
    if (paper.pdf_url) return paper.pdf_url;
    if (paper.doi) return `https://doi.org/${paper.doi}`;
    if (paper.url) return paper.url;
    return null;
  };
  const pubLink = getPubLink();

  const handleInsightClick = async () => {
    setShowModal(true);
    if (insight) return;

    setIsLoading(true);
    try {
      const res = await apiClient.post('/ai/paper-detail/', {
        title: paper.title || "",
        authors: paper.authors ? paper.authors.join(', ') : "",
        abstract: paper.abstract || "",
        topic: topic || "General Research",
        existing_summary: paper.ai_summary || ""
      });
      setInsight(res.data);
    } catch (err) {
      console.error(err);
      setInsight({ error: "Failed to deeply analyze this paper. Please try again later." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectMenuClick = async (e) => {
    e.stopPropagation();
    setShowProjectMenu(!showProjectMenu);
    if (!showProjectMenu && userProjects.length === 0) {
      try {
        const res = await apiClient.get('/projects/');
        setUserProjects(res.data);
      } catch(e) {
        console.error(e);
      }
    }
  };

  const addToProject = async (e, projectId) => {
    e.stopPropagation();
    try {
        await apiClient.post(`/projects/${projectId}/papers/`, { paper_id: paper.id });
        setShowProjectMenu(false);
    } catch(e) {
        console.error(e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProjectMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm border border-[var(--border-color)] hover:shadow-md transition-all group flex flex-col h-full relative z-0"
      >
        <div className="flex justify-between items-start mb-4 gap-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
            {paper.title}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 shrink-0 uppercase tracking-wide">
              {paper.source}
            </span>
            {queryId && (
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                className={`p-1.5 rounded-full transition-colors ${isSaved ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                title="Save Result"
              >
                <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={handleProjectMenuClick} 
                className="p-1.5 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" 
                title="Add to Project"
              >
                <FolderPlus className="h-5 w-5" />
              </button>
              {showProjectMenu && (
                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="py-1 max-h-48 overflow-y-auto">
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Add to...</div>
                      {userProjects.length === 0 ? (
                         <div className="px-4 py-2 text-sm text-gray-500">No projects found.</div>
                      ) : (
                         userProjects.map(p => (
                            <button key={p.id} onClick={(e) => addToProject(e, p.id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors truncate">
                              {p.name}
                            </button>
                         ))
                      )}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center text-sm text-[var(--text-secondary)] mb-4 gap-x-4 gap-y-2">
          <span className="flex items-center">
            <Users className="h-4 w-4 mr-1.5 text-gray-400" />
            {paper.authors?.slice(0, 2).join(', ')}{paper.authors?.length > 2 ? ' et al.' : ''}
          </span>
          {paper.published_date && (
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
              {new Date(paper.published_date).getFullYear()}
            </span>
          )}
          <span className="flex items-center text-amber-600 font-medium bg-amber-50 px-2 rounded-md">
            <Award className="h-4 w-4 mr-1.5" />
            {paper.citation_count}
          </span>
        </div>

        <div 
          className="mb-6 flex-grow group/insight cursor-pointer" 
          onClick={handleInsightClick}
        >
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider group-hover/insight:text-indigo-600 transition-colors">AI Insight</h4>
          <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] hover:shadow-sm transition-all flex flex-col h-full relative overflow-hidden">
            <p className="text-[var(--text-primary)] text-sm leading-relaxed mb-3">
              {paper.ai_summary || "No summary available."}
            </p>
            <div className="mt-auto pt-2 flex items-center text-indigo-600 text-xs font-bold w-full decoration-indigo-300 group-hover/insight:underline underline-offset-2">
              <span>View full analysis <ArrowRight className="inline h-3 w-3 ml-0.5" /></span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-color)]">
          {pubLink ? (
            <a
              href={pubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Read Publication
              <ExternalLink className="h-4 w-4 ml-1.5" />
            </a>
          ) : (
            <span className="text-sm font-medium text-gray-400">No link available</span>
          )}
          {paper.doi && (
            <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]" title={paper.doi}>DOI: {paper.doi}</span>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-3xl h-full sm:h-[90vh] flex flex-col relative overflow-hidden text-[var(--text-primary)]"
            >
              <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-6 py-5 shrink-0 flex justify-between items-start shadow-md z-10">
                <div className="text-white pr-4">
                  <h2 className="text-xl font-bold leading-tight mb-2 text-white">
                    {paper.title}
                  </h2>
                  <div className="flex flex-wrap items-center text-sm text-indigo-200 gap-x-4 gap-y-1">
                    <span>{paper.authors?.join(', ')}</span>
                    {paper.published_date && (
                      <span className="flex items-center border-l border-indigo-700 w-fit pl-4">
                        {new Date(paper.published_date).getFullYear()}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-[var(--bg-primary)]">
                {isLoading ? (
                  <div className="space-y-6 max-w-3xl mx-auto animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
                      <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
                    </div>
                    <div className="h-24 bg-gray-200 rounded-xl w-full"></div>
                  </div>
                ) : insight?.error ? (
                  <div className="text-center text-red-500 py-20 bg-red-50 rounded-xl border border-red-100 max-w-2xl mx-auto">
                    <p className="text-lg font-semibold">{insight.error}</p>
                  </div>
                ) : insight ? (
                  <div className="max-w-3xl mx-auto space-y-6 lg:space-y-8">
                    
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm">
                      <h4 className="flex items-center text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
                        <FileText className="w-5 h-5 mr-2" /> Full Summary
                      </h4>
                      <p className="text-[var(--text-primary)] leading-relaxed text-[15px]">{insight.full_summary || "Not available for this paper."}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-5">
                        <h4 className="flex items-center text-sm font-bold text-rose-700 uppercase tracking-wider mb-3">
                          <AlertCircle className="w-4 h-4 mr-2" /> Problem Statement
                        </h4>
                        <p className="text-rose-900/80 leading-relaxed text-sm">{insight.problem_statement || "Not available for this paper."}</p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                        <h4 className="flex items-center text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3">
                          <CheckCircle className="w-4 h-4 mr-2" /> Relevance to your project
                        </h4>
                        <p className="text-emerald-900/80 leading-relaxed text-sm">{insight.relevance_to_topic || "Not available for this paper."}</p>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm">
                      <h4 className="flex items-center text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
                        <Crosshair className="w-5 h-5 mr-2" /> Methodology
                      </h4>
                      <p className="text-[var(--text-primary)] leading-relaxed text-[15px]">{insight.methodology || "Not available for this paper."}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm h-full">
                        <h4 className="flex items-center text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">
                          <TrendingUp className="w-5 h-5 mr-2" /> Key Findings
                        </h4>
                        <ul className="space-y-3">
                          {insight.key_findings && insight.key_findings.length > 0 ? insight.key_findings.map((finding, idx) => (
                            <li key={idx} className="flex items-start text-sm text-[var(--text-primary)] leading-snug">
                              <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-indigo-400 shrink-0" />
                              {finding}
                            </li>
                          )) : <p className="text-sm text-[var(--text-secondary)] italic">Not available for this paper.</p>}
                        </ul>
                      </div>

                      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm h-full">
                        <h4 className="flex items-center text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">
                          <X className="w-5 h-5 mr-2" /> Limitations
                        </h4>
                        <ul className="space-y-3">
                          {insight.limitations && insight.limitations.length > 0 ? insight.limitations.map((limitation, idx) => (
                            <li key={idx} className="flex items-start text-sm text-[var(--text-primary)] leading-snug">
                              <span className="text-slate-400 mr-2 shrink-0">•</span>
                              {limitation}
                            </li>
                          )) : <p className="text-sm text-[var(--text-secondary)] italic">Not available for this paper.</p>}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm">
                      <h4 className="flex items-center text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">
                        <Cpu className="w-5 h-5 mr-2" /> Key Technologies
                      </h4>
                      {insight.key_technologies && insight.key_technologies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {insight.key_technologies.map((tech, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {tech}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--text-secondary)] italic">Not available for this paper.</p>
                      )}
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                      <h4 className="flex items-center text-sm font-bold text-amber-700 uppercase tracking-wider mb-4">
                        <Lightbulb className="w-5 h-5 mr-2" /> Suggested Next Steps
                      </h4>
                      <div className="space-y-4">
                        {insight.suggested_next_steps && insight.suggested_next_steps.length > 0 ? insight.suggested_next_steps.map((step, idx) => (
                          <div key={idx} className="flex gap-3 bg-white/60 p-3 rounded-lg border border-amber-50 shadow-sm">
                            <div className="flex-shrink-0 mt-0.5">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold shadow-sm">
                                {idx + 1}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed font-medium">{step}</p>
                          </div>
                        )) : <p className="text-sm text-gray-500 italic">Not available for this paper.</p>}
                      </div>
                    </div>

                    {pubLink && (
                      <div className="pt-6 pb-4 flex justify-center">
                        <a
                          href={pubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-8 py-3 w-full sm:w-auto text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
                        >
                          Read Full Publication Externally
                          <ExternalLink className="h-5 w-5 ml-2" />
                        </a>
                      </div>
                    )}

                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PaperCard;
