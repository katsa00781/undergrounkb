import React from 'react'

const sampleData = [
    {
        gyakorlat: "Goblet Guggolás",
        sorozat: 4,
        ism: 8,
        suly: "32kg",
    },
    {
        gyakorlat: "Fekvenyomás",
        sorozat: 4,
        ism: 8,
        suly: "32kg",
    },
    {
        gyakorlat: "Fekvőtámasz",
        sorozat: 4,
        ism: 8,
        suly: "32kg",
    },
    {
        gyakorlat: "Húzódzkodás",
        sorozat: 4, 
        ism: 8,
        suly: "Saját",
    }
]

const DiaryCardElement = () => {
  return (
    <div className='flex flex-col w-full space-y-4'> {/* Hozzáadtunk space-y-4-et */}
        {sampleData.map((item, index) => (
            <div className='bg-container' key={index}> {/* Minden elem külön bg-container-be került */}
                <div className='flex space-x-4'>
                    <div className='flex flex-col flex-shrink w-88 space-y-4'>
                        <p className='container-text-secondary'>Gyakorlat</p>
                        <p className="container-text-primary">{item.gyakorlat}</p> {/* Dinamikus adat */}
                    </div>
                    <div className='flex justify-center space-x-20'>
                        <div className='flex flex-col space-y-4'>
                            <p className='container-text-secondary'>Sorozat</p>
                            <p className='container-text-primary'>{item.sorozat}</p> {/* Dinamikus adat */}
                        </div>
                        <div className='flex flex-col space-y-4'>
                            <p className='container-text-secondary'>Ismétlések</p>
                            <p className='container-text-primary'>{item.ism}</p> {/* Dinamikus adat */}
                        </div>
                        <div className='flex flex-col space-y-4'>
                            <p className="container-text-secondary">Súly</p>
                            <p className="container-text-primary">{item.suly}</p> {/* Dinamikus adat */}
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
  )
}

export default DiaryCardElement