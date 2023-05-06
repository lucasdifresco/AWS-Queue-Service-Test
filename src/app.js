require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const app = express();
const route = require('./routes/index.routes');
const path = require('path');
const cors = require('cors');

app.use(cors({ origin: process.env.FRONT_URL }));
app.use(express.json());
app.use(route);
app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res) => { res.sendFile(path.join(__dirname, '../public/index.html')) });

app.listen(process.env.PORT, () => { console.log(`Escuchando en puerto ${process.env.PORT}`) });

