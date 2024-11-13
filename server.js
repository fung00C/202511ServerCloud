const express = require('express');
const mongoose = require('mongoose');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();
const Userschema = require('./models/user');
const { name } = require('ejs');
const User = mongoose.model('User', Userschema);
const uri = ''
const port = 8091;

mongoose.connect(uri);


app.set('view engine', 'ejs');
const SECRETKEY = 'I want to pass COMPS381F';

app.use(session({
    name: 'loginSession',
    keys: [SECRETKEY],
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

async function main() {
    await mongoose.connect(uri);
    const users = await User.find();
    const Added_users = users.map(user => ({
        name: user.name,
        password: user.password
    }));
    console.log(Added_users);
}

async function main() {
    await mongoose.connect(uri);
    const staticUsers = [
        { name: 'developer', password: 'developer' },
        { name: 'guest', password: 'guest' }
    ];
    const dynamicUsers = await User.find().select('name password'); // Fetch only name and password
    const Added_users = [...staticUsers, ...dynamicUsers.map(user => ({
        name: user.name,
        password: user.password
    }))];
    app.locals.Added_users = Added_users;
}

async function seedDatabase() {
    const defaultUsers = [
        { name: 'KenChan', password: 'developer' },
        { name: 'BenLee', password: 'guest' },
        { name: 'Admin', password: 'admin' }
    ];
    const count = await User.countDocuments();
    if (count === 0) {
        await User.insertMany(defaultUsers);
        console.log('Database seeded with default users');
    } else {
        console.log('Database already has users, skipping seeding');
    }
}
main().catch(err => console.error(err));

async function connectDB() {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        await seedDatabase();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}


//Routing
app.get('/', (req, res) => {
    console.log(req.session);
    if (!req.session.authenticated) {
        res.redirect('/login');
    } else {
        res.status(200).render('main');
    }
});

app.get('/login', async (req, res) => {
    await mongoose.connect(uri);
    const user = await User.findOne();
    if (user) {
        res.status(200).render('login', { name: user.name, password: user.password });
    }
});

app.post('/login', (req, res) => {
    const Added_users = req.app.locals.Added_users; // Access the stored users

    const foundUser = Added_users.find(user =>
        user.name === req.body.name && user.password === req.body.password
    );
    if (foundUser) {
        req.session.authenticated = true;
        req.session.username = req.body.name;
        return res.redirect('/');
    } else {
        res.status(401).send('Invalid username or password');
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { name, password } = req.body;
    const existingUser = await User.findOne({ name });
    if (existingUser) {
        return res.status(400).send('User already exists');
    }
    const newUser = new User({ name, password });
    await newUser.save();
    const dynamicUsers = await User.find().select('name password');
    const staticUsers = [
        { name: 'developer', password: 'developer' },
        { name: 'guest', password: 'guest' }
    ];
    req.app.locals.Added_users = [...staticUsers, ...dynamicUsers.map(user => ({
        name: user.name,
        password: user.password
    }))];
    res.redirect('/');
});


app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

connectDB();