import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { Home } from './home/home';
import { Pedidos } from './pedidos/pedidos';
import { Productos } from './productos/productos';
import { Perfil } from './perfil/perfil';

export const routes: Routes = [
  { path: '', component: Home },
  // Rutas protegidas: exigen sesión iniciada (la pauta evalúa los guards)
  { path: 'pedidos', component: Pedidos, canActivate: [MsalGuard] },
  { path: 'productos', component: Productos, canActivate: [MsalGuard] },
  { path: 'perfil', component: Perfil, canActivate: [MsalGuard] },
  { path: '**', redirectTo: '' },
];
