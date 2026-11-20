import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
} from '@azure/msal-browser';
import {
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MsalInterceptor,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
  ProtectedResourceScopes,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
} from '@azure/msal-angular';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { ApiErrorInterceptor } from './core/interceptors/api-error.interceptor';

// Instancia principal de MSAL (apunta a tu tenant de Entra ID)
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msalConfig.clientId,
      authority: environment.msalConfig.authority,
      redirectUri: environment.msalConfig.redirectUri,
      postLogoutRedirectUri: environment.msalConfig.postLogoutRedirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
  });
}

// Configuración del Guard: qué scopes pedir al proteger rutas
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [environment.apiConfig.scopes[0]],
    },
    loginFailedRoute: '/login',
  };
}

// Configuración del Interceptor: adjunta el JWT solo a las llamadas al API
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<ProtectedResourceScopes>>();
  const [read, write] = environment.apiConfig.scopes;
  protectedResourceMap.set(
    `${environment.apiBaseUrl.replace(/\/$/, '')}/api/*`,
    [
      { httpMethod: 'GET', scopes: [read] },
      { httpMethod: 'POST', scopes: [write] },
      { httpMethod: 'PUT', scopes: [write] },
      { httpMethod: 'PATCH', scopes: [write] },
      { httpMethod: 'DELETE', scopes: [write] },
    ],
  );

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
    MsalService,
    { provide: HTTP_INTERCEPTORS, useClass: ApiErrorInterceptor, multi: true },
    MsalGuard,
    MsalBroadcastService,
  ],
};
