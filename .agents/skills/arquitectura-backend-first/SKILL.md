---
name: arquitectura-backend-first
description: "Reglas arquitectónicas para siempre priorizar el backend en operaciones de datos. Recuerda que puedes modificar el backend externo mediante scripts y usar el MCP para bases de datos."
---

# Arquitectura Backend-First

Esta habilidad dicta las normas de diseño y desarrollo que debes aplicar en este proyecto de ahora en adelante.

## 1. La lógica pertenece al Backend
- **Regla de Oro:** NUNCA filtres, mapees ni proceses conjuntos de datos masivos en el frontend (React/Next.js) para compensar carencias de la API.
- Si una vista en el frontend requiere un conjunto específico de datos (por ejemplo, "obtener solo los maestros"), debes verificar si existe un endpoint.
- Si el endpoint no existe, **está prohibido crear el filtro en el frontend como solución definitiva**. Debes ir al backend, crear el servicio, la consulta a base de datos y el controlador correspondiente.

## 2. Autoridad para modificar el Backend
- Recuerda que tienes **acceso y autoridad para modificar el backend**. 
- Si el proyecto backend está fuera de tu *workspace* actual (por ejemplo, en un directorio hermano como `../school_management_api`), puedes utilizar comandos de terminal (PowerShell, Node scripts) mediante la herramienta `run_command` para aplicar parches, crear archivos o modificar rutas.
- No te limites al código local del frontend; actúa como un ingeniero full-stack.

## 3. MCP para Bases de Datos
- Tienes un servidor MCP instalado para interactuar con la base de datos (por ejemplo, Postgres).
- Usa la herramienta `call_mcp_tool` siempre que necesites contexto real: entender relaciones, IDs, códigos de roles, verificar si un dato existe, o entender el esquema exacto antes de programar.

## 4. Control de la Base de Datos
- Si el requerimiento del usuario implica nuevas tablas, roles o cambios en la DB, asegúrate de aplicar estos cambios. Si el MCP está en modo solo-lectura, ejecuta comandos SQL, herramientas CLI o scripts en el backend que apliquen los cambios en el entorno de desarrollo.

Siempre toma decisiones arquitectónicas maduras que mantengan las capas de la aplicación separadas correctamente.
