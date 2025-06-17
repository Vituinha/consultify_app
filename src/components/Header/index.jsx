import { useContext } from 'react'
import avatarImg from '../../assets/avatar.png'
import { Link } from 'react-router-dom'

import { AuthContext } from '../../contexts/auth'
import { FiLayers, FiDollarSign, FiUser, FiSettings } from 'react-icons/fi'
import './header.css';

export default function Header(){
  const { user, logout } = useContext(AuthContext);
  

  return(
    <div className="sidebar">
      <div>
        <img src={user.avatarUrl === null ? avatarImg : user.avatarUrl} alt="Foto do usuario" />
      </div>
      
      <div className='bar'></div>

      <div className='itens'>
        <Link to="/dashboard">
          <FiLayers color="#FFF" size={28} />
          Projetos
        </Link>

        <Link to="/payments">
          <FiDollarSign color="#FFF" size={28} />
          Pagamentos
        </Link>

        <Link to="/customers">
          <FiUser color="#FFF" size={28} />
          Clientes
        </Link>

        <Link to="/profile">
          <FiSettings color="#FFF" size={28} />
          Perfil
        </Link>
      </div>

      <button className="logout-btn" onClick={ () => logout() }>Sair</button>
    </div>
  )
}