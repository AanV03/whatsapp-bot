# WhatsApp Bot

Un bot de WhatsApp para automatizar mensajes y respuestas.

## Requisitos

- Node.js (v14 o superior)
- npm

## Instalación

Primero, instala las dependencias:

```bash
npm install
```

Esto instalará:
- **whatsapp-web.js** - Librería para controlar WhatsApp Web
- **qrcode-terminal** - Para mostrar código QR en la terminal
- **dotenv** - Para gestionar variables de entorno
- **@google/generative-ai** - Para integración con IA generativa
- **sharp** - Para procesamiento de imágenes

## Configuración

1. Crea un archivo `.env` en la raíz del proyecto
2. Agrega las variables de entorno necesarias:

```
GOOGLE_API_KEY=tu_clave_api_aqui
```

## Uso

```bash
npm start
```

**Primera ejecución:**
- El bot generará un código QR en la terminal
- Escanea el código QR con WhatsApp (Configuración > Dispositivos vinculados > Vincular dispositivo)
- El bot quedará autenticado

**Sesión guardada:**
- Los datos de sesión se guardan en la carpeta `temp/`
- En ejecuciones posteriores no necesitarás escanear el QR de nuevo

## Estructura del Proyecto

```
├── index.js          - Archivo principal
├── package.json      - Dependencias del proyecto
├── .gitignore        - Archivos ignorados por git
└── temp/             - Archivos temporales
```

## Desarrollo

Para más información, consulta la documentación de WhatsApp API.

## Licencia

ISC
