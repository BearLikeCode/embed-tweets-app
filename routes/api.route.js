const { query } = require('express')
const Tweet = require('../server/models/Tweet')


const TwitterApi = require('twitter-api-v2').default
const router = require('express').Router()

const client = new TwitterApi('AAAAAAAAAAAAAAAAAAAAAIOffAEAAAAAwgZmrDXsZocUQUGZqD%2F7%2BLfQGdI%3DxG8c9zec4y9Oi0Zid5qxLG417HRVRZj3vgtNhwwmbActLFQX11')

router.get('/recent-api', async (req, res, next) => {
  try {
    const recent = await client.v2.search(req.query.filters, {
        max_results: 100,
        expansions:
        'author_id,attachments.media_keys,referenced_tweets.id,referenced_tweets.id.author_id',
    'tweet.fields':
      'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,referenced_tweets,text',
    'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
    'media.fields':
      'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
    })
    // console.log(recent.data)
    // res.send(recent.data)
    Tweet.remove({}).exec() 
    const tweetData = new Tweet({ data: recent?.data?.data, includes: recent?.data?.includes, meta: recent?.data?.meta })
    tweetData
    .save()
    .then(result => res.send(result))
  } catch (err) {
    next(err)
  }
})

router.get('/recent', async (req, res, next) => {
  try {
    Tweet.find() 
    .then(result => res.send(result))
  } catch (err) {
    next(err)
  }
})

module.exports = router