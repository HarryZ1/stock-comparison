import { useState } from 'react';
import axios from 'axios';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setError('');
    setData(null);
    try {
      const response = await axios.get('/api/test-marketstack');
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

  return (
    <div>
      <h1>Stock Comparison App</h1>
      <button onClick={fetchData}>Test Marketstack API</button>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
export default App;