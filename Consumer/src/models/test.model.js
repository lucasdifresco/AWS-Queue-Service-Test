const mongoose = require('mongoose')
const {Schema} = mongoose

const TestSchema = new Schema({
    _id: Number,
    testId: Number,
    name: String,
    submited: Boolean,
    score: Number,
    questions: [{
      questionId: Number,
      question: String,
      answer1: String,
      answer2: String,
      answer3: String,
      correctAnswerId: Number,
      answerID: Number
    }]
  })

  const TestModel = mongoose.model('testdbs',TestSchema)

  module.exports = TestModel