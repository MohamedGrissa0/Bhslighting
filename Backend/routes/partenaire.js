const express = require("express");
const multer = require("multer");
const Partenaire = require("../models/Partenaire");
const upload = require("../upload"); // your multer config

const router = express.Router();

// GET all partenaires, sorted newest first
router.get("/", async (req, res) => {
  try {
    const partenaires = await Partenaire.find().sort({ createdAt: -1 });
    res.json(partenaires);
  } catch (err) {
    console.error("GET /api/partenaires error:", err);
    res.status(500).json({ error: "Failed to fetch partenaires." });
  }
});

// POST a new partenaire with image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    const image = req.file?.filename;

    if (!name || !image) {
      return res.status(400).json({ error: "Name and image are required." });
    }

    const newPartenaire = new Partenaire({
      name,
      image: `/uploads/${image}`, // relative path for frontend to fetch
    });

    const saved = await newPartenaire.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /api/partenaires error:", err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to save partenaire." });
  }
});

// PUT update partenaire by id (with optional image upload)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required." });
    }

    const partenaire = await Partenaire.findById(req.params.id);
    if (!partenaire) {
      return res.status(404).json({ error: "Partenaire not found." });
    }

    partenaire.name = name;

    if (req.file?.filename) {
      partenaire.image = `/uploads/${req.file.filename}`;
    }

    const updated = await partenaire.save();
    res.json(updated);
  } catch (err) {
    console.error("PUT /api/partenaires/:id error:", err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to update partenaire." });
  }
});

// DELETE partenaire by id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Partenaire.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Partenaire not found." });
    }
    res.status(200).json({ message: "Deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/partenaires/:id error:", err);
    res.status(500).json({ error: "Failed to delete partenaire." });
  }
});

module.exports = router;
