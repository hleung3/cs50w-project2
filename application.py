import os
import json
import time

from flask import Flask, jsonify, request, redirect,send_from_directory
from flask import render_template, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room

from werkzeug.utils import secure_filename


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["UPLOAD_DIR"] = os.getenv("UPLOAD_DIR")
if not app.config["UPLOAD_DIR"]:
    app.config["UPLOAD_DIR"] = "uploads"
if not os.path.isdir(app.config["UPLOAD_DIR"]):
    os.mkdir(app.config["UPLOAD_DIR"])
if not app.config["SECRET_KEY"]:
    # set a local session secret key string
    app.config["SECRET_KEY"] = "temp_key"
socketio = SocketIO(app)
# sets for channels/messages, names of all logged in users
messages = {}
users_online_global = set()
MESSAGES_LIMIT = 100

@app.route("/",methods=["GET","POST"])
def main():
    # render main page after login
    return render_template("main.html")

@app.route("/login/",methods=["GET","POST"])
def login():
    # render login page
    return render_template("login.html")

@app.route("/logout",methods=["GET","POST"])
def logout():
    # logout and render login page again
    return render_template("login.html")

@app.route("/get-channels/", methods=["POST"])
def get_channels():
    if not messages:
        # return no channel error message
        return jsonify({"message": "no channel"}), 204
    else:
        # pass list of channels back to functions.js/CLIENT
        return jsonify(list(messages.keys()))

@app.route("/get-users/", methods=["POST"])
def get_users():
    # take channel name and find users active in channel
    channel_name = request.form.get("channel_name")
    if channel_name not in messages:
        return jsonify({"message": "channel doesn't exist"}), 404
    elif not messages[channel_name]["users"]:
        return jsonify({"message": "no user"}), 204
    else:
        # return admin and list of users to functions.js/getUsers()
        admin = messages[channel_name]["admin"]
        result = list(messages[channel_name]["users"])
        return jsonify({"users":result,"admin":admin})

@app.route("/get-messages/", methods=["POST"])
def get_messages():
    # get all message sent in channel to functions.js/getMessages()
    channel_name = request.form.get("channel_name")
    if channel_name not in messages:
        return jsonify({"message": "channel doesn't exist"}), 404
    elif not messages[channel_name]["messages"]:
        return jsonify({"message": "no message"}), 204
    else:
        return jsonify(messages[channel_name]["messages"])


@app.route("/users-exist1/", methods=["POST"])
def users_exist():
    # new_user = request.form.get("username")
    print("get_all_users",list(users_online_global))
    return jsonify(list(users_online_global))

@app.route("/receive-file/", methods=["POST"])
def receive_file():
    channel_name = request.form.get("channel_name")
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "empty file name"}), 204

    filename = secure_filename(file.filename)
    new_filename = os.path.join(app.config['UPLOAD_DIR'], filename)
    if os.path.isfile(new_filename):
        # File already exists
        pass

    file.save(new_filename)
    link = "/download/" + filename
    return jsonify({"message": "file saved",
                    "filename": filename,
                    "link": link}), 201


@app.route("/download/<filename>")
def download(filename):
    if not os.path.isfile(os.path.join(app.config['UPLOAD_DIR'], filename)):
        return jsonify({"message": "file not found"}), 404

    return send_from_directory(app.config["UPLOAD_DIR"],
                               filename,
                               as_attachment=True)

@socketio.on("user connected")
def connected(data):
    # when user logs in add name to global dataset
    username = data["username"]
    users_online_global.add(username)
    print(users_online_global)
    message = ", ".join(str(user) for user in users_online_global)
    # emit("show all users",{"message":message},broadcast=True)

@socketio.on("channel created")
def channel_created(data):
    # get channel name from emit data
    print(data)
    channel_name = data["channel_name"]
    username = data["username"]
    print("channel created",channel_name,username)
    # check if channel name is messages dict
    if channel_name not in messages:
        messages[channel_name] = {
            "admin": username,
            "users": set(),
            "messages": []
        }
        # emit response to chat.js announce channel function
        emit("announce channel",
             {"channel_name": channel_name},
             broadcast=True)

@socketio.on("join")
def channel_entered(data):
    # take data from functions.js and add user to channel
    # return message to functions.js when complete
    channel_name = data["channel_name"]
    username = data["username"]
    join_room(channel_name)
    print(messages)
    messages[channel_name]["users"].add(username)
    emit("user joined",
         {"channel_name": channel_name,
          "username": username,
          "timestamp": time.time()},
         room=channel_name)

@socketio.on("leave")
def channel_leaved(data):
    # channel to leave, username
    channel_name = data["channel_name"]
    username = data["username"]
    leave_room(channel_name)
    # remove user from channel
    messages[channel_name]["users"].discard(username)
    # emit user left message to functions.js i.e. user x has left channel y
    emit("user left",
         {"channel_name": channel_name,
          "username": username,
          "timestamp": time.time()},
         room=channel_name)

@socketio.on("user disconnected")
def disconnected(data):
    print("disconnecting")
    username = data["username"]
    channel = data["channel"]
    users_online_global.discard(username)
    messages[channel]["users"].discard(username)
    timestamp = time.time()
    emit("user logout",{"username":username,"channel":channel,
                        "timestamp":timestamp},broadcast=True)

@socketio.on("message sent")
def message_sent(data):
    # gets data from function.js emit on new message
    channel_name = data["channel_name"]
    username = data["username"]
    message = data["message"]
    timestamp = time.time()
    if channel_name not in messages:
        # if no channel add channel - most likely this is admin too
        messages[channel_name] = {
            "admin": username,
            "users": set(),
            "messages": []
        }
    # add new message to list
    messages[channel_name]["messages"].append({
        "username": username,
        "message": message,
        "timestamp": timestamp
    })
    # clear message log if limit is reached (100)
    if len(messages[channel_name]["messages"]) > MESSAGES_LIMIT:
        messages[channel_name]["messages"] = messages[channel_name]["messages"][-MESSAGES_LIMIT:]
    # emit "announce message" to function.js/socket.on() to add to screen
    emit("announce message",
         {"channel_name": channel_name,
          "username": username,
          "message": message,
          "timestamp": timestamp},
         room=channel_name)


@socketio.on("file sent")
def file_sent(data):
    channel_name = data["channel_name"]
    username = data["username"]
    filename = data["filename"]
    link = data["link"]
    timestamp = time.time()
    if channel_name not in messages:
        messages[channel_name] = {
            "users": set(),
            "messages": []
        }
    messages[channel_name]["messages"].append({
        "timestamp": timestamp,
        "username": username,
        "link": link,
        "filename": filename
    })
    if len(messages[channel_name]["messages"]) > MESSAGES_LIMIT:
        messages[channel_name]["messages"] = messages[channel_name]["messages"][-MESSAGES_LIMIT:]
    emit("announce file",
         {"channel_name": channel_name,
          "username": username,
          "timestamp": timestamp,
          "link": link,
          "filename": filename},
         room=channel_name)
