const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "name price image stock category"
  );
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  res.json({ success: true, data: cart });
};

const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (product.stock < quantity)
    return res.status(400).json({ message: "Not enough stock available" });

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );
  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (product.stock < newQuantity)
      return res.status(400).json({ message: "Not enough stock available" });
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      name: product.name,
      image: product.image,
    });
  }

  await cart.save();
  await cart.populate("items.product", "name price image stock category");
  res.json({ success: true, message: "Product added to cart", data: cart });
};

const updateCartItem = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  if (quantity < 1)
    return res.status(400).json({ message: "Quantity must be at least 1" });

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const cartItem = cart.items.id(itemId);
  if (!cartItem)
    return res.status(404).json({ message: "Cart item not found" });

  const product = await Product.findById(cartItem.product);
  if (product.stock < quantity)
    return res.status(400).json({ message: "Not enough stock available" });

  cartItem.quantity = quantity;
  await cart.save();
  await cart.populate("items.product", "name price image stock category");
  res.json({ success: true, message: "Cart updated", data: cart });
};

const removeFromCart = async (req, res) => {
  const { itemId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
  await cart.save();
  await cart.populate("items.product", "name price image stock category");
  res.json({ success: true, message: "Item removed from cart", data: cart });
};

const clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = [];
  await cart.save();
  res.json({ success: true, message: "Cart cleared", data: cart });
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
