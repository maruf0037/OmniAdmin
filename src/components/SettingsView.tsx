import React from 'react';
import { User as UserIcon, Mail, Shield, Smartphone, Bell, Eye, Moon, Lock, Globe, RefreshCw, Settings } from 'lucide-react';
import { User } from 'firebase/auth';

export default function SettingsView({ user }: { user: User }) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto h-full">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold tracking-tighter text-white uppercase">Terminal Settings</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">System Configuration</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-indigo-400 border border-slate-800">
                <UserIcon size={20} />
             </div>
             <h3 className="font-bold tracking-tight text-white uppercase text-sm">Identity Profile</h3>
          </div>
          <div className="space-y-4 font-mono">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
               <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Display Label</p>
               <p className="text-sm text-slate-200">{user.displayName || 'System User'}</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
               <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Communication Node</p>
               <p className="text-sm text-slate-200">{user.email || 'offline_node@omni.sys'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-emerald-400 border border-slate-800">
                <Shield size={20} />
             </div>
             <h3 className="font-bold tracking-tight text-white uppercase text-sm">Access Control</h3>
          </div>
          <div className="space-y-3">
             {[
               { icon: Bell, label: 'Broadcast Notifications', enabled: true },
               { icon: Lock, label: 'Multi-Factor Auth', enabled: false },
               { icon: Globe, label: 'Public Indexing', enabled: false },
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 group hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                     <item.icon size={16} className="text-slate-600 group-hover:text-slate-400" />
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${item.enabled ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                     <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${item.enabled ? 'right-1' : 'left-1'}`} />
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                 <h3 className="text-3xl font-bold tracking-tighter mb-2">Cloud Intelligence</h3>
                 <p className="max-w-md text-indigo-100 text-sm leading-relaxed font-medium">Your current deployment is utilizing 12% of the available node space. Synchronized with Firebase Real-time Engine.</p>
              </div>
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center gap-3">
                 <RefreshCw size={16} /> Sync Nodes
              </button>
           </div>
           <Settings size={280} className="absolute -bottom-20 -right-20 text-white/5 rotate-12 group-hover:rotate-6 transition-transform duration-1000" />
        </div>
      </div>
    </div>
  );
}
