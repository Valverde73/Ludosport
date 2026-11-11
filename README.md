# ⚔️ LudoSport Arena - Liga Mensual

Aplicación web mobile-first para la gestión integral y en tiempo real de la **Liga Mensual de LudoSport**. Diseñada específicamente para ser utilizada a pie de pista desde smartphones durante las clases y entrenamientos.

---

## 🏆 Reglas de la Competición Integradas
1. **Formato:** Liga mensual *"Todos contra todos"* a una sola vuelta.
2. **Marcador Deportivo y Puntuación:**
   - **Registro por tanteo / goles:** Al registrar un duelo, se introducen los puntos/tocados obtenidos por cada tirador (ej: `2 - 1`, `1 - 0`, `0 - 0`).
   - **Cálculo automático de ganador:**
     - Si `Tirador A > Tirador B`: Victoria para A (+3 pts de liga, 0 para B).
     - Si `Tirador A < Tirador B`: Victoria para B (+3 pts de liga, 0 para A).
     - Si `Tirador A == Tirador B`: Empate (+1 pt de liga para cada uno).
   - Ya no es necesario seleccionar manualmente quién ha ganado: la app lo calcula y muestra en un panel dinámico en vivo.
3. **Control de duplicados en directo:** La app valida automáticamente que no se enfrente al mismo tirador consigo mismo ni que se repita un cruce que ya haya sido disputado en el mes activo.
4. **Caducidad y partición mensual:** Los combates se particionan automáticamente con clave de mes/año (ej: `102026`, `112026`). Cada mes cuenta con su propia clasificación limpia e histórico.
5. **Criterios de desempate en ranking:**
   - 1º Puntos Totales de Liga (PTS)
   - 2º Mayor número de Victorias (V)
   - 3º Mayor Diferencia de Tocados/Puntos (`DIF` = A favor - En contra)
   - 4º Mayor número de Tocados a favor
   - 5º Menor número de combates disputados
   - 6º Orden alfabético

---

## 🏅 Medallero y Títulos Automáticos de la Liga Mensual
La aplicación calcula y asigna en tiempo real 5 títulos e insignias deportivas al analizar los combates disputados en el mes:
1. 🏆 **"Invicto del Mes":** Concedido a tiradores con el 100% de victorias (requiere un mínimo de 3 combates jugados).
2. ⚡ **"Máximo Anotador de OHs":** Tirador que acumula la mayor cantidad de tocados ofensivos (*pointsFor*) en el mes.
3. 🛡️ **"Defensa de Hierro":** Tirador con el menor promedio de OHs recibidos por combate (mínimo 3 combates jugados).
4. ⚔️ **"Rival más Activo":** Tirador con el mayor volumen de combates disputados en el mes.
5. 🔥 **"Racha de Victorias":** Tirador con la secuencia de victorias consecutivas más extensa (mínimo 2 victorias consecutivas).

- **Sección en Vista Principal / Clasificación:** Bloque destacado con tarjetas estilizadas, avatares interactivos de los ganadores y soporte para empates.
- **Palmarés en Ficha de Tirador:** Muestra los títulos obtenidos en el mes activo y el historial de meses anteriores.
- **Tooltips Interactivos:** Información contextual al posar el cursor o pulsar sobre cualquier insignia con el detalle del rendimiento alcanzado.

---

## 👤 Ficha / Perfil de Tirador con Estadísticas y Avatar Dinámico
- **Acceso rápido con un toque:** Al hacer clic sobre cualquier tirador (en la tabla de clasificación, en las tarjetas del podio o en la lista de alumnos), se despliega su **Perfil Completo**.
- **Avatar Dinámico:** Generación automática de avatar con las iniciales del alumno y un resplandor (*glow*) que replica el color oficial de su sable de luz (Azul, Verde, Amarillo, Púrpura, Rojo o Blanco). Permite además añadir una URL personalizada de foto real (`photoUrl`).
- **Métricas Oficiales de Rendimiento:**
  - Combates disputados (**PJ**), Victorias (**V**), Derrotas (**D**) y Ratio de Victoria (**% Winrate**).
  - Puntos / Tocados realizados (**OHs a favor**), recibidos (**OHs en contra**) y **Diferencial de OHs (DIF)**.
