
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
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
    <div className="max-w-7xl mx-auto py-10 md:py-20 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 mb-16 md:mb-24">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] md:text-xs font-bold mb-4 md:mb-6 border border-blue-100 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New Content Available
          </div>
          <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight text-[#202124] leading-tight">
            Learn Python through <span className="text-[#1a73e8]">adventure</span>
          </h1>
          <p className="text-lg md:text-xl text-[#5f6368] mb-8 md:mb-12 leading-relaxed max-w-2xl">
            PyMancer combines a professional IDE experience with an epic RPG. Cast spells by writing real Python code. No accounts. Start learning now.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start">
            <button 
              onClick={() => setCurrentPage('game')}
              className="google-btn-primary h-12 md:h-14 px-6 md:px-10 flex items-center justify-center text-sm md:text-base"
            >
              {player.completedChapters.length > 0 ? 'Resume Quest' : 'Start Free Course'}
            </button>
            <button 
              onClick={() => setCurrentPage('docs')}
              className="google-btn-outline h-12 md:h-14 px-6 md:px-10 flex items-center justify-center text-sm md:text-base"
            >
              How it works
            </button>
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center order-first md:order-last">
          <div className="relative">
            <div className="w-48 h-48 md:w-72 md:h-72 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center text-6xl md:text-9xl shadow-2xl border-8 border-white animate-pulse">
              🔮
            </div>
            <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 google-card p-3 md:p-6 rounded-xl md:rounded-2xl animate-bounce">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm md:text-base">🐍</div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">XP</p>
                  <p className="text-sm md:text-lg font-bold">Lvl {player.level}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mb-16 md:mb-24">
        {[
          { title: 'Code Selection', icon: '📝', desc: 'Interactive token-based system helps beginners grasp syntax without typing errors.' },
          { title: 'Real Python Logic', icon: '🧠', desc: 'Underneath the magic lies genuine Python logic including loops, lists, and conditions.' },
          { title: 'AI-Powered Mentoring', icon: '🤖', desc: 'Get contextual hints from Merlin when you are stuck, powered by Gemini technology.' }
        ].map(card => (
          <div key={card.title} className="google-card p-6 md:p-10 hover:shadow-lg">
            <div className="text-3xl md:text-4xl mb-4 md:mb-6">{card.icon}</div>
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{card.title}</h3>
            <p className="text-[#5f6368] text-sm md:text-base leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-10 py-6 md:py-10 px-4 sm:px-6 min-h-[calc(100vh-64px)]">
      {/* Module Overview & Stats */}
      <div className="w-full md:w-80 flex flex-col gap-4 md:gap-6">
        <div className="google-card p-5 md:p-8 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-4 mb-4 md:mb-6">
             <div className="text-3xl md:text-4xl bg-blue-50 p-2 md:p-3 rounded-xl md:rounded-2xl">{currentChapter.visual}</div>
             <div>
                <h3 className="font-bold text-gray-400 text-[10px] md:text-xs uppercase tracking-widest">Chapter {currentChapter.id}</h3>
                <div className={`text-[8px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded inline-block ${
                  currentChapter.difficulty === 'Beginner' ? 'bg-green-50 text-green-600' :
                  currentChapter.difficulty === 'Intermediate' ? 'bg-yellow-50 text-yellow-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  {currentChapter.difficulty}
                </div>
             </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">{currentChapter.title}</h2>
          <p className="text-xs md:text-sm text-[#5f6368] mb-6 md:mb-8 leading-relaxed italic border-l-2 border-gray-100 pl-4">
            "{currentChapter.story}"
          </p>
          
          <div className="space-y-4 md:space-y-6">
            <div>
              <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase text-gray-500 mb-1.5 md:mb-2">
                <span>Vitality</span>
                <span>{player.hp}%</span>
              </div>
              <div className="progress-container"><div className="h-full progress-fill-red transition-all duration-1000" style={{width: `${player.hp}%`}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase text-gray-500 mb-1.5 md:mb-2">
                <span>Level {player.level}</span>
                <span>{player.xp}%</span>
              </div>
              <div className="progress-container"><div className="h-full progress-fill-blue transition-all duration-1000" style={{width: `${player.xp}%`}}></div></div>
            </div>
          </div>
        </div>

        <div className="google-card p-5 md:p-8 bg-gray-50">
          <h4 className="text-[10px] md:text-xs font-black uppercase text-blue-600 mb-2 md:mb-4 tracking-[0.2em]">Objective</h4>
          <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-medium">{currentChapter.task}</p>
        </div>
        
        <button 
          onClick={async () => {
            setIsLoading(true);
            const hint = await getMagicHint(currentChapter.title, currentCode, currentChapter.task);
            setAiHint(hint);
            setIsLoading(false);
          }}
          disabled={isLoading}
          className="google-btn-outline w-full py-3 md:py-4 flex items-center justify-center gap-2 md:gap-3 group text-xs md:text-sm"
        >
          <span className="group-hover:rotate-12 transition-transform">🪄</span> 
          <span>Seek Hint</span>
        </button>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6">
        <div className="google-card overflow-hidden flex flex-col min-h-[350px] md:min-h-[450px] shadow-sm">
          <div className="bg-[#f1f3f4] px-4 md:px-6 py-2 md:py-3 flex items-center justify-between border-b border-[#dadce0]">
            <div className="flex items-center gap-2 md:gap-4">
               <span className="text-[10px] md:text-xs font-mono font-bold text-[#5f6368] flex items-center gap-1.5 md:gap-2">
                 <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500"></span> ritual.py
               </span>
            </div>
            <div className="flex gap-1 md:gap-1.5">
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-300"></div>
            </div>
          </div>
          <div className="p-5 md:p-10 font-mono text-sm md:text-lg leading-relaxed bg-white flex-grow selection:bg-blue-100 selection:text-blue-900 overflow-x-auto whitespace-pre">
            {currentCode.split('???').map((part, i, arr) => (
              <React.Fragment key={i}>
                <span className="text-[#3c4043]">{part}</span>
                {i < arr.length - 1 && (
                  <button 
                    onClick={() => setShowTokenSelector(true)}
                    className="token-selector-btn mx-1 md:mx-2 ring-1 md:ring-2 ring-blue-50 ring-offset-1 text-xs md:text-base"
                  >
                    ???
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          {aiHint && (
            <div className="p-4 md:p-6 bg-blue-50 border-t border-blue-100 animate-in slide-in-from-top-4">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-xl md:text-2xl mt-1">🧙‍♂️</div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Merlin's Insight</p>
                  <p className="text-xs md:text-sm text-blue-800 leading-relaxed italic">"{aiHint}"</p>
                </div>
              </div>
            </div>
          )}
          <div className="p-4 md:p-6 border-t border-[#dadce0] bg-gray-50 flex justify-end gap-3 md:gap-4">
             <button 
               onClick={handleRun}
               disabled={currentCode.includes('???') || isLoading}
               className="google-btn-primary disabled:opacity-50 disabled:bg-gray-400 min-w-[120px] md:min-w-[160px] h-10 md:h-12 text-xs md:text-sm"
             >
               {isLoading ? (
                 <div className="flex items-center justify-center gap-2">
                   <div className="animate-spin h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                   <span>Running...</span>
                 </div>
               ) : 'Execute Ritual'}
             </button>
          </div>
        </div>

        {/* Terminal Console */}
        <div className={`google-card p-0 overflow-hidden ${execution ? (execution.success ? 'ring-2 ring-green-100' : 'ring-2 ring-red-100') : ''}`}>
           <div className="bg-[#202124] text-white px-4 md:px-6 py-2 flex items-center gap-3">
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Arcane Console</div>
           </div>
           <div className="p-4 md:p-6 bg-white font-mono text-xs md:text-sm min-h-[80px] md:min-h-[100px]">
              {!execution && <p className="text-gray-400 italic">>>> Spellweaver core ready. Awaiting ritual...</p>}
              {execution && (
                <>
                  <p className={`font-bold mb-2 ${execution.success ? 'text-green-600' : 'text-red-600'}`}>
                    {execution.success ? '[SUCCESS] Ritual materialized' : '[FAILURE] Anomaly detected'}
                  </p>
                  <div className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-100">
                    {execution.output && <div className="text-gray-800 whitespace-pre">{execution.output}</div>}
                    {execution.error && <div className="text-red-500 whitespace-pre">{execution.error}</div>}
                    {!execution.output && !execution.error && <div className="text-gray-400 italic">No arcane echoes.</div>}
                  </div>
                </>
              )}
           </div>
        </div>
      </div>

      {/* Selection UI */}
      {showTokenSelector && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-4 md:p-6 modal-overlay backdrop-blur-sm">
          <div className="google-card w-full max-w-sm p-6 md:p-10 shadow-2xl animate-in slide-in-from-bottom-full md:zoom-in-95 rounded-t-3xl md:rounded-3xl">
            <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2 text-[#202124]">Choose Token</h3>
            <p className="text-xs md:text-sm text-gray-500 mb-6 md:mb-8 tracking-tight">Select the logic required for this routine.</p>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {currentChapter.tokens.map(t => (
                <button 
                  key={t}
                  onClick={() => selectToken(t)}
                  className="google-btn-outline py-4 md:py-5 font-mono text-xs md:text-sm truncate rounded-xl hover:border-blue-500 hover:text-blue-600 flex items-center justify-center"
                >
                  {t}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowTokenSelector(false)}
              className="w-full mt-6 md:mt-8 text-xs md:text-sm font-bold text-gray-400 hover:text-gray-800 uppercase tracking-widest transition-colors py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Outcome Modals */}
      {isSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay">
          <div className="google-card w-full max-w-sm p-8 md:p-12 text-center shadow-2xl animate-in zoom-in-95 rounded-[2rem] md:rounded-[2.5rem] border-t-8 border-t-green-500">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl md:text-5xl mx-auto mb-6 md:mb-8 shadow-inner">✅</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-[#202124]">Success</h2>
            <p className="text-xs md:text-sm text-[#5f6368] mb-8 md:mb-10 leading-relaxed">Module mastered. The archives have been updated.</p>
            <button 
              onClick={handleNextChapter}
              className="google-btn-primary w-full py-4 md:py-5 text-xs md:text-sm uppercase tracking-widest rounded-xl md:rounded-2xl shadow-lg shadow-blue-100"
            >
              Next Module →
            </button>
          </div>
        </div>
      )}

      {isError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay">
          <div className="google-card w-full max-w-md p-8 md:p-12 text-center shadow-2xl animate-in zoom-in-95 rounded-[2rem] md:rounded-[2.5rem] border-t-8 border-t-red-500">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl md:text-5xl mx-auto mb-6 md:mb-8 shadow-inner">❌</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-[#202124]">Ritual Error</h2>
            <div className="p-4 md:p-5 bg-red-50 text-red-800 text-xs md:text-sm rounded-xl md:rounded-2xl mb-6 md:mb-8 font-mono border border-red-100 text-left overflow-x-auto">
              {errorMessage || "The spell produced an unexpected outcome."}
            </div>
            <div className="flex flex-col gap-3 md:gap-4">
              <button 
                onClick={() => setIsError(false)}
                className="google-btn-primary bg-red-600 hover:bg-red-700 w-full py-4 md:py-5 text-xs md:text-sm uppercase tracking-widest rounded-xl md:rounded-2xl"
              >
                Review Code
              </button>
              <button 
                onClick={async () => {
                  setIsError(false);
                  setIsLoading(true);
                  const hint = await getMagicHint(currentChapter.title, currentCode, currentChapter.task);
                  setAiHint(hint);
                  setIsLoading(false);
                }}
                className="google-btn-outline w-full py-4 md:py-5 text-xs md:text-sm uppercase tracking-widest rounded-xl md:rounded-2xl"
              >
                Request Help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderStatic(page: Page) {
    const data = (STATIC_CONTENT as any)[page] || { title: "Entry Missing", content: "The archives do not contain this scroll." };
    return (
      <div className="max-w-4xl mx-auto py-10 md:py-24 px-6 md:px-8">
        <button 
          onClick={() => setCurrentPage('home')}
          className="text-[#1a73e8] hover:underline mb-8 md:mb-12 flex items-center gap-2 md:gap-3 text-xs md:text-sm font-bold uppercase tracking-widest"
        >
          ← Return Home
        </button>
        <h1 className="text-3xl md:text-5xl font-bold mb-8 md:mb-12 text-[#202124] tracking-tight">{data.title}</h1>
        <div className="prose prose-blue max-w-none text-[#5f6368] leading-relaxed space-y-6 md:space-y-10 text-base md:text-xl font-normal">
          {data.content.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <header className="h-16 bg-white border-b border-[#dadce0] sticky top-0 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 md:gap-12">
          <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2 md:gap-3 group">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white text-base md:text-lg shadow-lg group-hover:scale-105 transition-transform">🔮</div>
            <span className="font-bold text-[#202124] text-xl md:text-2xl tracking-tight font-sans">PyMancer</span>
          </button>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setCurrentPage('home')} className={`text-xs font-bold uppercase tracking-widest ${currentPage === 'home' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Home</button>
            <button onClick={() => setCurrentPage('game')} className={`text-xs font-bold uppercase tracking-widest ${currentPage === 'game' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Learn</button>
            <button onClick={() => setCurrentPage('docs')} className={`text-xs font-bold uppercase tracking-widest ${['docs','about','privacy','terms','contact'].includes(currentPage) ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Library</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
           {currentPage === 'game' && (
             <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold text-gray-400">
               <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ea4335]"></span> {player.hp} HP</span>
               <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1a73e8]"></span> {player.mana} MP</span>
             </div>
           )}
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="md:hidden text-gray-500 p-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
             </svg>
           </button>
           <button className="hidden md:block google-btn-primary py-2.5 px-6 rounded-lg text-xs">Sign In</button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-[90] bg-white p-6 flex flex-col gap-6 animate-in slide-in-from-top-full">
          <button onClick={() => setCurrentPage('home')} className="text-left font-bold text-gray-700 py-2 border-b">Home</button>
          <button onClick={() => setCurrentPage('game')} className="text-left font-bold text-gray-700 py-2 border-b">Curriculum</button>
          <button onClick={() => setCurrentPage('docs')} className="text-left font-bold text-gray-700 py-2 border-b">Master Guide</button>
          <button onClick={() => setCurrentPage('about')} className="text-left font-bold text-gray-700 py-2 border-b">About</button>
          <button className="google-btn-primary w-full py-4 mt-auto">Sign In</button>
        </div>
      )}

      <main className="flex-grow">
        {currentPage === 'home' && renderHome()}
        {currentPage === 'game' && renderGame()}
        {['about', 'docs', 'contact', 'privacy', 'terms'].includes(currentPage) && renderStatic(currentPage)}
      </main>

      <footer className="bg-white border-t border-[#dadce0] py-10 md:py-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16 mb-12 md:mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white text-[10px]">🔮</div>
                <span className="font-bold text-[#202124] text-lg md:text-xl">PyMancer Chronicles</span>
              </div>
              <p className="text-sm md:text-base text-[#5f6368] leading-relaxed max-w-sm">
                Developing the next generation of engineers through immersive storytelling and professional tooling.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 col-span-1 md:col-span-2">
              <div className="flex flex-col gap-3 md:gap-5">
                <p className="text-[10px] font-black uppercase text-[#202124] tracking-[0.2em] mb-1">Learning</p>
                <button onClick={() => setCurrentPage('game')} className="text-xs md:text-sm text-[#5f6368] hover:text-[#1a73e8] text-left transition-colors">Curriculum</button>
                <button onClick={() => setCurrentPage('docs')} className="text-xs md:text-sm text-[#5f6368] hover:text-[#1a73e8] text-left transition-colors">Master Guide</button>
              </div>
              <div className="flex flex-col gap-3 md:gap-5">
                <p className="text-[10px] font-black uppercase text-[#202124] tracking-[0.2em] mb-1">Support</p>
                <button onClick={() => setCurrentPage('contact')} className="text-xs md:text-sm text-[#5f6368] hover:text-[#1a73e8] text-left transition-colors">Contact</button>
                <button onClick={() => setCurrentPage('privacy')} className="text-xs md:text-sm text-[#5f6368] hover:text-[#1a73e8] text-left transition-colors">Privacy</button>
              </div>
            </div>
          </div>
          <div className="pt-8 md:pt-10 border-t border-[#f1f3f4] flex flex-col sm:flex-row justify-between items-center gap-6 md:gap-8 text-[#5f6368] text-[10px] md:text-xs font-medium">
            <div className="flex items-center gap-4 md:gap-6">
              <span>© 2025 PyMancer Education</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="hidden sm:inline">Material 3 Ready</span>
            </div>
            <div className="flex gap-6 md:gap-10">
              <button className="hover:text-blue-600 transition-colors">Help</button>
              <button className="hover:text-blue-600 transition-colors">Open Source</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
