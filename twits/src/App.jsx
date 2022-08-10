import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Tweet from './components/Tweet';
import './App.css'

function App() {
  const [tweets, setTweets] = useState([])

  useEffect(() => {
    const socket = io.connect(process.env.PORT || 'http://localhost:3002/')
    socket.on('connect', () => {
      console.log('socket connect')
      socket.on('tweets', data => {
        setTweets((prev) => [data].concat(prev.slice(0, 20)))
        console.log(data)
      })
    })
    socket.on('disconnect', () => {
      socket.off('tweets')
      socket.removeAllListeners('tweets')
      console.log('socket disconnected')
    })
    
  }, [])

  return (
    <div className='flex'>
      <div className='fixedWidth'>
      {tweets.map((tweet) => <Tweet public_metrics={tweet.data.public_metrics} referenced_tweets={tweet.data.referenced_tweets} id={tweet.data.id} author={tweet.includes.users[0]} media={tweet.includes.media} created_at={tweet.data.created_at} text={tweet.data.text} key={tweet.data.id} />)}
      </div>
    </div>
  );
}

export default App;
