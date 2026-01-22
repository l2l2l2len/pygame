
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayerState, Chapter, ExecutionResult, Page } from './types.ts';
import { CHAPTERS, INITIAL_PLAYER_STATE, STORAGE_KEY, STATIC_CONTENT } from './constants.ts';
import { executePythonMock } from './services/pythonInterpreter.ts';
import { getMagicHint } from './services/aiService.ts';

const App: React.FC = () => {
  // State initialization with Persistence
  const [player, setPlayer] = useState<PlayerState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_PLAYER_STATE; }
    }
    return INITIAL_PLAYER_STATE;
  });

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

  // Persistence side-effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  }, [player]);

  const currentChapter = useMemo(() => {
    return CHAPTERS.find(c => c.id === player.currentChapterId) || CHAPTERS[0];
  }, [player.currentChapterId]);

  // Page Routing Effects
  useEffect(() => {
    if (currentPage === 'game') {
      setCurrentCode(currentChapter.starterCode);
      setExecution(null);
      setIsSuccess(false);
      setIsError(false);
      setAiHint(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  }, [player.currentChapterId, currentPage, currentChapter]);

  const handleRun = useCallback(() => {
    if (currentCode.includes('???')) return;
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage("");
    
    // Artificial delay to simulate "processing"
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
          setErrorMessage(result.error || "The terminal reported a syntax anomaly.");
        } else if (!isValid) {
          setErrorMessage("The ritual executed, but the output did not satisfy the task requirements.");
        }
      }
    }, 700);
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
    }
  };

  const selectToken = (token: string) => {
    setCurrentCode(prev => prev.replace('???', token));
    setShowTokenSelector(false);
  };

  const renderHome = () => (
    <div className="max-w-7xl mx-auto py-12 md:py-24 px-4 sm:px-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20 mb-20 md:mb-32">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-8 border border-blue-200 uppercase tracking-widest shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            Open Access Platform
          </div>
          <h1 className="text-4xl md:text-8xl font-bold mb-6 tracking-tight text-[#202124] leading-[1.1]">
            Code like a <span className="text-[#1a73e8]">master.</span>
          </h1>
          <p className="text-lg md:text-2xl text-[#5f6368] mb-12 leading-relaxed max-w-2xl">
            PyMancer is the world's most immersive way to master Python. A professional-grade ritual simulator for aspiring software sorcerers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button 
              onClick={() => setCurrentPage('game')}
              className="google-btn-primary h-14 px-10 text-lg shadow-lg"
            >
              {player.completedChapters.length > 0 ? 'Resume Journey' : 'Begin Free Quest'}
            </button>
            <button 
              onClick={() => setCurrentPage('docs')}
              className="google-btn-outline h-14 px-10 text-lg"
            >
              Learn the Laws
            </button>
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="relative group">
            <div className="w-56 h-56 md:w-96 md:h-96 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full flex items-center justify-center text-7xl md:text-[160px] shadow-2xl border-[12px] border-white transition-transform group-hover:scale-105 duration-500">
              🔮
            </div>
            <div className="absolute -bottom-6 -right-6 google-card p-6 md:p-8 rounded-3xl shadow-2xl animate-bounce">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl">🐍</div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">XP Progress</p>
                  <p className="text-2xl font-black">Lvl {player.level}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {[
          { title: 'Interactive Lexicon', icon: '⚡', desc: 'Engage with real Python syntax through a guided, mistake-proof token selection system.' },
          { title: 'Ritual Simulation', icon: '🧠', desc: 'Write code that actually runs. Our custom-built browser terminal validates your logic in real-time.' },
          { title: 'Arcane Wisdom', icon: '🧙‍♂️', desc: 'Powered by Gemini, Merlin provides context-aware hints that guide you without giving away the secret.' }
        ].map(card => (
          <div key={card.title} className="google-card p-10 hover:shadow-xl transform hover:-translate-y-1">
            <div className="text-5xl mb-8">{card.icon}</div>
            <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
            <p className="text-[#5f6368] text-lg leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 py-8 px-4 sm:px-6 min-h-[calc(100vh-64px)] animate-in slide-in-from-bottom-4 duration-500">
      {/* HUD Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <div className="google-card p-6 md:p-8 border-t-8 border-t-blue-500 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
             <div className="text-4xl bg-blue-50 p-4 rounded-3xl shadow-inner">{currentChapter.visual}</div>
             <div>
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Chapter {currentChapter.id}</h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  currentChapter.difficulty === 'Beginner' ? 'bg-green-50 text-green-700' :
                  currentChapter.difficulty === 'Intermediate' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {currentChapter.difficulty}
                </span>
             </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">{currentChapter.title}</h2>
          <p className="text-sm text-[#5f6368] mb-8 leading-relaxed italic border-l-4 border-blue-50 pl-4">
            "{currentChapter.story}"
          </p>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[11px] font-black uppercase text-gray-500 mb-2">
                <span>Health</span>
                <span>{player.hp}%</span>
              </div>
              <div className="progress-container"><div className="h-full progress-fill-red transition-all duration-700" style={{width: `${player.hp}%`}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-black uppercase text-gray-500 mb-2">
                <span>Mana</span>
                <span>{player.mana}%</span>
              </div>
              <div className="progress-container"><div className="h-full progress-fill-blue transition-all duration-700" style={{width: `${player.mana}%`}}></div></div>
            </div>
          </div>
        </div>

        <div className="google-card p-6 md:p-8 bg-[#f8f9fa] border-dashed">
          <h4 className="text-[10px] font-black uppercase text-blue-600 mb-4 tracking-[0.2em]">Current Objective</h4>
          <p className="text-sm text-gray-800 leading-relaxed font-medium">{currentChapter.task}</p>
        </div>
        
        <button 
          onClick={async () => {
            setIsLoading(true);
            const hint = await getMagicHint(currentChapter.title, currentCode, currentChapter.task);
            setAiHint(hint);
            setIsLoading(false);
          }}
          className="google-btn-outline w-full py-4 flex items-center justify-center gap-3 group text-sm font-bold"
        >
          <span className="text-xl">💡</span> Seek Merlin's Hint
        </button>
      </div>

      {/* Editor & Console Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="google-card overflow-hidden flex flex-col min-h-[400px] md:min-h-[500px] shadow-md">
          <div className="bg-[#f1f3f4] px-6 py-3.5 flex items-center justify-between border-b border-[#dadce0]">
            <div className="flex items-center gap-4">
               <span className="text-xs font-mono font-bold text-[#5f6368] flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> ritual_script.py
               </span>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
          </div>
          
          <div className="p-8 md:p-12 font-mono text-base md:text-xl leading-loose bg-white flex-grow selection:bg-blue-100 overflow-x-auto whitespace-pre">
            {currentCode.split('???').map((part, i, arr) => (
              <React.Fragment key={i}>
                <span className="text-[#3c4043]">{part}</span>
                {i < arr.length - 1 && (
                  <button 
                    onClick={() => setShowTokenSelector(true)}
                    className="token-selector-btn mx-2 ring-4 ring-blue-50"
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
                <span className="text-2xl">🧙‍♂️</span>
                <div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Wisdom from Merlin</p>
                  <p className="text-sm text-blue-900 leading-relaxed italic font-medium">"{aiHint}"</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 border-t border-[#dadce0] bg-gray-50 flex justify-end">
             <button 
               onClick={handleRun}
               disabled={currentCode.includes('???') || isLoading}
               className="google-btn-primary disabled:opacity-50 min-w-[180px] h-14"
             >
               {isLoading ? (
                 <div className="flex items-center gap-3">
                   <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                   <span>Executing...</span>
                 </div>
               ) : 'Execute Ritual'}
             </button>
          </div>
        </div>

        {/* Console */}
        <div className={`google-card p-0 overflow-hidden ${execution ? (execution.success ? 'ring-2 ring-green-100' : 'ring-2 ring-red-100') : ''}`}>
           <div className="bg-[#202124] text-white px-6 py-2.5 flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Terminal Output</div>
              {execution && <div className={`text-[10px] font-bold ${execution.success ? 'text-green-400' : 'text-red-400'}`}>{execution.success ? 'SUCCESS' : 'ERROR'}</div>}
           </div>
           <div className="p-8 bg-white font-mono text-sm min-h-[120px]">
              {!execution && <p className="text-gray-400 italic">>>> Spellweaver core active. Awaiting your command...</p>}
              {execution && (
                <>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
                    {execution.output && <div className="text-gray-800 whitespace-pre">{execution.output}</div>}
                    {execution.error && <div className="text-red-600 whitespace-pre-wrap">Traceback (most recent ritual last):<br/>{execution.error}</div>}
                    {!execution.output && !execution.error && <div className="text-gray-400 italic">No output received from the ether.</div>}
                  </div>
                </>
              )}
           </div>
        </div>
      </div>

      {/* Modals */}
      {showTokenSelector && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 modal-overlay backdrop-blur-sm">
          <div className="google-card w-full max-w-sm p-8 shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 rounded-3xl">
            <h3 className="text-xl font-bold mb-2">Identify Magic Token</h3>
            <p className="text-sm text-gray-500 mb-8">Choose the correct syntax to bridge the logic gap.</p>
            <div className="grid grid-cols-2 gap-4">
              {currentChapter.tokens.map(t => (
                <button 
                  key={t}
                  onClick={() => selectToken(t)}
                  className="google-btn-outline py-5 font-mono text-sm truncate rounded-2xl flex items-center justify-center"
                >
                  {t}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowTokenSelector(false)}
              className="w-full mt-8 text-sm font-bold text-gray-400 hover:text-gray-800 uppercase tracking-widest py-2"
            >
              Back to Script
            </button>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 modal-overlay">
          <div className="google-card w-full max-w-sm p-12 text-center shadow-2xl animate-in zoom-in-95 rounded-[3rem] border-t-8 border-t-green-500">
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">✅</div>
            <h2 className="text-3xl font-bold mb-4">Spell Successful</h2>
            <p className="text-[#5f6368] mb-12 leading-relaxed text-sm">You have mastered this logic pattern. Arcane energy flows through the terminal.</p>
            <button 
              onClick={handleNextChapter}
              className="google-btn-primary w-full py-5 text-sm uppercase tracking-widest rounded-2xl shadow-xl"
            >
              Continue Journey →
            </button>
          </div>
        </div>
      )}

      {isError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 modal-overlay">
          <div className="google-card w-full max-w-md p-10 text-center shadow-2xl animate-in zoom-in-95 rounded-[2.5rem] border-t-8 border-t-red-500">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">❌</div>
            <h2 className="text-2xl font-bold mb-4">Ritual Failed</h2>
            <div className="p-6 bg-red-50 text-red-800 text-sm rounded-2xl mb-8 font-mono border border-red-100 text-left overflow-x-auto max-h-40">
              {errorMessage || "The arcane outcome was not what we sought."}
            </div>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setIsError(false)}
                className="google-btn-primary bg-red-600 hover:bg-red-700 w-full py-5 text-sm uppercase tracking-widest rounded-2xl shadow-lg"
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
                Summon Guidance
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
      <div className="max-w-4xl mx-auto py-16 md:py-24 px-6 md:px-8 animate-in slide-in-from-bottom-8">
        <button 
          onClick={() => setCurrentPage('home')}
          className="text-[#1a73e8] hover:underline mb-12 flex items-center gap-3 text-sm font-bold uppercase tracking-widest"
        >
          ← Return Home
        </button>
        <h1 className="text-4xl md:text-6xl font-bold mb-12 text-[#202124] tracking-tight">{data.title}</h1>
        <div className="prose prose-lg prose-blue max-w-none text-[#5f6368] leading-relaxed space-y-10 text-xl font-normal whitespace-pre-wrap">
          {data.content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <header className="h-16 bg-white border-b border-[#dadce0] sticky top-0 z-[100] px-4 md:px-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 md:gap-12">
          <button onClick={() => setCurrentPage('home')} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#1a73e8] flex items-center justify-center text-white text-lg shadow-lg group-hover:scale-105 transition-transform">🔮</div>
            <span className="font-bold text-[#202124] text-xl md:text-2xl tracking-tight font-sans">PyMancer</span>
          </button>
          <nav className="hidden md:flex items-center gap-10">
            <button onClick={() => setCurrentPage('home')} className={`text-xs font-black uppercase tracking-[0.2em] ${currentPage === 'home' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Home</button>
            <button onClick={() => setCurrentPage('game')} className={`text-xs font-black uppercase tracking-[0.2em] ${currentPage === 'game' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Curriculum</button>
            <button onClick={() => setCurrentPage('docs')} className={`text-xs font-black uppercase tracking-[0.2em] ${currentPage === 'docs' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Library</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
           {currentPage === 'game' && (
             <div className="hidden sm:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
               <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]"></span> HP {player.hp}</span>
               <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]"></span> MP {player.mana}</span>
             </div>
           )}
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="md:hidden text-gray-500 p-2 hover:bg-gray-100 rounded-lg transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
             </svg>
           </button>
           <button className="hidden md:block google-btn-primary py-2.5 px-8 rounded-xl text-xs uppercase tracking-widest">Sign In</button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-[120] bg-white p-8 flex flex-col gap-10 animate-in slide-in-from-top-full duration-300">
          <button onClick={() => setCurrentPage('home')} className="text-left font-black text-2xl text-gray-800 uppercase tracking-widest">Home</button>
          <button onClick={() => setCurrentPage('game')} className="text-left font-black text-2xl text-gray-800 uppercase tracking-widest">Curriculum</button>
          <button onClick={() => setCurrentPage('docs')} className="text-left font-black text-2xl text-gray-800 uppercase tracking-widest">Master Guide</button>
          <button onClick={() => setCurrentPage('about')} className="text-left font-black text-2xl text-gray-800 uppercase tracking-widest">About</button>
          <button className="google-btn-primary w-full py-5 mt-auto text-lg uppercase tracking-widest">Sign In</button>
        </div>
      )}

      <main className="flex-grow">
        {currentPage === 'home' && renderHome()}
        {currentPage === 'game' && renderGame()}
        {['about', 'docs', 'contact', 'privacy', 'terms'].includes(currentPage) && renderStatic(currentPage)}
      </main>

      <footer className="bg-white border-t border-[#dadce0] py-16 md:py-24 px-8 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white text-[10px]">🔮</div>
                <span className="font-bold text-[#202124] text-2xl tracking-tighter">PyMancer</span>
              </div>
              <p className="text-lg text-[#5f6368] leading-relaxed max-w-sm">
                Open education for the digital age. We're turning learning into a quest that anyone can join, anywhere in the world.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 col-span-1 md:col-span-2">
              <div className="flex flex-col gap-6">
                <p className="text-xs font-black uppercase text-[#202124] tracking-[0.2em] mb-2">Curriculum</p>
                <button onClick={() => setCurrentPage('game')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] text-left transition-colors">Start Learning</button>
                <button onClick={() => setCurrentPage('docs')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] text-left transition-colors">Documentation</button>
              </div>
              <div className="flex flex-col gap-6">
                <p className="text-xs font-black uppercase text-[#202124] tracking-[0.2em] mb-2">Legal</p>
                <button onClick={() => setCurrentPage('privacy')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] text-left transition-colors">Privacy Policy</button>
                <button onClick={() => setCurrentPage('terms')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] text-left transition-colors">Terms of Use</button>
                <button onClick={() => setCurrentPage('contact')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] text-left transition-colors">Support</button>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-[#f1f3f4] flex flex-col md:flex-row justify-between items-center gap-10 text-[#5f6368] text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-8">
              <span>© 2025 PyMancer Initiative</span>
              <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-gray-200"></span>
              <span className="hidden sm:inline">Material Design 3</span>
            </div>
            <div className="flex gap-12">
              <button className="hover:text-blue-600 transition-colors">Github</button>
              <button className="hover:text-blue-600 transition-colors">Discord</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
