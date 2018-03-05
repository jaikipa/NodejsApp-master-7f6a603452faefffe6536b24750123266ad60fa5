var restify = require('restify');
var builder = require('botbuilder');
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk

require('dotenv').config({
    silent: true
});

var contexts;
var workspace = process.env.WORKSPACE_ID;

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create the service wrapper
var conversation = new Conversation({
    username: process.env.CONVERSATION_USERNAME,
    password: process.env.CONVERSATION_PASSWORD,
    url: process.env.BLUEMIX_API_BASE_URL + process.env.WORKSPACE_ID + '/message?version=2017-02-10',
    version_date: Conversation.VERSION_DATE_2017_05_26
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function(session) {

    var payload = {
        workspace_id: workspace,
        context: [],
        input: {
            text: session.message.text
        }
    };

    var conversationContext = {
        workspaceId: workspace,
        watsonContext: {}
    };

    if (!conversationContext) {
        conversationContext = {};
    }

    payload.context = conversationContext.watsonContext;

    conversation.message(payload, function(err, response) {
        if (err) {
            console.log(err);
            session.send(err);
        } else {
            console.log(JSON.stringify(response, null, 2));
            session.send(response.output.text);
            conversationContext.watsonContext = response.context;
        }
    });
});
