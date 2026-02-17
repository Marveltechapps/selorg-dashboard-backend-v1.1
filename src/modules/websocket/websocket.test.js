"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runAllTests = runAllTests;
exports.testWebSocketConnection = testWebSocketConnection;
exports.testWebSocketMessage = testWebSocketMessage;
exports.testWebSocketPingPong = testWebSocketPingPong;
var _ws = require("ws");
var _websocketService = require("./websocket.service.js");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /**
 * WebSocket Server Test Utilities
 * 
 * This file contains test utilities and examples for testing WebSocket functionality.
 * Run these tests manually or integrate with your test framework.
 */
/**
 * Test WebSocket connection
 */
function testWebSocketConnection() {
  return _testWebSocketConnection.apply(this, arguments);
}
/**
 * Test WebSocket message receiving
 */
function _testWebSocketConnection() {
  _testWebSocketConnection = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var baseUrl,
      riderId,
      _args = arguments;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          baseUrl = _args.length > 0 && _args[0] !== undefined ? _args[0] : "ws://localhost:5001";
          riderId = _args.length > 1 && _args[1] !== undefined ? _args[1] : "test-rider-123";
          return _context.a(2, new Promise(function (resolve) {
            var url = "".concat(baseUrl, "/ws?userId=").concat(riderId, "&userType=rider");
            console.log("[Test] Connecting to: ".concat(url));
            var ws = new _ws.WebSocket(url);
            var timeout = setTimeout(function () {
              console.error("[Test] Connection timeout");
              ws.close();
              resolve(false);
            }, 5000);
            ws.on("open", function () {
              console.log("[Test] ✅ WebSocket connected successfully");
              clearTimeout(timeout);
              ws.close();
              resolve(true);
            });
            ws.on("error", function (error) {
              console.error("[Test] ❌ WebSocket connection error:", error);
              clearTimeout(timeout);
              resolve(false);
            });
            ws.on("close", function (code, reason) {
              console.log("[Test] Connection closed: ".concat(code, " - ").concat(reason.toString()));
            });
          }));
      }
    }, _callee);
  }));
  return _testWebSocketConnection.apply(this, arguments);
}
function testWebSocketMessage() {
  return _testWebSocketMessage.apply(this, arguments);
}
/**
 * Test WebSocket ping/pong
 */
function _testWebSocketMessage() {
  _testWebSocketMessage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
    var baseUrl,
      riderId,
      _args2 = arguments;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          baseUrl = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : "ws://localhost:5001";
          riderId = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : "test-rider-123";
          return _context2.a(2, new Promise(function (resolve) {
            var url = "".concat(baseUrl, "/ws?userId=").concat(riderId, "&userType=rider");
            console.log("[Test] Testing message receiving: ".concat(url));
            var ws = new _ws.WebSocket(url);
            var messageReceived = false;
            var timeout = setTimeout(function () {
              console.error("[Test] Message test timeout");
              ws.close();
              resolve(messageReceived);
            }, 10000);
            ws.on("open", function () {
              console.log("[Test] ✅ Connected, waiting for messages...");

              // Send a test message after connection
              setTimeout(function () {
                // Simulate sending a notification
                _websocketService.webSocketService.notifyOrderAssignment(riderId, {
                  orderId: "test-order-123",
                  orderNumber: "ORD-001"
                });
              }, 1000);
            });
            ws.on("message", function (data) {
              try {
                var message = JSON.parse(data.toString());
                console.log("[Test] ✅ Message received:", message);
                if (message.type === "order_assignment_update" || message.type === "connected") {
                  messageReceived = true;
                }
              } catch (error) {
                console.error("[Test] Error parsing message:", error);
              }
            });
            ws.on("error", function (error) {
              console.error("[Test] ❌ Error:", error);
              clearTimeout(timeout);
              resolve(false);
            });
            ws.on("close", function () {
              clearTimeout(timeout);
              resolve(messageReceived);
            });
          }));
      }
    }, _callee2);
  }));
  return _testWebSocketMessage.apply(this, arguments);
}
function testWebSocketPingPong() {
  return _testWebSocketPingPong.apply(this, arguments);
}
/**
 * Run all WebSocket tests
 */
