const mongoose = require('mongoose');
require('mongoose-paginate-v2');

const documentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'Dosya adı gereklidir'],
    trim: true
  },
  fileType: {
    type: String,
    required: [true, 'Dosya türü gereklidir'],
    enum: ['pdf', 'docx', 'txt'],
    lowercase: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  contentText: {
    type: String,
    required: [true, 'Doküman içeriği gereklidir'],
    maxlength: [1000000, 'Doküman içeriği çok büyük'] // 1MB limit
  },
  summaryText: {
    type: String,
    default: null,
    maxlength: [10000, 'Özet çok büyük']
  },
  keywords: [{
    type: String,
    trim: true
  }],
  embedding: {
    type: [Number], // Vektör için sayı dizisi
    default: null
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  lastProcessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Text index for full-text search
documentSchema.index({ contentText: 'text' });

// Compound index for user documents
documentSchema.index({ ownerId: 1, uploadDate: -1 });

// Vector index for semantic search (if using MongoDB Atlas)
// This would be created via MongoDB Atlas interface or migration script
// documentSchema.index({ embedding: 'vector' }, { 
//   numDimensions: 768, 
//   similarity: 'cosine' 
// });

// Virtual for document age
documentSchema.virtual('age').get(function() {
  return Date.now() - this.uploadDate;
});

// Ensure virtual fields are serialized
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

// Add pagination plugin
documentSchema.plugin(require('mongoose-paginate-v2'));

module.exports = mongoose.model('Document', documentSchema); 