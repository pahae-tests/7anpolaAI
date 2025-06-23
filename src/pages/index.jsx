import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const index = () => {
    const router = useRouter()
    useEffect(() => {
        router.push('/Register')
    })
    return (
        <div>index</div>
    )
}

export default index