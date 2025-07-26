const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../upload');
const Article = require('../models/Article');

// Multer upload middleware
const cpUpload = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

// CREATE ARTICLE
router.post('/', cpUpload, async (req, res) => {
  try {
    const { title, blocks, published, slug } = req.body;
    if (!title || !slug) return res.status(400).json({ error: 'Title and slug are required' });

    const exists = await Article.findOne({ title });
    if (exists) return res.status(400).json({ error: 'Title already exists' });

    const parsedBlocks = blocks ? JSON.parse(blocks) : [];
    let imageIndex = 0;
    const mappedBlocks = parsedBlocks.map((block) => {
      if (block.type === 'image' && block.content === 'placeholder') {
        const file = req.files?.images?.[imageIndex];
        imageIndex++;
        return {
          type: 'image',
          content: file?.filename || 'missing-image.jpg',
          originalName: file?.originalname || null
        };
      }
      return block;
    });

    const mainImage = req.files?.mainImage?.[0]?.filename || null;

    const article = new Article({
      title,
      slug,
      published: published === 'true' || published === true,
      mainImage,
      blocks: mappedBlocks
    });

    await article.save();
    res.status(201).json({ message: 'Article created', article });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE ARTICLE
router.put(
  "/:id",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "images", maxCount: 20 },
  ]),
  async (req, res) => {
          console.log(req.body)

    try {
      const articleId = req.params.id;
      const { title, slug, blocks: blocksJSON , published } = req.body;
      console.log(req.body)

      if (!title || !slug || !blocksJSON || !published) {
        return res.status(400).json({ error: "Title, slug, and blocks and published are required" });
      }

      const newBlocks = JSON.parse(blocksJSON);
      const existingArticle = await Article.findById(articleId);

      if (!existingArticle) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Merge new blocks with existing ones
      const mergedBlocks = newBlocks.map((newBlock) => {
        const existingBlock = existingArticle.blocks.find(b => b.id === newBlock.id);
        return {
          ...existingBlock,
          ...newBlock,
          content: newBlock.type === "image" && newBlock.content === "placeholder" && existingBlock?.content
            ? existingBlock.content
            : newBlock.content,
        };
      });

      // Match uploaded images with placeholders
      const uploadedImages = req.files?.images || [];
      let imageIndex = 0;
      for (let block of mergedBlocks) {
        if (block.type === "image" && block.content === "placeholder" && uploadedImages[imageIndex]) {
          block.content = uploadedImages[imageIndex].filename;
          imageIndex++;
        }
      }

      const updateData = {
        published:published ==="false" ? false : true,
        title,
        slug,
        blocks: mergedBlocks,
      };

      // Handle mainImage upload
      if (req.files?.mainImage?.[0]) {
        updateData.mainImage = req.files.mainImage[0].filename;
      }

      const updated = await Article.findByIdAndUpdate(articleId, updateData, { new: true });
      res.status(200).json(updated);
    } catch (err) {
      console.error("Update failed:", err);
      res.status(500).json({ error: "Server error during update" });
    }
  }
);

// GET ALL ARTICLES
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });

    const formattedArticles = articles.map(article => {
      const articleObj = article.toObject();

      return {
        ...articleObj,
        mainImage: articleObj.mainImage || null,
        published: articleObj.published,
        blocks: articleObj.blocks?.map(block => ({
          ...block,
          content: block.content
        })) || []
      };
    });

    res.json(formattedArticles);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET ARTICLE BY ID
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

 

    res.json(article);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ARTICLE BY SLUG
router.get('/slug/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE ARTICLE
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    // Delete main image
    if (article.mainImage) {
      const mainPath = path.join(__dirname, '../uploads/', article.mainImage);
      if (fs.existsSync(mainPath)) fs.unlinkSync(mainPath);
    }

    // Delete block images
    article.blocks.forEach(block => {
      if (block.type === 'image' && block.content) {
        const imgPath = path.join(__dirname, '../uploads/', block.content);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
    });

    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
