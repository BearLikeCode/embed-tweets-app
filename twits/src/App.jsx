import React, { useRef } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { useEffect, useState } from 'react';
import * as Scroll from 'react-scroll';
import { Link, Button, Element, Events, animateScroll as scroll, scrollSpy, scroller } from 'react-scroll'
import Tweet from './components/Tweet';

import './App.css'

import search from './assets/searchWhite.svg'
import TagLabel from './components/TagLabel';
import ButtonLoader from './components/ButtonLoader';
import Auth from './components/Auth'

import Loader from './assets/circlesLoader.gif'
import UserInfo from './components/UserInfo';
import { arrayDeepEqual } from './helpers';

function App() {

  const optionsAmount = [
    { value: 10, text: '10' },
    { value: 20, text: '20' },
    { value: 30, text: '30' },
    { value: 50, text: '50' },
    { value: 100, text: '100' },

  ];
  const optionsInterval = [
    { value: 1, text: '1' },
    { value: 3, text: '3' },
    { value: 10, text: '10' },
  ];

  const tweetRefs = useRef([])
  console.log('ref',tweetRefs.current)
  const [searchParams, setSearchParams] = useSearchParams();
  const [cookies, setCookie, removeCookie] = useCookies();
  const [formValues, setFormValues] = useState({
    amount: optionsAmount[4].value,
    interval: optionsInterval[0].value
  })
  const initialQuery = searchParams.get('filters')
  const oauth_token = searchParams.get('oauth_token')
  const oauth_verifier = searchParams.get('oauth_verifier')
  const [tweets, setTweets] = useState({})
  const [searchString, setSearchString] = useState('')
  const [query, setQuery] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLogged, setIsLogged] = useState(!!cookies.tokens)

  const handleAmountChange = ({ target: {value} }) => {
    setFormValues({ ...formValues, amount: value })
  }
  const handleIntervalChange = ({ target: {value} }) => {
    setFormValues({ ...formValues, interval: value })
  }

  useEffect(() => {
    if (formValues.amount) {
      setSearchParams({...searchParams, amount: formValues.amount})
    }
  }, [formValues?.amount])

  useEffect(() => {
    query.length === 0 && setTweets({})
  }, [query])

  useEffect(() => {
    if (tweets.data) {
      let ind = 0
      const intv = setInterval(() => {
        ind++
        console.log(ind)
        scroller.scrollTo(ind.toString(), {
        duration: 3500,
        delay: 0 ,
        smooth: true,
      })
      }, 5500)
    return () => clearInterval(intv)
    }
  }, [tweets ])

  useEffect(() => {
    if (cookies.tokens) {
      axios
        .post('/api/me', {
          accessToken: cookies.tokens.accessToken,
          accessSecret: cookies.tokens.accessSecret
        })
        .then((res) => {
          setIsLogged(true)
        })
        .catch(() => setIsLogged(false))
    }
  }, [])

  console.log('cookies', cookies)
  useEffect(() => {
    if (initialQuery === ' ' || initialQuery === '#') setSearchParams({})
  }, [initialQuery])

  useEffect(() => {
    if (oauth_token !== null) {
      axios
        .get('/api/callback', {
          params: {
            oauth_token: oauth_token,
            oauth_verifier: oauth_verifier
          }
        })
        .then((res) => {
          setCookie('user', { name: res.data.user.name, photo: res.data.user.profile_image_url_https })
          setCookie('tokens', { accessToken: res.data.accessToken, accessSecret: res.data.accessSecret })
          setIsLogged(true)
        })
        .catch(() => setIsLogged(false))
    }
  }, [oauth_token])

  const handleChange = (e) => {
    setSearchString(e.target.value)
  }

  const submitSearch = (e) => {
    e.preventDefault()
    setQuery((prev => prev.concat(searchString).filter(item => item !== ' ' && item !== '#')))
    setSearchString('')
  }

  useEffect(() => {
    if (isLogged) {
      searchParams.delete('oauth_token')
      searchParams.delete('oauth_verifier')
      setSearchParams(searchParams)
      setIsLoading(true)

      const intID = setInterval(() => {
        console.log('fetch in interval')
        axios
        .get('/api/recent', {
        })
        .then((res) => {
          setIsLoading(false)
          console.log(res.data)
          if (tweets.data === undefined || arrayDeepEqual(res.data.data, tweets.data)) {
            console.log('setTweets!')
            setTweets(res.data)
            }
        })
        .catch((e) => {
          setIsLoading(false)
        })
      }, formValues.interval*60000)
          return () => clearInterval(intID)
    }
  }, [isLogged])
  console.log(tweets)
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
      const filters = `${query.filter(item => !item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => !item.includes('@')).length > 0 ? query.filter(item => !item.includes('@')).map(hashtag => !hashtag.includes('#') ? `#${hashtag}` : hashtag).join(' OR ') : ''}${query.filter(item => !item.includes('@')).length > 1 ? ')' : ''}${query.filter(item => item.includes('@')).length > 0 && query.filter(item => !item.includes('@')) ? ' ' : ''}${query.filter(item => item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => item.includes('@')).length > 0 ? (query.filter(item => item.includes('@')).join(' OR ').replaceAll('@', 'from:')) : ''}${query.filter(item => item.includes('@')).length > 1 ? ')' : ''}`
      const amount = formValues.amount
      setIsLoading(true)
      axios
        .get('/api/recent-api', {
          params: { filters, amount }
        })
        .then((res) => {
          setIsLoading(false)
          setTweets(res.data)
        })
        .catch((e) => {
          setIsLoading(false)
        })
      setSearchParams({ filters })
    } else if (query.length === 0 && initialQuery !== null) {
      setQuery(initialQuery.split(' ').filter(query => query !== ' ' && query !== '#'))
    }
  }, [query, setSearchParams, initialQuery])
  return (
    <>
      <div className='flex'>
        {cookies.user &&
          <UserInfo setIsLogged={setIsLogged} removeCookie={removeCookie} photo={cookies?.user?.photo} name={cookies?.user?.name} />
        }
        {!isLogged ?
        <Auth /> :
        <>
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

          <div className='selectControls'>
            <label htmlFor="interval">Refresh interval, min</label>
            <select value={formValues.interval} onChange={handleIntervalChange}>
              {optionsInterval.map(option => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </select>

            <label htmlFor="count">Tweets amount</label>
            <select value={formValues.amount} onChange={handleAmountChange}>
              {optionsAmount.map(option => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
          </div>

          <div className='fixedWidth'>
            <div className='tagLabels'>
              {query !== [] &&
                query.map(item => <TagLabel key={item} setSearchParams={setSearchParams} setQuery={setQuery} tag={item} />)
              }
            </div>
            {isLoading ?
              <div className='loader'><img src={Loader} alt='loading' /></div> :
              tweets?.data && tweets?.data.map((tweet, ind) => {
                return (
                <Element name={ind}>
                <Tweet
                  public_metrics={tweet.public_metrics}
                  referenced_tweets={tweet.referenced_tweets}
                  id={tweet.id}
                  author={tweets?.includes?.users?.find(user => user.id === tweet.author_id)}
                  media={tweet?.attachments?.media_keys?.map(mkey => tweets.includes.media.find(media => mkey === media.media_key))}
                  created_at={tweet.created_at}
                  text={tweet.text}
                  key={tweet.id}
                />
                </Element>
                )}

              )
            }
          </div>
        </>
       }
      </div>
    </>
  );
}

export default App;
