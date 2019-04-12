const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pg } = require('pg');
const { pool } = require('./db-service');
const env = require('../../.env').env;

const createToken = (email) => {
    const token = jwt.sign(
        {
            email: email
        },
        env.secret,
        {
            expiresIn: '24h'
        }
    );
    return token
}

// create user account
const createUser = (req, res, next) => {
    const { name, email, password } = req.body;

    // encrypt password
    if (password && email && name) {
        bcrypt.hash(password, 10)
            .then((hash) => {
                pool.query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3);`, [name, email, hash])
                    .then((data) => {
                        const token = createToken(email);
                        return res.json({
                            success: true,
                            message: 'logged in and JWT session started',
                            token
                        });
                    })
                    .catch(e => {
                        console.log(e)
                        return res.json({
                            success: false,
                            message: 'failure to create login',
                            error: e
                        });
                    })
            })
            .catch(e => {
                return res.json({
                    success: false,
                    message: 'failure to create login',
                    error: e,
                });
            });
    } else {
        res.json({
            success: false,
            message: 'No user supplied'
        });
    }
}

const login = (req, res, next) => {
    // authenticate user password hash
    const { name, email, password } = req.body;
    let user = null;
    
    // get user by email from db
    pool.query(`SELECT * from users where lower(email) = lower($1);`, [email])
        .then((results) => {
            user = results.rows[0]

            if (!user) {
                return res.json({
                    success: false,
                    message: 'Invalid Credentials.'
                });
            }
            // compare hash
            if (!bcrypt.compareSync(password, user.password)) {
                return res.json({
                    success: false,
                    message: 'Invalid Credentials.'
                });
            }

            // if password is correct create JWT
            token = createToken(email);

            return res.json({
                success: true,
                message: 'logged in and JWT session started',
                token
            });
        })
        .catch(e => {
            return res.json({
                success: false,
                message: 'auth failed',
                error: e
            });
        });
}

const checkToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);

        jwt.verify(token, env.secret, (err, decodedToken) => {
            if (err) {
                console.log('error verifying ', err)
                return res.json({
                    success: false,
                    message: 'Invalid Token'
                });
            } else {
                req.decodedToken = decodedToken;
                next();
            }
        });
    } else {
        console.log('no token, ', token)
        return res.json({
            success: false,
            message: 'Auth token not supplied'
        });
    }
}

module.exports = {
    checkToken,
    createUser,
    login,
}