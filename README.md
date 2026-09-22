# Pedidos360 — Frontend

Frontend Angular del sistema Pedidos360 (EP1 · DSY1107). Interfaz para gestión
de pedidos y productos, consumiendo los microservicios Spring Boot del
[backend](https://github.com/Carlitos-A/pedidos360-backend) mediante API REST.

## Funcionalidades

- **Catálogo de productos** — listado de `productos-service` (puerto 8082).
- **Pedidos** — creación y listado de pedidos contra `pedidos-service` (puerto 8081).
- **Autenticación con Microsoft Entra ID** — inicio de sesión con cuentas
  organizacionales; el frontend obtiene el JWT y lo envía en cada request.
- **Autorización por rol** — la UI adapta las acciones según el rol del
  usuario (`Admin` / `Cliente`): ver y crear según permisos.

## Tecnologías

- Angular 22
- TypeScript

## Estructura

```text
src/app/
├─ home/         # Página principal
├─ pedidos/      # Módulo de pedidos
├─ productos/    # Módulo de productos
├─ perfil/       # Perfil del usuario autenticado
├─ services/     # Servicios HTTP y de autenticación
├─ models/       # Modelos de datos
└─ environments/ # Configuración por ambiente
```

## Requisitos

- Node.js LTS
- Backend de Pedidos360 corriendo (ver repositorio del backend)

## Configuración

1. Instalar dependencias: `npm install`
2. En `src/environments/environment.ts`, configurar los IDs de la aplicación
   de Microsoft Entra ID (client ID, tenant/authority) y las URLs de los
   servicios backend.

## Ejecutar

```bash
ng serve
```

La aplicación queda disponible en `http://localhost:4200/` (CORS ya habilitado
en el backend para ese origen).

## Tests

```bash
ng test    # unitarios (Vitest)
ng e2e     # end-to-end
```
