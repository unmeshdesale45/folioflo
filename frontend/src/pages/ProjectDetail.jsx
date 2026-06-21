import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Users, X } from 'lucide-react';
import apiClient from '../lib/axios';
import LoadingState from '../components/LoadingState';
import PapersTab from '../components/projects/PapersTab';
import NotesTab from '../components/projects/NotesTab';
import DocumentsTab from '../components/projects/DocumentsTab';
import ActivityTab from '../components/projects/ActivityTab';

import { useAuthStore } from '../store/authStore';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('papers');
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState('');
    const [members, setMembers] = useState([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const token = useAuthStore(state => state.token);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const [projRes, memRes] = await Promise.all([
                apiClient.get(`/projects/${id}`),
                apiClient.get(`/projects/${id}/members/`)
            ]);
            setProject(projRes.data);
            setMembers(memRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteError('');
        setIsInviting(true);
        try {
            const res = await apiClient.post(`/projects/${id}/members/`, { email: inviteEmail, role: 'collaborator' });
            setMembers([...members, res.data]);
            setIsInviteModalOpen(false);
            setInviteEmail('');
            setToastMessage('Collaborator added successfully');
            setTimeout(() => setToastMessage(''), 3000);
        } catch (err) {
            setInviteError(err.response?.data?.detail || "Failed to invite collaborator");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Remove this collaborator?")) return;
        try {
            await apiClient.delete(`/projects/${id}/members/${userId}`);
            setMembers(members.filter(m => m.user_id !== userId));
            setToastMessage('Collaborator removed');
            setTimeout(() => setToastMessage(''), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (token) fetchProject();
        // eslint-disable-next-line
    }, [id, token]);

    const handleExportPdf = async () => {
        setIsExporting(true);
        setExportError('');
        try {
            // Using raw fetch to easily handle blob response
            const response = await fetch(`/api/projects/${id}/export-pdf/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Export failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name.replace(/\s+/g, '_')}_report.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF export error:', error);
            setExportError('PDF export failed. Please try again.');
            setTimeout(() => setExportError(''), 3000);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <div className="py-12"><LoadingState message="Loading project details..." /></div>;
    if (!project) return <div className="text-center py-12 text-gray-500">Project not found.</div>;

    const tabs = [
        { id: 'papers', name: 'Papers' },
        { id: 'notes', name: 'Notes' },
        { id: 'documents', name: 'Documents' },
        { id: 'activity', name: 'Activity' }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {exportError && (
                <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-md shadow-lg font-medium flex items-center z-50 animate-fade-in-down">
                    {exportError}
                </div>
            )}
            {toastMessage && (
                <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg font-medium flex items-center z-[100]">
                    {toastMessage}
                </div>
            )}
            <button onClick={() => navigate('/projects')} className="mb-6 inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
            </button>
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                        {project.member_count > 1 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Shared
                            </span>
                        )}
                    </div>
                    {project.description && <p className="mt-2 text-lg text-gray-600">{project.description}</p>}
                    {project.role === 'collaborator' && (
                        <p className="mt-1 text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">You are a collaborator on this project</p>
                    )}
                </div>
                <button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Generating PDF...' : 'Export as PDF'}
                </button>
            </div>

            <div className="mb-8 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-gray-400" />
                        Project Members
                    </h2>
                    {project.role === 'owner' && (
                        <button onClick={() => setIsInviteModalOpen(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                            + Invite Collaborator
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-4">
                    {members.map(m => (
                        <div key={m.id} className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-full border border-gray-200" title={m.email}>
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                                {m.username.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 leading-tight">{m.username}</span>
                                <span className={`text-xs ${m.role === 'owner' ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {m.role === 'owner' ? 'Owner' : 'Collaborator'}
                                </span>
                            </div>
                            {project.role === 'owner' && m.role !== 'owner' && (
                                <button onClick={() => handleRemoveMember(m.user_id)} className="ml-1 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-200 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-4">
                {activeTab === 'papers' && <PapersTab project={project} onUpdate={fetchProject} />}
                {activeTab === 'notes' && <NotesTab project={project} />}
                {activeTab === 'documents' && <DocumentsTab project={project} onUpdate={fetchProject} />}
                {activeTab === 'activity' && <ActivityTab project={project} />}
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button onClick={() => setIsInviteModalOpen(false)} className="bg-white rounded-md text-gray-400 hover:text-gray-500">
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Invite Collaborator</h3>
                                    <div className="mt-4">
                                        {inviteError && (
                                            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm">
                                                {inviteError}
                                            </div>
                                        )}
                                        <form onSubmit={handleInvite} className="space-y-4">
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Enter collaborator's email address</label>
                                                <input required type="email" id="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g. user@folioflo.com" />
                                                <p className="mt-2 text-xs text-gray-500">They must already have a FolioFlo account.</p>
                                            </div>
                                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                <button type="submit" disabled={!inviteEmail.trim() || isInviting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                                                    {isInviting ? 'Sending...' : 'Send Invite'}
                                                </button>
                                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
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
        </div>
    );
};

export default ProjectDetail;
