// ============================================================
// CONFIGURACIÓN DE PRODUCCIÓN — Pedidos360
// Se usa automáticamente al compilar con: ng build (production)
// ============================================================
export const environment = {
  production: true,

  msalConfig: {
    // Application (client) ID de la app "Pedidos360-Frontend"
    clientId: 'fc50b5a6-c939-4a31-83c4-02fb87246356',
    // Directory (tenant) ID de tu directorio de Entra ID
    authority: 'https://login.microsoftonline.com/bb5324af-c266-41ed-b36c-a971641c7af2',
    // URL del sitio en GitHub Pages (también registrada como redirect URI SPA en Entra ID)
    redirectUri: 'https://carlitos-a.github.io/pedidos360-frontend/',
  },

  apiConfig: {
    // API Gateway en AWS (valida JWT y enruta a los microservicios en EC2)
    pedidosUri: 'https://4r80bd3omi.execute-api.us-east-1.amazonaws.com',
    productosUri: 'https://4r80bd3omi.execute-api.us-east-1.amazonaws.com',
    // Scope expuesto en la app "Pedidos360-API"
    scopes: ['api://6c685bd4-57e4-4ba3-aa63-c8bd6a00cd4d/pedidos.read'],
  },
};
