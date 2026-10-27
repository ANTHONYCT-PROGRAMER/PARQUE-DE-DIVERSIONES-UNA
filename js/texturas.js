/**
 * GENERADOR PROCEDURAL DE TEXTURAS HD - SISTEMA WEBGL2
 * Basado en las especificaciones del Paso 9 y 10.
 * Genera texturas fotofieles en memoria mediante Canvas 2D garantizando:
 *  1. Cero errores de CORS al abrir directamente en el navegador.
 *  2. Máxima nitidez y fidelidad con la fachada de la UNA Puno.
 */

function crearTexturaDesdeCanvas(gl, canvas2D) {
    const textura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        gl.RGBA, gl.UNSIGNED_BYTE,
        canvas2D
    );

    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    return textura;
}

// 1. Pavimento Geométrico Exacto de la Explanada UNA Puno (Foto original)
export function generarTexturaAdoquinesUNA(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Fondo base de adoquín cantera gris cálido
    ctx.fillStyle = "#baa896";
    ctx.fillRect(0, 0, 512, 512);

    // Marco exterior terracota / rojizo como en la foto de la UNA Puno
    ctx.fillStyle = "#ba4a3b";
    ctx.fillRect(0, 0, 512, 56);
    ctx.fillRect(0, 456, 512, 56);
    ctx.fillRect(0, 0, 56, 512);
    ctx.fillRect(456, 0, 56, 512);

    // Franja ocre / amarilla intermedia
    ctx.fillStyle = "#f0be5a";
    ctx.fillRect(56, 56, 400, 24);
    ctx.fillRect(56, 432, 400, 24);
    ctx.fillRect(56, 56, 24, 400);
    ctx.fillRect(432, 56, 24, 400);

    // Zona interior de adoquines con loseta diagonal y cuadrado central de adoquín oscuro
    ctx.fillStyle = "#cfbeaa";
    ctx.fillRect(80, 80, 352, 352);

    // Cuadrado central de adoquín gris oscuro (como se aprecia claramente en la foto)
    ctx.fillStyle = "#5a5a62";
    ctx.fillRect(192, 192, 128, 128);

    // Líneas de juntas de adoquines
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 2;
    for (let x = 80; x <= 432; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 80);
        ctx.lineTo(x, 432);
        ctx.stroke();
    }
    for (let y = 80; y <= 432; y += 32) {
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(432, y);
        ctx.stroke();
    }

    // Ruido mineral realista de la piedra del altiplano
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let k = 0; k < d.length; k += 4) {
        const noise = (Math.random() - 0.5) * 24;
        d[k] = Math.min(255, Math.max(0, d[k] + noise));
        d[k + 1] = Math.min(255, Math.max(0, d[k + 1] + noise));
        d[k + 2] = Math.min(255, Math.max(0, d[k + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    return crearTexturaDesdeCanvas(gl, c);
}

// 2. Muro Perimétrico UNA Puno (Foto original: Zócalo Ocre + Ladrillo Rojo Caravista + Coronación Blanca)
export function generarTexturaMuroUNA(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");

    // 1. Zócalo inferior ocre / crema (inferior: Y de 384 a 512 en el canvas)
    ctx.fillStyle = "#f7c756";
    ctx.fillRect(0, 384, 512, 128);
    // Borde inferior zócalo
    ctx.fillStyle = "#d49e29";
    ctx.fillRect(0, 492, 512, 20);

    // 2. Muro central de ladrillo caravista rojo oscuro
    ctx.fillStyle = "#e0e0e0"; // mortero
    ctx.fillRect(0, 70, 512, 314);

    const filas = 9;
    const hLadrillo = 314 / filas;
    const wLadrillo = 64;

    for (let f = 0; f < filas; f++) {
        const y = 70 + f * hLadrillo;
        const offset = (f % 2) * (wLadrillo / 2);
        for (let x = -wLadrillo; x < 512 + wLadrillo; x += wLadrillo) {
            const r = 180 + Math.floor(Math.random() * 25);
            const g = 40 + Math.floor(Math.random() * 20);
            const b = 25 + Math.floor(Math.random() * 15);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x + offset + 2, y + 2, wLadrillo - 4, hLadrillo - 4);
        }
    }

    // 3. Albardilla / Coronación superior blanca (Y de 0 a 70)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 70);
    ctx.fillStyle = "#d0d4da";
    ctx.fillRect(0, 60, 512, 10);

    return crearTexturaDesdeCanvas(gl, c);
}

// 3. Letrero Monumental "UNIVERSIDAD NACIONAL DEL ALTIPLANO"
export function generarTexturaLetreroUNA(gl) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 128;
    const ctx = c.getContext("2d");

    // Fondo azul intenso institucional
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, "#0c67cd");
    grad.addColorStop(0.5, "#0b58ae");
    grad.addColorStop(1, "#073a76");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 128);

    // Bordes biselados
    ctx.strokeStyle = "#4da3ff";
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, 1018, 122);

    // Tipografía idéntica a la imagen: sans-serif bold en relieve amarillo
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 48px 'Impact', 'Arial Black', sans-serif";
    ctx.letterSpacing = "2px";

    // Sombra del texto
    ctx.fillStyle = "#031c3c";
    ctx.fillText("UNIVERSIDAD NACIONAL DEL ALTIPLANO", 512 + 4, 64 + 4);

    // Letra dorada frontal
    ctx.fillStyle = "#ffcc00";
    ctx.fillText("UNIVERSIDAD NACIONAL DEL ALTIPLANO", 512, 64);

    return crearTexturaDesdeCanvas(gl, c);
}

