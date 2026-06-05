const express = require('express')
const path = require('path')
const app = express()
//mongo db
const mongoose = require('mongoose');
//nodd mailer
const nodemailer = require('nodemailer');
// Import middleware
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const logger = require('./middlewares/logger')
const errorHandler = require('./middlewares/errorHandler')
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();
// Define port with fallback options
let PORT = process.env.PORT || 3000 

// Basic middleware setup
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));




app.use(morgan('dev'))
app.use(logger)  //log req method

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

// Session and flash setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Serve static files from both directories
// First serve from the public directory for CSS and JS
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static('public'));


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

// Setup EJS view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Define routes for HTML pages
app.get('/', (req, res) => {
  res.redirect('/login');
})

app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login Page',
    errorMessage: req.flash('error'),
    successMessage: req.flash('success'),
    username: req.body.username || ''
  });
});

// Add register route
app.get('/register', (req, res) => {
  res.render('register', {
    title: 'Registration Page',
    errorMessage: req.flash('error'),
    username: req.body.username || '',
    loginUrl: '/login'
  });
});


app.get('/index', (req, res) => {
  res.render('index');
});

// Route to redirect /contact to /contactus
app.get('/contact', (req, res) => {
  res.redirect('/contactus');
});

// Route - show contact page
app.get('/contactus', (req, res) => {
  res.render('contactus', req.query);
});

// Handle contact form submissions
app.post('/contactus', (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Input validation
    if (!name || !email || !phone || !subject || !message) {
      return res.render('contactus', {
        ...req.body,
        error: 'All fields are required'
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render('contactus', {
        ...req.body,
        error: 'Please enter a valid email address'
      });
    }
    
  
    res.render('contactus', {
      success: 'Thank you for your message. We will get back to you soon!',
      
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
    
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.render('contactus', {
      ...req.body,
      error: 'There was an error processing your request. Please try again later.'
    });
  }
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'services.html'))
})


app.get('/gallery', (req, res) => {
  res.render('gallery', {
    galleryTitle: 'Our Medical Gallery',
    galleryDescription: 'Custom description here',
 
  });
});


app.get('/aboutus', (req, res) => {
  // Data to be passed to the EJS template
  const aboutData = {
    aboutTitle: 'About Us',
    aboutTagline: 'Discover why healthcare facilities around the world trust our management solutions.',
    aboutHeading: 'Revolutionizing Healthcare Management Since 2012',
    aboutParagraphs: [
      'Our healthcare management system has been setting the standard for hospital and laboratory management for over a decade. With a commitment to innovation and excellence, we provide comprehensive solutions that enhance operational efficiency, improve patient care, and streamline administrative tasks.',
      'Our mission is to transform healthcare facilities by providing cutting-edge technology that allows medical professionals to focus on what matters most – patient care. By automating routine tasks and providing real-time data insights, our system helps healthcare providers make informed decisions quickly.'
    ],
    aboutImage: '/images/about3.jpg',
    features: [
      {
        icon: 'fas fa-shield-alt',
        title: 'Data Security',
        description: 'HIPAA compliant security protocols to protect sensitive patient information.'
      },
      {
        icon: 'fas fa-sync',
        title: 'Real-time Updates',
        description: 'Instant synchronization across departments for seamless operations.'
      },
      {
        icon: 'fas fa-mobile-alt',
        title: 'Mobile Access',
        description: 'Access patient records and hospital data from anywhere, anytime.'
      },
      {
        icon: 'fas fa-chart-line',
        title: 'Advanced Analytics',
        description: 'Data-driven insights to improve operational efficiency and patient outcomes.'
      }
    ],
    stats: [
      {
        icon: 'fas fa-clock',
        number: '12+',
        text: 'Years'
      },
      {
        icon: 'fas fa-globe',
        number: '10+',
        text: 'Countries'
      },
      {
        icon: 'fas fa-city',
        number: '50+',
        text: 'Cities'
      },
      {
        icon: 'fas fa-user-md',
        number: '30K+',
        text: 'Doctors'
      },
      {
        icon: 'fas fa-file-medical',
        number: '25M+',
        text: 'Patients Records'
      },
      {
        icon: 'fas fa-server',
        number: '99.9%',
        text: 'Uptime'
      },
      {
        icon: 'fas fa-users',
        number: '1500+',
        text: 'Customers'
      }
    ],
    teamTitle: 'Our Expert Team',
    teamTagline: 'Meet the dedicated professionals behind our healthcare management solutions.',
    team: [
      {
        name: 'Dr. Sarah Johnson',
        position: 'Chief Medical Officer',
        image: '/images/team1.jpg',
        social: [
          { icon: 'fab fa-facebook-f', link: '#' },
          { icon: 'fab fa-twitter', link: '#' },
          { icon: 'fab fa-linkedin-in', link: '#' }
        ]
      },
      {
        name: 'Dr. Michael Chen',
        position: 'Lead Medical Consultant',
        image: '/images/team2.jpg',
        social: [
          { icon: 'fab fa-facebook-f', link: '#' },
          { icon: 'fab fa-twitter', link: '#' },
          { icon: 'fab fa-linkedin-in', link: '#' }
        ]
      },
      {
        name: 'Alex Rivera',
        position: 'Technical Director',
        image: '/images/team3.jpg',
        social: [
          { icon: 'fab fa-facebook-f', link: '#' },
          { icon: 'fab fa-twitter', link: '#' },
          { icon: 'fab fa-linkedin-in', link: '#' }
        ]
      },
      {
        name: 'Dr. Priya Sharma',
        position: 'Head of Research',
        image: '/images/team4.jpg',
        social: [
          { icon: 'fab fa-facebook-f', link: '#' },
          { icon: 'fab fa-twitter', link: '#' },
          { icon: 'fab fa-linkedin-in', link: '#' }
        ]
      }
    ]
  };

  res.render('aboutus', aboutData);
});


app.use('/appointment', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'appointment.html'))
})


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)

