const { query } = require('express')
const session = require('express-session')

const Tweet = require('../server/models/Tweet')
const fetch = require('node-fetch')
const bodyParser = require('body-parser')


const TwitterApi = require('twitter-api-v2').default
const router = require('express').Router()
router.use(bodyParser())
router.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true,cookie: { maxAge: (60000 * 60 * 24) }}));

const API_KEY = "dvOwXwgmts10o7U4tm4Npp3jc"
const API_SECRET = "UPLjyxj3kzUUduIboQCgQXLuYmHq74DTYMarnXcxm6RnRql7va"
let loggedApp
let sess
// const client = new TwitterApi('AAAAAAAAAAAAAAAAAAAAAIOffAEAAAAAwgZmrDXsZocUQUGZqD%2F7%2BLfQGdI%3DxG8c9zec4y9Oi0Zid5qxLG417HRVRZj3vgtNhwwmbActLFQX11')
const client = new TwitterApi({ appKey: API_KEY, appSecret: API_SECRET });

router.get('/recent-api', async (req, res, next) => {
  const startTime = new Date() - ((60000 * 60) *48)
  let initial = {
    data: [],
    includes: {
      media: [],
      users: []
    },
    meta: {}
  }
  try {
    const user = await loggedApp.currentUser()
    let recent
    let tweetsList
    if (req.query.filters[0] !== '(') {
      recent = await loggedApp.v2.search(req.query.filters, {
        max_results: req.query.amount,
        start_time: new Date(startTime).toISOString(),
        sort_order: 'relevancy',
        expansions:
        'author_id,attachments.media_keys',
    'tweet.fields':
      'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,text',
    'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
    'media.fields':
      'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
    })
    tweetsList = { data: recent?.data?.data, includes: recent?.data?.includes, meta: recent?.data?.meta }
    const newData = await Tweet.findOneAndUpdate({name: user.screen_name, id_str: user.id_str}, 
      {tweetsList}, 
      {upsert: true, new: true, setDefaultsOnInsert: true}
      )
    res.send(newData?.tweetsList)
    } else {
    const tags = req.query.filters.split(' ').filter(tag => tag.includes('#')).map(tag => tag.replace('(', '').replace(')', ''))
    const authors = req.query.filters.split(' ').filter(tag => tag.includes('from:')).map(tag => tag.replace('(', '').replace(')', ''))
    const from = authors.length > 1 ? `(${authors.join(' OR ')})` : authors
    async function* recentItems() {
      for (let i = 0; i < tags.length; i++) {
        const recentItem = await loggedApp.v2.search(`${tags[i]} ${from}`, {
          max_results: (req.query.amount / tags.length),
          start_time: new Date(startTime).toISOString(),
          sort_order: 'relevancy',
          expansions:
          'author_id,attachments.media_keys',
      'tweet.fields':
        'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,text',
      'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
      'media.fields':
        'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
      })
        yield recentItem;
      }
    
    }

    (async () => {

      let generator = recentItems();
      for await (let value of generator) {
        initial.data = initial.data.concat(value?.data?.data)
        initial.includes.media = initial.includes.media.concat(value?.data?.includes?.media)
        initial.includes.users = initial.includes.users.concat(value?.data?.includes?.users)
        initial.meta = value?.data?.meta
        tweetsList = initial
        console.log(tweetsList)
      }
    })()
    const newData = await Tweet.findOneAndUpdate({name: user.screen_name, id_str: user.id_str}, 
      {tweetsList}, 
      {upsert: true, new: true, setDefaultsOnInsert: true}
      )
    res.send(newData?.tweetsList)
    } 
    // tags.forEach(async tag => {
    //    const recentItem = await loggedApp.v2.search(`${tag} ${from}`, {
    //     max_results: (req.query.amount / tags.length),
    //     start_time: new Date(startTime).toISOString(),
    //     sort_order: 'relevancy',
    //     expansions:
    //     'author_id,attachments.media_keys',
    // 'tweet.fields':
    //   'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,text',
    // 'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
    // 'media.fields':
    //   'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
    // })
    // .then((payload) => {
    //   initial.data.push(...payload?.data?.data)
    //   initial.includes.media.push(...payload?.data?.includes?.media)
    //   initial.includes.users.push(...payload?.data?.includes?.users)
    //   initial.meta = payload?.data?.meta
    //   console.log(initial)
    // })
    // })
  // }
    // res.send(recent.data)
    
  } catch (err) {
    console.log(err)
    next(err)
  }
})

router.get('/token-request', async (req, res, next) => {
  try{
    const authLink = await client.generateAuthLink('https://embed-tweets.herokuapp.com/', { linkMode: 'authorize' });
    sess = req.session
    sess.oauth_token_secret = authLink.oauth_token_secret
    res.send(authLink)

  } catch (err) {
    console.log(err)
    next(err)
  }
})

router.get('/callback', (req, res, next) => {
  // Extract tokens from query string
  const { oauth_token, oauth_verifier } = req.query;
  // Get the saved oauth_token_secret from session
  const { oauth_token_secret } = req.session;

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    return res.status(400).send('You denied the app or your session expired!');
  }

  // Obtain the persistent tokens
  // Create a client from temporary tokens
  const client = new TwitterApi({
    appKey: API_KEY,
    appSecret: API_SECRET,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  });

  client.login(oauth_verifier)
    .then(({ client: loggedClient, accessToken, accessSecret }) => {
      loggedApp = loggedClient
      loggedClient.currentUser()
      .then((response) => {
        Tweet.findOneAndUpdate({name: response.screen_name, id_str: response.id_str}, 
          {expire: new Date()}, 
          {upsert: true, new: true, setDefaultsOnInsert: true},
          (err, res) => {if (err) return})
        res.send({user: response, accessToken, accessSecret})
      })
      // loggedClient is an authenticated client in behalf of some user
      // Store accessToken & accessSecret somewhere
    })
    .catch(() => {
      res.status(403).send('Invalid verifier or access tokens!')
    });
});

router.get('/recent', async (req, res, next) => {
  try {
    const user = await loggedApp.currentUser()

    Tweet.findOne({id_str: user.id_str}) 
    .then(result => res.send(result.tweetsList || {}))
  } catch (err) {
    next(err)
  }
})

router.get('/logout', async (req, res, next) => {
  try {
    loggedApp = undefined
    res.send('cleared')
  } catch (err) {
    next(err)
  }
})

router.post('/me', async (req, res, next) => {
  try {
    const client = new TwitterApi({
      appKey: API_KEY,
      appSecret: API_SECRET,
      accessToken: req.body.accessToken,
      accessSecret: req.body.accessSecret
    });
    loggedApp = client
    res.send('logged')
  } catch (err) {
    next(err)
  }
})
module.exports = router