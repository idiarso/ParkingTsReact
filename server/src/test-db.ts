import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'parking_system'
});

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('Successfully connected to database!');
    
    const result = await client.query('SELECT current_database(), current_user');
    console.log('Database info:', result.rows[0]);
    
    await client.end();
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

testConnection(); 