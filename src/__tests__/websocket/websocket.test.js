"use strict";

var _ws = require("ws");
var _http = require("http");
var _websocketServer = require("../../modules/websocket/websocket.server.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
describe("WebSocket Server", function () {
  var server;
  var port = 5002; // Use different port for tests

  beforeAll(function (done) {
    server = (0, _http.createServer)();
    _websocketServer.webSocketServer.initialize(server);
    server.listen(port, function () {
      done();
    });
  });
  afterAll(function (done) {
    _websocketServer.webSocketServer.shutdown();
    server.close(function () {
      done();
    });
  });
  describe("Connection", function () {
    it("should accept valid WebSocket connection", function (done) {
      var ws = new _ws.WebSocket("ws://localhost:".concat(port, "/ws?userId=test-rider-123&userType=rider"));
      ws.on("open", function () {
        expect(_websocketServer.webSocketServer.getConnectionCount()).toBeGreaterThan(0);
        ws.close();
        done();
      });
      ws.on("error", function (error) {
        done(error);
      });
    });
    it("should reject connection without userId", function (done) {
      var ws = new _ws.WebSocket("ws://localhost:".concat(port, "/ws?userType=rider"));
      ws.on("error", function () {
        // Expected to fail
        ws.close();
        done();
      });
      ws.on("open", function () {
        done(new Error("Connection should have been rejected"));
      });
    });
    it("should reject connection with invalid userType", function (done) {
      var ws = new _ws.WebSocket("ws://localhost:".concat(port, "/ws?userId=test-123&userType=invalid"));
      ws.on("error", function () {
        // Expected to fail
        ws.close();
        done();
      });
      ws.on("open", function () {
        done(new Error("Connection should have been rejected"));
      });
    });
  });
  describe("Messaging", function () {
    it("should handle ping messages", function (done) {
      var ws = new _ws.WebSocket("ws://localhost:".concat(port, "/ws?userId=test-rider-456&userType=rider"));
      ws.on("open", function () {
        ws.send(JSON.stringify({
          type: "ping",
          payload: {},
          timestamp: new Date().toISOString()
        }));
        ws.on("message", function (data) {
          var message = JSON.parse(data.toString());
          if (message.type === "pong") {
            ws.close();
            done();
          }
        });
      });
      ws.on("error", function (error) {
        done(error);
      });
    });
    it("should send welcome message on connection", function (done) {
      var ws = new _ws.WebSocket("ws://localhost:".concat(port, "/ws?userId=test-rider-789&userType=rider"));
      ws.on("open", function () {
        // Wait for welcome message
        setTimeout(function () {
          ws.close();
          done();
        }, 100);
      });
      ws.on("message", function (data) {
        var message = JSON.parse(data.toString());
        if (message.type === "connected") {
          expect(message.payload).toHaveProperty("message");
          done();
        }
      });
      ws.on("error", function (error) {
        done(error);
      });
    });
  });
  describe("Reconnection", function () {
    it("should close existing connection when rider reconnects", function (done) {
      var riderId = "test-rider-reconnect";
      var ws1 = new _ws.WebSocket("ws://localhost:".concat(port, "/ws?userId=").concat(riderId, "&userType=rider"));
      ws1.on("open", function () {
        var ws2 = new _ws.WebSocket("ws://localhost:".concat(port, "/ws?userId=").concat(riderId, "&userType=rider"));
        ws2.on("open", function () {
          // First connection should be closed
          expect(ws1.readyState).toBe(_ws.WebSocket.CLOSED);
          ws2.close();
          done();
        });
      });
    });
  });
  describe("Health Check", function () {
    it("should report connection count", function () {
      var count = _websocketServer.webSocketServer.getConnectionCount();
      expect(_typeof(count)).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
    it("should check if rider is connected", function () {
      var isConnected = _websocketServer.webSocketServer.isRiderConnected("test-rider-123");
      expect(_typeof(isConnected)).toBe("boolean");
    });
  });
});