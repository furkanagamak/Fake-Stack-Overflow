// Run this script to launch the server.
// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

let Question = require('./models/questions');
let Answer = require('./models/answers');
let Tag = require('./models/tags');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('./models/users');
const Comment = require('./models/comments');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());    //not sure if this is necessary

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/fake_so', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected.'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// User Session configuration
app.use(session({
  secret: 'furkan-faiz-secret-key', // Can replace this in the future
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/fake_so' }),
  cookie: { maxAge: 180 * 60 * 1000 ,   httpOnly: true  }, // Session expiry (3 hours in milliseconds)
}));

app.options('*', cors());

// POST register a new user
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Password contains username or part of email
    if(password.includes(username) || password.includes(email.split('@')[0])) {
      return res.status(400).json({ message: 'Password should not contain username or email' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create a new user
    user = new User({
      username,
      email,
      password // Password will be hashed in the pre-save middleware
    });

    // Save the user
    await user.save();

    res.status(201).json({ message: 'User registered successfully', userId: user._id, user: user});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST login an existing user
app.post('/login', async (req, res) => {
  if(req.session.userId) { // Check if user is already logged in
    let user = await User.findOne({ _id: req.session.userId });
    res.json({ user: user, status: 'EXISTS', message: 'Already logged in'});
  }
  else { // If not logged in, then log in
    try {
      const { email, password } = req.body;

      // Find the user by email
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Compare passwords
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Start a session
      req.session.userId = user._id;

      res.json({ message: 'Logged in successfully', userId: user._id, user: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
});

// POST logout a user
app.post('/logout', (req, res) => {
  if (req.session && req.session.userId) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out, please try again' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  } else {
    res.status(400).json({ message: 'No user is currently logged in' });
  }
});

// GET user by user ID
app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all questions of a user by user ID
app.get('/users/:id/questions', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('questionsAsked');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.questionsAsked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all answers of a user by user ID
app.get('/users/:id/answers', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('answersPosted');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.answersPosted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all tags of a user by user ID
app.get('/users/:id/tags', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    // Get tags of a user by userID of tags schema
    const userTags = await Tag.find({ userId: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(userTags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all comments of a question by question ID
app.get('/questions/:id/comments', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('comments');
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all comments of an answer by answer ID
app.get('/answers/:id/comments', async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate('comments');
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }
    res.json(answer.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET method to find all questions answered by a user
app.get('/user/:userId/answeredQuestions', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all answers posted by the user
    const userAnswers = await Answer.find({ userId: req.params.userId });

    // Extract answer IDs
    const answerIds = userAnswers.map(answer => answer._id);

    // Find all questions that have any of the user's answers
    const questions = await Question.find({ answers: { $in: answerIds } }).populate('tags');

    res.json(questions);
} catch (error) {
    res.status(500).json({ message: error.message });
}
});

// GET all questions
app.get('/questions', async (req, res) => {
  try {
      const questions = await Question.find({}).populate('tags');
      res.json(questions);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// GET a specific question by ID
app.get('/questions/:id', async (req, res) => {
  try {
      const question = await Question.findById(req.params.id);  //No "populate" method, simply returns objectIDs of referenced tags and answers
      //const question = await Question.findById(req.params.id).populate('answers tags');     //version with populate method, returns full content of referenced tags and answers
      if (!question) {
          return res.status(404).json({ message: 'Question not found' });
      }
      res.json(question);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// GET answers by ID
app.get('/answers/:id', async (req, res) => {
  try {
      const answer = await Answer.findById(req.params.id);
      if (!answer) {
          return res.status(404).json({ message: 'Answer not found' });
      }
      res.json(answer);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// GET all answers for a specific question by question ID
app.get('/questions/:id/answers', async (req, res) => {
  try {
    // Find the question by ID
    const question = await Question.findById(req.params.id).populate('answers');
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if the question has any answers
    if (question.answers.length === 0) {
      return res.status(404).json({ message: 'No answers found for this question' });
    }

    // Return the answers
    res.json(question.answers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Note: difference in the two GET methods for answers is that one gets a specific answer by its ID, the other gets all answers given a question ID

// GET all tags
app.get('/tags', async (req, res) => {
  try {
      const tags = await Tag.find({});
      res.json(tags);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// GET all tags given a question ID
app.get('/questions/:questionId/tags', async (req, res) => {
  try {
      const questionId = req.params.questionId;
      
      // Find the question and populate its tags
      const question = await Question.findById(questionId).populate('tags');
      
      if (!question) {
          return res.status(404).send({ message: 'Question not found' });
      }

      // Extract tags from the question
      const tags = question.tags.map(tag => ({
          id: tag._id,
          name: tag.name,
          url: tag.url
      }));

      res.send(tags);
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Internal Server Error' });
  }
});


// GET Tags by ID
app.get('/tags/:id', async (req, res) => {
  try {
      const answer = await Answer.findById(req.params.id);
      if (!answer) {
          return res.status(404).json({ message: 'Answer not found' });
      }
      res.json(answer);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// POST a new question
app.post('/questions', async (req, res) => {
  try {
    const userId = req.session.userId; // Get the user ID from the session
    // Fetch the user to check their reputation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let newTagIds = [];
    let canProceed = true; // Flag to indicate if the process can continue

    // Create or find tags
    const tagIds = await Promise.all(req.body.tags.map(async tagName => {
      if (!canProceed) return null; // Skip further processing if canProceed is false
      let tag = await Tag.findOne({ name: tagName });
      if (!tag) {
        // Check if user's reputation is more than 50 to create a new tag
        if (user.isAdmin === true || user.reputation >= 50) {
          tag = new Tag({ name: tagName, userId: userId});
          await tag.save();
          newTagIds.push(tag._id); // Add new tag's ID to newTagIds array
        } else {
          canProceed = false; // Set flag to false if user cannot create a tag
          res.status(403).json({ message: "Insufficient reputation to create new tags" });
          return null;
        }
      }
      return tag._id;
    }));

    if (!canProceed) return; // Exit the function if canProceed is false

    // Create a new question
    let question = new Question({
      title: req.body.title,
      userId: userId,
      text: req.body.text,
      summary: req.body.summary,
      tags: tagIds,
      asked_by: req.body.asked_by || 'Anonymous' // Use anonymous when empty string, 0, false, null, undefined, or NaN
    });

    await question.save(); // Save the question

    await User.findByIdAndUpdate(userId, { $push: { questionsAsked: question._id } }); // Add the question to the specific user

    // If there are new tags, update user's tagsCreated array
    if (newTagIds.length > 0) {
      await User.findByIdAndUpdate(userId, { $push: { tagsCreated: { $each: newTagIds } } });
    }
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST a new answer to a question
app.post('/questions/:id/answers', async (req, res) => {
  try {
    const userId = req.session.userId; // Get the user ID from the session
    // Find the question that the answer belongs to
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Create a new answer
    let answer = new Answer({
      text: req.body.text,
      ans_by: req.body.ans_by || 'Anonymous', // Use anonymous when empty string, 0, false, null, undefined, or NaN
      userId: userId
    });

    // Save the answer
    await answer.save();

    // Associate answer with the question
    question.answers.push(answer._id);
    await question.save();

    await User.findByIdAndUpdate(userId, { $push: { answersPosted: answer._id } }); // Add the answer to the specific user
    res.status(201).json(question); // Return the question after posting an answer to be able to update the clicked question. Otherwise, the answers page will not be updated immediately.
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH Edit a question by question ID
app.patch('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const user = await User.findOne({ questionsAsked: question._id });

    if (!user) {
      return res.status(404).send('User not found');
    }

    let newTagIds = [];
    let canProceed = true; // Flag to indicate if the process can continue

    // Create or find tags
    const tagIds = await Promise.all(req.body.tags.map(async tagName => {
      if (!canProceed) return null; // Skip further processing if canProceed is false
      let tag = await Tag.findOne({ name: tagName });
      if (!tag) {
        // Check if user's reputation is more than 50 to create a new tag
        if (user.isAdmin === true || user.reputation >= 50) {
          tag = new Tag({ name: tagName, userId: user._id});
          await tag.save();
          newTagIds.push(tag._id); // Add new tag's ID to newTagIds array
        } else {
          canProceed = false; // Set flag to false if user cannot create a tag
          res.status(403).json({ message: "Insufficient reputation to create new tags" });
          return null;
        }
      }
      return tag._id;
    }));

    if (!canProceed) return; // Exit the function if canProceed is false

    // Update the question's title, summary, and text
    question.title = req.body.title;
    question.summary = req.body.summary;
    question.text = req.body.text;
    question.tags = tagIds;
    await question.save();

    // If there are new tags, update user's tagsCreated array
    if (newTagIds.length > 0) {
      await User.findByIdAndUpdate(user._id, { $push: { tagsCreated: { $each: newTagIds } } });
    }

    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH Edit an answer by answer ID
app.patch('/answers/:id', async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Update the answer's text
    answer.text = req.body.text;
    await answer.save();

    res.json(answer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH Edit a tag by tag ID
app.patch('/tags/:id', async (req, res) => {
  try {
    const userFind = await User.findOne({ tagsCreated: req.params.id });
    const userId = userFind._id;
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Find all questions that use the tag
    const questionsUsingTag = await Question.find({ tags: tag._id });

    // Get user and their asked questions
    const user = await User.findById(userId).populate('questionsAsked');

    // Check if the tag is used in questions not asked by the current user
    const isTagUsedByOthers = questionsUsingTag.some(question => 
      !user.questionsAsked.some(userQuestion => userQuestion._id.equals(question._id))
    );

    // Proceed only if the tag is not used by other users
    if (isTagUsedByOthers) {
      return res.status(403).json({ message: 'Tag is in use by other users' });
    }

    // Check if a tag with the same name exists
    const tagsWithSameName = await Tag.find({ name: req.body.name });
    if(tagsWithSameName.length > 0) {
      return res.status(400).json({ message: 'A tag with the same name already exists' });
    }

    // Update the tag's name
    tag.name = req.body.name;
    await tag.save();

    res.json(tag);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a question by question ID
app.delete('/questions/:id', async (req, res) => {
  try {
      const questionId = req.params.id;
      const user = await User.findOne({ questionsAsked: questionId });

      if (!user) {
        return res.status(404).send('User not found');
      }
      const userId = user._id;

      const question = await Question.findById(questionId);
      if (!question) {
          return res.status(404).send('Question not found');
      }

      // Remove references from the user's 'questionsAsked' array
      await User.findByIdAndUpdate(userId, { $pull: { questionsAsked: questionId } });

      // Iterate over each answer and update the corresponding user
      for (const answerId of question.answers) {
        const answer = await Answer.findById(answerId);
        if (answer) {
            // Find user by the identifier stored in 'ans_by'
            const userIdentifier = answer.userId;
            const user = await User.findOne({ _id: userIdentifier });

            if (user) {
                await User.findByIdAndUpdate(user._id, { $pull: { answersPosted: answerId } });
            }
        }
    }

      // Delete all answers associated with the question
      await Answer.deleteMany({ _id: { $in: question.answers } });

      // Iterate over each comment and update the corresponding user
      for (const commentId of question.comments) {
        const comment = await Comment.findById(commentId);
        if (comment) {
          // Find user by the identifier stored in 'comment_by'
          const userIdentifier = comment.userId;
          const user = await User.findOne({ _id: userIdentifier });

          if (user) {
            await User.findByIdAndUpdate(user._id, { $pull: { commentsPosted: commentId } });
          }
        }
      }

      // Delete all comments associated with the question
      await Comment.deleteMany({ _id: {$in: question.comments} });

      // Finally, delete the question
      await Question.findByIdAndDelete(questionId);

      res.send('Question deleted successfully');
  } catch (error) {
      res.status(500).send('Server error');
  }
});


// DELETE an answer by answer ID
app.delete('/answers/:id', async (req, res) => {
  try {
      const answerId = req.params.id;
      const user = await User.findOne({ answersPosted: answerId });
      const userId = user._id;

      // find the answer by ID
      const answer = await Answer.findOne({ _id: answerId });

      // Find the question that contains the answer
      const question = await Question.findOne({ answers: answerId });
      if (!question) {
          return res.status(404).send('Question for the answer not found');
      }

      // Remove the answer from the question's answers array
      await Question.findByIdAndUpdate(question._id, { $pull: { answers: answerId } });

      // Remove the answer from the user's answersPosted array
      await User.findByIdAndUpdate(userId, { $pull: { answersPosted: answerId } });

      // Iterate over each comment and update the corresponding user
      for (const commentId of answer.comments) {
        const comment = await Comment.findById(commentId);
        if (comment) {
          // Find user by the identifier stored in 'comment_by'
          const userIdentifier = comment.userId;
          const user = await User.findOne({ _id: userIdentifier });

          if (user) {
            await User.findByIdAndUpdate(user._id, { $pull: { commentsPosted: commentId } });
          }
        }
      }

      // Delete all comments associated with the answer
      await Comment.deleteMany({ _id: {$in: answer.comments} });

      // Finally, Delete the answer
      await Answer.findByIdAndDelete(answerId);

      res.send('Answer deleted successfully');
  } catch (error) {
      res.status(500).send('Server error: ' + error.message);
  }
});

// DELETE a tag by tag ID
app.delete('/tags/:id', async (req, res) => {
  try {
    const userFind = await User.findOne({ tagsCreated: req.params.id });
    const userId = userFind._id;
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Find all questions that use the tag
    const questionsUsingTag = await Question.find({ tags: tag._id });

    // Get user and their asked questions
    const user = await User.findById(userId).populate('questionsAsked');

    // Check if the tag is used in questions not asked by the current user
    const isTagUsedByOthers = questionsUsingTag.some(question => 
      !user.questionsAsked.some(userQuestion => userQuestion._id.equals(question._id))
    );

    // Proceed only if the tag is not used by other users
    if (isTagUsedByOthers) {
      return res.status(403).json({ message: 'Tag is in use by other users and cannot be deleted' });
    }

    // Remove the tag from the user's tagsCreated array
    user.tagsCreated = user.tagsCreated.filter(tagId => !tagId.equals(tag._id));
    await user.save();

    // Remove the tag from all questions asked by this user
    await Question.updateMany(
      { _id: { $in: user.questionsAsked.map(q => q._id) } },
      { $pull: { tags: tag._id } }
    );

    // Delete the tag
    await Tag.findByIdAndDelete(tag._id);

    res.json({ message: 'Tag successfully deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a user by ID
app.delete('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user by ID
    const user = await User.findById(userId);

    // Find all tags created by the user using the user's ID and tags created array
    const userTags = await Tag.find({ userId: userId });

    for (let tag of userTags) {
      // Find all questions that use the tag
      const questionsUsingTag = await Question.find({ tags: tag._id });

      // Get user and their asked questions
      const user = await User.findById(userId).populate('questionsAsked');

      // Check if the tag is used in questions not asked by the current user
      const isTagUsedByOthers = questionsUsingTag.some(question => 
        !user.questionsAsked.some(userQuestion => userQuestion._id.equals(question._id))
      );

      // Delete tag only if it is not used by other users
      if (!isTagUsedByOthers) {
        await Tag.findByIdAndDelete(tag._id);
      }
    }

    const userQuestions = await Question.find({ userId: userId });

    // Delete answers to the questions posted by the user
    for (let question of userQuestions) {
      await Answer.deleteMany({ _id: { $in: question.answers } });
    }

    // Delete comments to the questions posted by the user
    for (let question of userQuestions) {
      await Comment.deleteMany({ _id: { $in: question.comments } });
    }

    // Delete questions asked by the user
    await Question.deleteMany({ userId: userId });

    // Find all answers posted by the user and delete associated comments
    const answers = await Answer.find({ userId: userId });
    for (let answer of answers) {
      await Comment.deleteMany({ _id: { $in: answer.comments } });
    }
    // Delete answers posted by the user
    await Answer.deleteMany({ userId: userId });

    // Find all comments posted by the user and delete them
    await Comment.deleteMany({ userId: userId });

    // Finally, delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).send('User and all related data deleted successfully');
  } catch (error) {
    res.status(500).send('Error deleting user: ' + error.message);
  }
});

// POST a new comment to a question
app.post('/questions/:id/comments', async (req, res) => {
  try {
    const userId = req.session.userId; // Get the user ID from the session
    const text = req.body.text;
    const username = req.body.username;
    const questionId = req.params.id; //may need to add this to schema

    // Create a new comment
    const comment = new Comment({
      text: text,
      comment_by: username,
      userId: userId
    });

    await comment.save();

    // Add the comment to the question's comments array
    await Question.findByIdAndUpdate(questionId, { $push: { comments: comment._id } });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new comment to an answer by answer ID
app.post('/answers/:id/comments', async (req, res) => {
  try {
    const userId = req.session.userId; // Get the user ID from the session
    const answerId = req.params.id;
    const text = req.body.text
    const username = req.body.username;

    // Create a new comment
    const answer = await Answer.findById(answerId);

    const comment = new Comment({ text, comment_by: username, userId: userId});
    await comment.save();

    // Add the comment to the answer's comments array
    answer.comments.push(comment);
    await answer.save();

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Error posting comment: ' + err.message });
  }
});


// PATCH increment view count of a question
app.patch('/questions/:id/views', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Increment the views count
    question.views += 1;
    await question.save();

    // Send back the updated question
    res.json({question});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH increment votes of a comment
app.patch('/comments/:id/upvote', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Increment the votes count
    comment.votes += 1;
    await comment.save();

    // Send back the updated comment
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH update reputation of a user
app.patch('/users/:userId/reputation', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { change } = req.body; // change can be positive or negative

    const user = await User.findById(userId);

    user.reputation += change;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// PATCH update votes on a question
app.patch('/questions/:questionId/votes', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const { voteChange } = req.body; // change can be pos or negative

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).send('Question not found');
    }

    question.votes += voteChange;
    await question.save();

    res.status(200).json(question);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// PATCH update votes on an answer
app.patch('/answers/:answerId/votes', async (req, res) => {
  try {
    const answerId = req.params.answerId;
    const { voteChange } = req.body; // change can be positive or negative

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).send('Answer not found');
    }

    answer.votes += voteChange;
    await answer.save();

    res.status(200).json(answer);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong.');
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  mongoose.disconnect();
  console.log('Server closed. Database instance disconnected');
  process.exit(0);
});
