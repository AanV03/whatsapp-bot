const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * CAESAR CIPHER FUNCTIONS
 * Implementa el algoritmo de cifrado César para codificar y decodificar mensajes
 */

// Normaliza el desplazamiento al rango 0-25
function normalizeShift(n) {
    return ((n % 26) + 26) % 26;
}

// Codifica un texto usando Caesar Cipher
function encodeCaesar(text, shift) {
    const s = normalizeShift(shift);
    let result = '';

    for (const ch of text) {
        const code = ch.charCodeAt(0);

        // Uppercase A-Z (65-90)
        if (code >= 65 && code <= 90) {
            const base = 65;
            const pos = code - base;
            const shifted = (pos + s) % 26;
            result += String.fromCharCode(base + shifted);
            continue;
        }

        // Lowercase a-z (97-122)
        if (code >= 97 && code <= 122) {
            const base = 97;
            const pos = code - base;
            const shifted = (pos + s) % 26;
            result += String.fromCharCode(base + shifted);
            continue;
        }

        // Non-letter characters are preserved
        result += ch;
    }

    return result;
}

function decodeCaesar(text, shift) {
    return encodeCaesar(text, -shift);
}

/**
 * CLIENTE DE WHATSAPP
 * Inicializa el cliente de WhatsApp Web con autenticación local
 */
const client = new Client({
    authStrategy: new LocalAuth()
});

/**
 * EVENTO: Generar código QR
 * Muestra el código QR en la terminal para escanear con WhatsApp
 */
client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

/**
 * EVENTO: Cliente listo
 * Se ejecuta cuando el bot se conecta exitosamente a WhatsApp
 */
client.on("ready", () => {
    console.log("Client is ready!");
});

/**
 * EVENTO: Mensaje recibido
 * Maneja todos los comandos y mensajes recibidos
 */
client.on('message', async (message) => {
    const messageBody = message.body.trim();

    /**
     * FUNCIONALIDAD: Conversión de Stickers a Imágenes
     * Detecta automáticamente cuando alguien envía un sticker (WEBP)
     * Lo convierte a PNG y lo devuelve como imagen
     */
    // Handle sticker to image conversion
    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            
            // Check if it's a sticker (WEBP)
            if (media && media.mimetype === 'image/webp') {
                const tempDir = path.join(__dirname, 'temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir);
                }

                const fileName = `sticker_${Date.now()}.png`;
                const filePath = path.join(tempDir, fileName);

                // Convert and save
                await sharp(Buffer.from(media.data, 'base64'))
                    .png()
                    .toFile(filePath);

                // Send the converted image
                const imageMedia = MessageMedia.fromFilePath(filePath);
                await message.reply(imageMedia);

                // Clean up the temporary file
                fs.unlink(filePath, (err) => {
                    if (err) console.error("Error deleting temp file:", err);
                });
                return;
            }
        } catch (error) {
            console.error("Error converting sticker:", error);
        }
    }

    /**
     * COMANDO: !cypher PALABRA SHIFT
     * Encripta una palabra usando el cifrado César
     * Ejemplo: !cypher HELLO 3 → KHOOR
     */
    if (messageBody.toLowerCase().startsWith("!cypher ")) {
        const parts = messageBody.split(' ');
        if (parts.length !== 3) {
            message.reply("Formato incorrecto. Usa: !cypher PALABRA SHIFT\nEjemplo: !cypher HELLO 3");
            return;
        }

        const word = parts[1];
        const shift = parseInt(parts[2]);

        if (isNaN(shift) || shift < 0 || shift > 25) {
            message.reply("El shift debe ser un número entre 0 y 25");
            return;
        }

        const result = encodeCaesar(word, shift);
        message.reply(`${result}`);
        return;
    }

    /**
     * COMANDO: !decypher PALABRA SHIFT
     * Desencripta una palabra usando el cifrado César (inverso)
     * Ejemplo: !decypher KHOOR 3 → HELLO
     */
    // Handle !decypher command (decrypt)
    if (messageBody.toLowerCase().startsWith("!decypher ")) {
        const parts = messageBody.split(' ');
        if (parts.length !== 3) {
            message.reply("Formato incorrecto. Usa: !decypher PALABRA SHIFT\nEjemplo: !decypher KHOOR 3");
            return;
        }

        const word = parts[1];
        const shift = parseInt(parts[2]);

        if (isNaN(shift) || shift < 0 || shift > 25) {
            message.reply("El shift debe ser un número entre 0 y 25");
            return;
        }

        const result = decodeCaesar(word, shift);
        message.reply(`${result}`);
        return;
    }

    /**
     * COMANDO: ping
     * Comando simple para verificar que el bot está activo
     * Responde con: pong
     */
    // Handle ping command
    if (message.body.toLowerCase() === "ping") {
        message.reply("pong");
        return;
    }

