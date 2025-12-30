# 📂 Estructura del Proyecto - Mejores Prácticas

## 🎯 Organización de Carpetas

```
ValidadorTiquetesBaloto/
│
├── 📁 public/                    # Archivos servidos al cliente
│   ├── index.html                # Página principal
│   ├── 📁 css/
│   │   └── styles.css           # Estilos globales
│   └── 📁 js/
│       └── app.js               # Lógica del cliente
│
├── 📁 src/                       # Código fuente del servidor
│   └── server.js                # Servidor Express + API scraping
│
├── 📁 tests/                     # Suite de pruebas
│   ├── test-auto.html           # Pruebas automáticas (navegador)
│   ├── test.html                # Pruebas manuales
│   ├── test-endpoints.js        # Prueba de endpoints
│   ├── test-scraping.js         # Prueba de scraping Miloto
│   ├── test-baloto-scraping.js  # Prueba de scraping Baloto
│   └── debug-baloto-html.js     # Debug HTML de Baloto
│
├── 📁 docs/                      # Documentación
│   ├── README.md                # Documentación principal
│   └── COMO_USAR.txt           # Guía de uso detallada
│
├── 📁 scripts/                   # Scripts de utilidad
│   └── INICIAR.bat              # Iniciar servidor (Windows)
│
├── 📁 .vscode/                   # Configuración VS Code
│   ├── extensions.json          # Extensiones recomendadas
│   └── settings.json            # Configuración del editor
│
├── 📄 package.json               # Dependencias y scripts npm
├── 📄 .gitignore                # Archivos ignorados por Git
├── 📄 .prettierrc.js            # Configuración Prettier
└── 📄 README.md                 # Documentación raíz

```

## 🎨 Principios de Organización Aplicados

### 1. **Separación de Responsabilidades**

-   `public/` - Todo lo que el navegador necesita
-   `src/` - Lógica del servidor
-   `tests/` - Todo relacionado con pruebas
-   `docs/` - Documentación
-   `scripts/` - Utilidades y herramientas

### 2. **Estructura Escalable**

```
public/
├── css/        # Estilos organizados
├── js/         # Scripts del cliente
└── assets/     # (Futuro) Imágenes, fuentes, etc.

src/
├── server.js   # Punto de entrada
├── routes/     # (Futuro) Rutas separadas
├── services/   # (Futuro) Lógica de negocio
└── utils/      # (Futuro) Utilidades
```

### 3. **Configuración Centralizada**

-   `.vscode/` - Configuración del editor
-   `.prettierrc.js` - Formato de código
-   `package.json` - Scripts y dependencias

## 📋 Scripts NPM Disponibles

```bash
npm start       # Producción: node src/server.js
npm run dev     # Desarrollo: nodemon src/server.js
npm test        # Pruebas: node tests/test-endpoints.js
```

## 🔧 Rutas y Endpoints

### Archivos Estáticos

```
/                    → public/index.html
/css/styles.css     → public/css/styles.css
/js/app.js          → public/js/app.js
```

### API Endpoints

```
GET /api/baloto     → src/server.js (scraping)
GET /api/miloto     → src/server.js (scraping)
GET /api/colorloto  → src/server.js (scraping)
```

### Archivos de Prueba

```
/tests/test-auto.html  → Pruebas automáticas en navegador
/tests/test.html       → Pruebas manuales
```

## 🎯 Ventajas de esta Estructura

### ✅ Claridad

-   Cada carpeta tiene un propósito específico
-   Fácil encontrar archivos relacionados
-   Nuevos desarrolladores entienden rápido

### ✅ Mantenibilidad

-   Cambios aislados en módulos específicos
-   Fácil agregar nuevas funcionalidades
-   Tests separados del código productivo

### ✅ Escalabilidad

-   Preparado para crecer
-   Fácil agregar más juegos/loterias
-   Estructura lista para backend modular

### ✅ Profesionalismo

-   Sigue convenciones de la industria
-   Compatible con herramientas modernas
-   Fácil integración CI/CD

## 🚀 Próximas Mejoras Sugeridas

### 1. Modularizar el Backend

```
src/
├── server.js
├── routes/
│   ├── baloto.js
│   ├── miloto.js
│   └── colorloto.js
├── services/
│   ├── scraper.js
│   └── validator.js
└── config/
    └── constants.js
```

### 2. Agregar Variables de Entorno

```
.env
PORT=3000
NODE_ENV=production
SCRAPING_TIMEOUT=5000
```

### 3. Testing Avanzado

```
tests/
├── unit/           # Pruebas unitarias
├── integration/    # Pruebas de integración
└── e2e/           # Pruebas end-to-end
```

### 4. Build Process

```
scripts/
├── build.js       # Compilar/minificar
├── deploy.js      # Despliegue
└── clean.js       # Limpiar archivos temp
```

## 📚 Referencias

-   [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
-   [Express.js Structure](https://expressjs.com/en/starter/generator.html)
-   [Project Guidelines](https://github.com/elsewhencode/project-guidelines)

---

**Estructura diseñada para máxima eficiencia y escalabilidad** 🚀
