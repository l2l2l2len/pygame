
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
      setAiHint(null);
    }
    window.scrollTo(0, 0);
  }, [player.currentChapterId, currentPage, currentChapter]);

  const handleRun = useCallback(() => {
    if (currentCode.includes('???')) return;
    setIsLoading(true);
    setTimeout(() => {
      const result = executePythonMock(currentCode);
      setExecution(result);
      setIsLoading(false);
      if (result.success && currentChapter.validate(currentCode, result.output)) {
        setIsSuccess(true);
      }
    }, 500);
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
        hp: Math.min(prev.maxHp, prev.hp + (reward.hp || 0)),
        mana: Math.min(prev.maxMana, prev.mana + (reward.mana || 0)),
        inventory: reward.item ? Array.from(new Set([...prev.inventory, reward.item])) : prev.inventory,
        currentChapterId: isLast ? prev.currentChapterId : nextId,
        unlockedChapters: isLast ? prev.unlockedChapters : Array.from(new Set([...prev.unlockedChapters, nextId])),
        completedChapters: Array.from(new Set([...prev.completedChapters, currentChapter.id])),
      };
    });

    if (isLast) {
      setCurrentPage('home');
      alert("Congratulations! You've mastered all current modules in Pythonia.");
    }
  };

  const selectToken = (token: string) => {
    setCurrentCode(prev => prev.replace('???', token));
    setShowTokenSelector(false);
  };

  const renderHome = () => (
    <div className="max-w-7xl mx-auto py-16 px-6">
      <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-[#202124]">
            Master Python with <span className="text-[#1a73e8]">PyMancer</span>
          </h1>
          <p className="text-xl text-[#5f6368] mb-10 leading-relaxed max-w-xl">
            A professional, interactive learning platform that turns coding syntax into a magical RPG experience. 
            Free, open, and persistent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button 
              onClick={() => setCurrentPage('game')}
              className="google-btn-primary h-12 flex items-center justify-center min-w-[180px]"
            >
              {player.completedChapters.length > 0 ? 'Resume Course' : 'Get Started'}
            </button>
            <button 
              onClick={() => setCurrentPage('about')}
              className="google-btn-outline h-12 flex items-center justify-center min-w-[180px]"
            >
              Platform Overview
            </button>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-64 h-64 bg-[#e8f0fe] rounded-full flex items-center justify-center text-8xl shadow-inner border-4 border-white">
            🔮
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {[
          { title: 'Interactive Syntax', icon: '⚡', desc: 'Engage with real Python patterns through our guided token system.' },
          { title: 'Progressive Difficulty', icon: '📈', desc: 'From basic variables to complex loops and logic structures.' },
          { title: 'Local Persistence', icon: '💾', desc: 'Your progress is automatically saved. No login or accounts required.' }
        ].map(card => (
          <div key={card.title} className="google-card p-8">
            <div className="text-3xl mb-4">{card.icon}</div>
            <h3 className="text-xl font-bold mb-2">{card.title}</h3>
            <p className="text-[#5f6368] text-sm leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-[#dadce0] pt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Available Learning Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHAPTERS.map(ch => (
            <div 
              key={ch.id} 
              onClick={() => player.unlockedChapters.includes(ch.id) && (setPlayer(p => ({...p, currentChapterId: ch.id})), setCurrentPage('game'))}
              className={`google-card p-6 flex items-center gap-4 cursor-pointer ${!player.unlockedChapters.includes(ch.id) ? 'opacity-50 grayscale bg-[#f8f9fa]' : 'hover:bg-[#f1f3f4]'}`}
            >
              <div className="text-3xl">{player.unlockedChapters.includes(ch.id) ? ch.visual : '🔒'}</div>
              <div>
                <p className="text-[10px] font-bold text-[#5f6368] uppercase tracking-wider">{ch.difficulty}</p>
                <p className="font-medium">{ch.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatic = (page: Page) => {
    const data = (STATIC_CONTENT as any)[page] || { title: "404", content: "Archive entry not found." };
    return (
      <div className="max-w-3xl mx-auto py-16 px-6">
        <button 
          onClick={() => setCurrentPage('home')}
          className="text-[#1a73e8] hover:underline mb-8 flex items-center gap-2 text-sm font-medium"
        >
          ← Back to Overview
        </button>
        <h1 className="text-4xl font-bold mb-8">{data.title}</h1>
        <div className="prose max-w-none text-[#5f6368] leading-relaxed space-y-6 text-lg">
          {data.content.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
        </div>
      </div>
    );
  };

  const renderGame = () => (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 py-8 px-6">
      {/* Sidebar Info */}
      <div className="w-full md:w-80 flex flex-col gap-6">
        <div className="google-card p-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="text-3xl">{currentChapter.visual}</div>
             <div>
                <h3 className="font-bold text-sm">Chapter {currentChapter.id}</h3>
                <p className="text-[10px] text-[#5f6368] uppercase font-bold tracking-widest">{currentChapter.difficulty}</p>
             </div>
          </div>
          <h2 className="text-xl font-bold mb-3">{currentChapter.title}</h2>
          <p className="text-sm text-[#5f6368] mb-6 leading-relaxed italic">"{currentChapter.story}"</p>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span>Vitality</span>
                <span>{player.hp}/{player.maxHp}</span>
              </div>
              <div className="progress-container"><div className="h-full progress-fill-red" style={{width: `${(player.hp/player.maxHp)*100}%`}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span>Arcane Level {player.level}</span>
                <span>{player.xp}%</span>
              </div>
              <div className="progress-container"><div className="h-full progress-fill-blue" style={{width: `${player.xp}%`}}></div></div>
            </div>
          </div>
        </div>

        <div className="google-card p-6 bg-[#f8f9fa] border-dashed">
          <h4 className="text-xs font-bold uppercase text-[#5f6368] mb-2 tracking-widest">Master's Quest</h4>
          <p className="text-sm leading-relaxed">{currentChapter.task}</p>
        </div>
        
        <button 
          onClick={async () => {
            setIsLoading(true);
            const hint = await getMagicHint(currentChapter.title, currentCode, currentChapter.task);
            setAiHint(hint);
            setIsLoading(false);
          }}
          className="google-btn-outline w-full flex items-center justify-center gap-2"
        >
          <span>💡</span> Seek Mentor Hint
        </button>
      </div>

      {/* Editor Main */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="google-card overflow-hidden shadow-sm flex flex-col min-h-[400px]">
          <div className="bg-[#f1f3f4] px-4 py-2 flex items-center justify-between border-b border-[#dadce0]">
            <span className="text-[11px] font-mono text-[#5f6368]">spell_routine.py</span>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#dadce0]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#dadce0]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#dadce0]"></div>
            </div>
          </div>
          <div className="p-8 font-mono text-base md:text-lg leading-relaxed bg-[#ffffff] flex-grow">
            {currentCode.split('???').map((part, i, arr) => (
              <React.Fragment key={i}>
                <span className="text-[#3c4043]">{part}</span>
                {i < arr.length - 1 && (
                  <button 
                    onClick={() => setShowTokenSelector(true)}
                    className="token-selector-btn mx-1"
                  >
                    ???
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          {aiHint && (
            <div className="p-4 bg-[#fff8e1] border-t border-[#ffe082]">
              <p className="text-sm text-[#795548] italic leading-relaxed">Merlin: "{aiHint}"</p>
            </div>
          )}
          <div className="p-4 border-t border-[#dadce0] bg-[#f8f9fa] flex justify-end">
             <button 
               onClick={handleRun}
               disabled={currentCode.includes('???') || isLoading}
               className="google-btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
             >
               {isLoading ? 'Executing...' : 'Cast Spell'}
             </button>
          </div>
        </div>

        {/* Execution Output */}
        {execution && (
          <div className={`google-card p-6 font-mono text-sm ${execution.success ? 'border-l-4 border-l-[#34a853]' : 'border-l-4 border-l-[#ea4335]'}`}>
            <div className="text-[10px] font-bold uppercase text-[#5f6368] mb-2">Terminal Output</div>
            <p className={execution.success ? 'text-[#1e8e3e]' : 'text-[#d93025]'}>
              {execution.success ? '>>> Spell materialized successfully.' : '>>> Arcane anomaly detected.'}
            </p>
            {execution.output && <p className="mt-2 text-[#202124]">{execution.output}</p>}
            {execution.error && <p className="mt-2 text-[#d93025]">{execution.error}</p>}
          </div>
        )}
      </div>

      {/* Token Picker */}
      {showTokenSelector && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 modal-overlay backdrop-blur-sm">
          <div className="google-card w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-6">Select Logic Token</h3>
            <div className="grid grid-cols-2 gap-4">
              {currentChapter.tokens.map(t => (
                <button 
                  key={t}
                  onClick={() => selectToken(t)}
                  className="google-btn-outline py-4 font-mono text-sm truncate"
                >
                  {t}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowTokenSelector(false)}
              className="w-full mt-6 text-sm text-[#5f6368] hover:text-[#202124] font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success View */}
      {isSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay">
          <div className="google-card w-full max-w-sm p-12 text-center shadow-2xl animate-in zoom-in-95 border-t-8 border-t-[#34a853]">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold mb-4">Spell Successful</h2>
            <p className="text-[#5f6368] mb-8">You've mastered this logic routine and gained valuable arcane experience.</p>
            <button 
              onClick={handleNextChapter}
              className="google-btn-primary w-full py-4 text-sm uppercase tracking-widest"
            >
              Advance Module →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <header className="h-16 bg-white border-b border-[#dadce0] sticky top-0 z-[100] px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white text-sm">🔮</div>
            <span className="font-medium text-[#202124] text-xl tracking-tight">PyMancer</span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setCurrentPage('home')} className={`text-sm font-medium ${currentPage === 'home' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Home</button>
            <button onClick={() => setCurrentPage('game')} className={`text-sm font-medium ${currentPage === 'game' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Learn</button>
            <button onClick={() => setCurrentPage('docs')} className={`text-sm font-medium ${currentPage === 'docs' ? 'text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Guide</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
           {currentPage === 'game' && (
             <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-[#5f6368]">
               <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ea4335]"></span> {player.hp} HP</span>
               <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1a73e8]"></span> {player.mana} MP</span>
             </div>
           )}
           <button className="google-btn-primary py-2 px-6">Profile</button>
        </div>
      </header>

      <main className="flex-grow">
        {currentPage === 'home' && renderHome()}
        {currentPage === 'game' && renderGame()}
        {['about', 'docs', 'contact', 'privacy', 'terms'].includes(currentPage) && renderStatic(currentPage)}
      </main>

      <footer className="bg-white border-t border-[#dadce0] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-[#1a73e8] flex items-center justify-center text-white text-[10px]">🔮</div>
              <span className="font-bold text-[#202124]">PyMancer</span>
            </div>
            <p className="text-sm text-[#5f6368] leading-relaxed">
              Google-inspired education portal for aspiring developers. We make learning Python as intuitive as searching the web.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase text-[#202124] tracking-widest mb-1">Company</p>
              <button onClick={() => setCurrentPage('about')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">About</button>
              <button onClick={() => setCurrentPage('contact')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">Contact</button>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase text-[#202124] tracking-widest mb-1">Learning</p>
              <button onClick={() => setCurrentPage('docs')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">Master Guide</button>
              <button onClick={() => setCurrentPage('game')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">Curriculum</button>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase text-[#202124] tracking-widest mb-1">Legal</p>
              <button onClick={() => setCurrentPage('privacy')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">Privacy Policy</button>
              <button onClick={() => setCurrentPage('terms')} className="text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors text-left">Terms of Use</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#f1f3f4] flex flex-col sm:flex-row justify-between items-center gap-4 text-[#5f6368] text-xs">
          <span>© 2025 PyMancer Education Initiative</span>
          <div className="flex gap-6">
            <span>Built with Material 3 Principles</span>
            <span>Knowledge is Open</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
