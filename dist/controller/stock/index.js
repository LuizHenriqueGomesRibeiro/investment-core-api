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
            const { start, end, reinvestDividend, monthyContribution, symbols, monthyContributionIncrementByYear, dateToStopReinvestment } = req.query;
            try {
                let monthyContributionNumbered = Number(monthyContribution);
                const symbolsArray = symbols.split(',');
                const firstDate = new Date(start);
                const finalDate = new Date(end);
                const stopDate = new Date(dateToStopReinvestment);
                const response = await Promise.all(symbolsArray.map(async (symbol) => {
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
                        const quoteDate = new Date(quote.date);
                        const yearsSinceStart = quoteDate.getFullYear() - firstDate.getFullYear();
                        const stopingReinvest = quoteDate > stopDate || quoteDate === stopDate;
                        monthyContributionNumbered = monthyContribution * Math.pow(1 + (monthyContributionIncrementByYear / 100), yearsSinceStart);
                        const payment = matchingDividend ? matchingDividend.amount * cumulativePosition : 0;
                        let adjustedContribution = reinvestDividend === 'true' ?
                            (stopingReinvest ?
                                ((monthyContributionNumbered / symbolsArray.length) + remainder) :
                                (((monthyContributionNumbered + payment) / symbolsArray.length) + remainder)) : ((monthyContributionNumbered / symbolsArray.length) + remainder);
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
                            stopingReinvest: stopingReinvest
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
                const transformedResponse = (0, util_1.unifyStocksData)(response);
                const calculatePaymentByYear = (data) => {
                    const paymentsByYear = {};
                    data.forEach((entry) => {
                        const year = new Date(entry.date).getFullYear();
                        if (!paymentsByYear[year]) {
                            paymentsByYear[year] = 0;
                        }
                        paymentsByYear[year] += entry.payment;
                    });
                    return Object.entries(paymentsByYear).map(([year, payment]) => ({
                        year: parseInt(year, 10),
                        payment: parseFloat(payment.toFixed(2)),
                        byMonth: parseFloat(payment.toFixed(2)) / 12,
                    }));
                };
                return res.json({
                    quotes: transformedResponse,
                    payments: calculatePaymentByYear(transformedResponse),
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
            }
        };
    }
}
exports.default = Stock;
