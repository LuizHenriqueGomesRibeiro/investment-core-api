import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';
import { formatDate } from '../../util';

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
        const { symbol } = req.query;

        const monthyContribution = 1000;

        try {
            const stockData: any = await yahooFinance.chart(symbol + '.SA', {
                period1: new Date('2023-01-01').getTime() / 1000,
                period2: new Date('2024-11-01').getTime() / 1000,
                interval: '1mo',
            });

            let carryOver = 0;

            return res.json({ 
                quotes: stockData.quotes.map((quote: any) => {
                    const averageQuote = (quote.open + quote.close) / 2;
                    const rawStocks = (monthyContribution / averageQuote) + carryOver;
                    const integerPart = Math.floor(rawStocks);
                    carryOver = rawStocks - integerPart;
                    return {
                        quote: averageQuote,
                        date: formatDate(quote.date),
                        withoutDividendOrdenedStocks: integerPart,
                    };
                }), 
                dividends: stockData.events.dividends.map((dividend: any) => ({
                    amount: dividend.amount,
                    date: formatDate(dividend.date),
                })), 
                totalStocks: stockData.quotes.reduce((total: number, quote: any) => {
                    const averageQuote = (quote.open + quote.close) / 2;
                    const rawStocks = (monthyContribution / averageQuote) + carryOver;
                    const integerPart = Math.floor(rawStocks);
                    carryOver = rawStocks - integerPart;
                    return total + integerPart;
                }, 0)
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    }
}