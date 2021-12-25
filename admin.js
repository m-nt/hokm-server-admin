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
const VIP = require("./models/vipticket");
const DEL_VIP = require("./models/deletedvip");
const FriendListModel = require("./models/friendlist");
const DeletedFriendListModel = require("./models/deletedfrndlist");
const User = require("./models/User");
const Report = require("./models/reports");
AdminJS.registerAdapter(AdminJSMongoose);
mongose
  .connect(URL, Options)
  .then((db) => {
    // admin panel
    const adminJs = new AdminJS({
      databases: [db],
      rootPath: "/admin",
    });
    const router = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
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
    });
    app.use(adminJs.options.rootPath, router);
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json({ extended: false }));
    //Express session
    app.use(
      session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
        cookie: {
          maxAge: 33333333333,
        },
      })
    );

    console.log(`mongoose conected to Data Base...`);
  })
  .catch((err) => console.log(err));

app.listen(PORT, console.log(`app listening on port:${PORT}`));
