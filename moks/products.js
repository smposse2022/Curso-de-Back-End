import { faker } from "@faker-js/faker";
const { datatype, commerce, image } = faker;
faker.locale = "es";
import { ContenedorMemoria } from "../managers/contenedorMemoria.js";

class ProductsMock extends ContenedorMemoria {
  constructor() {
    super();
  }
  populate(cant) {
    let newItems = [];
    for (let i = 0; i < cant; i++) {
      newItems.push({
        id: datatype.uuid(),
        title: commerce.product(),
        price: commerce.price(),
        thumbnail: image.avatar(),
      });
    }
    this.items = newItems;
    return newItems;
  }
}

export { ProductsMock };
