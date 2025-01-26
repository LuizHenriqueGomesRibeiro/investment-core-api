import axios from "axios";
import { Request, Response } from "express";
import yahooFinance from "yahoo-finance2";

const key = '0DSIL5GRZWTAXV2Z';

export default class Stocks {

    searchStocks = async (req: Request, res: Response) => {
        try {
            const query = req.query;

            const response = await axios.get('https://api.b3.com.br/data-api/v1/stock/actors');
            console.log(response);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error', details: error });
        }
    }
}