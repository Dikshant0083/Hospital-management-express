const express = require('express'); // Express for routing
const path = require('path'); // Path to handle file paths
const fs = require('fs'); // FS module for reading and writing files
const router = express.Router(); // Create an instance of Express Router
const bcrypt = require('bcrypt'); // Added for password hashing

// Login route
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body; // Destructure username and password from the request body
  
  if (!username || !password) {
    req.flash('error', 'Username and password are required');
    return res.redirect('/login');
  }
  
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
  
  try {
    // Read users data from the users.json file
    const data = fs.readFileSync(userFilePath, 'utf-8');
    let users = [];
    
    try {
      users = JSON.parse(data); // Parse JSON data to get the user list
    } catch (parseError) {
      console.error('Error parsing users JSON:', parseError);
      req.flash('error', 'System error. Please try again later.');
      return res.redirect('/login');
    }
    
    // Find user by username
    const user = users.find(u => u.username === username);
    
    if (!user) {
      // If user doesn't exist, redirect to the register page with message
      req.flash('error', 'User not found. Please register.');
      return res.redirect('/register');
    }
    
    // Compare password
    let isPasswordValid = false;
    
    if (user.password.startsWith('$2')) {
      // Password is hashed with bcrypt
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password (legacy support)
      isPasswordValid = (user.password === password);
    }
    
    if (isPasswordValid) {
      // If password matches, redirect to the dashboard
      return res.redirect('/index');
    } else {
      // If password doesn't match, return error
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login');
    return res.redirect('/login');
  }
});

// Register route
router.post('/register', async (req, res, next) => {
  const { username, password } = req.body; // Destructure username and password
  
  if (!username || !password) {
    req.flash('error', 'Username and password are required');
    return res.redirect('/register');
  }
  
  // Ensure directory exists
  const userFilePath = path.join(__dirname, '../models/users.json');
  const userDirPath = path.dirname(userFilePath);
  
  if (!fs.existsSync(userDirPath)) {
    fs.mkdirSync(userDirPath, { recursive: true });
  }
  
  try {
    // Read users data from the users.json file or create if doesn't exist
    let users = [];
    
    if (fs.existsSync(userFilePath)) {
      const data = fs.readFileSync(userFilePath, 'utf-8');
      try {
        users = JSON.parse(data); // Parse existing user data
      } catch (parseError) {
        console.error('Error parsing users JSON:', parseError);
        req.flash('error', 'System error. Please try again later.');
        return res.redirect('/register');
      }
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      req.flash('error', 'Username already exists');
      return res.redirect('/register');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = { 
      username, 
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    // Add user to array
    users.push(newUser);
    
    // Write updated users to file
    fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2), 'utf-8');
    
    // Redirect to login with success message
    req.flash('success', 'Registration successful! Please login with your new credentials.');
    res.redirect('/login');
    
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'An error occurred during registration');
    return res.redirect('/register');
  }
});

module.exports = router; // Export the router so it can be used in server.js