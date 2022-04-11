const User = require('../model/User')
const InfectedTomato = require('../model/InfectedTomato')
const { isExistUser } = require('../helps/helpFunction')
const requireAuth = require('../middleware/requireAuth')

const index = [
  (req, res) => {
    res.json({ status: 200, message: 'successfull' })
  },
]

const signin = [
  async (req, res) => {
    const { phone, password } = req.body
    try {
      if (!phone) {
        throw new Error('phone required')
      }

      if (!password) {
        throw new Error('password required')
      }
      const user = await User.findByCredentials(phone, password)
      await user.generateAuthToken()

      res.status(200).json({
        statusCode: 200,
        status: 'successfull',
        message: 'you are logged in',
        user,
      })
    } catch (error) {
      res.status(400).json({
        error: { statusCode: 400, status: 'failed', message: error.message },
      })
    }
  },
]

const signup = [
  async (req, res) => {
    try {
      const { fname, lname, gender, phone, location, email, password } =
        req.body

      if (
        !email ||
        !fname ||
        !lname ||
        !gender ||
        !phone ||
        !location ||
        !password
      ) {
        throw new Error('missing some required information')
      }

      const user = new User({
        ...req.body,
      })

      const isValidUser = await isExistUser(user.phone)

      if (isValidUser) {
        throw new Error('user alredy exist in system')
      }
      await user.save()

      const token = await user.generateAuthToken()

      res.status(200).json({
        statusCode: 201,
        message: 'account created successfull',
        status: 'successfull',
        user,
      })
    } catch (error) {
      res.status(400).json({
        error: { statusCode: 400, status: 'failed', message: error.message },
      })
    }
  },
]

const signout = [
  requireAuth,
  async (req, res) => {
    try {
      req.user.tokens = req.user.tokens.filter(
        (token) => token.token !== req.token
      )

      await req.user.save()

      res.status(200).send({ status: 200, message: 'successfully' })
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } })
    }
  },
]

const generateReport = [
  requireAuth,
  async (req, res) => {
    try {
      const { location, phone, fname, lname } = req.user
      const { name, description } = req.body;

      if(!name  || !description){
        return res.json({error: {message: 'missing some required information'}})
      }
      const disease = { name, description }

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
      })

      await report.save()

      res.json({ status: 200, message: 'successfull', report })
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } })
    }
  },
]

const getReportedDisease = [
  requireAuth,
  async (req, res) => {
    try {
      const { userType } = req.user

      if (userType === 'farmer') {
        return res.json({
          error: {
            status: 401,
            message: 'please you are not allowed to perform this action',
          },
        })
      }

      const diseases = await InfectedTomato.find({})

      let filteredDisease = []

      switch (userType) {
        case 'sector':
          filteredDisease = diseases.filter(
            (dis) => dis.observation.sector.admitted === false
          )
          break

        case 'district':
          filteredDisease = diseases.filter(
            (dis) =>
              dis.observation.sector.admitted === true &&
              dis.observation.district.admitted == false
          )
          break

        case 'rab':
          filteredDisease = diseases
          break
        default:
          break
      }

      res.json({ disease: filteredDisease })
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } })
    }
  },
]

const approveReport = [
  requireAuth,
  async (req, res) => {
    try {
      const { userType } = req.user
      const { canSolve, comments, admitted } = req.body

      const _id = req.params.id

      const report = await InfectedTomato.findById({ _id })

      if (!report) {
        return res.json({
          error: {
            status: 404,
            message: 'there is no report found for this disease id',
          },
        })
      }

      switch (userType) {
        case 'sector':
          const sector = {
            agro: req.user.fname + ' ' + req.user.lname,
            ...req.body,
          }

          report.observation.sector = sector

          await report.save()

          return res.json({ status: 204, message: 'successfull', report })
        case 'district':
          const district = {
            agro: req.user.fname + ' ' + req.user.lname,
            ...req.body,
          }

          report.observation.district = district
          await report.save()

          return res.json({ status: 204, message: 'successfull', report })

        case 'rab':
          const rab = {
            agro: req.user.fname + ' ' + req.user.lname,
            ...req.body,
          }

          report.observation.rab = rab

          await report.save()

          return res.json({ status: 204, message: 'successfull', report })

        default:
          throw new Error('you are not allowed to perform this action')
      }
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } })
    }
  },
]

const deleteUser = [
  requireAuth,
  async (req, res) => {
    try {
      const { userType } = req.user

      console.log(userType)

      if (userType !== 'rab') {
        throw new Error(
          req.user.fname + ' ' + 'you are not allowed to perform this action'
        )
      }

      console.log(req.params.phone)

      const result = await User.deleteOne({ phone: req.params.phone })

      if (result.deletedCount !== 1) {
        throw new Error(
          'user not found for this phone number',
          req.params.phone
        )
      }

      res.send({ status: 200, message: 'user deleted', result })
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } })
    }
  },
]

const registerUser = [
  requireAuth,
  async (req, res) => {
    try {
      const { userType } = req.user

      if (userType !== 'rab') {
        throw new Error(
          req.user.fname + ' ' + 'you are not allowed to perform this action'
        )
      }
      const { fname, lname, gender, phone, location, email, password } =
        req.body

      if (
        !email ||
        !fname ||
        !lname ||
        !gender ||
        !phone ||
        !location ||
        !password
      ) {
        throw new Error('missing some required information')
      }

      const user = new User({
        ...req.body,
      })

      const isValidUser = await isExistUser(user.phone)

      if (isValidUser) {
        throw new Error('user alredy exist in system')
      }
      await user.save()

      res.status(200).json({
        statusCode: 201,
        message: 'account created successfull',
        status: 'successfull',
        user,
      })
    } catch (error) {
      res.status(400).json({
        error: { statusCode: 400, status: 'failed', message: error.message },
      })
    }
  },
]

const findAllUser = [
  requireAuth,
  async (req, res) => {
    try {
      if (req.user.userType !== 'rab') {
        throw new Error(
          req.user.fname + ' ' + 'you are not allowed to perform this action'
        )
      }

      const users = await User.find({})

      res.json({ users })
    } catch (error) {
      res.status(400).json({
        error: { statusCode: 400, status: 'failed', message: error.message },
      })
    }
  },
]
const underMentainance = [
  (req, res) => {
    try {
      res.json({ status: 200, message: 'system under developmenet' })
    } catch (error) {
      res.json({ error: { status: 400, message: error.message } })
    }
  },
]

const notFound = [
  (req, res) => {
    res.json({ error: { status: 404, message: 'Router not found' } })
  },
]

module.exports = {
  index,
  signin,
  signup,
  signout,
  generateReport,
  getReportedDisease,
  approveReport,
  deleteUser,
  registerUser,
  findAllUser,
  underMentainance,
  notFound,
}
