import { useState, useEffect } from 'react';
import { SearchBar, LeftMenu, QuestionList, RightTopContainer } from './homepage.js'
import { AnswerList, AnswerForm } from './answers.js';
import { QuestionForm} from './newquestion.js';
import TagList from './tags.js'
import axios from 'axios';
import { Welcome } from './welcome.js';
import { ProfilePage } from './profile.js';

//container component for questions, tags, answers, search results
export function RightMenu({answersChanged, setAnswersChanged, questions, setQuestions, questionCount, setQuestionCount, showAskButton, setShowAskButton, clickedQuestion, setClickedQuestion,
  isSearchActive, setIsSearchActive, showTags, setShowTags, showAnsForm, setShowAnsForm, AnsFormErrors, setAnsFormErrors, showForm, setShowForm, formErrors, setFormErrors, executeSearch,
  displayQuestionsByNewest, displayQuestionsByActivity, displayUnansweredQuestions, isQuestionsLoaded, user, setIsQuestionsLoaded, showProfile, setShowProfile, showProfileTags, setShowProfileTags,
  showAnsweredQuestions, setShowAnsweredQuestions, showProfileAnswers, setShowProfileAnswers, selectedUser, setSelectedUser, setShowWelcome, setWelcomeComplete, setUser, setUserReputation,
  userReputation}) {
  
  useEffect(() => {
    displayQuestionsByNewest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handlePostQuestion = (questionData, existingQuestion = null) => {
    setFormErrors({ title: '', summary: '', text: '', tags: ''});

    if (!questionData.title) {
      setFormErrors(prevErrors => ({ ...prevErrors, title: "The question title cannot be empty!" }));
      return;
    }

    //hyperlinking error checks
    const allHyperlinkPatterns = questionData.text.match(/\[.*?\]\(.*?\)/g) || [];

    // Validate pattern matches
    const invalidHyperlink = allHyperlinkPatterns.some(pattern => !/\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/.test(pattern));
    
    if (invalidHyperlink) {
      setFormErrors(prevErrors => ({ ...prevErrors, text: "Invalid hyperlink format!" }));
      return;
    }
    if (questionData.title.length > 50) {
      setFormErrors(prevErrors => ({ ...prevErrors, title: "The question title cannot be more than 50 characters!" }));
      return;
    }
    if (!questionData.summary) {
      setFormErrors(prevErrors => ({ ...prevErrors, summary: "The question summary cannot be empty!" }));
      return;
    }
    if (questionData.summary.length > 140) {
      setFormErrors(prevErrors => ({ ...prevErrors, summary: "The question summary cannot be more than 140 characters!" }));
      return;
    }
    if (!questionData.text) {
      setFormErrors(prevErrors => ({ ...prevErrors, text: "The question text cannot be empty!" }));
      return;
    }
    if (!questionData.tags.length) {
      setFormErrors(prevErrors => ({ ...prevErrors, tags: "A tag is required!" }));
      return;
    }

    if(questionData.tags.some(tag => tag.length > 10)) {
      setFormErrors(prevErrors => ({ ...prevErrors, tags: "A tag cannot have more than 10 characters!" }));
      return;
    }

    if(questionData.tags.length > 5) {
      setFormErrors(prevErrors => ({ ...prevErrors, tags: "There cannot be more than 5 tags!" }));
      return;
    }
    
  // if all validations pass, send the question to the server
  if (!user) {
    console.error("User information is not available");
    return;
  }
    if(!existingQuestion) {
      axios.post('http://localhost:8000/questions', {
      title: questionData.title,
      summary: questionData.summary,
      text: questionData.text,
      tags: questionData.tags,
      asked_by: user.user.username,
    })
    .then(response => {      
      // Reset form errors and hide the form after a successful post
      setFormErrors({ title: '', text: '', summary: '', tags: '', username: '' });
      setShowForm(false);
      displayQuestionsByNewest();
    })
    .catch(error => {
      if (error.response && error.response.status === 403) {
        setFormErrors(prevErrors => ({ ...prevErrors, tags: "The user has less than 50 reputation so new tags cannot be created for the question." }));
      }
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
  });
  }

  if(existingQuestion) {
    axios.patch(`http://localhost:8000/questions/${existingQuestion._id}`, {
      title: questionData.title,
      summary: questionData.summary,
      text: questionData.text,
      tags: questionData.tags,
    })
    .then(response => {
      // Reset form errors and hide the form after a successful post
      setFormErrors({ title: '', text: '', summary: '', tags: '', username: '' });
      setShowForm(false);
      setShowProfile(false);
      displayQuestionsByNewest();
    })
    .catch(error => {
      if (error.response && error.response.status === 403) {
        setFormErrors(prevErrors => ({ ...prevErrors, tags: "The user has less than 50 reputation so new tags cannot be created for the question." }));
      }
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    });
  
  }
};

  

  const handlePostAnswer = (answerData) => {
    setAnsFormErrors({ text: ''});

    if (!answerData.text) {
      setAnsFormErrors(prevErrors => ({ ...prevErrors, text: "The answer text cannot be empty!" }));
      return;
    }

    //hyperlinking error checks
    const allAnsHyperlinkPatterns = answerData.text.match(/\[.*?\]\(.*?\)/g) || [];

    // Validate pattern matches
    const invalidAnsHyperlink = allAnsHyperlinkPatterns.some(pattern => !/\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/.test(pattern));
    
    if (invalidAnsHyperlink) {
      setAnsFormErrors(prevErrors => ({ ...prevErrors, text: "Invalid hyperlink format!" }));
      return;
    }

    if (!user) {
      console.error("User information is not available");
      return;
    }
    // Construct the answer object
    const postAnswer = {
      text: answerData.text,
      ans_by: user.user.username
    };
    
    // Use axios to post the answer to the server
    axios.post(`http://localhost:8000/questions/${answerData.qid}/answers`, postAnswer)
    .then(response => {
      setAnsFormErrors({ text: ''});
      setShowAnsForm(false);
      setAnswersChanged(prevState => !prevState);
      setClickedQuestion(response.data); // Added this so that the answers page gets updated immediately after the POST.
    })
    .catch(error => {
      console.error('There was an error posting the answer', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    });
};

  return (
    isQuestionsLoaded && (
    <div id="right-menu">
      {showProfile && <ProfilePage user={user}
                                   errors={formErrors} 
                                   setShowTags = {setShowTags}
                                   showForm={showForm}
                                   setShowForm={setShowForm} 
                                   setShowProfile = {setShowProfile}
                                   setClickedQuestion={setClickedQuestion}
                                   postQuestion={handlePostQuestion}
                                   showProfileTags={showProfileTags}
                                   setShowProfileTags={setShowProfileTags}
                                   showAnsweredQuestions={showAnsweredQuestions}
                                   setShowAnsweredQuestions={setShowAnsweredQuestions}
                                   showProfileAnswers={showProfileAnswers}
                                   setShowProfileAnswers={setShowProfileAnswers}
                                   selectedUser={selectedUser}
                                   setSelectedUser={setSelectedUser}
                                   setShowWelcome={setShowWelcome} 
                                   setWelcomeComplete={setWelcomeComplete}
                                   setUser={setUser}
                                   userReputation={userReputation}
                                   setUserReputation={setUserReputation}/>}
      {showTags && <TagList user={user} executeSearch={executeSearch} setShowForm={setShowForm} setShowWelcome={setShowWelcome} setWelcomeComplete={setWelcomeComplete}/>}
  
      {!showForm && clickedQuestion === null &&
        <RightTopContainer 
          displayQuestionsByNewest={displayQuestionsByNewest}
          displayQuestionsByActivity={displayQuestionsByActivity}
          displayUnansweredQuestions={displayUnansweredQuestions}
          questionCount={questionCount}
          showAskButton={showAskButton}
          setShowForm={setShowForm}
          isSearchActive={isSearchActive}
          showTags = {showTags}
          showProfile = {showProfile}
          user={user}
        />
      }
          
      { (showForm && !showProfile) ? (
        <QuestionForm 
          postQuestion={handlePostQuestion} 
          errors={formErrors}
          setShowTags = {setShowTags}
          setShowProfile = {setShowProfile}
          setClickedQuestion={setClickedQuestion}
        />
      ) : (clickedQuestion && !showProfile) ? (
        showAnsForm ? (
          <AnswerForm
            postAnswer={handlePostAnswer}
            answerErrors={AnsFormErrors}
            qid={clickedQuestion._id}
            setShowTags = {setShowTags}
            setShowProfile = {setShowProfile}
          />
        ) : (
          <AnswerList 
            question={clickedQuestion}
            setQuestion={setClickedQuestion}
            setShowAnsForm={setShowAnsForm}
            answersChanged={answersChanged}
            setShowForm={setShowForm}
            setShowTags = {setShowTags}
            setShowProfile = {setShowProfile}
            user = {user}
            userReputation={userReputation}
            setUserReputation={setUserReputation}
          />
        )
      ) : !showTags && !showProfile && questions.length === 0 ? (
        <div id="questions-message">No Questions Found</div>
      ) : ( !showTags && !showProfile && !showForm &&
        <QuestionList questions={questions} setClickedQuestion={setClickedQuestion} />
      )}
    </div>)
    );
}


export default function FakeStackOverflow() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeComplete, setWelcomeComplete] = useState(false);
  const [user, setUser] = useState(null);
  const [answersChanged, setAnswersChanged] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [showAskButton, setShowAskButton] = useState(true);
  const [clickedQuestion, setClickedQuestion] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showAnsForm, setShowAnsForm] = useState(false);
  const [AnsFormErrors, setAnsFormErrors] = useState({ text: '', username: '' });
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState({ title: '', summary: '', text: '', tags: '', username: '' });
  const [isQuestionsLoaded, setIsQuestionsLoaded] = useState(false); // Added new state to prevent unnecessary initial rendering of questions list
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileTags, setShowProfileTags] = useState(false);
  const [showAnsweredQuestions, setShowAnsweredQuestions] = useState(false);
  const [showProfileAnswers, setShowProfileAnswers] = useState(false);
  const [userReputation, setUserReputation] = useState(0);

  const [selectedUser, setSelectedUser] = useState(null);


  const hideWelcome = () => {
    setShowWelcome(false);
  };

  const onWelcomeComplete = (userData) => {
    setUser(userData);
    if(userData) {
      setUserReputation(userData.user.reputation);
    }
    setWelcomeComplete(true);
  };

  if (showWelcome && !welcomeComplete) {
    return <Welcome hideWelcome={hideWelcome} onWelcomeComplete={onWelcomeComplete} />;
  }


  const displayQuestionsByNewest = () => {
    axios.get('http://localhost:8000/questions')
      .then(response => {
        const sortedQuestions = response.data.sort((a, b) => new Date(b.ask_date_time) - new Date(a.ask_date_time));
        setQuestions(sortedQuestions);
        setQuestionCount(sortedQuestions.length);
        setShowAskButton(true);
        setIsSearchActive(false);
        setIsQuestionsLoaded(true);
      })
      .catch(error => {
        console.error('There was an error fetching the questions:', error);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later. You will be sent back to the Welcome Page. Press OK to confirm.');
          setShowWelcome(true);
          setWelcomeComplete(false);
        }
      });
  };

  const displayQuestionsByActivity = () => {
    axios.get('http://localhost:8000/questions')
      .then(async response => { // Use async because we'll need to await on answer details
        const allQuestions = response.data;
        const questionsWithAnswers = allQuestions.filter(q => q.answers.length > 0);
        const questionsWithoutAnswers = allQuestions.filter(q => q.answers.length === 0);
  
        // Fetch the details of the answers for questions with answers
        for (const question of questionsWithAnswers) {
          const answerPromises = question.answers.map(answerId =>
            axios.get(`http://localhost:8000/answers/${answerId}`)
          );
          const answerResponses = await Promise.all(answerPromises);
          question.detailedAnswers = answerResponses.map(resp => resp.data);
        }
  
        // Sort questions with answers by the most recent answer date
        const sortedQuestionsWithAnswers = questionsWithAnswers.sort((a, b) => {
          const lastAnswerADate = a.detailedAnswers.reduce((latest, current) => new Date(latest.ans_date_time) > new Date(current.ans_date_time) ? latest : current).ans_date_time;
          const lastAnswerBDate = b.detailedAnswers.reduce((latest, current) => new Date(latest.ans_date_time) > new Date(current.ans_date_time) ? latest : current).ans_date_time;
  
          return new Date(lastAnswerBDate) - new Date(lastAnswerADate);
        });
  
        // Sort questions without answers by the ask date
        const sortedQuestionsWithoutAnswers = questionsWithoutAnswers.sort((a, b) => new Date(b.ask_date_time) - new Date(a.ask_date_time));
  
        // Combine the sorted questions
        const sortedQuestions = [...sortedQuestionsWithAnswers, ...sortedQuestionsWithoutAnswers];
    
        setQuestions(sortedQuestions);
        setQuestionCount(sortedQuestions.length);
        setShowAskButton(true);
        setIsSearchActive(false);
      })
      .catch(error => {
        console.error('There was an error fetching the questions:', error);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later. You will be sent back to the Welcome Page. Press OK to confirm.');
          setShowWelcome(true);
          setWelcomeComplete(false);
        }
      });
  };

  const displayUnansweredQuestions = () => {
    axios.get('http://localhost:8000/questions')
      .then(response => {
        let unansweredQuestions = response.data.filter(q => q.answers.length === 0);
        unansweredQuestions = unansweredQuestions.sort((a, b) => new Date(b.ask_date_time) - new Date(a.ask_date_time));
        setQuestions(unansweredQuestions);
        setQuestionCount(unansweredQuestions.length);
        setShowAskButton(true);
        setIsSearchActive(false);
      })
      .catch(error => {
        console.error('There was an error fetching the questions:', error);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later. You will be sent back to the Welcome Page. Press OK to confirm.');
          setShowWelcome(true);
          setWelcomeComplete(false);
        }
      });
  };

  const executeSearch = async (searchString) => {
    setAnsFormErrors({ text: '', username: '' });
    setFormErrors({ title: '', summary: '', text: '', tags: '', username: '' });

    try {
    // Fetch questions from the server
    const questionsResponse = await axios.get('http://localhost:8000/questions');

    const questions = questionsResponse.data;

    let tagSearch = [];
    let wordSearch = [];
  
    // split the search string into tags and words
    let matches;
    const regex = /\[([^\]]+)\]/g; // Regular expression to match [tagnames]
    while ((matches = regex.exec(searchString)) !== null) {
        tagSearch.push(matches[1].toLowerCase());
    }
    wordSearch = searchString.replace(regex, ' ').split(/\s+/).filter(Boolean).map(word => word.toLowerCase());
  
    const filteredQuestions = questions.filter(question => {
        // check for tag matches
        for (const tag of tagSearch) {
            if (question.tags.some(t => t?.name?.toLowerCase() === tag)) {
                return true;
            }
        }
        // check for word matches in title or text
        for (const word of wordSearch) {
            if (question.title.toLowerCase().includes(word) || question.text.toLowerCase().includes(word)) {
                return true;
            }
        }
  
        return false;
      });

      const sortedQuestions = filteredQuestions.sort((a, b) => new Date(b.ask_date_time) - new Date(a.ask_date_time));
      setIsSearchActive(true);
      setShowTags(false);
      setShowProfile(false);
      setShowForm(false);
      setClickedQuestion(null);
      setQuestions(sortedQuestions);
      setQuestionCount(sortedQuestions.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later. You will be sent back to the Welcome Page. Press OK to confirm.');
        setShowWelcome(true);
        setWelcomeComplete(false);
      }
    }
  };

  return (
    <div>
      <div id="header" className="header" style={{ border: '2px solid black' }}>
        Fake Stack Overflow
        <SearchBar onSearch={executeSearch} />
      </div>
      <div id="main" className="main">
        <div className="container">
          <LeftMenu
            answersChanged={answersChanged}
            setAnswersChanged={setAnswersChanged}
            questions={questions}
            setQuestions={setQuestions}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            showAskButton={showAskButton}
            setShowAskButton={setShowAskButton}
            clickedQuestion={clickedQuestion}
            setClickedQuestion={setClickedQuestion}
            isSearchActive={isSearchActive}
            setIsSearchActive={setIsSearchActive}
            showTags={showTags}
            setShowTags={setShowTags}
            showAnsForm={showAnsForm}
            setShowAnsForm={setShowAnsForm}
            AnsFormErrors={AnsFormErrors}
            setAnsFormErrors={setAnsFormErrors}
            showForm={showForm}
            setShowForm={setShowForm}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            executeSearch={executeSearch}
            displayQuestionsByNewest={displayQuestionsByNewest}
            displayQuestionsByActivity={displayQuestionsByActivity}
            displayUnansweredQuestions={displayUnansweredQuestions}
            isQuestionsLoaded={isQuestionsLoaded}
            setIsQuestionsLoaded={setIsQuestionsLoaded}
            user={user}
            showProfile={showProfile}
            setShowProfile={setShowProfile}
            showProfileTags={showProfileTags}
            setShowProfileTags={setShowProfileTags}
            showAnsweredQuestions={showAnsweredQuestions}
            setShowAnsweredQuestions={setShowAnsweredQuestions}
            showProfileAnswers={showProfileAnswers}
            setShowProfileAnswers={setShowProfileAnswers}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            showWelcome={showWelcome}
            setShowWelcome={setShowWelcome}
            welcomeComplete={welcomeComplete}
            setWelcomeComplete={setWelcomeComplete}
            setUser={setUser}
            userReputation={userReputation}
            setUserReputation={setUserReputation}
          />
          
          <RightMenu 
            answersChanged={answersChanged}
            setAnswersChanged={setAnswersChanged}
            questions={questions}
            setQuestions={setQuestions}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            showAskButton={showAskButton}
            setShowAskButton={setShowAskButton}
            clickedQuestion={clickedQuestion}
            setClickedQuestion={setClickedQuestion}
            isSearchActive={isSearchActive}
            setIsSearchActive={setIsSearchActive}
            showTags={showTags}
            setShowTags={setShowTags}
            showAnsForm={showAnsForm}
            setShowAnsForm={setShowAnsForm}
            AnsFormErrors={AnsFormErrors}
            setAnsFormErrors={setAnsFormErrors}
            showForm={showForm}
            setShowForm={setShowForm}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            executeSearch={executeSearch}
            displayQuestionsByNewest={displayQuestionsByNewest}
            displayQuestionsByActivity={displayQuestionsByActivity}
            displayUnansweredQuestions={displayUnansweredQuestions}
            isQuestionsLoaded={isQuestionsLoaded}
            setIsQuestionsLoaded={setIsQuestionsLoaded}
            user={user}
            showProfile={showProfile}
            setShowProfile={setShowProfile}
            showProfileTags={showProfileTags}
            setShowProfileTags={setShowProfileTags}
            showAnsweredQuestions={showAnsweredQuestions}
            setShowAnsweredQuestions={setShowAnsweredQuestions}
            showProfileAnswers={showProfileAnswers}
            setShowProfileAnswers={setShowProfileAnswers}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            showWelcome={showWelcome}
            setShowWelcome={setShowWelcome}
            welcomeComplete={welcomeComplete}
            setWelcomeComplete={setWelcomeComplete}
            setUser={setUser}
            userReputation={userReputation}
            setUserReputation={setUserReputation}
          />
        </div>
      </div>
    </div>
  );
}