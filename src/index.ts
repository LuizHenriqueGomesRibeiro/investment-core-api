import express from 'express';
import cors from 'cors';
import { Patrimony, Stock, Stocks } from './controller/index';

const app = express();

const stock: Stock = new Stock();
const patrimony: Patrimony = new Patrimony(); 
const stocks: Stocks = new Stocks();

app.use(cors());

app.get('/stocks/list/', stock.getMultiplyStocks);
app.get('/patrimony/contribution/', patrimony.getPatrimonyReturnContribution);
app.get('/patrimony/symbol/', patrimony.getPatrimonyReturnSymbol);
app.get('/stocks/', stocks.searchStocks);

app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});