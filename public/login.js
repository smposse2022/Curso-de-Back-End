// Login form
const loginButton = document.getElementById("login_button");
loginButton.addEventListener("submit", (evt) => {
  evt.preventDefault();

  const login = document.getElementById("username").value;

  if (!login) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Debe ingresar un nombre para iniciar sesión",
    });
  }
  return login;
});
