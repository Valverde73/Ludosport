## 2026-11-11T21:24:02Z

Refactorizar y mejorar la interfaz principal del dashboard de la liga de esgrima con sables de luz (LudoSport) aplicando correcciones de maquetación, contraste WCAG, estado inicial del podio, temática láser y estabilidad visual.

Working directory: c:\Users\Ana\Documents\LudoSport
Integrity mode: development

## Requirements

### R1. Corrección de textos y accesibilidad en el Medallero
En las tarjetas de "Medallero & Títulos del Mes", implementar `white-space: normal` en los títulos para permitir hasta dos líneas y evitar que los textos se corten. Mejorar el contraste del texto secundario ("En disputa...") sobre el fondo azul marino aplicando un tono más claro o blanco con opacidad (ej. `rgba(255, 255, 255, 0.6)`) para cumplir con los estándares de accesibilidad WCAG.

### R2. Estado inicial del podio (Zero-State)
Modificar la lógica visual del podio superior para que, si todos los tiradores tienen 0 puntos y 0 victorias (inicio de temporada o liga), los colores neón se muestren atenuados y se desactive el formato de podio destacado. Los colores y brillos deben activarse dinámicamente solo cuando al menos un jugador registre una victoria.

### R3. Animaciones y efectos visuales de temática láser
Reforzar la identidad visual de los sables de luz mediante CSS añadiendo un efecto de resplandor (`box-shadow` múltiple simulando el halo del láser) en el estado `:hover` de las tarjetas de los jugadores y las filas de la tabla de clasificación. Incorporar una sutil animación continua de pulso (`@keyframes`) en los bordes de los elementos más destacados.

### R4. Estabilidad de tabla y espaciado de navegación inferior
En la tabla de clasificación inferior, aplicar un ancho mínimo fijo (`min-width`) y alineación centrada (`text-align: center`) a las columnas de métricas (V, E, D, DIF, PTS) para evitar saltos visuales o roturas de diseño al pasar de uno a dos dígitos. Añadir un `padding-bottom` al contenedor principal scrolleable de la página equivalente a la altura de la barra de navegación inferior más el botón central "Duelo" (aproximadamente entre 100px y 120px) para garantizar que la última fila de la tabla no quede oculta al hacer scroll hasta el final.

## Acceptance Criteria

### Medallero y Accesibilidad
- [ ] Los títulos en las tarjetas de "Medallero & Títulos del Mes" permiten dos líneas con `white-space: normal` y no muestran texto truncado o cortado.
- [ ] El texto secundario ("En disputa...") sobre el fondo azul marino de las tarjetas del medallero cumple con el ratio de contraste mínimo WCAG AA.

### Estado Inicial del Podio (Zero-State)
- [ ] Con todos los jugadores con 0 victorias y 0 puntos, el podio no muestra resaltados brillantes ni colores neón destacados.
- [ ] Al haber al menos un tirador con una o más victorias, los brillos y colores correspondientes del podio se activan dinámicamente.

### Animaciones y Temática Láser
- [ ] Las tarjetas de jugadores y las filas de la tabla despliegan un efecto de resplandor (`box-shadow` múltiple) al pasar el cursor (`:hover`).
- [ ] Los elementos más destacados cuentan con una animación de pulso sutil (`@keyframes`) visible en sus bordes.

### Tabla y Maquetación de Navegación
- [ ] Las columnas V, E, D, DIF y PTS tienen `min-width` fijo y `text-align: center`, manteniendo su alineación y anchura estable tanto con valores de 1 dígito como de 2 dígitos.
- [ ] Al hacer scroll completo hacia el final de la página, la última fila de la tabla queda completamente visible por encima del botón flotante "Duelo" y de la barra de navegación inferior.


## 2026-11-12T09:47:00Z

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
