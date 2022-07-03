const fs = require("fs");
const nodemailer = require("nodemailer");
const json2xls = require("json2xls");
const filename = "tddu_users.xlsx";
const filename2 = "Tomato-Disease-Detector.xlsx"

const User = require("../model/User");
const InfectedTomato = require("../model/InfectedTomato");
const { isExistUser } = require("../helps/helpFunction");
const requireAuth = require("../middleware/requireAuth");

const index = [
  (req, res) => {
    res.json({ status: 200, message: "successfull" });
  },
];

const signin = [
  async (req, res) => {
    const { phone, password } = req.body;
    try {
      if (!phone) {
        throw new Error("phone required");
      }

      if (!password) {
        throw new Error("password required");
      }
      const user = await User.findByCredentials(phone, password);
      await user.generateAuthToken();

      res.status(200).json({
        statusCode: 200,
        status: "successfull",
        message: "you are logged in",
        user,
      });
    } catch (error) {
      res.status(400).json({
        error: { statusCode: 400, status: "failed", message: error.message },
      });
    }
  },
];

const signup = [
  async (req, res) => {
    try {
      const { fname, lname, gender, phone, location, email, password } =
        req.body;

      if (
        !email ||
        !fname ||
        !lname ||
        !gender ||
        !phone ||
        !location ||
        !password
      ) {
        throw new Error("missing some required information");
      }

      const user = new User({
        ...req.body,
      });

      const isValidUser = await isExistUser(user.phone);

      if (isValidUser) {
        throw new Error("user alredy exist in system");
      }
      await user.save();

      const token = await user.generateAuthToken();

      res.status(200).json({
        statusCode: 201,
        message: "account created successfull",
        status: "successfull",
        user,
      });
    } catch (error) {
      res.status(400).json({
        error: { statusCode: 400, status: "failed", message: error.message },
      });
    }
  },
];

const signout = [
  requireAuth,
  async (req, res) => {
    try {
      req.user.tokens = req.user.tokens.filter(
        (token) => token.token !== req.token
      );

      await req.user.save();

      res.status(200).send({ status: 200, message: "successfully" });
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } });
    }
  },
];

const generateReport = [
  requireAuth,
  async (req, res) => {
    try {
      const { location, phone, fname, lname } = req.user;
      const { name, description } = req.body;

      if (!name || !description) {
        return res.json({
          error: { message: "missing some required information" },
        });
      }
      const disease = { name, description };

      const report = new InfectedTomato({
        ...{
          farmer: {
            phone,
            fname,
            lname,
          },
          location,
          disease,
        },
      });

      await report.save();

      res.json({ status: 200, message: "successfull", report });
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } });
    }
  },
];

const getReportedDisease = [
  requireAuth,
  async (req, res) => {
    try {
      const { userType } = req.user;

      if (userType === "farmer") {
        return res.json({
          error: {
            status: 401,
            message: "please you are not allowed to perform this action",
          },
        });
      }

      const diseases = await InfectedTomato.find({});

      let filteredDisease = [];

      switch (userType) {
        case "sector":
          filteredDisease = diseases.filter(
            (dis) => dis.observation.sector.admitted === false
          );
          break;

        case "district":
          filteredDisease = diseases.filter(
            (dis) =>
              dis.observation.sector.admitted === true &&
              dis.observation.district.admitted == false
          );
          break;

        case "rab":
          filteredDisease = diseases;
          break;
        default:
          break;
      }

      res.json({ disease: filteredDisease });
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } });
    }
  },
];

