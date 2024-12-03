var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import yahooFinance from 'yahoo-finance2';
export default class Stock {
    constructor() {
        this.getStock = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { symbol } = req.params;
            try {
                const stockData = yield yahooFinance.quote(symbol);
                const stockRating = stockData.averageAnalystRating
                    ? stockData.averageAnalystRating.split(' - ')[0]
                    : "Rating não disponível";
                ;
                res.json(Number(stockRating));
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao buscar dados da ação.' });
            }
        });
    }
}
