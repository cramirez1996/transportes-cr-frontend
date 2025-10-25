import { Component, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserRole } from '../../../core/models/enums/user-role.enum';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  roles?: UserRole[];
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'red' | 'yellow';
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  isOpen = input<boolean>(true);
  userRole = input<UserRole | string>();
  
  // Track expanded menu items
  expandedItems = signal<Set<string>>(new Set());
  
  // Track if "expand all" mode is enabled
  expandAllMode = signal<boolean>(false);
  
  private readonly EXPAND_ALL_KEY = 'sidebar_expand_all_mode';

  constructor(private router: Router) {
    // Load expand all preference from localStorage
    const savedExpandAll = localStorage.getItem(this.EXPAND_ALL_KEY);
    if (savedExpandAll === 'true') {
      this.expandAllMode.set(true);
    }
    
    // Auto-expand parent menus when navigating to child routes
    this.router.events.subscribe(() => {
      this.autoExpandActiveParents();
    });
  }

  ngOnInit(): void {
    this.autoExpandActiveParents();
  }

  adminMenuItems: MenuItem[] = [
    { 
      label: 'Dashboard', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', 
      route: '/admin/dashboard' 
    },
    { 
      label: 'Operaciones', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      children: [
        { 
          label: 'Viajes', 
          icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', 
          route: '/admin/trips' 
        },
        { 
          label: 'Clientes', 
          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', 
          route: '/admin/customers' 
        },
        { 
          label: 'Proveedores', 
          icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', 
          route: '/admin/suppliers' 
        },
      ]
    },
    { 
      label: 'Flota', 
      icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
      children: [
        { 
          label: 'Vehículos', 
          icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2', 
          route: '/admin/fleet' 
        },
        { 
          label: 'Mantenimientos', 
          icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', 
          route: '/admin/fleet/maintenance' 
        },
      ]
    },
    { 
      label: 'Finanzas', 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      children: [
        { 
          label: 'Facturación', 
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 
          route: '/admin/invoicing' 
        },
        { 
          label: 'Contabilidad', 
          icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', 
          route: '/admin/accounting' 
        },
        { 
          label: 'Explorador de Costos', 
          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', 
          route: '/admin/accounting/cost-explorer' 
        },
      ]
    },
    { 
      label: 'Documentos', 
      icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', 
      route: '/admin/documents' 
    },
    { 
      label: 'Personal', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      children: [
        { 
          label: 'Empleados', 
          icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 
          route: '/admin/hr' 
        },
        { 
          label: 'Usuarios', 
          icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', 
          route: '/admin/users' 
        },
        { 
          label: 'Roles y Permisos', 
          icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', 
          route: '/admin/roles' 
        },
      ]
    },
    { 
      label: 'Reportes', 
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 
      route: '/admin/reports' 
    }
  ];

  customerMenuItems: MenuItem[] = [
    { 
      label: 'Dashboard', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', 
      route: '/portal/dashboard' 
    },
    { 
      label: 'Mis Viajes', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', 
      route: '/portal/service-history' 
    },
    { 
      label: 'Seguimiento', 
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', 
      route: '/portal/tracking' 
    },
    { 
      label: 'Solicitudes', 
      icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', 
      route: '/portal/requests' 
    },
    { 
      label: 'Documentos', 
      icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', 
      route: '/portal/documents' 
    }
  ];

  get menuItems(): MenuItem[] {
    const role = this.userRole();
    return role === UserRole.CUSTOMER ? this.customerMenuItems : this.adminMenuItems;
  }

  toggleMenuItem(item: MenuItem): void {
    if (!item.children || !this.isOpen()) return;
    
    const expanded = this.expandedItems();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(item.label)) {
      newExpanded.delete(item.label);
    } else {
      newExpanded.add(item.label);
    }
    
    this.expandedItems.set(newExpanded);
  }

  isExpanded(item: MenuItem): boolean {
    // If expand all mode is enabled, all items with children are expanded
    if (this.expandAllMode() && item.children && item.children.length > 0) {
      return true;
    }
    return this.expandedItems().has(item.label);
  }

  toggleExpandAll(): void {
    const newExpandAllMode = !this.expandAllMode();
    this.expandAllMode.set(newExpandAllMode);
    
    // Save preference to localStorage
    localStorage.setItem(this.EXPAND_ALL_KEY, String(newExpandAllMode));
    
    if (newExpandAllMode) {
      // Expand all menus with children
      const allParents = new Set<string>();
      this.menuItems.forEach(item => {
        if (item.children && item.children.length > 0) {
          allParents.add(item.label);
        }
      });
      this.expandedItems.set(allParents);
    } else {
      // Collapse all, but keep active parents expanded
      this.autoExpandActiveParents();
    }
  }

  getExpandAllTooltip(): string {
    return this.expandAllMode() 
      ? 'Menús expandidos - Click para colapsar todos' 
      : 'Menús colapsados - Click para expandir todos';
  }

  isActive(route: string | undefined): boolean {
    if (!route) return false;
    
    const currentUrl = this.router.url.split('?')[0]; // Remove query params
    const routePath = route.split('?')[0];
    
    // Exact match
    if (currentUrl === routePath) return true;
    
    // Check if current URL is a child route (has more segments)
    // But don't match if this route is a parent of the current URL
    if (currentUrl.startsWith(routePath + '/')) {
      return false; // This is a parent route, not the active one
    }
    
    return false;
  }

  isParentActive(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => child.route && this.isActive(child.route));
  }

  private autoExpandActiveParents(): void {
    const expanded = new Set<string>();
    
    this.menuItems.forEach(item => {
      if (item.children && this.isParentActive(item)) {
        expanded.add(item.label);
      }
    });
    
    this.expandedItems.set(expanded);
  }
}
