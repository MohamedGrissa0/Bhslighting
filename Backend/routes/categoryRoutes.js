  const express = require("express");
  const router = express.Router();
  const Category = require("../models/Category");
  const upload = require("../upload");
  const path = require("path");
  const fs = require("fs");

  // GET all categories, optional filter by parentCategory
  router.get("/", async (req, res) => {
    try {
      const parentCategory = req.query.parentCategory;
      // filter for main categories if explicitly "null" string or undefined for all
      const filter =
        parentCategory === "null"
          ? { parentCategory: null }
          : parentCategory
            ? { parentCategory }
            : {};
      const categories = await Category.find(filter).sort({ createdAt: -1 });
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST create category with optional parentCategory
router.post("/", upload.fields([{ name: "image", maxCount: 1 }]), async (req, res) => {
  try {
    const { name, description, parentCategory, slug } = req.body;

    if (!req.files || !req.files.image || !req.files.image[0]) {
      return res.status(400).json({ error: "Image is required" });
    }

    const imageFile = req.files.image[0];

    const newCategory = new Category({
      name,
      slug,
      description,
      img: imageFile.filename,
      parentCategory: parentCategory || null,
    });

    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Category creation failed:", err);
    res.status(400).json({ error: err.message || "Invalid category data" });
  }
});



  router.get("/slug/:slug", async (req, res) => {
    try {
      const product = await Category.findOne({ slug: req.params.slug })
      

      if (!product) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(product);
    } catch (err) {
      console.error("Error fetching Category by slug:", err);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });


  // PUT update category, including parentCategory
  router.put(
    "/:id",
    upload.fields([{ name: "image", maxCount: 1 }]),
    async (req, res) => {
      try {
        const { name, description, parentCategory, slug } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
          return res.status(400).json({ error: "The name is already used" });
        }



        // Delete old image if new one uploaded
        if (req.files?.image?.[0]) {
          const oldImagePath = path.join(__dirname, "../uploads", category.img);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
          category.img = req.files.image[0].filename;
        }

        category.name = name;
        category.slug = slug;

        category.description = description;
        category.parentCategory = parentCategory || null;

        const updated = await category.save();
        res.status(200).json(updated);
      } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: "Update failed" });
      }
    }
  );

  // GET single category by ID
  router.get("/:id", async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(200).json(category);
    } catch (err) {
      console.error("Failed to get category:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // DELETE category
  router.delete("/:id", async (req, res) => {
    try {
      await Category.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Delete failed" });
    }
  });

  module.exports = router;
