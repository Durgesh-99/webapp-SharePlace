import React, {useEffect, useRef, useState} from 'react'
import Button from '../components/Button'
import './ImageUpload.css'

const ImageUpload= (props)=>{
    const [file, setFile] = useState()
    const [previewUrl, setPreviewUrl] = useState()
    const [isValid, setIsValid]= useState(false)

    const filePickerRef = useRef()

    useEffect(()=>{
        if(!file){
            return
        }
        const fileReader = new FileReader()
        fileReader.onload=()=>{
            setPreviewUrl(fileReader.result)
        }
        fileReader.readAsDataURL(file)
    })

    const pickedImageHandler = event =>{
        let pickedFile
        let fileIsValid = isValid
        if(event.target.files && event.target.files.length===1){
            pickedFile = event.target.files[0];
            setFile(pickedFile)
            setIsValid(true)
            fileIsValid = true
        } else {
            setIsValid(false)
        }
        props.onInput(props.id, pickedFile, fileIsValid)
    }

    const pickImageHandler = ()=>{
        filePickerRef.current.click()
    }

    return (
        <div className='form-control'>
            <input 
                id={props.id} 
                ref={filePickerRef}
                style={{display:'none'}} 
                type="file" 
                accept='.jpg,.png,.jpeg'
                onChange={pickedImageHandler}
            />
            <div className='image-upload'>
                <div className='image-upload_preview'>
                    {previewUrl && <img src={previewUrl} alt='Preview'/>}
                    {!previewUrl && <p>Please pick an image for profile.</p>}
                </div>
                <Button type="button" onClick={pickImageHandler}>PICK IMAGE</Button>
            </div>
            {!isValid && <p>{props.errorText}</p>}
        </div>
    )
}

export default ImageUpload