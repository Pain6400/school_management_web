# School Management System

Plataforma integral de gestión escolar (front-end) construida con **Next.js 16** (App Router),
**React 19**, **TypeScript** y **Tailwind CSS 4**. La aplicación consume una API REST escolar
existente a través de un cliente HTTP centralizado y provee dashboards diferenciados por rol
(administrador, escuela, profesor, estudiante).

## Características

- **Autenticación JWT** con store de Zustand: decodificación segura del token, manejo de expiración,
  persistencia en `localStorage` y cookie de sesion (`SameSite=Lax`).
- **Rutas protegidas por rol** mediante middleware y layouts de dashboard
  (`(admin)`, `(school)`, `(teacher)`, `(student)`).
- **Módulo académico**: años académicos, períodos académicos, grados, aulas, cursos y clases
  (horarios, cupo, profesor, grado, aula y año académico).
- **Gestión de estudiantes**: matrículas / inscripciones y CRUD de estudiantes (incluye upload
  de perfil por `FormData`).
- **Módulo docente**: asignaciones, asistencia y calificaciones.
- **Módulo financiero**: facturas (`invoices`), pagos y conceptos de pago.
- **Comunicaciones**: anuncios escolares.
- **Componentes UI reutilizables** sobre `@base-ui/react` y `lucide-react`: sidebar, tabs,
  tablas, formularios (con `react-hook-form` + `zod`), dialogs, sheets y dropdowns.

## Tecnologías

| Tecnología | Uso |
|---|---|
| Next.js 16 | Framework, App Router, enrutamiento por grupos de ruta |
| React 19 | Interfaz de usuario |
| TypeScript | Tipado estricto |
| Tailwind CSS 4 + `@tailwindcss/postcss` | Estilos |
| Zustand | Estado global (autenticación) |
| react-hook-form + zod | Validación de formularios |
| `@hookform/resolvers` | Resolvedores de validación |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Utilidades de estilos |
| `lucide-react` | Iconos |

## Estructura del proyecto

```
school_management_web/
├── public/                 # Assets estáticos
├── src/
│   ├── app/                # Rutas de la aplicación (App Router)
│   │   ├── (auth)/login/   # Pantalla de inicio de sesión
│   │   ├── (dashboard)/    # Dashboards por rol
│   │   │   ├── admin/
│   │   │   ├── school/     # Académico, estudiantes, finanzas, anuncios
│   │   │   ├── teacher/    # Asignaciones, asistencia, calificaciones
│   │   │   └── student/
│   │   ├── layout.tsx      # Layout raíz (fuentes, metadatos)
│   │   └── page.tsx        # Redirige a /login
│   ├── components/         # Componentes UI reutilizables
│   ├── hooks/              # Hooks personalizados (ej. use-mobile)
│   ├── lib/
│   │   ├── api-client.ts   # Cliente HTTP centralizado (fetchApi)
│   │   ├── services/       # Servicios por dominio (academics, finance, ...)
│   │   └── utils.ts        # Utilidades
│   └── store/              # Estado global (auth-store.ts)
└── ...
```

## Configuración

Copia y edita el archivo `.env` con la URL de la API:

```bash
cp .env.example .env
# NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Desarrollo

```bash
# Inicia el servidor de desarrollo
npm run dev
# o: yarn dev / pnpm dev / bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador (redirige a `/login`).

Otros comandos útiles:

```bash
npm run build    # Construcción de producción
npm run start    # Servidor de producción
npm run lint     # Linting
npm run type-check # Verificación de tipos TypeScript
```

## Arquitectura de la API

Todos los servicios en `src/lib/services/` llaman a endpoints REST relativos a la API
(`/academic-years`, `/students`, `/invoices`, `/payments`, etc.) mediante `fetchApi`,
que centraliza la inyección del token de autorización y el manejo de errores.

## Próximos pasos

- Integrar refresh token automático cuando expire la sessión.
- Añadir paginación, filtros y búsquedas a los listados.
- Configurar deploy (Vercel) y variables de entorno de producción.