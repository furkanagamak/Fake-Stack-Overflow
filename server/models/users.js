const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

//const Question = require('./questions');
//const Tag = require('./tags');
//const Answer = require('./answers');
//const Comment = require('./comments');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  registrationDate: { type: Date, default: Date.now },
  reputation: { type: Number, default: 0 },
  //questionsAsked: { type: [Question.schema], default: [] },
  //tagsCreated: { type: [Tag.schema], default: [] },
  //answersPosted: { type: [Answer.schema], default: [] },
  //commentsPosted: { type: [Comment.schema], default: [] }, 
  questionsAsked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  tagsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  answersPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  commentsPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // Decide which one to use later, only store object IDs instead of embedding for now
  isAdmin: { type: Boolean, default: false }
});

// Virtual for user's URL
userSchema.virtual('url').get(function() {
  return '/users/' + this._id;
});

// hash password before saving new user
userSchema.pre('save', async function(next) {
  if (this.isModified('password') || this.isNew) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  }
  next();
});

// compare
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);

};

module.exports = mongoose.model('User', userSchema);