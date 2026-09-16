
export const environment = {
  production: false,

  msalConfig: {
    // Application (client) ID de la app "Pedidos360-Frontend"
    clientId: 'fc50b5a6-c939-4a31-83c4-02fb87246356',
    // Directory (tenant) ID de tu directorio de Entra ID
    authority: 'https://login.microsoftonline.com/bb5324af-c266-41ed-b36c-a971641c7af2',
    redirectUri: 'http://localhost:4200',
  },

  apiConfig: {
    // URL del API: en local apunta al pedidos-service (Spring Boot).
    // Cuando despliegues, se reemplaza por la URL del API Gateway.
    uri: 'http://localhost:8081',
    // Scope expuesto en la app "Pedidos360-API" (Expose an API)
    scopes: ['api://6c685bd4-57e4-4ba3-aa63-c8bd6a00cd4d/pedidos.read'],
  },
};
