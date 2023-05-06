const mongoose = require('mongoose');

const uri = `mongodb+srv://admin:${process.env.DB_PASSWORD}@cluster0.vt34kzy.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`

module.exports = ()=> mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true})

