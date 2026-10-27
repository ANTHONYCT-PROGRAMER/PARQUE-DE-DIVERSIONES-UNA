/**
 * CONTROLADOR DE CÁMARA MULTIMODO INTERACTIVO
 * Basado en las especificaciones del Paso 6 y 15.
 * Modos:
 *   1. MODO_ORBITAL: Navegación libre orbital alrededor del parque
 *   2. MODO_POV_CABINA: Vista en primera persona dentro de una góndola de la Rueda
 *   3. MODO_PORTICO: Vista peatonal frontal del Pórtico monumental UNA Puno
 *   4. MODO_BARCO_POV: Vista a bordo del Barco Pirata oscilante
 */

import { Mat4, Vec3 } from './matrices.js';

export const CAMARA_MODOS = {
    ORBITAL: 1,
    POV_CABINA: 2,
    PORTICO: 3,
    PRIMERA_PERSONA: 4,
    VISTA_SUPERIOR: 5,
    VISTA_LATERAL: 6,
    MONUMENTO: 7
};

export class ControladorCamara {
    constructor(canvas) {
        this.canvas = canvas;
        this.modo = CAMARA_MODOS.ORBITAL;

        // Estado orbital libre
        this.target = [0.0, 7.0, -5.0];
        this.distancia = 36.0;
        this.azimut = 0.35;
        this.elevacion = 0.28;
        this.distanciaMin = 3.0;
        this.distanciaMax = 90.0;
        this.sensibilidadMouse = 0.006;
        this.sensibilidadZoom = 0.003;

        // Estado POV Góndola
        this.posicionCabinaMundo = [0, 0, 0];
        this.rotacionCabinaMundo = 0;
        this.panPOV_X = 0;
        this.panPOV_Y = 0;

        // Estado Primera Persona (Caminata Peatonal Libre WASD)
        this.fpPos = [0.0, 1.70, 36.0]; // Frente al pórtico monumental exterior
        this.fpYaw = 0.0; // Mirando hacia -Z (hacia el pórtico, estatua y parque)
        this.fpPitch = 0.0;
        this.keysPressed = {};

        // Control de mouse
        this.arrastrando = false;
        this.mousePrevX = 0;
        this.mousePrevY = 0;

        this.initEventos();
    }

    setModo(nuevoModo) {
        this.modo = nuevoModo;
        if (nuevoModo === CAMARA_MODOS.PORTICO) {
            this.target = [0.0, 4.0, 28.0];
            this.distancia = 20.0;
            this.azimut = 0.0; // De frente mirando hacia la fachada del pórtico
            this.elevacion = 0.04;
        } else if (nuevoModo === CAMARA_MODOS.ORBITAL) {
            this.target = [0.0, 12.0, 4.0];
            this.distancia = 64.0;
            this.azimut = 0.42;
            this.elevacion = 0.30;
        } else if (nuevoModo === CAMARA_MODOS.PRIMERA_PERSONA) {
            // Posicionar al peatón frente al pórtico monumental mirando hacia la entrada
            this.fpPos = [0.0, 1.70, 36.0];
            this.fpYaw = 0.0;
            this.fpPitch = 0.0;
        } else if (nuevoModo === CAMARA_MODOS.VISTA_SUPERIOR) {
            // Vista Superior (Cénit / Top-down sobre la noria panorámica de 28m elevada a 21m)
            this.target = [0.0, 21.0, -8.0];
            this.distancia = 50.0;
            this.azimut = 0.0;
            this.elevacion = 1.52;
        } else if (nuevoModo === CAMARA_MODOS.VISTA_LATERAL) {
            // Vista Lateral (Perfil mostrando las torres monumentales en A y oscilación de cabinas)
            this.target = [0.0, 21.0, -8.0];
            this.distancia = 48.0;
            this.azimut = Math.PI / 2.0;
            this.elevacion = 0.05;
        } else if (nuevoModo === CAMARA_MODOS.MONUMENTO) {
            // Vista frontal heroica de encuadre al Monumento Enrique Torres Belón (Fiel a Foto)
            this.target = [0.0, 4.1, 11.2];
            this.distancia = 11.0;
            this.azimut = 0.08;
            this.elevacion = 0.12;
        }
    }

