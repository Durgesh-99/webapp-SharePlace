import React, { useEffect, useState } from "react";
import {useParams} from "react-router-dom";
import PlacesList from "../PlacesList";
import ErrorModal from "../../shared/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";
import Seach from './z_search.png'

const Places = () =>{
    const [loadedPlaces, setLoadedPlaces]= useState()
    const [inputData, setInputData]=useState("")
    const {isLoading,error,clearError,sendRequest}= useHttpClient()

    const userId = useParams().userId;

    useEffect(()=>{
        const fetchPlaces = async ()=>{
            try{
                const responseData = await sendRequest(`${window.env.REACT_APP_API}/places`)
                setLoadedPlaces(responseData.places)
            }catch(err){

            }
        }
        fetchPlaces()
    },[sendRequest,userId])

    const searchPlacesHandler = async (event)=>{
        event.preventDefault();
        try{
            const responseData = await sendRequest(
                `${window.env.REACT_APP_API}/places/search`,
                'POST',
                JSON.stringify({
                    search: inputData
                }),
                {
                    'Content-Type': 'application/json'
                }
            )
            setLoadedPlaces(responseData.places)
        }catch(err){}
    }

    const PlaceDeletedHandler = (deletedPlaceId)=>{
        setLoadedPlaces(prevPlaces=> prevPlaces.filter(
            place => place.id !== deletedPlaceId
        ))
    }

    return (
        <React.Fragment>
            <ErrorModal error={error} onClear={clearError}/>
            <form onSubmit={searchPlacesHandler}>
            <div className="search-bar-area">
                <input type="text" className="searchbar" placeholder="Search for Places..." onChange={e=>setInputData(e.target.value)}/>
                <button className="search" type="submit">
                    <img className="searchBtn" src={Seach} alt="search"/>
                </button>
            </div>
            </form>
            {isLoading && 
                <div className="center">
                    <LoadingSpinner/>
                </div>}
            {!isLoading && loadedPlaces && <PlacesList items={loadedPlaces} onDeletePlace={PlaceDeletedHandler}/>}
        </React.Fragment>
    )
};

export default Places;