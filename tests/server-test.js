const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint de prueba para Miloto
app.get('/api/miloto', async (req, res) => {
    console.log('🔍 Solicitud recibida para /api/miloto');
    try {
        console.log('📡 Haciendo request...');
        const response = await axios.get('https://www.resultadobaloto.com/miloto.php', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log('✅ Response recibido');
        const $ = cheerio.load(response.data);
        console.log('✅ Cheerio cargado');
        
        const numbers = [];
        const firstPanel = $('#listaResultados .panel').first();
        
        firstPanel.find('.label-baloto').each((i, elem) => {
            if (numbers.length < 5) {
                const num = parseInt($(elem).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 39) {
                    numbers.push(num);
                }
            }
        });
        
        console.log(`📊 Números extraídos: ${numbers.length}`);
        console.log(`Números: ${JSON.stringify(numbers)}`);
        
        res.json({
            success: true,
            numbers: numbers
        });
        
        console.log('✅ Respuesta enviada');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor test en http://localhost:${PORT}`);
});
