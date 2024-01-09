# Live Demo
Navigate to https://fakeso.furkanagamak.com/ to view a live demo.

# Instructions to setup and run the project

This guide provides step-by-step instructions to set up and run the project on your local machine. Make sure that you have Node.js and MongoDB installed and running before proceeding.

## Getting Started

### Prerequisites
- Node.js: Download and install from [Node.js Downloads](https://nodejs.org/en/download).
- MongoDB: Install by following the guide at [MongoDB Installation](https://www.mongodb.com/docs/manual/installation).

### Installation

#### Clone the Repository
```bash
# Clone the repository to your local machine (use your preferred method)
git clone <repository-url>
```

#### Set Up the Server
```bash
# Open a new terminal and navigate to the server directory
cd path/to/projectfakeso-team_faiz_furkan/server/

# Install npm dependencies
npm install

# Run the init.js script once to set up the database with initial test data, including an admin user
# Replace <username> and <password> with your desired admin credentials
# The email will be <username>@fakeso.com
node init.js <username> <password>

# Start the server
node server.js
```

#### Set Up the Client
```bash
# Open a new terminal and navigate to the client directory
cd path/to/projectfakeso-team_faiz_furkan/client/

# Install npm dependencies
npm install

# Start the React app
npm start
```

### Usage

- The React app will open in a new tab in your web browser.
- If you would like to register as a new user, complete the registration process on the app. 
- After registration, you will be redirected to the login page to log in with your credentials.
- Make sure you only run the init.js script once. If you would like to run it again for some reason, make sure to clear out the "fake_so" database using the "db.dropDatabase()" command in your terminal.
- If you would like to log in as the admin user that was created by running the init.js script, you can use username@fakeso.com as the email, where username is the username you entered for the script. The password of the admin user is the password you entered for the script.
- If you would like to log in as one of the test users that was created by running the init.js script, you can use username@fakeso.com as the email, where username is the username of the test user. You can check the usernames of all test users by looking at the console output after running init.js. The password of all test users is '123'.
