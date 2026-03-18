import {Circles} from 'react-loader-spinner'

function Loader({visible}) {
    return (
        <span>
            <Circles
        height="20"
        width="20"
        color="#000"
        ariaLabel="circles-loading"
        wrapperStyle={{}}
        wrapperClass=""
        visible={visible}
        />
        </span>
        
    )
}

export default Loader
