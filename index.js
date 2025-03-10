const express = require('express')
const path = require('path')
const app = express()

// Import middleware
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const logger = require('./middlewares/logger')
const errorHandler = require('./middlewares/errorHandler')

// Define port with fallback options
const PORT = process.env.PORT || 3000 // Changed from 8080 to avoid EADDRINUSE error

// Basic middleware setup
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
// Removed duplicate body-parser middleware
app.use(morgan('dev'))
app.use(logger)

// Configure Helmet with appropriate CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://kit.fontawesome.com",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com",
          "https://cdn-uicons.flaticon.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn-uicons.flaticon.com",
          "https://ka-f.fontawesome.com",
        ],
        imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
        connectSrc: [
          "'self'",
          "https://ka-f.fontawesome.com",
          "https://cdn.jsdelivr.net",
        ],
        objectSrc: ["'none'"],
        frameSrc: [
          "'self'", 
          "https://www.google.com"
        ],
      },
    },
    crossOriginEmbedderPolicy: false, 
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" },
    dnsPrefetchControl: { allow: false },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    xssFilter: true,
  })
)

// Serve static files from both directories
// First serve from the public directory for CSS and JS
app.use(express.static(path.join(__dirname, 'public')))
// Then serve static files from hospital website directory for other resources
app.use(express.static(path.join(__dirname, 'hospital website')))

// Define rate limiter after static files but before routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  headers: true,
})

// Apply rate limiter to API routes
app.use('/api', limiter)

// Import and use API routes
const apiRoutes = require('./api/apiRoutes')
app.use('/api', apiRoutes)

// Define routes for HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'login.html'))
})

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'index.html'))
})

app.get('/contactus', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'contactus.html'))
})

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'services.html'))
})

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'gallery.html'))
})

app.get('/aboutus', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'aboutus.html'))
})

app.get('/appointment', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'appointment.html'))
})

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'blog.html'))
})

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'register.html'))
})

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'hospital website', 'login.html'))
})

// Error handler should be last
app.use(errorHandler)

// Add process handling for graceful shutdown
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

let server;

// Start the server with error handling for port conflicts
function startServer() {
  server = app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
      PORT++; // Increment port number
      startServer(); // Try again with new port
    } else {
      console.error('Error starting server:', err);
    }
  });
}

// Graceful shutdown function
function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

// Start the server
startServer();