import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Plus, Trash2, CheckCircle, Circle, AlertCircle, Clock, Filter, MoreVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  ownerId: string;
  createdAt: any;
}

export default function TasksView({ user }: { user: User }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as const });

  useEffect(() => {
    const q = query(
      collection(db, 'tasks'), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        status: 'todo',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewTask({ title: '', description: '', priority: 'medium' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const toggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await updateDoc(doc(db, 'tasks', task.id), { 
        status: nextStatus,
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const priorityColors = {
    low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    high: 'text-red-400 bg-red-500/10 border-red-500/20'
  };

  return (
    <div className="space-y-8 h-full">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold tracking-tighter text-white">WORK QUEUE</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage Priorities</p>
         </div>
         <button 
           onClick={() => setIsAdding(true)}
           className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
         >
           <Plus size={18} /> New Task
         </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map(task => (
          <motion.div 
            key={task.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-6 group hover:border-slate-700 transition-all ${task.status === 'done' ? 'opacity-40' : ''}`}
          >
            <button 
              onClick={() => toggleStatus(task)}
              className="text-slate-700 hover:text-indigo-400 transition-colors"
            >
              {task.status === 'done' ? <CheckCircle className="text-emerald-500" /> : <Circle className="stroke-[1.5]" />}
            </button>
            <div className="flex-1">
               <h3 className={`font-bold tracking-tight text-white mb-0.5 ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>
                 {task.title}
               </h3>
               <p className="text-xs text-slate-500 font-medium line-clamp-1">{task.description || 'No description provided.'}</p>
            </div>
            <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${priorityColors[task.priority]}`}>
              {task.priority}
            </div>
            <button 
              onClick={() => handleDelete(task.id)}
              className="p-2 text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
               <Trash2 size={16} />
            </button>
          </motion.div>
        ))}
        {tasks.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-900/20">
             <CheckCircle size={48} className="mx-auto text-slate-800 mb-4 stroke-[1]" />
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">The queue is clear.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-slate-900 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800"
            >
              <form onSubmit={handleCreate}>
                 <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                   <h3 className="text-xl font-bold tracking-tight text-white uppercase">New Task Entry</h3>
                   <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white">
                     <X size={24} />
                   </button>
                 </div>
                 <div className="p-8 space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center md:text-left">Target Title</label>
                      <input 
                        type="text" 
                        required
                        autoFocus
                        value={newTask.title}
                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700 text-white font-mono"
                        placeholder="Task Descriptor"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Context Details</label>
                      <textarea 
                        value={newTask.description}
                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm font-medium h-24 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700 text-white font-mono"
                        placeholder="Additional meta-data..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Priority Level</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['low', 'medium', 'high'] as const).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewTask({ ...newTask, priority: p })}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                              newTask.priority === p 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                                : 'bg-slate-950 text-slate-600 border-slate-800 hover:text-slate-400'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>
                 <div className="p-8 pt-0">
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all">
                       Commit to Queue
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
