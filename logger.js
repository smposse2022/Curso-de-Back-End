import log4js from "log4js";

//configuracion de log4js
log4js.configure({
  appenders: {
    //definir las salidas de datos
    consola: { type: "console" },
    archivoWarn: { type: "file", filename: "logs/warn.log" },
    archivoErrores: { type: "file", filename: "logs/errores.log" },
    //salidas con niveles definidos
    loggerConsola: {
      type: "logLevelFilter",
      appender: "consola",
      level: "info",
    },
    loggerWarn: {
      type: "logLevelFilter",
      appender: "archivoWarn",
      level: "warn",
    },
    loggerErrores: {
      type: "logLevelFilter",
      appender: "archivoErrores",
      level: "error",
    },
  },
  categories: {
    default: {
      appenders: ["loggerConsola", "loggerWarn", "loggerErrores"],
      level: "all",
    },
  },
});

export const logger = log4js.getLogger();
