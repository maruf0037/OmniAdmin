import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  LayoutDashboard, 
  CheckSquare, 
  Layers, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Box, 
  User as UserIcon, 
  Bell, 
  Briefcase, 
  ChevronDown, 
  ChevronUp, 
  ShoppingCart, 
  BarChart3, 
  Users2, 
  PackageSearch, 
  ClipboardList,
  FolderLock
} from 'lucide-react';
import { auth, db } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';

import TasksView from './components/TasksView';
import ModulesManagerView from './components/ModulesManagerView';
import CustomModuleView from './components/CustomModuleView';
import ProjectsView from './components/ProjectsView';
import InventoryView from './components/InventoryView';
import SettingsView from './components/SettingsView';
import { SYSTEM_MODULES } from './constants';

// --- Types ---
interface ModuleConfig {
  id: string;
  name: string;
  icon: string;
  fields: { name: string, label: string, type: 'text' | 'number' | 'boolean' | 'date' }[];
  createdBy: string;
}

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  collapsed 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  collapsed: boolean,
  key?: React.Key
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`}
    id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <Icon size={20} className={active ? 'text-white' : 'group-hover:text-slate-200'} />
    {!collapsed && <span className="font-medium tracking-tight text-sm uppercase">{label}</span>}
  </button>
);

const SubItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-indigo-600/10 text-indigo-400' 
        : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
    }`}
  >
    <Icon size={14} className={active ? 'text-indigo-400' : 'group-hover:text-slate-300'} />
    <span className="font-bold text-[10px] uppercase tracking-wider">{label}</span>
  </button>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const [customModules, setCustomModules] = useState<ModuleConfig[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoginError(null);
        // Sync user profile
        const userDoc = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDoc);
          if (!docSnap.exists()) {
            await setDoc(userDoc, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: 'user',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'modules'), where('createdBy', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModuleConfig));
      setCustomModules(mods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'modules');
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoginError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setLoginError("Login popup was closed. Please try again and ensure popups are allowed.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError("Domain unauthorized. If you just set up Firebase, whitelist this URL in the Firebase Console (Authentication > Settings > Authorized Domains).");
      } else if (error.code === 'auth/internal-error' || error.code === 'auth/network-request-failed') {
        setLoginError("Connection issues detected. Please check your internet and try again.");
      } else {
        setLoginError(`System error: ${error.message?.slice(0, 100) || 'Unknown protocol failure'}. Code: ${error.code || 'ERR_AUTH'}`);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 font-sans">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 font-sans p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 p-12 rounded-[2rem] shadow-2xl text-center max-w-md w-full border border-slate-800 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Layers size={120} />
          </div>
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Layers size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">OmniAdmin</h1>
          <p className="text-slate-400 mb-8 font-medium">Your modular mission control for everything.</p>
          
          <AnimatePresence>
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium leading-relaxed"
              >
                {loginError}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-3"
            id="login-button"
          >
            Connect with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <motion.nav 
        animate={{ width: sidebarCollapsed ? 80 : 260 }}
        className="bg-slate-900/50 border-r border-slate-800 flex flex-col pt-8 pb-4 relative z-20"
      >
        <div className="px-6 mb-12 flex items-center justify-between">
          {!sidebarCollapsed && (
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold tracking-tight text-white flex items-center gap-2"
            >
              <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-[10px]">O.</div>
              OmniAdmin
            </motion.h2>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-200 transition-colors border border-slate-800"
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <div className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            collapsed={sidebarCollapsed}
          />
          <SidebarItem 
            icon={CheckSquare} 
            label="Work Queue" 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')}
            collapsed={sidebarCollapsed}
          />
          <div className="pt-8 pb-2 px-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Strategy Nodes</p>
          </div>

          <SidebarItem 
            icon={FolderLock} 
            label="Project Archive" 
            active={activeTab === 'projects'} 
            onClick={() => setActiveTab('projects')}
            collapsed={sidebarCollapsed}
          />

          <div className="pt-6 pb-2 px-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Matrix Modules</p>
          </div>

          <SidebarItem 
            icon={Layers} 
            label="Module Manager" 
            active={activeTab === 'modules'} 
            onClick={() => setActiveTab('modules')}
            collapsed={sidebarCollapsed}
          />

          {/* Inventory Module with Submenu - Grouped under Modules */}
          <div className="space-y-1">
            <button
              onClick={() => {
                if (sidebarCollapsed) {
                   setSidebarCollapsed(false);
                   setInventoryExpanded(true);
                } else {
                   setInventoryExpanded(!inventoryExpanded);
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab.startsWith('inventory-') 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className={activeTab.startsWith('inventory-') ? 'text-indigo-400' : 'group-hover:text-slate-200'} />
                {!sidebarCollapsed && <span className="font-bold text-[10px] uppercase tracking-[0.1em]">Inventory Ops</span>}
              </div>
              {!sidebarCollapsed && (
                inventoryExpanded ? <ChevronUp size={14} className="text-slate-700" /> : <ChevronDown size={14} className="text-slate-700" />
              )}
            </button>

            <AnimatePresence>
              {inventoryExpanded && !sidebarCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pl-4 space-y-1 overflow-hidden"
                >
                  {SYSTEM_MODULES.map(sm => (
                    <SubItem 
                      key={sm.id}
                      icon={sm.icon} 
                      label={sm.name.replace('Inventory ', '')} 
                      active={activeTab === `inventory-${sm.subTab}`} 
                      onClick={() => setActiveTab(`inventory-${sm.subTab}`)} 
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="py-4">
            {!sidebarCollapsed && (
              <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-2">Custom</p>
            )}
            {customModules.map(mod => (
              <SidebarItem 
                key={mod.id}
                icon={Box} 
                label={mod.name} 
                active={activeTab === `mod-${mod.id}`} 
                onClick={() => setActiveTab(`mod-${mod.id}`)}
                collapsed={sidebarCollapsed}
              />
            ))}
            <button
               onClick={() => setActiveTab('modules')} 
               className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-400 transition-colors group"
            >
               <Plus size={16} />
               {!sidebarCollapsed && <span className="text-xs font-bold uppercase tracking-wider group-hover:text-slate-300">New Module</span>}
            </button>
          </div>
        </div>

        <div className="px-3 pt-4 border-t border-slate-800 mt-auto">
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            collapsed={sidebarCollapsed}
          />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="font-medium text-sm uppercase tracking-tight">Logout</span>}
          </button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {activeTab === 'dashboard' ? 'Overview' : activeTab}
            </h3>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-500 hover:text-slate-200 transition-colors relative p-2 bg-slate-900 border border-slate-800 rounded-xl">
               <Bell size={18} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-950"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-none">{user.displayName || 'User'}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Admin Access</p>
              </div>
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 p-0.5"
                alt="Profile"
              />
            </div>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="h-full"
             >
                {/* Content will be injected here via sub-components */}
                {activeTab === 'dashboard' && <DashboardView user={user} modules={customModules} setActiveTab={setActiveTab} />}
                {activeTab === 'tasks' && <TasksView user={user} />}
                {activeTab === 'modules' && (
                  <ModulesManagerView 
                    user={user} 
                    onSelectModule={(id) => {
                      if (id.startsWith('inventory-')) {
                        setActiveTab(id);
                        setInventoryExpanded(true);
                      } else {
                        setActiveTab(`mod-${id}`);
                      }
                    }} 
                  />
                )}
                {activeTab === 'projects' && <ProjectsView user={user} />}
                {activeTab.startsWith('inventory-') && <InventoryView user={user} subTab={activeTab.replace('inventory-', '')} />}
                {activeTab.startsWith('mod-') && <CustomModuleView user={user} moduleId={activeTab.replace('mod-', '')} />}
                {activeTab === 'settings' && <SettingsView user={user} />}
             </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// --- Dashboard View (Local for now or move to file) ---

function DashboardView({ user, modules, setActiveTab }: { user: User, modules: ModuleConfig[], setActiveTab: (t: string) => void }) {
  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-4 h-full">
      {/* Main Core Card */}
      <div className="col-span-2 row-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-indigo-400">
          <Layers size={240} className="stroke-[0.5]" />
        </div>
        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">System Intelligence</h3>
        <div className="flex items-end gap-2 mb-10">
          <span className="text-7xl font-bold text-white tracking-tighter leading-none">98.2</span>
          <span className="text-indigo-400 text-xl font-medium mb-1 tracking-tight">% Efficiency</span>
        </div>
        
        <div className="space-y-6 max-w-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Module Synapse</span>
            <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '92%' }}
                transition={{ duration: 1 }}
                className="h-full bg-emerald-500" 
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cloud Latency</span>
            <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '18%' }}
                transition={{ duration: 1 }}
                className="h-full bg-indigo-500" 
              />
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4">
          <button 
            onClick={() => setActiveTab('modules')}
            className="p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all text-left group/btn"
          >
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Architecture</span>
            <span className="text-lg font-bold group-hover:text-indigo-400 flex items-center gap-2">Craft Modules <Plus size={14} /></span>
          </button>
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Status</span>
            <span className="text-lg font-bold text-emerald-400 flex items-center gap-2">Online <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /></span>
          </div>
        </div>
      </div>

      {/* Active Modules Grid */}
      <div className="col-span-1 row-span-1 bg-slate-900 border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between">
        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Active Modules</h3>
        <div className="space-y-3 mt-4">
          {modules.slice(0, 3).map((mod, idx) => (
            <div key={mod.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                idx % 2 === 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {mod.name.slice(0, 3).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-300">{mod.name}</span>
            </div>
          ))}
          {modules.length === 0 && <p className="text-xs text-slate-600 italic">No custom extensions.</p>}
        </div>
      </div>

      {/* Alerts/Notifications */}
      <div className="col-span-1 row-span-1 bg-indigo-600 rounded-[2rem] p-6 text-white flex flex-col justify-between group cursor-pointer hover:bg-indigo-500 transition-colors shadow-xl shadow-indigo-600/20">
        <Bell className="w-6 h-6 stroke-[2.5] text-white/80 group-hover:scale-110 transition-transform" />
        <div>
          <p className="text-4xl font-bold tracking-tighter">04</p>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 mt-1">Pending Updates</p>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="col-span-2 row-span-1 bg-slate-900 border border-slate-800 rounded-[2rem] p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Work Capacity</h3>
            <p className="text-3xl font-bold tracking-tight text-white">Execution Overdrive</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-1 rounded-md font-bold border border-emerald-500/20 uppercase tracking-tighter">Peak Load</div>
        </div>
        <div className="mt-8 flex items-end gap-1.5 h-16">
          {[40, 60, 30, 90, 50, 70, 45, 60, 80, 20].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05 }}
              className={`w-full rounded-t-lg ${i === 8 ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50' : 'bg-slate-800'}`}
            />
          ))}
        </div>
      </div>

      {/* Quick Access Card */}
      <div className="col-span-1 row-span-1 bg-slate-900 border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between">
        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Quick Access</h3>
        <div className="mt-4 flex -space-x-3">
          <div className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold ring-1 ring-slate-800">JD</div>
          <div className="w-10 h-10 rounded-full border-4 border-slate-900 bg-indigo-600 flex items-center justify-center text-xs font-bold ring-1 ring-slate-800">AI</div>
          <div className="w-10 h-10 rounded-full border-4 border-slate-900 bg-emerald-600 flex items-center justify-center text-xs font-bold ring-1 ring-slate-800">OM</div>
        </div>
        <p className="text-xs text-slate-400 mt-4 leading-relaxed">Collaborative mode active for 3 nodes.</p>
      </div>

      {/* System Identity */}
      <div className="col-span-1 row-span-1 border-2 border-dashed border-slate-800 bg-slate-950/40 rounded-[2rem] p-6 flex flex-col items-center justify-center group cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all">
        <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center mb-3 text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/50 transition-colors">
          <Plus size={20} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Custom Widget</p>
        <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-tighter">Extend Interface</p>
      </div>
    </div>
  );
}

