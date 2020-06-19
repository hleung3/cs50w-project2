
// Redirect to login page if username is not in localStorage
if (!localStorage.getItem("username")) {
  window.location.replace("/login/");
};

function addChannelToList(socket, channel_name) {
  // ADD CHANNEL LINK TO CHANNEL LIST

  // select list of channels element
  var ul = document.querySelector("#channels-list");
  // create new li --> add class list-group-item
  const li = document.createElement("li");
  li.classList.add("list-group-item");
  li.classList.add("channel-item");
  ul.appendChild(li);
  // create <a> element -> add class, href, channel name, text
  const a = document.createElement("a");
  a.id = channel_name;
  a.classList.add("collection-item");
  a.classList.add("stretched-link");
  a.href = "#";
  a.dataset.channel = channel_name;
  a.innerText = channel_name;
  // append <a> to list item in list of channels
  li.appendChild(a);
  //  set active channel
  const text = document.querySelector("#no-channel-text");
  text.style.display = "none";
  setOnChannelClick(socket, a);
}

function setOnChannelClick(socket, a) {
  // define onclick behaviour for new <a> element
  // SO THAT CLICKING IT BRINGS YOU TO THE CHANNEL
  console.log("Set channel")
  a.onclick = (e) => {
    // previous channel, clicked channel, username variables
    const old_channel = localStorage.getItem("channel");
    const channel_name = a.dataset.channel;
    const username = localStorage.getItem("username");

    // find channels list - get all <a> link
    const ul = document.querySelector("#channels-list");
    var li = ul.querySelectorAll("li");

    // remove previous active class
    li.forEach((li) => {
      if (li.firstChild.innerText != channel_name) {
        li.firstChild.classList.remove("active");
        li.firstChild.classList.remove("text-white");
        li.classList.remove("bg-dark");
      } else {
        // add formatting for new active class
        li.classList.add("bg-dark");
        // set current <a> to active
        a.classList.add("active");
        a.classList.add("text-white");
      }
    });

    // if there was a prior channel and not the same channel
    if (old_channel != null && old_channel != channel_name) {
      // emit leave prior channel message to server application.py
      socket.emit("leave", {
        "channel_name": old_channel,
        "username": username
      });
    }
    // joined new channel
    socket.emit("join", {
      "channel_name": channel_name,
      "username": username
    });
    // set current channel in localstorage and get history/users
    localStorage.setItem("channel", channel_name);
    console.log(localStorage.getItem("channel"),"set this channel");
    getMessages(channel_name);
    getUsers(channel_name);

    e.preventDefault();
    e.stopPropagation();
  };
}

function updateMessagesScroll(){
    var element = document.querySelector("#messages-list");
    element.scrollTop = element.scrollHeight;
}

function addMessage(timestamp, type, data) {
  //   ADD NEW MESSAGE TO CHANNEL
  var ul, li, div1, div2, span_ts, span_user, span_message, datetime;
  datetime = new Date(timestamp * 1000);
  datetime = datetime.toLocaleString().replace(",", "");

  ul = document.querySelector("#messages-list");
  li = document.createElement("li");
  li.classList.add("list-group-item");
  li.classList.add("border");
  if (type == "message") {
    div1 = document.createElement("div");
    div1.classList.add("message-header");

    span_user = document.createElement("span");
    span_user.classList.add("m-username");
    span_user.innerText = data.username + ">>>";

    span_ts = document.createElement("time");
    span_ts.classList.add("m-timestamp");
    span_ts.setAttribute("datetime", datetime);
    span_ts.innerText = datetime;

    div1.appendChild(span_user);
    div1.appendChild(span_ts);

    div2 = document.createElement("div");
    div2.classList.add("message-body");
    if (data.owner) {
      var strong = document.createElement("strong");
      strong.innerText = data.message;
      div2.appendChild(strong);
    } else {
      div2.innerText = data.message;
    }
    li.appendChild(div1);
    li.appendChild(div2);
  } else if (type == "system") {
    div1 = document.createElement("div");
    div1.classList.add("message-system", "center-align");
    div1.innerText = data.message;

    li.appendChild(div1);
  } else if (type == "file") {
    console.log("new file message")
    div1 = document.createElement("div");
    div1.classList.add("message-header");

    span_user = document.createElement("span");
    span_user.classList.add("m-username");
    span_user.innerText = data.username;

    span_ts = document.createElement("time");
    span_ts.classList.add("m-timestamp");
    span_ts.setAttribute("datetime", datetime);
    span_ts.innerText = datetime;

    div1.appendChild(span_user);
    div1.appendChild(span_ts);

    div2 = document.createElement("div");
    div2.classList.add("message-body");
    if (data.owner) {
      var strong = document.createElement("strong");
      strong.innerText = "File: ";
      div2.appendChild(strong);
    } else {
      div2.innerText = "File: ";
    }
    var a = document.createElement("a");
    a.href = data.link;
    a.dataset.link = data.link;
    a.innerText = data.filename;
    setOnFileClick(a);
    div2.appendChild(a);

    li.appendChild(div1);
    li.appendChild(div2);
  }

  ul.appendChild(li);

  // Scroll to bottom
  updateMessagesScroll();
}

