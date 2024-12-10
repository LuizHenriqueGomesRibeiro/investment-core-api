const unifyStocksData = (data: any) => {
    const result: any[] = [];

    for (let stockData of data) {
        const stock = stockData.stock;
        stockData.quotes.forEach((quote: any) => {
            let existingEntry = result.find(item => item.date === quote.date);
            if (existingEntry) {
                existingEntry.quote[stock] = quote.quote;
            } else {
                result.push({
                    date: quote.date,
                    quote: {
                        [stock]: quote.quote
                    }
                });
            }
        });
    }
    
    return result;
}

export default unifyStocksData;