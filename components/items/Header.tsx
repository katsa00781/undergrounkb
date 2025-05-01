import React from 'react'
import { Button } from '../ui/button'
import Image from 'next/image'

const Header = () => {
    return (
        <header className='bg-white border-b border-neutral-200 p-4 shadow-lg max-h-16 min-w-[80vw]'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl text-[#333333]'>
                    DashBoard
                </h1>
                <div className='flex items-center space-x-4'>
                    <div className='flex bg-[#007AFF] justify-center rounded-md'>
                        <Button className='bg-[#007AFF]'>
                            <Image src='/icons/plus.svg' alt='add' width={14} height={14} className='rounded-full text-white' />
                            Új Edzésterv</Button>
                    </div>
                        <div>
                            <Image src='/images/user.jpg' alt='UserIcon' width={40} height={40} className='rounded-full' />
                        </div>
                </div>
            </div>

        </header>

    )
}

export default Header