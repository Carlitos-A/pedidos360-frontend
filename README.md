# Pedidos360 — Frontend

Aplicación Angular 22 para gestión de pedidos, catálogo, reportes y auditoría con Microsoft Entra ID. Usa el access token de MSAL para consumir una única URL de API Manager.

Los app roles válidos son `Admin` y `Cliente`. En pantalla, `Cliente` se muestra como **Customer**. Admin reúne también las tareas operativas; solo Admin puede crear pedidos. El backend debe filtrar por propietario los pedidos de Customer.

Cada Cliente se registra al abrir una ruta protegida: la SPA envía su access
token a `POST /api/customers/me` con `pedidos.read`. El servidor guarda la
identidad del JWT para que Admin pueda seleccionarla al crear un pedido. El
Cliente debe ingresar al menos una vez antes de aparecer en la búsqueda. No
se requiere una aplicación confidencial ni permisos de Microsoft Graph.

Al crear un pedido, Admin selecciona productos asignados al Cliente. El total
del formulario es provisional: el backend valida precio y stock, reserva las
unidades y devuelve el total CLP definitivo. La solicitud incluye un UUID
`requestId` para que un reintento no descuente stock dos veces. PUT envía
`expectedVersion` y conserva el estado; PATCH cambia el estado.
La sesión y GET solicitan `pedidos.read`; POST, PUT, PATCH y DELETE solicitan
`pedidos.write` al llamar a la API, excepto el registro propio anterior. Entra debe exponer y conceder ese scope a
la SPA antes de desplegar esta configuración de frontend.
El historial muestra el estado anterior y el nuevo cuando el servidor los
registró. Los pedidos antiguos sin eventos siguen indicando que no hay historial.

## Desarrollo

```bash
npm install
npm start
```

Registrar `http://localhost:4200/auth/callback` como redirect URI SPA en Entra ID.
Copiar [`.env.local.example`](.env.local.example) a `.env.local` y completar sus
cinco valores públicos. `npm start`, `npm test` y `npm run build` generan los
archivos de `src/environments` antes de ejecutar Angular. No poner secretos en
`.env.local`: los valores de la SPA se incluyen en el JavaScript publicado.
`API_GATEWAY_URL` es la raíz HTTPS del gateway, sin `/api`; la aplicación agrega
`/api/*`. `ENTRA_API_APP_ID_URI` es el identificador de la API, del cual se
forman `pedidos.read` y `pedidos.write`. Para el sitio actual en GitHub Pages,
`SPA_BASE_URL=https://carlitos-a.github.io/pedidos360-frontend` (sin barra final).
Para `npm run build`, `SPA_BASE_URL` debe ser HTTPS; el valor localhost del
ejemplo sirve solo para `npm start` y `npm test`.

El workflow de AWS lee esas mismas cinco claves desde **Repository
variables** y publica el build en un bucket S3 privado detrás de CloudFront.
También requiere `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `S3_BUCKET` y
`CLOUDFRONT_DISTRIBUTION_ID` como variables del repositorio. El rol se asume
con OIDC de GitHub y debe confiar solo en `main` de este repositorio. Configure
CloudFront con OAC, `index.html` como objeto raíz y respuestas 403/404 hacia
`/index.html` con HTTP 200 para rutas internas de Angular. El job se omite
hasta que estén configuradas las cuatro variables de AWS; una vez configuradas,
las cinco variables públicas son obligatorias. La URL
del gateway, los IDs de Entra y los scopes son configuración pública; las claves
de bases de datos, RabbitMQ y servicios internos permanecen solo en el
backend. MSAL gestiona su caché.

```bash
npm test -- --watch=false
npm run build
```

Las rutas y los pasos de prueba por rol están en [ROUTES_AND_TESTING.md](ROUTES_AND_TESTING.md). Los contratos, migraciones y cambios necesarios en el backend están en [TODO.md](TODO.md). Los servicios de reportes y auditoría ya están en el backend; las rutas del API Gateway y los recursos AWS se configurarán al desplegar.
