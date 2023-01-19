import { faker } from "@faker-js/faker";
import { logger } from "../logger.js";
const { datatype, commerce, image } = faker;

class ContenedorMemoria {
  constructor() {
    this.items = [];
  }

  getAll() {
    try {
      return this.items;
    } catch (error) {
      logger.error("No se encontraron los productos");
    }
  }

  save(newItem) {
    try {
      newItem.id = datatype.uuid();
      this.items.push(newItem);
      return newItem;
    } catch (error) {
      logger.error("No se pudo guardar el producto. Campos erroneos");
      return error;
    }
  }

  deleteById(id) {
    try {
      let index = this.items.findIndex((obj) => obj.id == id);
      this.items.splice(index, 1);
      return `Item con id ${id} eliminado`;
    } catch (error) {
      logger.error("Se pasó un parámetro incorrecto");
      return error;
    }
  }

  deleteAll = async () => {
    try {
      this.items = [];
    } catch (error) {
      logger.error("Se pasó un parámetro incorrecto");
      return error;
    }
  };
}

export { ContenedorMemoria };
