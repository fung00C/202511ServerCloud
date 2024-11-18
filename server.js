const express = require('express');
const mongoose = require('mongoose');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();

const methodOverride = require('method-override');
const Userschema = require('./models/user');
const User = mongoose.model('User', Userschema);
const NewsSchema = require('./models/news');
const News = mongoose.model('News', NewsSchema);
const { name } = require('ejs');
const uri = ''

const port = 8091;




mongoose.connect(uri);






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

    const dynamicUsers = await User.find().select('name password');
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
    const defaultUsers1 = [
        { title: 'TEST1', imageUrl: 'TEST1_IMAGE', info: 'TEST1_INFO' },
        { title: 'TEST2', imageUrl: 'TEST2_IMAGE', info: 'TEST2_INFO' },
        { title: 'TEST3', imageUrl: 'TEST3_IMAGE', info: 'TEST3_INFO' },
    ];

    const count_user = await User.countDocuments();
    const count_news = await News.countDocuments();

    if (count_user === 0) {
        await User.insertMany(defaultUsers);

        console.log('Database seeded with default users');
    } else {
        console.log('Database already has users, skipping seeding');
    }

    if (count_news === 0) {
        await News.insertMany(defaultUsers1);
        console.log('Database seeded with default news data');
    } else {
        console.log('Database already has news, skipping seeding');
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
app.use(methodOverride('_method'));
app.use(express.static('public'));



//Routing
app.get('/', async (req, res) => {
    console.log(req.session);
    const searchQuery = req.query.search || '';
    const NewsItems = await News.find({
        title: { $regex: searchQuery, $options: 'i' }
    });
    if (!req.session.authenticated) {
        res.redirect('/login');
    } else {
        res.status(200).render('home', { NewsItems, searchQuery });
    }

});

app.get('/login', async (req, res) => {
    res.status(200).render('login');
});

app.post('/login', (req, res) => {
    const Added_users = req.app.locals.Added_users;
    if (!Added_users) {
        return res.status(500).send('No users found. Please create users first.');
    }
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




// Create Form
app.get('/NewsItems/add', (req, res) => {
    res.render('add');
});

// Create
app.post('/NewsItems', async (req, res) => {
    await News.create(req.body);
    res.redirect('/');
});

// Edit
app.get('/NewsItems/:id/edit', async (req, res) => {
    const NewsItem = await News.findById(req.params.id);
    if (!NewsItem) {
        return res.status(404).send('Item not found');
    }
    res.render('edit', { NewsItem });
});

// Update
app.put('/NewsItems/:id', async (req, res) => {
    await News.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/');
});

// Delete
app.delete('/NewsItems/:id', async (req, res) => {
    await News.findByIdAndDelete(req.params.id);
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