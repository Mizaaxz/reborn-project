// ==UserScript==
// @name         Meow Sanctuary Connector
// @version      0.1
// @match        http://meow.moomoo.io/*
// @match        https://meow.moomoo.io/*
// ==/UserScript==

(function () {
  if (window.location.protocol !== "http:") {
    window.onbeforeunload = null;
    window.location.protocol = "http:";
    return;
  } // ensures http protocol (won't connect otherwise)
  if (
    window.location.href.includes("?server=") &&
    !window.location.href.includes("?server=12:0:0")
  ) {
    window.onbeforeunload = null;
    window.location = "//" + window.location.host;
  } // ensures on first load theres no server selected. this is to prevent "server full" messages

  let ws = window.WebSocket;
  class Sanctuary extends ws {
    constructor() {
      super("ws://10.190.1.116:3000/moomoo"); // change the websocket to the custom server
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

  document.getElementById("altServer").style.display = "none";
  document.getElementById("serverBrowser").style.display = "none";
  let links = document.getElementById("linksContainer2");

  let loaded = document.createElement("span");
  loaded.className = "material-icons";
  loaded.innerHTML = "check_circle";
  loaded.style["vertical-align"] = "sub";
  loaded.style.color = "#7ee559";

  links.innerHTML = " | " + links.innerHTML;
  links.prepend(loaded);
})();
