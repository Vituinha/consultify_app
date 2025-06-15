import { useState } from 'react'
import Header from '../../components/Header'
import Title from '../../components/Title'
import { validateCNPJ, formatCNPJ } from '../../helpers/CNPJMask';

import { FiUser } from 'react-icons/fi'

import { db } from '../../services/firebaseConnection'
import { addDoc, collection } from 'firebase/firestore'

import { toast } from 'react-toastify'

import './customers.css'

export default function Customers(){
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [contato, setContato] = useState('')
  const [endereco, setEndereco] = useState('')

  async function handleRegister(e){
    e.preventDefault();

    if(nome !== '' && cnpj !== '' && endereco !== '' && email !== '' && contato !== ''){
        await addDoc(collection(db, "customers"), {
          nomeFantasia: nome,
          cnpj: cnpj,
          email: email,
          contato: contato,
          endereco: endereco
        })
        .then(() => {
          setNome('')
          setCnpj('')
          setEmail('')
          setContato('')
          setEndereco('')
          toast.success("Empresa registrada!")
        })
        .catch((error) => {
          console.log(error);
          toast.error("Erro ao fazer o cadastro.")
        })

    }else{
      toast.error("Preencha todos os campos!")
    }

  }

  const handleChangeCNPJ = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formattedValue = formatCNPJ(e.target.value);
    setCnpj(formattedValue);
    setIsValid(rawValue.length < 14 || validateCNPJ(rawValue));
  };
  
  return(
    <div>
      <Header/>

      <div className="content">
        <h1>Novo Cliente</h1>
        <p className='subtitle'>Cadastre um novo cliente para seus projetos.</p>

        <div className="container">
          <form className="form-profile" onSubmit={handleRegister}>
              <label>Nome</label>
              <input
                type="text"
                placeholder="Nome do Cliente ou Empresa"
                value={nome}
                onChange={(e) => setNome(e.target.value) }
              />

              <label>CNPJ</label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={handleChangeCNPJ}
                maxLength={18}
              />

              <label>Email</label>
              <input
              type="email"
              placeholder="exemplo@dominio.com"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);
              }}
              onBlur={() => {
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  alert("Email inválido!");
                }
              }}
            />

              <label>Contato</label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={contato}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); 
                  let formattedValue = '';
                  
                  if (value.length <= 11) { 
                    if (value.length <= 2) {
                      formattedValue = value;
                    } else if (value.length <= 6) {
                      formattedValue = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                    } else if (value.length <= 10) {
                      formattedValue = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                    } else {
                      formattedValue = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                    }
                  }
                  setContato(formattedValue);
                }}
                maxLength={15} 
              />

              <label>Endereço</label>
              <input
                type="text"
                placeholder="Endereço da empresa"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value) }
              />

              <button className='save' type="submit">
                Salvar
              </button>
          </form>
        </div>

      </div>

    </div>
  )
}