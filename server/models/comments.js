const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  comment_by: { type: String, required: true },
  comment_date_time: { type: Date, default: Date.now },
  votes: { type: Number, default: 0 },
},); 

module.exports = mongoose.model('Comment', commentSchema);
