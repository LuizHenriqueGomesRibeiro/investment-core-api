import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';
import { formatDate, unifyStocksData } from '../../util';
import axios from "axios";
interface GetStockValuesListQuery {
    monthyContributionIncrementByYear: number,
    dateToStopReinvestment?: string,
    monthyContribution: number,
    reinvestDividend: string,
    symbols: string,
    start: string,
    end: string,
}

export default class Stock {
    getStock = async (req: Request, res: Response) => {
        const { symbol } = req.query;

        try {
            const stockData: any = await yahooFinance.quote(symbol + '.SA');

            return res.json({ 
                longName: stockData.longName,
                stockData: stockData,
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

        try {
            let monthyContributionNumbered = Number(monthyContribution);
            const symbolsArray = symbols.split(',');
            const firstDate = new Date(start);
            const finalDate = new Date(end);
            const stopDate = new Date(dateToStopReinvestment as string);
            
            const response = await Promise.all(
                symbolsArray.map(async (symbol: string) => {
                    const stockData: any = await yahooFinance.chart(symbol + '.SA', {
                        period1: firstDate.getTime() / 1000,
                        period2: finalDate.getTime() / 1000,
                        interval: '1mo',
                    });

                    const results = await axios.get(`https://brapi.dev/api/quote/${symbol}?token=qHmqTFRX2KjFHhAgyUUUBC`);
                    const url = results.data.results[0].logourl;

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
                            (stopingReinvest ? 
                                ((monthyContributionNumbered / symbolsArray.length) + remainder) :
                                (((monthyContributionNumbered + payment) / symbolsArray.length) + remainder)
                            ) : (
                                (monthyContributionNumbered / symbolsArray.length) + remainder
                            );
                        const currentQuote = quote.close;
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
                            stopingReinvest: stopingReinvest,
                            longName: stockData.meta.longName,
                            url
                        };
                    });
    
                    return {
                        longName: stockData.meta.longName,
                        dividends: dividends,
                        quotes: quotes,
                        stock: symbol,
                        url,
                    };
                })
            );

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
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
        }
    }
}