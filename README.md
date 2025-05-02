# Stock Comparison Project

This project is a web application featuring a React/Vite frontend and a Python/FastAPI backend. It fetches financial data (e.g., from Marketstack), provides API endpoints, caches data using Redis, and displays information using interactive charts.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following installed:

* **Git:** [Download Git](https://git-scm.com/downloads)
* **Node.js:** v18.x or later recommended ([Download Node.js](https://nodejs.org/)) (includes npm)
* **Yarn (Optional):** If you prefer Yarn over npm ([Install Yarn](https://classic.yarnpkg.com/en/docs/install))
* **Python:** v3.9 or later recommended ([Download Python](https://www.python.org/downloads/)) (includes pip)
* **Redis:** Required for backend caching. ([Install Redis](https://redis.io/docs/getting-started/installation/)). Ensure the Redis server can be started and is running before launching the backend.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
    cd your-repository-name
    ```

2.  **Set up the Backend (Python/FastAPI):**
    ```bash
    # Navigate to the backend directory (assuming it's named 'backend')
    cd backend

    # Create and activate a Python virtual environment (recommended)
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate

    # Install Python dependencies (while the venv is active)
    pip install -r requirements.txt

    # Set up environment variables for the backend
    # Copy the example file (if it exists)
    cp .env.example .env

    # Edit the backend/.env file with your actual credentials
    # Add necessary variables like your Marketstack API key and Redis connection URL
    # Example:
    # MARKETSTACK_API_KEY=your_actual_marketstack_api_key
    # REDIS_URL=redis://localhost:6379/0
    ```
    **Note:** Keep the virtual environment activated whenever running backend commands.

3.  **Set up the Frontend (React/Vite/TypeScript):**
    ```bash
    # Navigate to the frontend directory (assuming it's named 'frontend')
    # If you are in the backend directory, use 'cd ../frontend'
    cd ../frontend # Adjust path if needed

    # Install Node.js dependencies
    # Using npm:
    npm install
    # OR using yarn:
    # yarn install

    # Set up environment variables for the frontend
    # Copy the example file (if it exists)
    cp .env.example .env

    # Edit the frontend/.env file
    # Define the base URL for the backend API
    # Make sure the port matches where your FastAPI backend will run (default 8000)
    # Example:
    # VITE_API_BASE_URL=http://localhost:8000
    ```

### Running the Application (Development)

You need to run both the backend and frontend servers simultaneously. Open two separate terminal windows/tabs.

1.  **Start the Redis Server:**
    * Before starting the backend, ensure your Redis server is running. The command depends on how you installed Redis (e.g., `redis-server` often works if installed via a package manager).

2.  **Start the Backend Server (FastAPI):**
    * In the first terminal, navigate to the `backend` directory.
    * Make sure your Python virtual environment (`venv`) is activated.
    ```bash
    # (Ensure venv is active and Redis is running)
    # Start the FastAPI development server using Uvicorn
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    The backend API should now be running at `http://localhost:8000`.

3.  **Start the Frontend Development Server (Vite):**
    * In the second terminal, navigate to the `frontend` directory.
    ```bash
    # Using npm:
    npm run dev
    # OR using yarn:
    # yarn dev
    ```
    The Vite development server will start, typically at `http://localhost:5173` (check the terminal output for the exact URL).

4.  **Access the Application:**
    * Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).

The React frontend will load, and it should now be able to communicate with your FastAPI backend running on port 8000 (as configured via `VITE_API_BASE_URL`).

### Running Tests (Optional Placeholder)

```bash
# Add commands for running backend tests (e.g., using pytest)
# cd backend
# pytest

# Add commands for running frontend tests (e.g., using Vitest/React Testing Library)
# cd ../frontend
# npm test
# OR
# yarn test