// 4. Escudo Oficial Fidedigno de la UNA Puno (Carga la imagen oficial con respaldo procedural)
export function generarTexturaEscudoUNA(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");

    ctx.clearRect(0, 0, 512, 512);

    // Blasón heráldico tradicional provisional mientras se descarga la imagen PNG
    ctx.beginPath();
    ctx.moveTo(90, 40);
    ctx.lineTo(422, 40);
    ctx.lineTo(422, 340);
    ctx.bezierCurveTo(422, 460, 256, 500, 256, 500);
    ctx.bezierCurveTo(256, 500, 90, 460, 90, 340);
    ctx.closePath();

    const bgGrad = ctx.createLinearGradient(90, 40, 422, 500);
    bgGrad.addColorStop(0, "#d31820");
    bgGrad.addColorStop(0.5, "#0f428c");
    bgGrad.addColorStop(1, "#072658");
    ctx.fillStyle = bgGrad;
    ctx.fill();

    ctx.strokeStyle = "#f0be20";
    ctx.lineWidth = 16;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("UNIVERSIDAD", 256, 230);
    ctx.fillText("NACIONAL DEL ALTIPLANO", 256, 265);
    ctx.fillStyle = "#ffd700";
    ctx.fillText("PUNO", 256, 310);

    const tex = crearTexturaDesdeCanvas(gl, c);

    // Cargar la imagen oficial real enviada por el usuario (assets/escudo_una.png)
    if (typeof Image !== 'undefined') {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };
        img.src = "assets/escudo_una.png";
    }

    return tex;
}

// 5. Fachada de Edificios del Campus (Edificio vidriado a la derecha y pabellones)
export function generarTexturaEdificioCampus(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Estructura de hormigón blanco/gris
    ctx.fillStyle = "#e8eaed";
    ctx.fillRect(0, 0, 512, 512);

    // Ventanales vidriados tintados de azul verdoso
    const cols = 8;
    const rows = 8;
    const w = 512 / cols;
    const h = 512 / rows;

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            // Vidrio reflectante
            const grad = ctx.createLinearGradient(i * w, j * h, (i + 1) * w, (j + 1) * h);
            grad.addColorStop(0, "#2c5d88");
            grad.addColorStop(0.5, "#4682b4");
            grad.addColorStop(1, "#1e3f5d");
            ctx.fillStyle = grad;
            ctx.fillRect(i * w + 6, j * h + 6, w - 12, h - 12);

            // Marcos de aluminio blanco
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(i * w + 6, j * h + 6, w - 12, h - 12);
        }
    }

    return crearTexturaDesdeCanvas(gl, c);
}

// 6. Textura de Césped / Jardineras de la UNA
export function generarTexturaCesped(gl) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#336622";
    ctx.fillRect(0, 0, 256, 256);

    // Puntos y briznas de césped
    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const col = (Math.random() > 0.5) ? "#44882e" : "#28521a";
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 2, 3);
    }

    return crearTexturaDesdeCanvas(gl, c);
}

// 7. Toldos Rayados de Puestos de Feria
export function generarTexturaToldo(gl, c1 = "#e52521", c2 = "#ffffff") {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    const franjas = 8;
    const w = 256 / franjas;
    for (let i = 0; i < franjas; i++) {
        ctx.fillStyle = (i % 2 === 0) ? c1 : c2;
        ctx.fillRect(i * w, 0, w, 256);
    }
    return crearTexturaDesdeCanvas(gl, c);
}

// 8. Letreros de Puestos de Feria
export function generarTexturaLetreroPuesto(gl, texto = "BOLETERÍA") {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#b81216";
    ctx.fillRect(8, 8, 496, 112);

    ctx.font = "bold 44px 'Arial Black', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, 256, 64);

    return crearTexturaDesdeCanvas(gl, c);
}

