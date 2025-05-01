
import { CardWithForm } from '@/components/items/CustomCard'
import Header from '@/components/items/Header'
import ProgressBar from '@/components/items/ProgressBar'


import React from 'react'

const Hero = () => {


  return (
    <div className='flex flex-col space-y-2 min-w-[80vw] h-screen'>
     <Header />
     <section className='flex items-center justify-evenly'>
     <CardWithForm
     title='Mai edzés' 
     imgsrc='/icons/fire.svg'
      content='Kettlebell edzés'
      footer="kedd 17:00"
     />
     <CardWithForm
     title='Aktív célok'
     imgsrc='/icons/kupa.svg'
     content= {
      <div className='flex flex-col space-y-2'>
        <ProgressBar label='Súlycsökkentés' value={70}/>
        <ProgressBar label='Heti edzés' value={50}/>
        <ProgressBar label='Havi edzés' value={30}/>
      </div>}/>
      <CardWithForm
      title="Következő edzés"
      imgsrc='/icons/clock.svg'
      content="Kedd 17:00"
      footer='El ne felejtsd az edzést' />
     </section>
    </div>
  )
}

export default Hero