function sendFile(socket) {
  // Send file to server
  if (document.querySelector("#upload-file").value != "") {
    var file = document.querySelector("#upload-file").files[0];

    const request = new XMLHttpRequest();
    request.open("POST", "/receive-file/");

    request.onload = () => {
      if (request.status == 204) {
        // Received empty file name
      }
      if (request.status == 201) {
        // File was saved
        const data = JSON.parse(request.responseText);
        const channel_name = localStorage.getItem("channel");
        const username = localStorage.getItem("username");
        const filename = data.filename;
        const link = data.link;

        socket.emit("file sent", {"channel_name": channel_name, "username": username, "filename": filename, "link": link});
      }
    };

    var data = new FormData();
    data.append("file", file, file.name);
    data.append("channel_name", localStorage.getItem("channel"));
    request.send(data);

  } else {
    // File not specified
  }
}

function setOnFileClick(a) {
  // Set onclick method
  a.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(a.dataset.link , '_blank');
  };
}

function getMessages(channel_name) {
  // Get channel messages
  removeMessages();

  // Check if loaded channel exists
  var element = document.querySelector(`[data-channel='${channel_name}']`);
  // showMessagesBlock(element != null);
  // showNoChannelSelected(element == null);
  if(element != null) {
    const request = new XMLHttpRequest();
    request.open("POST", "/get-messages/");

    request.onload = () => {
      if (request.status == 404) {
        // Channel doesn't exist
      }
      if (request.status == 204) {
        // No messages in the channel
      }
      if (request.status == 200) {
        // Got messages
        const data = JSON.parse(request.responseText);
        data.forEach(message => {
          const owner = (message.username == localStorage.getItem("username"));
          if (message.message === undefined) {
            addMessage(message.timestamp, "file", {"username": message.username,
            "filename": message.filename, "link": message.link, "owner": owner});
          } else {
            addMessage(message.timestamp, "message",
            {"username": message.username, "message": message.message, "owner": owner});
          }
        });
      }
    };

    const data = new FormData();
    data.append("channel_name", channel_name);
    request.send(data);
    return false;
  }
}

function eventFire(el, etype) {
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

function getChannels(socket) {
  // Get channels list from server

  removeChannels();
  removeUsers();

  const request = new XMLHttpRequest();
  request.open("POST", "/get-channels/");

  request.onload = () => {
    if (request.status == 204) {
    } else if (request.status == 200) {
      // Got channels list
      const data = JSON.parse(request.responseText);
      var div = document.querySelector("#channels-list");
      // for each channel name from server reponse - add channel to list
      data.forEach(channel_name => {
        addChannelToList(socket, channel_name);
      });
      // open specified localstorage
      var channel_name = localStorage.getItem("channel");
      var link = document.querySelector(`[data-channel='${channel_name}']`);
      if (channel_name && link != null) {
        console.log("eventfire");
        eventFire(link, "click");
      }
    };
  };
  request.send();
  return false;
}

function getUsers(channel) {
  const request = new XMLHttpRequest();
  request.open("POST", "/get-users/");
  // makea a request to server getusers() - application.py
  request.onload = () => {
    // refresh users list
    removeUsers();

    if ((request.status == 404) || (request.status == 204)) {
      // Channel or user doesn't exist
    }
    else if (request.status == 200) {
      // Get users from python
      const users = JSON.parse(request.responseText)["users"];
      const admin = JSON.parse(request.responseText)["admin"];
      var ul = document.querySelector("#users-list");
      // for each user add list item
      users.forEach(user => {
        var li = document.createElement("li");
        li.classList.add("active");
        li.classList.add("list-group-item");
        li.classList.add("border");
        li.innerText = user;
        if (user == admin) {
          li.innerText += " (Channel Admin)";
          li.style.fontWeight = "bold";
        }
        ul.append(li);
      });
    }
  };
  // return channel users data to application
  const data = new FormData();
  data.append("channel_name", channel);
  request.send(data);
  return false;
}

function removeChannels() {
  // Remove all channels from list
  console.log("AD#")
  var ul = document.querySelector("#channels-list");
  var lis = ul.querySelectorAll("li.channel-item");
  if (lis) {
    lis.forEach((li) => {
      li.remove();
    });
  }
}

function removeMessages() {
  // Remove all messages
  var ul = document.querySelector("#messages-list");
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }
}

