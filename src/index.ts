import express from 'express';
import { Stock } from './controller/index';

const app = express();

const stock: Stock = new Stock();

app.get('/stock/', stock.getStock);
app.get('/stock/list/', stock.getStockValuesList);

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});