/**
 * CLASES Y GENERADORES DE GEOMETRÍAS PROCEDURALES 3D
 * Basado en los principios de los Pasos 5, 7, 9 y 14 de Computación Gráfica.
 * Formato unificado de vértice (8 floats):
 *   [x, y, z,   nx, ny, nz,   u, v]
 */

/**
 * Representa una malla poligonal indexada con atributos de vértice intercalados.
 */
export class MallaGeometria {
    constructor(vertices, indices) {
        this.vertices = vertices instanceof Float32Array ? vertices : new Float32Array(vertices);
        this.indices = indices instanceof Uint16Array ? indices : new Uint16Array(indices);
    }

    get cantidadIndices() {
        return this.indices.length;
    }

    get cantidadVertices() {
        return this.vertices.length / 8;
    }
}

/**
 * Generador procedural de primitivas geométricas tridimensionales.
 */
export class GeneradorGeometrias {
    /**
     * Cubo / Caja ortoédrica con 6 caras independientes y normales planas (Paso 5).
     */
    static crearCaja(ancho = 1, alto = 1, profundidad = 1, uScale = 1, vScale = 1) {
        const w = ancho / 2;
        const h = alto / 2;
        const d = profundidad / 2;

        const vertices = [
            // Frente (+Z) - Normal: [0, 0, 1]
            -w, -h,  d,   0, 0, 1,   0, 0,
             w, -h,  d,   0, 0, 1,   uScale, 0,
             w,  h,  d,   0, 0, 1,   uScale, vScale,
            -w,  h,  d,   0, 0, 1,   0, vScale,

            // Atrás (-Z) - Normal: [0, 0, -1]
             w, -h, -d,   0, 0, -1,  0, 0,
            -w, -h, -d,   0, 0, -1,  uScale, 0,
            -w,  h, -d,   0, 0, -1,  uScale, vScale,
             w,  h, -d,   0, 0, -1,  0, vScale,

            // Arriba (+Y) - Normal: [0, 1, 0]
            -w,  h,  d,   0, 1, 0,   0, 0,
             w,  h,  d,   0, 1, 0,   uScale, 0,
             w,  h, -d,   0, 1, 0,   uScale, vScale,
            -w,  h, -d,   0, 1, 0,   0, vScale,

            // Abajo (-Y) - Normal: [0, -1, 0]
            -w, -h, -d,   0, -1, 0,  0, 0,
             w, -h, -d,   0, -1, 0,  uScale, 0,
             w, -h,  d,   0, -1, 0,  uScale, vScale,
            -w, -h,  d,   0, -1, 0,  0, vScale,

            // Derecha (+X) - Normal: [1, 0, 0]
             w, -h,  d,   1, 0, 0,   0, 0,
             w, -h, -d,   1, 0, 0,   uScale, 0,
             w,  h, -d,   1, 0, 0,   uScale, vScale,
             w,  h,  d,   1, 0, 0,   0, vScale,

            // Izquierda (-X) - Normal: [-1, 0, 0]
            -w, -h, -d,  -1, 0, 0,   0, 0,
            -w, -h,  d,  -1, 0, 0,   uScale, 0,
            -w,  h,  d,  -1, 0, 0,   uScale, vScale,
            -w,  h, -d,  -1, 0, 0,   0, vScale
        ];

        const indices = [];
        for (let c = 0; c < 6; c++) {
            const base = c * 4;
            indices.push(base, base + 1, base + 2);
            indices.push(base, base + 2, base + 3);
        }

        return new MallaGeometria(vertices, indices);
    }

    /**
     * Plano horizontal en el plano XZ (Paso 9 y Guía Teórica 06).
     */
    static crearPlano(ancho = 10, largo = 10, uRep = 1, vRep = 1) {
        const w = ancho / 2;
        const l = largo / 2;

        const vertices = [
            -w, 0,  l,   0, 1, 0,   0, 0,
             w, 0,  l,   0, 1, 0,   uRep, 0,
             w, 0, -l,   0, 1, 0,   uRep, vRep,
            -w, 0, -l,   0, 1, 0,   0, vRep
        ];

        const indices = [0, 1, 2,  0, 2, 3];

        return new MallaGeometria(vertices, indices);
    }

