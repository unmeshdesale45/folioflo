import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Clock, Bookmark, Folder, Bell, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import apiClient from '../lib/axios';

const Sidebar = () => {
  const { isAuthenticated, user, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const [recentSearches, setRecentSearches] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', newState);
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: newState }));
  };

  // Determine active route
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) return;
    try {
      const res = await apiClient.get('/notifications/');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecents = async () => {
    if (!isAuthenticated || !token) return;
    try {
      const res = await apiClient.get('/research/history');
      setRecentSearches(res.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch recents', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchRecents();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token, location.pathname]); // re-fetch recents when location changes (after a new search)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !e.target.closest('#notification-dropdown-portal')) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleBellClick = async () => {
    setShowDropdown(prev => !prev);
    if (!showDropdown) {
      try {
        const res = await apiClient.get('/notifications/');
        const data = res.data;
        setNotifications(Array.isArray(data) ? data : data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } catch(err) {
        console.error('Failed to fetch:', err);
      }
    }
  };

  const handleMarkAsRead = async (id, projectId, e) => {
    e.stopPropagation();
    try {
      await apiClient.put(`/notifications/${id}/read/`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
      setShowDropdown(false);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await apiClient.put('/notifications/read-all/');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Do not render sidebar for anonymous users
  if (!isAuthenticated) return null;

  return (
    <>
    <aside className={`fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-300 w-[60px] bg-[var(--bg-sidebar-glass)] border-r border-[var(--border-sidebar-glass)] backdrop-blur-md ${isCollapsed ? 'md:w-[60px]' : 'md:w-[260px]'}`}>
      
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-gray-600 items-center justify-center text-gray-700 dark:text-gray-200 shadow-sm z-[60] hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Top Section */}
      <div className={`p-4 flex flex-col items-center md:items-start shrink-0 ${isCollapsed ? 'px-2' : ''}`}>
        <Link to="/search" className="mb-6 flex flex-col items-center justify-center w-full overflow-hidden">
          <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 h-0 absolute overflow-hidden' : 'opacity-100 relative hidden md:inline'}`} style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#4f46e5', fontSize: '26px' }}>
            FolioFlo
          </span>
          <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-100 relative mt-2' : 'opacity-0 absolute md:hidden'}`} style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#4f46e5', fontSize: '16px', writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', letterSpacing: '2px', paddingBottom: '10px' }}>
            FolioFlo
          </span>
        </Link>
        
        <Link 
          to="/search" 
          onClick={() => {
            // Force a navigation effectively "new search" clearing params if already on /search
            if (location.pathname === '/search' && !location.search) {
              window.location.reload(); 
            }
          }}
          className={`flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shrink-0 ${isCollapsed ? 'w-10 h-10 rounded-full mx-auto p-0' : 'w-full rounded-lg p-3 md:justify-start'}`}
          title="New Search"
        >
          <Plus className="w-[20px] h-[20px] shrink-0 mx-auto md:mx-0" />
          <span className={`font-semibold text-sm hidden md:inline truncate transition-all duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0 absolute' : 'opacity-100 ml-3 relative w-auto'}`}>New Search</span>
        </Link>
      </div>

      {/* Middle Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1 hide-scrollbar">
        <Link to="/search" className={`w-full flex items-center justify-center py-[10px] rounded-[8px] transition-colors ${isActive('/search') ? 'bg-indigo-50/50 dark:bg-slate-800/50 text-blue-600 shadow-sm' : 'text-[var(--text-primary)] hover:bg-[var(--bg-card)]'} ${!isCollapsed ? 'md:px-3 md:justify-start' : 'px-0'}`} title="Search">
          <div className="flex items-center justify-center w-[20px] shrink-0 mx-auto md:mx-0"><Search className="w-[20px] h-[20px]" /></div>
          <span className={`font-medium text-sm hidden md:inline truncate transition-all duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0 absolute' : 'opacity-100 ml-3 relative w-auto'}`}>Search</span>
        </Link>
        
        <Link to="/history" className={`w-full flex items-center justify-center py-[10px] rounded-[8px] transition-colors ${isActive('/history') ? 'bg-indigo-50/50 dark:bg-slate-800/50 text-blue-600 shadow-sm' : 'text-[var(--text-primary)] hover:bg-[var(--bg-card)]'} ${!isCollapsed ? 'md:px-3 md:justify-start' : 'px-0'}`} title="History">
          <div className="flex items-center justify-center w-[20px] shrink-0 mx-auto md:mx-0"><Clock className="w-[20px] h-[20px]" /></div>
          <span className={`font-medium text-sm hidden md:inline truncate transition-all duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0 absolute' : 'opacity-100 ml-3 relative w-auto'}`}>History</span>
        </Link>
        
        <Link to="/saved" className={`w-full flex items-center justify-center py-[10px] rounded-[8px] transition-colors ${isActive('/saved') ? 'bg-indigo-50/50 dark:bg-slate-800/50 text-blue-600 shadow-sm' : 'text-[var(--text-primary)] hover:bg-[var(--bg-card)]'} ${!isCollapsed ? 'md:px-3 md:justify-start' : 'px-0'}`} title="Saved">
          <div className="flex items-center justify-center w-[20px] shrink-0 mx-auto md:mx-0"><Bookmark className="w-[20px] h-[20px]" /></div>
          <span className={`font-medium text-sm hidden md:inline truncate transition-all duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0 absolute' : 'opacity-100 ml-3 relative w-auto'}`}>Saved</span>
        </Link>

        <Link to="/projects" className={`w-full flex items-center justify-center py-[10px] rounded-[8px] transition-colors ${isActive('/projects') ? 'bg-indigo-50/50 dark:bg-slate-800/50 text-blue-600 shadow-sm' : 'text-[var(--text-primary)] hover:bg-[var(--bg-card)]'} ${!isCollapsed ? 'md:px-3 md:justify-start' : 'px-0'}`} title="Projects">
          <div className="flex items-center justify-center w-[20px] shrink-0 mx-auto md:mx-0"><Folder className="w-[20px] h-[20px]" /></div>
          <span className={`font-medium text-sm hidden md:inline truncate transition-all duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0 absolute' : 'opacity-100 ml-3 relative w-auto'}`}>Projects</span>
        </Link>

        {/* Notifications inline */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleBellClick}
            className={`w-full flex items-center justify-center py-[10px] rounded-[8px] transition-colors ${!isCollapsed ? 'md:px-3 md:justify-start' : 'px-0'} text-[var(--text-primary)] hover:bg-[var(--bg-card)]`}
            title="Notifications"
          >
            <div className="relative shrink-0 flex items-center justify-center w-[20px] mx-auto md:mx-0">
              <Bell className="w-[20px] h-[20px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[var(--bg-secondary)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`font-medium text-sm hidden md:inline flex-1 text-left truncate transition-all duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0 absolute' : 'opacity-100 ml-3 relative w-auto'}`}>Notifications</span>
          </button>


        </div>

        {/* Divider */}
        <div className="my-4 border-t border-[var(--border-color)] hidden md:block w-10/12 xl:w-full mx-auto" />

        {/* Recents */}
        <div className={`hidden md:flex flex-col mt-2 px-3 transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden py-0' : 'opacity-100'}`}>
          <span className="text-[11px] uppercase text-[var(--text-secondary)] tracking-wider font-semibold mb-2">
            Recents
          </span>
          <div className="space-y-0.5">
            {recentSearches.length === 0 ? (
               <div className="text-sm text-[var(--text-secondary)] py-1">No recent searches</div>
            ) : (
               recentSearches.map((item) => (
                 <Link 
                   key={item.id} 
                   to={`/search?query_id=${item.id}&query=${encodeURIComponent(item.query_text)}`}
                   className="flex items-center space-x-2 text-[var(--text-secondary)] hover:text-blue-600 py-1.5 px-2 rounded-md hover:bg-[var(--bg-card)] transition-colors group"
                 >
                   <Clock className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                   <span className="text-sm truncate" title={item.query_text}>
                     {truncateText(item.query_text, 30)}
                   </span>
                 </Link>
               ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="p-3 mt-auto shrink-0 flex flex-col gap-2 relative">
        <div className="border-t border-[var(--border-color)] mb-2 w-10/12 xl:w-full mx-auto" />

        {/* Profile Row */}
        <Link 
          to="/profile" 
          className="flex items-center space-x-0 md:space-x-3 px-0 md:px-2 py-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors justify-center md:justify-start group"
          title="Your Profile"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm shrink-0">
            {user?.username?.charAt(0) || 'U'}
          </div>
          <span className={`font-semibold text-sm text-[var(--text-primary)] hidden md:inline truncate group-hover:text-blue-600 transition-colors transition-opacity duration-300 ${isCollapsed ? 'opacity-0 absolute w-0' : 'opacity-100 ml-2 relative w-auto'}`}>
            {user?.username}
          </span>
        </Link>
      </div>

    </aside>

    {showDropdown && (
      <div 
        id="notification-dropdown-portal"
        style={{
          position: 'fixed',
          left: isCollapsed ? '60px' : '260px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'var(--bg-card, white)',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          zIndex: 99999,
          border: '1px solid var(--border-color, #e5e7eb)',
          padding: '0'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{fontWeight: 600, color: 'var(--text-primary)'}}>
            Notifications
          </span>
          <button onClick={handleMarkAllRead}
            style={{fontSize: '12px', color: '#6366f1',
              background: 'none', border: 'none',
              cursor: 'pointer'}}>
            Mark all as read
          </button>
        </div>
        
        {/* Notification list */}
        {notifications.length === 0 ? (
          <div style={{padding: '24px', 
            textAlign: 'center', color: '#6b7280'}}>
            You're all caught up!
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id}
              onClick={(e) => handleMarkAsRead(notif.id, notif.project_id, e)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                background: notif.is_read ? 
                  'transparent' : 
                  'rgba(99,102,241,0.05)',
                borderLeft: notif.is_read ? 
                  'none' : 
                  '3px solid #6366f1'
              }}
            >
              <p style={{margin: '0 0 4px', 
                fontSize: '14px',
                color: 'var(--text-primary)'}}>
                {notif.message}
              </p>
              <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '4px'}}>
                 <span style={{fontSize: '11px', color: '#6366f1', fontWeight: 500, maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                   {notif.project_name}
                 </span>
                 <span style={{fontSize: '11px', 
                   color: 'var(--text-secondary)'}}>
                   {getRelativeTime(notif.created_at)}
                 </span>
              </div>
            </div>
          ))
        )}
      </div>
    )}

    {/* Click outside to close fixed backdrop */}
    {showDropdown && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99998
        }}
        onClick={() => setShowDropdown(false)}
      />
    )}
  </>
  );
};

export default Sidebar;
