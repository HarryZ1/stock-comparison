import { useState } from 'react';
import axios from 'axios';

interface Pagination {
  limit: number;
  offset: number;
  count: number;
  total: number;
}

interface ApiStockItem {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adj_high: number;
  adj_low: number;
  adj_close: number;
  adj_open: number;
  adj_volume: number;
  split_factor: number;
  dividend: number;
  name: string | null;
  exchange_code: string | null;
  asset_type: string | null;
  price_currency: string | null;
  symbol: string;
  exchange: string;
  date: string;
}

// Raw Data from MarketStack API
interface ApiResponse {
  pagination: Pagination;
  data: ApiStockItem[];
}

// This is what our backend /api/market-stack will return
interface ProcessedApiResponse {
  market_data: ApiResponse;
  individual_stock_performance: Array<{date: string; portfolio_value: number}>;
  excluded_symbols: Array<string>;
}

function App() {
  const [data, setData] = useState<ProcessedApiResponse>();
  const [error, setError] = useState("");
  const [symbolInput, setSymbolInput] = useState("");
  const [symbolList, setSymbolList] = useState<string[]>([]);
  const [portfolioValInput, setPortfolioValInput] = useState("");
  const [portfolioVal, setPortfolioVal] = useState(0);
  const [dateFrom, setDateFrom] = useState("2024-04-15");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateTo, setDateTo] = useState("2025-04-15");
  const [dateToInput, setDateToInput] = useState("");

  const testFetchData = async () => {
    setError("");
    try {
      const response = await axios.get<ProcessedApiResponse>('/api/test-marketstack');
      setData(response?.data);
    } catch (err) {
      let newMessage = "An Unknown Error was Found!";

      if (err instanceof Error) {
        newMessage = err.message;
      }

      setError(newMessage);
      console.error('Caught Error', err);
    }
  };

  const fetchData = async () => {
    setError("");

    try {
      const params = new URLSearchParams();
      if (symbolList.length > 0) {
        params.append('symbols', symbolList.toString());
      } else {
        setError("Please add at least one stock symbol!");
        return;
      }

      if (portfolioVal > 0) {
        params.append('initial_investment', portfolioVal.toString())
      } else {
        setError("You have no money to invest!");
        return;
      }
      
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }

      if (dateTo) {
        params.append('date_to', dateTo);
      }

      const response = await axios.get<ProcessedApiResponse>(`/api/market-stack?${params.toString()}`);
      const responseData = response?.data;
      setData(responseData);
      if (responseData?.excluded_symbols?.length > 0) {
        const excludedSymbolsSet = new Set(responseData.excluded_symbols);
        const updatedSymbolsList = symbolList.filter(
          (symbol) => !excludedSymbolsSet.has(symbol)
        );

        setSymbolList(updatedSymbolsList);

        const excludedSymbolsList = responseData.excluded_symbols.join(", ");
        let notificationMessage = `The following symbols had insufficient data and were not included in the graph: ${excludedSymbolsList}. I've removed them from your stock list.`;

        if (responseData.market_data?.data.length > 0) {
          notificationMessage += " Data for other requested symbols should still be displayed.";
          setError(notificationMessage);
        } else {
          notificationMessage += " No other data could be retrieved for the graph.";
          setError(notificationMessage);
        }
      }
    } catch (err) {
      let newMessage = "An Unknown Error was Found!";

      if (err instanceof Error) {
        newMessage = err.message;
      }
      setData(undefined);
      setError(newMessage);
      console.log('Caught Error', err);
    }
  };

  interface StockProps {
    symbol: string;
    adj_close: number;
    dividend: number;
    date: string;
  }
  
  const Stock = (props: StockProps) => {
    return (
      <div>
        <h1> Symbol: {props.symbol} </h1>
        <h1> Adjusted Close Price: {props.adj_close} </h1>
        <h1> Dividend: {props.dividend} </h1>
        <h1> Date: {props.date} </h1>
      </div>
    );
  }

  const handleSaveStock = () => {
    if (!symbolInput) {
      setError("Please enter a stock symbol!");
      return;
    }

    if (symbolList.length >= 3) {
      setError("You can only select a max of 3 stocks!");
      setSymbolInput("");
      return;
    }

    setSymbolList(prevSymbolList => [...prevSymbolList, symbolInput]);
    setSymbolInput("");
    setError("");
  }

  const handleSavePortfolio = () => {
    const val = parseFloat(portfolioValInput);

    setPortfolioVal(isNaN(val) ? 0 : val);
    setPortfolioValInput("");

  }

  const handleSaveDateFrom = () => {
    const val = dateFromInput;

    setDateFrom(val);
    setDateFromInput("");
  }

const handleSaveDateTo = () => {
    const val = dateToInput;

    setDateTo(val);
    setDateToInput("");
  }

  return (
    <div>
      <h1>Stock Comparison App</h1>
      <p>
        <input type="text" value={symbolInput} placeholder="Enter a Stock Symbol" onChange={(event) => {
          setSymbolInput(event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase());
          }}/>
        <button onClick={handleSaveStock}> Enter </button>
        {`Your Stock Picks: ${symbolList.toString()}`}
      </p>

      <p>
        <input type="number" step="any" value={portfolioValInput} placeholder="Enter Initial Investment Amount" onChange={(event) => {
          setPortfolioValInput(event.target.value.replace(/[^0-9.]/g, ''));
        }}/>
        <button onClick={handleSavePortfolio}> Save </button>
        {`Your Portfolio Value: ${portfolioVal}`}
      </p>


        <h2>
          Choose Starting Investment Date
        </h2>
        <input type="date" value={dateFromInput} onChange={(event) => {
          setDateFromInput(event.target.value);
        }}/>
        <button onClick={handleSaveDateFrom}> Save </button>
        {`Date From: ${dateFrom}`}
 
        <h2>
          Choose Ending Investment Date
        </h2>
        <input type="date" value={dateToInput} onChange={(event) => {
          setDateToInput(event.target.value);
        }}/>
        <button onClick={handleSaveDateTo}> Save </button>
        {`Date To: ${dateTo}`}

      <p>
        <button onClick={testFetchData}>Test Marketstack API</button>
      </p>

      <p>
        <button onClick={fetchData}> Start </button>
      </p>

      {error && <p style={{ color: 'red' }}> Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 3)}</pre>}
      {data && data.market_data && data.market_data.data.length > 0 && (
        data.market_data.data?.map((stockItem: ApiStockItem) => (
          <Stock 
          key={stockItem.symbol + stockItem.date} //Adds a Unique Key
          symbol={stockItem.symbol}
          adj_close={stockItem.adj_close}
          date={stockItem.date}
          dividend={stockItem.dividend}
          />
        ))
      )}

      <h1> Your Profile </h1>
      <h2>
        {`Stock Picks: ${symbolList.toString()}`}
        <br/>
        {`Portfolio Value: ${portfolioVal}`}
        <br/>
        {`Date From: ${dateFrom}`}
        <br/>
        {`Date To: ${dateTo}`}
      </h2>
    </div>
  );
}
export default App;