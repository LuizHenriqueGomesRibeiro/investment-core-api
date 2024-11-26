const express = require('express');
const yahooFinance = require('yahoo-finance2').default;

const app = express();

app.get('/stock/:symbol', async (req, res) => {
    const { symbol } = req.params;

    try {
        const stockData = await yahooFinance.quote(symbol);
        const stockRating = stockData.averageAnalystRating
            ? stockData.averageAnalystRating.split(' - ')[0]
            : 'Rating não disponível';

        res.json({ symbol, rating: stockRating });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
    }
});

app.listen(3000);