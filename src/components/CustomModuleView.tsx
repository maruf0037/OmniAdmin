import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Plus, Trash2, Box, Eye, Settings2, X, Download, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

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
}

export default function CustomModuleView({ user, moduleId }: { user: User, moduleId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [config, setConfig] = useState<ModuleConfig | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<any>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Fetch module config
    const fetchConfig = async () => {
      try {
        const d = await getDoc(doc(db, 'modules', moduleId));
        if (d.exists()) {
          setConfig({ id: d.id, ...d.data() } as ModuleConfig);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `modules/${moduleId}`);
      }
    };
    fetchConfig();

    // Fetch items
    const q = query(
      collection(db, 'modules', moduleId, 'items'), 
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `modules/${moduleId}/items`);
    });
    return () => unsubscribe();
  }, [moduleId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = `modules/${moduleId}/items`;
    try {
      await addDoc(collection(db, 'modules', moduleId, 'items'), {
        ...newItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewItem({});
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (confirm("Delete this record?")) {
      const path = `modules/${moduleId}/items/${itemId}`;
      try {
        await deleteDoc(doc(db, 'modules', moduleId, 'items', itemId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const filteredItems = items.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  if (!config) return <div className="p-8 text-slate-500 font-mono text-xs">INITIALIZING NODE...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Box size={18} />
              </div>
              <h2 className="text-3xl font-bold tracking-tighter text-white uppercase">{config.name}</h2>
           </div>
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{config.description || 'System data stream'}</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="PROBE DATA..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono text-white outline-none focus:border-indigo-500/50 transition-all w-64 placeholder:text-slate-700"
              />
           </div>
           <button 
             onClick={() => setIsAdding(true)}
             className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
           >
             <Plus size={16} /> Insert Record
           </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950/50">
                {config.fields.map(field => (
                  <th key={field.name} className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                    {field.label}
                  </th>
                ))}
                <th className="px-6 py-5 border-b border-slate-800 w-20 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-indigo-500/[0.02] transition-colors group">
                  {config.fields.map(f => (
                    <td key={f.name} className="px-6 py-5 text-xs text-slate-300 font-medium font-mono">
                      {f.type === 'boolean' ? (
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${item[f.name] ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700/50'}`}>
                          {item[f.name] ? 'TRUE' : 'FALSE'}
                        </span>
                      ) : String(item[f.name] || '-')}
                    </td>
                  ))}
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={config.fields.length + 1} className="px-6 py-24 text-center">
                     <Box size={40} className="mx-auto text-slate-800 mb-3 opacity-20" />
                     <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No matching records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800"
            >
              <form onSubmit={handleCreate}>
                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 text-white">
                  <h3 className="text-xl font-bold uppercase tracking-tight font-mono">Record Insertion</h3>
                  <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {config.fields.map(field => (
                    <div key={field.name}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{field.label}</label>
                      {field.type === 'boolean' ? (
                        <div className="flex gap-4">
                           <button
                             type="button"
                             onClick={() => setNewItem({ ...newItem, [field.name]: true })}
                             className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newItem[field.name] === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-950 text-slate-600 border-slate-800'}`}
                           >
                             TRUE
                           </button>
                           <button
                             type="button"
                             onClick={() => setNewItem({ ...newItem, [field.name]: false })}
                             className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newItem[field.name] === false ? 'bg-red-600 text-white border-red-600' : 'bg-slate-950 text-slate-600 border-slate-800'}`}
                           >
                             FALSE
                           </button>
                        </div>
                      ) : (
                        <input 
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          required
                          value={newItem[field.name] || ''}
                          onChange={e => setNewItem({ ...newItem, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm font-mono text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-800"
                          placeholder={`Enter ${field.label}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-8 bg-slate-950 border-t border-slate-800">
                  <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                     Commit Record
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
