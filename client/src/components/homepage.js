
import { useState} from 'react';
import {dateStringFormat, extractUsernameAndDate} from './utils.js';
import { AskQuestionButton} from './newquestion.js';
import axios from 'axios';


export function FormattedUsername({ username }) {
    const words = username.split(" ");
    return words.map((word, index, array) => (
      <span key={index}>
        <span className="username">{word}</span>
        {index !== array.length - 1 && ' '}
      </span>
    ));
  };


// SearchBar Component
export function SearchBar({ onSearch }) {  // accept a callback prop for search
    const [searchTerm, setSearchTerm] = useState('');
  
    const handleSearch = () => {
      onSearch(searchTerm);
    };
  
    return (
      <input
        type="text"
        id="search-bar"
        placeholder="Search..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
      />
    );
}

export function LeftMenu({answersChanged, setAnswersChanged, questions, setQuestions, questionCount, setQuestionCount, showAskButton, setShowAskButton, clickedQuestion, setClickedQuestion,
    isSearchActive, setIsSearchActive, showTags, setShowTags, showAnsForm, setShowAnsForm, AnsFormErrors, setAnsFormErrors, showForm, setShowForm, formErrors, setFormErrors, executeSearch,
    displayQuestionsByNewest, displayQuestionsByActivity, displayUnansweredQuestions, showProfile, setShowProfile, showProfileTags, setShowProfileTags, showAnsweredQuestions, setShowAnsweredQuestions,
    showProfileAnswers, setShowProfileAnswers, user, setSelectedUser, showWelcome, setShowWelcome, welcomeComplete, setWelcomeComplete, setUser, setUserReputation}) {

    const handleTagsLinkClick = (event) => {
      event.preventDefault();
      setShowProfile(false);
      setShowProfileTags(false);
      setShowAnsweredQuestions(false);
      setShowProfileAnswers(false);
      setShowTags(true);
      setShowForm(false);
      setShowAnsForm(false);
      setClickedQuestion(null);
      setIsSearchActive(false);
      setAnsFormErrors({ text: '', username: '' });
      setFormErrors({ title: '', summary: '', text: '', tags: '', username: '' });
    };
  
    const handleQuestionsLinkClick = (event) => {
      event.preventDefault();
      setShowProfile(false);
      setShowProfileTags(false);
      setShowAnsweredQuestions(false);
      setShowProfileAnswers(false);
      setShowTags(false);
      setShowForm(false);
      setShowAnsForm(false);
      setClickedQuestion(null);
      setIsSearchActive(false);
      displayQuestionsByNewest();
      setAnsFormErrors({ text: '', username: '' });
      setFormErrors({ title: '', summary: '', text: '', tags: '', username: '' });
    };

    const handleProfileLinkClick = async (event) => {
    try {
      event.preventDefault();
      const response = await axios.get(`http://localhost:8000/users/${user.user._id}`);
      setUserReputation(response.data.reputation);
      setShowProfileTags(false);
      setShowAnsweredQuestions(false);
      setShowProfileAnswers(false);
      setSelectedUser(user.user);
      setShowProfile(true);
      setShowTags(false);
      setShowForm(false);
      setShowAnsForm(false);
      setClickedQuestion(null);
      setIsSearchActive(false);
      setAnsFormErrors({ text: '', username: '' });
      setFormErrors({ title: '', summary: '', text: '', tags: '', username: '' });
      } 
    catch (error) {
      console.log('Error fetching user:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
    };
  
    const handleLogoutLinkClick = async (event) => {
      event.preventDefault();
      try {
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
        setShowAnsForm(false);
        setClickedQuestion(null);
        setIsSearchActive(false);
        setAnsFormErrors({ text: '', username: '' });
        setFormErrors({ title: '', summary: '', text: '', tags: '', username: '' });
      } catch (error) {
        console.error('Logout failed:', error.response ? error.response.data.message : error.message);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later.');
        }
      }
    };
    
    return (
        <div id="left-menu">
          <ul className="menu-list">
            <li><a href="/#" id="questions-link" onClick={handleQuestionsLinkClick} style={{ backgroundColor: (!showForm && !showTags && !clickedQuestion && !showProfile) ? 'lightgray' : 'transparent' }}>Questions</a></li>
            <li><a href="/#" id="tags-link" onClick={handleTagsLinkClick} style={{ backgroundColor: showTags ? 'lightgray' : 'transparent' }}>Tags</a></li>
            {user && user.user && <li><a href="/#" id="profile-link" onClick={handleProfileLinkClick} style={{ backgroundColor: showProfile ? 'lightgray' : 'transparent' }}>User Profile</a></li>}
            {user && user.user && <li><a href="/#" id="logout-link" onClick={handleLogoutLinkClick} style={{ backgroundColor: 'transparent' }}>Logout</a></li>}
          </ul>
        </div>
      );
    }



export function QuestionList({ questions, setClickedQuestion }) {
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
                <a href="/#" onClick={(e) => { e.preventDefault(); incrementViewCount(question); }}>
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

export function RightTopContainer({ displayQuestionsByNewest, displayQuestionsByActivity, displayUnansweredQuestions, questionCount, showAskButton, setShowForm, isSearchActive, showTags, showProfile, 
  user}) {
    return (
      <div id="right-top-container" style={{ borderBottom: (showTags || showProfile) ? 'none' : '' }}>
        <div id="tags-container" style={{ border: 'hidden' }}></div>
        <div className="question-header">
          {
            !showTags && !showProfile &&
            <>
              <h1 id="question-heading">
                {isSearchActive ? "Search Results" : "All Questions"}
              </h1>
              {showAskButton && user && user.user && <AskQuestionButton setShowForm={setShowForm} />}
            </>
          }
        </div>
        <div className="sub-header">
          {
            !showTags && !showProfile &&
            <p id="question-count">
              {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
            </p>
          }
          {
            !showTags && !showProfile &&
            <div className="button-group">
              <button id="newest-btn" onClick={displayQuestionsByNewest}>Newest</button>
              <button id="active-btn" onClick={displayQuestionsByActivity}>Active</button>
              <button id="unanswered-btn" onClick={displayUnansweredQuestions}>Unanswered</button> 
            </div>
          }
        </div>
      </div>
    );
  }