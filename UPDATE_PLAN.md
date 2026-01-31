# Plan de actualización por fases

Este proyecto se migrará en tres etapas secuenciales. Cada fase debe completarse antes de iniciar la siguiente.

1. **Enrutamiento real con React Router**
   - [x] Añadir `react-router-dom` y exponer rutas reales (`/pacientes`, `/estadisticas`, `/tareas`, `/marcadores`, `/historial`, `/configuracion`).
   - [x] Conectar la navegación del layout y las vistas al historial del navegador en lugar de `viewMode` local.
   - [x] Redirigir rutas desconocidas hacia la agenda diaria.

2. **Modularización de PatientModal**
   - [x] Extraer formularios y pestañas en subcomponentes (`PatientForm`, `ClinicalNote`, `FileAttachmentManager`) dejando a `PatientModal` como coordinador de estado y acciones.
   - [x] Revisar estilos y accesibilidad de los subcomponentes para asegurar paridad visual.

3. **Hooks tipados para lógica de vistas**
   - [x] Mover filtros y cálculos diarios a hooks (`usePatientFilter`, `useDailyMetrics`, `useDailyRange`) eliminando usos de `any`.
   - [x] Replicar el enfoque en otras vistas (historial, buscador, marcadores, estadísticas) para homogenizar el tipado y la reutilización.

> Nota: Las casillas pendientes señalan tareas de seguimiento si se requieren iteraciones adicionales.
