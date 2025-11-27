const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else
    cb(
      new Error(`Invalid file type. Only ${allowed.join(", ")} allowed.`),
      false
    );
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ message: "File too large. Max 5MB." });
    if (err.code === "LIMIT_FILE_COUNT")
      return res.status(400).json({ message: "Only one file allowed." });
    if (err.code === "LIMIT_UNEXPECTED_FILE")
      return res
        .status(400)
        .json({ message: 'Unexpected field. Use "image" as field name.' });
  } else if (err) return res.status(400).json({ message: err.message });
  next();
};

module.exports = { upload, handleUploadErrors };
