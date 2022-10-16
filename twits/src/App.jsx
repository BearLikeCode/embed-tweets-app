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
  }, [tweets, ])

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
          (tweets.data === undefined || !arrayDeepEqual(res.data.data, tweets.data)) && setTweets(res.data)
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

// const strData = `{"data":[{"edit_history_tweet_ids":["1578318390590328832"],
// "public_metrics":{"retweet_count":0,"reply_count":0,
// "like_count":1,"quote_count":0},
// "author_id":"1189011873632358406",
// "id":"1578318390590328832",
// "attachments":{"media_keys":["3_1578318373343350784","3_1578318373372723200","3_1578318373355937792"]},
// "created_at":"2022-10-07T09:36:42.000Z","text":"アインプロージットの歌でミュンヘン訛りを教えてもろたよ。\nOans,Zwoa,drei,
//  g’suffa !\n雨で寒かったけど、ヴァイスブルストは美味しいし、ホフブロイのドゥンケルもヴァイスも美味し。\nオクトーバーフェストは好きなんよね。\n#Alpina #吉祥寺BeerAndWalk\n#coppice吉祥寺 https://t.co/yTK3UnyP0P"},
//  {"edit_history_tweet_ids":["1578189721725018112"],
//  "public_metrics":{"retweet_count":0,"reply_count":0,
//  "like_count":0,"quote_count":0},"author_id":"1611069848",
//  "id":"1578189721725018112","created_at":"2022-10-07T01:05:25.000Z",
//  "text":"9/17\nYOASOBI sapporo night meeting\n\n#北海道 \n#札幌市 \n#旭山記念公園 \n#yoasobisapporo \n#ナイトミーティング \n#bmw \n#alpina \n#mpower \n#夜撮影 \n#一眼撮影 \n#ペンタックスk70 https://t.co/483nzeiu7A"},
//  {"edit_history_tweet_ids":["1578120240743190528"],"public_metrics":
//  {"retweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},
//  "author_id":"1191750886688731136","id":"1578120240743190528",
//  "attachments":{"media_keys":["3_1578120231767379968","3_1578120235198316547
//  ","3_1578120238679588865"]},"created_at":"2022-10-06T20:29:20.000Z","text":"
//  So good I had to share! Check out all the items I'm loving on @Poshmarkapp f
//  rom @DrcDalila #poshmark #fashion #style #shopmycloset #justice #ripndip #al
//  pina: https://t.co/CTTZdzYhtj https://t.co/l5pZB1Am04"},{"edit_history_tweet
//  _ids":["1578058879023316998"],"public_metrics":{"retweet_count":0,"reply_cou
//  nt":0,"like_count":0,"quote_count":0},"author_id":"1631923248","id":"1578058
//  879023316998","attachments":{"media_keys":["3_1578058870487908352"]},"created_at":"20
//  22-10-06T16:25:30.000Z","text":"#Alpina #Auspiciante #CarreraAtlética #Movidelnor #Ib
//  arra \nAlpina Ecuador, fue el auspiciante oficial de la carrera atlética Movidelnor N
//  octurno Ibarra 11K y 5K en el marco de la celebración de los 416 años de fundación de Ibarra. ➡➡ https
//  ://t.co/D5vOBGlrSx https://t.co/o00TtA6ZwU"},{"edit_history_tweet_ids":["1578047805318463488"],"public_
//  metrics":{"retweet_count":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"270663649","id
//  ":"1578047805318463488","created_at":"2022-10-06T15:41:30.000Z","text":"RT @Veolia_Co: las plantas de p
//  roducción por medio de estrategias de eficiencia energética, además de planes de reuso del recurso hídr
//  ico y…","referenced_tweets":[{"type":"retweeted","id":"1578047490259124227"}]},{"edit_history_tweet_ids
//  ":["1578047490259124227"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":1,"quote_count"
//  :0},"author_id":"3313294635","id":"1578047490259124227","attachments":{"media_keys":["3_157804727325422387
//  2"]},"created_at":"2022-10-06T15:40:15.000Z","text":"las plantas de producción por medio de estrategias de
//   eficiencia energética, además de planes de reuso del recurso hídrico y experiencias de éxito con aliados 
//   como #Nestlé y #Alpina. (2/2)\n\n@asoleche https://t.co/nL9Ovb61RS","referenced_tweets":[{"type":"replied
//   _to","id":"1578047483309088768"}],"in_reply_to_user_id":"3313294635"},{"edit_history_tweet_ids":["1578041
//   185884524544"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},"autho
//   r_id":"11725182","id":"1578041185884524544","attachments":{"media_keys":["3_1578041184236216321"]},"creat
//   ed_at":"2022-10-06T15:15:11.000Z","text":"Volg je onze nieuwe Twitter pagina al? Je vindt ons vanaf nu al
//   s @Alpinafinanzkr of ga naar  https://t.co/aYWm7Q4JPs\n\n#alpina #diksverzekeringen #naamswijziging #re
//   branding https://t.co/2VByYlsB1i"},{"edit_history_tweet_ids":["1577977233435938817"],"public_metrics":{"r
//   etweet_count":5,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"510688218","id":"15779772334
//   35938817","created_at":"2022-10-06T11:01:04.000Z","text":"RT @time_watches: #Alpina presented a redesigne
//   d #Alpiner Extreme Automatic in three dial colours - forest green, midnight blue and black -…","reference
//   d_tweets":[{"type":"retweeted","id":"1576596845320556544"}]},{"edit_history_tweet_ids":["1577953995456389
//   121"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"85
//   1686782","id":"1577953995456389121","attachments":{"media_keys":["3_1577953978071060480"]},"created_at":"
//   2022-10-06T09:28:44.000Z","text":"BMW M5 CS / BMW Alpina D5 S (2021)\n\n#BMW #BMWM5CS #BMWM5 #CS #BMW #M5
//   CS #BMW #M5 #CS #BMWAlpinaD5S #BMW #AlpinaD5S #BMWAlpina #D5S #BMW #Alpina #D5S https://t.co/ovf8R07Bq3"}
//   ,{"edit_history_tweet_ids":["1577754710957854721"],"public_metrics":{"retweet_count":0,"reply_count":0,"l
//   ike_count":7,"quote_count":0},"author_id":"1251635372481818629","id":"1577754710957854721","attachments":
//   {"media_keys":["3_1577754704460873730","3_1577754708034392067"]},"created_at":"2022-10-05T20:16:51.000Z",
//   "text":"Soldakini görünce aklıma sağdakinin gelmesi. Ahhh #alpina ah!\n#alpina #AlpNavruz #AlinaBoz  ht
//   tps://t.co/ipRHkxhMrE"},{"edit_history_tweet_ids":["1577737317623599104"],"public_metrics":{"retweet_coun
//   t":13,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"3482366662","id":"1577737317623599104"
//   ,"attachments":{"media_keys":["7_1225911175973625856"]},"created_at":"2022-10-05T19:07:44.000Z","text":"R
//   T @Ana_mmihajlovic: Hanım rahatız\n\n#AlinaBoz | #AlpNavruz | #Alpina https://t.co/JivCaRoYhE","referen
//   ced_tweets":[{"type":"retweeted","id":"1225911252372860933"}]},{"edit_history_tweet_ids":["15777005292114
//   08385"],"public_metrics":{"retweet_count":4,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"
//   860488614479876096","id":"1577700529211408385","attachments":{"media_keys":["3_1577394879033970692"]},"cr
//   eated_at":"2022-10-05T16:41:33.000Z","text":"RT @mattia1143: #BMW 850 E31 B12 #Alpina! \n
//    https://t.co/oIt2cs5Fh5","referenced_tweets":[{"type":"retweeted","id":"1577394884041854976"}]},
//   {"edit_history_tweet_ids":["1577662968149557249"],"public_metrics":{"retweet_count":1,"reply_count":0,"li
//   ke_count":0,"quote_count":0},"author_id":"1289982222137724931","id":"1577662968149557249","created_at":"2
//   022-10-05T14:12:17.000Z","text":"RT @navruz_boz: CAMBIO RADICAL \n\n¿QUÉ ESTILISMO OS GUSTA MÁS? 
//   \n\n#AlpNavruz #AlinaBoz #BirPeriMasalı #TaroEmirTekin #MelikeKüçük #KadirÇ…","referenced_tweets":[{"type
//   ":"retweeted","id":"1577662737123098624"}]},{"edit_history_tweet_ids":["1577662737123098624"],"public_met
//   rics":{"retweet_count":1,"reply_count":0,"like_count":2,"quote_count":0},"author_id":"1293535418105974786
//   ","id":"1577662737123098624","attachments":{"media_keys":["7_1577662570210725892"]},"created_at":"2022-10
//   -05T14:11:22.000Z","text":" CAMBIO RADICAL \n\n¿QUÉ ESTILISMO OS GUSTA MÁS? \n\n#AlpNavruz #AlinaB
//   oz #BirPeriMasalı #TaroEmirTekin #MelikeKüçük #KadirÇermik #BaranBölükbaşi #MustafaMertKoç  #TülinEce #Ha
//   zalFilizKüçükköse #NazanKesal #MüfitKayacan #AliAksöz #alpina #AzCen  #maraşlı #maraşli #MahCel https://t
//   .co/tgpO48AUJI"},{"edit_history_tweet_ids":["1577654972879147008"],"public_metrics":{"retweet_count":0,"r
//   eply_count":0,"like_count":0,"quote_count":0},"author_id":"851686782","id":"1577654972879147008","attachm
//   ents":{"media_keys":["3_1577654928117579776"]},"created_at":"2022-10-05T13:40:31.000Z","text":"BMW Alpina
//    D5 S (2021)\n\n#BMWAlpina #BMWAlpinaD5S #BMW #AlpinaD5S #BMWAlpina #D5S #BMW #Alpina #D5S https://t.co/T
//    V5hocwGuO"},{"edit_history_tweet_ids":["1577654620524003328"],"public_metrics":{"retweet_count":0,"reply
//    _count":0,"like_count":0,"quote_count":0},"author_id":"851686782","id":"1577654620524003328","attachment
//    s":{"media_keys":["3_1577654494699061253"]},"created_at":"2022-10-05T13:39:07.000Z","text":"BMW Alpina D
//    5 S (2021)\n\n#BMWAlpina #BMWAlpinaD5S #BMW #AlpinaD5S #BMWAlpina #D5S #BMW #Alpina #D5S https://t.co/ym
//    n746KymC"},{"edit_history_tweet_ids":["1577650110627860482"],"public_metrics":{"retweet_count":0,"reply_
//    count":0,"like_count":0,"quote_count":0},"author_id":"707415662969233408","id":"1577650110627860482","cr
//    eated_at":"2022-10-05T13:21:12.000Z","text":"ALPINA B3 3.0/1 Edition30 Limousine\n積込み〜\n#bmw \n#alpin
//    a \n#3.0/1 Edition30 場所: ASSIST https://t.co/ydCGue3R1a"},{"edit_history_tweet_ids":["15776467166853734
//    41"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count":5,"quote_count":0},"author_id":"12
//    93535418105974786","id":"1577646716685373441","attachments":{"media_keys":["3_1577646712600117249"]},"cr
//    eated_at":"2022-10-05T13:07:43.000Z","text":" SINOPSIS DEL CAPÍTULO DOS DE BIR PERI MASALI \n\n#Alp
//    Navruz #AlinaBoz #BirPeriMasalı #TaroEmirTekin #MelikeKüçük #KadirÇermik #BaranBölükbaşi #MustafaMertKoç
//      #TülinEce #HazalFilizKüçükköse #NazanKesal #MüfitKayacan #AliAksöz #alpina #AzCen  #maraşlı #maraşli #
//      MahCel https://t.co/qxnKZa33ur"},{"edit_history_tweet_ids":["1577643341235322885"],"public_metrics":{"
//      retweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"1575580154658693139","id
//      ":"1577643341235322885","attachments":{"media_keys":["3_1577643211862020099"]},"created_at":"2022-10-0
//      5T12:54:18.000Z","text":"#Alpina #B4 or #D4 based on #bmw #4series #bmw4serie#f32 #carpapped @BMW 
//      @ALPINA_GmbH @ALPINAGB https://t.co/94EJqkC6iI"},{"edit_history_tweet_ids":["1577602244761063426"],"pu
//      blic_metrics":{"retweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"16199147
//      89","id":"1577602244761063426","attachments":{"media_keys":["3_1576612900755492865"]},"created_at":"20
//      22-10-05T10:11:00.000Z","text":"Out Now:\nAlpina by Flexible Fire\n\nhttps://t.co/7HUKLHi7Lq\n\n#Music
//      eternal #FlexibleFire #Alpina #Monstercat #MonstercatSilk #MelodicHouse #Techno #Argentina https://t.c
//      o/lqQvmHmA8d"},{"edit_history_tweet_ids":["1577584383908773889"],"public_metrics":{"retweet_count":0,"
//      reply_count":0,"like_count":0,"quote_count":0},"author_id":"220436628","id":"1577584383908773889","cre
//      ated_at":"2022-10-05T09:00:01.000Z","text":"Podľa čoho si vyberáš okuliare na bicykel? https://t.co/YC
//      1obN1aSy  #Alpina #CestnaCyklistika #HorskaCyklistika #Okuliare #Doplnky #Jazdenie #Ochrana"},{"edit_h
//      istory_tweet_ids":["1577535044595367936"],"public_metrics":{"retweet_count":4,"reply_count":0,"like_co
//      unt":0,"quote_count":0},"author_id":"781919690998317060","id":"1577535044595367936","attachments":{"me
//      dia_keys":["3_1577394879033970692"]},"created_at":"2022-10-05T05:43:58.000Z","text":"RT @mattia1143: #
//      BMW 850 E31 B12 #Alpina! \n https://t.co/oIt2cs5Fh5","referenced_tweets":[{"
//      type":"retweeted","id":"1577394884041854976"}]},{"edit_history_tweet_ids":["1577461701926354944"],"pub
//      lic_metrics":{"retweet_count":1,"reply_count":1,"like_count":5,"quote_count":0},"author_id":"132936224
//      6820982784","id":"1577461701926354944","attachments":{"media_keys":["3_1577461686201896960"]},"created
//      _at":"2022-10-05T00:52:32.000Z","text":"@kg_im 京都府和束町 新緑の茶畑\n\n#これを見た人は車の背景が和の画像
//      を貼れ\n\n#ALPINA\n#B10 3.2\n#E39\n#ネオクラシック\n#シルキーシックス\n#和束町\n#茶畑 https://t.co/JRu
//      3fhknWM","referenced_tweets":[{"type":"replied_to","id":"1577442122244165633"}],"in_reply_to_user_id":
//      "210991996"},{"edit_history_tweet_ids":["1577395266004701185"],"public_metrics":{"retweet_count":4,"re
//      ply_count":0,"like_count":0,"quote_count":0},"author_id":"1529766953463734273","id":"15773952660047011
//      85","attachments":{"media_keys":["3_1577394879033970692"]},"created_at":"2022-10-04T20:28:32.000Z","te
//      xt":"RT @mattia1143: #BMW 850 E31 B12  https://t.co/oIt2cs5Fh5","
//      referenced_tweets":[{"type":"retweeted","id":"1577394884041854976"}]},{"edit_history_tweet_ids":["1577
//      394913360384000"],"public_metrics":{"retweet_count":4,"reply_count":0,"like_count":0,"quote_count":0},
//      "author_id":"1454766716","id":"1577394913360384000","attachments":{"media_keys":["3_157739487903397069
//      2"]},"created_at":"2022-10-04T20:27:08.000Z","text":"RT @mattia1143: #BMW 850 E31 B12 #Alpina!  https://t.co/oIt2cs5Fh5","referenced_tweets":[{"type":"retweeted","id":"15773948
//      84041854976"}]},{"edit_history_tweet_ids":["1577394884041854976"],"public_metrics":{"retweet_count":4,
//      "reply_count":0,"like_count":10,"quote_count":0},"author_id":"1544102920836218880","id":"1577394884041
//      854976","attachments":{"media_keys":["3_1577394879033970692"]},"created_at":"2022-10-04T20:27:01.000Z"
//      ,"text":"#BMW 850 E31 B12 #Alpina! \n https://t.co/oIt2cs5Fh5"},{"edit_histo
//      ry_tweet_ids":["1577287303411662849"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count"
//      :0,"quote_count":0},"author_id":"80255265","id":"1577287303411662849","created_at":"2022-10-04T13:19:3
//      2.000Z","text":"XB7 de X7 ile birlikte makyajlandı. #bmw #alpina https://t.co/lTTF7qikMg"},{"edit_hist
//      ory_tweet_ids":["1577282022078238720"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count
//      ":1,"quote_count":0},"author_id":"851686782","id":"1577282022078238720","attachments":{"media_keys":["
//      3_1577282001983479808"]},"created_at":"2022-10-04T12:58:33.000Z","text":"BMW M5 CS / BMW Alpina D5 S (
//       2021)\n\n#BMW #BMWM5CS #BMWM5 #CS #BMW #M5CS #BMW #M5 #CS #BMWAlpinaD5S #BMW #AlpinaD5S #BMWAlpina #D
//       5S #BMW #Alpina #D5S https://t.co/ctfg2oQDgG"},{"edit_history_tweet_ids":["1577241570532802560"],"pub
//       lic_metrics":{"retweet_count":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"88400922
//       9501296641","id":"1577241570532802560","created_at":"2022-10-04T10:17:48.000Z","text":"RT @MusicEtern
//       al1: Music Video:\nAlpina by Flexible Fire\n\nhttps://t.co/r4L860Wzgn\n\n#Musiceternal #FlexibleFire 
//       #Alpina #Monstercat #Monsterc…","referenced_tweets":[{"type":"retweeted","id":"1577239857012817921"}]
//     },{"edit_history_tweet_ids":["1577239857012817921"],"public_metrics":{"retweet_count":1,"reply_count":0
//     ,"like_count":0,"quote_count":0},"author_id":"1619914789","id":"1577239857012817921","attachments":{"me
//     dia_keys":["3_1576312457240358912"]},"created_at":"2022-10-04T10:11:00.000Z","text":"Music Video:\nAlpi
//     na by Flexible Fire\n\nhttps://t.co/r4L860Wzgn\n\n#Musiceternal #FlexibleFire #Alpina #Monstercat #Mons
//     tercatSilk #MelodicHouse #Techno #Argentina https://t.co/zDtCGCqW8x"},{"edit_history_tweet_ids":["15770
//     59142946422784"],"public_metrics":{"retweet_count":4,"reply_count":0,"like_count":0,"quote_count":0},"a
//     uthor_id":"1291112865290690560","id":"1577059142946422784","created_at":"2022-10-03T22:12:54.000Z","tex
//     t":"RT @navruz_boz:  ELIMI BIRAKMA LLEGA A CATAR \n\nA principios del mes de SEPTIEMBRE se anunciab
//     a que NUESTRA EXTRAÑADA ELIMI BIRAKMA llegab…","referenced_tweets":[{"type":"retweeted","id":"157669382
//     4163704833"}]},{"edit_history_tweet_ids":["1577005671010435072"],"public_metrics":{"retweet_count":0,"r
//     eply_count":0,"like_count":1,"quote_count":0},"author_id":"4896184443","id":"1577005671010435072","crea
//     ted_at":"2022-10-03T18:40:25.000Z","text":"@Alpina Cualquier hora del día es perfecta para esta delicia
//     , gracias #Alpina","referenced_tweets":[{"type":"replied_to","id":"1577005206973255680"}],"in_reply_to_
//     user_id":"80623485"},{"edit_history_tweet_ids":["1577005412779323392"],"public_metrics":{"retweet_count
//     ":0,"reply_count":0,"like_count":2,"quote_count":0},"author_id":"89252231","id":"1577005412779323392","
//     attachments":{"media_keys":["3_1577004965821706240","3_1577004965897195521","3_1577004965846884353","3_
//     1577004965846843393"]},"created_at":"2022-10-03T18:39:24.000Z","text":"FOR SALE- 2022 BMW Alpina B7 xDr
//     ive, 600 hp TwinPower turbo V8, 4,777 mi, AWD, interior design pkg, 20” Alpina wheels, panoramic sky lo
//     unge LED moonroof $149,000 \n•\nCall Certified Benz &amp; Beemer (844) 568-1362 stock P20129 or see htt
//     ps://t.co/V74IcS9rMB to shop @BuyCBB \n-\n#alpina https://t.co/bb3jymdAL1"},{"edit_history_tweet_ids":[
//       "1576975969453080585"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count":1,"quote_coun
//       t":0},"author_id":"1241425240196034561","id":"1576975969453080585","attachments":{"media_keys":["3_15
//       76975940290285569"]},"created_at":"2022-10-03T16:42:24.000Z","text":"4 pcs. #wheels #BMW #Alpina \n2 
//       pcs. 6x15 ET12 \n2 pcs. 7x15 ET12 \nsilver/black PCD 4x100 \nFor 1500-2000tii, 1502-2002tii, 3 #E21
//       , #E30 https://t.co/yDn74WyBlt"},{"edit_history_tweet_ids":["1576966829632880645"],"public_metrics"
//       :{"retweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"808740616297385984",
//       "id":"1576966829632880645","attachments":{"media_keys":["3_1576966825446936576"]},"created_at":"2022-
//       10-03T16:06:05.000Z","text":"We can fix even the fanciest of European makes at Seymour's! ✨ \n\n#alp
//       ina #bmw #autorepair #sanantonio #familybusiness https://t.co/Yw31PVM0uY"},{"edit_history_tweet_ids":
//       ["1576965591595769856"],"public_metrics":{"retweet_count":4,"reply_count":0,"like_count":0,"quote_cou
//       nt":0},"author_id":"1292519409723027456","id":"1576965591595769856","created_at":"2022-10-03T16:01:10
//       .000Z","text":"RT @navruz_boz:  ELIMI BIRAKMA LLEGA A CATAR \n\nA principios del mes de SEPTIEMBR
//       E se anunciaba que NUESTRA EXTRAÑADA ELIMI BIRAKMA llegab…","referenced_tweets":[{"type":"retweeted",
//       "id":"1576693824163704833"}]},{"edit_history_tweet_ids":["1576941287131197440"],"public_metrics":{"re
//       tweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"381038653","id":"15769412
//       87131197440","attachments":{"media_keys":["3_1576941275118727169"]},"created_at":"2022-10-03T14:24:35
//       .000Z","text":"ALPINA(アルピナ)CARBON SPRINT TRACK HANDLEBARS(カーボンスプリントトラックハンドルバー)(特注
//         品/280mm幅)\nhttps://t.co/sMoTYMlSmG\n#ALPINA #アルピナ #CARBON #SPRINT #Tracksuit #HANDLEBARS #カーボ
//         ン #スプリント #トラック #ハンドルバー #特注 #280mm幅 #cyclopursuit #シクロパーシュート https://t.co/8
//         i8OwosDUr"},{"edit_history_tweet_ids":["1576937541235666944"],"public_metrics":{"retweet_count":3,"
//         reply_count":0,"like_count":0,"quote_count":0},"author_id":"1507768034525687811","id":"157693754123
//         5666944","attachments":{"media_keys":["7_1574398551744036864"]},"created_at":"2022-10-03T14:09:42.0
//         00Z","text":"RT @WX0shii_: - #alpina , memories ✧.*\n#AlpNavruz - #Alinaboz https://t.co/9a7c7kuhvA
//         ","referenced_tweets":[{"type":"retweeted","id":"1574398603841646592"}]},{"edit_history_tweet_ids":
//         ["1576905219291549696"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count":0,"quote_c
//         ount":0},"author_id":"851686782","id":"1576905219291549696","attachments":{"media_keys":["3_1576905
//         192121016320"]},"created_at":"2022-10-03T12:01:16.000Z","text":"BMW M5 CS / BMW Alpina D5 S (2021)\
//         n\n#BMW #BMWM5CS #BMWM5 #CS #BMW #M5CS #BMW #M5 #CS #BMWAlpinaD5S #BMW #AlpinaD5S #BMWAlpina #D5S #
//         BMW #Alpina #D5S https://t.co/EWb994yV6s"},{"edit_history_tweet_ids":["1576861706978197507"],"publi
//         c_metrics":{"retweet_count":0,"reply_count":0,"like_count":2,"quote_count":0},"author_id":"15008050
//         39715241984","id":"1576861706978197507","attachments":{"media_keys":["7_1576861659699765248"]},"cre
//         ated_at":"2022-10-03T09:08:22.000Z","text":"Watch this space, Alpina B6 fim coming soon.\n\n@ALPINA
//         GB @BMW @BMW_Classic @BMW_UK\n#CARLCOX #ALOINAB6 #ALPINA #BMWE30 #BMW https://t.co/LnwmzRYaZR"},{"e
//         dit_history_tweet_ids":["1576835894447046656"],"public_metrics":{"retweet_count":3,"reply_count":0,
//         "like_count":0,"quote_count":0},"author_id":"1106158169942880256","id":"1576835894447046656","attac
//         hments":{"media_keys":["3_1576660863460810752"]},"created_at":"2022-10-03T07:25:48.000Z","text":"RT
//          @auto_moto_pl: 🇩🇪 #Alpina \n\nE34 - to wnętrze \"leczy\" hemoroidy\n\n📷https://t.co/rDVXgI
//          AfdB https://t.co/3XmdWWNgnz","referenced_tweets":[{"type":"retweeted","id":"1576661297910816769"}
//         ]},{"edit_history_tweet_ids":["1576830877044129792"],"public_metrics":{"retweet_count":0,"reply_cou
//         nt":0,"like_count":0,"quote_count":0},"author_id":"1551597457263497216","id":"1576830877044129792",
//         "created_at":"2022-10-03T07:05:51.000Z","text":"@onuraltantan @BitciChain @bitcicom #bitcicoin fiya
//         tı çöp,#brace flyatı çöp #kriptokoin hala çöp #santos #lazio #alpina olamadılar yazık yazık yazık",
//         "referenced_tweets":[{"type":"replied_to","id":"1575229279746797568"}],"in_reply_to_user_id":"92853
//         0428981628929"},{"edit_history_tweet_ids":["1576830271638228992"],"public_metrics":{"retweet_count"
//         :5,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"1562807204746788868","id":"15768302
//         71638228992","created_at":"2022-10-03T07:03:27.000Z","text":"RT @time_watches: #Alpina presented a 
//         redesigned #Alpiner Extreme Automatic in three dial colours - forest green, midnight blue and black
//          -…","referenced_tweets":[{"type":"retweeted","id":"1576596845320556544"}]},{"edit_history_tweet_id
//          s":["1576827078313639936"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":0,"quo
//          te_count":0},"author_id":"426911044","id":"1576827078313639936","created_at":"2022-10-03T06:50:46.
//          000Z","text":"RT @Alpinafinanzkr: Vandaag lanceert @Alpina Group het nieuwe merk Alpina! Diks verz
//          ekeringen, online aanbieder van verzekeringen, is de ee…","referenced_tweets":[{"type":"retweeted"
//          ,"id":"1576213872381403136"}]},{"edit_history_tweet_ids":["1576764049957613569"],"public_metrics":
//          {"retweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"111805759428175872
//          0","id":"1576764049957613569","created_at":"2022-10-03T02:40:19.000Z","text":" $715.50 \nAlpi
//          na Ladies Alpiner Comtesse Swiss Quartz Watch with Diamonds Steel Blue @buy1_best\n#Alpina #Ladies
//           #Alpiner #Comtesse #Swiss #Quartz #Watch #with #fashion #lifestyle \n\nAre you ready to be #prett
//           y?! https://t.co/msKzqqwzRX"},{"edit_history_tweet_ids":["1576738827619950592"],"public_metrics":
//           {"retweet_count":4,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"3324078748","id":
//           "1576738827619950592","created_at":"2022-10-03T01:00:05.000Z","text":"RT @navruz_boz:  ELIMI BI
//           RAKMA LLEGA A CATAR \n\nA principios del mes de SEPTIEMBRE se anunciaba que NUESTRA EXTRAÑADA E
//           LIMI BIRAKMA llegab…","referenced_tweets":[{"type":"retweeted","id":"1576693824163704833"}]},{"ed
//           it_history_tweet_ids":["1576710303726936065"],"public_metrics":{"retweet_count":0,"reply_count":0
//           ,"like_count":0,"quote_count":0},"author_id":"2267606845","id":"1576710303726936065","created_at"
//           :"2022-10-02T23:06:44.000Z","text":"Owner: Hiroyuki Ozawa\n#Alpina #B9 #BMW #E24 #UltimateKlass
//           e #bmwcca #ultimatedrivingmachine #coyneperformance #kasselperformance #bimmer #stance https://t.
//           co/6yjNT6cPRE"},{"edit_history_tweet_ids":["1576697974125641729"],"public_metrics":{"retweet_coun
//           t":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"884009229501296641","id":"15766
//           97974125641729","created_at":"2022-10-02T22:17:45.000Z","text":"RT @MusicEternal1: Out Now:\nAlpi
//           na by Flexible Fire\n\nhttps://t.co/7HUKLHi7Lq\n\n#Musiceternal #FlexibleFire #Alpina #Monstercat
//            #MonstercatSi…","referenced_tweets":[{"type":"retweeted","id":"1576696023459692545"}]},{"edit_hi
//            story_tweet_ids":["1576697935831638016"],"public_metrics":{"retweet_count":1,"reply_count":0,"li
//            ke_count":0,"quote_count":0},"author_id":"884009229501296641","id":"1576697935831638016","create
//            d_at":"2022-10-02T22:17:36.000Z","text":"RT @Draven_Taylor: Out Now:\nAlpina by Flexible Fire\n\
//            nhttps://t.co/XVDcstfam5\n\n#Musiceternal #FlexibleFire #Alpina #Monstercat #MonstercatSi…","ref
//            erenced_tweets":[{"type":"retweeted","id":"1576696023333761025"}]},{"edit_history_tweet_ids":["1
//            576696023459692545"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":1,"quote_c
//            ount":0},"author_id":"1619914789","id":"1576696023459692545","attachments":{"media_keys":["3_157
//            6612851908689921"]},"created_at":"2022-10-02T22:10:00.000Z","text":"Out Now:\nAlpina by Flexible
//             Fire\n\nhttps://t.co/7HUKLHi7Lq\n\n#Musiceternal #FlexibleFire #Alpina #Monstercat #MonstercatS
//             ilk #MelodicHouse #Techno #Argentina\n@Monstercat @MonstercatSilk @flexible_fire https://t.co/q
//             Gf6ZImDSF"},{"edit_history_tweet_ids":["1576696023333761025"],"public_metrics":{"retweet_count"
//             :1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"98805095","id":"157669602333376
//             1025","attachments":{"media_keys":["3_1576612695607951364"]},"created_at":"2022-10-02T22:10:00.
//             000Z","text":"Out Now:\nAlpina by Flexible Fire\n\nhttps://t.co/XVDcstfam5\n\n#Musiceternal #Fl
//             exibleFire #Alpina #Monstercat #MonstercatSilk #MelodicHouse #Techno #Argentina https://t.co/nz
//             3WcaqMEJ"},{"edit_history_tweet_ids":["1576695688003395584"],"public_metrics":{"retweet_count":
//             4,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"1447222511977046017","id":"15766
//             95688003395584","created_at":"2022-10-02T22:08:40.000Z","text":"RT @navruz_boz:  ELIMI BIRAKM
//             A LLEGA A CATAR \n\nA principios del mes de SEPTIEMBRE se anunciaba que NUESTRA EXTRAÑADA ELI
//             MI BIRAKMA llegab…","referenced_tweets":[{"type":"retweeted","id":"1576693824163704833"}]},{"ed
//             it_history_tweet_ids":["1576693824163704833"],"public_metrics":{"retweet_count":4,"reply_count"
//             :1,"like_count":17,"quote_count":0},"author_id":"1293535418105974786","id":"1576693824163704833
//             ","attachments":{"media_keys":["3_1576693821081096196"]},"created_at":"2022-10-02T22:01:15.000Z
//             ","text":" ELIMI BIRAKMA LLEGA A CATAR \n\nA principios del mes de SEPTIEMBRE se anunciaba
//              que NUESTRA EXTRAÑADA ELIMI BIRAKMA llegaba a un NUEVO PAÍS, CATAR \n\nESTA GRAN SERIE SIGUE
//               AMPLIANDO HORIZONTES DESPUÉS DE CUATRO AÑOS‼\n\n#AlpNavruz #AlinaBoz #alpina #elimibirakma 
//               #alpalina https://t.co/jnbBPQWy2W"},{"edit_history_tweet_ids":["1576691254926401537"],"public
//               _metrics":{"retweet_count":2,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"801
//               069061383720961","id":"1576691254926401537","attachments":{"media_keys":["3_15765466971858780
//               16"]},"created_at":"2022-10-02T21:51:03.000Z","text":"RT @vvsuechanvv: 大人のたしなみ。\n#E3
//               0\n#ALPINA https://t.co/RPUhnTotzA","referenced_tweets":[{"type":"retweeted","id":"1576546699
//               488526336"}]},{"edit_history_tweet_ids":["1576685079681638400"],"public_metrics":{"retweet_co
//               unt":5,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"1497956082567766018","id"
//               :"1576685079681638400","created_at":"2022-10-02T21:26:31.000Z","text":"RT @time_watches: #Alp
//               ina presented a redesigned #Alpiner Extreme Automatic in three dial colours - forest green, m
//               idnight blue and black -…","referenced_tweets":[{"type":"retweeted","id":"1576596845320556544
//               "}]},{"edit_history_tweet_ids":["1576671918140182528"],"public_metrics":{"retweet_count":3,"r
//               eply_count":0,"like_count":0,"quote_count":0},"author_id":"1503868183584903171","id":"1576671
//               918140182528","attachments":{"media_keys":["3_1576660863460810752"]},"created_at":"2022-10-02
//               T20:34:13.000Z","text":"RT @auto_moto_pl: 🇩🇪 #Alpina \n\nE34 - to wnętrze \"leczy\" hemor
//               oidy\n\nhttps://t.co/rDVXgIAfdB https://t.co/3XmdWWNgnz","referenced_tweets":[{"type":"r
//               etweeted","id":"1576661297910816769"}]},{"edit_history_tweet_ids":["1576661974595039233"],"pu
//               blic_metrics":{"retweet_count":3,"reply_count":0,"like_count":0,"quote_count":0},"author_id":
//               "2304461882","id":"1576661974595039233","attachments":{"media_keys":["3_1576660863460810752"]
//             },"created_at":"2022-10-02T19:54:42.000Z","text":"RT @auto_moto_pl: 🇩🇪 #Alpina \n\nE34 - to
//              wnętrze \"leczy\" hemoroidy\n\nhttps://t.co/rDVXgIAfdB https://t.co/3XmdWWNgnz","referenc
//              ed_tweets":[{"type":"retweeted","id":"1576661297910816769"}]},{"edit_history_tweet_ids":["1576
//              661297910816769"],"public_metrics":{"retweet_count":3,"reply_count":0,"like_count":33,"quote_c
//              ount":0},"author_id":"1106158169942880256","id":"1576661297910816769","attachments":{"media_ke
//              ys":["3_1576660863460810752"]},"created_at":"2022-10-02T19:52:01.000Z","text":"🇩🇪 #Alpina \n
//              \nE34 - to wnętrze \"leczy\" hemoroidy\n\nhttps://t.co/rDVXgIAfdB https://t.co/3XmdWWNg
//              nz"},{"edit_history_tweet_ids":["1576614049579937793"],"public_metrics":{"retweet_count":0,"re
//              ply_count":1,"like_count":0,"quote_count":0},"author_id":"1441849511672905739","id":"157661404
//              9579937793","created_at":"2022-10-02T16:44:16.000Z","text":"@cutietalee #alinaboz #alpnavruz #
//              dizilerininadınıunuttum #azcen #alpina","referenced_tweets":[{"type":"replied_to","id":"157659
//              4582401212416"}],"in_reply_to_user_id":"1571564035794952193"},{"edit_history_tweet_ids":["1576
//              612840630235136"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count":1,"quote_co
//              unt":0},"author_id":"1376943835222323202","id":"1576612840630235136","created_at":"2022-10-02T
//              16:39:27.000Z","text":"@cutietalee #alinaboz #AlpNavruz #elimibırakma #alpina","referenced_twe
//              ets":[{"type":"replied_to","id":"1576594582401212416"}],"in_reply_to_user_id":"157156403579495
//              2193"},{"edit_history_tweet_ids":["1576612036108496897"],"public_metrics":{"retweet_count":0,"
//              reply_count":0,"like_count":0,"quote_count":0},"author_id":"1549106990789656576","id":"1576612
//              036108496897","created_at":"2022-10-02T16:36:16.000Z","text":"@cutietalee \n#AlinaBoz #AlpN
//              avruz #Alpina #ElimiBirakma","referenced_tweets":[{"type":"replied_to","id":"15765945824012124
//              16"}],"in_reply_to_user_id":"1571564035794952193"},{"edit_history_tweet_ids":["157659779199174
//              6560"],"public_metrics":{"retweet_count":5,"reply_count":0,"like_count":0,"quote_count":0},"au
//              thor_id":"1371996726","id":"1576597791991746560","created_at":"2022-10-02T15:39:40.000Z","text
//              ":"RT @time_watches: #Alpina presented a redesigned #Alpiner Extreme Automatic in three dial c
//              olours - forest green, midnight blue and black -…","referenced_tweets":[{"type":"retweeted","i
//              d":"1576596845320556544"}]},{"edit_history_tweet_ids":["1576597766570377216"],"public_metrics"
//              :{"retweet_count":5,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"464179400","i
//              d":"1576597766570377216","created_at":"2022-10-02T15:39:33.000Z","text":"RT @time_watches: #Al
//              pina presented a redesigned #Alpiner Extreme Automatic in three dial colours - forest green, m
//              idnight blue and black -…","referenced_tweets":[{"type":"retweeted","id":"1576596845320556544"
//             }]},{"edit_history_tweet_ids":["1576596845320556544"],"public_metrics":{"retweet_count":5,"repl
//             y_count":0,"like_count":28,"quote_count":0},"author_id":"467867889","id":"1576596845320556544",
//             "attachments":{"media_keys":["3_1576596831114518531"]},"created_at":"2022-10-02T15:35:54.000Z",
//             "text":"#Alpina presented a redesigned #Alpiner Extreme Automatic in three dial colours - fores
//             t green, midnight blue and black - all characterised by a slight raised pattern with a triangle
//              design. Full details at https://t.co/YZBwxCXG2D https://t.co/TMTJR2KYpb"},{"edit_history_tweet
//              _ids":["1576596293526364165"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count"
//              :0,"quote_count":0},"author_id":"1416910776074481667","id":"1576596293526364165","created_at":
//              "2022-10-02T15:33:42.000Z","text":"@cutietalee #alinaboz #alpnavruz #alpina #elimibirakma ",
//              "referenced_tweets":[{"type":"replied_to","id":"1576594582401212416"}],"in_reply_to_user_id":"
//              1571564035794952193"},{"edit_history_tweet_ids":["1576595592708780032"],"public_metrics":{"ret
//              weet_count":0,"reply_count":1,"like_count":1,"quote_count":0},"author_id":"1347982701924655104
//              ","id":"1576595592708780032","created_at":"2022-10-02T15:30:55.000Z","text":"@cutietalee #alin
//              aboz #alpnavruz #alpina #elimibirakma ","referenced_tweets":[{"type":"replied_to","id":"157
//              6594582401212416"}],"in_reply_to_user_id":"1571564035794952193"},{"edit_history_tweet_ids":["1
//              576582607894065153"],"public_metrics":{"retweet_count":2,"reply_count":0,"like_count":0,"quote
//              _count":0},"author_id":"724768254296645632","id":"1576582607894065153","attachments":{"media_k
//              eys":["3_1576546697185878016"]},"created_at":"2022-10-02T14:39:19.000Z","text":"RT @vvsuechanv
//              v: 大人のたしなみ。\n#E30\n#ALPINA https://t.co/RPUhnTotzA","referenced_tweets":[{"type":"ret
//              weeted","id":"1576546699488526336"}]},{"edit_history_tweet_ids":["1576546699488526336"],"publi
//              c_metrics":{"retweet_count":2,"reply_count":0,"like_count":30,"quote_count":0},"author_id":"24
//              44734045","id":"1576546699488526336","attachments":{"media_keys":["3_1576546697185878016"]},"c
//              reated_at":"2022-10-02T12:16:38.000Z","text":"大人のたしなみ。\n#E30\n#ALPINA https://t.co/RP
//              UhnTotzA"},{"edit_history_tweet_ids":["1576529262026575872"],"public_metrics":{"retweet_count"
//              :0,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"851686782","id":"1576529262026
//              575872","attachments":{"media_keys":["3_1576528853119418371"]},"created_at":"2022-10-02T11:07:
//              21.000Z","text":"BMW M5 CS / BMW Alpina D5 S (2021)\n\n#BMW #BMWM5CS #BMWM5 #CS #BMW #M5CS #BM
//              W #M5 #CS #BMWAlpinaD5S #BMW #AlpinaD5S #BMWAlpina #D5S #BMW #Alpina #D5S https://t.co/blMXzmP
//              HOQ"},{"edit_history_tweet_ids":["1576517168212107266"],"public_metrics":{"retweet_count":0,"r
//              eply_count":0,"like_count":0,"quote_count":0},"author_id":"82456871","id":"1576517168212107266
//              ","attachments":{"media_keys":["3_1576517166085640192"]},"created_at":"2022-10-02T10:19:17.000
//              Z","text":"Alpina je osvežila modele B3 i D3 S sa dolaskom restilizovane BMW Serije 3, koja je
//               predstavljena prošle sedmice. Oba modela su dobila više snage, aerodinamička poboljšanja, rev
//               idirani dizajn spoljašnosti i novi tehnički softver.  #Alpina\n\nhttps://t.co/vdd4O7OWsk http
//               s://t.co/Cs0AJkwkAJ"},{"edit_history_tweet_ids":["1576335604270485504"],"public_metrics":{"re
//               tweet_count":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"88400922950129664
//               1","id":"1576335604270485504","created_at":"2022-10-01T22:17:49.000Z","text":"RT @MusicEterna
//               l1: Music Video:\nAlpina by Flexible Fire\n\nhttps://t.co/r4L860Wzgn\n\n#Musiceternal #Flexib
//               leFire #Alpina #Monstercat #Monsterc…","referenced_tweets":[{"type":"retweeted","id":"1576333
//               635728416768"}]},{"edit_history_tweet_ids":["1576335574385950720"],"public_metrics":{"retweet
//               _count":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"884009229501296641","i
//               d":"1576335574385950720","created_at":"2022-10-01T22:17:42.000Z","text":"RT @Draven_Taylor: M
//               usic Video:\nAlpina by Flexible Fire\n\nhttps://t.co/oBXGJCkJT3\n\n#Musiceternal #FlexibleFir
//               e #Alpina #Monstercat #Monsterc…","referenced_tweets":[{"type":"retweeted","id":"157633363555
//               2174081"}]},{"edit_history_tweet_ids":["1576333635728416768"],"public_metrics":{"retweet_coun
//               t":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"1619914789","id":"157633363
//               5728416768","attachments":{"media_keys":["3_1576312391830159360"]},"created_at":"2022-10-01T2
//               2:10:00.000Z","text":"Music Video:\nAlpina by Flexible Fire\n\nhttps://t.co/r4L860Wzgn\n\n#Mu
//               siceternal #FlexibleFire #Alpina #Monstercat #MonstercatSilk #MelodicHouse #Techno #Argentina
//               \n@monstercat\n@MonstercatSilk @airdraw https://t.co/XnI7NFSi5y"},{"edit_history_tweet_ids":[
//                 "1576333635552174081"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":0,"
//                 quote_count":0},"author_id":"98805095","id":"1576333635552174081","attachments":{"media_key
//                 s":["3_1576312250012299269"]},"created_at":"2022-10-01T22:10:00.000Z","text":"Music Video:\
//                 nAlpina by Flexible Fire\n\nhttps://t.co/oBXGJCkJT3\n\n#Musiceternal #FlexibleFire #Alpina 
//                 #Monstercat #MonstercatSilk #MelodicHouse #Techno #Argentina https://t.co/Tun7jUilG5"},{"ed
//                 it_history_tweet_ids":["1576264901143633921"],"public_metrics":{"retweet_count":2,"reply_co
//                 unt":0,"like_count":0,"quote_count":0},"author_id":"3324078748","id":"1576264901143633921",
//                 "created_at":"2022-10-01T17:36:52.000Z","text":"RT @navruz_boz: 🎞 PRIMER CAPÍTULO DE BIR P
//                 ERI MASALI EN IMÁGENES  \n\n#AlpNavruz #AlinaBoz #BirPeriMasalı #TaroEmirTekin #MelikeKü
//                 çük #K…","referenced_tweets":[{"type":"retweeted","id":"1576262554489233409"}]},{"edit_hist
//                 ory_tweet_ids":["1576263227423752192"],"public_metrics":{"retweet_count":2,"reply_count":0,
//                 "like_count":0,"quote_count":0},"author_id":"1127346126913441798","id":"1576263227423752192
//                 ","created_at":"2022-10-01T17:30:13.000Z","text":"RT @navruz_boz: 🎞 PRIMER CAPÍTULO DE BIR
//                  PERI MASALI EN IMÁGENES  \n\n#AlpNavruz #AlinaBoz #BirPeriMasalı #TaroEmirTekin #Melike
//                  Küçük #K…","referenced_tweets":[{"type":"retweeted","id":"1576262554489233409"}]},{"edit_h
//                  istory_tweet_ids":["1576262621149696000"],"public_metrics":{"retweet_count":9,"reply_count
//                  ":0,"like_count":0,"quote_count":0},"author_id":"860488614479876096","id":"157626262114969
//                  6000","attachments":{"media_keys":["3_767712518735364096"]},"created_at":"2022-10-01T17:27
//                  :49.000Z","text":"RT @autodatoweb: El clásico del día: BMW 2002 Group 2 by Alpina 1971  #E
//                  lClasicoDelDia #BMW #Alpina #BMW2002 https://t.co/Ls9deLptbr","referenced_tweets":[{"type"
//                  :"retweeted","id":"767712570778198016"}]},{"edit_history_tweet_ids":["1576262554489233409"
//                 ],"public_metrics":{"retweet_count":2,"reply_count":2,"like_count":7,"quote_count":0},"auth
//                 or_id":"1293535418105974786","id":"1576262554489233409","attachments":{"media_keys":["3_157
//                 6262550416773120"]},"created_at":"2022-10-01T17:27:33.000Z","text":"🎞 PRIMER CAPÍTULO DE B
//                 IR PERI MASALI EN IMÁGENES  \n\n#AlpNavruz #AlinaBoz #BirPeriMasalı #TaroEmirTekin #Meli
//                 keKüçük #KadirÇermik #BaranBölükbaşi #MustafaMertKoç  #TülinEce #HazalFilizKüçükköse #Nazan
//                 Kesal #MüfitKayacan #AliAksöz #alpina #AzCen  #maraşlı #maraşli #MahCel https://t.co/f5p8rB
//                 V3h9"},{"edit_history_tweet_ids":["1576262476924321792"],"public_metrics":{"retweet_count":
//                 3,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"860488614479876096","id":"15
//                 76262476924321792","attachments":{"media_keys":["3_618753392207204352"]},"created_at":"2022
//                 -10-01T17:27:14.000Z","text":"RT @GentlmenOnWheel: Here's #PaulWalker's #BMW #Alpina 2002 t
//                 ii... Beautiful ! http://t.co/4xHn4DxsLN #RIPPaulWalker http://t.co/cIBPUWlym4","referenced
//                 _tweets":[{"type":"retweeted","id":"618753393092390912"}]},{"edit_history_tweet_ids":["1576
//                 253910263570433"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count":0,"quote
//                 _count":0},"author_id":"251324508","id":"1576253910263570433","created_at":"2022-10-01T16:5
//                 3:12.000Z","text":"#DiaInternacionalDelCafe felicitaciones @Alpina y @JuanValdezCafe delici
//                 oso ! Ojalá lo dejen y no sea sólo edición especial! #Cafecito #Yogurth #Alpina https://
//                 t.co/pqvXXSKfzw","referenced_tweets":[{"type":"quoted","id":"1575224927883493397"}]},{"edit
//                 _history_tweet_ids":["1576213872381403136"],"public_metrics":{"retweet_count":1,"reply_coun
//                 t":0,"like_count":1,"quote_count":0},"author_id":"1532709237029314561","id":"15762138723814
//                 03136","attachments":{"media_keys":["3_1576213866920517635","3_1576213869999132673"]},"crea
//                 ted_at":"2022-10-01T14:14:06.000Z","text":"Vandaag lanceert @Alpina Group het nieuwe merk A
//                 lpina! Diks verzekeringen, online aanbieder van verzekeringen, is de eerste die sinds vanda
//                 ag over is naar de nieuwe naam. \n\n#alpina #alpinagroup #naamswijziging #rebranding https:
//                 //t.co/xhKTlwYIp6"},{"edit_history_tweet_ids":["1576202033333501953"],"public_metrics":{"re
//                 tweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"832560296887721
//                 984","id":"1576202033333501953","attachments":{"media_keys":["3_1576202031504793607"]},"cre
//                 ated_at":"2022-10-01T13:27:03.000Z","text":"Alpina Wellness &amp;amp; Sporthotel im Salzbur
//                 ger Land https://t.co/u1Hwxo539e #Alpina #SalzburgerLand #Sporthotel https://t.co/tyjZrkwBG
//                 F"},{"edit_history_tweet_ids":["1576141123784957953"],"public_metrics":{"retweet_count":0,"
//                 reply_count":0,"like_count":5,"quote_count":0},"author_id":"2339057419","id":"1576141123784
//                 957953","attachments":{"media_keys":["3_1576141120773521408","3_1576141120714711042","3_157
//                 6141120727293952","3_1576141120748273664"]},"created_at":"2022-10-01T09:25:01.000Z","text":
//                 "At Leather Restoration Ltd, we restore a lot of steering wheels. We also have stock of som
//                 e rare wheels, already restored ready to fit to your car. please email me : colin@leather-r
//                 estoration.co.uk #audi #jaguar #Alpina #BMW #Porsche #Mercedes #VW https://t.co/bV92oBgDqV"
//               },{"edit_history_tweet_ids":["1576047984017813504"],"public_metrics":{"retweet_count":4,"repl
//               y_count":0,"like_count":0,"quote_count":0},"author_id":"875843508224933888","id":"15760479840
//               17813504","attachments":{"media_keys":["3_1575356363525718017","3_1575356363538309120","3_157
//               5356363521527809","3_1575356363525730304"]},"created_at":"2022-10-01T03:14:55.000Z","text":"R
//               T @Yu_Film_Car: #カタログライク選手権\n撮影させて頂いた写真、どれも綺麗ですね\n\n#拡散希望 \n#車好き
//               な人と繋がりたい \n#撮影依頼募集中 \n#ALPINA #BMW https://t.co/dAVXYkC8Hx","referenced_tweets":
//               [{"type":"retweeted","id":"1575356370282741760"}]},{"edit_history_tweet_ids":["15760172155218
//               86208"],"public_metrics":{"retweet_count":0,"reply_count":0,"like_count":0,"quote_count":0},"
//               author_id":"1453805015580168199","id":"1576017215521886208","created_at":"2022-10-01T01:12:39
//               .000Z","text":"Volk racing wheels on F30’s https://t.co/bSH8WX3AHx via @YouTube #jdm #volkrac
//               ing #te37sl #recaro #alpina"},{"edit_history_tweet_ids":["1575968731762671630"],"public_metri
//               cs":{"retweet_count":0,"reply_count":0,"like_count":2,"quote_count":0},"author_id":"128061288
//               7640387585","id":"1575968731762671630","created_at":"2022-09-30T22:00:00.000Z","text":"
//             \n\nhttps://t.co/8rZY6deSRS\n\nTrack via @MonstercatSilk\n\nFollow @WeRaveMusic \n\n#werav
//               e #Brasil #deephousemusic #electronicmusic #dj #SabadoHeroisDoSDV #sabadoLiberdadeNoSDV #S
//               abadoMafiaSdv #SabadoResgateSDV #Monstercat #SabadoEsquadraoSDV #MonstercatSilk #deephouse
//                #Alpina"},{"edit_history_tweet_ids":["1575914145186484224"],"public_metrics":{"retweet_count
//                ":23,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"860488614479876096","id":"
//                1575914145186484224","created_at":"2022-09-30T18:23:05.000Z","text":"RT @BMW_Classic: This #
//                BMW #2002 TI #Alpina has been in the same family for almost 50 years - and never looked b
//                etter! #fanfriday (Photos:…","referenced_tweets":[{"type":"retweeted","id":"1057663528730017
//                792"}]},{"edit_history_tweet_ids":["1575914117730566144"],"public_metrics":{"retweet_count":
//                16,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"860488614479876096","id":"15
//                75914117730566144","created_at":"2022-09-30T18:22:59.000Z","text":"RT @BMWCCGB: ⛈A true Aut
//                obahn storm⛈ | Do you agree?\n\n#bmwcchq #bmwcc #bmwccgb #bmw #bmwcarclub #bmwcarclubgb #al
//                pina #bmwlovers #bmwalpina…","referenced_tweets":[{"type":"retweeted","id":"1056947652926103
//                552"}]},{"edit_history_tweet_ids":["1575914048172048385"],"public_metrics":{"retweet_count":
//                30,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"860488614479876096","id":"15
//                75914048172048385","created_at":"2022-09-30T18:22:42.000Z","text":"RT @GlenmarchCars: Return
//                ing to its Roots - BMW USA Classic's Alpina BMW 2002 https://t.co/RQdBp2UxKq #BMW #classicca
//                rs #Alpina https://t.c…","referenced_tweets":[{"type":"retweeted","id":"1062257989564940288"
//               }]},{"edit_history_tweet_ids":["1575914021533908997"],"public_metrics":{"retweet_count":61,"r
//               eply_count":0,"like_count":0,"quote_count":0},"author_id":"860488614479876096","id":"15759140
//               21533908997","created_at":"2022-09-30T18:22:36.000Z","text":"RT @LienhardRacing: BMW #ALPINA 
//               2002 \n´71 and ´72 season SCCA &amp; 2.0 Litre Trans-AM class\n\n© by STANCE | WORKS Andrew R
//               itter https://t.co/z9…","referenced_tweets":[{"type":"retweeted","id":"1275708591396265984"}]
//             },{"edit_history_tweet_ids":["1575913849001496576"],"public_metrics":{"retweet_count":2,"reply_
//             count":0,"like_count":0,"quote_count":0},"author_id":"860488614479876096","id":"157591384900149
//             6576","created_at":"2022-09-30T18:21:55.000Z","text":"RT @TMRnews: 2017 BMW Alpina B7 B-Turbo -
//              Price And Features For Australia: https://t.co/amWmtWLVvg | #BMW @ALPINA_GmbH #AlpinaB7 #Alpin
//              a #…","referenced_tweets":[{"type":"retweeted","id":"837059638642159617"}]},{"edit_history_twe
//              et_ids":["1575913553814380544"],"public_metrics":{"retweet_count":16,"reply_count":0,"like_cou
//              nt":0,"quote_count":0},"author_id":"860488614479876096","id":"1575913553814380544","created_at
//              ":"2022-09-30T18:20:44.000Z","text":"RT @automovilonline: El preparador especialista en #BMW, 
//              #Alpina, presentó en #Frankfurt la #B3Touring, que toma el lugar de la guayín #M3…","reference
//              d_tweets":[{"type":"retweeted","id":"1171545739278729216"}]},{"edit_history_tweet_ids":["15759
//              13116361453568"],"public_metrics":{"retweet_count":9,"reply_count":0,"like_count":0,"quote_cou
//              nt":0},"author_id":"860488614479876096","id":"1575913116361453568","attachments":{"media_keys"
//              :["3_1313607652400824321"]},"created_at":"2022-09-30T18:19:00.000Z","text":"RT @auto_moto_pl: 
//              Car of the day\n\n🇩🇪#Alpina #BMW \n\nXB7 (G07) 2020\n\n4.4 l, V8 twin turbo, 621 hp
//               https://t.co/KDmDr5mL5s","referenced_tweets":[{"type":"retweeted","id":"1313721970845003778"}
//             ]},{"edit_history_tweet_ids":["1575913064607911937"],"public_metrics":{"retweet_count":14,"repl
//             y_count":0,"like_count":0,"quote_count":0},"author_id":"860488614479876096","id":"1575913064607
//             911937","created_at":"2022-09-30T18:18:48.000Z","text":"RT @automovilonline: #Alpina devela su 
//             #XB7, lo más cercano a una hipotética #BMW X7 M. Bajo su cofre, un V8 biturbo de 4.4 l genera 6
//             12 hp…","referenced_tweets":[{"type":"retweeted","id":"1263604826987851776"}]},{"edit_history_t
//             weet_ids":["1575912913994498052"],"public_metrics":{"retweet_count":2,"reply_count":0,"like_cou
//             nt":0,"quote_count":0},"author_id":"860488614479876096","id":"1575912913994498052","created_at"
//             :"2022-09-30T18:18:12.000Z","text":"RT @adictosgasolina: ¿Pagarías 255.000 euros por un BMW #Al
//             pina B7S Turbo Coupe? https://t.co/aW4GCqrJws #BMWE24 #Motor https://t.co/qj1DiD…","referenced_
//             tweets":[{"type":"retweeted","id":"920227988993708032"}]},{"edit_history_tweet_ids":["157591287
//             7688467456"],"public_metrics":{"retweet_count":8,"reply_count":0,"like_count":0,"quote_count":0
//           },"author_id":"860488614479876096","id":"1575912877688467456","attachments":{"media_keys":["3_654
//           409295967064064"]},"created_at":"2022-09-30T18:18:03.000Z","text":"RT @motoexposure: 1987 #Alpina
//            #BMW B7 Turbo (E24) http://t.co/BRHEQivAF4","referenced_tweets":[{"type":"retweeted","id":"65440
//            9296374013956"}]},{"edit_history_tweet_ids":["1575912840048754689"],"public_metrics":{"retweet_c
//            ount":13,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"860488614479876096","id":"
//            1575912840048754689","attachments":{"media_keys":["3_1180823897089990656"]},"created_at":"2022-0
//             9-30T18:17:54.000Z","text":"RT @RSF_Motorsport: #Alpina B2 Turbo (E12) '1986 #BMW https://t.co/
//             ukBinAWwRT","referenced_tweets":[{"type":"retweeted","id":"1180823915414872065"}]},{"edit_histo
//             ry_tweet_ids":["1575901074283794432"],"public_metrics":{"retweet_count":0,"reply_count":0,"like
//             _count":0,"quote_count":0},"author_id":"1229039349544693762","id":"1575901074283794432","attach
//             ments":{"media_keys":["3_1575900894088105984","3_1575900908554174464","3_1575900919522263040","
//             3_1575900933443260417"]},"created_at":"2022-09-30T17:31:09.000Z","text":"Offering a fine balanc
//             e of performance, exclusivity and luxury in a new contemporary design, BMW Alpina B5!\n\nFeatur
//             ing: Electric Sunroof, Head-Up Display, 20\" Alloys &amp; much more!\n\n£64,990 or message us f
//             or a finance quote. Full details: https://t.co/cVt5RDNP6O\n\n#Alpina #AlpinaB5 https://t.co/NCr
//             Nkjp3oV"},{"edit_history_tweet_ids":["1575894708953530368"],"public_metrics":{"retweet_count":0
//             ,"reply_count":0,"like_count":2,"quote_count":0},"author_id":"362947383","id":"1575894708953530
//             368","attachments":{"media_keys":["3_1575894706592022528"]},"created_at":"2022-09-30T17:05:51.0
//             00Z","text":"#Alpina yenilənmiş XB7 krossoverinin yeni şəkillərini dərc edib\n\nMəşhur Alpina ş
//             irkəti #BMW X7 krossoverinə əsaslanan Alpina XB7 modelinin görünüşünü tam şəkildə əks etdirən y
//             eni təsvirləri dərc edib. Xatırladaq ki, Buxloedən olan atelye yenilənmiş BMW Alpina XB7 krosso
//             verin… https://t.co/hMfScSJpBS"},{"edit_history_tweet_ids":["1575879292286029824"],"public_metr
//             ics":{"retweet_count":0,"reply_count":0,"like_count":3,"quote_count":0},"author_id":"1354694967
//             067729922","id":"1575879292286029824","attachments":{"media_keys":["7_1539992524848234496"]},"c
//             reated_at":"2022-09-30T16:04:36.000Z","text":"As they should!!!\n#Azcen #Alpina \n\nhttps://
//             t.co/jTAJeB7n59 https://t.co/y8S2GcSxsJ","referenced_tweets":[{"type":"quoted","id":"1575844589
//             893816321"}]}],"includes":{"media":[{"height":2048,"width":1536,"media_key":"3_1578318373343350
//             784","type":"photo","url":"https://pbs.twimg.com/media/FedQMsGaUAAi4fe.jpg"},{"height":1902,"wi
//             dth":1426,"media_key":"3_1578318373372723200","type":"photo","url":"https://pbs.twimg.com/media
//             /FedQMsNagAAFc3y.jpg"},{"height":2048,"width":1536,"media_key":"3_1578318373355937792","type":"
//             photo","url":"https://pbs.twimg.com/media/FedQMsJaYAANQUM.jpg"},{"height":580,"width":580,"medi
//             a_key":"3_1578120231767379968","type":"photo","url":"https://pbs.twimg.com/media/Feab_VNaEAAF2V
//             y.jpg"},{"height":580,"width":580,"media_key":"3_1578120235198316547","type":"photo","url":"htt
//             ps://pbs.twimg.com/media/Feab_h_aAAMSAlv.jpg"},{"height":580,"width":580,"media_key":"3_1578120
//             238679588865","type":"photo","url":"https://pbs.twimg.com/media/Feab_u9aAAEGD3A.jpg"},{"height"
//             :853,"width":1280,"media_key":"3_1578058870487908352","type":"photo","url":"https://pbs.twimg.c
//             om/media/FeZkLooWAAATyQx.jpg"},{"height":844,"width":1018,"media_key":"3_1578047273254223872","
//             type":"photo","url":"https://pbs.twimg.com/media/FeZZolkXgAAPphf.jpg"},{"height":1200,"width":1
//             200,"media_key":"3_1578041184236216321","type":"photo","url":"https://pbs.twimg.com/media/FeZUG
            
