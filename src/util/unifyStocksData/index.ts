const unifyStocksData = (data: any) => {
    const result: any[] = [];

    for (let stockData of data) {
        for (let stockSymbol in stockData) {
            const stock = stockData[stockSymbol];

            stock.quotes.forEach((quote: any) => {
                let existingEntry = result.find(item => item.date === quote.date);

                if (existingEntry) {
                    existingEntry.quote[stockSymbol] = quote.quote;
                } else {
                    result.push({
                        date: quote.date,
                        quote: {
                            [stockSymbol]: quote.quote
                        }
                    });
                }
            });
        }
    }

    return result;
}

export default unifyStocksData;