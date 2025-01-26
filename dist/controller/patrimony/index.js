"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
class Patrimony {
    constructor() {
        this.getPatrimonyReturnContribution = async (req, res) => {
            try {
                const { patrimony, start, end, symbol } = req.query;
                const firstDate = new Date(start).getTime() / 1000;
                const finalDate = new Date(end).getTime() / 1000;
                const stockData = await yahoo_finance2_1.default.chart(symbol + '.SA', {
                    period1: firstDate,
                    period2: finalDate,
                    interval: '1mo',
                });
                return res.json(stockData.quotes.map((quote) => {
                    return { quote: quote.close, date: quote.date };
                }));
            }
            catch (error) {
                return res.json({
                    message: 'error'
                });
            }
        };
        this.getPatrimonyReturnSymbol = async (req, res) => {
            try {
                const { patrimony, start, end, contribution } = req.query;
                const firstDate = new Date(start);
                const finalDate = new Date(end);
            }
            catch (error) {
            }
        };
    }
}
exports.default = Patrimony;
