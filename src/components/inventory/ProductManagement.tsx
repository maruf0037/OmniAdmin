import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { 
  Plus, Search, Download, Upload, Trash2, Box, Eye, Edit3, CheckCircle, Barcode, Layers, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

interface Variant {
  id: string;
  code: string;
  color: string;
  size: string;
  design: string;
  barcode: string;
  status: 'Active' | 'Inactive';
}

interface Product {
  id: string;
  name: string;
  supplierId: string;
  variants: Variant[];
}

export default function ProductManagement({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    supplierId: '',
    variants: [] as Variant[]
  });

  useEffect(() => {
    // Sync Products
    const qProd = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Sync Suppliers for Dropdown
    const qSup = query(collection(db, 'suppliers'), where('ownerId', '==', user.uid), where('status', '==', 'Active'));
    const unsubSup = onSnapshot(qSup, (snapshot) => {
      setSuppliers(snapshot.docs.map(d => ({ id: d.id, name: d.data().shopName || d.data().name })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    });

    return () => {
      unsubProd();
      unsubSup();
    };
  }, [user]);

  const addVariant = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const newVariant: Variant = {
      id,
      code: '',
      color: '',
      size: '',
      design: '',
      barcode: `BAR-${id.toUpperCase()}`,
      status: 'Active'
    };
    setNewProduct({ ...newProduct, variants: [...newProduct.variants, newVariant] });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.supplierId || newProduct.variants.length === 0) {
      alert("Missing mandatory data nodes.");
      return;
    }

    const prodRef = doc(collection(db, 'products'));
    try {
      await setDoc(prodRef, {
        ...newProduct,
        id: prodRef.id,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewProduct({ name: '', supplierId: '', variants: [] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${prodRef.id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Product Architecture</h2>
           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Matrix of inventory units and variants</p>
        </div>
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-slate-700 transition-all">
              <Download size={14} /> EXCEL EXPORT
           </button>
           <button 
             onClick={() => setIsAdding(true)}
             className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
           >
             <Plus size={18} /> INITIALIZE ENTRY
           </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(prod => (
          <div key={prod.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden group hover:border-indigo-500/30 transition-all">
             <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                   <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-indigo-400 border border-slate-800">
                      <Box size={24} />
                   </div>
                   <div className="text-right">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">SUPPLIER</span>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{suppliers.find(s => s.id === prod.supplierId)?.name || 'GENERIC'}</p>
                   </div>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{prod.name}</h3>
                <div className="flex flex-wrap gap-2 mt-4">
                   {prod.variants.slice(0, 3).map(v => (
                     <span key={v.id} className="text-[8px] font-black px-2 py-1 bg-slate-950 border border-slate-800 text-slate-500 rounded-md uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                        {v.size}-{v.color}
                     </span>
                   ))}
                   {prod.variants.length > 3 && <span className="text-[8px] font-black px-2 py-1 text-slate-700 uppercase tracking-widest">+{prod.variants.length - 3} MORE</span>}
                </div>
             </div>
             <div className="px-8 py-6 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{prod.variants.length} VARIANT TYPES</span>
                <div className="flex items-center gap-2">
                   <button className="p-2 text-slate-700 hover:text-white transition-colors"><Edit3 size={16} /></button>
                   <button className="p-2 text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl flex flex-col"
            >
               <form onSubmit={handleCreate} className="flex flex-col h-full">
                  <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                     <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Technical Data Entry</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Define product specs and matrix variations</p>
                     </div>
                     <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <label className="flex flex-col gap-3">
                           <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Product Designation (*)</span>
                           <input 
                             type="text" 
                             required
                             placeholder="e.g. SLIM FIT PROTOCOL-X"
                             value={newProduct.name}
                             onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                             className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none uppercase font-bold"
                           />
                        </label>
                        <label className="flex flex-col gap-3">
                           <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Partner Integration (*)</span>
                           <select 
                             required
                             value={newProduct.supplierId}
                             onChange={(e) => setNewProduct({ ...newProduct, supplierId: e.target.value })}
                             className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none font-bold uppercase"
                           >
                              <option value="">SELECT SUPPLIER NODE</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                        </label>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Variant Matrix</h4>
                           <button 
                             type="button" 
                             onClick={addVariant}
                             className="text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-indigo-300"
                           >
                              <Plus size={14} /> APPEND NODE
                           </button>
                        </div>

                        <div className="space-y-4">
                           {newProduct.variants.map((v, idx) => (
                             <div key={v.id} className="grid grid-cols-5 gap-3 bg-slate-950 p-6 rounded-2xl border border-slate-800 relative group/row">
                                <InputField label="Code/Style" value={v.code} onChange={(val) => {
                                   const vars = [...newProduct.variants];
                                   vars[idx].code = val;
                                   setNewProduct({ ...newProduct, variants: vars });
                                }} />
                                <InputField label="Color" value={v.color} onChange={(val) => {
                                   const vars = [...newProduct.variants];
                                   vars[idx].color = val;
                                   setNewProduct({ ...newProduct, variants: vars });
                                }} />
                                <InputField label="Size" value={v.size} onChange={(val) => {
                                   const vars = [...newProduct.variants];
                                   vars[idx].size = val;
                                   setNewProduct({ ...newProduct, variants: vars });
                                }} />
                                <InputField label="Design" value={v.design} onChange={(val) => {
                                   const vars = [...newProduct.variants];
                                   vars[idx].design = val;
                                   setNewProduct({ ...newProduct, variants: vars });
                                }} />
                                <div className="flex flex-col gap-2">
                                   <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">BARCODE</span>
                                   <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-[10px] text-emerald-500 font-mono tracking-tighter flex items-center gap-2">
                                      <Barcode size={14} /> {v.barcode}
                                   </div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setNewProduct({ ...newProduct, variants: newProduct.variants.filter(it => it.id !== v.id) })}
                                  className="absolute -right-3 top-1/2 -translate-y-1/2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover/row:opacity-100 transition-all shadow-lg"
                                >
                                   <Trash2 size={12} />
                                </button>
                             </div>
                           ))}
                           {newProduct.variants.length === 0 && (
                             <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl opacity-40">
                                <p className="text-[10px] font-black uppercase tracking-widest">No variations mapped to this product entity.</p>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-slate-950/50 border-t border-slate-800">
                     <button 
                       type="submit"
                       className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/20 text-xs"
                     >
                        Confirm Architecture Deployment
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

function InputField({ label, placeholder, value, onChange }: { label: string, placeholder?: string, value: string, onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{label}</span>
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold uppercase tracking-tight"
      />
    </label>
  );
}