const approveReport = [
  requireAuth,
  async (req, res) => {
    try {
      const { userType } = req.user;
      const { canSolve, comments, admitted } = req.body;

      const _id = req.params.id;

      const report = await InfectedTomato.findById({ _id });

      if (!report) {
        return res.json({
          error: {
            status: 404,
            message: "there is no report found for this disease id",
          },
        });
      }

      switch (userType) {
        case "sector":
          const sector = {
            agro: req.user.fname + " " + req.user.lname,
            ...req.body,
          };

          report.observation.sector = sector;

          await report.save();

          return res.json({ status: 204, message: "successfull", report });
        case "district":
          const district = {
            agro: req.user.fname + " " + req.user.lname,
            ...req.body,
          };

          report.observation.district = district;
          await report.save();

          return res.json({ status: 204, message: "successfull", report });

        case "rab":
          const rab = {
            agro: req.user.fname + " " + req.user.lname,
            ...req.body,
          };

          report.observation.rab = rab;

          await report.save();

          return res.json({ status: 204, message: "successfull", report });

        default:
          throw new Error("you are not allowed to perform this action");
      }
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } });
    }
  },
];

const deleteUser = [
  requireAuth,
  async (req, res) => {
    try {
      const { userType } = req.user;

      console.log(userType);

      if (userType !== "rab") {
        throw new Error(
          req.user.fname + " " + "you are not allowed to perform this action"
        );
      }

      console.log(req.params.phone);

      const result = await User.deleteOne({ phone: req.params.phone });

      if (result.deletedCount !== 1) {
        throw new Error(
          "user not found for this phone number",
          req.params.phone
        );
      }

      res.send({ status: 200, message: "user deleted", result });
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } });
    }
  },
];

const registerUser = [
  requireAuth,
  async (req, res) => {
    try {
      const { userType } = req.user;

      if (userType !== "rab") {
        throw new Error(
          req.user.fname + " " + "you are not allowed to perform this action"
        );
      }
      const { fname, lname, gender, phone, location, email, password } =
        req.body;

      if (
        !email ||
        !fname ||
        !lname ||
        !gender ||
        !phone ||
        !location ||
        !password
      ) {
        throw new Error("missing some required information");
      }

      const user = new User({
        ...req.body,
      });

      const isValidUser = await isExistUser(user.phone);

      if (isValidUser) {
        throw new Error("user alredy exist in system");
      }
      await user.save();
      const token = await user.generateAuthToken();

      res.status(200).json({
        statusCode: 201,
        message: "account created successfull",
        status: "successfull",
        user,
      });
    } catch (error) {
      res.status(400).json({
        error: { statusCode: 400, status: "failed", message: error.message },
      });
    }
  },
];

const convert = function (responses) {
  var xls = json2xls(responses);
  fs.writeFileSync(`./public/${filename}`, xls, "binary", (err) => {
    if (err) {
      console.log("writeFileSync :", err);
    }
    console.log(filename + " file is saved!");
  });
};

const findAllUser = [
  requireAuth,
  async (req, res) => {
    try {
      if (req.user.userType !== "rab") {
        throw new Error(
          req.user.fname + " " + "you are not allowed to perform this action"
        );
      }
      const users = await User.find({});
      console.log(users);
      convert(users);

      return res.json({ users });
    } catch (error) {
      res.status(400).json({
        error: { statusCode: 400, status: "failed", message: error.message },
      });
    }
  },
];

