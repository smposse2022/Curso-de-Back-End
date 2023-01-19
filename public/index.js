const socketClient = io();
const usuario = document.getElementById("usuario");

//envio del formulario
const productForm = document.getElementById("form");
productForm.addEventListener("submit", (evt) => {
  if (usuario.innerText == "Invitado") {
    evt.preventDefault();
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Debes estar logueado para agregar productos!",
    });
  } else {
    evt.preventDefault();
    const product = {
      title: document.getElementById("title").value,
      price: document.getElementById("price").value,
      thumbnail: document.getElementById("thumbnail").value,
    };
    socketClient.emit("newProduct", product);
    productForm.reset();
  }
});

//productos en tiempo real
const createTable = async (data) => {
  const response = await fetch("./templates/table.handlebars");
  const result = await response.text();
  const template = Handlebars.compile(result);
  const html = template({ products: data });
  return html;
};

socketClient.on("products", async (data) => {
  const htmlTable = await createTable(data);
  const productsContainer = document.getElementById("productsContainer");
  productsContainer.innerHTML = htmlTable;
});

// esquemas del lado del frontend
/*const authorSchema = new normalizr.schema.Entity(
  "authors",
  {},
  { idAttribute: "mail" }
);
const messageSchema = new normalizr.schema.Entity("messages", {
  author: authorSchema,
});
const chatSchema = new normalizr.schema.Entity(
  "chat",
  {
    messages: [messageSchema],
  },
  { idAttribute: "id" }
);*/

//chat
/*socketClient.on("messages", async (dataMsg) => {
  // de-normalizamos la info
  const normalData = normalizr.denormalize(
    dataMsg.result,
    chatSchema,
    dataMsg.entities
  );
  //console.log("normalData", normalData);

  let messageElements = "";
  //normalData.messages.forEach((msg) => {
  dataMsg.forEach((msg) => {
    messageElements += `<div><strong>${msg.username} - ${msg.timestamp}:</strong> ${msg.text}</div>`;
  });
  const chatContainer = document.getElementById("chatContainer");
  chatContainer.innerHTML =
    normalData.messages.length > 0 ? messageElements : "";
});
*/
//chat

socketClient.on("messages", async (dataMsg) => {
  let messageElements = "";
  dataMsg.forEach((msg) => {
    messageElements += `<div><strong>${msg.username} - ${msg.timestamp}:</strong> ${msg.message}</div>`;
  });
  const chatContainer = document.getElementById("chatContainer");
  chatContainer.innerHTML = dataMsg.length > 0 ? messageElements : "";
});

//envio del mensaje del chat
const chatInput = document.getElementById("chatMsg");
const chatButton = document.getElementById("sendMsg");

chatButton.addEventListener("click", () => {
  if (usuario.innerText == "Invitado") {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Debes estar logueado para usar el Chat!",
    });
  } else {
    socketClient.emit("newMessage", {
      username: usuario.innerText,
      timestamp: new Date().toLocaleString(),
      message: chatInput.value,
    });
    chatInput.value = "";
  }
});
