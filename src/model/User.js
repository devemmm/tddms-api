const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema(
  {
    fname: {
      type: String,
      trim: true,
      required: true,
    },
    lname: {
      type: String,
      trim: true,
      required: true,
    },
    gender: {
      type: String,
      trim: true,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
    },
    location: {
      country: {
        type: String,
        trim: true,
        default: "Rwanda",
      },
      province: {
        type: String,
        trim: true,
      },
      district: {
        type: String,
        trim: true,
      },
      sector: {
        type: String,
        trim: true,
      },
      cell: {
        type: String,
        trim: true,
      },
    },
    email: {
      type: String,
      trim: true,
    },
    userType: {
      type: String,
      trim: true,
      default: "farmer",
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    tokens: [
      {
        token: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const user = this;

  const userObject = user.toObject();

  // const replacewith = `${process.env.SITE_URL}/profile-Pictures`

  // userObject.profile = `${userObject.profile.replace('profile-Pictures', replacewith)}`

  userObject.token =
    user.tokens[user.tokens.length > 0 ? user.tokens.length - 1 : 0]?.token;

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (phone, password) => {
  if (!phone || !password) {
    throw new Error("You must provide phone number and password");
  }

  const user = await User.findOne({ phone });

  if (!user) {
    throw new Error("Phone number Not Found !!!");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Wrong Password !!!");
  }

  return user;
};

// Hash the plain text password before save
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