// 9. Madera para el Barco Pirata
export function generarTexturaMadera(gl) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#4a2810";
    ctx.fillRect(0, 0, 256, 256);

    const tablas = 8;
    const h = 256 / tablas;
    for (let i = 0; i < tablas; i++) {
        const y = i * h;
        ctx.fillStyle = (i % 2 === 0) ? "#5c3317" : "#3d1f0b";
        ctx.fillRect(0, y + 1, 256, h - 2);
    }
    return crearTexturaDesdeCanvas(gl, c);
}

// 10. Colores Planos
export function crearTexturaColorPlano(gl, r, g, b, a = 255) {
    const textura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        1, 1, 0,
        gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([r, g, b, a])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return textura;
}

// 11. Cartel Neón Circular "Rueda Mágica" (Centro de la Noria - Paso 12)
export function generarTexturaCartelRuedaMagica(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Fondo circular azul marino profundo
    ctx.clearRect(0, 0, 512, 512);
    ctx.beginPath();
    ctx.arc(256, 256, 250, 0, Math.PI * 2);
    ctx.fillStyle = "#070c24";
    ctx.fill();

    // Borde exterior con efecto resplandor de neón fucsia / magenta
    ctx.lineWidth = 14;
    ctx.strokeStyle = "#ff007f";
    ctx.stroke();

    // Anillo interior de neón azul eléctrico / cian
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#00e5ff";
    ctx.stroke();

    // Puntos de bombillas LED festivas alrededor del perímetro
    const numBombillas = 24;
    for (let i = 0; i < numBombillas; i++) {
        const theta = (i / numBombillas) * Math.PI * 2;
        const bx = 256 + Math.cos(theta) * 240;
        const by = 256 + Math.sin(theta) * 240;
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = (i % 2 === 0) ? "#ffff55" : "#ff3366";
        ctx.fill();
    }

    // Estrellas doradas decorativas
    const dibujarEstrella = (cx, cy, r, puntas = 5) => {
        ctx.beginPath();
        for (let i = 0; i < puntas * 2; i++) {
            const rad = (i % 2 === 0) ? r : r * 0.45;
            const ang = (i / (puntas * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(ang) * rad;
            const y = cy + Math.sin(ang) * rad;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = "#ffd700";
        ctx.fill();
    };

    dibujarEstrella(256, 120, 24);
    dibujarEstrella(140, 360, 18);
    dibujarEstrella(372, 360, 18);

    // Tipografía central "RUEDA" y "MÁGICA"
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // "RUEDA"
    ctx.font = "900 64px 'Impact', 'Arial Black', sans-serif";
    ctx.fillStyle = "#d00036";
    ctx.fillText("RUEDA", 256 + 3, 205 + 3);
    ctx.fillStyle = "#ffdd00";
    ctx.fillText("RUEDA", 256, 205);

    // "MÁGICA"
    ctx.font = "900 60px 'Impact', 'Arial Black', sans-serif";
    ctx.fillStyle = "#9000a0";
    ctx.fillText("MÁGICA", 256 + 3, 275 + 3);
    ctx.fillStyle = "#ff3df1";
    ctx.fillText("MÁGICA", 256, 275);

    // Estrellas pequeñas de adorno
    dibujarEstrella(230, 340, 12);
    dibujarEstrella(256, 340, 14);
    dibujarEstrella(282, 340, 12);

    return crearTexturaDesdeCanvas(gl, c);
}

// 12. Fachada de Taquilla con Ventanilla y Rótulo "TAQUILLA"
export function generarTexturaTaquilla(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Fondo marfil / paneles blancos
    ctx.fillStyle = "#f5f6f8";
    ctx.fillRect(0, 0, 512, 512);

    // Zócalo inferior azul institucional
    ctx.fillStyle = "#0c5ec7";
    ctx.fillRect(0, 380, 512, 132);

    // Rótulo superior "TAQUILLA"
    ctx.fillStyle = "#083e88";
    ctx.fillRect(20, 24, 472, 90);
    ctx.strokeStyle = "#fec514";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 24, 472, 90);

    ctx.font = "bold 46px 'Arial Black', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TAQUILLA", 256, 68);

    // Ventanilla de atención acristalada central
    ctx.fillStyle = "#1e3a5f";
    ctx.fillRect(80, 140, 352, 210);

    // Vidrio reflectante
    const gradVidrio = ctx.createLinearGradient(80, 140, 432, 350);
    gradVidrio.addColorStop(0, "rgba(90, 160, 220, 0.75)");
    gradVidrio.addColorStop(0.5, "rgba(140, 210, 255, 0.5)");
    gradVidrio.addColorStop(1, "rgba(50, 110, 180, 0.8)");
    ctx.fillStyle = gradVidrio;
    ctx.fillRect(86, 146, 340, 198);

    // Marco y ranura de venta de boletos
    ctx.fillStyle = "#fec514";
    ctx.fillRect(206, 310, 100, 26);
    ctx.fillStyle = "#0a0f18";
    ctx.fillRect(216, 320, 80, 8);

    // Luces de feria circundantes
    for (let x = 32; x < 480; x += 36) {
        ctx.beginPath();
        ctx.arc(x, 16, 5, 0, Math.PI * 2);
        ctx.fillStyle = (x % 72 === 0) ? "#ffff00" : "#ff3333";
        ctx.fill();
    }

    return crearTexturaDesdeCanvas(gl, c);
}

// 13. Vidrio Acristalado con Reflejos y Calado para Cabinas
export function generarTexturaVidrioCabina(gl) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    // Vidrio tintado semi-transparente celeste con reflejos
    ctx.fillStyle = "rgba(180, 225, 255, 0.55)";
    ctx.fillRect(0, 0, 256, 256);

    // Franjas diagonales de brillo especular
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(100, 0);
    ctx.lineTo(140, 0);
    ctx.lineTo(0, 140);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(40, 256);
    ctx.lineTo(256, 40);
    ctx.lineTo(256, 80);
    ctx.lineTo(80, 256);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fill();

    // Marco perimetral
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 246);

    return crearTexturaDesdeCanvas(gl, c);
}

