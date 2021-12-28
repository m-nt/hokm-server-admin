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
const Payments = require("./models/Payments");
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
    app.listen(PORT, console.log(`app listening on port:${PORT}`));
    console.log(`mongoose conected to Data Base...`);
  })
  .catch((err) => console.log(err));

// every one minutes check for vip expire time
setInterval(() => {
  VIP.findOneAndDelete({ expires: { $lt: Date.now() } })
    .then((vip) => {
      if (vip) {
        const del_vip = new DEL_VIP({
          name: vip.name,
          user_pk: vip.user_pk,
          expires: vip.expires,
        });
        del_vip.save();
      }
    })
    .catch((err) => {
      console.log(err);
    });
  FriendListModel.findOneAndDelete({ status: "REJECTED" })
    .then((list) => {
      if (list) {
        const del_frlst = new DeletedFriendListModel({
          status: list.status,
          user_pk_sender: list.user_pk_sender,
          user_pk_reciver: list.user_pk_reciver,
        });
        del_frlst.save();
      }
    })
    .catch((err) => {
      console.log(err);
    });
  User.find({ $or: [{ Debt: { $gt: 0 } }, { Debt: { $lt: 0 } }] })
    .then((users) => {
      if (users.length > 0) {
        users.forEach((user) => {
          user.Curency += user.Debt;
          user.Debt = 0;
          user.save();
        });
      }
    })
    .catch((error) => {
      console.log(error);
    });
}, 60000);

