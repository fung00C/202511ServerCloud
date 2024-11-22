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
        { title: 'Does Kane criticism expose England cracks?', imageUrl: 'https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/9864/live/056402e0-a1f3-11ef-87b5-dba728a0baa3.jpg.webp', info: 'So when Kane diverted from his trademark non-controversial messaging to deliver what amounted to a very public slap down on England team-mates for missing the forthcoming Uefa Nations League games against Greece and the Republic of Ireland, it was a moment of wide significance.' },
        { title: 'A night of redemption for Carsley offers real hope for Tuchel', imageUrl: 'https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/8a4d/live/eaad95e0-a276-11ef-a4fe-a3e9a6c5d640.jpg.webp', info: 'The schedule of the three international breaks in September, October and November has been in place for decades. But from 2026, the September and October international breaks will be combined into a single window of four matches.' },
        { title: 'Crisis for referees and fuel for toxic fan conspiracies', imageUrl: 'https://ichef.bbci.co.uk/ace/standard/800/cpsprodpb/8ae0/live/0d885e80-a0f4-11ef-b587-eb8d9a920f25.jpg.webp', info: 'The video of Premier League referee David Cootes alleged expletive-laden insults about Liverpool and their former manager Jurgen Klopp carries ramifications far wider than abusive words used on shaky mobile phone footage.' },
        { title: 'Monaco agrees extension to host F1 until 2031', imageUrl: 'https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/dc39/live/49b724a0-a274-11ef-8f42-3b1b720c6f90.jpg.webp', info: 'There remain questions about the the suitability of the principalitys narrow streets for racing modern F1 cars, and the lack of overtaking, but no changes to the circuit are in the offing because of the difficulty of altering the layout.' },
        { title: 'I am pay for privilege to play Ryder Cup - McIlroy', imageUrl: 'https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/8f6a/live/88cae8f0-a299-11ef-8ab9-9192db313061.jpg.webp', info: 'Last years contest in Rome was marked by Patrick Cantlay refusing to wear the American team cap in an apparent protest at the fact that the players were not being remunerated to appear.' },
        { title: 'Weekly quiz: How did Rafael Nadal say goodbye to tennis?', imageUrl: 'https://images.pexels.com/photos/902194/pexels-photo-902194.jpeg?auto=compress&cs=tinysrgb&w=600', info: 'The world of tennis bade farewell to Rafael Nadal, the second-most successful men singles player of all time as he retired from the sport.' },
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




// CREATE news title
//curl -X POST -H "Content-Type: application/json" "localhost:8091/api/title/Test123/img/_IMAGE/info/Test123_INFO"
app.post('/api/title/:title/img/:imageUrl/info/:info', async (req, res) => {
    if (req.params.title) {
        console.log(req.body)
        //try {
        await mongoose.connect(uri);
        console.log("Connected successfully to server");

        let doc = {
            title: req.params.title || req.fields.title,
            imageUrl: req.params.imageUrl,
            info: req.params.info
        };
        const NewDoc = new News(doc);
        await NewDoc.save();
        console.log(NewDoc);
        res.status(200).json({ "Successfully inserted": NewDoc });
    } else {
        res.status(500).json({ "error": "missing bookingid" });
    }
});




// CREATE news
// https://reqbin.com/curl
// curl -X POST -H "Content-Type: application/json" --data '{"title":"ＦＤＳＡＦＤＡＳＦＡＳＤＦＳＤ","imageUrl":"https://images.pexels.com/photos/97050/pexels-photo-97050.jpeg?auto=compress&cs=tinysrgb&w=600","info":"ＴＨＩＳ　ＩＳ　ＴＥＳＴ！！！！"}' localhost:3000/api/news/
app.post('/api/news', async (req, res) => {
    const { title, imageUrl, info } = req.body;
    const newNews = new News({ title, imageUrl, info });

    try {
        await newNews.save();
        res.status(200).json(newNews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


//read
//curl -X GET "http://localhost:8091/api/title/Test123"
app.get('/api/title/:title', async (req, res) => {
    try {
        const doc = await News.findOne({ title: req.params.title });
        if (doc) {
            res.status(200).json(doc);
        } else {
            res.status(404).json({ "error": "Document not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ "error": "Internal server error" });
    }
});



//update
//curl -X PUT -H "Content-type: application/json" -d '{"imageUrl": "http://example.com/new-image.jpg", "info": "Updated info"}' 'http://localhost:8091/api/title/TEST1'
app.put('/api/title/:title', async (req, res) => {
    try {
        console.log(req.params.title);
        console.log(req.body.imageUrl + " " + req.body.info)
        const updatedDoc = await News.findOneAndUpdate(
            { title: req.params.title },
            {
                imageUrl: req.body.imageUrl,
                info: req.body.info
            },
            { new: true }
        );

        if (updatedDoc) {
            res.status(200).json({ "Successfully updated": updatedDoc });
        } else {
            res.status(404).json({ "error": "Document not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ "error": "Internal server error" });
    }
});

//delete
//curl -X DELETE "http://localhost:8091/api/title/TEST1"
app.delete('/api/title/:title', async (req, res) => {
    try {
        const deletedDoc = await News.findOneAndDelete({ title: req.params.title });
        if (deletedDoc) {
            res.status(200).json({ "Successfully deleted": deletedDoc });
        } else {
            res.status(404).json({ "error": "Document not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ "error": "Internal server error" });
    }
});




app.get('/logout', (req, res) => {

    req.session = null;
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

connectDB();
