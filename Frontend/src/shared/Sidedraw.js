import React from "react";
import ReactDOM from "react-dom";
import './Sidedraw.css';

const Sidedraw =(props)=>{
    const content = (
        <aside className='sd'>{props.children}</aside>
    );
    return ReactDOM.createPortal(content, document.getElementById('drawer'));
};

export default Sidedraw;