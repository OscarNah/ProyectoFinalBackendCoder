const UserModel = require("../models/user.model.js");
const CartModel = require("../models/cart.model.js");
const jwt = require("jsonwebtoken");
const { createHash, isValidPassword } = require("../utils/hashbcryp.js");
const UserDTO = require("../dto/user.dto.js");
const passport = require("passport");
const { logger } = require("../config/logger.config.js"); // Importar el logger
const { generateResetToken } = require("../utils/tokenreset.js");
const fs = require("fs");
const path = require("path");

const EmailManager = require("../service/email.js");
const emailManager = new EmailManager();

class UserController {
    async register(req, res) {
        const { first_name, last_name, email, password, age } = req.body;
        try {
            const existeUsuario = await UserModel.findOne({ email });
            if (existeUsuario) {
                return res.status(400).send("El usuario ya existe");
            }

            // Creo un nuevo carrito:
            const nuevoCarrito = new CartModel();
            await nuevoCarrito.save();

            const nuevoUsuario = new UserModel({
                first_name,
                last_name,
                email,
                cart: nuevoCarrito._id,
                password: createHash(password),
                age,
            });

            await nuevoUsuario.save();

            const token = jwt.sign({ user: nuevoUsuario }, "coderhouse", {
                expiresIn: "1h",
            });

            res.cookie("coderCookieToken", token, {
                maxAge: 3600000,
                httpOnly: true,
            });

            res.redirect("/api/users/profile");
            logger.info("Usuario registrado correctamente");
        } catch (error) {
            logger.error("Error al registrar el usuario:", error.message);
            res.status(500).send("Error interno del servidor");
        }
    }

    async login(req, res) {
        const { email, password } = req.body;
        try {
            const usuarioEncontrado = await UserModel.findOne({ email });

            if (!usuarioEncontrado) {
                return res.status(401).send("Usuario no válido");
            }

            const esValido = isValidPassword(password, usuarioEncontrado);
            if (!esValido) {
                return res.status(401).send("Contraseña incorrecta");
            }

            const token = jwt.sign({ user: usuarioEncontrado }, "coderhouse", {
                expiresIn: "1h",
            });

            res.cookie("coderCookieToken", token, {
                maxAge: 3600000,
                httpOnly: true,
            });

            res.redirect("/api/users/profile");
            logger.info("Usuario autenticado correctamente");
        } catch (error) {
            logger.error("Error al autenticar el usuario:", error.message);
            res.status(500).send("Error interno del servidor");
        }
    }

    async profile(req, res) {
        try {
            const isPremium = req.user.role === 'premium';
            const userDto = new UserDTO(req.user.first_name, req.user.last_name, req.user.email, req.user.role);
            // Verificar si el usuario es administrador
            const isAdmin = req.user.role === "admin";

            res.render("profile", { user: userDto, isPremium, isAdmin }); // Pasar isAdmin a la vista
            logger.info("Perfil del usuario obtenido correctamente");
        } catch (error) {
            logger.error("Error al obtener el perfil del usuario:", error.message);
            res.status(500).send("Error interno del servidor");
        }
    }

    async logout(req, res) {
        res.clearCookie("coderCookieToken");
        res.redirect("/login");
        logger.info("Usuario cerró sesión correctamente");
    }

    // Github
    async githubAuth(req, res, next) {
        passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
    }

    // Callback después de la autenticación con GitHub
    async githubAuthCallback(req, res) {
        passport.authenticate("github", { failureRedirect: "/login" })(req, res, () => {
            // Después de la autenticación exitosa, puedes generar el token JWT y redirigir al perfil del usuario
            const token = jwt.sign({ user: req.user }, "coderhouse", {
                expiresIn: "1h",
            });
            res.cookie("coderCookieToken", token, {
                maxAge: 3600000,
                httpOnly: true,
            });
            res.redirect("/api/users/profile");
            logger.info("Autenticación con GitHub exitosa");
        });
    }

