package live.tsradio.master.events.node

import com.corundumstudio.socketio.AckRequest
import com.corundumstudio.socketio.SocketIOClient
import com.corundumstudio.socketio.listener.DataListener
import com.google.gson.Gson
import live.tsradio.master.api.client.NodeClient
import live.tsradio.master.api.node.channel.NodeChannelInfo
import live.tsradio.master.handler.ClientHandler
import live.tsradio.master.handler.NodeHandler
import live.tsradio.master.events.Events

class OnNodeChannelInfoUpdateEvent: DataListener<String> {

    override fun onData(client: SocketIOClient?, data: String?, ackSender: AckRequest?) {
        if(client != null && data != null) {
            val clientData = ClientHandler.getClient(client.sessionId)

            if(clientData != null && clientData is NodeClient) {
                // Check if client is nodeserver -> has permission to post channel info updates

                val dataPacket = Gson().fromJson(data, NodeChannelInfo::class.java)
                val channel = NodeHandler.channels[dataPacket.id]

                if(channel != null) {
                    channel.info = dataPacket
                    NodeHandler.channels[channel.id] = channel

                    // Send update to clients
                    ClientHandler.clients.values.filter { it !is NodeClient }.forEach {
                        it.client.sendEvent(Events.EVENT_NODE_CHANNEL_INFO_UPDATE, dataPacket.toListenerSafeJSON())
                    }
                }
            }
        }
    }

}