import { useState } from 'react';
import axios from 'axios';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData
} from 'chart.js';
import StockChart from './StockChart';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

interface StockPerformanceEntry {
  date: string;
  portfolio_value: number;
}

interface IndividualStockPerformance{
  [symbol : string] : StockPerformanceEntry[];
}

// This is what our backend /api/market-stack will return
interface ProcessedApiResponse {
  market_data: ApiResponse;
  individual_stock_performance: IndividualStockPerformance;
  excluded_symbols: string[];
}

const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
}

function App() {
  const today = new Date();
  const todayString = formatDateToYYYYMMDD(today);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const minAllowedStartDateString = formatDateToYYYYMMDD(oneYearAgo);

  const [data, setData] = useState<ProcessedApiResponse>();
  const [error, setError] = useState("");
  const [symbolInput, setSymbolInput] = useState("");
  const [symbolList, setSymbolList] = useState<string[]>([]);
  const [portfolioValInput, setPortfolioValInput] = useState("");
  const [portfolioVal, setPortfolioVal] = useState(0);
  const [dateFrom, setDateFrom] = useState(minAllowedStartDateString);
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateTo, setDateTo] = useState(todayString);
  const [dateToInput, setDateToInput] = useState("");
  const [chartData, setChartData] = useState<ChartData<'line'>>({ labels: [], datasets: [] });
  const [isLoading, setIsLoading] = useState(false); // For loading indicator

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
    setIsLoading(true);
    setChartData({ labels: [], datasets: [] });

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
      const responseData = response?.data as ProcessedApiResponse;
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

      if (responseData?.individual_stock_performance && Object.keys(responseData.individual_stock_performance).length > 0) {
        const performanceData = responseData.individual_stock_performance;
        const symbolsWithData = Object.keys(performanceData).filter(symbol => performanceData[symbol]?.length > 0);

        if (symbolsWithData.length > 0) {
          // Get all unique dates from all series and sort them
          const allDates = new Set<string>();
          symbolsWithData.forEach(symbol => {
            performanceData[symbol].forEach(dataPoint => allDates.add(dataPoint.date));
          });
          const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

          const datasets = symbolsWithData.map((symbol, index) => {
            const stockDataPoints = performanceData[symbol];
            const valueMap = new Map(stockDataPoints.map(dp => [dp.date, dp.portfolio_value]));

            // Define an array of distinct colors
            const lineColors = [
              'rgb(255, 99, 132)', // Red
              'rgb(54, 162, 235)', // Blue
              'rgb(75, 192, 192)', // Green
              'rgb(153, 102, 255)',// Purple
              'rgb(255, 159, 64)'  // Orange
            ];

            return {
              label: symbol,
              data: sortedDates.map(date => valueMap.get(date) ?? null), // Use null for missing data points
              borderColor: lineColors[index % lineColors.length],
              backgroundColor: lineColors[index % lineColors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'), // For legend point style
              fill: false,
              tension: 0.1, // Makes lines slightly curved
            };
          });

          setChartData({
            labels: sortedDates,
            datasets: datasets,
          });
        } else {
          setChartData({ labels: [], datasets: [] }); // No valid performance data
        }
      } else {
        setChartData({ labels: [], datasets: [] }); // No performance data block
      }
    } catch (err) {
      let newMessage = "An Unknown Error was Found!";

      if (err instanceof Error) {
        newMessage = err.message;
      }
      setData(undefined);
      setError(newMessage);
      console.log('Caught Error', err);
    } finally {
      setIsLoading(false);
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
    if (dateFromInput) {
      if (new Date(dateFromInput) > new Date(dateTo)) {
        setError("Start date cannot be after the current end date. Please adjust the end date or choose an earlier start date.");
        return;
      }
      if (dateFromInput < minAllowedStartDateString) {
        setError(`Start date cannot be earlier than ${minAllowedStartDateString}.`);
        setDateFromInput(minAllowedStartDateString);
        return;
      }
      setDateFrom(dateFromInput);
      setError("");
    } else {
      setError("Please select a valid start date.");
    }
  }

const handleSaveDateTo = () => {
    if (dateToInput) {
      if (new Date(dateToInput) < new Date(dateFrom)) {
        setError("End date cannot be before the current start date. Please adjust the start date or choose a later end date.");
        return;
      }
      if (dateToInput > todayString) {
        setError(`End date cannot be in the future.`);
        setDateToInput(todayString);
        return;
      }
      setDateTo(dateToInput);
      setError("");
    } else {
      setError("Please select a valid end date.");
    }
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
      
      {isLoading && <p>Loading performance data...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Conditionally render the chart */}
      {!isLoading && chartData.datasets.length > 0 && (
        <div style={{ marginTop: '20px', marginBottom: '40px' }}>
          <StockChart data={chartData} />
        </div>
      )}
      {!isLoading && chartData.datasets.length === 0 && data && ( // data confirms an API call was made
        <p>No data available to display chart for the selected criteria.</p>
      )}

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