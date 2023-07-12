import React from 'react'
import axios from 'axios'

const TransferDataButton = () => {
  const handleTransference = async () => {
    try {
      await axios.post('http://localhost:8080/api/transfer')
      console.log('Transfering data request sent successfully')   //this message print out after the request completes
      
    } catch (error) {
      console.error('Error sending upload request', error)
    }
  };

  return (
    <button onClick = {handleTransference}> Transfer to database </button>
  )
}

export default TransferDataButton