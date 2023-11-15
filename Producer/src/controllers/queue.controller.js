const controller = {}
const sqs = require('./aws.controller');

controller.PushToQueue = async (body) => {
    if (!sqs.IsQueueInitialized()) {
        let url = "";
        const queues = await sqs.ListQueues();
        if (!queues.QueueUrls) {
            const newQueues = await sqs.CreateQueue("SQS_Queue");
            url = newQueues.QueueUrl;
        } else { url = queues.QueueUrls[0]; }
        sqs.SetQueueURL(url);
    }

    return await sqs.PushToQueue(body);
}

module.exports = controller