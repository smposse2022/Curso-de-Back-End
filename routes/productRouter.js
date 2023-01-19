import express from "express";
import { listaProductos } from "../server.js";
import { chatWebsocket } from "../server.js";
//import { ContenedorSql } from "../managers/contenedorSql.js";
//import { options } from "../options/mySqulConfig.js";
import { ProductsMock } from "../moks/products.js";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local"; //estrategia para autenticar por correo y password.
import { UserModel } from "../models/user.js";
import bcrypt from "bcrypt"; //encriptar las contrase;as
import { fork } from "child_process";
import compression from "compression";
import { logger } from "../logger.js";

const productsRouter = express.Router();

//const listaProductos = new ContenedorSql(options.mariaDb, "products");
const productsRandom = new ProductsMock();

/*const checkUserLogged = (req, res, next) => {
  if (req.session.username) {
    next();
  } else {
    res.redirect("/login");
  }
};*/

//crear una funcion para encriptar la contrase;
const createHash = (password) => {
  const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  return hash;
};

//estrategia de registro utilizando passport local.
passport.use(
  "signupStrategy",
  new LocalStrategy(
    {
      passReqToCallback: true,
      usernameField: "email",
    },
    (req, username, password, done) => {
      //logica para registrar al usuario
      //verificar si el usuario exitse en db
      UserModel.findOne({ username: username }, (error, userFound) => {
        if (error) return done(error, null, { message: "Hubo un error" });
        if (userFound)
          return done(null, null, { message: "El usuario ya existe" });
        //guardamos el usuario en la db
        const newUser = {
          name: req.body.name,
          username: username,
          password: createHash(password),
        };
        UserModel.create(newUser, (error, userCreated) => {
          if (error)
            return done(error, null, {
              message: "Hubo un error al registrar el usuario",
            });
          return done(null, userCreated);
        });
      });
    }
  )
);
const isValidPassword = function (user, password) {
  return bcrypt.compareSync(password, user.password);
};

// passport/login.js
passport.use(
  "loginStrategy",
  new LocalStrategy(
    {
      passReqToCallback: true,
      usernameField: "email",
    },
    (req, username, password, done) => {
      // chekea en Mongo si el usuario con el username indicado existe
      UserModel.findOne({ username: username }, (err, user) => {
        if (err) return done(err);
        // Si no se encuentra
        if (!user) {
          logger.info("No se encontró el usuario con el username " + username);
          return done(err, null, {
            message: "Usuario no encontrado",
          });
        }
        // El usuario existe pero la contraseña no coincide
        if (!isValidPassword(user, password)) {
          logger.info("Password invalido");
          return done(err, null, {
            message: "Password invalido",
          });
        }
        // El usuario y la contraseña coinciden
        return done(null, user);
      });
    }
  )
);

productsRouter.get("/favicon.ico", (req, res) => {
  return "your faveicon";
});

productsRouter.get("/", async (req, res) => {
  const productos = await listaProductos.getAll();
  const messages = await chatWebsocket.getAll();
  if (req.session.passport) {
    const usuario = await UserModel.findOne({ _id: req.session.passport.user });
    logger.info("Acceso a ruta home con usuario registrado");
    res.render("home", { user: usuario.name });
  } else {
    logger.info("Acceso a ruta home sin usuario registrado");
    res.render("home", { user: "Invitado" });
  }
});

productsRouter.get("/registro", (req, res) => {
  if (req.isAuthenticated()) {
    logger.info("Redirigido a home");
    res.redirect("/");
  } else {
    const errorMessage = req.session.messages ? req.session.messages[0] : "";
    logger.info("Redirigido a Signup");
    res.render("signup", { error: errorMessage });
    req.session.messages = [];
  }
});

productsRouter.get("/inicio-sesion", (req, res) => {
  if (req.isAuthenticated()) {
    logger.info("Redirigido a home");
    res.redirect("/");
  } else {
    logger.info("Redirigido a login");
    res.render("login");
  }
});

productsRouter.get("/perfil", (req, res) => {
  if (req.isAuthenticated()) {
    logger.info("Acceso a perfil");
    res.render("profile");
  } else {
    res.send(
      "<div>Debes <a href='/inicio-sesion'>inciar sesion</a> o <a href='/registro'>registrarte</a></div>"
    );
  }
});

//rutas de autenticacion registro
productsRouter.post(
  "/signup",
  passport.authenticate("signupStrategy", {
    failureRedirect: "/registro",
    failureMessage: true, //req.sessions.messages.
  }),
  (req, res) => {
    logger.info("Redirigido a perfil");
    res.redirect("/perfil");
  }
);

