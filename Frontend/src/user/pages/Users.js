import React, { useEffect , useState} from 'react';
import ErrorModal from '../../shared/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/UIElements/LoadingSpinner';
import UsersList from '../components/UsersList';
import {useHttpClient} from '../../shared/hooks/http-hook'
import '../../shared/UIElements/LoadingSpinner.css'

const Users = () => {
  const {Loading, error, sendRequest, clearError} = useHttpClient()
  const [loadedUsers, setLoadedUsers] = useState()

  useEffect(()=>{
    const fetchUsers = async () =>{
      try{
        const responseData = await sendRequest(`${process.env.REACT_APP_API}/users`)


        setLoadedUsers(responseData.users)

      }catch(err){}
    }
    fetchUsers()
  },[sendRequest])

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError}/>
      {Loading && (
        <div className='center'>
          <LoadingSpinner asOverlay/>
        </div>
      )}

      {!Loading && loadedUsers && <UsersList items={loadedUsers}/>}
    </React.Fragment>  
  );
};

export default Users;
