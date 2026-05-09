import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Search, Filter, MoreVertical, Trash2, ShieldCheck, ShieldAlert, Mail, Phone, MapPin, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

interface Supplier {
  id: string;
  name: string;
  shopName: string;
  status: 'Active' | 'Inactive';
  mobile: string;
  email: string;
  transactionType: string;
}

export default function SupplierList({ user }: { user: User }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'suppliers'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSuppliers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    });
    return () => unsubscribe();
  }, [user]);

  const toggleStatus = async (id: string, current: string) => {
    const nextStatus = current === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateDoc(doc(db, 'suppliers', id), { 
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `suppliers/${id}`);
    }
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-white">Central Supplier Index</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Registry of authorized supply partners</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-hover:text-emerald-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH PROTOCOL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 py-3 pl-12 pr-6 rounded-2xl text-[10px] font-black text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all uppercase tracking-widest w-64"
            />
          </div>
          <button className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-colors">
             <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
         <table className="w-full text-left">
            <thead>
               <tr className="border-b border-slate-900 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-900/10">
                  <th className="px-8 py-6">Partner Identity</th>
                  <th className="px-8 py-6">Contact Node</th>
                  <th className="px-8 py-6">Protocol</th>
                  <th className="px-8 py-6">Status Authorization</th>
                  <th className="px-8 py-6 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
               {filtered.map(s => (
                 <tr key={s.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border ${
                            s.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}>
                            {s.shopName ? s.shopName.charAt(0) : s.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-xs font-black text-white uppercase tracking-tight">{s.shopName || s.name}</p>
                             <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">{s.name}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1 text-[9px] font-bold text-slate-400">
                          <span className="flex items-center gap-2"><Phone size={10} className="text-slate-700" /> {s.mobile}</span>
                          <span className="flex items-center gap-2 uppercase tracking-tighter"><Mail size={10} className="text-slate-700" /> {s.email || 'NO_VIRTUAL_PATH'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[9px] font-black px-2 py-1 bg-slate-900 rounded-md border border-slate-800 text-slate-400 uppercase tracking-widest">
                          {s.transactionType}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <button 
                         onClick={() => toggleStatus(s.id, s.status)}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                           s.status === 'Active' 
                           ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                           : 'bg-red-500/10 border-red-500/20 text-red-500'
                         }`}
                       >
                          {s.status === 'Active' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                          <span className="text-[9px] font-black uppercase tracking-widest">{s.status}</span>
                       </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-2 text-slate-700 hover:text-white transition-colors">
                          <MoreVertical size={18} />
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
         {filtered.length === 0 && (
           <div className="py-20 text-center flex flex-col items-center justify-center opacity-40">
              <PackageSearch size={48} className="mb-4 stroke-[1]" />
              <p className="text-[10px] font-black uppercase tracking-widest font-mono">No partners detected in current sector.</p>
           </div>
         )}
      </div>
    </div>
  );
}