    initEventos() {
        this.canvas.addEventListener("mousedown", (e) => {
            this.arrastrando = true;
            this.mousePrevX = e.clientX;
            this.mousePrevY = e.clientY;
            this.canvas.style.cursor = "grabbing";
        });

        window.addEventListener("mouseup", () => {
            this.arrastrando = false;
            this.canvas.style.cursor = "grab";
        });

        window.addEventListener("mousemove", (e) => {
            if (!this.arrastrando) return;

            const dx = e.clientX - this.mousePrevX;
            const dy = e.clientY - this.mousePrevY;
            this.mousePrevX = e.clientX;
            this.mousePrevY = e.clientY;

            if (this.modo === CAMARA_MODOS.ORBITAL || this.modo === CAMARA_MODOS.PORTICO) {
                this.azimut -= dx * this.sensibilidadMouse;
                this.elevacion += dy * this.sensibilidadMouse;

                // Limitar elevación vertical para prevenir colapso de LookAt (Paso 15)
                const limite = Math.PI / 2.0 - 0.05;
                this.elevacion = Math.max(-limite, Math.min(limite, this.elevacion));
            } else if (this.modo === CAMARA_MODOS.POV_CABINA) {
                // Mirar alrededor dentro de la góndola
                this.panPOV_X -= dx * 0.004;
                this.panPOV_Y -= dy * 0.004;
                this.panPOV_X = Math.max(-1.2, Math.min(1.2, this.panPOV_X));
                this.panPOV_Y = Math.max(-0.6, Math.min(0.6, this.panPOV_Y));
            } else if (this.modo === CAMARA_MODOS.PRIMERA_PERSONA) {
                // Rotación libre de cabeza en Primera Persona
                this.fpYaw -= dx * 0.0035;
                this.fpPitch -= dy * 0.0035;
                this.fpPitch = Math.max(-1.3, Math.min(1.3, this.fpPitch));
            }
        });

        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            if (this.modo === CAMARA_MODOS.ORBITAL || this.modo === CAMARA_MODOS.PORTICO) {
                this.distancia += e.deltaY * this.sensibilidadZoom * 8.0;
                this.distancia = Math.max(this.distanciaMin, Math.min(this.distanciaMax, this.distancia));
            }
        }, { passive: false });

        window.addEventListener("keydown", (e) => {
            this.keysPressed[e.code] = true;

            if (e.key === "1") { if (window.cambiarCamara) window.cambiarCamara(CAMARA_MODOS.ORBITAL); else this.setModo(CAMARA_MODOS.ORBITAL); }
            if (e.key === "2") { if (window.cambiarCamara) window.cambiarCamara(CAMARA_MODOS.POV_CABINA); else this.setModo(CAMARA_MODOS.POV_CABINA); }
            if (e.key === "3") { if (window.cambiarCamara) window.cambiarCamara(CAMARA_MODOS.PORTICO); else this.setModo(CAMARA_MODOS.PORTICO); }
            if (e.key === "4") { if (window.cambiarCamara) window.cambiarCamara(CAMARA_MODOS.PRIMERA_PERSONA); else this.setModo(CAMARA_MODOS.PRIMERA_PERSONA); }
            if (e.key === "5") { if (window.cambiarCamara) window.cambiarCamara(CAMARA_MODOS.VISTA_SUPERIOR); else this.setModo(CAMARA_MODOS.VISTA_SUPERIOR); }
            if (e.key === "6") { if (window.cambiarCamara) window.cambiarCamara(CAMARA_MODOS.VISTA_LATERAL); else this.setModo(CAMARA_MODOS.VISTA_LATERAL); }
            if (e.key === "7") { if (window.cambiarCamara) window.cambiarCamara(CAMARA_MODOS.MONUMENTO); else this.setModo(CAMARA_MODOS.MONUMENTO); }

            // Tecla E o Espacio para abrir o cerrar puertas interactivamente
            if (e.key === "e" || e.key === "E" || e.code === "Space") {
                if (window.togglePuertas) window.togglePuertas();
            }

            if (e.key === "r" || e.key === "R") {
                this.azimut = 0.35;
                this.elevacion = 0.28;
                this.distancia = 64.0;
                this.target = [0.0, 12.0, 4.0];
                this.panPOV_X = 0;
                this.panPOV_Y = 0;
                this.fpPos = [0.0, 1.70, 36.0];
                this.fpYaw = 0.0;
                this.fpPitch = 0.0;
            }
        });

        window.addEventListener("keyup", (e) => {
            this.keysPressed[e.code] = false;
        });
    }

    // Actualización de física y desplazamiento peatonal en Primera Persona
    actualizar(dt) {
        if (this.modo === CAMARA_MODOS.PRIMERA_PERSONA) {
            const sprint = (this.keysPressed["ShiftLeft"] || this.keysPressed["ShiftRight"]) ? 2.2 : 1.0;
            const speed = 5.5 * sprint * dt;

            // Vectores horizontales de dirección
            const fwdX = -Math.sin(this.fpYaw);
            const fwdZ = -Math.cos(this.fpYaw);
            const rightX = Math.cos(this.fpYaw);
            const rightZ = -Math.sin(this.fpYaw);

            if (this.keysPressed["KeyW"] || this.keysPressed["ArrowUp"]) {
                this.fpPos[0] += fwdX * speed;
                this.fpPos[2] += fwdZ * speed;
            }
            if (this.keysPressed["KeyS"] || this.keysPressed["ArrowDown"]) {
                this.fpPos[0] -= fwdX * speed;
                this.fpPos[2] -= fwdZ * speed;
            }
            if (this.keysPressed["KeyA"] || this.keysPressed["ArrowLeft"]) {
                this.fpPos[0] -= rightX * speed;
                this.fpPos[2] -= rightZ * speed;
            }
            if (this.keysPressed["KeyD"] || this.keysPressed["ArrowRight"]) {
                this.fpPos[0] += rightX * speed;
                this.fpPos[2] += rightZ * speed;
            }

            // Clamping para mantenerse dentro del parque y explanada (Z ampliado hasta 44m exterior)
            this.fpPos[0] = Math.max(-28.0, Math.min(28.0, this.fpPos[0]));
            this.fpPos[2] = Math.max(-23.0, Math.min(44.0, this.fpPos[2]));

            // Detección física de altura del suelo (Subidita / Rampa y Plataforma Elevada a 3.80m)
            const px = this.fpPos[0];
            const pz = this.fpPos[2];
            let alturaPiso = 0.0;

            // 1. Sobre la rampa de acceso ("Subidita"): Z va de 4.50m (suelo) a -3.00m (cima), ancho X ±2.40m
            if (px >= -2.40 && px <= 2.40 && pz <= 4.50 && pz >= -3.00) {
                const fraccRampa = (4.50 - pz) / (4.50 - (-3.00)); // 0.0 al pie, 1.0 en la cima
                alturaPiso = fraccRampa * 3.80;
            }
            // 2. Sobre la plataforma elevada de embarque: Z va de -3.00m a -9.00m, ancho X ±8.5m
            else if (px >= -8.5 && px <= 8.5 && pz < -3.00 && pz >= -9.00) {
                alturaPiso = 3.80;
            }

            // Altura de los ojos humanos sobre la superficie caminable
            this.fpPos[1] = alturaPiso + 1.70;
        }
    }

    // Actualiza la posición del mundo de la cabina activa para el modo POV
    actualizarDatosCabina(posicionMundo, rotacionRueda) {
        this.posicionCabinaMundo = posicionMundo;
        this.rotacionCabinaMundo = rotacionRueda;
    }

    obtenerMatrizView() {
        if (this.modo === CAMARA_MODOS.PRIMERA_PERSONA) {
            // CÁMARA EN PRIMERA PERSONA (CAMINATA WASD LIBRE)
            const eye = this.fpPos;
            const cosP = Math.cos(this.fpPitch);
            const sinP = Math.sin(this.fpPitch);
            const dirX = -Math.sin(this.fpYaw) * cosP;
            const dirY = sinP;
            const dirZ = -Math.cos(this.fpYaw) * cosP;

            const target = [
                eye[0] + dirX,
                eye[1] + dirY,
                eye[2] + dirZ
            ];

            return Mat4.lookAt(eye, target, [0.0, 1.0, 0.0]);
        }
        else if (this.modo === CAMARA_MODOS.POV_CABINA) {
            // CÁMARA DENTRO DEL JUEGO (POV EN LA GÓNDOLA)
            const eye = [
                this.posicionCabinaMundo[0],
                this.posicionCabinaMundo[1] + 0.45,
                this.posicionCabinaMundo[2] + 0.2
            ];

            const dirX = Math.sin(this.panPOV_X);
            const dirY = Math.sin(this.panPOV_Y);
            const dirZ = Math.cos(this.panPOV_X);

            const target = [
                eye[0] + dirX * 10.0,
                eye[1] + dirY * 10.0 - 0.5,
                eye[2] + dirZ * 10.0
            ];

            return Mat4.lookAt(eye, target, [0.0, 1.0, 0.0]);
        } 
        else {
            // CÁMARA ORBITAL / PORTAL
            const cosElev = Math.cos(this.elevacion);
            const eyeX = this.target[0] + this.distancia * cosElev * Math.sin(this.azimut);
            const eyeY = this.target[1] + this.distancia * Math.sin(this.elevacion);
            const eyeZ = this.target[2] + this.distancia * cosElev * Math.cos(this.azimut);

            return Mat4.lookAt([eyeX, eyeY, eyeZ], this.target, [0.0, 1.0, 0.0]);
        }
    }
}

