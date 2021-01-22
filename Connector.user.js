// ==UserScript==
// @name         Meow Sanctuary Connector
// @description  Connects to Meow's private moomoo server.
// @namespace    http://meow.moomoo.io/
// @version      0.3
// @match        http://meow.moomoo.io/*
// @author       Meow
// @grant        none
// ==/UserScript==

(function () {
  let ws = window.WebSocket;
  class Sanctuary extends ws {
    constructor() {
      super("ws://107.167.84.99:6500/moomoo"); // change the socket to the custom server
    }
  }
  window.WebSocket = Sanctuary;

  // prevent server full messages
  Object.defineProperty(window, "vultr", {
    value: {
      scheme: "mm_prod",
      servers: [
        {
          ip: "_",
          scheme: "mm_prod",
          region: "vultr:12",
          index: 0,
          games: [
            {
              playerCount: 0,
              isPrivate: false,
            },
          ],
        },
      ],
    },
    writable: false,
  });

  let open = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (method) {
    let url = arguments[1];

    if (url) {
      if (url.endsWith("/serverData")) {
        return open.apply(this, [
          "GET",
          "data:application/json;base64,eyJzY2hlbWUiOiJtbV9wcm9kIiwic2VydmVycyI6W3siaXAiOiJfIiwic2NoZW1lIjoibW1fcHJvZCIsInJlZ2lvbiI6InZ1bHRyOjEyIiwiaW5kZXgiOjAsImdhbWVzIjpbeyJwbGF5ZXJDb3VudCI6MCwiaXNQcml2YXRlIjpmYWxzZX1dfV19Cg==",
        ]);
      }
    }

    return open.apply(this, arguments);
  };

  if (
    window.location.href.includes("?server=") &&
    !window.location.href.includes("?server=12:0:0")
  ) {
    // ensures on first load theres no server selected. this is to prevent "server full" messages
    window.location = "//" + window.location.host;
  }

  // removes the server selector
  document.querySelectorAll(".menuHeader").forEach((mh) => {
    if (mh.innerHTML == "Servers") mh.style.display = "none";
  });
  document.getElementById("altServer").style.display = "none";
  document.getElementById("serverBrowser").style.display = "none";
  let links = document.getElementById("linksContainer2");

  let loaded = document.createElement("span");
  loaded.className = "material-icons";
  loaded.innerHTML = "check_circle";
  loaded.style["vertical-align"] = "sub";
  loaded.style.color = "#7ee559";

  links.innerHTML = " | " + links.innerHTML;
  links.prepend(loaded); // adds a green checkmark to the bottom

  window.addEventListener("keypress", function (e) {
    if (e.key == "/") {
      // allows opening of the chat using the "/" key (similar to minecraft)
      let inp = document.getElementById("chatHolder");
      inp.style.display = "block";
      inp.firstElementChild.focus();
    }
  });
})();
