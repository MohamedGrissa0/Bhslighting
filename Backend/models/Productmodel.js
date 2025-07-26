  const mongoose = require("mongoose");

  const VariantOptionSchema = new mongoose.Schema({
    option: { type: String, required: true },
    values: [{ type: String }],
  }, { _id: false });

  const DimensionsSchema = new mongoose.Schema({
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  }, { _id: false });

  const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    shortDescription: { type: String },
    content: { type: String },
    stock: { type: Number, default: 0 },
    sku: { type: String },
    sizes: { type: String },
    weight: { type: Number, default: 0 },
    dimensions: { type: DimensionsSchema, default: () => ({}) },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    material: [{ type: String }],

    // 🟢 UPDATED: Use ObjectId refs for categories
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    metaSlug: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    tags: [{ type: String }],

    slug: { type: String, required: true, unique: true },
    isPublished: { type: Boolean, default: false },

    images: [{ type: String }],
    seoImages: [{ type: String }],

    variants: [VariantOptionSchema],

    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  }, { timestamps: true });

  module.exports = mongoose.model("Product", ProductSchema);
