import React, {useContext} from 'react';
import { VALIDATOR_MINLENGTH, VALIDATOR_REQUIRE } from '../../shared/FormElements/Validators';
import Input from '../../shared/FormElements/Input';
import Button from '../../shared/components/Button';
import ErrorModal from '../../shared/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/UIElements/LoadingSpinner';
import {useForm} from '../../shared/hooks/form-hook';
import { useHttpClient } from '../../shared/hooks/http-hook';
import { AuthContext } from '../../shared/context/auth-context';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import ImageUpload from '../../shared/FormElements/ImageUpload';

import './NewPlace.css';


const NewPlace = () => {
  const auth = useContext(AuthContext)
  const {isLoading,sendRequest,error,clearError} = useHttpClient()
  const[formState,inputHandler]=useForm(
    {
      title: {
        value: '',
        isValid: false
      },
      description: {
        value: '',
        isValid: false
      },
      address: {
        value:'',
        isValid:false
      },
      location: {
        value:'',
        isValid:false
      },
      image:{
        value: null,
        isValid: false
      }
    },
    false
  );

const history = useHistory()

const submitHandler = async event=>{
    event.preventDefault();
    try{
        const formData = new FormData()
        formData.append('title',formState.inputs.title.value)
        formData.append('description',formState.inputs.description.value)
        formData.append('address',formState.inputs.address.value)
        formData.append('location',formState.inputs.location.value)
        formData.append('image',formState.inputs.image.value)
        await sendRequest(`${window.env.REACT_APP_API}/places/`,'POST',formData, {
          Authorization: 'Bearer '+auth.token
        })

      history.push('/');
    }catch(err){}
}

  return (
    <React.Fragment>
    <ErrorModal error={error} onClear={clearError}/>
    <form className="place-form" onSubmit={submitHandler}>
    {isLoading && <LoadingSpinner asOverlay/>}
      <h2>New Place</h2>
      <Input
        id="title"
        element="input"
        type="text"
        label="Title"
        validators={[VALIDATOR_REQUIRE()]}
        errorText="Please enter a valid title."
        onInput={inputHandler}
      />
      <Input
        id="description"
        element="textarea"
        label="Description"
        validators={[VALIDATOR_MINLENGTH(5)]}
        errorText="Please enter a valid description (at least 5 characters)."
        onInput={inputHandler}
      />
      <Input
        id="address"
        element="textarea"
        label="Address"
        validators={[VALIDATOR_MINLENGTH(2)]}
        errorText="Please enter a valid address (at least 2 characters)."
        onInput={inputHandler}
      />
      <Input
        id="location"
        element="textarea"
        label="Location"
        validators={[VALIDATOR_MINLENGTH(2)]}
        errorText="Please enter a valid googlemap link."
        onInput={inputHandler}
      />
      <ImageUpload id="image" onInput={inputHandler} errorText="Please provide an image."/>
      <Button type="submit" disabled={!formState.isValid}>
        ADD PLACE
      </Button>
    </form>
    </React.Fragment>
  );
};

export default NewPlace;