function _testWebSocketPingPong() {
  _testWebSocketPingPong = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
    var baseUrl,
      riderId,
      _args3 = arguments;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          baseUrl = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : "ws://localhost:5001";
          riderId = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : "test-rider-123";
          return _context3.a(2, new Promise(function (resolve) {
            var url = "".concat(baseUrl, "/ws?userId=").concat(riderId, "&userType=rider");
            console.log("[Test] Testing ping/pong: ".concat(url));
            var ws = new _ws.WebSocket(url);
            var pongReceived = false;
            var timeout = setTimeout(function () {
              console.error("[Test] Ping/pong test timeout");
              ws.close();
              resolve(pongReceived);
            }, 10000);
            ws.on("open", function () {
              console.log("[Test] ✅ Connected, sending ping...");

              // Send ping message
              ws.send(JSON.stringify({
                type: "ping",
                payload: {},
                timestamp: new Date().toISOString()
              }));
            });
            ws.on("message", function (data) {
              try {
                var message = JSON.parse(data.toString());
                console.log("[Test] Message received:", message.type);
                if (message.type === "pong") {
                  console.log("[Test] ✅ Pong received!");
                  pongReceived = true;
                  clearTimeout(timeout);
                  ws.close();
                  resolve(true);
                }
              } catch (error) {
                console.error("[Test] Error parsing message:", error);
              }
            });
            ws.on("error", function (error) {
              console.error("[Test] ❌ Error:", error);
              clearTimeout(timeout);
              resolve(false);
            });
            ws.on("close", function () {
              clearTimeout(timeout);
              resolve(pongReceived);
            });
          }));
      }
    }, _callee3);
  }));
  return _testWebSocketPingPong.apply(this, arguments);
}
function runAllTests() {
  return _runAllTests.apply(this, arguments);
} // Allow running tests directly
function _runAllTests() {
  _runAllTests = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
    var baseUrl,
      testRiderId,
      connectionTest,
      messageTest,
      pingPongTest,
      _args4 = arguments;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.n) {
        case 0:
          baseUrl = _args4.length > 0 && _args4[0] !== undefined ? _args4[0] : "ws://localhost:5001";
          console.log("🧪 Starting WebSocket tests...\n");
          testRiderId = "test-rider-".concat(Date.now());
          console.log("Test 1: Connection Test");
          _context4.n = 1;
          return testWebSocketConnection(baseUrl, testRiderId);
        case 1:
          connectionTest = _context4.v;
          console.log("Result: ".concat(connectionTest ? "✅ PASS" : "❌ FAIL", "\n"));
          _context4.n = 2;
          return new Promise(function (resolve) {
            return setTimeout(resolve, 1000);
          });
        case 2:
          console.log("Test 2: Message Test");
          _context4.n = 3;
          return testWebSocketMessage(baseUrl, testRiderId);
        case 3:
          messageTest = _context4.v;
          console.log("Result: ".concat(messageTest ? "✅ PASS" : "❌ FAIL", "\n"));
          _context4.n = 4;
          return new Promise(function (resolve) {
            return setTimeout(resolve, 1000);
          });
        case 4:
          console.log("Test 3: Ping/Pong Test");
          _context4.n = 5;
          return testWebSocketPingPong(baseUrl, testRiderId);
        case 5:
          pingPongTest = _context4.v;
          console.log("Result: ".concat(pingPongTest ? "✅ PASS" : "❌ FAIL", "\n"));
          console.log("📊 Test Summary:");
          console.log("  Connection: ".concat(connectionTest ? "✅" : "❌"));
          console.log("  Messages: ".concat(messageTest ? "✅" : "❌"));
          console.log("  Ping/Pong: ".concat(pingPongTest ? "✅" : "❌"));
          return _context4.a(2, {
            connection: connectionTest,
            messages: messageTest,
            pingPong: pingPongTest,
            allPassed: connectionTest && messageTest && pingPongTest
          });
      }
    }, _callee4);
  }));
  return _runAllTests.apply(this, arguments);
}
if (require.main === module) {
  var baseUrl = process.env.WS_BASE_URL || "ws://localhost:5001";
  runAllTests(baseUrl).then(function (results) {
    process.exit(results.allPassed ? 0 : 1);
  })["catch"](function (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  });
}