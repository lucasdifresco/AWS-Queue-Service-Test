const AWS = require('aws-sdk');

var queueURL;
var myCredentials = new AWS.Credentials(process.env.SQS_ACCESS_KEY_ID, process.env.SQS_SECRET_ACCESS_KEY);
var sqs = new AWS.SQS({
    credentials: myCredentials,
    region: process.env.SQS_REGION,
    endpoint: process.env.SQS_ENDPOINT // En entrega final se puede eliminar porque se van a tener las credenciales
});

module.exports = {
    IsQueueInitialized: function () { if (queueURL) { return true; } else { return false; }; },
    SetQueueURL: function (URL) { queueURL = URL; },
    ListQueues: async function () {
        var params = {};

        return await sqs.listQueues(params).promise();
    },

    CreateQueue : async function (name) {
        var params = {
            QueueName: name
        };

        return await sqs.createQueue(params).promise();
    },

    PushToQueue: async function (body) {
        
        if (!queueURL) { return console.log("Queue not initialized"); }
        
        var params = {
            MessageBody: body,
            QueueUrl: queueURL,
            MessageAttributes: {
                testId: {
                    DataType: 'Number',
                    StringValue: "0"
                },
            },
        };
    
        return await sqs.sendMessage(params).promise();
    },

    PullFromQueue : async function () {
        if (!queueURL) { return console.log("Queue not initialized"); }

        var params = {
            QueueUrl: queueURL,
        };

        return await sqs.receiveMessage(params).promise();
    },
    DeleteFromQueue: async function (reciptHandler) { 
        if (!queueURL) { return console.log("Queue not initialized"); }
        var params = {
            QueueUrl: queueURL,
            ReceiptHandle: reciptHandler
        };
        return await sqs.deleteMessage(params).promise();
    }
};