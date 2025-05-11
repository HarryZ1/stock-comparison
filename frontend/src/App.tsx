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

interface ApiResponse {
  pagination: Pagination;
  data: ApiStockItem[];
}

function App() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [userInput, setUserInput] = useState("");
  const [showUserInput, setShowUserInput] = useState(false);

  const testFetchData = async () => {
    setError("");
    setData(null);
    try {
      const response = await axios.get<ApiResponse>('/api/test-marketstack');
      setData(response.data);
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
    if (!userInput.trim()) {
      setError("Please enter a stock symbol!");
      return;
    }
    setError("");
    setData(null);

    try {
      const response = await axios.get<ApiResponse>(`/api/market-stack?symbols=${userInput.toUpperCase()}`);
      setShowUserInput(true);
      setData(response.data);
    } catch (err) {
      let newMessage = "An Unknow Error was Found!";

      if (err instanceof Error) {
        newMessage = err.message;
      }

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

  return (
    <div>
      <h1>Stock Comparison App</h1>
      <input type="text" value={userInput} onChange={(event) => {
        setUserInput(event.target.value.replace(/[^a-zA-Z]/g, ''))
        }}/>
      <button onClick={fetchData}> Enter </button>
      {showUserInput && userInput}

      <button onClick={testFetchData}>Test Marketstack API</button>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 3)}</pre>}
      {data && data.data && data.data.length > 0 && (
        data.data.map((stockItem: ApiStockItem) => (
          <Stock 
          key={stockItem.symbol + stockItem.date} //Adds a Unique Key
          symbol={stockItem.symbol}
          adj_close={stockItem.adj_close}
          date={stockItem.date}
          dividend={stockItem.dividend}
          />
        ))
      )}

    </div>
  );
}
export default App;