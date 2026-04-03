import pg from 'pg';

if (!process.env.POSTGRES_URI) {
    throw new Error('POSTGRES_URI is not defined in environment variables');
}

const pool = new pg.Pool({
    connectionString: process.env.POSTGRES_URI,
    ssl: {
        rejectUnauthorized: false,
    },
});

export default pool;
