const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter(req, file, callback) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Formato de imagem não permitido"));
    }
    callback(null, true);
  }
}).single("image");

module.exports = function uploadImage(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({
        error: status === 413 ? "A imagem deve ter até 5 MB" : error.message
      });
    }
    next();
  });
};
