# Expreso de Navidad — Versión final (Etapas 4 y 5)

Experiencia web interactiva hecha con HTML, CSS y JavaScript puro. No necesita servidor ni base de datos.

## Recorrido
1. **Bienvenida:** portada con locomotora animada (ruedas, bielas, humo, faro, guirnalda y aurora boreal).
2. **Registro:** el pasajero escribe su nombre y recibe un boleto con código único (`EXP-AAAA-XXXX`).
3. **Abordaje:** el boleto se perfora, suena el silbato y el tren sale de la estación.
4. **Exploración:** en el mapa, el tren viaja por la vía hasta la estación elegida. Las cinco estaciones están disponibles desde el principio.
5. **Actividades:**
   - **Villa Nevada:** buscar y encender tres farolas escondidas en el pueblo. Incluye pistas.
   - **Taller de Santa:** envolver tres regalos eligiendo el papel correcto según una pista. Los encargos cambian en cada viaje.
   - **Vagón de los deseos:** escribir deseos, cartas a Santa o agradecimientos, y consultarlos o borrarlos después.
   - **El Gran Pino:** adornar un árbol de Navidad. Se elige un adorno (esferas roja, dorada y azul, bastón, campana o moño) y se toca una rama para colgarlo; si se toca otra vez, se quita. Con al menos 6 adornos y la estrella en la punta se puede **encender el árbol**: se prenden las luces, brilla la estrella y aparecen regalos.
   - **Polo Norte:** consultar el progreso y las estrellas, ir a las estaciones pendientes y recibir el certificado. Si el viaje está completo, hay una llegada especial con fanfarria y confeti.
6. **Vagones de estrellas:** cada actividad completada engancha un vagón nuevo al tren, con su estrella y su número (01 · VILLA, 02 · TALLER, 03 · DESEOS, 04 · ÁRBOL, 05 · POLO). Los vagones aparecen en el tren de la portada, que se ajusta para caber completo, y siguen a la locomotora por la vía del mapa en el orden en que se ganaron.
7. **Progreso:** 5 estrellas (una por estación), estaciones marcadas en el mapa, contador en la barra superior y bitácora del pasajero.
8. **Certificado:** se descarga directamente como **imagen PNG** (2000 × 1414 px, horizontal), con el nombre, las 5 medallas de estrella, las estadísticas y el sello. No hace falta abrir la ventana de impresión. También se conserva el botón **Imprimir**.

## Sonido
- **Efectos** (activados por defecto; se pueden apagar): silbato, traqueteo, campanitas, aciertos, estrellas, papel, sello y fanfarria.
- **Música ambiental** (se activa manualmente): versión de cajita musical de «Noche de paz» (Gruber, 1818, dominio público).
- Todo se genera con la Web Audio API, sin archivos de audio.

## Datos y privacidad
El nombre, el boleto, el progreso y los mensajes se guardan solo en este navegador (`localStorage`). Nada se envía a internet. Para empezar de nuevo, usa **Mi boleto → Reiniciar viaje**. El progreso guardado con versiones anteriores se conserva y se convierte automáticamente. Al agregarse El Gran Pino, el Polo Norte pasó a ser la estación 05.

## Accesibilidad
- Todo se puede usar con el teclado (Tab, Enter y Esc para cerrar las ventanas).
- Incluye etiquetas para lectores de pantalla y avisos que anuncian los cambios.
- Respeta la preferencia del sistema «reducir movimiento».
- Se adapta a computadoras, tabletas y teléfonos.

## Estructura
- `index.html`: estructura, escena SVG, mapa y ventanas.
- `css/styles.css`: diseño, animaciones, adaptación a pantallas e impresión del certificado.
- `js/audio.js`: efectos de sonido y música.
- `js/effects.js`: nieve (canvas) y confeti.
- `js/app.js`: datos, guardado, boleto, viaje en el mapa, actividades y certificado.

## Nota
Las fuentes (Cinzel y Nunito) se cargan desde Google Fonts. Sin conexión, el navegador usa fuentes de respaldo y todo sigue funcionando.
