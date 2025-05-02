
import NewWorkoutForm from '@/components/forms/NewWorkoutForm'
import { CardWithForm } from '@/components/items/CustomCard'
import Image from 'next/image'
import React from 'react'

const TraningPlans = () => {
  return (
   <section>
    <header className='bg-white border-b border-neutral-200 p-4 shadow-lg max-h-16 min-w-[80vw]'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl text-[#333333]'>
                    DashBoard
                </h1>
                <div className='flex items-center px-4'>
                 <Image src='/images/user.jpg' alt='UserIcon' width={40} height={40} className='rounded-full' /> 
                </div>
            </div>
        </header>
        <CardWithForm
        title='Új edzésterv'
        content={<NewWorkoutForm />}
        className='w-full h-screen p-4 '/>
   </section>
  )
}

export default TraningPlans