import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/guards';
import { LayoutComponent } from './shared/layout/layout.component';
import { LoginComponent } from './features/auth/login.component';
import { AuthCallbackComponent } from './features/auth/auth-callback.component';
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [authGuard],
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders.component').then((m) => m.OrdersComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin', 'Cliente'] },
      },
      {
        path: 'orders/new',
        loadComponent: () =>
          import('./features/orders/order-detail.component').then((m) => m.OrderDetailComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/order-detail.component').then((m) => m.OrderDetailComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin', 'Cliente'] },
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/catalog/catalog.component').then((m) => m.CatalogComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin', 'Cliente'] },
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
        canActivate: [authGuard],
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/audit/audit.component').then((m) => m.AuditComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'evidence',
        loadComponent: () =>
          import('./features/evidence/evidence.component').then((m) => m.EvidenceComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin'] },
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: 'pedidos', redirectTo: 'orders' },
  { path: 'productos', redirectTo: 'catalog' },
  { path: 'perfil', redirectTo: 'profile' },
  { path: '**', redirectTo: 'dashboard' },
];
