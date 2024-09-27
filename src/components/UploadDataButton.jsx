import React, {useState} from 'react'
import axios from 'axios';

const UploadDataButton = () => {

  const handleFileUpload = async (event) => {
    event.preventDefault();
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      const formData = new FormData();
      
      formData.append('file', selectedFile);
      try {
        const response = await axios.post('http://localhost:8080/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });


        console.log('Upload sucessful:', response.data);
      } catch (error) {
        console.log('Error uploading file:', error);
      }


      console.log('Selected file:', selectedFile);
    } else {
      console.log('No file selected');
    }
  };

  return (
    <div>
      <h2>Upload Excel File</h2>
      <form>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </form>
    </div>
  );
}

export default UploadDataButton