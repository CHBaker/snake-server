const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const dbService = require('./db-service');
const middleware = require('./middleware');

const app = express();

// configs
const port = 3000;
const corsOptions = {
    origin: '*'
};

dbService.checkDb();

// add & configure middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// create account
app.post('/create', middleware.createUser);

// login
app.post('/login', middleware.login);

// score handling
app.get('/scores', middleware.checkToken, dbService.getScores);

app.post('/score', middleware.checkToken, dbService.updateScore);

app.listen(port, function() {
    console.log(`boo'd up on port ${port}`);
});
