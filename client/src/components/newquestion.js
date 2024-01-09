import {useEffect, useState} from 'react';
import axios from 'axios';

export function AskQuestionButton({ setShowForm }) {
    return (
      <button id="ask-question-button" className="ask-question-button" onClick={() => setShowForm(true)}>
        Ask Question
      </button>
    );
}

export function QuestionForm({ postQuestion, errors, setShowTags, setClickedQuestion, existingQuestion, setShowProfile}) {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [text, setText] = useState('');
    const [tags, setTags] = useState('');
    const [tagNames, setTagNames] = useState([]);

    useEffect(() => {
        if(existingQuestion) {
            fetchTagsForQuestion(existingQuestion._id);
        }
        setTitle(existingQuestion ? existingQuestion.title : '');
        setSummary(existingQuestion ? existingQuestion.summary : '');
        setText(existingQuestion ? existingQuestion.text : '');
        setTags(existingQuestion ? tagNames.join(' ') : '');
        setShowTags(false);
        setClickedQuestion(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[existingQuestion]);
  
    const handleSubmit = () => {
        postQuestion({ title: title.trim(), text: text.trim(), summary: summary.trim(), tags: Array.from(new Set(tags.split(/\s+/).filter(Boolean).map(tag => tag.toLowerCase().trim())))}, existingQuestion);
    };
    
    const fetchTagsForQuestion = async (questionId) => {
        try {
          const response = await axios.get(`http://localhost:8000/questions/${questionId}/tags`);
          // Assuming the response data is an array of tags
          const tagNames = response.data.map(tag => tag.name); // Extracting the name property from each tag object
          setTagNames(tagNames); // Updating the state with the new tag names
          setTags(existingQuestion ? tagNames.join(' ') : '');
        } catch (error) {
          console.error('Error fetching tags:', error);
          if(error.code === 'ERR_NETWORK') {
            window.alert('Error connecting to server. Please try again later.');
          }
        }
    };
  
    return (
    <div>
      <div id="question-form">
          <label>Question Title*</label>
          <small>Limit the title to 50 characters or less.</small>
          <input 
              id="question-title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder={"Enter the question title."}
          />
          {<span className="input-error">{errors.title}</span>}

          <label>Question Summary*</label>
          <small>Limit the summary to 140 characters or less.</small>
          <input 
              id="question-summary" 
              value={summary} 
              onChange={(e) => setSummary(e.target.value)}
              placeholder={"Enter the question summary."}
          />
          {<span className="input-error">{errors.summary}</span>}
  
          <label>Question Text*</label>
          <small>Add details about the question.</small>
          <textarea
              id="question-text" 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              placeholder={"Enter the question text."}
          />
          {<span className="input-error">{errors.text}</span>}
  
          <label>Tags*</label>
          <small>Provide up to 5 keywords, separated by whitespace.</small>
          <input 
              id="question-tags" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)}
              placeholder={"Enter the tags."}
          />
          {<span className="input-error">{errors.tags}</span>}
  
  
      </div>
        <button id="post-question-button" onClick={existingQuestion ? handleSubmit : handleSubmit}>
            {existingQuestion ? "Edit Question" : "Post Question"}
        </button>
      <p style={{ color: "red", textAlign: "right", margin: "20px" }}>* indicates mandatory fields</p>
      </div>
    );
  }