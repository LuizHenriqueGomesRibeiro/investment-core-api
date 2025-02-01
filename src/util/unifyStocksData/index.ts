const unifyStocksData = (data: any) => {
    const result: any[] = [];
    const dateMap: any = {};

    data.forEach((stockData: any) => {
        const stockName = stockData.stock;
        const stockLongName = stockData.longName;
    
        stockData.quotes.forEach((quote: any) => {
            const { 
                date, 
                monthyContribution, 
                cumulativeContribution,
                cumulativePosition,
                cumulativePayment,
                quote: stockQuote, 
                ordenedStocks, 
                patrimony,
                payment,
                url,
            } = quote;
    
            if (!dateMap[date]) {
                dateMap[date] = { 
                    date: date, 
                    monthyContribution: monthyContribution, 
                    cumulativeContribution: cumulativeContribution,
                    cumulativePosition,
                    patrimony: 0,
                    cumulativePayment: 0,
                    payment: 0,
                    stocks: [],
                    url
                };
            }
    
            dateMap[date].stocks.push({
                name: stockName,
                longName: stockLongName,
                quote: stockQuote,
                ordenedStocks,
                cumulativePosition,
                cumulativePayment,
                patrimony,
                payment,
                date,
                url
            });
    
            dateMap[date].cumulativePosition += cumulativePosition;
            dateMap[date].patrimony += patrimony;
            dateMap[date].payment += payment;
            dateMap[date].cumulativePayment += cumulativePayment;
        });
    });
    
    Object.values(dateMap)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(entry => result.push(entry));
        
    return result;
}

export default unifyStocksData;