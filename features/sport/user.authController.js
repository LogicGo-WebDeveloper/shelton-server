const Joi = require("joi");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const randomstring = require("randomstring"); // Library for generating random strings
const { OAuth2Client } = require("google-auth-library");

function generateOTP() {
  return randomstring.generate({
    length: 6,
    charset: "numeric",
  });
}

module.exports.register = async (req, res) => {
  let fileSuffix = Date.now().toString();

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Specify the destination directory where files will be uploaded.
      const uploadDir = path.join(__dirname, "../../public/images/photourl");
      fs.mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) {
          console.error("Error creating upload directory:", err);
          cb(err, null);
        } else {
          cb(null, uploadDir);
        }
      });
    },
    filename: function (req, file, cb) {
      cb(null, `${fileSuffix}-${file.originalname}`);
    },
  });

  const upload = multer({ storage: storage }).single("photourl");

  upload(req, res, async function (err, file, cb) {
    var user_name = req.body.user_name;
    var user_email = req.body.user_email;
    var user_pass = req.body.user_pass;
    var login_form = req.body.login_form;
    var photourl = req.file ? req.file.filename : "";

    const schema = Joi.object({
      user_name: Joi.string().required(),
      user_email: Joi.string().required(),
      user_pass: Joi.string().required(),
      login_form: Joi.string().required(),
    });

    const result = schema.validate({
      user_name: user_name,
      user_email: user_email,
      user_pass: user_pass,
      login_form: login_form,
    });
    if (result.error) {
      return res.status(400).json({
        msg: result.error.details[0].message,
        payload: [],
      });
    } else {
      if (err) {
        console.log(err);
      }

      const userEmail = await User.findOne({
        where: { user_email: user_email },
      });

      if (userEmail) {
        return res.status(400).json({
          msg: "Email already exist!",
          payload: [],
        });
      }

      var salt = bcrypt.genSaltSync(8);

      const users = await User.create({
        user_name: user_name,
        user_email: user_email,
        user_pass: bcrypt.hashSync(user_pass, salt),
        login_form: login_form,
        is_active: "",
        otpcode: "0",
      })
        .then(function (resp) {
          var fullUrl = req.protocol + "://" + req.get("host") + "/photourl/";

          const token = jwt.sign(
            {
              resp,
            },
            process.env.JWT_USER_SECRET,
            {
              expiresIn: process.env.JWT_USER_TOKENLIFE,
            }
          );

          var user = {
            user_id: resp.id,
            user_name: resp.user_name,
            user_email: resp.user_email,
            login_form: resp.login_form,
            is_active: 1,
            user_pass: resp.user_pass,
            otpcode: resp.otpcode,
            // photo: resp.otpcode,
            // photourl: resp.photourl ? fullUrl + resp.photourl : "",
          };
          return res.status(200).json({
            msg: "User created successfully!",
            data: user,
            token: token,
            status: true,
          });
        })
        .catch(function (err) {
          console.log(err);
          return res.status(400).json({
            msg: "Please try again!",
            payload: [],
            status: false,
          });
        });
    }
  });
};

module.exports.login = async (req, res) => {
  // get input data
  var user_email = req.body.user_email;
  var password = req.body.password;

  // validation
  const schema = Joi.object({
    user_email: Joi.string().required().email().trim(),
    password: Joi.string().required().trim().min(6),
  });

  const result = schema.validate({
    user_email: user_email,
    password: password,
  });

  if (result.error) {
    return res.status(400).json({
      message: result.error.details[0].message,
    });
  } else {
    var users = await User.findOne({
      where: {
        user_email: user_email,
      },
    });
    console.log(users);
    if (users) {
      var password_valid = await bcrypt.compare(password, users.user_pass);
      var fullUrl = req.protocol + "://" + req.get("host") + "/images/";

      if (password_valid) {
        var user = {
          user_id: users.id,
          user_name: users.name,
          user_email: users.email,
          login_form: users.login_form,
          is_active: 1,
          user_pass: users.user_pass,
          otpcode: users.otpcode,
          photo: users.otpcode,
          photourl: users.photourl ? fullUrl + users.photourl : "",
        };

        // Generate Token
        const token = jwt.sign(
          {
            user,
          },
          process.env.JWT_USER_SECRET,
          {
            expiresIn: process.env.JWT_USER_TOKENLIFE,
          }
        );

        return res.status(200).json({
          message: "Success",

          token: token,
          data: user,
        });
      } else {
        return res.status(401).json({
          message: "Invalid Credentials",
        });
      }
    } else {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }
  }
};