- **Historial Personal Scrollable:** Lista detallada y exclusiva de todos los combates disputados por el alumno, indicando la fecha, el rival, el marcador exacto y el resultado obtenido (Victoria, Empate o Derrota) con insignias de color.

---

## ⏱️ Modo "Marcador en Directo" (Live Scoreboard) para Arbitraje
- **Diseñado para pista y orientación horizontal:** Pestaña dedicada y accesible desde la barra inferior o desde accesos directos en el ranking y formulario de duelos.
- **Modo Pista Pantalla Completa:** Botón para ocultar barras de navegación y optimizar el uso en tablets o smartphones colocados horizontalmente junto a la pista de combate.
- **Cronómetro Oficial de Asalto (2:00 minutos):**
  - Temporizador digital de cuenta atrás con botones de **Iniciar**, **Pausar**, **Reiniciar** y ajuste rápido `+30s`.
  - Alerta acústica mediante sintetizador Web Audio (sin dependencias de archivos externos) con aviso sonoro en los últimos 5 segundos y pitido triple al agotarse el tiempo.
  - Indicador visual crítico cuando restan menos de 10 segundos.
- **Botones Gigantes Táctiles (+ / −):** Teclas táctiles de gran tamaño para que el árbitro sume o reste los OHs anotados por el Tirador Alfa y el Tirador Beta en tiempo real sin apartar la mirada del asalto.
- **Finalizar y Guardar con 1 Clic:** Botón que calcula automáticamente el desenlace (Victoria A, Victoria B o Empate) según los OHs anotados y registra el combate directamente en el historial, la clasificación de la liga y la hoja de Google Sheets.

---

## 🔐 Roles y Seguridad de Acceso

1. **Modo Tirador (Vista Pública / Por Defecto):**
   - Interfaz simplificada y optimizada para los alumnos y tiradores de la escuela:
     - **Consultar información:** Acceso directo a la *Clasificación en directo* (podio y ranking completo), *Duelos actuales del mes* e *Historial de duelos pasados*.
     - **Registrar resultados:** Formulario limpio e intuitivo para introducir los tanteos de los combates diarios a pie de pista.
   - Los apartados sensibles de **Ajustes** y **Gestión de Tiradores** quedan completamente ocultos de la navegación principal para evitar alteraciones accidentales.

2. **Modo Rector (Vista de Administración Protegida):**
   - Acceso restringido exclusivamente tras autenticación con el **código PIN** de Rector (por defecto `1234`, personalizable en Ajustes).
   - Al iniciar sesión como Rector, aparecen dinámicamente en el menú de navegación los módulos de:
     - **Gestión de Tiradores:** Alta de nuevos alumnos, edición de niveles/formas y bajas del censo.
     - **Ajustes & Configuración:** Conexión con Google Sheets API, reseteo crítico de la liga mensual, copias de seguridad JSON y gestión del PIN.
     - **Herramientas de control:** Botones de borrado individual de combates en el Historial y botón de reseteo en el panel de duelos.

3. **🧪 Modo Pruebas (Sandbox):**
   - Permite a instructores y rectores simular combates, probar tanteos y explorar la app en un entorno aislado sin alterar los datos oficiales de la escuela ni las hojas de Google Sheets. Incluye el botón *Cargar Demo* para pruebas instantáneas.

---

## 🛠️ Herramientas de Administración e Iteración
1. **Resetear Liga Actual:**
   - Botón accesible desde la pestaña de registro de Duelos y desde la pestaña de Ajustes (solo visible para administradores).
   - Muestra una **ventana modal de confirmación** preventiva (*"¿Estás seguro de borrar los datos de este mes?"*).
   - Al confirmar, limpia los combates disputados en el mes activo tanto en el dispositivo local como en la hoja correspondiente de Google Sheets, manteniendo intacta la lista de alumnos/tiradores.
2. **Eliminar Combates Individuales desde el Historial:**
   - En la pestaña **Historial**, cada enfrentamiento cuenta con un botón **"Borrar"** para los rectores.
   - Abre un diálogo modal para confirmar la eliminación si se ha introducido un resultado por error.
   - Al eliminar el combate, se recalcula la clasificación inmediatamente y el sistema vuelve a habilitar ese cruce para que pueda disputarse de nuevo.
