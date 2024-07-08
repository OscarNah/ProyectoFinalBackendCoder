const socket = io();
const role = document.getElementById("role").textContent;
const email = document.getElementById("email").textContent;

socket.on("productos", (data) => {
    renderProductos(data);
});

// Función para renderizar nuestros productos:
const renderProductos = (productos) => {
    const contenedorProductos = document.getElementById("contenedorProductos");
    contenedorProductos.innerHTML = "";

    productos.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            <p>${item.title}</p>
            <p>${item.price}</p>
            <button>Eliminar</button>
        `;

        contenedorProductos.appendChild(card);
        card.querySelector("button").addEventListener("click", () => {
            if (role === "premium" && item.owner === email) {
                eliminarProducto(item._id);
            } else if (role === "admin") {
                eliminarProducto(item._id);
            } else {
                Swal.fire({
                    title: "Error",
                    text: "No tenes permiso para borrar ese producto",
                });
            }
        });
    });
}

// Función para eliminar un producto
const eliminarProducto = (id) => {
    socket.emit("eliminarProducto", id);

    // Mostrar SweetAlert indicando que el producto fue eliminado
    Swal.fire({
        icon: 'error',
        title: 'Producto eliminado',
        text: 'El producto ha sido eliminado correctamente',
        confirmButtonColor: '#4caf50',
    });
}


// Agregamos productos del formulario:
document.getElementById("btnEnviar").addEventListener("click", () => {
    agregarProducto();
});

const agregarProducto = () => {
    const role = document.getElementById("role").textContent;
    const email = document.getElementById("email").textContent;

    const owner = role === "premium" ? email : "admin";

    const producto = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        price: document.getElementById("price").value,
        img: document.getElementById("img").value,
        code: document.getElementById("code").value,
        stock: document.getElementById("stock").value,
        category: document.getElementById("category").value,
        status: document.getElementById("status").value === "true",
        owner
    };

    socket.emit("agregarProducto", producto);

    // Mostrar SweetAlert de éxito
    Swal.fire({
        icon: 'success',
        title: 'Producto agregado',
        text: 'El producto se agregó correctamente',
        confirmButtonColor: '#4caf50',
    });

    // Limpiar el formulario y mostrar mensaje de éxito
    const form = document.querySelector('.miFormulario');
    form.reset(); // Resetea los campos del formulario
}
