import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';

interface GetPatrimonyReturnContributionQueryProps {
    patrimony: number,
    start: string,
    end: string,
    symbol: string
}

interface GetPatrimonyReturnSymbolQueryProps {
    patrimony: number,
    start: string,
    end: string,
    contribution: number,
}

export default class Patrimony {
    getPatrimonyReturnContribution = async (req: Request, res: Response) => {
        try {
            const { patrimony, start, end, symbol } = req.query as Partial<GetPatrimonyReturnContributionQueryProps>;

            const firstDate = new Date(start as string).getTime() / 1000;
            const finalDate = new Date(end as string).getTime() / 1000;

            const stockData: any = await yahooFinance.chart(symbol + '.SA', {
                period1: firstDate,
                period2: finalDate,
                interval: '1mo',
            });

            return res.json(stockData.quotes.map((quote: any) => {
                return { quote: quote.close, date: quote.date }
            }));

        } catch (error) {
            return res.json({
                message: 'error'
            })
        }
    }

    getPatrimonyReturnSymbol = async (req: Request, res: Response) => {
        try {
            const { patrimony, start, end, contribution } = req.query as Partial<GetPatrimonyReturnSymbolQueryProps>;

            const firstDate = new Date(start as string);
            const finalDate = new Date(end as string);



        } catch (error) {

        }
    }
}