const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 0, max: 1000000 },
    image: { type: String, default: "" },
    category: { type: String, required: true, trim: true, maxlength: 50 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ createdBy: 1, createdAt: -1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model("Product", productSchema);
