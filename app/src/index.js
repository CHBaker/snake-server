const express = require('express');
const { pg, Pool } = require('pg');
const uuid = require('uuid/v4');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const env = require('../../.env').env;

// configs
const pool = new Pool({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'snake',
    password: env.dbPassword,
    port: '5432'
});

const port = 3000;
const corsOptions = {
    origin: '*'
};

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// check/update database tables
(function checkDb() {
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
})();

// configure passport for AUTH strategy
passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        console.log('inside local strat callback', email);
        let user = null;
        // here is where to call to db
        // find user based on name/email
        pool.query(`SELECT * from users where lower(email) = lower('${email}');`)
            .then((res) => {
                user = res.rows[0]
                console.log(user);

                if (!user) {
                    return done(null, false, {
                        message: 'Invalid Credentials. \n'
                    });
                }
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, {
                        message: 'Invalid Credentials. \n'
                    });
                }
                return done(null, user);
            })
            .catch(e => {
                console.log(e);
                return done(e);
            });
    })
);

passport.serializeUser((user, done) => {
    console.log(
        'inside serializeUser callback. user ID saved to session file storage'
    );
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    console.log('deserializeUser callback', id);
    pool.query(`SELECT * FROM users where id = ${id};`)
        .then((res) => {
            user = res.rows[0];
            console.log('Her it is ', user);
            return done(null, user);
        })
        .catch(e => {
            console.log(e);
            return done(e);
        })
});

const app = express();

// add & configure middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
    session({
        genid: req => {
            console.log('Inside session middleware genid function');
            console.log(
                `Request object sessionID from client: ${req.sessionID}`
            );
            return uuid(); // use UUIDs for session IDs
        },
        store: new FileStore(),
        secret: env.secret,
        resave: false,
        saveUninitialized: true
    })
);
app.use(passport.initialize());
app.use(passport.session());

// create the homepage route at '/'
app.get('/', (req, res) => {
    console.log('Inside the homepage callback');
    console.log(req.sessionID);
    res.send(`You got home page!\n`);
});

// create account
app.post('/create', (req, res) => {
    console.log('in create callback');
    console.log(req.body);
    const user = req.body;
    bcrypt.hash(user.password, 10)
        .then((hash) => {
            console.log(hash)
            pool.query(`INSERT INTO users (name, email, password) VALUES ('${user.name}', '${user.email}', '${hash}');`)
                .then((res) => {
                    console.log('inserted user, ', res)
                })
                .catch(e => {
                    console.log('psql error', e)
                })
        })
        .catch(e => {
            console.log('bcrypt error', e)
        })
    return res.send(200);
});

// login
app.get('/login', (req, res) => {
    console.log('Inside GET /login callback', req.sessionID);
    res.send(`You got the login page!\n`);
});

app.post('/login', (req, res, next) => {
    console.log('Inside POST /login callback');
    passport.authenticate('local', (err, user, info) => {
        console.log('user', user)
        if (info) {
            return res.send(info.message);
        }
        if (err) {
            return next(err);
        }
        if (!user) {
            console.log('no user')
            return res.redirect('/login');
        }
        req.login(user, err => {
            console.log('Inside req.login() callback');
            if (err) {
                return next(err);
            }
            return res.redirect('/authrequired');
        });
    })(req, res, next);
});

app.get('/authrequired', (req, res) => {
    console.log('auth, logged', req.isAuthenticated());
    if (req.isAuthenticated()) {
        res.send('you hit the authentication endpoint\n');
    } else {
        res.redirect('/');
    }
});

app.listen(port, function() {
    console.log(`boo'd up on port ${port}`);
});