    async requestPasswordReset(req, res) {
        const { email } = req.body;

        try {
            // Buscar al usuario por su correo electrónico
            const user = await UserModel.findOne({ email });
            if (!user) {
                return res.status(404).send("Usuario no encontrado");
            }

            // Generar un token 
            const token = generateResetToken();

            // Guardar el token en el usuario
            user.resetToken = {
                token: token,
                expiresAt: new Date(Date.now() + 3600000) // 1 hora de duración
            };
            await user.save();

            // Enviar correo electrónico con el enlace de restablecimiento utilizando EmailService
            await emailManager.enviarCorreoRestablecimiento(email, user.first_name, token);

            res.redirect("/confirmacion-envio");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno del servidor");
        }
    }

    async resetPassword(req, res) {
        const { email, password, token } = req.body;

        try {
            // Buscar al usuario por su correo electrónico
            const user = await UserModel.findOne({ email });
            if (!user) {
                return res.render("passwordcambio", { error: "Usuario no encontrado" });
            }

            // Obtener el token de restablecimiento de la contraseña del usuario
            const resetToken = user.resetToken;
            if (!resetToken || resetToken.token !== token) {
                return res.render("passwordreset", { error: "El token de restablecimiento de contraseña es inválido" });
            }

            // Verificar si el token ha expirado
            const now = new Date();
            if (now > resetToken.expiresAt) {
                // Redirigir a la página de generación de nuevo correo de restablecimiento
                return res.redirect("/passwordcambio");
            }

            // Verificar si la nueva contraseña es igual a la anterior
            if (isValidPassword(password, user)) {
                return res.render("passwordcambio", { error: "La nueva contraseña no puede ser igual a la anterior" });
            }

            // Actualizar la contraseña del usuario
            user.password = createHash(password);
            user.resetToken = undefined; // Marcar el token como utilizado
            await user.save();

            // Renderizar la vista de confirmación de cambio de contraseña
            return res.redirect("/login");
        } catch (error) {
            console.error(error);
            return res.status(500).render("passwordreset", { error: "Error interno del servidor" });
        }
    }

