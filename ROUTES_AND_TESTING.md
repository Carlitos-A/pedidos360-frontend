# Rutas y prueba por rol

| Ruta             | Acceso                     | Qué muestra                                       |
| ---------------- | -------------------------- | ------------------------------------------------- |
| `/login`         | Público                    | Entrada con Microsoft                             |
| `/auth/callback` | Público                    | Procesamiento de redirect MSAL                    |
| `/dashboard`     | Autenticado                | Admin: métricas y operación; Cliente: sus pedidos |
| `/orders`        | Admin, Cliente             | Admin: todos; Cliente: solo sus pedidos           |
| `/orders/new`    | Admin                      | Crear pedido                                      |
| `/orders/:id`    | Admin, Cliente propietario | Admin: editar y cambiar estado; Cliente: lectura  |
| `/catalog`       | Admin                      | Lista y gestión de productos/stock                |
| `/reports`       | Admin                      | KPIs y gráficos con refresco cada 30 s            |
| `/audit`         | Admin                      | Timeline filtrable de eventos                     |
| `/evidence`      | Admin                      | Claims, health, pruebas JWT y consolas            |
| `/profile`       | Autenticado                | Datos de identidad y roles del access token       |

`/`, rutas desconocidas y las antiguas `/pedidos`, `/productos`, `/perfil` redirigen a las rutas nuevas. Todas las vistas privadas usan `authGuard`; las restringidas además `roleGuard` con `data.roles`. Si falta el rol, la navegación se cancela y se muestra «No tienes permisos para ver esa sección» sin redirección. Se muestran solo dos roles de aplicación: `Admin` y `Cliente`; el chip de `Cliente` dice **Customer**. El contenido de Operator del mockup se integra en Admin y no hay rol Operator.

Para probar localmente, ejecutar `npm install` y `npm start`, abrir `http://localhost:4200/login` y registrar **antes** `http://localhost:4200/auth/callback` como redirect URI SPA en Microsoft Entra ID. Configurar la URL del API Manager y CORS según `TODO.md`. El frontend no incluye una cuenta ficticia ni cambia roles manualmente.

1. Asignar `Admin` a un usuario de prueba en los app roles de la API de Entra ID; iniciar sesión y comprobar menú completo, creación/edición/cambio de estado, catálogo, reportes, auditoría y evidencias. Si también tiene `Cliente`, prevalece Admin.
2. Asignar solo `Cliente` a otro usuario, con `oid`/`tid` asociados a pedidos reales. Verificar que el chip diga **Customer**, que el menú solo tenga Dashboard, Pedidos y Mi perfil, que no aparezca «Nuevo pedido» ni controles de edición y que el BFF nunca entregue pedidos de otros usuarios. Abrir `/reports` directamente y comprobar el aviso de permisos sin cambio de ruta.
3. Para probar el caso sin rol, usar una cuenta autenticada sin app role y comprobar que no recibe acceso a pedidos/catálogo/reportes/auditoría/evidencias. `Operator` o `Customer` como valores de token no conceden permisos.
4. En Evidencias, ejecutar los cuatro casos de JWT con un usuario Admin y un token realmente expirado para el cuarto. Confirmar 200/401/401/401 únicamente cuando el API Manager esté disponible. La UI no afirma que un error de red sea 401.

Checks locales sin backend: `npm test -- --watch=false`, `npm run build`. La compilación valida la app; las pruebas cubren roles del access token, aislamiento de pedidos, estados, interceptores y pruebas JWT. La prueba de extremo a extremo con Entra ID/API Manager depende de completar `TODO.md`.
