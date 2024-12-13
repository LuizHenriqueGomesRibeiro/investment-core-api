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
        this.getMultiplyStocks = async (req, res) => {
            const { start, end, reinvestDividend, monthyContribution, symbols } = req.query;
            let monthyContributionNumbered = Number(monthyContribution);
            const firstDate = new Date(start);
            const finalDate = new Date(end);
            const response = await Promise.all(symbols.map(async (symbol) => {
                const stockData = await yahoo_finance2_1.default.chart(symbol + '.SA', {
                    period1: firstDate.getTime() / 1000,
                    period2: finalDate.getTime() / 1000,
                    interval: '1mo',
                });
                let cumulativeContributionForSymbol = 0;
                let cumulativePosition = 0;
                let cumulativePayment = 0;
                let remainder = 0;
                const dividends = stockData.events.dividends.map((dividend) => ({
                    amount: dividend.amount,
                    date: (0, util_1.formatDate)(dividend.date, 'yyyy-mm-dd')
                }));
                const quotes = stockData.quotes.map((quote) => {
                    const matchingDividend = dividends.find((dividend) => {
                        const dividendDate = new Date(dividend.date);
                        const quoteDate = new Date(quote.date);
                        return (dividendDate.getFullYear() === quoteDate.getFullYear() &&
                            dividendDate.getMonth() === quoteDate.getMonth());
                    });
                    const payment = matchingDividend ? matchingDividend.amount * cumulativePosition : 0;
                    let adjustedContribution = reinvestDividend === 'true' ?
                        ((monthyContributionNumbered + payment / symbols.length) + remainder) :
                        ((monthyContributionNumbered / symbols.length) + remainder);
                    const currentQuote = (quote.open + quote.close) / 2;
                    const ordenedStocks = Math.floor(adjustedContribution / currentQuote);
                    const date = (0, util_1.formatDate)(quote.date, 'yyyy-mm-dd', true);
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
                    };
                });
                return {
                    stock: symbol,
                    quotes: quotes,
                    dividends: dividends,
                };
            }));
            const dividends = response
                .map((stock) => stock.dividends)
                .flat()
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            return res.json({
                quotes: (0, util_1.unifyStocksData)(response),
                dividends: dividends,
            });
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
                    date: (0, util_1.formatDate)(dividend.date, 'dd/mm/yyyy'),
                }));
                let carryOver = 0;
                let cumulativeStocksWithDividend = 0;
                let cumulativeStocksWithoutDividend = 0;
                let adjustedContribution = monthyContributionNumbered;
                let cumulativePayment = 0;
                let cumulativeContribution = 0;
                const quotes = stockData.quotes.map((quote) => {
                    let date = (0, util_1.formatDate)(quote.date, 'dd/mm/yyyy');
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
                    cumulativeContribution += contributionWithoutDividend;
                    return reinvestDividend === 'true' ? {
                        quote: averageQuote,
                        date: date,
                        property: cumulativeStocksWithDividend * averageQuote,
                        contribution: contributionWithDividend,
                        comulativeContribution: cumulativeContribution,
                        ordenedStocks: integerPartWithDividend,
                        totalStocks: cumulativeStocksWithDividend,
                        payment: dividendPayment * cumulativeStocksWithDividend,
                        cumulativePayment: cumulativePayment,
                    } : {
                        quote: averageQuote,
                        date: date,
                        property: cumulativeStocksWithoutDividend * averageQuote,
                        contribution: contributionWithoutDividend,
                        comulativeContribution: cumulativeContribution,
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
