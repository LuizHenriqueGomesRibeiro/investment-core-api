export interface GetPatrimonyReturnContributionQueryProps {
    patrimony: number,
    start: string,
    end: string,
    symbol: string,
    reinvestDividends: boolean,
}

export interface GetPatrimonyReturnSymbolQueryProps {
    patrimony: number,
    start: string,
    end: string,
    contribution: number,
}