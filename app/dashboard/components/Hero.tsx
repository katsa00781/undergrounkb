import CardButton from '@/components/items/CardButton'
import { CardWithForm } from '@/components/items/CustomCard'
import Header from '@/components/items/Header'
import ProgressBar from '@/components/items/ProgressBar'
import Image from 'next/image'

import React from 'react'

const Hero = () => {
  return (
    // A fő konténer reszponzív beállítása
    <div className='flex flex-col space-y-4 w-full min-h-screen p-4 md:p-6 lg:p-8'>
      <Header />
      
      {/* Kártyák szekció - mobilon egymás alatt, tablet/desktop-on grid */}
      <section className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <CardWithForm
          title='Mai edzés' 
          imgsrc='/icons/fire.svg'
          content='Kettlebell edzés'
          footer="kedd 17:00"
          className="w-full" // Teljes szélesség minden breakpointon
        />
        <CardWithForm
          title='Aktív célok'
          imgsrc='/icons/kupa.svg'
          content={
            <div className='flex flex-col space-y-2'>
              <ProgressBar label='Súlycsökkentés' value={70}/>
              <ProgressBar label='Heti edzés' value={50}/>
              <ProgressBar label='Havi edzés' value={30}/>
            </div>
          }
          className="w-full"
        />
        <CardWithForm
          title="Következő edzés"
          imgsrc='/icons/clock.svg'
          content="Kedd 17:00"
          footer='El ne felejtsd az edzést'
          className="w-full"
        />
      </section>

      {/* Gombok szekció - mobilon 2 oszlop, tablet/desktop-on 4 oszlop */}
      <section className='grid grid-cols-2 md:grid-cols-4 gap-4 w-full'>
        <CardButton
          imgsrc='icons/cardbuttonplus.svg'
          title='Új edzésterv'
          url='/traning-plans'
        />
        <CardButton
          imgsrc='icons/cardButtonAddDate.svg'
          title='Időpont foglalás'
          url='/appointments'
        />
        <CardButton
          imgsrc='icons/cardButtonClient.svg'
          title='Ügyfelek'
          url='/app/fms'
        />
        <CardButton
          imgsrc='icons/cardButtonStat.svg'
          title='Statisztikák'
          url='/fms'
        />
      </section>

      {/* Aktivitások szekció - reszponzív padding és szélesség */}
      <section className='bg-white border-b border-neutral-200 p-4 md:p-6 lg:p-8 shadow-lg w-full rounded-lg'>
        <h2 className='text-title mb-4'>Legútóbbi aktivítások</h2>
        <div className='flex items-center space-x-4 p-2'>
          <div className='flex-shrink-0'>
            <Image src='/icons/activity.svg' alt='ok' width={24} height={24} />
          </div>
          <div>
            <p className='text-subtitle'>Új edzésterv létrehozva</p>
            <p className='text-sm text-gray-500'>2025.04.19 - 08:30</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Hero