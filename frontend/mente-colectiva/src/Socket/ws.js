import {io} from "socket.io-client";

const liveURL = import.meta.env.PROD
      ? import.meta.env.VITE_SERVER_URL   // production backend URL
      : 'http://localhost:3000'        

    export const socket = io(liveURL, {
        autoConnect: false,
        auth: {
            token: localStorage.getItem('token')
        }
    });

