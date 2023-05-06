const controller = {};
const queue = require('./queue.controller');

let SQSInterval;
let SaticInterval;

controller.Initialize = (req, res) => {
    try {
        let { mode, interval } = req.body;

        if (!mode) { return res.status(400).send(`No mode provided: ${mode}. This endpoint requires in the body a mode parameter. (mode: SQS or Static or None)`); }
        if (!interval) { interval = process.env.PERIOD; }

        clearInterval(SaticInterval);
        clearInterval(SQSInterval);

        if (mode == "SQS") {
            SQSInterval = setInterval(queue.CheckQueueSQS, interval);
            console.log(`Checking SQS queue every`, interval, 'ms');
            return res.status(200).send(`Checking SQS queue every ${interval} ms`);
        } else if (mode == "Static") {
            SaticInterval = setInterval(queue.CheckQueueNoSQS, interval);
            console.log(`Checking Static queue every`, interval, 'ms');
            return res.status(200).send(`Checking Static queue every ${interval} ms`);
        }
        else {
            console.log(`Stop checking queues`);
            return res.status(200).send(`Stop checking queues`);
        }
    } catch (err) { console.error(err) }
}
controller.SelfInitialize = () => {
    try {
        clearInterval(SaticInterval);
        clearInterval(SQSInterval);
        
        SQSInterval = setInterval(queue.CheckQueueSQS, process.env.PERIOD);
        console.log(`Checking SQS queue every`, process.env.PERIOD, 'ms');
    } catch (err) { console.error(err) }
}

module.exports = controller;