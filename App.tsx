
import React, { useState, useEffect, useCallback } from 'react';
import { PlayerState, Chapter, ExecutionResult, Page } from './types';
import { CHAPTERS, INITIAL_PLAYER_STATE, STORAGE_KEY, STATIC_CONTENT } from './constants';
import { executePythonMock } from './services/pythonInterpreter';
import { getMagicHint } from './services/aiService';

const App: React.FC = () => {
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentCode, setCurrentCode] = useState<string>("");
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPlayer(JSON.parse(saved));
      } catch (e) { console.error("Restore failed", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  }, [player]);

  const currentChapter = CHAPTERS.find(c => c.id === player.currentChapterId) || CHAPTERS[0];

  useEffect(() => {
    if (currentPage === 'game') {
      setCurrentCode(currentChapter.starterCode);
      setExecution(null);
      setIsSuccess(false);
      setIsError(false);
      setAiHint(null);
    }
    window.scrollTo(0, 0);
  }, [player.currentChapterId, currentPage, currentChapter]);

  const handleRun = useCallback(() => {
    if (currentCode.includes('???')) return;
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage("");
    
    setTimeout(() => {
      const result = executePythonMock(currentCode);
      setExecution(result);
      setIsLoading(false);
      
      const isValid = currentChapter.validate(currentCode, result.output);
      
      if (result.success && isValid) {
        setIsSuccess(true);
      } else {
        setIsError(true);
        if (!result.success) {
          setErrorMessage(result.error || "Syntax error detected in the ritual.");
        } else if (!isValid) {
          setErrorMessage("The ritual completed but the logic didn't satisfy the Oracle's requirements.");
        }
      }
    }, 600);
  }, [currentCode, currentChapter]);

  const handleNextChapter = () => {
    const nextId = player.currentChapterId + 1;
    const isLast = !CHAPTERS.some(c => c.id === nextId);

    setPlayer(prev => {
      const reward = currentChapter.reward;
      let newXp = prev.xp + reward.xp;
      let newLevel = prev.level;
      while (newXp >= newLevel * 100) {
        newXp -= newLevel * 100;
        newLevel++;
      }
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        hp: Math.max(0, Math.min(prev.maxHp, prev.hp + (reward.hp || 0))),
        mana: Math.min(prev.maxMana, prev.mana + (reward.mana || 0)),
        inventory: reward.item ? Array.from(new Set([...prev.inventory, reward.item])) : prev.inventory,
        currentChapterId: isLast ? prev.currentChapterId : nextId,
        unlockedChapters: isLast ? prev.unlockedChapters : Array.from(new Set([...prev.unlockedChapters, nextId])),
        completedChapters: Array.from(new Set([...prev.completedChapters, currentChapter.id])),
      };
    });

    if (isLast) {
      setCurrentPage('home');
      alert("Quest Complete! You have unlocked all current modules.");
    }
  };

  const selectToken = (token: string) => {
    setCurrentCode(prev => prev.replace('???', token));
    setShowTokenSelector(false);
  };

  const renderHome = () => (
    <div className="max-w-7xl mx-auto py-20 px-6">
      <div className="flex flex-col md:flex-row items-center gap-16 mb-24">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-6 border border-blue-100 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New Content Available
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-[#202124] leading-tight">
            Learn Python through <span className="text-[#1a73e8]">adventure</span>
          </h1>
          <p className="text-xl text-[#5f6368] mb-12 leading-relaxed max-w-2xl">
            PyMancer combines a professional IDE experience with an epic RPG. Cast spells by writing real Python code. No accounts. No friction. Start learning now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button 
              onClick={() => setCurrentPage('game')}
              className="google-btn-primary h-14 px-10 flex items-center justify-center text-base"
            >
              {player.completedChapters.length > 0 ? 'Resume Quest' : 'Start Free Course'}
            </button>
            <button 
              onClick={() => setCurrentPage('docs')}
              className="google-btn-outline h-14 px-10 flex items-center justify-center text-base"
            >
              How it works
            </button>
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="relative">
            <div className="w-72 h-72 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center text-9xl shadow-2xl border-8 border-white animate-pulse">
              🔮
            </div>
            <div className="absolute -bottom-4 -right-4 google-card p-6 rounded-2xl animate-bounce">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">🐍</div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Current XP</p>
                  <p className="text-lg font-bold">Level {player.level}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-24">
        {[
          { title: 'Code Selection', icon: '📝', desc: 'Interactive token-based system helps beginners grasp syntax without typing errors.' },
          { title: 'Real Python Logic', icon: '🧠', desc: 'Underneath the magic lies genuine Python logic including loops, lists, and conditions.' },
          { title: 'AI-Powered Mentoring', icon: '🤖', desc: 'Get contextual hints from Merlin when you are stuck, powered by Gemini technology.' }
        ].map(card => (
          <div key={card.title} className="google-card p-10 hover:shadow-lg">
            <div className="text-4xl mb-6">{card.icon}</div>
            <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
            <p className="text-[#5f6368] leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 py-10 px-6 min-h-[calc(100vh-64px)]">
      {/* Module Overview & Stats */}
      <div className="w-full md:w-80 flex flex-col gap-6">
        <div className="google-card p-8 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-4 mb-6">
             <div className="text-4xl bg-blue-50 p-3 rounded-2xl">{currentChapter.visual}</div>
             <div>
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Chapter {currentChapter.id}</h3>
                <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded inline-block ${
                  currentChapter.difficulty === 'Beginner' ? 'bg-green-50 text-green-600' :
                  currentChapter.difficulty === 'Intermediate' ? 'bg-yellow-50 text-yellow-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  {currentChapter.difficulty}
                </div>
             </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">{currentChapter.title}</h2>
          <p className="text-sm text-[#5f6368] mb-8 leading-relaxed italic border-l-2 border-gray-100 pl-4">
            "{currentChapter.story}"
          </p>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold uppercase text-gray-500 mb-2">
                <span>Vitality</span>
                <span>{player.hp}%</span>
              </div>
              <div className="progress-container"><div className="h-full progress-fill-red transition-all duration-1000" style={{width: `${player.hp}%`}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold uppercase text-gray-500 mb-2">
                <span>Level {player.level}</span>
                <span>{player.xp}/100 XP</span>
              </div>
              <div className="progress-container"><div className="h-full progress-fill-blue transition-all duration-1000" style={{width: `${player.xp}%`}}></div></div>
            </div>
          </div>
        </div>

        <div className="google-card p-8 bg-gray-50">
          <h4 className="text-xs font-black uppercase text-blue-600 mb-4 tracking-[0.2em]">The Objective</h4>
          <p className="text-sm text-gray-700 leading-relaxed font-medium">{currentChapter.task}</p>
        </div>
        
        <button 
          onClick={async () => {
            setIsLoading(true);
            const hint = await getMagicHint(currentChapter.title, currentCode, currentChapter.task);
            setAiHint(hint);
            setIsLoading(false);
          }}
          disabled={isLoading}
          className="google-btn-outline w-full py-4 flex items-center justify-center gap-3 group"
        >
          <span className="group-hover:rotate-12 transition-transform">🪄</span> 
          <span>Seek Mentor Insight</span>
        </button>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="google-card overflow-hidden flex flex-col min-h-[450px] shadow-sm">
          <div className="bg-[#f1f3f4] px-6 py-3 flex items-center justify-between border-b border-[#dadce0]">
            <div className="flex items-center gap-4">
               <span className="text-xs font-mono font-bold text-[#5f6368] flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500"></span> spell_ritual.py
               </span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
          </div>
          <div className="p-10 font-mono text-lg leading-relaxed bg-white flex-grow selection:bg-blue-100 selection:text-blue-900">
            {currentCode.split('???').map((part, i, arr) => (
              <React.Fragment key={i}>
                <span className="text-[#3c4043]">{part}</span>
                {i < arr.length - 1 && (
                  <button 
                    onClick={() => setShowTokenSelector(true)}
                    className="token-selector-btn mx-2 ring-2 ring-blue-50 ring-offset-1"
                  >
                    ???
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          {aiHint && (
            <div className="p-6 bg-blue-50 border-t border-blue-100 animate-in slide-in-from-top-4">
              <div className="flex items-start gap-4">
                <div className="text-2xl mt-1">🧙‍♂️</div>
                <div>
                  <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Merlin's Insight</p>
                  <p className="text-sm text-blue-800 leading-relaxed italic">"{aiHint}"</p>
                </div>
              </div>
            </div>
          )}
          <div className="p-6 border-t border-[#dadce0] bg-gray-50 flex justify-end gap-4">
             <button 
               onClick={handleRun}
               disabled={currentCode.includes('???') || isLoading}
               className="google-btn-primary disabled:opacity-50 disabled:bg-gray-400 min-w-[160px] h-12"
             >
               {isLoading ? (
                 <div className="flex items-center gap-2">
                   <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                   <span>Running...</span>
                 </div>
               ) : 'Execute Code'}
             </button>
          </div>
        </div>

        {/* Terminal Console */}
        <div className={`google-card p-0 overflow-hidden ${execution ? (execution.success ? 'ring-2 ring-green-100' : 'ring-2 ring-red-100') : ''}`}>
           <div className="bg-[#202124] text-white px-6 py-2 flex items-center gap-3">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Terminal Console</div>
           </div>
           <div className="p-6 bg-white font-mono text-sm min-h-[100px]">
              {!execution && <p className="text-gray-400 italic">>>> Spellweaver core ready. Awaiting instructions...</p>}
              {execution && (
                <>
                  <p className={`font-bold mb-2 ${execution.success ? 'text-green-600' : 'text-red-600'}`}>
                    {execution.success ? '[SUCCESS] Code executed with status 0' : '[FAILURE] Critical syntax anomaly detected'}
                  </p>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    {execution.output && <div className="text-gray-800 whitespace-pre">{execution.output}</div>}
                    {execution.error && <div className="text-red-500 whitespace-pre">{execution.error}</div>}
                    {!execution.output && !execution.error && <div className="text-gray-400 italic">No standard output recorded.</div>}
                  </div>
                </>
              )}
           </div>
        </div>
      </div>

      {/* Selection UI */}
      {showTokenSelector && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 modal-overlay backdrop-blur-sm">
          <div className="google-card w-full max-w-sm p-10 shadow-2xl animate-in zoom-in-95 rounded-3xl">
            <h3 className="text-xl font-bold mb-2 text-[#202124]">Choose Token</h3>
            <p className="text-sm text-gray-500 mb-8 tracking-tight">Select the correct logic token to complete the routine.</p>
            <div className="grid grid-cols-2 gap-4">
              {currentChapter.tokens.map(t => (
                <button 
                  key={t}
                  onClick={() => selectToken(t)}
                  className="google-btn-outline py-5 font-mono text-sm truncate rounded-xl hover:border-blue-500 hover:text-blue-600"
                >
                  {t}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowTokenSelector(false)}
              className="w-full mt-8 text-sm font-bold text-gray-400 hover:text-gray-800 uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Outcome Modals */}
      {isSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 modal-overlay">
          <div className="google-card w-full max-w-sm p-12 text-center shadow-2xl animate-in zoom-in-95 rounded-[2.5rem] border-t-8 border-t-green-500">
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">✅</div>
            <h2 className="text-3xl font-bold mb-4">Module Complete</h2>
            <p className="text-[#5f6368] mb-10 leading-relaxed">You have successfully mastered this logic routine. The archive has been updated with your progress.</p>
            <button 
              onClick={handleNextChapter}
              className="google-btn-primary w-full py-5 text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-100"
            >
              Next Module →
            </button>
          </div>
        </div>
      )}

      {isError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 modal-overlay">
          <div className="google-card w-full max-w-md p-12 text-center shadow-2xl animate-in zoom-in-95 rounded-[2.5rem] border-t-8 border-t-red-500">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">❌</div>
            <h2 className="text-3xl font-bold mb-4">Logic Error</h2>
            <div className="p-5 bg-red-50 text-red-800 text-sm rounded-2xl mb-8 font-mono border border-red-100 text-left">
              {errorMessage || "The spell did not produce the expected outcome."}
            </div>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setIsError(false)}
                className="google-btn-primary bg-red-600 hover:bg-red-700 w-full py-5 text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-red-100"
              >
                Review Ritual
              </button>
              <button 
                onClick={async () => {
                  setIsError(false);
                  setIsLoading(true);
                  const hint = await getMagicHint(currentChapter.title, currentCode, currentChapter.task);
                  setAiHint(hint);
                  setIsLoading(false);
                }}
                className="google-btn-outline w-full py-5 text-sm uppercase tracking-widest rounded-2xl"
              >
                Request Help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <header className="h-16 bg-white border-b border-[#dadce0] sticky top-0 z-[100] px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-12">
          <button onClick={() => setCurrentPage('home')} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#1a73e8] flex items-center justify-center text-white text-lg shadow-lg group-hover:scale-105 transition-transform">🔮</div>
            <span className="font-bold text-[#202124] text-2xl tracking-tight font-sans">PyMancer</span>
          </button>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setCurrentPage('home')} className={`text-sm font-bold uppercase tracking-widest ${currentPage === 'home' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Home</button>
            <button onClick={() => setCurrentPage('game')} className={`text-sm font-bold uppercase tracking-widest ${currentPage === 'game' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Curriculum</button>
            <button onClick={() => setCurrentPage('docs')} className={`text-sm font-bold uppercase tracking-widest ${['docs','about','privacy','terms','contact'].includes(currentPage) ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Library</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
           <button className="hidden sm:block text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em]">Feedback</button>
           <button className="google-btn-primary py-2.5 px-6 rounded-lg text-xs">Sign In</button>
        </div>
      </header>

      <main className="flex-grow">
        {currentPage === 'home' && renderHome()}
        {currentPage === 'game' && renderGame()}
        {['about', 'docs', 'contact', 'privacy', 'terms'].includes(currentPage) && renderStatic(currentPage)}
      </main>

      <footer className="bg-white border-t border-[#dadce0] py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white text-[10px]">🔮</div>
                <span className="font-bold text-[#202124] text-xl">PyMancer Chronicles</span>
              </div>
              <p className="text-[#5f6368] leading-relaxed max-w-sm">
                Developing the next generation of engineers through immersive storytelling and professional tooling. Part of the open learning initiative.
              </p>
            </div>
            <div className="flex flex-col gap-5">
              <p className="text-xs font-black uppercase text-[#202124] tracking-[0.2em] mb-2">Modules</p>
              <button onClick={() => setCurrentPage('game')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">The Awakening</button>
              <button onClick={() => setCurrentPage('game')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">Data Alchemy</button>
              <button onClick={() => setCurrentPage('docs')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">Oracle Guide</button>
            </div>
            <div className="flex flex-col gap-5">
              <p className="text-xs font-black uppercase text-[#202124] tracking-[0.2em] mb-2">Platform</p>
              <button onClick={() => setCurrentPage('privacy')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">Privacy Seal</button>
              <button onClick={() => setCurrentPage('terms')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">User Oath</button>
              <button onClick={() => setCurrentPage('contact')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">Summon Support</button>
            </div>
          </div>
          <div className="pt-10 border-t border-[#f1f3f4] flex flex-col sm:flex-row justify-between items-center gap-8 text-[#5f6368] text-xs font-medium">
            <div className="flex items-center gap-6">
              <span>© 2025 PyMancer Education Initiative</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="hidden sm:inline">Material 3 Ready</span>
            </div>
            <div className="flex gap-10">
              <button className="hover:text-blue-600 transition-colors">Help Center</button>
              <button className="hover:text-blue-600 transition-colors">Open Source</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  function renderStatic(page: Page) {
    const data = (STATIC_CONTENT as any)[page] || { title: "Entry Missing", content: "The archives do not contain this scroll." };
    return (
      <div className="max-w-4xl mx-auto py-24 px-8">
        <button 
          onClick={() => setCurrentPage('home')}
          className="text-[#1a73e8] hover:underline mb-12 flex items-center gap-3 text-sm font-bold uppercase tracking-widest"
        >
          ← Back to Library
        </button>
        <h1 className="text-5xl font-bold mb-12 text-[#202124] tracking-tight">{data.title}</h1>
        <div className="prose prose-blue max-w-none text-[#5f6368] leading-relaxed space-y-10 text-xl font-normal">
          {data.content.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
        </div>
      </div>
    );
  }
};

export default App;
