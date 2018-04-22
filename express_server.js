var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser')
app.use(cookieParser());

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
  //  console.log("value parameter: ", value, "object: ", obj, "key: ", key);
  //    console.log("obj item ", obj[item][key]);
    if(obj[item][key] === value) {
      tempUrls[item] = obj[item];
  //    console.log("tempUrls[item] ", tempUrls[item]);
    }
  }
  console.log("tempUrls:   ", tempUrls);
  return tempUrls;
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (req.cookies["userid"]){
    console.log("user found " , findObjValue(users,"id",req.cookies["userid"]));
    if (findObjValue(users,"id",req.cookies["userid"])){
      //console.log("return temp: " , findObjValue(users,"id",req.cookies["userid"]));
     //console.log("cookies: ", req.cookies["userid"]);
     let templateVars = {
        user: users[req.cookies["userid"]],
        urls: urlsForUser(req.cookies["userid"])
      };
      //console.log("tempVariables: ", templateVars);
      res.render("urls_index", templateVars);
    } else {
      console.log("clearCookie");
      res.clearCookie('userid');
    }
  }  else{
    res.redirect('/login');
  }
});

// Add new URL
app.get("/urls/new", (req, res) => {
  if (req.cookies["userid"]){
    if (findObjValue(users,"id",req.cookies["userid"])){
      let templateVars = {
        user: users[req.cookies["userid"]]
      };
      res.render("urls_new", templateVars);
    } else {
      res.clearCookie('userid');
    }
  } else {
   res.redirect('/login');
  }
});

// Updating the url
app.get("/urls/:id", (req, res) => {
  if (req.cookies["userid"] && findObjValue(users,"id",req.cookies["userid"])){
    if (urlDatabase[req.params.id].userId === req.cookies["userid"]){
      let templateVars = {
        shortURL: req.params.id,
        url: urlDatabase[req.params.id].URL,
        user: users[req.cookies["userid"]]
      };
      console.log(templateVars);
      res.render("urls_show", templateVars);
    } else {
      //alert("You donn't have permission to edit this URL");
      confirm("You donn't have permission to edit this URL");
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
    if (users[em].email === req.body.email && users[em].password === req.body.password){
      exists = true;
      userId = users[em].id;
    }
  }
  if (exists){
    res.cookie('userid', users[userId].id);
    res.redirect('/urls');
  } else {
      res.status(403).send("Email or Password is incorrect");
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('userid');
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

// add the user information to the database
app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password){
    res.status(400).send("You need to enter Email and password");
  } else {
    var exists = false;
    for (const em in users){
      if (users[em].email === req.body.email){
        exists = true;
      }
    }
    if (!exists){
      const randomKeyId = generateRandomString();
      const userLogin = {
        id: randomKeyId,
        email: req.body.email,
        password: req.body.password
      };
      users[randomKeyId] = userLogin;
      res.cookie('userid', users[randomKeyId].id);
      res.redirect('/urls');
    } else{
      res.status(400).send("Email already exist");
    }
  }
});

function checkUrl(nURL){
  if (nURL.slice(0,7).toLowerCase() === 'http://' ||
      nURL.slice(0,7).toLowerCase() === 'https://'){
    return true;
  } else{
    //return res.status(400).send("Please enter http:// or https:// before your the new URL");
    return false;
  }
}
// Add new URL with UserID
app.post("/urls", (req, res) => {
  if (checkUrl(req.body.longURL)){
    let shortURL = generateRandomString();
    let newUrl = {
      URL: req.body.longURL,
      userId: req.cookies["userid"]
    };
    urlDatabase[shortURL] = newUrl;
    console.log("url added : ", urlDatabase[shortURL] );
    res.redirect("/urls");
  } else{
    res.status(400).send("Please enter http:// or https:// before your the new URL");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});