import { 
  BarChart3, 
  Users2, 
  PackageSearch, 
  ClipboardList,
  ShoppingCart
} from 'lucide-react';

export interface SystemModule {
  id: string;
  name: string;
  description: string;
  icon: any;
  subTab: string;
}

export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 'inv-dashboard',
    name: 'Inventory Dashboard',
    description: 'Real-time supply chain analytics and financial flux graphs.',
    icon: BarChart3,
    subTab: 'dashboard'
  },
  {
    id: 'inv-suppliers',
    name: 'Supplier Ecosystem',
    description: 'Protocol for managing partner identities and transaction nodes.',
    icon: Users2,
    subTab: 'suppliers'
  },
  {
    id: 'inv-products',
    name: 'Product Architecture',
    description: 'Master matrix of inventory units and style variants.',
    icon: PackageSearch,
    subTab: 'products'
  },
  {
    id: 'inv-stock',
    name: 'Stock Vector Engine',
    description: 'Vatuation tracking and physical quantity synchronization.',
    icon: ClipboardList,
    subTab: 'stock'
  }
];
