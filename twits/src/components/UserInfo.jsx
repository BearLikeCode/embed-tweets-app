import React from 'react'
import Logout from '../assets/log-out.svg'

const UserInfo = (props) => {
  return (
    <div className='userContainer'>
        <img src={props.photo} alt='user'/>
        <span>{props.name}</span>
        <img className='logout' src={Logout} alt='logout'/>
    </div>
  )
}

export default UserInfo