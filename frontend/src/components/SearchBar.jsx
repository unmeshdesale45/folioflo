import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SearchBar = ({ onSearch, isLoading, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto relative group" 
      onSubmit={handleSubmit}
    >
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a core research topic..."
          className="block w-full pl-14 pr-36 py-4 border-2 border-gray-100 rounded-2xl leading-6 bg-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 sm:text-lg transition-all shadow-sm hover:shadow-md"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Analyze'}
        </button>
      </div>
    </motion.form>
  );
};

export default SearchBar;
