import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react';
import LoadingState from '../components/LoadingState';
import { useTheme } from '../context/ThemeContext';

const Profile = () => {
    const navigate = useNavigate();
    const { logout, updateUsername } = useAuthStore();
    
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { theme, toggleTheme } = useTheme();

    const [newUsername, setNewUsername] = useState('');
    const [password, setPassword] = useState('');
    const [updating, setUpdating] = useState(false);
    
    // UI State
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiClient.get('/auth/profile');
                setProfileData(res.data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateUsername = async (e) => {
        e.preventDefault();
        setError('');
        setToast('');

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(newUsername)) {
            setError("Username must be 3-20 characters, letters, numbers and underscores only");
            return;
        }

        if (!password) {
            setError("Please confirm your password to update your username.");
            return;
        }

        setUpdating(true);
        try {
            const res = await apiClient.put('/auth/profile/update-username', {
                new_username: newUsername,
                password: password
            });
            
            // Sync local profile state
            setProfileData({ ...profileData, username: res.data.username });
            
            // Update the global auth store specifically designed for Navbar synchronization
            if (updateUsername) updateUsername(res.data.username);
            
            // Clear inputs and show success
            setNewUsername('');
            setPassword('');
            setToast('Username updated successfully');
            
            setTimeout(() => setToast(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to update username.");
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    if (loading) {
        return <div className="py-20"><LoadingState message="Loading profile..." /></div>;
    }

    if (!profileData) {
        return <div className="text-center py-20 text-[var(--text-secondary)]">Could not load profile data.</div>;
    }

    return (
        <div className="max-w-[500px] mx-auto px-4 py-12 relative animate-fade-in text-[var(--text-primary)]">
            {toast && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium flex items-center z-50">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {toast}
                </div>
            )}

            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden mb-8">
                {/* Section 1 - Account Info */}
                <div className="p-8 flex flex-col items-center border-b border-[var(--border-color)]">
                    <div className="w-[60px] h-[60px] rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold uppercase shadow-md mb-4">
                        {profileData.username.charAt(0)}
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{profileData.username}</h1>
                    <p className="text-[var(--text-secondary)] text-sm mb-3">{profileData.email}</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        Member since {formatDate(profileData.created_at)}
                    </span>
                </div>

                {/* Section 2 - Change Username */}
                <div className="p-8">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Change Username</h2>
                    
                    <form onSubmit={handleUpdateUsername} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">New username</label>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="appearance-none block w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg shadow-sm placeholder-[var(--text-secondary)] focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                placeholder="Choose a new username"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Confirm password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg shadow-sm placeholder-[var(--text-secondary)] focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                placeholder="Required for security"
                            />
                        </div>

                        {error && (
                            <div className="flex items-start text-red-600 text-sm mt-1 bg-red-50 p-2 rounded border border-red-100">
                                <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={updating || !newUsername.trim() || !password.trim()}
                            className="w-full mt-2 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--blue-primary)] hover:bg-[var(--blue-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--blue-primary)] transition-colors disabled:opacity-50"
                        >
                            {updating ? 'Updating...' : 'Update Username'}
                        </button>
                    </form>
                </div>

                {/* Section API - Appearance */}
                <div className="p-8 border-t border-[var(--border-color)]">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Appearance</h2>
                    <div 
                        onClick={toggleTheme}
                        className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg cursor-pointer hover:border-[var(--blue-primary)] transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            {theme === 'light' ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-indigo-400" />
                            )}
                            <span className="font-medium text-[var(--text-primary)]">
                                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        </div>
                        
                        {/* iOS style toggle */}
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                        Currently using {theme === 'light' ? 'light' : 'dark'} mode
                    </p>
                </div>
            </div>

            {/* Section 3 - Danger Zone */}
            <div className="bg-red-50/30 rounded-xl border border-red-200 p-8">
                <h2 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h2>
                <button
                    onClick={handleLogout}
                    className="w-full flex justify-center py-2.5 px-4 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Logout from <span style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#4f46e5', fontSize: '24px', marginLeft: '4px' }}>FolioFlo</span>
                </button>
            </div>
        </div>
    );
};

export default Profile;
