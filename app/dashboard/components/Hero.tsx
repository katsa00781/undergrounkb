
import CardButton from '@/components/items/CardButton'
import { CardWithForm } from '@/components/items/CustomCard'
import Header from '@/components/items/Header'
import ProgressBar from '@/components/items/ProgressBar'
import Image from 'next/image'


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
     <section className='flex items-center justify-center space-x-10 '>
      <CardButton
      imgsrc='icons/cardbuttonplus.svg'
      title='Új edzésterv'
      url='/traning-plans' />
      <CardButton
      imgsrc='icons/cardButtonAddDate.svg'
      title='Időpont foglalás'
      url='/appointments' />
      <CardButton
      imgsrc='icons/cardButtonClient.svg'
      title='Ügyfelek'
      url='/app/fms' />
      <CardButton
      imgsrc='icons/cardButtonStat.svg'
      title='Statisztikák'
      url='/fms' />
     </section>
     <section className='bg-white border-b border-neutral-200 p-4 shadow-lg min-h-[250px] min-w-[80vw]'>
      <h2 className='text-title'>Legútóbbi aktivítások</h2>
      <div className='flex space-y-4 items-center'>
        <div>
      <Image src='/icons/activity.svg' alt='ok' width={24} height={24} />
        </div>
      <div>
        <p className='text-subtitle'>Új edzésterv létrehozva</p>
        <p className='text-sm'>2025.04.19 - 08:30</p>
      </div>
      </div>
     </section>
    </div>
  )
}

export default Hero