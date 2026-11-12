# Original User Request

## Initial Request — 2026-11-12T09:45:54Z

Refactorizar y mejorar la interfaz y lógica del "Marcador en Directo" de la aplicación de esgrima con sables de luz (LudoSport) para optimizar la legibilidad, accesibilidad, jerarquía de controles de tiempo y prevención de toques accidentales durante el arbitraje.

Integrity mode: development

## Requirements

### R1. Corrección del truncado de nombres
Modificar el CSS del título de las tarjetas de los tiradores para usar `white-space: normal` y permitir hasta dos líneas, garantizando que el nombre o al menos el primer apellido sea completamente visible sin cortarse ni romperse.

### R2. Lógica del temporizador oficial
Ajustar el tiempo base por defecto del marcador a 1 minuto y 30 segundos (01:30). El botón "+30s" debe permitir sumar tiempo de forma indefinida hasta alcanzar la duración deseada, asegurando que la lógica del sistema garantice que el tiempo mínimo configurado para un asalto no sea nunca inferior a 01:30.

### R3. Mejora de contraste y accesibilidad
Cambiar el color del texto "OHS ANOTADOS" sobre los botones de sumar/restar puntos a un gris más claro (ej. `rgba(255, 255, 255, 0.6)` o equivalente) para cumplir con ratios de contraste WCAG sobre el fondo azul marino y facilitar la lectura rápida durante el arbitraje.

### R4. Jerarquía visual de los controles de tiempo
Dar protagonismo principal al botón "INICIAR" haciendo que ocupe todo el ancho disponible en su fila. Mover los botones secundarios (Reset y +30s) justo debajo o a los lados con un diseño menos invasivo (estilo `ghost` u `outline`).

### R5. Prevención de errores en finalización de combate
Añadir un estado `disabled` al botón "FINALIZAR Y GUARDAR COMBATE" mientras el temporizador esté corriendo para evitar toques accidentales que cierren el combate por error en medio de la acción.

### R6. Optimización de hit-areas táctiles
Asegurar que los botones de sumar y restar puntos (`+` y `-`) tengan un área táctil mínima de 48x48px (estándar móvil) para permitir su uso rápido y seguro durante el arbitraje sin mirar fijamente la pantalla.

## Acceptance Criteria

### Nombres de Tiradores
- [ ] El título de las tarjetas de los tiradores tiene aplicada la regla `white-space: normal` y permite hasta dos líneas de texto.
- [ ] Los nombres de los tiradores no aparecen truncados con puntos suspensivos ("..."), mostrando el nombre completo o al menos el primer apellido íntegro.

### Temporizador Oficial
- [ ] El tiempo inicial base por defecto al cargar el marcador o resetear el asalto es 01:30.
- [ ] Cada pulsación en "+30s" incrementa el tiempo de asalto en 30 segundos de manera acumulativa sin límite superior.
- [ ] La lógica del temporizador no permite fijar ni reducir el tiempo de asalto por debajo de 01:30.

### Accesibilidad y Contraste
- [ ] El texto "OHS ANOTADOS" sobre los botones de puntuación tiene un ratio de contraste frente al fondo azul marino que cumple con WCAG AA (mínimo 4.5:1).

### Jerarquía de Controles de Tiempo
- [ ] El botón "INICIAR" ocupa el 100% del ancho disponible en su fila dentro del bloque de controles del temporizador.
- [ ] Los botones secundarios "Reset" y "+30s" tienen un estilo visual secundario (`ghost` u `outline`) subordinado a "INICIAR".

### Prevención de Errores y Usabilidad Táctil
- [ ] El botón "FINALIZAR Y GUARDAR COMBATE" permanece en estado `disabled` (inactivo y no interactivo) mientras el temporizador está corriendo.
- [ ] Al detenerse o pausarse el temporizador, o al llegar a 00:00, el botón "FINALIZAR Y GUARDAR COMBATE" vuelve a estar habilitado.
- [ ] Todos los botones de incremento y decremento de puntos (`+` y `-`) tienen dimensiones de hit-area de al menos 48x48 píxeles.


## Follow-up — 2026-11-12T11:11:43Z

This is a single self-contained fix; keep it small and focused. En los combates, deshabilitar los botones de incremento (+) y decremento (-) de puntos mientras el cronómetro esté corriendo, habilitándolos únicamente cuando el cronómetro se detenga o pause para registrar las anotaciones.

Integrity mode: development

## Requirements

### R1. Deshabilitación de botones de puntuación durante el cronómetro activo
Cuando se inicie o reanude el cronómetro del combate, los botones de incremento (+) y decremento (-) de puntos de los combatientes deben quedar deshabilitados para evitar anotaciones mientras el tiempo está en marcha.

### R2. Habilitación de botones de puntuación con el cronómetro detenido
Cuando el cronómetro se detenga o pause (por ejemplo, tras una parada de combate o llamada de OH), los botones de incremento (+) y decremento (-) de puntos deben habilitarse de inmediato para permitir anotar los puntos antes de reanudar el tiempo.

## Acceptance Criteria

### Estado de controles según el cronómetro
- [ ] Los botones de + y - de puntuación están deshabilitados mientras el cronómetro del combate esté corriendo.
- [ ] Los botones de + y - de puntuación se habilitan cuando el cronómetro se detiene o pausa.
- [ ] Reanudar el cronómetro vuelve a deshabilitar inmediatamente los botones de + y -.
- [ ] El flujo existente de puntuación y cronometraje funciona correctamente cuando el cronómetro está detenido.
- [ ] Se añaden o actualizan pruebas automatizadas que verifiquen el estado deshabilitado/habilitado de los botones según el estado del cronómetro.
