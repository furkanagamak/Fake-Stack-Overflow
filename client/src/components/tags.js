import { AskQuestionButton } from './newquestion.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TagList({ executeSearch, setShowForm, user, setShowWelcome, setWelcomeComplete}) {
  const [tags, setTags] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Start loading
      try {
        const tagsResult = await axios.get('http://localhost:8000/tags');
        const questionsResult = await axios.get('http://localhost:8000/questions');
        setTags(tagsResult.data);
        setQuestions(questionsResult.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later. You will be sent back to the Welcome Page. Press OK to confirm.');
          setShowWelcome(true);
          setWelcomeComplete(false);
        }
      }
      setIsLoading(false); // Finish loading
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
    return (
      <div id="tags-container">
        {isLoading ? (<></>) : (<>
        <div className="tags-header">
          <div className="tags-title">
            <h1>{tags.length} Tags</h1>
          </div>
          <div className="all-tags-title">
            <h1>All Tags</h1>
          </div>
          {user && user.user && <AskQuestionButton setShowForm={setShowForm} />}
        </div>
        <div>
          {Array.from({ length: Math.ceil(tags.length / 3) }).map((_, index) => (
            <div key={index}>
              {tags.slice(index * 3, (index + 1) * 3).map(tag => {
                const questionsWithTag = questions.filter(q => q.tags.some(t => t._id === tag._id));
                const questionText = questionsWithTag.length === 1 ? 'question' : 'questions';
                return (
                  <div key={tag._id} className="newTag-box">
                    <a 
                      href="/#" 
                      data-tagid={tag._id}
                      onClick={e => {
                        e.preventDefault();
                        executeSearch("[" + tag.name + "]");
                      }}
                    >
                      {tag.name}
                    </a>
                    <p style={{ color: 'black' }}>
                      {questionsWithTag.length} {questionText}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div></>)}
      </div>
    );
  }