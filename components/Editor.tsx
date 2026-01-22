
import React from 'react';

interface EditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

const Editor: React.FC<EditorProps> = ({ code, onChange, onRun }) => {
  return (
    <div className="flex flex-col h-full premium-card-3d overflow-hidden border border-white/60">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-white/60 border-b border-slate-100/50">
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-300 shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 shadow-sm" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate hidden sm:inline">spellweaver_v2.py</span>
        <button 
          onClick={onRun}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[10px] tracking-widest uppercase transition-all transform active:scale-95 shadow-md shadow-indigo-100 flex items-center gap-2"
        >
          <span>Cast Spell</span>
          <span className="text-xs">⚡</span>
        </button>
      </div>
      <div className="relative flex-grow flex bg-slate-50/20">
        <div className="w-10 md:w-12 bg-slate-50/50 text-slate-300 font-mono text-[10px] py-5 text-right pr-3 select-none border-r border-slate-100/50">
          {code.split('\n').map((_, i) => (
            <div key={i} className="h-6 leading-6">{i + 1}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-grow bg-transparent text-slate-800 font-mono text-[13px] md:text-[14px] p-5 outline-none resize-none leading-6 tracking-tight placeholder:text-slate-300"
          placeholder="# Channel your magic through code..."
        />
      </div>
    </div>
  );
};

export default Editor;