// 14. Acero Estructural Cepillado para Torres de Soporte
export function generarTexturaAcero(gl) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#8a9ba8";
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
    }
    return crearTexturaDesdeCanvas(gl, c);
}

// 15. Cartel Luminoso para la Subidita / Rampa de Acceso a la Rueda
export function generarTexturaCartelRampa(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");

    // Fondo azul rey con degradado elegante
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, "#08306b");
    grad.addColorStop(0.5, "#0b5ed7");
    grad.addColorStop(1, "#041b3b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 128);

    // Marco dorado reflectante
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 488, 104);

    // Texto de Entrada
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px 'Segoe UI', Tahoma, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
    ctx.shadowBlur = 12;
    ctx.fillText("★ SUBIDA A LA RUEDA ★", 256, 50);

    ctx.fillStyle = "#ffdd44";
    ctx.font = "bold 18px 'Segoe UI', Tahoma, sans-serif";
    ctx.shadowBlur = 6;
    ctx.fillText("ACCESO PEATONAL ELEVADO  ▲", 256, 92);

    return crearTexturaDesdeCanvas(gl, c);
}

// 16. Globo Terráqueo de Alta Definición (Tierra - Paso 7 y 10)
export function generarTexturaGloboTerraqueo(gl) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Fondo: Océanos y Mares de azul vibrante con degradado batimétrico
    const gradOceano = ctx.createLinearGradient(0, 0, 0, 512);
    gradOceano.addColorStop(0, "#082d60");
    gradOceano.addColorStop(0.3, "#0b4da2");
    gradOceano.addColorStop(0.6, "#0d5cb8");
    gradOceano.addColorStop(1, "#06224c");
    ctx.fillStyle = gradOceano;
    ctx.fillRect(0, 0, 1024, 512);

    ctx.save();

    // 1. Plataforma continental / Aguas someras costeras (brillante resplandor cian turquesa)
    ctx.lineWidth = 14;
    ctx.strokeStyle = "rgba(0, 229, 255, 0.55)";
    ctx.beginPath();
    ctx.moveTo(310, 210);
    ctx.bezierCurveTo(340, 215, 380, 230, 395, 260);
    ctx.bezierCurveTo(420, 290, 435, 330, 410, 370);
    ctx.bezierCurveTo(390, 410, 360, 440, 345, 465);
    ctx.lineTo(340, 480);
    ctx.bezierCurveTo(325, 460, 320, 420, 315, 380);
    ctx.bezierCurveTo(300, 340, 280, 300, 285, 270);
    ctx.bezierCurveTo(290, 240, 295, 220, 310, 210);
    ctx.stroke();

    // 2. SUDAMÉRICA CONTINENTAL (Fiel a la fotografía satelital de la estatua)
    ctx.beginPath();
    ctx.moveTo(310, 210); // Istmo de Panamá / Caribe
    ctx.bezierCurveTo(340, 215, 380, 230, 395, 260); // Costa de Venezuela / Guyanas
    ctx.bezierCurveTo(420, 290, 435, 330, 410, 370); // Saliente de Brasil (Recife)
    ctx.bezierCurveTo(390, 410, 360, 440, 345, 465); // Costa atlántica sur / Argentina
    ctx.lineTo(340, 480); // Tierra del Fuego / Cabo de Hornos
    ctx.bezierCurveTo(325, 460, 320, 420, 315, 380); // Chile sur / fiordos
    ctx.bezierCurveTo(300, 340, 280, 300, 285, 270); // Costa del Perú
    ctx.bezierCurveTo(290, 240, 295, 220, 310, 210); // Ecuador / Colombia
    ctx.closePath();

    // Relleno topográfico realista: Selva amazónica verde esmeralda y meseta brasileña
    const gradSA = ctx.createLinearGradient(280, 210, 420, 480);
    gradSA.addColorStop(0, "#236b28");    // Caribe norte
    gradSA.addColorStop(0.30, "#2e8535"); // Cuenca del Amazonas
    gradSA.addColorStop(0.55, "#827717"); // Meseta del Mato Grosso / Chaco
    gradSA.addColorStop(0.75, "#689f38"); // Pampas argentinas
    gradSA.addColorStop(0.95, "#b0bec5"); // Patagonia austral
    ctx.fillStyle = gradSA;
    ctx.fill();

    // Detalles del río Amazonas y afluentes en azul brillante
    ctx.strokeStyle = "#0b5cb8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(410, 265); // Desembocadura en el Atlántico
    ctx.bezierCurveTo(370, 268, 335, 272, 310, 268); // Río Amazonas
    ctx.stroke();

    // Cordillera de los Andes (imponente cadena montañosa marrón con cumbres nevadas blancas)
    ctx.beginPath();
    ctx.moveTo(308, 212);
    ctx.bezierCurveTo(298, 250, 288, 290, 298, 330);
    ctx.bezierCurveTo(308, 370, 318, 410, 322, 440);
    ctx.lineTo(338, 475);
    ctx.strokeStyle = "#5d4037"; // Andes rocosos
    ctx.lineWidth = 14;
    ctx.stroke();

    // Cumbres nevadas de la cordillera blanca
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Lago Titicaca y Puno (destacado con zafiro y resplandor de sol dorado)
    ctx.beginPath();
    ctx.arc(308, 315, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#00e5ff";
    ctx.fill();
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // NORTEAMÉRICA Y CENTROAMÉRICA
    ctx.beginPath();
    ctx.moveTo(180, 80); // Alaska
    ctx.bezierCurveTo(240, 70, 320, 90, 340, 130);
    ctx.bezierCurveTo(350, 160, 320, 190, 300, 195);
    ctx.lineTo(290, 215);
    ctx.lineTo(260, 220);
    ctx.bezierCurveTo(230, 180, 200, 140, 175, 110);
    ctx.closePath();
    ctx.fillStyle = "#388e3c";
    ctx.fill();

    // EUROPA Y ÁFRICA
    ctx.beginPath();
    ctx.moveTo(500, 80);
    ctx.bezierCurveTo(540, 70, 580, 90, 560, 140);
    ctx.lineTo(510, 150);
    ctx.closePath();
    ctx.fillStyle = "#4caf50";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(490, 165);
    ctx.bezierCurveTo(540, 160, 580, 190, 585, 240);
    ctx.bezierCurveTo(570, 300, 540, 360, 530, 380);
    ctx.bezierCurveTo(510, 350, 480, 280, 470, 230);
    ctx.closePath();
    ctx.fillStyle = "#fbc02d";
    ctx.fill();

    // ASIA Y OCEANÍA
    ctx.beginPath();
    ctx.moveTo(580, 80);
    ctx.bezierCurveTo(680, 60, 820, 90, 800, 180);
    ctx.lineTo(720, 240);
    ctx.lineTo(620, 170);
    ctx.closePath();
    ctx.fillStyle = "#558b2f";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(820, 360, 45, 30, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#e65100";
    ctx.fill();

    // Antártida
    ctx.beginPath();
    ctx.rect(0, 485, 1024, 27);
    ctx.fillStyle = "#eceff1";
    ctx.fill();

    // Nubes atmosféricas transparentes
    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    for (let s = 0; s < 22; s++) {
        const nx = (s * 52) % 1024;
        const ny = 50 + ((s * 41) % 400);
        ctx.beginPath();
        ctx.ellipse(nx, ny, 70 + (s % 5) * 18, 14, (s % 3) * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    // Cuadrícula de paralelos y meridianos sutil
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let lat = 64; lat < 512; lat += 64) {
        ctx.beginPath();
        ctx.moveTo(0, lat);
        ctx.lineTo(1024, lat);
        ctx.stroke();
    }
    for (let lon = 0; lon < 1024; lon += 128) {
        ctx.beginPath();
        ctx.moveTo(lon, 0);
        ctx.lineTo(lon, 512);
        ctx.stroke();
    }
    ctx.restore();

    return crearTexturaDesdeCanvas(gl, c);
}

// 17. Placa Conmemorativa del Pedestal "ENRIQUE TORRES BELÓN" (Fiel a la Fotografía)
export function generarTexturaPlacaTorresBelon(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d");

    // Fondo granito negro azabache pulido con degradado sutil
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#1c1f24");
    grad.addColorStop(0.5, "#0d0f12");
    grad.addColorStop(1, "#15181c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Marco biselado de corte en piedra
    ctx.strokeStyle = "rgba(255, 215, 0, 0.35)";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 240);

    // Tipografía esculpida en oro en 2 líneas exactamente como en la foto
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 1. Sombra esculpida profunda de bajo relieve
    ctx.font = "900 52px 'Times New Roman', Georgia, serif";
    ctx.fillStyle = "#3d2b05";
    ctx.fillText("ENRIQUE", 256 + 3, 90 + 3);
    ctx.fillText("TORRES BELÓN", 256 + 3, 165 + 3);

    // 2. Letras principales en oro bruñido con resplandor
    ctx.shadowColor = "rgba(255, 215, 0, 0.95)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#fde078";
    ctx.fillText("ENRIQUE", 256, 90);
    ctx.fillText("TORRES BELÓN", 256, 165);

    // 3. Brillo de arista superior en oro claro
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 51px 'Times New Roman', Georgia, serif";
    ctx.fillText("ENRIQUE", 256, 88);
    ctx.fillText("TORRES BELÓN", 256, 163);

    return crearTexturaDesdeCanvas(gl, c);
}

// 18. Bronce Escultórico Patinado Realista para la Estatua
export function generarTexturaBronceEstatua(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Fondo degradado de bronce patinado clásico monumental
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, "#2c1c13");
    grad.addColorStop(0.3, "#422b1c");
    grad.addColorStop(0.55, "#4e3422");
    grad.addColorStop(0.75, "#3d2719");
    grad.addColorStop(1, "#26180f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Veteado de pátina verdigrís sutil en las hendiduras y pliegues
    ctx.fillStyle = "rgba(48, 76, 56, 0.16)";
    for (let i = 0; i < 45; i++) {
        ctx.beginPath();
        const y = Math.random() * 512;
        ctx.ellipse(Math.random() * 512, y, 40 + Math.random() * 90, 6 + Math.random() * 16, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // Reflejos especulares cobrizos cálidos de pulido escultórico
    ctx.fillStyle = "rgba(195, 128, 62, 0.15)";
    for (let i = 0; i < 35; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * 512, Math.random() * 512, 25 + Math.random() * 70, 4 + Math.random() * 10, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // Granulado fino de fundición en bronce artesanal
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let k = 0; k < d.length; k += 4) {
        const noise = (Math.random() - 0.5) * 24;
        d[k] = Math.min(255, Math.max(20, d[k] + noise + 12));     // R cobrizo
        d[k+1] = Math.min(255, Math.max(16, d[k+1] + noise + 6));  // G
        d[k+2] = Math.min(255, Math.max(10, d[k+2] + noise));      // B
    }
    ctx.putImageData(imgData, 0, 0);

    return crearTexturaDesdeCanvas(gl, c);
}

// 19. Parterre Floral con Letras Esculpidas "UNAPUNO" (Fiel a la Imagen 2)
export function generarTexturaParterreUNAPUNO(gl) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Fondo césped inglés esmeralda con franjas diagonales de corte
    ctx.fillStyle = "#2e7d32";
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = "rgba(46, 125, 50, 0.4)";
    for (let x = -512; x < 1024; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 512, 512);
        ctx.lineTo(x + 544, 512);
        ctx.lineTo(x + 32, 0);
        ctx.closePath();
        ctx.fill();
    }

    // Marco exterior de seto denso y flores ornamentales
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = 32;
    ctx.strokeRect(16, 16, 992, 480);

    // Orla de flores rojas y violetas
    ctx.strokeStyle = "#e91e63";
    ctx.lineWidth = 12;
    ctx.strokeRect(36, 36, 952, 440);

    // Letras monumentales de flores blancas y doradas: "UNAPUNO"
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 130px 'Arial Black', Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;
    ctx.fillText("UNAPUNO", 512, 256);

    // Textura punteada de flores sobre las letras
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#ffd54f";
    ctx.font = "900 118px 'Arial Black', Impact, sans-serif";
    ctx.fillText("UNAPUNO", 512, 256);

    // Flores decorativas dispersas en las esquinas
    const coloresFlores = ["#e91e63", "#9c27b0", "#ffeb3b", "#ff9800", "#ffffff"];
    for (let i = 0; i < 90; i++) {
        const fx = 60 + Math.random() * 904;
        const fy = 60 + Math.random() * 392;
        // Evitar pintar encima del texto central
        if (fx > 180 && fx < 844 && fy > 170 && fy < 340) continue;
        ctx.beginPath();
        ctx.arc(fx, fy, 4 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fillStyle = coloresFlores[i % coloresFlores.length];
        ctx.fill();
    }

    return crearTexturaDesdeCanvas(gl, c);
}

// 20. Setos Recortados con Flores Vistosas (Jardines de la Plaza)
export function generarTexturaSetosFlores(gl) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    // Follaje de seto verde frondoso
    ctx.fillStyle = "#1e4620";
    ctx.fillRect(0, 0, 256, 256);

    // Hojas y textura botánica
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = 3 + Math.random() * 6;
        ctx.fillStyle = (i % 2 === 0) ? "#2d6a33" : "#143716";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Flores multicolores (petunias, geranios, margaritas)
    const flores = ["#e53935", "#ab47bc", "#fdd835", "#ffffff", "#ff9800"];
    for (let f = 0; f < 65; f++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.fillStyle = flores[f % flores.length];
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }

    return crearTexturaDesdeCanvas(gl, c);
}

// 21. Mármol Blanco / Travertino para Bordillos y Bancas
export function generarTexturaMarmolBlanco(gl) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#f5f5f7";
    ctx.fillRect(0, 0, 256, 256);

    // Vetas minerales suaves
    ctx.strokeStyle = "rgba(180, 185, 195, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.bezierCurveTo(80, 70, 150, 20, 256, 120);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(30, 256);
    ctx.bezierCurveTo(100, 190, 190, 230, 256, 180);
    ctx.stroke();

    // Marco de corte de piedra
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 252);

    return crearTexturaDesdeCanvas(gl, c);
}

