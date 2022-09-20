import React from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

import Tweet from './components/Tweet';

import './App.css'

import search from './assets/searchWhite.svg'
import TagLabel from './components/TagLabel';
import ButtonLoader from './components/ButtonLoader';

import Loader from './assets/circlesLoader.gif'

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('filters')
  const [tweets, setTweets] = useState({})
  const [searchString, setSearchString] = useState('')
  const [query, setQuery] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  console.log(initialQuery)

  useEffect(() => {
    query.length === 0 && setTweets({})
  }, [query])

  const handleChange = (e) => {
    setSearchString(e.target.value)
  }

  const submitSearch = (e) => {
    e.preventDefault()
    setQuery((prev => prev.concat(searchString)))
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
    if (query.length !== 0) {
      const filters = `${query.filter(item => !item.includes('@')).map(hashtag => !hashtag.includes('#') ? `#${hashtag}` : hashtag).join(' ')}${query.filter(item => item.includes('@')).length > 0 ? (' ' + query.filter(item => item.includes('@')).join(' ')) : ''}`
      setIsLoading(true)
      axios
        .get('http://localhost:3002/api/recent', {
          params: { filters }
        })
        .then((res) => {
          setIsLoading(false)
          setTweets(res.data._realData)
        })
        .catch((e) => {
          setIsLoading(false)
        })
      setSearchParams({ filters })
    } else if (query.length === 0 && initialQuery !== null) {
      setQuery(initialQuery.split(' '))
    }
  }, [query, setSearchParams, initialQuery])

  return (
    <div className='flex'>
      <form
        className='hashtagGroup'
        onSubmit={submitSearch}
      >
        <input
          className='hashtagInput'
          type='text'
          placeholder='Search filters'
          value={searchString}
          onChange={handleChange}
        />
        <button disabled={searchString === ''}>
          {isLoading ?
            <ButtonLoader /> :
            <img width={20} height={20} alt='search' src={search} />
          }
        </button>
      </form>

      <div className='fixedWidth'>
      <div className='tagLabels'>
        {query !== [] &&
          query.map(item => <TagLabel key={item} setSearchParams={setSearchParams} setQuery={setQuery} tag={item} />)
        }
        </div>
        {isLoading ?
        <div className='loader'><img src={Loader} alt='loading'/></div> :
        tweets.data && tweets.data.map((tweet) => (
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

        )
        }
      </div>
    </div>
  );
}

export default App;
