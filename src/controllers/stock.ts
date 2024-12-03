import yahooFinance from 'yahoo-finance2';

export default class Stock {
    getStock = async (req: any, res: any) => {
        const { symbol } = req.params;
        try {
            const stockData: any = await yahooFinance.quote(symbol);
            const stockRating = stockData.averageAnalystRating
                ? stockData.averageAnalystRating.split(' - ')[0]
                : "Rating não disponível";;
            res.json(Number(stockRating));
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    }
}