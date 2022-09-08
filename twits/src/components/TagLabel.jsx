import React from 'react'
import CloseIcon from '../assets/close.svg'

const TagLabel = (props) => {
    const deleteHandler = () => {
        props.setHashTag(null)
    }
  return (
    <div className='tagLabel'>
        <span>{props.tag}</span>
        <img alt='close' onClick={deleteHandler} width={16} src={CloseIcon}/>
    </div>
  )
}

export default TagLabel