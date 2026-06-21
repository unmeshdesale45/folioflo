import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../lib/axios';
import PaperCard from '../components/PaperCard';

const Saved = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const response = await apiClient.get('/saved/');
      setSaved(response.data);
    } catch (error) {
      console.error('Failed to fetch saved', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSaved = async (id) => {
    try {
      await apiClient.delete(`/saved/${id}`);
      setSaved(prev => prev.filter(item => item.id !== id));
      setToastMessage('Removed from saved');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (error) {
      console.error('Failed to delete saved', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Bookmark className="w-8 h-8 mr-3 text-indigo-600" />
          Saved Results
        </h1>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
          {saved.length} Items
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
          <Bookmark className="mx-auto h-16 w-16 text-gray-300 mb-6" />
          <h3 className="text-xl font-bold text-gray-900">No saved items</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">You haven't saved any research queries or papers yet. They will appear here.</p>
          <Link to="/search" className="mt-8 inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            Start a Search
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map((item, index) => (
            <div
              key={item.id}
              onClick={() => navigate(`/search?query_id=${item.query_id}`)}
              className="cursor-pointer h-full relative"
            >
              <PaperCard 
                paper={item.paper} 
                index={index} 
                queryId={item.query_id} 
                isSaved={true} 
                savedAtDisplay={`Saved on ${new Date(item.saved_at + (!item.saved_at.endsWith('Z') ? 'Z' : '')).toLocaleString()}`}
                onToggleSave={() => deleteSaved(item.id)} 
              />
            </div>
          ))}
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg font-medium flex items-center z-50">
          <Bookmark className="w-5 h-5 mr-2 fill-white text-white" />
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Saved;
