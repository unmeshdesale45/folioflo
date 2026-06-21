import React, { useState } from 'react';
import { Plus, Trash2, Search as SearchIcon, X, Check } from 'lucide-react';
import apiClient from '../../lib/axios';
import PaperCard from '../PaperCard';

const PapersTab = ({ project, onUpdate }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [savedPapers, setSavedPapers] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState('');

    const fetchSavedPapers = async () => {
        setLoadingSaved(true);
        try {
            const res = await apiClient.get('/saved/');
            console.log("Saved papers API response:", res.data);
            setSavedPapers(res.data.map(item => item.paper));
        } catch (error) {
            console.error("Failed to fetch saved papers:", error);
        } finally {
            setLoadingSaved(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
        fetchSavedPapers();
    };

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleAddPaper = async (paperId) => {
        try {
            await apiClient.post(`/projects/${project.id}/papers/`, { paper_id: paperId });
            onUpdate(); // refresh project details
            showToast('Paper added to project');
        } catch (error) {
            console.error("Failed to add paper to project:", error);
        }
    };

    const handleRemovePaper = async (paperId) => {
        try {
            await apiClient.delete(`/projects/${project.id}/papers/${paperId}`);
            onUpdate();
        } catch (error) {
            console.error("Failed to remove paper:", error);
        }
    };

    const filteredSavedPapers = savedPapers.filter(p => p && p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const projectPaperIds = new Set((project.papers || []).map(p => p.id));

    return (
        <div className="space-y-6 relative">
            {toastMessage && (
                <div className="fixed top-20 right-4 bg-gray-900 text-white px-4 py-3 rounded-md shadow-lg z-[1100] text-sm font-medium flex items-center transition-opacity duration-300">
                    <Check className="h-4 w-4 mr-2" />
                    {toastMessage}
                </div>
            )}
            
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Project Papers</h3>
                <button
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" /> Add Papers
                </button>
            </div>

            {(!project.papers || project.papers.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-gray-500 mb-4">No papers attached to this project.</p>
                    <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Browse Saved Papers
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {project.papers.map((paper, index) => (
                        <div key={paper.id} className="relative group">
                            <PaperCard paper={paper} index={index} />
                            <button
                                onClick={() => handleRemovePaper(paper.id)}
                                className="absolute top-4 right-14 p-2 bg-white rounded-full shadow-sm text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors z-10 opacity-0 group-hover:opacity-100"
                                title="Remove from project"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Fixed Add Papers Modal */}
            {isAddModalOpen && (
                <div 
                    className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-black/50 z-[1000]" 
                    onClick={() => setIsAddModalOpen(false)}
                >
                    <div 
                        className="relative bg-white rounded-xl p-6 w-[90%] max-w-[600px] max-h-[80vh] overflow-y-auto flex flex-col z-[1001] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-4 right-4 z-10">
                            <button 
                                onClick={() => setIsAddModalOpen(false)} 
                                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="mb-5 flex-shrink-0 pr-8">
                            <h3 className="text-xl font-bold text-gray-900" id="modal-title">Add Papers to Project</h3>
                            <div className="mt-4 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="Search your saved papers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="flex-grow">
                            {loadingSaved ? (
                                <div className="text-center py-12 text-gray-500">Loading saved papers...</div>
                            ) : savedPapers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 font-medium border border-gray-200 border-dashed rounded-lg">
                                    You have no saved papers yet.<br/>Search for papers and save them first.
                                </div>
                            ) : filteredSavedPapers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">No papers match your search.</div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredSavedPapers.map((paper) => {
                                        const isAdded = projectPaperIds.has(paper.id);
                                        return (
                                            <div key={paper.id} className={`border border-gray-200 rounded-lg p-4 flex justify-between items-center transition-colors ${isAdded ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                                                <div className="pr-4">
                                                    <h4 className="font-semibold text-gray-900 line-clamp-2">{paper.title}</h4>
                                                    <div className="flex items-center text-xs text-gray-500 mt-2 space-x-2">
                                                        {paper.source && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                                                                {paper.source}
                                                            </span>
                                                        )}
                                                        {paper.published_date && (
                                                            <span className="font-medium text-gray-400">{new Date(paper.published_date).getFullYear()}</span>
                                                        )}
                                                        <span className="truncate max-w-[200px] text-gray-400">• {paper.authors?.join(', ')}</span>
                                                    </div>
                                                </div>
                                                {isAdded ? (
                                                    <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-400 flex-shrink-0 bg-gray-100 rounded-md">
                                                        <Check className="h-3 w-3 mr-1" /> Already added
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddPaper(paper.id)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 flex-shrink-0 transition-colors shadow-sm"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" /> Add
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PapersTab;
