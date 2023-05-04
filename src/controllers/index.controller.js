const controller = {};
const connection = require('../dbConnection/connection')
const TestModel = require('../models/test.model')

var queue = [];

// General Purpose
controller.ClearTest = async (req, res) => {
    try {
        await connection()

        console.log(`Conection Established`);

        const { testId } = req.body;
        if (!testId) {
            console.log(`No test Id provided: ${testId}`);
            return res.status(400).send(`No test Id provided: ${testId}`);
        }

        console.log(`Clear test: test = ${testId}`);

        let tests = await TestModel.find();
        if (!tests) { return res.status(400).send(`Database conection error`); }

        let test = tests.find((t) => t.testId == testId);
        if (!test) { return res.status(400).send(`Test ${testId} not found`); }

        test.questions.map((question) => { question.answerID = "-1" })
        test.submited = false;
        test.score = -1;

        await test.save();

        return res.status(200).send(`Test ${testId} cleared`);
    } catch (err) {
        console.error(err)
    }
}
controller.SubmitNewTest = async (req, res) => {
    try {
        await connection()

        console.log(`Conection Established`);

        const { test } = req.body;
        console.log(test);

        if (!test) {
            console.log(`No test provided: ${test}`);
            return res.status(400).send(`No test provided: ${test}`);
        }

        console.log(`Submit new test: testId = ${test.testId}`);

        let dbTest = await TestModel.findById(test.testId);
        if (dbTest) { return res.status(400).send(`Test ${test.testId} already exists in the database`); }

        const newTest = new TestModel(test);
        newTest._id = test.testId;
        await newTest.save();

        return res.status(200).send(`Test ${test.testId} created`);
    } catch (err) {
        console.error(err)
    }
}

// Using SQS
controller.GetTestsList = async (req, res) =>{
    try{            
        await connection()
        let allTest = await TestModel.find()
        console.log(allTest)

        allTest.map((test) => {
            test.questions.map((question) => {
                question.correctAnswerId = -1;
             });
        });

        res.status(200).send(allTest);
    }catch(err){
        console.error(err)
        return res.status(400).send(`Database conection error`);
    }
}
controller.SubmitAnswer = async (req, res) =>{
    try{            
        await connection()

        console.log(`Conection Established`);

        const { user, testId, questionId, answerId } = req.body;

        if (!user) {
            console.log(`No user Id provided: ${user}`);
            return res.status(400).send(`No user Id provided: ${user}`);
        }
        if (!testId && testId != 0) {
            console.log(`No test Id provided: ${testId}`);
            return res.status(400).send(`No test Id provided: ${testId}`);
        }
        if (!questionId && questionId != 0) {
            console.log(`No question Id provided: ${questionId}`);
            return res.status(400).send(`No question Id provided: ${questionId}`);
        }
        if (!answerId && answerId != 0) {
            console.log(`No answer Id provided: ${answerId}`);
            return res.status(400).send(`No answer Id provided: ${answerId}`);
        }

        console.log(`Submit answer: user = ${user}, test = ${testId}, question = ${questionId}, answer = ${answerId}`);

        let tests = await TestModel.find();
        if (!tests) { return res.status(400).send(`Database conection error`); }

        let test = tests.find((t) => t.testId == testId );
        if (!test) { return res.status(400).send(`Test ${testId} not found`); }

        let question = test.questions[questionId];
        if (question.answerID != "-1") { return res.status(400).send(`answer already submited to question ${questionId} of test ${testId} by user ${user}`); }

        test.questions[questionId].answerID = answerId;

        let finished = true;
        test.questions.map((question) => { if (question.answerID == "-1") { finished = false; } })
        test.submited = finished;

        await test.save();

        //BBDD.push({ test });

        //    PushAnswerToQueue(user, testId, questionId)
        //        .OnError(() => { return res.status(500).send(`Error pushing answer ${answerId} of test ${testId} by user ${user} to queue`); })
        //        .OnSuccess(() => { return res.status(200).send(`Answer ${answerId} of test ${testId} by user ${user} pushed to queue`); });

        return res.status(200).send(`Answer ${answerId} of test ${testId} by user ${user} pushed to queue. Submited: ${finished}`);
    } catch (err) {
        console.error(err)
    }
}

