import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../lib/axios';

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await apiClient.get('/research/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this search history?')) return;
    try {
      await apiClient.delete(`/research/${id}`);
      setHistory(history.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete history', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Clock className="w-8 h-8 mr-3 text-indigo-600" />
          Research History
        </h1>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
          {history.length} Queries
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
          <Search className="mx-auto h-16 w-16 text-gray-300 mb-6" />
          <h3 className="text-xl font-bold text-gray-900">No history found</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">You haven't made any research queries yet. Start your first deep dive!</p>
          <Link to="/search" className="mt-8 inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            Start a Search
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.id}
              onClick={() => navigate(`/search?query_id=${item.id}&query=${encodeURIComponent(item.query_text)}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:border-indigo-200 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="mb-4 sm:mb-0">
                <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize group-hover:text-indigo-600 transition-colors">
                  {item.query_text}
                </h3>
                <p className="text-sm text-gray-500 flex items-center font-medium">
                  <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                  {new Date(item.created_at + (!item.created_at.endsWith('Z') ? 'Z' : '')).toLocaleString()}
                </p>
              </div>
              
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteHistory(item.id); }}
                  className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors flex items-center justify-center border border-transparent hover:border-red-100"
                  title="Delete History"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
