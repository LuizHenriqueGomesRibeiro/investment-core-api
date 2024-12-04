import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';
import { formatDate } from '../../util';

interface GetStockValuesListQuery {
    symbol: string,
    start: string,
    end: string,
    reinvestDividend: string,
    monthyContribution: number,
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
        const { symbol, start, end, reinvestDividend, monthyContribution } = req.query as unknown as GetStockValuesListQuery;
        const monthyContributionNumbered = Number(monthyContribution);

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
            let adjustedContribution = monthyContributionNumbered;
            let cumulativePayment = 0; 

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

                const rawStocksWithoutDividend = monthyContributionNumbered / averageQuote + carryOver;
                const integerPartWithoutDividend = Math.floor(rawStocksWithoutDividend);

                const rawStocksWithDividend = adjustedContribution / averageQuote + carryOver;
                const integerPartWithDividend = Math.floor(rawStocksWithDividend);

                carryOver = rawStocksWithDividend - integerPartWithDividend;
                cumulativeStocksWithoutDividend += integerPartWithoutDividend;
                cumulativeStocksWithDividend += integerPartWithDividend;

                const contributionWithDividend = adjustedContribution;
                const contributionWithoutDividend = monthyContributionNumbered;
                adjustedContribution = monthyContributionNumbered + dividendPayment * cumulativeStocksWithDividend;

                const currentPayment = dividendPayment * (reinvestDividend ? cumulativeStocksWithDividend : cumulativeStocksWithoutDividend);
                cumulativePayment += currentPayment;

                return reinvestDividend ? {
                    quote: averageQuote,
                    date: date,
                    property: cumulativeStocksWithDividend * averageQuote,
                    contribution: contributionWithDividend,
                    ordenedStocks: integerPartWithDividend,
                    totalStocks: cumulativeStocksWithDividend,
                    payment: dividendPayment * cumulativeStocksWithDividend,
                    cumulativePayment: cumulativePayment,
                } : {
                    quote: averageQuote,
                    date: date,
                    property: cumulativeStocksWithoutDividend * averageQuote,
                    contribution: contributionWithoutDividend,
                    ordenedStocks: integerPartWithoutDividend,
                    totalStocks: cumulativeStocksWithoutDividend,
                    payment: dividendPayment * cumulativeStocksWithoutDividend,
                    cumulativePayment: cumulativePayment,
                }
            });

            const getYear = (date: string) => date.split('/')[2];

            const yearlyDividendPayments = quotes.reduce((acc: any, quote: any) => {
                const year = getYear(quote.date);

                if (!acc[year]) {
                    acc[year] = {
                        payment: 0,
                    };
                }

                acc[year].payment += quote.payment;

                return acc;
            }, {});

            const transformYearlyDividendPayments = (yearlyDividendPayments: { [key: string]: { payment: number } }): { year: string, payment: number }[] => {
                return Object.keys(yearlyDividendPayments).map(year => ({
                    year: year,
                    payment: yearlyDividendPayments[year].payment
                }));
            }

            const totalPayment = quotes.reduce(
                (sum: number, quote: any) => sum + quote.payment,
                0
            );

            return res.json({ 
                quotes: quotes,
                dividends: dividends,
                results: {
                    totalPayment: {
                        payment: totalPayment,
                    },
                    byYear: transformYearlyDividendPayments(yearlyDividendPayments)
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    }
}