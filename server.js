var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Get secrets from server environment
var connection = new builder.ChatConnector ({
    appId: process.env.MICROSOFT_APP_ID,
    appSecret: process.env.MICROSOFT_APP_PASSWORD
});

// Create bot
var bot = new builder.UniversalBot(connection);
// Handle Bot Framework messages
server.post('/api/messages', connection.listen());

bot.dialog('/', [
    function (session) {
        session.userData.playerOne = {'name': 'Awesome', 'score': 0};   
        session.userData.playerTwo = {'name': 'RoxStar', 'score': 0};  
        session.beginDialog('score', session.userData);//session.userData.profile
    }
    // function (session, results) {
    //     session.userData.profile = results.profile;
    //     session.send('Hello %s!', session.userData.profile.name);
    // }
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


// Serve a static web page
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));
