"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

bot.dialog('/', [
    function (session) {
        session.userData.playerOne = {'name': 'Awesome', 'score': 0};   
        session.userData.playerTwo = {'name': 'RoxStar', 'score': 0};  
        session.beginDialog('score', session.userData);//session.userData.profile
    }
]);

bot.dialog('startGame', [
    function (session, args, next) { 
        session.userData.profile = args || {};

        if (!session.userData.profile.name) {
            builder.Prompts.text(session, "Hi!");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response === 'start') {
            builder.Prompts.text(session, "A new game between: " + session.userData.playerOne.name + ', and ' + session.userData.playerTwo.name);
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response === 'player one scores') {
            session.userData.playerOne.score++;
            builder.Prompts.text(session, "Score: " + session.userData.playerOne.score + ', and ' + session.userData.playerTwo.name);
        }
    }
]);

bot.dialog('score', [
    function (session) {
        builder.Prompts.text(session, session.userData.playerOne.name + ': ' + session.userData.playerOne.score + ', and ' +  session.userData.playerTwo.name + ': ' + session.userData.playerTwo.score);        
    },
    function (session, results) {
        if (results.response === session.userData.playerOne.name + ' scores')
        {
            session.userData.playerOne.score++;
        }
        else if (results.response === session.userData.playerTwo.name + ' scores') {
            session.userData.playerTwo.score++;
        }
        session.replaceDialog('score', session.dialogData);
    }
]);

bot.dialog('gameOver', [
    function (session) {
        builder.Prompts.text(session, 'Player wins! By ' + session.dialogData.playerOne + ' to ' + session.dialogData.playerTwo);
    },
    function (session, results) {
        session.endDialog();
    }
]);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
