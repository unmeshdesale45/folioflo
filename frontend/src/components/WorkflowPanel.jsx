import { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, X, Clock, Wrench, AlertTriangle, BookOpen, Target, ChevronRight, BookText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../lib/axios';

const WorkflowPanel = ({ workflow, topic, techStack }) => {
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [showFullWorkflow, setShowFullWorkflow] = useState(false);

  const [isLoadingPhase, setIsLoadingPhase] = useState(false);
  const [phaseDetails, setPhaseDetails] = useState(null);

  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [fullWorkflowDetails, setFullWorkflowDetails] = useState(null);

  if (!workflow || !workflow.phases || workflow.phases.length === 0) return null;

  const handleHeaderClick = async () => {
    setShowFullWorkflow(true);
    if (fullWorkflowDetails) return; // use cache if already loaded
    
    setIsLoadingFull(true);
    try {
      const res = await apiClient.post('/ai/full-workflow/', {
        topic: topic || "General Research",
        workflow_steps: workflow.phases.map(p => p.name || "Phase"),
        tech_stack: techStack || {}
      });
      setFullWorkflowDetails(res.data);
    } catch (err) {
      console.error(err);
      setFullWorkflowDetails({ error: "Failed to generate full comprehensive guide. Please try again." });
    } finally {
      setIsLoadingFull(false);
    }
  };

  const handlePhaseClick = async (phase, index) => {
    const phaseName = phase.name || `Phase ${index + 1}`;
    setSelectedPhase({ name: phaseName, number: index + 1 });
    setIsLoadingPhase(true);
    setPhaseDetails(null);
    
    try {
      const res = await apiClient.post('/ai/workflow-detail/', {
        step_name: phaseName,
        step_number: index + 1,
        topic: topic || "General Research"
      });
      setPhaseDetails(res.data);
    } catch (err) {
      console.error(err);
      setPhaseDetails({ error: "Failed to load phase insights. Please try again." });
    } finally {
      setIsLoadingPhase(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col relative z-0 group">
        <div 
          onClick={handleHeaderClick}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 shrink-0 cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all flex justify-between items-center"
        >
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              Suggested Build Workflow
            </h2>
            <p className="text-blue-100 text-sm mt-1">AI-generated implementation plan based on the research. Click to view full end-to-end project guide.</p>
          </div>
          <BookText className="w-8 h-8 text-white/50 group-hover:text-white/80 transition-colors" />
        </div>
        
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="space-y-10">
            {workflow.phases.map((phase, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {index !== workflow.phases.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-[-2.5rem] w-0.5 bg-gray-200"></div>
                )}
                
                <div className="flex items-start group/phase">
                  <div className="flex-shrink-0 mt-1 relative z-10">
                    <div 
                      onClick={() => handlePhaseClick(phase, index)}
                      className="cursor-pointer h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-sm hover:bg-indigo-600 hover:text-white transition-colors group-hover/phase:scale-110"
                    >
                      <span className="text-indigo-600 group-hover/phase:text-white font-bold text-sm transition-colors">{index + 1}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-grow">
                    <h3 
                      onClick={() => handlePhaseClick(phase, index)}
                      className="text-lg font-bold text-gray-900 mb-1 cursor-pointer hover:text-indigo-600 transition-colors"
                    >
                      {phase.name || `Phase ${index + 1}`}
                    </h3>
                    
                    <ul className="mt-3 space-y-3">
                      {phase.steps?.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 rounded-lg p-3 border border-transparent hover:border-gray-200">
                          <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-indigo-400 shrink-0" />
                          <span className="text-sm leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* INDIVIDUAL PHASE MODAL */}
      <AnimatePresence>
        {selectedPhase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setSelectedPhase(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm shadow-sm">
                    {selectedPhase.number}
                  </div>
                  {selectedPhase.name}
                </h2>
                <button 
                  onClick={() => setSelectedPhase(null)} 
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {isLoadingPhase ? (
                  <div className="space-y-6 animate-pulse">
                    <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
                    <div className="h-32 bg-gray-100 rounded-xl w-full"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-20 bg-gray-100 rounded-xl w-full"></div>
                      <div className="h-20 bg-gray-100 rounded-xl w-full"></div>
                    </div>
                  </div>
                ) : phaseDetails?.error ? (
                  <div className="text-center text-red-500 py-12 bg-red-50 border border-red-100 rounded-xl font-medium">
                    {phaseDetails.error}
                  </div>
                ) : phaseDetails ? (
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Overview</h3>
                      <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">{phaseDetails.overview}</p>
                    </section>
                    
                    <section>
                      <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Detailed Tasks</h3>
                      <div className="space-y-3">
                        {phaseDetails.detailed_tasks?.map((task, i) => (
                          <div key={i} className="flex gap-3 bg-white border border-gray-200 p-3 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
                            <div className="flex-shrink-0 mt-0.5">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                {i + 1}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{task}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <section className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                        <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center mb-3">
                          <Wrench className="w-4 h-4 mr-1.5" /> Tools Needed
                        </h3>
                        <ul className="space-y-2">
                          {phaseDetails.tools_needed?.map((tool, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start leading-snug">
                              <span className="text-amber-500 mr-2 shrink-0">•</span>{tool}
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section className="bg-red-50/50 p-4 rounded-xl border border-red-100/50">
                        <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center mb-3">
                          <AlertTriangle className="w-4 h-4 mr-1.5" /> Common Mistakes
                        </h3>
                        <ul className="space-y-2">
                          {phaseDetails.common_mistakes?.map((mistake, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start leading-snug">
                              <span className="text-red-500 mr-2 shrink-0">•</span>{mistake}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <section>
                        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center">
                          <Clock className="w-4 h-4 mr-1.5" /> Estimated Time
                        </h3>
                        <p className="text-gray-700 text-sm font-semibold">{phaseDetails.estimated_time}</p>
                      </section>

                      <section>
                        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-1.5" /> Expected Output
                        </h3>
                        <p className="text-gray-700 text-sm font-medium">{phaseDetails.expected_output}</p>
                      </section>
                    </div>

                    <section>
                      <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center">
                        <BookOpen className="w-4 h-4 mr-1.5" /> Learning Resources
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {phaseDetails.resources?.map((res, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                            <div className="font-semibold text-gray-900 text-sm mb-1">{res.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-2">{res.description}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL WORKFLOW MODAL */}
      <AnimatePresence>
        {showFullWorkflow && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-gray-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full sm:h-[90vh] flex flex-col relative overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-5 shrink-0 flex justify-between items-center shadow-md z-10">
                <div className="text-white">
                  <h2 className="text-2xl font-black flex items-center gap-3">
                    <BookText className="w-6 h-6 text-blue-200" />
                    Complete Project Implementation Guide
                  </h2>
                  <p className="text-blue-100 text-sm mt-1 opacity-90">{topic}</p>
                </div>
                <button 
                  onClick={() => setShowFullWorkflow(false)} 
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-gray-50/50">
                {isLoadingFull ? (
                  <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : fullWorkflowDetails?.error ? (
                  <div className="text-center text-red-500 py-20 bg-red-50 rounded-xl border border-red-100 max-w-2xl mx-auto">
                    <p className="text-lg font-semibold">{fullWorkflowDetails.error}</p>
                  </div>
                ) : fullWorkflowDetails?.full_guide ? (
                  <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
                    {fullWorkflowDetails.full_guide.map((phase, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        
                        {/* Phase Header */}
                        <div className="bg-indigo-50/50 border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
                              {phase.phase_number}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{phase.phase_name}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-indigo-700 bg-indigo-100/50 px-3 py-1.5 rounded-full text-sm font-medium w-fit">
                            <Clock className="w-4 h-4" />
                            {phase.duration}
                          </div>
                        </div>

                        {/* Phase Content */}
                        <div className="p-6 space-y-6">
                          {/* Tasks */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Key Execution Tasks</h4>
                            <div className="space-y-3">
                              {phase.tasks?.map((task, tIdx) => (
                                <div key={tIdx} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100/50">
                                  <ChevronRight className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                  <span className="text-gray-700 text-sm leading-relaxed">{task}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Splits */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center">
                                <Target className="w-4 h-4 mr-1.5" /> Phase Milestone
                              </h4>
                              <p className="text-sm text-emerald-900/80 font-medium leading-relaxed">{phase.milestone}</p>
                            </div>

                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1.5" /> Pro Tips
                              </h4>
                              <p className="text-sm text-amber-900/80 leading-relaxed">{phase.tips}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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

export default WorkflowPanel;
