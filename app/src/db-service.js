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

const getScores = (req, res, next) => {
    pool.query(`
        SELECT name, score FROM users ORDER BY score DESC;
    `)
    .then((data) => {
        scores = data.rows;
        if (scores) {
            res.json({
                success: true,
                body: scores,
            });
        } else {
            res.json({
                success: false,
                body: 'no scores were found'
            });
        }
    })
    .catch((e) => {
        res.json({
            success: false,
            error: e
        })
    })
}

const updateScore = (req, res, next) => {
    const { id, score } = req.body;
    pool.query(`
        SELECT score FROM users WHERE id = ${id}
    `)
    .then((data) => {
        const oldScore = data.rows[0].score;
        console.log('oldScore', oldScore);
        console.log('new score', score);
        if (score > oldScore) {

            pool.query(`
                UPDATE users SET score = ${score} WHERE id = ${id};
            `)
            .then((data) => {
                console.log('update score')
                res.json({
                    success: true,
                    body: 'score updated to ' + score
                })
            })
            .catch((e) => {
                console.log('failed ', e)
                res.json({
                    success: true,
                    body: 'score failed to update'
                });
            });
        } else {

            res.json({
                success: true,
                body: 'user did not set a new high score'
            });
        }
    }).catch((e) => {
        res.json({
            success: true,
            body: 'failed to retrieve score'
        });
    })
}

module.exports =  {
    checkDb,
    pool,
    getScores,
    updateScore
}