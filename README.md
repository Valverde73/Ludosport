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

## 🔐 Roles y Seguridad
- **Modo Público (Lectura):** Acceso libre mediante el enlace web para todos los alumnos y seguidores. Visualización en tiempo real del podio, tabla de posiciones completa e histórico de combates del mes.
- **Modo Rector / Administración:** Protegido mediante **código PIN** (PIN por defecto: `1234`, modificable en la pestaña de Ajustes). Habilita el formulario de registro de duelos, borrado de combates y alta/edición de tiradores de la escuela.
- **🧪 Modo Pruebas (Sandbox):** Permite a los instructores y rectores experimentar con la app, simular combates o probar la interfaz sin riesgo alguno de sobreescribir o ensuciar las estadísticas y hojas oficiales de la escuela. Incluye un botón para precargar combates de demostración con un solo clic.

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
- **Backend & Persistencia (Google Sheets):** Integración nativa con Google Sheets a través de **Google Apps Script** (`Code.gs`) como API REST ultraligera y gratuita.
- **Persistencia Híbrida Offline / Online:** Si no hay conexión o no se ha configurado la URL de Sheets, la app funciona al 100% en modo LocalStorage en el dispositivo, con capacidad de exportar e importar copias de seguridad en formato JSON.

---

## 📋 Configuración de Google Sheets (Paso a Paso)

1. Entra en tu cuenta de [Google Drive](https://drive.google.com) y crea una nueva **Hoja de cálculo de Google** con el nombre que prefieras (por ejemplo: `LudoSport Liga Mensual`).
2. En la barra superior de la hoja, haz clic en **Extensiones > Apps Script**.
3. En el editor de código que se abre, borra el contenido existente y copia todo el código que se encuentra en el archivo [`Code.gs`](./Code.gs) de este repositorio.
4. Haz clic en el icono de guardar (o pulsa `Ctrl + S`).
5. En la esquina superior derecha, pulsa en el botón azul **Implementar (Deploy)** > **Nueva implementación**.
6. En la ventana emergente, haz clic en el icono del engranaje ⚙️ a la izquierda de "Seleccionar tipo" y elige **Aplicación web**.
7. Rellena los siguientes campos:
   - **Descripción:** `LudoSport API v1`
   - **Ejecutar como:** `Yo (tu correo de Google)`
   - **Quién tiene acceso:** `Cualquier usuario` *(Anyone - ¡Esencial para que la app pueda comunicarse sin pedir login de Google!)*
8. Pulsa en **Implementar**, autoriza los permisos requeridos por Google si te lo solicita y copia la **URL de la aplicación web** (la que termina en `/exec`).
9. Abre tu Web App de LudoSport, ve a la pestaña **Ajustes**, pega la URL en el campo **Web App URL** y pulsa **Guardar y Sincronizar**.

> [!TIP]
> Google Sheets creará automáticamente la pestaña `Tiradores` con los alumnos iniciales de la escuela y una pestaña por cada mes activo (ej: `102026`) con todos los campos formateados.

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
