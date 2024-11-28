import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';
import { formatDate } from '../../util';

interface GetStockValuesListQuery {
    symbol: string,
    start: string,
    end: string,
    reinvestDividend: boolean,
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
        const { symbol, start, end, reinvestDividend } = req.query as unknown as GetStockValuesListQuery;

        const monthyContribution = 1000;

        try {
            const stockData: any = await yahooFinance.chart(symbol + '.SA', {
                period1: new Date(start).getTime() / 1000,
                period2: new Date(end).getTime() / 1000,
                interval: '1mo',
            });

            const dividends = stockData.events.dividends.map((dividend: any) => ({
                amount: dividend.amount,
                date: formatDate(dividend.date),
            }));
            
            let carryOver = 0;
            let cumulativeStocksWithDividend = 0;
            let cumulativeStocksWithoutDividend = 0;
            let adjustedContribution = monthyContribution;

            const quotes = stockData.quotes.map((quote: any) => {
                let date = formatDate(quote.date);

                let dividendPayment = dividends.reduce((sum: any, dividend: any) => {
                    const [dividendDay, dividendMonth, dividendYear] = dividend.date.split('/').map(Number);
                    const [day, month, year] = date.split('/').map(Number);

                    if (dividendMonth === month && dividendYear === year) {
                        return sum + dividend.amount;
                    }

                    return sum;
                }, 0);

                const averageQuote = (quote.open + quote.close) / 2;

                const rawStocksWithoutDividend = monthyContribution / averageQuote + carryOver;
                const integerPartWithoutDividend = Math.floor(rawStocksWithoutDividend);

                const rawStocksWithDividend = adjustedContribution / averageQuote + carryOver;
                const integerPartWithDividend = Math.floor(rawStocksWithDividend);

                carryOver = rawStocksWithDividend - integerPartWithDividend;
                cumulativeStocksWithoutDividend += integerPartWithoutDividend;
                cumulativeStocksWithDividend += integerPartWithDividend;

                const contributionWithDividend = adjustedContribution;
                const contributionWithoutDividend = monthyContribution;
                adjustedContribution = monthyContribution + dividendPayment * cumulativeStocksWithDividend;

                return {
                    quote: averageQuote,
                    date: date,
                    withDividendProperty: cumulativeStocksWithDividend * averageQuote,
                    withDividendContribution: contributionWithDividend,
                    withDividendOrdenedStocks: integerPartWithDividend,
                    withDividendTotalStocks: cumulativeStocksWithDividend,
                    withDividendPayment: dividendPayment * cumulativeStocksWithDividend,
                    withoutDividendProperty: cumulativeStocksWithoutDividend * averageQuote,
                    withoutDividendContribution: contributionWithoutDividend,
                    withoutDividendOrdenedStocks: integerPartWithoutDividend,
                    withoutDividendTotalStocks: cumulativeStocksWithoutDividend,
                    withoutDividendPayment: dividendPayment * cumulativeStocksWithoutDividend,
                };
            });

            const getYear = (date: string) => date.split('/')[2];

            const yearlyDividendPayments = quotes.reduce((acc: any, quote: any) => {
                const year = getYear(quote.date);

                if (!acc[year]) {
                    acc[year] = {
                        withDividendPayment: 0,
                        withoutDividendPayment: 0,
                    };
                }

                acc[year].withDividendPayment += quote.withDividendPayment;
                acc[year].withoutDividendPayment += quote.withoutDividendPayment;

                return acc;
            }, {});

            const totalWithDividendPayment = quotes.reduce(
                (sum: number, quote: any) => sum + quote.withDividendPayment,
                0
            );

            const totalWithoutDividendPayment = quotes.reduce(
                (sum: number, quote: any) => sum + quote.withoutDividendPayment,
                0
            );

            return res.json({ 
                quotes: quotes,
                dividends: dividends,
                results: {
                    totalPayment: {
                        withDividendPayment: totalWithDividendPayment,
                        withoutDividendPayment: totalWithoutDividendPayment,
                    },
                    byYear: {
                        ...yearlyDividendPayments,
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    }
}