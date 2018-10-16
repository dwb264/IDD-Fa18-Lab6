# ChatBot

*A lab report by Devon Bain*

## In this Report

To submit your lab, fork [this repository](https://github.com/FAR-Lab/IDD-Fa18-Lab6). You'll need to upload any code you change into your fork, as well as upload a video of a friend or classmate using your chatbot.

## Make the ChatBot your own

**Describe what changes you made to the baseline chatbot here. Don't forget to push your modified code to this repository.**

I turned the chatbot into a music recommender bot using the Spotify API. I registered the app with Spotify to obtain a client ID and client secret, stored in a file called login.js (not included in this repo for security). In chatServer.js, I POST the id and secret to receive a token used to access the API. I referred to Spotify's [Web API Auth Examples](https://github.com/spotify/web-api-auth-examples) to understand how to do this.

Instead of prompting the user for name, favorite color etc, the bot prompts them to enter a band or artist. In chatServer.js, there is a GET request to the /search endpoint to get the artist ID from the user input and a second GET request to the /related-artists endpoint to get the related artists. The chatbot then shows the artists to the user, five at a time, and the user can choose to see more, enter a different artist, or quit.

Because the requests are asynchronous, it didn't work to have the lines `socket.emit('answer', answer);` and `setTimeout(timedQuestion, waitTime, socket, question);` at the end of the `bot` function. Instead, I had to move them inside the second callback for the answer to be displayed with the requested data.

*Known issues*

* No input checking: the user could enter malicious input and it would be included as-is in the request to the API. This could be a major security issue.
* Rudimentary error handling: If the user enters an artist that is not found, the bot says "Artist not found, and I'm a stupid bot so you'll have to refresh the page." Ideally it would catch the error sooner and prompt the user to enter a different artist, but I ran into problems implementing this due to the asynchronous functions.


## Record someone trying out your ChatBot

**Using a phone or other video device, record someone trying out your ChatBot. Upload that video to this repository and link to it here!**

[User interaction](https://youtu.be/1MDQKYJLIjM)

This additional video shows how interaction with the bot looks from the user's perspective:

[Screen capture](https://www.youtube.com/watch?v=7U5ECWVFSDM)

---
Starter code by [David Goedicke](mailto:da.goedicke@gmail.com), closely based on work by [Nikolas Martelaro](mailto:nmartelaro@gmail.com) and [Captain Anonymous](https://codepen.io/anon/pen/PEVYXz), who forked original work by [Ian Tairea](https://codepen.io/mrtairea/pen/yJapwv).
