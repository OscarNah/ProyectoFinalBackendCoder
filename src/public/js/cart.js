function eliminarProducto(cartId, productId) {
    fetch(`/api/carts/${cartId}/product/${productId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar el producto del carrito');
            }
            location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function vaciarCarrito(cartId) {
    fetch(`/api/carts/${cartId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al vaciar el carrito');
            }
            location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function finalizarCompra(cartId) {
    fetch(`/api/carts/${cartId}/purchase`, {
        method: 'POST'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al finalizar la compra');
            }
            // Mostrar alerta de éxito usando SweetAlert2
            Swal.fire({
                icon: 'success',
                title: 'Compra realizada con éxito. En caso de que se le muestre un producto despues de la confirmaciond e la compra es porque el producto no esta disponible.',
                showConfirmButton: false,
                timer: 2000 // Tiempo de la alerta en milisegundos
            });
            // Redirigir a la página de confirmación de compra después de 2 segundos
            setTimeout(() => {
                window.location.href = `/carts/${cartId}`;
            }, 2100);
        })
        .catch(error => {
            console.error('Error:', error);
            // Mostrar alerta de error usando SweetAlert2
            Swal.fire({
                icon: 'error',
                title: 'Error al finalizar la compra',
                text: 'Hubo un error al finalizar la compra. Por favor, inténtalo de nuevo más tarde.',
                confirmButtonText: 'Entendido'
            });
        });
}


