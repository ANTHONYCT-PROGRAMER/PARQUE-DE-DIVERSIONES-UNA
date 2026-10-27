/**
 * CLASES Y BIBLIOTECA DE SHADERS GLSL ES 3.00 - WEBGL2
 * Basado en las especificaciones de los Pasos 2, 8, 10, 12 y 14 de Computación Gráfica.
 */

/**
 * Compilador y vinculador de shaders de bajo nivel para WebGL2.
 */
export class CompiladorShader {
    /**
     * Compila un shader individual (VERTEX o FRAGMENT).
     */
    static compilar(gl, tipo, fuente) {
        const shader = gl.createShader(tipo);
        gl.shaderSource(shader, fuente);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            const tipoNombre = tipo === gl.VERTEX_SHADER ? "VERTEX_SHADER" : "FRAGMENT_SHADER";
            throw new Error(`[CompiladorShader] Error al compilar ${tipoNombre}:\n${error}`);
        }
        return shader;
    }

    /**
     * Enlaza un par de vertex y fragment shaders en un WebGLProgram.
     */
    static enlazar(gl, vertexSource, fragmentSource) {
        const vs = CompiladorShader.compilar(gl, gl.VERTEX_SHADER, vertexSource);
        const fs = CompiladorShader.compilar(gl, gl.FRAGMENT_SHADER, fragmentSource);
        const programa = gl.createProgram();

        gl.attachShader(programa, vs);
        gl.attachShader(programa, fs);
        gl.linkProgram(programa);

        if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(programa);
            if (gl.deleteProgram) gl.deleteProgram(programa);
            throw new Error(`[CompiladorShader] Error al enlazar WebGLProgram:\n${error}`);
        }

        if (gl.deleteShader) {
            gl.deleteShader(vs);
            gl.deleteShader(fs);
        }

        return programa;
    }
}

/**
 * Encapsula un programa de shaders de WebGL2 con gestión optimizada de uniforms.
 */
export class ProgramaShader {
    constructor(gl, vertexSource, fragmentSource) {
        this.gl = gl;
        this.programa = CompiladorShader.enlazar(gl, vertexSource, fragmentSource);
        this.cacheUniforms = new Map();
    }

    usar() {
        this.gl.useProgram(this.programa);
        return this;
    }

    obtenerUniform(nombre) {
        if (!this.cacheUniforms.has(nombre)) {
            const loc = this.gl.getUniformLocation(this.programa, nombre);
            this.cacheUniforms.set(nombre, loc);
        }
        return this.cacheUniforms.get(nombre);
    }

    cachearUniforms(nombres) {
        const mapa = {};
        for (const nombre of nombres) {
            mapa[nombre] = this.obtenerUniform(nombre);
        }
        return mapa;
    }

    obtenerAttrib(nombre) {
        return this.gl.getAttribLocation(this.programa, nombre);
    }
}

/**
 * Biblioteca central con las fuentes GLSL ES 3.00 y fábricas de programas.
 */
export class BibliotecaShaders {
    // ------------------------------------------------------------
    // 1. SHADER DE CUERPOS (World Space Lighting + Emissive Neon + Textures)
    // ------------------------------------------------------------
    static cuerpoVertexSource = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vWorldPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPos.xyz;
    
    // Normal en World Space (Paso 12 y Guía Teórica 05)
    vNormal = normalize(mat3(uModelMatrix) * aNormal);
    vTexCoord = aTexCoord;

    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

