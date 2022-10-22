import React from 'react'
import CloseIcon from '../assets/close.svg'

const TagLabel = (props) => {
    const deleteHandler = (e) => {
        e.stopPropagation()
        props.setSearchParams(prev => (prev.get('filters').split(' ').filter(item => !item.includes(props.tag)).length > 0 ? {filters: `${props.query.filter(tag => !tag.includes(props.tag)).filter(item => !item.includes('@')).length > 1 ? '(' : ''}${props.query.filter(item => !item.includes('@')).length > 0 ? props.query.filter(item => !item.includes('@')).map(hashtag => !hashtag.includes('#') ? `#${hashtag}` : hashtag).join(' OR ') : ''}${props.query.filter(item => !item.includes('@')).length > 1 ? ')' : ''}${props.query.filter(item => item.includes('@')).length > 0 && props.query.filter(item => !item.includes('@')) ? ' ' : ''}${props.query.filter(item => item.includes('@')).length > 1 ? '(' : ''}${props.query.filter(item => item.includes('@')).length > 0 ? (props.query.filter(item => item.includes('@')).join(' OR ').replaceAll('@', 'from:')) : ''}${props.query.filter(item => item.includes('@')).length > 1 ? ')' : ''}`} : {}))
        props.setQuery(prev => prev.filter(item => !item.includes(props.tag) && item !== ' ' && item !== '#'))
    }
  return (
    <div className='tagLabel'>
        <span>{props.tag}</span>
        <img alt='close' onClick={deleteHandler} width={16} src={CloseIcon}/>
    </div>
  )
}

export default TagLabel