require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const app = express();
const path = require('path');
const indexControllers = require('./controllers/index.controller');
const route = require('./routes/index.routes');

app.use(express.json());
app.use(route);
app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res) => { res.sendFile(path.join(__dirname, '../public/index.html')) });

app.listen(process.env.PORT, async () => {
    console.log('App conected to port', process.env.PORT);
    indexControllers.SelfInitialize();
})
