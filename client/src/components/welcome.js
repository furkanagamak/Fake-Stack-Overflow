import React, { useState } from 'react';
import axios from 'axios';
import {useEffect } from 'react';

axios.defaults.withCredentials = true;

export function Welcome({ hideWelcome, onWelcomeComplete }) {
    const [currentView, setCurrentView] = useState('welcome');
    const [isLoading, setIsLoading] = useState(true); // New state for tracking loading status

    // Check if a session already exists. If so, skip the welcome screen.
    useEffect(() => {
      axios.post('http://localhost:8000/login')
      .then(res => {
          if (res.data.status === 'EXISTS') {
              setCurrentView('home');
              onWelcomeComplete(res.data);
          }
          setIsLoading(false); // Set loading to false after the check
      }).catch(() => {
          setIsLoading(false); // Also set loading to false in case of an error
      }); // eslint-disable-next-line
    }, []);
  
    const handleLoginSuccess = (userData) => {
        onWelcomeComplete(userData);
      };
      
      const handleRegisterSuccess = (userData) => {
        setCurrentView('login'); // Changed this so that the user gets redirected to the login screen after registering
      };
      
      const handleContinueAsGuest = () => {
        console.log('Continuing as guest...');
        onWelcomeComplete(null);
      };
  
    const handleBackToWelcome = () => {
        setCurrentView('welcome');
      };
      
    if (isLoading) {
      return <div></div>; 
    }
    
    switch (currentView) {
      case 'welcome':
        return (
        <div className='welcome-container-parent'>
          <div className="welcome-container">
            <h1 style = {{fontSize : '50px',}}>Welcome</h1>
                <button
                className="welcome-login-button"
                onClick={() => setCurrentView('login')}
                style={{
                    backgroundColor: 'dodgerblue',
                    color: 'white',
                    padding: '15px',
                    border: '2px solid black',
                    borderRadius: 7,
                    cursor: 'pointer',
                    marginTop: '25px',
                    fontSize: '20px'
                    }}>
                    Login
                </button>
                <button
                className="welcome-registration-button"
                onClick={() => setCurrentView('register')}
                style={{
                    backgroundColor: 'dodgerblue',
                    color: 'white',
                    padding: '15px',
                    border: '2px solid black',
                    borderRadius: 7,
                    cursor: 'pointer',
                    marginTop: '25px',
                    fontSize: '20px'
                    }}>
                    Register
                </button>          
            <button
                className="welcome-guest-button"
                onClick={handleContinueAsGuest}
                style={{
                    backgroundColor: 'dodgerblue',
                    color: 'white',
                    padding: '15px',
                    border: '2px solid black',
                    borderRadius: 7,
                    cursor: 'pointer',
                    marginTop: '25px',
                    fontSize: '20px'
                    }}>
                    Continue as Guest
                </button>
          </div>
        </div>
        );
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} onBack={handleBackToWelcome}/>;
      case 'register':
        return <Register onRegisterSuccess={handleRegisterSuccess} onBack={handleBackToWelcome}/>;
      default:
        return <div></div>;
    }
  }
  
export default Welcome;

 export function Login({ onLoginSuccess , onBack}) {
    const [loginError, setLoginError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
  
    const handleLogin = async (email, password) => {
        try {
          const response = await axios.post('http://localhost:8000/login', { email, password });
          if (response.data) {
            onLoginSuccess(response.data);
          }
        } catch (error) {
            setLoginError(error.response ? error.response.data.message : 'Login failed');
            if(error.code === 'ERR_NETWORK') {
              window.alert('Error connecting to server. Please try again later.');
            }
        }
      };
  
    return (
    <div className ="login-container-parent">
      <div className="login-container">
        <input className="welcome-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="welcome-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        {loginError && <div className="error">{loginError}</div>} 
        <button
                onClick={() => handleLogin(email, password)}
                style={{
                    backgroundColor: 'dodgerblue',
                    color: 'white',
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    paddingTop: '15px',
                    paddingBottom: '15px',
                    border: '2px solid black',
                    borderRadius: 7,
                    cursor: 'pointer',
                    marginTop: '25px',
                    fontSize: '20px'
                    }}> Login </button>
        <button
          onClick={onBack}
          style={{
            backgroundColor: 'lightgray',
            color: 'black',
            marginTop: '20px',
            fontSize: '17px'
          }}> Back </button>
      </div>
    </div>
    );
  }

  export function Register({ onRegisterSuccess, onBack }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');
    const [registerError, setRegisterError] = useState(''); 
  
    const handleRegister = async () => {

        if (password !== verifyPassword) {
            setRegisterError("Passwords do not match.");
            return; // Prevent the form from being submitted
        }
        
        try {
          const response = await axios.post('http://localhost:8000/register', { username, email, password, verifyPassword });
          if (response.data) {
            onRegisterSuccess(response.data);
          }
        } catch (error) {
          setRegisterError(error.response ? error.response.data.message : 'Registration failed');
          if(error.code === 'ERR_NETWORK') {
            window.alert('Error connecting to server. Please try again later.');
          }
        }
      };
      
  
    return (
     <div className ="register-container-parent">
        <div className="register-container">
        <input className="welcome-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input className="welcome-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="welcome-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <input className="welcome-input" type="password" value={verifyPassword} onChange={(e) => setVerifyPassword(e.target.value)} placeholder="Verify Password" />
        {registerError && <div className="error">{registerError}</div>} 
        <button
                onClick={handleRegister}
                style={{
                    backgroundColor: 'dodgerblue',
                    color: 'white',
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    paddingTop: '15px',
                    paddingBottom: '15px',
                    border: '2px solid black',
                    borderRadius: 7,
                    cursor: 'pointer',
                    marginTop: '25px',
                    fontSize: '20px'
                    }}> Register </button>
        <button
          onClick={onBack}
          style={{
            backgroundColor: 'lightgray',
            color: 'black',
            marginTop: '20px',
            fontSize: '17px'
          }}> Back </button>
      </div>
    </div>
    );
  }
  