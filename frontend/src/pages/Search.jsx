import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PaperCard from '../components/PaperCard';
import WorkflowPanel from '../components/WorkflowPanel';
import TechStackGrid from '../components/TechStackGrid';
import LoadingState from '../components/LoadingState';
import apiClient from '../lib/axios';
import AnimatedBackground from '../components/AnimatedBackground';
import robotIcon from '../assets/robot-icon.png';


const Search = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialSearchQuery, setInitialSearchQuery] = useState('');
  const [savedPapers, setSavedPapers] = useState([]);
  
  // Destructured state exactly as targeted
  const [papers, setPapers] = useState([]);
  const [techStack, setTechStack] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [queryId, setQueryId] = useState(null);
  const [sortBy, setSortBy] = useState("relevant");
  
  const [gaps, setGaps] = useState(null);
  const [gapsLoading, setGapsLoading] = useState(false);

  const sortPapers = (papersList, sortType) => {
    if (!papersList) return [];
    const sorted = [...papersList];
    switch(sortType) {
      case 'latest':
        return sorted.sort((a, b) => 
          (b.year || (b.published_date ? parseInt(b.published_date.split('-')[0]) : 0)) - 
          (a.year || (a.published_date ? parseInt(a.published_date.split('-')[0]) : 0)));
      
      case 'oldest':
        return sorted.sort((a, b) => 
          (a.year || (a.published_date ? parseInt(a.published_date.split('-')[0]) : 0)) - 
          (b.year || (b.published_date ? parseInt(b.published_date.split('-')[0]) : 0)));
      
      case 'most_cited':
        return sorted.sort((a, b) => 
          (b.citation_count || 0) - (a.citation_count || 0));
      
      case 'most_unique':
        const groups = {
          arxiv: sorted.filter(p => p.source === 'arxiv'),
          crossref: sorted.filter(p => p.source === 'crossref'),
          semantic_scholar: sorted.filter(p => p.source === 'semantic_scholar')
        };
        const result = [];
        const maxLen = Math.max(
          groups.arxiv.length,
          groups.crossref.length,
          groups.semantic_scholar.length
        );
        for(let i = 0; i < maxLen; i++) {
          if(groups.arxiv[i]) result.push(groups.arxiv[i]);
          if(groups.crossref[i]) result.push(groups.crossref[i]);
          if(groups.semantic_scholar[i]) result.push(groups.semantic_scholar[i]);
        }
        return result;
      
      case 'relevant':
      default:
        return sorted;
    }
  };

  const displayedPapers = sortPapers(papers, sortBy);

  useEffect(() => {
    const qId = searchParams.get('query_id');
    const queryText = searchParams.get('query');
    
    if (qId) {
      if (queryText) setInitialSearchQuery(queryText);
      fetchHistoryResult(qId);
    } else {
      const incomingQuery = location.state?.query;
      if (incomingQuery && incomingQuery.trim() !== "") {
        setInitialSearchQuery(incomingQuery);
        executeSearch(incomingQuery);
      }
    }
    fetchSavedState();
  }, [searchParams, location.state?.query]);

  useEffect(() => {
    let isMounted = true;
    
    if (papers && papers.length > 0 && initialSearchQuery) {
      setGapsLoading(true);
      
      const gapPayload = {
        topic: initialSearchQuery,
        papers: papers.map((p) => ({ 
          title: p.title, 
          abstract: p.abstract || '', 
          year: parseInt(p.year || p.published_date?.split('-')[0] || 0) 
        }))
      };
      
      Promise.all([
        apiClient.post('/ai/research-gaps/', gapPayload)
          .then(res => { if (isMounted) { setGaps(res.data); setGapsLoading(false); } })
          .catch(err => { if (isMounted) { setGaps({ gaps: [], summary: "Analysis unavailable", recommended_contribution: "" }); setGapsLoading(false); console.error(err); } })
      ]);
    }
    
    return () => { isMounted = false; };
  }, [papers, initialSearchQuery]);

  const fetchSavedState = async () => {
    try {
      const res = await apiClient.get('/saved/');
      setSavedPapers(res.data.map(item => item.paper_id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveToggle = async (qId, paperId) => {
    try {
      if (savedPapers.includes(paperId)) return;
      await apiClient.post('/saved/', { query_id: qId, paper_id: paperId, notes: '' });
      setSavedPapers([...savedPapers, paperId]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistoryResult = async (id) => {
    setIsLoading(true);
    setError('');
    setPapers([]);
    setTechStack(null);
    setWorkflow(null);
    
    try {
      const response = await apiClient.get(`/research/${id}`);
      setPapers(response.data.papers || []);
      setTechStack(response.data.tech_stack || null);
      setWorkflow(response.data.workflow || null);
      setQueryId(response.data.query_id);
      if (response.data.query) {
        setInitialSearchQuery(response.data.query);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load historical result.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeSearch = async (query) => {
    if (!query || query.trim() === "") return;
    
    setInitialSearchQuery(query.trim());
    console.log("query being searched:", query);
    setIsLoading(true);
    setError('');
    setPapers([]);
    setTechStack(null);
    setWorkflow(null);

    try {
      const response = await apiClient.post('/research/search', {
        query: query.trim(),
        max_results: 15
      });
      
      console.log("API response:", response.data);
      console.log("papers extracted:", response.data.papers?.length);
      console.log("techstack response:", response.data.tech_stack);
      console.log("workflow response:", response.data.workflow);
      
      // We process the exact same unified backend route assigning dynamically to variables
      setPapers(response.data.papers || []);
      setTechStack(response.data.tech_stack || null);
      setWorkflow(response.data.workflow || null);
      setQueryId(response.data.query_id);
      
    } catch (err) {
      console.error("Search failed:", err);
      setError(err.response?.data?.detail || 'An error occurred during your search.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight sm:text-5xl mb-4">
            Discover. Analyze. Build.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Unleash the power of AI to synthesize academic research into actionable development workflows.
          </p>
        </div>

        <SearchBar onSearch={executeSearch} isLoading={isLoading} initialQuery={initialSearchQuery} />

        {/* Inline Chatbot Trigger */}
        <div 
          onClick={() => window.dispatchEvent(new CustomEvent('toggleChatBot'))}
          className="mt-4 w-full max-w-3xl mx-auto flex items-center bg-[rgba(255,255,255,0.7)] dark:bg-[rgba(30,41,59,0.7)] backdrop-blur-md border border-[rgba(99,102,241,0.3)] hover:border-[#6366f1] hover:scale-[1.01] transition-all cursor-pointer rounded-[12px] px-[20px] py-[12px]"
        >
          <img src={robotIcon} alt="Robot Icon" className="w-[40px] h-[40px] mr-4 dark:invert" />
          <div className="flex flex-col text-left">
            <span className="font-semibold text-[15px] text-[var(--text-primary)]">
              Chat with <span style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#4f46e5', fontSize: '18px' }}>FolioFlo</span> AI
            </span>
            <span className="text-[12px] text-[var(--text-secondary)] tracking-[1px] uppercase mt-0.5">
              Upload • Research • Chat
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-8 max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-sm text-center">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-16">
            <LoadingState />
          </div>
        )}

        {!isLoading && papers && papers.length > 0 && (
          <div className="mt-16 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Research Publications</h2>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                    {papers.length} Results
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Sort by:</span>
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value)}
                    className="border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] rounded-[8px] py-1.5 px-3 text-sm font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm transition-colors"
                  >
                    <option value="relevant">Most Relevant</option>
                    <option value="latest">Latest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="most_cited">Most Cited</option>
                    <option value="most_unique">Most Unique</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedPapers?.map((paper, idx) => (
                  <PaperCard 
                    key={paper.id || idx} 
                    paper={paper} 
                    index={idx} 
                    queryId={queryId} 
                    isSaved={savedPapers.includes(paper.id)}
                    onToggleSave={() => handleSaveToggle(queryId, paper.id)}
                    topic={initialSearchQuery}
                  />
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              <section className="h-full">
                {techStack && <TechStackGrid techStack={techStack} topic={initialSearchQuery} />}
              </section>
              <section className="h-full flex flex-col">
                {workflow && <WorkflowPanel workflow={workflow} topic={initialSearchQuery} techStack={techStack} />}
              </section>
            </div>

            <div className="mt-12 space-y-8">
              {(gapsLoading || gaps) && (
                <section className="bg-white rounded-[16px] shadow-sm border border-[var(--border-color)] p-6 md:p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span>🔍</span> Research Gap Finder
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">AI analysis of unexplored opportunities</p>
                  </div>
                  
                  {gapsLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-20 bg-gray-200 rounded w-full mt-4"></div>
                    </div>
                  ) : gaps && (
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-3">Landscape Overview</h4>
                        <p className="text-[var(--text-primary)] leading-relaxed">{gaps.summary}</p>
                      </div>
                      
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-indigo-800 tracking-wider uppercase mb-2 flex items-center gap-1">
                          <span>⭐</span> Recommended Contribution
                        </h4>
                        <p className="text-indigo-900 font-medium">{gaps.recommended_contribution}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-4">Identified Gaps</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {gaps.gaps?.map((gap, i) => (
                            <div key={i} className="bg-white border rounded-xl p-5 shadow-sm" style={{borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: gap.difficulty === 'Easy' ? '#22c55e' : gap.difficulty === 'Medium' ? '#f59e0b' : '#ef4444'}}>
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-bold text-[14px] text-gray-900">{gap.title}</h5>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                                  backgroundColor: gap.difficulty === 'Easy' ? '#dcfce7' : gap.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2',
                                  color: gap.difficulty === 'Easy' ? '#166534' : gap.difficulty === 'Medium' ? '#92400e' : '#991b1b'
                                }}>{gap.difficulty}</span>
                              </div>
                              <p className="text-[13px] text-gray-600 mb-3">{gap.description}</p>
                              <p className="text-[13px] text-indigo-700 font-medium leading-tight">
                                <span className="mr-1">💡</span>{gap.opportunity}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
