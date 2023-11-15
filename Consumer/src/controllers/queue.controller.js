const queue = {}
const connection = require('../dbConnection/connection');
const TestModel = require('../models/test.model');
const http = require('http');
const sqs = require('./aws.controller');

queue.CheckQueueNoSQS = () => {
    
    try {
        http.get(`${process.env.PRODUCER_URL}/GetItemFromQueue`, (resp) => {
            let data = '';

            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => {
                if (resp.statusCode == 400) { return console.log(data); }

                data = JSON.parse(data);
                console.log(`Read from queue = TestId: ${data.testId} - QuestionId: ${data.questionId}`)

                async function ProcessTestHeader(data) {
                    try {
                        await connection();
                        console.log(`Conection Established`);

                        let test = await TestModel.findById(data.testId);

                        function ReturnItemToQueue(data) {
                            try {

                                let { testId, questionId } = data;
                                let testHeader = { testId, questionId };
                                jsonData = JSON.stringify(testHeader);

                                var urlparams = {
                                    host: process.env.PRODUCER_HOST,
                                    port: process.env.PRODUCER_PORT,
                                    path: '/SendItemToQueue',
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    }
                                };

                                function OnResponse(response) {
                                    var data = '';
                                    response.on('data', function (chunk) { data += chunk; });
                                    response.on('end', function () { console.log(data); });
                                }

                                var request = http.request(urlparams, OnResponse);

                                request.write(jsonData);
                                request.end();

                            } catch (err) { console.error(err) }
                        }


                        if (!test.submited)
                        {
                            ReturnItemToQueue(data);
                            return console.log(`Test ${test.testId} not submitted yet. Submited: ${test.submited} - Score: ${test.score}`);
                        }

                        if (test.score != -1) { return console.log(`Test ${test.testId} already processed. Submited: ${test.submited} - Score: ${test.score}`); }

                        var score = 0;
                        test.questions.map((question) => { if (question.answerID == question.correctAnswerId) { score++; } });
                        test.score = (score / test.questions.length) * 100;
                        
                        await test.save();
                        console.log(`Test ${test.testId} processed. Submited: ${test.submited} - Score: ${test.score}`);

                        
                        
                    } catch (err) {
                        console.error(err);
                    }
                }

                ProcessTestHeader(data);

                return console.log(data);
            });
        }).on("error", (err) => { return console.log("Error: " + err.message); });


    } catch (err) { console.error(err) }
}

queue.CheckQueueSQS = async () => {
    try {
        if (!sqs.IsQueueInitialized()) {
            let url = "";
            const queues = await sqs.ListQueues();
            if (!queues.QueueUrls) {
                const newQueues = await sqs.CreateQueue("SQS_Queue");
                url = newQueues.QueueUrl;
            } else { url = queues.QueueUrls[0]; }
            sqs.SetQueueURL(url);
        }

        if (!sqs.IsQueueInitialized()) { return console.log("Queue not initialized yet"); }
        const item = await sqs.PullFromQueue();
        if (!item.Messages) { return console.log("SQS Queue Empty"); }

        const data = JSON.parse(item.Messages[0].Body); 

        await connection();
        console.log(`Conection Established`);
        let test = await TestModel.findById(data.testId);

        if (!test.submited) { console.log(`Test ${test.testId} not submitted yet. Submited: ${test.submited} - Score: ${test.score}`); }
        else if (test.score != -1) { console.log(`Test ${test.testId} already processed. Submited: ${test.submited} - Score: ${test.score}`); }
        else {
            var score = 0;
            test.questions.map((question) => { if (question.answerID == question.correctAnswerId) { score++; } });
            test.score = (score / test.questions.length) * 100;

            await test.save();
            console.log(`Test ${test.testId} processed. Submited: ${test.submited} - Score: ${test.score}`);
        }

        await sqs.DeleteFromQueue(item.Messages[0].ReceiptHandle);
    } catch (err) { console.error(err) }
}

module.exports = queue