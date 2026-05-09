import React from 'react';
import { User } from 'firebase/auth';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Package, Truck, Repeat, AlertTriangle } from 'lucide-react';

const data = [
  { name: 'Mon', transactions: 4000, revenue: 2400 },
  { name: 'Tue', transactions: 3000, revenue: 1398 },
  { name: 'Wed', transactions: 2000, revenue: 9800 },
  { name: 'Thu', transactions: 2780, revenue: 3908 },
  { name: 'Fri', transactions: 1890, revenue: 4800 },
  { name: 'Sat', transactions: 2390, revenue: 3800 },
  { name: 'Sun', transactions: 3490, revenue: 4300 },
];

export default function InventoryDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Inventory Intelligence</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-500">
           LAST SYNCHRONIZED: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Stock Value', value: '৳2.4M', icon: Package, color: 'text-indigo-400', trend: '+12%', up: true },
          { label: 'Active Suppliers', value: '48', icon: Truck, color: 'text-emerald-400', trend: '+2', up: true },
          { label: 'Stock Turns', value: '4.2', icon: Repeat, color: 'text-orange-400', trend: '-0.5', up: false },
          { label: 'Low Stock Alerts', value: '12', icon: AlertTriangle, color: 'text-red-400', trend: 'CRITICAL', up: false },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-950 border border-slate-900 p-6 rounded-[2rem] flex flex-col justify-between group hover:border-slate-800 transition-all">
            <div className="flex items-start justify-between mb-4">
               <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 ${stat.color}`}>
                  <stat.icon size={20} />
               </div>
               <span className={`text-[10px] font-black uppercase ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>
                 {stat.trend}
               </span>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">{stat.label}</p>
               <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-950 border border-slate-900 rounded-[2.5rem] p-8">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8">Supply Chain Flux (Mon-Sun)</h3>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                       contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="transactions" stroke="#10b981" fill="transparent" strokeDasharray="5 5" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-[2.5rem] p-8">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8">Stock Distribution</h3>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                    <Bar dataKey="transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-slate-950 border border-slate-900 rounded-[2.5rem] overflow-hidden">
         <div className="p-8 border-b border-slate-900 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Recent Transactions</h3>
            <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Export Ledger</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-900 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                     <th className="px-8 py-4">Ref ID</th>
                     <th className="px-8 py-4">Entity</th>
                     <th className="px-8 py-4">Action</th>
                     <th className="px-8 py-4">Value</th>
                     <th className="px-8 py-4">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-900 text-xs text-slate-300 font-mono">
                  {[
                    { id: 'TX-9082', entity: 'Metro Fashion', action: 'STOCK IN', val: '৳45,000', status: 'COMPLETE' },
                    { id: 'TX-9081', entity: 'Alpha Logics', action: 'TRANSFER', val: 'N/A', status: 'PENDING' },
                    { id: 'TX-9080', entity: 'Blue Chip Co', action: 'PROCURE', val: '৳120,400', status: 'COMPLETE' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                       <td className="px-8 py-5 text-indigo-400">{row.id}</td>
                       <td className="px-8 py-5 font-sans font-bold">{row.entity}</td>
                       <td className="px-8 py-5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                            row.action === 'STOCK IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
                          }`}>{row.action}</span>
                       </td>
                       <td className="px-8 py-5 tracking-tighter">{row.val}</td>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-1.5">
                             <div className={`w-1 h-1 rounded-full ${row.status === 'COMPLETE' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{row.status}</span>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
