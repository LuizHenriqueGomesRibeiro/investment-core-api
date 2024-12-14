"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unifyStocksData = (data) => {
    const result = [];
    const dateMap = {};
    data.forEach((stockData) => {
        const stockName = stockData.stock;
        stockData.quotes.forEach((quote) => {
            const { date, monthyContribution, cumulativeContribution, cumulativePosition, cumulativePayment, quote: stockQuote, ordenedStocks, patrimony, payment, } = quote;
            if (!dateMap[date]) {
                dateMap[date] = {
                    date: date,
                    monthyContribution: monthyContribution,
                    cumulativeContribution: cumulativeContribution,
                    patrimony: 0,
                    cumulativePayment: 0,
                    payment: 0,
                    stocks: [],
                };
            }
            dateMap[date].stocks.push({
                name: stockName,
                quote: stockQuote,
                ordenedStocks,
                cumulativePosition,
                cumulativePayment,
                patrimony,
                payment,
            });
            dateMap[date].patrimony += patrimony;
            dateMap[date].payment += payment;
            dateMap[date].cumulativePayment += cumulativePayment;
        });
    });
    Object.values(dateMap)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(entry => result.push(entry));
    return result;
};
exports.default = unifyStocksData;
