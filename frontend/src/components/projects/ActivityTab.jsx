import React, { useState, useEffect } from 'react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

const ActivityTab = ({ project }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUsername = useAuthStore(state => state.user?.username);

    const fetchActivity = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await apiClient.get(`/projects/${project.id}/activity/`);
            setActivities(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(() => {
            fetchActivity(false);
        }, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, [project.id]);

    const getRelativeTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        
        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return <div className="py-8 text-center text-gray-500">Loading activity...</div>;
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
                <p className="text-gray-500">No activity yet. Start by adding papers or inviting collaborators.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h3>
            <div className="relative border-l border-gray-200 ml-3 space-y-8">
                {activities.map((act, index) => {
                    const isCurrentUser = currentUsername === act.username;
                    const displayName = isCurrentUser ? 'You' : act.username;
                    
                    return (
                        <div key={act.id} className="relative pl-6">
                            <span className="absolute -left-4 top-1 w-8 h-8 rounded-full bg-indigo-100 border-4 border-white flex items-center justify-center text-xs font-bold text-indigo-700 uppercase shadow-sm">
                                {act.username?.charAt(0)}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1">
                                <p className="text-sm text-gray-800">
                                    <span className="font-medium">{displayName}</span> {act.action.replace(`"{act.entity_name}"`, `'${act.entity_name}'`)}
                                </p>
                                <span className="text-xs text-gray-500 sm:ml-4 whitespace-nowrap mt-1 sm:mt-0">
                                    {getRelativeTime(act.created_at)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActivityTab;
