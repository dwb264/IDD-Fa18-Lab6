/*
chatServer.js
Author: David Goedicke (da.goedicke@gmail.com)
Closley based on work from Nikolas Martelaro (nmartelaro@gmail.com) as well as Captain Anonymous (https://codepen.io/anon/pen/PEVYXz) who forked of an original work by Ian Tairea (https://codepen.io/mrtairea/pen/yJapwv)
*/

var express = require('express'); // web server application
var app = express(); // webapp
var http = require('http').Server(app); // connects http library to server
var io = require('socket.io')(http); // connect websocket library to server
var serverPort = 8000;

// Spotify
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');

var login = require("./login.js");
var token;

var client_id = login.client_id; // Your client id
var client_secret = login.client_secret; // Your secret

var artistId;
var relatedArtistList;
var artistOffset = 5;

var questionNum;

//---------------------- WEBAPP SERVER SETUP ---------------------------------//
// use express to create the simple webapp
app.use(express.static('public'))
  .use(cors()); // find pages in public directory

// start the server and say what port it is on
http.listen(serverPort, function() {
  console.log('listening on *:%s', serverPort);
});
//----------------------------------------------------------------------------//


//---------------------- WEBSOCKET COMMUNICATION -----------------------------//
// this is the websocket event handler and say if someone connects
// as long as someone is connected, listen for messages
io.on('connect', function(socket) {
  getToken();

  console.log('a new user connected');
  questionNum = 0; // keep count of question, used for IF condition.
  socket.on('loaded', function() { // we wait until the client has loaded and contacted us that it is ready to go.

    socket.emit('answer', "Hey, hello I am RecoBot, a music recommender chat bot."); //We start with the introduction;
    setTimeout(timedQuestion, 5000, socket, "What is a music artist or band you like?"); // Wait a moment and respond with a question.

  });
  socket.on('message', (data) => { // If we get a new message from the client we process it;
    console.log(data);
    console.log(questionNum);
    questionNum = bot(data, socket, questionNum); // run the bot function with the new message
  });
  socket.on('disconnect', function() { // This function  gets called when the browser window gets closed
    console.log('user disconnected');
  });
});

//--------------------------CHAT BOT FUNCTION-------------------------------//
function bot(data, socket, questionNum) {
	var input = data; // This is generally really terrible from a security point of view ToDo avoid code injection
	var answer;
	var question;
	var waitTime;

	/// These are the main statments that make up the conversation.
	if (questionNum == 0) {

	  	// Get artist ID from artist name input
		request.get({
			url: 'https://api.spotify.com/v1/search?q=' + input + '&type=artist&limit=1',
			headers: {
			  'Authorization': "Bearer " + token
			},
		}, function(error, response, body) {

			if (!error && response.statusCode === 200) {

				var thisArtist;
				try {
					thisArtist = JSON.parse(body).artists.items[0].name;
			
					// Get related artists
					request.get({
						url: 'https://api.spotify.com/v1/artists/' + JSON.parse(body).artists.items[0].id + '/related-artists',
						headers: {
						  'Authorization': "Bearer " + token
						},
					}, function(error, response, body) {
					    if (!error && response.statusCode === 200) {
							relatedArtistList = JSON.parse(body).artists;

							artists = [];
							relatedArtistList.slice(0,5).forEach(function(artist) {
								artists.push(artist.name);
							})

							answer = 'Oh cool, I like ' + thisArtist + ' too :-)'; // output response
							waitTime = 5000;
							question = 'Here are some other artists I think you might like: ' + artists.join(", ") + '. Do you want to see more?'; // load next question

							socket.emit('answer', answer);
							setTimeout(timedQuestion, waitTime, socket, question);
					    }
					});

				} catch(err) {
					socket.emit('answer', "Artist not found, and I'm a stupid bot so you'll have to refresh the page");
				}

		}

	});
      
    
  } else if (questionNum == 1) {

    if ((input.toLowerCase() === 'yes' || input === 1) && artistOffset <= Math.min(15, relatedArtistList.length)) {
      // Show more artists
      artists = [];
      relatedArtistList.slice(artistOffset, artistOffset+5).forEach(function(artist) {
        artists.push(artist.name);
      })
      artistOffset += 5;

      answer = 'Ok, just a sec.'; // output response
      waitTime = 1000;
      question = 'Ok, here are more artists: ' + artists.join(", ") + '. Do you want to see more?';

      socket.emit('answer', answer);
      setTimeout(timedQuestion, waitTime, socket, question);      
      questionNum = 0;

    } else if (input.toLowerCase() === 'no' || input === 0) {
      // Don't show more artists
      answer = 'Ok, no problemo.'; // output response
      waitTime = 1000;
      question = 'Do you want to enter another artist?';

      socket.emit('answer', answer);
      setTimeout(timedQuestion, waitTime, socket, question); 
      questionNum = 1;

    } else if (artistOffset > Math.min(15, relatedArtistList.length)) {
      answer = '';
      waitTime = 0;
      question = 'Sorry, that\'s all the artists I have. Do you want to enter another artist?';

      setTimeout(timedQuestion, waitTime, socket, question);      
      questionNum = 1;

    } else {
      answer = '';
      waitTime = 0;
      question = 'I did not understand you. Could you please answer "yes" or "no"?';
      setTimeout(timedQuestion, waitTime, socket, question);      
      questionNum = 0;
    }

  } else if (questionNum == 2) {
  	// Enter another artist
    if (input.toLowerCase() === 'yes' || input === 1) {
      answer = 'Ok!';
      waitTime = 1000;
      question = 'Please enter another artist:';

      socket.emit('answer', answer);
      setTimeout(timedQuestion, waitTime, socket, question);      
      questionNum = -1; // go back to 0;
      artistOffset = 5;

    } else if (input.toLowerCase() === 'no' || input === 0) {
      // Quit
      answer = 'Ok, goodbye!';
      waitTime = 0;
      question = '';

      socket.emit('answer', answer);
      setTimeout(timedQuestion, waitTime, socket, question);      

    } else {
      answer = '';
      waitTime = 0;
      question = 'I did not understand you. Could you please answer "yes" or "no"?';
      setTimeout(timedQuestion, waitTime, socket, question);
      questionNum = 1;
    }

  } else {
    answer = 'If you\'re seeing this, it means you broke it'; // output response
    waitTime = 0;
    question = '';
  }


  /// We take the changed data and distribute it across the required objects.
  //socket.emit('answer', answer);
  //setTimeout(timedQuestion, waitTime, socket, question);

  return (questionNum + 1);
  
}

function timedQuestion(socket, question) {
  if (question != '') {
    socket.emit('question', question);
  } else {
    //console.log('No Question send!');
  }

}
//----------------------------------------------------------------------------//

// Spotify API login
function getToken() {

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      // use the access token to access the Spotify Web API
      token = body.access_token;
    }
  });

}
