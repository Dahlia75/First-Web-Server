var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser')
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs")

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       user: users[req.cookies["userid"]]};
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: req.cookies["userid"]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                        url: urlDatabase[req.params.id],
                        user: req.cookies["userid"]};
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  console.log("get register")
  res.render("urls_register");
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password){
      res.status(400).send("You need to enter Email and password");
      return;
  }
  var exists = false;
  var userId;
  for (const em in users){
    console.log("email: " + req.body.email);
    if (users[em].email === req.body.email && users[em].password === req.body.password){
      exists = true;
      console.log("exists: " + exists);
      userId = users[em].id;
    }
  }

  if (exists){
      exists = false;
      res.cookie('userid', users[userId].id);
      res.redirect('/urls');
    }
    else{
        res.status(403).send("Email or Password is incorrect");
        console.log("Email already exist");
    }
});

app.post('/logout', (req, res) => {
  res.clearCookie('userid');
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.URL
  res.redirect('/urls');
});
// add the user information to database
app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password){
      res.status(400).send("You need to enter Email and password");
      //console.log("you need to enter value");
  } else {
    var exists = false;
    for (const em in users){
      if (users[em].email === req.body.email){
        exists = true;
      }
    }
      console.log("exist : " + exists)
    if (!exists){
      const randomKeyId = generateRandomString();
      const userLogin = {id: randomKeyId, email: req.body.email, password: req.body.password};
      //console.log("user details : " + userLogin);
      users[randomKeyId] = userLogin;
      //console.log("userid" + users[randomKeyId].id);
      res.cookie('userid', users[randomKeyId].id);
      console.log("post register")
      exists = false;
      res.redirect('/urls');
    }
    else{
        res.status(400).send("Email already exist");
        console.log("Email already exist");
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});