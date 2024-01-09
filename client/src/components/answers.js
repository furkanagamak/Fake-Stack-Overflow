
import { useState, useEffect } from 'react';
import {dateStringFormat, extractUsernameAndDate, convertHyperlinks} from './utils.js';
import { AskQuestionButton} from './newquestion.js';
import axios from 'axios';
//import uparrow from '%PUBLIC_URL%/uparrow.png';



export function AnswerList({ question, setShowAnsForm, answersChanged, setShowForm, setShowTags, user, userReputation, setUserReputation, setQuestion}) {
  const [fetchedAnswers, setFetchedAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [commentError, setCommentError] = useState('');
  const [commentErrors, setCommentErrors] = useState(new Map());
  const [answerComments, setAnswerComments] = useState(new Map());
  const [newAnsCommentTexts, setNewAnsCommentTexts] = useState(new Map());
  const [currentCommentPages, setCurrentCommentPages] = useState(new Map());
  const [currentAnswerPage, setCurrentAnswerPage] = useState(0);  //state to manage page displayed of answers
  const [questionVotes, setQuestionVotes] = useState(question.votes);

  const answersPerPage = 5;

  const refetchUserReputation = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/users/${user.user._id}`);
      setUserReputation(response.data.reputation);
    } catch (error) {
      console.log('Error fetching user:', error);
    }
  };
  
  useEffect(() => {
    const loadAnswers = async () => {
      setIsLoading(true); // Start loading
      try {
        const answerPromises = question.answers.map(answerId =>
          axios.get(`http://localhost:8000/answers/${answerId}`)
        );
        const answerResponses = await Promise.all(answerPromises);
        const answersData = answerResponses.map(response => {
          return {
            ...response.data,
            votes: response.data.votes
          };
        });
        answersData.sort((a, b) => new Date(b.ans_date_time) - new Date(a.ans_date_time));
        setFetchedAnswers(answersData); 
    
        fetchQuestionComments();
    
        // Fetch comments for each answer after answers are loaded
        answersData.forEach(answer => {
          fetchAnswerComments(answer._id);
        });
      } catch (error) {
        console.error('Error fetching answers:', error);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later.');
        }
      }
      setIsLoading(false);
    };
      loadAnswers();
      setQuestionVotes(question.votes);

      if(user && user.user) {
        refetchUserReputation();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, answersChanged,question.votes]);


  //async to fetch comments
  const fetchQuestionComments = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/questions/${question._id}/comments`);
      const sortedComments = res.data.sort((a, b) => new Date(b.comment_date_time) - new Date(a.comment_date_time));
      setComments(sortedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };

  const fetchAnswerComments = async (answerId) => {
    try {
      const res = await axios.get(`http://localhost:8000/answers/${answerId}/comments`);
      const sortedComments = res.data.sort((a, b) => new Date(b.comment_date_time) - new Date(a.comment_date_time));
      setAnswerComments(prevComments => new Map(prevComments.set(answerId, sortedComments)));
    } catch (error) {
      console.error('Error fetching comments for answer:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };

  const displayedAnswers = fetchedAnswers.slice(
    currentAnswerPage * answersPerPage,
    (currentAnswerPage + 1) * answersPerPage
  );

  const getCommentCountForAnswer = (answerId) => {
    if (answerComments.has(answerId)) {
      const comments = answerComments.get(answerId);
      return comments.length;
    }
    return 0;
  };

  const handleQuestionUpvote = async (question) => {
    try {
      // Check if the user's reputation is less than 50
      if (user.user.isAdmin === false && userReputation < 50) {
        // If so, show an alert and exit the function
        window.alert('You need at least 50 reputation to vote.');
        return;
      }
      await axios.patch(`http://localhost:8000/questions/${question._id}/votes`, { voteChange: 1 });
      await axios.patch(`http://localhost:8000/users/${question.userId}/reputation`, { change: 5 });
      setQuestionVotes(prevVotes => prevVotes + 1);
      
      const updatedQuestionResponse = await axios.get(`http://localhost:8000/questions/${question._id}`);
    setQuestion(updatedQuestionResponse.data); // Update the question state after voting
      
      refetchUserReputation();

    } catch (error) {
      console.error('Error upvoting question:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };
  
  const handleQuestionDownvote = async (question) => {
    try {
      // Check if the user's reputation is less than 50
      if (user.user.isAdmin === false && userReputation < 50) {
        // If so, show an alert and exit the function
        window.alert('You need at least 50 reputation to vote.');
        return;
      }
      await axios.patch(`http://localhost:8000/questions/${question._id}/votes`, { voteChange: -1 });
      await axios.patch(`http://localhost:8000/users/${question.userId}/reputation`, { change: -10 });
      setQuestionVotes(prevVotes => prevVotes - 1);

      const updatedQuestionResponse = await axios.get(`http://localhost:8000/questions/${question._id}`);
    setQuestion(updatedQuestionResponse.data); // Update the question state after voting

      refetchUserReputation();
    } catch (error) {
      console.error('Error downvoting question:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };

  const updateAnswerVotes = async (answerId) => {
    try {
      const response = await axios.get(`http://localhost:8000/answers/${answerId}`);
      setFetchedAnswers((prevAnswers) =>
        prevAnswers.map((ans) => (ans._id === answerId ? response.data : ans))
      );
    } catch (error) {
      console.error('Error fetching updated answer:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };

  const handleAnswerUpvote = async (answerId, userId) => {
    try {
      // Check if the user's reputation is less than 50
      if (user.user.isAdmin === false && userReputation < 50) {
        // If so, show an alert and exit the function
        window.alert('You need at least 50 reputation to vote.');
        return;
      }
      await axios.patch(`http://localhost:8000/answers/${answerId}/votes`, { voteChange: 1 });
      await axios.patch(`http://localhost:8000/users/${userId}/reputation`, { change: 5 });
      updateAnswerVotes(answerId);
      refetchUserReputation();
    } catch (error) {
      console.error('Error upvoting answer:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };

  const handleAnswerDownvote = async (answerId, userId) => {
    try {
      // Check if the user's reputation is less than 50
      if (user.user.isAdmin === false && userReputation < 50) {
        // If so, show an alert and exit the function
        window.alert('You need at least 50 reputation to vote.');
        return;
      }
      await axios.patch(`http://localhost:8000/answers/${answerId}/votes`, { voteChange: -1 });
      await axios.patch(`http://localhost:8000/users/${userId}/reputation`, { change: -10 });
      updateAnswerVotes(answerId);
      refetchUserReputation();
    } catch (error) {
      console.error('Error downvoting answer:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };

  const handleUpvote = async (commentId) => {
    try {
      await axios.patch(`http://localhost:8000/comments/${commentId}/upvote`);
      // Re-fetch question comments to update the votes count
      fetchQuestionComments();
  
      // Re-fetch comments for each answer
      fetchedAnswers.forEach((answer) => {
        fetchAnswerComments(answer._id);
      });
    } catch (error) {
      console.error('Error upvoting comment:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };
    
  const showNextComments = () => {
    setCurrentPage((prevPage) => (prevPage + 1) % Math.ceil(comments.length / 3));
  };

  // Function to handle previous button click
  const showPrevComments = () => {
    setCurrentPage((prevPage) => (prevPage - 1 + Math.ceil(comments.length / 3)) % Math.ceil(comments.length / 3));
  };

  const showNextAnswerComments = (answerId) => {
    setCurrentCommentPages((prevPages) => {
      const newPages = new Map(prevPages);
      const currentPage = newPages.get(answerId) || 0;
      const totalComments = (answerComments.get(answerId) || []).length;
      const totalPages = Math.ceil(totalComments / 3);
      const nextPage = currentPage + 1 >= totalPages ? 0 : currentPage + 1; // Loop back to first page
      newPages.set(answerId, nextPage);
      return newPages;
    });
  };
  
  const showPrevAnswerComments = (answerId) => {
    setCurrentCommentPages((prevPages) => {
      const newPages = new Map(prevPages);
      const currentPage = newPages.get(answerId) || 0;
      newPages.set(answerId, currentPage - 1);
      return newPages;
    });
  };

  const displayAnswerComments = (answerId) => {
    const commentsPerPage = 3;
    const currentPage = currentCommentPages.get(answerId) || 0;
    const commentsToDisplay = answerComments.get(answerId) || [];
    return commentsToDisplay.slice(currentPage * commentsPerPage, (currentPage + 1) * commentsPerPage);
  };

  const handleNextAnswers = () => {
    const totalPages = Math.ceil(fetchedAnswers.length / answersPerPage);
    setCurrentAnswerPage((prevPage) => (prevPage + 1) % totalPages);
  };
  
  const handlePrevAnswers = () => {
    setCurrentAnswerPage((prevPage) => (prevPage > 0 ? prevPage - 1 : 0));
  };

  const handleNewCommentSubmit = async () => {
    if (newCommentText.length > 140) {
      setCommentError('Comment cannot exceed 140 characters.');
      return;
    }
    if (user.user.isAdmin === false && userReputation < 50) {
      setCommentError('You need a reputation of at least 50 to comment.');
      return;
    }
  
    // Clear previous error message
    setCommentError('');
  
    try {
      await axios.post(`http://localhost:8000/questions/${question._id}/comments`, {
        text: newCommentText,
        username: user.user.username 
      });
  
      // Clear input field
      setNewCommentText("");
  
      // Fetch the updated list of comments
      const updatedCommentsResponse = await axios.get(`http://localhost:8000/questions/${question._id}/comments`);
      if (updatedCommentsResponse && updatedCommentsResponse.data) {
        setComments(updatedCommentsResponse.data.sort((a, b) => new Date(b.comment_date_time) - new Date(a.comment_date_time)));
      }
    } catch (error) {
      console.error('Error posting or fetching new comments:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
  };


  const handleNewAnswerCommentSubmit = async (answerId) => {
    const commentText = newAnsCommentTexts.get(answerId);
    if (commentText.length > 140) {
      setCommentErrors(prev => new Map(prev).set(answerId, 'Comment cannot exceed 140 characters.'));
      return;
    }
    if (user.user.isAdmin === false && userReputation < 50) {
      setCommentErrors(prev => new Map(prev).set(answerId, 'You need a reputation of at least 50 to comment.'));
      return;
    }

    try {
      // Post the new comment
      await axios.post(`http://localhost:8000/answers/${answerId}/comments`, {
        text: commentText,
        username: user.user.username
      });

      // Fetch the updated list of comments for this answer
      const updatedCommentsResponse = await axios.get(`http://localhost:8000/answers/${answerId}/comments`);
      if (updatedCommentsResponse && updatedCommentsResponse.data) {
        setAnswerComments(prevComments => new Map(prevComments).set(answerId, updatedCommentsResponse.data.sort((a, b) => new Date(b.comment_date_time) - new Date(a.comment_date_time))));
      }

      // Clear any errors
      setCommentErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(answerId);
        return newErrors;
      });

      // Clear input field
      setNewAnsCommentTexts(prev => {
        const newMap = new Map(prev);
        newMap.delete(answerId);
        return newMap;
      });

    } catch (error) {
      console.error('Error posting new comment for answer or fetching updated comments:', error);
      if(error.code === 'ERR_NETWORK') {
        window.alert('Error connecting to server. Please try again later.');
      }
    }
};
  

  const displayComments = comments.slice(currentPage * 3, (currentPage + 1) * 3);

  
    let dateInfo = dateStringFormat(new Date(question.ask_date_time), question.asked_by);
    let { username, datePart } = extractUsernameAndDate(dateInfo);
    let formattedQuestionText = convertHyperlinks(question.text);
  
    let formattedAnswers = displayedAnswers.map(answer => {
      let dateInfo = dateStringFormat(new Date(answer.ans_date_time), answer.ans_by, 1);
      let { username, datePart } = extractUsernameAndDate(dateInfo);
      let formattedAnsText = convertHyperlinks(answer.text);
      let _id = answer._id;
      let votes = answer.votes;
      let userId = answer.userId; 
      return { userId, formattedAnsText, username, datePart, _id, votes};
    });
  
    return (
      <div id="answers-container">
        {isLoading ? (<></>) : (<>
          <div className="answers-header">
          <div style={{width: "15%", paddingLeft: "40px"}}>{fetchedAnswers.length} answers</div>
          <div style={{ flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{question.title}</div>
          {user && user.user && <AskQuestionButton setShowForm={setShowForm}/>}
        </div>    

        <div className="question-vote-buttons">
              {user && user.user 
                ? <>
                    <input
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/uparrow.png`} 
                        alt="Upvote"
                        className="question-upvote-button"
                        onClick={() => handleQuestionUpvote(question)}
                    />
                    <input 
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/downarrow.png`} 
                        className="question-downvote-button"
                        alt="Downvote Question"
                        onClick={() => handleQuestionDownvote(question)}
                    />
                  </>
                : <>
                    <input
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/uparrow.png`} 
                        alt="Upvote"
                        className="question-upvote-button"
                        disabled
                    />
                    <input 
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/downarrow.png`} 
                        className="question-downvote-button"
                        alt="Downvote Question"
                        disabled
                    />
                  </>
                }
              <span className="question-votes">{questionVotes}</span>
            </div>  

        <div className="answers-sub-header">
          <div id="answer-views">{question.views} views</div>
          <div style={{flex: "1"}}>{formattedQuestionText}</div>
          <div id="answer-askedby">
            <div><span className="username">{username}</span></div>
            <div>{datePart}</div>
          </div>
        </div>
        <div className="comments-container">
      <span className="comments-label">Comments</span>
      <div className="comments-section">
            {displayComments.map((comment, index) => (
              <div key={index} className="comment">
                {user && user.user
                    ? <input 
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/uparrow.png`} 
                        alt="Upvote"
                        className="comment-upvote-button"
                        onClick={() => handleUpvote(comment._id)}
                      />
                    : <input 
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/uparrow.png`} 
                        alt="Upvote"
                        className="comment-upvote-button"
                        disabled
                      />
                }
                <span className="comment-votes">{comment.votes}</span>
                <span className="comment-text">{comment.text}</span>
                <span className="comment-username"> - {comment.comment_by}</span>
              </div>
            ))}
          </div>
          <div className="comments-navigation">
              <button onClick={showPrevComments} disabled={currentPage === 0}>Prev</button>
              <button onClick={showNextComments} disabled={comments.length === 0 || comments.length <= 3}>Next</button>
            </div>
            <div className="new-comment-section">
                {user && user.user && (
              <textarea
                className="new-comment-textarea"
                placeholder="Leave a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleNewCommentSubmit();
                  }
                }}
                rows="3"
              />
            )}
            {commentError && <div className="error">{commentError}</div>}
          </div>
        </div>

        {formattedAnswers.map((formattedAnswer, index) => (
         <div key={index} className="answer-cell-comments-wrapper"> 
          <div className="answer-cell">
          {user && user.user 
                ? <>
                    <input
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/uparrow.png`} 
                        alt="Upvote"
                        className="answer-upvote-button"
                        onClick={() => handleAnswerUpvote(formattedAnswer._id, formattedAnswer.userId)}
                    />
                    <input 
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/downarrow.png`} 
                        className="answer-downvote-button"
                        alt="Downvote Question"
                        onClick={() => handleAnswerDownvote(formattedAnswer._id, formattedAnswer.userId)}
                    />
                  </>
                : <>
                    <input
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/uparrow.png`} 
                        alt="Upvote"
                        className="answer-upvote-button"
                        disabled
                    />
                    <input 
                        type="image" 
                        src={`${process.env.PUBLIC_URL}/downarrow.png`} 
                        className="answer-downvote-button"
                        alt="Downvote Question"
                        disabled
                    />
                  </>
            }
              <span className="answer-votes">{formattedAnswer.votes}</span>
            <div id = "answer-cell-text">{formattedAnswer.formattedAnsText}</div>
            <div id = "answer-answeredby">
              <div><span className="answer-username">{formattedAnswer.username}</span></div> 
              <div>{formattedAnswer.datePart}</div>
            </div>
           </div>
           <div className="comments-container-ans">
                        <span className="comments-label">Comments</span>
                        {displayAnswerComments(formattedAnswer._id).map((comment, commentIndex) => (
                          <div key={commentIndex} className="comment">
                            {user && user.user 
                                ? <input 
                                    type="image" 
                                    src={`${process.env.PUBLIC_URL}/uparrow.png`} 
                                    alt="Upvote"
                                    className="comment-upvote-button"
                                    onClick={() => handleUpvote(comment._id)}
                                  />
                                : <input 
                                    type="image" 
                                    src={`${process.env.PUBLIC_URL}/uparrow.png`} 
                                    alt="Upvote"
                                    className="comment-upvote-button"
                                    disabled
                                  />
                            }
                            <span className="comment-votes">{comment.votes}</span>
                            <span className="comment-text">{comment.text}</span>
                            <span className="comment-username"> - {comment.comment_by}</span>
                          </div>
                          
                        ))}
                        <div className="comments-navigation">
                            <button onClick={() => showPrevAnswerComments(formattedAnswer._id)}
                                    disabled={(currentCommentPages.get(formattedAnswer._id) || 0) === 0}>
                              Prev
                            </button>
                            <button onClick={() => showNextAnswerComments(formattedAnswer._id)} disabled={getCommentCountForAnswer(formattedAnswer._id) === 0 || getCommentCountForAnswer(formattedAnswer._id) <= 3}>
                              Next
                            </button>
                          </div>
                        {user && user.user && (
                          <textarea
                            className="new-comment-textarea-ans"
                            placeholder="Leave a comment..."
                            value={newAnsCommentTexts.get(formattedAnswer._id) || ""}
                            onChange={(e) => {
                              setNewAnsCommentTexts(new Map(newAnsCommentTexts.set(formattedAnswer._id, e.target.value)));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleNewAnswerCommentSubmit(formattedAnswer._id);
                              }
                            }}
                            rows="3"
                          />
                        )}
                        <div className="error">{commentErrors.get(formattedAnswer._id)}</div>
            </div>
          </div>
        ))}
        <div className="answer-paging">
            <button className="answer-page-button" onClick={handlePrevAnswers} disabled={currentAnswerPage === 0}>
              Prev
            </button>
            <button className="answer-page-button" onClick={handleNextAnswers} disabled={fetchedAnswers.length === 0 || fetchedAnswers.length <= 5}>
              Next
            </button>
          </div>
        <div id="answer-button-container">
          {user && user.user &&<button className="answer-question-button" onClick={() => setShowAnsForm(true)}>Answer Question
        </button>}</div></>)}
      </div>
    );
}

export function AnswerForm({ postAnswer, answerErrors, qid, setShowTags, setShowProfile, user}) {
  const [text, setText] = useState('');

  useEffect(() => {
    setShowTags(false);
    setShowProfile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
},[]);

  const handleSubmit = () => {
    postAnswer({ qid: qid, text: text.trim()});
  };

  return (
    <div>
      <div id="answer-form">
          <label>Answer Text*</label>
          <textarea
              id="new-answer-text" 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your answer."
          />
          {<span className="input-error">{answerErrors.text}</span>}
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <button id = "post-answer-button" onClick={handleSubmit}>Post Answer</button>
          </div>
          <p style={{ color: "red", textAlign: "right", margin: "20px" }}>* indicates mandatory fields</p>
      </div>
      </div>
    );
  }
