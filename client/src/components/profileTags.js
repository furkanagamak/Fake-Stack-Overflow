import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProfileTagList({ selectedUser}) {
  const [tags, setTags] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTagId, setEditingTagId] = useState(null); // State to track editing
  const [editTagName, setEditTagName] = useState(""); // State to track edited tag name

  const [error, setError] = useState(""); // State for storing error message

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Start loading
      try {
        const tagsResult = await axios.get(`http://localhost:8000/users/${selectedUser._id}/tags`);
        const questionsResult = await axios.get(`http://localhost:8000/questions`);
        setTags(tagsResult.data);
        setQuestions(questionsResult.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later.');
        }
      }
      setIsLoading(false); // Finish loading
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser._id]);

  const handleTagClick = (tagId, tagName) => {
    setEditingTagId(tagId);
    setEditTagName(tagName);
    setError("");
  };

  const handleTagChange = (e) => {
    const tagName = e.target.value.trim();
    if (tagName.length <= 10 && !tagName.includes(' ')) {
      setEditTagName(tagName.toLowerCase());
    }
  };

  const handleTagUpdate = async (tagId) => {
    const trimmedTagName = editTagName.trim();
    if (!trimmedTagName) {
      setError("The tag name cannot be empty.");
      return;
    }
    try {
      const updatedTag = await axios.patch(`http://localhost:8000/tags/${tagId}`, { name: editTagName });
      setTags(tags.map(tag => tag._id === tagId ? updatedTag.data : tag));
      setEditingTagId(null);
      setError(""); // Clear any existing error
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setError("The tag is in use by other users and cannot be edited.");
      } else if (error.response && error.response.status === 400) {
        setError("A tag with the same name already exists.");
      }
      else {
        setError("An error occurred while updating the tag.");
        console.error('Error updating tag:', error);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later.');
        }
      }
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      // Make the DELETE request
      await axios.delete(`http://localhost:8000/tags/${tagId}`);
      setError(""); // Clear any existing error
      // Filter out the deleted tag from the tags state
      setTags(tags.filter(tag => tag._id !== tagId));
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setError("The tag is in use by other users and cannot be deleted.");
      } else {
        setError("An error occurred while deleting the tag.");
        console.error('Error deleting tag:', error);
        if(error.code === 'ERR_NETWORK') {
          window.alert('Error connecting to server. Please try again later.');
        }
      }
    }
  };
  
    return (
      <div id="tags-container">
        {isLoading ? (<></>) : (<>
        <div className="tags-header">
          <div className="tags-title">
            <h1>{tags.length} Tags</h1>
          </div>
          <div className="all-tags-title">
            <h1>{selectedUser.username}'s Tags</h1>
          </div>
          {error && <div style={{ color: 'red', marginBottom: '10px', marginTop: '10px'}}>{error}</div>}
        </div>
      <div>
        {Array.from({ length: Math.ceil(tags.length / 3) }).map((_, index) => (
          <div key={index}>
            {tags.slice(index * 3, (index + 1) * 3).map(tag => {
              const questionsWithTag = questions.filter(q => q.tags.some(t => t._id === tag._id));
              const questionText = questionsWithTag.length === 1 ? 'question' : 'questions';
              
              return (
                <div key={tag._id} className="newTag-box">
                  {editingTagId === tag._id ? (
                    <input
                      value={editTagName}
                      onChange={handleTagChange}
                      onBlur={() => handleTagUpdate(tag._id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleTagUpdate(tag._id);
                      }}
                    />
                  ) : (
                    <a href="/#" onClick={() => handleTagClick(tag._id, tag.name)}>
                      {tag.name}
                    </a>
                  )}
                  <p style={{ color: 'black' }}>
                    {questionsWithTag.length} {questionText}
                  </p>
                  <button className="delete-tag-button" onClick={() => handleDeleteTag(tag._id)}>Delete</button>
                </div>
              );
            })}
          </div>
        ))}
      </div></>)}
    </div>
  );
  }

  