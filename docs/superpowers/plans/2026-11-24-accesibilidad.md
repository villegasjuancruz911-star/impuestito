# Accesibilidad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pantalla Perfil → Accesibilidad con modo oscuro, tamaño de letra, negrita, modo daltonismo y letra de alta legibilidad, guardadas en el dispositivo.

**Architecture:** Un módulo `src/lib/a11y.js` lee/guarda las preferencias en localStorage y las aplica como atributos en `<html>`; el CSS reacciona a esos atributos redefiniendo variables. Una pantalla nueva en `Main.jsx` las edita.

**Tech Stack:** React 19, CSS variables, Playwright (verificación).

**Spec:** `docs/superpowers/specs/2026-11-24-accesibilidad-design.md`

## Global Constraints
- Textos en español rioplatense.
- Contraste AA (4,5:1) para texto en modo oscuro y daltonismo.
- No tocar PDF, kit UI ni base de datos.
- Clave de localStorage: `presupuestito-a11y`.

## Review Focus
- localStorage vacío, corrupto o bloqueado → la app arranca con valores por defecto sin romperse.
- Preferencias aplicadas antes del primer render (sin parpadeo blanco en modo oscuro).
- Letra "Muy grande" no rompe la barra inferior ni los botones en 360 px de ancho.
- Modo oscuro: campos de texto, hojas inferiores y vista previa del PDF legibles.
- Cerrar sesión no borra las preferencias.

---

### Task 1: Módulo de preferencias + CSS
**Files:** Create `src/lib/a11y.js`; Modify `src/main.jsx`, `src/styles.css`, `index.html`
**Interfaces — Produces:** `DEFAULTS = { dark:false, size:'normal', bold:false, colorblind:false, legible:false }`, `loadA11y(): Prefs`, `saveA11y(p: Prefs): void` (guarda + aplica), `applyA11y(p: Prefs): void`. `size` ∈ `'normal'|'grande'|'muy-grande'` → `--fs` 1 / 1.15 / 1.3.
- [ ] `applyA11y(loadA11y())` en `main.jsx` antes de `createRoot`.
- [ ] CSS: `font-size: Npx` → `calc(Npx * var(--fs, 1))`; bloques `[data-theme="dark"]`, `[data-cb]`, `[data-bold]`, `[data-font="legible"]`.
- [ ] Atkinson Hyperlegible en el link de Google Fonts.
- [ ] Verificar: con localStorage corrupto la app carga (Playwright, sin errores de página).

### Task 2: Pantalla Accesibilidad
**Files:** Modify `src/screens/Main.jsx` (Profile + nueva `Accessibility`), `src/App.jsx`, `src/lib/router.js`
**Interfaces — Consumes:** `loadA11y`, `saveA11y`.
- [ ] Ruta privada `/perfil/accesibilidad`; fila "Accesibilidad" en el menú de Perfil.
- [ ] Interruptores + selector de 3 tamaños + vista previa en vivo.
- [ ] Verificar con Playwright: activar cada opción cambia el atributo en `<html>`, persiste tras recargar y tras cerrar sesión; capturas en oscuro, daltonismo y "Muy grande" a 360 px.
