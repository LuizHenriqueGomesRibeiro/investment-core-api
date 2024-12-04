"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
const util_1 = require("../../util");
class Stock {
    constructor() {
        this.getStock = async (req, res) => {
            const { symbol } = req.query;
            try {
                const stockData = await yahoo_finance2_1.default.quote(symbol + '.SA');
                return res.json({
                    stock: stockData,
                    averageAnalystRating: Number(stockData.averageAnalystRating.split(' - ')[0]),
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
            }
        };
        this.getStockValuesList = async (req, res) => {
            const { symbol, start, end, reinvestDividend, monthyContribution } = req.query;
            const monthyContributionNumbered = Number(monthyContribution);
            try {
                const stockData = await yahoo_finance2_1.default.chart(symbol + '.SA', {
                    period1: new Date(start).getTime() / 1000,
                    period2: new Date(end).getTime() / 1000,
                    interval: '1mo',
                });
                const dividends = stockData.events.dividends.map((dividend) => ({
                    amount: dividend.amount,
                    date: (0, util_1.formatDate)(dividend.date),
                }));
                let carryOver = 0;
                let cumulativeStocksWithDividend = 0;
                let cumulativeStocksWithoutDividend = 0;
                let adjustedContribution = monthyContributionNumbered;
                let cumulativePayment = 0;
                const quotes = stockData.quotes.map((quote) => {
                    let date = (0, util_1.formatDate)(quote.date);
                    let dividendPayment = dividends.reduce((sum, dividend) => {
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
                    };
                });
                const getYear = (date) => date.split('/')[2];
                const yearlyDividendPayments = quotes.reduce((acc, quote) => {
                    const year = getYear(quote.date);
                    if (!acc[year]) {
                        acc[year] = {
                            payment: 0,
                        };
                    }
                    acc[year].payment += quote.payment;
                    return acc;
                }, {});
                const transformYearlyDividendPayments = (yearlyDividendPayments) => {
                    return Object.keys(yearlyDividendPayments).map(year => ({
                        year: year,
                        payment: yearlyDividendPayments[year].payment
                    }));
                };
                const totalPayment = quotes.reduce((sum, quote) => sum + quote.payment, 0);
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
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
            }
        };
    }
}
exports.default = Stock;
