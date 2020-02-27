const superagent = require('superagent')
const User = require('../models/users')

const { CLIENT_ID, TOKEN_SERVER_URL, REDIRECT_URI, CLIENT_SECRET, API_SERVER, REMOTE_API_ENDPOINT, STATE } = process.env;

async function exchangeCodeForToken (code, state) {
  if (state === process.env.STATE) {
    try {
      const response = await superagent
        .post(TOKEN_SERVER_URL)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        })
      return response.body.access_token;
    } catch (e) { console.error(e) }
  }
}

async function getRemoteUsername (token) {
  try {
    const response = await superagent
      .get(REMOTE_API_ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
    return `${response.body.localizedFirstName} ${response.body.localizedLastName}`;
  } catch (e) { console.error(e) }
}

async function getUser (username) {
  // do we already have the user created?
  const potentialUser = await User.findOne({ username })
  console.log(potentialUser)
  let user;
  if (!potentialUser) {
    // create the user
    const newUser = new User({ username })
    user = await newUser.save()
  } else {
    user = potentialUser
  }
  const token = user.generateToken()
  return [user, token]
}

async function handleOauth (req, res, next) {
  try {
    const { code, state } = req.query
    console.log('(1) CODE:', code)
    const remoteToken = await exchangeCodeForToken(code, state)
    console.log('(2) ACCESS TOKEN:', remoteToken)
    const remoteUsername = await getRemoteUsername(remoteToken)
    console.log('(3) LINKEDIN USER:', remoteUsername)
    const [user, token] = await getUser(remoteUsername)
    req.user = user
    req.token = token
    console.log('(4a) LOCAL USER:', user)
    console.log('(4b) USER\'S TOKEN:', token)
    next()
  } catch (err) {
    next(`ERROR: ${err.message}`)
  }
}

module.exports = handleOauth
