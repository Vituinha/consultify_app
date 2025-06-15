import { useContext } from 'react'
import avatarImg from '../../assets/avatar.png'
import { Link } from 'react-router-dom'

import { AuthContext } from '../../contexts/auth'
import { FiHome, FiUser, FiSettings } from 'react-icons/fi'
import './header.css';
import { FaMoneyBill } from 'react-icons/fa'

export default function Header(){
  const { user } = useContext(AuthContext);

  return(
    <div className="sidebar">
      <div>
        <img src={user.avatarUrl === null ? avatarImg : user.avatarUrl} alt="Foto do usuario" />
      </div>

      <Link to="/dashboard">
        <FiHome color="#FFF" size={24} />
        Projetos
      </Link>

      <Link to="/customers">
        <FiUser color="#FFF" size={24} />
        Clientes
      </Link>

      <Link to="/payments">
        <FaMoneyBill color="#FFF" size={24} />
        Pagamentos
      </Link>

      <Link to="/profile">
        <FiSettings color="#FFF" size={24} />
        Perfil
      </Link>
    </div>
  )
}