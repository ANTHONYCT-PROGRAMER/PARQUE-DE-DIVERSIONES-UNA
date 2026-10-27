# Parque de Diversiones 3D "UNA Puno" 🎡🏛️

**Proyecto Final de Computación Gráfica (SIS226)**  
*Universidad Nacional del Altiplano de Puno — Facultad de Ingeniería Mecánica Eléctrica, Electrónica y Sistemas*  
*Escuela Profesional de Ingeniería de Sistemas*

---

## 🌟 Descripción General

Aplicación gráfica interactiva tridimensional desarrollada en **WebGL2 puro** y **GLSL ES 3.00** bajo una arquitectura orientada a objetos modular en **JavaScript ES6**, sin frameworks ni motores 3D externos (sin Three.js, sin Babylon.js).

El proyecto recrea fielmente el **Pórtico Monumental Central y Cercado de la Universidad Nacional del Altiplano de Puno**, integrado con un parque temático que alberga una **Rueda de la Fortuna (Noria Gigante)** con cinemática directa, el **Monumento al Dr. Enrique Torres Belón** sobre un globo terráqueo y un **Ciclo Circadiano Dinámico (Día / Noche)** analítico.

---

## 🚀 Características Técnicas y Curriculares (SIS226)

1. **Pipeline Gráfico WebGL2 Puro (Pasos 1 al 5):**
   - Gestión directa de Vertex Array Objects (`VAO`), Vertex Buffer Objects (`VBO`) y Element Buffer Objects (`EBO`).
   - Prueba de profundidad habilitada (`gl.DEPTH_TEST`) y mezcla alfa para transparencia (`gl.BLEND`).
   - Doble paso de renderizado: programa para geometrías sólidas con iluminación y programa para líneas vectoriales (`gl.LINE_STRIP`).

2. **Matemática Vectorial y Matricial 4x4 (Pasos 3, 5 y 6):**
   - Librería propia `Mat4` (column-major) que implementa multiplicación encadenada, proyecciones perspectiva simétrica (`Mat4.perspectiva`), vistas de cámara LookAt (`Mat4.mirarA`), traslaciones, rotaciones en los tres ejes y escalado uniforme/no uniforme.

3. **Geometría Paramétrica Procedural (Paso 7):**
   - Generación analítica de mallas 3D: esferas UV, cilindros cerrados, conos truncados, toros geométricos (anillos de estructura), cajas con cálculo de 24 vértices para normales duras y planos subdivididos.

4. **Iluminación en Espacio de Mundo (World Space) y GLSL ES 3.00 (Pasos 8 y 12):**
   - **Iluminación Difusa de Lambert:** Sol direccional dinámico con cálculo analítico $\max(\vec{N} \cdot \vec{L}_{\text{sol}}, 0.0)$.
   - **Fuentes Puntuales con Atenuación Cuadrática:** Luz festiva en el buje central de la rueda y luz cálida en el frontis del pórtico institucional:
     $$\text{atten} = \frac{1}{k_c + k_l \cdot d + k_q \cdot d^2}$$
   - **Materiales Emisivos y Neón:** Bombillas de feria, letras volumétricas y señalización luminosa con modulación diurna/nocturna.

5. **Ciclo Circadiano Dinámico Día / Noche (Paso 11):**
   - **Revolución Solar:** $\theta_{\text{sol}}(t) = \omega \cdot t$, $P_{\text{sol}}(t) = [R \cos(\theta_{\text{sol}}), R \sin(\theta_{\text{sol}}), Z_{\text{orb}}]$.
   - **Bóveda Atmosférica Dinámica:** `gl.clearColor` interpolado analíticamente entre noche estrellada puneña `(0.015, 0.020, 0.045)`, atardecer/amanecer dorado andino `(0.85, 0.42, 0.25)` y mediodía límpido `(0.42, 0.68, 0.94)`.
   - **Atenuación Diurna de Luces:** Luces artificiales y resplandor de neón atenúan automáticamente su intensidad bajo el brillo solar.

6. **Cinemática Directa y Jerarquía de Transformaciones (Paso 11 y 13):**
   - Estructura en A fija $\to$ Eje central rotatorio $\to$ Anillos concéntricos y radios estructurales $\to$ Cabinas pendulares con **contrarrotación activa** para mantener la gravedad y verticalidad de los pasajeros en todo momento.
   - Rejas monumentales del pórtico con cinemática de apertura y cierre suave gobernada por delta time.

