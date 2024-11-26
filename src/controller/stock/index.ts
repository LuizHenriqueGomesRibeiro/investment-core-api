import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';

export default class Stock {
    getStock = async (req: Request, res: Response) => {
        const { symbol } = req.query;

        try {
            const stockData = await yahooFinance.quote(symbol + '.SA');
            const stockRating = stockData.averageAnalystRating
                ? stockData.averageAnalystRating.split(' - ')[0]
                : 'Rating não disponível';

            return res.json({ symbol, rating: stockRating });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    }

    getStockValuesList = async (req: Request, res: Response) => {
        const { symbol } = req.query;

        try {
            const stockData = await yahooFinance.recommendation(symbol + '.SA', {
                period1: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                period2: new Date(),
                interval: '1mo',
            });

            return res.json({ stockData });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    }
}