//             KNWIAEqrLU.jpg"},{"height":619,"width":1100,"media_key":"3_1577953978071060480","type":"photo",
//             "url":"https://pbs.twimg.com/media/FeYEyF7XEAAN-0m.jpg"},{"height":1001,"width":1080,"media_key
//             ":"3_1577754704460873730","type":"photo","url":"https://pbs.twimg.com/media/FeVPi14XgAIEQU2.jpg
//             "},{"height":1251,"width":1077,"media_key":"3_1577754708034392067","type":"photo","url":"https:
//             //pbs.twimg.com/media/FeVPjDMXEAM0ZBn.jpg"},{"height":852,"width":480,"public_metrics":{"view_
//             count":539},"preview_image_url":"https://pbs.twimg.com/ext_tw_video_thumb/1225911175973625856/pu
//             /img/d9at-qt0Et2l8Bu2.jpg","media_key":"7_1225911175973625856","type":"video","duration_ms":13267
//           },{"height":558,"width":636,"media_key":"3_1577394879033970692","type":"photo","url":"https://pbs.t
//           wimg.com/media/FeQISPtXEAQTnlo.jpg"},{"height":720,"width":1280,"public_metrics":{"view_count":66},
//           "preview_image_url":"https://pbs.twimg.com/ext_tw_video_thumb/1577662570210725892/pu/img/T4YSwa400l
//           2Mr8E8.jpg","media_key":"7_1577662570210725892","type":"video","duration_ms":99168},{"height":619,"
//           width":1100,"media_key":"3_1577654928117579776","type":"photo","url":"https://pbs.twimg.com/media/F
//           eT0zGCXwAAgovU.jpg"},{"height":619,"width":1100,"media_key":"3_1577654494699061253","type":"photo",
//           "url":"https://pbs.twimg.com/media/FeT0Z3bWAAUyS1b.jpg"},{"height":2048,"width":2048,"media_key":"3
//           _1577646712600117249","type":"photo","url":"https://pbs.twimg.com/media/FeTtU42XwAE1MPN.jpg"},{"hei
//           ght":2392,"width":3614,"media_key":"3_1577643211862020099","type":"photo","url":"https://pbs.twimg.
          
