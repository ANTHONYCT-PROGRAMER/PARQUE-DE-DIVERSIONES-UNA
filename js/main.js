/**
 * CLASE PRINCIPAL DEL MOTOR GRÁFICO - APLICACIÓN PARQUE 3D "UNA PUNO"
 * Arquitectura WebGL2 pura orientada a objetos (Paso 16: Mini Motor Gráfico Modular).
 * Integra los conceptos de los Pasos 1 al 15 de Computación Gráfica.
 */

import { Mat4 } from './matrices.js';
import { GeneradorGeometrias, ConstructorVAO } from './geometrias.js';
import { BibliotecaShaders } from './shaders.js';
import { RepositorioTexturas } from './texturas.js';
import { ControladorCamara, CAMARA_MODOS } from './camara.js';
import { AdministradorAtracciones } from './atracciones.js?v=12.0';

export class AplicacionParque3D {
    constructor(canvasId = "glCanvas") {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`[AplicacionParque3D] No se encontró el elemento canvas con id "${canvasId}".`);
        }

        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl) {
            alert("WebGL2 no está soportado en este navegador.");
            throw new Error("[AplicacionParque3D] WebGL2 no disponible.");
        }

        // Estado del motor y simulación
        this.tiempoAnterior = 0;
        this.pausado = false;
        this.velocidadMultiplicador = 1.0;
        this.idFrameAnimacion = null;

        // Ciclo Circadiano Dinámico (Día / Noche) - Pasos 1, 4, 11 y 12
        this.esDia = false;
        this.modoManualDia = false;
        this.factorDia = 0.0;          // 0.0 = Noche profunda, 1.0 = Día pleno
        this.targetFactorDia = 0.0;
        this.anguloSol = -Math.PI / 2.0; // Inicia a medianoche (nadir)

        // Referencias a subsistemas
        this.programaCuerpo = null;
        this.programaLinea = null;
        this.cuerpoLocs = {};
        this.lineaLocs = {};
        this.geometrias = null;
        this.repositorioTexturas = null;
        this.texturas = null;
        this.camara = null;
        this.atracciones = null;

        // Binds de métodos para bucle y eventos
        this.render = this.render.bind(this);
        this.ajustarDimensiones = this.ajustarDimensiones.bind(this);
    }

    /**
     * Inicializa todos los subsistemas del motor y arranca el bucle de renderizado.
     */
    iniciar() {
        this.configurarWebGL();
        this.inicializarShaders();
        this.inicializarGeometrias();
        this.inicializarTexturas();
        this.inicializarControladores();
        this.enlazarEventos();
        this.iniciarBucleRender();
        return this;
    }

    configurarWebGL() {
        const gl = this.gl;
        this.ajustarDimensiones();

        // Cielo nocturno altiplánico (Paso 1)
        gl.clearColor(0.015, 0.02, 0.045, 1.0);

        // Prueba de profundidad activada (Paso 5)
        gl.enable(gl.DEPTH_TEST);

        // Mezcla alfa para transparencias y siluetas (Paso 9 y Guía 03)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    ajustarDimensiones() {
        if (!this.canvas || !this.gl) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    inicializarShaders() {
        const gl = this.gl;

        // 1. Programa para geometría sólida iluminada
        this.programaCuerpo = BibliotecaShaders.crearProgramaCuerpo(gl);
        this.cuerpoLocs = this.programaCuerpo.cachearUniforms([
            "uModelMatrix", "uViewMatrix", "uProjectionMatrix",
            "uTexture", "uBaseColor", "uEmissive", "uEmissiveColor",
            "uLightPosFerris", "uLightColorFeria", "uLightPosPortal", "uLightColorPortal",
            "uFactorDia", "uSunDirection", "uSunColor"
        ]);

        // 2. Programa para primitivas de línea (Paso 14)
        this.programaLinea = BibliotecaShaders.crearProgramaLineas(gl);
        this.lineaLocs = this.programaLinea.cachearUniforms([
            "uModelMatrix", "uViewMatrix", "uProjectionMatrix", "uColor"
        ]);
    }

    inicializarGeometrias() {
        const gl = this.gl;

        const cajaMesh = GeneradorGeometrias.crearCaja(1, 1, 1);
        const planoMesh = GeneradorGeometrias.crearPlano(1, 1, 14, 14);
        const panelMesh = GeneradorGeometrias.crearPanelVertical(1, 1);
        const cilindroMesh = GeneradorGeometrias.crearCilindro(0.5, 0.5, 1.0, 24, true);
        const esferaMesh = GeneradorGeometrias.crearEsfera(1.0, 24, 32);
        const toroExtMesh = GeneradorGeometrias.crearToro(14.0, 0.10, 72, 14);
        const toroIntMesh = GeneradorGeometrias.crearToro(8.5, 0.10, 56, 12);
        const conoMesh = GeneradorGeometrias.crearCono(1.0, 1.8, 24, true);
        const piramideMesh = GeneradorGeometrias.crearCilindro(0.001, 1.0, 1.0, 4, true);

        // Trayectoria orbital circular con gl.LINE_STRIP (Paso 14)
        const circuloLineas = GeneradorGeometrias.crearCirculoLineas(14.0, 144);
        const vaoOrbitaGpu = ConstructorVAO.construirLineas(gl, this.programaLinea.programa, circuloLineas);

        this.geometrias = {
            vaoCaja: ConstructorVAO.construir(gl, cajaMesh),
            vaoPlano: ConstructorVAO.construir(gl, planoMesh),
            vaoPanel: ConstructorVAO.construir(gl, panelMesh),
            panelCount: panelMesh.indices.length,
            vaoCilindro: ConstructorVAO.construir(gl, cilindroMesh),
            cilindroCount: cilindroMesh.indices.length,
            vaoEsfera: ConstructorVAO.construir(gl, esferaMesh),
            esferaCount: esferaMesh.indices.length,
            vaoToroExt: ConstructorVAO.construir(gl, toroExtMesh),
            toroExtCount: toroExtMesh.indices.length,
            vaoToroInt: ConstructorVAO.construir(gl, toroIntMesh),
            toroIntCount: toroIntMesh.indices.length,
            vaoToro: ConstructorVAO.construir(gl, toroExtMesh),
            toroCount: toroExtMesh.indices.length,
            vaoCono: ConstructorVAO.construir(gl, conoMesh),
            conoCount: conoMesh.indices.length,
            vaoPiramide: ConstructorVAO.construir(gl, piramideMesh),
            piramideCount: piramideMesh.indices.length,
            vaoOrbita: vaoOrbitaGpu
        };
    }

    inicializarTexturas() {
        this.repositorioTexturas = new RepositorioTexturas(this.gl);
        this.texturas = this.repositorioTexturas.cargarTodas();
    }

    inicializarControladores() {
        this.camara = new ControladorCamara(this.canvas);
        this.atracciones = new AdministradorAtracciones(this.gl, this.geometrias, this.texturas);
    }

    enlazarEventos() {
        window.addEventListener("resize", this.ajustarDimensiones);
        window.addEventListener("keydown", (e) => {
            if (e.key === "n" || e.key === "N") {
                this.toggleDiaNoche();
            }
        });
    }

    iniciarBucleRender() {
        requestAnimationFrame((t) => {
            this.tiempoAnterior = t * 0.001;
            this.idFrameAnimacion = requestAnimationFrame(this.render);
        });
    }

    /**
     * Bucle de Renderizado Principal (Paso 4 y Paso 16)
     */
    render(tiempoMs) {
        const gl = this.gl;
        const tiempoSegundos = tiempoMs * 0.001;
        const dt = Math.min(tiempoSegundos - this.tiempoAnterior, 0.1);
        this.tiempoAnterior = tiempoSegundos;

        // Actualización física y animaciones
        if (!this.pausado) {
            this.atracciones.actualizar(dt * this.velocidadMultiplicador);
        }

        // Actualización de desplazamiento de cámara en primera persona (Paso 15)
        this.camara.actualizar(dt);

        // Actualizar datos de cámara POV con la posición de la cabina
        this.camara.actualizarDatosCabina(this.atracciones.posicionCabina0Mundo, this.atracciones.anguloRueda);

        // -------------------------------------------------------------
        // Ciclo Circadiano Dinámico: Mecánica Celeste y Órbita Solar (Paso 11)
        // -------------------------------------------------------------
        if (!this.modoManualDia) {
            // Progresión continua autónoma en función del tiempo acumulado: θ_sol(t) = ω · t
            const omegaSol = 0.06; // Velocidad angular de revolución solar
            this.anguloSol += dt * omegaSol * this.velocidadMultiplicador;
            if (this.anguloSol > Math.PI) this.anguloSol -= 2.0 * Math.PI;

            // Fracción diurna analítica según elevación sobre el horizonte (Y > 0)
            const elevacion = Math.sin(this.anguloSol);
            const targetNatural = Math.max(0.0, elevacion);
            this.factorDia += (targetNatural - this.factorDia) * Math.min(1.0, dt * 2.0);
            this.esDia = (this.factorDia > 0.35);
            this.actualizarBotonDiaNoche();
        } else {
            // Control interactivo manual: transición suave gobernada por dt hacia el objetivo
            this.factorDia += (this.targetFactorDia - this.factorDia) * Math.min(1.0, dt * 2.5);
            // Sincronizar el ángulo solar con la transición para mantener coherencia en sombras
            const anguloTarget = this.esDia ? (Math.PI * 0.45) : (-Math.PI * 0.5);
            this.anguloSol += (anguloTarget - this.anguloSol) * Math.min(1.0, dt * 2.5);
        }

        // Vector director del Sol en World Space: P_sol = [R*cos(θ), R*sin(θ), Z_orb]
        // Se normaliza analíticamente antes de pasarse al pipeline gráfico (Paso 12)
        const sunX = Math.cos(this.anguloSol);
        const sunY = Math.max(0.05, Math.sin(this.anguloSol));
        const sunZ = 0.35;
        const sunLen = Math.sqrt(sunX * sunX + sunY * sunY + sunZ * sunZ);
        const sunDirX = sunX / sunLen;
        const sunDirY = sunY / sunLen;
        const sunDirZ = sunZ / sunLen;

        // Espectro solar dinámico: cálido crepuscular al amanecer/atardecer vs blanco-cálido a mediodía
        const sunR = 1.0;
        const sunG = 0.65 + 0.31 * this.factorDia;
        const sunB = 0.38 + 0.50 * this.factorDia;

        // -------------------------------------------------------------
        // Bóveda Atmosférica Dinámica e Interpolación de Fondo (Paso 1 y 4)
        // -------------------------------------------------------------
        let rSky, gSky, bSky;
        if (this.factorDia < 0.35) {
            // Noche profunda (0.015, 0.020, 0.045) -> Amanecer/Atardecer andino (0.85, 0.42, 0.25)
            const t = this.factorDia / 0.35;
            rSky = 0.015 + (0.85 - 0.015) * t;
            gSky = 0.020 + (0.42 - 0.020) * t;
            bSky = 0.045 + (0.25 - 0.045) * t;
        } else {
            // Amanecer/Atardecer (0.85, 0.42, 0.25) -> Mediodía límpido puneño (0.42, 0.68, 0.94)
            const t = (this.factorDia - 0.35) / 0.65;
            rSky = 0.85 + (0.42 - 0.85) * t;
            gSky = 0.42 + (0.68 - 0.42) * t;
            bSky = 0.25 + (0.94 - 0.25) * t;
        }
        gl.clearColor(rSky, gSky, bSky, 1.0);

        // 1. Limpieza de buffers (Paso 5)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 2. Cálculo de Matrices View y Projection (Pasos 6 y 15)
        const fovRad = 58.0 * Math.PI / 180.0;
        const aspect = this.canvas.width / this.canvas.height;
        const projection = Mat4.perspectiva(fovRad, aspect, 0.2, 250.0);
        const view = this.camara.obtenerMatrizView();

        // 3. Configurar programa de cuerpos
        this.programaCuerpo.usar();
        gl.uniformMatrix4fv(this.cuerpoLocs.uProjectionMatrix, false, projection);
        gl.uniformMatrix4fv(this.cuerpoLocs.uViewMatrix, false, view);

        // Uniforms del Ciclo Circadiano Dinámico (Pasos 8, 11 y 12)
        gl.uniform1f(this.cuerpoLocs.uFactorDia, this.factorDia);
        gl.uniform3f(this.cuerpoLocs.uSunDirection, sunDirX, sunDirY, sunDirZ);
        gl.uniform3f(this.cuerpoLocs.uSunColor, sunR, sunG, sunB);

        // Luces puntuales en World Space (Paso 12)
        const cicloLuz = tiempoSegundos * 2.5;
        const rLuz = Math.sin(cicloLuz) * 0.4 + 0.6;
        const gLuz = Math.sin(cicloLuz + 2.094) * 0.4 + 0.6;
        const bLuz = Math.sin(cicloLuz + 4.188) * 0.4 + 0.6;
        gl.uniform3f(this.cuerpoLocs.uLightPosFerris, 0.0, 21.0, -8.0);
        gl.uniform3f(this.cuerpoLocs.uLightColorFeria, rLuz * 1.6, gLuz * 1.6, bLuz * 1.6);

        // Luz cálida en el pórtico UNA Puno
        gl.uniform3f(this.cuerpoLocs.uLightPosPortal, 0.0, 7.5, 18.0);
        gl.uniform3f(this.cuerpoLocs.uLightColorPortal, 1.0, 0.9, 0.75);

        // Opciones globales de dibujo para atracciones
        const drawOps = {
            programa: this.programaCuerpo.programa,
            locs: this.cuerpoLocs
        };
        this.atracciones.setOpcionesRender(drawOps);

        // 4. Dibujar Entorno y Pórtico UNA Puno
        this.atracciones.dibujarEntornoUNAPuno(drawOps);

        // 5. Dibujar Rueda de la Fortuna
        this.atracciones.dibujarRuedaFortuna(drawOps);

        // 6. Dibujar Trayectoria Orbital de la Cabina con gl.LINE_STRIP (Paso 14)
        const lineOps = {
            programa: this.programaLinea.programa,
            locs: this.lineaLocs,
            view: view,
            projection: projection
        };
        this.atracciones.dibujarTrayectoriaOrbital(lineOps);

        // Actualizar telemetría de HUD
        this.actualizarHUD();

        this.idFrameAnimacion = requestAnimationFrame(this.render);
    }

    actualizarHUD() {
        const altitudElem = document.getElementById("hudAltitud");
        if (altitudElem && this.camara.modo === CAMARA_MODOS.POV_CABINA) {
            altitudElem.textContent = this.atracciones.posicionCabina0Mundo[1].toFixed(1) + " m";
        }

        const fpPosElem = document.getElementById("hudFPPos");
        if (fpPosElem && this.camara.modo === CAMARA_MODOS.PRIMERA_PERSONA) {
            fpPosElem.textContent = `X: ${this.camara.fpPos[0].toFixed(1)}m | Z: ${this.camara.fpPos[2].toFixed(1)}m`;
        }
    }

    cambiarCamara(modo) {
        this.camara.setModo(modo);

        document.querySelectorAll(".btn-cam").forEach(b => b.classList.remove("active"));
        const btnId = modo === CAMARA_MODOS.ORBITAL ? "btnOrbital" :
                      modo === CAMARA_MODOS.POV_CABINA ? "btnPOV" :
                      modo === CAMARA_MODOS.PORTICO ? "btnPortico" :
                      modo === CAMARA_MODOS.PRIMERA_PERSONA ? "btnFP" :
                      modo === CAMARA_MODOS.VISTA_SUPERIOR ? "btnCenit" :
                      modo === CAMARA_MODOS.VISTA_LATERAL ? "btnLateral" : "btnMonumento";
        const el = document.getElementById(btnId);
        if (el) el.classList.add("active");

        const hudPOV = document.getElementById("panelPOV");
        if (hudPOV) {
            hudPOV.style.display = (modo === CAMARA_MODOS.POV_CABINA) ? "block" : "none";
        }

        const hudFP = document.getElementById("panelFP");
        if (hudFP) {
            hudFP.style.display = (modo === CAMARA_MODOS.PRIMERA_PERSONA) ? "block" : "none";
        }
    }

    togglePuertas() {
        const abiertas = this.atracciones.togglePuertas();
        const btn = document.getElementById("btnPuertas");
        if (btn) {
            btn.innerHTML = abiertas ? "🚪 Cerrar Puertas" : "🚪 Abrir Puertas";
        }
        const badge = document.getElementById("badgeEstadoPuertas");
        if (badge) {
            badge.textContent = abiertas ? "ABIERTAS" : "CERRADAS";
            badge.style.color = abiertas ? "#4ade80" : "#f87171";
        }
        return abiertas;
    }

    togglePausa() {
        this.pausado = !this.pausado;
        const btn = document.getElementById("btnPausa");
        if (btn) btn.innerHTML = this.pausado ? "▶ Reanudar" : "⏸ Pausar";
        return this.pausado;
    }

    setVelocidad(val) {
        this.velocidadMultiplicador = parseFloat(val);
        const lbl = document.getElementById("lblVelocidad");
        if (lbl) lbl.textContent = this.velocidadMultiplicador.toFixed(1) + "x";
    }

    /**
     * Alterna interactivamente el régimen diurno/nocturno con interpolación continua (Paso 4 y Paso 16)
     */
    toggleDiaNoche() {
        this.modoManualDia = true;
        this.esDia = !this.esDia;
        this.targetFactorDia = this.esDia ? 1.0 : 0.0;
        this.actualizarBotonDiaNoche();
        return this.esDia;
    }

    actualizarBotonDiaNoche() {
        const btn = document.getElementById("btnDiaNoche");
        if (btn) {
            btn.innerHTML = this.esDia ? "🌙 Modo Noche" : "☀️ Modo Día";
            btn.title = this.esDia ? "Cambiar a Noche Altiplánica (Tecla N)" : "Cambiar a Día Soleado (Tecla N)";
        }
        const badge = document.getElementById("badgeEstadoDiaNoche");
        if (badge) {
            const estadoTexto = this.factorDia > 0.65 ? "DÍA (MEDIODÍA)" :
                                this.factorDia > 0.20 ? "CREPÚSCULO" : "NOCHE";
            badge.textContent = estadoTexto;
        }
    }
}

// -----------------------------------------------------------------------------
// INSTANCIACIÓN Y ENLACE DE LA APLICACIÓN AL ENTORNO GLOBAL
// -----------------------------------------------------------------------------
const app = new AplicacionParque3D("glCanvas");
app.iniciar();

// Publicar en ámbito global para interacción directa desde los botones del HTML (HUD)
window.app = app;
window.cambiarCamara = (modo) => app.cambiarCamara(modo);
window.togglePuertas = () => app.togglePuertas();
window.togglePausa = () => app.togglePausa();
window.setVelocidad = (val) => app.setVelocidad(val);
window.toggleDiaNoche = () => app.toggleDiaNoche();

