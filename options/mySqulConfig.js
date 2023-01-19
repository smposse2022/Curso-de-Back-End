import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const options = {
  mariaDb: {
    client: "mysql",
    connection: {
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "desafiosql",
    },
  },
  sqliteDb: {
    client: "sqlite3",
    connection: {
      filename: path.join(__dirname, "../db/database.sqlite"),
    },
  },
};
export { options };
