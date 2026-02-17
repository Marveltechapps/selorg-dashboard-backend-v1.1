"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _supertest = _interopRequireDefault(require("supertest"));
var _app = require("../../app.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Mock authentication middleware
jest.mock("../../middleware/authenticate.js", function () {
  return {
    authenticate: function authenticate(req, res, next) {
      req.user = {
        id: "test-rider-123",
        phoneNumber: "+1234567890"
      };
      next();
    }
  };
});

// Mock order service
jest.mock("../../modules/orders/order.service.js", function () {
  return {
    getOrderById: jest.fn(),
    listOrders: jest.fn(),
    markOrderPicked: jest.fn(),
    markOrderOutForDelivery: jest.fn(),
    markOrderDelivered: jest.fn(),
    acceptOrder: jest.fn(),
    rejectOrder: jest.fn()
  };
});
describe("Order Routes", function () {
  var app;
  beforeEach(function () {
    app = (0, _app.createApp)();
    jest.clearAllMocks();
  });
  describe("GET /api/admin/orders", function () {
    it("should return 200 with orders list", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var _yield$import, listOrders, response;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import = _context.v;
            listOrders = _yield$import.listOrders;
            listOrders.mockResolvedValue([{
              _id: "order-1",
              status: "assigned"
            }, {
              _id: "order-2",
              status: "picked"
            }]);
            _context.n = 2;
            return (0, _supertest["default"])(app).get("/api/admin/orders").expect(200);
          case 2:
            response = _context.v;
            expect(response.body).toHaveProperty("orders");
            expect(response.body).toHaveProperty("count");
            expect(Array.isArray(response.body.orders)).toBe(true);
          case 3:
            return _context.a(2);
        }
      }, _callee);
    })));
    it("should return 401 when not authenticated", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var appNoAuth, response;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            // Create app without auth middleware for this test
            appNoAuth = (0, _app.createApp)(); // Remove auth from this specific route for test
            _context2.n = 1;
            return (0, _supertest["default"])(appNoAuth).get("/api/admin/orders").expect(401);
          case 1:
            response = _context2.v;
            expect(response.body).toHaveProperty("error");
            expect(response.body).toHaveProperty("code", "AUTH_FAILED");
          case 2:
            return _context2.a(2);
        }
      }, _callee2);
    })));
    it("should filter by status query parameter", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      var _yield$import2, listOrders;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            _context3.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import2 = _context3.v;
            listOrders = _yield$import2.listOrders;
            listOrders.mockResolvedValue([{
              _id: "order-1",
              status: "assigned"
            }]);
            _context3.n = 2;
            return (0, _supertest["default"])(app).get("/api/admin/orders?status=assigned").expect(200);
          case 2:
            expect(listOrders).toHaveBeenCalledWith(expect.objectContaining({
              status: "assigned",
              riderId: "test-rider-123"
            }));
          case 3:
            return _context3.a(2);
        }
      }, _callee3);
    })));
  });
  describe("GET /api/orders/:orderId", function () {
    it("should return 200 with order details", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
      var _yield$import3, getOrderById, response;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            _context4.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import3 = _context4.v;
            getOrderById = _yield$import3.getOrderById;
            getOrderById.mockResolvedValue({
              _id: "order-1",
              status: "assigned",
              riderAssignment: {
                riderId: "test-rider-123"
              }
            });
            _context4.n = 2;
            return (0, _supertest["default"])(app).get("/api/orders/order-1").expect(200);
          case 2:
            response = _context4.v;
            expect(response.body).toHaveProperty("order");
            expect(response.body.order._id).toBe("order-1");
          case 3:
            return _context4.a(2);
        }
      }, _callee4);
    })));
    it("should return 404 when order not found", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
      var _yield$import4, getOrderById, response;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.n) {
          case 0:
            _context5.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import4 = _context5.v;
            getOrderById = _yield$import4.getOrderById;
            getOrderById.mockResolvedValue(null);
            _context5.n = 2;
            return (0, _supertest["default"])(app).get("/api/orders/non-existent").expect(404);
          case 2:
            response = _context5.v;
            expect(response.body).toHaveProperty("error", "Order not found");
          case 3:
            return _context5.a(2);
        }
      }, _callee5);
    })));
    it("should return 403 when rider doesn't own the order", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
      var _yield$import5, getOrderById, response;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.n) {
          case 0:
            _context6.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import5 = _context6.v;
            getOrderById = _yield$import5.getOrderById;
            getOrderById.mockResolvedValue({
              _id: "order-1",
              riderAssignment: {
                riderId: "other-rider"
              }
            });
            _context6.n = 2;
            return (0, _supertest["default"])(app).get("/api/orders/order-1").expect(403);
          case 2:
            response = _context6.v;
            expect(response.body).toHaveProperty("error", "Access denied");
          case 3:
            return _context6.a(2);
        }
      }, _callee6);
    })));
  });
  describe("POST /api/orders/:orderId/accept", function () {
    it("should return 200 when order is accepted", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
      var _yield$import6, acceptOrder, response;
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.n) {
          case 0:
            _context7.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import6 = _context7.v;
            acceptOrder = _yield$import6.acceptOrder;
            acceptOrder.mockResolvedValue({
              _id: "order-1",
              status: "assigned",
              riderAssignment: {
                acceptedAt: new Date()
              }
            });
            _context7.n = 2;
            return (0, _supertest["default"])(app).post("/api/orders/order-1/accept").expect(200);
          case 2:
            response = _context7.v;
            expect(response.body).toHaveProperty("order");
          case 3:
            return _context7.a(2);
        }
      }, _callee7);
    })));
    it("should return 404 when order not found", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
      var _yield$import7, acceptOrder, response;
      return _regenerator().w(function (_context8) {
        while (1) switch (_context8.n) {
          case 0:
            _context8.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import7 = _context8.v;
            acceptOrder = _yield$import7.acceptOrder;
            acceptOrder.mockResolvedValue(null);
            _context8.n = 2;
            return (0, _supertest["default"])(app).post("/api/orders/non-existent/accept").expect(404);
          case 2:
            response = _context8.v;
            expect(response.body).toHaveProperty("error", "Order not found");
          case 3:
            return _context8.a(2);
        }
      }, _callee8);
    })));
  });
  describe("POST /api/orders/:orderId/pick", function () {
    it("should return 200 when order is picked", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9() {
      var _yield$import8, markOrderPicked, response;
      return _regenerator().w(function (_context9) {
        while (1) switch (_context9.n) {
          case 0:
            _context9.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import8 = _context9.v;
            markOrderPicked = _yield$import8.markOrderPicked;
            markOrderPicked.mockResolvedValue({
              _id: "order-1",
              status: "picked"
            });
            _context9.n = 2;
            return (0, _supertest["default"])(app).post("/api/orders/order-1/pick").expect(200);
          case 2:
            response = _context9.v;
            expect(response.body).toHaveProperty("order");
          case 3:
            return _context9.a(2);
        }
      }, _callee9);
    })));
    it("should return 400 when order cannot be picked", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0() {
      var _yield$import9, markOrderPicked, response;
      return _regenerator().w(function (_context0) {
        while (1) switch (_context0.n) {
          case 0:
            _context0.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import9 = _context0.v;
            markOrderPicked = _yield$import9.markOrderPicked;
            markOrderPicked.mockRejectedValue(new Error("Order cannot be picked. Current status: delivered"));
            _context0.n = 2;
            return (0, _supertest["default"])(app).post("/api/orders/order-1/pick").expect(400);
          case 2:
            response = _context0.v;
            expect(response.body).toHaveProperty("error");
          case 3:
            return _context0.a(2);
        }
      }, _callee0);
    })));
  });
  describe("Error Handling", function () {
    it("should return 500 with error code on internal error", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1() {
      var _yield$import0, listOrders, response;
      return _regenerator().w(function (_context1) {
        while (1) switch (_context1.n) {
          case 0:
            _context1.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("../../modules/orders/order.service.js"));
            });
          case 1:
            _yield$import0 = _context1.v;
            listOrders = _yield$import0.listOrders;
            listOrders.mockRejectedValue(new Error("Database error"));
            _context1.n = 2;
            return (0, _supertest["default"])(app).get("/api/admin/orders").expect(500);
          case 2:
            response = _context1.v;
            expect(response.body).toHaveProperty("error");
            expect(response.body).toHaveProperty("code", "INTERNAL_ERROR");
            expect(response.body).toHaveProperty("path");
          case 3:
            return _context1.a(2);
        }
      }, _callee1);
    })));
  });
});