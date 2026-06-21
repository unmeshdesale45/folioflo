import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, FileText, Calendar, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import apiClient from '../../lib/axios';
import LoadingState from '../LoadingState';

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    return (
        <div className="border border-gray-300 bg-gray-50 rounded-t-md p-2 flex flex-wrap gap-1 items-center">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-indigo-700' : 'text-gray-700'}`}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-indigo-700' : 'text-gray-700'}`}
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('underline') ? 'bg-gray-200 text-indigo-700' : 'text-gray-700'}`}
                title="Underline"
            >
                <UnderlineIcon className="w-4 h-4" />
            </button>
            
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-indigo-700' : 'text-gray-700'}`}
                title="Heading 1"
            >
                <Heading1 className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-indigo-700' : 'text-gray-700'}`}
                title="Heading 2"
            >
                <Heading2 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-indigo-700' : 'text-gray-700'}`}
                title="Bullet List"
            >
                <List className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-indigo-700' : 'text-gray-700'}`}
                title="Numbered List"
            >
                <ListOrdered className="w-4 h-4" />
            </button>
        </div>
    );
};

const DocumentsTab = ({ project, onUpdate }) => {
    const [documents, setDocuments] = useState(project.documents || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [currentDoc, setCurrentDoc] = useState(null); // null if creating new
    const [title, setTitle] = useState('');
    
    // Refresh local docs list directly or use onUpdate, we'll just use project.documents
    // Actually project.documents is passed via props and we update it by calling onUpdate
    useEffect(() => {
        setDocuments(project.documents || []);
    }, [project.documents]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4 text-gray-800'
            }
        }
    });

    const handleOpenModal = (doc = null) => {
        setCurrentDoc(doc);
        setTitle(doc ? doc.title : '');
        if (editor) {
            editor.commands.setContent(doc ? doc.content : '');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setCurrentDoc(null);
            setTitle('');
            if (editor) editor.commands.setContent('');
        }, 200);
    };

    const handleSaveDocument = async () => {
        if (!title.trim()) return;
        setIsSaving(true);
        const content = editor.getHTML();
        
        try {
            if (currentDoc) {
                await apiClient.put(`/projects/${project.id}/documents/${currentDoc.id}`, { title, content });
            } else {
                await apiClient.post(`/projects/${project.id}/documents/`, { title, content });
            }
            onUpdate(); // tells ProjectDetail to fetch everything again
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save document:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            await apiClient.delete(`/projects/${project.id}/documents/${docId}`);
            onUpdate();
        } catch (error) {
            console.error("Failed to delete document:", error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Project Documents</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" /> New Document
                </button>
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                    <FileText className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium mb-1">No documents yet.</p>
                    <p className="text-sm text-gray-400 mb-5">Create your first document to start drafting ideas.</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Create Document
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-48">
                            <div className="p-5 flex-grow font-medium flex items-start">
                                <FileText className="h-5 w-5 text-indigo-500 mr-3 shrink-0" />
                                <h4 className="text-gray-900 line-clamp-2 leading-tight">{doc.title}</h4>
                            </div>
                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                <span className="flex items-center text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                                    <Calendar className="h-3.5 w-3.5 mr-1" />
                                    {formatDate(doc.updated_at)}
                                </span>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handleOpenModal(doc)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                        title="Edit Document"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete Document"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Document Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={handleCloseModal}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col relative overflow-hidden z-10 transform transition-all">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {currentDoc ? 'Edit Document' : 'Create New Document'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="flex-grow overflow-y-auto p-6 flex flex-col bg-white">
                            <div className="mb-6 shrink-0">
                                <label htmlFor="doc-title" className="block text-sm font-medium text-gray-700 mb-1">Document Title <span className="text-red-500">*</span></label>
                                <input
                                    id="doc-title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base py-2.5 px-4 border"
                                    placeholder="Enter document title..."
                                />
                            </div>
                            
                            <div className="flex-grow flex flex-col min-h-0 border border-t-0 border-gray-300 rounded-md overflow-hidden">
                                <MenuBar editor={editor} />
                                <div className="flex-grow overflow-y-auto bg-white border-x border-b border-gray-300 rounded-b-md cursor-text" onClick={() => editor?.commands.focus()}>
                                   <EditorContent editor={editor} className="h-full" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0 gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveDocument}
                                disabled={!title.trim() || isSaving}
                                className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Document'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsTab;
