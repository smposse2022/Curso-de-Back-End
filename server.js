import express from "express";
import { productsRouter } from "./routes/productRouter.js";
import handlebars from "express-handlebars";
import { Server } from "socket.io";
import { ContenedorSql } from "./managers/contenedorSql.js";
import { ContenedorChat } from "./managers/contenedorChat.js";
//const ContenedorWebsocketSqlite = require("./managers/websocket");
import { options } from "./options/mySqulConfig.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
//import { normalize, schema } from "normalizr";
import session from "express-session";
import cookieParser from "cookie-parser";
import MongoStore from "connect-mongo";
import passport from "passport";
import mongoose from "mongoose"; //db usuarios
import { UserModel } from "./models/user.js";
import { config } from "./config.js";
import parsedArgs from "minimist";
import cluster from "cluster";
import os from "os";
import { logger } from "./logger.js";

// Minimist
const optionsMinimist = {
  default: { p: 8080, m: "FORK" },
  alias: { p: "PORT", m: "mode" },
};
const objArguments = parsedArgs(process.argv.slice(2), optionsMinimist);
const PORT = objArguments.PORT;
const MODO = objArguments.mode;
//console.log(objArguments);

// Crear el servidor
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//trabajar con archivos estaticos de public
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname + "/public"));

//conectamos a la base de datos
mongoose.connect(
  "mongodb+srv://smposse:coderMongo2022@cluster0.94d5car.mongodb.net/authDB?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (error) => {
    if (error)
      return logger.error(`Hubo un error conectandose a la base ${error}`);
    logger.info("conexion a la base de datos de manera exitosa");
  }
);
// lógica Modos Fork y Cluster
if (MODO == "CLUSTER" && cluster.isPrimary) {
  // si el modo el CLUSTER y si el cluster pertenece al proceso principal
  // creamos los subprocesos que van a pertenecer a ese modo cluster
  const numCpus = os.cpus().length; // número de núcleos del procesador
  for (let i = 0; i < numCpus; i++) {
    cluster.fork(); // crea los subprocesos
  }
  cluster.on("exit", (worker) => {
    logger.info(`El subproceso ${worker.process.pid} dejó de funcionar`);
    cluster.fork();
  });
} else {
  //servidor de express
  const server = app.listen(PORT, () =>
    logger.info(`listening on port ${PORT} on process ${process.pid}`)
  );
  const io = new Server(server);

  //socket
  io.on("connection", async (socket) => {
    logger.info("nuevo usuario conectado", socket.id);

    //enviar todos los productos
    socket.emit("products", await listaProductos.getAll());

    //agrego el producto a la lista de productos
    socket.on("newProduct", async (data) => {
      const info = await listaProductos.save(data);
      logger.info(info);
      //envío la lista de productos actualizada a todos los sockets
      io.sockets.emit("products", await listaProductos.getAll());
    });

    //CHAT
    //Envio de todos los mensajes al socket que se conecta.
    io.sockets.emit("messages", await chatWebsocket.getAll());

    //recibimos el mensaje del usuario y lo guardamos en el archivo chat.txt
    socket.on("newMessage", async (newMsg) => {
      await chatWebsocket.save(newMsg);

      io.sockets.emit("messages", await chatWebsocket.getAll());
    });
  });
}

//configuracion template engine handlebars
app.engine("handlebars", handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

export const listaProductos = new ContenedorSql(options.mariaDb, "products");
//const chatWebsocket = new ContenedorSql(options.sqliteDb, "messages");
export const chatWebsocket = new ContenedorChat("Messages.txt");

// configurando almacenamiento de sessions en Mongo Atlas
app.use(cookieParser());

app.use(
  session({
    //definimos el session store
    store: MongoStore.create({
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
app.use(passport.initialize()); //conectamos a passport con express.
app.use(passport.session()); //vinculacion entre passport y las sesiones de nuestros usuarios.

//api routes
app.use("/", productsRouter);

//serializar un usuario
passport.serializeUser((user, done) => {
  done(null, user.id);
});

//deserializar al usuario
passport.deserializeUser((id, done) => {
  //validar si el usuario existe en db.
  UserModel.findById(id, (err, userFound) => {
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
