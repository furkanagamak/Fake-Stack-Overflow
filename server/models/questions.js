const mongoose = require('mongoose');

// const Comment = require('./comments');

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 50 },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  summary: { type: String, required: true, maxlength: 140},
  text: { type: String, required: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tag' }],
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  asked_by: { type: String, default: 'Anonymous' },
  ask_date_time: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // Decide which one to use later, only store object IDs instead of embedding for now
  // Virtual for question's URL
  votes: { type: Number, default: 0 }
});

// Virtual for question's URL
questionSchema.virtual('url').get(function () {
  return '/posts/question/' + this._id;
});

module.exports = mongoose.model('Question', questionSchema);
