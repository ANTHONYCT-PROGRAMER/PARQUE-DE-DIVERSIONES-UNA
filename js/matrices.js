/**
 * CLASE MAT4 - MATRICES DE TRANSFORMACIÓN AFÍN 4x4
 * Formato column-major estándar compatible con WebGL2 (gl.uniformMatrix4fv).
 */
export class Mat4 {
    constructor(elementos = null) {
        this.elementos = elementos ? new Float32Array(elementos) : Mat4.identidad();
    }

    static identidad() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    static traslacion(tx, ty, tz) {
        return new Float32Array([
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            tx, ty, tz, 1
        ]);
    }

    static escala(sx, sy, sz) {
        return new Float32Array([
            sx, 0,  0,  0,
            0,  sy, 0,  0,
            0,  0,  sz, 0,
            0,  0,  0,  1
        ]);
    }

    static rotacionX(anguloRad) {
        const c = Math.cos(anguloRad);
        const s = Math.sin(anguloRad);
        return new Float32Array([
            1,  0, 0, 0,
            0,  c, s, 0,
            0, -s, c, 0,
            0,  0, 0, 1
        ]);
    }

    static rotacionY(anguloRad) {
        const c = Math.cos(anguloRad);
        const s = Math.sin(anguloRad);
        return new Float32Array([
             c, 0, -s, 0,
             0, 1,  0, 0,
             s, 0,  c, 0,
             0, 0,  0, 1
        ]);
    }

    static rotacionZ(anguloRad) {
        const c = Math.cos(anguloRad);
        const s = Math.sin(anguloRad);
        return new Float32Array([
             c, s, 0, 0,
            -s, c, 0, 0,
             0, 0, 1, 0,
             0, 0, 0, 1
        ]);
    }

    static multiplicar(a, b) {
        const r = new Float32Array(16);
        for (let c = 0; c < 4; c++) {
            for (let f = 0; f < 4; f++) {
                let suma = 0;
                for (let k = 0; k < 4; k++) {
                    suma += a[k * 4 + f] * b[c * 4 + k];
                }
                r[c * 4 + f] = suma;
            }
        }
        return r;
    }

    static encadenar(...matrices) {
        let r = matrices[0];
        for (let i = 1; i < matrices.length; i++) {
            r = Mat4.multiplicar(r, matrices[i]);
        }
        return r;
    }

    static lookAt(eye, target, up) {
        const zAxis = Vec3.normalizar(Vec3.restar(eye, target));
        const xAxis = Vec3.normalizar(Vec3.productoCruz(up, zAxis));
        const yAxis = Vec3.productoCruz(zAxis, xAxis);

        return new Float32Array([
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]),
            -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]),
            -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]),
            1
        ]);
    }

    static perspectiva(fovRad, aspect, near, far) {
        const f = 1.0 / Math.tan(fovRad / 2.0);
        const nf = 1.0 / (near - far);

        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2.0 * far * near) * nf, 0
        ]);
    }

    static transformarPunto(m, p) {
        const x = m[0] * p[0] + m[4] * p[1] + m[8]  * p[2] + m[12];
        const y = m[1] * p[0] + m[5] * p[1] + m[9]  * p[2] + m[13];
        const z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
        return [x, y, z];
    }
}

/**
 * CLASE VEC3 - OPERACIONES VECTORIALES TRIDIMENSIONALES
 */
export class Vec3 {
    static crear(x = 0, y = 0, z = 0) {
        return [x, y, z];
    }

    static restar(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    static sumar(a, b) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    static escalar(v, s) {
        return [v[0] * s, v[1] * s, v[2] * s];
    }

    static longitud(v) {
        return Math.hypot(v[0], v[1], v[2]);
    }

    static normalizar(v) {
        const l = Math.hypot(v[0], v[1], v[2]);
        if (l === 0) return [0, 0, 0];
        return [v[0] / l, v[1] / l, v[2] / l];
    }

    static productoCruz(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    static productoPunto(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
}

// -----------------------------------------------------------------------------
// EXPORTACIONES COMPATIBLES CONSTRUCTIVAS DE FUNCIONES
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// EXPORTACIONES DE COMPATIBILIDAD VINCULADAS A CLASES
// -----------------------------------------------------------------------------
export const identidad4 = Mat4.identidad;
export const traslacion4 = Mat4.traslacion;
export const escala4 = Mat4.escala;
export const rotacionX = Mat4.rotacionX;
export const rotacionY = Mat4.rotacionY;
export const rotacionZ = Mat4.rotacionZ;
export const multiplicarMat4 = Mat4.multiplicar;
export const encadenarMat4 = Mat4.encadenar;
export const transformarPunto = Mat4.transformarPunto;
export const matrizLookAt = Mat4.lookAt;
export const matrizPerspectiva = Mat4.perspectiva;

export const restarVec3 = Vec3.restar;
export const sumarVec3 = Vec3.sumar;
export const escalarVec3 = Vec3.escalar;
export const longitudVec3 = Vec3.longitud;
export const normalizarVec3 = Vec3.normalizar;
export const productoCruz = Vec3.productoCruz;
export const productoPunto = Vec3.productoPunto;

