import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

interface CardButtonProps {
    title: string
    imgsrc: string
    url: string
}

const CardButton = ({title, imgsrc, url} : CardButtonProps) => {
  return (
    <div>
    <Link href={url} className='flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-4 w-64 h-32'>
    <Image src={imgsrc} alt='plus' width={24} height={24} />
    <p className='text-subtitle'>{title}</p>
    </Link>
    </div>
  )
}

export default CardButton