const express = require('express'); // Express for routing
const path = require('path'); // Path to handle file paths
const fs = require('fs'); // FS module for reading and writing files
const router = express.Router(); // Create an instance of Express Router

// Login route
router.post('/login', (req, res, next) => {
  const { username, password } = req.body; // Destructure username and password from the request body
  
  // Ensure directory exists
  const userFilePath = path.join(__dirname, '../models/users.json');
  const userDirPath = path.dirname(userFilePath);
  
  if (!fs.existsSync(userDirPath)) {
    fs.mkdirSync(userDirPath, { recursive: true });
  }
  
  // Check if file exists, if not create it
  if (!fs.existsSync(userFilePath)) {
    fs.writeFileSync(userFilePath, JSON.stringify([], null, 2));
  }
  
  // Read users data from the users.json file
  fs.readFile(userFilePath, 'utf-8', (err, data) => {
    if (err) return next(err); // Pass any error to the error handling middleware
    
    let users = [];
    try {
      users = JSON.parse(data); // Parse JSON data to get the user list
    } catch (parseError) {
      return next(parseError);
    }
    
    const user = users.find(u => u.username === username && u.password === password); // Find matching user
    
    if (user) {
      // If user exists, redirect to the dashboard
      return res.redirect('/api/index'); // Redirect to dashboard
    } else {
      // If user doesn't exist, redirect to the register page
      return res.redirect('/api/register'); // Redirect to register
    }
  });
});

// Register route
router.post('/register', (req, res, next) => {
  const { username, password } = req.body; // Destructure username and password
  
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }
  
  const newUser = { username, password }; // Create a new user object
  
  // Ensure directory exists
  const userFilePath = path.join(__dirname, '../models/users.json');
  const userDirPath = path.dirname(userFilePath);
  
  if (!fs.existsSync(userDirPath)) {
    fs.mkdirSync(userDirPath, { recursive: true });
  }
  
  // Read users data from the users.json file or create if doesn't exist
  let users = [];
  try {
    if (fs.existsSync(userFilePath)) {
      const data = fs.readFileSync(userFilePath, 'utf-8');
      users = JSON.parse(data); // Parse existing user data
    }
  } catch (err) {
    return next(err); // Pass any error to the error handling middleware
  }
  
  // Check if user already exists
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(409).send('Username already exists');
  }
  
  users.push(newUser); // Add the new user to the users array
  
  // Write the updated users array back to the JSON file
  fs.writeFile(userFilePath, JSON.stringify(users, null, 2), (err) => {
    if (err) return next(err); // Pass any error to the error handling middleware
    res.redirect('/'); // Redirect to login page after successful registration
  });
});

module.exports = router; // Export the router so it can be used in server.js