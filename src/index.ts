import express from 'express';
import cors from 'cors';
import { Stock } from './controller/index';

const app = express();

const stock: Stock = new Stock();

app.use(cors());
app.get('/stocks/list/', stock.getMultiplyStocks);
app.get('/stock/list/', stock.getStockValuesList);

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});