/**
 * MODELADO Y CINEMÁTICA JERÁRQUICA DE ATRACCIONES Y ENTORNO
 * Parque de Diversiones "UNA Puno" 3D - Computación Gráfica (SIS226)
 *
 * Basado en las especificaciones de los Pasos 5, 8, 10, 11, 13 y 14.
 */

import {
    identidad4, traslacion4, escala4, rotacionX, rotacionY, rotacionZ,
    multiplicarMat4, encadenarMat4, transformarPunto
} from './matrices.js';

export class AdministradorAtracciones {
    constructor(gl, geometrias, texturas) {
        this.gl = gl;
        this.geom = geometrias;
        this.tex = texturas;

        // Estado cinemático
        this.anguloRueda = 0;
        this.tiempoGlobal = 0;

        // Estado de apertura interactiva de las puertas
        this.aperturaPuertas = 0.0; // 0.0 cerrada, 1.0 completamente abierta
        this.puertasAbiertas = false;

        // Posiciones registradas para cámaras
        this.posicionCabina0Mundo = [0, 0, 0];

        // Opciones de render activas
        this.opcionesActuales = {};
    }

    setOpcionesRender(opciones) {
        this.opcionesActuales = opciones;
    }

    togglePuertas() {
        this.puertasAbiertas = !this.puertasAbiertas;
        return this.puertasAbiertas;
    }

    actualizar(dt) {
        this.tiempoGlobal += dt;

        // Rueda de la Fortuna: rotación continua y suave
        this.anguloRueda += 0.22 * dt;

        // Animación suave de apertura y cierre de las puertas corredizas
        const targetApertura = this.puertasAbiertas ? 1.0 : 0.0;
        const velApertura = 0.85;
        if (this.aperturaPuertas < targetApertura) {
            this.aperturaPuertas = Math.min(targetApertura, this.aperturaPuertas + velApertura * dt);
        } else if (this.aperturaPuertas > targetApertura) {
            this.aperturaPuertas = Math.max(targetApertura, this.aperturaPuertas - velApertura * dt);
        }
    }

