const mongoose = require('mongoose');

// const Comment = require('./comments');

const answerSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  ans_by: { type: String, required: true},
  ans_date_time: { type: Date, default: Date.now },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // Decide which one to use later, only store object IDs instead of embedding for now
  // Virtual for answer's URL
  votes: { type: Number, default: 0 }
});

// Virtual for answer's URL
answerSchema.virtual('url').get(function () {
  return '/posts/answer/' + this._id;
});

module.exports = mongoose.model('Answer', answerSchema);
