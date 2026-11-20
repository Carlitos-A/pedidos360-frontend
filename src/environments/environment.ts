export const environment = {
  production: false,
  // Único API Manager; conserva el gateway ya configurado.
  apiBaseUrl: 'https://4r80bd3omi.execute-api.us-east-1.amazonaws.com',
  msalConfig: {
    clientId: 'fc50b5a6-c939-4a31-83c4-02fb87246356',
    tenantId: 'bb5324af-c266-41ed-b36c-a971641c7af2',
    authority: 'https://login.microsoftonline.com/bb5324af-c266-41ed-b36c-a971641c7af2',
    redirectUri: 'http://localhost:4200/auth/callback',
    postLogoutRedirectUri: 'http://localhost:4200/login',
  },
  apiConfig: {
    scopes: [
      'api://6c685bd4-57e4-4ba3-aa63-c8bd6a00cd4d/pedidos.read',
      'api://6c685bd4-57e4-4ba3-aa63-c8bd6a00cd4d/pedidos.write',
    ],
  },
  reportsPollingMs: 30000,
  healthServices: [
    { key: 'bff', label: 'ms-pedidos360-bff' },
    { key: 'orders', label: 'ms-pedidos360-orders' },
    { key: 'products', label: 'ms-pedidos360-products' },
    { key: 'report', label: 'ms-pedidos360-report' },
    { key: 'audit', label: 'ms-pedidos360-audit' },
  ],
  consoles: { apiManager: '', identity: 'https://entra.microsoft.com', rabbitMq: '', kafka: '' },
  jwtInspectorUrl: 'https://jwt.ms',
};
