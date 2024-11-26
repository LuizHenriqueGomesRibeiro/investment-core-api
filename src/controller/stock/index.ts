import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';
import { formatDate } from '../../util';

interface GetStockValuesListQuery {
    symbol: string,
    start: string,
    end: string,
}

export default class Stock {
    getStock = async (req: Request, res: Response) => {
        const { symbol } = req.query;

        try {
            const stockData: any = await yahooFinance.quote(symbol + '.SA');

            return res.json({ 
                stock: stockData, 
                averageAnalystRating: Number(stockData.averageAnalystRating.split(' - ')[0]),
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    }

    getStockValuesList = async (req: Request, res: Response) => {
        const { symbol, start, end } = req.query as unknown as GetStockValuesListQuery;

        const monthyContribution = 1000;

        try {
            const stockData: any = await yahooFinance.chart(symbol + '.SA', {
                period1: new Date(start).getTime() / 1000,
                period2: new Date(end).getTime() / 1000,
                interval: '1mo',
            });

            let carryOver = 0;
            let cumulativeStocks = 0;

            const quotes = stockData.quotes.map((quote: any) => {
                const averageQuote = (quote.open + quote.close) / 2;
                const rawStocks = (monthyContribution / averageQuote) + carryOver;
                const integerPart = Math.floor(rawStocks);

                carryOver = rawStocks - integerPart;
                cumulativeStocks += integerPart;

                return {
                    quote: averageQuote,
                    date: formatDate(quote.date),
                    withoutDividendOrdenedStocks: integerPart,
                    totalStocks: cumulativeStocks,
                };
            });

            return res.json({ 
                quotes: quotes,
                dividends: stockData.events.dividends.map((dividend: any) => ({
                    amount: dividend.amount,
                    date: formatDate(dividend.date),
                })),
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    }
}