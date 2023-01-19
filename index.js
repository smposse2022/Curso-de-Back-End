"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.chatWebsocket = exports.listaProductos = undefined;

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _productRouter = require("./routes/productRouter.js");

var _expressHandlebars = require("express-handlebars");

var _expressHandlebars2 = _interopRequireDefault(_expressHandlebars);

var _socket = require("socket.io");

var _contenedorSql = require("./managers/contenedorSql.js");

var _contenedorChat = require("./managers/contenedorChat.js");

var _mySqulConfig = require("./options/mySqulConfig.js");

var _path = require("path");

var _url = require("url");

var _expressSession = require("express-session");

var _expressSession2 = _interopRequireDefault(_expressSession);

var _cookieParser = require("cookie-parser");

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _connectMongo = require("connect-mongo");

var _connectMongo2 = _interopRequireDefault(_connectMongo);

var _passport = require("passport");

var _passport2 = _interopRequireDefault(_passport);

var _mongoose = require("mongoose");

var _mongoose2 = _interopRequireDefault(_mongoose);

var _user = require("./models/user.js");

var _minimist = require("minimist");

var _minimist2 = _interopRequireDefault(_minimist);

var _cluster = require("cluster");

var _cluster2 = _interopRequireDefault(_cluster);

var _os = require("os");

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _asyncToGenerator(fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(
            function (value) {
              step("next", value);
            },
            function (err) {
              step("throw", err);
            }
          );
        }
      }
      return step("next");
    });
  };
}
//const ContenedorWebsocketSqlite = require("./managers/websocket");

//import { normalize, schema } from "normalizr";
//db usuarios

//import { config } from "./config.js";

// Minimist
var optionsMinimist = {
  default: { p: 8080, m: "FORK" },
  alias: { p: "PORT", m: "mode" },
};
var objArguments = (0, _minimist2.default)(
  process.argv.slice(2),
  optionsMinimist
);
var PORT = objArguments.PORT;
var MODO = objArguments.mode;
console.log(objArguments);

// Crear el servidor
var app = (0, _express2.default)();
app.use(_express2.default.json());
//app.use(express.urlencoded({ extended: true }));
//trabajar con archivos estaticos de public
//const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(_express2.default.static(__dirname + "/public"));

//conectamos a la base de datos
_mongoose2.default.connect(
  "mongodb+srv://smposse:coderMongo2022@cluster0.94d5car.mongodb.net/authDB?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  function (error) {
    if (error)
      return console.log("Hubo un error conectandose a la base " + error);
    console.log("conexion a la base de datos de manera exitosa");
  }
);
// lógica Modos Fork y Cluster
if (MODO == "CLUSTER" && _cluster2.default.isPrimary) {
  // si el modo el CLUSTER y si el cluster pertenece al proceso principal
  // creamos los subprocesos que van a pertenecer a ese modo cluster
  var numCpus = _os2.default.cpus().length; // número de núcleos del procesador
  for (var i = 0; i < numCpus; i++) {
    _cluster2.default.fork(); // crea los subprocesos
  }
  _cluster2.default.on("exit", function (worker) {
    console.log(
      "El subproceso " + worker.process.pid + " dej\xF3 de funcionar"
    );
    _cluster2.default.fork();
  });
} else {
  //servidor de express
  var server = app.listen(PORT, function () {
    return console.log(
      "listening on port " + PORT + " on process " + process.pid
    );
  });
  var io = new _socket.Server(server);

  //socket
  io.on(
    "connection",
    (function () {
      var _ref = _asyncToGenerator(
        /*#__PURE__*/ regeneratorRuntime.mark(function _callee3(socket) {
          return regeneratorRuntime.wrap(
            function _callee3$(_context3) {
              while (1) {
                switch ((_context3.prev = _context3.next)) {
                  case 0:
                    console.log("nuevo usuario conectado", socket.id);

                    //enviar todos los productos
                    _context3.t0 = socket;
                    _context3.next = 4;
                    return listaProductos.getAll();

                  case 4:
                    _context3.t1 = _context3.sent;

                    _context3.t0.emit.call(
                      _context3.t0,
                      "products",
                      _context3.t1
                    );

                    //agrego el producto a la lista de productos
                    socket.on(
                      "newProduct",
                      (function () {
                        var _ref2 = _asyncToGenerator(
                          /*#__PURE__*/ regeneratorRuntime.mark(
                            function _callee(data) {
                              return regeneratorRuntime.wrap(
                                function _callee$(_context) {
                                  while (1) {
                                    switch ((_context.prev = _context.next)) {
                                      case 0:
                                        _context.next = 2;
                                        return listaProductos.save(data);

                                      case 2:
                                        _context.t0 = io.sockets;
                                        _context.next = 5;
                                        return listaProductos.getAll();

                                      case 5:
                                        _context.t1 = _context.sent;

                                        _context.t0.emit.call(
                                          _context.t0,
                                          "products",
                                          _context.t1
                                        );

                                      case 7:
                                      case "end":
                                        return _context.stop();
                                    }
                                  }
                                },
                                _callee,
                                undefined
                              );
                            }
                          )
                        );

                        return function (_x2) {
                          return _ref2.apply(this, arguments);
                        };
                      })()
                    );

                    //CHAT
                    //Envio de todos los mensajes al socket que se conecta.
                    _context3.t2 = io.sockets;
                    _context3.next = 10;
                    return chatWebsocket.getAll();

                  case 10:
                    _context3.t3 = _context3.sent;

                    _context3.t2.emit.call(
                      _context3.t2,
                      "messages",
                      _context3.t3
                    );

                    //recibimos el mensaje del usuario y lo guardamos en el archivo chat.txt
                    socket.on(
                      "newMessage",
                      (function () {
                        var _ref3 = _asyncToGenerator(
                          /*#__PURE__*/ regeneratorRuntime.mark(
                            function _callee2(newMsg) {
                              return regeneratorRuntime.wrap(
                                function _callee2$(_context2) {
                                  while (1) {
                                    switch ((_context2.prev = _context2.next)) {
                                      case 0:
                                        _context2.next = 2;
                                        return chatWebsocket.save(newMsg);

                                      case 2:
                                        _context2.t0 = io.sockets;
                                        _context2.next = 5;
                                        return chatWebsocket.getAll();

                                      case 5:
                                        _context2.t1 = _context2.sent;

                                        _context2.t0.emit.call(
                                          _context2.t0,
                                          "messages",
                                          _context2.t1
                                        );

                                      case 7:
                                      case "end":
                                        return _context2.stop();
                                    }
                                  }
                                },
                                _callee2,
                                undefined
                              );
                            }
                          )
                        );

                        return function (_x3) {
                          return _ref3.apply(this, arguments);
                        };
                      })()
                    );

                  case 13:
                  case "end":
                    return _context3.stop();
                }
              }
            },
            _callee3,
            undefined
          );
        })
      );

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    })()
  );
}

