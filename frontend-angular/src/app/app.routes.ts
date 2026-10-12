import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/session.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'vault' },
  {
    // Accesso e registrazione: pagina a due colonne, solo per chi non ha una sessione.
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        title: 'Accedi',
        loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
      },
      {
        path: 'registrazione',
        title: 'Crea il tuo account',
        loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
      },
    ],
  },
  {
    // Area con sessione: barra superiore + vault e account.
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: 'vault',
        title: 'Le tue password',
        loadComponent: () => import('./features/vault/vault-page').then((m) => m.VaultPage),
      },
      {
        path: 'account',
        title: 'Account',
        loadComponent: () => import('./features/account/account-page').then((m) => m.AccountPage),
      },
    ],
  },
  { path: '**', redirectTo: 'vault' },
];
