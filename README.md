## HarvardX CS50W Project 2: Web Programming with Python and JavaScript

### Try the app on Heroku:
    [Click here](https://cs50w-p2-hleung3.herokuapp.com/)
### Overview

In this project, you’ll build an online messaging service using Flask, similar in spirit to Slack. Users will be able to sign into your site with a display name, create channels (i.e. chatrooms) to communicate in, as well as see and join existing channels. Once a channel is selected, users will be able to send and receive messages with one another in real time. Finally, you’ll add a personal touch to your chat application of your choosing!

### Requirements
Alright, it’s time to actually build your web application! Here are the requirements:

Display Name: When a user visits your web application for the first time, they should be prompted to type in a display name that will eventually be associated with every message the user sends. If a user closes the page and returns to your app later, the display name should still be remembered.
Channel Creation: Any user should be able to create a new channel, so long as its name doesn’t conflict with the name of an existing channel.
Channel List: Users should be able to see a list of all current channels, and selecting one should allow the user to view the channel. We leave it to you to decide how to display such a list.
Messages View: Once a channel is selected, the user should see any messages that have already been sent in that channel, up to a maximum of 100 messages. Your app should only store the 100 most recent messages per channel in server-side memory.
Sending Messages: Once in a channel, users should be able to send text messages to others the channel. When a user sends a message, their display name and the timestamp of the message should be associated with the message. All users in the channel should then see the new message (with display name and timestamp) appear on their channel page. Sending and receiving messages should NOT require reloading the page.
Remembering the Channel: If a user is on a channel page, closes the web browser window, and goes back to your web application, your application should remember what channel the user was on previously and take the user back to that channel.
Personal Touch: Add at least one additional feature to your chat application of your choosing! Feel free to be creative, but if you’re looking for ideas, possibilities include: supporting deleting one’s own messages, supporting use attachments (file uploads) as messages, or supporting private messaging between two users.
In README.md, include a short writeup describing your project, what’s contained in each file, and (optionally) any other additional information the staff should know about your project. Also, include a description of your personal touch and what you chose to add to the project.
If you’ve added any Python packages that need to be installed in order to run your web application, be sure to add them to requirements.txt!


### Walkthrough
Shlack Application was written and developed using Python/Flask and the client side uses Javascript and SocketIO with Bootstrap to style the page layout.  
1. User set a username at the login screen which is saved in localStorage
2. Once the username has an authenticated by checking all usernames, the User is brought to the main page where they can:
  - create new channels,
  - join existing channels
  - send/receive messages
  - send/receive files
3. On logout the User's current username is removed from localStorage and they are brought to the login screen again.
### Core Files and variables
- application.py -> typically ran during development with python -m flask run command

- SECRET_KEY currently set as 'temp_key' but can be set as anything
- FLASK_APP = application.py
- FLASK_HOST  and FLASK_PORT is set to default
