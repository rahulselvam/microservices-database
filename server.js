const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// 1. Database Connection Pool Configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mydb',
  user: process.env.DB_USER || 'postgresuser',
  password: process.env.DB_PASSWORD || 'securepassword123',
  max: 10,                           // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,          // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000,     // Return an error if connection takes longer than 2s
});

// Handle unexpected errors on idle database clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
});

// 2. Kubernetes Liveness/Readiness Probe Endpoint
app.get('/health', async (req, res) => {
  try {
    // Quick test query to ensure the database link is alive
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'UP', database: 'CONNECTED' });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// 3. Sample Business API Route
app.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() as current_time;');
    res.json({ message: "Connected successfully!", dbTime: rows[0].current_time });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// 4. Server Initialization
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Microservice listening on port ${PORT}`);
});

// 5. Graceful Shutdown (Handles container termination cleanly)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');
  server.close(async () => {
    console.log('HTTP server closed. Closing database pool...');
    await pool.end();
    console.log('Database pool closed. Process exiting cleanly.');
    process.exit(0);
  });
});