import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { BookOpen, Zap, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';

const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/search');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUsernameError('');
    setIsLoading(true);

    if (!isLogin) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        setUsernameError("Username must be 3-20 characters, letters, numbers and underscores only");
        setIsLoading(false);
        return;
      }
    }
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-transparent relative">
      <AnimatedBackground />
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
        >
          <BookOpen className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-2">
          Welcome to <span style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#4f46e5', fontSize: '36px' }}>FolioFlo</span>
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
          Your AI-powered assistant for academic research and project planning.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[var(--bg-glass)] backdrop-blur-md py-8 px-4 shadow-xl shadow-indigo-100/20 dark:shadow-none sm:rounded-2xl sm:px-10 border border-[var(--border-color)]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username (e.g. ansh_goyal)"
                    className={`appearance-none block w-full px-3 py-2.5 border ${usernameError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm transition-colors`}
                  />
                  {usernameError && <p className="mt-1 text-sm" style={{color: 'red'}}>{usernameError}</p>}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign in' : 'Register')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--bg-glass)] text-gray-500 flex items-center gap-1">
                  {isLogin ? <>New to <span style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#4f46e5', fontSize: '20px' }}>FolioFlo</span>?</> : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLogin ? 'Create an account' : 'Sign in to existing account'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-5xl mx-auto px-4 relative z-0">
        {[
          { icon: <BookOpen className="w-6 h-6 text-blue-500" />, title: "Deep Analysis", desc: "Aggregates papers from arXiv, Semantic Scholar, and CrossRef." },
          { icon: <Zap className="w-6 h-6 text-amber-500" />, title: "AI Summaries", desc: "LLaMA-powered insights from complex academic texts." },
          { icon: <Layers className="w-6 h-6 text-purple-500" />, title: "Actionable Plans", desc: "Generates custom step-by-step dev workflows and tech stacks." }
        ].map((feat, idx) => (
          <div key={idx} className="bg-white/60 backdrop-blur rounded-xl p-6 text-center border border-white">
            <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              {feat.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{feat.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
