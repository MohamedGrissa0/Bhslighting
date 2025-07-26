const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'image'], required: true },
  content: { type: String, required: true },
});

const articleSchema = new mongoose.Schema(
  {
    
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, 
    mainImage: { type: String },
    blocks: [blockSchema],
    published: { type: Boolean, default: false }, // ✅ NEW FIELD
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
