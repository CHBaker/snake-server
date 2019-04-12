const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');

const dbService = require('./db-service');
const middleware = require('./middleware');

const app = express();

// configs
const port = 3000;
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
};

dbService.checkDb();

/*
    add & configure middleware
    --------------------------
    - CORS
    - Compression
    - Helmet to protect common HTTP attacks
    - Pathjoin, to fix malformed URL paths from API users
    - Body Parser for URLencoded and JSON handling
    --------------------------
*/
app.use(cors(corsOptions));
app.use(compression());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// create account
app.post('/create', middleware.createUser);

// login
app.post('/login', middleware.login);

// get scores
app.get('/scores', dbService.getScores);

// set new score
app.post('/score', middleware.checkToken, dbService.updateScore);

app.listen(port, function() {
    console.log(`boo'd up on port ${port}`);
});
