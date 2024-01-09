import { useState, useEffect } from 'react';
import axios from 'axios';
import { QuestionForm} from './newquestion.js';
import ProfileTagList from './profileTags.js';
import { dateStringFormat, extractUsernameAndDate } from './utils.js';
import { FormattedUsername } from './homepage.js';
import { ProfileAnswerList } from './profileAnswers.js';


export function ProfilePage({ user, errors, showForm, setShowForm, setShowTags, setShowProfile, setClickedQuestion, postQuestion, showProfileTags, setShowProfileTags, showAnsweredQuestions, 
  setShowAnsweredQuestions, showProfileAnswers, setShowProfileAnswers, selectedUser, setSelectedUser, setShowWelcome, setWelcomeComplete, userReputation, setUserReputation}) {

  const [questions, setQuestions] = useState([]);
  const [existingQuestion, setExistingQuestion] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [selectedUserReputation, setSelectedUserReputation] = useState(userReputation);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const [allUsers, setAllUsers] = useState([]); // New state for storing all users

  if(!selectedUser) {
    setSelectedUser(user.user);
    setSelectedUserReputation(userReputation);
  }

  const handleUserClick = (clickedUser) => {
    setSelectedUser(clickedUser);
    setSelectedUserReputation(clickedUser.reputation);
  };

  const handleDeleteUser = async (userId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this user? This action cannot be undone.");
    if (isConfirmed) {
    try {
      await axios.delete(`http://localhost:8000/user/${userId}`);
      // Update the allUsers state to remove the deleted user
      setAllUsers(allUsers.filter(user => user._id !== userId));

      // Check if the deleted user is the same as the logged-in user
      if (user.user._id === userId) {
        // If the deleted user is the current user, log them out
        const response = await axios.post('http://localhost:8000/logout');
        console.log(response.data.message);
        setShowWelcome(true);
        setWelcomeComplete(false);
        setShowProfileTags(false);
        setShowAnsweredQuestions(false);
        setShowProfileAnswers(false);
        setShowProfile(false);
        setShowTags(false);
        setShowForm(false);
        setClickedQuestion(null);
    }
    } catch (error) {
      console.error('Error deleting user:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
    }
    else {
      console.log('User deletion cancelled');
    }
  };
  


  const handleViewAnsweredQuestionsClick = async () => {
    // Fetch the answered questions here
    try {
      const response = await axios.get(`http://localhost:8000/user/${selectedUser._id}/answeredQuestions`);
      setAnsweredQuestions(response.data);
      setShowAnsweredQuestions(true);
    } catch (error) {
      console.log('Error fetching answered questions:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };

  const toggleTagsDisplay = () => {
    setShowProfileTags(true);
  };

  const handleQuestionClick = (question) => {
    setExistingQuestion(question);
    setShowForm(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await axios.delete(`http://localhost:8000/questions/${questionId}`);
      // Update the questions state to remove the deleted question
      setQuestions(questions.filter(question => question._id !== questionId));
    } catch (error) {
      console.log('Error deleting question:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };  


  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/users/${selectedUser._id}/questions`);
        setQuestions(response.data);
      } catch (error) {
        console.log('Error fetching questions:', error);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later.');
        }
      }
    };

    fetchQuestions();

    // New useEffect for fetching users if the user is an admin
    if (selectedUser.isAdmin) {
      const fetchUsers = async () => {
        try {
          const response = await axios.get('http://localhost:8000/users');
          setAllUsers(response.data);
        } catch (error) {
          console.log('Error fetching users:', error);
          if(error.code === 'ERR_NETWORK') {
            window.alert('Error connecting to server. Please try again later.');
          }
        }
      };

      fetchUsers();
    }
  }, [selectedUser]);

  const registrationDate = new Date(selectedUser.registrationDate);
  const now = new Date();
  const membershipDuration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
  return (
    <div>
    {!showProfileTags && !showAnsweredQuestions && !showForm && (
      <div>
        <h2 style = {{marginLeft: '10px' }}>{selectedUser.username}'s Profile</h2>
        <p style = {{marginLeft: '10px' }}>Member for: {membershipDuration} days</p>
        <p style = {{marginLeft: '10px' }}>Reputation: {user.user === selectedUser ? userReputation : selectedUser.reputation}</p>
        {selectedUser.isAdmin && (
            <div>
              <h3 style = {{marginLeft: '10px' }}>List of All Users:</h3>
              <ul>
                {allUsers.map(u => (
                  <li key={u._id}>
                    <button style={{marginRight: '10px' }} onClick={() => handleUserClick(u)}>{u.username}</button>
                    <button style={{color: 'red' }} onClick={() => handleDeleteUser(u._id)} className="delete-user-button">Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        <div>
          <button style={{marginLeft: '10px', marginRight: '10px' }} onClick={toggleTagsDisplay}>View {selectedUser.username}'s Tags</button>
          <button onClick={handleViewAnsweredQuestionsClick}>View Questions Answered by {selectedUser.username}</button>
          <h3 style = {{marginLeft: '10px' }}>Questions Asked by {selectedUser.username}:</h3>
          {questions.length > 0 ? (
            <ul>
              {questions.map(question => (
                <li key={question._id}>
                  <button 
                    onClick={() => handleQuestionClick(question)}
                    className="question-title-button"
                  >
                    {question.title}
                  </button>
                  <button 
                    onClick={() => handleDeleteQuestion(question._id)}
                    className="delete-question-button"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p style = {{marginLeft: '10px' }}>No Questions Found</p>
          )}
        </div>
      </div>
    )}
      {showProfileTags && <ProfileTagList selectedUser={selectedUser} />}
      {showAnsweredQuestions && !showProfileAnswers && <ProfileQuestionList questions={answeredQuestions} setClickedQuestion={setSelectedQuestion} selectedUser={selectedUser} setShowProfileAnswers={setShowProfileAnswers}/>}
      {existingQuestion && showForm &&
        <QuestionForm 
          existingQuestion={existingQuestion}
          errors={errors}
          setShowTags = {setShowTags}
          setShowProfile = {setShowProfile}
          setClickedQuestion={setClickedQuestion}
          postQuestion={postQuestion}
        />
      }
      {selectedQuestion && showProfileAnswers &&  
        <ProfileAnswerList
          userReputation = {userReputation}
          setUserReputation = {setUserReputation}
          selectedUserReputation = {selectedUserReputation}
          setSelectedUserReputation = {setSelectedUserReputation}
          selectedUser={selectedUser} 
          question={selectedQuestion}
          setShowForm={setShowForm} 
          setShowTags={setShowTags}
          setQuestion={setSelectedQuestion}
          user = {user}
        />
      }
    </div>
  );
  
}

export function ProfileQuestionList({ questions, setClickedQuestion, selectedUser, setShowProfileAnswers}) {
      const [currentPage, setCurrentPage] = useState(0);
      const questionsPerPage = 5;
    
      const lastIndex = (currentPage + 1) * questionsPerPage;
      const firstIndex = lastIndex - questionsPerPage;
      const currentQuestions = questions.slice(firstIndex, lastIndex);
      const totalPages = Math.ceil(questions.length / questionsPerPage);
    
      const handleNext = () => {
        setCurrentPage((prevPage) => (prevPage + 1) % totalPages);
      };
    
      const handlePrev = () => {
        setCurrentPage((prevPage) => (prevPage > 0 ? prevPage - 1 : totalPages - 1));
      };

      //May need to remove this
      const incrementViewCount = async (question) => {
        try {
          const response = await axios.patch(`http://localhost:8000/questions/${question._id}/views`);
          setClickedQuestion(response.data.question);
        } catch (error) {
          console.error('Error incrementing view count:', error);
          if(error.code === 'ERR_NETWORK') {
            window.alert('Error connecting to server. Please try again later.');
          }
        }
      };
  
  return (
    <div className='question-list-container'>
      <div className="questions-header">
        <h2 style={{ marginLeft: '20px' , marginTop: '20px'}}>Questions Answered by {selectedUser.username}</h2>
        <h2 style={{ marginLeft: '20px' , marginTop: '20px'}}>({questions.length}) Questions </h2>
      </div>
      {currentQuestions.map((question) => {
            const { _id, answers, views, title, summary, tags, ask_date_time, asked_by } = question;
            let dateInfo = dateStringFormat(new Date(ask_date_time), asked_by);
            let { username, datePart } = extractUsernameAndDate(dateInfo);
    
            return (
              <div key={_id} className="question-cell">
                <div className="left">
                  <p>{answers.length} answers</p>
                  <p>{views} views</p>
                </div>
                <div className="middle">
                <a href="/#" onClick={(e) => { e.preventDefault(); setClickedQuestion(question); incrementViewCount(question); setShowProfileAnswers(true); }}>
                    <h3>{title}</h3>
                  </a>
                  <p className="summary">{summary}</p>
                  {tags.map(tid => <span key={tid._id} className="tag-box">{tid.name}</span>)}
                </div>
                <div className="right">
                  <FormattedUsername username={username} type="question" />
                  {datePart}
                </div>
              </div>
            );
          })}
          <div className="question-page-buttons-cont">
            <button className="question-page-button" onClick={handlePrev} disabled={currentPage === 0}>Prev</button>
            <button className="question-page-button" onClick={handleNext} disabled={questions.length === 0 || questions.length <= questionsPerPage}>Next</button>
          </div>
          </div>
  );
}