// Handle definition command
    if (messageBody.toLowerCase().startsWith("definicion")) {
        const word = messageBody.replace(/^definicion\s+/i, '').trim();
        
        if (!word) {
            message.reply("Por favor ingresa una palabra. Ej: definicion Perro");
            return;
        }

        /**
         * PALABRAS SENSIBLES (Responde con el nombre del usuario)
         * Si el usuario pregunta por: gay, homosexual, puto, etc.
         * El bot responde solo con el nombre del usuario que escribió
         */
        const sensitiveWords = ['gay', 'homosexual', 'puto', 'putito', 'maricón', 'maricon', 'jochis', 'joto', 'jotito' ];
        const wordLower = word.toLowerCase();
        
        // Check if the word contains sensitive terms
        const hasSensitiveWord = sensitiveWords.some(sensitive => 
            wordLower.includes(sensitive)
        );

        if (hasSensitiveWord) {
            try {
                // Get user info
                const contact = await message.getContact();
                const userName = contact.name || contact.pushname || message.from;
                
                // Respond only with the user's name
                message.reply(`${userName}`);
            } catch (error) {
                console.error("Error getting contact info:", error);
                message.reply(message.from);
            }
            return;
        }

        /**
         * PALABRAS ESPECIALES (Responde con "Valery")
         * Si el usuario pregunta por: machukis, lencha, lesbiana
         * El bot responde solo: Valery
         */
        const valeryWords = ['machukis', 'lencha', 'lesbiana'];
        const hasValeryWord = valeryWords.some(val => 
            wordLower.includes(val)
        );

        if (hasValeryWord) {
            message.reply("Valery");
            return;
        }

        /**
         * COMANDO: definicion PALABRA
         * Obtiene definiciones de cualquier palabra usando Gemini API
         * Ejemplo: definicion Perro → Responde con la definición
         */
        try {
            message.react('⏳');
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent(`Dame una definición corta y clara (máximo 3 líneas) de la palabra: "${word}". Solo la definición, nada más.`);
            const response = await result.response;
            const text = response.text();
            
            message.reply(text);
            message.react('✅');
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            message.reply("No pude obtener la definición en este momento. Verifica que la API key sea válida.");
            message.react('❌');
        }
        return;
    }

    /**
     * COMANDO: karim
     * Envía un sticker del sitio de memes
     * Comando especial que descarga una imagen y la envía como sticker
     */
    // Handle karim command
    if (message.body.toLowerCase() === "karim") {
        const url = "https://tse3.mm.bing.net/th/id/OIP.vdmvxlhs_lR3tHZrLUdFEwEsDI?rs=1&pid=ImgDetMain&o=7&rm=3";

        try {
            const media = await MessageMedia.fromUrl(url, { unsafeMime: true });

            await client.sendMessage(message.from, media, {
                sendMediaAsSticker: true,
                stickerAuthor: "My Bot",
                stickerName: "Sticker",
            });
        } catch (error) {
            console.error("Failed to send sticker:", error);
        }
        return;
    }
});

/**
 * INICIALIZACIÓN
 * Conecta el bot a WhatsApp Web
 */
client.initialize();