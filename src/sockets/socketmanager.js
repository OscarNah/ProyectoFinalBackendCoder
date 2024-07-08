const socket = require("socket.io");
const ProductRepository = require("../repositories/product.repository.js");
const productRepository = new ProductRepository(); 
const EmailManager = require("../service/email.js");
const emailManager = new EmailManager();

class SocketManager {
    constructor(httpServer) {
        this.io = socket(httpServer);
        this.initSocketEvents();
    }

    async initSocketEvents() {
        this.io.on("connection", async (socket) => {
            console.log("Un cliente se conectó");
            
            socket.emit("productos", await productRepository.obtenerTodosLosProductos());

            socket.on("eliminarProducto", async (id) => {
                const producto = await productRepository.eliminarProducto(id);

                if (producto && producto.owner) {
                    const { owner, title } = producto;

                    // Verifica si owner y owner.email están definidos y no son 'admin'
                    if (owner.email && owner.email !== 'admin') {
                        const email = owner.email;
                        const firstName = owner.first_name;

                        try {
                            await emailManager.enviarCorreoProductoEliminado(email, firstName, title);
                        } catch (error) {
                            console.error('Error al enviar el correo electrónico:', error);
                        }
                    }
                }

                this.emitUpdatedProducts(socket);
            });

            socket.on("agregarProducto", async (producto) => {
                await productRepository.agregarProducto(producto);
                this.emitUpdatedProducts(socket);
            });

            socket.on("message", async (data) => {
                await MessageModel.create(data);
                const messages = await MessageModel.find();
                socket.emit("message", messages);
            });
        });
    }

    async emitUpdatedProducts(socket) {
        socket.emit("productos", await productRepository.obtenerTodosLosProductos());
    }
}

module.exports = SocketManager;