    static cuerpoFragmentSource = `#version 300 es
precision highp float;

in vec3 vWorldPosition;
in vec3 vNormal;
in vec2 vTexCoord;

uniform sampler2D uTexture;
uniform vec4 uBaseColor;          // Color multiplicador
uniform float uEmissive;          // 0.0 = pasivo, 1.0 = autoiluminado puro
uniform vec3 uEmissiveColor;      // Tinte del resplandor de neón

// Fuentes de luz puntual en World Space (Paso 12)
uniform vec3 uLightPosFerris;     // Luz en el buje de la Rueda de la Fortuna
uniform vec3 uLightColorFeria;    // Color de luz cálida / festiva
uniform vec3 uLightPosPortal;     // Luz frontal en el pórtico UNA Puno
uniform vec3 uLightColorPortal;   // Blanco cálido institucional

// Ciclo Circadiano: Iluminación Diurna y Revolución Solar (Pasos 8, 11 y 12)
uniform float uFactorDia;         // 0.0 = Noche profunda, 1.0 = Día pleno
uniform vec3 uSunDirection;       // Vector unitario del Sol en World Space
uniform vec3 uSunColor;           // Color de la radiación solar

out vec4 outColor;

void main() {
    vec4 texel = texture(uTexture, vTexCoord) * uBaseColor;
    
    // Descartar fragmentos transparentes (bordes del escudo, calados y siluetas)
    if (texel.a < 0.15) {
        discard;
    }
    
    // Elemento emisivo puro (bombillas LED de feria, neones, focos)
    if (uEmissive > 0.0) {
        float factorGlow = mix(0.70, 0.35, uFactorDia);
        vec3 glow = mix(texel.rgb, uEmissiveColor, factorGlow);
        outColor = vec4(glow, texel.a);
        return;
    }

    vec3 N = normalize(vNormal);

    // 1. Componente ambiental que transiciona de noche altiplánica a mediodía andino
    vec3 ambNoche = vec3(0.12, 0.14, 0.22);
    vec3 ambDia   = vec3(0.48, 0.50, 0.54);
    vec3 ambient  = mix(ambNoche, ambDia, uFactorDia) * texel.rgb;

    // 2. Luz solar difusa de Lambert en World Space (Paso 8 y 12)
    vec3 Lsun = normalize(uSunDirection);
    float diffSun = max(dot(N, Lsun), 0.0);
    vec3 diffuseSun = uSunColor * diffSun * uFactorDia * texel.rgb * 1.35;

    // 3. Atenuación natural de las luces artificiales de feria bajo la radiación solar
    float factorLucesNoche = mix(1.0, 0.40, uFactorDia);

    // 4. Luz puntual de la Rueda de la Fortuna
    vec3 L1 = uLightPosFerris - vWorldPosition;
    float dist1 = length(L1);
    L1 = normalize(L1);
    float diff1 = max(dot(N, L1), 0.0);
    // Atenuación cuadrática suave (kc=1, kl=0.04, kq=0.003)
    float atten1 = 1.0 / (1.0 + 0.04 * dist1 + 0.003 * dist1 * dist1);
    vec3 diffuse1 = uLightColorFeria * diff1 * atten1 * texel.rgb * factorLucesNoche;

    // 5. Luz puntual del Pórtico UNA Puno
    vec3 L2 = uLightPosPortal - vWorldPosition;
    float dist2 = length(L2);
    L2 = normalize(L2);
    float diff2 = max(dot(N, L2), 0.0);
    float atten2 = 1.0 / (1.0 + 0.06 * dist2 + 0.005 * dist2 * dist2);
    vec3 diffuse2 = uLightColorPortal * diff2 * atten2 * texel.rgb * factorLucesNoche;

    // 6. Luz direccional tenue de la luna (desvanece durante el día)
    vec3 Lmoon = normalize(vec3(0.4, 0.8, 0.5));
    float diffMoon = max(dot(N, Lmoon), 0.0) * 0.25;
    vec3 diffuseMoon = vec3(0.6, 0.7, 0.9) * diffMoon * texel.rgb * (1.0 - uFactorDia);

    vec3 colorFinal = ambient + diffuseSun + diffuse1 * 1.5 + diffuse2 * 1.3 + diffuseMoon;
    outColor = vec4(colorFinal, texel.a);
}
`;

    // ------------------------------------------------------------
    // 2. SHADER DE LÍNEAS Y TRAYECTORIAS (Paso 14 - gl.LINE_STRIP / LINE_LOOP)
    // ------------------------------------------------------------
    static lineaVertexSource = `#version 300 es
layout(location = 0) in vec3 aPosition;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
`;

    static lineaFragmentSource = `#version 300 es
precision highp float;

uniform vec4 uColor;

out vec4 outColor;

void main() {
    outColor = uColor;
}
`;

    static crearProgramaCuerpo(gl) {
        return new ProgramaShader(gl, BibliotecaShaders.cuerpoVertexSource, BibliotecaShaders.cuerpoFragmentSource);
    }

    static crearProgramaLineas(gl) {
        return new ProgramaShader(gl, BibliotecaShaders.lineaVertexSource, BibliotecaShaders.lineaFragmentSource);
    }
}

// -----------------------------------------------------------------------------
// ALIASES DE COMPATIBILIDAD VINCULADOS A CLASES
// -----------------------------------------------------------------------------
export const crearShader = CompiladorShader.compilar;
export const crearPrograma = CompiladorShader.enlazar;
export const cuerpoVertexSource = BibliotecaShaders.cuerpoVertexSource;
export const cuerpoFragmentSource = BibliotecaShaders.cuerpoFragmentSource;
export const lineaVertexSource = BibliotecaShaders.lineaVertexSource;
export const lineaFragmentSource = BibliotecaShaders.lineaFragmentSource;
