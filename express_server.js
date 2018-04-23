var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bcrypt = require('bcrypt');
//var cookieParser = require('cookie-parser')
//app.use(cookieParser());
var cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs")

var urlDatabase = {
  "b2xVn2": {
    URL: "http://www.lighthouselabs.ca",
    userId : "userRandomID"
  },
  "b2xVn3": {
    URL: "http://www.google.com",
    userId: "userRandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  }
}

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

function urlsForUser(id) {
  let tempUrls = {};
  for (const item in urlDatabase){
    if(urlDatabase[item].userId === id) {
      tempUrls[item] = urlDatabase[item];
    }
  }
  return tempUrls;
}

function findObjValue(obj,key,value) {
  let tempUrls = {};
  for (const item in obj){
    if(obj[item][key] === value) {
      tempUrls[item] = obj[item];
    }
  }
  return tempUrls;
}

function checkUrl(nURL){
  if (nURL.slice(0,7).toLowerCase() === 'http://' ||
      nURL.slice(0,7).toLowerCase() === 'https://'){
    return true;
  } else{
    return false;
  }
}

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (req.session.user_id){
    if (findObjValue(users,"id",req.session.user_id)){
     let templateVars = {
        user: users[req.session.user_id],
        urls: urlsForUser(req.session.user_id)
      };
      res.render("urls_index", templateVars);
    } else {
      req.session = null;
    }
  }  else{
    //res.status(401).send("You are unauthorized to use this website");
    res.redirect('/login');
  }
});

// Add new URL
app.get("/urls/new", (req, res) => {
  if (req.session.user_id){
    if (findObjValue(users,"id",req.session.user_id)){
      let templateVars = {
        user: users[req.session.user_id]
      };
      res.render("urls_new", templateVars);
    } else {
        req.session = null;
    }
  } else {
   res.redirect('/login');
  }
});

// Add new URL with UserID
app.post("/urls", (req, res) => {
  if (checkUrl(req.body.longURL)){
    let shortURL = generateRandomString();
    let newUrl = {
      URL: req.body.longURL,
      userId: req.session.user_id
    };
    urlDatabase[shortURL] = newUrl;
    res.redirect("/urls");
  } else{
    res.status(400).send("Please enter http:// or https:// before your the new URL");
  }
});

// Updating the url
app.get("/urls/:id", (req, res) => {
  if (req.session.user_id && findObjValue(users,"id",req.session.user_id)){
    if (urlDatabase[req.params.id].userId === req.session.user_id){
      let templateVars = {
        shortURL: req.params.id,
        url: urlDatabase[req.params.id].URL,
        user: users[req.session.user_id]
      };
      res.render("urls_show", templateVars);
    } else {
      res.status(400).send("You don't have permission to edit this URL");
      res.redirect('/urls');
    }
  }  else {
    res.redirect('/login');
  }
});

//Moving to a specific URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].URL;
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/urls/:id/edit', (req, res) => {
  urlDatabase[req.params.id].URL = req.body.URL
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password){
      res.status(400).send("You need to enter Email and password");
      return;
  }
  var exists = false;
  var userId;
  for (const em in users){
    if (users[em].email === req.body.email &&
      bcrypt.compareSync(req.body.password, users[em].password)){
      exists = true;
      userId = users[em].id;
    }
  }
  if (exists){
    req.session.user_id = users[userId].id;
    res.redirect('/urls');
  } else {
      res.status(403).send("Email or Password is incorrect");
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

// add the user information to the database
app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password){ //check if the user enter both email and password
    res.status(400).send("You need to enter Email and password");
  } else {
    var exists = false;
    for (const em in users){
      if (users[em].email === req.body.email){
        exists = true;
      }
    }
    if (!exists){
      const randomKeyId = generateRandomString(); // create user id
      const hashedPassword = bcrypt.hashSync(req.body.password, 10); //create hash password
      const userLogin = {           // Add user details
        id: randomKeyId,
        email: req.body.email,
        password: hashedPassword
      };
      users[randomKeyId] = userLogin;
      req.session.user_id = users[randomKeyId].id;
      res.redirect('/urls');
    } else{
      res.status(400).send("Email already exist");
    }
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});