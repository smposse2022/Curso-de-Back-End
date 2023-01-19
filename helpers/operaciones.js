export const numerosAlAzar = (valor) => {
  const array = [];
  for (let i = 0; i < valor; i++) {
    let nemueroAleatorio = Math.ceil(Math.random() * valor);
    array.push(nemueroAleatorio);
  }
  const resultado = {};
  array.forEach((el) => (resultado[el] = resultado[el] + 1 || 1));
  return resultado;
};
