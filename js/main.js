//Hola, este es mi entrega final, espero que les guste, y puedan retroalimentarme de la mejor manera, muchas gracias por su tiempo.
// Este archivo, carga los productos desde el JSON, maneja el carrito de compras y muestra alertas con SweetAlert2
let productos = [];

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const contadorCarrito = document.getElementById("contador-carrito");
const contenedorProductos = document.getElementById("contenedor-productos");
const contenedorCarrito = document.getElementById("contenedor-carrito");

document.addEventListener("DOMContentLoaded", async () => {
  await cargarProductos();
  actualizarContador();
  mostrarCatalogo();
  manejarEventos();
});

//carga los productos desde el JSON
async function cargarProductos() {
  try {
    const res = await fetch("db/data.json");
    if (!res.ok) throw new Error("no se pudo cargar");
    productos = await res.json();
  } catch (err) {
    console.error("error al cargar productos:", err);
    mostrarError("falló la carga de productos");
  }
}

//agrega los listeners de click en productos y carrito
function manejarEventos() {
  contenedorProductos.addEventListener("click", (e) => {
    const btn = e.target.closest(".agregar-carrito");
    if (btn) {
      const id = parseInt(btn.dataset.id);
      if (!isNaN(id)) agregarAlCarrito(id);
    }
  });

  contenedorCarrito.addEventListener("click", (e) => {
    const btn = e.target;
    const id = parseInt(btn.dataset.id);

    if (btn.classList.contains("eliminar")) eliminarDelCarrito(id);
    else if (btn.classList.contains("menos")) modificarCantidad(id, -1);
    else if (btn.classList.contains("mas")) modificarCantidad(id, 1);
    else if (btn.id === "finalizar-compra") mostrarFormularioContacto();
  });
}

//renderiza las tarjetas con productos
function mostrarCatalogo() {
  contenedorProductos.innerHTML = "";

  productos.forEach((producto) => {
    const tarjeta = document.createElement("div");
    tarjeta.classList.add("card", "producto");
    tarjeta.innerHTML = `
      <picture>
        <source srcset="${producto.imagen.replace(
          ".jpg",
          ".webp"
        )}" type="image/webp">
        <img src="${producto.imagen}" alt="${
      producto.nombre
    }" loading="lazy" width="220" height="150">
      </picture>
      <div class="info-producto">
        <h3>${producto.nombre}</h3>
        <p>$${producto.precio.toFixed(2)}</p>
        <p>${producto.descripcion}</p>
        <button class="agregar-carrito" data-id="${
          producto.id
        }">Agregar al carrito</button>
      </div>
    `;
    contenedorProductos.appendChild(tarjeta);
  });
}

//renderiza el carrito con productos agregados
function mostrarCarrito() {
  contenedorCarrito.innerHTML = "";

  if (carrito.length === 0) {
    contenedorCarrito.innerHTML =
      "<p class='carrito-vacio'>tu carrito esta vacio</p>";
    return;
  }

  carrito.forEach((item) => {
    const divItem = document.createElement("div");
    divItem.classList.add("item-carrito");
    divItem.innerHTML = `
      <h4>${item.nombre}</h4>
      <p>Precio unitario: $${item.precio.toFixed(2)}</p>
      <div class="control-cantidad">
        <button class="menos" data-id="${item.id}">-</button>
        <span>${item.cantidad}</span>
        <button class="mas" data-id="${item.id}">+</button>
      </div>
      <p>Subtotal: $${(item.precio * item.cantidad).toFixed(2)}</p>
      <button class="eliminar" data-id="${item.id}">Eliminar</button>
    `;
    contenedorCarrito.appendChild(divItem);
  });

  const total = calcularTotal();
  const pie = document.createElement("div");
  pie.classList.add("pie-carrito");
  pie.innerHTML = `
    <h3>Total: $${total.toFixed(2)}</h3>
    <button id="finalizar-compra">Finalizar compra</button>
  `;
  contenedorCarrito.appendChild(pie);
}

