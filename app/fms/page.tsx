'use client'


import ClienFMSCard from '@/components/items/ClienFMSCard'
import{ CustomSelect } from '@/components/items/CustomSelect'
import FMSErtekeles from '@/components/items/FMSErtekeles'
import FMSScores from '@/components/items/FMSScores'
import { clients } from '@/public/constans/values'
import React from 'react'


const Fms = () => {
  return (
    <main className='flex flex-col h-screen bg-secondary'>
      <header className='flex max-w-screen min-w-[80vw] bg-white justify-between h-[72px] p-4'>
        <div className='flex items-center space-x-8'>
          <div>
            <h1 className='text-h1'>FMS vizsgálatok</h1>
          </div>
          <div className='flex items-center'>
            <CustomSelect
              placeholder='Válassz ügyfelet...'
              options={clients}
              onChange={(value) => console.log(value)}
              selectLabel='Ügyfél'
            />
          </div>
        </div>
         
      </header>
      <section className='flex justify-end p-4 space-x-8 '>
      <div className='flex flex-col w-96  bg-white rounded-lg shadow-lg'>
        <span className='text-h2 p-4'>Ügyfelek</span>
        <ClienFMSCard />
      </div>
      <div className='flex w-2xl md:w-4xl bg-white rounded-lg shadow-lg'>
        <FMSScores />
      </div>
      </section>
      <section className='flex p-4 space-x-8 items-end justify-end'>

     <FMSErtekeles />
      </section>

    </main>
  )
}

export default Fms