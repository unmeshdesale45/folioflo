import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, FileText, File, Calendar, X, Trash2 } from 'lucide-react';
import apiClient from '../lib/axios';
import LoadingState from '../components/LoadingState';

import { useAuthStore } from '../store/authStore';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const navigate = useNavigate();
    const token = useAuthStore(state => state.token);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            console.log("Token at fetch:", token);
            const response = await apiClient.get('/projects/');
            console.log("Raw response:", response);
            console.log("Response.data:", response.data);
            console.log("Type:", typeof response.data);
            console.log("Is array:", Array.isArray(response.data));

            const data = response.data;
            if (Array.isArray(data)) {
                setProjects(data);
            } else if (data && data.projects) {
                setProjects(data.projects);
            } else if (data && data.data) {
                setProjects(data.data);
            } else {
                console.error("Unexpected data shape:", data);
                setProjects([]);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchProjects();
        }
    }, [token]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProject.name.trim()) return;
        try {
            setIsCreating(true);
            const res = await apiClient.post('/projects/', newProject);
            setProjects([res.data, ...projects]);
            setIsModalOpen(false);
            setNewProject({ name: '', description: '' });
        } catch (error) {
            console.error("Failed to create project:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this project? This cannot be undone.")) {
            try {
                await apiClient.delete(`/projects/${id}`);
                setProjects(projects.filter(p => p.id !== id));
                setToastMessage('Project deleted');
                setTimeout(() => setToastMessage(''), 3000);
            } catch (error) {
                console.error("Failed to delete project:", error);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                </button>
            </div>

            {loading ? (
                <div className="py-12">
                     <LoadingState message="Loading projects..." />
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <FolderOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-6">Create your first project to organise your research.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group relative">
                            {project.role === 'owner' && (
                                <button
                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                    className="absolute top-12 right-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                                    title="Delete Project"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                            <div className="p-5 flex-grow">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 break-words flex-1">{project.name}</h3>
                                    <div className="shrink-0">
                                        {project.role === 'owner' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Owner</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Collaborator</span>
                                        )}
                                    </div>
                                </div>
                                {project.role === 'collaborator' && project.owner_username && (
                                    <p className="text-xs text-gray-500 mb-2 truncate">Owned by: {project.owner_username}</p>
                                )}
                                {project.description ? (
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{project.description}</p>
                                ) : (
                                    <p className="text-gray-400 text-sm italic mb-4">No description</p>
                                )}
                                
                                <div className="flex space-x-6 text-sm text-gray-500 mt-auto">
                                    <div className="flex items-center">
                                        <FileText className="h-4 w-4 mr-1.5 text-gray-400" />
                                        {project.paper_count} {project.paper_count === 1 ? 'Paper' : 'Papers'}
                                    </div>
                                    <div className="flex items-center">
                                        <File className="h-4 w-4 mr-1.5 text-gray-400" />
                                        {project.document_count} {project.document_count === 1 ? 'Doc' : 'Docs'}
                                    </div>
                                </div>
                            </div>
                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 justify-between items-center hidden sm:flex">
                                <span className="flex items-center text-xs text-gray-400">
                                    <Calendar className="h-3.5 w-3.5 mr-1" />
                                    {formatDate(project.created_at)}
                                </span>
                                <button
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                >
                                    Open →
                                </button>
                            </div>
                            <div className="p-4 sm:hidden border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="w-full text-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 rounded-md font-medium text-sm transition-colors"
                                >
                                    Open Project
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background backdrop */}
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button onClick={() => setIsModalOpen(false)} className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Create New Project</h3>
                                    <div className="mt-4">
                                        <form onSubmit={handleCreateProject} className="space-y-4">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name <span className="text-red-500">*</span></label>
                                                <input required type="text" id="name" value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g. Pothole Detection System" />
                                            </div>
                                            <div>
                                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                                                <textarea id="description" value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="One line about the project" />
                                            </div>
                                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                <button type="submit" disabled={!newProject.name.trim() || isCreating} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                                                    {isCreating ? 'Creating...' : 'Create Project'}
                                                </button>
                                                <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg font-medium flex items-center z-[100]">
                    <Trash2 className="w-5 h-5 mr-2 text-red-400" />
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default Projects;
