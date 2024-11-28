import React, { useContext, useEffect, useState } from "react";
import {useParams} from "react-router-dom";
import PlacesList from "../PlacesList";
import ErrorModal from "../../shared/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";

const UserPlaces = () =>{
    const auth = useContext(AuthContext)
    const [loadedPlaces, setLoadedPlaces]= useState()
    const {isLoading,error,clearError,sendRequest}= useHttpClient()

    const userId = useParams().userId;
    useEffect(()=>{
        const fetchPlaces = async ()=>{
            try{
                const responseData = await sendRequest(`${window.env.REACT_APP_API}/places/user/${userId}`)
                setLoadedPlaces(responseData.places)
                
            }catch(err){

            }
        }
        fetchPlaces()
    },[sendRequest,userId])

    const PlaceDeletedHandler = (deletedPlaceId)=>{
        setLoadedPlaces(prevPlaces=> prevPlaces.filter(
            place => place.id !== deletedPlaceId
        ))
    }
    return (
        <React.Fragment>
            <ErrorModal error={error} onClear={clearError}/>
            {auth.userId !== userId && <h2 className="heading">Places Uploaded by the User</h2>}
            {isLoading && 
                <div className="center">
                    <LoadingSpinner/>
                </div>}
            {!isLoading && loadedPlaces && <PlacesList items={loadedPlaces} onDeletePlace={PlaceDeletedHandler}/>}
        </React.Fragment>
    )
};

export default UserPlaces;