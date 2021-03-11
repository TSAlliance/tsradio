import { Channel } from '@/models/channel'
import { Socket } from '@/socket/socket'
import { Modal } from '@/models/modal'
import store from '@/store'

function onConnect() {
    Channel.loadAll()
    console.log("%cSuccessfully connected to socket on '" + Socket.socketUrl + Socket.socketPath + "'", "color: green")
}
function onDisconnect() {
    Channel.unloadAll()
    console.log("%cDisconnected from socket '" + Socket.socketUrl + Socket.socketPath + "'", "color: red")
    store.state.app.isSocketReady = false
}
function onAuthentication(data) {
    if(!data.passed) {
        Modal.showMessage('Sitzung abgelaufen', 'Deine Sitzung ist abgelaufen. Du musst dich erneut anmelden, um fortzufahren.', () => {
            window.location.href = store.state.authFormUrl
        })
    } else {
        store.state.app.isSocketReady = true
    }
}

function onChannelDeleteListener(data) {
    Channel.unload(data.uuid)
}
function onChannelUpdateListener(data) {
    console.log("update: ", data)
    Channel.setChannel(data)
}
function onChannelAddListener(data) {
    console.log("add: ", data)
    Channel.load(data.uuid)
}

function onChannelStateListener(data) {
    console.log("state: ", data)
}
function onChannelHistoryListener(data) {
    console.log("history: ", data)
    Channel.setChannelHistory(data.uuid, data.tracks)
}
function onChannelInfoListener(data) {
    console.log("info: ", data)
    Channel.setChannelInfo(data.uuid, { title: data.title, artist: data.artist, cover: data.cover })
}
function onChannelListenersListener(data) {
    console.log("listeners: ", data)
    Channel.setListeners(data.uuid, data.listeners)
}
function onChannelVotingListener(data) {
    console.log("voting: ", data)
    Channel.setVoting(data.uuid, {
        category: data.category,
        result: data.result,
        state: data.state,
        endsAt: new Date(data.endsAt)
    })
}

export {
    onChannelAddListener,
    onChannelDeleteListener,
    onChannelUpdateListener,
    onChannelStateListener,
    onChannelHistoryListener,
    onChannelInfoListener,
    onChannelListenersListener,
    onChannelVotingListener,
    onAuthentication,
    onDisconnect,
    onConnect
}