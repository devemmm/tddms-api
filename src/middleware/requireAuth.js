const jwt = require("jsonwebtoken");
const User = require("../model/User");

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res
      .status(401)
      .json({
        status: 400,
        error: true,
        message: "failed",
        errorMessage: "Authorization token is null",
      });
  }
  try {
    const token = authorization.replace("Bearer ", "");

    jwt.verify(token, process.env.JWT_SECRET, async (error, payload) => {
      if (error) {
        return res
          .status(401)
          .json({
            status: 400,
            error: true,
            message: "failed",
            errorMessage: "Authorization Faild !!!",
          });
      }

      const { _id } = payload;
      const user = await User.findOne({ _id, "tokens.token": token });

      if (!user) {
        return res
          .status(401)
          .json({
            status: 400,
            error: true,
            message: "failed",
            errorMessage: "Authorization Faild !!! login again",
          });
      }

      req.token = token;
      req.user = user;
      next();
    });
  } catch (error) {
    return res
      .status(401)
      .json({
        status: 400,
        error: true,
        message: "failed",
        errorMessage: error.message,
      });
  }
};

module.exports = requireAuth;
