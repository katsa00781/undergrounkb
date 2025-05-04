import React from 'react'

import { clients } from '@/public/constans/values'
import Image from 'next/image'

const ClienFMSCard = () => {

  return (
    <div className='flex flex-col items-center space-y-4 p-4'>
      {clients.map((client, index) => (
        <div className='flex w-84 bg-container' key={index}>
            <div>
                <Image src={client.imgsrc} alt={client.value} width={40} height={40} className='rounded-full' />
            </div>
            <div className='flex flex-col ml-4'>
                 <span>{client.value}</span>
                 <span>Utolsó mérés: {client.lastDate}</span>
            </div>
        </div>
      ))}
    </div>
  )
}

export default ClienFMSCard