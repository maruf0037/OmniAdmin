import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Plus, Trash2, Box, Eye, Settings2, X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { SYSTEM_MODULES } from '../constants';

interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date';
}

interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: Field[];
  createdBy: string;
  createdAt: any;
}

export default function ModulesManagerView({ user, onSelectModule }: { user: User, onSelectModule: (id: string) => void }) {
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newMod, setNewMod] = useState({
    name: '',
    description: '',
    fields: [{ name: '', label: '', type: 'text' }] as Field[]
  });

  useEffect(() => {
    const q = query(collection(db, 'modules'), where('createdBy', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ModuleConfig));
      setModules(ms);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'modules');
    });
    return () => unsubscribe();
  }, [user]);

  const addField = () => {
    setNewMod({ ...newMod, fields: [...newMod.fields, { name: '', label: '', type: 'text' }] });
  };

  const removeField = (index: number) => {
    const fields = [...newMod.fields];
    fields.splice(index, 1);
    setNewMod({ ...newMod, fields });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMod.name || newMod.fields.some(f => !f.name)) return;

    const modRef = doc(collection(db, 'modules'));
    const path = `modules/${modRef.id}`;

    try {
      await setDoc(modRef, {
        ...newMod,
        id: modRef.id,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        icon: 'box'
      });
      setIsCreating(false);
      setNewMod({ name: '', description: '', fields: [{ name: '', label: '', type: 'text' }] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this module and all its data?")) {
      try {
        await deleteDoc(doc(db, 'modules', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `modules/${id}`);
      }
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Module Matrix</h2>
           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Configure and deploy system nodes and custom archetype structures</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
        >
          <Plus size={20} /> Deploy Archetype
        </button>
      </div>

      {/* System Modules Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
           <span className="h-[1px] flex-1 bg-slate-900"></span>
           <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Standard Inventory System Nodes</h3>
           <span className="h-[1px] flex-1 bg-slate-900"></span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SYSTEM_MODULES.map(sm => (
            <motion.div
              key={sm.id}
              whileHover={{ y: -4 }}
              onClick={() => onSelectModule(`inventory-${sm.subTab}`)}
              className="bg-slate-950 border border-slate-900 p-6 rounded-[2rem] cursor-pointer hover:border-emerald-500/50 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-all mb-4 border border-slate-800">
                 <sm.icon size={24} />
              </div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-tight mb-2 group-hover:text-emerald-400">{sm.name}</h4>
              <p className="text-[9px] text-slate-600 font-bold leading-relaxed line-clamp-2">{sm.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-4">
         <div className="flex items-center gap-4">
           <span className="h-[1px] flex-1 bg-slate-900"></span>
           <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Custom Archetype Deployments</h3>
           <span className="h-[1px] flex-1 bg-slate-900"></span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(mod => (
            <motion.div 
              key={mod.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onSelectModule(mod.id)}
            className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] group relative overflow-hidden flex flex-col justify-between h-64 hover:border-indigo-500/50 cursor-pointer transition-all hover:translate-y-[-4px]"
          >
            <div className="flex items-start justify-between mb-4 relative z-10">
               <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all border border-slate-800">
                  <Box size={24} />
               </div>
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   handleDelete(mod.id);
                 }}
                 className="p-2 text-slate-700 hover:text-red-500 transition-colors"
               >
                 <Trash2 size={18} />
               </button>
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold tracking-tight mb-2 uppercase text-white group-hover:text-indigo-400 transition-colors">{mod.name}</h3>
              <p className="text-slate-500 text-xs font-medium mb-6 line-clamp-2">{mod.description || 'No system descriptor provided.'}</p>
            </div>
            <div className="flex items-center justify-between relative z-10">
               <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md uppercase tracking-widest">
                  {mod.fields.length} Nodes
               </span>
               <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 group-hover:text-indigo-400 uppercase tracking-widest transition-colors">
                 Inspect <Eye size={12} />
               </div>
            </div>
            
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white">
               <Layers size={120} />
            </div>
          </motion.div>
        ))}
        {modules.length === 0 && (
           <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-800 bg-slate-900/20 rounded-[2rem]">
              <Layers size={48} className="mx-auto text-slate-800 mb-4 stroke-[1]" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No custom modules deployed.</p>
           </div>
        )}
      </div>
    </div>

    <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-800"
            >
              <form onSubmit={handleCreate} className="flex flex-col h-full">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white font-mono">Build System Logic</h3>
                  <button type="button" onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Module Identifier</label>
                      <input 
                        type="text" 
                        required
                        value={newMod.name}
                        onChange={(e) => setNewMod({ ...newMod, name: e.target.value })}
                        placeholder="e.g. Asset Monitor"
                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Purpose Descriptor</label>
                      <input 
                        type="text"
                        value={newMod.description}
                        onChange={(e) => setNewMod({ ...newMod, description: e.target.value })}
                        placeholder="Short definition..."
                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Field Matrix</label>
                       <button 
                         type="button" 
                         onClick={addField}
                         className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 border border-indigo-400/30 px-3 py-1.5 rounded-lg hover:bg-indigo-400 hover:text-white transition-all uppercase tracking-[0.2em]"
                       >
                         <Plus size={10} /> Add Node
                       </button>
                    </div>
                    <div className="space-y-3">
                      {newMod.fields.map((field, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-slate-950 p-2 rounded-2xl border border-slate-800">
                           <div className="flex-1">
                             <input 
                               type="text" 
                               required
                               placeholder="Label"
                               value={field.label}
                               onChange={(e) => {
                                 const f = [...newMod.fields];
                                 f[idx].label = e.target.value;
                                 f[idx].name = e.target.value.toLowerCase().replace(/\s+/g, '_');
                                 setNewMod({ ...newMod, fields: f });
                               }}
                               className="w-full bg-transparent border-0 px-3 py-2 text-xs font-mono text-white focus:ring-0 outline-none placeholder:text-slate-700"
                             />
                           </div>
                           <div className="w-32 border-l border-slate-800 pl-3">
                             <select
                               value={field.type}
                               onChange={(e) => {
                                 const f = [...newMod.fields];
                                 f[idx].type = e.target.value as any;
                                 setNewMod({ ...newMod, fields: f });
                               }}
                               className="w-full bg-transparent border-0 text-[10px] font-black uppercase tracking-widest text-indigo-400 focus:ring-0 outline-none cursor-pointer"
                             >
                               <option value="text">STRING</option>
                               <option value="number">INT/FLOAT</option>
                               <option value="boolean">BOOL</option>
                               <option value="date">TEMPORAL</option>
                             </select>
                           </div>
                           <button 
                             type="button" 
                             disabled={newMod.fields.length <= 1}
                             onClick={() => removeField(idx)}
                             className="p-2 text-slate-700 hover:text-red-500 disabled:opacity-0 transition-colors"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-950 border-t border-slate-800">
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
                  >
                    Deploy Architecture
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