//           com/media/FeTqJHlXkAMpjVr.jpg"},{"height":700,"width":700,"media_key":"3_1576612900755492865","type
//           ":"photo","url":"https://pbs.twimg.com/media/FeFBFHnUUAErkTi.jpg"},{"height":810,"width":1080,"medi
//           a_key":"3_1577461686201896960","type":"photo","url":"https://pbs.twimg.com/media/FeRFC7zaUAAqBmx.jp
//           g"},{"height":619,"width":1100,"media_key":"3_1577282001983479808","type":"photo","url":"https://pb
//           s.twimg.com/media/FeOhn77XoAAZJLZ.jpg"},{"height":640,"width":640,"media_key":"3_157631245724035891
//           2","type":"photo","url":"https://pbs.twimg.com/media/FeAv1ATVsAACNP4.jpg"},{"height":674,"width":10
//           22,"media_key":"3_1577004965821706240","type":"photo","url":"https://pbs.twimg.com/media/FeKlqTzUcA
//           AdqYQ.jpg"},{"height":683,"width":1024,"media_key":"3_1577004965897195521","type":"photo","url":"ht
//           tps://pbs.twimg.com/media/FeKlqUFUUAEVWJ7.jpg"},{"height":683,"width":1024,"media_key":"3_157700496
//           5846884353","type":"photo","url":"https://pbs.twimg.com/media/FeKlqT5UoAE7SwN.jpg"},{"height":683,"
//           width":1024,"media_key":"3_1577004965846843393","type":"photo","url":"https://pbs.twimg.com/media/F
//           eKlqT5UAAETbyq.jpg"},{"height":768,"width":1024,"media_key":"3_1576975940290285569","type":"photo",
//           "url":"https://pbs.twimg.com/media/FeKLQzRXEAEDt2R.jpg"},{"height":1080,"width":1080,"media_key":"3
//           _1576966825446936576","type":"photo","url":"https://pbs.twimg.com/media/FeKC-P1XEAAF0QP.jpg"},{"heig
//           ht":600,"width":600,"media_key":"3_1576941275118727169","type":"photo","url":"https://pbs.twimg.com/
//           media/FeJrvBcacAExdiW.jpg"},{"height":720,"width":720,"public_metrics":{"view_count":207},"preview_i
//           mage_url":"https://pbs.twimg.com/ext_tw_video_thumb/1574398551744036864/pu/img/9QqeMilezXp7n9IL.jpg"
//           ,"media_key":"7_1574398551744036864","type":"video","duration_ms":13933},{"height":619,"width":1100,
//           "media_key":"3_1576905192121016320","type":"photo","url":"https://pbs.twimg.com/media/FeJK6tzXoAAKEM
//           -.jpg"},{"height":720,"width":1280,"public_metrics":{"view_count":30},"preview_image_url":"https://p
//           bs.twimg.com/ext_tw_video_thumb/1576861659699765248/pu/img/dN1EbMQ5d66GuAJY.jpg","media_key":"7_1576
//           861659699765248","type":"video","duration_ms":26701},{"height":767,"width":526,"media_key":"3_157666
//           0863460810752","type":"photo","url":"https://pbs.twimg.com/media/FeFss6nXoAAW7vn.jpg"},{"height":700
//           ,"width":700,"media_key":"3_1576612851908689921","type":"photo","url":"https://pbs.twimg.com/media/F
//           eFBCRpVQAEsfXl.jpg"},{"height":700,"width":700,"media_key":"3_1576612695607951364","type":"photo","u
//           rl":"https://pbs.twimg.com/media/FeFA5LYVQAQCFCC.jpg"},{"height":1064,"width":1064,"media_key":"3_15
//           76693821081096196","type":"photo","url":"https://pbs.twimg.com/media/FeGKrTUXkAQa9m-.jpg"},{"height"
//           :2048,"width":1536,"media_key":"3_1576546697185878016","type":"photo","url":"https://pbs.twimg.com/m
//           edia/FeEE3kGUYAAyJ89.jpg"},{"height":936,"width":1280,"media_key":"3_1576596831114518531","type":"ph
//           oto","url":"https://pbs.twimg.com/media/FeEydviWYAM2GsS.jpg"},{"height":619,"width":1100,"media_key"
//           :"3_1576528853119418371","type":"photo","url":"https://pbs.twimg.com/media/FeD0o5xWQAMXsgK.jpg"},{"h
//           eight":795,"width":1200,"media_key":"3_1576517166085640192","type":"photo","url":"https://pbs.twimg.
//           com/media/FeDqAoLXEAAxnQ5.jpg"},{"height":640,"width":640,"media_key":"3_1576312391830159360","type"
//           :"photo","url":"https://pbs.twimg.com/media/FeAvxMoVQAAHt8T.jpg"},{"height":640,"width":640,"media_k
//           ey":"3_1576312250012299269","type":"photo","url":"https://pbs.twimg.com/media/FeAvo8UUcAUtKQc.jpg"},
//           {"height":1473,"width":2000,"media_key":"3_767712518735364096","type":"photo","url":"https://pbs.twi
//           mg.com/media/Cqd2d-DXgAApEoD.jpg"},{"height":2048,"width":2048,"media_key":"3_1576262550416773120","
//           type":"photo","url":"https://pbs.twimg.com/media/FeACcC5X0AAiwQD.jpg"},{"height":315,"width":472,"me
//           dia_key":"3_618753392207204352","type":"photo","url":"https://pbs.twimg.com/media/CJZA7pIUEAAuxuP.jp
//           g"},{"height":1440,"width":1920,"media_key":"3_1576213866920517635","type":"photo","url":"https://p
//           bs.twimg.com/media/Fd_WKSvXoAMRam9.jpg"},{"height":1920,"width":1440,"media_key":"3_157621386999913
//           2673","type":"photo","url":"https://pbs.twimg.com/media/Fd_WKeNXkAErEi5.jpg"},{"height":800,"width"
//           :1200,"media_key":"3_1576202031504793607","type":"photo","url":"https://pbs.twimg.com/media/Fd_LZYY
//           XoAczhG3.jpg"},{"height":683,"width":911,"media_key":"3_1576141120773521408","type":"photo","url":"
//           https://pbs.twimg.com/media/Fd-T_6OXgAA1FKX.jpg"},{"height":683,"width":911,"media_key":"3_15761411
//           20714711042","type":"photo","url":"https://pbs.twimg.com/media/Fd-T_6AWIAIcSwP.jpg"},{"height":683,
//           "width":911,"media_key":"3_1576141120727293952","type":"photo","url":"https://pbs.twimg.com/media/F
//           d-T_6DWIAA363U.jpg"},{"height":683,"width":911,"media_key":"3_1576141120748273664","type":"photo","
//           url":"https://pbs.twimg.com/media/Fd-T_6IWQAAjNSX.jpg"},{"height":2048,"width":1366,"media_key":"3_
//           1575356363525718017","type":"photo","url":"https://pbs.twimg.com/media/FdzKRBqaAAEkLEq.jpg"},{"heig
//           ht":2048,"width":1370,"media_key":"3_1575356363538309120","type":"photo","url":"https://pbs.twimg.c
//           om/media/FdzKRBtaIAAmip3.jpg"},{"height":1267,"width":1267,"media_key":"3_1575356363521527809","typ
//           e":"photo","url":"https://pbs.twimg.com/media/FdzKRBpaEAEye17.jpg"},{"height":2048,"width":1364,"me
//           dia_key":"3_1575356363525730304","type":"photo","url":"https://pbs.twimg.com/media/FdzKRBqaMAAI86V.
//           jpg"},{"height":1425,"width":2533,"media_key":"3_1313607652400824321","type":"photo","url":"https:/
//           /pbs.twimg.com/media/EjrfMzeWAAEFiWr.jpg"},{"height":768,"width":1024,"media_key":"3_65440929596706
//           4064","type":"photo","url":"https://pbs.twimg.com/media/CRTtyZfUkAAw0rH.jpg"},{"height":615,"width"
//           :1277,"media_key":"3_1180823897089990656","type":"photo","url":"https://pbs.twimg.com/media/EGMhFAB
//           XYAA7Qan.jpg"},{"height":2041,"width":3613,"media_key":"3_1575900894088105984","type":"photo","url"
//           :"https://pbs.twimg.com/media/Fd65g4FXkAAHwd6.jpg"},{"height":2825,"width":5000,"media_key":"3_1575
//           900908554174464","type":"photo","url":"https://pbs.twimg.com/media/Fd65ht-WQAAyEZC.jpg"},{"height":
//           1923,"width":3403,"media_key":"3_1575900919522263040","type":"photo","url":"https://pbs.twimg.com/m
//           edia/Fd65iW1WAAA4eT_.jpg"},{"height":2825,"width":5000,"media_key":"3_1575900933443260417","type":"
//           photo","url":"https://pbs.twimg.com/media/Fd65jKsXkAElT0o.jpg"},{"height":576,"width":1024,"media_k
//           ey":"3_1575894706592022528","type":"photo","url":"https://pbs.twimg.com/media/Fd6z4t3WAAA8T16.jpg"}
//           ,{"height":720,"width":1280,"public_metrics":{"view_count":2410},"preview_image_url":"https://pbs.t
//           wimg.com/ext_tw_video_thumb/1539992524848234496/pu/img/bS5cc355Qx2MkCfW.jpg","media_key":"7_1539992
//           524848234496","type":"video","duration_ms":11633}],"users":[{"url":"","name":"金光坊","protected":fa
//           lse,"verified":false,"username":"He_Just_Eddie","id":"1189011873632358406","profile_image_url":"htt
//           ps://pbs.twimg.com/profile_images/1189021663397994496/iPaPhWQf_normal.jpg"},{"url":"","name":"nobou
//           ","protected":false,"verified":false,"username":"MonsterNobou","id":"1611069848","profile_image_url
//           ":"https://pbs.twimg.com/profile_images/1391662036619198466/YPKAXPio_normal.jpg"},{"url":"","name":
//           "Elaine Williams","protected":false,"verified":false,"username":"ElaineW58566007","id":"11917508866
//           88731136","profile_image_url":"https://pbs.twimg.com/profile_images/1353540573706162176/yq2JpmEu_no
//           rmal.jpg"},{"url":"","name":"El Centinela TV","protected":false,"verified":false,"username":"ElCent
//           inelaTV","id":"1631923248","profile_image_url":"https://pbs.twimg.com/profile_images/15320479978985
//           63586/SRmqw7bj_normal.jpg"},{"url":"http://t.co/HT8KqowyxG","name":"Luis Aranda Rheynell","protecte
//           d":false,"verified":false,"username":"LuisArandaR","id":"270663649","profile_image_url":"https://pb
//           s.twimg.com/profile_images/1163583337589563393/coiB-ux2_normal.jpg"},{"url":"https://t.co/lmEZkWz7m
//           Q","name":"Veolia Colombia","protected":false,"verified":true,"username":"Veolia_Co","id":"33132946
//           35","profile_image_url":"https://pbs.twimg.com/profile_images/839828293364953088/6yepQpNr_normal.jp
//           g"},{"url":"https://t.co/Z4wWwRr8wt","name":"Diks Verzekeringen","protected":false,"verified":false
//           ,"username":"diks","id":"11725182","profile_image_url":"https://pbs.twimg.com/profile_images/31077
//           13617/5a5c3d2dc81f00edaeba5d4a9d022bdb_normal.png"},{"url":"","name":"Engineer Jangra","protected"
//           :false,"verified":false,"username":"jangra_satish","id":"510688218","profile_image_url":"https://pb
//           s.twimg.com/profile_images/911307456382242816/dCbCCVZg_normal.jpg"},{"url":"https://t.co/F17rJF3Rlb
//           ","name":"Time and Watches","protected":false,"verified":false,"username":"time_watches","id":"4678
//           67889","profile_image_url":"https://pbs.twimg.com/profile_images/992340620009201665/GOvCSQko_normal
//           .jpg"},{"url":"","name":"John Stickel Cars","protected":false,"verified":false,"username":"John_Sti
//           ckel","id":"851686782","profile_image_url":"https://pbs.twimg.com/profile_images/123160582089648947
//           3/cuwqmm2o_normal.jpg"},{"url":"","name":"OlmayacakDuayaAminDedik","protected":false,"verified":fal
//           se,"username":"alpveina","id":"1251635372481818629","profile_image_url":"https://pbs.twimg.com/prof
//           ile_images/1558214780032372739/Oj0Gd5d5_normal.jpg"},{"url":"https://t.co/YdbCH4upjG","name":"ELA 
//           ","protected":false,"verified":false,"username":"albertineekayip","id":"3482366662","profile_image_
//           url":"https://pbs.twimg.com/profile_images/1574856251212763162/k-HVjFxE_normal.jpg"},{"url":"https:
//           //t.co/5130Mmq8bd","name":"miaz","protected":false,"verified":false,"username":"Ana_mmihajlovic"
//           ,"id":"1007004108","profile_image_url":"https://pbs.twimg.com/profile_images/1461975437127700481/4gO
//           VbCV3_normal.jpg"},{"url":"","name":"@motorespuntoes","protected":false,"verified":false,"username":
//           "motorespuntoes","id":"860488614479876096","profile_image_url":"https://pbs.twimg.com/profile_images
//           /1215651926651670528/LOkbXWHW_normal.jpg"},{"url":"","name":"La douille","protected":false,"verified
//           ":false,"username":"mattia1143","id":"1544102920836218880","profile_image_url":"https://pbs.twimg.co
//           m/profile_images/1544106110323392512/H0LZns_K_normal.jpg"},{"url":"","name":"Nadine Tarek Mohamed","
//           protected":false,"verified":false,"username":"NadineTarekMoh2","id":"1289982222137724931","profile_i
//           mage_url":"https://pbs.twimg.com/profile_images/1547707163664977923/fu5iVkLy_normal.jpg"},{"url":"",
//           "name":"Alp&Alina Navruz&Boz","protected":false,"verified":false,"username":"navruz_boz","id":"12935
//           35418105974786","profile_image_url":"https://pbs.twimg.com/profile_images/1293535537387667458/IahUi-
//           DS_normal.jpg"},{"url":"https://t.co/LjmjXLETCZ","name":"BMW ASSIST MORI","protected":false,"verifie
//           d":false,"username":"mla_mori","id":"707415662969233408","profile_image_url":"https://pbs.twimg.com/
//           profile_images/1171736205135773696/hfqToYkI_normal.jpg"},{"url":"https://t.co/5gJ1xG3HMb","name":"Ca
//           rPapped","protected":false,"verified":false,"username":"carpapped","id":"1575580154658693139","profi
//           le_image_url":"https://pbs.twimg.com/profile_images/1577966047507931137/Bi7WN9SQ_normal.jpg"},{"url"
//           :"","name":"Music Eternal","protected":false,"verified":false,"username":"MusicEternal1","id":"16199
//           14789","profile_image_url":"https://pbs.twimg.com/profile_images/602690904256684032/c5Mdpcjl_normal.
//           png"},{"url":"http://t.co/ufdZvr5ZzT","name":"MTBiker.sk","protected":false,"verified":false,"userna
//           me":"mtbikersk","id":"220436628","profile_image_url":"https://pbs.twimg.com/profile_images/378800000
//           587351474/464e3b7a4e4ac1b7ef8664ef92a5ae5b_normal.png"},{"url":"","name":"Jack","protected":false,"v
//           erified":false,"username":"Jack89691594","id":"781919690998317060","profile_image_url":"https://pbs.
//           twimg.com/profile_images/924663671179104257/prZbique_normal.jpg"},{"url":"","name":"きぃ","protected
//           ":false,"verified":false,"username":"TeHu60RfWNjxoLe","id":"1329362246820982784","profile_image_url
//           ":"https://pbs.twimg.com/profile_images/1566183288951095298/N3mBIH_E_normal.jpg"},{"url":"https://t
//           .co/VC5HPUdSIP","name":"空冷社長","protected":false,"verified":false,"username":"kg_im","id":"210991
//           996","profile_image_url":"https://pbs.twimg.com/profile_images/1572152418691084288/Vt3aCK9z_normal.
//           jpg"},{"url":"","name":"geronimo","protected":false,"verified":false,"username":"geronim16049510","
//           id":"1529766953463734273","profile_image_url":"https://pbs.twimg.com/profile_images/154825739315845
//           9393/YgmIXSqG_normal.jpg"},{"url":"","name":"Nicolás morel","protected":false,"verified":false,"use
//           rname":"nicolasmorel152","id":"1454766716","profile_image_url":"https://pbs.twimg.com/profile_image
//           s/1551650004418400256/dodeTtAo_normal.jpg"},{"url":"http://t.co/VLok9WOD0H","name":"Onur Koray","pr
//           otected":false,"verified":false,"username":"onurkoray","id":"80255265","profile_image_url":"https:/
//           /pbs.twimg.com/profile_images/473592820549181440/kOgXkJuR_normal.jpeg"},{"url":"","name":"DutchTech
//           noBot","protected":false,"verified":false,"username":"TechnoBotNL","id":"884009229501296641","profi
//           le_image_url":"https://pbs.twimg.com/profile_images/898571913013989376/YDDmA9ud_normal.jpg"},{"url"
//           :"","name":"alpnavruz_persian🇹🇷🇮🇷","protected":false,"verified":false,"username":"alpnavruz_persi","
//           id":"1291112865290690560","profile_image_url":"https://pbs.twimg.com/profile_images/142545656019784
//           9088/ymfP69MU_normal.jpg"},{"url":"","name":"Angelique Hotaru","protected":false,"verified":false,"
//           username":"AiniHotaru","id":"4896184443","profile_image_url":"https://pbs.twimg.com/profile_images/
//           841988656634171393/Hal5ERAg_normal.jpg"},{"url":"https://t.co/aLosCILNqs","name":"Alpina","protecte
//           d":false,"verified":true,"username":"Alpina","id":"80623485","profile_image_url":"https://pbs.twimg
//           .com/profile_images/1575861134594347011/1CzJ-Px-_normal.jpg"},{"url":"https://t.co/059eMagZEu","nam
//           e":"Highline Autos","protected":false,"verified":false,"username":"HighlineAutos","id":"89252231","
//           profile_image_url":"https://pbs.twimg.com/profile_images/1291845992191414273/qS3rE08N_normal.jpg"},
//           {"url":"https://t.co/iPT6ifJPTO","name":"Cerchiepoca.it","protected":false,"verified":false,"userna
//           me":"cerchiepoca","id":"1241425240196034561","profile_image_url":"https://pbs.twimg.com/profile_ima
//           ges/1241426807754305538/f6OiJ6Pk_normal.jpg"},{"url":"https://t.co/EEvlYRt4qS","name":"Seymour's Ga
//           rage","protected":false,"verified":false,"username":"GarageSeymours","id":"808740616297385984","pro
//           file_image_url":"https://pbs.twimg.com/profile_images/816377127700283392/pxv8obWT_normal.jpg"},{"ur
//           l":"","name":"gracielamaillot59@gmail.com","protected":false,"verified":false,"username":"gracielam
//           aillo1","id":"1292519409723027456","profile_image_url":"https://pbs.twimg.com/profile_images/143467
//           4650466881538/1-5kJd2i_normal.jpg"},{"url":"https://t.co/3U1iZBkXUi","name":"CYCLOPURSUIT(シクロパー
//           シュート)","protected":false,"verified":false,"username":"pursuitjp","id":"381038653","profile_image
//           _url":"https://pbs.twimg.com/profile_images/1210641073019572225/Lns__TUJ_normal.jpg"},{"url":"","na
//           me":"Oliver","protected":false,"verified":false,"username":"Oliver29799241","id":"15077680345256878
//           11","profile_image_url":"https://abs.twimg.com/sticky/default_profile_images/default_profile_normal
//           .png"},{"url":"","name":"෴","protected":false,"verified":false,"username":"WX0shii_","id":"127223
//           5850047291393","profile_image_url":"https://pbs.twimg.com/profile_images/1575140620867354629/FGp7DM
//           AA_normal.jpg"},{"url":"https://t.co/DGseBMQvIN","name":"Performance Heroes","protected":false,"ver
//           ified":false,"username":"Performheroes","id":"1500805039715241984","profile_image_url":"https://pbs
//           .twimg.com/profile_images/1500805341163970561/eqoszfZ__normal.jpg"},{"url":"https://t.co/qUviqculO9
//           ","name":"Maciej Smoleń Moto","protected":false,"verified":false,"username":"auto_moto_pl","id":"
//           1106158169942880256","profile_image_url":"https://pbs.twimg.com/profile_images/1417202452298883075/
//           LtmPLpGy_normal.jpg"},{"url":"","name":"bayramhayrettin","protected":false,"verified":false,"userna
//           me":"bayramhayretti1","id":"1551597457263497216","profile_image_url":"https://pbs.twimg.com/profile
//           _images/1559085304560197633/oSUkx1Uk_normal.jpg"},{"url":"https://t.co/OnvFvPpWSW","name":"Onur Alt
//           an Tan","protected":false,"verified":false,"username":"onuraltantan","id":"928530428981628929","pro
//           file_image_url":"https://pbs.twimg.com/profile_images/1348598431263186945/mhw14JUW_normal.jpg"},{"u
//           rl":"","name":"タケノコ","protected":false,"verified":false,"username":"bamboohero0625","id":"156280
//           7204746788868","profile_image_url":"https://pbs.twimg.com/profile_images/1562807946727530498/-t4-Z7
//           lN_normal.jpg"},{"url":"","name":"Robert Van Spanje","protected":false,"verified":false,"username":
//           "vanspanjer","id":"426911044","profile_image_url":"https://pbs.twimg.com/profile_images/14432076708
//           15764480/_cVh4bxT_normal.jpg"},{"url":"https://t.co/PFul2s108X","name":"Alpina Financieel Zeker","p
//           rotected":false,"verified":false,"username":"Alpinafinanzkr","id":"1532709237029314561","profile_im
//           age_url":"https://pbs.twimg.com/profile_images/1574663518212820992/1JNAgIu0_normal.jpg"},{"url":"ht
//           tps://t.co/SJVOSdGFzu","name":"Stylish Lady","protected":false,"verified":false,"username":"buy1_be
//           st","id":"1118057594281758720","profile_image_url":"https://pbs.twimg.com/profile_images/1346402902
//           546534400/j1p9qCXy_normal.jpg"},{"url":"","name":"Pamela Martinez","protected":false,"verified":f
//           alse,"username":"MPamela23","id":"3324078748","profile_image_url":"https://pbs.twimg.com/profile_im
//           ages/1465168909259128837/t_jZxk0i_normal.jpg"},{"url":"http://t.co/K4OLgK4ZtB","name":"Ultimate Kla
//           sse","protected":false,"verified":false,"username":"UltimateKlasse","id":"2267606845","profile_imag
//           e_url":"https://pbs.twimg.com/profile_images/417333578855223297/ymV6O9d2_normal.png"},{"url":"https
//           ://t.co/XTg0rsU81i","name":"Draven Taylor","protected":false,"verified":false,"username":"Draven_Ta
//           ylor","id":"98805095","profile_image_url":"https://pbs.twimg.com/profile_images/1353524838652989441
//           /DGRBU20i_normal.jpg"},{"url":"","name":"Nurr","protected":false,"verified":false,"userna
//           me":"alrairun","id":"1447222511977046017","profile_image_url":"https://pbs.twimg.com/profile_images
//           /1468272232774443008/dcTbL6pN_normal.jpg"},{"url":"","name":"ANIKI","protected":false,"verified":fa
//           lse,"username":"emx525","id":"801069061383720961","profile_image_url":"https://pbs.twimg.com/profil
//           e_images/828466391271366657/MGpYldXy_normal.jpg"},{"url":"","name":"すえちゃん","protected":false,"v
//           erified":false,"username":"vvsuechanvv","id":"2444734045","profile_image_url":"https://pbs.twimg.co
//           m/profile_images/1438166611072983044/CG2gv6xf_normal.jpg"},{"url":"","name":"Igor Lessen","protecte
//           d":false,"verified":false,"username":"Rasarobb","id":"1497956082567766018","profile_image_url":"htt
//           ps://pbs.twimg.com/profile_images/1497956208250081281/XVZSLafb_normal.png"},{"url":"","name":"Felik
//           s Duniak #POLEXIT","protected":false,"verified":false,"username":"tuskpo2agent","id":"1503868183584
//           903171","profile_image_url":"https://pbs.twimg.com/profile_images/1505977655174254604/IqRqxQpy_norm
//           al.jpg"},{"url":"","name":"Ewa","protected":false,"verified":false,"username":"ejolka","id":"230446
//           1882","profile_image_url":"https://pbs.twimg.com/profile_images/1134461188413317121/MS24n5O0_normal
//           .jpg"},{"url":"","name":"‘,","protected":false,"verified":false,"username":"beyzperalta","id":"1441
//           849511672905739","profile_image_url":"https://pbs.twimg.com/profile_images/1576993699602616320/ocC_
//           LDK2_normal.jpg"},{"url":"","name":"e","protected":false,"verified":false,"username":"cutietalee","
//           id":"1571564035794952193","profile_image_url":"https://pbs.twimg.com/profile_images/157666740407943
//           5777/0ZaWoeyx_normal.jpg"},{"url":"","name":"sheyla","protected":false,"verified":false,"username":
//           "iamsheyyla","id":"1376943835222323202","profile_image_url":"https://pbs.twimg.com/profile_images/1564742284159188992/PrbSFeqp_normal.jpg"},{"url":"","name":"Melis ...","protected":false,"verified":false,"username":"alinabozlove87","id":"1549106990789656576","profile_image_url":"https://pbs.twimg.com/profile_images/1549108248380309505/2WOzdBXa_normal.jpg"},{"url":"http://t.co/kXUTlS9Ax5","name":"TheJumpingHours","protected":false,"verified":false,"username":"TheJumpingHours","id":"1371996726","profile_image_url":"https://pbs.twimg.com/profile_images/3559430923/e4fda54695c0289a5409ff76e30e8c0c_normal.jpeg"},{"url":"","name":"Qtrader","protected":false,"verified":false,"username":"Q_Trading","id":"464179400","profile_image_url":"https://pbs.twimg.com/profile_images/1757637262/image_normal.jpg"},{"url":"","name":"zey","protected":false,"verified":false,"username":"verainstly","id":"1416910776074481667","profile_image_url":"https://pbs.twimg.com/profile_images/1576235227357364226/0OgjTkuY_normal.jpg"},{"url":"","name":"t","protected":false,"verified":false,"username":"bisusaka","id":"1347982701924655104","profile_image_url":"https://pbs.twimg.com/profile_images/1577360925723697152/ewSCUM9m_normal.jpg"},{"url":"","name":"MAKI","protected":false,"verified":false,"username":"E36_2521","id":"724768254296645632","profile_image_url":"https://pbs.twimg.com/profile_images/1573160443207483392/Oy2ZHBf-_normal.jpg"},{"url":"http://t.co/1Phqw67yPY","name":"NacionalnaKlasa.com","protected":false,"verified":false,"username":"nacionalnaklasa","id":"82456871","profile_image_url":"https://pbs.twimg.com/profile_images/3356573499/8de879ec44bc0db8b330b7290d732f8e_normal.jpeg"},{"url":"","name":"Sonia sweet🇦🇷🇦🇷🇹🇷","protected":false,"verified":false,"username":"SoniaMa15478299","id":"1127346126913441798","profile_image_url":"https://pbs.twimg.com/profile_images/1493341107484340229/8sw-ImAn_normal.jpg"},{"url":"https://t.co/oKS22SKQ95","name":"autodato","protected":false,"verified":false,"username":"autodatoweb","id":"487924416","profile_image_url":"https://pbs.twimg.com/profile_images/627689824040914944/HPLVSfAF_normal.png"},{"url":"http://t.co/itbD7BFQmD","name":"Gentlemen On Wheels","protected":false,"verified":false,"username":"GentlmenOnWheel","id":"3365812499","profile_image_url":"https://pbs.twimg.com/profile_images/773857624005763072/drdB2bho_normal.jpg"},{"url":"","name":"Manuel Mateus","protected":false,"verified":false,"username":"ManuelMateusL","id":"251324508","profile_image_url":"https://pbs.twimg.com/profile_images/1397708058487308293/bu8KsB9x_normal.jpg"},{"url":"https://t.co/ETYcfoMrfy","name":"der-testsieger.de","protected":false,"verified":false,"username":"der_testsieger","id":"832560296887721984","profile_image_url":"https://pbs.twimg.com/profile_images/832560760345784320/xPT-lReU_normal.jpg"},{"url":"https://t.co/E3ddxS6Ex1","name":"Leather-Restoration","protected":false,"verified":false,"username":"Leather_restore","id":"2339057419","profile_image_url":"https://pbs.twimg.com/profile_images/990249029488521217/nmblNtpH_normal.jpg"},{"url":"https://t.co/VgE5Lbif7v","name":"Yu","protected":false,"verified":false,"username":"Yu_Stage1","id":"875843508224933888","profile_image_url":"https://pbs.twimg.com/profile_images/1573721385926799360/PjnsqQYM_normal.jpg"},{"url":"https://t.co/jSulmOfBQZ","name":"Yu-Film","protected":false,"verified":false,"username":"Yu_Film_Car","id":"1564592351355748352","profile_image_url":"https://pbs.twimg.com/profile_images/1564592430800072704/BiqHPJDS_normal.jpg"},{"url":"","name":"poormans_alpina","protected":false,"verified":false,"username":"sagaboy008","id":"1453805015580168199","profile_image_url":"https://pbs.twimg.com/profile_images/1457116104476745729/mEgJekG__normal.jpg"},{"url":"https://t.co/OezrLZ8teC","name":"WeRave Music","protected":false,"verified":false,"username":"WeRaveMusic","id":"1280612887640387585","profile_image_url":"https://pbs.twimg.com/profile_images/1289720940469903360/HVBb9xtL_normal.jpg"},{"url":"https://t.co/xvzoXLLIfI","name":"BMW Group Classic","protected":false,"verified":false,"username":"BMW_Classic","id":"1487099072","profile_image_url":"https://pbs.twimg.com/profile_images/888035691640303617/cUlg-IH6_normal.jpg"},{"url":"https://t.co/jwLEI5x1he","name":"BMW Car Club GB","protected":false,"verified":false,"username":"BMWCCGB","id":"236826667","profile_image_url":"https://pbs.twimg.com/profile_images/1514232952158400519/ZGyEKelO_normal.jpg"},{"url":"https://t.co/ekc5GORDTj","name":"Glenmarch","protected":false,"verified":false,"username":"GlenmarchCars","id":"776371314558902272","profile_image_url":"https://pbs.twimg.com/profile_images/776732956241059845/lweB_F73_normal.jpg"},{"url":"https://t.co/nskWr2vvtO","name":"Lienhard Racing Photography","protected":false,"verified":false,"username":"LienhardRacing","id":"4185925949","profile_image_url":"https://pbs.twimg.com/profile_images/925757470936616961/TXOhSz9T_normal.jpg"},{"url":"https://t.co/NyuuiIlLEE","name":"The Motor Report","protected":false,"verified":false,"username":"TMRnews","id":"20009209","profile_image_url":"https://pbs.twimg.com/profile_images/732101677298278400/a7rNt72W_normal.jpg"},{"url":"https://t.co/PuZx5Rt3ak","name":"Revista AUTOMÓVIL","protected":false,"verified":true,"username":"automovilonline","id":"54441370","profile_image_url":"https://pbs.twimg.com/profile_images/1265706905608925184/3jr5Ghbt_normal.jpg"},{"url":"https://t.co/ygFz6Jvg3D","name":"AdictosALaGasolina","protected":false,"verified":false,"username":"adictosgasolina","id":"3771779379","profile_image_url":"https://pbs.twimg.com/profile_images/703923454089760772/3cgqz1vA_normal.jpg"},{"url":"http://t.co/wT2EFfKBvV","name":"MotoringExposure","protected":false,"verified":false,"username":"motoexposure","id":"88037004","profile_image_url":"https://pbs.twimg.com/profile_images/506526749669093376/KljjxBrL_normal.jpeg"},{"url":"","name":"RSF Motorsport ®","protected":false,"verified":false,"username":"RSF_Motorsport","id":"789891086030364672","profile_image_url":"https://pbs.twimg.com/profile_images/1260892751861813248/-bkVZpz5_normal.jpg"},{"url":"https://t.co/vGiylyHCfp","name":"Northern Sky Motor Cars","protected":false,"verified":false,"username":"northernskycars","id":"1229039349544693762","profile_image_url":"https://pbs.twimg.com/profile_images/1229039507267346432/TuvSboG6_normal.jpg"},{"url":"https://t.co/enTupvkDzn","name":"Autograph","protected":false,"verified":false,"username":"autographaz","id":"362947383","profile_image_url":"https://pbs.twimg.com/profile_images/1109310992813563905/WVAGPSwU_normal.png"},{"url":"","name":"hamda","protected":false,"verified":false,"username":"hamjama12","id":"1354694967067729922","profile_image_url":"https://pbs.twimg.com/profile_images/1578055416759857152/dYU54_5X_normal.jpg"},{"url":"https://t.co/deHXY8h0R0","name":"Telenovelas en España 🇪🇸","protected":false,"verified":false,"username":
//           "telenovelas_esp","id":"279573548","profile_image_url":"https://pbs.twimg.com/profile_images/1438855746872123394/WjWfFSyt_normal.jpg"}],"tweets":[{"edit_history_tweet_ids":["1578047490259124227"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":1,"quote_count":0},"author_id":"3313294635","id":"1578047490259124227","attachments":{"media_keys":["3_1578047273254223872"]},"created_at":"2022-10-06T15:40:15.000Z","text":"las plantas de producción por medio de estrategias de eficiencia energética, además de planes de reuso del recurso hídrico y experiencias de éxito con aliados como #Nestlé y #Alpina. (2/2)\n\n@asoleche https://t.co/nL9Ovb61RS","referenced_tweets":[{"type":"replied_to","id":"1578047483309088768"}],"in_reply_to_user_id":"3313294635"},{"edit_history_tweet_ids":["1578047483309088768"],"public_metrics":{"retweet_count":3,"reply_count":1,"like_count":5,"quote_count":0},"author_id":"3313294635","id":"1578047483309088768","attachments":{"media_keys":["3_1578047187250028544"]},"created_at":"2022-10-06T15:40:13.000Z","text":"Participamos en el 10° #CongresoAsoleche, hablando sobre la #TransformaciónEcológica en este sector.\n\nSantiago Carvajal, Gerente de Proyectos y Desarrollo de Mercados en #Veolia Colombia Panamá, destacó la digitalización como pilar fundamental para la #descarbonización de (1/2) https://t.co/JxRd5xEqEq"},{"edit_history_tweet_ids":["1576596845320556544"],"public_metrics":{"retweet_count":5,"reply_count":0,"like_count":28,"quote_count":0},"author_id":"467867889","id":"1576596845320556544","attachments":{"media_keys":["3_1576596831114518531"]},"created_at":"2022-10-02T15:35:54.000Z","text":"#Alpina presented a redesigned #Alpiner Extreme Automatic in three dial colours - forest green, midnight blue and black - all characterised by a slight raised pattern with a triangle design. Full details at https://t.co/YZBwxCXG2D https://t.co/TMTJR2KYpb"},{"edit_history_tweet_ids":["1225911252372860933"],"public_metrics":{"retweet_count":13,"reply_count":1,"like_count":94,"quote_count":1},"author_id":"1007004108","id":"1225911252372860933","attachments":{"media_keys":["7_1225911175973625856"]},"created_at":"2020-02-07T22:36:33.000Z","text":"Hanım rahatız\n\n#AlinaBoz | #AlpNavruz | #Alpina https://t.co/JivCaRoYhE"},{"edit_history_tweet_ids":["1577394884041854976"],"public_metrics":{"retweet_count":4,"reply_count":0,"like_count":10,"quote_count":0},"author_id":"1544102920836218880","id":"1577394884041854976","attachments":{"media_keys":["3_1577394879033970692"]},"created_at":"2022-10-04T20:27:01.000Z","text":"#BMW 850 E31 B12 #Alpina! \n https://t.co/oIt2cs5Fh5"},{"edit_history_tweet_ids":["1577662737123098624"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":2,"quote_count":0},"author_id":"1293535418105974786","id":"1577662737123098624","attachments":{"media_keys":["7_1577662570210725892"]},"created_at":"2022-10-05T14:11:22.000Z","text":" CAMBIO RADICAL \n\n¿QUÉ ESTILISMO OS GUSTA MÁS? \n\n#AlpNavruz #AlinaBoz #BirPeriMasalı #TaroEmirTekin #MelikeKüçük #KadirÇermik #BaranBölükbaşi #MustafaMertKoç  #TülinEce #HazalFilizKüçükköse #NazanKesal #MüfitKayacan #AliAksöz #alpina #AzCen  #maraşlı #maraşli #MahCel https://t.co/tgpO48AUJI"},{"edit_history_tweet_ids":["1577442122244165633"],"public_metrics":{"retweet_count":1,"reply_count":2,"like_count":21,"quote_count":0},"author_id":"210991996","id":"1577442122244165633","attachments":{"media_keys":["7_1577442085052944384"]},"created_at":"2022-10-04T23:34:44.000Z","text":"姫路城。\n\n #これを見た人は車の背景が和の画像を貼れ\n\n#ポルシェ914 #オープンカー #ポルシェ #シトロエン #空冷ポルシェ #ds5 #カルマンギア #キューベルワーゲン #空冷ワーゲン #レトロカー #旧車 https://t.co/Xok0Az6rj1"},{"edit_history_tweet_ids":["1577239857012817921"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"1619914789","id":"1577239857012817921","attachments":{"media_keys":["3_1576312457240358912"]},"created_at":"2022-10-04T10:11:00.000Z","text":"Music Video:\nAlpina by Flexible Fire\n\nhttps://t.co/r4L860Wzgn\n\n#Musiceternal #FlexibleFire #Alpina #Monstercat #MonstercatSilk #MelodicHouse #Techno #Argentina https://t.co/zDtCGCqW8x"},{"edit_history_tweet_ids":["1576693824163704833"],"public_metrics":{"retweet_count":4,"reply_count":1,"like_count":17,"quote_count":0},"author_id":"1293535418105974786","id":"1576693824163704833","attachments":{"media_keys":["3_1576693821081096196"]},"created_at":"2022-10-02T22:01:15.000Z","text":" ELIMI BIRAKMA LLEGA A CATAR \n\nA principios del mes de SEPTIEMBRE se anunciaba que NUESTRA EXTRAÑADA ELIMI BIRAKMA llegaba a un NUEVO PAÍS, CATAR \n\nESTA GRAN SERIE SIGUE AMPLIANDO HORIZONTES DESPUÉS DE CUATRO AÑOS‼\n\n#AlpNavruz #AlinaBoz #alpina #elimibirakma #alpalina https://t.co/jnbBPQWy2W"},{"edit_history_tweet_ids":["1577005206973255680"],"public_metrics":{"retweet_count":0,"reply_count":1,"like_count":1,"quote_count":0},"author_id":"80623485","id":"1577005206973255680","created_at":"2022-10-03T18:38:35.000Z","text":"@AiniHotaru Y eso nos encanta!  ¿ En qué momento del día prefieres disfrutar de esta deliciosa combinación? ","referenced_tweets":[{"type":"replied_to","id":"1576722898827767808"}],"in_reply_to_user_id":"4896184443"},{"edit_history_tweet_ids":["1574398603841646592"],"public_metrics":{"retweet_count":3,"reply_count":0,"like_count":18,"quote_count":0},"author_id":"1272235850047291393","id":"1574398603841646592","attachments":{"media_keys":["7_1574398551744036864"]},"created_at":"2022-09-26T14:00:52.000Z","text":"- #alpina , memories ✧.*\n#AlpNavruz - #Alinaboz https://t.co/9a7c7kuhvA"},{"edit_history_tweet_ids":["1576661297910816769"],"public_metrics":{"retweet_count":3,"reply_count":0,"like_count":33,"quote_count":0},"author_id":"1106158169942880256","id":"1576661297910816769","attachments":{"media_keys":["3_1576660863460810752"]},"created_at":"2022-10-02T19:52:01.000Z","text":"🇩🇪 #Alpina \n\nE34 - to wnętrze \"leczy\" hemoroidy\n\nhttps://t.co/rDVXgIAfdB https://t.co/3XmdWWNgnz"},{"edit_history_tweet_ids":["1575229279746797568"],"public_metrics":{"retweet_count":272,"reply_count":425,"like_count":633,"quote_count":10},"author_id":"928530428981628929","id":"1575229279746797568","attachments":{"media_keys":["3_1575229270577774618"]},"created_at":"2022-09-28T21:01:41.000Z","text":"\n\n#BFT #SNFT @BitciChain @bitcicom https://t.co/WH7mQizJeo"},{"edit_history_tweet_ids":["1576213872381403136"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":1,"quote_count":0},"author_id":"1532709237029314561","id":"1576213872381403136","attachments":{"media_keys":["3_1576213866920517635","3_1576213869999132673"]},"created_at":"2022-10-01T14:14:06.000Z","text":"Vandaag lanceert @Alpina Group het nieuwe merk Alpina! Diks verzekeringen, online aanbieder van verzekeringen, is de eerste die sinds vandaag over is naar de nieuwe naam. \n\n#alpina #alpinagroup #naamswijziging #rebranding https://t.co/xhKTlwYIp6"},{"edit_history_tweet_ids":["1576696023459692545"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":1,"quote_count":0},"author_id":"1619914789","id":"1576696023459692545","attachments":{"media_keys":["3_1576612851908689921"]},"created_at":"2022-10-02T22:10:00.000Z","text":"Out Now:\nAlpina by Flexible Fire\n\nhttps://t.co/7HUKLHi7Lq\n\n#Musiceternal #FlexibleFire #Alpina #Monstercat #MonstercatSilk #MelodicHouse #Techno #Argentina\n@Monstercat @MonstercatSilk @flexible_fire https://t.co/qGf6ZImDSF"},{"edit_history_tweet_ids":["1576696023333761025"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"98805095","id":"1576696023333761025","attachments":{"media_keys":["3_1576612695607951364"]},"created_at":"2022-10-02T22:10:00.000Z","text":"Out Now:\nAlpina by Flexible Fire\n\nhttps://t.co/XVDcstfam5\n\n#Musiceternal #FlexibleFire #Alpina #Monstercat #MonstercatSilk #MelodicHouse #Techno #Argentina https://t.co/nz3WcaqMEJ"},{"edit_history_tweet_ids":["1576546699488526336"],"public_metrics":{"retweet_count":2,"reply_count":0,"like_count":30,"quote_count":0},"author_id":"2444734045","id":"1576546699488526336","attachments":{"media_keys":["3_1576546697185878016"]},"created_at":"2022-10-02T12:16:38.000Z","text":"大人のたしなみ。\n#E30\n#ALPINA https://t.co/RPUhnTotzA"},{"edit_history_tweet_ids":["1576594582401212416"],"public_metrics":{"retweet_count":19,"reply_count":15,"like_count":196,"quote_count":14},"author_id":"1571564035794952193","id":"1576594582401212416","attachments":{"media_keys":["7_1576594387320061956"]},"created_at":"2022-10-02T15:26:54.000Z","text":"alpina🫶🏻 https://t.co/q5wIVhv7ju"},{"edit_history_tweet_ids":["1576333635728416768"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"1619914789","id":"1576333635728416768","attachments":{"media_keys":["3_1576312391830159360"]},"created_at":"2022-10-01T22:10:00.000Z","text":"Music Video:\nAlpina by Flexible Fire\n\nhttps://t.co/r4L860Wzgn\n\n#Musiceternal #FlexibleFire #Alpina #Monstercat #MonstercatSilk #MelodicHouse #Techno #Argentina\n@monstercat\n@MonstercatSilk @airdraw https://t.co/XnI7NFSi5y"},{"edit_history_tweet_ids":["1576333635552174081"],"public_metrics":{"retweet_count":1,"reply_count":0,"like_count":0,"quote_count":0},"author_id":"98805095","id":"1576333635552174081","attachments":{"media_keys":["3_1576312250012299269"]},"created_at":"2022-10-01T22:10:00.000Z","text":"Music Video:\nAlpina by Flexible Fire\n\nhttps://t.co/oBXGJCkJT3\n\n#Musiceternal #FlexibleFire #Alpina #Monstercat #MonstercatSilk #MelodicHouse #Techno #Argentina https://t.co/Tun7jUilG5"},{"edit_history_tweet_ids":["1576262554489233409"],"public_metrics":{"retweet_count":2,"reply_count":2,"like_count":7,"quote_count":0},"author_id":"1293535418105974786","id":"1576262554489233409","attachments":{"media_keys":["3_1576262550416773120"]},"created_at":"2022-10-01T17:27:33.000Z","text":"🎞 PRIMER 
//           CAPÍTULO DE BIR PERI MASALI EN IMÁGENES  \n\n#AlpNavruz #AlinaBoz #BirPeriMasalı #TaroEmirTekin #MelikeKüçük #KadirÇermik #BaranBölükbaşi #MustafaMertKoç  #TülinEce #HazalFilizKüçükköse #NazanKesal #MüfitKayacan #AliAksöz #alpina #AzCen  #maraşlı #maraşli #MahCel https://t.co/f5p8rBV3h9"},{"edit_history_tweet_ids":["767712570778198016"],"public_metrics":{"retweet_count":9,"reply_count":0,"like_count":11,"quote_count":0},"author_id":"487924416","id":"767712570778198016","attachments":{"media_keys":["3_767712518735364096"]},"created_at":"2016-08-22T13:18:34.000Z","text":"El clásico del día: BMW 2002 Group 2 by Alpina 1971  #ElClasicoDelDia #BMW #Alpina #BMW2002 https://t.co/Ls9deLptbr"},{"edit_history_tweet_ids":["618753393092390912"],"public_metrics":{"retweet_count":3,"reply_count":0,"like_count":4,"quote_count":1},"author_id":"3365812499","id":"618753393092390912","attachments":{"media_keys":["3_618753392207204352"]},"created_at":"2015-07-08T12:07:59.000Z","text":"Here's #PaulWalker's #BMW #Alpina 2002 tii... Beautiful ! http://t.co/4xHn4DxsLN #RIPPaulWalker http://t.co/cIBPUWlym4"},{"edit_history_tweet_ids":["1575224927883493397"],"public_metrics":{"retweet_count":14,"reply_count":12,"like_count":261,"quote_count":2},"author_id":"80623485","id":"1575224927883493397","created_at":"2022-09-28T20:44:23.000Z","text":"Cuando combinamos lo mejor de nuestro campo, nos llenamos de orgullo #CombinemosLoQueSomos"},{"edit_history_tweet_ids":["1575356370282741760"],"public_metrics":{"retweet_count":4,"reply_count":0,"like_count":35,"quote_count":1},"author_id":"1564592351355748352","id":"1575356370282741760","attachments":{"media_keys":["3_1575356363525718017","3_1575356363538309120","3_1575356363521527809","3_1575356363525730304"]},"created_at":"2022-09-29T05:26:42.000Z","text":"#カタログライク選手権\n撮影させて頂いた写真、どれも綺麗ですね\n\n#拡散希望 \n#車好きな人と繋がりたい \n#撮影依頼募集中 \n#ALPINA #BMW https://t.co/dAVXYkC8Hx"},{"edit_history_tweet_ids":["1057663528730017792"],"public_metrics":{"retweet_count":23,"reply_count":1,"like_count":110,"quote_count":1},"author_id":"1487099072","id":"1057663528730017792","attachments":{"media_keys":["3_1057663500703678464","3_1057663511285907457","3_1057663518995030021","3_1057663527056564227"]},"created_at":"2018-10-31T16:00:10.000Z","text":"This #BMW #2002 TI #Alpina has been in the same family for almost 50 years - and never looked better! #fanfriday (Photos: https://t.co/rFMbrWG2CI) https://t.co/ThZb1vs6gF"},{"edit_history_tweet_ids":["1056947652926103552"],"public_metrics":{"retweet_count":16,"reply_count":0,"like_count":50,"quote_count":0},"author_id":"236826667","id":"1056947652926103552","attachments":{"media_keys":["3_1056947631916752898"]},"created_at":"2018-10-29T16:35:32.000Z","text":"⛈A true Autobahn storm⛈ | Do you agree?\n\n#bmwcchq #bmwcc #bmwccgb #bmw #bmwcarclub #bmwcarclubgb #alpina #bmwlovers #bmwalpina #bmw#instabmw #2002alpina #autobahn #truestorm #sharknose #sharknosecollection #2002 #02 #bmw2002 https://t.co/3gQKFWKMwp"},{"edit_history_tweet_ids":["1062257989564940288"],"public_metrics":{"retweet_count":30,"reply_count":0,"like_count":60,"quote_count":0},"author_id":"776371314558902272","id":"1062257989564940288","attachments":{"media_keys":["3_1062257958703296513"]},"created_at":"2018-11-13T08:16:55.000Z","text":"Returning to its Roots - BMW USA Classic's Alpina BMW 2002 https://t.co/RQdBp2UxKq #BMW #classiccars #Alpina https://t.co/jAauKqpyv4"},{"edit_history_tweet_ids":["1275708591396265984"],"public_metrics":{"retweet_count":61,"reply_count":1,"like_count":314,"quote_count":4},"author_id":"4185925949","id":"1275708591396265984","attachments":{"media_keys":["3_1275706525886152707","3_1275707389304504321","3_1275707525141336064","3_1275707602660478980"]},"created_at":"2020-06-24T08:33:24.000Z","text":"BMW #ALPINA 2002 \n´71 and ´72 season SCCA &amp; 2.0 Litre Trans-AM class\n\n© by STANCE | WORKS Andrew Ritter https://t.co/z90usScj4J"},{"edit_history_tweet_ids":["837059638642159617"],"public_metrics":{"retweet_count":2,"reply_count":0,"like_count":2,"quote_count":0},"author_id":"20009209","id":"837059638642159617","attachments":{"media_keys":["3_837059620698894336"]},"created_at":"2017-03-01T21:59:04.000Z","text":"2017 BMW Alpina B7 B-Turbo - Price And Features For Australia: https://t.co/amWmtWLVvg | #BMW @ALPINA_GmbH #AlpinaB7 #Alpina #BMW7Series https://t.co/BvlOlZpT6o"},{"edit_history_tweet_ids":["1171545739278729216"],"public_metrics":{"retweet_count":16,"reply_count":2,"like_count":86,"quote_count":1},"author_id":"54441370","id":"1171545739278729216","attachments":{"media_keys":["3_1171545651814907904","3_1171545657926021120","3_1171545664741724161","3_1171545677962199041"]},"created_at":"2019-09-10T22:07:25.000Z","text":"El preparador especialista en #BMW, #Alpina, presentó en #Frankfurt la #B3Touring, que toma el lugar de la guayín #M3 que BMW no se anima a fabricar. El L6 de 3.0 litros biturbo entrega 455 hp y 516 lb/pie de torque. #NovedadesAP #IAA #IAA19 https://t.co/9xIb4E6Gff"},{"edit_history_tweet_ids":["1313721970845003778"],"public_metrics":{"retweet_count":9,"reply_count":14,"like_count":54,"quote_count":0},"author_id":"1106158169942880256","id":"1313721970845003778","attachments":{"media_keys":["3_1313607652400824321"]},"created_at":"2020-10-07T06:05:00.000Z","text":"Car of the day\n\n🇩🇪#Alpina #BMW \n\nXB7 (G07) 2020\n\n4.4 l, V8 twin turbo, 621 hp https://t.co/KDmDr5mL5s"},{"edit_history_tweet_ids":["1263604826987851776"],"public_metrics":{"retweet_count":14,"reply_count":1,"like_count":92,"quote_count":2},"author_id":"54441370","id":"1263604826987851776","attachments":{"media_keys":["3_1263604752794836992","3_1263604759069470720","3_1263604776530403328","3_1263604789734076417"]},"created_at":"2020-05-21T22:57:22.000Z","text":"#Alpina devela su #XB7, lo más cercano a una hipotética #BMW X7 M. Bajo su cofre, un V8 biturbo de 4.4 l genera 612 hp y 590 lb/pie disponibles desde las 2,000 rpm (!), con lo que alcanza 100 km/h en 4.2 segs, y llega a una máxima de 290 km/h. #NovedadesAP #ModificadosAP @BMWMex https://t.co/Zwyvxit5Px"},{"edit_history_tweet_ids":["920227988993708032"],"public_metrics":{"retweet_count":2,"reply_count":0,"like_count":1,"quote_count":0},"author_id":"3771779379","id":"920227988993708032","attachments":{"media_keys":["3_920227987265552387"]},"created_at":"2017-10-17T10:00:24.000Z","text":"¿Pagarías 255.000 euros por un BMW #Alpina B7S Turbo Coupe? https://t.co/aW4GCqrJws #BMWE24 #Motor https://t.co/qj1DiDnesx"},{"edit_history_tweet_ids":["654409296374013956"],"public_metrics":{"retweet_count":8,"reply_count":1,"like_count":9,"quote_count":0},"author_id":"88037004","id":"654409296374013956","attachments":{"media_keys":["3_654409295967064064"]},"created_at":"2015-10-14T21:31:49.000Z","text":"1987 #Alpina #BMW B7 Turbo (E24) http://t.co/BRHEQivAF4"},{"edit_history_tweet_ids":["1180823915414872065"],"public_metrics":{"retweet_count":13,"reply_count":0,"like_count":39,"quote_count":0},"author_id":"789891086030364672","id":"1180823915414872065","attachments":{"media_keys":["3_1180823897089990656"]},"created_at":"2019-10-06T12:35:34.000Z","text":"#Alpina B2 Turbo (E12) '1986 #BMW https://t.co/ukBinAWwRT"},{"edit_history_tweet_ids":["1575844589893816321"],"public_metrics":{"retweet_count":43,"reply_count":8,"like_count":116,"quote_count":11},"author_id":"279573548","id":"1575844589893816321","attachments":{"media_keys":["3_1575844588375392256"]},"created_at":"2022-09-30T13:46:42.000Z","text":"#PTE2022 | Alina Boz y Alp Navruz (#NoSueltesMiMano ganan como 'Mejor pareja turca' de Divinity, en telenovelas repetidas: https://t.co/GuHWN6tYBa https://t.co/BTjPF5XyCI"}]},"meta":{"newest_id":"1578318390590328832","oldest_id":"1575879292286029824","result_count":100,"next_token":"b26v89c19zqg8o3fpzbls3ml70esj0ooxm2uu5fe7eyd9"}}`