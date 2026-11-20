# Pedidos360 — Frontend

Aplicación Angular 22 para gestión de pedidos, catálogo, reportes y auditoría con Microsoft Entra ID. Usa el access token de MSAL para consumir una única URL de API Manager.

Los app roles válidos son `Admin` y `Cliente`. En pantalla, `Cliente` se muestra como **Customer**. Admin reúne también las tareas operativas; solo Admin puede crear pedidos. El backend debe filtrar por propietario los pedidos de Customer.

Al crear un pedido, Admin selecciona productos asignados al Cliente. El total
del formulario es provisional: el backend valida precio y stock, reserva las
unidades y devuelve el total CLP definitivo. La solicitud incluye un UUID
`requestId` para que un reintento no descuente stock dos veces. PUT envía
`expectedVersion` y conserva el estado; PATCH cambia el estado.
La sesión y GET solicitan `pedidos.read`; POST, PUT, PATCH y DELETE solicitan
`pedidos.write` al llamar a la API. Entra debe exponer y conceder ese scope a
la SPA antes de desplegar esta configuración de frontend.
El historial muestra el estado anterior y el nuevo cuando el servidor los
registró. Los pedidos antiguos sin eventos siguen indicando que no hay historial.

## Desarrollo

```bash
npm install
npm start
```

Registrar `http://localhost:4200/auth/callback` como redirect URI SPA en Entra ID. Configurar `apiBaseUrl`, IDs, scopes, URLs de consolas y servicios de health en [`src/environments/environment.ts`](src/environments/environment.ts) y su variante de producción. MSAL gestiona su caché.

```bash
npm test -- --watch=false
npm run build
```

Las rutas y los pasos de prueba por rol están en [ROUTES_AND_TESTING.md](ROUTES_AND_TESTING.md). Los contratos, migraciones y cambios necesarios en el backend están en [TODO.md](TODO.md). Los endpoints nuevos pueden fallar hasta que API Manager/BFF y los servicios de reportes y auditoría los implementen.
