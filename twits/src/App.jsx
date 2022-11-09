import React, { useRef, useMemo } from 'react';
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

function App() {

  const optionsAmount = [
    { value: 20, text: '20' },
    { value: 30, text: '30' },
    { value: 50, text: '50' },
    { value: 70, text: '70' },
    { value: 100, text: '100' },
  ];
  const optionsInterval = [
    { value: 1, text: '1' },
    { value: 3, text: '3' },
    { value: 10, text: '10' },
  ];

  const tweetRefs = useRef([])
  const [searchParams, setSearchParams] = useSearchParams();
  const [cookies, setCookie, removeCookie] = useCookies();
  const [formValues, setFormValues] = useState({
    amount: optionsAmount[4].value,
    interval: optionsInterval[0].value
  })
  const initialQuery = searchParams.get('filters')
  const oauth_token = searchParams.get('oauth_token')
  const oauth_verifier = searchParams.get('oauth_verifier')
  const user = searchParams.get('user')
  const [tweets, setTweets] = useState({})
  const [searchString, setSearchString] = useState('')
  const [query, setQuery] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLogged, setIsLogged] = useState(!!cookies.tokens)
  const [firstRender, setFirstRender] = useState(true)

  const handleAmountChange = ({ target: { value } }) => {
    setFormValues({ ...formValues, amount: value })
  }
  const handleIntervalChange = ({ target: { value } }) => {
    setFormValues({ ...formValues, interval: value })
  }

  // useEffect(() => {
  //   if (formValues.amount && isLogged) {
  //     setSearchParams({...searchParams, amount: formValues.amount})
  //   }
  // }, [formValues?.amount, isLogged])

  useEffect(() => {
    query.length === 0 && setTweets({})
  }, [query])

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
          setCookie('user', { name: res.data.user.name, photo: res.data.user.profile_image_url_https, id_str: res.data.user.id_str })
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
    setIsLoading(true)
    const filters = `${query.filter(item => !item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => !item.includes('@')).length > 0 ? query.filter(item => !item.includes('@')).map(hashtag => !hashtag.includes('#') ? `#${hashtag}` : hashtag).join(' OR ') : ''}${query.filter(item => !item.includes('@')).length > 1 ? ')' : ''}${query.filter(item => item.includes('@')).length > 0 && query.filter(item => !item.includes('@')) ? ' ' : ''}${query.filter(item => item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => item.includes('@')).length > 0 ? (query.filter(item => item.includes('@')).join(' OR ').replaceAll('@', 'from:')) : ''}${query.filter(item => item.includes('@')).length > 1 ? ')' : ''}`
          const amount = formValues.amount
          axios
            .get('/api/recent-api', {
              params: { filters, amount }
            })
            .then((res) => {
              setIsLoading(false) 
              setSearchParams({ ...searchParams, filters, user: cookies?.user?.id_str, amount })
              console.log(res?.data?.data, tweets?.data)
              if (tweets?.data === undefined || res.data === null || !(res.data.data.length === tweets?.data?.length && res.data.data.map(tweet => tweet.text).every((value, index) => tweets?.data?.includes(value)))) {
                setTweets(res.data)
              }
            })
            .catch((e) => {
              setIsLoading(false)
            })
  }, [query.length])

  useEffect(() => {
    if (isLogged) {
      searchParams.delete('oauth_token')
      searchParams.delete('oauth_verifier')
      setSearchParams(searchParams)
      setIsLoading(true)
      axios
        .get('/api/recent', {
        })
        .then((res) => {
          setIsLoading(false)
          setTweets(res.data)
        })
        .catch((e) => {
          setIsLoading(false)
        })
    }
  }, [isLogged])

  useEffect(() => {
    if (!isLogged && user !== null) {
      const intID = setInterval(function recentCallback() {
        axios
          .get(`/api/recent?user=${user}`, {
          })
          .then((res) => {
            setIsLoading(false)
            if (tweets.data === undefined || !(res.data.data.length === tweets?.data?.length && res.data.data.map(tweet => tweet.id).every((value, index) => value === tweets?.data?.map(tweet => tweet.id)[index]))) {
              setTweets(res.data)
            }
          })
          .catch((e) => {
            setIsLoading(false)
          })
      }(), formValues.interval * 60000)
      return () => clearInterval(intID)
    }
  }, [isLogged, user])

  useEffect(() => {
    if (isLogged && tweets?.data?.length > 0 && query.length === 0) {
      const intervalId = window.setInterval(() => { }, 0);

      for (let i = 1; i <= intervalId; i++) {
        window.clearInterval(i);
      }
      const intID = setInterval(() => {
        axios
          .get('/api/recent', {
          })
          .then((res) => {
            setIsLoading(false)
            console.log(res?.data?.data, tweets?.data)
            if (tweets.data === undefined || !(res.data.data.length === tweets?.data?.length && res.data.data.map(tweet => tweet.id).every((value, index) => value === tweets?.data?.map(tweet => tweet.id)[index]))) {
              setTweets(res.data)
            }
          })
          .catch((e) => {
            setIsLoading(false)
          })
      }, formValues.interval * 60000)
      return () => clearInterval(intID)
    }

  }, [isLogged, tweets])

  useEffect(() => {
    if (tweets?.data?.length > 0) {
      let ind = 0
      const intv = setInterval(() => {
        ind++
        scroller.scrollTo(ind.toString(), {
          duration: 3500,
          offset: -150,
          delay: 0,
          smooth: true,
        })
      }, 5500)
      // window.addEventListener('scroll', clearInterval(intv))
      if (ind === tweets.length - 1) {
        clearInterval(intv)
      }
      return () => {
        clearInterval(intv)
        // window.removeEventListener('scroll', clearInterval(intv))
      }
    }
  }, [tweets])

  useEffect(() => {
    if (firstRender) {
      setFirstRender(false)
    } else {
      if (query.length !== 0) {
        const intervalId = window.setInterval(() => { }, 0);

        for (let i = 1; i <= intervalId; i++) {
          window.clearInterval(i);
        }

        const apiInt = setInterval(() => {
          const filters = `${query.filter(item => !item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => !item.includes('@')).length > 0 ? query.filter(item => !item.includes('@')).map(hashtag => !hashtag.includes('#') ? `#${hashtag}` : hashtag).join(' OR ') : ''}${query.filter(item => !item.includes('@')).length > 1 ? ')' : ''}${query.filter(item => item.includes('@')).length > 0 && query.filter(item => !item.includes('@')) ? ' ' : ''}${query.filter(item => item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => item.includes('@')).length > 0 ? (query.filter(item => item.includes('@')).join(' OR ').replaceAll('@', 'from:')) : ''}${query.filter(item => item.includes('@')).length > 1 ? ')' : ''}`
          const amount = formValues.amount
          axios
            .get('/api/recent-api', {
              params: { filters, amount }
            })
            .then((res) => {
              setIsLoading(false) 
              setSearchParams({ ...searchParams, filters, user: cookies?.user?.id_str, amount })
              if (tweets?.data === undefined || res.data === null || !(res.data.data.length === tweets?.data?.length && res.data.data.map(tweet => tweet.text).every((value, index) => tweets?.data?.includes(value)))) {
                setTweets(res.data)
              }
            })
            .catch((e) => {
              setIsLoading(false)
            })
          // return apiIntCallback;
        }, formValues.interval * 60000)
        return () => clearInterval(apiInt)
      } 
      // else if (query.length === 0 && initialQuery !== null && isLogged) {
      //   setQuery(initialQuery.split(' ').filter(query => query !== ' ' && query !== '#' && query !== 'OR').map(item => item.replace('(', '').replace(')', '')))
      // }
    }
  }, [query, formValues?.amount, formValues?.interval])

  const clearIntervals = () => {
    const intervalId = window.setInterval(() => { }, 0);

    for (let i = 1; i <= intervalId; i++) {
      window.clearInterval(i);
    }
  }
  const authClickHandler = async () => {
    await axios
      .get(`/api/token-request`)
      .then((res) => window.location.href = res.data.url)
  }
  return (
    <>
      <div className='flex'>

        {!isLogged && user === null ?
          <Auth /> :
          <>
            <div className='headerBlock'>
              {cookies.user && isLogged ?
                <UserInfo setIsLogged={setIsLogged} setSearchParams={setSearchParams} removeCookie={removeCookie} photo={cookies?.user?.photo} name={cookies?.user?.name} /> :
                user !== null ?
                  <span onClick={authClickHandler}>authorize</span> :
                  null
              }

              <div className='controlsContainer'>

                <form
                  className='hashtagGroup'
                  onSubmit={submitSearch}
                >
                  <input
                    className='hashtagInput'
                    type='text'
                    disabled={!isLogged}
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

                {isLogged &&
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
                }
                <div className='tagLabels'>
                {query !== [] &&
                  query.map(item => <TagLabel key={item} setSearchParams={setSearchParams} setQuery={setQuery} query={query} tag={item} />)
                }
              </div>
              </div>
            </div>

            <div className='fixedWidth'>
              
              {tweets?.data === null && !isLoading &&
                <h2>Any tweets founded... Try to change the filters</h2>
              }
              
              {isLoading ?
                <div className='loader'><img src={Loader} alt='loading' /></div> :
                tweets?.data && tweets?.data.map((tweet, ind) => {
                  if (tweet === null) return null
                  return (
                    <Element name={ind}>
                      <Tweet
                        public_metrics={tweet?.public_metrics}
                        // referenced_tweets={tweet.referenced_tweets}
                        id={tweet?.id}
                        author={tweets?.includes?.users?.find(user => user.id === tweet.author_id)}
                        media={tweet?.attachments?.media_keys?.map(mkey => tweets.includes.media.find(media => mkey === media.media_key))}
                        created_at={tweet?.created_at}
                        text={tweet?.text}
                        key={tweet?.id}
                      />
                    </Element>
                  )
                }
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
