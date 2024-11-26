const express = require('express');
const yahooFinance = require('yahoo-finance2').default;

const app = express();

app.get('/stock/:symbol', async (req, res) => {
    const { symbol } = req.params;

    return res.end(symbol);
});

app.listen(3000);