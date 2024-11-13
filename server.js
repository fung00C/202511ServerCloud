const express = require('express');
const mongoose = require('mongoose');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();
const Userschema = require('./models/user');

const User = mongoose.model('User', Userschema);

mongoose.connect('mongodb+srv://hong:hong@cluster0.kdrzk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')

const port = 3000;

app.set('view engine', 'ejs');
const SECRETKEY = 'I want to pass COMPS381F';

app.use(session({
    name: 'loginSession',
    keys: [SECRETKEY]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    console.log(req.session);
    if (!req.session.authenticated) {    // user not logged in!
        res.redirect('/login');
    } else {
        //res.status(200).render('secrets', { name: req.session.username });
        res.status(200).render('main');
    }
});


app.get('/login', (req, res) => {
    res.status(200).render('login');
});

app.post('/login', (req, res) => {
    const users1 = User.find({ name: "", password: "" });
    const user = new User(users1);
    if (user.name == req.body.name && user.password == req.body.password) {
        req.session.authenticated = true;
        req.session.username = req.body.name;
    }
    res.redirect('/');
});



app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { name, password } = req.body;
    const newUser = new User({ name, password });
    await newUser.save();
    res.redirect('/login');
});




app.get('/logout', (req, res) => {
    req.session = null;   // clear cookie-session
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});