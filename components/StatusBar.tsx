
import React from 'react';
import { PlayerState } from '../types';

interface StatusBarProps {
  player: PlayerState;
}

const StatusBar: React.FC<StatusBarProps> = ({ player }) => {
  const hpPercent = (player.hp / player.maxHp) * 100;
  const manaPercent = (player.mana / player.maxMana) * 100;
  const xpNext = player.level * 100;
  const xpPercent = (player.xp / xpNext) * 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      {/* Level Card */}
      <div className="premium-card-3d p-3 md:p-4 flex flex-col items-center justify-center border-indigo-100">
        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Mage Rank</span>
        <span className="text-xl md:text-2xl font-magic gold-text-3d">LVL {player.level}</span>
      </div>

      {/* HP Bar */}
      <div className="premium-card-3d p-3 md:p-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] text-rose-500 font-black tracking-widest uppercase">Vitality</span>
          <span className="text-[9px] font-mono font-bold text-slate-500">{player.hp}</span>
        </div>
        <div className="w-full bg-slate-100 inset-panel h-[8px] p-[1.5px] overflow-hidden">
          <div 
            className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all duration-700" 
            style={{ width: `${hpPercent}%` }} 
          />
        </div>
      </div>

      {/* Mana Bar */}
      <div className="premium-card-3d p-3 md:p-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] text-indigo-500 font-black tracking-widest uppercase">Mana</span>
          <span className="text-[9px] font-mono font-bold text-slate-500">{player.mana}</span>
        </div>
        <div className="w-full bg-slate-100 inset-panel h-[8px] p-[1.5px] overflow-hidden">
          <div 
            className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full rounded-full transition-all duration-700" 
            style={{ width: `${manaPercent}%` }} 
          />
        </div>
      </div>

      {/* XP Bar */}
      <div className="premium-card-3d p-3 md:p-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] text-amber-500 font-black tracking-widest uppercase">Exp</span>
          <span className="text-[9px] font-mono font-bold text-slate-500">{player.xp}%</span>
        </div>
        <div className="w-full bg-slate-100 inset-panel h-[8px] p-[1.5px] overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-700" 
            style={{ width: `${xpPercent}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
