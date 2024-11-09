require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const User = require('./models/user.js');
const Exam = require('./models/exam.js'); // Ensure Exam schema has fields for MCQs

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
}));

// Set the view engine to Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Helper function to generate JWT
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Middleware to verify JWT from cookies
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Student Login
app.route('/student_login')
    .get((req, res) => {
        res.render('student_login');
    })
    .post(async (req, res) => {
        const { studentId, password } = req.body;

        if (!studentId || !password) {
            return res.json({ success: false, message: 'Student ID and password are required' });
        }

        const user = await User.findOne({ studentId });
        if (user && await user.comparePassword(password)) {
            const token = generateToken(user);
            res.cookie('token', token, { httpOnly: true });
            return res.json({ success: true });
        } else {
            // Send a generic "Invalid credentials" message for incorrect login
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });

// Admin Login
app.route('/admin_login')
    .get((req, res) => {
        res.render('admin_login');
    })
    .post(async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: 'Email and password are required' });
        }

        const admin = await User.findOne({ email });
        if (admin && await admin.comparePassword(password)) {
            const token = generateToken(admin);
            res.cookie('token', token, { httpOnly: true });
            return res.json({ success: true });
        } else {
            // Send a generic "Invalid credentials" message for incorrect login
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });

// Admin Registration
app.route('/admin_register')
    .get((req, res) => {
        res.render('admin_register');
    })
    .post(async (req, res) => {
        const { name, email, password, confirm_password, institution } = req.body;

        if (password !== confirm_password) {
            return res.send('Passwords do not match');
        }

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            return res.send('Admin with this email already exists');
        }

        const newAdmin = new User({ name, email, password, role: 'admin', institution });
        await newAdmin.save();
        res.redirect('/admin_login');
    });

// Student Registration
app.route('/student_register')
    .get((req, res) => {
        res.render('student_register');
    })
    .post(async (req, res) => {
        const { name, studentId, mobile, email, password, institution } = req.body;

        const existingUser = await User.findOne({ studentId });
        if (existingUser) {
            return res.send('User with this Student ID already exists');
        }

        const newUser = new User({
            name,
            studentId,
            mobile,
            email,
            password,
            role: 'student',
            institution
        });
        await newUser.save();
        res.redirect('/student_login');
    });

// Admin Dashboard
app.get('/admin_dashboard', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.sendStatus(403);
    }

    const students = await User.find({ role: 'student' });
    res.render('admin_dashboard', { students });
});

// Student Dashboard: Display Exams
app.get('/student_dashboard', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.sendStatus(403);
    }

    // Retrieve all exams for students
    const exams = await Exam.find();
    res.render('student_dashboard', { exams });
});

// Create Exam
app.route('/create_exam')
    .get(authenticateJWT, (req, res) => {
        if (req.user.role !== 'admin') {
            return res.sendStatus(403);
        }
        res.render('create_exam');
    })
    .post(authenticateJWT, async (req, res) => {
        if (req.user.role !== 'admin') {
            return res.sendStatus(403);
        }

        const { examName, subject, date, questions } = req.body;

        if (!examName || !subject || !date || !questions) {
            return res.send('All fields are required');
        }

        const formattedQuestions = questions.map((question) => ({
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
        }));

        const newExam = new Exam({
            examName,
            subject,
            examDate: new Date(date),
            duration: 60, // Default duration
            questions: formattedQuestions,
            createdBy: req.user.id,
        });

        try {
            await newExam.save();
            res.redirect('/admin_dashboard');
        } catch (error) {
            console.error('Error creating exam:', error);
            res.status(500).send('Error creating exam');
        }
    });

// Fetch Exams from external API
app.get('/fetch_exams', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.sendStatus(403);
    }

    try {
        const response = await axios.get('https://api.sampleapis.com/fake-exams/exams');
        const exams = response.data;

        for (const exam of exams) {
            const newExam = new Exam(exam);
            await newExam.save();
        }
        res.status(201).send('Exams fetched and saved successfully');
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).send('Error fetching exams');
    }
});

// Real-time connection using Socket.IO
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
