const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  // Virtual for tag's URL
});

// Virtual for tag's URL
tagSchema.virtual('url').get(function () {
  return '/posts/tag/' + this._id;
});

module.exports = mongoose.model('Tag', tagSchema);
