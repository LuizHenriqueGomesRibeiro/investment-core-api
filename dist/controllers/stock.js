"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
class Stock {
    constructor() {
        this.getStock = async (req, res) => {
            const { symbol } = req.params;
            try {
                const stockData = await yahoo_finance2_1.default.quote(symbol);
                const stockRating = stockData.averageAnalystRating
                    ? stockData.averageAnalystRating.split(' - ')[0]
                    : "Rating não disponível";
                ;
                res.json(Number(stockRating));
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
            }
        };
    }
}
exports.default = Stock;