//agrega producto al carrito o aumenta cantidad
function agregarAlCarrito(id) {
  try {
    const producto = productos.find((p) => p.id === id);
    if (!producto) throw new Error("producto no encontrado");

    const item = carrito.find((i) => i.id === id);
    if (item) item.cantidad++;
    else carrito.push({ ...producto, cantidad: 1 });

    guardarCarrito();
    mostrarExito(`${producto.nombre} añadido al carrito`);
  } catch (err) {
    console.error("error al agregar producto:", err);
    mostrarError("no se pudo agregar el producto");
  }
}

//modifica cantidad (suma o resta), o lo borra si queda en 0
function modificarCantidad(id, cambio) {
  const item = carrito.find((i) => i.id === id);
  if (!item) return;

  item.cantidad += cambio;
  if (item.cantidad <= 0) carrito = carrito.filter((i) => i.id !== id);

  guardarCarrito();
}

//elimina un item directamente
function eliminarDelCarrito(id) {
  carrito = carrito.filter((i) => i.id !== id);
  guardarCarrito();
}

//suma todos los subtotales del carrito
function calcularTotal() {
  return carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
}

//guarda el carrito en localStorage y actualiza UI
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContador();
  mostrarCarrito();
}

//actualiza el numerito del contador en el navbar
function actualizarContador() {
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  contadorCarrito.textContent = total;
}

//muestra formulario de contacto al finalizar compra
function mostrarFormularioContacto() {
  if (carrito.length === 0) {
    mostrarError("el carrito esta vacio");
    return;
  }

  Swal.fire({
    title: "Finalizar compra",
    html: `
      <div class="formulario-contacto">
        <div class="resumen-compra">
          <h4>Resumen:</h4>
          ${carrito
            .map(
              (item) =>
                `<p>${item.nombre} x${item.cantidad} - $${(
                  item.precio * item.cantidad
                ).toFixed(2)}</p>`
            )
            .join("")}
          <h4>Total: $${calcularTotal().toFixed(2)}</h4>
        </div>
        <input type="text" id="nombre-cliente" class="swal2-input" placeholder="tu nombre">
        <input type="tel" id="telefono-cliente" class="swal2-input" placeholder="tu telefono">
      </div>
    `,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Enviar pedido",
    cancelButtonText: "Seguir comprando",
    focusConfirm: false,
    preConfirm: () => {
      return {
        nombre: document.getElementById("nombre-cliente").value.trim(),
        telefono: document.getElementById("telefono-cliente").value.trim(),
      };
    },
    inputValidator: (values) => {
      if (!values.nombre || !values.telefono)
        return "completa todos los campos";
      if (!/^[0-9]{10,15}$/.test(values.telefono)) return "telefono invalido";
    },
  }).then((res) => {
    if (res.isConfirmed) simularEnvioPedido(res.value);
  });
}

//simula el envio del pedido y muestra agradecimiento
function simularEnvioPedido(cliente) {
  console.log("pedido enviado:", {
    productos: carrito,
    total: calcularTotal(),
    cliente,
    fecha: new Date().toLocaleString(),
  });

  Swal.fire({
    title: "Pedido enviado!",
    html: `
      <p>gracias por tu compra, ${cliente.nombre}</p>
      <p>te vamos a contactar al ${cliente.telefono}</p>
    `,
    icon: "success",
  });

  carrito = [];
  guardarCarrito();
}

//muestra alerta de exito
function mostrarExito(msg, duracion = 1500) {
  Swal.fire({
    title: "Hecho!",
    text: msg,
    icon: "success",
    timer: duracion,
    showConfirmButton: false,
  });
}

//muestra error con sweetalert
function mostrarError(msg) {
  Swal.fire({
    title: "Ups...",
    text: msg,
    icon: "error",
  });
}
