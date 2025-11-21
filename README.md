# MediDiario AI 🏥✨

> *"Tu cerebro externo para la práctica clínica diaria."*

## 📋 Propósito y Visión

**MediDiario AI** nace de una necesidad real en la práctica médica hospitalaria: **llevar un orden personal, consciente y seguro de los pacientes atendidos.**

Esta aplicación **NO** busca reemplazar la Ficha Clínica Oficial ni ser un repositorio legal de antecedentes. Su objetivo es actuar como una **"Mini Ficha Personal"** para:

1.  **Reemplazo Inteligente a las "Notas del Celular":** Ofrecer la agilidad de anotar en el teléfono pero con estructura médica, seguridad y herramientas de gestión que las notas de texto plano no tienen.
2.  **Continuidad del Cuidado:** Saber exactamente en qué quedó cada caso, qué pacientes se han visto y mantener la consciencia situacional tanto en sala, policlínico o turnos.
3.  **Gestión de Carga Mental:** Vaciar la mente de pendientes (laboratorios por revisar, interconsultas, evoluciones) para reducir el burnout y ordenar el ejercicio de la profesión.

Diseñado específicamente para el flujo de trabajo de Medicina Interna (Hospitalizados, Policlínico, Extras y Turnos), con la visión de ser completamente funcional tanto en **PC de escritorio** como en **dispositivos móviles**.

---

## 🎨 Principios Estéticos: "Medical Glass UI"

La interfaz rechaza la estética tradicional del software médico (estéril, gris, densa) para abrazar una filosofía de diseño que prioriza la claridad mental.

### 1. Filosofía Visual: Profundidad y Calma
*   **Glassmorphism Funcional:** Utilizamos paneles semitransparentes (`backdrop-blur`) que permiten mantener el contexto visual sin saturar la pantalla.
*   **Atmósfera (Mesh Gradients):** Fondos orgánicos y sutiles que cambian drásticamente entre el modo **Claro** (Día/Energía clínica) y **Oscuro** (Noche/Guardia), respetando el ciclo circadiano del médico.
*   **Interacción Táctil:** Botones y tarjetas con áreas de contacto amplias (`touch-friendly`), pensados para ser usados rápidamente con una mano en el celular o con precisión en el mouse.

### 2. Código de Color Semántico
El color se utiliza como herramienta de triaje visual instantáneo:
*   🔴 **Hospitalizado:** Atención crítica, pacientes de sala.
*   🔵 **Policlínico:** Flujo ambulatorio constante.
*   🟣 **Turno:** Gestión de guardia, urgencia o llamados.
*   🟢 **Extra:** Procedimientos adicionales o ingresos fuera de lista.
*   ⚠️ **Pendientes:** Indicadores de tareas no resueltas (ámbar pulsante).

---

## ⚡ Principios Funcionales

### 1. Arquitectura "Local-First" & Privacidad 🔒
*   **Privacidad por Diseño:** Los datos de los pacientes viven **exclusivamente en el dispositivo del médico** (Navegador/LocalStorage). No hay servidores intermedios de la aplicación leyendo la información.
*   **Soberanía de Datos:** El respaldo y la sincronización se realizan directamente al **Google Drive personal** del usuario. El médico tiene la llave y el control total de su "base de datos".

### 2. IA como Copiloto (Gemini 2.5) 🤖
La IA no diagnostica, **asiste y estructura**:
*   **Estructuración de Caos:** Transforma notas rápidas o dictadas en diagnósticos y tareas ordenadas.
*   **Visión Artificial:** Digitalización de listas de pacientes mediante fotos (OCR contextual) para evitar la transcripción manual.

### 3. Flujo de Trabajo sin Fricción
*   **Optimistic UI:** Interacciones instantáneas, sin tiempos de carga perceptibles.
*   **Navegación Temporal:** Sistema de "Cinta de Tiempo" para saltar entre días y revisar guardias pasadas o planificar futuras.
*   **Reportabilidad:** Generación de PDFs de entrega de turno en un clic.

---

## 🛠️ Stack Tecnológico

*   **Core:** React 19, Vite, TypeScript.
*   **Estilos:** Tailwind CSS (Animaciones fluidas, Modo Oscuro nativo).
*   **Inteligencia:** Google GenAI SDK (`gemini-2.5-flash`).
*   **Almacenamiento:** Google Drive API v3 (Client-side integration).
*   **Visualización:** Recharts.
