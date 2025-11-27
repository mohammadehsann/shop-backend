const Product = require("../models/Product");
const path = require("path");
const fs = require("fs");

const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;

    const [products, totalItems] = await Promise.all([
      Product.find(filter)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Product.countDocuments(filter),
    ]);

    const formattedProducts = products.map((product) => ({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock,
      createdBy: {
        _id: product.createdBy._id,
        name: product.createdBy.name,
        email: product.createdBy.email,
      },
      createdAt: product.createdAt,
    }));

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: formattedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock,
      createdBy: {
        _id: product.createdBy._id,
        name: product.createdBy.name,
        email: product.createdBy.email,
      },
      createdAt: product.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
      createdBy: req.user._id,
    };

    if (req.file) productData.image = `/uploads/${req.file.filename}`;
    else if (req.body.image) productData.image = req.body.image;
    else productData.image = "";

    const product = new Product(productData);
    const savedProduct = await product.save();
    await savedProduct.populate("createdBy", "name email");

    res.status(201).json({
      _id: savedProduct._id,
      name: savedProduct.name,
      description: savedProduct.description,
      price: savedProduct.price,
      image: savedProduct.image,
      category: savedProduct.category,
      stock: savedProduct.stock,
      createdBy: {
        _id: savedProduct.createdBy._id,
        name: savedProduct.createdBy.name,
        email: savedProduct.createdBy.email,
      },
      createdAt: savedProduct.createdAt,
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(400).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.createdBy.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({
          message: "Access denied. You can only edit your own products.",
        });

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
    };

    if (req.file) {
      if (product.image && product.image.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", product.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      if (
        req.body.image === "" &&
        product.image &&
        product.image.startsWith("/uploads/")
      ) {
        const oldPath = path.join(__dirname, "..", product.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = req.body.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.json({
      _id: updatedProduct._id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      price: updatedProduct.price,
      image: updatedProduct.image,
      category: updatedProduct.category,
      stock: updatedProduct.stock,
      createdBy: {
        _id: updatedProduct.createdBy._id,
        name: updatedProduct.createdBy.name,
        email: updatedProduct.createdBy.email,
      },
      createdAt: updatedProduct.createdAt,
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(400).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.createdBy.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({
          message: "Access denied. You can only delete your own products.",
        });

    if (product.image && product.image.startsWith("/uploads/")) {
      const imgPath = path.join(__dirname, "..", product.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