3. **Modo Pruebas (Sandbox):**
   - Selector accesible en la barra superior (`🧪 Oficial / Pruebas`) y en la pestaña de Ajustes.
   - Muestra un banner ámbar superior distintivo cuando está activo.
   - Guarda los registros en un espacio de datos aislado (`ls_test_matches_*` y pestañas `TEST_MMYYYY` en Google Sheets).
   - Botón *"Cargar Demo"* para sembrar instantáneamente duelos con victorias y empates realistas y ver el podio en acción.

---

## 🚀 Arquitectura Técnica
- **Frontend:** HTML5 semántico, Tailwind CSS (Mobile-First responsive), Lucide Icons, tipografías Orbitron / Inter.
- **Zero-Dependency & Instant Load:** No requiere herramientas complejas de compilación; carga instantáneamente en cualquier navegador móvil o de escritorio.
- **Backend & Base de Datos (Supabase):** Integración directa con **Supabase** (PostgreSQL en la nube) mediante el SDK oficial `@supabase/supabase-js`, con sincronización en tiempo real y políticas de Row Level Security (RLS).
- **Persistencia Híbrida Offline / Online:** Si no hay conexión o no se ha configurado Supabase, la app funciona al 100% en modo LocalStorage en el dispositivo, con capacidad de exportar e importar copias de seguridad en formato JSON.

---

## 🗄️ Configuración de Supabase (Paso a Paso)

1. Entra en tu panel de control de [Supabase](https://supabase.com/dashboard/project/hvnwxeifiyysitoxorxy).
2. En el menú lateral izquierdo, haz clic en **SQL Editor**.
3. Abre el archivo [`supabase_schema.sql`](./supabase_schema.sql) de este repositorio, copia todo su contenido, pégalo en el editor SQL y pulsa **Run**.
4. Este script creará automáticamente:
   - Tabla `fencers`: con los 14 alumnos oficiales de LudoSport Almería y sus sables.
   - Tabla `matches`: para los enfrentamientos, tanteos de OHs y fechas de cada mes.
   - Políticas RLS: para acceso seguro y directo desde la aplicación web.
5. La aplicación ya incluye preconfigurados por defecto tu Project URL y Anon Key pública en la pestaña **Ajustes**. Si deseas personalizarlos, puedes modificarlos en cualquier momento desde dicha pestaña.

---

## 🌐 Despliegue en Producción (Vercel / Netlify / GitHub)

### Opción A: Despliegue en Vercel (Recomendado - 1 Clic)
1. Sube este repositorio a tu cuenta de **GitHub**.
2. Entra en [vercel.com](https://vercel.com) e inicia sesión con GitHub.
3. Haz clic en **"Add New..." > "Project"**.
4. Selecciona el repositorio `LudoSport`.
5. En la pantalla de configuración, deja todos los campos por defecto (el archivo `vercel.json` incluido ya configura las rutas estáticas).
6. Haz clic en **Deploy**. En menos de 30 segundos tendrás tu enlace público HTTPS listo para compartir con la escuela.

### Opción B: Despliegue en Netlify
1. Entra en [netlify.com](https://netlify.com) y conecta tu repositorio de GitHub.
2. Directorio de publicación: `.` (directorio raíz).
3. Haz clic en **Deploy Site**.

### Opción C: GitHub Pages
1. En tu repositorio de GitHub, ve a **Settings > Pages**.
2. En **Source**, selecciona la rama `main` (directorio `/root`).
3. Haz clic en **Save** y obtendrás tu URL pública en `https://<tu-usuario>.github.io/LudoSport/`.

---

## 📱 Añadir a la Pantalla de Inicio del Móvil (PWA)
Para que los instructores y alumnos puedan abrir la aplicación como si fuera una app nativa:
- **En Safari (iPhone / iOS):** Pulsa el botón "Compartir" (cuadrado con flecha hacia arriba) y selecciona **"Añadir a la pantalla de inicio"**.
- **En Chrome (Android):** Pulsa el menú de 3 puntos verticales y selecciona **"Añadir a la pantalla principal"** o **"Instalar aplicación"**.
