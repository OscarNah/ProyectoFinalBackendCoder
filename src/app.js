const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const compression = require("express-compression");
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const { logger, addLogger } = require("./config/logger.config.js");
const initializePassport = require("./config/passport.config.js")(passport); // Llamando a initializePassport con passport como argumento
const manejadorError = require("./middleware/error.js");
const authMiddleware = require("./middleware/authmiddleware.js");

const productsRouter = require("./routes/products.router.js");
const cartsRouter = require("./routes/carts.router.js");
const viewsRouter = require("./routes/views.router.js");
const userRouter = require("./routes/user.router.js");
const mockRouter = require("./routes/mock.router.js");
const PUERTO = 8080;

require("./database.js");

//SWAGGER
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUiExpress = require("swagger-ui-express");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Tienda de videojuegos',
      version: '1.0.0',
      description: 'Bienvenido a tu tienda de videojuegos de confianza.',
      contact: {
        name: 'Oscar Montes de Oca Nah'
      },
      servers: ['http://localhost:8080']
    },
  },
  apis: ["./src/docs/**/*.yaml"]
}
const specs = swaggerJSDoc(swaggerOptions);

// Middleware sw configuracion
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("./src/public"));
app.use(cookieParser());
app.use(compression());
app.use(addLogger);

// Configuración de sesiones
app.use(
  session({
    secret: "secretCoder",
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: "mongodb+srv://1im4montesdeocaoscar:coderhouse@cluster0.pjihogn.mongodb.net/Ecommerce?retryWrites=true&w=majority&appName=Cluster0",
      ttl: 100,  // Ajusta este valor según tus necesidades
    }),
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuración de Handlebars con el helper 'eq'
const hbsHelpers = {
  eq: (a, b) => a === b
};

// Handlebars
// Opción 2: Usar exphbs.engine()
app.engine('handlebars', exphbs.engine({
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  helpers: hbsHelpers  // Asegúrate de pasar tus helpers aquí si los necesitas
}));
app.set('view engine', 'handlebars');
app.set('views', './src/views');

//AuthMiddleware
app.use(authMiddleware);

// Rutas
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/users", userRouter);
app.use("/", viewsRouter, mockRouter);

// Configuración de Swagger
app.use("/apidocs", swaggerUiExpress.serve, swaggerUiExpress.setup(specs));

// Middleware global de manejo de errores
app.use(manejadorError);

// Inicio del servidor
const httpServer = app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en el puerto ${PUERTO}`);
});

// Configuración de Websockets
const SocketManager = require("./sockets/socketmanager.js");
new SocketManager(httpServer);