    async cambiarRolPremium(req, res) {
        const { uid } = req.params;

        try {
            const user = await UserModel.findById(uid);

            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            // Verificar si los documentos requeridos están presentes
            const requiredDocuments = ["Identificacion", "Comprobante de domicilio", "Comprobante de estado de cuenta"];
            const uploadedDocuments = user.documents.map(doc => doc.name.split(".")[0]); // Extraer el nombre del documento sin la extensión

            const missingDocuments = requiredDocuments.filter(doc => !uploadedDocuments.includes(doc));

            if (missingDocuments.length > 0) {
                return res.status(400).json({ message: `Debe cargar los documentos requeridos antes de actualizar a premium: ${missingDocuments.join(", ")}` });
            }

            // Cambiar el rol del usuario a 'premium'
            const nuevoRol = user.role === 'usuario' ? 'premium' : 'usuario';

            const actualizado = await UserModel.findByIdAndUpdate(uid, { role: nuevoRol }, { new: true });
            res.json(actualizado);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async subirDocumentos(req, res) {
        const { uid } = req.params;
        const uploadedDocuments = req.files;

        try {
            const user = await UserModel.findById(uid);

            if (!user) {
                return res.status(404).send("Usuario no encontrado");
            }

            // Validar documentos requeridos
            const requiredDocuments = ["Identificacion", "Comprobante de domicilio", "Comprobante de estado de cuenta"];
            const uploadedDocumentNames = [];

            // Procesar los documentos subidos y normalizar los nombres
            if (uploadedDocuments) {
                if (uploadedDocuments.document) {
                    uploadedDocuments.document.forEach(doc => {
                        let documentType = "UnknownDocument";

                        if (doc.originalname.includes("Identificacion")) {
                            documentType = "Identificacion";
                        } else if (doc.originalname.includes("Comprobante de domicilio")) {
                            documentType = "Comprobante de domicilio";
                        } else if (doc.originalname.includes("Comprobante de estado de cuenta")) {
                            documentType = "Comprobante de estado de cuenta";
                        }

                        const normalizedFileName = `${documentType}_${uid}_${Date.now()}${path.extname(doc.originalname)}`;
                        const destinationPath = `./src/uploads/documents/${normalizedFileName}`;

                        // Mover archivo a la carpeta correspondiente
                        fs.renameSync(doc.path, destinationPath);

                        // Agregar a la lista de nombres de documentos subidos
                        uploadedDocumentNames.push(documentType);

                        // Actualizar referencia en el usuario
                        user.documents.push({
                            name: documentType,
                            reference: destinationPath
                        });
                    });
                }
            }

            // Verificar si todos los documentos requeridos están presentes
            const missingDocuments = requiredDocuments.filter(doc => !uploadedDocumentNames.includes(doc));

            if (missingDocuments.length > 0) {
                return res.status(400).json({ message: `Debe cargar los documentos requeridos antes de actualizar a premium: ${missingDocuments.join(", ")}` });
            }

            // Guardar cambios en el usuario
            await user.save();

            res.status(200).send("Documentos cargados exitosamente");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno del servidor");
        }
    }

    // Obtener todos los usuarios
    async getAllUsers(req, res) {
        try {
            const users = await UserModel.find({}, 'first_name last_name email role');
            res.json(users);
        } catch (error) {
            logger.error("Error al obtener todos los usuarios:", error.message);
            res.status(500).send("Error interno del servidor");
        }
    }

    // Eliminar usuarios inactivos
    async deleteInactiveUsers(req, res) {
        try {
            const now = new Date();
            const inactiveTime = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 días atrás

            const inactiveUsers = await UserModel.find({ last_connection: { $lt: inactiveTime } });
            for (const user of inactiveUsers) {
                await UserModel.findByIdAndDelete(user._id);
                await emailManager.sendInactiveAccountDeletionEmail(user.email);
            }

            res.json({ message: `${inactiveUsers.length} usuarios eliminados por inactividad` });
        } catch (error) {
            logger.error("Error al eliminar usuarios inactivos:", error.message);
            res.status(500).send("Error interno del servidor");
        }
    }

    // Obtener la vista de administración de usuarios
    async adminView(req, res) {
        const usuario = req.user;
        try {
            // Verificar si el usuario tiene el rol de "admin"
            if (req.user.role !== "admin") {
                return res.status(403).send("Acceso denegado");
            }

            // Obtener la lista de usuarios si el rol es "admin"
            const users = await UserModel.find({}, 'first_name last_name email role');

            // Renderizar la vista de administración con la lista de usuarios
            res.render("admin", { role: usuario.role, email: usuario.email, users });
        } catch (error) {
            logger.error("Error al obtener la vista de administración de usuarios:", error.message);
            res.status(500).send("Error interno del servidor");
        }
    }

    // Cambiar el rol de un usuario
    async cambiarRol(req, res) {
        try {
            const { uid } = req.params;
            const { role } = req.query; // Nuevo rol recibido desde la query params o body
    
            const user = await UserModel.findById(uid);
    
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
    
            const rolesValidos = ['usuario', 'premium', 'admin'];
    
            if (!rolesValidos.includes(role)) {
                return res.status(400).json({ message: 'Rol no válido' });
            }
    
            const actualizado = await UserModel.findByIdAndUpdate(uid, { role }, { new: true });
            res.json(actualizado);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    

    // Eliminar un usuario
    async deleteUser(req, res) {
        try {
            const { uid } = req.params;
            const user = await UserModel.findByIdAndDelete(uid);

            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            res.json({ message: "Usuario eliminado correctamente" });
        } catch (error) {
            logger.error("Error al eliminar el usuario:", error.message);
            res.status(500).send("Error interno del servidor");
        }
    }
}

module.exports = UserController;