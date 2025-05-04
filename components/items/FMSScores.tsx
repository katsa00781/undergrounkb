import React from 'react'

const FMSScores = () => {
  return (
    
    <section className='flex flex-col items-center  w-full h-full p-4 space-y-4'>
        <span className='text-h1'>FMS eredmények - Wilk Péter</span>
        <div className='flex w-full items-center justify-center gap-4'>
        <div className='flex flex-col items-center w-56 border-1 border-[#E5E7EB] rounded-lg p-4'>
            <p className='text-h3'>Összpontszám</p>
            <p className='text-primary text-3xl font-semibold'>16/21</p>
        </div>
        <div className='flex flex-col items-center w-56 border-1 border-[#E5E7EB] rounded-lg p-4'>
            <p className='text-h3'>Előző mérés</p>
            <p className='text-primary text-3xl font-semibold'>14/21</p>
        </div>
        <div className='flex flex-col items-center w-56 border-1 border-[#E5E7EB] rounded-lg p-4'>
            <p className='text-h3'>Fejlődés</p>
            <p className='text-green-500 text-3xl font-semibold'>+2</p>
        </div>
        </div>
        <article className='flex flex-col items-center justify-center bg-[#E5E7EB] w-3xl h-[232px]'>
            <p>Eredmények grafikonja lesz itt</p>
        </article>
    </section>
  )
}

export default FMSScores