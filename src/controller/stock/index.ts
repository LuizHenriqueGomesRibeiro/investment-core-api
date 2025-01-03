import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';
import { formatDate, unifyStocksData } from '../../util';

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

    getMultiplyStocks = async (req: Request, res: Response) => {
        const { start, end, reinvestDividend, monthyContribution } = req.query as unknown as GetStockValuesListQuery;
        let monthyContributionNumbered = Number(monthyContribution);

        const symbols = ['BBAS3', 'TAEE11', 'PETR4', 'VALE3'];
        const firstDate = new Date(start);
        const finalDate = new Date(end);

        const response = await Promise.all(
            symbols.map(async (symbol: any) => {
                const stockData: any = await yahooFinance.chart(symbol + '.SA', {
                    period1: firstDate.getTime() / 1000,
                    period2: finalDate.getTime() / 1000,
                    interval: '1mo',
                });

                let cumulativeContributionForSymbol: number = 0;
                let cumulativePosition: number = 0;

                const quotes = stockData.quotes.map((quote: any) => {
                    const currentQuote = (quote.open + quote.close) / 2;
                    const ordenedStocks = monthyContributionNumbered / (symbols.length * currentQuote);

                    cumulativeContributionForSymbol += monthyContributionNumbered;
                    cumulativePosition = cumulativePosition + ordenedStocks;
    
                    return {
                        patrimony: cumulativePosition * currentQuote,
                        monthyContribution: monthyContributionNumbered,
                        cumulativeContribution: cumulativeContributionForSymbol,
                        cumulativePosition: cumulativePosition,
                        ordenedStocks: ordenedStocks,
                        quote: currentQuote,
                        date: formatDate(quote.date, 'yyyy-mm-dd', true),
                    }
                });

                const dividends = stockData.events.dividends.map((dividend: any) => ({
                    amount: dividend.amount,
                    date: formatDate(dividend.date, 'yyyy-mm-dd')
                }));
        
                return {
                    stock: symbol,
                    quotes: quotes,
                    dividends: dividends,
                };
            })
        );

        const dividends = response
            .map((stock: any) => stock.dividends)
            .flat()
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            return res.json({
                quotes: unifyStocksData(response),
                dividends: dividends,
            });
    }

    getStockValuesList = async (req: Request, res: Response) => {
        const { symbol, start, end, reinvestDividend, monthyContribution } = req.query as unknown as GetStockValuesListQuery;
        const monthlyContributionNumbered = Number(monthyContribution);
    
        try {
            const stockData: any = await yahooFinance.chart(symbol + '.SA', {
                period1: new Date(start).getTime() / 1000,
                period2: new Date(end).getTime() / 1000,
                interval: '1mo',
            });
    
            const dividends = stockData.events.dividends.map((dividend: any) => ({
                amount: dividend.amount,
                date: formatDate(dividend.date, 'dd/mm/yyyy'),
            }));
    
            let carryOver = 0;
            let cumulativeStocksWithDividend = 0;
            let cumulativeStocksWithoutDividend = 0;
            let cumulativePayment = 0;
            let cumulativeContribution = 0;
    
            const startYear = new Date(start).getFullYear();
            let adjustedContribution = monthlyContributionNumbered; // Contribuição inicial
    
            const quotes = stockData.quotes.map((quote: any) => {
                let date: string = formatDate(quote.date, 'dd/mm/yyyy');

                let dividendPayment = dividends.reduce((sum: any, dividend: any) => {

                    const [dividendDay, dividendMonth, dividendYear] = dividend.date.split('/').map(Number);
                    const [day, month, year] = date.split('/').map(Number);
    
                    if (dividendMonth === month && dividendYear === year) {
                        return sum + dividend.amount;
                    }
    
                    return sum;
                }, 0);
    
                const averageQuote = (quote.open + quote.close) / 2;
    
                const rawStocksWithoutDividend = monthlyContributionNumbered / averageQuote + carryOver;
                const integerPartWithoutDividend = Math.floor(rawStocksWithoutDividend);
    
                const rawStocksWithDividend = adjustedContribution / averageQuote + carryOver;
                const integerPartWithDividend = Math.floor(rawStocksWithDividend);
    
                carryOver = rawStocksWithDividend - integerPartWithDividend;
                cumulativeStocksWithoutDividend += integerPartWithoutDividend;
                cumulativeStocksWithDividend += integerPartWithDividend;
    
                const contributionWithDividend = adjustedContribution;
                const contributionWithoutDividend = monthlyContributionNumbered;
    
                const currentPayment = dividendPayment * (reinvestDividend ? cumulativeStocksWithDividend : cumulativeStocksWithoutDividend);
                cumulativePayment += currentPayment;
                cumulativeContribution += contributionWithoutDividend;
    
                return reinvestDividend === 'true' ? {
                    quote: averageQuote,
                    date: date,
                    property: cumulativeStocksWithDividend * averageQuote,
                    contribution: contributionWithDividend,
                    cumulativeContribution: cumulativeContribution,
                    orderedStocks: integerPartWithDividend,
                    totalStocks: cumulativeStocksWithDividend,
                    payment: dividendPayment * cumulativeStocksWithDividend,
                    cumulativePayment: cumulativePayment,
                } : {
                    quote: averageQuote,
                    date: date,
                    property: cumulativeStocksWithoutDividend * averageQuote,
                    contribution: contributionWithoutDividend,
                    cumulativeContribution: cumulativeContribution,
                    orderedStocks: integerPartWithoutDividend,
                    totalStocks: cumulativeStocksWithoutDividend,
                    payment: dividendPayment * cumulativeStocksWithoutDividend,
                    cumulativePayment: cumulativePayment,
                };
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
                    payment: yearlyDividendPayments[year].payment,
                }));
            };
    
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
                    byYear: transformYearlyDividendPayments(yearlyDividendPayments),
                },
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    };
}