.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB:', err));


// Appointment Schema
const appointmentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String },
    doctor: { type: String, required: true },
    department: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dob: { type: String, required: true },
    appointmentDate: { type: String, required: true },
    note: { type: String },
    isPatient: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Function to send email notification
const sendEmailNotification = async (appointmentData) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: appointmentData.email,
            subject: 'Your Appointment Confirmation',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #2ec8a6;">Appointment Confirmation</h2>
                    <p>Dear ${appointmentData.firstName} ${appointmentData.lastName},</p>
                    <p>Your appointment has been scheduled successfully.</p>
                    <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Appointment Details:</strong></p>
                        <p><strong>Appointment ID:</strong> ${appointmentData.id}</p>
                        <p><strong>Doctor:</strong> Dr. ${appointmentData.doctor}</p>
                        <p><strong>Department:</strong> ${appointmentData.department}</p>
                        <p><strong>Date:</strong> ${new Date(appointmentData.appointmentDate).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${appointmentData.status}</p>
                    </div>
                    <p>If you need to cancel or reschedule your appointment, please contact our hospital directly.</p>
                    <p>Thank you for choosing our hospital.</p>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                        <p style="font-size: 12px; color: #777;">This is an automated email, please do not reply to this message.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email notification sent to:', appointmentData.email);
    } catch (error) {
        console.error('Error sending email notification:', error);
    }
};

// API Routes

// Create a new appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const appointmentData = req.body;

    console.log('POST /api/appointments - received body:', appointmentData);

    // Basic server-side validation
    if (!appointmentData || !appointmentData.email || !appointmentData.firstName || !appointmentData.doctor) {
      console.warn('Validation failed for appointment data:', appointmentData);
      return res.status(400).json({ success: false, message: 'Missing required appointment fields' });
    }

    // Create a new appointment document
    const appointment = new Appointment(appointmentData);
    await appointment.save();

    // Send email notification asynchronously (do not block response)
    sendEmailNotification(appointmentData).catch(err => {
      console.error('Email notify failed (async):', err);
    });

    res.status(201).json({ 
      success: true, 
      message: 'Appointment created successfully',
      appointment 
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create appointment',
      error: error.message 
    });
  }
});

// Get all appointments
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ createdAt: -1 });
        res.status(200).json({ 
            success: true, 
            appointments 
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch appointments',
            error: error.message 
        });
    }
});

// Get appointments by email
app.get('/api/appointments/:email', async (req, res) => {
    try {
    const { email } = req.params;
    console.log('GET /api/appointments/:email - email param:', email);
        const appointments = await Appointment.find({ email }).sort({ createdAt: -1 });
        res.status(200).json({ 
            success: true, 
            appointments 
        });
    } catch (error) {
        console.error('Error fetching appointments by email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch appointments',
            error: error.message 
        });
    }
});




app.get('/blog', (req, res) => {
  res.render('blog', {
    currentYear: new Date().getFullYear()
  });
});

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