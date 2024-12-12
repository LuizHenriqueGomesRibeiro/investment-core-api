const unifyStocksData = (data: any) => {
    const result: any[] = [];
    const dateMap: any = {};

    data.forEach((stockData: any) => {
        const stockName = stockData.stock;

        stockData.quotes.forEach((quote: any) => {
            const { 
                date, 
                monthyContribution, 
                cumulativeContribution,
                cumulativePosition,
                quote: stockQuote, 
                ordenedStocks, 
                patrimony
            } = quote;

            if (!dateMap[date]) {
                dateMap[date] = { 
                    date: date, 
                    monthyContribution: monthyContribution, 
                    cumulativeContribution: cumulativeContribution,
                    totalPatrimony: 0,
                    stocks: [],
                };
            }

            dateMap[date].stocks.push({
                name: stockName,
                quote: stockQuote,
                ordenedStocks,
                cumulativePosition,
                patrimony
            });
        });
    });

    Object.values(dateMap)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(entry => result.push(entry));

    return result;
}

export default unifyStocksData;