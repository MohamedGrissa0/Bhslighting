const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Productmodel");
const upload = require("../upload");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// 🔧 Helper: Clean product response
const cleanProduct = (productDoc) => {
  const product = productDoc.toObject(); // Mongoose -> plain object

  product.category = Array.isArray(product.category)
    ? product.category.map(cat =>
        typeof cat === "object" && cat._id ? String(cat._id) : String(cat)
      )
    : [];

  return product;
};

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .populate("relatedProducts", "name images slug")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    const cleaned = products.map(cleanProduct);
    res.json(cleaned);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("relatedProducts", "name images slug")
      .populate("category", "name");

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(cleanProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// CREATE product
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "seoImages", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        shortDescription,
        content,
        stock,
        sku,
        sizes,
        weight,
        dimensions,
        price,
        discountPrice,
        tax,
        material,
        category,
        metaSlug,
        metaTitle,
        metaDescription,
        slug,
        isPublished,
        variants,
        tags,
        relatedProducts,
      } = req.body;

      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({ error: "A product with this name already exists." });
      }

      const dimensionsObj = dimensions ? JSON.parse(dimensions) : {};
      const materialArr = material ? JSON.parse(material) : [];
      const variantsArr = variants ? JSON.parse(variants) : [];
      const tagsArr = tags ? JSON.parse(tags) : [];
      const relatedProductsArr = relatedProducts ? JSON.parse(relatedProducts) : [];

      const categoryArr = Array.isArray(category)
        ? category.filter(id => isValidObjectId(id)).map(id => new mongoose.Types.ObjectId(id))
        : isValidObjectId(category)
        ? [new mongoose.Types.ObjectId(category)]
        : [];

      const images = req.files["images"] ? req.files["images"].map(f => f.filename) : [];
      const seoImages = req.files["seoImages"] ? req.files["seoImages"].map(f => f.filename) : [];

      const product = new Product({
        name,
        shortDescription,
        content,
        stock: Number(stock) || 0,
        sku,
        sizes,
        weight: Number(weight) || 0,
        dimensions: dimensionsObj,
        price: Number(price),
        discountPrice: Number(discountPrice) || 0,
        tax: Number(tax) || 0,
        material: materialArr,
        category: categoryArr,
        metaSlug,
        metaTitle,
        metaDescription,
        slug,
        isPublished: JSON.parse(isPublished),
        variants: variantsArr,
        tags: tagsArr,
        relatedProducts: relatedProductsArr,
        images,
        seoImages,
      });

      await product.save();
      res.status(201).json({ message: "Product created successfully", product: cleanProduct(product) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);

// UPDATE product
router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "seoImages", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      const {
        name,
        shortDescription,
        content,
        stock,
        sku,
        sizes,
        weight,
        dimensions,
        price,
        discountPrice,
        tax,
        material,
        category,
        metaSlug,
        metaTitle,
        metaDescription,
        slug,
        isPublished,
        variants,
        tags,
        relatedProducts,
      } = req.body;

      const dimensionsObj = dimensions ? JSON.parse(dimensions) : {};
      const materialArr = material ? JSON.parse(material) : [];
      const variantsArr = variants ? JSON.parse(variants) : [];
      const tagsArr = tags ? JSON.parse(tags) : [];
      const relatedProductsArr = relatedProducts ? JSON.parse(relatedProducts) : [];

      // Parse category robustly
      let parsedCategory = category;
      if (typeof category === "string") {
        try {
          parsedCategory = JSON.parse(category);
        } catch {
          parsedCategory = [category];
        }
      }

      const categoryArr = Array.isArray(parsedCategory)
        ? parsedCategory.filter(id => isValidObjectId(id)).map(id => new mongoose.Types.ObjectId(id))
        : isValidObjectId(parsedCategory)
        ? [new mongoose.Types.ObjectId(parsedCategory)]
        : [];

      if (req.files?.images?.length) {
        product.images = req.files.images.map(file => file.filename);
      }
      if (req.files?.seoImages?.length) {
        product.seoImages = req.files.seoImages.map(file => file.filename);
      }

      product.name = name;
      product.shortDescription = shortDescription;
      product.content = content;
      product.stock = Number(stock) || 0;
      product.sku = sku;
      product.sizes = sizes;
      product.weight = Number(weight) || 0;
      product.dimensions = dimensionsObj;
      product.price = Number(price);
      product.discountPrice = Number(discountPrice) || 0;
      product.tax = Number(tax) || 0;
      product.material = materialArr;
      product.category = categoryArr;
      product.metaSlug = metaSlug;
      product.metaTitle = metaTitle;
      product.metaDescription = metaDescription;
      product.slug = slug;
      product.isPublished = isPublished === "true" || isPublished === true;
      product.variants = variantsArr;
      product.tags = tagsArr;
      product.relatedProducts = relatedProductsArr;

      await product.save();

      res.json({ message: "Product updated successfully", product: cleanProduct(product) });
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// GET product by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("relatedProducts", "name images slug")
      .populate("category", "name");

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(cleanProduct(product));
  } catch (err) {
    console.error("Error fetching product by slug:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

module.exports = router;
