import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import apiClient from '../../lib/axios';

const NotesTab = ({ project }) => {
    const [noteContent, setNoteContent] = useState(project.note?.content || '');
    const [saveStatus, setSaveStatus] = useState('idle'); 
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const response = await apiClient.get(`/projects/${project.id}/notes/`);
                if (response.data && response.data.content !== undefined) {
                    setNoteContent(response.data.content);
                }
            } catch (err) {
                console.error("Failed to fetch note:", err);
            }
        };
        fetchNote();
    }, [project.id]);

    const saveNote = async (content) => {
        try {
            console.log("Saving note:", content);
            setSaveStatus('saving');
            const response = await apiClient.put(`/projects/${project.id}/notes/`, { content });
            console.log("Save response:", response.status, response.data);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Failed to save note:', error);
            setSaveStatus('idle');
        }
    };

    const handleChange = (e) => {
        const newContent = e.target.value;
        setNoteContent(newContent);
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
            saveNote(newContent);
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Project Notes</h3>
                <div className="text-sm text-gray-500 flex items-center h-5">
                    {saveStatus === 'saving' && (
                        <span className="flex items-center text-indigo-600"><Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> Saving...</span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="flex items-center text-green-600"><Check className="h-4 w-4 mr-1" /> Saved</span>
                    )}
                </div>
            </div>
            <textarea
                value={noteContent}
                onChange={handleChange}
                placeholder="Start typing your research notes here..."
                className="flex-grow w-full p-6 focus:outline-none focus:ring-0 resize-none text-gray-800"
            />
        </div>
    );
};

export default NotesTab;
