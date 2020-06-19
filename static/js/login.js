const request = new XMLHttpRequest();
var users;
request.open("POST","/users-exist1/");
users = request.onload = () => {
  var status = request.status;
  if (status === 0 || (status >= 200 && status < 400)) {
    users =  JSON.parse(request.response);
    localStorage.setItem("all-users", users);
    return false;
  }
}
request.send();

document.addEventListener("DOMContentLoaded", () => {
  // load existing users to screen and tell user not to pick these
  document.querySelector("#same-user").onclick = (e) => {
    const username = document.querySelector("#user-input").value;
    if (username == "" || username == null) {
      return false;
    }
    localStorage.setItem("username", username);
    localStorage.removeItem("channel");
    window.location.href = "/";
    return false;
  }
  document.querySelector("#username").onsubmit = (event) => {
    const username = document.querySelector("#user-input").value;
    // Save username to localStorage
    var users = localStorage.getItem("all-users").split(",");
    // if username field is blank - nothing happens?
    if (username == "" || username == null) {
      return false;
    } else if (users.includes(username)) {
      // document.querySelector("#user-input").value = "";
      const error = document.querySelector("#error-message");
      error.innerHTML = "User already exists, Are you sure you want to use this name?";
      document.querySelector("#same-user").style.display = "flex";
      return false;
    }
    localStorage.setItem("username", username);
    localStorage.removeItem("channel");
    window.location.href = "/";
    return false;
  }
});
