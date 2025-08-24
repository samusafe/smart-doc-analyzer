import React from 'react';

interface TabDef { id: string; label: string; icon?: React.ReactNode; }
interface TabsBarProps {
  tabs: TabDef[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}
export const TabsBar: React.FC<TabsBarProps> = ({ tabs, activeTab, setActiveTab }) => (
  <div className="px-4 pt-3 flex gap-2 flex-wrap border-b border-slate-700/60 text-xs" role="tablist" aria-label="Analysis sections">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls={`panel-${tab.id}`}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium tracking-wide transition border outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900 ${activeTab === tab.id ? 'bg-indigo-500 text-white border-indigo-400 shadow' : 'bg-slate-800/70 text-slate-200 border-slate-600 hover:bg-slate-700/70'}`}
      >{tab.icon}{tab.label}</button>
    ))}
  </div>
);
