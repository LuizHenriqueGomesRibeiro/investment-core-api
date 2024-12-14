import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';
import { formatDate, unifyStocksData } from '../../util';

interface GetStockValuesListQuery {
    symbols: string,
    start: string,
    end: string,
    reinvestDividend: string,
    monthyContribution: number,
    monthyContributionIncrementByYear: number,
    dateToStopReinvestment: string,
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
        const { 
            start, 
            end, 
            reinvestDividend, 
            monthyContribution, 
            symbols,
            monthyContributionIncrementByYear,
            dateToStopReinvestment
        } = req.query as unknown as GetStockValuesListQuery;

        let monthyContributionNumbered = Number(monthyContribution);
        const symbolsArray = symbols.split(',');
        const firstDate = new Date(start);
        const finalDate = new Date(end);
        const stopDate = new Date(dateToStopReinvestment);
        
        const response = await Promise.all(
            symbolsArray.map(async (symbol: string) => {
                const stockData: any = await yahooFinance.chart(symbol + '.SA', {
                    period1: firstDate.getTime() / 1000,
                    period2: finalDate.getTime() / 1000,
                    interval: '1mo',
                });

                let cumulativeContributionForSymbol: number = 0;
                let cumulativePosition: number = 0;
                let cumulativePayment: number = 0;
                let remainder: number = 0;

                const dividends = stockData.events.dividends.map((dividend: any) => ({
                    amount: dividend.amount,
                    date: formatDate(dividend.date, 'yyyy-mm-dd')
                }));

                const quotes = stockData.quotes.map((quote: any) => {
                    const matchingDividend = dividends.find((dividend: any) => {
                        const dividendDate = new Date(dividend.date);
                        const quoteDate = new Date(quote.date);
                        
                        return (
                            dividendDate.getFullYear() === quoteDate.getFullYear() &&
                            dividendDate.getMonth() === quoteDate.getMonth()
                        );
                    });

                    const quoteDate = new Date(quote.date);
                    const yearsSinceStart = quoteDate.getFullYear() - firstDate.getFullYear();
                    const stopingReinvest = quoteDate > stopDate || quoteDate === stopDate;

                    monthyContributionNumbered = monthyContribution * Math.pow(1 + (monthyContributionIncrementByYear / 100), yearsSinceStart);

                    const payment = matchingDividend ? matchingDividend.amount * cumulativePosition : 0;
                    let adjustedContribution = reinvestDividend === 'true' ? 
                        (((monthyContributionNumbered + payment) / symbolsArray.length) + remainder) : 
                        ((monthyContributionNumbered / symbolsArray.length) + remainder);
                    const currentQuote = (quote.open + quote.close) / 2;
                    const ordenedStocks = Math.floor(adjustedContribution / currentQuote);
                    const date = formatDate(quote.date, 'yyyy-mm-dd', true);

                    remainder = adjustedContribution - ordenedStocks * currentQuote;
                    cumulativeContributionForSymbol += monthyContributionNumbered;
                    cumulativePosition += ordenedStocks;
                    cumulativePayment += payment;

                    return {
                        patrimony: cumulativePosition * currentQuote,
                        monthyContribution: monthyContributionNumbered,
                        cumulativeContribution: cumulativeContributionForSymbol,
                        cumulativePosition: cumulativePosition,
                        ordenedStocks: ordenedStocks,
                        cumulativePayment: cumulativePayment,
                        quote: currentQuote,
                        date: date,
                        payment: payment,
                        stopingReinvest: stopingReinvest
                    };
                });

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
    
        const transformedResponse = unifyStocksData(response);

        const calculatePaymentByYear = (data: any) => {
            const paymentsByYear: any = {};

            data.forEach((entry: any) => {
                const year = new Date(entry.date).getFullYear();

                if (!paymentsByYear[year]) {
                    paymentsByYear[year] = 0;
                }

                paymentsByYear[year] += entry.payment;
            });

            return Object.entries(paymentsByYear).map(([year, payment]: any) => ({
                year: parseInt(year, 10),
                payment: parseFloat(payment.toFixed(2)),
            }));
        }

        return res.json({
            quotes: transformedResponse,
            payments: calculatePaymentByYear(transformedResponse),
        });
    }
}