const updateAccount = [
  requireAuth,
  async (req, res) => {
    try {
      const {
        userType,
        phone,
        fname,
        lname,
        location,
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;

      let type = req.query.type;

      if (!type) {
        type = "info";
      }

      switch (type) {
        case "password":
          if (!currentPassword || !newPassword || !confirmPassword) {
            throw new Error("missing some required values");
          }

          if (newPassword !== confirmPassword) {
            throw new Error("password doesn't match");
          }

          const user = await User.findByCredentials(
            req.user.phone,
            currentPassword
          );
          if (!user) {
            throw new Error("wrong old password");
          }

          user.password = newPassword;

          await user.save();

          return res.status(200).json({
            statusCode: 200,
            message: "password updated successfull",
            status: "successfull",
            user,
          });

        case "userType":
          if (!req.user.userType === "district") {
            throw new Error("you are not allowed to perform this action");
          }

          if (!phone) {
            throw new Error("user to update required");
          }

          if (!userType) {
            throw new Error("please specify the his/her user_type");
          }

          const userToUpdate = await User.findOneAndUpdate(
            { phone: phone },
            { userType }
          );

          if (!userToUpdate) {
            throw new Error("user not found");
          }

          return res.status(200).json({
            statusCode: 200,
            message: "user account updated successfull",
            status: "successfull",
            user: userToUpdate,
          });
        default:
          if (!fname || !lname || !location) {
            throw new Error("missing some required information");
          }

          const { country, province, district, sector, cell } = location;

          if (!country || !province || !district || !sector || !cell) {
            throw new Error("missing some required information");
          }

          const userData = req.user;

          userData.fname = fname;
          userData.lname = lname;
          userData.location = location;

          await userData.save();

          return res.status(200).json({
            statusCode: 200,
            message: "user account updated successfull",
            status: "successfull",
            user: userData,
          });
      }
    } catch (error) {
      res.status(400).json({
        error: { statusCode: 400, status: "failed", message: error.message },
      });
    }
  },
];


const converttoxlsx = function (responses) {
  var xls = json2xls(responses);
  fs.writeFileSync(filename2, xls, "binary", (err) => {
    if (err) {
      console.log("writeFileSync :", err);
    }
    console.log(filename2 + " file is saved!");
  });
};

const pushReport = [
  requireAuth,
  async (req, res) => {
    try {

      const reqData = req.query

      if (!reqData) {
        throw new Error("request resources not found")
      }

      let datatoSend = []

      if (reqData?.type === 'dis' && req.user.userType === "rab") {

        const infectedTomato = await InfectedTomato.find({}, { _id: 0, observation: 0 }).lean()
        datatoSend = infectedTomato;
      }

      if (reqData?.type === 'user' && req.user.userType === "rab") {
        const user = await User.find({}, { _id: 0, location: 0, tokens: 0, password: 0 }).lean()
        datatoSend = user;
      }

      if (reqData?.type === "dis" && req.user.userType === "farmer") {

        const inftectedTomatoContainer = await InfectedTomato.find({}, { _id: 0, observation: 0 }).lean()
        let filertedData = inftectedTomatoContainer.filter((item) => item.farmer.phone = "0788596281")
        datatoSend = filertedData;
      }

      converttoxlsx(datatoSend)
      const output = `
            <p>Tomato Disease Detector</p>
            <h3>Contact Details</h3>
            <ul>
                <li>Name: Tomato-Disease-Detector</li>
                <li>Email: josephrw@tdd.rw</li>
                <li>Phone: +250 78 550 592</li>
            </ul>
            <h3>Message</h3>
        `;

      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD
        }
      })


      // Step 2
      let mailOptions = {
        from: 'primaryemmy@gmail.com',
        to: `${req.user.email}`,
        subject: "Tomato Disease Detector",
        text: "heading",
        html: output,
        attachments: [
          {
            filename: 'Tomato-Disease-Detector.xlsx',
            path: './Tomato-Disease-Detector.xlsx'
          }
        ]
      }

      // Step 3
      transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
          console.log(err.message)
        } else {
          return "email sent successfull !!!"
        }
      })

      return res.status(200).json({ status: 200, message: "email sent successfull !!!" })
    } catch (error) {
      res.status(400).json({ error: { status: 400, message: error.message } })
    }
  }
]


const underMentainance = [
  (req, res) => {
    try {
      res.json({ status: 200, message: "system under developmenet" });
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } });
    }
  },
];

const notFound = [
  (req, res) => {
    res.json({ error: { status: 404, message: "Router not found" } });
  },
];

module.exports = {
  index,
  signin,
  signup,
  signout,
  generateReport,
  pushReport,
  getReportedDisease,
  approveReport,
  deleteUser,
  registerUser,
  findAllUser,
  updateAccount,
  underMentainance,
  notFound,
};
