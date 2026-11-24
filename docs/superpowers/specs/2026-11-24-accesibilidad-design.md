# Accesibilidad en Impuestito — diseño

## Para qué
Que Impuestito se pueda usar con baja visión, daltonismo o mucho sol/poca luz, en línea con la clase 4 (diseño universal, inclusivo y equitativo). Suma para la defensa del Trabajo Final.

## Qué se hace
- Perfil → nueva fila **"Accesibilidad"** → pantalla `/perfil/accesibilidad` con:
  - **Modo oscuro** (interruptor).
  - **Tamaño de letra**: Normal / Grande / Muy grande (100 % / 115 % / 130 %).
  - **Negrita** (interruptor): todo el texto más grueso.
  - **Modo daltonismo** (interruptor): estados en azul y naranja en vez de verde y rojo.
  - **Letra de alta legibilidad** (interruptor): Atkinson Hyperlegible en lugar de Inter.
  - Vista previa en vivo con una tarjeta de presupuesto de ejemplo.
- Las preferencias se guardan en el dispositivo (localStorage) y se aplican desde que abre la app, incluso antes de iniciar sesión.

## No se hace
- No se cambia el kit UI ni el documento (pedido del usuario).
- No se cambia el PDF.
- No se guarda en la base de datos.

## Enfoque elegido (opción A)
Inter sigue siendo la letra por defecto (coincide con Figma); la letra legible es opcional. Descartada la opción B (cambiar la letra de toda la app) porque rompe la coincidencia con Figma y el kit.

## Cómo
- Atributos en `<html>`: `data-theme="dark"`, `data-cb`, `data-bold`, `data-font="legible"` y la variable `--fs` (escala de letra). El CSS cambia variables de color y tamaños según esos atributos.
- Tamaños de letra: cada `font-size: Npx` pasa a `calc(Npx * var(--fs))`.
- Modo oscuro y daltonismo: solo redefinen variables de color, con contraste AA.
- Figma (después): pantallas de wireframe de Accesibilidad en la página de wireframes, sin tocar el kit.
