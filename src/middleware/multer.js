const multer = require("multer");
const path = require("path"); // Asegúrate de importar el módulo path

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let destinationFolder;
        switch (file.fieldname) {
            case "profile":
                destinationFolder = "./src/uploads/profiles";
                break;
            case "products":
                destinationFolder = "./src/uploads/products";
                break;
            case "document":
                destinationFolder = "./src/uploads/documents";
                break;
        }
        cb(null, destinationFolder);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        let baseName;
        switch (file.fieldname) {
            case "profile":
                baseName = "ProfileImage";
                break;
            case "products":
                baseName = "ProductImage";
                break;
            case "document":
                if (file.originalname.includes("Identificacion")) {
                    baseName = "Identificacion";
                } else if (file.originalname.includes("Comprobante de domicilio")) {
                    baseName = "Comprobante de domicilio";
                } else if (file.originalname.includes("Comprobante de estado de cuenta")) {
                    baseName = "Comprobante de estado de cuenta";
                } else {
                    baseName = "UnknownDocument";
                }
                break;
        }
        cb(null, `${baseName}${ext}`);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