function removeUsers() {
  // Remove all messages -- NEED TO UPDATE THIS
  var ul = document.querySelector("#users-list");
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }
}

function toggle(str) {
  const div = document.getElementById(str);
  if (div.style.display == "flex") {
    div.style.display = "none";
  }
  else {
    div.style.display = "flex";
  }
}

// window.alert(localStorage.getItem("username"))
document.addEventListener("DOMContentLoaded", () => {
  // Define socketio
  var socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port);
  // On logout
  document.querySelector("#logout-link").onclick = () => {
    const username = localStorage.getItem("username");
    const channel = localStorage.getItem("channel");
    console.log("logout")
    // Remove localStorage data
    localStorage.removeItem("username");
    localStorage.removeItem("channel");
    socket.emit("user disconnected", {"username": username,
                                      "channel": channel});

    socket.close();
  };
  socket.on("user logout", data => {
    console.log("log out message")
    const username = data.username;
    const channel = data.channel;
    const timestamp = data.timestamp;

    addMessage(timestamp, "system",
    {"message": `${username} has logged out.`});
    getUsers(channel);
  });
  // On connect
  socket.on("connect", () => {
    console.log("connected");
    var username = localStorage.getItem("username");
    var channel_name = localStorage.getItem("channel");
    console.log(username,channel_name);

    const li = document.createElement('li');
    li.innerHTML = "Hello, " + username;
    document.querySelector("#list-options").append(li);

    socket.emit("user connected", {"username": username});

    getChannels(socket);

    document.querySelector("#new-channel-input").onsubmit = () => {
      console.log("make new channel")
      // get new name from input field
      const channel_name = document.querySelector("#new-channel-name").value;
      if (channel_name == "")
        return false;
      var exists = false;
      // check if name exists in document
      document.querySelectorAll("[data-channel]").forEach(el => {
        if (el.dataset.channel.toLowerCase() == channel_name.toLowerCase())
          exists = true;
      });
      // if it exists - return message
      if (exists) {
        alert(`Channel ${channel_name} already exists`);
      }
      else {
        console.log("before username");
        var username = localStorage.getItem("username");
        console.log(username);
        // If channel doesn't exist, emit the message to server (channel_created function)
        socket.emit("channel created", {"channel_name": channel_name, "username": username});
        document.querySelector("#new-channel-name").value = "";
      }
      return false;
    }

    document.querySelector("#new-message").onsubmit = () => {
      const message = document.querySelector("#new-message-text").value;
      if (message == '')
        return false;

      const channel_name = localStorage.getItem("channel");
      const username = localStorage.getItem("username");

      socket.emit("message sent", {
        "channel_name": channel_name,
        "username": username,
        "message": message
      });
      document.querySelector("#new-message-text").value = "";
      return false;
    };

    // On file upload click
    document.querySelector("#upload-file-button").onclick = () => {
      document.querySelector("#upload-file").click();
    };
    // On file choose
    document.querySelector("#upload-file").onchange = () => {
      sendFile(socket);
      socket.emit("send file");
    };
  });


  // when server emits "announce channel" response;
  socket.on("announce channel", data => {
    console.log("announce channel");
    // get new channel name
    const channel_name = data.channel_name;
    // add channel to list
    addChannelToList(socket, channel_name);
  });

  // on user join
  socket.on("user joined", data => {
    const channel_name = data.channel_name;
    const username = data.username;
    const timestamp = data.timestamp;

    getUsers(channel_name);

    addMessage(timestamp, "system",
    {"message": `${username} has joined ${channel_name}`});

  });
  // on user left
  socket.on("user left", data => {
    const channel_name = data.channel_name;

    if (channel_name == null)
      return;

    const username = data.username;
    const timestamp = data.timestamp;
    // refresh users in channel
    getUsers(channel_name);
    // post message to channel
    addMessage(timestamp, "system",
    {"message": `${username} has left ${channel_name}`});
  });
  // on new message received
  socket.on("announce message", data => {
    const username = data.username;
    const message = data.message;
    const timestamp = data.timestamp;
    const owner = (username == localStorage.getItem("username"));
    addMessage(timestamp, "message", {"username": username, "message": message, "owner": owner});
  });

  socket.on("announce file", data => {
    const username = data.username;
    const timestamp = data.timestamp;
    const link = data.link;
    const filename = data.filename;
    console.log("file sent")
    const owner = (username == localStorage.getItem("username"));
    addMessage(timestamp, "file", {"username": username, "filename": filename, "link": link, "owner": owner});
  });
});
