//init imports
const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");
const express = require("express");
const mongose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");
//express app
const app = express();
const PORT = process.env.PORT || 9090;
//MongoDB URL
const URL = require("./conf.json").MongoURL;
const Options = require("./conf.json").MongoOpt;
//Resources
const User = require("./models/User");
AdminJS.registerAdapter(AdminJSMongoose);
process.env.SESSION_SECRET = "secret";

mongose
  .connect(URL, Options)
  .then((db) => {
    // admin panel
    const adminJs = new AdminJS({
      databases: [db],
      rootPath: "/admin",
    });
    const router = AdminJSExpress.buildAuthenticatedRouter(
      adminJs,
      {
        authenticate: async (Username, Password) => {
          const user = await User.findOne({ Username });
          if (user) {
            const matched = await bcrypt.compare(Password, user.Password);
            if (matched && user.role == "admin") {
              return user;
            }
          }
          return false;
        },
        cookiePassword: "some-secret-password-used-to-secure-cookie",
      },
      null,
      {
        resave: false,
        saveUninitialized: true,
      }
    );
    app.use(adminJs.options.rootPath, router);
    console.log(`mongoose conected to Data Base...`);
  })
  .catch((err) => console.log(err));

app.listen(PORT, console.log(`app listening on port:${PORT}`));
