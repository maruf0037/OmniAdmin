import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  History, 
  Package, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Store, 
  ShoppingCart 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

interface StockLine {
  productId: string;
  variantId: string;
  quantity: number;
  cpu: number;
  mrp: number;
  isOpening: boolean;
}

export default function StockEntryMaster({ user }: { user: User }) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [stockLines, setStockLines] = useState<StockLine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, [user]);

  const addLine = (productId: string, variantId: string) => {
    const exists = stockLines.find(l => l.variantId === variantId);
    if (exists) return;

    const newLine: StockLine = {
      productId,
      variantId,
      quantity: 0,
      cpu: 0,
      mrp: 0,
      isOpening: false
    };
    setStockLines([...stockLines, newLine]);
  };

  const handleSubmit = async () => {
    if (stockLines.length === 0) return;
    setIsProcessing(true);
    
    try {
      // In a real app, we'd use a batch write or a complex logic to increment product stock
      // For now, we simulate transaction logging
      await addDoc(collection(db, 'stock_transactions'), {
        lines: stockLines,
        ownerId: user.uid,
        status: 'COMPLETE',
        createdAt: serverTimestamp()
      });

      // Update product variant metadata if needed
      // (This is a simplification)

      setStockLines([]);
      alert("Inventory sync complete.");
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'stock_transactions');
    } finally {
       setIsProcessing(false);
    }
  };

  const activeProduct = products.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Stock Vector Engine</h2>
           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Manage physical quantities and valuation</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={stockLines.length === 0 || isProcessing}
          className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 text-[10px]"
        >
          {isProcessing ? 'SYNCHRONIZING...' : 'COMMIT TRANSACTION'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Left: Product Selection */}
         <div className="lg:col-span-1 bg-slate-950 border border-slate-900 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Target Entity</h3>
            <div className="space-y-4">
               <select 
                 value={selectedProduct}
                 onChange={(e) => setSelectedProduct(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold uppercase tracking-tight"
               >
                  <option value="">SELECT PRODUCT</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
               </select>

               {activeProduct && (
                 <div className="space-y-2 mt-8">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-4">Select Node Variant</p>
                    {activeProduct.variants.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => addLine(activeProduct.id, v.id)}
                        className="w-full bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-left hover:border-emerald-500/50 transition-all group"
                      >
                         <p className="text-[10px] font-black text-white uppercase tracking-tight group-hover:text-emerald-400">{v.code}</p>
                         <p className="text-[8px] text-slate-600 mt-1 uppercase">{v.color} / {v.size}</p>
                      </button>
                    ))}
                 </div>
               )}
            </div>
         </div>

         {/* Right: Line Items */}
         <div className="lg:col-span-3 bg-slate-950 border border-slate-900 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-slate-900 flex items-center justify-between">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Lines</h3>
               <span className="text-[9px] font-black text-indigo-400 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md uppercase tracking-widest">
                  {stockLines.length} ENTRIES
               </span>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-slate-900 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-900/10">
                        <th className="px-8 py-5">Variant Specification</th>
                        <th className="px-8 py-5">Quantity Node</th>
                        <th className="px-8 py-5">Unit Valuation (CPU)</th>
                        <th className="px-8 py-5">Market Price (MRP)</th>
                        <th className="px-8 py-5 text-right">Delete</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                     {stockLines.map((line, idx) => {
                       const p = products.find(prod => prod.id === line.productId);
                       const v = p?.variants?.find((vari: any) => vari.id === line.variantId);
                       return (
                         <tr key={line.variantId} className="hover:bg-slate-900/30 transition-colors">
                            <td className="px-8 py-6">
                               <p className="text-xs font-black text-white uppercase tracking-tight">{v?.code}</p>
                               <p className="text-[8px] text-slate-600 mt-1 uppercase">{p?.name}</p>
                            </td>
                            <td className="px-8 py-6">
                               <input 
                                 type="number" 
                                 className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-white w-24 outline-none focus:border-emerald-500 transition-all font-mono"
                                 value={line.quantity || ''}
                                 onChange={(e) => {
                                   const next = [...stockLines];
                                   next[idx].quantity = Number(e.target.value);
                                   setStockLines(next);
                                 }}
                               />
                            </td>
                            <td className="px-8 py-6">
                               <input 
                                 type="number" 
                                 className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-indigo-400 w-32 outline-none focus:border-indigo-500 transition-all font-mono"
                                 value={line.cpu || ''}
                                 onChange={(e) => {
                                   const next = [...stockLines];
                                   next[idx].cpu = Number(e.target.value);
                                   setStockLines(next);
                                 }}
                               />
                            </td>
                            <td className="px-8 py-6">
                               <input 
                                 type="number" 
                                 className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-emerald-400 w-32 outline-none focus:border-emerald-500 transition-all font-mono"
                                 value={line.mrp || ''}
                                 onChange={(e) => {
                                   const next = [...stockLines];
                                   next[idx].mrp = Number(e.target.value);
                                   setStockLines(next);
                                 }}
                               />
                            </td>
                            <td className="px-8 py-6 text-right">
                               <button 
                                 onClick={() => setStockLines(stockLines.filter(it => it.variantId !== line.variantId))}
                                 className="p-2 text-slate-800 hover:text-red-500 transition-colors"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </td>
                         </tr>
                       );
                     })}
                  </tbody>
               </table>
               {stockLines.length === 0 && (
                 <div className="py-24 text-center border-dashed border-slate-800 flex flex-col items-center justify-center gap-4">
                    <History size={40} className="text-slate-900" />
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Select variants from the left console to start transaction.</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