//ruta de autenticacion login
productsRouter.post(
  "/login",
  passport.authenticate("loginStrategy", {
    failureRedirect: "/login",
    failureMessage: true, //req.sessions.messages.
  }),
  (req, res) => {
    logger.info("Redirigido a perfil");
    res.redirect("/perfil");
  }
);

/*productsRouter.post("/login", (req, res) => {
  const user = req.body;
  //el usuario existe
  const userExists = users.find((elm) => elm.email === user.email);
  if (userExists) {
    //validar la contrase;a
    if (userExists.password === user.password) {
      req.session.user = user;
      res.redirect("/perfil");
    } else {
      res.redirect("/inicio-sesion");
    }
  } else {
    res.redirect("/registro");
  }
});*/

//ruta de logout con passport
productsRouter.get("/logout", (req, res) => {
  logger.info("Desloguear");
  req.logout((err) => {
    if (err) return res.send("hubo un error al cerrar sesion");
    req.session.destroy();
    logger.info("Desloguear y redirigir a home");
    res.redirect("/");
  });
});

productsRouter.get("/logout", (req, res) => {
  logger.info("Desloguear");
  req.session.destroy();
  logger.info("Desloguear y redirigir a home");
  res.send("sesion finalizada");
  res.redirect("/");
});

// Ruta contar numeros No bloqueante
// ?cant=x     - Query param
productsRouter.get("/randoms", (req, res) => {
  logger.info("Acceso a Ruta randoms");
  let { cant } = req.query;
  if (!cant) {
    cant = 1000000;
  }
  if (cant < 1 || cant > 1e10) {
    logger.error("Parámetro ingresado inválido");
    res.send("Debe ingresar por parámetro un valor entre 1 y 10.000.000.000");
  }
  const child = fork("./child.js");
  //recibimos mensajes del proceso hijo
  child.on("message", (childMsg) => {
    if (childMsg === "listo") {
      //recibimos notificacion del proceso hijo, y le mandamos un mensaje para que comience a operar.
      child.send({ message: "Iniciar", cant: cant });
    } else {
      res.send({ resultado: childMsg });
    }
  });
});

// Ruta info - process
productsRouter.get("/info", (req, res) => {
  logger.info("Acceso a Ruta info");
  const info = {
    argumentosDeEntrada: process.cwd(),
    plataforma: process.platform,
    nodeVersion: process.version,
    memory: process.memoryUsage(),
    path: process.argv[0],
    id: process.pid,
    carpeta: process.argv[1],
  };
  console.log(info);
  res.status(200).json(info);
});

// Ruta info Compression
productsRouter.get("/infoCompression", compression(), (req, res) => {
  logger.info("Acceso a Ruta infoCompression");
  const info = {
    argumentosDeEntrada: process.cwd(),
    plataforma: process.platform,
    nodeVersion: process.version,
    memory: process.memoryUsage(),
    path: process.argv[0],
    id: process.pid,
    carpeta: process.argv[1],
  };
  res.status(200).json(info);
});

// Rutas Moks
// ?cant=5     - Query param
productsRouter.post("/generar-productos", (req, res) => {
  logger.info("Acceso a Ruta generar-productos");
  const { cant } = req.query;
  let result = productsRandom.populate(parseInt(cant));
  res.send(result);
});

productsRouter.get("/productos-test", (req, res) => {
  logger.info("Acceso a Ruta productos-test");
  res.render("productosTest", { products: productsRandom.getAll() });
});

productsRouter.get("/productos/:id", async (req, res) => {
  const productId = req.params.id;
  const product = await listaProductos.getById(parseInt(productId));
  if (product) {
    return res.send(product);
  } else {
    return res.redirect("/");
  }
});

productsRouter.put("/productos/:id", async (req, res) => {
  logger.info("Acceso a actualizar filtrado por id");
  const cambioObj = req.body;
  const productId = req.params.id;
  const result = await listaProductos.updateById(
    parseInt(productId),
    cambioObj
  );
  res.send(result);
});

productsRouter.delete("/productos/:id", async (req, res) => {
  logger.info("Borrar producto por id");
  const productId = req.params.id;
  const result = await listaProductos.deleteById(parseInt(productId));
  res.send(result);
});

productsRouter.get("*", (req, res) => {
  logger.warn("Se intentó acceder a una ruta inexistente");
  res.redirect("/");
});

export { productsRouter };
//comandos
// curl -X GET "http://localhost:8080/xxx"

//profiling commands
// node --prof server.js

//artillery quick --count 20 -n 50 http://localhost:8080/info > result_info.txt

//compilacion de archivos isolate
// node --prof-process src/isolate-info.log > result_prof_info.txt
