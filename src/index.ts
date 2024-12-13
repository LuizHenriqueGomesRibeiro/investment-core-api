import express from 'express';
import cors from 'cors';
import { Stock } from './controller/index';

const app = express();

const stock: Stock = new Stock();

app.use(cors());
app.get('/stocks/list/', stock.getMultiplyStocks);

app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});