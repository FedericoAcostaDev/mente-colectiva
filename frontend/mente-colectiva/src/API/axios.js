import axios from "axios";

//creating api connection to backend
const api = axios.create({
    baseURL: import.meta.env.PROD
      ? import.meta.env.VITE_SERVER_URL   // production backend URL
      : 'http://localhost:3000'        ,
    // headers: {
    //     'Content-Type': 'application/json'
    // }
})

//interceptor function for axios automatically add token to header
api.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token'); //taking items from local storage
    console.log("Token from localStorage:", token);

    if(token){
        config.headers.Authorization = `Bearer ${token}`; //adding token to header
    }

    return config;
},
(error)=>{
    return Promise.reject(error);
}
)

//response interceptor
api.interceptors.response.use((response)=>{
    return response;
},(error)=>{

    //error 401 response --> JWT verify fail
    if(error.response && error.response.status===401){
        localStorage.removeItem('token');
        window.location.href='/auth/login';
    }

    //return rejection 
    return Promise.reject(error);   
})
export default api;