    /**
     * Dibuja un objeto con el programa de mallas/cuerpos
     */
    dibujarMalla(vao, indicesCount, modelMatrix, textura, opciones = {}) {
        const gl = this.gl;
        const opts = Object.assign({}, this.opcionesActuales, opciones);
        const locs = opts.locs;

        if (!locs) return;

        gl.bindVertexArray(vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textura);
        gl.uniform1i(locs.uTexture, 0);

        gl.uniformMatrix4fv(locs.uModelMatrix, false, modelMatrix);

        const baseColor = opts.color || [1.0, 1.0, 1.0, 1.0];
        gl.uniform4fv(locs.uBaseColor, baseColor);

        const emissive = opts.emissive || 0.0;
        gl.uniform1f(locs.uEmissive, emissive);

        const emissiveColor = opts.emissiveColor || [1.0, 1.0, 1.0];
        gl.uniform3fv(locs.uEmissiveColor, emissiveColor);

        gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0);
    }

    // =========================================================================
    // 1. PÓRTICO MONUMENTAL Y CERCADO UNA PUNO (Fiel a la Fotografía)
    // =========================================================================
    dibujarEntornoUNAPuno(opciones) {
        const geom = this.geom;
        const tex = this.tex;
        const zPortal = 28.0;
        const zFondo = -24.0;
        const largoMuroLat = zPortal - zFondo; // 52.0 metros de fondo
        const zCentroLat = (zPortal + zFondo) / 2.0; // 2.0m

        // ---------------------------------------------------------------------
        // A. GRAN EXPLANADA Y PLAZA DE ACCESO (Adoquines pétreos con franja roja)
        // ---------------------------------------------------------------------
        // Suelo general adoquinado (y = 0, cubre desde z = -29.0 hasta z = +47.0)
        const matSuelo = encadenarMat4(
            traslacion4(0, 0, 9.0),
            escala4(90, 1, 76)
        );
        this.dibujarMalla(geom.vaoPlano, 6, matSuelo, tex.adoquines);

        // Césped lateral fuera del cercado
        const matCespedIzq = encadenarMat4(
            traslacion4(-34, 0.03, 9.0),
            escala4(16, 1, 76)
        );
        this.dibujarMalla(geom.vaoPlano, 6, matCespedIzq, tex.cesped);

        const matCespedDer = encadenarMat4(
            traslacion4(34, 0.03, 9.0),
            escala4(16, 1, 76)
        );
        this.dibujarMalla(geom.vaoPlano, 6, matCespedDer, tex.cesped);

        // ---------------------------------------------------------------------
        // B. EL CERCADO PERIMÉTRICO DE LA UNA PUNO (Completamente cerrado en 4 lados)
        // Estructura fiel: Zócalo ocre inferior + Muro de ladrillo + Albardilla blanca
        // ---------------------------------------------------------------------
        const xMuroIzq = -18.25;
        const wMuroFrente = 19.5;

        // 1. Zócalo ocre inferior frontal izquierdo (y = 0 a 0.7m)
        const matZocaloIzq = encadenarMat4(
            traslacion4(xMuroIzq, 0.35, zPortal),
            escala4(wMuroFrente, 0.7, 0.8)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matZocaloIzq, tex.amarillo);

        // 2. Muro de ladrillo caravista rojo frontal izquierdo (y = 0.7 a 2.8m)
        const matMuroIzq = encadenarMat4(
            traslacion4(xMuroIzq, 1.75, zPortal),
            escala4(wMuroFrente, 2.1, 0.6)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMuroIzq, tex.muroUNA);

        // 3. Coronación / albardilla blanca superior frontal izquierda
        const matCoronaIzq = encadenarMat4(
            traslacion4(xMuroIzq, 2.95, zPortal),
            escala4(wMuroFrente + 0.3, 0.35, 0.85)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCoronaIzq, tex.blanco);

        // Muro Frontal Derecho (desde x = +8.5 hasta x = +28.0)
        const xMuroDer = 18.25;

        const matZocaloDer = encadenarMat4(
            traslacion4(xMuroDer, 0.35, zPortal),
            escala4(wMuroFrente, 0.7, 0.8)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matZocaloDer, tex.amarillo);

        const matMuroDer = encadenarMat4(
            traslacion4(xMuroDer, 1.75, zPortal),
            escala4(wMuroFrente, 2.1, 0.6)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMuroDer, tex.muroUNA);

        const matCoronaDer = encadenarMat4(
            traslacion4(xMuroDer, 2.95, zPortal),
            escala4(wMuroFrente + 0.3, 0.35, 0.85)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCoronaDer, tex.blanco);

        // Pilastras blancas de refuerzo en los muros frontales
        for (const xp of [-13.5, -20.5, -27.5, 13.5, 20.5, 27.5]) {
            const matPilastra = encadenarMat4(
                traslacion4(xp, 1.6, zPortal),
                escala4(0.8, 3.2, 0.9)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matPilastra, tex.blanco);
        }

        // Muros Laterales Perimetrales (apoyados en el suelo, de z = 28.0 a z = -24.0)
        for (const lado of [-1, 1]) {
            const xL = lado * 27.8;
            const matZocLat = encadenarMat4(
                traslacion4(xL, 0.35, zCentroLat),
                escala4(0.8, 0.7, largoMuroLat)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matZocLat, tex.amarillo);

            const matMuroLat = encadenarMat4(
                traslacion4(xL, 1.75, zCentroLat),
                escala4(0.6, 2.1, largoMuroLat)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matMuroLat, tex.muroUNA);

            const matCorLat = encadenarMat4(
                traslacion4(xL, 2.95, zCentroLat),
                escala4(0.85, 0.35, largoMuroLat + 0.3)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matCorLat, tex.blanco);

            // Pilastras de refuerzo laterales a intervalos regulares
            for (let zp = -21; zp <= 27; zp += 6.0) {
                const matPilLat = encadenarMat4(
                    traslacion4(xL, 1.6, zp),
                    escala4(0.9, 3.2, 0.8)
                );
                this.dibujarMalla(geom.vaoCaja, 36, matPilLat, tex.blanco);
            }
        }

        // Muro Trasero Perimétrico (Cierra completamente el fondo del parque en z = -24.0)
        const wFondo = 56.4;

        // 1. Zócalo ocre inferior trasero
        const matZocFondo = encadenarMat4(
            traslacion4(0, 0.35, zFondo),
            escala4(wFondo, 0.7, 0.8)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matZocFondo, tex.amarillo);

        // 2. Muro de ladrillo caravista rojo trasero
        const matMuroFondo = encadenarMat4(
            traslacion4(0, 1.75, zFondo),
            escala4(wFondo, 2.1, 0.6)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMuroFondo, tex.muroUNA);

        // 3. Coronación / albardilla blanca superior trasera
        const matCorFondo = encadenarMat4(
            traslacion4(0, 2.95, zFondo),
            escala4(wFondo + 0.3, 0.35, 0.85)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCorFondo, tex.blanco);

        // Pilastras de refuerzo en el muro trasero
        for (let xp = -24; xp <= 24; xp += 6) {
            const matPilFondo = encadenarMat4(
                traslacion4(xp, 1.6, zFondo),
                escala4(0.8, 3.2, 0.9)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matPilFondo, tex.blanco);
        }

        // ---------------------------------------------------------------------
        // C. PÓRTICO MONUMENTAL CENTRAL (Fiel al render arquitectónico exacto)
        // ---------------------------------------------------------------------

        // 1. PILAR CENTRAL MONUMENTAL (y = 0 a 4.70m, x: -1.10 a +1.10)
        // Columna vertical blanca que separa los dos accesos y soporta las vigas
        const matPilarCentral = encadenarMat4(
            traslacion4(0, 2.35, zPortal),
            escala4(2.20, 4.70, 1.15)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPilarCentral, tex.blanco);

        // 2. ESCUDO OFICIAL DE LA UNIVERSIDAD NACIONAL DEL ALTIPLANO
        // Montado en la cara frontal del pilar central con marco de realce
        const matRespaldoEscudo = encadenarMat4(
            traslacion4(0, 2.45, zPortal + 0.58),
            escala4(1.85, 2.05, 0.04)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matRespaldoEscudo, tex.blanco);

        const matPanelEscudo = encadenarMat4(
            traslacion4(0, 2.45, zPortal + 0.61),
            escala4(1.75, 1.95, 1.0)
        );
        this.dibujarMalla(geom.vaoPanel, geom.panelCount, matPanelEscudo, tex.escudoUNA, {
            ...opciones,
            emissive: 0.40,
            emissiveColor: [1.0, 0.85, 0.3]
        });

        // 3. VIGA HORIZONTAL AZUL INFERIOR (y = 3.65m a 4.15m, grosor 0.50m, longitud 16.9m)
        // Apoyada sobre ménsula/dintel blanco inferior
        const matMénsulaInf = encadenarMat4(
            traslacion4(0, 3.58, zPortal),
            escala4(17.10, 0.14, 0.80)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMénsulaInf, tex.blanco);

        const matVigaAzulInferior = encadenarMat4(
            traslacion4(0, 3.90, zPortal),
            escala4(16.90, 0.50, 0.62)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matVigaAzulInferior, tex.azul);

        // 4. GRAN VIGA HORIZONTAL AZUL SUPERIOR (y = 4.70m a 6.35m, grosor 1.65m, longitud 16.8m)
        // Fachada principal con rotulación institucional en relieve dorado
        const matMénsulaSup = encadenarMat4(
            traslacion4(0, 4.64, zPortal),
            escala4(17.00, 0.12, 0.90)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMénsulaSup, tex.blanco);

        const matGranVigaAzul = encadenarMat4(
            traslacion4(0, 5.52, zPortal),
            escala4(16.80, 1.65, 0.75)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matGranVigaAzul, tex.letreroUNA, {
            ...opciones,
            emissive: 0.35,
            emissiveColor: [0.1, 0.5, 1.0]
        });

        // Cornisa de remate blanco superior sobre la viga azul
        const matRemateSup = encadenarMat4(
            traslacion4(0, 6.40, zPortal),
            escala4(17.00, 0.12, 0.90)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matRemateSup, tex.blanco);

        // 5. ALAS ESCALONADAS ABOCINADAS DE 3 NIVELES (Idénticas al render CAD)
        // Ala Izquierda (Nivel 3 interior, Nivel 2 intermedio, Nivel 1 exterior)
        // Tier 3 (Interior, más alto, pegado al acceso)
        const matAlaIzqTier3 = encadenarMat4(
            traslacion4(-8.55, 3.85, zPortal),
            rotacionZ(0.09),
            escala4(1.20, 7.70, 1.30)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matAlaIzqTier3, tex.blanco);

        // Tier 2 (Intermedio)
        const matAlaIzqTier2 = encadenarMat4(
            traslacion4(-9.70, 3.55, zPortal),
            rotacionZ(0.12),
            escala4(1.30, 7.10, 1.10)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matAlaIzqTier2, tex.blanco);

        // Tier 1 (Exterior, más bajo)
        const matAlaIzqTier1 = encadenarMat4(
            traslacion4(-10.95, 3.20, zPortal),
            rotacionZ(0.15),
            escala4(1.45, 6.40, 0.90)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matAlaIzqTier1, tex.blanco);

        // Ala Derecha (Simétrica por reflexión)
        // Tier 3 (Interior)
        const matAlaDerTier3 = encadenarMat4(
            traslacion4(8.55, 3.85, zPortal),
            rotacionZ(-0.09),
            escala4(1.20, 7.70, 1.30)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matAlaDerTier3, tex.blanco);

        // Tier 2 (Intermedio)
        const matAlaDerTier2 = encadenarMat4(
            traslacion4(9.70, 3.55, zPortal),
            rotacionZ(-0.12),
            escala4(1.30, 7.10, 1.10)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matAlaDerTier2, tex.blanco);

        // Tier 1 (Exterior)
        const matAlaDerTier1 = encadenarMat4(
            traslacion4(10.95, 3.20, zPortal),
            rotacionZ(-0.15),
            escala4(1.45, 6.40, 0.90)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matAlaDerTier1, tex.blanco);

        // 6. POSTES METÁLICOS AZULES DE TOPE Y GUÍA (En los extremos de los accesos)
        const matPosteIzq = encadenarMat4(
            traslacion4(-7.85, 1.20, zPortal),
            escala4(0.16, 2.40, 0.16)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPosteIzq, tex.azul);

        const matPosteDer = encadenarMat4(
            traslacion4(7.85, 1.20, zPortal),
            escala4(0.16, 2.40, 0.16)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPosteDer, tex.azul);

        // 7. PUERTAS CORREDIZAS METÁLICAS AZULES INTERACTIVAS (Apertura y Cierre)
        // Desplazamiento lateral suave según aperturaPuertas (0 = cerrado, 1 = abierto)
        const slideX = this.aperturaPuertas * 5.4;

        // --- PUERTA IZQUIERDA (Se desliza hacia la izquierda al abrirse) ---
        const xCentroPuertaIzq = -4.50 - slideX;
        const wPuerta = 6.60;
        const hPuerta = 2.24;

        // Riel inferior
        const matRielInfIzq = encadenarMat4(
            traslacion4(xCentroPuertaIzq, 0.08, zPortal),
            escala4(wPuerta, 0.10, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matRielInfIzq, tex.azulOscuro);

        // Travesaño superior
        const matRielSupIzq = encadenarMat4(
            traslacion4(xCentroPuertaIzq, 2.20, zPortal),
            escala4(wPuerta, 0.10, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matRielSupIzq, tex.azulOscuro);

        // Montantes laterales del marco
        const matMarcoIzqL = encadenarMat4(
            traslacion4(xCentroPuertaIzq - wPuerta / 2 + 0.05, 1.14, zPortal),
            escala4(0.10, hPuerta, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMarcoIzqL, tex.azul);

        const matMarcoIzqR = encadenarMat4(
            traslacion4(xCentroPuertaIzq + wPuerta / 2 - 0.05, 1.14, zPortal),
            escala4(0.10, hPuerta, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMarcoIzqR, tex.azul);

        // 26 Barrotes tubulares verticales de la puerta izquierda
        const numBarrotes = 26;
        const pasoBarrote = (wPuerta - 0.3) / (numBarrotes - 1);
        for (let i = 0; i < numBarrotes; i++) {
            const xb = (xCentroPuertaIzq - wPuerta / 2 + 0.15) + i * pasoBarrote;
            const matB = encadenarMat4(
                traslacion4(xb, 1.14, zPortal),
                escala4(0.048, hPuerta - 0.18, 0.048)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matB, tex.azul);
        }

        // --- PUERTA DERECHA (Se desliza hacia la derecha al abrirse) ---
        const xCentroPuertaDer = 4.50 + slideX;

        // Riel inferior
        const matRielInfDer = encadenarMat4(
            traslacion4(xCentroPuertaDer, 0.08, zPortal),
            escala4(wPuerta, 0.10, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matRielInfDer, tex.azulOscuro);

        // Travesaño superior
        const matRielSupDer = encadenarMat4(
            traslacion4(xCentroPuertaDer, 2.20, zPortal),
            escala4(wPuerta, 0.10, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matRielSupDer, tex.azulOscuro);

        // Montantes laterales del marco
        const matMarcoDerL = encadenarMat4(
            traslacion4(xCentroPuertaDer - wPuerta / 2 + 0.05, 1.14, zPortal),
            escala4(0.10, hPuerta, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMarcoDerL, tex.azul);

        const matMarcoDerR = encadenarMat4(
            traslacion4(xCentroPuertaDer + wPuerta / 2 - 0.05, 1.14, zPortal),
            escala4(0.10, hPuerta, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMarcoDerR, tex.azul);

        // 26 Barrotes tubulares verticales de la puerta derecha
        for (let i = 0; i < numBarrotes; i++) {
            const xb = (xCentroPuertaDer - wPuerta / 2 + 0.15) + i * pasoBarrote;
            const matB = encadenarMat4(
                traslacion4(xb, 1.14, zPortal),
                escala4(0.048, hPuerta - 0.18, 0.048)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matB, tex.azul);
        }

        // ---------------------------------------------------------------------
        // D. ILUMINACIÓN EXTERIOR FRONTAL (Fuera del pórtico)
        // ---------------------------------------------------------------------
        // Farolas elegantes en la explanada frontal exterior
        this.dibujarFarola(-11.0, 0, zPortal + 6.0, opciones);
        this.dibujarFarola(11.0, 0, zPortal + 6.0, opciones);

        // ---------------------------------------------------------------------
        // E. ÁREA VERDE PARQUIZADA Y PLAZA CÍVICA MONUMENTAL (Fiel a Imagen 2)
        // ---------------------------------------------------------------------
        this.crearAreaVerdeYPlazaCivica(opciones);

        // ---------------------------------------------------------------------
        // F. MONUMENTO A ENRIQUE TORRES BELÓN SOBRE EL GLOBO TERRÁQUEO (Fiel a Imagen 1)
        // Ubicado estratégicamente en el corazón cívico del parque: X=0.0, Z=11.2m
        // ---------------------------------------------------------------------
        this.crearMonumentoTorresBelon(0.0, 0.0, 11.2, opciones);
    }

    // Farola ornamental de parque con pedestal de mármol y globo cálido luminoso (Paso 12)
    dibujarFarolaParque(x, y, z, opciones) {
        const geom = this.geom;
        const tex = this.tex;

        // Pedestal cuadrado de mármol blanco
        const matPedestal = encadenarMat4(
            traslacion4(x, y + 0.30, z),
            escala4(0.48, 0.60, 0.48)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPedestal, tex.marmolBlanco);

        // Moldura del pedestal
        const matMoldura = encadenarMat4(
            traslacion4(x, y + 0.62, z),
            escala4(0.54, 0.08, 0.54)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMoldura, tex.marmolBlanco);

        // Poste cilíndrico de hierro fundido oscuro
        const matPoste = encadenarMat4(
            traslacion4(x, y + 1.85, z),
            escala4(0.10, 2.45, 0.10)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPoste, tex.metalOscuro);

        // Capitel ornamental
        const matCapitel = encadenarMat4(
            traslacion4(x, y + 3.10, z),
            escala4(0.24, 0.12, 0.24)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matCapitel, tex.amarillo);

        // Globo de luz esférico blanco cálido radiante (Paso 12)
        const matGlobo = encadenarMat4(
            traslacion4(x, y + 3.32, z),
            escala4(0.42, 0.42, 0.42)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matGlobo, tex.blanco, {
            ...opciones,
            emissive: 0.92,
            emissiveColor: [1.0, 0.95, 0.85]
        });
    }

    // Banco de parque formal con soportes de mármol blanco y tablones de madera
    dibujarBancoParque(x, y, z, rotY = 0, opciones) {
        const geom = this.geom;
        const tex = this.tex;
        const matBase = encadenarMat4(traslacion4(x, y, z), rotacionY(rotY));

        // Patas de mármol blanco (izq y der)
        for (const sgn of [-1, 1]) {
            const matPata = encadenarMat4(
                matBase,
                traslacion4(sgn * 0.72, 0.24, 0),
                escala4(0.18, 0.48, 0.55)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matPata, tex.marmolBlanco);
        }

        // Asiento de madera
        const matAsiento = encadenarMat4(
            matBase,
            traslacion4(0, 0.46, 0.05),
            escala4(1.80, 0.08, 0.54)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matAsiento, tex.madera);

        // Respaldo de madera
        const matRespaldo = encadenarMat4(
            matBase,
            traslacion4(0, 0.78, -0.22),
            rotacionX(-0.12),
            escala4(1.80, 0.42, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matRespaldo, tex.madera);
    }

    // Macetero elevado con albardilla de mármol, flores y arbusto topiario central
    dibujarMaceteroFloral(x, y, z, ancho, profundidad, opciones) {
        const geom = this.geom;
        const tex = this.tex;
        const hCurb = 0.42;
        const eCurb = 0.28;

        // Base/borde en 4 lados de mármol blanco
        // Bordes Z (frontal y posterior)
        for (const sgn of [-1, 1]) {
            const matZ = encadenarMat4(
                traslacion4(x, y + hCurb / 2, z + sgn * (profundidad / 2 - eCurb / 2)),
                escala4(ancho, hCurb, eCurb)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matZ, tex.marmolBlanco);
        }
        // Bordes X (izq y der)
        for (const sgn of [-1, 1]) {
            const matX = encadenarMat4(
                traslacion4(x + sgn * (ancho / 2 - eCurb / 2), y + hCurb / 2, z),
                escala4(eCurb, hCurb, profundidad - eCurb * 2)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matX, tex.marmolBlanco);
        }

        // Relleno interior con lecho de flores (setos y flores)
        const matFlores = encadenarMat4(
            traslacion4(x, y + 0.36, z),
            escala4(ancho - eCurb * 1.5, 0.22, profundidad - eCurb * 1.5)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matFlores, tex.setosFlores);

        // Arbusto topiario esférico central en el macetero
        const matArbusto = encadenarMat4(
            traslacion4(x, y + 0.95, z),
            escala4(1.10, 1.10, 1.10)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matArbusto, tex.verdePino);
    }

    // Árbol frondoso ornamental 3D (Queñua / Álamo) con tronco de corteza y copa multicapa
    dibujarArbolFrondoso(x, y, z, escala = 1.0, opciones = {}) {
        const geom = this.geom;
        const tex = this.tex;

        // 1. Alcorque / Jardinera circular en la base
        const matAlcorque = encadenarMat4(
            traslacion4(x, y + 0.09 * escala, z),
            escala4(1.9 * escala, 0.18 * escala, 1.9 * escala)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matAlcorque, tex.marmolBlanco);

        const matTierra = encadenarMat4(
            traslacion4(x, y + 0.11 * escala, z),
            escala4(1.72 * escala, 0.14 * escala, 1.72 * escala)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matTierra, tex.setosFlores);

        // 2. Tronco principal cónico con corteza rugosa
        const hTronco = 2.8 * escala;
        const matTronco = encadenarMat4(
            traslacion4(x, y + (hTronco / 2) + 0.15 * escala, z),
            escala4(0.48 * escala, hTronco, 0.48 * escala)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matTronco, tex.cortezaArbol);

        // Ramas primarias
        const matRama1 = encadenarMat4(
            traslacion4(x + 0.35 * escala, y + 2.5 * escala, z + 0.15 * escala),
            rotacionZ(-0.45),
            rotacionX(0.20),
            escala4(0.24 * escala, 1.4 * escala, 0.24 * escala)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matRama1, tex.cortezaArbol);

        const matRama2 = encadenarMat4(
            traslacion4(x - 0.35 * escala, y + 2.6 * escala, z - 0.15 * escala),
            rotacionZ(0.42),
            rotacionX(-0.25),
            escala4(0.22 * escala, 1.3 * escala, 0.22 * escala)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matRama2, tex.cortezaArbol);

        // 3. Copa Frondosa Multicapa (6 lóbulos esféricos que crean una masa arbórea orgánica y majestuosa)
        const yCopa = y + 3.4 * escala;

        // Núcleo central
        const matCopaCentro = encadenarMat4(
            traslacion4(x, yCopa, z),
            escala4(2.8 * escala, 2.6 * escala, 2.8 * escala)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matCopaCentro, tex.follajeArbol);

        // Cúpula superior
        const matCopaSup = encadenarMat4(
            traslacion4(x, yCopa + 1.1 * escala, z),
            escala4(2.2 * escala, 2.1 * escala, 2.2 * escala)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matCopaSup, tex.follajeArbol);

        // Lóbulos laterales exteriores
        const matLobeIzq = encadenarMat4(
            traslacion4(x - 0.95 * escala, yCopa - 0.15 * escala, z + 0.4 * escala),
            escala4(1.9 * escala, 1.8 * escala, 1.9 * escala)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matLobeIzq, tex.follajeArbol);

        const matLobeDer = encadenarMat4(
            traslacion4(x + 1.05 * escala, yCopa - 0.20 * escala, z - 0.35 * escala),
            escala4(1.95 * escala, 1.85 * escala, 1.95 * escala)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matLobeDer, tex.follajeArbol);

        const matLobeFront = encadenarMat4(
            traslacion4(x + 0.25 * escala, yCopa - 0.35 * escala, z + 0.95 * escala),
            escala4(1.75 * escala, 1.65 * escala, 1.75 * escala)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matLobeFront, tex.follajeArbol);

        const matLobeBack = encadenarMat4(
            traslacion4(x - 0.25 * escala, yCopa - 0.25 * escala, z - 0.95 * escala),
            escala4(1.85 * escala, 1.75 * escala, 1.85 * escala)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matLobeBack, tex.follajeArbol);
    }

    // Conífera / Pino Andino esbelto con 3 niveles cónicos escalonados
    dibujarPino(x, y, z, escala = 1.0, opciones = {}) {
        const geom = this.geom;
        const tex = this.tex;

        // Alcorque circular
        const matAlcorque = encadenarMat4(
            traslacion4(x, y + 0.08 * escala, z),
            escala4(1.6 * escala, 0.16 * escala, 1.6 * escala)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matAlcorque, tex.marmolBlanco);

        // Tronco vertical
        const matTronco = encadenarMat4(
            traslacion4(x, y + 1.6 * escala, z),
            escala4(0.36 * escala, 3.2 * escala, 0.36 * escala)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matTronco, tex.cortezaArbol);

        // 3 Pisos de copas cónicas
        const matCono1 = encadenarMat4(
            traslacion4(x, y + 2.4 * escala, z),
            escala4(2.8 * escala, 2.3 * escala, 2.8 * escala)
        );
        this.dibujarMalla(geom.vaoCono, geom.conoCount, matCono1, tex.verdePino);

        const matCono2 = encadenarMat4(
            traslacion4(x, y + 3.8 * escala, z),
            escala4(2.2 * escala, 2.1 * escala, 2.2 * escala)
        );
        this.dibujarMalla(geom.vaoCono, geom.conoCount, matCono2, tex.follajeArbol);

        const matCono3 = encadenarMat4(
            traslacion4(x, y + 5.1 * escala, z),
            escala4(1.5 * escala, 1.9 * escala, 1.5 * escala)
        );
        this.dibujarMalla(geom.vaoCono, geom.conoCount, matCono3, tex.follajeArbol);
    }

    // =========================================================================
    // MONUMENTO A ENRIQUE TORRES BELÓN SOBRE EL GLOBO TERRÁQUEO (Fiel a Imagen 1)
    // Estatua de bronce esculpida con levita de época, libro de leyes y brazo alzado;
    // pedestal de granito negro con placa dorada; escudo UNA Puno con sol radiante;
    // y gran esfera terráquea rotatoria suspendida sobre cuna circular baja (Pasos 7, 10, 11).
    // =========================================================================
    crearMonumentoTorresBelon(posX, posY, posZ, opciones) {
        const geom = this.geom;
        const tex = this.tex;

        // ---------------------------------------------------------------------
        // 1. BASE Y CUNA DE ASIENTO BAJA EN MÁRMOL BLANCO Y BRONCE DORADO
        // A diferencia de pesadas escalinatas, la foto muestra el globo casi a ras de
        // suelo sostenido por una delicada cuna circular baja y ménsulas doradas.
        // ---------------------------------------------------------------------
        // Bordillo exterior circular bajo en mármol blanco (radio 2.45m, altura 0.20m)
        const matBordeBase = encadenarMat4(
            traslacion4(posX, posY + 0.10, posZ),
            escala4(4.90, 0.20, 4.90)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matBordeBase, tex.marmolBlanco);

        // Escalón interior achaflanado (radio 2.10m, altura 0.14m)
        const matPisoBase = encadenarMat4(
            traslacion4(posX, posY + 0.22, posZ),
            escala4(4.20, 0.14, 4.20)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPisoBase, tex.marmolBlanco);

        // Zócalo central metálico de soporte bajo
        const matZocaloMetal = encadenarMat4(
            traslacion4(posX, posY + 0.31, posZ),
            escala4(1.90, 0.08, 1.90)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matZocaloMetal, tex.amarillo);

        // Anillo / Torus dorado de asiento en la base del globo
        const matAnilloBase = encadenarMat4(
            traslacion4(posX, posY + 0.40, posZ),
            rotacionX(Math.PI / 2),
            escala4(0.20, 0.20, 0.20)
        );
        this.dibujarMalla(geom.vaoToroInt, geom.toroIntCount, matAnilloBase, tex.amarillo);

        // 8 Ménsulas / Soportes radiales curvos dorados que abrazan la parte baja del globo
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2.0;
            const matSoporte = encadenarMat4(
                traslacion4(posX, posY + 0.52, posZ),
                rotacionY(ang),
                traslacion4(1.42, 0, 0),
                rotacionZ(-0.48),
                escala4(0.14, 0.65, 0.14)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matSoporte, tex.amarillo);
        }

        // ---------------------------------------------------------------------
        // 2. GRAN GLOBO TERRÁQUEO ROTATORIO DE LA TIERRA (Pasos 7, 10, 11)
        // Diámetro 3.30m (radio 1.65m), centrado en Y = posY + 1.95m.
        // Toca la cuna en Y = 0.30m y alcanza la cartela en Y = 3.60m.
        // ---------------------------------------------------------------------
        const yCentroGlobo = posY + 1.95;
        const radioGlobo = 1.65;
        const inclinacionAxial = 0.409; // 23.44 grados reales de oblicuidad terrestre
        const rotacionTierra = this.tiempoGlobal * 0.18; // rotación diurna continua

        const matGloboTierra = encadenarMat4(
            traslacion4(posX, yCentroGlobo, posZ),
            rotacionZ(inclinacionAxial),
            rotacionY(rotacionTierra),
            escala4(radioGlobo, radioGlobo, radioGlobo)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matGloboTierra, tex.globoTerraqueo);

        // Eje polar metálico dorado atravesando los polos norte y sur
        const matEjePolar = encadenarMat4(
            traslacion4(posX, yCentroGlobo, posZ),
            rotacionZ(inclinacionAxial),
            escala4(0.08, 3.80, 0.08)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matEjePolar, tex.amarillo);

        // Finiales esféricos en los extremos del eje polar
        for (const sgnP of [1, -1]) {
            const matFinialPolar = encadenarMat4(
                traslacion4(posX, yCentroGlobo, posZ),
                rotacionZ(inclinacionAxial),
                traslacion4(0, sgnP * 1.90, 0),
                escala4(0.18, 0.18, 0.18)
            );
            this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matFinialPolar, tex.amarillo);
        }

        // Anillo meridiano exterior dorado que abraza la Tierra
        const matAnilloMeridiano = encadenarMat4(
            traslacion4(posX, yCentroGlobo, posZ),
            rotacionZ(inclinacionAxial),
            rotacionX(Math.PI / 2),
            escala4(0.20, 0.20, 0.20)
        );
        this.dibujarMalla(geom.vaoToroInt, geom.toroIntCount, matAnilloMeridiano, tex.amarillo);

        // Anillo ecuatorial dorado
        const matAnilloEcuador = encadenarMat4(
            traslacion4(posX, yCentroGlobo, posZ),
            rotacionZ(inclinacionAxial),
            escala4(0.20, 0.20, 0.20)
        );
        this.dibujarMalla(geom.vaoToroInt, geom.toroIntCount, matAnilloEcuador, tex.amarillo);

        // ---------------------------------------------------------------------
        // 3. CARTELA Y ESCUDO OFICIAL DE LA UNIVERSIDAD NACIONAL DEL ALTIPLANO
        // Montado en la cúspide del globo terráqueo (Y = 3.60m a 4.75m)
        // ---------------------------------------------------------------------
        const yEscudo = posY + 4.18;

        // Base/cuello de montaje sobre el globo
        const matCuelloEscudo = encadenarMat4(
            traslacion4(posX, posY + 3.68, posZ),
            escala4(0.70, 0.20, 0.40)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCuelloEscudo, tex.amarillo);

        // Marco y cartela heráldica barroca dorada
        const matMarcoEscudo = encadenarMat4(
            traslacion4(posX, yEscudo, posZ),
            escala4(1.68, 1.30, 0.32)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matMarcoEscudo, tex.amarillo);

        // Volutas barrocas laterales curvas a izquierda y derecha del escudo
        for (const sgnV of [-1, 1]) {
            const matVoluta = encadenarMat4(
                traslacion4(posX + sgnV * 0.92, yEscudo, posZ),
                rotacionZ(sgnV * 0.25),
                escala4(0.24, 1.15, 0.28)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matVoluta, tex.amarillo);

            const matVolutaRemate = encadenarMat4(
                traslacion4(posX + sgnV * 0.94, yEscudo + 0.55, posZ),
                escala4(0.22, 0.22, 0.22)
            );
            this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matVolutaRemate, tex.amarillo);
        }

        // Corona / Sol radiante (Inti) superior con rayos dorados
        const matCoronaSol = encadenarMat4(
            traslacion4(posX, yEscudo + 0.72, posZ),
            escala4(1.20, 0.35, 0.26)
        );
        this.dibujarMalla(geom.vaoCono, geom.conoCount, matCoronaSol, tex.amarillo);

        // Paneles con el Escudo oficial UNA Puno en ambas caras (frente +Z y dorso -Z)
        for (const sgn of [1, -1]) {
            const matPanelEscudo = encadenarMat4(
                traslacion4(posX, yEscudo, posZ + sgn * 0.17),
                (sgn === -1 ? rotacionY(Math.PI) : identidad4()),
                escala4(1.42, 1.15, 1.0)
            );
            this.dibujarMalla(geom.vaoPanel, geom.panelCount, matPanelEscudo, tex.escudoUNA);
        }

        // ---------------------------------------------------------------------
        // 4. CRESTERÍA DE HOJAS DE ACANTO Y FRISO DORADO (Fiel a la foto)
        // Friso decorativo de transición entre el escudo y el pedestal de granito
        // ---------------------------------------------------------------------
        const yCresteria = posY + 4.90;
        const matFrisoBase = encadenarMat4(
            traslacion4(posX, yCresteria, posZ),
            escala4(1.75, 0.12, 1.25)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matFrisoBase, tex.amarillo);

        // Dientes / Hojas de acanto estilizadas en el contorno del friso
        for (let i = -3; i <= 3; i++) {
            const matHojaFront = encadenarMat4(
                traslacion4(posX + i * 0.24, yCresteria + 0.08, posZ + 0.62),
                rotacionX(0.25),
                escala4(0.16, 0.16, 0.06)
            );
            this.dibujarMalla(geom.vaoPiramide, geom.piramideCount, matHojaFront, tex.amarillo);

            const matHojaBack = encadenarMat4(
                traslacion4(posX + i * 0.24, yCresteria + 0.08, posZ - 0.62),
                rotacionX(-0.25),
                escala4(0.16, 0.16, 0.06)
            );
            this.dibujarMalla(geom.vaoPiramide, geom.piramideCount, matHojaBack, tex.amarillo);
        }

        // ---------------------------------------------------------------------
        // 5. PEDESTAL DE GRANITO NEGRO PULIDO CON INSCRIPCIÓN DORADA
        // ---------------------------------------------------------------------
        const yPedestal = posY + 5.30;

        // Bloque central de granito negro lustroso
        const matBloqueGranito = encadenarMat4(
            traslacion4(posX, yPedestal, posZ),
            escala4(1.72, 0.58, 1.25)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matBloqueGranito, tex.metalOscuro);

        // Cornisa superior dorada
        const matCornisaSup = encadenarMat4(
            traslacion4(posX, yPedestal + 0.31, posZ),
            escala4(1.84, 0.08, 1.36)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCornisaSup, tex.amarillo);

        // Cornisa inferior dorada
        const matCornisaInf = encadenarMat4(
            traslacion4(posX, yPedestal - 0.31, posZ),
            escala4(1.84, 0.08, 1.36)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCornisaInf, tex.amarillo);

        // Placas de granito con inscripción chiseled gold: "ENRIQUE / TORRES BELÓN"
        for (const sgn of [1, -1]) {
            const matPlaca = encadenarMat4(
                traslacion4(posX, yPedestal, posZ + sgn * 0.635),
                (sgn === -1 ? rotacionY(Math.PI) : identidad4()),
                escala4(1.62, 0.50, 1.0)
            );
            this.dibujarMalla(geom.vaoPanel, geom.panelCount, matPlaca, tex.placaTorresBelon);
        }

        // ---------------------------------------------------------------------
        // 6. ESTATUA ESCULTÓRICA DE ENRIQUE TORRES BELÓN EN BRONCE
        // Altura total de la escultura: 2.20m (Y = 5.65m hasta Y = 7.85m)
        // ---------------------------------------------------------------------
        const yBaseEstatua = posY + 5.65;

        // Plinto de bronce fino de sustentación
        const matPlintoBronce = encadenarMat4(
            traslacion4(posX, yBaseEstatua + 0.04, posZ),
            escala4(1.15, 0.08, 0.95)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPlintoBronce, tex.bronceEstatua);

        // Zapatos de vestir clásicos masculinos
        // Pie izquierdo firme orientado al frente
        const matPieIzq = encadenarMat4(
            traslacion4(posX - 0.17, yBaseEstatua + 0.09, posZ + 0.02),
            escala4(0.16, 0.10, 0.34)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPieIzq, tex.bronceEstatua);

        // Tacón y puntera pie izquierdo
        const matPunteraIzq = encadenarMat4(
            traslacion4(posX - 0.17, yBaseEstatua + 0.07, posZ + 0.16),
            escala4(0.14, 0.07, 0.12)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPunteraIzq, tex.bronceEstatua);

        // Pie derecho con leve ángulo oratorio (rotado 12 grados hacia afuera)
        const matPieDer = encadenarMat4(
            traslacion4(posX + 0.17, yBaseEstatua + 0.09, posZ + 0.06),
            rotacionY(0.20),
            escala4(0.16, 0.10, 0.34)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPieDer, tex.bronceEstatua);

        const matPunteraDer = encadenarMat4(
            traslacion4(posX + 0.19, yBaseEstatua + 0.07, posZ + 0.20),
            rotacionY(0.20),
            escala4(0.14, 0.07, 0.12)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPunteraDer, tex.bronceEstatua);

        // Piernas con pantalones de sastre de época
        // Pierna izquierda (recta y firme, soportando el peso principal)
        const matPiernaIzq = encadenarMat4(
            traslacion4(posX - 0.17, yBaseEstatua + 0.50, posZ),
            escala4(0.21, 0.74, 0.23)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPiernaIzq, tex.bronceEstatua);

        // Pierna derecha (adelantada en paso oratorio con rodilla suavemente flexionada)
        const matPiernaDerInf = encadenarMat4(
            traslacion4(posX + 0.17, yBaseEstatua + 0.32, posZ + 0.04),
            rotacionX(-0.06),
            escala4(0.20, 0.38, 0.22)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPiernaDerInf, tex.bronceEstatua);

        const matPiernaDerSup = encadenarMat4(
            traslacion4(posX + 0.17, yBaseEstatua + 0.64, posZ + 0.02),
            rotacionX(0.04),
            escala4(0.22, 0.38, 0.23)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPiernaDerSup, tex.bronceEstatua);

        // Rodilla derecha esculpida
        const matRodillaDer = encadenarMat4(
            traslacion4(posX + 0.17, yBaseEstatua + 0.48, posZ + 0.11),
            escala4(0.16, 0.14, 0.12)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matRodillaDer, tex.bronceEstatua);

        // Cadera / Cinturón
        const yCadera = yBaseEstatua + 0.88;
        const matCadera = encadenarMat4(
            traslacion4(posX, yCadera, posZ),
            escala4(0.56, 0.20, 0.36)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCadera, tex.bronceEstatua);

        // Faldones de la levita (Frock coat tails drapeados detrás de las piernas)
        // Faldón izquierdo trasero
        const matFaldonTrasIzq = encadenarMat4(
            traslacion4(posX - 0.15, yBaseEstatua + 0.58, posZ - 0.14),
            rotacionX(0.12),
            rotacionZ(0.04),
            escala4(0.24, 0.54, 0.10)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matFaldonTrasIzq, tex.bronceEstatua);

        // Faldón derecho trasero
        const matFaldonTrasDer = encadenarMat4(
            traslacion4(posX + 0.15, yBaseEstatua + 0.58, posZ - 0.14),
            rotacionX(0.14),
            rotacionZ(-0.04),
            escala4(0.24, 0.54, 0.10)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matFaldonTrasDer, tex.bronceEstatua);

        // Laterales de la levita
        for (const sgnL of [-1, 1]) {
            const matFaldonLat = encadenarMat4(
                traslacion4(posX + sgnL * 0.27, yBaseEstatua + 0.68, posZ - 0.02),
                rotacionZ(sgnL * 0.08),
                escala4(0.08, 0.40, 0.32)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matFaldonLat, tex.bronceEstatua);
        }

        // Torso / Chaleco / Chaqueta de gala abierta
        const yTorso = yBaseEstatua + 1.15;
        const matTorso = encadenarMat4(
            traslacion4(posX, yTorso, posZ),
            escala4(0.56, 0.56, 0.37)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matTorso, tex.bronceEstatua);

        // Solapas de terciopelo de la levita cruzadas en ángulo
        for (const sgnS of [-1, 1]) {
            const matSolapa = encadenarMat4(
                traslacion4(posX + sgnS * 0.15, yTorso + 0.06, posZ + 0.19),
                rotacionY(sgnS * 0.15),
                rotacionZ(sgnS * -0.18),
                escala4(0.14, 0.42, 0.04)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matSolapa, tex.metalOscuro);
        }

        // Chaleco interior y fila de botones dorados
        const matChalecoInterior = encadenarMat4(
            traslacion4(posX, yTorso - 0.04, posZ + 0.18),
            escala4(0.22, 0.36, 0.04)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matChalecoInterior, tex.bronceEstatua);

        for (let b = -1; b <= 1; b++) {
            const matBoton = encadenarMat4(
                traslacion4(posX, yTorso - 0.04 + b * 0.10, posZ + 0.205),
                escala4(0.035, 0.035, 0.02)
            );
            this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matBoton, tex.amarillo);
        }

        // Cuello de camisa blanco almidonado alto y corbata de lazo / plastrón
        const yCuello = yTorso + 0.33;
        const matCuelloCamisa = encadenarMat4(
            traslacion4(posX, yCuello - 0.04, posZ + 0.12),
            escala4(0.20, 0.12, 0.14)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCuelloCamisa, tex.blanco);

        const matCorbataLazo = encadenarMat4(
            traslacion4(posX, yCuello - 0.06, posZ + 0.19),
            escala4(0.18, 0.09, 0.05)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCorbataLazo, tex.metalOscuro);

        // Cuello anatómico esculpido
        const matCuello = encadenarMat4(
            traslacion4(posX, yCuello, posZ + 0.02),
            escala4(0.15, 0.16, 0.15)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matCuello, tex.bronceEstatua);

        // Cabeza y Rostro de Enrique Torres Belón
        // Inclinada suavemente hacia arriba (gesto oratorio visionario) y girada en dirección del gesto
        const yCabeza = yCuello + 0.21;
        const matCabeza = encadenarMat4(
            traslacion4(posX, yCabeza, posZ + 0.03),
            rotacionY(0.08),
            rotacionX(-0.12),
            escala4(0.28, 0.34, 0.29)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matCabeza, tex.bronceEstatua);

        // Mandíbula y barbilla decidida
        const matBarba = encadenarMat4(
            traslacion4(posX + 0.01, yCabeza - 0.12, posZ + 0.12),
            rotacionX(-0.10),
            escala4(0.18, 0.14, 0.16)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matBarba, tex.bronceEstatua);

        // Nariz aguileña y frente
        const matNariz = encadenarMat4(
            traslacion4(posX + 0.01, yCabeza + 0.02, posZ + 0.18),
            rotacionX(-0.12),
            escala4(0.06, 0.11, 0.08)
        );
        this.dibujarMalla(geom.vaoPiramide, geom.piramideCount, matNariz, tex.bronceEstatua);

        // Cabello ondulado volumétrico peinado hacia atrás con cuerpo lateral
        const matCabelloTop = encadenarMat4(
            traslacion4(posX, yCabeza + 0.10, posZ - 0.03),
            rotacionX(-0.10),
            escala4(0.31, 0.27, 0.31)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matCabelloTop, tex.metalOscuro);

        for (const sgnH of [-1, 1]) {
            const matOndasCabello = encadenarMat4(
                traslacion4(posX + sgnH * 0.15, yCabeza + 0.05, posZ - 0.05),
                escala4(0.12, 0.20, 0.22)
            );
            this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matOndasCabello, tex.metalOscuro);
        }

        // ---------------------------------------------------------------------
        // BRAZO DERECHO: SOSTENIENDO EL GRAN LIBRO/ESTATUTO LEGAL CONTRA EL MUSLO
        // ---------------------------------------------------------------------
        // Hombro derecho
        const matHombroDer = encadenarMat4(
            traslacion4(posX + 0.34, yTorso + 0.20, posZ + 0.01),
            escala4(0.18, 0.18, 0.18)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matHombroDer, tex.bronceEstatua);

        // Brazo derecho (descendiendo a lo largo del costado)
        const matBrazoDer = encadenarMat4(
            traslacion4(posX + 0.35, yTorso + 0.04, posZ + 0.02),
            rotacionZ(-0.18),
            rotacionX(0.12),
            escala4(0.15, 0.44, 0.15)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matBrazoDer, tex.bronceEstatua);

        // Antebrazo derecho sujetando el libro
        const matAntebrazoDer = encadenarMat4(
            traslacion4(posX + 0.37, yTorso - 0.24, posZ + 0.09),
            rotacionX(0.38),
            rotacionZ(-0.06),
            escala4(0.13, 0.38, 0.13)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matAntebrazoDer, tex.bronceEstatua);

        // Puño de camisa derecho blanco
        const matPunoDer = encadenarMat4(
            traslacion4(posX + 0.38, yTorso - 0.38, posZ + 0.14),
            escala4(0.11, 0.06, 0.11)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPunoDer, tex.blanco);

        // Mano derecha esculpida sujetando el libro
        const matManoDer = encadenarMat4(
            traslacion4(posX + 0.38, yTorso - 0.42, posZ + 0.15),
            rotacionX(0.30),
            escala4(0.11, 0.14, 0.09)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matManoDer, tex.bronceEstatua);

        // Dedos abrazando la cubierta del libro
        for (let d = 0; d < 4; d++) {
            const matDedo = encadenarMat4(
                traslacion4(posX + 0.36 - d * 0.02, yTorso - 0.45 - d * 0.02, posZ + 0.22),
                rotacionX(0.50),
                escala4(0.03, 0.08, 0.03)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matDedo, tex.bronceEstatua);
        }

        // Gran Libro de Leyes / Estatuto Universitario en cuero y oro
        // Cubierta de cuero grueso encuadernado
        const matLibro = encadenarMat4(
            traslacion4(posX + 0.38, yTorso - 0.36, posZ + 0.21),
            rotacionY(0.22),
            rotacionX(-0.16),
            escala4(0.18, 0.42, 0.30)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matLibro, tex.metalOscuro);

        // Hojas doradas / cantos de pan de oro en los tres lados abiertos
        const matCantosLibro = encadenarMat4(
            traslacion4(posX + 0.39, yTorso - 0.36, posZ + 0.21),
            rotacionY(0.22),
            rotacionX(-0.16),
            escala4(0.16, 0.40, 0.28)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCantosLibro, tex.amarillo);

        // Nervios dorados en el lomo del libro
        for (let n = -1; n <= 1; n++) {
            const matNervioLomo = encadenarMat4(
                traslacion4(posX + 0.32, yTorso - 0.36 + n * 0.12, posZ + 0.15),
                rotacionY(0.22),
                escala4(0.04, 0.025, 0.26)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matNervioLomo, tex.amarillo);
        }

        // ---------------------------------------------------------------------
        // BRAZO IZQUIERDO: ALZADO HEROICO SEÑALANDO AL CIELO CON EL ÍNDICE
        // (El gesto histórico y solemne más representativo del monumento)
        // ---------------------------------------------------------------------
        // Hombro izquierdo tenso y enérgico
        const matHombroIzq = encadenarMat4(
            traslacion4(posX - 0.33, yTorso + 0.22, posZ + 0.02),
            escala4(0.19, 0.19, 0.19)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matHombroIzq, tex.bronceEstatua);

        // Brazo izquierdo superior alzado oblicuamente a 68 grados
        const matBrazoIzq = encadenarMat4(
            traslacion4(posX - 0.44, yTorso + 0.38, posZ + 0.06),
            rotacionZ(0.72),
            rotacionX(-0.25),
            escala4(0.15, 0.48, 0.15)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matBrazoIzq, tex.bronceEstatua);

        // Codo izquierdo articulado
        const matCodoIzq = encadenarMat4(
            traslacion4(posX - 0.58, yTorso + 0.54, posZ + 0.12),
            escala4(0.15, 0.15, 0.15)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matCodoIzq, tex.bronceEstatua);

        // Antebrazo izquierdo proyectado hacia el cielo
        const matAntebrazoIzq = encadenarMat4(
            traslacion4(posX - 0.65, yTorso + 0.72, posZ + 0.18),
            rotacionZ(0.42),
            rotacionX(-0.18),
            escala4(0.13, 0.44, 0.13)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matAntebrazoIzq, tex.bronceEstatua);

        // Puño de camisa blanco asomando bajo la manga
        const matPunoIzq = encadenarMat4(
            traslacion4(posX - 0.72, yTorso + 0.90, posZ + 0.24),
            rotacionZ(0.38),
            escala4(0.10, 0.06, 0.10)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPunoIzq, tex.blanco);

        // Palma y puño cerrado de la mano izquierda
        const matPunoCerrado = encadenarMat4(
            traslacion4(posX - 0.75, yTorso + 0.96, posZ + 0.26),
            rotacionZ(0.32),
            rotacionX(-0.15),
            escala4(0.11, 0.12, 0.10)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matPunoCerrado, tex.bronceEstatua);

        // DEDO ÍNDICE EXTENDIDO APUNTANDO AL CIELO
        const matDedoIndice = encadenarMat4(
            traslacion4(posX - 0.78, yTorso + 1.09, posZ + 0.30),
            rotacionZ(0.24),
            rotacionX(-0.12),
            escala4(0.045, 0.22, 0.045)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matDedoIndice, tex.bronceEstatua);

        // Yema del dedo índice
        const matYemaIndice = encadenarMat4(
            traslacion4(posX - 0.81, yTorso + 1.20, posZ + 0.32),
            escala4(0.045, 0.045, 0.045)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matYemaIndice, tex.bronceEstatua);

        // Pulgar doblado sobre los dedos cerrados
        const matPulgar = encadenarMat4(
            traslacion4(posX - 0.71, yTorso + 0.98, posZ + 0.28),
            rotacionZ(-0.35),
            escala4(0.04, 0.10, 0.04)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPulgar, tex.bronceEstatua);
    }


    // =========================================================================
    // ÁREA VERDE PARQUIZADA Y PLAZA CÍVICA MONUMENTAL (Fiel a Imagen 2)
    // Plaza octogonal, parterres, bosquecillos arbolados, setos y jardines en todo el parque
    // =========================================================================
    crearAreaVerdeYPlazaCivica(opciones) {
        const geom = this.geom;
        const tex = this.tex;
        const zPlaza = 11.2;

        // ---------------------------------------------------------------------
        // 1. PLAZA CENTRAL OCTOGONAL CON BORDE DE MÁRMOL BLANCO (Imagen 2)
        // ---------------------------------------------------------------------
        const radioPlaza = 5.6;
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2.0;
            const matBordeOct = encadenarMat4(
                traslacion4(0, 0.14, zPlaza),
                rotacionY(ang),
                traslacion4(0, 0, radioPlaza),
                escala4(radioPlaza * 0.78, 0.28, 0.34)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matBordeOct, tex.marmolBlanco);
        }

        // 4 Farolas elegantes en las diagonales de la plaza octogonal
        const rFarola = 4.3;
        for (const sgnX of [-1, 1]) {
            for (const sgnZ of [-1, 1]) {
                this.dibujarFarolaParque(sgnX * rFarola * 0.72, 0, zPlaza + sgnZ * rFarola * 0.72, opciones);
            }
        }

        // ---------------------------------------------------------------------
        // 2. PARTERRE IZQUIERDO: JARDÍN TOPIARIO "UNAPUNO" (Imagen 2)
        // ---------------------------------------------------------------------
        const xParterreIzq = -13.35;
        const wParterre = 15.6;
        const dParterre = 9.8;
        const hCurb = 0.26;

        // Alfombra verde con letras florales blancas "UNAPUNO" y orlas botánicas
        const matParterreTextura = encadenarMat4(
            traslacion4(xParterreIzq, 0.08, zPlaza),
            escala4(wParterre - 0.5, 0.14, dParterre - 0.5)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matParterreTextura, tex.parterreUNAPUNO);

        // Bordillo perimetral en mármol blanco
        const matCurbPostIzq = encadenarMat4(
            traslacion4(xParterreIzq, hCurb / 2, zPlaza - dParterre / 2),
            escala4(wParterre, hCurb, 0.32)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbPostIzq, tex.marmolBlanco);

        const matCurbFrontIzq = encadenarMat4(
            traslacion4(xParterreIzq, hCurb / 2, zPlaza + dParterre / 2),
            escala4(wParterre, hCurb, 0.32)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbFrontIzq, tex.marmolBlanco);

        const matCurbExtIzq = encadenarMat4(
            traslacion4(xParterreIzq - wParterre / 2, hCurb / 2, zPlaza),
            escala4(0.32, hCurb, dParterre)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbExtIzq, tex.marmolBlanco);

        const matCurbIntIzq = encadenarMat4(
            traslacion4(xParterreIzq + wParterre / 2, hCurb / 2, zPlaza),
            escala4(0.32, hCurb, dParterre)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbIntIzq, tex.marmolBlanco);

        // Setos podados densos con flores perimetrales
        const hSeto = 0.65;
        const wSeto = 0.68;
        const matSetoExtIzq = encadenarMat4(
            traslacion4(xParterreIzq - wParterre / 2 + wSeto / 2 + 0.16, hSeto / 2, zPlaza),
            escala4(wSeto, hSeto, dParterre - 0.4)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matSetoExtIzq, tex.setosFlores);

        const matSetoPostIzq = encadenarMat4(
            traslacion4(xParterreIzq, hSeto / 2, zPlaza - dParterre / 2 + wSeto / 2 + 0.16),
            escala4(wParterre - 0.4, hSeto, wSeto)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matSetoPostIzq, tex.setosFlores);

        const matSetoFrontIzq = encadenarMat4(
            traslacion4(xParterreIzq, hSeto / 2, zPlaza + dParterre / 2 - wSeto / 2 - 0.16),
            escala4(wParterre - 0.4, hSeto, wSeto)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matSetoFrontIzq, tex.setosFlores);

        // Arbustos topiarios esféricos en las esquinas
        for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
                const matArb = encadenarMat4(
                    traslacion4(xParterreIzq + sx * (wParterre / 2 - 1.2), 0.72, zPlaza + sz * (dParterre / 2 - 1.2)),
                    escala4(0.95, 0.95, 0.95)
                );
                this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matArb, tex.verdePino);
            }
        }

        // 2 Pinos andinos en las esquinas exteriores del jardín izquierdo
        this.dibujarPino(-20.5, 0, zPlaza - 3.8, 1.05, opciones);
        this.dibujarPino(-20.5, 0, zPlaza + 3.8, 1.05, opciones);

        // Bancos de parque sobre el paseo peatonal izquierdo
        this.dibujarBancoParque(-5.1, 0, zPlaza + 2.4, Math.PI / 2, opciones);
        this.dibujarBancoParque(-5.1, 0, zPlaza - 2.4, Math.PI / 2, opciones);

        // ---------------------------------------------------------------------
        // 3. PARTERRE DERECHO: JARDÍN FORMAL CON MACETEROS Y FLORES (Imagen 2)
        // ---------------------------------------------------------------------
        const xParterreDer = 13.35;

        // Alfombra verde de césped
        const matCespedDer = encadenarMat4(
            traslacion4(xParterreDer, 0.08, zPlaza),
            escala4(wParterre - 0.5, 0.14, dParterre - 0.5)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCespedDer, tex.cesped);

        // Bordillo perimetral en mármol blanco
        const matCurbPostDer = encadenarMat4(
            traslacion4(xParterreDer, hCurb / 2, zPlaza - dParterre / 2),
            escala4(wParterre, hCurb, 0.32)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbPostDer, tex.marmolBlanco);

        const matCurbFrontDer = encadenarMat4(
            traslacion4(xParterreDer, hCurb / 2, zPlaza + dParterre / 2),
            escala4(wParterre, hCurb, 0.32)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbFrontDer, tex.marmolBlanco);

        const matCurbExtDer = encadenarMat4(
            traslacion4(xParterreDer + wParterre / 2, hCurb / 2, zPlaza),
            escala4(0.32, hCurb, dParterre)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbExtDer, tex.marmolBlanco);

        const matCurbIntDer = encadenarMat4(
            traslacion4(xParterreDer - wParterre / 2, hCurb / 2, zPlaza),
            escala4(0.32, hCurb, dParterre)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbIntDer, tex.marmolBlanco);

        // Setos perimetrales podados
        const matSetoExtDer = encadenarMat4(
            traslacion4(xParterreDer + wParterre / 2 - wSeto / 2 - 0.16, hSeto / 2, zPlaza),
            escala4(wSeto, hSeto, dParterre - 0.4)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matSetoExtDer, tex.setosFlores);

        const matSetoPostDer = encadenarMat4(
            traslacion4(xParterreDer, hSeto / 2, zPlaza - dParterre / 2 + wSeto / 2 + 0.16),
            escala4(wParterre - 0.4, hSeto, wSeto)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matSetoPostDer, tex.setosFlores);

        const matSetoFrontDer = encadenarMat4(
            traslacion4(xParterreDer, hSeto / 2, zPlaza + dParterre / 2 - wSeto / 2 - 0.16),
            escala4(wParterre - 0.4, hSeto, wSeto)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matSetoFrontDer, tex.setosFlores);

        // 2 Maceteros Cuadrados Grandes Elevados de Mármol Blanco con Flores y Arbustos Topiarios (Imagen 2)
        this.dibujarMaceteroFloral(xParterreDer - 3.2, 0, zPlaza, 3.2, 3.2, opciones);
        this.dibujarMaceteroFloral(xParterreDer + 3.2, 0, zPlaza, 3.2, 3.2, opciones);

        // 2 Pinos andinos en las esquinas exteriores del jardín derecho
        this.dibujarPino(20.5, 0, zPlaza - 3.8, 1.05, opciones);
        this.dibujarPino(20.5, 0, zPlaza + 3.8, 1.05, opciones);

        // Bancos de parque sobre el paseo peatonal derecho
        this.dibujarBancoParque(5.1, 0, zPlaza + 2.4, -Math.PI / 2, opciones);
        this.dibujarBancoParque(5.1, 0, zPlaza - 2.4, -Math.PI / 2, opciones);

        // 4. MACETEROS DECORATIVOS DE ESQUINA EN LAS ALAMEDAS PEATONALES (Imagen 2)
        this.dibujarMaceteroFloral(-4.4, 0, zPlaza + 4.9, 1.8, 1.8, opciones);
        this.dibujarMaceteroFloral(4.4, 0, zPlaza + 4.9, 1.8, 1.8, opciones);
        this.dibujarMaceteroFloral(-4.4, 0, zPlaza - 4.9, 1.8, 1.8, opciones);
        this.dibujarMaceteroFloral(4.4, 0, zPlaza - 4.9, 1.8, 1.8, opciones);

        // 4 Farolas de parque en las avenidas peatonales laterales
        this.dibujarFarolaParque(-5.1, 0, zPlaza + 5.2, opciones);
        this.dibujarFarolaParque(-5.1, 0, zPlaza - 5.2, opciones);
        this.dibujarFarolaParque(5.1, 0, zPlaza + 5.2, opciones);
        this.dibujarFarolaParque(5.1, 0, zPlaza - 5.2, opciones);

        // ---------------------------------------------------------------------
        // 5. NUEVA GRAN ALAMEDA Y BOSQUECILLOS DE ENTRADA (Entre el Pórtico y la Estatua)
        // Z va de 17.5 a 27.2m. Abre una perspectiva imponente hacia la estatua.
        // ---------------------------------------------------------------------
        const zCentroEntrada = 22.5;
        const wBosque = 17.5;
        const dBosque = 9.2;

        // Bordillos de mármol blanco delimitando el pasillo ceremonial central (X: -4.8 a +4.8)
        for (const sgn of [-1, 1]) {
            const matCurbAlameda = encadenarMat4(
                traslacion4(sgn * 4.9, hCurb / 2, zCentroEntrada),
                escala4(0.30, hCurb, dBosque + 0.4)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matCurbAlameda, tex.marmolBlanco);
        }

        // A. BOSQUECILLO DE ENTRADA IZQUIERDO (X: -23.0 a -5.2, Z: 17.9 a 27.1)
        const xBosqueIzq = -14.1;
        const matCespedBosqueIzq = encadenarMat4(
            traslacion4(xBosqueIzq, 0.08, zCentroEntrada),
            escala4(wBosque - 0.4, 0.14, dBosque - 0.4)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCespedBosqueIzq, tex.cesped);

        // Bordillos en mármol blanco
        const matCurbBFrontIzq = encadenarMat4(
            traslacion4(xBosqueIzq, hCurb / 2, zCentroEntrada + dBosque / 2),
            escala4(wBosque, hCurb, 0.32)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbBFrontIzq, tex.marmolBlanco);

        const matCurbBPostIzq = encadenarMat4(
            traslacion4(xBosqueIzq, hCurb / 2, zCentroEntrada - dBosque / 2),
            escala4(wBosque, hCurb, 0.32)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbBPostIzq, tex.marmolBlanco);

        const matCurbBExtIzq = encadenarMat4(
            traslacion4(xBosqueIzq - wBosque / 2, hCurb / 2, zCentroEntrada),
            escala4(0.32, hCurb, dBosque)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbBExtIzq, tex.marmolBlanco);

        // Seto frontal decorativo
        const matSetoBosqueIzq = encadenarMat4(
            traslacion4(xBosqueIzq, hSeto / 2, zCentroEntrada + dBosque / 2 - 0.45),
            escala4(wBosque - 0.8, hSeto, 0.65)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matSetoBosqueIzq, tex.setosFlores);

        // 4 Grandes Árboles Frondosos en el Bosquecillo Izquierdo
        this.dibujarArbolFrondoso(-9.2, 0, zCentroEntrada + 2.2, 1.15, opciones);
        this.dibujarArbolFrondoso(-18.5, 0, zCentroEntrada + 2.2, 1.10, opciones);
        this.dibujarArbolFrondoso(-9.2, 0, zCentroEntrada - 2.2, 1.12, opciones);
        this.dibujarArbolFrondoso(-18.5, 0, zCentroEntrada - 2.2, 1.08, opciones);

        // Macetero elevado central con flores
        this.dibujarMaceteroFloral(-13.8, 0, zCentroEntrada, 2.8, 2.8, opciones);

        // Bancos de parque para contemplar la alameda y la estatua
        this.dibujarBancoParque(-5.3, 0, zCentroEntrada + 2.2, Math.PI / 2, opciones);
        this.dibujarBancoParque(-5.3, 0, zCentroEntrada - 2.2, Math.PI / 2, opciones);

        // Farolas iluminando la alameda de entrada
        this.dibujarFarolaParque(-5.1, 0, zCentroEntrada + 3.8, opciones);
        this.dibujarFarolaParque(-5.1, 0, zCentroEntrada - 3.8, opciones);

        // B. BOSQUECILLO DE ENTRADA DERECHO (X: +5.2 a +23.0, Z: 17.9 a 27.1)
        const xBosqueDer = 14.1;
        const matCespedBosqueDer = encadenarMat4(
            traslacion4(xBosqueDer, 0.08, zCentroEntrada),
            escala4(wBosque - 0.4, 0.14, dBosque - 0.4)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCespedBosqueDer, tex.cesped);

        // Bordillos en mármol blanco
        const matCurbBFrontDer = encadenarMat4(
            traslacion4(xBosqueDer, hCurb / 2, zCentroEntrada + dBosque / 2),
            escala4(wBosque, hCurb, 0.32)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbBFrontDer, tex.marmolBlanco);

        const matCurbBPostDer = encadenarMat4(
            traslacion4(xBosqueDer, hCurb / 2, zCentroEntrada - dBosque / 2),
            escala4(wBosque, hCurb, 0.32)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbBPostDer, tex.marmolBlanco);

        const matCurbBExtDer = encadenarMat4(
            traslacion4(xBosqueDer + wBosque / 2, hCurb / 2, zCentroEntrada),
            escala4(0.32, hCurb, dBosque)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCurbBExtDer, tex.marmolBlanco);

        // Seto frontal decorativo
        const matSetoBosqueDer = encadenarMat4(
            traslacion4(xBosqueDer, hSeto / 2, zCentroEntrada + dBosque / 2 - 0.45),
            escala4(wBosque - 0.8, hSeto, 0.65)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matSetoBosqueDer, tex.setosFlores);

        // 4 Grandes Árboles Frondosos en el Bosquecillo Derecho
        this.dibujarArbolFrondoso(9.2, 0, zCentroEntrada + 2.2, 1.15, opciones);
        this.dibujarArbolFrondoso(18.5, 0, zCentroEntrada + 2.2, 1.10, opciones);
        this.dibujarArbolFrondoso(9.2, 0, zCentroEntrada - 2.2, 1.12, opciones);
        this.dibujarArbolFrondoso(18.5, 0, zCentroEntrada - 2.2, 1.08, opciones);

        // Macetero elevado central con flores
        this.dibujarMaceteroFloral(13.8, 0, zCentroEntrada, 2.8, 2.8, opciones);

        // Bancos de parque
        this.dibujarBancoParque(5.3, 0, zCentroEntrada + 2.2, -Math.PI / 2, opciones);
        this.dibujarBancoParque(5.3, 0, zCentroEntrada - 2.2, -Math.PI / 2, opciones);

        // Farolas iluminando la alameda de entrada
        this.dibujarFarolaParque(5.1, 0, zCentroEntrada + 3.8, opciones);
        this.dibujarFarolaParque(5.1, 0, zCentroEntrada - 3.8, opciones);

        // ---------------------------------------------------------------------
        // 6. ALAMEDAS LATERALES ARBOLADAS A LO LARGO DE LOS MUROS PERIMETRALES
        // 10 árboles y franja ajardinada verde flanqueando los límites este y oeste
        // ---------------------------------------------------------------------
        for (const sgnX of [-1, 1]) {
            const xAvenida = sgnX * 24.8;

            // Franja continua de césped a lo largo de la pared perimetral
            const matFranjaCesped = encadenarMat4(
                traslacion4(xAvenida, 0.04, 3.0),
                escala4(2.8, 0.08, 48.0)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matFranjaCesped, tex.cesped);

            // Borde de piedra blanca
            const matBordeFranja = encadenarMat4(
                traslacion4(xAvenida - sgnX * 1.45, 0.10, 3.0),
                escala4(0.18, 0.20, 48.0)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matBordeFranja, tex.marmolBlanco);

            // Hilera de árboles ornamentales a intervalos regulares
            this.dibujarArbolFrondoso(xAvenida, 0, 13.0, 0.95, opciones);
            this.dibujarPino(xAvenida, 0, 4.0, 1.0, opciones);
            this.dibujarArbolFrondoso(xAvenida, 0, -4.0, 0.95, opciones);
            this.dibujarPino(xAvenida, 0, -12.0, 1.05, opciones);
            this.dibujarArbolFrondoso(xAvenida, 0, -19.0, 0.90, opciones);
        }

        // ---------------------------------------------------------------------
        // 7. BOSQUECILLOS Y JARDINES FLANQUEANDO LA RUEDA DE LA FORTUNA (Z: -6 a -22m)
        // Transforman los espacios antes vacíos en parques sombreados con asientos
        // ---------------------------------------------------------------------
        const zRuedaJardines = -13.5;
        const wJardinRueda = 10.5;
        const dJardinRueda = 14.5;

        for (const sgn of [-1, 1]) {
            const xJardinR = sgn * 16.8;

            // Césped verde
            const matCespedR = encadenarMat4(
                traslacion4(xJardinR, 0.08, zRuedaJardines),
                escala4(wJardinRueda, 0.14, dJardinRueda)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matCespedR, tex.cesped);

            // Bordillo perimetral en mármol
            const matCurbRFront = encadenarMat4(
                traslacion4(xJardinR, hCurb / 2, zRuedaJardines + dJardinRueda / 2),
                escala4(wJardinRueda, hCurb, 0.28)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matCurbRFront, tex.marmolBlanco);

            const matCurbRPost = encadenarMat4(
                traslacion4(xJardinR, hCurb / 2, zRuedaJardines - dJardinRueda / 2),
                escala4(wJardinRueda, hCurb, 0.28)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matCurbRPost, tex.marmolBlanco);

            const matCurbRInt = encadenarMat4(
                traslacion4(xJardinR - sgn * (wJardinRueda / 2), hCurb / 2, zRuedaJardines),
                escala4(0.28, hCurb, dJardinRueda)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matCurbRInt, tex.marmolBlanco);

            // 4 Árboles en cada flanco de la rueda
            this.dibujarArbolFrondoso(xJardinR - sgn * 2.5, 0, zRuedaJardines + 4.2, 1.10, opciones);
            this.dibujarArbolFrondoso(xJardinR + sgn * 2.5, 0, zRuedaJardines + 4.2, 1.05, opciones);
            this.dibujarArbolFrondoso(xJardinR - sgn * 2.5, 0, zRuedaJardines - 4.2, 1.12, opciones);
            this.dibujarArbolFrondoso(xJardinR + sgn * 2.5, 0, zRuedaJardines - 4.2, 1.08, opciones);

            // Macetero floral central y banco
            this.dibujarMaceteroFloral(xJardinR, 0, zRuedaJardines, 2.4, 2.4, opciones);
            this.dibujarBancoParque(xJardinR - sgn * (wJardinRueda / 2 - 0.8), 0, zRuedaJardines, sgn * Math.PI / 2, opciones);
        }

        // Cortina vegetal de pinos en el fondo trasero de la rueda (Z: -21.0m)
        this.dibujarPino(-6.0, 0, -20.5, 1.15, opciones);
        this.dibujarPino(0.0, 0, -21.2, 1.25, opciones);
        this.dibujarPino(6.0, 0, -20.5, 1.15, opciones);

        // ---------------------------------------------------------------------
        // 8. ISLAS VERDES DE BIENVENIDA EXTERIOR (Frente al Pórtico en Z: 34.0m)
        // ---------------------------------------------------------------------
        this.dibujarArbolFrondoso(-14.0, 0, 34.0, 1.15, opciones);
        this.dibujarArbolFrondoso(14.0, 0, 34.0, 1.15, opciones);
        this.dibujarMaceteroFloral(-14.0, 0, 31.0, 2.2, 2.2, opciones);
        this.dibujarMaceteroFloral(14.0, 0, 31.0, 2.2, 2.2, opciones);
    }

    // Farola ornamental de doble globo cálido para la entrada exterior
    dibujarFarola(x, y, z, opciones) {
        const geom = this.geom;
        const tex = this.tex;

        // Poste cilíndrico
        const matPoste = encadenarMat4(
            traslacion4(x, y + 2.2, z),
            escala4(0.12, 4.4, 0.12)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPoste, tex.metalOscuro);

        // Brazo horizontal
        const matBrazo = encadenarMat4(
            traslacion4(x, y + 4.3, z),
            escala4(1.2, 0.08, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matBrazo, tex.metalOscuro);

        // Farol izquierdo
        const matFarolIzq = encadenarMat4(
            traslacion4(x - 0.55, y + 4.15, z),
            escala4(0.35, 0.42, 0.35)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matFarolIzq, tex.amarillo, {
            ...opciones,
            emissive: 1.0,
            emissiveColor: [1.0, 0.85, 0.45]
        });

        // Farol derecho
        const matFarolDer = encadenarMat4(
            traslacion4(x + 0.55, y + 4.15, z),
            escala4(0.35, 0.42, 0.35)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matFarolDer, tex.amarillo, {
            ...opciones,
            emissive: 1.0,
            emissiveColor: [1.0, 0.85, 0.45]
        });
    }

    // =========================================================================
    // 2. NORIA PANORÁMICA DE FERIA (RUEDA DE LA FORTUNA CON CABINAS OSCILANTES)
    // Basado fielmente en la infografía: Jerarquía, física pendular, letrero neón y línea orbital
    // =========================================================================

    /**
     * 1. TORRES DE SOPORTE (Estructura en «A» con Celosía de Refuerzo)
     * Cuatro columnas cilíndricas inclinadas formando dos estructuras en «A».
     */
    crearTorresSoporte(posX, alturaEje, posZ, opciones) {
        const geom = this.geom;
        const tex = this.tex;

        // Dos estructuras monumentales en A: Frontal (Z = posZ + 2.35) y Trasera (Z = posZ - 2.35)
        const planosZ = [posZ + 2.35, posZ - 2.35];
        const baseAncho = 8.2; // Semiancho en la base (ancho total 16.4m para máxima estabilidad a 21m de elevación)
        const anguloInclinacion = Math.atan2(baseAncho, alturaEje);
        const longitudColumna = Math.hypot(baseAncho, alturaEje) + 0.8;

        for (const zTorre of planosZ) {
            // Pata Izquierda de la "A"
            const matPataIzq = encadenarMat4(
                traslacion4(posX - baseAncho / 2, alturaEje / 2, zTorre),
                rotacionZ(-anguloInclinacion),
                escala4(0.56, longitudColumna, 0.56)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPataIzq, tex.azul);

            // Pata Derecha de la "A"
            const matPataDer = encadenarMat4(
                traslacion4(posX + baseAncho / 2, alturaEje / 2, zTorre),
                rotacionZ(anguloInclinacion),
                escala4(0.56, longitudColumna, 0.56)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPataDer, tex.azul);

            // Travesaño horizontal intermedio inferior de la "A" (Y = 7.2m)
            const yTravesano1 = 7.2;
            const wTravesano1 = (1.0 - yTravesano1 / alturaEje) * baseAncho * 2.0;
            const matTravesano1 = encadenarMat4(
                traslacion4(posX, yTravesano1, zTorre),
                escala4(wTravesano1, 0.32, 0.36)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matTravesano1, tex.acero);

            // Travesaño horizontal intermedio superior de la "A" (Y = 14.5m)
            const yTravesano2 = 14.5;
            const wTravesano2 = (1.0 - yTravesano2 / alturaEje) * baseAncho * 2.0;
            const matTravesano2 = encadenarMat4(
                traslacion4(posX, yTravesano2, zTorre),
                escala4(wTravesano2, 0.28, 0.32)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matTravesano2, tex.acero);

            // Celosías diagonales en "X" en sección inferior (0m a 7.2m)
            const matDiagonal1 = encadenarMat4(
                traslacion4(posX, yTravesano1 / 2, zTorre),
                rotacionZ(0.50),
                escala4(0.15, 9.4, 0.15)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matDiagonal1, tex.blanco);

            const matDiagonal2 = encadenarMat4(
                traslacion4(posX, yTravesano1 / 2, zTorre),
                rotacionZ(-0.50),
                escala4(0.15, 9.4, 0.15)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matDiagonal2, tex.blanco);

            // Celosías diagonales en "X" en sección media (7.2m a 14.5m)
            const matDiagonal3 = encadenarMat4(
                traslacion4(posX, 10.85, zTorre),
                rotacionZ(0.42),
                escala4(0.13, 7.8, 0.13)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matDiagonal3, tex.blanco);

            const matDiagonal4 = encadenarMat4(
                traslacion4(posX, 10.85, zTorre),
                rotacionZ(-0.42),
                escala4(0.13, 7.8, 0.13)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matDiagonal4, tex.blanco);

            // Zapatas / Placas de anclaje de acero macizo en el suelo
            for (const sgn of [-1, 1]) {
                const matZapata = encadenarMat4(
                    traslacion4(posX + sgn * baseAncho, 0.20, zTorre),
                    escala4(1.8, 0.40, 1.8)
                );
                this.dibujarMalla(geom.vaoCaja, 36, matZapata, tex.acero);
            }
        }

        // Viguetas transversales que conectan en Z la estructura frontal con la trasera
        for (const sgn of [-1, 1]) {
            const matVigaZ = encadenarMat4(
                traslacion4(posX + sgn * 4.6, 7.2, posZ),
                rotacionX(Math.PI / 2),
                escala4(0.22, 4.7, 0.22)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matVigaZ, tex.acero);

            const matVigaZSup = encadenarMat4(
                traslacion4(posX + sgn * 2.2, 14.5, posZ),
                rotacionX(Math.PI / 2),
                escala4(0.20, 4.7, 0.20)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matVigaZSup, tex.acero);
        }

        // Buje / Eje central horizontal macizo de gran calibre
        const matEje = encadenarMat4(
            traslacion4(posX, alturaEje, posZ),
            rotacionX(Math.PI / 2),
            escala4(0.92, 5.4, 0.92)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matEje, tex.metalOscuro);

        // Cojinetes de rodamiento reforzados en la cima de cada torre
        for (const zTorre of planosZ) {
            const matCojinete = encadenarMat4(
                traslacion4(posX, alturaEje, zTorre),
                escala4(1.2, 1.2, 0.55)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matCojinete, tex.acero);
        }
    }

    /**
     * 2. ANILLOS DE LA RUEDA Y RADIOS (Estructura Giratoria)
     * Dos círculos cilíndricos delgados concéntricos unidos por radios cilíndricos (cada 45°).
     */
    crearAnillosRueda(matCentroRueda, radioExterior, radioInterior, opciones) {
        const geom = this.geom;
        const tex = this.tex;
        const zPlanes = [1.35, -1.35];

        for (const zOffset of zPlanes) {
            // Anillo exterior delgado
            const matAnilloExt = encadenarMat4(matCentroRueda, traslacion4(0, 0, zOffset));
            this.dibujarMalla(geom.vaoToroExt, geom.toroExtCount, matAnilloExt, tex.metalRojo, {
                ...opciones,
                emissive: 0.35,
                emissiveColor: [1.0, 0.2, 0.25]
            });

            // Anillo interior concéntrico delgado
            const matAnilloInt = encadenarMat4(matCentroRueda, traslacion4(0, 0, zOffset));
            this.dibujarMalla(geom.vaoToroInt, geom.toroIntCount, matAnilloInt, tex.metalBlanco, {
                ...opciones,
                emissive: 0.25,
                emissiveColor: [0.9, 0.95, 1.0]
            });
        }

        // 16 Radios cilíndricos (cada 22.5°, con los 8 principales a 45° y 8 secundarios)
        const totalRadios = 16;
        for (let i = 0; i < totalRadios; i++) {
            const alfa = (i / totalRadios) * Math.PI * 2.0;

            // Radios frontal y posterior conectando el buje con el anillo exterior
            for (const zOffset of zPlanes) {
                const matRadio = encadenarMat4(
                    matCentroRueda,
                    traslacion4(0, 0, zOffset),
                    rotacionZ(alfa),
                    traslacion4(0, radioExterior / 2, 0),
                    escala4(0.08, radioExterior, 0.08)
                );
                this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matRadio, tex.blanco);

                // Celosía diagonal entre el anillo interior y el exterior (en zig-zag)
                const angDiagonal = alfa + (Math.PI / totalRadios) * 0.5;
                const rMedio = (radioInterior + radioExterior) / 2;
                const lenCelosia = (radioExterior - radioInterior) * 1.15;
                const matCelosia = encadenarMat4(
                    matCentroRueda,
                    traslacion4(0, 0, zOffset),
                    rotacionZ(angDiagonal),
                    traslacion4(0, rMedio, 0),
                    rotacionZ((i % 2 === 0 ? 0.45 : -0.45)),
                    escala4(0.045, lenCelosia, 0.045)
                );
                this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matCelosia, tex.acero);
            }

            // Travesaño transversal en Z uniendo el radio frontal con el trasero en el borde
            const matSeparadorZ = encadenarMat4(
                matCentroRueda,
                rotacionZ(alfa),
                traslacion4(0, radioExterior, 0),
                rotacionX(Math.PI / 2),
                escala4(0.08, 2.7, 0.08)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matSeparadorZ, tex.acero);

            // Travesaño transversal en el anillo interior
            const matSeparadorZInt = encadenarMat4(
                matCentroRueda,
                rotacionZ(alfa),
                traslacion4(0, radioInterior, 0),
                rotacionX(Math.PI / 2),
                escala4(0.07, 2.7, 0.07)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matSeparadorZInt, tex.acero);

            // Bombillas LED festivas animadas en los radios
            const faseColor = Math.sin(this.tiempoGlobal * 3.5 + i * 0.8) * 0.5 + 0.5;
            for (const rLed of [radioInterior, radioExterior * 0.78, radioExterior]) {
                const matLed = encadenarMat4(
                    matCentroRueda,
                    traslacion4(0, 0, 1.42),
                    rotacionZ(alfa),
                    traslacion4(0, rLed, 0),
                    escala4(0.22, 0.22, 0.22)
                );
                this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matLed, tex.amarillo, {
                    ...opciones,
                    emissive: 1.0,
                    emissiveColor: [faseColor, 1.0 - faseColor, 0.8 + 0.2 * faseColor]
                });
            }
        }
    }

    /**
     * 3. CABINA OSCILANTE PANORÁMICA AGRANDADA (Casetas Espaciosas con Gran Ventanal)
     * Dimensiones ampliadas: 2.40m ancho x 2.00m fondo x 2.40m altura.
     * Jerarquía y física: contra-rotación automática y oscilación pendular armónica
     */
    crearCabina(matGondolaAlineada, colorPintura, opciones) {
        const geom = this.geom;
        const tex = this.tex;

        // Eje transversal de suspensión cilíndrico robusto
        const matBarraEje = encadenarMat4(
            matGondolaAlineada,
            rotacionX(Math.PI / 2),
            escala4(0.14, 3.8, 0.14)
        );
        this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matBarraEje, tex.acero);

        // Tirantes / Horquilla de suspensión superior (bajan del eje al techo de la cabina)
        for (const zSide of [-0.95, 0.95]) {
            const matHorquilla = encadenarMat4(
                matGondolaAlineada,
                traslacion4(0, -0.425, zSide),
                escala4(0.08, 0.85, 0.08)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matHorquilla, tex.acero);
        }

        // Techo de la cabina: moldura perimetral base
        const matTechoBase = encadenarMat4(
            matGondolaAlineada,
            traslacion4(0, -0.85, 0),
            escala4(2.45, 0.18, 2.05)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matTechoBase, tex.blanco);

        // Cúpula piramidal facetada del techo (4 aguas)
        const matTechoPiramide = encadenarMat4(
            matGondolaAlineada,
            traslacion4(0, -0.62, 0),
            rotacionY(Math.PI / 4), // alineada con los 4 lados de la cabina
            escala4(1.75, 0.46, 1.75)
        );
        this.dibujarMalla(geom.vaoPiramide, geom.piramideCount, matTechoPiramide, colorPintura);

        // Remate / Pináculo esférico dorado en la cúspide del techo
        const matPinaculo = encadenarMat4(
            matGondolaAlineada,
            traslacion4(0, -0.32, 0),
            escala4(0.20, 0.20, 0.20)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matPinaculo, tex.amarillo, {
            ...opciones,
            emissive: 0.8,
            emissiveColor: [1.0, 0.85, 0.3]
        });

        // 4 Columnas esquineras estructurales
        for (const sx of [-1.16, 1.16]) {
            for (const sz of [-0.96, 0.96]) {
                const matEsquina = encadenarMat4(
                    matGondolaAlineada,
                    traslacion4(sx, -1.45, sz),
                    escala4(0.10, 1.05, 0.10)
                );
                this.dibujarMalla(geom.vaoCaja, 36, matEsquina, tex.blanco);
            }
        }

        // 4 Grandes Ventanales Acristalados Panorámicos Transparentes
        // Ventana Frontal (+Z)
        const matVentanaFront = encadenarMat4(
            matGondolaAlineada,
            traslacion4(0, -1.45, 0.99),
            escala4(2.20, 1.02, 1.0)
        );
        this.dibujarMalla(geom.vaoPanel, geom.panelCount, matVentanaFront, tex.vidrioCabina);

        // Ventana Trasera (-Z)
        const matVentanaBack = encadenarMat4(
            matGondolaAlineada,
            traslacion4(0, -1.45, -0.99),
            rotacionY(Math.PI),
            escala4(2.20, 1.02, 1.0)
        );
        this.dibujarMalla(geom.vaoPanel, geom.panelCount, matVentanaBack, tex.vidrioCabina);

        // Ventana Izquierda (-X)
        const matVentanaIzq = encadenarMat4(
            matGondolaAlineada,
            traslacion4(-1.19, -1.45, 0),
            rotacionY(-Math.PI / 2),
            escala4(1.80, 1.02, 1.0)
        );
        this.dibujarMalla(geom.vaoPanel, geom.panelCount, matVentanaIzq, tex.vidrioCabina);

        // Ventana Derecha (+X)
        const matVentanaDer = encadenarMat4(
            matGondolaAlineada,
            traslacion4(1.19, -1.45, 0),
            rotacionY(Math.PI / 2),
            escala4(1.80, 1.02, 1.0)
        );
        this.dibujarMalla(geom.vaoPanel, geom.panelCount, matVentanaDer, tex.vidrioCabina);

        // Faldón / Carrocería inferior de la caseta (color distintivo)
        const matFaldon = encadenarMat4(
            matGondolaAlineada,
            traslacion4(0, -2.35, 0),
            escala4(2.40, 0.80, 2.00)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matFaldon, colorPintura);

        // Zócalo perimetral inferior de protección de acero
        const matZocaloCabina = encadenarMat4(
            matGondolaAlineada,
            traslacion4(0, -2.72, 0),
            escala4(2.44, 0.12, 2.04)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matZocaloCabina, tex.acero);

        // Asientos interiores dobles enfrentados visibles desde fuera
        for (const sz of [-0.55, 0.55]) {
            // Banqueta
            const matAsiento = encadenarMat4(
                matGondolaAlineada,
                traslacion4(0, -2.15, sz),
                escala4(2.10, 0.26, 0.50)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matAsiento, tex.madera);

            // Respaldo
            const matRespaldo = encadenarMat4(
                matGondolaAlineada,
                traslacion4(0, -1.82, sz),
                escala4(2.10, 0.42, 0.08)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matRespaldo, tex.madera);
        }

        // Baliza / Farolito LED decorativo bajo la cabina
        const matLuzCabina = encadenarMat4(
            matGondolaAlineada,
            traslacion4(0, -2.90, 0),
            escala4(0.24, 0.24, 0.24)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matLuzCabina, tex.amarillo, {
            ...opciones,
            emissive: 1.0,
            emissiveColor: [1.0, 0.9, 0.3]
        });
    }

    /**
     * 4. TAQUILLA (Prisma rectangular en la base con techo piramidal)
     * Reubicada estratégicamente al pie de la subidita/rampa de acceso
     */
    crearTaquilla(posX, posY, posZ, opciones) {
        const geom = this.geom;
        const tex = this.tex;

        // Ubicada al costado del acceso peatonal de la subidita
        const xT = posX - 6.2;
        const yT = posY;
        const zT = 3.5;

        const wT = 2.8;
        const hT = 2.4;
        const dT = 2.4;

        // Chasis / Paredes del prisma
        const matCuerpo = encadenarMat4(
            traslacion4(xT, yT + hT / 2, zT),
            escala4(wT, hT, dT)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCuerpo, tex.taquilla);

        // Zócalo azul inferior
        const matZocalo = encadenarMat4(
            traslacion4(xT, yT + 0.22, zT),
            escala4(wT + 0.12, 0.44, dT + 0.12)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matZocalo, tex.azul);

        // Cornisa perimetral superior blanca
        const matCornisa = encadenarMat4(
            traslacion4(xT, yT + hT + 0.08, zT),
            escala4(wT + 0.25, 0.16, dT + 0.25)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCornisa, tex.blanco);

        // Techo piramidal azul a 4 aguas
        const hTecho = 1.25;
        const matTecho = encadenarMat4(
            traslacion4(xT, yT + hT + 0.16 + hTecho / 2, zT),
            rotacionY(Math.PI / 4), // orientar caras a los 4 vientos
            escala4(2.2, hTecho, 2.2)
        );
        this.dibujarMalla(geom.vaoPiramide, geom.piramideCount, matTecho, tex.azul);

        // Farolito cálido en el alero frontal sobre la ventanilla
        const matFarol = encadenarMat4(
            traslacion4(xT, yT + hT, zT + dT / 2 + 0.25),
            escala4(0.22, 0.22, 0.22)
        );
        this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matFarol, tex.amarillo, {
            ...opciones,
            emissive: 1.0,
            emissiveColor: [1.0, 0.85, 0.4]
        });

        // Mostrador / Repisa de despacho de boletos
        const matRepisa = encadenarMat4(
            traslacion4(xT, yT + 1.15, zT + dT / 2 + 0.18),
            escala4(1.2, 0.08, 0.36)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matRepisa, tex.madera);
    }

    /**
     * 5. SUBIDITA Y PLATAFORMA ELEVADA DE EMBARQUE
     * Rampa monumental inclinada ("subidita") con barandillas dobles, escalones antideslizantes,
     * arco de bienvenida iluminado y plataforma elevada a 3.80m, garantizando que las cabinas
     * nunca pasen por debajo ni toquen la base.
     */
    crearSubiditaYPlataforma(posX, posZ, opciones) {
        const geom = this.geom;
        const tex = this.tex;

        // ---------------------------------------------------------------------
        // A. PLATAFORMA ELEVADA DE EMBARQUE (Cota Y = 3.80m)
        // ---------------------------------------------------------------------
        const altPlat = 3.80;
        const profPlat = 6.00; // De Z = -3.00 a Z = -9.00
        const zPlat = -6.00;
        const anchoPlat = 17.0;

        // Tablero / Piso principal de la plataforma
        const matPisoPlat = encadenarMat4(
            traslacion4(posX, altPlat - 0.12, zPlat),
            escala4(anchoPlat, 0.24, profPlat)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matPisoPlat, tex.madera);

        // Viguetas perimetrales de acero estructural bajo el tablero
        const matBordeFrontal = encadenarMat4(
            traslacion4(posX, altPlat - 0.28, zPlat + profPlat / 2),
            escala4(anchoPlat, 0.24, 0.24)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matBordeFrontal, tex.acero);

        const matBordeTrasero = encadenarMat4(
            traslacion4(posX, altPlat - 0.28, zPlat - profPlat / 2),
            escala4(anchoPlat, 0.24, 0.24)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matBordeTrasero, tex.acero);

        // Columnas cilíndricas de soporte estructural de la plataforma
        const xCols = [-7.5, -2.8, 2.8, 7.5];
        const zCols = [zPlat + profPlat / 2 - 0.45, zPlat - profPlat / 2 + 0.45];
        for (const xc of xCols) {
            for (const zc of zCols) {
                const matCol = encadenarMat4(
                    traslacion4(posX + xc, (altPlat - 0.24) / 2, zc),
                    escala4(0.40, altPlat - 0.24, 0.40)
                );
                this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matCol, tex.acero);
            }
        }

        // Barandas de seguridad en la plataforma elevada (altura 1.05m sobre piso)
        const hBaranda = 1.05;
        const yBaranda = altPlat + hBaranda / 2;

        // Baranda posterior completa (fondo de seguridad)
        const matBarandaPost = encadenarMat4(
            traslacion4(posX, altPlat + hBaranda, zPlat - profPlat / 2 + 0.08),
            escala4(anchoPlat, 0.08, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matBarandaPost, tex.acero);

        // Barandas laterales (Izquierda y Derecha)
        for (const sgn of [-1, 1]) {
            const matBarandaLat = encadenarMat4(
                traslacion4(posX + sgn * (anchoPlat / 2 - 0.08), altPlat + hBaranda, zPlat),
                escala4(0.08, 0.08, profPlat)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matBarandaLat, tex.acero);

            // Postes de barandas laterales
            for (let zPost = zPlat - profPlat / 2 + 0.4; zPost <= zPlat + profPlat / 2; zPost += 1.2) {
                const matPoste = encadenarMat4(
                    traslacion4(posX + sgn * (anchoPlat / 2 - 0.08), yBaranda, zPost),
                    escala4(0.07, hBaranda, 0.07)
                );
                this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPoste, tex.azul);
            }
        }

        // Baranda frontal (a ambos lados del desembarque de la subidita)
        // La subidita tiene ancho 4.80m (de X = -2.4 a X = 2.4)
        // Tramo izquierdo frontal: X de -8.5 a -2.4 (longitud 6.1m)
        const matBarandaFrontIzq = encadenarMat4(
            traslacion4(posX - 5.45, altPlat + hBaranda, zPlat + profPlat / 2 - 0.08),
            escala4(6.1, 0.08, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matBarandaFrontIzq, tex.acero);

        // Tramo derecho frontal: X de 2.4 a 8.5 (longitud 6.1m)
        const matBarandaFrontDer = encadenarMat4(
            traslacion4(posX + 5.45, altPlat + hBaranda, zPlat + profPlat / 2 - 0.08),
            escala4(6.1, 0.08, 0.08)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matBarandaFrontDer, tex.acero);

        // Franja de seguridad reflectante en el borde de aproximación a las cabinas
        const matFranjaSeg = encadenarMat4(
            traslacion4(posX, altPlat + 0.01, zPlat - profPlat / 2 + 0.6),
            escala4(anchoPlat - 1.0, 0.02, 0.35)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matFranjaSeg, tex.amarillo, {
            ...opciones,
            emissive: 0.6,
            emissiveColor: [1.0, 0.85, 0.2]
        });

        // Caseta de control del operador en la plataforma (lado derecho)
        const matCaseta = encadenarMat4(
            traslacion4(posX + 6.2, altPlat + 1.35, zPlat),
            escala4(2.5, 2.7, 2.5)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matCaseta, tex.blanco);

        // Ventanal de observación de la caseta de control
        const matVentanaCaseta = encadenarMat4(
            traslacion4(posX + 4.94, altPlat + 1.55, zPlat),
            rotacionY(-Math.PI / 2),
            escala4(2.0, 1.3, 1.0)
        );
        this.dibujarMalla(geom.vaoPanel, geom.panelCount, matVentanaCaseta, tex.vidrioCabina);

        // Techo de la caseta
        const matTechoCaseta = encadenarMat4(
            traslacion4(posX + 6.2, altPlat + 2.75, zPlat),
            escala4(2.7, 0.16, 2.7)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matTechoCaseta, tex.azul);

        // Consola de control con pantalla
        const matConsola = encadenarMat4(
            traslacion4(posX + 5.15, altPlat + 0.85, zPlat),
            escala4(0.55, 0.85, 1.3)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matConsola, tex.metalOscuro);

        // ---------------------------------------------------------------------
        // B. LA "SUBIDITA" (RAMPA DE ACCESO PEATONAL ELEVADA)
        // Va desde Z = 4.50 (suelo, Y = 0) hasta Z = -3.00 (plataforma, Y = 3.80)
        // ---------------------------------------------------------------------
        const zInicioRampa = 4.50;
        const zFinRampa = zPlat + profPlat / 2; // -3.00
        const deltaZ = zInicioRampa - zFinRampa; // 7.50m
        const deltaY = altPlat; // 3.80m
        const anguloRampa = Math.atan2(deltaY, deltaZ); // ~26.8°
        const longitudRampa = Math.hypot(deltaZ, deltaY); // ~8.41m
        const zCentroRampa = (zInicioRampa + zFinRampa) / 2; // 0.75m
        const yCentroRampa = altPlat / 2; // 1.90m
        const anchoRampa = 4.80;

        // Plano inclinado / rampa estructural de madera
        const matRampaPiso = encadenarMat4(
            traslacion4(posX, yCentroRampa, zCentroRampa),
            rotacionX(anguloRampa),
            escala4(anchoRampa, 0.24, longitudRampa)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matRampaPiso, tex.madera);

        // Muros laterales de contención de la rampa (cimientos sólidos macizos)
        for (const sgn of [-1, 1]) {
            const matMuroBase = encadenarMat4(
                traslacion4(posX + sgn * (anchoRampa / 2 + 0.08), yCentroRampa / 2, zCentroRampa),
                escala4(0.18, yCentroRampa, deltaZ)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matMuroBase, tex.acero);
        }

        // Listones / Escalones transversales antideslizantes sobre la subidita
        const numEscalones = 16;
        for (let i = 0; i < numEscalones; i++) {
            const t = (i + 0.5) / numEscalones;
            const zEsc = zInicioRampa - t * deltaZ;
            const yEsc = t * deltaY + 0.14;

            const matListon = encadenarMat4(
                traslacion4(posX, yEsc, zEsc),
                rotacionX(anguloRampa),
                escala4(anchoRampa - 0.2, 0.06, 0.14)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matListon, tex.metalOscuro);
        }

        // Barandas inclinadas de seguridad a ambos lados de la "Subidita"
        for (const sgn of [-1, 1]) {
            const xBar = posX + sgn * (anchoRampa / 2 - 0.08);

            // Pasamanos superior inclinado
            const matPasamanos = encadenarMat4(
                traslacion4(xBar, yCentroRampa + hBaranda, zCentroRampa),
                rotacionX(anguloRampa),
                escala4(0.08, 0.08, longitudRampa)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPasamanos, tex.acero);

            // Barra intermedia de seguridad inclinada
            const matBarraMedia = encadenarMat4(
                traslacion4(xBar, yCentroRampa + hBaranda * 0.5, zCentroRampa),
                rotacionX(anguloRampa),
                escala4(0.05, 0.05, longitudRampa)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matBarraMedia, tex.acero);

            // Postes verticales de soporte a lo largo de la rampa
            const numPostesRampa = 8;
            for (let p = 0; p < numPostesRampa; p++) {
                const frac = p / (numPostesRampa - 1);
                const zp = zInicioRampa - frac * deltaZ;
                const yp = frac * deltaY;

                const matPosteRampa = encadenarMat4(
                    traslacion4(xBar, yp + hBaranda / 2, zp),
                    escala4(0.07, hBaranda, 0.07)
                );
                this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPosteRampa, tex.azul);
            }
        }

        // ---------------------------------------------------------------------
        // C. ARCO MONUMENTAL DE ENTRADA A LA SUBIDITA (Z = 4.50m)
        // ---------------------------------------------------------------------
        const hPilastra = 5.0;
        const xPilastras = [-anchoRampa / 2 - 0.25, anchoRampa / 2 + 0.25];

        for (const xp of xPilastras) {
            // Pilastra / Columna azul rey
            const matPil = encadenarMat4(
                traslacion4(posX + xp, hPilastra / 2, zInicioRampa),
                escala4(0.52, hPilastra, 0.52)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matPil, tex.azul);

            // Remate superior dorado
            const matCapitel = encadenarMat4(
                traslacion4(posX + xp, hPilastra + 0.16, zInicioRampa),
                escala4(0.70, 0.32, 0.70)
            );
            this.dibujarMalla(geom.vaoCaja, 36, matCapitel, tex.amarillo);

            // Farol esférico resplandeciente en la cúspide
            const matGlobo = encadenarMat4(
                traslacion4(posX + xp, hPilastra + 0.60, zInicioRampa),
                escala4(0.46, 0.46, 0.46)
            );
            this.dibujarMalla(geom.vaoEsfera, geom.esferaCount, matGlobo, tex.amarillo, {
                ...opciones,
                emissive: 1.0,
                emissiveColor: [1.0, 0.9, 0.4]
            });
        }

        // Dintel transversal superior
        const matDintel = encadenarMat4(
            traslacion4(posX, hPilastra - 0.15, zInicioRampa),
            escala4(anchoRampa + 1.2, 0.38, 0.38)
        );
        this.dibujarMalla(geom.vaoCaja, 36, matDintel, tex.azulOscuro);

        // Cartel frontal iluminado "★ SUBIDA A LA RUEDA ★"
        const matCartelEntrada = encadenarMat4(
            traslacion4(posX, hPilastra - 0.15, zInicioRampa + 0.22),
            escala4(4.4, 1.10, 1.0)
        );
        this.dibujarMalla(geom.vaoPanel, geom.panelCount, matCartelEntrada, tex.cartelRampa, {
            ...opciones,
            emissive: 0.95,
            emissiveColor: [1.0, 0.95, 0.8]
        });
    }

    /**
     * 6. TRAYECTORIA DE LA CABINA (Paso 14 - gl.LINE_STRIP)
     * Traza la circunferencia completa que describe una de las cabinas en el espacio 3D
     */
    dibujarTrayectoriaOrbital(lineOps) {
        const gl = this.gl;
        const geom = this.geom;
        if (!geom.vaoOrbita || !lineOps) return;

        gl.useProgram(lineOps.programa);
        gl.uniformMatrix4fv(lineOps.locs.uProjectionMatrix, false, lineOps.projection);
        gl.uniformMatrix4fv(lineOps.locs.uViewMatrix, false, lineOps.view);

        const matOrbita = encadenarMat4(
            traslacion4(0.0, 21.0, -8.0)
        );
        gl.uniformMatrix4fv(lineOps.locs.uModelMatrix, false, matOrbita);

        // Color cian neón vibrante con pulsación lumínica sutil
        const pulso = Math.sin(this.tiempoGlobal * 3.0) * 0.12 + 0.88;
        gl.uniform4f(lineOps.locs.uColor, 0.0, 0.95 * pulso, 1.0 * pulso, 0.9);

        gl.bindVertexArray(geom.vaoOrbita.vao);
        gl.drawArrays(gl.LINE_STRIP, 0, geom.vaoOrbita.cantidad);
        gl.bindVertexArray(null);
    }

    /**
     * DIBUJAR RUEDA DE LA FORTUNA COMPLETA (Elevada a 21m con Casetas Panorámicas Agrandadas)
     */
    dibujarRuedaFortuna(opciones) {
        const geom = this.geom;
        const tex = this.tex;

        const posX = 0.0;
        const posZ = -8.0;
        const alturaEje = 21.0;
        const radioMayor = 14.0;
        const radioMenor = 8.5;
        const numCabinas = 16;

        // A. SUBIDITA (RAMPA DE ACCESO) Y PLATAFORMA ELEVADA DE EMBARQUE
        this.crearSubiditaYPlataforma(posX, posZ, opciones);

        // B. CREAR TAQUILLA JUNTO AL ACCESO
        this.crearTaquilla(posX, 0.0, posZ, opciones);

        // C. CREAR TORRES DE SOPORTE (2 ESTRUCTURAS EN "A")
        this.crearTorresSoporte(posX, alturaEje, posZ, opciones);

        // D. GRAN LETRERO DE NEÓN "RUEDA MÁGICA" (Paso 12)
        // Montado en el centro del eje emitiendo luz puntual
        for (const sgn of [1, -1]) {
            const zCartel = posZ + sgn * 2.45;
            // Respaldo cilíndrico del medallón
            const matRespaldo = encadenarMat4(
                traslacion4(posX, alturaEje, zCartel),
                rotacionX(Math.PI / 2),
                escala4(3.4, 0.14, 3.4)
            );
            this.dibujarMalla(geom.vaoCilindro, geom.cilindroCount, matRespaldo, tex.azulOscuro);

            // Panel frontal con la textura gráfica "Rueda Mágica"
            const matPanelCartel = encadenarMat4(
                traslacion4(posX, alturaEje, zCartel + sgn * 0.08),
                (sgn === -1 ? rotacionY(Math.PI) : identidad4()),
                escala4(3.2, 3.2, 1.0)
            );
            this.dibujarMalla(geom.vaoPanel, geom.panelCount, matPanelCartel, tex.cartelRuedaMagica, {
                ...opciones,
                emissive: 0.95,
                emissiveColor: [1.0, 0.25, 0.65]
            });
        }

        // E. ANILLOS DE LA RUEDA Y RADIOS (Giro sobre eje Z)
        const matCentroRueda = encadenarMat4(
            traslacion4(posX, alturaEje, posZ),
            rotacionZ(this.anguloRueda)
        );

        this.crearAnillosRueda(matCentroRueda, radioMayor, radioMenor, opciones);

        // F. 16 CABINAS OSCILANTES CON CONTRARROTACIÓN JERÁRQUICA (Pasos 11 y 13)
        const coloresCabinas = [
            tex.metalRojo, tex.metalAzul, tex.metalAmarillo, tex.metalBlanco,
            tex.metalRojo, tex.metalAzul, tex.metalAmarillo, tex.metalBlanco,
            tex.metalRojo, tex.metalAzul, tex.metalAmarillo, tex.metalBlanco,
            tex.metalRojo, tex.metalAzul, tex.metalAmarillo, tex.metalBlanco
        ];

        for (let i = 0; i < numCabinas; i++) {
            const alfa = (i / numCabinas) * Math.PI * 2.0;

            // Pivote en el anillo exterior
            const matPivoteGondola = encadenarMat4(
                matCentroRueda,
                rotacionZ(alfa),
                traslacion4(0, radioMayor, 0)
            );

            // FÍSICA: Contra-rotación automática + Oscilación pendular gravitatoria
            // theta_cabina = -theta_rueda + A * sin(k * t)
            const oscilacionPendular = 0.12 * Math.sin(2.4 * this.tiempoGlobal + i * 0.35);
            const rotacionCabinaTotal = -(this.anguloRueda + alfa) + oscilacionPendular;

            const matGondolaAlineada = encadenarMat4(
                matPivoteGondola,
                rotacionZ(rotacionCabinaTotal)
            );

            // Dibujar la cabina modular completa agrandada
            this.crearCabina(matGondolaAlineada, coloresCabinas[i % coloresCabinas.length], opciones);

            // Registrar la posición mundial de la Cabina 0 para la CÁMARA POV (a la altura de los ojos del pasajero)
            if (i === 0) {
                this.posicionCabina0Mundo = transformarPunto(matGondolaAlineada, [0, -1.8, 0]);
            }
        }
    }
}

