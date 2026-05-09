import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { X, CheckCircle2, AlertCircle, FileText, Upload, Building2, Smartphone, Landmark, Workflow } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

type TransactionType = 'Bank' | 'Bkash' | 'Alternative';

const BANK_NAMES = [
  'Sonali Bank', 'Janata Bank', 'Agrani Bank', 'Rupali Bank', 
  'Dutch-Bangla Bank', 'BRAC Bank', 'City Bank', 'EBL', 'Islami Bank'
];

export default function SupplierRegistration({ user }: { user: User }) {
  const [isExpanding, setIsExpanding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    shopName: '',
    nic: '',
    transactionType: 'Bank' as TransactionType,
    bankInfo: {
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      branchName: '',
      ownerName: ''
    },
    mobileWalletInfo: {
      bkashNumber: '',
      ownerName: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.nic) {
      alert("Please fill mandatory fields: Name, Mobile, NIC");
      return;
    }

    const supplierRef = doc(collection(db, 'suppliers'));
    try {
      await setDoc(supplierRef, {
        ...formData,
        id: supplierRef.id,
        ownerId: user.uid,
        status: 'Active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsExpanding(false);
      // Reset form...
      alert("Supplier Registered successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `suppliers/${supplierRef.id}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
      <div 
        onClick={() => setIsExpanding(!isExpanding)}
        className="p-8 flex items-center justify-between cursor-pointer group"
      >
        <div>
           <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">Supplier Registration Archetype</h3>
           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1 flex items-center gap-2">
             <AlertCircle size={10} className="text-emerald-500" /> Complete protocol for onboarding new supply entities
           </p>
        </div>
        <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 group-hover:text-white transition-all ${isExpanding ? 'rotate-180 bg-emerald-600 border-emerald-500 text-white' : ''}`}>
           <Workflow size={24} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800 p-8 pt-10"
          >
            <form onSubmit={handleSubmit} className="space-y-12">
               {/* Core Information */}
               <section className="space-y-6">
                  <div className="flex items-center gap-2 mb-8">
                     <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black flex items-center justify-center border border-emerald-500/20">01</span>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Credentials</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <InputField label="Legal Name (*)" required placeholder="Real Name" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />
                     <InputField label="Electronic Mail" placeholder="email@provider.com" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
                     <InputField label="Mobile Comm Path (*)" required placeholder="+880..." value={formData.mobile} onChange={(v) => setFormData({ ...formData, mobile: v })} />
                     <InputField label="Enterprise/Shop Title" placeholder="Official Shop Name" value={formData.shopName} onChange={(v) => setFormData({ ...formData, shopName: v })} />
                     <InputField label="NIC Identification (*)" required placeholder="NID Number" value={formData.nic} onChange={(v) => setFormData({ ...formData, nic: v })} />
                  </div>
               </section>

               {/* Financial Protocol */}
               <section className="space-y-6 pt-10 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 mb-8">
                     <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black flex items-center justify-center border border-indigo-500/20">02</span>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Protocol</h4>
                  </div>
                  
                  <div className="flex gap-4 mb-8">
                     {(['Bank', 'Bkash', 'Alternative'] as TransactionType[]).map(type => (
                       <button
                         key={type}
                         type="button"
                         onClick={() => setFormData({ ...formData, transactionType: type })}
                         className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                           formData.transactionType === type 
                           ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                           : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                         }`}
                       >
                         {type} Source
                       </button>
                     ))}
                  </div>

                  <AnimatePresence mode="wait">
                     {formData.transactionType === 'Bank' && (
                       <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-950/40 p-6 rounded-[2rem] border border-slate-800/50">
                          <label className="flex flex-col gap-2">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Institution (*)</span>
                             <select 
                               className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-bold"
                               value={formData.bankInfo.bankName}
                               onChange={(e) => setFormData({ ...formData, bankInfo: { ...formData.bankInfo, bankName: e.target.value }})}
                             >
                                <option value="">SELECT BANK</option>
                                {BANK_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                             </select>
                          </label>
                          <InputField label="Account Sequence (*)" placeholder="0000 0000 0000" value={formData.bankInfo.accountNumber} onChange={(v) => setFormData({ ...formData, bankInfo: { ...formData.bankInfo, accountNumber: v }})} />
                          <InputField label="Routing Protocol (*)" placeholder="9-digit code" value={formData.bankInfo.routingNumber} onChange={(v) => setFormData({ ...formData, bankInfo: { ...formData.bankInfo, routingNumber: v }})} />
                          <InputField label="Institution Branch (*)" placeholder="Locality Branch" value={formData.bankInfo.branchName} onChange={(v) => setFormData({ ...formData, bankInfo: { ...formData.bankInfo, branchName: v }})} />
                          <InputField label="Account Beneficiary (*)" placeholder="Owner Name" value={formData.bankInfo.ownerName} onChange={(v) => setFormData({ ...formData, bankInfo: { ...formData.bankInfo, ownerName: v }})} />
                       </motion.div>
                     )}

                     {formData.transactionType === 'Bkash' && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-6 rounded-[2rem] border border-slate-800/50">
                          <InputField label="Bkash Identity (*)" placeholder="+880..." value={formData.mobileWalletInfo.bkashNumber} onChange={(v) => setFormData({ ...formData, mobileWalletInfo: { ...formData.mobileWalletInfo, bkashNumber: v }})} />
                          <div className="flex flex-col gap-2">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Identity Validation</span>
                             <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-500 font-bold italic flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500" /> System will sync owner identity automatically
                             </div>
                          </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </section>

               {/* Verification Node */}
               <section className="space-y-6 pt-10 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 mb-8">
                     <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black flex items-center justify-center border border-emerald-500/20">03</span>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Assets</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-8 border-2 border-dashed border-slate-800 bg-slate-950/50 rounded-[2rem] flex flex-col items-center justify-center text-center group cursor-pointer hover:border-emerald-500/50 transition-all">
                        <Upload className="text-slate-700 mb-4 group-hover:text-emerald-500 transition-colors" size={32} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Business Registration Scan (*)</span>
                        <span className="text-[8px] text-slate-700 uppercase tracking-widest mt-1">PDF / JPEG / PNG MAX 5MB</span>
                     </div>
                     <div className="p-8 border-2 border-dashed border-slate-800 bg-slate-950/50 rounded-[2rem] flex flex-col items-center justify-center text-center group cursor-pointer hover:border-emerald-500/50 transition-all">
                        <Upload className="text-slate-700 mb-4 group-hover:text-emerald-500 transition-colors" size={32} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Address Verification Source (*)</span>
                        <span className="text-[8px] text-slate-700 uppercase tracking-widest mt-1">Must match registration doc</span>
                     </div>
                  </div>
               </section>

               <div className="pt-10">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/20 text-xs"
                  >
                    Authorize Integration
                  </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputField({ label, placeholder, required, value, onChange }: { label: string, placeholder: string, required?: boolean, value: string, onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <input 
        type="text" 
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-slate-800 font-bold tracking-tight"
      />
    </label>
  );
}
