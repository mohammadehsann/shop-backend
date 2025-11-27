const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { upload, handleUploadErrors } = require("../middleware/multer");
const productController = require("../controllers/productController");

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  auth,
  upload.single("image"),
  handleUploadErrors,
  productController.createProduct
);
router.put(
  "/:id",
  auth,
  upload.single("image"),
  handleUploadErrors,
  productController.updateProduct
);
router.delete("/:id", auth, productController.deleteProduct);

module.exports = router;