// 22. Corteza de Árbol Rugosa para Troncos y Ramas
export function generarTexturaCortezaArbol(gl) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Fondo marrón oscuro terroso
    ctx.fillStyle = "#3e2718";
    ctx.fillRect(0, 0, 256, 512);

    // Surcos verticales de corteza natural
    for (let i = 0; i < 40; i++) {
        const x = (i / 40) * 256 + (Math.random() - 0.5) * 6;
        ctx.strokeStyle = (i % 2 === 0) ? "#27160c" : "#5d3b24";
        ctx.lineWidth = 3 + Math.random() * 4;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (Math.random() - 0.5) * 12, 170, x + (Math.random() - 0.5) * 12, 340, x, 512);
        ctx.stroke();
    }

    // Pátina de musgo sutil verdoso
    for (let m = 0; m < 25; m++) {
        const mx = Math.random() * 256;
        const my = Math.random() * 512;
        ctx.fillStyle = "rgba(76, 110, 48, 0.35)";
        ctx.beginPath();
        ctx.arc(mx, my, 8 + Math.random() * 12, 0, Math.PI * 2);
        ctx.fill();
    }

    return crearTexturaDesdeCanvas(gl, c);
}

// 23. Follaje Botánico Frondoso para Árboles
export function generarTexturaFollajeArbol(gl) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Fondo verde bosque profundo
    ctx.fillStyle = "#1b441f";
    ctx.fillRect(0, 0, 512, 512);

    // Gradientes de hojas y claroscuro de copa
    const tonos = ["#265c2b", "#317436", "#428d48", "#183e1c", "#52a559"];
    for (let h = 0; h < 600; h++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 6 + Math.random() * 16;
        ctx.fillStyle = tonos[h % tonos.length];
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Brillos de sol matinal en las puntas de las hojas
    ctx.fillStyle = "rgba(165, 214, 118, 0.35)";
    for (let s = 0; s < 120; s++) {
        const sx = Math.random() * 512;
        const sy = Math.random() * 512;
        ctx.beginPath();
        ctx.arc(sx, sy, 4 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
    }

    return crearTexturaDesdeCanvas(gl, c);
}

// Aliases para compatibilidad directa
export const generarTexturaCarpa = generarTexturaToldo;
export const generarTexturaLadrillo = generarTexturaMuroUNA;

/**
 * FÁBRICA CENTRAL DE TEXTURAS PROCEDURALES HD
 * Encapsula la generación gráfica procedural en memoria con Canvas 2D.
 */
export class FabricaTexturas {
    static crearDesdeCanvas(gl, canvas2D) {
        return crearTexturaDesdeCanvas(gl, canvas2D);
    }

    static colorPlano(gl, r, g, b, a = 255) {
        return crearTexturaColorPlano(gl, r, g, b, a);
    }

    static adoquinesUNA(gl) { return generarTexturaAdoquinesUNA(gl); }
    static ladrillo(gl) { return generarTexturaMuroUNA(gl); }
    static muroUNA(gl) { return generarTexturaMuroUNA(gl); }
    static letreroUNA(gl) { return generarTexturaLetreroUNA(gl); }
    static escudoUNA(gl) { return generarTexturaEscudoUNA(gl); }
    static edificioCampus(gl) { return generarTexturaEdificioCampus(gl); }
    static cesped(gl) { return generarTexturaCesped(gl); }
    static toldo(gl, c1, c2) { return generarTexturaToldo(gl, c1, c2); }
    static carpa(gl, c1, c2) { return generarTexturaToldo(gl, c1, c2); }
    static letreroPuesto(gl, texto) { return generarTexturaLetreroPuesto(gl, texto); }
    static madera(gl) { return generarTexturaMadera(gl); }
    static cartelRuedaMagica(gl) { return generarTexturaCartelRuedaMagica(gl); }
    static taquilla(gl) { return generarTexturaTaquilla(gl); }
    static vidrioCabina(gl) { return generarTexturaVidrioCabina(gl); }
    static acero(gl) { return generarTexturaAcero(gl); }
    static cartelRampa(gl) { return generarTexturaCartelRampa(gl); }
    static globoTerraqueo(gl) { return generarTexturaGloboTerraqueo(gl); }
    static placaTorresBelon(gl) { return generarTexturaPlacaTorresBelon(gl); }
    static bronceEstatua(gl) { return generarTexturaBronceEstatua(gl); }
    static parterreUNAPUNO(gl) { return generarTexturaParterreUNAPUNO(gl); }
    static setosFlores(gl) { return generarTexturaSetosFlores(gl); }
    static marmolBlanco(gl) { return generarTexturaMarmolBlanco(gl); }
    static cortezaArbol(gl) { return generarTexturaCortezaArbol(gl); }
    static follajeArbol(gl) { return generarTexturaFollajeArbol(gl); }
}

/**
 * REPOSITORIO DE TEXTURAS DE ESCENA
 * Administra el ciclo de vida, almacenamiento y recuperación indexada de texturas WebGL2.
 */
export class RepositorioTexturas {
    constructor(gl) {
        this.gl = gl;
        this.texturas = {};
    }

    cargarTodas() {
        const gl = this.gl;
        this.texturas = {
            adoquines: FabricaTexturas.adoquinesUNA(gl),
            ladrillo: FabricaTexturas.muroUNA(gl),
            muroUNA: FabricaTexturas.muroUNA(gl),
            letreroUNA: FabricaTexturas.letreroUNA(gl),
            escudoUNA: FabricaTexturas.escudoUNA(gl),
            edificioCampus: FabricaTexturas.edificioCampus(gl),
            cesped: FabricaTexturas.cesped(gl),
            toldoRojo: FabricaTexturas.toldo(gl, "#e52521", "#ffffff"),
            toldoAzul: FabricaTexturas.toldo(gl, "#0b5ed7", "#fec514"),
            letreroBoleto: FabricaTexturas.letreroPuesto(gl, "BOLETERÍA"),
            letreroPopcorn: FabricaTexturas.letreroPuesto(gl, "POPCORN & DULCES"),
            letreroJuegos: FabricaTexturas.letreroPuesto(gl, "TIRO AL BLANCO"),
            carpaRoja: FabricaTexturas.carpa(gl, "#e52521", "#ffffff"),
            carpaAzul: FabricaTexturas.carpa(gl, "#0b5ed7", "#ffdd33"),
            madera: FabricaTexturas.madera(gl),
            blanco: FabricaTexturas.colorPlano(gl, 245, 245, 250),
            grisClaro: FabricaTexturas.colorPlano(gl, 195, 200, 208),
            grisOscuro: FabricaTexturas.colorPlano(gl, 80, 85, 95),
            azul: FabricaTexturas.colorPlano(gl, 12, 85, 175),
            azulOscuro: FabricaTexturas.colorPlano(gl, 7, 45, 105),
            rojoFeria: FabricaTexturas.colorPlano(gl, 225, 30, 45),
            amarillo: FabricaTexturas.colorPlano(gl, 255, 205, 20),
            verdePino: FabricaTexturas.colorPlano(gl, 30, 75, 25),
            metalOscuro: FabricaTexturas.colorPlano(gl, 45, 48, 55),
            cartelRuedaMagica: FabricaTexturas.cartelRuedaMagica(gl),
            taquilla: FabricaTexturas.taquilla(gl),
            vidrioCabina: FabricaTexturas.vidrioCabina(gl),
            acero: FabricaTexturas.acero(gl),
            cartelRampa: FabricaTexturas.cartelRampa(gl),
            globoTerraqueo: FabricaTexturas.globoTerraqueo(gl),
            placaTorresBelon: FabricaTexturas.placaTorresBelon(gl),
            bronceEstatua: FabricaTexturas.bronceEstatua(gl),
            parterreUNAPUNO: FabricaTexturas.parterreUNAPUNO(gl),
            setosFlores: FabricaTexturas.setosFlores(gl),
            marmolBlanco: FabricaTexturas.marmolBlanco(gl),
            cortezaArbol: FabricaTexturas.cortezaArbol(gl),
            follajeArbol: FabricaTexturas.follajeArbol(gl),
            metalAzul: FabricaTexturas.colorPlano(gl, 14, 115, 225),
            metalRojo: FabricaTexturas.colorPlano(gl, 225, 25, 45),
            metalBlanco: FabricaTexturas.colorPlano(gl, 245, 248, 255),
            metalAmarillo: FabricaTexturas.colorPlano(gl, 255, 215, 25)
        };
        return this.texturas;
    }

    obtener(nombre) {
        return this.texturas[nombre];
    }
}



