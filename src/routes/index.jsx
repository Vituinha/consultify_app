import { Routes, Route } from 'react-router-dom'

import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import Dashboard from '../pages/Dashboard'
import Profile from '../pages/Profile'
import Customers from '../pages/Customers'
import New from '../pages/New'
import Payments from '../pages/Payments';

import Private from './Private'
import Public from './Public'

function RoutesApp(){
  return(
    <Routes>
      <Route path="/" element={ <Public><SignIn/></Public> } />
      <Route path="/register" element={<Public><SignUp/></Public> } />

      <Route path="/dashboard" element={ <Private><Dashboard/></Private> } />

      <Route path="/payments" element={ <Private><Payments/></Private> } />
      
      <Route path="/profile" element={ <Private><Profile/></Private> } />

      <Route path="/customers" element={<Private><Customers/></Private>} />
      
      <Route path="/new" element={<Private><New/></Private>} />

      <Route path="/new/:id" element={<Private><New/></Private>} />
    </Routes>
  )
}

export default RoutesApp;