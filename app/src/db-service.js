const { pg, Pool } = require('pg');
const env = require('../../.env');

// create pool connections manager
const pool = new Pool({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'snake',
    password: env.dbPassword,
    port: '5432'
});

// listen for errors in db
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// check/update database tables
const checkDb = () => {
    let tableExists = true;
    pool.query(`
        SELECT EXISTS (
        SELECT 1
        FROM   information_schema.tables 
        WHERE  table_name = 'users'
        );
    `)
    .then((res) => {
        if (!res.rows[0].exists) {
            tableExists = false;
        }
    });
    if (!tableExists) {
        pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                email VARCHAR NOT NULL,
                score VARCHAR DEFAULT 0
            );
        `)
    }
}

module.exports =  {
    checkDb,
    pool
}