//configuracion template engine handlebars
app.engine("handlebars", _expressHandlebars2.default.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

var listaProductos = (exports.listaProductos = new _contenedorSql.ContenedorSql(
  _mySqulConfig.options.mariaDb,
  "products"
));
//const chatWebsocket = new ContenedorSql(options.sqliteDb, "messages");
var chatWebsocket = (exports.chatWebsocket = new _contenedorChat.ContenedorChat(
  "Messages.txt"
));

// configurando almacenamiento de sessions en Mongo Atlas
app.use((0, _cookieParser2.default)());

app.use(
  (0, _expressSession2.default)({
    //definimos el session store
    store: _connectMongo2.default.create({
      mongoUrl:
        "mongodb+srv://smposse:coderMongo2022@cluster0.94d5car.mongodb.net/sessionsDB?retryWrites=true&w=majority",
    }),
    secret: "claveSecreta",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 600000,
    },
  })
);

//configurar passport
app.use(_passport2.default.initialize()); //conectamos a passport con express.
app.use(_passport2.default.session()); //vinculacion entre passport y las sesiones de nuestros usuarios.

//api routes
app.use("/", _productRouter.productsRouter);

//serializar un usuario
_passport2.default.serializeUser(function (user, done) {
  done(null, user.id);
});

//deserializar al usuario
_passport2.default.deserializeUser(function (id, done) {
  //validar si el usuario existe en db.
  _user.UserModel.findById(id, function (err, userFound) {
    return done(err, userFound);
  });
});

/*// normalización
// creamos los schemas
const authorSchema = new schema.Entity("authors", {}, { idAttribute: "mail" });

const messageSchema = new schema.Entity("messages", {
  author: authorSchema,
});

// nuevo objeto para el array-creamos el schema global
const chatSchema = new schema.Entity(
  "chat",
  {
    messages: [messageSchema],
  },
  { idAttribute: "id" }
);

// aplicar la normalización
// creamos una función que normaliza la info, y la podemos llamar para normalizar los datos
const normalizarData = (data) => {
  const normalizeData = normalize(
    { id: "chatHistory", messages: data },
    chatSchema
  );
  return normalizeData;
};

// creamos una función que me entregue los mensajes normalizados
const normalizarMensajes = async () => {
  const result = await chatWebsocket.getAll();
  const messagesNormalized = normalizarData(result);
  //console.log(JSON.stringify(messagesNormalized, null, "\t"));
  return messagesNormalized;
};
*/
//servidor de websocket y lo conectamos con el servidor de express
