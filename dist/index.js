"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_1 = require("./controller/index");
const app = (0, express_1.default)();
const stock = new index_1.Stock();
app.use((0, cors_1.default)());
app.get('/stock/list/', stock.getStockValuesList);
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
