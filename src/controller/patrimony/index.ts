import { GetPatrimonyReturnContributionQueryProps, GetPatrimonyReturnSymbolQueryProps } from './types';
import { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';
import { formatDate } from '../../util';

export default class Patrimony {
    getPatrimonyReturnContribution = async (req: Request, res: Response) => {
        try {
            const { patrimony = 0, start, end, symbol, reinvestDividends = false } = req.query as Partial<GetPatrimonyReturnContributionQueryProps>;

            const firstDate = new Date(start as string).getTime() / 1000;
            const finalDate = new Date(end as string).getTime() / 1000;

            const stockData: any = await yahooFinance.chart(symbol + '.SA', {
                period1: firstDate,
                period2: finalDate,
                interval: '1mo',
            });

            const dividends = stockData.events.dividends.map((dividend: any) => dividend.amount);

            const calculateContribution = (
                patrimonyPoint: number,
                stockData: { quotes: { close: number }[] },
            ) => {
                const months = stockData.quotes.length;
            
                for (let contribution = 1; contribution < patrimonyPoint; contribution++) {
                    let buildablePatrimony = 0;
                    let position = 0; // Total de ações acumuladas
                    let leftoverContribution = 0; // Contribuição não utilizada
                    let cumulativePayment = 0; // Total de pagamentos de dividendos acumulados
                    let cumulativeContribution = 0;
                    for (let i = 0; i < months; i++) {
                        const quoteCost = stockData.quotes[i].close;
                        const dividendsPayment = dividends[i] ?? 0; // Dividendos por ação
                        const payment = dividendsPayment * position; // Pagamento total de dividendos no mês
                        cumulativePayment += payment;
            
                        const totalContribution = contribution + leftoverContribution;
                        cumulativeContribution += totalContribution;
                        const sharesToBuy = Math.floor(totalContribution / quoteCost);
                        const usedContribution = sharesToBuy * quoteCost;
            
                        leftoverContribution = totalContribution - usedContribution;
            
                        position += sharesToBuy;
                        buildablePatrimony = position * quoteCost;
                        
                        if (buildablePatrimony >= patrimonyPoint) {
                            return {
                                contribution,
                                position,
                                patrimony: buildablePatrimony,
                                payments: cumulativePayment,
                                cumulativeContribution
                            };
                        }
                    }
                }
            
                return 0; // Caso a meta não seja alcançada
            };
            

            return res.json(calculateContribution(patrimony, stockData));
        } catch (error) {
            return res.json({
                message: 'error'
            });
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