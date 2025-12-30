# Validador de Tiquetes - Baloto, Miloto, Colorloto

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)](https://nodejs.org/)

> Aplicación web para validar tiquetes de lotería colombiana con carga automática de resultados oficiales mediante web scraping.

## 🎯 Características

-   ✅ **Validación de Baloto**: 5 números principales + Súper Balota
-   ✅ **Validación de Miloto**: 5 números (1-39)
-   ✅ **Validación de Colorloto**: 6 pares color-número
-   🔄 **Carga automática de resultados** desde resultadobaloto.com
-   💰 **Cálculo automático de premios**
-   🎲 **Generador aleatorio de números**
-   📱 **Diseño responsive**

## 🚀 Inicio Rápido

### Requisitos Previos

-   Node.js (≥ 16.0.0)
-   npm (incluido con Node.js)

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/ValidadorTiquetesBaloto.git

# Entrar al directorio
cd ValidadorTiquetesBaloto

# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

Abre tu navegador en: **http://localhost:3000**

### Windows - Inicio Rápido

Doble clic en: `scripts/INICIAR.bat`

## 📁 Estructura del Proyecto

```
ValidadorTiquetesBaloto/
├── public/              # Archivos públicos (HTML, CSS, JS)
│   ├── index.html       # Página principal
│   ├── css/styles.css   # Estilos
│   └── js/app.js        # Lógica del cliente
├── src/                 # Código del servidor
│   └── server.js        # Servidor Express + scraping
├── tests/               # Archivos de prueba
├── docs/                # Documentación
│   ├── DEPLOYMENT.md    # Guía de despliegue
│   ├── ESTRUCTURA.md    # Estructura del proyecto
│   └── COMO_USAR.txt    # Instrucciones detalladas
├── scripts/             # Scripts de utilidad
└── package.json         # Dependencias y scripts
```

## 🌐 Despliegue

### GitHub

GitHub **solo almacena el código**. Para ejecutar:

-   **Localmente**: Clona, instala y ejecuta (`npm start`)
-   **En producción**: Usa un servicio de hosting (ver abajo)

### Despliegue en Producción (Gratis)

#### Render (Recomendado)

1. Sube tu código a GitHub
2. Crea cuenta en [render.com](https://render.com)
3. "New Web Service" → Conecta tu repositorio
4. Deploy automático ✅

#### Railway

1. Sube a GitHub
2. [railway.app](https://railway.app) → "Deploy from GitHub"
3. Selecciona tu repo → Deploy automático ✅

**📖 Guía completa:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 💻 Scripts Disponibles

```bash
npm start       # Iniciar servidor (producción)
npm run dev     # Modo desarrollo (auto-reload)
npm test        # Ejecutar pruebas
```

## 🧪 Pruebas

Después de `npm start`, abre:

-   **Aplicación:** http://localhost:3000
-   **Pruebas automáticas:** http://localhost:3000/tests/test-auto.html

## 🔧 Tecnologías

-   **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
-   **Backend**: Node.js, Express.js
-   **Scraping**: Axios, Cheerio
-   **CORS**: cors middleware

## 📡 API Endpoints

```
GET /api/baloto      # Últimos resultados de Baloto
GET /api/miloto      # Últimos resultados de Miloto
GET /api/colorloto   # Últimos resultados de Colorloto
```

## ⚠️ Importante

1. **NO abrir `index.html` directamente** - Debe usarse servidor local
2. **Verificar resultados oficiales** en [baloto.com](https://baloto.com)
3. **Solo fines informativos** - Sin responsabilidad legal
4. **Web scraping**: Si el sitio fuente cambia estructura, puede requerir actualización

## 🌐 Fuentes de Datos

-   [resultadobaloto.com](https://www.resultadobaloto.com/) - Resultados de Baloto
-   [resultadobaloto.com/miloto.php](https://www.resultadobaloto.com/miloto.php) - Resultados de Miloto
-   [resultadobaloto.com/colorloto.php](https://www.resultadobaloto.com/colorloto.php) - Resultados de Colorloto

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit cambios (`git commit -m 'Agregar mejora'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles

## 👨‍💻 Autor

Desarrollado para validación de tiquetes de lotería colombiana 🇨🇴

## 📞 Soporte

-   **Issues**: [GitHub Issues](https://github.com/TU_USUARIO/ValidadorTiquetesBaloto/issues)
-   **Documentación**: Ver carpeta `docs/`

---

**⭐ Si te gusta este proyecto, dale una estrella en GitHub!**
