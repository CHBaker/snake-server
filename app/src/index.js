const express = require('express');
const uuid = require('uuid/v4')
const session = require('express-session')
const FileStore = require('session-file-store')(session);
const cors = require('cors');
const secret = require('../../.env').secret;
const app = express()

const port = 3000;
const corsOptions = {
    origin: '*'
}

// middleware
app.use(cors(corsOptions));

app.use(session({
    genid: (req) => {
      console.log('Inside the session middleware')
      console.log(req.sessionID)
      return uuid() // use UUIDs for session IDs
    },
    secret: secret,
    resave: false,
    saveUninitialized: true
}));

// Our first route
app.get('/', function(req, res) {
    res.send('Hello Dev!');
});

app.listen(port, function() {
    console.log(`boo'd up on port ${port}`);
});
