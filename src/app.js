const express = require('express')
const app = express ()
//const route  = require ('./routes/index.routes')
const path = require('path')
const controller = require('./controllers/index.controller');

app.use(express.json());
//app.use(route)
app.use(express.static(path.join(__dirname,'../public')))
app.use((req,res)=>{ res.sendFile(path.join(__dirname,'../public/index.html')) })

app.listen(3001, () => {    
    console.log('App conected')


    console.log('Checking queue')
    controller.CheckQueue();

})

