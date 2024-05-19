import React, { useContext } from "react";
import './NavLinks.css';
import { NavLink } from "react-router-dom";
import { AuthContext } from "./context/auth-context";

const NavLinks = () => {
    const auth = useContext(AuthContext);

    return (
        <ul className="nav_links">
            <h3>
                <li><NavLink to="/" exact>All Users</NavLink></li>
            </h3>
            <h3>
                <li><NavLink to="/places" exact>All Places</NavLink></li>
            </h3>
            {auth.isLoggedIn && <h3>
                <li><NavLink to={`/${auth.userId}/places`}>My Places</NavLink></li>
            </h3>}
            {auth.isLoggedIn && <h3>
                <li><NavLink to="/places/new">Add Place</NavLink></li>
            </h3>}
            {!auth.isLoggedIn && <h3>
                <li><NavLink to="/auth">Login</NavLink></li>
            </h3>}
            {auth.isLoggedIn && <h3>
                <li><NavLink to="/auth" onClick={auth.logout}>Logout</NavLink></li>
            </h3>}
        </ul>
    );
}

export default NavLinks;