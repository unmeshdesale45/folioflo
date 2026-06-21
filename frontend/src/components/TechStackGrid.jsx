import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Database, Code2, Cpu, Wrench, Globe, X, CheckCircle2, XCircle } from 'lucide-react';
import apiClient from '../lib/axios';

const categoryIcons = {
  "languages": <Code2 className="w-5 h-5 text-indigo-500" />,
  "frameworks": <Globe className="w-5 h-5 text-pink-500" />,
  "libraries": <Layers className="w-5 h-5 text-orange-500" />,
  "datasets": <Database className="w-5 h-5 text-blue-500" />,
  "tools": <Wrench className="w-5 h-5 text-gray-500" />
};

const getDefaultIcon = () => <Code2 className="w-5 h-5 text-indigo-500" />;

const TechStackGrid = ({ techStack, topic }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itemDetails, setItemDetails] = useState(null);

  if (!techStack || Object.keys(techStack).length === 0) return null;

  const topRowKeys = ['languages', 'frameworks', 'libraries'];
  const bottomRowKeys = ['datasets', 'tools'];

  const handleItemClick = async (item, category) => {
    const itemName = typeof item === 'string' ? item : item.name;
    setSelectedItem({ name: itemName, category });
    setIsLoading(true);
    setItemDetails(null);

    console.log("topic value:", topic);
    const finalTopic = topic;

    try {
      const res = await apiClient.post('/ai/techstack-detail/', {
        item: itemName,
        item_type: category,
        topic: finalTopic
      });
      setItemDetails(res.data);
    } catch (err) {
      console.error(err);
      setItemDetails({ error: "Failed to load detailed insights. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCard = (category, index) => {
    const details = techStack[category];
    if (!details || details.length === 0) return null;
    
    return (
      <motion.div 
        key={category}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-indigo-200 transition-colors group flex-1 min-w-[140px] flex flex-col"
      >
        <div className="flex items-center mb-3">
          <div className="p-2 bg-white rounded-lg shadow-sm mr-2 shrink-0">
            {categoryIcons[category.toLowerCase()] || getDefaultIcon()}
          </div>
          <h3 className="font-bold text-gray-900 capitalize text-base overflow-visible whitespace-nowrap">
            {category.toLowerCase() === 'datasets' ? 'Dataset Sources' : category.replace('_', ' ')}
          </h3>
        </div>
        
        <div className="space-y-3 mt-auto">
          {details.map((item, i) => {
            const itemName = typeof item === 'string' ? item : item.name;
            const itemReason = typeof item === 'string' ? null : item.reason;
            return (
              <div 
                key={i} 
                onClick={() => handleItemClick(item, category)}
                className="bg-white rounded-lg p-3 border border-gray-200/60 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all break-words overflow-hidden cursor-pointer"
              >
                <p className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-indigo-700 transition-colors">{itemName}</p>
                {itemReason && (
                  <p className="text-xs text-gray-500 leading-relaxed">{itemReason}</p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col relative z-0">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Layers className="w-6 h-6 mr-2 text-indigo-600" />
            Recommended Tech Stack
          </h2>
        </div>
        
        <div className="p-6 flex-1 flex flex-col gap-6 overflow-x-auto justify-center">
          <div className="flex flex-row gap-4 w-full">
            {topRowKeys.map((k, i) => renderCard(k, i))}
          </div>
          <div className="flex flex-row gap-4 w-full">
            {bottomRowKeys.map((k, i) => renderCard(k, i + 3))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/30 shrink-0">
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {categoryIcons[selectedItem.category.toLowerCase()] || getDefaultIcon()}
                  </div>
                  {selectedItem.name}
                </h2>
                <button 
                  onClick={() => setSelectedItem(null)} 
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {isLoading ? (
                  <div className="space-y-6 animate-pulse">
                    <div className="h-20 bg-gray-100 rounded-xl w-full"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="h-6 bg-gray-100 rounded-md w-1/3"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-6 bg-gray-100 rounded-md w-1/3"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                      </div>
                    </div>
                    <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
                  </div>
                ) : itemDetails?.error ? (
                  <div className="text-center text-red-500 py-12 font-medium bg-red-50 rounded-xl border border-red-100">
                    {itemDetails.error}
                  </div>
                ) : itemDetails ? (
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What it is</h3>
                      <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">{itemDetails.explanation}</p>
                    </section>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <section className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
                        <h3 className="text-sm font-bold text-emerald-700 flex items-center mb-3">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Pros
                        </h3>
                        <ul className="space-y-2.5">
                          {itemDetails.pros?.map((pro, i) => (
                            <li key={i} className="text-sm text-emerald-900/80 flex items-start leading-snug">
                              <span className="text-emerald-500 mr-2 shrink-0 mt-0.5">•</span>{pro}
                            </li>
                          ))}
                        </ul>
                      </section>
                      
                      <section className="bg-red-50/50 p-4 rounded-xl border border-red-100/50 hover:bg-red-50 transition-colors">
                        <h3 className="text-sm font-bold text-red-700 flex items-center mb-3">
                          <XCircle className="w-4 h-4 mr-1.5" /> Cons & Limitations
                        </h3>
                        <ul className="space-y-2.5">
                          {itemDetails.cons?.map((con, i) => (
                            <li key={i} className="text-sm text-red-900/80 flex items-start leading-snug">
                              <span className="text-red-500 mr-2 shrink-0 mt-0.5">•</span>{con}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                    
                    <section>
                      <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Used in Previous Research</h3>
                      <p className="text-gray-700 leading-relaxed text-sm">{itemDetails.used_in_research}</p>
                    </section>
                    
                    <section>
                      <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Best For</h3>
                      <p className="text-gray-700 leading-relaxed text-sm bg-indigo-50/30 p-3 rounded-lg border border-indigo-50">{itemDetails.best_for}</p>
                    </section>

                    <section>
                      <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Alternatives to Consider</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {itemDetails.alternatives?.map((alt, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors bg-white shadow-sm hover:shadow group">
                            <div className="font-bold text-gray-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">{alt.name}</div>
                            <div className="text-xs text-gray-500 leading-relaxed">{alt.description}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TechStackGrid;