// Using static Queue on Server
controller.SubmitAnswerNoSQS = async (req, res) => {
    try {
        await connection()

        console.log(`Conection Established`);

        const { user, testId, questionId, answerId } = req.body;

        if (!user) {
            console.log(`No user Id provided: ${user}`);
            return res.status(400).send(`No user Id provided: ${user}`);
        }
        if (!testId && testId != 0) {
            console.log(`No test Id provided: ${testId}`);
            return res.status(400).send(`No test Id provided: ${testId}`);
        }
        if (!questionId && questionId != 0) {
            console.log(`No question Id provided: ${questionId}`);
            return res.status(400).send(`No question Id provided: ${questionId}`);
        }
        if (!answerId && answerId != 0) {
            console.log(`No answer Id provided: ${answerId}`);
            return res.status(400).send(`No answer Id provided: ${answerId}`);
        }

        console.log(`Submit answer: user = ${user}, test = ${testId}, question = ${questionId}, answer = ${answerId}`);

        let tests = await TestModel.find();
        console.log(tests);
        if (!tests) { return res.status(400).send(`Database conection error`); }

        let test = tests.find((t) => t.testId == testId);
        if (!test) { return res.status(400).send(`Test ${testId} not found`); }

        let question = test.questions[questionId];
        if (question.answerID != "-1") { return res.status(400).send(`answer already submited to question ${questionId} of test ${testId} by user ${user}`); }

        test.questions[questionId].answerID = answerId;

        let finished = true;
        test.questions.map((question) => { if (question.answerID == "-1") { finished = false; } })
        test.submited = finished;

        await test.save();

        var testHeader = { testId, questionId }
        queue.push(JSON.stringify(testHeader));

        return res.status(200).send(`Answer ${answerId} of test ${testId} by user ${user} pushed to queue. Submited: ${finished}`);
    } catch (err) {
        console.error(err)
    }
}
controller.GetItemFromQueue = async (req, res) => {
    try {
        var item = queue.shift();
        if (item) { return res.status(200).send(item); }

        return res.status(400).send(`Empty queue`);
    }
    catch (err) {
        console.error(err)
        return res.status(400).send(`Database conection error`);
    }
}
controller.SendItemToQueue = async (req, res) => {
    try {
        var { testId, questionId } = req.body;
        if (!testId) { return res.status(400).send('Item not found'); }

        var item = { testId, questionId };
        queue.push(item);

        return res.status(200).send(`Item ${item} enqueued`);
    }
    catch (err) {
        console.error(err)
        return res.status(400).send(`Database conection error`);
    }
}

// Not using queues at all
controller.SubmitAnswerNoEDA = async (req, res) => {
    try {
        await connection()

        console.log(`Conection Established`);

        const { user, testId, questionId, answerId } = req.body;

        if (!user) {
            console.log(`No user Id provided: ${user}`);
            return res.status(400).send(`No user Id provided: ${user}`);
        }
        if (!testId && testId != 0) {
            console.log(`No test Id provided: ${testId}`);
            return res.status(400).send(`No test Id provided: ${testId}`);
        }
        if (!questionId && questionId != 0) {
            console.log(`No question Id provided: ${questionId}`);
            return res.status(400).send(`No question Id provided: ${questionId}`);
        }
        if (!answerId && answerId != 0) {
            console.log(`No answer Id provided: ${answerId}`);
            return res.status(400).send(`No answer Id provided: ${answerId}`);
        }

        console.log(`Submit answer: user = ${user}, test = ${testId}, question = ${questionId}, answer = ${answerId}`);

        let tests = await TestModel.find();
        console.log(tests);
        if (!tests) { return res.status(400).send(`Database conection error`); }

        let test = tests.find((t) => t.testId == testId);
        if (!test) { return res.status(400).send(`Test ${testId} not found`); }

        let question = test.questions[questionId];
        if (question.answerID != "-1") { return res.status(400).send(`answer already submited to question ${questionId} of test ${testId} by user ${user}`); }

        test.questions[questionId].answerID = answerId;

        let finished = true;
        test.questions.map((question) => { if (question.answerID == "-1") { finished = false; } })
        test.submited = finished;

        if (test.submited)
        {
            if (test.score != -1) { return res.status(400).send(`Test ${test.testId} already processed. Submited: ${test.submited} - Score: ${test.score}`); }
            var score = 0;
            test.questions.map((question) => { if (question.answerID == question.correctAnswerId) { score++; } });
            test.score = (score / test.questions.length) * 100;
            
            await test.save();
            return res.status(200).send(`Test ${test.testId} submitted. Submited: ${test.submited} - Score: ${test.score}`);
        }

        await test.save();
        return res.status(200).send(`Answer ${answerId} of test ${testId} by user ${user} awaiting for process. Submited: ${finished}`);
    } catch (err) {
        console.error(err)
    }
}


module.exports = controller