    /**
     * Cilindro o cono truncado paramétrico con tapas circulares opcionales.
     */
    static crearCilindro(radioTop = 0.5, radioBottom = 0.5, altura = 2, segmentos = 24, tapar = true) {
        const vertices = [];
        const indices = [];
        const h2 = altura / 2;

        // Cuerpo lateral
        for (let i = 0; i <= segmentos; i++) {
            const u = i / segmentos;
            const theta = u * Math.PI * 2.0;
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);

            // Vector normal en superficie cilíndrica/cónica
            const dr = radioBottom - radioTop;
            const nL = Math.hypot(altura, dr);
            const ny = dr / nL;
            const nr = altura / nL;
            const nx = nr * cosT;
            const nz = nr * sinT;

            // Vértice superior
            vertices.push(radioTop * cosT,  h2, radioTop * sinT,  nx, ny, nz,  u, 1.0);
            // Vértice inferior
            vertices.push(radioBottom * cosT, -h2, radioBottom * sinT,  nx, ny, nz,  u, 0.0);
        }

        for (let i = 0; i < segmentos; i++) {
            const top1 = i * 2;
            const bot1 = top1 + 1;
            const top2 = (i + 1) * 2;
            const bot2 = top2 + 1;

            indices.push(top1, bot1, top2);
            indices.push(top2, bot1, bot2);
        }

        if (tapar) {
            // Tapa superior (+Y)
            const baseTop = vertices.length / 8;
            vertices.push(0, h2, 0,  0, 1, 0,  0.5, 0.5);
            for (let i = 0; i <= segmentos; i++) {
                const theta = (i / segmentos) * Math.PI * 2.0;
                const x = radioTop * Math.cos(theta);
                const z = radioTop * Math.sin(theta);
                vertices.push(x, h2, z,  0, 1, 0,  0.5 + 0.5 * Math.cos(theta), 0.5 + 0.5 * Math.sin(theta));
            }
            for (let i = 1; i <= segmentos; i++) {
                indices.push(baseTop, baseTop + i, baseTop + i + 1);
            }

            // Tapa inferior (-Y)
            const baseBot = vertices.length / 8;
            vertices.push(0, -h2, 0,  0, -1, 0,  0.5, 0.5);
            for (let i = 0; i <= segmentos; i++) {
                const theta = (i / segmentos) * Math.PI * 2.0;
                const x = radioBottom * Math.cos(theta);
                const z = radioBottom * Math.sin(theta);
                vertices.push(x, -h2, z,  0, -1, 0,  0.5 + 0.5 * Math.cos(theta), 0.5 + 0.5 * Math.sin(theta));
            }
            for (let i = 1; i <= segmentos; i++) {
                indices.push(baseBot, baseBot + i + 1, baseBot + i);
            }
        }

