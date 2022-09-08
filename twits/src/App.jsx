import axios from 'axios';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

import Tweet from './components/Tweet';

import './App.css'

import search from './assets/searchWhite.svg'
import TagLabel from './components/TagLabel';

function App() {
  const [tweets, setTweets] = useState({})
  const [searchString, setSearchString] = useState('')
  const [hashtag, setHashTag] = useState(null)

  const handleChange = (e) => {
    setSearchString(e.target.value)
  }

  const submitSearch = (e) => {
    e.preventDefault()
    setHashTag(searchString)
    setSearchString('')
  }

  useEffect(() => {
    // const socket = io.connect('/')
    // socket.on('connect', () => {
    //   console.log('socket connected..')
    //   socket.on('tweets', data => {
    //     setTweets((prev) => [data].concat(prev.slice(0, 20)))
    //   })
    // })
    // socket.on('disconnect', () => {
    //   socket.off('tweets')
    //   socket.removeAllListeners('tweets')
    //   console.log('socket disconnected')
    // })
    hashtag !== null &&
    axios
    .get('http://localhost:3002/api/recent', {
      params: {hashtag}
    })
    .then((res) => setTweets(res.data._realData))
  }, [hashtag])

  return (
    <div className='flex'>
      <form
       className='hashtagGroup'
       onSubmit={submitSearch}
       >
        <input 
        className='hashtagInput'
        type='text'
        placeholder='#hashtag'
        value={searchString}
        onChange={handleChange}
        />
        <button disabled={searchString === ''}><img width={20} height={20} alt='search' src={search}/></button>
      </form>
      { hashtag !== null &&
      <TagLabel setHashTag={setHashTag} tag={hashtag}/>
      }

      <div className='fixedWidth'>
      {tweets.data && tweets.data.map((tweet) => (
      <Tweet
      public_metrics={tweet.public_metrics}
      referenced_tweets={tweet.referenced_tweets}
      id={tweet.id}
      author={tweets?.includes?.users?.find(user => user.id === tweet.author_id)}
      media={tweet?.attachments?.media_keys?.map(mkey => tweets.includes.media.find(media => mkey === media.media_key))}
      created_at={tweet.created_at}
      text={tweet.text}
      key={tweet.id}
      />)
      
      )}
      </div>
    </div>
  );
}

export default App;