7. **Visualización de Trayectorias Orbitales (Paso 14):**
   - Traza de la órbita circular de las cabinas proyectada en tiempo real mediante `gl.LINE_STRIP`.

8. **Cámaras Multimodo y Navegación en Primera Persona (Paso 15):**
   - **7 modos de cámara interactiva:**
     1. `[1]` **Orbital Panorámica:** Control esférico libre con mouse (azimut, elevación y radio).
     2. `[2]` **POV Dentro del Juego:** Vista en primera persona dentro de la góndola n.° 0 con oscilación física.
     3. `[3]` **Pórtico UNA Puno:** Enfoque frontal monumental a la arquitectura universitaria.
     4. `[4]` **Primera Persona (WASD):** Caminata libre con física de desplazamiento y subida automática de rampas peatonales.
     5. `[5]` **Cénit (Vista Superior):** Vista técnica ortogonal desde las alturas.
     6. `[6]` **Lateral:** Perfil de la rueda para inspección de estructura y balance de cabinas.
     7. `[7]` **Monumento Torres Belón:** Enfoque a la plaza cívica, jardineras y efigie conmemorativa.

---

## 🎮 Controles e Interacción

| Control | Acción |
| :--- | :--- |
| **`[1]` al `[7]`** | Cambiar entre los 7 modos de cámara |
| **`Click + Arrastrar`** | Rotar orientación de la cámara (Pitch & Yaw) |
| **`Scroll Mouse`** | Zoom en modo Orbital |
| **`[W] [A] [S] [D]`** | Caminar en Primera Persona / Subir rampa |
| **`[Shift]`** | Correr (incrementar velocidad de caminata) |
| **`[E]` o `[Espacio]`** | Abrir / Cerrar las rejas monumentales del pórtico |
| **`[N]`** | Alternar ciclo interactivo **Día Soleado / Noche Altiplánica** |
| **`[R]`** | Reiniciar posición y orientación de la cámara |
| **Slider HUD** | Ajustar multiplicador de velocidad de giro de la rueda |
| **Botón Pausa** | Pausar / Reanudar la simulación física |

---

## 📂 Estructura del Proyecto

```text
├── assets/
│   ├── escudo_una.png           # Escudo oficial de la UNA Puno
│   ├── portico_cad_exacto.png   # Referencia planimétrica arquitectónica
│   └── portico_referencia.jpg   # Fotografía de referencia real
├── css/
│   └── style.css                # Sistema de diseño Glassmorphic y HUD responsive
├── js/
│   ├── main.js                  # Punto de entrada, bucle de renderizado y clase AplicacionParque3D
│   ├── matrices.js              # Librería matemática Mat4 y vectores (column-major)
│   ├── shaders.js               # Biblioteca y compilador GLSL ES 3.00
│   ├── geometrias.js            # Generador procedural de mallas y constructores VAO
│   ├── texturas.js              # Repositorio y generación procedural de texturas
│   ├── camara.js                # Controlador de cámaras orbital, POV y primera persona
│   └── atracciones.js           # Ensamblaje arquitectónico del parque, pórtico y rueda
├── index.html                   # Interfaz de usuario con HUD de telemetría
├── .gitignore                   # Exclusiones de Git
└── README.md                    # Documentación del proyecto
```

---

## 💻 Instrucciones de Ejecución Local

Por motivos de seguridad del navegador (**CORS** al cargar texturas en WebGL2), la aplicación debe ejecutarse mediante un servidor HTTP local:

### Opción 1: Con Python (Recomendado)
```bash
python -m http.server 8080
```
Abrir en el navegador: [http://localhost:8080](http://localhost:8080)

### Opción 2: Con Node.js (`http-server` o `npx serve`)
```bash
npx serve -l 8080 .
```

### Opción 3: Con la extensión Live Server de VS Code
Hacer clic derecho sobre `index.html` y seleccionar **"Open with Live Server"**.

---

## 🏛️ Créditos y Autoría

- **Desarrollador:** Anthony Condori Ticona ([@ANTHONYCT-PROGRAMER](https://github.com/ANTHONYCT-PROGRAMER))
- **Asignatura:** Computación Gráfica (SIS226)
- **Institución:** Universidad Nacional del Altiplano de Puno (UNA Puno)
- **Año:** 2026
