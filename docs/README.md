# Validador de Tiquetes - Baloto, Miloto y Colorloto

Aplicación web para validar tiquetes de lotería colombiana: Baloto, Miloto y Colorloto con **scraping automático de resultados**.

## ⚠️ IMPORTANTE: Cómo Abrir la Aplicación

### ✅ FORMA CORRECTA (con todas las funciones):

1. **Instalar dependencias** (solo la primera vez):
   ```bash
   npm install
   ```

2. **Iniciar el servidor**:
   ```bash
   npm start
   ```

3. **Abrir en el navegador**:
   - Ve a: **http://localhost:3000**
   - ✅ Los botones de carga automática funcionarán

### ❌ FORMA INCORRECTA (NO hagas esto):

- ❌ NO abras el archivo `index.html` directamente (doble clic)
- ❌ NO uses rutas `file:///C:/Users/...`
- ❌ Los botones de "Cargar Resultados" NO funcionarán

### 🧪 Verificar que Todo Funciona:

1. Abre http://localhost:3000/test.html
2. Haz clic en los botones de prueba
3. Si todo está ✅, ve a http://localhost:3000 y usa la aplicación

## 🎰 Características

- **Baloto**: Valida 5 números (1-43) + Súper Balota (1-16) sin repetir
  - ✅ API oficial integrada
  - ✅ Carga automática de resultados y premios reales
  - También incluye Baloto Revancha con las mismas reglas
  
- **Miloto**: Valida 5 números de la suerte del 1 al 39
  - ✅ Web scraping automático desde resultadobaloto.com
  - ✅ Carga con un solo clic
  - Los números no deben repetirse
  
- **Colorloto**: Elige 6 colores (amarillo, azul, rojo, verde, blanco, negro) y asigna a cada uno un número del 1 al 7
  - ✅ Web scraping automático desde resultadobaloto.com
  - ✅ Carga con un solo clic
  - Puedes repetir colores con diferentes números, pero no la misma combinación
  - Puedes repetir números con diferentes colores, pero no la misma combinación

- Generación de resultados aleatorios para pruebas
- Cálculo automático de premios según categorías
- Diseño responsive y moderno
- Interfaz intuitiva con tabs

## 🚀 Instalación y Uso

### Opción 1: Uso Básico (Sin servidor - Solo manual)

1. Abre `index.html` directamente en tu navegador
2. Ingresa los números manualmente o usa los enlaces a páginas oficiales
3. ⚠️ **Limitación**: No podrás usar la carga automática de Miloto y Colorloto

### Opción 2: Uso Completo (Con servidor - Scraping automático) ⭐ RECOMENDADO

