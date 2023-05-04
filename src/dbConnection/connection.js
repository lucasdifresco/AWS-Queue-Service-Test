const mongoose = require('mongoose')
const password = 'admin'
const dbname = 'arquitecturaAplicaciones'


const uri=`mongodb+srv://admin:${password}@cluster0.vt34kzy.mongodb.net/${dbname}?retryWrites=true&w=majority`

module.exports = ()=> mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true})

