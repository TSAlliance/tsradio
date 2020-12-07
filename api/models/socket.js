import Authenticator from "./authenticator"
import { Channel } from "../models/channel.js"

class Socket {
    CHANNEL_METADATA_UPDATE = ""
    CHANNEL_LISTENER_UPDATE = "channel_listener_update"
    CHANNEL_INITIAL_TRANSPORT = "channel_initial_transport"

    async setup(socketio) {
        this.socketio = socketio

        this.socketio.use(async (socket, next) => {
            let handshakeData = socket.handshake
            let token = handshakeData.query.token
            let userUUID = handshakeData.query.uuid

            if(!token) {
                socket.disconnect(true)
                return
            }

            let validator = await Authenticator.validateJWTString(token)

            if(!validator.passed) {
                socket.disconnect(true)
                return
            }

            setTimeout(() => {
                socket.emit(this.CHANNEL_INITIAL_TRANSPORT, Channel.activeChannels)
            }, 300)
            
            socket.on("disconnect", () => {
                Channel.moveListenerTo(userUUID, undefined)
            })

            next()
        })
    }

    broadcast(event, message){
        this.socketio.emit(event, message)
    }
}

export default new Socket()