#### Requisitos previos:
- [Node.js](https://nodejs.org/) (versión 14 o superior)

#### Pasos de instalación:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor:**
   ```bash
   npm start
   ```

3. **Abrir la aplicación:**
   - Abre tu navegador en: `http://localhost:3000`
   - O abre `index.html` directamente

4. **¡Listo!** Ahora puedes usar la carga automática para todos los juegos

## 📖 Cómo Usar

### Para Baloto:
1. Ingresa tus números en "Tus Números"
2. Haz clic en **"🌐 Cargar Últimos Resultados Oficiales"** (API oficial)
3. Los resultados y premios se cargarán automáticamente
4. Haz clic en "Validar Tiquete"

### Para Miloto:
1. Ingresa tus números en "Tus Números"
2. **Con servidor:** Haz clic en **"🤖 Cargar Automáticamente (Scraping)"**
3. **Sin servidor:** Haz clic en "🔗 Ver Resultados Oficiales" e ingresa manualmente
4. Haz clic en "Validar Tiquete"

### Para Colorloto:
1. Ingresa tus números y selecciona tu color en "Tus Números"
2. **Con servidor:** Haz clic en **"🤖 Cargar Automáticamente (Scraping)"**
3. **Sin servidor:** Haz clic en "🔗 Ver Resultados Oficiales" e ingresa manualmente
4. Haz clic en "Validar Tiquete"

## 📊 Premios

### Baloto / Baloto Revancha
- **5 números + Súper Balota**: ~$15,000,000,000 (Acumulado)
- **5 números**: $50,000,000
- **4 números + Súper Balota**: $5,000,000
- **4 números**: $200,000
- **3 números + Súper Balota**: $100,000
- **3 números**: $20,000
- **2 números + Súper Balota**: $10,000

### Miloto
- **5 números acertados**: $10,000,000
- **4 números acertados**: $1,000,000
- **3 números acertados**: $100,000
- **2 números acertados**: $10,000

### Colorloto
- **6 combinaciones exactas (color y número)**: $20,000,000,000
- **5 combinaciones exactas**: $5,000,000
- **4 combinaciones exactas**: $500,000
- **3 combinaciones exactas**: $50,000
- **2 combinaciones exactas**: $5,000

**Nota:** Una combinación es exacta cuando el color Y el número coinciden con el resultado.

## 📁 Estructura del Proyecto

```
ValidadorTiquetesBaloto/
├── index.html      # Estructura HTML principal
├── styles.css      # Estilos y diseño
├── app.js          # Lógica de validación y premios
└── README.md       # Documentación
```

## ⚠️ Nota Importante

Esta aplicación es solo para fines informativos y educativos. Los montos de los premios son aproximados. Para validar oficialmente tus tiquetes y conocer los resultados exactos, visita [baloto.com](https://baloto.com/).

## 🔄 Tecnología de Obtención de Resultados

### Baloto - API Oficial ✅
La aplicación está integrada con la **API oficial de Baloto** (https://github.com/esvanegas/Baloto-Colombia-API).

- ✅ Resultados en tiempo real
- ✅ Premios actualizados automáticamente
- ✅ Número de sorteo y fecha
- ✅ No requiere servidor adicional

### Miloto y Colorloto - Web Scraping 🤖

Implementado con **Axios + Cheerio** para extraer automáticamente los números desde:
- 🌐 https://www.resultadobaloto.com/miloto.php
- 🌐 https://www.resultadobaloto.com/colorloto.php

**Características del scraping:**
- ✅ Extracción automática de números
- ✅ Detección inteligente con múltiples selectores
- ✅ Extracción de fecha y número de sorteo
- ✅ Detección de color para Colorloto
- ✅ Manejo de errores robusto

**Nota:** Los selectores están optimizados para la estructura actual de las páginas. Si las páginas cambian su estructura HTML, puede ser necesario ajustar los selectores en `server.js`.

## 🛠️ Arquitectura Técnica

```
┌─────────────────┐
│  Frontend       │
│  (HTML/CSS/JS)  │
│  Puerto: 3000   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend        │
│  (Node.js +     │
│   Express)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────┐  ┌─────────┐
│ API │  │ Scraping│
│Baloto│ │Axios +  │
│     │  │Cheerio  │
└─────┘  └─────────┘
```

## 🔧 Troubleshooting

### El scraping no funciona:

1. **Verifica que el servidor esté ejecutándose:**
   ```bash
   npm start
   ```

2. **Revisa la consola del servidor** para ver errores

3. **Prueba los endpoints directamente:**
   - Miloto: http://localhost:3000/api/miloto
   - Colorloto: http://localhost:3000/api/colorloto

4. **Endpoint de debug** (ver HTML de la página):
   - http://localhost:3000/api/debug/miloto
   - http://localhost:3000/api/debug/colorloto

5. **Si la estructura HTML cambió:**
   - Abre `server.js`
   - Ajusta los selectores CSS en las funciones de scraping
   - Usa el endpoint de debug para inspeccionar el HTML

### Ajustar selectores:

En `server.js`, busca las secciones:
```javascript
// Para Miloto (línea ~47)
$('.resultado-numero, .numero, .ball, .miloto-numero').each(...)

// Para Colorloto (línea ~127)
$('.resultado-numero, .numero, .ball, .colorloto-numero').each(...)
```

Modifica los selectores según la estructura HTML actual de las páginas.

## 🛠️ Tecnologías

- HTML5
- CSS3 (Flexbox, Grid, Gradientes)
- JavaScript vanilla (ES6+)
- Diseño responsive

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge (versiones modernas)
- ✅ Dispositivos móviles y tablets
- ✅ Sin dependencias externas

## 📝 Licencia

Proyecto educativo de código abierto.