module.exports.forgotPassword = async (req, res) => {
  const email = req.body.email;

  const schema = Joi.object({
    email: Joi.string().required().email().trim(),
  });

  const result = schema.validate({
    email: email,
  });

  if (result.error) {
    return res.status(400).json({
      message: result.error.details[0].message,
    });
  } else {
    const user = await User.findOne({
      where: { email: email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Email does not exists please try again later!",
        status: false,
      });
    }

    let otp = generateOTP();

    user.otpcode = otp;
    user.is_active = "0";
    await user.save();

    // Create a transporter using Gmail SMTP
    let transporter = nodemailer.createTransport({
      auth: {
        user: "hr.logicgoinfotech@gmail.com",
        pass: "xbfyckrwctgbczitS",
      },
    });

    // Setup email data
    let mailOptions = {
      from: "hr.logicgoinfotech@gmail.com",
      to: email,
      subject: "Please verify your Account with Otp",
      text: `Your OTP is: ${otp}`, // Plain text body
    };

    // Send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error occurred:", error.message);
        return;
      }
      return res.status(200).json({
        msg: "Otp send successfully please check your gmail!",
        status: true,
      });
    });
  }
};

module.exports.otpVerify = async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;

  const schema = Joi.object({
    email: Joi.string().required().email().trim(),
  });

  const result = schema.validate({
    email: email,
  });

  if (result.error) {
    return res.status(400).json({
      message: result.error.details[0].message,
    });
  } else {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({
        message: "Email does not exists please try again later!",
        status: false,
      });
    }

    if (user) {
      if (user.is_active === "1") {
        return res.status(400).json({
          message: "Otp expire or check user!",
          status: false,
        });
      }
    }

    if (user) {
      if (user.otpcode === otp) {
        await User.update(
          { is_active: "1" },
          {
            where: {
              email: email,
            },
          }
        );
        return res.status(200).json({
          message: "Otp verify successfully!",
          status: true,
        });
      }
    }
  }
};

module.exports.resetPassword = async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;
  const password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().required().email().trim(),
    otp: Joi.number().required(),
    password: Joi.string().required().trim(),
  });

  const result = schema.validate({
    email: email,
    otp: otp,
    password: password,
  });

  if (result.error) {
    return res.status(400).json({
      message: result.error.details[0].message,
    });
  } else {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({
        message: "Email does not exists please try again later!",
        status: false,
      });
    }

    if (user) {
      if (user.is_active === "1") {
        return res.status(400).json({
          message: "Otp expire or check user!",
          status: false,
        });
      }
    }

    var salt = bcrypt.genSaltSync(8);

    if (user) {
      if (user.otpcode === otp) {
        await User.update(
          { is_active: "1", password: bcrypt.hashSync(password, salt) },

          {
            where: {
              email: email,
            },
          }
        );
        return res.status(200).json({
          message: "Otp verify successfully!",
          status: true,
        });
      } else {
        return res.status(400).json({
          message: "Otp did not match!",
          status: false,
        });
      }
    }
  }
};

module.exports.updateUserProfile = async (req, res) => {
  let fileSuffix = Date.now().toString();

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Specify the destination directory where files will be uploaded.
      const uploadDir = path.join(__dirname, "../../public/images/photourl");
      fs.mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) {
          console.error("Error creating upload directory:", err);
          cb(err, null);
        } else {
          cb(null, uploadDir);
        }
      });
    },
    filename: function (req, file, cb) {
      cb(null, `${fileSuffix}-${file.originalname}`);
    },
  });

  const upload = multer({ storage: storage }).single("photourl");

  upload(req, res, async function (err, file, cb) {
    const photourl = req.file ? req.file.filename : "";
    var name = req.body.name;

    const users = await User.create({
      name: name,
      photourl: photourl,
    })
      .then(function (resp) {
        return res.status(200).json({
          msg: "User profile updated successfully!",
          data: resp,
          status: true,
        });
      })
      .catch(function (err) {
        console.log(err);
        return res.status(400).json({
          msg: "Please try again!",
          payload: [],
          status: false,
        });
      });
  });
};

module.exports.deleteUserAccount = async (req, res) => {
  const users = await User.findOne({
    where: {
      id: req.user_id,
    },
  });

  if (!users) {
    return res.status(400).json({
      msg: "Users not found successfully!",
      status: false,
    });
  }

  const person = await User.destroy({
    where: {
      id: req.user_id,
    },
  });

  return res.status(400).json({
    msg: "User deleted successfully!",
    status: true,
  });
};

module.exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  const client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  });

  const ticket = await client.verifyIdToken({
    idToken: idToken,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    return res.status(400).json({
      status: false,
      message: "Invalid id token",
    });
  }

  const email = req.body.email;
  const name = req.body.name;
  const login_from = req.body.login_form;

  let user = await User.findOne({
    email: email,
  });

  if (!user) {
    user = await User.create({
      email: email,
      name: name,
      login_from: login_from,
    });
  } else {
    user = await User.update({
      login_from: login_from,
    });
  }
};