        return new MallaGeometria(vertices, indices);
    }

    /**
     * Esfera UV analítica (directamente implementando los Pasos 7, 8 y 9).
     */
    static crearEsfera(radio = 1, segmentosLat = 24, segmentosLon = 32) {
        const vertices = [];
        const indices = [];

        for (let lat = 0; lat <= segmentosLat; lat++) {
            const v = lat / segmentosLat;
            const phi = v * Math.PI; // 0 a pi
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            for (let lon = 0; lon <= segmentosLon; lon++) {
                const u = lon / segmentosLon;
                const theta = u * Math.PI * 2.0; // 0 a 2pi
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                const nx = sinPhi * cosTheta;
                const ny = cosPhi;
                const nz = sinPhi * sinTheta;

                vertices.push(
                    radio * nx, radio * ny, radio * nz,
                    nx, ny, nz,
                    u, 1.0 - v
                );
            }
        }

        const cols = segmentosLon + 1;
        for (let lat = 0; lat < segmentosLat; lat++) {
            for (let lon = 0; lon < segmentosLon; lon++) {
                const a = lat * cols + lon;
                const b = a + cols;
                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }

        return new MallaGeometria(vertices, indices);
    }

    /**
     * Toro / Anillo tubular 3D (para las llantas circulares de la Rueda de la Fortuna).
     */
    static crearToro(radioMayor = 5, radioTubo = 0.12, segMayor = 48, segTubo = 12) {
        const vertices = [];
        const indices = [];

        for (let i = 0; i <= segMayor; i++) {
            const u = i / segMayor;
            const theta = u * Math.PI * 2.0;
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);

            for (let j = 0; j <= segTubo; j++) {
                const v = j / segTubo;
                const phi = v * Math.PI * 2.0;
                const cosPhi = Math.cos(phi);
                const sinPhi = Math.sin(phi);

                // Superficie
                const x = (radioMayor + radioTubo * cosPhi) * cosTheta;
                const y = (radioMayor + radioTubo * cosPhi) * sinTheta;
                const z = radioTubo * sinPhi;

                // Normal unitaria apuntando hacia afuera del tubo
                const nx = cosPhi * cosTheta;
                const ny = cosPhi * sinTheta;
                const nz = sinPhi;

                vertices.push(x, y, z,  nx, ny, nz,  u * 4, v);
            }
        }

        const cols = segTubo + 1;
        for (let i = 0; i < segMayor; i++) {
            for (let j = 0; j < segTubo; j++) {
                const a = i * cols + j;
                const b = (i + 1) * cols + j;
                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }

        return new MallaGeometria(vertices, indices);
    }

    /**
     * Cono 3D (para techos de quioscos, carrusel y pinos de jardín).
     */
    static crearCono(radioBase = 1, altura = 2, segmentos = 24, tapar = true) {
        return GeneradorGeometrias.crearCilindro(0.001, radioBase, altura, segmentos, tapar);
    }

    /**
     * Panel vertical en plano XY (para letreros, medallones y placas).
     */
    static crearPanelVertical(ancho = 1, alto = 1) {
        const w = ancho / 2;
        const h = alto / 2;
        const vertices = [
            -w, -h, 0,   0, 0, 1,   0, 0,
             w, -h, 0,   0, 0, 1,   1, 0,
             w,  h, 0,   0, 0, 1,   1, 1,
            -w,  h, 0,   0, 0, 1,   0, 1
        ];
        const indices = [0, 1, 2,  0, 2, 3];
        return new MallaGeometria(vertices, indices);
    }

    /**
     * Circunferencia de líneas (Paso 14 - gl.LINE_LOOP / gl.LINE_STRIP).
     */
    static crearCirculoLineas(radio = 5, segmentos = 96) {
        const puntos = [];
        for (let i = 0; i < segmentos; i++) {
            const theta = (i / segmentos) * Math.PI * 2.0;
            puntos.push(
                radio * Math.cos(theta),
                radio * Math.sin(theta),
                0.0
            );
        }
        return new Float32Array(puntos);
    }
}

/**
 * Gestor de asignación y vinculación de Vertex Array Objects (VAO) y VBOs en GPU.
 */
export class ConstructorVAO {
    /**
     * Construye un VAO con buffer de vértices (posición, normal, UV) y buffer de índices (EBO).
     */
    static construir(gl, geometria) {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, geometria.vertices, gl.STATIC_DRAW);

        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometria.indices, gl.STATIC_DRAW);

        // Stride: 8 floats = [x, y, z,   nx, ny, nz,   u, v]
        const stride = 8 * Float32Array.BYTES_PER_ELEMENT;

        // Posición (layout = 0)
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

        // Normal (layout = 1)
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

        // TexCoord UV (layout = 2)
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 6 * Float32Array.BYTES_PER_ELEMENT);

        gl.bindVertexArray(null);
        return vao;
    }

    /**
     * Construye un VAO simplificado de solo coordenadas para primitivas lineales (Paso 14).
     */
    static construirLineas(gl, programaLinea, puntos) {
        gl.useProgram(programaLinea);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, puntos, gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(programaLinea, "aPosition");
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
        return { vao, cantidad: puntos.length / 3 };
    }
}

// -----------------------------------------------------------------------------
// ALIASES DE COMPATIBILIDAD VINCULADOS A CLASES
// -----------------------------------------------------------------------------
export const crearCaja = GeneradorGeometrias.crearCaja;
export const crearPlano = GeneradorGeometrias.crearPlano;
export const crearCilindro = GeneradorGeometrias.crearCilindro;
export const crearEsfera = GeneradorGeometrias.crearEsfera;
export const crearToro = GeneradorGeometrias.crearToro;
export const crearCono = GeneradorGeometrias.crearCono;
export const crearPanelVertical = GeneradorGeometrias.crearPanelVertical;
export const crearCirculoLineas = GeneradorGeometrias.crearCirculoLineas;
export const construirVAO = ConstructorVAO.construir;
export const construirVAOLineas = ConstructorVAO.construirLineas;
