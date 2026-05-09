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
import { Plus, Trash2, Folder, X, Layout, CheckCircle2, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { SYSTEM_MODULES } from '../constants';

interface Project {
  id: string;
  name: string;
  description: string;
  moduleIds: string[];
  ownerId: string;
  createdAt: any;
  updatedAt: any;
}

interface ModuleConfig {
  id: string;
  name: string;
  description: string;
}

export default function ProjectsView({ user }: { user: User }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableModules, setAvailableModules] = useState<ModuleConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    moduleIds: [] as string[]
  });

  useEffect(() => {
    // Sync Projects
    const projectsQuery = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    // Sync Available Modules
    const modulesQuery = query(collection(db, 'modules'), where('createdBy', '==', user.uid));
    const unsubscribeModules = onSnapshot(modulesQuery, (snapshot) => {
      const customMods = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ModuleConfig));
      const systemMods = SYSTEM_MODULES.map(sm => ({ id: sm.id, name: sm.name, description: sm.description }));
      setAvailableModules([...systemMods, ...customMods]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'modules');
    });

    return () => {
      unsubscribeProjects();
      unsubscribeModules();
    };
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || newProject.moduleIds.length === 0) return;

    const projectRef = doc(collection(db, 'projects'));
    try {
      await setDoc(projectRef, {
        ...newProject,
        id: projectRef.id,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewProject({ name: '', description: '', moduleIds: [] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${projectRef.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project? (This won't delete the underlying modules)")) {
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
      }
    }
  };

  const toggleModule = (id: string) => {
    setNewProject(prev => {
      const exists = prev.moduleIds.includes(id);
      return {
        ...prev,
        moduleIds: exists 
          ? prev.moduleIds.filter(mid => mid !== id) 
          : [...prev.moduleIds, id]
      };
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tighter text-white uppercase font-sans">Project Workspace</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} /> Compose Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(proj => (
          <motion.div 
            key={proj.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] flex flex-col justify-between h-72 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                 <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-500 border border-slate-800">
                    <Folder size={24} />
                 </div>
                 <button 
                   onClick={() => handleDelete(proj.id)}
                   className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                 >
                   <Trash2 size={18} />
                 </button>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold tracking-tight text-white mb-2 uppercase">{proj.name}</h3>
                <p className="text-slate-500 text-xs font-medium mb-4 line-clamp-2">{proj.description || 'No project description.'}</p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto">
                 {proj.moduleIds.map(mid => {
                   const mod = availableModules.find(m => m.id === mid);
                   return (
                     <span key={mid} className="text-[8px] font-bold px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-400 uppercase tracking-wider">
                       {mod?.name || 'Unknown Module'}
                     </span>
                   );
                 })}
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-white">
               <Layout size={160} />
            </div>
          </motion.div>
        ))}

        {projects.length === 0 && (
           <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-800 bg-slate-900/20 rounded-[2rem]">
              <Folder size={48} className="mx-auto text-slate-800 mb-4 stroke-[1]" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No active projects compiled.</p>
           </div>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-800"
            >
              <form onSubmit={handleCreate} className="flex flex-col h-full">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight text-white">Project Archetype</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Group your modules into a logical workspace</p>
                  </div>
                  <button type="button" onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Project Designation</label>
                      <input 
                        type="text" 
                        required
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        placeholder="e.g. CORE INFRASTRUCTURE"
                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-800 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Functional Brief</label>
                      <input 
                        type="text"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        placeholder="Describe project intent..."
                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-800 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">Select Module Architecture (Multi-choice)</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availableModules.map(mod => {
                          const isSelected = newProject.moduleIds.includes(mod.id);
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => toggleModule(mod.id)}
                              className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all border ${
                                isSelected 
                                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                              }`}
                            >
                              <div className={`mt-1 p-2 rounded-lg ${isSelected ? 'text-emerald-500' : 'text-slate-700'}`}>
                                 {isSelected ? <CheckCircle2 size={18} /> : <Box size={18} />}
                              </div>
                              <div>
                                <h4 className={`text-xs font-bold uppercase tracking-tight ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  {mod.name}
                                </h4>
                                <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">{mod.description || 'System module.'}</p>
                              </div>
                            </button>
                          );
                        })}
                        {availableModules.length === 0 && (
                          <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                             <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">No modules available to group.</p>
                          </div>
                        )}
                     </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-950/50 border-t border-slate-800">
                  <button 
                    type="submit"
                    disabled={!newProject.name || newProject.moduleIds.length === 0}
                    className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Build Project Instance
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
