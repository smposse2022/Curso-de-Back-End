import * as dotenv from "dotenv";

const envFile = (process.env.NODE_ENV = ".env.development");

dotenv.config({
  path: envFile,
}); //asigna las variables del archivo .env a process.env {PORT:"",MODO:""}

//creamos la configuracion de nuestra aplicacion
export const config = {
  MONGO_URL: process.env.MONGO_URL,
  MONGO_URL_SESSIONS: process.env.MONGO_URL_SESSIONS,
  MONGO_SESSIONS_CLAVE_SECRETA: process.env.MONGO_SESSIONS_CLAVE_SECRETA,
};
