const express = require("express");
const UserController = require("../controllers/user.controller.js");
const router = express.Router();
const checkUserRole = require("../middleware/checkrole.js");
const passport = require("passport");

const userController = new UserController();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile", passport.authenticate("jwt", { session: false }), userController.profile);
router.post("/logout", userController.logout.bind(userController));

// GitHub
router.get("/auth/github", userController.githubAuth);
router.get("/auth/github/callback", userController.githubAuthCallback);
// Integradora 3
router.post("/requestPasswordReset", userController.requestPasswordReset);
router.post("/reset-password", userController.resetPassword);
router.put("/premium/:uid", userController.cambiarRolPremium);
// Integradora 4: Endpoint para subir documentos
const upload = require("../middleware/multer.js");
router.post(
   "/:uid/documents",
   upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "products", maxCount: 10 },
      { name: "document", maxCount: 3 },
   ]),
   userController.subirDocumentos
);
//Entrega Final
// Obtener todos los usuarios
router.get("/", userController.getAllUsers);
// Eliminar usuarios inactivos
router.delete("/", userController.deleteInactiveUsers);
// Admin
router.get("/admin", checkUserRole(['admin']),passport.authenticate('jwt', { session: false }), userController.adminView);
router.put("/admin/:uid/role", userController.cambiarRol);
router.delete("/admin/:uid", userController.deleteUser);

module.exports = router;
