import React from 'react'

const UserInfo = (props) => {
  return (
    <div className='userContainer'>
        <img src={props.photo} alt='user'/>
        <span>{props.name}</span>
    </div>
  )
}

export default UserInfo