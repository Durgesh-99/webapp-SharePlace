import React from "react";
import PlacesItems from "./PlacesItems";
import Card from "../shared/components/Card";
import Button from "../shared/components/Button";
import './PlacesList.css';

const PlacesList = props =>{
    if(props.items.length===0){
        return (
        <div className="place-list">
            <Card>
                <h2>No places found. Maybe create one?</h2>
                <Button to='/places/new'>Share a Place</Button>
            </Card>
        </div>
        );
    }

    return (
        <ul className="place-list">
      {props.items.map(place => (
        <PlacesItems
          key={place.id}
          id={place.id}
          image={place.image}
          title={place.title}
          description={place.description}
          address={place.address}
          creatorId={place.creator}
          location={place.location}
          onDelete={props.onDeletePlace}
        />
      ))}
    </ul>
    );
};

export default PlacesList;