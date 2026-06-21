import { Loader2, Zap, Search, Brain, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const defaultSteps = [
  { icon: <Search className="w-5 h-5" />, text: "Querying multiple academic databases..." },
  { icon: <FileText className="w-5 h-5" />, text: "Fetching full-text papers and abstracts..." },
  { icon: <Zap className="w-5 h-5" />, text: "Deduplicating and prioritizing results..." },
  { icon: <Brain className="w-5 h-5" />, text: "Generating AI summaries and project artifacts..." }
];

const LoadingState = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < defaultSteps.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-16 flex flex-col items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="mb-8"
      >
        <Loader2 className="w-12 h-12 text-indigo-600" />
      </motion.div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-8">Analyzing Research Space</h3>
      
      <div className="w-full space-y-4">
        {defaultSteps.map((step, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: index <= currentStep ? 1 : 0.4,
              x: 0,
              scale: index === currentStep ? 1.02 : 1
            }}
            className={`flex items-center p-4 rounded-xl border ${
              index === currentStep 
                ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                : index < currentStep 
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-transparent border-dashed border-gray-200'
            }`}
          >
            <div className={`mr-4 ${
              index === currentStep ? 'text-indigo-600' : index < currentStep ? 'text-emerald-500' : 'text-gray-400'
            }`}>
              {step.icon}
            </div>
            <span className={`font-medium text-sm ${
              index === currentStep ? 'text-indigo-900' : index < currentStep ? 'text-gray-700' : 'text-gray-400'
            }`}>
              {step.text}
            </span>
            {index < currentStep && (
              <span className="ml-auto text-emerald-500 text-xs font-bold uppercase tracking-wider">Done</span>
            )}
            {index === currentStep && (
              <motion.span 
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="ml-auto text-indigo-600 text-xs font-bold uppercase tracking-wider"
              >
                Processing
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
