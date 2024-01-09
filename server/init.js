// Setup database with initial test data.
// Include an admin user.
// Script should take admin credentials as arguments as described in the requirements doc.

const mongoose = require('mongoose');
const User = require('./models/users');
const db = 'mongodb://127.0.0.1:27017/fake_so';

const Question = require('./models/questions');
const Answer = require('./models/answers');
const Tag = require('./models/tags');
const Comment = require('./models/comments');

// Connect to MongoDB
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected.'))
  .catch(err => console.log(err));

async function main() {
  try {
    // Get the username and password from command line arguments
    const username = process.argv[2];
    const password = process.argv[3];

    if (!username || !password) {
      console.log('Please provide username and password for the admin user');
      process.exit(1);
    }

    await createAdminUser(username, password);
    await createInitialData();
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    mongoose.disconnect();
  }
}

main();

// This function will create an admin user
async function createAdminUser(username, password) {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: username });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(1);
    }

    // Create a new admin user
    const adminUser = new User({
      username: username,
      email: `${username.toLowerCase()}@fakeso.com`, // Convert username to lowercase and use fakeso.com domain
      password: password,
      isAdmin: true,
      reputation: 1000 // Give the admin user a lot of reputation
    });

    // Save the admin user
    await adminUser.save();
    console.log(`Admin User ${username} created successfully. The email is ${adminUser.email} and the password is ${password}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Function to generate a unique username
async function generateUniqueUsername(baseUsername) {
  let uniqueUsername = baseUsername;
  let counter = 0;
  let userExists = true;

  while (userExists) {
    const user = await User.findOne({ username: uniqueUsername });
    if (!user) {
      userExists = false;
    } else {
      counter++;
      uniqueUsername = `${baseUsername}${counter}`;
    }
  }

  return uniqueUsername;
}

async function createInitialData() {
  // Create users
  const baseUsername1 = `user${Math.floor(Math.random() * 10000)}`;
  const username1 = await generateUniqueUsername(baseUsername1);
  const email1 = `${username1}@fakeso.com`;
  const password = '123'; // Set a default password "123" for all users
  const reputation1 = 100;
  const registrationDate1 = new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365));
  const user1 = new User({
    username: username1,
    email: email1,
    password: password,
    reputation: reputation1,
    registrationDate: registrationDate1
  });
  await user1.save();
  console.log(`User ${username1} created successfully. The email is ${email1} and the password is ${password}`);

  const baseUsername2 = `user${Math.floor(Math.random() * 10000)}`;
  const username2 = await generateUniqueUsername(baseUsername2);
  const email2 = `${username2}@fakeso.com`;
  const reputation2 = 50;
  const registrationDate2 = new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365));
  const user2 = new User({
    username: username2,
    email: email2,
    password: password,
    reputation: reputation2,
    registrationDate: registrationDate2
  });
  await user2.save();
  console.log(`User ${username2} created successfully. The email is ${email2} and the password is ${password}`);

  const baseUsername3 = `user${Math.floor(Math.random() * 10000)}`;
  const username3 = await generateUniqueUsername(baseUsername3);
  const email3 = `${username3}@fakeso.com`;
  const reputation3 = 0;
  const registrationDate3 = new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365));
  const user3 = new User({
    username: username3,
    email: email3,
    password: password,
    reputation: reputation3,
    registrationDate: registrationDate3
  });
  await user3.save();
  console.log(`User ${username3} created successfully. The email is ${email3} and the password is ${password}`);

  const baseUsername4 = `user${Math.floor(Math.random() * 10000)}`;
  const username4 = await generateUniqueUsername(baseUsername4);
  const email4 = `${username4}@fakeso.com`;
  const reputation4 = -100;
  const registrationDate4 = new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365));
  const user4 = new User({
    username: username4,
    email: email4,
    password: password,
    reputation: reputation4,
    registrationDate: registrationDate4
  });
  await user4.save();
  console.log(`User ${username4} created successfully. The email is ${email4} and the password is ${password}`);

  // Create Tags
  const tag1 = new Tag({name: 'mongoose', userId: user1._id});
  await tag1.save();

  // Add Tag to User
  user1.tagsCreated.push(tag1._id);
  await user1.save();

  // Create Questions
  const question1 = new Question({
    title: 'Sample Question Title',
    userId: user1._id,
    summary: 'This is a sample question summary',
    text: 'This is a sample question text',
    tags: [tag1._id],
    asked_by: user1.username,
    ask_date_time: new Date(user1.registrationDate.getTime() + Math.floor(Math.random() * (Date.now() - user1.registrationDate.getTime()))),
    views: 20,
    votes: 20
  });
  await question1.save();

  // Add Question to User
  user1.questionsAsked.push(question1._id);
  await user1.save();

  // Create Answers
  const answer1 = new Answer({
    text: 'Sample Answer',
    userId: user2._id,
    ans_by: user2.username,
    ans_date_time: new Date((Math.max(question1.ask_date_time.getTime(), user2.registrationDate.getTime())) + 
                            Math.floor(Math.random() * (Date.now() - (Math.max(question1.ask_date_time.getTime(), user2.registrationDate.getTime()))))),
    votes: 5
  });
  await answer1.save();

  // Link Answer to User
  user2.answersPosted.push(answer1._id);
  await user2.save();

  // Link Answer to Question
  question1.answers.push(answer1._id);
  await question1.save();

  // Create Comments
  const comment1 = new Comment({
    text: 'Sample Comment',
    userId: user3._id,
    comment_by: user3.username,
    votes: 2
  });
  await comment1.save();

  // Link Comment to User
  user3.commentsPosted.push(comment1._id);
  await user3.save();

  // Link Comment to Question
  question1.comments.push(comment1._id);
  await question1.save();

  // Create Tags
  const tag2 = new Tag({name: 'routers', userId: user2._id});
  await tag2.save();

  // Add Tag to User
  user2.tagsCreated.push(tag2._id);
  await user2.save();

  // Create Questions
  const question2 = new Question({
    title: 'Sample Question Title 2',
    userId: user2._id,
    summary: 'This is a sample question summary 2',
    text: 'This is a sample question text 2',
    tags: [tag1._id, tag2._id],
    asked_by: user2.username,
    ask_date_time: new Date(user2.registrationDate.getTime() + Math.floor(Math.random() * (Date.now() - user2.registrationDate.getTime()))),
    views: 10,
    votes: 5
  });
  await question2.save();

  // Add Question to User
  user2.questionsAsked.push(question2._id);
  await user2.save();

  // Create Answers
  
  const answer2 = new Answer({
    text: 'Sample Answer 2',
    userId: user3._id,
    ans_by: user3.username,
    ans_date_time: new Date((Math.max(question2.ask_date_time.getTime(), user3.registrationDate.getTime())) + 
                            Math.floor(Math.random() * (Date.now() - (Math.max(question2.ask_date_time.getTime(), user3.registrationDate.getTime()))))),
    votes: -5
  });
  await answer2.save();

  // Link Answer to User
  user3.answersPosted.push(answer2._id);
  await user3.save();

  // Link Answer to Question
  question2.answers.push(answer2._id);
  await question2.save();

  // Create Comments
  const comment2 = new Comment({
    text: 'Sample Comment 2',
    userId: user1._id,
    comment_by: user1.username,
    votes: -2
  });
  await comment2.save();

  // Link Comment to User
  user1.commentsPosted.push(comment2._id);
  await user1.save();

  // Link Comment to Answer
  answer2.comments.push(comment2._id);
  await answer2.save();

   

  // Create Tags
  const tag3 = new Tag({name: 'react', userId: user4._id});
  await tag3.save();

  // Add Tag to User
  user4.tagsCreated.push(tag3._id);
  await user4.save();

  // Create Questions
  const question3 = new Question({
    title: 'Sample Question Title 3',
    userId: user4._id,
    summary: 'This is a sample question summary 3',
    text: 'This is a sample question text 3',
    tags: [tag1._id, tag3._id],
    asked_by: user4.username,
    ask_date_time: new Date(user4.registrationDate.getTime() + Math.floor(Math.random() * (Date.now() - user4.registrationDate.getTime()))),
    views: 27,
    votes: -10
  });
  await question3.save();

  // Add Question to User
  user4.questionsAsked.push(question3._id);
  await user4.save();

  // Create Comments
  const comment3 = new Comment({
    text: 'Sample Comment 3',
    userId: user2._id,
    comment_by: user2.username
  });
  await comment3.save();

  // Link Comment to User
  user2.commentsPosted.push(comment3._id);
  await user2.save();

  // Link Comment to Question
  question3.comments.push(comment3._id);
  await question3.save();
}