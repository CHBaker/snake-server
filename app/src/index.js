const express = require('express');
const uuid = require('uuid/v4')
const session = require('express-session')
const FileStore = require('session-file-store')(session);
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const secret = require('../../.env').secret;

const app = express();

const port = 3000;
const corsOptions = {
    origin: '*'
}

// TODO: move to db
const users = [
    {
        id: '2342343',
        email: 'test@test.com',
        password: 'password'
    }
];

// configure passport for AUTH strategy
passport.use(
    new LocalStrategy(
        { usernameField: 'email' },
        (email, password, done) => {
            console.log('inside local strat callback');
            // here is where to call to db
            // find user based on name/email
            const user = users[0];
            if (email === user.email && password === user.password) {
                console.log('local auth return true');
                return done(null, user);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    console.log('inside serializeUser callback. user ID saved to session file storage');
    done(null, user.id)
})

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors(corsOptions));

app.use(
    session({
        genid: (req) => {
            console.log('Inside the session middleware')
            console.log(req.sessionID)
            return uuid() // use UUIDs for session IDs
        },
        store: new FileStore(),
        secret: secret,
        resave: false,
        saveUninitialized: true
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Our first route
app.get('/', function(req, res) {
    res.send('req.sessionID');
    res.send('home page')
});

app.get('/login', (req, res) => {
    console.log(req.sessionID);
    res.send('login page');
});

app.post('/login', (req, res, next) => {
    console.log(req.body);
    passport.authenticate('local', (err, user, info) => {
        console.log('inside passport.auth callback');
        console.log(`re.session.passport: ${JSON.stringify(req.session.passport)}`);
        console.log(`req.user ${JSON.stringify(req.user)}`);

        req.login(user, (err) => {
            console.log('inside req.login callbakc');
            console.log(`re.session.passport: ${JSON.stringify(req.session.passport)}`);
            console.log(`req.user ${JSON.stringify(req.user)}`);
            return res.send('YOU were authed and logged boi');
        })
    })(req, res, next);
})

app.listen(port, function() {
    console.log(`boo'd up on port ${port}`);
});
