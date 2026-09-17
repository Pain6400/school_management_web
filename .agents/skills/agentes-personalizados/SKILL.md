---
name: agentes-personalizados
description: "Guía y referencia para la creación, configuración e invocación de agentes personalizados (Custom Agents) en Antigravity."
category: workflow-and-customization
risk: safe
source: "https://antigravity.google/blog/introducing-custom-agents"
date_added: "2026-09-17"
---

# Agentes Personalizados (Custom Agents) en Antigravity

Esta habilidad proporciona una guía completa y estándares para diseñar, estructurar, ubicar e invocar **Agentes Personalizados (Custom Agents)** en proyectos de Antigravity.

---

## 1. ¿Qué son y qué problemas resuelven?

Los agentes personalizados abordan dos limitaciones críticas de los asistentes de código de propósito general:
1. **Falta de especialización (*Lack of Specialization*):** Un asistente generalista no conoce por defecto las convenciones de pruebas o reglas de arquitectura de tu proyecto a menos que se le expliquen en cada sesión.
2. **Saturación de la ventana de contexto (*Context Window Bloat*):** Cargar directrices masivas, reglas de linter y guías de pruebas en cada prompt agota rápidamente el presupuesto de tokens.

Los **Agentes Personalizados** son configuraciones basadas en archivos Markdown con encabezado YAML frontmatter que definen roles especializados con instrucciones acotadas, herramientas restringidas y permisos específicos.

### Relación con Skills y Subagentes Dinámicos:
- **Skills:** Proveen instrucciones y procedimientos paso a paso. Un agente personalizado permite seleccionar exactamente el conjunto de skills relevantes, evitando sobrecargar el contexto con todas las skills del workspace.
- **Subagentes dinámicos:** Permiten delegar subtareas. Los agentes personalizados llevan esto más lejos al permitir que el agente delegado tenga su propio modelo, herramientas delimitadas, permisos y su propia instrucción de sistema.

---

## 2. Ubicación de los Archivos

Los agentes se definen como archivos Markdown (`.md`):

| Ámbito | Ruta | Propósito |
| :--- | :--- | :--- |
| **Proyecto (Workspace)** | `.agents/agents/<nombre-agente>.md` | Versionado en VCS (Git), disponible automáticamente para todo el equipo. |
| **Global (Usuario)** | `~/.gemini/config/agents/<nombre-agente>.md` | Disponible en cualquier proyecto dentro de la máquina local. |
| **Plugins** | `plugins/<nombre-plugin>/agents/<nombre-agente>.md` | Empaquetado y distribuible dentro de un plugin. |

---

## 3. Estructura y Campos del Archivo de Agente

Cada agente consta de dos partes:
1. **YAML Frontmatter:** Configuración técnica del agente.
2. **Cuerpo Markdown:** Compila directamente como el **System Prompt** (instrucciones de sistema) del agente.

### Plantilla Base (Blueprint 101)

```markdown
---
name: dependency-modernizer
description: Ayuda a actualizar dependencias locales y verificar que las pruebas del proyecto pasen.
model: flash
mainAgent: true
subagent: true
permissionMode: acceptEdits
commandExecutionPolicy: auto
tools:
  - view_file
  - replace_file_content
  - manage_task
  - run_command
skills:
  - skills/react-nextjs-development
---

# Instrucciones Principales
Eres un modernizador de dependencias experto. Tu trabajo consiste en:
1. Revisar los archivos de configuración de dependencias (package.json, pnpm-lock, etc.).
2. Actualizar las dependencias objetivo a versiones compatibles.
3. Ejecutar las suites de pruebas y compilación para validar que no haya regresiones.
4. Reportar claramente cualquier cambio conflictivo o breaking change.
```

---

## 4. Referencia de Campos del YAML Frontmatter

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `name` | String | Sí | Identificador único del agente (usar kebab-case, ej. `dependency-modernizer`). |
| `description` | String | Sí | Explicación de lo que hace el agente y cuándo utilizarlo. Utilizado para progressive discovery y selección automática como subagente. |
| `model` | String | No | Modelo a emplear para el agente (ej. `flash`, `pro`). Útil para asignar modelos más rápidos y económicos a tareas repetitivas. |
| `mainAgent` | Boolean | No | Si es `true`, permite lanzar y utilizar este agente directamente como agente principal. |
| `subagent` | Boolean | No | Si es `true`, permite que este agente sea invocado/delegado por un agente coordinador. |
| `permissionMode` | String | No | Nivel de permisos (ej. `acceptEdits`, `bypassPermissions`). |
| `commandExecutionPolicy` | String | No | Política de ejecución de comandos. Con `auto`, comandos estándar de compilación y pruebas se ejecutan de forma autónoma sin prompts continuos, mientras que acciones de alto riesgo siguen requiriendo aprobación. |
| `tools` | Array | No | Lista estricta de herramientas permitidas (ej. `view_file`, `replace_file_content`, `run_command`). Excluye herramientas innecesarias previniendo confusión y reduciendo tokens. |
| `skills` | Array | No | Lista curada de rutas de skills accesibles por este agente (ej. `skills/react-nextjs-development`). |

---

## 5. Características Exclusivas en Antigravity

1. **Simetría de Ejecución Real (*True Symmetry*):**
   - No está limitado a ser solo un subagente secundario.
   - Puede operar como **Agente Principal** o como **Subagente** simplemente configurando `mainAgent: true` y/o `subagent: true`.

2. **Políticas de Ejecución Acotadas (*Scoped Safety Policies*):**
   - Mediante `commandExecutionPolicy: auto`, el agente puede ejecutar ciclos rápidos de prueba y error en segundo plano (compilar, ejecutar linter, correr tests) sin interrumpir continuamente al usuario para pedir confirmación, manteniendo protegidas las operaciones destructivas.

3. **Herramientas y Habilidades Acotadas (*Curated Skills & Scoped Toolsets*):**
   - En lugar de saturar el contexto con todas las herramientas y skills del espacio de trabajo, el agente recibe exclusivamente las que necesita para su función especializada.

---

## 6. Formas de Invocación

### Como Agente Principal:
- **En Antigravity CLI:**
  ```bash
  agy --agent <nombre-del-agente>
  ```
- **En la GUI (Antigravity 2.0 Desktop):**
  Seleccionándolo directamente en el selector desplegable de agentes en la interfaz.

### Como Subagente:
- Invocado dinámicamente por un agente coordinador cuando una tarea requiera su especialidad (basándose en su `name` y `description`).
