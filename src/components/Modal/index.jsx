
import { FiX } from 'react-icons/fi'
import './modal.css';

export default function Modal({ conteudo, close }){
  return(
    <div className="modal">
      <div className="container">
        <button className="close" onClick={ close }>
          <FiX size={25} color="#FFF" />
          Voltar
        </button>

        <main>
          <h2>Detalhes do projeto</h2>

          <div className="row">
            <span>
              Cliente: <i>{conteudo.cliente}</i>
            </span>
          </div>

          <div className="row">
            <span>
              Assunto: <i>{conteudo.assunto}</i>
            </span>
            <span>
              Cadastrado em: <i>{conteudo.createdFormat}</i>
            </span>
          </div>

          <div className="row">
            <span>
              Status: 
              <i className="status-badge" style={{ color: "#FFF", backgroundColor: conteudo.status === 'Aberto' ? '#73ff00' : '#f6a935' }}>
                {conteudo.status}
              </i>
            </span>
            
            <span>
              Valor: <i>{conteudo.valor}</i>
            </span>
          </div>

          {conteudo.complemento !== '' && (
          <>
            <h3>Complemento</h3>
            <p>
              {conteudo.complemento}
            </p>
          </>
          )}

        </main>
      </div>
    </div>
  )
}