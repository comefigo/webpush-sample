'use strict';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const path = require('path');
const subscpt = require('./subscription');
const objSubscpt = new subscpt();

const app = express();

// Parse JSON body
app.use(bodyParser.json());

app.use('/static', express.static(path.join(__dirname, 'static')));

app.post('/api/subscription/upsert', (req, res) => {
    console.log(req.body);
    const objSubscription = req.body;
    objSubscpt.update('userid', objSubscription);
    return res.send('ok');
});

app.post('/api/subscription/push', (req, res) => {
    if (!req || req.body === {}) {
        return res.send('empty request');
    }

    const objData = req.body;
    const options = {
        vapidDetails: {
            subject: 'https://developers.google.com/web/fundamentals/',
            publicKey: process.env.APP_PUB_KEY,
            privateKey: process.env.APP_PRV_KEY
        },
        // 1 hour in seconds.
        TTL: 60 * 60
    };

    // get subscription object by memberId
    const objSubscription = objSubscpt.get('userid');
    if (!objSubscription || !('endpoint' in objSubscription) || !('keys' in objSubscription)) {
        return res.send('undefined subscription');
    }

    // push massage object
    const data = new PushObject(objData.title, objData.text, { url: objData.url });
    console.log('push object:');
    console.log(data);

    webpush.sendNotification(
        objSubscription,
        JSON.stringify(data),
        options
    ).then(() => {
        res.status(200).send({
            success: true
        });
    }).catch((err) => {
        if (err.statusCode) {
            res.status(err.statusCode).send(err.body);
        } else {
            res.status(400).send(err.message);
        }
    });
});

// Start the server
const server = app.listen(process.env.PORT || '3000', () => {
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
});
// [END app]

class PushObject {
    constructor(title, body, data) {
        this.title = title;
        this.body = body;
        this.icon = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/240px-HTML5_logo_and_wordmark.svg.png';
        this.image = ''; // link url image
        this.data = data;
        this.actions = [];
    }

    addAction(objAction) {
        this.actions.push(objAction);
    }
}